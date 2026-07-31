import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'

async function isAdmin(userId: string): Promise<boolean> {
  const snap = await adminDb.collection('obers').doc(userId).get()
  return snap.data()?.admin === true
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ fout: 'Geen toegang' }, { status: 403 })
  }

  const [abSnap, oberSnap] = await Promise.all([
    adminDb.collection('abonnementen').get(),
    adminDb.collection('obers').get(),
  ])

  const oberMap = new Map<string, { naam: string; email: string; iban: string | null }>()
  oberSnap.forEach(d => {
    const data = d.data()
    oberMap.set(d.id, { naam: data.naam, email: data.email, iban: data.iban ?? null })
  })

  const abonnementen = abSnap.docs.map(d => {
    const data = d.data()
    const ober = oberMap.get(d.id)
    return {
      id: d.id,
      naam: ober?.naam ?? 'Onbekend',
      email: ober?.email ?? '',
      iban: ober?.iban ?? null,
      status: data.status,
      bedrag: data.bedrag,
      voldaan: data.voldaan,
      start_datum: data.start_datum,
      actief_sinds: data.actief_sinds ?? null,
    }
  })

  abonnementen.sort((a, b) => b.start_datum.localeCompare(a.start_datum))

  return NextResponse.json({ abonnementen })
}
