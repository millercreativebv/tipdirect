import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ fout: 'Niet ingelogd' }, { status: 401 })

  const [oberSnap, abonSnap] = await Promise.all([
    adminDb.collection('obers').doc(userId).get(),
    adminDb.collection('abonnementen').doc(userId).get(),
  ])

  if (!oberSnap.exists) return NextResponse.json({ fout: 'Account niet gevonden' }, { status: 404 })
  if (!abonSnap.exists || abonSnap.data()?.status !== 'actief') {
    return NextResponse.json({ fout: 'Geen actief abonnement' }, { status: 404 })
  }

  const ober = oberSnap.data()!
  const abon = abonSnap.data()!

  // Genereer factuurnummer bij eerste opvraag (idempotent via transactie)
  let factuurNummer: string
  let factuurDatum: string

  if (abon.factuur_nummer) {
    factuurNummer = abon.factuur_nummer
    factuurDatum = abon.factuur_datum
  } else {
    const jaar = new Date().getFullYear()
    const teller = await adminDb.runTransaction(async tx => {
      const ref = adminDb.collection('config').doc('factuur_teller')
      const snap = await tx.get(ref)
      const huidig = snap.data()?.[`teller_${jaar}`] ?? 0
      const nieuw = huidig + 1
      tx.set(ref, { [`teller_${jaar}`]: nieuw }, { merge: true })
      return nieuw
    })
    factuurNummer = `TD-${jaar}-${String(teller).padStart(4, '0')}`
    factuurDatum = new Date().toISOString()
    await adminDb.collection('abonnementen').doc(userId).update({ factuur_nummer: factuurNummer, factuur_datum: factuurDatum })
  }

  return NextResponse.json({
    factuur_nummer: factuurNummer,
    factuur_datum: factuurDatum,
    ober: {
      naam: ober.naam ?? '',
      email: ober.email ?? '',
      straat: ober.straat ?? '',
      postcode: ober.postcode ?? '',
      stad: ober.stad ?? '',
      account_type: ober.account_type ?? 'individueel',
      bedrijfsnaam: ober.bedrijfsnaam ?? null,
      btw_nummer: ober.btw_nummer ?? null,
      kvk: ober.kvk ?? null,
    },
    abonnement: {
      bedrag: abon.bedrag,
      actief_sinds: abon.actief_sinds ?? new Date().toISOString(),
    },
  })
}
