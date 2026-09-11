import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import { haalBezoekStatistieken } from '@/lib/bezoekstatistieken'

export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ fout: 'Niet ingelogd' }, { status: 401 })

  const partnerSnap = await adminDb.collection('partners').doc(userId).get()
  if (!partnerSnap.exists) {
    return NextResponse.json({ fout: 'Geen partner account' }, { status: 403 })
  }

  try {
    return NextResponse.json(await haalBezoekStatistieken())
  } catch (err) {
    console.error('Fout bij ophalen bezoekersstatistieken:', err)
    return NextResponse.json({ fout: 'Kon statistieken niet ophalen' }, { status: 500 })
  }
}
