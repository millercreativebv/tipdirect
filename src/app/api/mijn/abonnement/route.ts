import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import { getOfMaakAbonnement } from '@/lib/abonnement'

export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ fout: 'Niet ingelogd' }, { status: 401 })

  const oberSnap = await adminDb.collection('obers').doc(userId).get()
  const accountType = oberSnap.data()?.account_type ?? 'individueel'

  const abonnement = await getOfMaakAbonnement(userId, accountType)
  return NextResponse.json(abonnement)
}
