import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">

      {/* Header */}
      <header className="max-w-2xl mx-auto px-4 py-6 flex items-center justify-between">
        <span className="text-xl font-bold text-gray-900">TipDirect</span>
        <div className="flex items-center gap-3">
          <Link href="/inloggen" className="text-sm text-gray-500 hover:text-gray-800">
            Inloggen
          </Link>
          <Link href="/registreer" className="text-sm bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-xl transition-all">
            Aanmelden
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-2xl mx-auto px-4 pt-16 pb-24 text-center">
        <div className="inline-block bg-emerald-100 text-emerald-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          Fooi direct op jouw rekening
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Ontvang fooi<br />
          <span className="text-emerald-500">zonder omweg</span>
        </h1>

        <p className="text-lg text-gray-500 mb-10 max-w-md mx-auto">
          Maak een persoonlijke QR-code. Gasten scannen, kiezen een bedrag en betalen direct via iDEAL of Apple Pay. Het geld staat bij jou — niet bij je baas.
        </p>

        <Link
          href="/registreer"
          className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg px-8 py-4 rounded-xl transition-all shadow-lg shadow-emerald-100"
        >
          Gratis aanmelden
        </Link>

        <p className="text-sm text-gray-400 mt-4">Geen app nodig · Werkt direct · €0,50 per ontvangen tip</p>
      </main>

      {/* Hoe het werkt */}
      <section className="max-w-2xl mx-auto px-4 pb-24">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Hoe het werkt</h2>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { stap: '1', emoji: '📝', titel: 'Meld je aan', tekst: 'Maak een gratis account en kies je persoonlijke link.' },
            { stap: '2', emoji: '📱', titel: 'Download je QR', tekst: 'Print je QR-code of zet hem op je telefoon. Gasten scannen hem.' },
            { stap: '3', emoji: '💸', titel: 'Ontvang fooi', tekst: 'Het geld wordt wekelijks uitbetaald op jouw bankrekening.' },
          ].map(({ stap, emoji, titel, tekst }) => (
            <div key={stap} className="bg-white rounded-2xl p-6 shadow-sm text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                {emoji}
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{titel}</h3>
              <p className="text-sm text-gray-500">{tekst}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Kosten */}
      <section className="max-w-2xl mx-auto px-4 pb-24 text-center">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Transparante kosten</h2>
          <p className="text-gray-500 mb-6">Geen maandelijks abonnement. Je betaalt alleen als je tips ontvangt.</p>
          <div className="inline-block bg-white rounded-xl px-8 py-4 shadow-sm">
            <p className="text-3xl font-bold text-emerald-500">€0,50</p>
            <p className="text-sm text-gray-500 mt-1">per ontvangen tip (inclusief Mollie-kosten)</p>
          </div>
          <p className="text-sm text-gray-400 mt-4">
            Bij een fooi van €5,00 ontvang jij €4,21
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>© 2026 TipDirect · Veilig betalen via Mollie</p>
      </footer>

    </div>
  )
}
