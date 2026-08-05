import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'

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
  })

  return NextResponse.json({ ok: true })
}
