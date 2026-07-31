const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: true })
const outputPath = path.join(__dirname, '..', 'TipDirect-Architectuur.pdf')
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

function noot(inhoud) {
  ruimteVoor(28)
  spatie(4)
  doc.rect(L + 10, y, W - 20, 1).fill('#fce7f3')
  spatie(4)
  doc.fontSize(8.5).font('Helvetica').fillColor('#9f1239')
     .text(inhoud, L + 10, y, { width: W - 20, lineGap: 2 })
  y = doc.y + 6
}

function codeblok(regels) {
  ruimteVoor(regels.length * 13 + 16)
  spatie(4)
  const h = regels.length * 13 + 12
  doc.rect(L + 10, y, W - 20, h).fill('#f1f5f9')
  regels.forEach((r, i) => {
    doc.fontSize(8).font('Courier').fillColor('#1e293b')
       .text(r, L + 20, y + 6 + i * 13, { lineBreak: false })
  })
  y += h + 6
}

function flow(stappen) {
  ruimteVoor(stappen.length * 22 + 10)
  spatie(6)
  stappen.forEach((stap, i) => {
    const isLaatste = i === stappen.length - 1
    // Cirkel
    doc.circle(L + 22, y + 8, 8).fill(isLaatste ? '#16a34a' : BRAND)
    doc.fillColor('white').fontSize(7).font('Helvetica-Bold')
       .text(String(i + 1), L + 19, y + 5, { lineBreak: false })
    // Tekst
    doc.fontSize(8.5).font('Helvetica').fillColor(DONKER)
       .text(stap, L + 36, y + 4, { width: W - 50, lineGap: 1 })
    y = doc.y + 4
    // Verbindingslijn
    if (!isLaatste) {
      doc.rect(L + 21, y, 2, 6).fill('#d1d5db')
      y += 6
    }
  })
  spatie(6)
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

// ── Header ────────────────────────────────────────────────────────────────────
doc.rect(0, 0, 595, 84).fill(BRAND)
doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
   .text('TipDirect', L, 16, { lineBreak: false })
doc.fontSize(11).font('Helvetica')
   .text('Technische architectuur — nieuw businessmodel', L, 48, { lineBreak: false })
doc.fontSize(9).font('Helvetica-Oblique')
   .text('Intern document  —  ' + new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }), L, 64, { lineBreak: false })

y = 102

// ── Inleiding ─────────────────────────────────────────────────────────────────
tekst(
  'Dit document beschrijft de volledige technische architectuur van het nieuwe TipDirect-businessmodel. ' +
  'Het dient als bouwblauwdruk voor de ontwikkeling én als gespreksondersteuning voor het overleg met Strictly Hospitality. ' +
  'Openstaande variabelen (abonnementsbedrag, adverteerdersinvulling) zijn als configureerbaar ontworpen — ' +
  'ze hoeven niet vastgesteld te zijn vóór de bouw begint.'
)

// ── Businessmodel ─────────────────────────────────────────────────────────────
kop('Businessmodel — samenvatting')

tabel(
  [{ titel: 'Onderdeel', breedte: 150 }, { titel: 'Hoe het werkt', breedte: 325 }],
  [
    ['Abonnement', 'Klant betaalt een vast bedrag voor toegang tot het platform. Bedrag nog in te stellen.'],
    ['Drempelloos instappen', 'Geen vooruitbetaling. De eerste fooien voldoen automatisch het abonnement.'],
    ['30-dagenregel', 'Geen fooien binnen 30 dagen → abonnement alsnog direct betalen via betaallink.'],
    ['Fooi naar klant', '100% van de fooi gaat naar de ontvanger, minus de Mollie-transactiekosten (~€ 0,32).'],
    ['Verdeling abonnement', '42,5% Miller Creative  |  42,5% Strictly Hospitality  |  15% Marketing'],
    ['Adverteerder', 'Logo op QR-kaartje en bedanktpagina. Flexibel per stad, bedrijf of platform-breed.'],
  ]
)

// ── Geldstromen ───────────────────────────────────────────────────────────────
kop('Geldstromen per fase')

subKop('Fase 1 — abonnement nog niet voldaan')
tekst('Elke fooi die binnenkomt gaat volledig naar TipDirect (Miller Creative). De teller loopt op totdat het abonnementsbedrag is bereikt.')
flow([
  'Klant scant QR-code en betaalt een fooi',
  'Mollie verwerkt de betaling',
  'TipDirect controleert: abonnement voldaan? → NEE',
  'Fooi wordt bijgeschreven op de abonnementsteller van dit account',
  'Teller bereikt het abonnementsbedrag → account status wordt "actief"',
])

subKop('Fase 2 — abonnement voldaan (actief account)')
tekst('Alle fooien gaan voortaan 100% naar de ontvanger, minus de Mollie-kosten.')
flow([
  'Klant scant QR-code en betaalt een fooi',
  'Mollie verwerkt de betaling',
  'TipDirect controleert: abonnement voldaan? → JA',
  'Fooi minus ~€ 0,32 Mollie-kosten wordt uitbetaald aan ontvanger',
  'Ontvanger ziet bedrag verschijnen in dashboard en op bankrekening',
])

subKop('30-dagenregel — geen fooien ontvangen')
tekst('Als een account 30 dagen na aanmaken nog geen fooien heeft ontvangen, valt het abonnement terug naar directe betaling.')
flow([
  'Dagelijkse check: accounts ouder dan 30 dagen met status "pending"',
  'Account heeft 0 fooi-inkomsten → status wordt "vervallen"',
  'Klant ontvangt automatisch een melding met betaallink',
  'Na betaling via iDEAL of Bancontact → status wordt "actief"',
])

// ── Uitbetaling ───────────────────────────────────────────────────────────────
kop('Uitbetalingsmethodes', true)
tekst('Klanten kiezen bij registratie hoe zij hun fooien willen ontvangen. Beide methodes draaien naast elkaar.')

subKop('Optie A — eigen Mollie-account (Mollie Connect)')
item('Klant koppelt zijn eigen Mollie-account via een eenmalige autorisatiestap (OAuth)')
item('Zodra abonnement voldaan is, gaat elke fooi direct naar de rekening van de klant')
item('Geen tussenkomst van Miller Creative nodig bij uitbetaling')
item('Meest directe methode — aanbevolen voor klanten die snel willen ontvangen')

subKop('Optie B — uitbetaling via Miller Creative (IBAN)')
item('Klant vult eenmalig zijn IBAN in bij de registratie of in het profiel')
item('TipDirect verzamelt de fooien en betaalt periodiek uit (wekelijks of maandelijks)')
item('Klant hoeft geen eigen Mollie-account aan te maken')
item('Eenvoudiger voor kleinere klanten — iets minder direct dan Optie A')

noot('Beide opties zijn configureerbaar per account. Een klant kan later altijd wisselen van methode.')

// ── Adverteerders ─────────────────────────────────────────────────────────────
kop('Adverteerderssysteem')
tekst(
  'Adverteerders betalen voor zichtbaarheid op het platform. Hun logo verschijnt op het gedrukte QR-kaartje ' +
  'van de medewerker en op de bedanktpagina die de tipgever ziet na een geslaagde betaling. ' +
  'Het systeem is volledig flexibel — een adverteerder kan platform-breed zichtbaar zijn, of alleen in een bepaalde stad of voor een specifiek horecabedrijf.'
)

tabel(
  [{ titel: 'Niveau', breedte: 110 }, { titel: 'Bereik', breedte: 140 }, { titel: 'Toepassing', breedte: 225 }],
  [
    ['Platform-breed', 'Alle gebruikers', 'Grote adverteerder die heel België/Nederland wil bereiken'],
    ['Per stad', 'Gebruikers in een specifieke stad', 'Lokale horecaleverancier, brouwerij, regioketen'],
    ['Per bedrijf', 'Medewerkers van één horecazaak', 'Eigen leverancier of partner van die zaak'],
  ]
)

item('Adverteerder heeft een logo, naam en optionele doellink (bijv. eigen website of actie)')
item('Op de bedanktpagina: logo zichtbaar met "Mogelijk gemaakt door [Adverteerder]" of vergelijkbare tekst')
item('Op het QR-kaartje (print): klein logo in de footer naast de TipDirect-branding')
item('Meerdere adverteerders kunnen tegelijk actief zijn op verschillende niveaus')
item('Beheer via een eenvoudig admin-scherm: adverteerder toevoegen, koppelen aan stad/bedrijf, activeren/deactiveren')

// ── Database structuur ────────────────────────────────────────────────────────
kop('Database-structuur (Firestore)', true)

subKop('Collectie: abonnementen')
codeblok([
  '/abonnementen/{accountId}',
  '  bedrag:           number        — abonnementsbedrag (instelbaar)',
  '  voldaan:          number        — hoeveel al via fooien betaald',
  '  status:           pending | actief | vervallen',
  '  start_datum:      timestamp     — voor 30-dagenregel',
  '  actief_sinds:     timestamp     — moment waarop abonnement voldaan was',
  '  uitbetaling:      mollie | iban',
  '  iban:             string|null',
  '  mollie_token:     string|null   — access token Mollie Connect',
])

subKop('Collectie: adverteerders')
codeblok([
  '/adverteerders/{adverteerderId}',
  '  naam:             string',
  '  logo_url:         string',
  '  link:             string|null',
  '  niveau:           platform | stad | bedrijf',
  '  stad:             string|null   — bijv. "Gent", "Antwerpen"',
  '  bedrijf_id:       string|null   — koppeling aan specifieke zaak',
  '  actief:           boolean',
])

subKop('Uitbreiding op bestaande collectie: obers')
codeblok([
  '/obers/{oberId}',
  '  ...bestaande velden...',
  '  abonnement_id:    string        — verwijzing naar abonnement',
  '  stad:             string|null   — voor adverteerder-matching',
])

// ── Bouwvolgorde ──────────────────────────────────────────────────────────────
kop('Bouwvolgorde')
tekst('De volgende volgorde zorgt dat het platform zo snel mogelijk testbaar is, terwijl open variabelen later ingevuld worden.')

tabel(
  [
    { titel: '#', breedte: 30 },
    { titel: 'Onderdeel', breedte: 180 },
    { titel: 'Toelichting', breedte: 265 },
  ],
  [
    ['1', 'Abonnementslogica + teller', 'Kern van het nieuwe model — fooi bijschrijven op teller, status omschakelen'],
    ['2', 'Mollie-koppeling (betalingen ontvangen)', 'Fooien verwerken via Mollie — client_id + client_secret vereist'],
    ['3', '30-dagenregel', 'Dagelijkse check + automatische statuswijziging + betaallink'],
    ['4', 'Uitbetaling optie B (IBAN)', 'Eenvoudiger te bouwen dan Mollie Connect — snel inzetbaar'],
    ['5', 'Uitbetaling optie A (Mollie Connect)', 'OAuth-koppeling per klant — directe uitbetaling'],
    ['6', 'Adverteerdersysteem', 'Admin-scherm + logo op kaartje en bedanktpagina'],
    ['7', 'Admin-dashboard', 'Abonnementsbedrag instellen, adverteerders beheren, overzichten'],
    ['8', 'GitHub + Vercel + productie Firebase', 'Livegang op tipdirect.be'],
  ]
)

noot('Stap 1 t/m 3 kunnen gebouwd worden zodra de Mollie client_id en client_secret beschikbaar zijn. Stap 6 en 7 zijn onafhankelijk en kunnen parallel worden opgepakt.')

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
