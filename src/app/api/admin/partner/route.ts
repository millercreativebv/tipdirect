import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { adminDb, adminAuth } from '@/lib/firebase-admin'

async function isAdmin(userId: string): Promise<boolean> {
  const snap = await adminDb.collection('obers').doc(userId).get()
  return snap.data()?.admin === true
}

// GET — lijst van alle partners incl. tegoed-samenvatting en volledige geschiedenis
export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ fout: 'Geen toegang' }, { status: 403 })
  }

  const snap = await adminDb.collection('partners').get()

  const partners = await Promise.all(snap.docs.map(async d => {
    const tegoedSnap = await adminDb
      .collection('partner_tegoed')
      .where('partner_id', '==', d.id)
      .get()

    const tegoedLijst = tegoedSnap.docs
      .map(t => ({ id: t.id, ...t.data() }))
      .sort((a, b) => String((b as Record<string, unknown>).maand ?? '').localeCompare(String((a as Record<string, unknown>).maand ?? '')))

    const tegoed_open = tegoedSnap.docs
      .filter(t => t.data().status === 'open')
      .reduce((s, t) => s + (t.data().bedrag ?? 0), 0)

    const tegoed_totaal = tegoedSnap.docs
      .reduce((s, t) => s + (t.data().bedrag ?? 0), 0)

    // Login-status komt uit Firebase Auth zelf — geen aparte tracking nodig.
    let laatste_login: string | null = null
    let account_aangemaakt: string | null = null
    try {
      const userRecord = await adminAuth.getUser(d.id)
      laatste_login = userRecord.metadata.lastSignInTime ?? null
      account_aangemaakt = userRecord.metadata.creationTime ?? null
    } catch {
      // Auth-account bestaat niet (meer) — laat leeg
    }

    return { id: d.id, ...d.data(), tegoed_open, tegoed_totaal, tegoed_lijst: tegoedLijst, laatste_login, account_aangemaakt }
  }))

  return NextResponse.json({ partners })
}

// PATCH — stuur welkomstmail opnieuw
export async function PATCH(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId || !(await isAdmin(userId))) {
    return NextResponse.json({ fout: 'Geen toegang' }, { status: 403 })
  }

  const { partnerId } = await req.json()
  if (!partnerId) return NextResponse.json({ fout: 'partnerId verplicht' }, { status: 400 })

  const snap = await adminDb.collection('partners').doc(partnerId).get()
  if (!snap.exists) return NextResponse.json({ fout: 'Partner niet gevonden' }, { status: 404 })

  const { naam, email } = snap.data()!

  let resetLink: string
  try {
    resetLink = await adminAuth.generatePasswordResetLink(email)
  } catch (err) {
    console.error('generatePasswordResetLink mislukt voor partner:', partnerId, email, err)
    return NextResponse.json({ fout: `Kon reset-link niet genereren: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 })
  }

  try {
    const { sendPartnerWelkomMail } = await import('@/lib/mail')
    await sendPartnerWelkomMail({ naam, email, resetLink })
  } catch (err) {
    console.error('Verzenden welkomstmail mislukt voor partner:', partnerId, email, err)
    return NextResponse.json({ fout: `Mail verzenden mislukt: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
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

  // Wachtwoord-reset genereren en direct naar de partner mailen.
  // Partner-account staat er al — een mailfout mag dat niet ongedaan maken,
  // maar de admin moet 'm wel te zien krijgen (i.p.v. stil te falen).
  let mailFout: string | null = null
  try {
    const resetLink = await adminAuth.generatePasswordResetLink(email)
    const { sendPartnerWelkomMail } = await import('@/lib/mail')
    await sendPartnerWelkomMail({ naam, email, resetLink })
  } catch (err) {
    console.error('Partner welkomstmail mislukt:', partnerData.email, err)
    mailFout = err instanceof Error ? err.message : String(err)
  }

  return NextResponse.json({ ok: true, partnerId: userRecord.uid, mailFout })
}
