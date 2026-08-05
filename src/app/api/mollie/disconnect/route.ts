import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  const uid = await getUserId(req)
  if (!uid) return NextResponse.json({ fout: 'Niet ingelogd' }, { status: 401 })

  await adminDb.collection('obers').doc(uid).update({
    mollie_access_token: null,
    mollie_refresh_token: null,
    mollie_token_expires_at: null,
    mollie_connected: false,
    mollie_connected_naam: null,
  })

  return NextResponse.json({ ok: true })
}
