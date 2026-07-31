import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { adminDb, adminAuth } from '@/lib/firebase-admin'

async function isAdmin(userId: string): Promise<boolean> {
  const snap = await adminDb.collection('obers').doc(userId).get()
  return snap.data()?.admin === true
}

// GET — lijst van alle partners
export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ fout: 'Geen toegang' }, { status: 403 })
  }

  const snap = await adminDb.collection('partners').get()
  const partners = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  return NextResponse.json({ partners })
}

// POST — maak een nieuwe partner aan
export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ fout: 'Geen toegang' }, { status: 403 })
  }

  const { naam, email, land, iban, iban_naam } = await req.json()
  if (!naam || !email) {
    return NextResponse.json({ fout: 'Naam en email zijn verplicht' }, { status: 400 })
  }

  // Maak Firebase Auth account aan voor de partner
  let userRecord
  try {
    userRecord = await adminAuth.createUser({ email, displayName: naam })
  } catch {
    // Account bestaat al — ophalen
    userRecord = await adminAuth.getUserByEmail(email)
  }

  const partnerData = {
    naam,
    email,
    land: land ?? 'BE',
    iban: iban ?? null,
    iban_naam: iban_naam ?? null,
    actief: true,
    aangemaakt_op: new Date().toISOString(),
  }

  await adminDb.collection('partners').doc(userRecord.uid).set(partnerData)

  // Wachtwoord-reset sturen zodat partner zelf een wachtwoord instelt
  const resetLink = await adminAuth.generatePasswordResetLink(email)

  return NextResponse.json({ ok: true, partnerId: userRecord.uid, resetLink })
}
