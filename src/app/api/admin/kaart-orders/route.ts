import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'

async function isAdmin(userId: string): Promise<boolean> {
  const snap = await adminDb.collection('obers').doc(userId).get()
  return snap.data()?.admin === true
}

// GET — haal alle kaart-orders op
export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ fout: 'Geen toegang' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get('status') ?? 'alle'

  let query = adminDb.collection('kaart_orders').orderBy('aangemaakt_op', 'desc') as FirebaseFirestore.Query
  if (statusFilter !== 'alle') {
    query = adminDb.collection('kaart_orders').where('status', '==', statusFilter).orderBy('aangemaakt_op', 'desc')
  }

  const snap = await query.limit(200).get()
  const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }))

  return NextResponse.json({ orders })
}

// PATCH — update status van een order (in_productie / verzonden / geleverd)
export async function PATCH(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ fout: 'Geen toegang' }, { status: 403 })
  }

  const { orderId, status, track_trace } = await req.json()
  if (!orderId || !status) return NextResponse.json({ fout: 'orderId en status vereist' }, { status: 400 })

  // ─── Speciale actie: wijs vrije set toe aan wacht_op_voorraad order ──────
  if (status === 'wijs_set_toe') {
    const orderSnap = await adminDb.collection('kaart_orders').doc(orderId).get()
    if (!orderSnap.exists) return NextResponse.json({ fout: 'Order niet gevonden' }, { status: 404 })
    const order = orderSnap.data()!
    const setType = order.account_type === 'bedrijf' ? 'bedrijf' : 'individueel'

    const vrijSnap = await adminDb.collection('kaart_sets')
      .where('status_type', '==', `${setType}_vrij`)
      .limit(1)
      .get()
    if (vrijSnap.empty) return NextResponse.json({ fout: `Geen vrije ${setType}-sets beschikbaar` }, { status: 409 })

    const setDoc = vrijSnap.docs[0]
    const setData = setDoc.data()
    const codes: string[] = setData.codes
    const nu = new Date().toISOString()

    // Haal ober op voor redirect URL
    const oberSnap = await adminDb.collection('obers').doc(order.ober_id).get()
    const ober = oberSnap.data()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://tipdirect.be'
    const redirectUrl = `${baseUrl}/${ober?.gebruikersnaam}`

    const batch = adminDb.batch()
    // Update de bestaande order
    batch.update(orderSnap.ref, {
      set_id: setDoc.id,
      codes,
      aantal: codes.length,
      status: 'aangevraagd',
    })
    // Markeer de set als toegewezen
    batch.update(setDoc.ref, {
      status: 'toegewezen',
      status_type: `${setType}_toegewezen`,
      toegewezen_op: nu,
      ober_id: order.ober_id,
      kaart_order_id: orderId,
    })
    // Koppel de kaartcodes
    for (const code of codes) {
      batch.update(adminDb.collection('kaart_codes').doc(code), {
        ober_id: order.ober_id,
        naam: ober?.naam ?? null,
        gebruikersnaam: ober?.gebruikersnaam ?? null,
        redirect_url: redirectUrl,
        toegewezen_op: nu,
        kaart_order_id: orderId,
      })
    }
    await batch.commit()

    return NextResponse.json({ ok: true, set_id: setDoc.id, codes })
  }

  // ─── Normale statuswijziging ─────────────────────────────────────────────
  const geldig = ['in_productie', 'verzonden', 'geleverd']
  if (!geldig.includes(status)) return NextResponse.json({ fout: 'Ongeldige status' }, { status: 400 })

  const update: Record<string, unknown> = { status }
  if (status === 'verzonden') {
    update.verzonden_op = new Date().toISOString()
    if (track_trace) update.track_trace = track_trace
  }

  await adminDb.collection('kaart_orders').doc(orderId).update(update)
  return NextResponse.json({ ok: true })
}
