import { adminDb } from '@/lib/firebase-admin'

export type BezoekStatistieken = {
  vandaag: number
  week: number
  maand: number
  totaal: number
  totaalBezoekers: number
  dagen: { datum: string; paginaweergaven: number; bezoekers: number }[]
  bronnen: { domein: string; aantal: number }[]
}

function vandaag(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels' }).format(new Date())
}

function dagenGeleden(n: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels' }).format(d)
}

// Gedeelde aggregatie voor het admin- én partnerdashboard.
export async function haalBezoekStatistieken(): Promise<BezoekStatistieken> {
  // Geen orderBy op document-ID: dat vereist in Firestore een losse index.
  // De collectie blijft klein (~365 docs/jaar), dus gewoon ophalen en zelf sorteren.
  const snap = await adminDb.collection('bezoeken').get()

  const alleDagen: { datum: string; paginaweergaven: number; bezoekers: number }[] = []
  let totaalPaginaweergaven = 0
  let totaalBezoekers = 0
  let weekPaginaweergaven = 0
  let maandPaginaweergaven = 0
  let vandaagPaginaweergaven = 0

  const grensWeek = dagenGeleden(7)
  const grensMaand = dagenGeleden(30)
  const vandaagDatum = vandaag()

  for (const doc of snap.docs) {
    const d = doc.data()
    const paginaweergaven: number = d.paginaweergaven ?? 0
    const bezoekers: number = d.bezoekers ?? 0
    alleDagen.push({ datum: doc.id, paginaweergaven, bezoekers })

    totaalPaginaweergaven += paginaweergaven
    totaalBezoekers += bezoekers
    if (doc.id >= grensWeek) weekPaginaweergaven += paginaweergaven
    if (doc.id >= grensMaand) maandPaginaweergaven += paginaweergaven
    if (doc.id === vandaagDatum) vandaagPaginaweergaven = paginaweergaven
  }

  const dagen = alleDagen.sort((a, b) => b.datum.localeCompare(a.datum))

  const bronnenSnap = await adminDb.collection('bezoeken_bronnen').orderBy('aantal', 'desc').limit(8).get()
  const bronnen = bronnenSnap.docs.map(doc => ({ domein: doc.id, aantal: doc.data().aantal ?? 0 }))

  return {
    vandaag: vandaagPaginaweergaven,
    week: weekPaginaweergaven,
    maand: maandPaginaweergaven,
    totaal: totaalPaginaweergaven,
    totaalBezoekers,
    // Laatste 30 dagen, oudste eerst
    dagen: dagen.slice(0, 30).reverse(),
    bronnen,
  }
}
