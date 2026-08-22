import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import { sendAdminKaartorderNotificatie } from '@/lib/mail'

async function isAdmin(userId: string): Promise<boolean> {
  const snap = await adminDb.collection('obers').doc(userId).get()
  return snap.data()?.admin === true
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ fout: 'Geen toegang' }, { status: 403 })
  }

  const { oberId } = await req.json()
  if (!oberId) return NextResponse.json({ fout: 'oberId verplicht' }, { status: 400 })

  const abSnap = await adminDb.collection('abonnementen').doc(oberId).get()
  const bedrag = abSnap.exists ? (abSnap.data()?.bedrag ?? 6000) : 6000

  await adminDb.collection('abonnementen').doc(oberId).set({
    status: 'actief',
    bedrag,
    voldaan: bedrag,
    actief_sinds: new Date().toISOString(),
    start_datum: abSnap.exists ? abSnap.data()?.start_datum : new Date().toISOString(),
  }, { merge: true })

  await adminDb.collection('obers').doc(oberId).update({
    abonnement_actief: true,
    actief: true,
  })

  // Wijs kaartcodes toe en stuur admin kaartorder-melding
  const oberSnap2 = await adminDb.collection('obers').doc(oberId).get()
  const ober2 = oberSnap2.data()
  const accountType = (ober2?.account_type ?? 'bedrijf') as string
  const kaartOrder = await wijsKaartCodesAutoToe(oberId, accountType)
  if (kaartOrder) {
    sendAdminKaartorderNotificatie({
      setId: kaartOrder.setId,
      accountType,
      naam: ober2?.naam ?? oberId,
      email: ober2?.email ?? '',
      straat: ober2?.adres_straat ?? null,
      postcode: ober2?.adres_postcode ?? null,
      stad: ober2?.adres_stad ?? null,
      land: ober2?.adres_land ?? null,
      aantalKaarten: kaartOrder.aantalKaarten,
      heeftVoorraad: kaartOrder.heeftVoorraad,
      codes: kaartOrder.codes,
    }).catch(e => console.error('Admin kaartorder mail mislukt:', e))
  }

  return NextResponse.json({ ok: true })
}

// Wijs de eerstvolgende vrije set toe en maak een kaart_order aan.
// Geeft null terug als er al een inclusief order bestaat.
async function wijsKaartCodesAutoToe(
  oberId: string,
  accountType = 'bedrijf'
): Promise<{ setId: string | null; aantalKaarten: number; heeftVoorraad: boolean; codes: string[] } | null> {
  try {
    const bestaandSnap = await adminDb
      .collection('kaart_orders')
      .where('ober_id', '==', oberId)
      .where('type', '==', 'inclusief')
      .limit(1)
      .get()
    if (!bestaandSnap.empty) return null

    const oberSnap = await adminDb.collection('obers').doc(oberId).get()
    if (!oberSnap.exists) return null
    const ober = oberSnap.data()!

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://tipdirect.be'
    const redirectUrl = `${baseUrl}/${ober.gebruikersnaam}`
    const setType = accountType === 'bedrijf' ? 'bedrijf' : 'individueel'
    const defaultAantal = setType === 'bedrijf' ? 5 : 2
    const nu = new Date().toISOString()

    const setSnap = await adminDb
      .collection('kaart_sets')
      .where('status_type', '==', `${setType}_vrij`)
      .limit(1)
      .get()

    const heeftSet = !setSnap.empty
    const setDoc = heeftSet ? setSnap.docs[0] : null
    const setData = setDoc ? setDoc.data() : null
    const codes: string[] = setData?.codes ?? []
    const aantalKaarten = heeftSet ? codes.length : defaultAantal

    const orderRef = adminDb.collection('kaart_orders').doc()
    await orderRef.set({
      ober_id: oberId,
      naam: ober.naam ?? '',
      account_type: accountType,
      aantal: aantalKaarten,
      type: 'inclusief',
      status: heeftSet ? 'aangevraagd' : 'wacht_op_voorraad',
      set_id: setDoc?.id ?? null,
      codes,
      adres_straat: ober.adres_straat ?? null,
      adres_postcode: ober.adres_postcode ?? null,
      adres_stad: ober.adres_stad ?? null,
      adres_land: ober.adres_land ?? null,
      track_trace: null,
      aangemaakt_op: nu,
      verzonden_op: null,
    })

    if (heeftSet && setDoc && setData) {
      const batch = adminDb.batch()
      batch.update(setDoc.ref, {
        status: 'toegewezen',
        status_type: `${setType}_toegewezen`,
        toegewezen_op: nu,
        ober_id: oberId,
        kaart_order_id: orderRef.id,
      })
      for (const code of codes) {
        batch.update(adminDb.collection('kaart_codes').doc(code), {
          ober_id: oberId,
          naam: ober.naam ?? null,
          gebruikersnaam: ober.gebruikersnaam ?? null,
          redirect_url: redirectUrl,
          toegewezen_op: nu,
          kaart_order_id: orderRef.id,
        })
      }
      await batch.commit()

      // Waarschuwing als voorraad onder drempel zakt
      const DREMPEL = 10
      const restSnap = await adminDb.collection('kaart_sets')
        .where('status_type', '==', `${setType}_vrij`)
        .count()
        .get()
      const resterend = restSnap.data().count
      if (resterend <= DREMPEL) {
        const { sendAdminVoorraadWaarschuwing } = await import('@/lib/mail')
        sendAdminVoorraadWaarschuwing({
          type: setType as 'bedrijf' | 'individueel',
          resterend,
          drempel: DREMPEL,
        }).catch(e => console.error('Voorraad waarschuwingsmail mislukt:', e))
      }
    }

    return { setId: setDoc?.id ?? null, aantalKaarten, heeftVoorraad: heeftSet, codes }
  } catch (err) {
    console.error('Kaartcodes auto-toewijzen mislukt:', err)
    return null
  }
}
