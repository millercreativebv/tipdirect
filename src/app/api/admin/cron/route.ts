import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import { check30DagenRegel } from '@/lib/abonnement'

async function isAdmin(userId: string): Promise<boolean> {
  const snap = await adminDb.collection('obers').doc(userId).get()
  return snap.data()?.admin === true
}

// POST /api/admin/cron — voer de 30-dagenregel uit
// Kan ook worden aangeroepen via Vercel Cron (dan zonder auth, via CRON_SECRET header)
export async function POST(req: NextRequest) {
  // Vercel Cron gebruikt een secret header
  const cronSecret = req.headers.get('x-cron-secret')
  if (cronSecret && cronSecret === process.env.CRON_SECRET) {
    const vervallen = await check30DagenRegel()
    return NextResponse.json({ ok: true, vervallen })
  }

  // Anders: alleen admins
  const userId = await getUserId(req)
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ fout: 'Geen toegang' }, { status: 403 })
  }

  const vervallen = await check30DagenRegel()
  return NextResponse.json({ ok: true, vervallen, aantalVervallen: vervallen.length })
}
