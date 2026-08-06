import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { adminDb, adminAuth } from '@/lib/firebase-admin'

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

  // Eigen account mag je niet verwijderen
  if (oberId === userId) {
    return NextResponse.json({ fout: 'Je kunt je eigen account niet verwijderen' }, { status: 400 })
  }

  const oberSnap = await adminDb.collection('obers').doc(oberId).get()
  if (!oberSnap.exists) return NextResponse.json({ fout: 'Account niet gevonden' }, { status: 404 })

  const oberData = oberSnap.data()!

  // Verwijder bedrijf-doc als het een bedrijfsaccount is
  if (oberData.account_type === 'bedrijf' && oberData.bedrijf_id) {
    await adminDb.collection('bedrijven').doc(oberData.bedrijf_id).delete()

    // Verwijder ook medewerkers van dit bedrijf
    const medewerkerSnap = await adminDb
      .collection('obers')
      .where('bedrijf_id', '==', oberData.bedrijf_id)
      .where('account_type', '==', 'medewerker')
      .get()

    for (const mw of medewerkerSnap.docs) {
      await adminDb.collection('abonnementen').doc(mw.id).delete().catch(() => {})
      await mw.ref.delete()
    }
  }

  // Verwijder abonnement
  await adminDb.collection('abonnementen').doc(oberId).delete().catch(() => {})

  // Verwijder ober-doc
  await adminDb.collection('obers').doc(oberId).delete()

  // Verwijder Firebase Auth account
  try {
    await adminAuth.deleteUser(oberId)
  } catch {
    // Auth account bestaat mogelijk niet (medewerkers hebben geen auth)
  }

  return NextResponse.json({ ok: true })
}
