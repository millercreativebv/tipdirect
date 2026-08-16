import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import {
  sendRegistratieBevestigingMail,
  sendAdminNieuweRegistratieNotificatie,
} from '@/lib/mail'

// POST — stuur registratiebevestiging direct na aanmaken profiel
export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ fout: 'Niet ingelogd' }, { status: 401 })

  const oberSnap = await adminDb.collection('obers').doc(userId).get()
  if (!oberSnap.exists) return NextResponse.json({ fout: 'Account niet gevonden' }, { status: 404 })

  const ober = oberSnap.data()!
  const accountType = (ober.account_type ?? 'individueel') as 'individueel' | 'bedrijf'

  // Voor bedrijf: haal ook KBO op uit bedrijven-collectie
  let kvk: string | null = null
  if (accountType === 'bedrijf' && ober.bedrijf_id) {
    const bedrijfSnap = await adminDb.collection('bedrijven').doc(ober.bedrijf_id).get()
    kvk = bedrijfSnap.data()?.kvk ?? null
  }

  // Beide mails parallel, fouten mogen het account niet breken
  const [userMailResult, adminMailResult] = await Promise.allSettled([
    sendRegistratieBevestigingMail({
      email: ober.email,
      naam: ober.naam,
      gebruikersnaam: ober.gebruikersnaam,
      accountType,
    }),
    sendAdminNieuweRegistratieNotificatie({
      naam: ober.naam,
      email: ober.email,
      accountType,
      telefoon: ober.telefoon ?? null,
      straat: ober.adres_straat ?? null,
      postcode: ober.adres_postcode ?? null,
      stad: ober.adres_stad ?? null,
      land: ober.adres_land ?? null,
      iban: ober.iban ?? null,
      ibanNaam: ober.iban_naam ?? null,
      btwNummer: ober.btw_nummer ?? null,
      kvk,
      gebruikersnaam: ober.gebruikersnaam,
    }),
  ])

  if (userMailResult.status === 'rejected') {
    console.error('Registratiebevestiging gebruiker mislukt:', userMailResult.reason)
  }
  if (adminMailResult.status === 'rejected') {
    console.error('Admin registratienotificatie mislukt:', adminMailResult.reason)
  }

  return NextResponse.json({ ok: true })
}
