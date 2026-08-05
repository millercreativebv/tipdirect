'use client'

import { useEffect, useState } from 'react'
import { auth, db, storage, type Ober } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { getIdToken } from 'firebase/auth'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import Link from 'next/link'

const LANDEN = ['België', 'Nederland', 'Luxemburg', 'Duitsland', 'Frankrijk', 'Andere']

export default function ProfielPagina() {
  const [ober, setOber] = useState<Ober | null>(null)
  const [laden, setLaden] = useState(true)
  const [opslaan, setOpslaan] = useState(false)
  const [opgeslagen, setOpgeslagen] = useState(false)
  const [fout, setFout] = useState('')

  // Profiel
  const [naam, setNaam] = useState('')
  const [gebruikersnaam, setGebruikersnaam] = useState('')
  const [fotoUrl, setFotoUrl] = useState('')
  const [voorstelling, setVoorstelling] = useState('')
  const [verhaal, setVerhaal] = useState('')
  const [spaardoelNaam, setSpaardoelNaam] = useState('')
  const [spaardoelBedrag, setSpaardoelBedrag] = useState('')
  const [fotoLaden, setFotoLaden] = useState(false)

  // IBAN
  const [iban, setIban] = useState('')
  const [ibanNaam, setIbanNaam] = useState('')
  const [ibanOpslaan, setIbanOpslaan] = useState(false)
  const [ibanOpgeslagen, setIbanOpgeslagen] = useState(false)
  const [ibanFout, setIbanFout] = useState('')

  // NAW & contact
  const [telefoon, setTelefoon] = useState('')
  const [straat, setStraat] = useState('')
  const [postcode, setPostcode] = useState('')
  const [stad, setStad] = useState('')
  const [land, setLand] = useState('België')

  // Fiscaal
  const [btwNummer, setBtwNummer] = useState('')

  // Bedrijf-specifiek (alleen zichtbaar als account_type === 'bedrijf')
  const [bedrijfId, setBedrijfId] = useState<string | null>(null)
  const [statutaireNaam, setStatutaireNaam] = useState('')
  const [kvk, setKvk] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { window.location.href = '/inloggen'; return }

      const snap = await getDoc(doc(db, 'obers', user.uid))
      if (!snap.exists()) { window.location.href = '/registreer'; return }

      const data = { id: snap.id, ...snap.data() } as Ober
      setOber(data)
      setNaam(data.naam)
      setGebruikersnaam(data.gebruikersnaam)
      setFotoUrl(data.foto_url ?? '')
      setVoorstelling(data.voorstelling ?? '')
      setVerhaal(data.verhaal ?? '')
      setSpaardoelNaam(data.spaardoel_naam ?? '')
      setSpaardoelBedrag(data.spaardoel_bedrag ? String(data.spaardoel_bedrag) : '')
      setIban(data.iban ?? '')
      setIbanNaam(data.iban_naam ?? '')
      setTelefoon(data.telefoon ?? '')
      setStraat(data.adres_straat ?? '')
      setPostcode(data.adres_postcode ?? '')
      setStad(data.adres_stad ?? '')
      setLand(data.adres_land ?? 'België')
      setBtwNummer(data.btw_nummer ?? '')

      if (data.account_type === 'bedrijf' && data.bedrijf_id) {
        setBedrijfId(data.bedrijf_id)
        const bedrijfSnap = await getDoc(doc(db, 'bedrijven', data.bedrijf_id))
        if (bedrijfSnap.exists()) {
          const b = bedrijfSnap.data()
          setStatutaireNaam(b.statutaire_naam ?? '')
          setKvk(b.kvk ?? '')
        }
      }

      setLaden(false)
    })
    return () => unsubscribe()
  }, [])

  async function profielOpslaan(e: React.FormEvent) {
    e.preventDefault()
    if (!ober) return
    setOpslaan(true)
    setFout('')
    setOpgeslagen(false)

    const slug = gebruikersnaam.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (slug.length < 3) {
      setFout('Gebruikersnaam moet minimaal 3 tekens bevatten')
      setOpslaan(false)
      return
    }

    if (slug !== ober.gebruikersnaam) {
      const q = query(collection(db, 'obers'), where('gebruikersnaam', '==', slug))
      const check = await getDocs(q)
      if (!check.empty) {
        setFout('Deze gebruikersnaam is al bezet')
        setOpslaan(false)
        return
      }
    }

    const bedrag = spaardoelBedrag ? parseFloat(spaardoelBedrag.replace(',', '.')) : null

    try {
      await updateDoc(doc(db, 'obers', ober.id), {
        naam,
        gebruikersnaam: slug,
        foto_url: fotoUrl || null,
        voorstelling: voorstelling.trim() || null,
        verhaal: verhaal.trim() || null,
        spaardoel_naam: spaardoelNaam.trim() || null,
        spaardoel_bedrag: bedrag && !isNaN(bedrag) ? bedrag : null,
        telefoon: telefoon.trim() || null,
        adres_straat: straat.trim() || null,
        adres_postcode: postcode.trim() || null,
        adres_stad: stad.trim() || null,
        adres_land: land,
        btw_nummer: btwNummer.trim() || null,
      })

      if (ober.account_type === 'bedrijf' && bedrijfId) {
        await updateDoc(doc(db, 'bedrijven', bedrijfId), {
          naam,
          statutaire_naam: statutaireNaam.trim() || null,
          kvk: kvk.trim() || null,
          telefoon: telefoon.trim() || null,
          adres_straat: straat.trim() || null,
          adres_postcode: postcode.trim() || null,
          adres_stad: stad.trim() || null,
          adres_land: land,
          btw_nummer: btwNummer.trim() || null,
        })
      }

      setOpgeslagen(true)
    } catch {
      setFout('Opslaan mislukt. Probeer het opnieuw.')
    }
    setOpslaan(false)
  }

  async function ibanOpslaanHandler(e: React.FormEvent) {
    e.preventDefault()
    if (!ober) return
    setIbanOpslaan(true)
    setIbanFout('')
    setIbanOpgeslagen(false)
    try {
      const user = auth.currentUser
      if (!user) throw new Error('Niet ingelogd')
      const token = await getIdToken(user)
      const res = await fetch('/api/mijn/iban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ iban, iban_naam: ibanNaam }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.fout ?? 'Opslaan mislukt')
      setIbanOpgeslagen(true)
    } catch (err: unknown) {
      setIbanFout(err instanceof Error ? err.message : 'Opslaan mislukt')
    }
    setIbanOpslaan(false)
  }

  async function fotoUploaden(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !ober) return
    setFotoLaden(true)
    setFout('')
    try {
      const storageRef = ref(storage, `profielfoto/${ober.id}/foto`)
      const snapshot = await uploadBytes(storageRef, file)
      const url = await getDownloadURL(snapshot.ref)
      setFotoUrl(url)
    } catch {
      setFout('Foto uploaden mislukt. Probeer het opnieuw.')
    } finally {
      setFotoLaden(false)
      e.target.value = ''
    }
  }

  if (laden) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!ober) return null

  const isBedrijf = ober.account_type === 'bedrijf'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Terug</Link>
          <h1 className="font-bold text-gray-900">Profiel bewerken</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 pb-12">
        <form onSubmit={profielOpslaan} className="space-y-5">

          {/* Foto */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-brand-100 flex items-center justify-center flex-shrink-0">
                {fotoUrl
                  ? <img src={fotoUrl} alt={naam} className="w-full h-full object-cover" />
                  : <span className="text-2xl">{isBedrijf ? '🏪' : '👤'}</span>}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{naam || 'Jouw naam'}</p>
                <p className="text-sm text-gray-400">tipdirect.be/{gebruikersnaam || '...'}</p>
              </div>
            </div>
            <label className={`flex items-center gap-3 w-full px-4 py-3 border-2 rounded-xl transition-all ${fotoLaden ? 'border-brand-300 bg-brand-50 cursor-not-allowed' : 'border-dashed border-gray-200 hover:border-brand-400 cursor-pointer'}`}>
              <input type="file" accept="image/*" className="hidden" onChange={fotoUploaden} disabled={fotoLaden} />
              <span className="text-lg">📷</span>
              <span className="text-gray-500 text-sm">
                {fotoLaden ? 'Uploaden...' : fotoUrl ? 'Andere foto uploaden' : 'Foto kiezen en uploaden'}
              </span>
            </label>
            {fotoUrl && !fotoLaden && (
              <button type="button" onClick={() => setFotoUrl('')} className="text-xs text-gray-400 hover:text-red-500 transition-colors mt-2">
                Foto verwijderen
              </button>
            )}
          </div>

          {/* Naam & gebruikersnaam */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {isBedrijf ? 'Bedrijfsgegevens' : 'Persoonlijke gegevens'}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isBedrijf ? 'Handelsnaam' : 'Naam'}
              </label>
              <input type="text" required value={naam} onChange={e => setNaam(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                placeholder={isBedrijf ? 'Restaurant De Gouden Lepel' : 'Jouw naam'} />
            </div>

            {isBedrijf && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statutaire naam <span className="text-gray-400 font-normal">(indien afwijkend)</span></label>
                <input type="text" value={statutaireNaam} onChange={e => setStatutaireNaam(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                  placeholder="Gouden Lepel BV" />
              </div>
            )}

            {!isBedrijf && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gebruikersnaam</label>
                <div className="flex items-center border-2 border-gray-200 rounded-xl focus-within:border-brand-500 overflow-hidden">
                  <span className="pl-4 text-gray-400 text-sm whitespace-nowrap">tipdirect.be/</span>
                  <input type="text" required value={gebruikersnaam}
                    onChange={e => setGebruikersnaam(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    className="flex-1 px-2 py-3 focus:outline-none bg-transparent placeholder:text-gray-400 text-gray-900"
                    placeholder="jounaam" />
                </div>
                <p className="text-xs text-gray-400 mt-1">Alleen kleine letters en cijfers</p>
              </div>
            )}
          </div>

          {/* NAW & contact */}
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
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fiscaal</p>
            {isBedrijf && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">KvK / Ondernemingsnummer</label>
                <input type="text" value={kvk} onChange={e => setKvk(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                  placeholder="BE 0xxx.xxx.xxx of KvK 12345678" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BTW-nummer <span className="text-gray-400 font-normal">(optioneel)</span></label>
              <input type="text" value={btwNummer} onChange={e => setBtwNummer(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                placeholder="BE 0xxx.xxx.xxx" />
            </div>
          </div>

          {/* Profiel-teksten (alleen individueel) */}
          {!isBedrijf && (
            <>
              <div className="bg-white rounded-xl shadow-sm p-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Korte voorstelling</label>
                <textarea value={voorstelling} onChange={e => setVoorstelling(e.target.value.slice(0, 150))} rows={3}
                  placeholder="Hoi, ik ben Thomas, ober in restaurant De Gouden Lepel. Ik help je graag!"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900 resize-none" />
                <p className="text-xs text-gray-400 mt-1">{voorstelling.length}/150 tekens · Zichtbaar op jouw betaalpagina</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">✨</span>
                  <label className="block text-sm font-medium text-gray-700">Story Behind the Smile</label>
                </div>
                <p className="text-xs text-gray-400 mb-3">Vertel waarvoor je spaart. Klanten die dit zien geven vaker én meer.</p>
                <textarea value={verhaal} onChange={e => setVerhaal(e.target.value.slice(0, 200))} rows={3}
                  placeholder='"Ik spaar voor mijn studies fotografie."'
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900 resize-none" />
                <p className="text-xs text-gray-400 mt-1">{verhaal.length}/200 tekens</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🎯</span>
                  <label className="block text-sm font-medium text-gray-700">Spaardoel</label>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Naam van je doel</label>
                  <input type="text" value={spaardoelNaam} onChange={e => setSpaardoelNaam(e.target.value.slice(0, 60))}
                    placeholder='"Wereldreis" of "Nieuwe camera"'
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Doelbedrag (€)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">€</span>
                    <input type="number" min="1" step="1" value={spaardoelBedrag} onChange={e => setSpaardoelBedrag(e.target.value)}
                      placeholder="1000"
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900" />
                  </div>
                </div>
              </div>
            </>
          )}

          {fout && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm font-medium">{fout}</p>
            </div>
          )}
          {opgeslagen && (
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-3">
              <p className="text-brand-700 text-sm font-medium">Gegevens opgeslagen!</p>
            </div>
          )}

          <button type="submit" disabled={opslaan}
            className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl transition-all">
            {opslaan ? 'Opslaan...' : 'Gegevens opslaan'}
          </button>
        </form>

        {/* IBAN — apart formulier */}
        <form onSubmit={ibanOpslaanHandler} className="space-y-5 mt-5">
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏦</span>
              <h2 className="font-semibold text-gray-900">Uitbetaalrekening</h2>
            </div>
            <p className="text-xs text-gray-400">Fooien worden netto uitbetaald op dit rekeningnummer.</p>
            <div>
              <label className="block text-xs text-gray-500 mb-1">IBAN-nummer</label>
              <input type="text" value={iban} onChange={e => setIban(e.target.value.toUpperCase())}
                placeholder="NL00 BANK 0000 0000 00"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900 font-mono tracking-wide" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Naam rekeninghouder</label>
              <input type="text" value={ibanNaam} onChange={e => setIbanNaam(e.target.value)}
                placeholder="Voor- en achternaam"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900" />
            </div>
            {ibanFout && <div className="bg-red-50 border border-red-200 rounded-xl p-3"><p className="text-red-600 text-sm font-medium">{ibanFout}</p></div>}
            {ibanOpgeslagen && <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3"><p className="text-emerald-700 text-sm font-medium">Rekening opgeslagen!</p></div>}
            <button type="submit" disabled={ibanOpslaan || !iban || !ibanNaam}
              className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl transition-all">
              {ibanOpslaan ? 'Opslaan...' : 'Rekening opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
