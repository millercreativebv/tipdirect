import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

async function isAdmin(userId: string): Promise<boolean> {
  const snap = await adminDb.collection('obers').doc(userId).get()
  return snap.data()?.admin === true
}

// GET — openstaande uitbetalingen per klant (bestemming='klant', nog niet uitbetaald)
export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ fout: 'Geen toegang' }, { status: 403 })
  }

  const snap = await adminDb
    .collection('betalingen')
    .where('bestemming', '==', 'klant')
    .where('uitbetaald', '!=', true)
    .get()

  // Groepeer per ober
  const groepen = new Map<string, {
    oberId: string
    naam: string
    email: string
    iban: string | null
    iban_naam: string | null
    betalingen: { id: string; bedrag: number; netto_klant: number; betaald_op: string }[]
    totaal: number
  }>()

  const oberIds = [...new Set(snap.docs.map(d => d.data().ober_id as string))]
  const oberSnaps = await Promise.all(oberIds.map(id => adminDb.collection('obers').doc(id).get()))
  const oberMap = new Map(oberSnaps.map(s => [s.id, s.data()]))

  for (const doc of snap.docs) {
    const b = doc.data()
    const oberId = b.ober_id as string
    const ober = oberMap.get(oberId)
    const netto = b.netto_klant as number

    if (!groepen.has(oberId)) {
      groepen.set(oberId, {
        oberId,
        naam: ober?.naam ?? 'Onbekend',
        email: ober?.email ?? '',
        iban: ober?.iban ?? null,
        iban_naam: ober?.iban_naam ?? null,
        betalingen: [],
        totaal: 0,
      })
    }

    const g = groepen.get(oberId)!
    g.betalingen.push({ id: doc.id, bedrag: b.bedrag, netto_klant: netto, betaald_op: b.betaald_op })
    g.totaal += netto
  }

  const lijst = [...groepen.values()].sort((a, b) => b.totaal - a.totaal)
  return NextResponse.json({ uitbetalingen: lijst })
}

// POST — markeer alle openstaande betalingen van een ober als uitbetaald
export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ fout: 'Geen toegang' }, { status: 403 })
  }

  const { oberId, betalingIds } = await req.json()
  if (!oberId || !Array.isArray(betalingIds) || betalingIds.length === 0) {
    return NextResponse.json({ fout: 'Ongeldig verzoek' }, { status: 400 })
  }

  const nu = new Date().toISOString()
  const batch = adminDb.batch()

  for (const id of betalingIds) {
    batch.update(adminDb.collection('betalingen').doc(id), {
      uitbetaald: true,
      uitbetaald_op: nu,
      uitbetaald_door: userId,
    })
  }

  // Leg ook een uitbetaling-record vast
  batch.set(adminDb.collection('uitbetalingen').doc(), {
    ober_id: oberId,
    bedrag_ids: betalingIds,
    totaal: betalingIds.length,
    aangemaakt_op: nu,
    aangemaakt_door: userId,
    methode: 'handmatig_iban',
  })

  await batch.commit()
  return NextResponse.json({ ok: true, verwerkt: betalingIds.length })
}
