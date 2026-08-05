import Link from 'next/link'

export const metadata = {
  title: 'Algemene Voorwaarden — TipDirect',
  description: 'Algemene voorwaarden van TipDirect, een product van Miller Creative BV.',
}

export default function AlgemeneVoorwaarden() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-4 py-5">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">← Terug</Link>
          <span className="text-gray-900 font-bold">TipDirect</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Algemene Voorwaarden</h1>
        <p className="text-sm text-gray-400 mb-10">Versie 1.0 — augustus 2026</p>

        <div className="prose prose-gray max-w-none space-y-10 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Definities</h2>
            <ul className="space-y-2 list-disc pl-5">
              <li><strong>TipDirect</strong>: het digitale platform voor het ontvangen van digitale fooien, aangeboden door Miller Creative BV.</li>
              <li><strong>Miller Creative BV</strong>: de onderneming ingeschreven bij de Kamer van Koophandel, gevestigd te Deursenseweg 12, 5351 NN Berghem.</li>
              <li><strong>Gebruiker</strong>: iedere natuurlijke of rechtspersoon die een account aanmaakt op het platform.</li>
              <li><strong>Abonnementhouder</strong>: de gebruiker die een actief abonnement heeft afgesloten voor gebruik van TipDirect.</li>
              <li><strong>Medewerker</strong>: een door de abonnementhouder toegevoegd teamlid dat een eigen betaalpagina en QR-code krijgt.</li>
              <li><strong>Klant</strong>: de persoon die via het platform een fooi betaalt aan een gebruiker.</li>
              <li><strong>Mollie</strong>: de door TipDirect ingeschakelde betaalverwerker (Mollie B.V., Amsterdam), die betalingen verwerkt conform PCI DSS niveau 1.</li>
              <li><strong>Platform</strong>: de website tipdirect.be en alle bijbehorende diensten.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Toepasselijkheid</h2>
            <p>Deze algemene voorwaarden zijn van toepassing op alle overeenkomsten tussen Miller Creative BV en de gebruiker met betrekking tot het gebruik van TipDirect. Door een account aan te maken of het platform te gebruiken, aanvaardt de gebruiker deze voorwaarden.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Het platform</h2>
            <p>TipDirect biedt gebruikers de mogelijkheid om via een persoonlijke QR-code en betaalpagina digitale fooien te ontvangen. Betalingen worden uitsluitend verwerkt via Mollie. TipDirect treedt op als softwareplatform en is geen betaalinstelling.</p>
            <p className="mt-3">Miller Creative BV behoudt zich het recht voor het platform te wijzigen, uit te breiden of tijdelijk buiten gebruik te stellen voor onderhoud, zonder dat dit aanleiding geeft tot enige schadevergoeding.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Account en registratie</h2>
            <p>De gebruiker is verantwoordelijk voor de juistheid van de bij registratie opgegeven gegevens en voor het vertrouwelijk houden van zijn inloggegevens. Ieder gebruik van het account is voor rekening en risico van de gebruiker.</p>
            <p className="mt-3">Miller Creative BV behoudt zich het recht voor een account te weigeren, op te schorten of te beëindigen indien de gebruiker deze voorwaarden schendt of het platform misbruikt.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Abonnementen en betaling</h2>
            <p>Zakelijke gebruikers (bedrijfsaccounts) dienen een abonnement af te sluiten om het platform te kunnen gebruiken. Het abonnementsbedrag is verschuldigd voorafgaand aan activering van het account. Het geldende tarief is zichtbaar in het dashboard en kan door Miller Creative BV worden gewijzigd, waarbij bestaande abonnees een opzegtermijn van ten minste 30 dagen wordt gehanteerd.</p>
            <p className="mt-3">Alle betalingen worden verwerkt via Mollie. Per ontvangen fooi worden de door Mollie in rekening gebrachte transactiekosten (€ 0,32 per transactie) in mindering gebracht op het uitbetaalde bedrag. TipDirect brengt geen aanvullende servicekosten in rekening.</p>
            <p className="mt-3">Uitbetalingen aan gebruikers vinden plaats conform de uitbetalingsvoorwaarden van Mollie.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Verplichtingen van de gebruiker</h2>
            <p>De gebruiker verbindt zich ertoe:</p>
            <ul className="space-y-2 list-disc pl-5 mt-3">
              <li>Het platform uitsluitend te gebruiken voor het ontvangen van fooien in het kader van zijn beroepsactiviteit;</li>
              <li>Geen gebruik te maken van het platform voor frauduleuze, illegale of misleidende activiteiten;</li>
              <li>Correcte bankgegevens (IBAN) op te geven voor uitbetalingen;</li>
              <li>Wijzigingen in zijn gegevens tijdig door te voeren in het platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Aansprakelijkheid</h2>
            <p>Miller Creative BV is niet aansprakelijk voor schade die voortvloeit uit:</p>
            <ul className="space-y-2 list-disc pl-5 mt-3">
              <li>Storingen of vertragingen in de dienstverlening van Mollie of andere derde partijen;</li>
              <li>Onjuiste of onvolledige gegevens verstrekt door de gebruiker;</li>
              <li>Ongeautoriseerd gebruik van een account;</li>
              <li>Tijdelijke onbeschikbaarheid van het platform.</li>
            </ul>
            <p className="mt-3">De aansprakelijkheid van Miller Creative BV is in alle gevallen beperkt tot het bedrag dat de gebruiker in de twaalf maanden voorafgaand aan het schadeveroorzakende feit aan abonnementskosten heeft betaald, met een maximum van € 500.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Intellectueel eigendom</h2>
            <p>Alle intellectuele eigendomsrechten op het platform, de software, de vormgeving en de inhoud berusten bij Miller Creative BV. Het is niet toegestaan deze zonder voorafgaande schriftelijke toestemming te kopiëren, te reproduceren of te distribueren.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Privacy</h2>
            <p>De verwerking van persoonsgegevens geschiedt conform ons <Link href="/privacy" className="text-brand-500 hover:text-brand-600 underline">Privacybeleid</Link> en de Algemene Verordening Gegevensbescherming (AVG/GDPR).</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Wijzigingen</h2>
            <p>Miller Creative BV behoudt zich het recht voor deze voorwaarden te wijzigen. Gewijzigde voorwaarden worden ten minste 14 dagen voor inwerkingtreding gepubliceerd op het platform. Voortgezet gebruik na die datum geldt als aanvaarding van de gewijzigde voorwaarden.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">11. Toepasselijk recht en geschillen</h2>
            <p>Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden bij uitsluiting voorgelegd aan de bevoegde rechter in het arrondissement Oost-Brabant, tenzij dwingend recht een andere rechter aanwijst.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">12. Contact</h2>
            <p>Voor vragen over deze voorwaarden kunt u contact opnemen via <a href="mailto:info@tipdirect.be" className="text-brand-500 hover:text-brand-600 underline">info@tipdirect.be</a> of via de contactgegevens van Miller Creative BV hieronder.</p>
            <div className="mt-4 p-4 bg-gray-50 rounded-xl text-sm text-gray-600 space-y-1">
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
