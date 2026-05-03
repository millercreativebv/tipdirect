import { NextRequest, NextResponse } from 'next/server'
import { mollie, TIPDIRECT_FEE } from '@/lib/mollie'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { oberId, bedragCenten } = await req.json()

    if (!oberId || !bedragCenten || bedragCenten < 100) {
      return NextResponse.json({ fout: 'Ongeldig verzoek' }, { status: 400 })
    }

    // Controleer of de ober bestaat
    const { data: ober, error: oberFout } = await supabaseAdmin
      .from('obers')
      .select('id, naam, gebruikersnaam, actief')
      .eq('id', oberId)
      .eq('actief', true)
      .single()

    if (oberFout || !ober) {
      return NextResponse.json({ fout: 'Ober niet gevonden' }, { status: 404 })
    }

    const totaalCenten = bedragCenten + TIPDIRECT_FEE
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

    // Mollie betaling aanmaken
    const betaling = await mollie.payments.create({
      amount: {
        currency: 'EUR',
        value: (totaalCenten / 100).toFixed(2),
      },
      description: `Fooi voor ${ober.naam} via TipDirect`,
      redirectUrl: `${baseUrl}/betaald?ober=${ober.gebruikersnaam}`,
      cancelUrl: `${baseUrl}/${ober.gebruikersnaam}`,
      webhookUrl: `${baseUrl}/api/webhook`,
      metadata: {
        oberId: ober.id,
        bedragCenten: bedragCenten.toString(),
        feeCenten: TIPDIRECT_FEE.toString(),
      },
    })

    // Betaling opslaan in database
    const { error: dbFout } = await supabaseAdmin
      .from('betalingen')
      .insert({
        ober_id: ober.id,
        mollie_id: betaling.id,
        bedrag: totaalCenten,
        fee: TIPDIRECT_FEE,
        status: 'open',
        beschrijving: `Fooi voor ${ober.naam}`,
      })

    if (dbFout) {
      console.error('Database fout:', dbFout)
      return NextResponse.json({ fout: 'Database fout' }, { status: 500 })
    }

    return NextResponse.json({ betaalUrl: betaling.getCheckoutUrl() })
  } catch (err) {
    console.error('Betaling aanmaken mislukt:', err)
    return NextResponse.json({ fout: 'Betaling aanmaken mislukt' }, { status: 500 })
  }
}
