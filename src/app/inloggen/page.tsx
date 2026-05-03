'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function InloggenPagina() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [laden, setLaden] = useState(false)
  const [fout, setFout] = useState('')

  async function inloggen(e: React.FormEvent) {
    e.preventDefault()
    setLaden(true)
    setFout('')

    const { error } = await supabase.auth.signInWithPassword({ email, password: wachtwoord })

    if (error) {
      setFout('E-mailadres of wachtwoord klopt niet.')
      setLaden(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-xl font-bold text-gray-900">TipDirect</Link>
          <p className="text-gray-500 mt-2">Inloggen op je account</p>
        </div>

        <form onSubmit={inloggen} className="space-y-4">
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
              value={wachtwoord}
              onChange={(e) => setWachtwoord(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
              placeholder="Jouw wachtwoord"
            />
          </div>

          {fout && <p className="text-red-500 text-sm">{fout}</p>}

          <button
            type="submit"
            disabled={laden}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 text-white font-bold rounded-xl transition-all"
          >
            {laden ? 'Bezig...' : 'Inloggen'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Nog geen account?{' '}
            <Link href="/registreer" className="text-emerald-700 font-medium">Aanmelden</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
