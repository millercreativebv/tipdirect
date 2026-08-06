import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'

async function isAdmin(userId: string): Promise<boolean> {
  const snap = await adminDb.collection('obers').doc(userId).get()
  return snap.data()?.admin === true
}

// POST — markeer alle openstaande tegoed van een partner als uitbetaald
// Partner factureert Miller Creative zelf; geldstroom loopt buiten dit systeem
export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ fout: 'Geen toegang' }, { status: 403 })
  }

  const { partnerId } = await req.json()
  if (!partnerId) return NextResponse.json({ fout: 'partnerId vereist' }, { status: 400 })

  const snap = await adminDb
    .collection('partner_tegoed')
    .where('partner_id', '==', partnerId)
    .where('status', '==', 'open')
    .get()

  if (snap.empty) {
    return NextResponse.json({ ok: true, bedrag: 0, maanden: 0 })
  }

  const nu = new Date().toISOString()
  const batch = adminDb.batch()
  let totaal = 0
  for (const doc of snap.docs) {
    totaal += doc.data().bedrag ?? 0
    batch.update(doc.ref, { status: 'uitbetaald', uitbetaald_op: nu })
  }
  await batch.commit()

  return NextResponse.json({ ok: true, bedrag: totaal, maanden: snap.size })
}
