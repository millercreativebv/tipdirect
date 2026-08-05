'use client'

import { useEffect, useState } from 'react'
import { auth, db, storage, type Ober, type Bedrijf } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import Link from 'next/link'

const LANDEN = ['België', 'Nederland', 'Luxemburg', 'Duitsland', 'Frankrijk', 'Andere']

export default function BedrijfInstellingen() {
  const [uitbater, setUitbater] = useState<Ober | null>(null)
  const [laden, setLaden] = useState(true)
  const [opslaan, setOpslaan] = useState(false)
  const [opgeslagen, setOpgeslagen] = useState(false)
  const [fout, setFout] = useState('')

  const [bedrijfId, setBedrijfId] = useState('')
  const [naam, setNaam] = useState('')
  const [statutaireNaam, setStatutaireNaam] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoLaden, setLogoLaden] = useState(false)

  // NAW & contact
  const [telefoon, setTelefoon] = useState('')
  const [straat, setStraat] = useState('')
  const [postcode, setPostcode] = useState('')
  const [stad, setStad] = useState('')
  const [land, setLand] = useState('België')

  // Fiscaal
  const [kvk, setKvk] = useState('')
  const [btwNummer, setBtwNummer] = useState('')

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
        setStatutaireNaam(b.statutaire_naam ?? '')
        setLogoUrl(b.logo_url ?? '')
        setTelefoon(b.telefoon ?? '')
        setStraat(b.adres_straat ?? '')
        setPostcode(b.adres_postcode ?? '')
        setStad(b.adres_stad ?? '')
        setLand(b.adres_land ?? 'België')
        setKvk(b.kvk ?? '')
        setBtwNummer(b.btw_nummer ?? '')
      }

      setLaden(false)
    })
    return () => unsubscribe()
  }, [])

  async function logoUploaden(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !uitbater) return
    setLogoLaden(true)
    setFout('')
    try {
      const storageRef = ref(storage, `profielfoto/${uitbater.id}/logo`)
      const snapshot = await uploadBytes(storageRef, file)
      const url = await getDownloadURL(snapshot.ref)
      setLogoUrl(url)
    } catch {
      setFout('Logo uploaden mislukt. Probeer het opnieuw.')
    } finally {
      setLogoLaden(false)
      e.target.value = ''
    }
  }

  async function opslaan_fn(e: React.FormEvent) {
    e.preventDefault()
    if (!uitbater) return
    setOpslaan(true)
    setFout('')
    setOpgeslagen(false)
    try {
      await updateDoc(doc(db, 'bedrijven', bedrijfId), {
        naam,
        statutaire_naam: statutaireNaam.trim() || null,
        logo_url: logoUrl || null,
        telefoon: telefoon.trim() || null,
        adres_straat: straat.trim() || null,
        adres_postcode: postcode.trim() || null,
        adres_stad: stad.trim() || null,
        adres_land: land,
        kvk: kvk.trim() || null,
        btw_nummer: btwNummer.trim() || null,
      })
      await updateDoc(doc(db, 'obers', uitbater.id), {
        naam,
        foto_url: logoUrl || null,
        telefoon: telefoon.trim() || null,
        adres_straat: straat.trim() || null,
        adres_postcode: postcode.trim() || null,
        adres_stad: stad.trim() || null,
        adres_land: land,
        btw_nummer: btwNummer.trim() || null,
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
          <Link href="/dashboard/uitbater" className="text-gray-400 hover:text-gray-600 text-sm">← Terug</Link>
          <h1 className="font-bold text-gray-900">Bedrijfsinstellingen</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 pb-12">
        <form onSubmit={opslaan_fn} className="space-y-5">

          {/* Logo */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-brand-100 flex items-center justify-center flex-shrink-0">
                {logoUrl
                  ? <img src={logoUrl} alt={naam} className="w-full h-full object-contain p-1" />
                  : <span className="text-2xl">🏪</span>}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{naam || 'Naam van uw zaak'}</p>
                <p className="text-sm text-gray-400">Zichtbaar op dashboard en betaalpagina's</p>
              </div>
            </div>
            <label className={`flex items-center gap-3 w-full px-4 py-3 border-2 rounded-xl transition-all ${logoLaden ? 'border-brand-300 bg-brand-50 cursor-not-allowed' : 'border-dashed border-gray-200 hover:border-brand-400 cursor-pointer'}`}>
              <input type="file" accept="image/*" className="hidden" onChange={logoUploaden} disabled={logoLaden} />
              <span className="text-lg">🏪</span>
              <span className="text-sm text-gray-500">
                {logoLaden ? 'Uploaden...' : logoUrl ? 'Ander logo uploaden' : 'Logo uploaden'}
              </span>
            </label>
            {logoUrl && !logoLaden && (
              <button type="button" onClick={() => setLogoUrl('')} className="text-xs text-gray-400 hover:text-red-500 transition-colors mt-2">
                Logo verwijderen
              </button>
            )}
          </div>

          {/* Bedrijfsnaam */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bedrijfsgegevens</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Handelsnaam</label>
              <input type="text" required value={naam} onChange={e => setNaam(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                placeholder="Restaurant De Gouden Lepel" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statutaire naam <span className="text-gray-400 font-normal">(indien afwijkend)</span></label>
              <input type="text" value={statutaireNaam} onChange={e => setStatutaireNaam(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                placeholder="Gouden Lepel BV" />
            </div>
          </div>

          {/* Adres & contact */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Adres & contact</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefoonnummer</label>
              <input type="tel" value={telefoon} onChange={e => setTelefoon(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                placeholder="+32 xxx xx xx xx" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Straat + huisnummer</label>
              <input type="text" value={straat} onChange={e => setStraat(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                placeholder="Kerkstraat 12" />
            </div>
            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                <input type="text" value={postcode} onChange={e => setPostcode(e.target.value)}
                  className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                  placeholder="2000" />
              </div>
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Stad</label>
                <input type="text" value={stad} onChange={e => setStad(e.target.value)}
                  className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                  placeholder="Antwerpen" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Land</label>
              <select value={land} onChange={e => setLand(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 text-gray-900 bg-white">
                {LANDEN.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Fiscaal */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fiscaal & registratie</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">KvK / Ondernemingsnummer</label>
              <input type="text" value={kvk} onChange={e => setKvk(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                placeholder="BE 0xxx.xxx.xxx of KvK 12345678" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BTW-nummer <span className="text-gray-400 font-normal">(optioneel)</span></label>
              <input type="text" value={btwNummer} onChange={e => setBtwNummer(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                placeholder="BE 0xxx.xxx.xxx" />
            </div>
          </div>

          {/* Branding preview */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Zo ziet uw branding eruit op de betaalpagina</p>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              {logoUrl && <img src={logoUrl} alt={naam} className="h-8 w-auto mx-auto mb-2 object-contain" />}
              <p className="text-xs text-gray-400">{naam || 'Naam van uw zaak'}</p>
            </div>
          </div>

          {fout && <div className="bg-red-50 border border-red-200 rounded-xl p-3"><p className="text-red-600 text-sm font-medium">{fout}</p></div>}
          {opgeslagen && <div className="bg-brand-50 border border-brand-200 rounded-xl p-3"><p className="text-brand-700 text-sm font-medium">Instellingen opgeslagen!</p></div>}

          <button type="submit" disabled={opslaan}
            className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl transition-all">
            {opslaan ? 'Opslaan...' : 'Instellingen opslaan'}
          </button>
        </form>
      </div>
    </div>
  )
}
