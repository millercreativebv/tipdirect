import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'

async function isAdmin(userId: string): Promise<boolean> {
  const snap = await adminDb.collection('obers').doc(userId).get()
  return snap.data()?.admin === true
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ fout: 'Geen toegang' }, { status: 403 })
  }

  // Haal alle echte fooibetalingen op (bestemming = 'klant')
  const snap = await adminDb
    .collection('betalingen')
    .where('bestemming', '==', 'klant')
    .orderBy('betaald_op', 'desc')
    .get()

  let totaalCenten = 0
  let totaalNettoCenten = 0
  const obers = new Set<string>()
  const maandMap: Record<string, number> = {}

  for (const doc of snap.docs) {
    const d = doc.data()
    const bedrag: number = d.bedragCenten ?? 0
    const netto: number = d.netto_klant ?? 0
    const oberId: string = d.ober_id ?? ''
    const datum: string = d.betaald_op ?? ''

    totaalCenten += bedrag
    totaalNettoCenten += netto
    if (oberId) obers.add(oberId)

    // Maand-aggregatie (YYYY-MM)
    if (datum) {
      const maand = datum.slice(0, 7)
      maandMap[maand] = (maandMap[maand] ?? 0) + bedrag
    }
  }

  const aantalTransacties = snap.size
  const gemiddeldCenten = aantalTransacties > 0 ? Math.round(totaalCenten / aantalTransacties) : 0

  // Nieuwsbrief-abonnees tellen
  const nieuwsbriefSnap = await adminDb
    .collection('nieuwsbrief_abonnees')
    .where('actief', '==', true)
    .count()
    .get()
  const nieuwsbriefCount = nieuwsbriefSnap.data().count

  return NextResponse.json({
    totaalCenten,
    totaalNettoCenten,
    aantalTransacties,
    gemiddeldCenten,
    uniekeObers: obers.size,
    nieuwsbriefAbonnees: nieuwsbriefCount,
    // Laatste 12 maanden gesorteerd
    maanden: Object.entries(maandMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([maand, centen]) => ({ maand, centen })),
  })
}
