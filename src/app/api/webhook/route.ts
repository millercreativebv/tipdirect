import { NextRequest, NextResponse } from 'next/server'
import { mollie, MOLLIE_FEE_CENTEN, getGeldigAccessToken, verbondenMollieClient } from '@/lib/mollie'
import { adminDb } from '@/lib/firebase-admin'
import { verwerkBetalingVoorAbonnement } from '@/lib/abonnement'
import type { Payment } from '@mollie/api-client'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const mollieId = formData.get('id') as string

    if (!mollieId) {
      return NextResponse.json({ fout: 'Geen betaling ID' }, { status: 400 })
    }

    // Haal betalingsdocument op uit Firestore
    const snap = await adminDb
      .collection('betalingen')
      .where('mollie_id', '==', mollieId)
      .limit(1)
      .get()

    if (snap.empty) {
      console.error('Betaling niet gevonden voor mollie_id:', mollieId)
      return NextResponse.json({ fout: 'Betaling niet gevonden' }, { status: 404 })
    }

    const betalingDoc = snap.docs[0]
    const betalingData = betalingDoc.data()

    // Verifieer betaling bij Mollie — gebruik connected account token bij Mollie Connect
    // mollie_ober_id is de uitbater bij medewerker-tips, anders de ober zelf
    const mollieOberId = betalingData.mollie_ober_id ?? betalingData.ober_id

    let mollieBetaling: Payment
    if (betalingData.via_mollie_connect) {
      const oberSnap = await adminDb.collection('obers').doc(mollieOberId).get()
      const oberData = oberSnap.data()

      if (!oberData?.mollie_access_token) {
        // Token verdwenen (ontkoppeld na betaling) — lees via eigen account als fallback
        mollieBetaling = await mollie.payments.get(mollieId)
      } else {
        try {
          const tokenResult = await getGeldigAccessToken({
            mollie_access_token: oberData.mollie_access_token,
            mollie_refresh_token: oberData.mollie_refresh_token,
            mollie_token_expires_at: oberData.mollie_token_expires_at,
          })
          if (tokenResult.vernieuwd && tokenResult.nieuweData) {
            await adminDb.collection('obers').doc(mollieOberId).update(tokenResult.nieuweData)
          }
          const verbonden = verbondenMollieClient(tokenResult.accessToken)
          mollieBetaling = await verbonden.payments.get(mollieId)
        } catch {
          mollieBetaling = await mollie.payments.get(mollieId)
        }
      }
    } else {
      mollieBetaling = await mollie.payments.get(mollieId)
    }

    const statusMap: Record<string, string> = {
      paid: 'betaald',
      failed: 'mislukt',
      canceled: 'mislukt',
      expired: 'mislukt',
      refunded: 'teruggestort',
    }
    const nieuweStatus = statusMap[mollieBetaling.status] ?? 'open'

    if (nieuweStatus !== 'betaald' || betalingData.abonnement_verwerkt) {
      await betalingDoc.ref.update({
        status: nieuweStatus,
        betaald_op: nieuweStatus === 'betaald' ? new Date().toISOString() : null,
      })
      return NextResponse.json({ ok: true })
    }

    const oberId = betalingData.ober_id as string
    const bedragCenten = betalingData.bedrag as number

    // ─── Directe abonnementsbetaling (bedrijf) ───────────────────────────────
    if (betalingData.betaling_type === 'abonnement') {
      const oberSnap = await adminDb.collection('obers').doc(oberId).get()
      const partnerId = oberSnap.data()?.aangebracht_door ?? null

      await adminDb.collection('abonnementen').doc(oberId).set({
        status: 'actief',
        bedrag: bedragCenten,
        voldaan: bedragCenten,
        start_datum: new Date().toISOString(),
        actief_sinds: new Date().toISOString(),
      }, { merge: true })

      await adminDb.collection('obers').doc(oberId).update({ abonnement_actief: true, actief: true })
      await wijsKaartCodesAutoToe(oberId, 'bedrijf')

      const feeVerdeling = berekenFeeVerdeling(bedragCenten)
      if (partnerId) {
        await verwerkPartnerTegoed(partnerId, feeVerdeling.strictly_hospitality, betalingDoc.id)
      }

      await betalingDoc.ref.update({
        status: nieuweStatus,
        betaald_op: new Date().toISOString(),
        bestemming: 'tipdirect',
        fee_verdeling: feeVerdeling,
        partner_id: partnerId,
        abonnement_verwerkt: true,
        abonnement_nu_actief: true,
      })

      return NextResponse.json({ ok: true })
    }

    // ─── SEPA incasso na 30-dagenregel (individueel) ─────────────────────────
    if (betalingData.betaling_type === 'abonnement_incasso') {
      const resterend = bedragCenten

      await adminDb.collection('abonnementen').doc(oberId).set({
        status: 'actief',
        voldaan: resterend,
        actief_sinds: new Date().toISOString(),
      }, { merge: true })

      await adminDb.collection('obers').doc(oberId).update({ abonnement_actief: true, actief: true })
      await wijsKaartCodesAutoToe(oberId, 'individueel')

      await betalingDoc.ref.update({
        status: nieuweStatus,
        betaald_op: new Date().toISOString(),
        bestemming: 'tipdirect',
        abonnement_verwerkt: true,
        abonnement_nu_actief: true,
      })

      return NextResponse.json({ ok: true })
    }

    // ─── Fooi via Mollie Connect ──────────────────────────────────────────────
    if (betalingData.via_mollie_connect) {
      const applicationFeeCenten = (betalingData.application_fee_centen as number | null) ?? 0

      // Bepaal bestemming op basis van of er application fee was
      // Bij pending individuel: applicationFee = volledige bijdrage → 'tipdirect'
      // Bij actief: geen fee → money staat al op ober's Mollie → 'klant'
      const bestemming: 'tipdirect' | 'klant' = applicationFeeCenten > 0 ? 'tipdirect' : 'klant'

      let abonnementNuActief = false
      let partnerId: string | null = null

      if (bestemming === 'tipdirect') {
        // Verwerk de applicationFee als abonnementsbijdrage
        const oberSnap = await adminDb.collection('obers').doc(oberId).get()
        partnerId = oberSnap.data()?.aangebracht_door ?? null

        const { abonnementNuActief: nuActief } = await verwerkBetalingVoorAbonnement(
          oberId,
          applicationFeeCenten,
          'individueel'
        )
        abonnementNuActief = nuActief

        // Commissiegrondslag is ex-BTW (individueel €25 is incl. 21% BTW)
        const feeVerdeling = berekenFeeVerdeling(exBtw(applicationFeeCenten))
        if (partnerId && feeVerdeling.strictly_hospitality > 0) {
          await verwerkPartnerTegoed(partnerId, feeVerdeling.strictly_hospitality, betalingDoc.id)
        }

        if (abonnementNuActief) await wijsKaartCodesAutoToe(oberId, 'individueel')

        await betalingDoc.ref.update({
          status: nieuweStatus,
          betaald_op: new Date().toISOString(),
          bestemming,
          abonnement_bijdrage: applicationFeeCenten,
          netto_klant: null,
          mollie_fee: MOLLIE_FEE_CENTEN,
          partner_id: partnerId,
          abonnement_verwerkt: true,
          abonnement_nu_actief: abonnementNuActief,
        })
      } else {
        // Actief account — geld staat al op ober's Mollie, geen verdere actie nodig
        await betalingDoc.ref.update({
          status: nieuweStatus,
          betaald_op: new Date().toISOString(),
          bestemming: 'klant',
          netto_klant: bedragCenten - MOLLIE_FEE_CENTEN,
          mollie_fee: MOLLIE_FEE_CENTEN,
          abonnement_verwerkt: true,
          uitbetaald: true, // automatisch via Mollie Connect
          uitbetaald_op: new Date().toISOString(),
        })
      }

      return NextResponse.json({ ok: true })
    }

    // ─── Fooi zonder Mollie Connect (fallback, handmatige uitbetaling) ────────
    const oberSnap = await adminDb.collection('obers').doc(oberId).get()
    const oberData = oberSnap.data()

    let abonnementOberId = oberId
    let abonnementAccountType = oberData?.account_type ?? 'individueel'
    let partnerId = oberData?.aangebracht_door ?? null

    // Medewerker → gebruik uitbater's abonnement
    if (oberData?.account_type === 'medewerker' && oberData?.bedrijf_id) {
      const uitbaterSnap = await adminDb.collection('obers')
        .where('bedrijf_id', '==', oberData.bedrijf_id)
        .where('account_type', '==', 'bedrijf')
        .limit(1)
        .get()
      if (!uitbaterSnap.empty) {
        abonnementOberId = uitbaterSnap.docs[0].id
        abonnementAccountType = 'bedrijf'
        partnerId = uitbaterSnap.docs[0].data().aangebracht_door ?? partnerId
      }
    }

    // Bedrijf betaalt abonnement apart → tip altijd naar 'klant'
    if (abonnementAccountType === 'bedrijf') {
      await betalingDoc.ref.update({
        status: nieuweStatus,
        betaald_op: new Date().toISOString(),
        bestemming: 'klant',
        netto_klant: bedragCenten - MOLLIE_FEE_CENTEN,
        mollie_fee: MOLLIE_FEE_CENTEN,
        abonnement_verwerkt: true,
      })
      return NextResponse.json({ ok: true })
    }

    // Individueel zonder Mollie Connect: tip-omleiding voor abonnement
    const { bestemming, abonnementNuActief } = await verwerkBetalingVoorAbonnement(
      abonnementOberId,
      bedragCenten,
      abonnementAccountType
    )

    // Commissiegrondslag ex-BTW (individueel €25 is incl. 21% BTW)
    const feeVerdeling = bestemming === 'tipdirect' ? berekenFeeVerdeling(exBtw(bedragCenten)) : null
    if (bestemming === 'tipdirect' && partnerId && feeVerdeling) {
      await verwerkPartnerTegoed(partnerId, feeVerdeling.strictly_hospitality, betalingDoc.id)
    }

    await betalingDoc.ref.update({
      status: nieuweStatus,
      betaald_op: new Date().toISOString(),
      bestemming,
      abonnement_bijdrage: bestemming === 'tipdirect' ? bedragCenten : null,
      mollie_fee: MOLLIE_FEE_CENTEN,
      netto_klant: bestemming === 'klant' ? bedragCenten - MOLLIE_FEE_CENTEN : null,
      fee_verdeling: feeVerdeling,
      partner_id: partnerId,
      abonnement_verwerkt: true,
      abonnement_nu_actief: abonnementNuActief,
    })

    if (abonnementNuActief) await wijsKaartCodesAutoToe(abonnementOberId, 'individueel')

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook fout:', err)
    return NextResponse.json({ fout: 'Webhook verwerking mislukt' }, { status: 500 })
  }
}

const BTW_PERCENTAGE = 21

// Zet incl.-BTW bedrag om naar ex-BTW
function exBtw(inclBtwCenten: number): number {
  return Math.round(inclBtwCenten * 100 / (100 + BTW_PERCENTAGE))
}

// Commissieverdeling altijd op ex-BTW grondslag.
// Partner (SH) ontvangt GEEN geld rechtstreeks — alle abonnementsinkomsten gaan naar
// Miller Creative. SH ziet zijn aandeel in het partner-dashboard en factureert MC.
// Marketing-budget blijft eveneens bij Miller Creative.
function berekenFeeVerdeling(bedragExBtwCenten: number) {
  const sh = Math.round(bedragExBtwCenten * 0.425)        // SH-commissie (te factureren aan MC)
  const marketing = Math.round(bedragExBtwCenten * 0.15)  // Marketing — blijft bij Miller Creative
  const mc = bedragExBtwCenten - sh - marketing
  return { miller_creative: mc, strictly_hospitality: sh, marketing }
}

// Koppelt automatisch kaartcodes + maakt een kaart_order aan bij activering.
// accountType bepaalt hoeveel codes: 'bedrijf' → 5, anders → 2
async function wijsKaartCodesAutoToe(oberId: string, accountType: string) {
  try {
    const aantal = accountType === 'bedrijf' ? 5 : 2

    // Check of er al een eerste toewijzing is geweest
    const bestaandSnap = await adminDb
      .collection('kaart_orders')
      .where('ober_id', '==', oberId)
      .where('type', '==', 'inclusief')
      .limit(1)
      .get()
    if (!bestaandSnap.empty) return // al toegewezen

    const oberSnap = await adminDb.collection('obers').doc(oberId).get()
    if (!oberSnap.exists) return
    const ober = oberSnap.data()!

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://tipdirect.be'
    const redirectUrl = `${baseUrl}/${ober.gebruikersnaam}`

    const vrijSnap = await adminDb
      .collection('kaart_codes')
      .where('ober_id', '==', null)
      .limit(aantal)
      .get()

    const nu = new Date().toISOString()

    // Maak order aan (ook als er onvoldoende codes zijn — admin handelt bij)
    const orderRef = adminDb.collection('kaart_orders').doc()
    await orderRef.set({
      ober_id: oberId,
      naam: ober.naam ?? '',
      account_type: accountType,
      aantal,
      type: 'inclusief',
      status: vrijSnap.size >= aantal ? 'aangevraagd' : 'wacht_op_voorraad',
      codes: vrijSnap.docs.map(d => d.id),
      track_trace: null,
      aangemaakt_op: nu,
      verzonden_op: null,
    })

    if (vrijSnap.size > 0) {
      const batch = adminDb.batch()
      for (const doc of vrijSnap.docs) {
        batch.update(doc.ref, {
          ober_id: oberId,
          naam: ober.naam ?? null,
          gebruikersnaam: ober.gebruikersnaam ?? null,
          redirect_url: redirectUrl,
          toegewezen_op: nu,
          kaart_order_id: orderRef.id,
        })
      }
      await batch.commit()
    }
  } catch (err) {
    // Niet-kritiek: log maar blokkeer de betaling-flow niet
    console.error('Kaartcodes auto-toewijzen mislukt:', err)
  }
}

async function verwerkPartnerTegoed(partnerId: string, bedragCenten: number, betalingId: string) {
  const nu = new Date()
  const maand = `${nu.getFullYear()}-${String(nu.getMonth() + 1).padStart(2, '0')}`
  const ref = adminDb.collection('partner_tegoed').doc(`${partnerId}_${maand}`)

  const snap = await ref.get()
  if (snap.exists) {
    await ref.update({
      bedrag: (snap.data()!.bedrag ?? 0) + bedragCenten,
      betalingen: [...(snap.data()!.betalingen ?? []), betalingId],
      bijgewerkt_op: nu.toISOString(),
    })
  } else {
    await ref.set({
      partner_id: partnerId,
      maand,
      bedrag: bedragCenten,
      betalingen: [betalingId],
      status: 'open',
      uitbetaald_op: null,
      aangemaakt_op: nu.toISOString(),
      bijgewerkt_op: nu.toISOString(),
    })
  }
}
