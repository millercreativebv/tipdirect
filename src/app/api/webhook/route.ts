import { NextRequest, NextResponse } from 'next/server'
import { mollie } from '@/lib/mollie'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const mollieId = formData.get('id') as string

    if (!mollieId) {
      return NextResponse.json({ fout: 'Geen betaling ID' }, { status: 400 })
    }

    // Betaalstatus ophalen bij Mollie
    const mollieBetaling = await mollie.payments.get(mollieId)

    const statusMap: Record<string, string> = {
      paid: 'betaald',
      failed: 'mislukt',
      canceled: 'mislukt',
      expired: 'mislukt',
      refunded: 'teruggestort',
    }

    const nieuweStatus = statusMap[mollieBetaling.status] ?? 'open'

    // Status bijwerken in database
    const { error } = await supabaseAdmin
      .from('betalingen')
      .update({
        status: nieuweStatus,
        betaald_op: mollieBetaling.status === 'paid' ? new Date().toISOString() : null,
      })
      .eq('mollie_id', mollieId)

    if (error) {
      console.error('Webhook database fout:', error)
      return NextResponse.json({ fout: 'Database fout' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook fout:', err)
    return NextResponse.json({ fout: 'Webhook verwerking mislukt' }, { status: 500 })
  }
}
