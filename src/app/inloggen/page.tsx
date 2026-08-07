'use client'

import { useState } from 'react'
import { auth } from '@/lib/firebase'
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

type Modus = 'inloggen' | 'reset' | 'reset_verstuurd'

export default function InloggenPagina() {
  const router = useRouter()
  const [modus, setModus] = useState<Modus>('inloggen')
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [laden, setLaden] = useState(false)
  const [fout, setFout] = useState('')

  async function inloggen() {
    if (laden) return
    setLaden(true)
    setFout('')
    try {
      await signInWithEmailAndPassword(auth, email, wachtwoord)
      router.push('/dashboard')
    } catch {
      setFout('E-mailadres of wachtwoord klopt niet.')
      setLaden(false)
    }
  }

  async function resetLink() {
    if (laden || !email.trim()) { setFout('Voer je e-mailadres in.'); return }
    setLaden(true)
    setFout('')
    try {
      await sendPasswordResetEmail(auth, email.trim())
      setModus('reset_verstuurd')
    } catch {
      // Altijd succes tonen — geen info weggeven of e-mail bestaat
      setModus('reset_verstuurd')
    } finally {
      setLaden(false)
    }
  }

  function opToets(e: React.KeyboardEvent) {
    if (e.key === 'Enter') modus === 'inloggen' ? inloggen() : resetLink()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/logotd.png" alt="TipDirect" width={200} height={80} className="h-14 w-auto mx-auto mb-3" />
          </Link>
          <p className="text-gray-500">
            {modus === 'inloggen' && 'Inloggen op je account'}
            {modus === 'reset' && 'Wachtwoord opnieuw instellen'}
            {modus === 'reset_verstuurd' && 'Controleer je inbox'}
          </p>
        </div>

        {/* ── Inloggen ── */}
        {modus === 'inloggen' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mailadres</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={opToets}
                autoComplete="email"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                placeholder="jouw@email.be"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Wachtwoord</label>
                <button
                  type="button"
                  onClick={() => { setFout(''); setModus('reset') }}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                >
                  Wachtwoord vergeten?
                </button>
              </div>
              <input
                type="password"
                value={wachtwoord}
                onChange={(e) => setWachtwoord(e.target.value)}
                onKeyDown={opToets}
                autoComplete="current-password"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                placeholder="Jouw wachtwoord"
              />
            </div>

            {fout && <p className="text-red-500 text-sm">{fout}</p>}

            <button
              type="button"
              onClick={inloggen}
              disabled={laden}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 text-white font-bold rounded-xl transition-all"
            >
              {laden ? 'Bezig...' : 'Inloggen'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Nog geen account?{' '}
              <Link href="/registreer" className="text-brand-700 font-medium">Aanmelden</Link>
            </p>
          </div>
        )}

        {/* ── Wachtwoord vergeten ── */}
        {modus === 'reset' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Voer je e-mailadres in. Je ontvangt een link waarmee je een nieuw wachtwoord kunt instellen.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mailadres</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={opToets}
                autoComplete="email"
                autoFocus
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                placeholder="jouw@email.be"
              />
            </div>

            {fout && <p className="text-red-500 text-sm">{fout}</p>}

            <button
              type="button"
              onClick={resetLink}
              disabled={laden}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 text-white font-bold rounded-xl transition-all"
            >
              {laden ? 'Versturen...' : 'Verstuur resetlink'}
            </button>

            <button
              type="button"
              onClick={() => { setFout(''); setModus('inloggen') }}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              ← Terug naar inloggen
            </button>
          </div>
        )}

        {/* ── Verstuurd bevestiging ── */}
        {modus === 'reset_verstuurd' && (
          <div className="space-y-5 text-center">
            <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">✉️</span>
            </div>
            <div>
              <p className="text-gray-700 font-medium mb-1">Link verstuurd!</p>
              <p className="text-sm text-gray-500">
                Als <strong>{email}</strong> bij ons bekend is, ontvang je binnen enkele minuten een e-mail met een resetlink.
              </p>
            </div>
            <p className="text-xs text-gray-400">Geen mail ontvangen? Controleer je spammap.</p>
            <button
              type="button"
              onClick={() => { setModus('inloggen'); setFout('') }}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all"
            >
              Terug naar inloggen
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
