import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { sendWachtwoordResetMail } from '@/lib/mail'

// POST — genereer Firebase reset-link en stuur via eigen SMTP
export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ fout: 'E-mailadres vereist' }, { status: 400 })
  }

  try {
    const resetLink = await adminAuth.generatePasswordResetLink(email.trim(), {
      url: `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://tipdirect.be'}/inloggen`,
    })

    await sendWachtwoordResetMail({ email: email.trim(), resetLink })
  } catch (err) {
    // Altijd succes teruggeven — geeft geen info weg over welke e-mails bestaan
    console.error('Wachtwoord reset fout:', err)
  }

  return NextResponse.json({ ok: true })
}
