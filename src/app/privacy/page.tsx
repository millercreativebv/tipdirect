import Link from 'next/link'

export const metadata = {
  title: 'Privacybeleid — TipDirect',
  description: 'Privacybeleid van TipDirect, een product van Miller Creative BV.',
}

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-4 py-5">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">← Terug</Link>
          <span className="text-gray-900 font-bold">TipDirect</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacybeleid</h1>
        <p className="text-sm text-gray-400 mb-10">Versie 1.0 — augustus 2026</p>

        <div className="space-y-10 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Wie zijn wij?</h2>
            <p>TipDirect is een product van Miller Creative BV, gevestigd te Deursenseweg 12, 5351 NN Berghem. Miller Creative BV is de verwerkingsverantwoordelijke voor de persoonsgegevens die via het platform worden verwerkt.</p>
            <p className="mt-3">Contactgegevens: <a href="mailto:info@millercreative.nl" className="text-brand-500 hover:text-brand-600 underline">info@millercreative.nl</a></p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Welke gegevens verwerken wij?</h2>
            <p className="mb-3 font-semibold text-gray-800">Van gebruikers (obers / bedrijven):</p>
            <ul className="space-y-2 list-disc pl-5">
              <li>Naam en e-mailadres (bij registratie)</li>
              <li>Gekozen gebruikersnaam en profielfoto (optioneel)</li>
              <li>IBAN-rekeningnummer en tenaamstelling (voor uitbetalingen)</li>
              <li>Account- en abonnementsgegevens</li>
              <li>Technische gegevens (IP-adres, inlogmomenten)</li>
            </ul>
            <p className="mt-6 mb-3 font-semibold text-gray-800">Van klanten (tip-gevers):</p>
            <ul className="space-y-2 list-disc pl-5">
              <li>Betaalgegevens — uitsluitend verwerkt door Mollie; TipDirect ontvangt geen kaart- of rekeninggegevens</li>
              <li>Tipbedrag en tijdstip van de transactie</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Waarom verwerken wij uw gegevens?</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-800 mb-1">Uitvoering van de overeenkomst</p>
                <p className="text-sm">Om uw account aan te maken, het platform beschikbaar te stellen, betalingen te verwerken en uit te betalen op uw bankrekening. Grondslag: uitvoering van een overeenkomst (art. 6 lid 1 sub b AVG).</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-800 mb-1">Wettelijke verplichtingen</p>
                <p className="text-sm">Bewaren van financiële gegevens conform de fiscale bewaarplicht van 7 jaar. Grondslag: wettelijke verplichting (art. 6 lid 1 sub c AVG).</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-800 mb-1">Gerechtvaardigd belang</p>
                <p className="text-sm">Beveiliging van het platform, fraudepreventie en technische optimalisatie. Grondslag: gerechtvaardigd belang (art. 6 lid 1 sub f AVG).</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Mollie als betaalverwerker</h2>
            <p>Alle betalingen worden verwerkt door Mollie B.V. (Keizersgracht 126, 1015CW Amsterdam). Mollie is gecertificeerd op PCI DSS niveau 1. TipDirect ontvangt géén betaalkaartgegevens of IBAN-nummers van klanten. Mollie heeft een eigen privacybeleid dat van toepassing is op de verwerking van betaalgegevens.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Database</h2>
            <p>TipDirect maakt gebruik van Google LLC voor authenticatie, database en opslag. Gegevens worden opgeslagen op servers binnen de Europese Economische Ruimte. Google LLC valt onder de standaardcontractbepalingen (SCC's) die voldoen aan de AVG.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Delen met derden</h2>
            <p>TipDirect verkoopt uw gegevens nooit aan derden. Gegevens worden uitsluitend gedeeld met:</p>
            <ul className="space-y-2 list-disc pl-5 mt-3">
              <li><strong>Mollie</strong> — voor betalingsverwerking en uitbetalingen</li>
              <li><strong>Database</strong> — voor opslag en authenticatie</li>
              <li><strong>Vercel</strong> — voor hosting van de applicatie</li>
              <li>Overheidsinstanties, uitsluitend indien wettelijk verplicht</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Bewaartermijnen</h2>
            <ul className="space-y-2 list-disc pl-5">
              <li>Accountgegevens: zolang uw account actief is, plus 12 maanden na beëindiging</li>
              <li>Financiële/betaalgegevens: 7 jaar (fiscale bewaarplicht)</li>
              <li>Technische loggegevens: maximaal 90 dagen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Uw rechten</h2>
            <p>Op grond van de AVG heeft u de volgende rechten:</p>
            <ul className="space-y-2 list-disc pl-5 mt-3">
              <li><strong>Inzage</strong> — u kunt opvragen welke gegevens wij van u verwerken</li>
              <li><strong>Rectificatie</strong> — u kunt onjuiste gegevens laten corrigeren</li>
              <li><strong>Verwijdering</strong> — u kunt verzoeken om verwijdering van uw gegevens</li>
              <li><strong>Bezwaar</strong> — u kunt bezwaar maken tegen verwerking op grond van gerechtvaardigd belang</li>
              <li><strong>Overdraagbaarheid</strong> — u kunt uw gegevens in een leesbaar formaat opvragen</li>
            </ul>
            <p className="mt-3">Verzoeken kunt u indienen via <a href="mailto:info@millercreative.nl" className="text-brand-500 hover:text-brand-600 underline">info@millercreative.nl</a>. Wij reageren binnen 30 dagen. U heeft tevens het recht een klacht in te dienen bij de Autoriteit Persoonsgegevens (autoriteitpersoonsgegevens.nl).</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Beveiliging</h2>
            <p>TipDirect treft passende technische en organisatorische maatregelen om uw gegevens te beveiligen tegen verlies, ongeoorloofde toegang of openbaarmaking. Alle communicatie verloopt via HTTPS. Wachtwoorden worden niet opgeslagen door TipDirect.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Wijzigingen</h2>
            <p>Dit privacybeleid kan worden gewijzigd. Wijzigingen worden gepubliceerd op deze pagina. Wij adviseren u dit beleid periodiek te raadplegen.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">11. Contact</h2>
            <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600 space-y-1">
              <p className="font-semibold text-gray-900">Miller Creative BV</p>
              <p>Deursenseweg 12, 5351 NN Berghem</p>
              <p><a href="mailto:info@millercreative.nl" className="text-brand-500 hover:text-brand-600">info@millercreative.nl</a></p>
            </div>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400 mt-12">
        <p>© 2026 TipDirect.be — een product van Miller Creative BV</p>
      </footer>
    </div>
  )
}
