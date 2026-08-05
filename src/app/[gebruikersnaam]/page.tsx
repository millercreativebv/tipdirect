import { adminDb } from '@/lib/firebase-admin'
import { notFound } from 'next/navigation'
import BetaalFormulier from './BetaalFormulier'

export const dynamic = 'force-dynamic'

export default async function BetaalPagina({ params }: { params: Promise<{ gebruikersnaam: string }> }) {
  const { gebruikersnaam } = await params

  const snap = await adminDb
    .collection('obers')
    .where('gebruikersnaam', '==', gebruikersnaam)
    .limit(1)
    .get()

  if (snap.empty || !snap.docs[0].data().actief) return notFound()

  const d = snap.docs[0].data()
  const ober = {
    id: snap.docs[0].id,
    naam: d.naam as string,
    foto_url: (d.foto_url as string | null) ?? null,
    voorstelling: (d.voorstelling as string | null) ?? null,
    verhaal: (d.verhaal as string | null) ?? null,
    account_type: (d.account_type as string) ?? 'individueel',
    bedrijf_id: (d.bedrijf_id as string | null) ?? null,
  }

  let bedrijf: { id: string; naam: string; logo_url: string | null } | null = null

  if (ober.account_type === 'medewerker' && ober.bedrijf_id) {
    const [bedrijfSnap, uitbaterSnap] = await Promise.all([
      adminDb.collection('bedrijven').doc(ober.bedrijf_id).get(),
      adminDb.collection('obers')
        .where('bedrijf_id', '==', ober.bedrijf_id)
        .where('account_type', '==', 'bedrijf')
        .limit(1)
        .get(),
    ])

    if (bedrijfSnap.exists) {
      const b = bedrijfSnap.data()!
      bedrijf = { id: bedrijfSnap.id, naam: b.naam as string, logo_url: (b.logo_url as string | null) ?? null }
    }

    if (!uitbaterSnap.empty && !uitbaterSnap.docs[0].data().abonnement_actief) {
      return notFound()
    }
  }

  return <BetaalFormulier ober={ober} bedrijf={bedrijf} />
}
