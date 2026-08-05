'use client'

import { useState } from 'react'
import Image from 'next/image'

const VASTE_BEDRAGEN = [2, 3, 5, 10]
const COMPLIMENTEN_OPTIES = ['Uitstekende service', 'Zeer vriendelijk', 'Aanrader', 'Snelle bediening']

type OberData = {
  id: string
  naam: string
  foto_url: string | null
  voorstelling: string | null
  verhaal: string | null
  account_type: string
  bedrijf_id: string | null
}

type BedrijfData = {
  id: string
  naam: string
  logo_url: string | null
} | null

export default function BetaalFormulier({ ober, bedrijf }: { ober: OberData; bedrijf: BedrijfData }) {
  const [gekozenBedrag, setGekozenBedrag] = useState<number | null>(null)
  const [eigenBedrag, setEigenBedrag] = useState('')
  const [sterren, setSterren] = useState(0)
  const [complimenten, setComplimenten] = useState<string[]>([])
  const [boodschap, setBoodschap] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')

  const huidigBedrag = gekozenBedrag ?? (eigenBedrag ? parseFloat(eigenBedrag.replace(',', '.')) : null)

  function toggleCompliment(label: string) {
    setComplimenten(prev =>
      prev.includes(label) ? prev.filter(c => c !== label) : [...prev, label]
    )
  }

  async function betalen() {
    if (!huidigBedrag || huidigBedrag < 1) {
      setFout('Voer een bedrag in van minimaal €1,00')
      return
    }

    setBezig(true)
    setFout('')

    try {
      const res = await fetch('/api/betaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oberId: ober.id,
          bedragCenten: Math.round(huidigBedrag * 100),
          sterren: sterren || null,
          complimenten: complimenten.length > 0 ? complimenten : null,
          boodschap: boodschap.trim() || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setFout(data.fout ?? 'Er ging iets mis. Probeer het opnieuw.')
        setBezig(false)
        return
      }

      window.location.href = data.betaalUrl
    } catch {
      setFout('Er ging iets mis. Controleer je internetverbinding.')
      setBezig(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Ober profiel */}
        <div className="text-center mb-6">
          <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden bg-brand-100 flex items-center justify-center">
            {ober.foto_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ober.foto_url} alt={ober.naam} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl">👤</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{ober.naam}</h1>
          {ober.voorstelling ? (
            <p className="text-gray-500 text-sm mt-1 px-4">{ober.voorstelling}</p>
          ) : (
            <p className="text-gray-500 mt-1">Geef een tip via TipDirect</p>
          )}
        </div>

        {/* Story Behind the Smile */}
        {ober.verhaal && (
          <div className="bg-white border border-brand-100 rounded-2xl p-4 mb-6 text-center">
            <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-1">✨ Story Behind the Smile</p>
            <p className="text-gray-700 text-sm italic">&ldquo;{ober.verhaal}&rdquo;</p>
          </div>
        )}

        {/* Bedrag kiezen */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {VASTE_BEDRAGEN.map((bedrag) => (
            <button
              key={bedrag}
              onClick={() => { setGekozenBedrag(bedrag); setEigenBedrag('') }}
              className={`py-3 rounded-xl font-bold text-lg transition-all ${
                gekozenBedrag === bedrag
                  ? 'bg-brand-500 text-white shadow-md scale-105'
                  : 'bg-white text-gray-900 border-2 border-gray-200 hover:border-brand-500'
              }`}
            >
              €{bedrag}
            </button>
          ))}
        </div>

        {/* Eigen bedrag */}
        <div className="mb-6">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-lg">€</span>
            <input
              type="number"
              min="1"
              step="0.50"
              placeholder="Eigen bedrag"
              value={eigenBedrag}
              onChange={(e) => { setEigenBedrag(e.target.value); setGekozenBedrag(null) }}
              className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl text-lg focus:outline-none focus:border-brand-500 bg-white text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Sterren + complimenten + boodschap */}
        {huidigBedrag && huidigBedrag >= 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 space-y-5">
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Beoordeling (optioneel)</p>
              <div className="flex gap-1 justify-center">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setSterren(sterren === n ? 0 : n)}
                    className={`text-3xl transition-all ${n <= sterren ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-200'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Compliment geven</p>
              <div className="flex flex-wrap gap-2">
                {COMPLIMENTEN_OPTIES.map(label => (
                  <button
                    key={label}
                    onClick={() => toggleCompliment(label)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                      complimenten.includes(label)
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Boodschap (optioneel)</p>
              <textarea
                value={boodschap}
                onChange={(e) => setBoodschap(e.target.value.slice(0, 200))}
                rows={2}
                placeholder={`Laat een berichtje achter voor ${ober.naam}...`}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-500 bg-white text-gray-900 placeholder:text-gray-400 resize-none"
              />
              <p className="text-xs text-gray-400 text-right mt-0.5">{boodschap.length}/200</p>
            </div>
          </div>
        )}

        {/* Bedrag overzicht */}
        {huidigBedrag && huidigBedrag >= 1 && (
          <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4 text-sm shadow-sm">
            <div className="flex justify-between font-bold text-gray-900">
              <span>Tip voor {ober.naam}</span>
              <span>€{huidigBedrag.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        )}

        {fout && (
          <p className="text-red-500 text-sm text-center mb-3">{fout}</p>
        )}

        {/* Betaalknop */}
        <button
          onClick={betalen}
          disabled={bezig || !huidigBedrag || huidigBedrag < 1}
          className="w-full py-4 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-lg rounded-xl transition-all shadow-md disabled:shadow-none"
        >
          {bezig ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Doorsturen...
            </span>
          ) : (
            'Betaal via WERO / Apple Pay'
          )}
        </button>

        <div className="flex flex-col items-center mt-6 gap-2">
          {bedrijf?.logo_url && (
            <div className="flex items-center gap-2 mb-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bedrijf.logo_url} alt={bedrijf.naam} className="h-6 w-auto object-contain" />
              <span className="text-xs text-gray-400">{bedrijf.naam}</span>
            </div>
          )}
          <Image src="/logotd.png" alt="TipDirect" width={160} height={64} className="h-12 w-auto" />
          <p className="text-center text-xs text-gray-400">
            Veilig betalen via{' '}
            <a href="https://mollie.com" target="_blank" rel="noopener noreferrer" className="underline">
              Mollie
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
