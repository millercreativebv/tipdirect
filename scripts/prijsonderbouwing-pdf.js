const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: true })
const outputPath = path.join(__dirname, '..', 'TipDirect-Prijsonderbouwing.pdf')
doc.pipe(fs.createWriteStream(outputPath))

const BRAND  = '#a10f5a'
const GRIJS  = '#6b7280'
const DONKER = '#111827'
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

function kop(tekst, nieuwBlad = false) {
  if (nieuwBlad) {
    nieuwePagina()
    spatie(8)
  } else {
    ruimteVoor(40)
    spatie(16)
  }
  doc.rect(L, y, W, 24).fill(BRAND)
  doc.fillColor('white').fontSize(10.5).font('Helvetica-Bold')
     .text(tekst, L + 12, y + 7, { lineBreak: false })
  doc.fillColor(DONKER)
  y += 24
  spatie(10)
}

// Onderdeelkop met prijs + indicatie-uren rechts uitgelijnd
function onderdeelKop(titel, prijs, uren, nieuwBlad = false) {
  if (nieuwBlad) {
    nieuwePagina()
    spatie(8)
  } else {
    ruimteVoor(46)
    spatie(18)
  }
  doc.rect(L, y, W, 26).fill('#1f2937')
  doc.fillColor('white').fontSize(10.5).font('Helvetica-Bold')
     .text(titel, L + 12, y + 8, { lineBreak: false, width: W - 190 })
  doc.fontSize(9).font('Helvetica')
     .text(`${prijs}   |   ${uren}`, L + 12, y + 8.5, { width: W - 24, align: 'right', lineBreak: false })
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

function tekst(inhoud) {
  ruimteVoor(36)
  doc.fontSize(9).font('Helvetica').fillColor(DONKER)
     .text(inhoud, L + 10, y, { width: W - 20, lineGap: 3 })
  y = doc.y + 5
}

function item(inhoud) {
  ruimteVoor(16)
  doc.fontSize(9).font('Helvetica-Bold').fillColor(BRAND)
     .text('-', L + 10, y, { lineBreak: false, width: 12 })
  doc.fontSize(9).font('Helvetica').fillColor(DONKER)
     .text(inhoud, L + 24, y, { width: W - 34, lineGap: 2 })
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

// generieke tabel met automatische rij-hoogte
function tabel(kolommen, rijen) {
  const headerH = 20
  ruimteVoor(headerH + 20)
  spatie(4)

  function tekenHeader() {
    doc.rect(L + 10, y, W - 20, headerH).fill('#dbeafe')
    let cx = L + 10
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(DONKER)
    kolommen.forEach(k => {
      doc.text(k.titel, cx + 5, y + 6, { width: k.breedte - 10, lineBreak: false })
      cx += k.breedte
    })
    y += headerH
  }

  tekenHeader()

  rijen.forEach(rij => {
    doc.font('Helvetica').fontSize(8.5)
    let maxH = 0
    kolommen.forEach((k, i) => {
      const h = doc.heightOfString(rij[i], { width: k.breedte - 10, lineGap: 1 })
      if (h > maxH) maxH = h
    })
    maxH += 12

    if (y + maxH > BOTTOM) {
      nieuwePagina()
      tekenHeader()
    }

    let cx = L + 10
    kolommen.forEach((k, i) => {
      doc.fillColor(DONKER).fontSize(8.5).font('Helvetica')
         .text(rij[i], cx + 5, y + 6, { width: k.breedte - 10, lineGap: 1 })
      cx += k.breedte
    })
    doc.rect(L + 10, y, W - 20, maxH).stroke('#e5e7eb')
    y += maxH
  })

  y += 8
}

// ── Header ────────────────────────────────────────────────────────────────────
doc.rect(0, 0, 595, 84).fill(BRAND)
doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
   .text('TipDirect', L, 16, { lineBreak: false })
doc.fontSize(11).font('Helvetica')
   .text('Toelichting op de investering — onderbouwing per onderdeel', L, 48, { lineBreak: false })
doc.fontSize(9).font('Helvetica-Oblique')
   .text('Ter beantwoording van vragen over het investeringsoverzicht  —  ' + new Date().toLocaleDateString('nl-NL', {
     day: 'numeric', month: 'long', year: 'numeric'
   }), L, 64, { lineBreak: false })

y = 102

// ── Inleiding ─────────────────────────────────────────────────────────────────
tekst(
  'Dit document licht toe hoe de bedragen in het investeringsoverzicht zijn opgebouwd. De prijzen zijn niet ' +
  'willekeurig gekozen, maar volgen uit de hoeveelheid werk én het risico per onderdeel. Met name het bedrag voor ' +
  '"Mollie-koppeling & livegang van de betaalflow" wordt hieronder in detail onderbouwd.'
)

// ── Methodiek ─────────────────────────────────────────────────────────────────
kop('Hoe de prijzen zijn opgebouwd')
tekst('Elk onderdeel is geprijsd op basis van drie factoren, niet alleen op het aantal schermen of functies:')
item('Geschatte ontwikkeltijd — hoeveel uur het bouwen, testen en afwerken realistisch kost')
item('Technische complexiteit — hoeveel losse onderdelen, koppelingen en uitzonderingen er afgehandeld moeten worden')
item('Financieel en juridisch risico — wat de impact is als er ondanks testen toch een fout doorheen glipt')
tekst(
  'Niet elk uur weegt even zwaar. Een uur werk aan een onderdeel waar daadwerkelijk geld doorheen stroomt, vraagt ' +
  'meer precisie, meer testscenario\'s en meer verantwoordelijkheid dan een uur werk aan bijvoorbeeld een ' +
  'landingspagina. Onderdelen met een hoger risico zijn daarom relatief zwaarder geprijsd, ook als het aantal ' +
  'schermen beperkt is.'
)
tekst(
  'Voor dit traject is gerekend met een richttarief tussen € 85 en € 110 per uur, gangbaar voor freelance ' +
  'fullstack-ontwikkeling met ervaring in betaalintegraties in de Benelux. Risicovollere onderdelen zijn aan de ' +
  'bovenkant van die bandbreedte geprijsd, routinematig werk aan de onderkant.'
)

// ── Onderdeel 1 ────────────────────────────────────────────────────────────────
onderdeelKop('1. Fundament', '€ 3.000', '± 30-35 uur')
tekst('De technische basis: accountbeheer, database-inrichting en de server-side verwerking waarop de rest van het platform draait.')
item('Overzichtelijk in aantal schermen, maar wel de laag waar alles op rust — een fout hier raakt de hele applicatie')
item('Volledig op maat ingericht voor het datamodel van TipDirect (obers, bedrijven, betalingen, rollen) en dus niet herbruikbaar uit een ander project')
item('Inclusief de beveiligingsregels die bepalen wie welke gegevens mag inzien of wijzigen')

// ── Onderdeel 2 ────────────────────────────────────────────────────────────────
onderdeelKop('2. Landingspagina, registratie & persoonlijk profiel', '€ 7.000', '± 75-80 uur')
tekst('Alles wat een gebruiker ziet en doorloopt vóórdat er geld in het spel komt: kennismaking, aanmelden en het persoonlijke profiel.')
item('Grootste aantal losse functionaliteiten van alle onderdelen: 10+ afzonderlijke features')
item('Meertaligheid (NL, FR, DE, EN) verviervoudigt het werk aan teksten, validatie en weergave')
item('Twee volledig gescheiden registratiepaden — individuele dienstverlener en bedrijf — met elk eigen logica en validatie')

// ── Onderdeel 3 ────────────────────────────────────────────────────────────────
onderdeelKop('3. Betaalpagina, dashboard & zakelijke module', '€ 10.500', '± 110-120 uur')
tekst('De dagelijkse kern van het platform — in feite drie samenhangende producten in één.')
item('De publieke betaalpagina die de klant ziet, inclusief sterren, complimenten en boodschap')
item('Het persoonlijke dashboard van de medewerker, met badges, export en QR-beheer')
item('De volledige zakelijke module: teambeheer en een bedrijfsdashboard met een eigen rollenstructuur')
item('Rechtenbeheer (wie mag wat zien of wijzigen tussen uitbater en medewerker) is foutgevoelig en vraagt zorgvuldige afscherming')
tekst('Dit is het grootste onderdeel in het overzicht, omdat het feitelijk drie gebruikersomgevingen omvat die wel met elkaar moeten samenwerken.')

// ── Onderdeel 4 — uitgelicht ───────────────────────────────────────────────────
onderdeelKop('4. Mollie-koppeling & livegang van de betaalflow', '€ 8.000', '± 75-85 uur', true)
tekst(
  'Dit onderdeel heeft verhoudingsgewijs de minste schermen van alle vier onderdelen, maar wel het hoogste ' +
  'financiële en juridische risico. Een fout hier is niet zichtbaar als een lelijk scherm — een fout hier betekent ' +
  'verkeerd uitbetaald geld, een medewerker die niet betaald wordt, of een mislukte betaling die toch als geslaagd ' +
  'wordt geregistreerd. Dat risico bepaalt de prijs, niet het aantal schermen.'
)

subKop('Wat dit onderdeel concreet omvat')
item('Mollie Connect: geen simpele betaalknop, maar een marketplace-koppeling die geld direct splitst en doorstuurt naar de juiste rekening van de medewerker — inclusief OAuth-koppeling en verificatie (KYC) per medewerker')
item('Bancontact: een aparte betaalmethode naast WERO en Apple Pay, met eigen foutscenario\'s (geannuleerd, mislukt, time-out) die elk afzonderlijk afgevangen moeten worden')
item('IBAN-verificatie: validatie van rekeninggegevens en zorgvuldige omgang met financiële persoonsgegevens onder de AVG')
item('Fee-verdeling: foutloze berekening van wie precies hoeveel ontvangt per transactie — een afrondingsfout of verkeerde verdeling betekent direct verkeerd uitbetaald geld')
item('End-to-end testen: niet één keer testen, maar talloze scenario\'s doorlopen — mislukte betaling, time-out, een dubbele klik, een webhook die twee keer binnenkomt, een terugboeking — allemaal vóórdat hier echt geld doorheen gaat')

subKop('Waarom dit duurder is per uur')
tekst(
  'In de markt worden betaalintegraties vaak bewust als apart, duurder traject aangeboden door ontwikkelbureaus — ' +
  'niet omdat er meer schermen bij horen, maar omdat fouten hier direct financiële of reputatieschade veroorzaken. ' +
  'Dat vraagt meer testtijd, meer zorgvuldigheid en specifieke kennis van de regels van de betaalprovider. Dat is ' +
  'precies waarin dit onderdeel verschilt van bijvoorbeeld een dashboardscherm.'
)

// ── Samenvattend overzicht ────────────────────────────────────────────────────
kop('Samenvattend overzicht', true)
tabel(
  [
    { titel: 'Onderdeel', breedte: 170 },
    { titel: 'Prijs', breedte: 65 },
    { titel: 'Reden in het kort', breedte: 240 },
  ],
  [
    ['1. Fundament', '€ 3.000', 'Basis waar alles op draait; beperkt in omvang, hoog belang voor stabiliteit en beveiliging.'],
    ['2. Landingspagina, registratie & profiel', '€ 7.000', 'Grootste aantal losse features, vermenigvuldigd door vier talen en twee registratiepaden.'],
    ['3. Betaalpagina, dashboard & zakelijke module', '€ 10.500', 'Drie samenhangende producten in één, met een rollenstructuur die zorgvuldig afgeschermd moet worden.'],
    ['4. Mollie-koppeling & livegang betaalflow', '€ 8.000', 'Minste schermen, maar hoogste financieel risico — fouten raken direct geld, niet alleen weergave.'],
  ]
)

noot(
  'Het totaal van € 28.500 is opgebouwd uit deze vier onderdelen. Het bedrag voor de Mollie-koppeling weegt zwaarder ' +
  'dan de omvang in schermen zou suggereren, precies omdat hier de financiële en juridische risico\'s van het hele ' +
  'platform samenkomen.'
)

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
