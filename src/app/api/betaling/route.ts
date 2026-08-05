import { NextRequest, NextResponse } from 'next/server'
import { mollie, MOLLIE_FEE_CENTEN, getGeldigAccessToken, verbondenMollieClient } from '@/lib/mollie'
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

    const oberData = oberSnap.data()!
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    const gebruikersnaam = oberData.gebruikersnaam as string
    const naam = oberData.naam as string

    // Haal abonnement status op
    const abSnap = await adminDb.collection('abonnementen').doc(oberId).get()
    const abStatus = abSnap.data()?.status ?? 'pending'

    // Bepaal application fee (wat Miller Creative ontvangt via Mollie Connect)
    // - Bedrijf betaalt abonnement apart → tips gaan 100% naar hen
    // - Individueel pending → volledige tip (min Mollie's eigen fee) gaat naar abonnement
    // - Individueel actief → geen application fee, ober houdt alles
    const isIndividueelPending =
      oberData.account_type === 'individueel' && abStatus === 'pending'

    const applicationFeeCenten = isIndividueelPending
      ? Math.max(0, bedragCenten - MOLLIE_FEE_CENTEN)
      : 0

    const gemeenschappelijkeParams = {
      amount: {
        currency: 'EUR' as const,
        value: (bedragCenten / 100).toFixed(2),
      },
      description: `Fooi voor ${naam} via TipDirect`,
      redirectUrl: `${baseUrl}/betaald?ober=${gebruikersnaam}`,
      cancelUrl: `${baseUrl}/${gebruikersnaam}`,
      webhookUrl: `${baseUrl}/api/webhook`,
      metadata: {
        oberId,
        bedragCenten: bedragCenten.toString(),
      },
    }

    let betaling
    let viaMollieConnect = false
    let gebruiktAccessToken: string | null = null

    // Probeer Mollie Connect als het account gekoppeld is
    const heeftConnect =
      oberData.mollie_connected === true &&
      oberData.mollie_access_token &&
      oberData.mollie_refresh_token &&
      oberData.mollie_token_expires_at

    if (heeftConnect) {
      try {
        const tokenResult = await getGeldigAccessToken({
          mollie_access_token: oberData.mollie_access_token,
          mollie_refresh_token: oberData.mollie_refresh_token,
          mollie_token_expires_at: oberData.mollie_token_expires_at,
        })

        // Vernieuwd token terugschrijven naar Firestore
        if (tokenResult.vernieuwd && tokenResult.nieuweData) {
          await adminDb.collection('obers').doc(oberId).update(tokenResult.nieuweData)
        }

        gebruiktAccessToken = tokenResult.accessToken
        const verbonden = verbondenMollieClient(gebruiktAccessToken)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const connectParams: any = { ...gemeenschappelijkeParams }
        if (applicationFeeCenten > 0) {
          connectParams.applicationFee = {
            amount: {
              currency: 'EUR',
              value: (applicationFeeCenten / 100).toFixed(2),
            },
            description: 'TipDirect platform',
          }
        }

        betaling = await verbonden.payments.create(connectParams)
        viaMollieConnect = true
      } catch (connectFout) {
        console.error('Mollie Connect betaling mislukt, fallback naar eigen account:', connectFout)
        betaling = await mollie.payments.create(gemeenschappelijkeParams)
      }
    } else {
      // Geen Mollie Connect: betaling op Miller Creative's account (handmatige uitbetaling nodig)
      betaling = await mollie.payments.create(gemeenschappelijkeParams)
    }

    await adminDb.collection('betalingen').add({
      ober_id: oberId,
      mollie_id: betaling.id,
      bedrag: bedragCenten,
      status: 'open',
      bestemming: null,
      via_mollie_connect: viaMollieConnect,
      application_fee_centen: applicationFeeCenten > 0 ? applicationFeeCenten : null,
      abonnement_bijdrage: null,
      netto_klant: null,
      mollie_fee: null,
      beschrijving: `Fooi voor ${naam}`,
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
