import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'

async function isAdmin(userId: string): Promise<boolean> {
  const snap = await adminDb.collection('obers').doc(userId).get()
  return snap.data()?.admin === true
}

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function genereerCode(): string {
  let code = 'TD'
  for (let i = 0; i < 6; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)]
  }
  return code
}

const CODES_PER_SET: Record<string, number> = { bedrijf: 5, individueel: 2 }

// GET — haal sets + voorraad op
export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ fout: 'Geen toegang' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') ?? 'alle'

  // Gebruik enkel equality-filters (geen orderBy combinatie) om composite indexes te vermijden.
  // set_id is alfabetisch gesorteerd (B-0001, B-0002, ...) dus client-side sortering klopt automatisch.
  let query = adminDb.collection('kaart_sets') as FirebaseFirestore.Query

  if (filter === 'vrij') {
    query = adminDb.collection('kaart_sets').where('status', '==', 'vrij')
  } else if (filter === 'bedrijf') {
    query = adminDb.collection('kaart_sets').where('type', '==', 'bedrijf')
  } else if (filter === 'individueel') {
    query = adminDb.collection('kaart_sets').where('type', '==', 'individueel')
  }

  const [setsSnap, vrijBedrijfSnap, vrijIndividueelSnap] = await Promise.all([
    query.limit(500).get(),
    adminDb.collection('kaart_sets').where('status_type', '==', 'bedrijf_vrij').count().get(),
    adminDb.collection('kaart_sets').where('status_type', '==', 'individueel_vrij').count().get(),
  ])

  const sets = setsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

  return NextResponse.json({
    sets,
    vrij_bedrijf: vrijBedrijfSnap.data().count,
    vrij_individueel: vrijIndividueelSnap.data().count,
    totaal: sets.length,
  })
}

// POST — genereer een batch sets
export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ fout: 'Geen toegang' }, { status: 403 })
  }

  const { aantal = 100, type = 'bedrijf' } = await req.json().catch(() => ({}))
  if (type !== 'bedrijf' && type !== 'individueel') {
    return NextResponse.json({ fout: 'Ongeldig type' }, { status: 400 })
  }
  const aantalInt = Math.min(Math.max(1, parseInt(String(aantal))), 500)
  const codesPerSet = CODES_PER_SET[type]
  const prefix = type === 'bedrijf' ? 'B' : 'I'

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://tipdirect.be'
  const aangemaakt_op = new Date().toISOString()

  // Startnummer = aantal bestaande sets van dit type + 1 (geen orderBy → geen composite index nodig)
  const countSnap = await adminDb.collection('kaart_sets')
    .where('type', '==', type)
    .count()
    .get()
  const startNummer = countSnap.data().count + 1

  // Houd gegenereerde codes bij om dubbels binnen deze batch te voorkomen
  // (kans op botsing met bestaande codes is te verwaarlozen bij 32^6 ≈ 1 miljard mogelijkheden)
  const bestaand = new Set<string>()

  const aangemaakteSets: string[] = []
  const batch = adminDb.batch()

  for (let s = 0; s < aantalInt; s++) {
    const setNummer = startNummer + s
    const setId = `${prefix}-${String(setNummer).padStart(4, '0')}`
    const codes: string[] = []
    const urls: string[] = []

    let pogingen = 0
    while (codes.length < codesPerSet && pogingen < codesPerSet * 20) {
      pogingen++
      const code = genereerCode()
      if (bestaand.has(code) || codes.includes(code)) continue
      codes.push(code)
      urls.push(`${baseUrl}/c/${code}`)
      bestaand.add(code)
    }

    if (codes.length < codesPerSet) continue

    const setRef = adminDb.collection('kaart_sets').doc(setId)
    batch.set(setRef, {
      set_id: setId,
      type,
      set_nummer: setNummer,
      codes,
      urls,
      status: 'vrij',
      status_type: `${type}_vrij`,
      aangemaakt_op,
      toegewezen_op: null,
      ober_id: null,
      kaart_order_id: null,
    })

    for (let i = 0; i < codes.length; i++) {
      batch.set(adminDb.collection('kaart_codes').doc(codes[i]), {
        code: codes[i],
        set_id: setId,
        ober_id: null,
        naam: null,
        gebruikersnaam: null,
        redirect_url: null,
        aangemaakt_op,
        toegewezen_op: null,
        kaart_order_id: null,
      })
    }

    aangemaakteSets.push(setId)
  }

  await batch.commit()

  return NextResponse.json({ ok: true, aangemaakt: aangemaakteSets.length, type, sets: aangemaakteSets })
}
