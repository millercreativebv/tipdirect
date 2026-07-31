'use client'

import { useState } from 'react'
import type { Vertalingen } from '@/lib/translations'

type Props = { t?: Vertalingen['faq'] }

const DEFAULT_T: Vertalingen['faq'] = {
  titel: 'Veelgestelde vragen',
  vragen: [
    { vraag: 'Voor welke beroepen is TipDirect geschikt?', antwoord: 'TipDirect is geschikt voor iedereen in de horeca en dienstensector die tips ontvangt: obers, barmannen, barista\'s, sommeliers, roomservice-medewerkers en andere horecaprofessionals. Zowel individueel als via een zakelijk account voor het volledige team.' },
    { vraag: 'Moet de klant een app installeren?', antwoord: 'Nee. De klant scant de QR-code met de gewone camera van zijn telefoon en betaalt in één tik via WERO, Apple Pay of bankkaart. Geen app, geen account, geen gedoe.' },
    { vraag: 'Hoe ontvang ik het geld?', antwoord: 'De tip wordt rechtstreeks op uw bankrekening gestort via Mollie. Uitbetalingen gebeuren automatisch door Mollie. U hoeft hier zelf niets voor te doen.' },
    { vraag: 'Hoeveel kost het?', antwoord: 'TipDirect heeft geen maandelijks abonnement. Per ontvangen tip wordt €0,50 in rekening gebracht als servicekosten, plus €0,32 Mollie-transactiekosten. In totaal dus €0,82 per transactie — volledig voor rekening van de ober of de zaak. De klant betaalt altijd precies het bedrag dat hij zelf heeft gekozen.' },
    { vraag: 'Is het veilig?', antwoord: 'Ja. Alle betalingen worden verwerkt door Mollie, gecertificeerd op PCI DSS niveau 1 — het hoogste beveiligingsniveau voor betalingsverkeer. TipDirect slaat zelf geen bankgegevens of betaalkaartinformatie op.' },
  ],
}

export default function FAQ({ t = DEFAULT_T }: Props) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="max-w-2xl mx-auto px-4 pb-24">
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">{t.titel}</h2>

      <div className="space-y-3">
        {t.vragen.map((item, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full px-5 py-4 flex items-center justify-between text-left"
            >
              <span className="font-semibold text-gray-900">{item.vraag}</span>
              <span className={`text-brand-500 text-lg transition-transform duration-200 ${open === i ? 'rotate-45' : ''}`}>+</span>
            </button>

            {open === i && (
              <div className="px-5 pb-5">
                <p className="text-gray-500 text-sm leading-relaxed">{item.antwoord}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
