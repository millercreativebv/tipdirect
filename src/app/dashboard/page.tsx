'use client'

import { useEffect, useState, useRef } from 'react'
import { auth, db, type Ober, type Betaling } from '@/lib/firebase'
import { onAuthStateChanged, signOut, getIdToken } from 'firebase/auth'
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore'
import { euro } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import QRCode from 'qrcode'

type AbonnementStatus = 'pending' | 'actief' | 'vervallen'
type AbonnementData = {
  status: AbonnementStatus
  bedrag: number
  voldaan: number
  actief_sinds: string | null
}

type Periode = 'vandaag' | 'week' | 'maand' | 'totaal'

const BADGES = [
  { id: 'eerste_tip', label: 'Eerste tip', icon: '🏆', check: (tips: Betaling[], _: number) => tips.length >= 1 },
  { id: 'tien_tips', label: '10 tips', icon: '⭐', check: (tips: Betaling[], _: number) => tips.length >= 10 },
  { id: 'honderd_tips', label: '100 tips', icon: '🎯', check: (tips: Betaling[], _: number) => tips.length >= 100 },
  { id: 'vijfhonderd', label: '€500 ontvangen', icon: '💰', check: (_: Betaling[], total: number) => total >= 50000 },
]

function filterTips(tips: Betaling[], periode: Periode): Betaling[] {
  if (periode === 'totaal') return tips
  const now = new Date()
  return tips.filter(b => {
    const datum = new Date(b.betaald_op ?? b.aangemaakt_op)
    if (periode === 'vandaag') return datum.toDateString() === now.toDateString()
    if (periode === 'week') {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay() + 1)
      weekStart.setHours(0, 0, 0, 0)
      return datum >= weekStart
    }
    if (periode === 'maand') {
      return datum.getFullYear() === now.getFullYear() && datum.getMonth() === now.getMonth()
    }
    return true
  })
}

export default function DashboardPagina() {
  const [ober, setOber] = useState<Ober | null>(null)
  const [betalingen, setBetalingen] = useState<Betaling[]>([])
  const [abonnement, setAbonnement] = useState<AbonnementData | null>(null)
  const [laden, setLaden] = useState(true)
  const [qrUrl, setQrUrl] = useState('')
  const [qrZichtbaar, setQrZichtbaar] = useState(false)
  const [periode, setPeriode] = useState<Periode>('maand')
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = '/inloggen'
        return
      }

      const oberSnap = await getDoc(doc(db, 'obers', user.uid))
      if (!oberSnap.exists()) {
        window.location.href = '/registreer'
        return
      }

      const oberData = { id: oberSnap.id, ...oberSnap.data() } as Ober
      setOber(oberData)

      if (oberData.account_type === 'bedrijf') {
        window.location.href = '/dashboard/uitbater'
        return
      }

      const q = query(collection(db, 'betalingen'), where('ober_id', '==', user.uid), limit(50))
      const snap = await getDocs(q)
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Betaling)
      data.sort((a, b) => b.aangemaakt_op.localeCompare(a.aangemaakt_op))
      setBetalingen(data)

      // Abonnement ophalen
      try {
        const token = await getIdToken(user)
        const ab = await fetch('/api/mijn/abonnement', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (ab.ok) setAbonnement(await ab.json())
      } catch {
        // abonnement niet kritisch voor laden
      }

      setLaden(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (ober && qrZichtbaar && qrCanvasRef.current) {
      const base = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL
      const url = `${base}/${ober.gebruikersnaam}`
      QRCode.toCanvas(qrCanvasRef.current, url, {
        width: 250,
        margin: 2,
        color: { dark: '#1a1a1a', light: '#ffffff' },
      })
      setQrUrl(url)
    }
  }, [ober, qrZichtbaar])

  function qrDownloaden() {
    if (!qrCanvasRef.current || !ober) return
    const link = document.createElement('a')
    link.download = `tipdirect-qr-${ober.gebruikersnaam}.png`
    link.href = qrCanvasRef.current.toDataURL()
    link.click()
  }

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

  if (!ober) return null

  const alleBetalingen = betalingen.filter(b => b.status === 'betaald')
  const betaaldeTips = alleBetalingen.filter(b => b.bestemming === 'klant')
  const totaalOntvangenCenten = betaaldeTips.reduce((sum, b) => sum + (b.netto_klant ?? b.bedrag - (b.fee ?? 0)), 0)

  const gefilterd = filterTips(betaaldeTips, periode)
  const gefilterdTotaal = gefilterd.reduce((sum, b) => sum + (b.netto_klant ?? b.bedrag - (b.fee ?? 0)), 0)
  const gemiddeld = gefilterd.length > 0 ? gefilterdTotaal / gefilterd.length : 0

  const spaardoelBedragCenten = ober.spaardoel_bedrag ? ober.spaardoel_bedrag * 100 : null
  const spaardoelProgress = spaardoelBedragCenten
    ? Math.min(100, Math.round((totaalOntvangenCenten / spaardoelBedragCenten) * 100))
    : 0

  const periodeLabels: Record<Periode, string> = {
    vandaag: 'Vandaag',
    week: 'Deze week',
    maand: 'Deze maand',
    totaal: 'Totaal',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Image src="/logotd.png" alt="TipDirect" width={140} height={56} className="h-9 w-auto" />
          <button onClick={uitloggen} className="text-sm text-gray-400 hover:text-gray-600">
            Uitloggen
          </button>
        </div>
        <div className="max-w-lg mx-auto flex items-center gap-3 mt-4">
          <div className="w-10 h-10 rounded-full bg-brand-100 overflow-hidden flex items-center justify-center flex-shrink-0">
            {ober.foto_url
              ? <img src={ober.foto_url} alt={ober.naam} className="w-full h-full object-cover" />
              : <span className="text-xl">👤</span>
            }
          </div>
          <div>
            <p className="font-bold text-gray-900">{ober.naam}</p>
            <p className="text-xs text-gray-400">tipdirect.nl/{ober.gebruikersnaam}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">

        {/* Periode tabs */}
        <div className="bg-white rounded-xl shadow-sm p-1 flex gap-1">
          {(['vandaag', 'week', 'maand', 'totaal'] as Periode[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriode(p)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                periode === p
                  ? 'bg-brand-500 text-white'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {periodeLabels[p]}
            </button>
          ))}
        </div>

        {/* Statistieken */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-brand-500">€{euro(gefilterdTotaal)}</p>
            <p className="text-xs text-gray-500 mt-1">Ontvangen</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{gefilterd.length}</p>
            <p className="text-xs text-gray-500 mt-1">Totaal tips</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-brand-500">€{euro(gemiddeld)}</p>
            <p className="text-xs text-gray-500 mt-1">Gemiddeld</p>
          </div>
        </div>

        {/* Spaardoel */}
        {ober.spaardoel_naam && ober.spaardoel_bedrag && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span>🎯</span>
                <p className="font-semibold text-gray-900">{ober.spaardoel_naam}</p>
              </div>
              <p className="text-sm text-gray-500">
                €{euro(totaalOntvangenCenten)} / €{ober.spaardoel_bedrag.toFixed(0)}
              </p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 bg-brand-500 rounded-full transition-all duration-500"
                style={{ width: `${spaardoelProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1 text-right">{spaardoelProgress}% bereikt</p>
          </div>
        )}

        {/* Badges */}
        {alleBetalingen.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Behaalde badges</p>
            <div className="flex flex-wrap gap-2">
              {BADGES.map(badge => {
                const behaald = badge.check(alleBetalingen, totaalOntvangenCenten)
                return (
                  <div
                    key={badge.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${
                      behaald
                        ? 'bg-brand-50 border-brand-200 text-brand-700'
                        : 'bg-gray-50 border-gray-200 text-gray-400'
                    }`}
                  >
                    <span className={behaald ? '' : 'grayscale opacity-40'}>{badge.icon}</span>
                    {badge.label}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Abonnement status */}
        {abonnement && (
          <div className={`rounded-xl shadow-sm p-4 ${
            abonnement.status === 'actief'
              ? 'bg-emerald-50 border border-emerald-200'
              : abonnement.status === 'vervallen'
              ? 'bg-red-50 border border-red-200'
              : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {abonnement.status === 'actief' ? '✅' : abonnement.status === 'vervallen' ? '⚠️' : '🔄'}
                </span>
                <div>
                  <p className={`font-semibold ${
                    abonnement.status === 'actief' ? 'text-emerald-800'
                    : abonnement.status === 'vervallen' ? 'text-red-700'
                    : 'text-gray-900'
                  }`}>
                    {abonnement.status === 'actief' && 'Abonnement actief'}
                    {abonnement.status === 'pending' && 'Abonnement wordt actief'}
                    {abonnement.status === 'vervallen' && 'Abonnement vervallen'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {abonnement.status === 'actief' && abonnement.actief_sinds &&
                      `Actief sinds ${new Date(abonnement.actief_sinds).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}`
                    }
                    {abonnement.status === 'pending' &&
                      `Fooien gaan naar abonnement totdat €${(abonnement.bedrag / 100).toFixed(2)} bereikt is`
                    }
                    {abonnement.status === 'vervallen' &&
                      'Neem contact op om je account te activeren'
                    }
                  </p>
                </div>
              </div>
              {abonnement.status === 'pending' && (
                <p className="text-sm font-bold text-gray-700">
                  €{(abonnement.voldaan / 100).toFixed(2)} / €{(abonnement.bedrag / 100).toFixed(2)}
                </p>
              )}
            </div>
            {abonnement.status === 'pending' && (
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-2.5 bg-brand-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (abonnement.voldaan / abonnement.bedrag) * 100)}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* QR Code */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => setQrZichtbaar(!qrZichtbaar)}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📱</span>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Mijn QR-code</p>
                <p className="text-sm text-gray-400">Klanten scannen dit om te betalen</p>
              </div>
            </div>
            <span className="text-gray-400">{qrZichtbaar ? '▲' : '▼'}</span>
          </button>

          {qrZichtbaar && (
            <div className="px-4 pb-4 flex flex-col items-center gap-4">
              <canvas ref={qrCanvasRef} className="rounded-xl" />
              <p className="text-sm text-gray-400 text-center">{qrUrl}</p>
              <button
                onClick={qrDownloaden}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all"
              >
                QR-code downloaden
              </button>
              <Link
                href="/dashboard/qr-kaart"
                className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-all text-center"
              >
                Afdrukken als pasje (creditcardformaat)
              </Link>
              <Link
                href={`/${ober.gebruikersnaam}`}
                target="_blank"
                className="w-full py-3 border-2 border-brand-500 text-brand-700 font-bold rounded-xl transition-all text-center"
              >
                Betaalpagina bekijken
              </Link>
            </div>
          )}
        </div>

        {/* Recente tips */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recente tips</h2>
            {alleBetalingen.length > 0 && (
              <button
                onClick={() => exporteerPDF(alleBetalingen, ober)}
                className="text-xs text-brand-500 font-medium hover:underline"
              >
                Export PDF
              </button>
            )}
          </div>

          {alleBetalingen.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-brand-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09c-2.72.69-5.4-.68-6.61-3.09H5v-1.5h1.41c-.04-.33-.07-.66-.07-1s.03-.67.07-1H5V10h1.8c1.21-2.41 3.89-3.78 6.61-3.09 1.18.3 2.22.94 3.03 1.82L14.97 10c-.55-.64-1.27-1.09-2.07-1.29-1.36-.34-2.77.11-3.68 1.09H13v1.5H8.66c-.04.33-.06.66-.06 1s.02.67.06 1H13v1.5H9.22c.91.98 2.32 1.43 3.68 1.09.8-.2 1.52-.65 2.07-1.29l1.47 1.27c-.81.88-1.85 1.52-3.03 1.82z"/>
                </svg>
              </div>
              <p className="text-gray-500">Nog geen tips ontvangen.</p>
              <p className="text-sm text-gray-400 mt-1">Deel je QR-code met gasten!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {alleBetalingen.slice(0, 20).map((b) => {
                const naarKlant = b.bestemming === 'klant'
                const nettoBedrag = b.netto_klant ?? (b.bedrag - (b.fee ?? 0))
                return (
                <div key={b.id} className="px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">+€{euro(b.bedrag)}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(b.betaald_op ?? b.aangemaakt_op).toLocaleDateString('nl-NL', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {b.sterren && b.sterren > 0 && (
                        <span className="text-yellow-400 text-sm">{'★'.repeat(b.sterren)}</span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        naarKlant && b.uitbetaald
                          ? 'bg-gray-100 text-gray-500'
                          : naarKlant
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {naarKlant && b.uitbetaald
                          ? `Uitbetaald €${euro(nettoBedrag)}`
                          : naarKlant
                          ? `Netto €${euro(nettoBedrag)}`
                          : 'Naar abonnement'}
                      </span>
                    </div>
                  </div>
                  {b.complimenten && b.complimenten.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {b.complimenten.map(c => (
                        <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c}</span>
                      ))}
                    </div>
                  )}
                  {b.boodschap && (
                    <p className="text-xs text-gray-500 mt-1.5 italic">"{b.boodschap}"</p>
                  )}
                </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Uitbetalingen placeholder */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🏦</span>
            <h2 className="font-semibold text-gray-900">Uitbetalingen</h2>
          </div>
          <p className="text-sm text-gray-400">Uitbetalingsgeschiedenis wordt beschikbaar na koppeling met Mollie.</p>
        </div>

        {/* Profiel bewerken */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Profiel</h2>
          <Link
            href="/dashboard/profiel"
            className="block w-full py-3 border-2 border-gray-200 hover:border-brand-500 text-gray-700 font-medium rounded-xl transition-all text-center"
          >
            Profiel bewerken
          </Link>
        </div>

      </div>
    </div>
  )
}

function exporteerPDF(tips: Betaling[], ober: Ober) {
  const totaal = tips.reduce((sum, b) => sum + (b.netto_klant ?? b.bedrag - (b.fee ?? 0)), 0)
  const regels = tips.slice(0, 50).map(b => [
    new Date(b.betaald_op ?? b.aangemaakt_op).toLocaleDateString('nl-NL'),
    `€${euro(b.netto_klant ?? b.bedrag - (b.fee ?? 0))}`,
    b.sterren ? '★'.repeat(b.sterren) : '—',
    b.complimenten?.join(', ') || '—',
    b.boodschap || '—',
  ])

  const inhoud = [
    `TipDirect — Overzicht voor ${ober.naam}`,
    `Geëxporteerd op: ${new Date().toLocaleDateString('nl-NL')}`,
    `Totaal ontvangen: €${euro(totaal)} (${tips.length} tips)`,
    '',
    'Datum          | Netto   | Sterren | Complimenten',
    '---',
    ...regels.map(r => r.join(' | ')),
  ].join('\n')

  const blob = new Blob([inhoud], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tipdirect-${ober.gebruikersnaam}-${new Date().toISOString().slice(0, 10)}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
