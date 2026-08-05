import { NextRequest, NextResponse } from 'next/server'
import { mollie, MOLLIE_FEE_CENTEN } from '@/lib/mollie'
import { adminDb } from '@/lib/firebase-admin'
import { verwerkBetalingVoorAbonnement } from '@/lib/abonnement'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const mollieId = formData.get('id') as string

    if (!mollieId) {
      return NextResponse.json({ fout: 'Geen betaling ID' }, { status: 400 })
    }

    const mollieBetaling = await mollie.payments.get(mollieId)

    const statusMap: Record<string, string> = {
      paid: 'betaald',
      failed: 'mislukt',
      canceled: 'mislukt',
      expired: 'mislukt',
      refunded: 'teruggestort',
    }

    const nieuweStatus = statusMap[mollieBetaling.status] ?? 'open'

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

    if (nieuweStatus === 'betaald' && !betalingData.abonnement_verwerkt) {
      const oberId = betalingData.ober_id
      const bedragCenten = betalingData.bedrag

      // Directe abonnementsbetaling door uitbater (bedrijf)
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

        await adminDb.collection('obers').doc(oberId).update({
          abonnement_actief: true,
        })

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

      // Normale fooi — haal ober op om account_type te bepalen
      const oberSnap = await adminDb.collection('obers').doc(oberId).get()
      const oberData = oberSnap.data()

      let abonnementOberId = oberId
      let abonnementAccountType = oberData?.account_type ?? 'individueel'
      let partnerId = oberData?.aangebracht_door ?? null

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

      // Bedrijfsaccounts betalen abonnement apart → fooi gaat altijd naar uitbater
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

      // Individuele obers: tips financieren het abonnement
      const { bestemming, abonnementNuActief } = await verwerkBetalingVoorAbonnement(
        abonnementOberId,
        bedragCenten,
        abonnementAccountType
      )

      const feeVerdeling = bestemming === 'tipdirect' ? berekenFeeVerdeling(bedragCenten) : null

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
    } else {
      await betalingDoc.ref.update({
        status: nieuweStatus,
        betaald_op: nieuweStatus === 'betaald' ? new Date().toISOString() : null,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook fout:', err)
    return NextResponse.json({ fout: 'Webhook verwerking mislukt' }, { status: 500 })
  }
}

function berekenFeeVerdeling(bedragCenten: number) {
  const mc = Math.round(bedragCenten * 0.425)
  const sh = Math.round(bedragCenten * 0.425)
  const marketing = bedragCenten - mc - sh
  return { miller_creative: mc, strictly_hospitality: sh, marketing }
}

// Voeg partner-tegoed toe in de maandelijkse bucket
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
