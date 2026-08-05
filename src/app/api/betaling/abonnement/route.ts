import { NextRequest, NextResponse } from 'next/server'
import { mollie } from '@/lib/mollie'
import { adminDb } from '@/lib/firebase-admin'
import { getUserId } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const uid = await getUserId(req)
    if (!uid) return NextResponse.json({ fout: 'Niet ingelogd' }, { status: 401 })

    const oberSnap = await adminDb.collection('obers').doc(uid).get()
    if (!oberSnap.exists) return NextResponse.json({ fout: 'Account niet gevonden' }, { status: 404 })

    const oberData = oberSnap.data()!
    if (oberData.account_type !== 'bedrijf') {
      return NextResponse.json({ fout: 'Alleen bedrijfsaccounts kunnen een abonnement betalen' }, { status: 403 })
    }

    const abSnap = await adminDb.collection('abonnementen').doc(uid).get()
    if (abSnap.exists && abSnap.data()?.status === 'actief') {
      return NextResponse.json({ fout: 'Abonnement is al actief' }, { status: 400 })
    }

    const configSnap = await adminDb.collection('config').doc('fees').get()
    const bedragCenten = configSnap.exists
      ? (configSnap.data()?.abonnementsBedragBedrijf ?? 6000)
      : 6000

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

    const betaling = await mollie.payments.create({
      amount: {
        currency: 'EUR',
        value: (bedragCenten / 100).toFixed(2),
      },
      description: 'TipDirect bedrijfsabonnement',
      redirectUrl: `${baseUrl}/dashboard/uitbater`,
      webhookUrl: `${baseUrl}/api/webhook`,
      metadata: {
        oberId: uid,
        bedragCenten: bedragCenten.toString(),
      },
    })

    await adminDb.collection('betalingen').add({
      ober_id: uid,
      mollie_id: betaling.id,
      bedrag: bedragCenten,
      betaling_type: 'abonnement',
      status: 'open',
      bestemming: null,
      beschrijving: 'TipDirect bedrijfsabonnement',
      aangemaakt_op: new Date().toISOString(),
      betaald_op: null,
      abonnement_verwerkt: false,
    })

    return NextResponse.json({ betaalUrl: betaling.getCheckoutUrl() })
  } catch (err) {
    console.error('Abonnement betaling aanmaken mislukt:', err)
    return NextResponse.json({ fout: 'Betaling aanmaken mislukt' }, { status: 500 })
  }
}
