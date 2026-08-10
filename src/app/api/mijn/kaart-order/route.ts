import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import { sendAdminKaartorderNotificatie } from '@/lib/mail'

// GET — haal kaart-orders + codes op voor ingelogde gebruiker
export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ fout: 'Niet ingelogd' }, { status: 401 })

  const [ordersSnap, codesSnap] = await Promise.all([
    adminDb.collection('kaart_orders').where('ober_id', '==', userId).orderBy('aangemaakt_op', 'desc').get(),
    adminDb.collection('kaart_codes').where('ober_id', '==', userId).get(),
  ])

  const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  const codes = codesSnap.docs.map(d => ({ id: d.id, ...d.data() }))

  return NextResponse.json({ orders, codes })
}

// POST — bijbestelling aanvragen (set van 5)
export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ fout: 'Niet ingelogd' }, { status: 401 })

  const oberSnap = await adminDb.collection('obers').doc(userId).get()
  if (!oberSnap.exists) return NextResponse.json({ fout: 'Account niet gevonden' }, { status: 404 })

  const ober = oberSnap.data()!

  // Controleer of er geen openstaande bijbestelling is
  const openSnap = await adminDb
    .collection('kaart_orders')
    .where('ober_id', '==', userId)
    .where('type', '==', 'bijbestelling')
    .where('status', '==', 'aangevraagd')
    .limit(1)
    .get()

  if (!openSnap.empty) {
    return NextResponse.json({ fout: 'Er is al een openstaande bijbestelling.' }, { status: 409 })
  }

  const aantalKaarten = 5

  const orderRef = adminDb.collection('kaart_orders').doc()
  await orderRef.set({
    ober_id: userId,
    naam: ober.naam ?? '',
    account_type: ober.account_type ?? 'individueel',
    aantal: aantalKaarten,
    type: 'bijbestelling',
    status: 'aangevraagd',
    adres_straat: ober.adres_straat ?? null,
    adres_postcode: ober.adres_postcode ?? null,
    adres_stad: ober.adres_stad ?? null,
    adres_land: ober.adres_land ?? null,
    codes: [],
    track_trace: null,
    aangemaakt_op: new Date().toISOString(),
    verzonden_op: null,
  })

  // Admin notificatie
  sendAdminKaartorderNotificatie({
    setId: null,
    accountType: ober.account_type ?? 'individueel',
    naam: ober.naam ?? userId,
    email: ober.email ?? '',
    straat: ober.adres_straat ?? null,
    postcode: ober.adres_postcode ?? null,
    stad: ober.adres_stad ?? null,
    land: ober.adres_land ?? null,
    aantalKaarten,
    heeftVoorraad: false,
    orderType: 'bijbestelling',
  }).catch(e => console.error('Admin bijbestelling mail mislukt:', e))

  return NextResponse.json({ ok: true, order_id: orderRef.id })
}
