const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: true })
const outputPath = path.join(__dirname, '..', 'TipDirect-Status.pdf')
doc.pipe(fs.createWriteStream(outputPath))

const BRAND  = '#a10f5a'
const GRIJS  = '#6b7280'
const DONKER = '#111827'
const GROEN  = '#16a34a'
const ROOD   = '#dc2626'
const L      = 50   // left margin
const W      = 495  // content width
const PH     = 842  // page height A4
const BOTTOM = 800  // trigger new page below this

let y = 0

// ── helpers ───────────────────────────────────────────────────────────────────

function nieuwePagina() {
  doc.addPage()
  y = 40
}

function ruimteVoor(hoogte) {
  if (y + hoogte > BOTTOM) nieuwePagina()
}

function spatie(pt = 10) {
  y += pt
}

function sectieKop(tekst) {
  ruimteVoor(42)
  spatie(14)
  doc.rect(L, y, W, 22).fill(BRAND)
  doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
     .text(tekst, L + 10, y + 6, { lineBreak: false })
  doc.fillColor(DONKER)
  y += 22
  spatie(8)
}

function subKop(tekst) {
  ruimteVoor(28)
  spatie(8)
  doc.fontSize(9).font('Helvetica-Bold').fillColor(GRIJS)
     .text(tekst.toUpperCase(), L + 10, y, { lineBreak: false, characterSpacing: 0.5 })
  y += 14
  spatie(2)
}

function rij(label, waarde, waardeKleur = DONKER) {
  ruimteVoor(16)
  doc.fontSize(9).font('Helvetica-Bold').fillColor(DONKER)
     .text(label, L + 10, y, { lineBreak: false, width: 140 })
  doc.fontSize(9).font('Helvetica').fillColor(waardeKleur)
     .text(waarde, L + 155, y, { lineBreak: false, width: 340 })
  y += 14
}

function checkItem(tekst, gedaan = true) {
  ruimteVoor(16)
  const kleur = gedaan ? GROEN : GRIJS
  const blok  = gedaan ? '[v]' : '[ ]'
  doc.fontSize(9).font('Helvetica-Bold').fillColor(kleur)
     .text(blok, L + 10, y, { lineBreak: false, width: 22 })
  doc.fontSize(9).font('Helvetica').fillColor(gedaan ? DONKER : GRIJS)
     .text(tekst, L + 34, y, { lineBreak: false, width: W - 44 })
  y += 14
}

function blokkeerItem(nr, tekst, reden) {
  ruimteVoor(28)
  doc.fontSize(9).font('Helvetica-Bold').fillColor(DONKER)
     .text(`${nr}.`, L + 10, y, { lineBreak: false, width: 18 })
  doc.fontSize(9).font('Helvetica-Bold').fillColor(DONKER)
     .text(tekst, L + 28, y, { lineBreak: false, width: W - 38 })
  y += 13
  doc.fontSize(8.5).font('Helvetica').fillColor(GRIJS)
     .text(reden, L + 28, y, { lineBreak: false, width: W - 38 })
  y += 14
}

function paragraaf(tekst) {
  ruimteVoor(40)
  doc.fontSize(9).font('Helvetica').fillColor(DONKER)
     .text(tekst, L + 10, y, { width: W - 20, lineGap: 2 })
  y = doc.y + 4
}

// ── Header ────────────────────────────────────────────────────────────────────
doc.rect(0, 0, 595, 72).fill(BRAND)
doc.fillColor('white').fontSize(24).font('Helvetica-Bold')
   .text('TipDirect', L, 16, { lineBreak: false })
doc.fontSize(10).font('Helvetica')
   .text('Projectstatus  —  ' + new Date().toLocaleDateString('nl-NL', {
     day: 'numeric', month: 'long', year: 'numeric'
   }), L, 46, { lineBreak: false })

y = 90

// ── Samenvatting ──────────────────────────────────────────────────────────────
sectieKop('Samenvatting')
paragraaf(
  'De app is technisch voor 70-75% klaar voor lancering. Het kritieke pad zit volledig bij de ' +
  'Belgische partij (Mollie-sleutel + fee-split bevestigen). Zodra die er zijn, is de app in ' +
  '1-2 weken live te krijgen op tipdirect.be.'
)
spatie(4)
rij('Platform:',      'Next.js 16  |  Firebase  |  Mollie')
rij('Talen:',         'Nederlands, Frans, Duits, Engels')
rij('Accounttypen:',  'Individueel ober  |  Horecazaak (uitbater + medewerkers)')
rij('Status Mollie:', 'Placeholder key - wacht op Belgische partij', ROOD)

// ── Gebouwd en klaar ──────────────────────────────────────────────────────────
sectieKop('KLAAR  -  Gebouwd en klaar')

subKop('Fundament')
checkItem('Firebase Auth + Firestore volledig werkend')
checkItem('Dev server stabiel (Webpack, Turbopack uitgeschakeld)')
checkItem('Merkkleur #A10f5a doorgevoerd op alle pagina\'s')

subKop('Landingspagina')
checkItem('Hero met logo + foto')
checkItem('Earnings calculator (real-time, inclusief EUR 0,82 kosten)')
checkItem('FAQ accordion (5 vragen)')
checkItem('4 talen via taalkiezer: NL / EN / FR / DE')

subKop('Registratie & login')
checkItem('Keuzestap: "Ik ben een ober" of "Ik ben een horecazaak"')
checkItem('Individueel: naam + gebruikersnaam')
checkItem('Bedrijf: bedrijfsnaam + logo + bedrijvendocument in Firestore')

subKop('Individueel dashboard')
checkItem('Periode tabs: Vandaag / Week / Maand / Totaal')
checkItem('Spaardoel voortgangsbalk')
checkItem('Badges: Eerste tip  |  10 tips  |  100 tips  |  EUR 500 ontvangen')
checkItem('QR-code genereren + downloaden')
checkItem('Recente tips met sterren, complimenten en boodschappen')
checkItem('Export knop (tekstbestand)')

subKop('Profiel (ober)')
checkItem('Naam, gebruikersnaam, foto URL')
checkItem('Korte voorstelling (zichtbaar op betaalpagina)')
checkItem('Story Behind the Smile (waarvoor spaar je?)')
checkItem('Spaardoel instellen: naam + doelbedrag')

subKop('Betaalpagina')
checkItem('Ober foto, naam, korte voorstelling')
checkItem('Story Behind the Smile kaartje')
checkItem('Vaste bedragen (EUR 2 / 3 / 5 / 10) + eigen bedrag')
checkItem('Sterren (1-5) + complimenten chips + boodschapveld (allemaal optioneel)')
checkItem('Bedrijfslogo onderaan als medewerker van een zaak')
checkItem('Betaalknop: "Betaal via WERO / Apple Pay"')

subKop('Zakelijke module (uitbater)')
checkItem('Dashboard: teamoverzicht, totaalcijfers, recente activiteit')
checkItem('Teambeheer: medewerkers toevoegen / bewerken / activeren / verwijderen')
checkItem('Bedrijfsinstellingen: naam + logo + live preview')
checkItem('Bedrijfslogo zichtbaar op betaalpagina van medewerkers')

// ── Kritiek pad ───────────────────────────────────────────────────────────────
sectieKop('WACHT  -  Kritiek pad  -  wacht op Belgische partij')
spatie(2)
blokkeerItem(1, 'Mollie API-key ontvangen',          'Moet door de Belgische partij worden aangeleverd')
blokkeerItem(2, 'Fee-split bevestigen (80% / 20%)',  'Businessbeslissing - bepaalt Mollie Connect inrichting')
blokkeerItem(3, 'Mollie Connect implementeren',      'Directe uitbetaling aan ober - pas na punt 1 + 2')
blokkeerItem(4, 'Bancontact toevoegen',              'Via Mollie - pas na punt 1')
blokkeerItem(5, 'IBAN-stap in registratie',          'Hangt samen met uitbetalingsflow')
blokkeerItem(6, 'End-to-end betaalflow testen',      'Pas als alles bovenstaande gereed is')

// ── Nog te bouwen ─────────────────────────────────────────────────────────────
sectieKop('TODO  -  Nog te bouwen (niet geblokkeerd)')
spatie(2)
checkItem('Foto-upload via Firebase Storage (nu: URL-invoer)', false)
checkItem('Echte PDF export in dashboard (nu: tekstbestand)', false)
checkItem('Grafieken van inkomsten (chart library)', false)
checkItem('Automatische bedankboodschap na betaling', false)
checkItem('GitHub repo aanmaken', false)
checkItem('Live zetten op tipdirect.be (Vercel aanbevolen)', false)
checkItem('Productie Firebase project aanmaken (tipdirect-prod)', false)
checkItem('DNS koppelen bij Hostnet', false)

// ── Na businessbeslissing ─────────────────────────────────────────────────────
sectieKop('LATER  -  Na businessbeslissing')
spatie(2)
checkItem('Premiummodel - wat zit erin, wat kost het?', false)
checkItem('AI-coaching via Claude API', false)
checkItem('Claim-codes voor fysieke producten (armbanden / kaartjes)', false)
checkItem('NFC leverancier zoeken', false)
checkItem('Gamification: beloningen, kortingscodes, partneraanbiedingen', false)

// ── Footer ────────────────────────────────────────────────────────────────────
ruimteVoor(30)
spatie(20)
doc.rect(L, y, W, 0.5).fill('#e5e7eb')
spatie(8)
doc.fontSize(8).font('Helvetica').fillColor(GRIJS)
   .text(
     'TipDirect  |  Vertrouwelijk  |  ' + new Date().toLocaleDateString('nl-NL'),
     L, y, { width: W, align: 'center' }
   )

doc.end()
console.log('PDF aangemaakt: ' + outputPath)
