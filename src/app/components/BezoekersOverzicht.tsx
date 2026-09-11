'use client'

import { useEffect, useState } from 'react'

type BezoekData = {
  vandaag: number
  week: number
  maand: number
  totaal: number
  totaalBezoekers: number
  dagen: { datum: string; paginaweergaven: number; bezoekers: number }[]
  bronnen: { domein: string; aantal: number }[]
}

// Herbruikbaar bezoekersstatistieken-overzicht (landingspagina) —
// gebruikt op zowel het admin- als het partnerdashboard.
export default function BezoekersOverzicht({ token, apiPath }: { token: string; apiPath: string }) {
  const [data, setData] = useState<BezoekData | null>(null)
  const [laden, setLaden] = useState(false)
  const [fout, setFout] = useState(false)

  async function laad() {
    setLaden(true)
    setFout(false)
    const res = await fetch(apiPath, { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) setData(await res.json())
    else setFout(true)
    setLaden(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- eenmalig laden zodra het token bekend is
    if (token && !data) laad()
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  if (fout && !laden) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <p className="text-4xl mb-3">⚠️</p>
        <p className="font-semibold text-gray-700">Kon bezoekersstatistieken niet laden</p>
        <button onClick={() => laad()} className="mt-4 text-xs text-brand-500 hover:text-brand-700 font-medium">
          ↺ Opnieuw proberen
        </button>
      </div>
    )
  }

  if (laden || !data) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400 -mt-1">Bezoekers van de landingspagina (tipdirect.be)</p>

      {/* Hoofdcijfers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-400 font-medium mb-1">Vandaag</p>
          <p className="text-2xl font-bold text-gray-900">{data.vandaag.toLocaleString('nl-BE')}</p>
          <p className="text-xs text-gray-400 mt-1">paginaweergaven</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-400 font-medium mb-1">Laatste 7 dagen</p>
          <p className="text-2xl font-bold text-gray-900">{data.week.toLocaleString('nl-BE')}</p>
          <p className="text-xs text-gray-400 mt-1">paginaweergaven</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-400 font-medium mb-1">Laatste 30 dagen</p>
          <p className="text-2xl font-bold text-gray-900">{data.maand.toLocaleString('nl-BE')}</p>
          <p className="text-xs text-gray-400 mt-1">paginaweergaven</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-400 font-medium mb-1">Totaal</p>
          <p className="text-2xl font-bold text-gray-900">{data.totaal.toLocaleString('nl-BE')}</p>
          <p className="text-xs text-gray-400 mt-1">{data.totaalBezoekers.toLocaleString('nl-BE')} unieke bezoeken</p>
        </div>
      </div>

      {/* Bezoekers per dag */}
      {data.dagen.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">Paginaweergaven per dag (laatste 30 dagen)</h2>
          <div className="space-y-2">
            {[...data.dagen].reverse().map(({ datum, paginaweergaven }) => {
              const maxWeergaven = Math.max(...data.dagen.map(d => d.paginaweergaven), 1)
              const breedte = Math.round((paginaweergaven / maxWeergaven) * 100)
              const datumLabel = new Date(datum + 'T00:00:00').toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })
              return (
                <div key={datum} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-16 flex-shrink-0">{datumLabel}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-brand-500 h-2 rounded-full transition-all" style={{ width: `${breedte}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-10 text-right">{paginaweergaven}</span>
                </div>
              )
            })}
          </div>
          <button onClick={() => laad()} className="mt-4 text-xs text-brand-500 hover:text-brand-700 font-medium">
            ↺ Vernieuwen
          </button>
        </div>
      )}

      {/* Populairste bronnen */}
      {data.bronnen.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">Populairste bronnen</h2>
          <div className="space-y-2">
            {data.bronnen.map(({ domein, aantal }) => (
              <div key={domein} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{domein === 'direct' ? 'Direct (geen verwijzer)' : domein}</span>
                <span className="font-semibold text-gray-900">{aantal.toLocaleString('nl-BE')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.totaal === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-4xl mb-3">📈</p>
          <p className="font-semibold text-gray-700">Nog geen bezoekers geregistreerd</p>
          <p className="text-sm text-gray-400 mt-1">Zodra bezoekers de landingspagina openen verschijnen ze hier.</p>
        </div>
      )}
    </div>
  )
}
