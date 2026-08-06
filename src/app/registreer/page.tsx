'use client'

import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import Link from 'next/link'
import Image from 'next/image'

type Stap = 'keuze' | 'account' | 'profiel' | 'betaling' | 'klaar'
type AccountType = 'individueel' | 'bedrijf'

const LANDEN = ['België', 'Nederland', 'Luxemburg', 'Duitsland', 'Frankrijk', 'Andere']

export default function RegistreerPagina() {
  const [stap, setStap] = useState<Stap>('keuze')
  const [accountType, setAccountType] = useState<AccountType>('individueel')
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [userId, setUserId] = useState('')
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [laden, setLaden] = useState(false)
  const [fout, setFout] = useState('')
  const [abonnementsBedragBedrijf, setAbonnementsBedragBedrijf] = useState(7500)
  const [betaalBezig, setBetaalBezig] = useState(false)

  // Individueel
  const [naam, setNaam] = useState('')
  const [gebruikersnaam, setGebruikersnaam] = useState('')
  const [iban, setIban] = useState('')
  const [ibanNaam, setIbanNaam] = useState('')
  const [sepaAkkoord, setSepaAkkoord] = useState(false)

  // Bedrijf
  const [bedrijfsnaam, setBedrijfsnaam] = useState('')
  const [statutaireNaam, setStatutaireNaam] = useState('')

  // Gedeeld (NAW)
  const [straat, setStraat] = useState('')
  const [postcode, setPostcode] = useState('')
  const [stad, setStad] = useState('')
  const [land, setLand] = useState('België')
  const [telefoon, setTelefoon] = useState('')

  // Bedrijf fiscaal
  const [kvk, setKvk] = useState('')
  const [btwNummer, setBtwNummer] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const partner = params.get('partner')
    if (partner) setPartnerId(partner)

    fetch('/api/admin/config')
      .then(r => r.json())
      .then(d => { if (d.abonnementsBedragBedrijf) setAbonnementsBedragBedrijf(d.abonnementsBedragBedrijf) })
      .catch(() => {})
  }, [])

  function keuzeGemaakt(type: AccountType) {
    setAccountType(type)
    setStap('account')
  }

  async function accountAanmaken(e: React.FormEvent) {
    e.preventDefault()
    setLaden(true)
    setFout('')
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, wachtwoord)
      setUserId(user.uid)
      setStap('profiel')
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      if (error.code === 'auth/email-already-in-use') {
        setFout('Dit e-mailadres is al in gebruik.')
      } else if (error.code === 'auth/weak-password') {
        setFout('Wachtwoord is te zwak. Gebruik minimaal 6 tekens.')
      } else {
        setFout(`Fout: ${error.code ?? error.message ?? 'Onbekende fout'}`)
      }
    }
    setLaden(false)
  }

  async function profielOpslaan(e: React.FormEvent) {
    e.preventDefault()
    setLaden(true)
    setFout('')

    const slug = (accountType === 'bedrijf' ? bedrijfsnaam : naam)
      .toLowerCase().replace(/[^a-z0-9]/g, '')

    if (slug.length < 3) {
      setFout('Naam moet minimaal 3 letters bevatten.')
      setLaden(false)
      return
    }

    const slugGebruikersnaam = accountType === 'individueel'
      ? gebruikersnaam.toLowerCase().replace(/[^a-z0-9]/g, '')
      : `${slug}beheer`

    if (accountType === 'individueel' && slugGebruikersnaam.length < 3) {
      setFout('Gebruikersnaam moet minimaal 3 tekens bevatten.')
      setLaden(false)
      return
    }

    if (accountType === 'individueel') {
      const ibanClean = iban.replace(/\s/g, '').toUpperCase()
      if (ibanClean.length < 10) {
        setFout('Vul een geldig IBAN-nummer in.')
        setLaden(false)
        return
      }
      if (!ibanNaam.trim()) {
        setFout('Vul de naam van de rekeninghouder in.')
        setLaden(false)
        return
      }
      if (!sepaAkkoord) {
        setFout('Geef toestemming voor automatische incasso om door te gaan.')
        setLaden(false)
        return
      }
    }

    const q = query(collection(db, 'obers'), where('gebruikersnaam', '==', slugGebruikersnaam))
    const check = await getDocs(q)
    if (!check.empty) {
      setFout('Deze gebruikersnaam is al bezet. Kies een andere.')
      setLaden(false)
      return
    }

    try {
      if (accountType === 'bedrijf') {
        const bedrijfRef = doc(collection(db, 'bedrijven'))
        await setDoc(bedrijfRef, {
          naam: bedrijfsnaam,
          statutaire_naam: statutaireNaam || null,
          email,
          telefoon: telefoon || null,
          adres_straat: straat || null,
          adres_postcode: postcode || null,
          adres_stad: stad || null,
          adres_land: land,
          kvk: kvk || null,
          btw_nummer: btwNummer || null,
          logo_url: null,
          aangemaakt_op: new Date().toISOString(),
        })

        await setDoc(doc(db, 'obers', userId), {
          email,
          naam: bedrijfsnaam,
          gebruikersnaam: slugGebruikersnaam,
          foto_url: null,
          iban: null,
          iban_naam: null,
          actief: false,
          account_type: 'bedrijf',
          bedrijf_id: bedrijfRef.id,
          telefoon: telefoon || null,
          adres_straat: straat || null,
          adres_postcode: postcode || null,
          adres_stad: stad || null,
          adres_land: land,
          btw_nummer: btwNummer || null,
          aangebracht_door: partnerId,
          aangemaakt_op: new Date().toISOString(),
        })
      } else {
        await setDoc(doc(db, 'obers', userId), {
          email,
          naam,
          gebruikersnaam: slugGebruikersnaam,
          foto_url: null,
          iban: iban.replace(/\s/g, '').toUpperCase(),
          iban_naam: ibanNaam.trim(),
          actief: true,
          account_type: 'individueel',
          bedrijf_id: null,
          telefoon: telefoon || null,
          adres_straat: straat || null,
          adres_postcode: postcode || null,
          adres_stad: stad || null,
          adres_land: land,
          btw_nummer: btwNummer || null,
          aangebracht_door: partnerId,
          aangemaakt_op: new Date().toISOString(),
          sepa_akkoord: true,
          sepa_akkoord_datum: new Date().toISOString(),
        })
      }

      setStap(accountType === 'bedrijf' ? 'betaling' : 'klaar')
    } catch {
      setFout('Opslaan mislukt. Probeer het opnieuw.')
    }
    setLaden(false)
  }

  async function naarBetaling() {
    setBetaalBezig(true)
    try {
      const { getIdToken } = await import('firebase/auth')
      const user = auth.currentUser
      if (!user) return
      const token = await getIdToken(user)
      const res = await fetch('/api/betaling/abonnement', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.fout)
      window.location.href = data.betaalUrl
    } catch {
      setBetaalBezig(false)
      setFout('Betaling starten mislukt. Probeer het opnieuw.')
    }
  }

  if (stap === 'betaling') {
    const BTW_PERCENTAGE = 21
    const btwCenten = Math.round(abonnementsBedragBedrijf * BTW_PERCENTAGE / 100)
    const totalCenten = abonnementsBedragBedrijf + btwCenten
    const bedragExBtwEuro = (abonnementsBedragBedrijf / 100).toFixed(2).replace('.', ',')
    const btwEuro = (btwCenten / 100).toFixed(2).replace('.', ',')
    const totalEuro = (totalCenten / 100).toFixed(2).replace('.', ',')
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Link href="/">
              <Image src="/logotd.png" alt="TipDirect" width={200} height={80} className="h-14 w-auto mx-auto mb-3" />
            </Link>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🏪</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Account aangemaakt!</h1>
              <p className="text-sm text-gray-500 mt-1">
                Activeer je account om te starten met TipDirect.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Bedrijfsabonnement (ex. BTW)</span>
                <span className="text-gray-700">€{bedragExBtwEuro}/jaar</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">BTW {BTW_PERCENTAGE}%</span>
                <span className="text-gray-700">€{btwEuro}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-1">
                <span className="font-semibold text-gray-900">Totaal (incl. BTW)</span>
                <span className="font-semibold text-gray-900">€{totalEuro}</span>
              </div>
              <div className="flex justify-between text-sm pt-1">
                <span className="text-gray-500">Team-QR codes</span>
                <span className="text-gray-700">Onbeperkt</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Fooien per medewerker</span>
                <span className="text-gray-700">Direct uitbetaald</span>
              </div>
            </div>

            {fout && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-red-600 text-sm font-medium">{fout}</p>
              </div>
            )}

            <button
              onClick={naarBetaling}
              disabled={betaalBezig}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl transition-all"
            >
              {betaalBezig ? 'Doorsturen naar betaling...' : `Betaal en activeer — €${totalEuro}`}
            </button>

            <p className="text-center text-xs text-gray-400 mt-3">
              Veilige betaling via Mollie · Je wordt direct doorgestuurd
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (stap === 'klaar') {
    const slug = gebruikersnaam.toLowerCase().replace(/[^a-z0-9]/g, '')

    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Je bent klaar!</h1>
          <p className="text-gray-500 mb-6">Je persoonlijke betaalpagina is live op:</p>
          <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-6 font-mono text-brand-700 break-all">
            tipdirect.be/{slug}
          </div>
          <Link
            href="/dashboard"
            className="block w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all text-center"
          >
            Naar mijn dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-start justify-center p-4 pt-8">
      <div className="w-full max-w-sm pb-12">
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/logotd.png" alt="TipDirect" width={200} height={80} className="h-14 w-auto mx-auto mb-3" />
          </Link>
          <p className="text-gray-500">
            {stap === 'keuze' && 'Hoe wil je TipDirect gebruiken?'}
            {stap === 'account' && 'Maak je account aan'}
            {stap === 'profiel' && (accountType === 'bedrijf' ? 'Gegevens van uw zaak' : 'Stel je profiel in')}
          </p>
        </div>

        {stap !== 'keuze' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {(accountType === 'bedrijf' ? ['account', 'profiel', 'betaling'] : ['account', 'profiel']).map((s, i) => {
              const stappen = accountType === 'bedrijf' ? ['account', 'profiel', 'betaling', 'klaar'] : ['account', 'profiel', 'klaar']
              const stapIndex = stappen.indexOf(stap)
              const thisIndex = i
              const voorbij = stapIndex > thisIndex
              const huidig = stap === s
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    voorbij ? 'bg-brand-400 text-white' :
                    huidig ? 'bg-brand-500 text-white' :
                    'bg-gray-200 text-gray-400'
                  }`}>
                    {voorbij ? '✓' : i + 1}
                  </div>
                  {i < (accountType === 'bedrijf' ? 2 : 1) && <div className="w-12 h-0.5 bg-gray-200" />}
                </div>
              )
            })}
          </div>
        )}

        {/* Stap 1: Keuze */}
        {stap === 'keuze' && (
          <div className="space-y-3">
            <button
              onClick={() => keuzeGemaakt('individueel')}
              className="w-full bg-white border-2 border-gray-200 hover:border-brand-500 rounded-2xl p-5 text-left transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">👤</div>
                <div>
                  <p className="font-bold text-gray-900 group-hover:text-brand-600">Ik ben een ZZP'er</p>
                  <p className="text-sm text-gray-500">Ontvang fooien via jouw persoonlijke QR-code</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => keuzeGemaakt('bedrijf')}
              className="w-full bg-white border-2 border-gray-200 hover:border-brand-500 rounded-2xl p-5 text-left transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">🏪</div>
                <div>
                  <p className="font-bold text-gray-900 group-hover:text-brand-600">Ik ben een horecazaak</p>
                  <p className="text-sm text-gray-500">Beheer je team en volg alle fooien per medewerker</p>
                </div>
              </div>
            </button>

            <p className="text-center text-sm text-gray-500 pt-2">
              Al een account?{' '}
              <Link href="/inloggen" className="text-brand-700 font-medium">Inloggen</Link>
            </p>
          </div>
        )}

        {/* Stap 2: Account */}
        {stap === 'account' && (
          <form onSubmit={accountAanmaken} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mailadres</label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                placeholder="jouw@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wachtwoord</label>
              <input
                type="password" required minLength={6} value={wachtwoord}
                onChange={e => setWachtwoord(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                placeholder="Minimaal 6 tekens"
              />
            </div>
            {fout && <div className="bg-red-50 border border-red-200 rounded-xl p-3"><p className="text-red-600 text-sm font-medium">{fout}</p></div>}
            <button type="submit" disabled={laden} className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 text-white font-bold rounded-xl transition-all">
              {laden ? 'Bezig...' : 'Volgende'}
            </button>
            <button type="button" onClick={() => setStap('keuze')} className="w-full text-center text-sm text-gray-400 hover:text-gray-600">← Terug</button>
          </form>
        )}

        {/* Stap 3a: Individueel */}
        {stap === 'profiel' && accountType === 'individueel' && (
          <form onSubmit={profielOpslaan} className="space-y-5">

            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Persoonlijke gegevens</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Je naam</label>
                <input type="text" required value={naam} onChange={e => setNaam(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                  placeholder="Marco de Vries" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gebruikersnaam</label>
                <div className="flex items-center border-2 border-gray-200 rounded-xl focus-within:border-brand-500 overflow-hidden">
                  <span className="pl-4 text-gray-400 text-sm whitespace-nowrap">tipdirect.be/</span>
                  <input type="text" required value={gebruikersnaam}
                    onChange={e => setGebruikersnaam(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    className="flex-1 px-2 py-3 focus:outline-none bg-transparent placeholder:text-gray-400 text-gray-900"
                    placeholder="marco" />
                </div>
                <p className="text-xs text-gray-400 mt-1">Alleen kleine letters en cijfers</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefoonnummer <span className="text-gray-400 font-normal">(optioneel)</span></label>
                <input type="tel" value={telefoon} onChange={e => setTelefoon(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                  placeholder="+32 xxx xx xx xx" />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Adresgegevens</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Straat + huisnummer</label>
                <input type="text" required value={straat} onChange={e => setStraat(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                  placeholder="Kerkstraat 12" />
              </div>
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                  <input type="text" required value={postcode} onChange={e => setPostcode(e.target.value)}
                    className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                    placeholder="2000" />
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stad</label>
                  <input type="text" required value={stad} onChange={e => setStad(e.target.value)}
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

            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fiscaal <span className="font-normal text-gray-400">(optioneel)</span></p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BTW-nummer</label>
                <input type="text" value={btwNummer} onChange={e => setBtwNummer(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                  placeholder="BE 0xxx.xxx.xxx" />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bankrekening & incassomachtiging</p>
              <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
                <p className="text-xs text-brand-700 leading-relaxed">
                  Je abonnement (€25) wordt voldaan via de fooien die je ontvangt — <strong>je betaalt niets vooraf</strong>. Heb je na 30 dagen het abonnement nog niet voldaan via fooien, dan incasseren wij het resterende bedrag automatisch via SEPA-incasso.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IBAN-nummer</label>
                <input type="text" required value={iban}
                  onChange={e => setIban(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900 font-mono"
                  placeholder="BE00 0000 0000 0000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Naam rekeninghouder</label>
                <input type="text" required value={ibanNaam}
                  onChange={e => setIbanNaam(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                  placeholder="Marco de Vries" />
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={sepaAkkoord} onChange={e => setSepaAkkoord(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-brand-500 flex-shrink-0" />
                <span className="text-xs text-gray-600 leading-relaxed">
                  Ik geef TipDirect toestemming om, indien het abonnementsbedrag na 30 dagen niet is voldaan via ontvangen fooien, het resterende bedrag automatisch via SEPA-incasso te innen van bovenstaand rekeningnummer. Ik kan deze machtiging intrekken via mijn dashboard.
                </span>
              </label>
            </div>

            {fout && <p className="text-red-500 text-sm">{fout}</p>}
            <button type="submit" disabled={laden}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 text-white font-bold rounded-xl transition-all">
              {laden ? 'Opslaan...' : 'Account aanmaken'}
            </button>
          </form>
        )}

        {/* Stap 3b: Bedrijf */}
        {stap === 'profiel' && accountType === 'bedrijf' && (
          <form onSubmit={profielOpslaan} className="space-y-5">

            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bedrijfsgegevens</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Handelsnaam <span className="text-gray-400 font-normal">(naam van uw zaak)</span></label>
                <input type="text" required value={bedrijfsnaam} onChange={e => setBedrijfsnaam(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                  placeholder="Restaurant De Gouden Lepel" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statutaire naam <span className="text-gray-400 font-normal">(indien afwijkend)</span></label>
                <input type="text" value={statutaireNaam} onChange={e => setStatutaireNaam(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                  placeholder="Gouden Lepel BV" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefoonnummer</label>
                <input type="tel" required value={telefoon} onChange={e => setTelefoon(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                  placeholder="+32 xxx xx xx xx" />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Adresgegevens</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Straat + huisnummer</label>
                <input type="text" required value={straat} onChange={e => setStraat(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                  placeholder="Kerkstraat 12" />
              </div>
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                  <input type="text" required value={postcode} onChange={e => setPostcode(e.target.value)}
                    className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                    placeholder="2000" />
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stad</label>
                  <input type="text" required value={stad} onChange={e => setStad(e.target.value)}
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

            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fiscaal & registratie</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">KBO-nummer</label>
                <input type="text" required value={kvk} onChange={e => setKvk(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                  placeholder="BE 0xxx.xxx.xxx" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BTW-nummer <span className="text-gray-400 font-normal">(optioneel)</span></label>
                <input type="text" value={btwNummer} onChange={e => setBtwNummer(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                  placeholder="BE 0xxx.xxx.xxx" />
              </div>
            </div>

            {fout && <p className="text-red-500 text-sm">{fout}</p>}
            <button type="submit" disabled={laden}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 text-white font-bold rounded-xl transition-all">
              {laden ? 'Opslaan...' : 'Account aanmaken'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
