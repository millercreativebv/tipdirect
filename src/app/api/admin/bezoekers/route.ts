import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'

async function isAdmin(userId: string): Promise<boolean> {
  const snap = await adminDb.collection('obers').doc(userId).get()
  return snap.data()?.admin === true
}

function vandaag(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels' }).format(new Date())
}

function dagenGeleden(n: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels' }).format(d)
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ fout: 'Geen toegang' }, { status: 403 })
  }

  try {
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

    return NextResponse.json({
      vandaag: vandaagPaginaweergaven,
      week: weekPaginaweergaven,
      maand: maandPaginaweergaven,
      totaal: totaalPaginaweergaven,
      totaalBezoekers,
      // Laatste 30 dagen, oudste eerst
      dagen: dagen.slice(0, 30).reverse(),
      bronnen,
    })
  } catch (err) {
    console.error('Fout bij ophalen bezoekersstatistieken:', err)
    return NextResponse.json({ fout: 'Kon statistieken niet ophalen' }, { status: 500 })
  }
}
