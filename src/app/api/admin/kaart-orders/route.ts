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
