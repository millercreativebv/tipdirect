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
  const [menuOpen, setMenuOpen] = useState(false)
  const t = vertalingen[taal]

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white">

      {/* Sticky header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">

          {/* Desktop: één rij */}
          <div className="hidden md:flex items-center justify-between gap-4">
            <a href="#">
              <Image src="/logotd.png" alt="TipDirect" width={120} height={48} className="h-8 w-auto" />
            </a>
            <nav className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#hoe-het-werkt" className="hover:text-gray-900 transition-colors">{t.nav.hoeHetWerkt}</a>
              <a href="#abonnementen" className="hover:text-gray-900 transition-colors">{t.nav.abonnementen}</a>
              <a href="#kosten" className="hover:text-gray-900 transition-colors">{t.nav.kosten}</a>
              <a href="#faq" className="hover:text-gray-900 transition-colors">{t.nav.faq}</a>
            </nav>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 border border-gray-200 rounded-xl px-1.5 py-1">
                {TALEN.map(l => (
                  <button key={l.code} onClick={() => setTaal(l.code)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${taal === l.code ? 'bg-brand-500 text-white' : 'text-gray-500 hover:text-gray-800'}`}>
                    {l.vlag} {l.label}
                  </button>
                ))}
              </div>
              <Link href="/inloggen" className="text-sm border-2 border-gray-200 hover:border-brand-500 hover:text-brand-600 text-gray-600 font-semibold px-4 py-2 rounded-xl transition-all">
                {t.nav.inloggen}
              </Link>
              <Link href="/registreer" className="text-sm bg-brand-500 hover:bg-brand-600 text-white font-semibold px-4 py-2 rounded-xl transition-all">
                {t.nav.aanmelden}
              </Link>
            </div>
          </div>

          {/* Mobiel: logo links, knoppen midden, hamburger rechts */}
          <div className="flex md:hidden items-center justify-between gap-2">
            <a href="#" className="flex-shrink-0">
              <Image src="/logotd.png" alt="TipDirect" width={100} height={40} className="h-7 w-auto" />
            </a>
            <div className="flex items-center gap-2">
              <Link href="/inloggen" className="text-xs border-2 border-gray-200 hover:border-brand-500 hover:text-brand-600 text-gray-600 font-semibold px-3 py-1.5 rounded-xl transition-all">
                {t.nav.inloggen}
              </Link>
              <Link href="/registreer" className="text-xs bg-brand-500 hover:bg-brand-600 text-white font-semibold px-3 py-1.5 rounded-xl transition-all">
                {t.nav.aanmelden}
              </Link>
            </div>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex-shrink-0 p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              {menuOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobiel menu dropdown */}
          {menuOpen && (
            <div className="md:hidden pt-3 pb-2 border-t border-gray-100 mt-3 space-y-3">
              <nav className="flex flex-col gap-1">
                {[
                  { href: '#hoe-het-werkt', label: t.nav.hoeHetWerkt },
                  { href: '#abonnementen', label: t.nav.abonnementen },
                  { href: '#kosten', label: t.nav.kosten },
                  { href: '#faq', label: t.nav.faq },
                ].map(item => (
                  <a key={item.href} href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="text-sm text-gray-600 hover:text-gray-900 py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                    {item.label}
                  </a>
                ))}
              </nav>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-2 px-2">Taal</p>
                <div className="flex gap-1 flex-wrap px-1">
                  {TALEN.map(l => (
                    <button key={l.code}
                      onClick={() => { setTaal(l.code); setMenuOpen(false) }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${taal === l.code ? 'bg-brand-500 text-white' : 'border border-gray-200 text-gray-600 hover:border-brand-400'}`}>
                      {l.vlag} {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

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
              src="/foto.jpg"
              alt="Ober met TipDirect QR-code"
              width={420}
              height={560}
              className="w-full sm:w-96 h-auto rounded-3xl shadow-xl object-cover"
            />
          </div>
        </div>
      </main>

      {/* Risicoloos instappen */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-3xl p-8 md:p-12 text-white">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 tracking-wide uppercase">Personal account</span>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{t.risicoloos.titel}</h2>
            <p className="text-brand-100 leading-relaxed">{t.risicoloos.beschrijving}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {t.risicoloos.stappen.map((stap, i) => (
              <div key={i} className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-full bg-white text-brand-600 font-bold text-sm flex items-center justify-center mb-3">{i + 1}</div>
                <p className="font-bold text-white mb-1">{stap.label}</p>
                <p className="text-sm text-brand-100">{stap.tekst}</p>
              </div>
            ))}
          </div>

          <div className="bg-white/10 rounded-2xl p-5 border border-white/20 flex items-start gap-3">
            <span className="text-xl flex-shrink-0">🛡️</span>
            <p className="text-sm text-brand-100 leading-relaxed">{t.risicoloos.veiligheidsnet}</p>
          </div>
        </div>
      </section>

      {/* Hoe het werkt */}
      <section id="hoe-het-werkt" className="max-w-5xl mx-auto px-4 pb-24">
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

      {/* Abonnementen */}
      <section id="abonnementen" className="max-w-5xl mx-auto px-4 pb-24">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{t.prijzen.titel}</h2>
          <p className="text-gray-500 max-w-xl mx-auto">{t.prijzen.subtitel}</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">

          {/* Personal */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-7 flex flex-col relative">
            {t.prijzen.personal.badge && (
              <div className="absolute top-4 right-4">
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                  {t.prijzen.personal.badge}
                </span>
              </div>
            )}
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t.prijzen.personal.naam}</p>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{t.prijzen.personal.doelgroep}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{t.prijzen.personal.beschrijving}</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">{t.prijzen.personal.prijs}</span>
              <span className="text-sm text-gray-400 ml-2">{t.prijzen.personal.periode}</span>
            </div>
            <ul className="space-y-2.5 mb-8 flex-1">
              {t.prijzen.personal.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-brand-500 font-bold mt-0.5 flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/registreer"
              className="block w-full text-center py-3 border-2 border-brand-500 text-brand-500 hover:bg-brand-50 font-bold rounded-xl transition-all"
            >
              {t.prijzen.personal.cta}
            </Link>
            <p className="text-xs text-gray-400 text-center mt-3">{t.prijzen.personal.nota}</p>
          </div>

          {/* Business */}
          <div className="bg-brand-500 rounded-2xl p-7 flex flex-col relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="bg-white text-brand-500 text-xs font-bold px-3 py-1 rounded-full">
                {t.prijzen.business.badge}
              </span>
            </div>
            <div className="mb-6">
              <p className="text-xs font-bold text-brand-200 uppercase tracking-widest mb-1">{t.prijzen.business.naam}</p>
              <h3 className="text-lg font-bold text-white mb-1">{t.prijzen.business.doelgroep}</h3>
              <p className="text-sm text-brand-100 leading-relaxed">{t.prijzen.business.beschrijving}</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">{t.prijzen.business.prijs}</span>
              <span className="text-sm text-brand-200 ml-2">{t.prijzen.business.periode}</span>
            </div>
            <ul className="space-y-2.5 mb-8 flex-1">
              {t.prijzen.business.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white">
                  <span className="text-brand-200 font-bold mt-0.5 flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/registreer"
              className="block w-full text-center py-3 bg-white text-brand-500 hover:bg-brand-50 font-bold rounded-xl transition-all"
            >
              {t.prijzen.business.cta}
            </Link>
            {t.prijzen.business.nota && (
              <p className="text-xs text-brand-200 text-center mt-3">{t.prijzen.business.nota}</p>
            )}
          </div>

        </div>
      </section>

      {/* Earnings calculator */}
      <EarningsCalculator t={t.calculator} />

      {/* Kosten */}
      <section id="kosten" className="max-w-5xl mx-auto px-4 pb-24 text-center">
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.kosten.titel}</h2>
          <p className="text-gray-500 mb-6">{t.kosten.beschrijving}</p>
          <div className="inline-block bg-white rounded-xl px-8 py-4 shadow-sm">
            <p className="text-3xl font-bold text-brand-500">€0,32</p>
            <p className="text-sm text-gray-500 mt-1">{t.kosten.label}</p>
          </div>
          <p className="text-sm text-gray-400 mt-4">{t.kosten.voorbeeld}</p>
        </div>
      </section>

      {/* Verhaal Tom Wuyts */}
      <section className="max-w-4xl mx-auto px-4 pb-24">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex flex-col md:flex-row">

            {/* Foto */}
            <div className="md:w-64 flex-shrink-0 bg-brand-50 flex items-center justify-center p-8 md:p-10">
              <div className="relative">
                <div className="w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
                  <Image
                    src="/tom.png"
                    alt="Tom Wuyts"
                    width={176}
                    height={176}
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
            </div>

            {/* Tekst */}
            <div className="flex-1 p-8 md:p-10">
              <span className="text-5xl leading-none text-brand-200 font-serif select-none">&ldquo;</span>
              <div className="space-y-3 text-gray-600 text-sm leading-relaxed -mt-2">
                <p>Al meer dan 25 jaar werk ik met veel passie in de horeca. In die jaren heb ik heel wat zien veranderen. Eén van de grootste veranderingen? Het bijna verdwijnen van drinkgeld.</p>
                <p>Vroeger liet een tevreden gast vaak nog een extraatje achter op tafel, samen met een glimlach en een oprechte: <span className="italic text-gray-700">&ldquo;Dank u, Tom, voor een fijne avond.&rdquo;</span></p>
                <p>Vandaag verloopt bijna alles digitaal en daardoor verdwijnt ook steeds vaker de mogelijkheid om spontaan een fooi achter te laten. Precies daarom hebben wij TipDirect ontwikkeld.</p>
                <p>Met TipDirect kunnen gasten eenvoudig digitaal een fooi geven, zodat horecamedewerkers opnieuw die extra waardering kunnen ontvangen voor hun inzet en gastvrijheid.</p>
                <p className="text-gray-700">En laten we eerlijk zijn... Een fooi ontvangen is geweldig. Maar als daar ook nog <span className="italic">&ldquo;Dank u voor een fijne avond&rdquo;</span> bij komt, voelt dat nét iets mooier.</p>
              </div>
              <div className="mt-6 pt-5 border-t border-gray-100 flex items-center gap-3">
                <div>
                  <p className="font-bold text-gray-900">Tom Wuyts</p>
                  <p className="text-xs text-brand-500 font-medium">Belgisch partner · Strictly Hospitality</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ */}
      <div id="faq">
        <FAQ t={t.faq} />
      </div>

      {/* Footer */}
      <footer className="bg-[#0f2744] text-white mt-8">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row gap-8 justify-between">
            <div>
              <p className="font-bold text-white mb-1">TipDirect</p>
              <p className="text-blue-200 text-sm">{t.footer}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-8 text-sm text-blue-200">
              <div>
                <p className="font-semibold text-white mb-1">Software Development & IT</p>
                <p>Deursenseweg 12</p>
                <p>5351 NN Berghem</p>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">Office & Sales</p>
                <p>Prinses Marijkeweg 2-L</p>
                <p>4191 XL Geldermalsen</p>
                <p><a href="mailto:sales@tipdirect.be" className="hover:text-white transition-colors">sales@tipdirect.be</a></p>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">Partner België</p>
                <p>Strictly Hospitality</p>
                <p>Halfweg 35</p>
                <p>2450 Meerhout</p>
              </div>
            </div>
          </div>
          <div className="border-t border-blue-800 mt-8 pt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-blue-400">
            <p>
              © 2026 TipDirect.be — een product van Miller Creative BV
              <span className="mx-2">·</span>
              <a href="mailto:info@tipdirect.be" className="hover:text-white transition-colors">info@tipdirect.be</a>
            </p>
            <div className="flex gap-4">
              <a href="/algemene-voorwaarden" className="hover:text-white transition-colors">Algemene Voorwaarden</a>
              <a href="/privacy" className="hover:text-white transition-colors">Privacybeleid</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
