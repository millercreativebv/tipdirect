const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: true })
const outputPath = path.join(__dirname, '..', 'TipDirect-Partnership-Bespreking.pdf')
doc.pipe(fs.createWriteStream(outputPath))

const BRAND  = '#a10f5a'
const GRIJS  = '#6b7280'
const DONKER = '#111827'
const L      = 50
const W      = 495
const BOTTOM = 800

let y = 0

function nieuwePagina() { doc.addPage(); y = 40 }
function ruimteVoor(h) { if (y + h > BOTTOM) nieuwePagina() }
function spatie(pt = 10) { y += pt }

function kop(tekst, nieuwBlad = false) {
  if (nieuwBlad) { nieuwePagina(); spatie(8) }
  else { ruimteVoor(40); spatie(16) }
  doc.rect(L, y, W, 24).fill(BRAND)
  doc.fillColor('white').fontSize(10.5).font('Helvetica-Bold')
     .text(tekst, L + 12, y + 7, { lineBreak: false })
  doc.fillColor(DONKER)
  y += 24
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

function vraag(inhoud) {
  ruimteVoor(20)
  spatie(4)
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#92400e')
     .text('?', L + 10, y, { lineBreak: false, width: 12 })
  doc.fontSize(9).font('Helvetica').fillColor('#92400e')
     .text(inhoud, L + 24, y, { width: W - 34, lineGap: 2 })
  y = doc.y + 4
}

function tabel(kolommen, rijen) {
  const headerH = 20
  ruimteVoor(headerH + 20)
  spatie(4)

  function tekenHeader() {
    doc.rect(L + 10, y, W - 20, headerH).fill('#fce7f3')
    let cx = L + 10
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(DONKER)
    kolommen.forEach(k => {
      doc.text(k.titel, cx + 5, y + 6, { width: k.breedte - 10, lineBreak: false })
      cx += k.breedte
    })
    y += headerH
  }

  tekenHeader()

  rijen.forEach((rij, idx) => {
    doc.font('Helvetica').fontSize(8.5)
    let maxH = 0
    kolommen.forEach((k, i) => {
      const h = doc.heightOfString(rij[i], { width: k.breedte - 10, lineGap: 1 })
      if (h > maxH) maxH = h
    })
    maxH += 12

    if (y + maxH > BOTTOM) { nieuwePagina(); tekenHeader() }

    if (idx % 2 === 0) doc.rect(L + 10, y, W - 20, maxH).fill('#fafafa')

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

function noot(inhoud) {
  ruimteVoor(28)
  spatie(4)
  doc.rect(L + 10, y, W - 20, 1).fill('#fce7f3')
  spatie(4)
  doc.fontSize(8.5).font('Helvetica').fillColor('#9f1239')
     .text(inhoud, L + 10, y, { width: W - 20, lineGap: 2 })
  y = doc.y + 6
}

// ── Header ────────────────────────────────────────────────────────────────────
doc.rect(0, 0, 595, 84).fill(BRAND)
doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
   .text('TipDirect', L, 16, { lineBreak: false })
doc.fontSize(11).font('Helvetica')
   .text('Partnership — besprekingsdocument Strictly Hospitality', L, 48, { lineBreak: false })
doc.fontSize(9).font('Helvetica-Oblique')
   .text('Ter bespreking  —  donderdag 17 juli 2026', L, 64, { lineBreak: false })

y = 102

// ── Inleiding ────────────────────────────────────────────────────────────────
tekst(
  'Dit document dient als leidraad voor het gesprek van donderdag. De businessstructuur is gewijzigd: Miller Creative BV ' +
  'is eigenaar van het TipDirect-platform en draagt de volledige technologie. Strictly Hospitality treedt op als ' +
  'vertegenwoordiger in België en brengt klanten aan op basis van een commissie-afspraak.'
)

// ── Rolverdeling ─────────────────────────────────────────────────────────────
kop('Rolverdeling — wie doet wat?')

subKop('Miller Creative BV — platformeigenaar')
item('Eigenaar en beheerder van TipDirect (technologie, platform, merk)')
item('Verantwoordelijk voor bouw, onderhoud en doorontwikkeling')
item('Beheert de Mollie-koppeling en de financiële afwikkeling van alle transacties')
item('Stelt het platform beschikbaar aan klanten die Strictly Hospitality aanlevert')
item('Levert support en updates gedurende de looptijd van de samenwerking')

subKop('Strictly Hospitality — exclusief vertegenwoordiger België')
item('Heeft exclusiviteit als vertegenwoordiger van TipDirect in België — Miller Creative BV werft zelf geen Belgische klanten')
item('Werft horecazaken en dienstverleners aan als TipDirect-klant in België')
item('Verzorgt de eerste kennismaking, demonstratie en onboarding ter plaatse')
item('Onderhoudt de relatie met de klant na aansluiting')
item('Ontvangt een commissie op basis van de gegenereerde transactieomzet van aangebrachte klanten')

// ── Financiële afspraken ──────────────────────────────────────────────────────
kop('Financiële afspraken')

tekst(
  'Per verwerkte betaling houdt TipDirect een platformfee in. Deze fee wordt automatisch verdeeld tussen Miller Creative ' +
  'en Strictly Hospitality op basis van de afgesproken percentages. De verdeling is flexibel instelbaar en geldt voor alle ' +
  'klanten die via Strictly Hospitality zijn aangebracht.'
)

subKop('Verdeling platformfee — ter bespreking')
tabel(
  [
    { titel: 'Partij', breedte: 160 },
    { titel: 'Aandeel', breedte: 80 },
    { titel: 'Toelichting', breedte: 235 },
  ],
  [
    ['Miller Creative BV', '60%', 'Platform, technologie, Mollie-beheer, onderhoud'],
    ['Strictly Hospitality', '40%', 'Sales, onboarding, klantrelatie in België'],
    ['Ober / medewerker', '100% van tip', 'Ontvangt de volledige fooi minus platformfee en Mollie-kosten'],
  ]
)

noot('De percentages 60/40 zijn een voorstel ter bespreking. Te bevestigen tijdens dit gesprek en daarna vast te leggen in de samenwerkingsovereenkomst.')

subKop('Marketingbudget — jaar 1')
item('15% van de totale platformfee wordt in het eerste jaar gereserveerd voor marketingactiviteiten')
item('Beide partijen bepalen gezamenlijk hoe dit budget wordt ingezet (online, print, events, etc.)')
item('Na afloop van jaar 1 volgt een evaluatie van het project en de marketingbesteding — op basis daarvan worden verdere afspraken gemaakt')

subKop('Uitbetaling aan Strictly Hospitality')
item('Alle platformfees komen binnen op het TipDirect-account van Miller Creative BV')
item('Het aandeel van Strictly Hospitality wordt per transactie automatisch berekend en doorgezet — geen handmatige verwerking')
item('Strictly Hospitality ontvangt een gespecificeerd maandoverzicht van alle verwerkte transacties en uitbetalingen')

// ── Targets ───────────────────────────────────────────────────────────────────
kop('Targets — voorstel ter bespreking', true)

tekst(
  'Onderstaande targets zijn richtlijnen om de samenwerking concreet en meetbaar te maken. Ze zijn bedoeld als ' +
  'startpunt voor het gesprek — geen harde contractuele verplichting tenzij beide partijen dat wensen.'
)

tabel(
  [
    { titel: 'Periode', breedte: 90 },
    { titel: 'Target', breedte: 160 },
    { titel: 'Toelichting', breedte: 225 },
  ],
  [
    ['Maand 1–2', '15 aangesloten zaken', 'Pilot: eerste klanten onboarden, feedback verzamelen, proces fijnstellen'],
    ['Maand 3', '40 aangesloten zaken', 'Doorgroeien na succesvolle pilot — gemiddeld 5 nieuwe zaken per week'],
    ['Maand 4–6', '150 actieve medewerkers', 'Transactievolume bouwt op; gemiddeld 3–5 medewerkers per zaak'],
    ['Jaar 1', '500 actieve medewerkers', 'Stevige positie in de Belgische markt, stabiel maandelijks transactievolume'],
  ]
)

noot('Een "actieve medewerker" = iemand die in de betreffende maand minimaal 1 transactie heeft ontvangen.')

// ── Wat heeft Strictly Hospitality nodig ──────────────────────────────────────
kop('Wat heeft Strictly Hospitality nodig om te starten?')

item('Demo-toegang tot het platform — zodat zij klanten kunnen laten zien hoe het werkt')
item('Presentatiemateriaal (één-pager, uitlegvideo of demo QR) voor gebruik in salesgesprekken')
item('Duidelijk antwoord op veelgestelde klantvragen: kosten, privacy, hoe uitbetaling werkt')
item('Contactpersoon bij Miller Creative voor technische vragen vanuit klanten')
item('Afgesproken onboarding-proces: wat doet Strictly Hospitality, wat doet Miller Creative?')

// ── Openstaande vragen ────────────────────────────────────────────────────────
kop('Openstaande punten voor dit gesprek')

subKop('Commercieel')
vraag('Wat is het gewenste commissiepercentage vanuit Strictly Hospitality?')
vraag('Is er een minimumperformance afgesproken — en wat zijn de gevolgen als targets niet gehaald worden?')
vraag('Werkt Strictly Hospitality exclusief voor TipDirect in België, of ook voor vergelijkbare platforms?')
vraag('Hoe wordt een "aangebrachte klant" gedefinieerd en geregistreerd in het systeem?')

subKop('Operationeel')
vraag('Wie doet de klantenservice voor Belgische klanten — Strictly Hospitality of Miller Creative?')
vraag('Hoe verloopt de onboarding van een nieuwe zaak — wie regelt de Mollie-koppeling per medewerker?')
vraag('Worden er fysieke producten (kaartjes, armbanden) aangeboden — en wie regelt dat?')

subKop('Juridisch')
vraag('Wanneer tekenen we de samenwerkingsovereenkomst — voor of na de technische livegang?')
vraag('Onder welk recht valt de overeenkomst — Belgisch of Nederlands?')

// ── Vervolgstappen ────────────────────────────────────────────────────────────
kop('Concrete vervolgstappen na dit gesprek')

item('Fee-split en targets bevestigen → vastleggen in samenwerkingsovereenkomst')
item('Mollie TipDirect-app aanmaken → Miller Creative ontvangt client_id en client_secret')
item('Betaalflow bouwen en testen (Mollie Connect + Bancontact + IBAN)')
item('Strictly Hospitality krijgt demo-toegang zodra betaalflow stabiel is')
item('TipDirect live zetten op tipdirect.be (Vercel + DNS)')
item('Eerste klanten onboarden in België — pilot van 5 zaken')

// ── Footer ────────────────────────────────────────────────────────────────────
ruimteVoor(30)
spatie(24)
doc.rect(L, y, W, 0.5).fill('#e5e7eb')
spatie(8)
doc.fontSize(8).font('Helvetica').fillColor(GRIJS)
   .text(
     'TipDirect  |  Vertrouwelijk  |  Miller Creative BV  |  ' + new Date().toLocaleDateString('nl-NL', {
       day: 'numeric', month: 'long', year: 'numeric'
     }),
     L, y, { width: W, align: 'center' }
   )

doc.end()
console.log('PDF aangemaakt: ' + outputPath)
