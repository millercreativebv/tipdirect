import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'

async function isAdmin(userId: string): Promise<boolean> {
  const snap = await adminDb.collection('obers').doc(userId).get()
  return snap.data()?.admin === true
}

// POST — wijs een set toe aan een ober-account
// Body: { oberId, setId? }  — setId optioneel, anders pakt systeem de eerstvolgende vrije set
export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ fout: 'Geen toegang' }, { status: 403 })
  }

  const { oberId, setId: handpickedSetId } = await req.json()
  if (!oberId) return NextResponse.json({ fout: 'oberId vereist' }, { status: 400 })

  const oberSnap = await adminDb.collection('obers').doc(oberId).get()
  if (!oberSnap.exists) return NextResponse.json({ fout: 'Account niet gevonden' }, { status: 404 })

  const ober = oberSnap.data()!
  const setType = ober.account_type === 'bedrijf' ? 'bedrijf' : 'individueel'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://tipdirect.be'
  const redirectUrl = `${baseUrl}/${ober.gebruikersnaam}`
  const nu = new Date().toISOString()

  let setDoc: FirebaseFirestore.DocumentSnapshot

  if (handpickedSetId) {
    setDoc = await adminDb.collection('kaart_sets').doc(handpickedSetId).get()
    if (!setDoc.exists) return NextResponse.json({ fout: 'Set niet gevonden' }, { status: 404 })
    if (setDoc.data()?.status !== 'vrij') return NextResponse.json({ fout: 'Set is al toegewezen' }, { status: 409 })
  } else {
    const vrijSnap = await adminDb
      .collection('kaart_sets')
      .where('status_type', '==', `${setType}_vrij`)
      .limit(1)
      .get()
    if (vrijSnap.empty) return NextResponse.json({ fout: `Geen vrije ${setType}-sets beschikbaar` }, { status: 409 })
    setDoc = vrijSnap.docs[0]
  }

  const setData = setDoc.data()!
  const codes: string[] = setData.codes

  const orderRef = adminDb.collection('kaart_orders').doc()
  await orderRef.set({
    ober_id: oberId,
    naam: ober.naam ?? '',
    account_type: ober.account_type ?? 'individueel',
    aantal: codes.length,
    type: 'toewijzing',
    status: 'aangevraagd',
    set_id: setDoc.id,
    codes,
    track_trace: null,
    aangemaakt_op: nu,
    verzonden_op: null,
  })

  const batch = adminDb.batch()
  batch.update(setDoc.ref, {
    status: 'toegewezen',
    status_type: `${setData.type}_toegewezen`,
    toegewezen_op: nu,
    ober_id: oberId,
    kaart_order_id: orderRef.id,
  })
  for (const code of codes) {
    batch.update(adminDb.collection('kaart_codes').doc(code), {
      ober_id: oberId,
      naam: ober.naam ?? null,
      gebruikersnaam: ober.gebruikersnaam ?? null,
      redirect_url: redirectUrl,
      toegewezen_op: nu,
      kaart_order_id: orderRef.id,
    })
  }
  await batch.commit()

  return NextResponse.json({ ok: true, set_id: setDoc.id, codes, order_id: orderRef.id })
}
