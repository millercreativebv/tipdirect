'use client'

import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import Link from 'next/link'
import Image from 'next/image'

type Stap = 'keuze' | 'account' | 'profiel' | 'klaar'
type AccountType = 'individueel' | 'bedrijf'

export default function RegistreerPagina() {
  const [stap, setStap] = useState<Stap>('keuze')
  const [accountType, setAccountType] = useState<AccountType>('individueel')
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [naam, setNaam] = useState('')
  const [gebruikersnaam, setGebruikersnaam] = useState('')
  const [bedrijfsnaam, setBedrijfsnaam] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [userId, setUserId] = useState('')
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [laden, setLaden] = useState(false)
  const [fout, setFout] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const partner = params.get('partner')
    if (partner) setPartnerId(partner)
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
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')

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
          email,
          kvk: null,
          logo_url: logoUrl || null,
          aangemaakt_op: new Date().toISOString(),
        })

        await setDoc(doc(db, 'obers', userId), {
          email,
          naam: bedrijfsnaam,
          gebruikersnaam: slugGebruikersnaam,
          foto_url: logoUrl || null,
          iban: null,
          iban_naam: null,
          actief: false,
          account_type: 'bedrijf',
          bedrijf_id: bedrijfRef.id,
          aangebracht_door: partnerId,
          aangemaakt_op: new Date().toISOString(),
        })
      } else {
        await setDoc(doc(db, 'obers', userId), {
          email,
          naam,
          gebruikersnaam: slugGebruikersnaam,
          foto_url: null,
          iban: null,
          iban_naam: null,
          actief: true,
          account_type: 'individueel',
          bedrijf_id: null,
          aangebracht_door: partnerId,
          aangemaakt_op: new Date().toISOString(),
        })
      }

      setStap('klaar')
    } catch {
      setFout('Opslaan mislukt. Probeer het opnieuw.')
    }
    setLaden(false)
  }

  if (stap === 'klaar') {
    const slug = (accountType === 'individueel'
      ? gebruikersnaam
      : bedrijfsnaam
    ).toLowerCase().replace(/[^a-z0-9]/g, '')

    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">{accountType === 'bedrijf' ? '🏪' : '🎉'}</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {accountType === 'bedrijf' ? 'Zakelijk account aangemaakt!' : 'Je bent klaar!'}
          </h1>
          <p className="text-gray-500 mb-6">
            {accountType === 'bedrijf'
              ? 'Voeg nu je eerste medewerkers toe via het dashboard.'
              : 'Je persoonlijke betaalpagina is live op:'}
          </p>
          {accountType === 'individueel' && (
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-6 font-mono text-brand-700 break-all">
              tipdirect.nl/{slug}
            </div>
          )}
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
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
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

        {/* Stap indicator */}
        {stap !== 'keuze' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {['account', 'profiel'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  stap === s ? 'bg-brand-500 text-white' :
                  (['profiel', 'klaar'].includes(stap) && i === 0) ? 'bg-brand-400 text-white' :
                  'bg-gray-200 text-gray-400'
                }`}>
                  {(['profiel', 'klaar'].includes(stap) && i === 0) ? '✓' : i + 1}
                </div>
                {i === 0 && <div className="w-12 h-0.5 bg-gray-200" />}
              </div>
            ))}
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
                <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                  👤
                </div>
                <div>
                  <p className="font-bold text-gray-900 group-hover:text-brand-600">Ik ben een ober</p>
                  <p className="text-sm text-gray-500">Ontvang tips via jouw persoonlijke QR-code</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => keuzeGemaakt('bedrijf')}
              className="w-full bg-white border-2 border-gray-200 hover:border-brand-500 rounded-2xl p-5 text-left transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                  🏪
                </div>
                <div>
                  <p className="font-bold text-gray-900 group-hover:text-brand-600">Ik ben een horecazaak</p>
                  <p className="text-sm text-gray-500">Beheer je team en volg alle tips per medewerker</p>
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
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                placeholder="jouw@email.nl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wachtwoord</label>
              <input
                type="password"
                required
                minLength={6}
                value={wachtwoord}
                onChange={(e) => setWachtwoord(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                placeholder="Minimaal 6 tekens"
              />
            </div>
            {fout && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-600 text-sm font-medium">{fout}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={laden}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 text-white font-bold rounded-xl transition-all"
            >
              {laden ? 'Bezig...' : 'Volgende'}
            </button>
            <button type="button" onClick={() => setStap('keuze')} className="w-full text-center text-sm text-gray-400 hover:text-gray-600">
              ← Terug
            </button>
          </form>
        )}

        {/* Stap 3a: Individueel profiel */}
        {stap === 'profiel' && accountType === 'individueel' && (
          <form onSubmit={profielOpslaan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Je naam</label>
              <input
                type="text"
                required
                value={naam}
                onChange={(e) => setNaam(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                placeholder="Marco de Vries"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gebruikersnaam</label>
              <div className="flex items-center border-2 border-gray-200 rounded-xl focus-within:border-brand-500 overflow-hidden">
                <span className="pl-4 text-gray-400 text-sm whitespace-nowrap">tipdirect.nl/</span>
                <input
                  type="text"
                  required
                  value={gebruikersnaam}
                  onChange={(e) => setGebruikersnaam(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                  className="flex-1 px-2 py-3 focus:outline-none bg-transparent placeholder:text-gray-400 text-gray-900"
                  placeholder="marco"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Alleen kleine letters en cijfers</p>
            </div>
            {fout && <p className="text-red-500 text-sm">{fout}</p>}
            <button
              type="submit"
              disabled={laden}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 text-white font-bold rounded-xl transition-all"
            >
              {laden ? 'Opslaan...' : 'Account aanmaken'}
            </button>
          </form>
        )}

        {/* Stap 3b: Bedrijf profiel */}
        {stap === 'profiel' && accountType === 'bedrijf' && (
          <form onSubmit={profielOpslaan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Naam van uw zaak</label>
              <input
                type="text"
                required
                value={bedrijfsnaam}
                onChange={(e) => setBedrijfsnaam(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                placeholder="Restaurant De Gouden Lepel"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL <span className="text-gray-400 font-normal">(optioneel)</span></label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                placeholder="https://..."
              />
              <p className="text-xs text-gray-400 mt-1">Zichtbaar op de betaalpagina van uw medewerkers</p>
            </div>
            {logoUrl && (
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <img src={logoUrl} alt="Logo preview" className="w-12 h-12 object-contain rounded-lg" />
                <p className="text-sm text-gray-500">Logo preview</p>
              </div>
            )}
            {fout && <p className="text-red-500 text-sm">{fout}</p>}
            <button
              type="submit"
              disabled={laden}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 text-white font-bold rounded-xl transition-all"
            >
              {laden ? 'Opslaan...' : 'Account aanmaken'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
