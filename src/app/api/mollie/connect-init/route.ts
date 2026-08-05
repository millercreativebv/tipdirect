import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { mollieConnectUrl } from '@/lib/mollie'
import { adminDb } from '@/lib/firebase-admin'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const uid = await getUserId(req)
  if (!uid) return NextResponse.json({ fout: 'Niet ingelogd' }, { status: 401 })

  // Genereer een random state token en sla op in Firestore
  const state = crypto.randomBytes(24).toString('hex')
  await adminDb.collection('mollie_oauth_state').doc(state).set({
    uid,
    aangemaakt_op: new Date().toISOString(),
  })

  return NextResponse.json({ url: mollieConnectUrl(state) })
}
