import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'

async function isAdmin(userId: string): Promise<boolean> {
  const snap = await adminDb.collection('obers').doc(userId).get()
  return snap.data()?.admin === true
}

// POST — wijs een of meer vrije codes toe aan een ober-account
// Body: { oberId, aantal? }  — of  { oberId, codes: ['TDA1B2C3', ...] }
export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ fout: 'Geen toegang' }, { status: 403 })
  }

  const body = await req.json()
  const { oberId, codes: handpicked } = body
  const aantal: number = body.aantal ?? 1

  if (!oberId) return NextResponse.json({ fout: 'oberId vereist' }, { status: 400 })

  const oberSnap = await adminDb.collection('obers').doc(oberId).get()
  if (!oberSnap.exists) return NextResponse.json({ fout: 'Account niet gevonden' }, { status: 404 })

  const ober = oberSnap.data()!
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://tipdirect.be'
  const redirectUrl = `${baseUrl}/${ober.gebruikersnaam}`
  const nu = new Date().toISOString()

  let codesDocs: FirebaseFirestore.DocumentSnapshot[]

  if (handpicked?.length) {
    // Specifieke codes toewijzen
    codesDocs = await Promise.all(
      handpicked.map((c: string) => adminDb.collection('kaart_codes').doc(c.toUpperCase()).get())
    )
    const bezet = codesDocs.filter(d => d.exists && d.data()?.ober_id)
    if (bezet.length) {
      return NextResponse.json({ fout: `Code(s) al in gebruik: ${bezet.map(d => d.id).join(', ')}` }, { status: 409 })
    }
  } else {
    // Automatisch vrije codes pakken
    const vrijSnap = await adminDb
      .collection('kaart_codes')
      .where('ober_id', '==', null)
      .limit(aantal)
      .get()

    if (vrijSnap.size < aantal) {
      return NextResponse.json({ fout: `Niet genoeg vrije codes (${vrijSnap.size} beschikbaar, ${aantal} gevraagd)` }, { status: 409 })
    }
    codesDocs = vrijSnap.docs
  }

  // Maak kaart_order aan
  const orderRef = adminDb.collection('kaart_orders').doc()
  const orderData = {
    ober_id: oberId,
    naam: ober.naam ?? '',
    account_type: ober.account_type ?? 'individueel',
    aantal: codesDocs.length,
    type: 'toewijzing',
    status: 'aangevraagd',
    codes: codesDocs.map(d => d.id),
    track_trace: null,
    aangemaakt_op: nu,
    verzonden_op: null,
  }
  await orderRef.set(orderData)

  // Wijs codes toe
  const batch = adminDb.batch()
  for (const doc of codesDocs) {
    batch.update(doc.ref, {
      ober_id: oberId,
      naam: ober.naam ?? null,
      gebruikersnaam: ober.gebruikersnaam ?? null,
      redirect_url: redirectUrl,
      toegewezen_op: nu,
      kaart_order_id: orderRef.id,
    })
  }
  await batch.commit()

  return NextResponse.json({ ok: true, codes: codesDocs.map(d => d.id), order_id: orderRef.id })
}
