import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

// GET /api/admin/config — huidige fee-config ophalen
export async function GET() {
  const snap = await adminDb.collection('config').doc('fees').get()
  if (!snap.exists) {
    return NextResponse.json({
      abonnementsBedrag: 2999,
      millerCreativePercent: 42.5,
      belgianPartnerPercent: 42.5,
      marketingPercent: 15,
      belgianPartnerNaam: 'Strictly Hospitality',
    })
  }
  return NextResponse.json(snap.data())
}

// POST /api/admin/config — config bijwerken
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    await adminDb.collection('config').doc('fees').set(body, { merge: true })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Config update mislukt:', err)
    return NextResponse.json({ fout: 'Update mislukt' }, { status: 500 })
  }
}
