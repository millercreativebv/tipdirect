'use client'

import { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, getIdToken } from 'firebase/auth'
import { euro } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'

type Abonnement = {
  id: string
  naam: string
  email: string
  iban: string | null
  account_type: string
  telefoon: string | null
  adres_straat: string | null
  adres_postcode: string | null
  adres_stad: string | null
  adres_land: string | null
  btw_nummer: string | null
  statutaire_naam: string | null
  kvk: string | null
  status: 'pending' | 'actief' | 'vervallen'
  bedrag: number
  voldaan: number
  start_datum: string
  actief_sinds: string | null
  omzet_totaal: number
}

type Config = {
  abonnementsBedrag: number
  abonnementsBedragOber: number
  abonnementsBedragBedrijf: number
  millerCreativePercent: number
  belgianPartnerPercent: number
  marketingPercent: number
  belgianPartnerNaam: string
}

type UitbetalingGroep = {
  oberId: string
  naam: string
  email: string
  iban: string | null
  iban_naam: string | null
  betalingen: { id: string; bedrag: number; netto_klant: number; betaald_op: string }[]
  totaal: number
}

const STATUS_KLEUR: Record<string, string> = {
  actief: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-amber-100 text-amber-800',
  vervallen: 'bg-red-100 text-red-700',
}

type PartnerItem = {
  id: string
  naam: string
  email: string
  land: string
  iban: string | null
  actief: boolean
}

type Tab = 'abonnementen' | 'uitbetalingen' | 'partners' | 'instellingen'

function DetailRegel({ label, waarde, mono = false }: { label: string; waarde: string | null | undefined; mono?: boolean }) {
  if (!waarde) return null
  return (
    <div className="flex gap-2 mb-1">
      <span className="text-xs text-gray-400 flex-shrink-0 w-36">{label}</span>
      <span className={`text-xs text-gray-900 break-all ${mono ? 'font-mono' : ''}`}>{waarde}</span>
    </div>
  )
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('abonnementen')
  const [abonnementen, setAbonnementen] = useState<Abonnement[]>([])
  const [uitbetalingen, setUitbetalingen] = useState<UitbetalingGroep[]>([])
  const [config, setConfig] = useState<Config | null>(null)
  const [laden, setLaden] = useState(true)
  const [uitbLaden, setUitbLaden] = useState(false)
  const [toegangFout, setToegansFout] = useState(false)
  const [token, setToken] = useState('')
  const [configOpslaan, setConfigOpslaan] = useState(false)
  const [configOpgeslagen, setConfigOpgeslagen] = useState(false)
  const [nieuwBedrag, setNieuwBedrag] = useState('')
  const [nieuwBedragOber, setNieuwBedragOber] = useState('')
  const [nieuwBedragBedrijf, setNieuwBedragBedrijf] = useState('')
  const [filter, setFilter] = useState<'alle' | 'actief' | 'pending' | 'vervallen'>('alle')
  const [bezig, setBezig] = useState<string | null>(null)
  const [melding, setMelding] = useState('')
  const [cronBezig, setCronBezig] = useState(false)
  const [cronResultaat, setCronResultaat] = useState('')
  const [partners, setPartners] = useState<PartnerItem[]>([])
  const [partnerLaden, setPartnerLaden] = useState(false)
  const [nieuwPartnerNaam, setNieuwPartnerNaam] = useState('')
  const [nieuwPartnerEmail, setNieuwPartnerEmail] = useState('')
  const [nieuwPartnerIban, setNieuwPartnerIban] = useState('')
  const [partnerAanmakenBezig, setPartnerAanmakenBezig] = useState(false)
  const [partnerMelding, setPartnerMelding] = useState('')
  const [uitbPartnerBezig, setUitbPartnerBezig] = useState(false)
  const [uitbPartnerMelding, setUitbPartnerMelding] = useState('')
  const [activeerBezig, setActiveerBezig] = useState<string | null>(null)
  const [openDetail, setOpenDetail] = useState<string | null>(null)
  const [verwijderBezig, setVerwijderBezig] = useState<string | null>(null)
  const [verwijderBevestig, setVerwijderBevestig] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { window.location.href = '/inloggen'; return }

      const idToken = await getIdToken(user)
      setToken(idToken)

      const [abRes, cfRes] = await Promise.all([
        fetch('/api/admin/abonnementen', { headers: { Authorization: `Bearer ${idToken}` } }),
        fetch('/api/admin/config'),
      ])

      if (abRes.status === 403) { setToegansFout(true); setLaden(false); return }

      if (abRes.ok) setAbonnementen((await abRes.json()).abonnementen)
      if (cfRes.ok) {
        const data = await cfRes.json()
        setConfig(data)
        setNieuwBedrag((data.abonnementsBedrag / 100).toFixed(2).replace('.', ','))
        setNieuwBedragOber(((data.abonnementsBedragOber ?? data.abonnementsBedrag ?? 2500) / 100).toFixed(2).replace('.', ','))
        setNieuwBedragBedrijf(((data.abonnementsBedragBedrijf ?? 6000) / 100).toFixed(2).replace('.', ','))
      }
      setLaden(false)
    })
    return () => unsub()
  }, [])

  async function laadPartners(idToken: string) {
    setPartnerLaden(true)
    const res = await fetch('/api/admin/partner', { headers: { Authorization: `Bearer ${idToken}` } })
    if (res.ok) setPartners((await res.json()).partners)
    setPartnerLaden(false)
  }

  useEffect(() => {
    if (tab === 'partners' && token) laadPartners(token)
  }, [tab, token])

  async function partnerAanmaken(e: React.FormEvent) {
    e.preventDefault()
    setPartnerAanmakenBezig(true)
    setPartnerMelding('')
    const res = await fetch('/api/admin/partner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ naam: nieuwPartnerNaam, email: nieuwPartnerEmail, iban: nieuwPartnerIban, land: 'BE' }),
    })
    const data = await res.json()
    if (res.ok) {
      setPartnerMelding(`✅ Partner aangemaakt. Reset-link: ${data.resetLink}`)
      setNieuwPartnerNaam('')
      setNieuwPartnerEmail('')
      setNieuwPartnerIban('')
      laadPartners(token)
    } else {
      setPartnerMelding(`Fout: ${data.fout}`)
    }
    setPartnerAanmakenBezig(false)
  }

  async function uitbetalenPartner() {
    setUitbPartnerBezig(true)
    setUitbPartnerMelding('')
    const res = await fetch('/api/admin/uitbetalen-partner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({}),
    })
    const data = await res.json()
    setUitbPartnerMelding(data.verwerkt === 0
      ? 'Geen openstaand tegoed om uit te betalen.'
      : `${data.verwerkt} uitbetaling(en) geïnitieerd via Mollie.`)
    setUitbPartnerBezig(false)
  }

  async function laadUitbetalingen() {
    setUitbLaden(true)
    const res = await fetch('/api/admin/uitbetalingen', { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) setUitbetalingen((await res.json()).uitbetalingen)
    setUitbLaden(false)
  }

  useEffect(() => {
    if (tab === 'uitbetalingen' && token) laadUitbetalingen()
  }, [tab, token])

  async function markeerUitbetaald(groep: UitbetalingGroep) {
    setBezig(groep.oberId)
    setMelding('')
    const ids = groep.betalingen.map(b => b.id)
    const res = await fetch('/api/admin/uitbetalingen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ oberId: groep.oberId, betalingIds: ids }),
    })
    if (res.ok) {
      setMelding(`✅ ${groep.naam} gemarkeerd als uitbetaald (€${euro(groep.totaal)})`)
      await laadUitbetalingen()
    }
    setBezig(null)
  }

  async function voerCronUit() {
    setCronBezig(true)
    setCronResultaat('')
    const res = await fetch('/api/admin/cron', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setCronResultaat(data.aantalVervallen === 0
      ? 'Geen accounts vervallen.'
      : `${data.aantalVervallen} account(s) op vervallen gezet.`)
    setCronBezig(false)
  }

  async function activeerAccount(oberId: string) {
    setActiveerBezig(oberId)
    const res = await fetch('/api/admin/activeer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ oberId }),
    })
    if (res.ok) {
      setAbonnementen(prev => prev.map(a =>
        a.id === oberId ? { ...a, status: 'actief', voldaan: a.bedrag, actief_sinds: new Date().toISOString() } : a
      ))
    }
    setActiveerBezig(null)
  }

  async function verwijderAccount(oberId: string) {
    setVerwijderBezig(oberId)
    const res = await fetch('/api/admin/verwijder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ oberId }),
    })
    if (res.ok) {
      setAbonnementen(prev => prev.filter(a => a.id !== oberId))
      setOpenDetail(null)
    }
    setVerwijderBevestig(null)
    setVerwijderBezig(null)
  }

  function exporteerCsv() {
    const ct2eur = (ct: number) => (ct / 100).toFixed(2).replace('.', ',')
    const headers = [
      'Naam', 'Statutaire naam', 'E-mail', 'Telefoon',
      'Straat', 'Postcode', 'Stad', 'Land',
      'BTW-nummer', 'KvK / Ondernemingsnr.',
      'Account type', 'IBAN', 'Status', 'Abonnementsbedrag (€)', 'Actief sinds',
      'Omzet totaal (€)',
    ]
    const rijen = abonnementen.map(a => [
      a.naam,
      a.statutaire_naam ?? '',
      a.email,
      a.telefoon ?? '',
      a.adres_straat ?? '',
      a.adres_postcode ?? '',
      a.adres_stad ?? '',
      a.adres_land ?? '',
      a.btw_nummer ?? '',
      a.kvk ?? '',
      a.account_type,
      a.iban ?? '',
      a.status,
      ct2eur(a.bedrag),
      a.actief_sinds ? new Date(a.actief_sinds).toLocaleDateString('nl-NL') : '',
      ct2eur(a.omzet_totaal ?? 0),
    ])
    const csvInhoud = [headers, ...rijen]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
      .join('\n')
    const blob = new Blob(['﻿' + csvInhoud], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tipdirect-accounts-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function configOpslaanHandler(e: React.FormEvent) {
    e.preventDefault()
    setConfigOpslaan(true)
    setConfigOpgeslagen(false)
    const bedragOber = Math.round(parseFloat(nieuwBedragOber.replace(',', '.')) * 100)
    const bedragBedrijf = Math.round(parseFloat(nieuwBedragBedrijf.replace(',', '.')) * 100)
    await fetch('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        abonnementsBedragOber: bedragOber,
        abonnementsBedragBedrijf: bedragBedrijf,
        abonnementsBedrag: bedragOber, // backwards compat voor bestaande code
      }),
    })
    setConfigOpgeslagen(true)
    setConfigOpslaan(false)
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
          <p className="text-gray-500 mt-2">Dit scherm is alleen voor beheerders.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-brand-500 underline">Terug naar dashboard</Link>
        </div>
      </div>
    )
  }

  const gefilterd = filter === 'alle' ? abonnementen : abonnementen.filter(a => a.status === filter)
  const totaalActief = abonnementen.filter(a => a.status === 'actief').length
  const totaalPending = abonnementen.filter(a => a.status === 'pending').length
  const totaalVervallen = abonnementen.filter(a => a.status === 'vervallen').length
  const maandOmzet = totaalActief * (config?.abonnementsBedrag ?? 2999)
  const mcAandeel = Math.round(maandOmzet * (config?.millerCreativePercent ?? 42.5) / 100)
  const shAandeel = Math.round(maandOmzet * (config?.belgianPartnerPercent ?? 42.5) / 100)
  const marketingAandeel = maandOmzet - mcAandeel - shAandeel
  const openUitbetalingTotaal = uitbetalingen.reduce((s, u) => s + u.totaal, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logotd.png" alt="TipDirect" width={140} height={56} className="h-9 w-auto" />
            <span className="bg-brand-100 text-brand-700 text-xs font-bold px-2 py-1 rounded-full">Admin</span>
          </div>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600">← Dashboard</Link>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto mt-4 flex gap-1 bg-gray-100 p-1 rounded-xl">
          {([
            { id: 'abonnementen', label: 'Abonnementen' },
            { id: 'uitbetalingen', label: `Uitbetalingen${uitbetalingen.length > 0 ? ` (${uitbetalingen.length})` : ''}` },
            { id: 'partners', label: 'Partners' },
            { id: 'instellingen', label: 'Instellingen' },
          ] as { id: Tab; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-5">

        {/* ── TAB: ABONNEMENTEN ── */}
        {tab === 'abonnementen' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Actief', waarde: totaalActief, kleur: 'text-emerald-600' },
                { label: 'Pending', waarde: totaalPending, kleur: 'text-amber-600' },
                { label: 'Vervallen', waarde: totaalVervallen, kleur: 'text-red-500' },
                { label: 'Totaal', waarde: abonnementen.length, kleur: 'text-gray-900' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl p-4 text-center shadow-sm">
                  <p className={`text-3xl font-bold ${s.kleur}`}>{s.waarde}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4">Maandelijkse omzet (actieve abonnementen)</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Miller Creative', bedrag: mcAandeel, pct: config?.millerCreativePercent ?? 42.5 },
                  { label: config?.belgianPartnerNaam ?? 'Strictly Hospitality', bedrag: shAandeel, pct: config?.belgianPartnerPercent ?? 42.5 },
                  { label: 'Marketing', bedrag: marketingAandeel, pct: config?.marketingPercent ?? 15 },
                ].map(r => (
                  <div key={r.label} className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-xl font-bold text-gray-900">€{euro(r.bedrag)}</p>
                    <p className="text-xs text-gray-500 mt-1">{r.label}</p>
                    <p className="text-xs text-gray-400">{r.pct}%</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">Totale maandomzet ({totaalActief} actief)</p>
                <p className="font-bold text-gray-900">€{euro(maandOmzet)}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                <h2 className="font-bold text-gray-900">Abonnementen</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex gap-1">
                    {(['alle', 'actief', 'pending', 'vervallen'] as const).map(f => (
                      <button key={f} onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                          filter === f ? 'bg-brand-500 text-white' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >{f}</button>
                    ))}
                  </div>
                  <button
                    onClick={exporteerCsv}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-all"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    CSV
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {gefilterd.length === 0
                  ? <div className="p-8 text-center text-gray-400">Geen resultaten</div>
                  : gefilterd.map(a => (
                    <div key={a.id}>
                      {/* Hoofdrij */}
                      <button
                        type="button"
                        onClick={() => setOpenDetail(openDetail === a.id ? null : a.id)}
                        className="w-full px-4 py-3 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 truncate">{a.naam}</p>
                            {a.account_type === 'bedrijf' && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium flex-shrink-0">Bedrijf</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 truncate">{a.email}</p>
                        </div>
                        <div className="text-right flex-shrink-0 space-y-1">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_KLEUR[a.status]}`}>{a.status}</span>
                          {a.status === 'pending' && (
                            <>
                              <p className="text-xs text-gray-500">€{euro(a.voldaan)} / €{euro(a.bedrag)}</p>
                              <div className="w-20 bg-gray-200 rounded-full h-1.5 ml-auto">
                                <div className="h-1.5 bg-brand-500 rounded-full" style={{ width: `${Math.min(100, (a.voldaan / a.bedrag) * 100)}%` }} />
                              </div>
                            </>
                          )}
                          {a.status === 'actief' && a.actief_sinds && (
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(a.actief_sinds).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                            </p>
                          )}
                        </div>
                        <span className="text-gray-300 flex-shrink-0 text-sm">{openDetail === a.id ? '▲' : '▼'}</span>
                      </button>

                      {/* Detail uitklap */}
                      {openDetail === a.id && (
                        <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">

                            {/* Contactgegevens */}
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Contactgegevens</p>
                              <DetailRegel label="E-mail" waarde={a.email} />
                              <DetailRegel label="Telefoon" waarde={a.telefoon} />
                              <DetailRegel label="IBAN" waarde={a.iban} mono />
                            </div>

                            {/* Adres */}
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Adres</p>
                              <DetailRegel label="Straat" waarde={a.adres_straat} />
                              <DetailRegel label="Postcode" waarde={a.adres_postcode} />
                              <DetailRegel label="Stad" waarde={a.adres_stad} />
                              <DetailRegel label="Land" waarde={a.adres_land} />
                            </div>

                            {/* Fiscaal */}
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Fiscaal</p>
                              <DetailRegel label="BTW-nummer" waarde={a.btw_nummer} mono />
                              {a.account_type === 'bedrijf' && (
                                <>
                                  <DetailRegel label="KvK / Ondernemingsnr." waarde={a.kvk} mono />
                                  <DetailRegel label="Statutaire naam" waarde={a.statutaire_naam} />
                                </>
                              )}
                            </div>

                            {/* Abonnement */}
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Abonnement & omzet</p>
                              <DetailRegel label="Type" waarde={a.account_type} />
                              <DetailRegel label="Status" waarde={a.status} />
                              <DetailRegel label="Abonnementsbedrag" waarde={`€${euro(a.bedrag)}`} />
                              {a.actief_sinds && (
                                <DetailRegel label="Actief sinds" waarde={new Date(a.actief_sinds).toLocaleDateString('nl-NL')} />
                              )}
                              <DetailRegel label="Omzet totaal" waarde={`€${euro(a.omzet_totaal ?? 0)}`} />
                            </div>
                          </div>

                          {/* Activeer knop voor pending */}
                          <div className="mt-4 flex items-center gap-3 flex-wrap">
                            {a.status === 'pending' && (
                              <button
                                onClick={() => activeerAccount(a.id)}
                                disabled={activeerBezig === a.id}
                                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-bold rounded-xl transition-all"
                              >
                                {activeerBezig === a.id ? 'Bezig...' : 'Account activeren'}
                              </button>
                            )}

                            {verwijderBevestig === a.id ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-red-600 font-medium">Zeker weten?</span>
                                <button
                                  onClick={() => verwijderAccount(a.id)}
                                  disabled={verwijderBezig === a.id}
                                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 text-white text-sm font-bold rounded-xl transition-all"
                                >
                                  {verwijderBezig === a.id ? 'Verwijderen...' : 'Ja, verwijderen'}
                                </button>
                                <button
                                  onClick={() => setVerwijderBevestig(null)}
                                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                                >
                                  Annuleren
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setVerwijderBevestig(a.id)}
                                className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium rounded-xl transition-all"
                              >
                                Account verwijderen
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                }
              </div>
            </div>
          </>
        )}

        {/* ── TAB: UITBETALINGEN ── */}
        {tab === 'uitbetalingen' && (
          <>
            {melding && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <p className="text-emerald-700 text-sm font-medium">{melding}</p>
              </div>
            )}

            {uitbLaden ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : uitbetalingen.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <p className="text-3xl mb-3">✅</p>
                <p className="font-semibold text-gray-900">Geen openstaande uitbetalingen</p>
                <p className="text-sm text-gray-400 mt-1">Alle klant-fooien zijn uitbetaald.</p>
              </div>
            ) : (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-amber-900">Openstaand totaal</p>
                    <p className="text-sm text-amber-700">{uitbetalingen.length} klant(en) wachten op uitbetaling</p>
                  </div>
                  <p className="text-2xl font-bold text-amber-900">€{euro(openUitbetalingTotaal)}</p>
                </div>

                <div className="space-y-3">
                  {uitbetalingen.map(u => (
                    <div key={u.oberId} className="bg-white rounded-xl shadow-sm overflow-hidden">
                      <div className="p-4 flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900">{u.naam}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                          {u.iban ? (
                            <div className="mt-2 bg-gray-50 rounded-lg p-2">
                              <p className="text-xs text-gray-500">Rekeningnummer</p>
                              <p className="font-mono text-sm text-gray-900 font-medium">{u.iban}</p>
                              {u.iban_naam && <p className="text-xs text-gray-500 mt-0.5">t.n.v. {u.iban_naam}</p>}
                            </div>
                          ) : (
                            <div className="mt-2 bg-red-50 rounded-lg p-2">
                              <p className="text-xs text-red-600 font-medium">Geen IBAN ingesteld</p>
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mt-2">{u.betalingen.length} tip(s)</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-2xl font-bold text-gray-900">€{euro(u.totaal)}</p>
                          <button
                            onClick={() => markeerUitbetaald(u)}
                            disabled={bezig === u.oberId || !u.iban}
                            className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-bold rounded-xl transition-all"
                          >
                            {bezig === u.oberId ? 'Bezig...' : 'Markeer uitbetaald'}
                          </button>
                        </div>
                      </div>
                      <div className="border-t border-gray-50 divide-y divide-gray-50">
                        {u.betalingen.slice(0, 5).map(b => (
                          <div key={b.id} className="px-4 py-2 flex items-center justify-between">
                            <p className="text-xs text-gray-400">
                              {new Date(b.betaald_op).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-xs font-medium text-gray-700">€{euro(b.netto_klant)}</p>
                          </div>
                        ))}
                        {u.betalingen.length > 5 && (
                          <div className="px-4 py-2">
                            <p className="text-xs text-gray-400">+ {u.betalingen.length - 5} meer</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── TAB: PARTNERS ── */}
        {tab === 'partners' && (
          <>
            {/* Nieuw partner aanmaken */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4">Partner toevoegen</h2>
              <form onSubmit={partnerAanmaken} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Naam</label>
                    <input type="text" required value={nieuwPartnerNaam} onChange={e => setNieuwPartnerNaam(e.target.value)}
                      placeholder="Strictly Hospitality"
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 text-sm text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">E-mail</label>
                    <input type="email" required value={nieuwPartnerEmail} onChange={e => setNieuwPartnerEmail(e.target.value)}
                      placeholder="info@partner.be"
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 text-sm text-gray-900" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">IBAN (uitbetaalrekening)</label>
                  <input type="text" value={nieuwPartnerIban} onChange={e => setNieuwPartnerIban(e.target.value.toUpperCase())}
                    placeholder="BE00 0000 0000 0000"
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 text-sm font-mono text-gray-900" />
                </div>
                <button type="submit" disabled={partnerAanmakenBezig}
                  className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 text-white font-bold rounded-xl transition-all">
                  {partnerAanmakenBezig ? 'Aanmaken...' : 'Partner aanmaken'}
                </button>
              </form>
              {partnerMelding && (
                <div className="mt-3 bg-gray-50 rounded-xl p-3">
                  <p className="text-sm text-gray-700 break-all">{partnerMelding}</p>
                </div>
              )}
            </div>

            {/* Uitbetalen */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-1">Automatische uitbetaling</h2>
              <p className="text-sm text-gray-500 mb-4">
                Betaalt alle openstaande partner-tegoeden uit via Mollie bankoverschrijving.
                Draait automatisch elke maand via cron — of handmatig hieronder.
              </p>
              <button onClick={uitbetalenPartner} disabled={uitbPartnerBezig}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 text-white font-bold rounded-xl transition-all">
                {uitbPartnerBezig ? 'Bezig...' : 'Nu uitbetalen'}
              </button>
              {uitbPartnerMelding && <p className="text-sm text-gray-600 mt-3">{uitbPartnerMelding}</p>}
            </div>

            {/* Partnerlijst */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Actieve partners</h2>
              </div>
              {partnerLaden ? (
                <div className="p-8 flex justify-center">
                  <div className="w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : partners.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">Nog geen partners aangemaakt.</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {partners.map(p => (
                    <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{p.naam}</p>
                        <p className="text-xs text-gray-400">{p.email} · {p.land}</p>
                        {p.iban && <p className="text-xs font-mono text-gray-400 mt-0.5">{p.iban}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.actief ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {p.actief ? 'Actief' : 'Inactief'}
                        </span>
                        <a href={`/registreer?partner=${p.id}`} target="_blank"
                          className="text-xs text-brand-500 hover:underline">
                          Referral-link
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── TAB: INSTELLINGEN ── */}
        {tab === 'instellingen' && (
          <>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-1">Abonnementstarieven</h2>
              <p className="text-xs text-gray-400 mb-4">Geldt voor nieuwe abonnementen. Bestaande behouden hun oorspronkelijke bedrag.</p>
              <form onSubmit={configOpslaanHandler} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Individuele ober</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">€</span>
                      <input
                        type="text"
                        value={nieuwBedragOber}
                        onChange={(e) => setNieuwBedragOber(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 text-gray-900"
                        placeholder="25,00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bedrijf / uitbater</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">€</span>
                      <input
                        type="text"
                        value={nieuwBedragBedrijf}
                        onChange={(e) => setNieuwBedragBedrijf(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 text-gray-900"
                        placeholder="60,00"
                      />
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={configOpslaan}
                  className="px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all">
                  {configOpslaan ? 'Opslaan...' : 'Tarieven opslaan'}
                </button>
                {configOpgeslagen && <p className="text-emerald-600 text-sm">Opgeslagen.</p>}
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-1">30-dagenregel</h2>
              <p className="text-sm text-gray-500 mb-4">
                Accounts die langer dan 30 dagen pending zijn zonder fooien te hebben ontvangen worden op vervallen gezet. Voer dit dagelijks uit, of stel een automatische cron in.
              </p>
              <button
                onClick={voerCronUit}
                disabled={cronBezig}
                className="px-5 py-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 text-white font-bold rounded-xl transition-all"
              >
                {cronBezig ? 'Bezig...' : 'Nu uitvoeren'}
              </button>
              {cronResultaat && <p className="text-sm text-gray-600 mt-3">{cronResultaat}</p>}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
