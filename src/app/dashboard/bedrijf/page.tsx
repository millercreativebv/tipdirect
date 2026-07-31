'use client'

import { useEffect, useState } from 'react'
import { auth, db, type Ober, type Bedrijf } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import Link from 'next/link'

export default function BedrijfInstellingen() {
  const [uitbater, setUitbater] = useState<Ober | null>(null)
  const [laden, setLaden] = useState(true)
  const [opslaan, setOpslaan] = useState(false)
  const [opgeslagen, setOpgeslagen] = useState(false)
  const [fout, setFout] = useState('')

  const [bedrijfId, setBedrijfId] = useState('')
  const [naam, setNaam] = useState('')
  const [logoUrl, setLogoUrl] = useState('')

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
        const b = { id: bedrijfSnap.id, ...bedrijfSnap.data() } as Bedrijf
        setBedrijfId(b.id)
        setNaam(b.naam)
        setLogoUrl(b.logo_url ?? '')
      }

      setLaden(false)
    })

    return () => unsubscribe()
  }, [])

  async function opslaan_fn(e: React.FormEvent) {
    e.preventDefault()
    if (!uitbater) return
    setOpslaan(true)
    setFout('')
    setOpgeslagen(false)

    try {
      await updateDoc(doc(db, 'bedrijven', bedrijfId), {
        naam,
        logo_url: logoUrl || null,
      })
      await updateDoc(doc(db, 'obers', uitbater.id), {
        naam,
        foto_url: logoUrl || null,
      })
      setOpgeslagen(true)
    } catch {
      setFout('Opslaan mislukt. Probeer het opnieuw.')
    }
    setOpslaan(false)
  }

  if (laden) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/dashboard/uitbater" className="text-gray-400 hover:text-gray-600 text-sm">
            ← Terug
          </Link>
          <h1 className="font-bold text-gray-900">Bedrijfsinstellingen</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4">
        <form onSubmit={opslaan_fn} className="space-y-5">

          {/* Logo preview */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-brand-100 flex items-center justify-center flex-shrink-0">
                {logoUrl
                  ? <img src={logoUrl} alt={naam} className="w-full h-full object-contain p-1" />
                  : <span className="text-2xl">🏪</span>
                }
              </div>
              <div>
                <p className="font-semibold text-gray-900">{naam || 'Naam van uw zaak'}</p>
                <p className="text-sm text-gray-400">Zichtbaar op dashboard en betaalpagina's</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
              <input
                type="url"
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
              />
              <p className="text-xs text-gray-400 mt-1">Link naar uw bedrijfslogo (optioneel)</p>
            </div>
          </div>

          {/* Naam */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Naam van uw zaak</label>
            <input
              type="text"
              required
              value={naam}
              onChange={e => setNaam(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
              placeholder="Restaurant De Gouden Lepel"
            />
          </div>

          {/* Branding preview */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Zo ziet uw branding eruit op de betaalpagina</p>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              {logoUrl && (
                <img src={logoUrl} alt={naam} className="h-8 w-auto mx-auto mb-2 object-contain" />
              )}
              <p className="text-xs text-gray-400">{naam || 'Naam van uw zaak'}</p>
            </div>
          </div>

          {fout && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm font-medium">{fout}</p>
            </div>
          )}
          {opgeslagen && (
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-3">
              <p className="text-brand-700 text-sm font-medium">Instellingen opgeslagen!</p>
            </div>
          )}

          <button
            type="submit"
            disabled={opslaan}
            className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl transition-all"
          >
            {opslaan ? 'Opslaan...' : 'Instellingen opslaan'}
          </button>
        </form>
      </div>
    </div>
  )
}
