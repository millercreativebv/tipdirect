import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { getOfMaakAbonnement } from '@/lib/abonnement'

export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ fout: 'Niet ingelogd' }, { status: 401 })

  const abonnement = await getOfMaakAbonnement(userId)
  return NextResponse.json(abonnement)
}
