import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'

// Datum in Belgische tijdzone, formaat YYYY-MM-DD.
function vandaag(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels' }).format(new Date())
}

// Bekende bots/crawlers negeren zodat de statistieken niet vervuild raken.
const BOT_PATRONEN = /bot|spider|crawl|slurp|facebookexternalhit|preview|monitor/i

function bronDomein(referrer: string): string {
  if (!referrer) return 'direct'
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '')
    return host || 'direct'
  } catch {
    return 'direct'
  }
}

export async function POST(req: NextRequest) {
  try {
    const userAgent = req.headers.get('user-agent') ?? ''
    if (BOT_PATRONEN.test(userAgent)) {
      return NextResponse.json({ ok: true })
    }

    const body = await req.json().catch(() => ({}))
    const nieuweSessie = body?.nieuweSessie === true
    const referrer = typeof body?.referrer === 'string' ? body.referrer.slice(0, 300) : ''

    const datum = vandaag()
    const dagRef = adminDb.collection('bezoeken').doc(datum)
    const update: Record<string, FirebaseFirestore.FieldValue> = {
      paginaweergaven: FieldValue.increment(1),
    }
    if (nieuweSessie) update.bezoekers = FieldValue.increment(1)
    await dagRef.set(update, { merge: true })

    if (nieuweSessie) {
      const domein = bronDomein(referrer)
      await adminDb.collection('bezoeken_bronnen').doc(domein).set(
        { aantal: FieldValue.increment(1) },
        { merge: true }
      )
    }

    return NextResponse.json({ ok: true })
  } catch {
    // Statistieken mogen nooit de site breken — stil falen.
    return NextResponse.json({ ok: true })
  }
}
