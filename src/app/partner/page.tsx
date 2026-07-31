'use client'

import { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, getIdToken, signOut } from 'firebase/auth'
import { euro } from '@/lib/utils'
import Image from 'next/image'

type PartnerData = {
  partner: { naam: string; email: string; land: string; iban: string | null }
  accounts: { totaal: number; actief: number; pending: number; vervallen: number }
  openTegoed: number
  tegoedLijst: {
    id: string
    maand: string
    bedrag: number
    status: 'open' | 'uitbetaald'
    uitbetaald_op: string | null
  }[]
}

export default function PartnerDashboard() {
  const [data, setData] = useState<PartnerData | null>(null)
  const [laden, setLaden] = useState(true)
  const [toegangFout, setToegansFout] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { window.location.href = '/inloggen'; return }

      const token = await getIdToken(user)
      const res = await fetch('/api/partner', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 403) { setToegansFout(true); setLaden(false); return }
      if (res.ok) setData(await res.json())
      setLaden(false)
    })
    return () => unsub()
  }, [])

  async function uitloggen() {
    await signOut(auth)
    window.location.href = '/'
  }

  if (laden) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (toegangFout) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-4xl mb-4">🔒</p>
          <p className="text-xl font-bold text-gray-900">Geen toegang</p>
          <p className="text-gray-500 mt-2">Dit scherm is alleen voor TipDirect-partners.</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { partner, accounts, openTegoed, tegoedLijst } = data

  const maandNamen: Record<string, string> = {
    '01': 'januari', '02': 'februari', '03': 'maart', '04': 'april',
    '05': 'mei', '06': 'juni', '07': 'juli', '08': 'augustus',
    '09': 'september', '10': 'oktober', '11': 'november', '12': 'december',
  }

  function maandLabel(maand: string) {
    const [jaar, m] = maand.split('-')
    return `${maandNamen[m] ?? m} ${jaar}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logotd.png" alt="TipDirect" width={140} height={56} className="h-9 w-auto" />
            <span className="bg-brand-100 text-brand-700 text-xs font-bold px-2 py-1 rounded-full">Partner</span>
          </div>
          <button onClick={uitloggen} className="text-sm text-gray-400 hover:text-gray-600">Uitloggen</button>
        </div>
        <div className="max-w-lg mx-auto mt-3">
          <p className="font-bold text-gray-900">{partner.naam}</p>
          <p className="text-sm text-gray-400">{partner.email}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">

        {/* Open tegoed banner */}
        {openTegoed > 0 && (
          <div className="bg-brand-500 rounded-xl p-4 text-white">
            <p className="text-sm opacity-80">Openstaand tegoed</p>
            <p className="text-3xl font-bold mt-1">€{euro(openTegoed)}</p>
            <p className="text-sm opacity-70 mt-1">Wordt automatisch uitbetaald aan het einde van de maand</p>
          </div>
        )}

        {/* Account stats */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">Aangebrachte accounts</h2>
          <div className="grid grid-cols-4 gap-3 text-center">
            {[
              { label: 'Totaal', waarde: accounts.totaal, kleur: 'text-gray-900' },
              { label: 'Actief', waarde: accounts.actief, kleur: 'text-emerald-600' },
              { label: 'Pending', waarde: accounts.pending, kleur: 'text-amber-600' },
              { label: 'Vervallen', waarde: accounts.vervallen, kleur: 'text-red-500' },
            ].map(s => (
              <div key={s.label}>
                <p className={`text-2xl font-bold ${s.kleur}`}>{s.waarde}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Actieve accounts genereren elk maand abonnementsinkomsten.
              Jouw aandeel wordt automatisch berekend en uitbetaald.
            </p>
          </div>
        </div>

        {/* Uitbetalingshistorie */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Uitbetalingsoverzicht</h2>
          </div>

          {tegoedLijst.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400 text-sm">Nog geen uitbetalingen. Zodra de eerste accounts actief zijn, verschijnt hier het overzicht.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {tegoedLijst.map((t) => (
                <div key={t.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{maandLabel(t.maand)}</p>
                    {t.uitbetaald_op && (
                      <p className="text-xs text-gray-400">
                        Uitbetaald op {new Date(t.uitbetaald_op).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">€{euro(t.bedrag)}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      t.status === 'uitbetaald'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {t.status === 'uitbetaald' ? 'Uitbetaald' : 'Openstaand'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* IBAN info */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🏦</span>
            <h2 className="font-semibold text-gray-900">Uitbetaalrekening</h2>
          </div>
          {partner.iban ? (
            <p className="text-sm font-mono text-gray-700">{partner.iban}</p>
          ) : (
            <p className="text-sm text-red-500">Nog geen IBAN ingesteld — neem contact op met TipDirect.</p>
          )}
        </div>

      </div>
    </div>
  )
}
