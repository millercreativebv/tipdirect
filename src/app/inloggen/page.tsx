'use client'

import { useState } from 'react'
import { auth } from '@/lib/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function InloggenPagina() {
  const router = useRouter()
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

  function opToets(e: React.KeyboardEvent) {
    if (e.key === 'Enter') inloggen()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/logotd.png" alt="TipDirect" width={200} height={80} className="h-14 w-auto mx-auto mb-3" />
          </Link>
          <p className="text-gray-500">Inloggen op je account</p>
        </div>

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
              placeholder="jouw@email.nl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wachtwoord</label>
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
      </div>
    </div>
  )
}
