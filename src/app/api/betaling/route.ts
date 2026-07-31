import { NextRequest, NextResponse } from 'next/server'
import { mollie } from '@/lib/mollie'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const { oberId, bedragCenten, sterren, complimenten, boodschap } = await req.json()

    if (!oberId || !bedragCenten || bedragCenten < 100) {
      return NextResponse.json({ fout: 'Ongeldig verzoek' }, { status: 400 })
    }

    const oberSnap = await adminDb.collection('obers').doc(oberId).get()
    if (!oberSnap.exists || !oberSnap.data()?.actief) {
      return NextResponse.json({ fout: 'Ober niet gevonden' }, { status: 404 })
    }

    const ober = { id: oberSnap.id, ...oberSnap.data() } as {
      id: string
      naam: string
      gebruikersnaam: string
      actief: boolean
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

    const betaling = await mollie.payments.create({
      amount: {
        currency: 'EUR',
        value: (bedragCenten / 100).toFixed(2),
      },
      description: `Fooi voor ${ober.naam} via TipDirect`,
      redirectUrl: `${baseUrl}/betaald?ober=${ober.gebruikersnaam}`,
      cancelUrl: `${baseUrl}/${ober.gebruikersnaam}`,
      webhookUrl: `${baseUrl}/api/webhook`,
      metadata: {
        oberId: ober.id,
        bedragCenten: bedragCenten.toString(),
      },
    })

    await adminDb.collection('betalingen').add({
      ober_id: ober.id,
      mollie_id: betaling.id,
      bedrag: bedragCenten,
      status: 'open',
      bestemming: null,           // wordt ingevuld door webhook: 'tipdirect' of 'klant'
      abonnement_bijdrage: null,  // bedrag dat naar abonnement ging
      beschrijving: `Fooi voor ${ober.naam}`,
      aangemaakt_op: new Date().toISOString(),
      betaald_op: null,
      sterren: sterren ?? null,
      complimenten: complimenten ?? null,
      boodschap: boodschap ?? null,
    })

    return NextResponse.json({ betaalUrl: betaling.getCheckoutUrl() })
  } catch (err) {
    console.error('Betaling aanmaken mislukt:', err)
    return NextResponse.json({ fout: 'Betaling aanmaken mislukt' }, { status: 500 })
  }
}
