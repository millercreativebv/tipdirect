'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Vertalingen } from '@/lib/translations'

type Props = { t?: Vertalingen['calculator'] }

const DEFAULT_T: Vertalingen['calculator'] = {
  titel: 'Hoeveel kunt u met TipDirect verdienen?',
  subtitel: 'Beweeg de schuiven en bereken je mogelijke inkomsten in real-time.',
  klantenLabel: 'Klanten die een tip geven per dag',
  bedragLabel: 'Gemiddeld tipbedrag',
  werkdagenLabel: 'Werkdagen per maand',
  ontvangtPerMaand: 'U ontvangt elke maand',
  perWerkdag: 'Per werkdag',
  drinkgeld: 'Tip',
  kosten: 'Kosten (× €0,82)',
  nettoPerDag: 'Netto per dag',
  werkdagenPerMaand: 'werkdagen per maand',
  gestort: 'Gestort op uw IBAN',
  perDag: 'dag',
  perWeek: 'week',
  cta: 'Ik wil deze inkomsten →',
  disclaimer: 'Schatting op basis van uw parameters. Werkelijke inkomsten variëren naargelang uw activiteit.',
}

export default function EarningsCalculator({ t = DEFAULT_T }: Props) {
  const [klantenPerDag, setKlantenPerDag] = useState(11)
  const [gemiddeldBedrag, setGemiddeldBedrag] = useState(4)
  const [werkdagenPerMaand, setWerkdagenPerMaand] = useState(20)

  const TIPDIRECT_FEE = 0.50
  const MOLLIE_FEE = 0.32

  const drinkgeldPerDag = klantenPerDag * gemiddeldBedrag
  const tipdirectFeePerDag = klantenPerDag * TIPDIRECT_FEE
  const mollieFeePerDag = klantenPerDag * MOLLIE_FEE
  const totaleKostenPerDag = tipdirectFeePerDag + mollieFeePerDag
  const nettoPerDag = drinkgeldPerDag - totaleKostenPerDag

  const totaalDrinkgeld = drinkgeldPerDag * werkdagenPerMaand
  const totaalTipdirectFee = tipdirectFeePerDag * werkdagenPerMaand
  const totaalMollieFee = mollieFeePerDag * werkdagenPerMaand
  const netto = nettoPerDag * werkdagenPerMaand
  const perWeek = nettoPerDag * 5

  function format(bedrag: number) {
    return bedrag.toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  }

  return (
    <section className="max-w-4xl mx-auto px-4 pb-24">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.titel}</h2>
        <p className="text-gray-500">{t.subtitel}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-8">

          {/* Schuifregelaars */}
          <div className="flex-1 space-y-8">

            {/* Klanten per dag */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="font-semibold text-gray-800">{t.klantenLabel}</label>
                <span className="text-2xl font-bold text-brand-500">{klantenPerDag}</span>
              </div>
              <input
                type="range" min={1} max={80} value={klantenPerDag}
                onChange={e => setKlantenPerDag(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1</span><span>40</span><span>80</span>
              </div>
            </div>

            {/* Gemiddeld bedrag */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="font-semibold text-gray-800">{t.bedragLabel}</label>
                <span className="text-2xl font-bold text-brand-500">€{gemiddeldBedrag.toFixed(2).replace('.', ',')}</span>
              </div>
              <input
                type="range" min={0.5} max={10} step={0.5} value={gemiddeldBedrag}
                onChange={e => setGemiddeldBedrag(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>€0,50</span><span>€5</span><span>€10</span>
              </div>
            </div>

            {/* Werkdagen */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="font-semibold text-gray-800">{t.werkdagenLabel}</label>
                <span className="text-2xl font-bold text-brand-500">{werkdagenPerMaand}</span>
              </div>
              <input
                type="range" min={4} max={30} value={werkdagenPerMaand}
                onChange={e => setWerkdagenPerMaand(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>4</span><span>17</span><span>30</span>
              </div>
            </div>
          </div>

          {/* Resultaat */}
          <div className="sm:w-72 bg-brand-50 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{t.ontvangtPerMaand}</p>
              <p className="text-5xl font-bold text-brand-500 mb-6">€ {format(netto)}</p>

              <div className="bg-white rounded-xl p-4 space-y-2.5 text-sm mb-4">
                <div className="flex justify-between text-gray-400 text-xs uppercase tracking-wide pb-1">
                  <span>{t.perWerkdag} ({klantenPerDag} tips)</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t.drinkgeld}</span>
                  <span className="font-medium text-gray-900">€ {drinkgeldPerDag.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>{t.kosten}</span>
                  <span>− € {totaleKostenPerDag.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-700 border-t pt-2.5">
                  <span>{t.nettoPerDag}</span>
                  <span>€ {nettoPerDag.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-xs border-t pt-2.5">
                  <span>× {werkdagenPerMaand} {t.werkdagenPerMaand}</span>
                </div>
                <div className="flex justify-between font-bold text-brand-600 pt-1">
                  <span>{t.gestort}</span>
                  <span>€ {format(netto)}</span>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Dat is <strong className="text-gray-700">€{format(nettoPerDag)}/{t.perDag}</strong> · <strong className="text-gray-700">€{format(perWeek)}/{t.perWeek}</strong>
              </p>
            </div>

            <div className="mt-6">
              <Link
                href="/registreer"
                className="block w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all text-center"
              >
                {t.cta}
              </Link>
              <p className="text-xs text-gray-400 text-center mt-3">
                {t.disclaimer}
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
