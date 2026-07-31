import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import { mollie } from '@/lib/mollie'

async function isAdmin(userId: string): Promise<boolean> {
  const snap = await adminDb.collection('obers').doc(userId).get()
  return snap.data()?.admin === true
}

// POST — betaal openstaand partner-tegoed uit via Mollie bankoverschrijving
export async function POST(req: NextRequest) {
  // Toegang: admin of Vercel cron
  const cronSecret = req.headers.get('x-cron-secret')
  const isCron = cronSecret && cronSecret === process.env.CRON_SECRET

  if (!isCron) {
    const userId = await getUserId(req)
    if (!userId || !(await isAdmin(userId))) {
      return NextResponse.json({ fout: 'Geen toegang' }, { status: 403 })
    }
  }

  const { partnerId, maand } = await req.json().catch(() => ({}))

  // Haal open tegoed op (specifieke partner+maand of alle open)
  let query = adminDb.collection('partner_tegoed').where('status', '==', 'open')
  if (partnerId) query = query.where('partner_id', '==', partnerId) as typeof query
  if (maand) query = query.where('maand', '==', maand) as typeof query

  const tegoedSnap = await query.get()
  if (tegoedSnap.empty) {
    return NextResponse.json({ ok: true, bericht: 'Geen openstaand tegoed', verwerkt: 0 })
  }

  const resultaten = []

  for (const doc of tegoedSnap.docs) {
    const tegoed = doc.data()
    const partnerSnap = await adminDb.collection('partners').doc(tegoed.partner_id).get()
    const partner = partnerSnap.data()

    if (!partner?.iban) {
      resultaten.push({ partner_id: tegoed.partner_id, fout: 'Geen IBAN bekend', maand: tegoed.maand })
      continue
    }

    const bedragEuro = (tegoed.bedrag / 100).toFixed(2)

    try {
      // Maak een Mollie bankoverschrijving aan
      const betaling = await mollie.payments.create({
        amount: { currency: 'EUR', value: bedragEuro },
        description: `TipDirect partner uitbetaling ${partner.naam} — ${tegoed.maand}`,
        redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/admin`,
        method: ['banktransfer'],
        billingAddress: {
          organizationName: partner.naam,
          streetAndNumber: '',
          city: '',
          country: partner.land ?? 'BE',
          email: partner.email,
        },
      } as Parameters<typeof mollie.payments.create>[0])

      const nu = new Date().toISOString()
      await doc.ref.update({
        status: 'uitbetaald',
        uitbetaald_op: nu,
        mollie_betaling_id: betaling.id,
      })

      resultaten.push({
        partner_id: tegoed.partner_id,
        naam: partner.naam,
        maand: tegoed.maand,
        bedrag: tegoed.bedrag,
        mollie_id: betaling.id,
        ok: true,
      })
    } catch (err) {
      console.error('Uitbetaling partner mislukt:', err)
      resultaten.push({ partner_id: tegoed.partner_id, maand: tegoed.maand, fout: 'Mollie betaling mislukt' })
    }
  }

  return NextResponse.json({ ok: true, verwerkt: resultaten.length, resultaten })
}
