import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'

async function isAdmin(userId: string): Promise<boolean> {
  const snap = await adminDb.collection('obers').doc(userId).get()
  return snap.data()?.admin === true
}

// Charset zonder verwarrende tekens (0/O, 1/I/L)
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function genereerCode(): string {
  let code = 'TD'
  for (let i = 0; i < 6; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)]
  }
  return code
}

// GET — haal alle kaart-codes op (met filter: alle | vrij | toegewezen)
export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ fout: 'Geen toegang' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') ?? 'alle'

  let query = adminDb.collection('kaart_codes').orderBy('aangemaakt_op', 'desc') as FirebaseFirestore.Query

  if (filter === 'vrij') {
    query = adminDb.collection('kaart_codes').where('ober_id', '==', null).orderBy('aangemaakt_op', 'desc')
  } else if (filter === 'toegewezen') {
    query = adminDb.collection('kaart_codes').where('ober_id', '!=', null).orderBy('ober_id')
  }

  const snap = await query.limit(500).get()
  const codes = snap.docs.map(d => ({ id: d.id, ...d.data() }))

  const totaal = (await adminDb.collection('kaart_codes').count().get()).data().count
  const vrij = (await adminDb.collection('kaart_codes').where('ober_id', '==', null).count().get()).data().count

  return NextResponse.json({ codes, totaal, vrij, toegewezen: totaal - vrij })
}

// POST — genereer een batch nieuwe codes
export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ fout: 'Geen toegang' }, { status: 403 })
  }

  const { aantal = 50, serie = '' } = await req.json().catch(() => ({}))
  const aantalInt = Math.min(Math.max(1, parseInt(String(aantal))), 500)

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://tipdirect.be'
  const serieLabel = serie || `batch-${new Date().toISOString().slice(0, 10)}`

  const aangemaaktOp = new Date().toISOString()
  const batch = adminDb.batch()
  const aangemaakts: string[] = []

  let pogingen = 0
  while (aangemaakts.length < aantalInt && pogingen < aantalInt * 5) {
    pogingen++
    const code = genereerCode()
    if (aangemaakts.includes(code)) continue

    const ref = adminDb.collection('kaart_codes').doc(code)
    const bestaatAl = await ref.get()
    if (bestaatAl.exists) continue

    batch.set(ref, {
      code,
      ober_id: null,
      naam: null,
      gebruikersnaam: null,
      redirect_url: null,
      serie: serieLabel,
      aangemaakt_op: aangemaaktOp,
      toegewezen_op: null,
      kaart_order_id: null,
    })
    aangemaakts.push(code)
  }

  await batch.commit()

  return NextResponse.json({ ok: true, aangemaakt: aangemaakts.length, serie: serieLabel, codes: aangemaakts })
}
