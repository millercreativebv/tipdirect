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

  const [abSnap, oberSnap, bedrijfSnap, betalingenSnap] = await Promise.all([
    adminDb.collection('abonnementen').get(),
    adminDb.collection('obers').get(),
    adminDb.collection('bedrijven').get(),
    adminDb.collection('betalingen').where('status', '==', 'betaald').get(),
  ])

  const bedrijfMap = new Map<string, Record<string, unknown>>()
  bedrijfSnap.forEach(d => bedrijfMap.set(d.id, d.data()))

  const oberMap = new Map<string, Record<string, unknown>>()
  oberSnap.forEach(d => oberMap.set(d.id, d.data()))

  // Som van alle betaalde tips per ober_id (in centen)
  const omzetMap = new Map<string, number>()
  betalingenSnap.forEach(d => {
    const { ober_id, bedrag } = d.data()
    if (ober_id) omzetMap.set(ober_id, (omzetMap.get(ober_id) ?? 0) + (bedrag ?? 0))
  })

  // Voor bedrijven: ook omzet van hun medewerkers meetellen
  const bedrijfOmzetMap = new Map<string, number>()
  oberSnap.forEach(d => {
    const data = d.data()
    if (data.account_type === 'medewerker' && data.bedrijf_id) {
      const medewerkerOmzet = omzetMap.get(d.id) ?? 0
      bedrijfOmzetMap.set(data.bedrijf_id as string, (bedrijfOmzetMap.get(data.bedrijf_id as string) ?? 0) + medewerkerOmzet)
    }
  })

  const abonnementen = abSnap.docs.filter(d => {
    const type = oberMap.get(d.id)?.account_type as string | undefined
    return type !== 'medewerker'
  }).map(d => {
    const data = d.data()
    const ober = oberMap.get(d.id) ?? {}
    const bedrijfId = ober.bedrijf_id as string | null
    const bedrijf = bedrijfId ? bedrijfMap.get(bedrijfId) : null

    const eigenOmzet = omzetMap.get(d.id) ?? 0
    const teamOmzet = bedrijfId ? (bedrijfOmzetMap.get(bedrijfId) ?? 0) : 0
    const omzet_totaal = eigenOmzet + teamOmzet

    return {
      id: d.id,
      naam: (ober.naam as string) ?? 'Onbekend',
      email: (ober.email as string) ?? '',
      iban: (ober.iban as string | null) ?? null,
      account_type: (ober.account_type as string) ?? 'individueel',
      telefoon: (ober.telefoon as string | null) ?? null,
      adres_straat: (ober.adres_straat as string | null) ?? null,
      adres_postcode: (ober.adres_postcode as string | null) ?? null,
      adres_stad: (ober.adres_stad as string | null) ?? null,
      adres_land: (ober.adres_land as string | null) ?? null,
      btw_nummer: (ober.btw_nummer as string | null) ?? null,
      statutaire_naam: bedrijf ? ((bedrijf.statutaire_naam as string | null) ?? null) : null,
      kvk: bedrijf ? ((bedrijf.kvk as string | null) ?? null) : null,
      status: data.status,
      bedrag: data.bedrag,
      voldaan: data.voldaan,
      start_datum: data.start_datum,
      actief_sinds: data.actief_sinds ?? null,
      omzet_totaal,
    }
  })

  abonnementen.sort((a, b) => b.start_datum.localeCompare(a.start_datum))

  return NextResponse.json({ abonnementen })
}
