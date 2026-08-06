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
    const bedragExBtwCenten = configSnap.exists
      ? (configSnap.data()?.abonnementsBedragBedrijf ?? 7500)
      : 7500

    const BTW_PERCENTAGE = 21
    const btwCenten = Math.round(bedragExBtwCenten * BTW_PERCENTAGE / 100)
    const bedragInclBtwCenten = bedragExBtwCenten + btwCenten

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

    const betaling = await mollie.payments.create({
      amount: {
        currency: 'EUR',
        value: (bedragInclBtwCenten / 100).toFixed(2),
      },
      description: `TipDirect bedrijfsabonnement (incl. ${BTW_PERCENTAGE}% BTW)`,
      redirectUrl: `${baseUrl}/dashboard/uitbater?activering=1`,
      webhookUrl: `${baseUrl}/api/webhook`,
      metadata: {
        oberId: uid,
        bedragCenten: bedragExBtwCenten.toString(),
      },
    })

    await adminDb.collection('betalingen').add({
      ober_id: uid,
      mollie_id: betaling.id,
      bedrag: bedragExBtwCenten,       // ex-BTW — basis voor abonnement en commissie
      bedrag_incl_btw: bedragInclBtwCenten,
      btw_bedrag: btwCenten,
      btw_percentage: BTW_PERCENTAGE,
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
