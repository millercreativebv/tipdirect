'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { vertalingen, type Taal } from '@/lib/translations'
import EarningsCalculator from './EarningsCalculator'
import FAQ from './FAQ'

const TALEN: { code: Taal; label: string; vlag: string }[] = [
  { code: 'nl', label: 'NL', vlag: '🇳🇱' },
  { code: 'fr', label: 'FR', vlag: '🇫🇷' },
  { code: 'de', label: 'DE', vlag: '🇩🇪' },
  { code: 'en', label: 'EN', vlag: '🇬🇧' },
]

export default function LandingPagina() {
  const [taal, setTaal] = useState<Taal>('nl')
  const t = vertalingen[taal]

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white">

      {/* Header */}
      <header className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
        <span className="text-xl font-bold text-gray-900">TipDirect</span>
        <div className="flex items-center gap-3">
          {/* Taalkiezer */}
          <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-2 py-1">
            {TALEN.map(l => (
              <button
                key={l.code}
                onClick={() => setTaal(l.code)}
                className={`px-2 py-1 rounded-lg text-sm font-medium transition-all ${
                  taal === l.code
                    ? 'bg-brand-500 text-white'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {l.vlag} {l.label}
              </button>
            ))}
          </div>
          <Link href="/inloggen" className="text-sm text-gray-500 hover:text-gray-800">
            {t.nav.inloggen}
          </Link>
          <Link href="/registreer" className="text-sm bg-brand-500 hover:bg-brand-600 text-white font-semibold px-4 py-2 rounded-xl transition-all">
            {t.nav.aanmelden}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-4 pt-12 pb-24">
        <div className="flex flex-col-reverse sm:flex-row items-center gap-10">
          <div className="flex-1 text-center sm:text-left">
            <Image src="/logotd.png" alt="TipDirect" width={240} height={96} className="w-48 sm:w-60 h-auto mx-auto sm:mx-0 mb-8" />
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {t.hero.heading}<br />
              <span className="text-brand-500">{t.hero.headingAccent}</span>
            </h1>
            <p className="text-lg text-gray-500 mb-10">{t.hero.beschrijving}</p>
            <Link
              href="/registreer"
              className="inline-block bg-brand-500 hover:bg-brand-600 text-white font-bold text-lg px-8 py-4 rounded-xl transition-all shadow-lg shadow-brand-100"
            >
              {t.hero.cta}
            </Link>
            <p className="text-sm text-gray-400 mt-4">{t.hero.tagline}</p>
          </div>
          <div className="flex-shrink-0 w-full sm:w-auto">
            <Image
              src="/foto.jpeg"
              alt="Ober met TipDirect QR-code"
              width={420}
              height={560}
              className="w-full sm:w-96 h-auto rounded-3xl shadow-xl object-cover"
            />
          </div>
        </div>
      </main>

      {/* Hoe het werkt */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">{t.hoeHetWerkt.titel}</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: <span className="text-2xl">📝</span>, ...t.hoeHetWerkt.stappen[0] },
            { icon: <span className="text-2xl">📱</span>, ...t.hoeHetWerkt.stappen[1] },
            { icon: (
              <svg className="w-6 h-6 text-brand-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09c-2.72.69-5.4-.68-6.61-3.09H5v-1.5h1.41c-.04-.33-.07-.66-.07-1s.03-.67.07-1H5V10h1.8c1.21-2.41 3.89-3.78 6.61-3.09 1.18.3 2.22.94 3.03 1.82L14.97 10c-.55-.64-1.27-1.09-2.07-1.29-1.36-.34-2.77.11-3.68 1.09H13v1.5H8.66c-.04.33-.06.66-.06 1s.02.67.06 1H13v1.5H9.22c.91.98 2.32 1.43 3.68 1.09.8-.2 1.52-.65 2.07-1.29l1.47 1.27c-.81.88-1.85 1.52-3.03 1.82z"/>
              </svg>
            ), ...t.hoeHetWerkt.stappen[2] },
          ].map((stap, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm text-center">
              <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {stap.icon}
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{stap.titel}</h3>
              <p className="text-sm text-gray-500">{stap.tekst}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Earnings calculator */}
      <EarningsCalculator t={t.calculator} />

      {/* Kosten */}
      <section className="max-w-5xl mx-auto px-4 pb-24 text-center">
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.kosten.titel}</h2>
          <p className="text-gray-500 mb-6">{t.kosten.beschrijving}</p>
          <div className="inline-block bg-white rounded-xl px-8 py-4 shadow-sm">
            <p className="text-3xl font-bold text-brand-500">€0,50</p>
            <p className="text-sm text-gray-500 mt-1">{t.kosten.label}</p>
          </div>
          <p className="text-sm text-gray-400 mt-4">{t.kosten.voorbeeld}</p>
        </div>
      </section>

      {/* FAQ */}
      <FAQ t={t.faq} />

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>© 2026 TipDirect · {t.footer}</p>
      </footer>

    </div>
  )
}
