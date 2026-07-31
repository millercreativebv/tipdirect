import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ fout: 'Niet ingelogd' }, { status: 401 })

  const { iban, iban_naam } = await req.json()

  const ibanSchoon = iban?.toUpperCase().replace(/\s/g, '') ?? ''
  const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,}$/
  if (!ibanSchoon || !ibanRegex.test(ibanSchoon)) {
    return NextResponse.json({ fout: 'Ongeldig IBAN-nummer' }, { status: 400 })
  }
  if (!iban_naam?.trim()) {
    return NextResponse.json({ fout: 'Naam rekeninghouder is verplicht' }, { status: 400 })
  }

  await adminDb.collection('obers').doc(userId).update({
    iban: ibanSchoon,
    iban_naam: iban_naam.trim(),
  })

  await adminDb.collection('abonnementen').doc(userId).set(
    { uitbetaling: 'iban', iban: ibanSchoon },
    { merge: true }
  )

  return NextResponse.json({ ok: true })
}
