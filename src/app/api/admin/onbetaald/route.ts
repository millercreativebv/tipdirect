import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'

// GET — haal bedrijfsaccounts op die nog niet betaald/geactiveerd zijn
export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ fout: 'Niet ingelogd' }, { status: 401 })

  const adminSnap = await adminDb.collection('obers').doc(userId).get()
  if (!adminSnap.data()?.admin) return NextResponse.json({ fout: 'Geen toegang' }, { status: 403 })

  // Alle bedrijfsaccounts zonder actief abonnement
  const snap = await adminDb
    .collection('obers')
    .where('account_type', '==', 'bedrijf')
    .where('abonnement_actief', '==', false)
    .get()

  // Ook accounts zonder abonnement_actief veld (aangemaakt vóór dit veld bestond)
  const snapNull = await adminDb
    .collection('obers')
    .where('account_type', '==', 'bedrijf')
    .where('abonnement_actief', '==', null)
    .get()

  const alleIds = new Set<string>()
  const accounts: object[] = []

  for (const doc of [...snap.docs, ...snapNull.docs]) {
    if (alleIds.has(doc.id)) continue
    alleIds.add(doc.id)
    const d = doc.data()
    accounts.push({
      id: doc.id,
      naam: d.naam ?? '',
      email: d.email ?? '',
      telefoon: d.telefoon ?? null,
      adres_straat: d.adres_straat ?? null,
      adres_postcode: d.adres_postcode ?? null,
      adres_stad: d.adres_stad ?? null,
      adres_land: d.adres_land ?? null,
      aangemaakt_op: d.aangemaakt_op ?? null,
    })
  }

  // Sorteer nieuwste eerst
  accounts.sort((a, b) => {
    const aDate = (a as { aangemaakt_op: string }).aangemaakt_op ?? ''
    const bDate = (b as { aangemaakt_op: string }).aangemaakt_op ?? ''
    return bDate.localeCompare(aDate)
  })

  return NextResponse.json({ accounts })
}
