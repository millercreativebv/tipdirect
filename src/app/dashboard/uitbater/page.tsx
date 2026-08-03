'use client'

import { useEffect, useState } from 'react'
import { auth, db, type Ober, type Betaling, type Bedrijf } from '@/lib/firebase'
import { onAuthStateChanged, signOut, getIdToken } from 'firebase/auth'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { euro } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'

type MedewerkerStats = {
  ober: Ober
  tips: Betaling[]
  totaal: number
}

type AbonnementData = {
  status: 'pending' | 'actief' | 'vervallen'
  bedrag: number
  voldaan: number
  actief_sinds: string | null
}

export default function UitbaterDashboard() {
  const [uitbater, setUitbater] = useState<Ober | null>(null)
  const [bedrijf, setBedrijf] = useState<Bedrijf | null>(null)
  const [medewerkers, setMedewerkers] = useState<MedewerkerStats[]>([])
  const [abonnement, setAbonnement] = useState<AbonnementData | null>(null)
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { window.location.href = '/inloggen'; return }

      const oberSnap = await getDoc(doc(db, 'obers', user.uid))
      if (!oberSnap.exists()) { window.location.href = '/registreer'; return }

      const oberData = { id: oberSnap.id, ...oberSnap.data() } as Ober
      if (oberData.account_type !== 'bedrijf') { window.location.href = '/dashboard'; return }
      setUitbater(oberData)

      const bedrijfSnap = await getDoc(doc(db, 'bedrijven', oberData.bedrijf_id!))
      if (bedrijfSnap.exists()) {
        setBedrijf({ id: bedrijfSnap.id, ...bedrijfSnap.data() } as Bedrijf)
      }

      const medewerkerSnap = await getDocs(
        query(collection(db, 'obers'), where('bedrijf_id', '==', oberData.bedrijf_id), where('account_type', '==', 'medewerker'))
      )
      const medewerkerLijst = medewerkerSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Ober)

      if (medewerkerLijst.length === 0) {
        setMedewerkers([])
        setLaden(false)
        return
      }

      const ids = medewerkerLijst.map(m => m.id)
      const betalingenSnap = await getDocs(
        query(collection(db, 'betalingen'), where('ober_id', 'in', ids))
      )
      const alleBetalingen = betalingenSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Betaling)

      const stats: MedewerkerStats[] = medewerkerLijst.map(ober => {
        const tips = alleBetalingen.filter(b => b.ober_id === ober.id && b.status === 'betaald')
        tips.sort((a, b) => b.aangemaakt_op.localeCompare(a.aangemaakt_op))
        const totaal = tips.reduce((sum, b) => sum + (b.netto_klant ?? b.bedrag - (b.fee ?? 0)), 0)
        return { ober, tips, totaal }
      })
      stats.sort((a, b) => b.totaal - a.totaal)

      setMedewerkers(stats)

      try {
        const token = await getIdToken(user)
        const ab = await fetch('/api/mijn/team-abonnement', { headers: { Authorization: `Bearer ${token}` } })
        if (ab.ok) setAbonnement(await ab.json())
      } catch { /* niet kritisch */ }

      setLaden(false)
    })

    return () => unsubscribe()
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

  if (!uitbater || !bedrijf) return null

  const alleTips = medewerkers.flatMap(m => m.tips)
  const totaalTeam = medewerkers.reduce((sum, m) => sum + m.totaal, 0)

  const vandaag = new Date().toDateString()
  const vandaagTips = alleTips.filter(b => new Date(b.betaald_op ?? b.aangemaakt_op).toDateString() === vandaag)

  const now = new Date()
  const maandStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const maandTips = alleTips.filter(b => new Date(b.betaald_op ?? b.aangemaakt_op) >= maandStart)
  const maandTotaal = maandTips.reduce((sum, b) => sum + (b.netto_klant ?? b.bedrag - (b.fee ?? 0)), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {bedrijf.logo_url ? (
              <img src={bedrijf.logo_url} alt={bedrijf.naam} className="h-9 w-auto max-w-[140px] object-contain" />
            ) : (
              <Image src="/logotd.png" alt="TipDirect" width={140} height={56} className="h-9 w-auto" />
            )}
          </div>
          <button onClick={uitloggen} className="text-sm text-gray-400 hover:text-gray-600">
            Uitloggen
          </button>
        </div>
        <div className="max-w-2xl mx-auto mt-3">
          <p className="font-bold text-gray-900">{bedrijf.naam}</p>
          <p className="text-xs text-gray-400">{medewerkers.length} medewerker{medewerkers.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* Team statistieken */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-brand-500">€{euro(totaalTeam)}</p>
            <p className="text-xs text-gray-500 mt-1">Totaal team</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-brand-500">€{euro(maandTotaal)}</p>
            <p className="text-xs text-gray-500 mt-1">Deze maand</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{vandaagTips.length}</p>
            <p className="text-xs text-gray-500 mt-1">Tips vandaag</p>
          </div>
        </div>

        {/* Abonnement */}
        {abonnement && abonnement.status !== 'actief' && (
          <div className={`rounded-xl p-4 shadow-sm ${abonnement.status === 'vervallen' ? 'bg-red-50 border border-red-100' : 'bg-white border border-gray-100'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">Abonnement</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${abonnement.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>
                {abonnement.status === 'pending' ? 'Activering loopt' : 'Vervallen'}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
              <div
                className="bg-brand-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round((abonnement.voldaan / abonnement.bedrag) * 100))}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              €{(abonnement.voldaan / 100).toFixed(2).replace('.', ',')} van €{(abonnement.bedrag / 100).toFixed(2).replace('.', ',')} voldaan — eerste fooien gaan naar activering
            </p>
          </div>
        )}
        {abonnement && abonnement.status === 'actief' && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 shadow-sm flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-sm font-semibold text-green-800">Abonnement actief</p>
              <p className="text-xs text-green-600">
                Actief sinds {abonnement.actief_sinds ? new Date(abonnement.actief_sinds).toLocaleDateString('nl-NL') : '—'} · alle fooien gaan naar het team
              </p>
            </div>
          </div>
        )}

        {/* Snelkoppelingen */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/dashboard/team"
            className="bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl p-4 text-center transition-all"
          >
            👥 Team beheren
          </Link>
          <Link
            href="/dashboard/bedrijf"
            className="bg-white border-2 border-gray-200 hover:border-brand-500 text-gray-700 font-semibold rounded-xl p-4 text-center transition-all"
          >
            🏪 Bedrijfsinstellingen
          </Link>
        </div>

        {/* Medewerkers overzicht */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Overzicht per medewerker</h2>
          </div>

          {medewerkers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-4xl mb-3">👥</p>
              <p className="text-gray-500 font-medium">Nog geen medewerkers</p>
              <p className="text-sm text-gray-400 mt-1">Voeg je eerste medewerker toe via Team beheren.</p>
              <Link
                href="/dashboard/team"
                className="inline-block mt-4 px-6 py-2.5 bg-brand-500 text-white font-semibold rounded-xl text-sm"
              >
                Medewerker toevoegen
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {medewerkers.map(({ ober, tips, totaal }) => (
                <div key={ober.id} className="px-4 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {ober.foto_url
                      ? <img src={ober.foto_url} alt={ober.naam} className="w-full h-full object-cover" />
                      : <span className="text-lg">👤</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{ober.naam}</p>
                    <p className="text-xs text-gray-400">tipdirect.be/{ober.gebruikersnaam}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-brand-500">€{euro(totaal)}</p>
                    <p className="text-xs text-gray-400">{tips.length} tips</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recente activiteit */}
        {alleTips.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-900">Recente activiteit</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {alleTips
                .sort((a, b) => b.aangemaakt_op.localeCompare(a.aangemaakt_op))
                .slice(0, 10)
                .map(b => {
                  const mv = medewerkers.find(m => m.ober.id === b.ober_id)
                  return (
                    <div key={b.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {mv?.ober.naam ?? 'Onbekend'} · +€{euro(b.netto_klant ?? b.bedrag - (b.fee ?? 0))}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(b.betaald_op ?? b.aangemaakt_op).toLocaleDateString('nl-NL', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {b.sterren && b.sterren > 0 && (
                        <span className="text-yellow-400 text-sm">{'★'.repeat(b.sterren)}</span>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
