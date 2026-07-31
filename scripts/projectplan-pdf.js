const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: true })
const outputPath = path.join(__dirname, '..', 'TipDirect-Projectplan.pdf')
doc.pipe(fs.createWriteStream(outputPath))

const BRAND  = '#a10f5a'
const GRIJS  = '#6b7280'
const DONKER = '#111827'
const GROEN  = '#16a34a'
const L      = 50
const W      = 495
const BOTTOM = 800

let y = 0

// ── helpers ───────────────────────────────────────────────────────────────────

function nieuwePagina() {
  doc.addPage()
  y = 40
}

function ruimteVoor(h) {
  if (y + h > BOTTOM) nieuwePagina()
}

function spatie(pt = 10) { y += pt }

function lijn() {
  ruimteVoor(12)
  spatie(6)
  doc.rect(L, y, W, 0.5).fill('#e5e7eb')
  spatie(6)
}

function sectieKop(nummer, tekst, nieuwBlad = true) {
  if (nieuwBlad) {
    nieuwePagina()
    spatie(8)
  } else {
    ruimteVoor(46)
    spatie(20)
  }
  doc.rect(L, y, W, 26).fill(BRAND)
  doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
     .text(`Fase ${nummer}  |  ${tekst}`, L + 12, y + 8, { lineBreak: false })
  doc.fillColor(DONKER)
  y += 26
  spatie(10)
}

function subKop(tekst) {
  ruimteVoor(24)
  spatie(10)
  doc.fontSize(9).font('Helvetica-Bold').fillColor(BRAND)
     .text(tekst.toUpperCase(), L + 10, y, { lineBreak: false, characterSpacing: 0.8 })
  y += 13
  spatie(2)
}

function item(tekst) {
  ruimteVoor(16)
  doc.fontSize(9).font('Helvetica-Bold').fillColor(BRAND)
     .text('-', L + 10, y, { lineBreak: false, width: 12 })
  doc.fontSize(9).font('Helvetica').fillColor(DONKER)
     .text(tekst, L + 24, y, { lineBreak: false, width: W - 34 })
  y += 14
}

// infoRij: laat de waarde wrappen als hij te lang is
function infoRij(label, waarde) {
  ruimteVoor(18)
  const startY = y
  doc.fontSize(9).font('Helvetica-Bold').fillColor(DONKER)
     .text(label, L + 10, startY, { lineBreak: false, width: 140 })
  doc.fontSize(9).font('Helvetica').fillColor(GRIJS)
     .text(waarde, L + 158, startY, { width: W - 168, lineGap: 2 })
  y = doc.y + 4
}

function tekst(inhoud) {
  ruimteVoor(36)
  doc.fontSize(9).font('Helvetica').fillColor(GRIJS)
     .text(inhoud, L + 10, y, { width: W - 20, lineGap: 3 })
  y = doc.y + 4
}

function noot(inhoud) {
  ruimteVoor(28)
  spatie(4)
  doc.rect(L + 10, y, W - 20, 1).fill('#fce7f3')
  spatie(4)
  doc.fontSize(8.5).font('Helvetica').fillColor('#9f1239')
     .text(inhoud, L + 10, y, { width: W - 20, lineGap: 2 })
  y = doc.y + 6
}

function tweeKolom(links, rechts) {
  ruimteVoor(16)
  doc.fontSize(9).font('Helvetica').fillColor(DONKER)
     .text('•  ' + links, L + 10, y, { lineBreak: false, width: 220 })
  doc.fontSize(9).font('Helvetica').fillColor(DONKER)
     .text('•  ' + rechts, L + 258, y, { lineBreak: false, width: 220 })
  y += 14
}

// ── Header ────────────────────────────────────────────────────────────────────
doc.rect(0, 0, 595, 78).fill(BRAND)
doc.fillColor('white').fontSize(26).font('Helvetica-Bold')
   .text('TipDirect', L, 14, { lineBreak: false })
doc.fontSize(11).font('Helvetica')
   .text('Projectplan  |  Fooien applicatie voor dienstverleners', L, 46, { lineBreak: false })

y = 96

// ── Inleiding ─────────────────────────────────────────────────────────────────
doc.fontSize(10).font('Helvetica-Bold').fillColor(DONKER)
   .text('Wat is TipDirect?', L + 10, y)
y += 16
tekst(
  'TipDirect is een digitaal platform waarmee dienstverleners cashloze tips ontvangen via een ' +
  'persoonlijke QR-code of NFC-chip. De klant scant, kiest een bedrag en betaalt in een tik via ' +
  'WERO, Apple Pay, Bancontact of creditcard. Het geld gaat rechtstreeks naar de medewerker of de zaak. ' +
  'Geen app nodig. Geen account voor de klant. Volledig geautomatiseerd.'
)

spatie(4)
doc.fontSize(10).font('Helvetica-Bold').fillColor(DONKER)
   .text('Voor wie?', L + 10, y)
y += 14
tekst('TipDirect is geschikt voor elke dienstverlener die tips of fooien ontvangt:')
spatie(2)
tweeKolom('Obers en barmannen',          'Koeriers en bezorgers')
tweeKolom('Barista\'s en koffiespecialisten', 'Taxichauffeurs en chauffeurs')
tweeKolom('Sommeliers',                  'Muzikanten en artiesten')
tweeKolom('Roomservice medewerkers',     'Kappers en schoonheidsspecialisten')
tweeKolom('Valet parking medewerkers',   'Toeristische gidsen')
tweeKolom('Hotelportiers en conciergës', 'Sportinstructeurs en personal trainers')
tweeKolom('Spa- en wellnessmedewerkers', 'Croupiers en casinomedewerkers')

spatie(10)
doc.fontSize(10).font('Helvetica-Bold').fillColor(DONKER)
   .text('Basisinformatie', L + 10, y)
y += 14
infoRij('Betaalmodel:',     'Klant betaalt exact het gekozen bedrag. Kosten zijn voor de ontvanger (Fee + Mollie transactiekosten).')
infoRij('Technologie:',     'Next.js  |  Firebase  |  Mollie Payments')
infoRij('Talen:',           'Nederlands, Frans, Duits, Engels')
infoRij('Compatibel met:',  'iPhone, Android, alle browsers - geen app vereist voor de klant')
infoRij('Veiligheid:',      'PCI DSS niveau 1 via Mollie. TipDirect slaat zelf geen betaalgegevens op.')

// ── Fase 1 ────────────────────────────────────────────────────────────────────
sectieKop(1, 'Fundament & Betaalflow')
tekst('De kern van het platform: een medewerker registreert zich, krijgt een persoonlijke QR-code en klanten kunnen direct betalen.')

subKop('Landingspagina')
item('Introductie van TipDirect voor nieuwe gebruikers')
item('Berekening in real-time: bereken mogelijke inkomsten via schuifregelaars')
item('Veelgestelde vragen (FAQ)')
item('Beschikbaar in het Nederlands, Frans, Duits en Engels')

subKop('Registratie & profiel')
item('Keuzestap bij aanmelden: individuele dienstverlener of bedrijf')
item('Account aanmaken met e-mail en wachtwoord')
item('Profielpagina: naam, gebruikersnaam, profielfoto')
item('Persoonlijke betaalpagina op tipdirect.be/[naam]')

subKop('Betaalpagina (voor de klant)')
item('Klant scant QR-code en ziet naam en foto van de medewerker')
item('Keuze uit vaste bedragen (EUR 2 / 3 / 5 / 10) of eigen bedrag invoeren')
item('Betalen via WERO, Apple Pay, Bancontact of creditcard')
item('Klant kan een boodschap, sterrenbeoordeling en complimenten meegeven')
item('Succespagina met bevestiging direct na betaling')

subKop('Dashboard (medewerker)')
item('Overzicht van ontvangen tips: vandaag, week, maand, totaal')
item('QR-code downloaden en delen')
item('Recente tips inclusief boodschappen en beoordelingen van klanten')

subKop('Betalingsverwerking')
item('Koppeling met Mollie voor veilige betalingsverwerking (PCI DSS niveau 1)')
item('Automatische verwerking via webhook na succesvolle betaling')
item('Tipgever betaalt altijd exact het gekozen bedrag - kosten zijn nooit zichtbaar voor de klant')

// ── Fase 2 ────────────────────────────────────────────────────────────────────
sectieKop(2, 'Persoonlijk profiel & Beleving')
tekst('De medewerker krijgt een rijker profiel waarmee klanten een persoonlijke connectie voelen. Bewezen effectief voor hogere en frequentere fooien.')

subKop('Story Behind the Smile')
item('Medewerker vertelt waarvoor hij of zij spaart: studies, wereldreis, opleiding, etc.')
item('Zichtbaar als kaartje op de betaalpagina voor elke klant die scant')
item('Onderscheidend USP van TipDirect ten opzichte van concurrenten')

subKop('Persoonlijk profiel')
item('Korte persoonlijke voorstelling (max. 150 tekens, zichtbaar op betaalpagina)')
item('Profielfoto upload')
item('Spaardoel instellen met naam en doelbedrag')

subKop('Dashboard uitbreidingen')
item('Spaardoel voortgangsbalk: hoeveel is er al gespaard richting het doel?')
item('Badges voor mijlpalen: Eerste tip  |  10 tips  |  100 tips  |  EUR 500 ontvangen')
item('Inkomstengrafiek (visueel overzicht per periode)')
item('Export van overzicht naar PDF')

// ── Fase 3 ────────────────────────────────────────────────────────────────────
sectieKop(3, 'Bedrijven & Teambeheer', false)
tekst('Uitbaters en werkgevers kunnen een zakelijk account aanmaken, medewerkers koppelen en alle tips centraal beheren.')

subKop('Zakelijk account')
item('Aparte registratiestroom voor bedrijven en horecazaken')
item('Bedrijfsnaam en logo instellen')
item('Logo automatisch zichtbaar op betaalpagina van alle medewerkers')

subKop('Teambeheer')
item('Medewerkers toevoegen met naam, gebruikersnaam en foto')
item('Medewerkers activeren of deactiveren (betaalpagina in- of uitschakelen)')
item('Medewerkers bewerken of verwijderen')
item('Elke medewerker heeft eigen QR-code en persoonlijke betaalpagina')

subKop('Bedrijfsdashboard')
item('Totaaloverzicht van alle tips binnen het team')
item('Uitsplitsing per medewerker: aantal tips en totaalbedrag')
item('Recente activiteit van het volledige team')
item('Filters op dag, week en maand')

// ── Fase 4 ────────────────────────────────────────────────────────────────────
sectieKop(4, 'Uitbetalingen')
tekst('Na koppeling met Mollie worden uitbetalingen volledig geautomatiseerd. De medewerker hoeft zelf niets te doen.')

subKop('IBAN-koppeling')
item('IBAN invoeren bij registratie of later via het profiel')
item('Verificatie van rekeninghouder via Mollie')

subKop('Automatische uitbetalingen')
item('Uitbetalingen verlopen automatisch via Mollie')
item('Uitbetalingsgeschiedenis beschikbaar in het dashboard')
item('Instelbaar uitbetalingsritme: wekelijks of maandelijks')

noot(
  'Let op: deze fase vereist de Mollie API-koppeling op naam van de Belgische partij en ' +
  'bevestiging van de fee-verdeling (80% / 20%) voordat de bouw van start gaat.'
)

// ── Fase 5 ────────────────────────────────────────────────────────────────────
sectieKop(5, 'Livegang op tipdirect.be', false)
tekst('Het platform gaat live op het productiedomein met een afzonderlijke, stabiele productie-omgeving.')

subKop('Technische livegang')
item('Productie-omgeving aanmaken (Firebase productieproject)')
item('Deployment op tipdirect.be via Vercel')
item('DNS koppelen')
item('End-to-end test van de volledige betaalflow op productie')

subKop('Kwaliteitsborging')
item('Betaaltest met echte transacties (klein testbedrag)')
item('Test op iPhone en Android (meest gebruikte apparaten bij klanten)')
item('Controle van alle webhooks en statusmeldingen')

// ── Fase 6 ────────────────────────────────────────────────────────────────────
sectieKop(6, 'Groei & Uitbreidingen')
tekst('Uitbreidingen die het platform verder onderscheiden en nieuwe inkomstenstromen openen. In overleg te plannen na de livegang.')

subKop('Fysieke producten')
item('QR-codes op armbanden, tafelkaartjes, stickers en badges')
item('NFC-chips die dezelfde betaalpagina openen als de QR-code')
item('Claim-code systeem: medewerker koppelt fysiek product aan eigen account')
item('Beheerpagina voor het aanmaken en beheren van batches codes')

subKop('Premium functies')
item('Premiumabonnement voor bedrijven: uitgebreide statistieken en snellere uitbetalingen')
item('Eigen branding per medewerker: achtergrondkleur, persoonlijk logo')
item('Klantenfeedback verzamelen en rapporteren per afdeling')

subKop('AI-coaching')
item('Persoonlijke tips voor medewerkers op basis van hun prestatiedata')
item('Suggesties voor Story Behind the Smile die aantoonbaar meer opleveren')
item('Vergelijking met gemiddelde prestaties in de sector')

subKop('Community & netwerk')
item('Vacatures en opleidingen voor dienstverleners')
item('Evenementen en branche-updates')

// ── Technische basis ─────────────────────────────────────────────────────────
lijn()
doc.fontSize(10).font('Helvetica-Bold').fillColor(DONKER)
   .text('Technische basis', L + 10, y)
y += 16
infoRij('Framework:',       'Next.js 16 (App Router) - moderne, snelle webapplicatie')
infoRij('Database & auth:', 'Firebase (Google) - betrouwbaar, schaalbaar, veilig')
infoRij('Betalingen:',      'Mollie - Europese betaalprovider, PCI DSS niveau 1 gecertificeerd')
infoRij('Hosting:',         'Vercel - wereldwijd CDN, automatische deploys')
infoRij('Veiligheid:',      'TipDirect slaat geen betaalgegevens op. Alles loopt via Mollie.')
infoRij('Schaalbaarheid:',  'Architectuur ondersteunt groei van 10 naar 10.000+ gebruikers zonder aanpassing')

// ── Footer ────────────────────────────────────────────────────────────────────
ruimteVoor(30)
spatie(24)
doc.rect(L, y, W, 0.5).fill('#e5e7eb')
spatie(8)
doc.fontSize(8).font('Helvetica').fillColor(GRIJS)
   .text(
     'TipDirect  |  Vertrouwelijk  |  ' + new Date().toLocaleDateString('nl-NL', {
       day: 'numeric', month: 'long', year: 'numeric'
     }),
     L, y, { width: W, align: 'center' }
   )

doc.end()
console.log('PDF aangemaakt: ' + outputPath)
