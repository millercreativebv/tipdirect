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

type PartnerTegoed = {
  id: string
  maand: string
  bedrag: number
  status: 'open' | 'uitbetaald'
  uitbetaald_op: string | null
}

type PartnerItem = {
  id: string
  naam: string
  email: string
  land: string
  iban: string | null
  actief: boolean
  tegoed_open: number
  tegoed_totaal: number
  tegoed_lijst: PartnerTegoed[]
}

type KaartOrder = {
  id: string
  naam: string
  account_type: string
  aantal: number
  type: 'inclusief' | 'bijbestelling' | 'toewijzing'
  status: 'aangevraagd' | 'wacht_op_voorraad' | 'in_productie' | 'verzonden' | 'geleverd'
  set_id?: string | null
  codes: string[]
  track_trace: string | null
  aangemaakt_op: string
  verzonden_op: string | null
}

type Tab = 'abonnementen' | 'uitbetalingen' | 'partners' | 'kaarten' | 'instellingen'

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
  const [commissieBevestig, setCommissieBevestig] = useState<string | null>(null)
  const [commissieBezig, setCommissieBezig] = useState<string | null>(null)
  const [kaartOrders, setKaartOrders] = useState<KaartOrder[]>([])
  const [kaartOrdersLaden, setKaartOrdersLaden] = useState(false)
  const [kaartOrderFilter, setKaartOrderFilter] = useState<string>('alle')
  const [kaartVoorraad, setKaartVoorraad] = useState<{ vrij_bedrijf: number; vrij_individueel: number } | null>(null)
  const [kaartSets, setKaartSets] = useState<{ id: string; type: string; set_nummer: number; codes: string[]; urls: string[]; status: string; aangemaakt_op: string }[]>([])
  const [kaartGenereerAantal, setKaartGenereerAantal] = useState('100')
  const [kaartGenereerType, setKaartGenereerType] = useState<'bedrijf' | 'individueel'>('bedrijf')
  const [kaartGenereerBezig, setKaartGenereerBezig] = useState(false)
  const [kaartMelding, setKaartMelding] = useState('')
  const [kaartOrderBezig, setKaartOrderBezig] = useState<string | null>(null)
  const [kaartTrackTrace, setKaartTrackTrace] = useState<Record<string, string>>({})
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

  async function commissieVoldaan(partnerId: string) {
    setCommissieBezig(partnerId)
    setCommissieBevestig(null)
    const res = await fetch('/api/admin/partner-betaald', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ partnerId }),
    })
    const data = await res.json()
    if (res.ok) {
      const bedragEuro = (data.bedrag / 100).toFixed(2).replace('.', ',')
      setUitbPartnerMelding(`✅ €${bedragEuro} gemarkeerd als uitbetaald (${data.maanden} maand${data.maanden !== 1 ? 'en' : ''}).`)
      await laadPartners(token)
    } else {
      setUitbPartnerMelding(`Fout: ${data.fout}`)
    }
    setCommissieBezig(null)
  }

  function downloadPartnerCsv(partner: PartnerItem) {
    const maandNamen: Record<string, string> = {
      '01': 'januari', '02': 'februari', '03': 'maart', '04': 'april',
      '05': 'mei', '06': 'juni', '07': 'juli', '08': 'augustus',
      '09': 'september', '10': 'oktober', '11': 'november', '12': 'december',
    }
    const rijen: string[][] = [
      ['Maand', 'Commissie (€)', 'Status', 'Uitbetaald op'],
      ...partner.tegoed_lijst.map(t => {
        const [jaar, m] = t.maand.split('-')
        return [
          `${maandNamen[m] ?? m} ${jaar}`,
          (t.bedrag / 100).toFixed(2).replace('.', ','),
          t.status === 'uitbetaald' ? 'Uitbetaald' : 'Openstaand',
          t.uitbetaald_op
            ? new Date(t.uitbetaald_op).toLocaleDateString('nl-NL')
            : '',
        ]
      }),
    ]
    const csv = rijen.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `commissie-${partner.naam.replace(/\s+/g, '-').toLowerCase()}.csv`
    a.click()
    URL.revokeObjectURL(url)
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

  async function laadKaartOrders(statusFilter = kaartOrderFilter) {
    setKaartOrdersLaden(true)
    const [ordersRes, voorraadRes] = await Promise.all([
      fetch(`/api/admin/kaart-orders?status=${statusFilter}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/admin/kaart-codes?filter=alle', { headers: { Authorization: `Bearer ${token}` } }),
    ])
    if (ordersRes.ok) setKaartOrders((await ordersRes.json()).orders)
    if (voorraadRes.ok) {
      const d = await voorraadRes.json()
      setKaartVoorraad({ vrij_bedrijf: d.vrij_bedrijf, vrij_individueel: d.vrij_individueel })
      setKaartSets(d.sets ?? [])
    }
    setKaartOrdersLaden(false)
  }

  useEffect(() => {
    if (tab === 'kaarten' && token) laadKaartOrders()
  }, [tab, token]) // eslint-disable-line react-hooks/exhaustive-deps

  async function genereerKaartCodes() {
    setKaartGenereerBezig(true)
    setKaartMelding('')
    const res = await fetch('/api/admin/kaart-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ aantal: parseInt(kaartGenereerAantal), type: kaartGenereerType }),
    })
    const data = await res.json()
    if (res.ok) {
      setKaartMelding(`✅ ${data.aangemaakt} sets aangemaakt (${kaartGenereerType})`)
      await laadKaartOrders()
    } else {
      setKaartMelding(`Fout: ${data.fout}`)
    }
    setKaartGenereerBezig(false)
  }

  async function downloadVrijeCodes() {
    setKaartMelding('Sets ophalen...')
    const res = await fetch('/api/admin/kaart-codes?filter=vrij', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) { setKaartMelding('Ophalen mislukt.'); return }
    const data = await res.json()
    const sets: { id: string; type: string; codes: string[]; urls: string[] }[] = data.sets
    if (!sets.length) { setKaartMelding('Geen vrije sets gevonden.'); return }

    // Maximaal aantal codes per set bepalen (voor breedte CSV)
    const maxCodes = Math.max(...sets.map(s => s.codes.length))
    const codeHeaders = Array.from({ length: maxCodes }, (_, i) => [`Code ${i + 1}`, `URL ${i + 1}`]).flat()

    const rijen: string[][] = [
      ['Set-ID', 'Type', ...codeHeaders],
      ...sets.map(s => [
        s.id,
        s.type,
        ...s.codes.flatMap((c, i) => [c, s.urls[i] ?? `https://tipdirect.be/c/${c}`]),
      ]),
    ]
    const csv = rijen.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tipdirect-sets-fabrikant-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setKaartMelding(`✅ ${sets.length} sets gedownload voor fabrikant.`)
  }

  async function updateKaartOrderStatus(orderId: string, status: string) {
    setKaartOrderBezig(orderId)
    const tt = kaartTrackTrace[orderId] ?? null
    const res = await fetch('/api/admin/kaart-orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderId, status, track_trace: tt }),
    })
    if (res.ok) {
      setKaartMelding(`✅ Order bijgewerkt naar "${status}"`)
      await laadKaartOrders()
    }
    setKaartOrderBezig(null)
  }

  function downloadKaartCsv(order: KaartOrder) {
    const baseUrl = 'https://tipdirect.be'
    const rijen: string[][] = [
      ['Code', 'URL (QR / NFC)', 'Klantnaam', 'Type'],
      ...order.codes.map(c => [c, `${baseUrl}/c/${c}`, order.naam, order.type]),
    ]
    const csv = rijen.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kaarten-${order.naam.replace(/\s+/g, '-').toLowerCase()}-${order.id.slice(0, 6)}.csv`
    a.click()
    URL.revokeObjectURL(url)
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
            { id: 'kaarten', label: 'Kaarten' },
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

            {/* Partnerlijst */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Actieve partners</h2>
                {uitbPartnerMelding && (
                  <p className="text-sm text-emerald-600 font-medium">{uitbPartnerMelding}</p>
                )}
              </div>
              {partnerLaden ? (
                <div className="p-8 flex justify-center">
                  <div className="w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : partners.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">Nog geen partners aangemaakt.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {partners.map(p => (
                    <div key={p.id} className="p-4 space-y-3">
                      {/* Naam + status */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">{p.naam}</p>
                          <p className="text-xs text-gray-400">{p.email} · {p.land}</p>
                          {p.iban && <p className="text-xs font-mono text-gray-400 mt-0.5">{p.iban}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.actief ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            {p.actief ? 'Actief' : 'Inactief'}
                          </span>
                          <a href={`/registreer?partner=${p.id}`} target="_blank"
                            className="text-xs text-brand-500 hover:underline">
                            Referral-link
                          </a>
                        </div>
                      </div>

                      {/* Tegoed-samenvatting */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                          <p className="text-xs text-amber-600 mb-0.5">Openstaand</p>
                          <p className="text-lg font-bold text-amber-800">€{euro(p.tegoed_open)}</p>
                          <p className="text-xs text-amber-500">te factureren aan MC</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-500 mb-0.5">Totale commissie ooit</p>
                          <p className="text-lg font-bold text-gray-800">€{euro(p.tegoed_totaal)}</p>
                          <p className="text-xs text-gray-400">alle periodes</p>
                        </div>
                      </div>

                      {/* Acties */}
                      <div className="flex gap-2">
                        {commissieBevestig === p.id ? (
                          <>
                            <button
                              onClick={() => commissieVoldaan(p.id)}
                              disabled={commissieBezig === p.id}
                              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 text-white text-sm font-bold rounded-xl transition-all"
                            >
                              {commissieBezig === p.id ? 'Verwerken...' : 'Ja, bevestigen'}
                            </button>
                            <button
                              onClick={() => setCommissieBevestig(null)}
                              className="px-4 py-2 border-2 border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:border-gray-300 transition-all"
                            >
                              Annuleer
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => p.tegoed_open > 0 ? setCommissieBevestig(p.id) : null}
                            disabled={p.tegoed_open === 0 || commissieBezig === p.id}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-100 disabled:text-gray-400 text-white text-sm font-bold rounded-xl transition-all"
                          >
                            {p.tegoed_open === 0 ? 'Commissie voldaan ✓' : 'Commissie voldaan markeren'}
                          </button>
                        )}
                        <button
                          onClick={() => downloadPartnerCsv(p)}
                          className="px-4 py-2 border-2 border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:border-brand-400 hover:text-brand-600 transition-all"
                          title="Download CSV"
                        >
                          ↓ CSV
                        </button>
                      </div>

                      {/* Maandoverzicht (uitklapbaar via de lijst zelf) */}
                      {p.tegoed_lijst.length > 0 && (
                        <div className="border border-gray-100 rounded-xl overflow-hidden">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-50 text-gray-500">
                                <th className="px-3 py-2 text-left font-medium">Periode</th>
                                <th className="px-3 py-2 text-right font-medium">Commissie</th>
                                <th className="px-3 py-2 text-right font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {p.tegoed_lijst.map(t => {
                                const [jaar, m] = t.maand.split('-')
                                const maandNamen: Record<string, string> = {
                                  '01': 'jan', '02': 'feb', '03': 'mrt', '04': 'apr',
                                  '05': 'mei', '06': 'jun', '07': 'jul', '08': 'aug',
                                  '09': 'sep', '10': 'okt', '11': 'nov', '12': 'dec',
                                }
                                return (
                                  <tr key={t.id} className="text-gray-700">
                                    <td className="px-3 py-2">{maandNamen[m] ?? m} {jaar}</td>
                                    <td className="px-3 py-2 text-right font-mono">€{euro(t.bedrag)}</td>
                                    <td className="px-3 py-2 text-right">
                                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${t.status === 'uitbetaald' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {t.status === 'uitbetaald' ? 'Voldaan' : 'Open'}
                                      </span>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── TAB: KAARTEN ── */}
        {tab === 'kaarten' && (
          <>
            {/* Voorraad */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4">Voorraad sets</h2>
              {kaartVoorraad ? (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-2xl font-bold text-emerald-600">{kaartVoorraad.vrij_bedrijf}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Bedrijf-sets vrij <span className="text-gray-400">(5 kaarten/set)</span></p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-2xl font-bold text-emerald-600">{kaartVoorraad.vrij_individueel}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Individueel-sets vrij <span className="text-gray-400">(2 kaarten/set)</span></p>
                  </div>
                </div>
              ) : (
                <div className="h-12 flex items-center justify-center mb-5">
                  <div className="w-5 h-5 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Sets tabel */}
              {kaartSets.length > 0 && (
                <div className="mb-5 border border-gray-100 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2">
                    <span className="text-xs font-semibold text-gray-600">Sets in voorraad ({kaartSets.length})</span>
                  </div>
                  <div className="overflow-x-auto max-h-56 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">Set-ID</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">Type</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">Codes</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">Aangemaakt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {kaartSets.map(s => (
                          <tr key={s.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-mono font-bold text-brand-700">{s.id}</td>
                            <td className="px-4 py-2 text-gray-600">{s.type}</td>
                            <td className="px-4 py-2 font-mono text-gray-400">{s.codes.join(' · ')}</td>
                            <td className="px-4 py-2">
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${s.status === 'vrij' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{s.status}</span>
                            </td>
                            <td className="px-4 py-2 text-gray-400">{new Date(s.aangemaakt_op).toLocaleDateString('nl-NL')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex gap-3 items-end flex-wrap">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Type</label>
                  <div className="flex rounded-xl overflow-hidden border-2 border-gray-200">
                    {(['bedrijf', 'individueel'] as const).map(t => (
                      <button key={t} type="button"
                        onClick={() => setKaartGenereerType(t)}
                        className={`px-4 py-2.5 text-sm font-medium transition-all ${kaartGenereerType === t ? 'bg-brand-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                      >
                        {t === 'bedrijf' ? 'Bedrijf (5/set)' : 'Individueel (2/set)'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 min-w-24">
                  <label className="block text-xs text-gray-500 mb-1">Aantal sets</label>
                  <input
                    type="number" min="1" max="500"
                    value={kaartGenereerAantal}
                    onChange={e => setKaartGenereerAantal(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 text-sm text-gray-900"
                  />
                </div>
                <button
                  onClick={genereerKaartCodes}
                  disabled={kaartGenereerBezig}
                  className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 text-white font-bold rounded-xl transition-all text-sm"
                >
                  {kaartGenereerBezig ? 'Bezig...' : 'Genereer sets'}
                </button>
                <button
                  onClick={downloadVrijeCodes}
                  className="px-5 py-2.5 bg-white border-2 border-gray-200 hover:border-brand-400 text-gray-700 font-bold rounded-xl transition-all text-sm"
                >
                  ↓ Download voor fabrikant
                </button>
              </div>
              {kaartMelding && <p className="text-sm text-emerald-600 mt-3">{kaartMelding}</p>}
            </div>

            {/* Orders */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
                <h2 className="font-bold text-gray-900">Kaartorders</h2>
                <div className="flex gap-1">
                  {(['alle', 'aangevraagd', 'wacht_op_voorraad', 'in_productie', 'verzonden', 'geleverd'] as const).map(f => (
                    <button key={f}
                      onClick={() => { setKaartOrderFilter(f); laadKaartOrders(f) }}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${kaartOrderFilter === f ? 'bg-brand-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      {f === 'alle' ? 'Alle' : f === 'wacht_op_voorraad' ? 'Wacht op voorraad' : f.charAt(0).toUpperCase() + f.slice(1).replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {kaartOrdersLaden ? (
                <div className="p-8 flex justify-center">
                  <div className="w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : kaartOrders.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">Geen orders gevonden.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {kaartOrders.map(order => {
                    const statusKleur: Record<string, string> = {
                      aangevraagd: 'bg-amber-100 text-amber-700',
                      wacht_op_voorraad: 'bg-red-100 text-red-700',
                      in_productie: 'bg-blue-100 text-blue-700',
                      verzonden: 'bg-purple-100 text-purple-700',
                      geleverd: 'bg-emerald-100 text-emerald-700',
                    }
                    return (
                      <div key={order.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">{order.naam}</p>
                              {order.set_id && (
                                <span className="font-mono text-sm font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                                  Stuur set {order.set_id}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {order.type === 'inclusief' ? '🎁 Inclusief' : order.type === 'bijbestelling' ? '🔄 Bijbestelling' : '🔗 Toewijzing'} · {order.aantal} kaarten · {new Date(order.aangemaakt_op).toLocaleDateString('nl-NL')}
                            </p>
                            {order.codes?.length > 0 && (
                              <p className="text-xs font-mono text-gray-400 mt-0.5">{order.codes.slice(0, 3).join(', ')}{order.codes.length > 3 ? ` +${order.codes.length - 3}` : ''}</p>
                            )}
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${statusKleur[order.status] ?? 'bg-gray-100 text-gray-500'}`}>
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          {order.status === 'aangevraagd' && (
                            <button onClick={() => updateKaartOrderStatus(order.id, 'in_productie')}
                              disabled={kaartOrderBezig === order.id}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white text-xs font-bold rounded-lg transition-all">
                              In productie
                            </button>
                          )}
                          {order.status === 'in_productie' && (
                            <div className="flex gap-2 items-center w-full">
                              <input
                                type="text"
                                placeholder="Track & trace (optioneel)"
                                value={kaartTrackTrace[order.id] ?? ''}
                                onChange={e => setKaartTrackTrace(p => ({ ...p, [order.id]: e.target.value }))}
                                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-brand-500"
                              />
                              <button onClick={() => updateKaartOrderStatus(order.id, 'verzonden')}
                                disabled={kaartOrderBezig === order.id}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-200 text-white text-xs font-bold rounded-lg transition-all">
                                Verzonden
                              </button>
                            </div>
                          )}
                          {order.status === 'verzonden' && (
                            <button onClick={() => updateKaartOrderStatus(order.id, 'geleverd')}
                              disabled={kaartOrderBezig === order.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 text-white text-xs font-bold rounded-lg transition-all">
                              Geleverd
                            </button>
                          )}
                          {order.codes?.length > 0 && (
                            <button onClick={() => downloadKaartCsv(order)}
                              className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:border-brand-400 hover:text-brand-600 transition-all">
                              ↓ CSV voor drukker/NFC
                            </button>
                          )}
                        </div>

                        {order.track_trace && (
                          <p className="text-xs text-gray-500">Track & trace: <span className="font-mono">{order.track_trace}</span></p>
                        )}
                      </div>
                    )
                  })}
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
                    <label className="block text-sm font-medium text-gray-700 mb-0.5">Individuele ober</label>
                    <p className="text-xs text-gray-400 mb-1.5">Incl. 21% BTW — Mollie int dit bedrag exact</p>
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
                    <label className="block text-sm font-medium text-gray-700 mb-0.5">Bedrijf / uitbater</label>
                    <p className="text-xs text-gray-400 mb-1.5">Excl. BTW — systeem telt 21% op (€75 → €90,75)</p>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">€</span>
                      <input
                        type="text"
                        value={nieuwBedragBedrijf}
                        onChange={(e) => setNieuwBedragBedrijf(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 text-gray-900"
                        placeholder="75,00"
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
