import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ fout: 'Niet ingelogd' }, { status: 401 })

  const oberSnap = await adminDb.collection('obers').doc(userId).get()
  if (!oberSnap.exists) return NextResponse.json({ fout: 'Niet gevonden' }, { status: 404 })
  const oberData = oberSnap.data()!
  if (oberData.account_type !== 'bedrijf') {
    return NextResponse.json({ fout: 'Geen bedrijfsaccount' }, { status: 403 })
  }

  const configSnap = await adminDb.collection('config').doc('fees').get()
  const standaardBedrag: number = configSnap.exists ? (configSnap.data()?.abonnementsBedrag ?? 2999) : 2999

  const medSnap = await adminDb.collection('obers')
    .where('bedrijf_id', '==', oberData.bedrijf_id)
    .where('account_type', '==', 'medewerker')
    .get()

  let totaalVoldaan = 0
  let actiefSinds: string | null = null

  for (const medDoc of medSnap.docs) {
    const abSnap = await adminDb.collection('abonnementen').doc(medDoc.id).get()
    if (abSnap.exists) {
      const ab = abSnap.data()!
      totaalVoldaan += ab.voldaan ?? 0
      if (ab.actief_sinds && !actiefSinds) actiefSinds = ab.actief_sinds
    }
  }

  const status = totaalVoldaan >= standaardBedrag ? 'actief' : 'pending'

  return NextResponse.json({ status, bedrag: standaardBedrag, voldaan: totaalVoldaan, actief_sinds: actiefSinds })
}
