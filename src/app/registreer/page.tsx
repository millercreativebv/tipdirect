'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Stap = 'account' | 'profiel' | 'klaar'

export default function RegistreerPagina() {
  const [stap, setStap] = useState<Stap>('account')
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [naam, setNaam] = useState('')
  const [gebruikersnaam, setGebruikersnaam] = useState('')
  const [laden, setLaden] = useState(false)
  const [fout, setFout] = useState('')

  async function accountAanmaken(e: React.FormEvent) {
    e.preventDefault()
    setLaden(true)
    setFout('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password: wachtwoord,
    })

    if (error) {
      setFout(error.message)
      setLaden(false)
      return
    }

    if (data.user) {
      setStap('profiel')
    }
    setLaden(false)
  }

  async function profielOpslaan(e: React.FormEvent) {
    e.preventDefault()
    setLaden(true)
    setFout('')

    const slug = gebruikersnaam.toLowerCase().replace(/[^a-z0-9]/g, '')

    if (slug.length < 3) {
      setFout('Gebruikersnaam moet minimaal 3 tekens bevatten (alleen letters en cijfers)')
      setLaden(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setFout('Niet ingelogd')
      setLaden(false)
      return
    }

    // Controleer of gebruikersnaam al bestaat
    const { data: bestaand } = await supabase
      .from('obers')
      .select('id')
      .eq('gebruikersnaam', slug)
      .single()

    if (bestaand) {
      setFout('Deze gebruikersnaam is al bezet. Kies een andere.')
      setLaden(false)
      return
    }

    const { error } = await supabase.from('obers').insert({
      id: user.id,
      email: user.email,
      naam,
      gebruikersnaam: slug,
    })

    if (error) {
      setFout('Opslaan mislukt: ' + error.message)
      setLaden(false)
      return
    }

    setStap('klaar')
    setLaden(false)
  }

  if (stap === 'klaar') {
    const slug = gebruikersnaam.toLowerCase().replace(/[^a-z0-9]/g, '')
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Je bent klaar!</h1>
          <p className="text-gray-500 mb-6">
            Je persoonlijke betaalpagina is live op:
          </p>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6 font-mono text-emerald-700 break-all">
            tipdirect.nl/{slug}
          </div>
          <Link
            href="/dashboard"
            className="block w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all text-center"
          >
            Naar mijn dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Aanmelden bij TipDirect</h1>
          <p className="text-gray-500 mt-1">
            {stap === 'account' ? 'Maak je account aan' : 'Stel je profiel in'}
          </p>
        </div>

        {/* Stap indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${stap === 'account' ? 'bg-emerald-500 text-white' : 'bg-green-400 text-white'}`}>
            {stap === 'account' ? '1' : '✓'}
          </div>
          <div className="w-12 h-0.5 bg-gray-200" />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${stap === 'profiel' ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
            2
          </div>
        </div>

        {stap === 'account' && (
          <form onSubmit={accountAanmaken} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mailadres</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                placeholder="jouw@email.nl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wachtwoord</label>
              <input
                type="password"
                required
                minLength={8}
                value={wachtwoord}
                onChange={(e) => setWachtwoord(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                placeholder="Minimaal 8 tekens"
              />
            </div>
            {fout && <p className="text-red-500 text-sm">{fout}</p>}
            <button
              type="submit"
              disabled={laden}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 text-white font-bold rounded-xl transition-all"
            >
              {laden ? 'Bezig...' : 'Account aanmaken'}
            </button>
            <p className="text-center text-sm text-gray-500">
              Al een account?{' '}
              <Link href="/inloggen" className="text-emerald-700 font-medium">Inloggen</Link>
            </p>
          </form>
        )}

        {stap === 'profiel' && (
          <form onSubmit={profielOpslaan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Je naam</label>
              <input
                type="text"
                required
                value={naam}
                onChange={(e) => setNaam(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                placeholder="Marco de Vries"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gebruikersnaam</label>
              <div className="flex items-center border-2 border-gray-200 rounded-xl focus-within:border-emerald-500 overflow-hidden">
                <span className="pl-4 text-gray-400 text-sm whitespace-nowrap">tipdirect.nl/</span>
                <input
                  type="text"
                  required
                  value={gebruikersnaam}
                  onChange={(e) => setGebruikersnaam(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                  className="flex-1 px-2 py-3 focus:outline-none bg-transparent"
                  placeholder="marco"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Alleen kleine letters en cijfers</p>
            </div>
            {fout && <p className="text-red-500 text-sm">{fout}</p>}
            <button
              type="submit"
              disabled={laden}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 text-white font-bold rounded-xl transition-all"
            >
              {laden ? 'Opslaan...' : 'Profiel opslaan'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
