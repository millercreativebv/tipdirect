'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase, type Ober } from '@/lib/supabase'

const VASTE_BEDRAGEN = [2, 3, 5, 10]

export default function BetaalPagina() {
  const { gebruikersnaam } = useParams<{ gebruikersnaam: string }>()
  const [ober, setOber] = useState<Ober | null>(null)
  const [laden, setLaden] = useState(true)
  const [gekozenBedrag, setGekozenBedrag] = useState<number | null>(null)
  const [eigenBedrag, setEigenBedrag] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')

  useEffect(() => {
    async function laadOber() {
      const { data, error } = await supabase
        .from('obers')
        .select('*')
        .eq('gebruikersnaam', gebruikersnaam)
        .eq('actief', true)
        .single()

      if (error || !data) {
        setOber(null)
      } else {
        setOber(data)
      }
      setLaden(false)
    }

    laadOber()
  }, [gebruikersnaam])

  const huidigBedrag = gekozenBedrag ?? (eigenBedrag ? parseFloat(eigenBedrag.replace(',', '.')) : null)

  async function betalen() {
    if (!huidigBedrag || huidigBedrag < 1) {
      setFout('Voer een bedrag in van minimaal €1,00')
      return
    }
    if (!ober) return

    setBezig(true)
    setFout('')

    try {
      const res = await fetch('/api/betaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oberId: ober.id,
          bedragCenten: Math.round(huidigBedrag * 100),
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

  if (laden) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!ober) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Niet gevonden</h1>
          <p className="text-gray-500">Deze pagina bestaat niet of is niet actief.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Ober profiel */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden bg-emerald-100 flex items-center justify-center">
            {ober.foto_url ? (
              <img src={ober.foto_url} alt={ober.naam} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl">👤</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{ober.naam}</h1>
          <p className="text-gray-500 mt-1">Geef een fooi via TipDirect</p>
        </div>

        {/* Bedrag kiezen */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {VASTE_BEDRAGEN.map((bedrag) => (
            <button
              key={bedrag}
              onClick={() => { setGekozenBedrag(bedrag); setEigenBedrag('') }}
              className={`py-3 rounded-xl font-bold text-lg transition-all ${
                gekozenBedrag === bedrag
                  ? 'bg-emerald-500 text-white shadow-md scale-105'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-emerald-500'
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
              className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl text-lg focus:outline-none focus:border-emerald-500 bg-white"
            />
          </div>
        </div>

        {/* Totaal overzicht */}
        {huidigBedrag && huidigBedrag >= 1 && (
          <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4 text-sm text-gray-600 shadow-sm">
            <div className="flex justify-between mb-1">
              <span>Fooi voor {ober.naam}</span>
              <span>€{huidigBedrag.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between mb-2 text-gray-400">
              <span>Servicekosten TipDirect</span>
              <span>€0,50</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 border-t pt-2">
              <span>Totaal</span>
              <span>€{(huidigBedrag + 0.50).toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        )}

        {/* Foutmelding */}
        {fout && (
          <p className="text-red-500 text-sm text-center mb-3">{fout}</p>
        )}

        {/* Betaalknop */}
        <button
          onClick={betalen}
          disabled={bezig || !huidigBedrag || huidigBedrag < 1}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-lg rounded-xl transition-all shadow-md disabled:shadow-none"
        >
          {bezig ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Doorsturen...
            </span>
          ) : (
            'Betalen via iDEAL / Apple Pay'
          )}
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          Veilig betalen via{' '}
          <a href="https://mollie.com" target="_blank" rel="noopener noreferrer" className="underline">
            Mollie
          </a>
          {' '}· Powered by TipDirect
        </p>
      </div>
    </div>
  )
}
