const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: true })
const outputPath = path.join(__dirname, '..', 'TipDirect-Projectplan-Investering-V2.pdf')
doc.pipe(fs.createWriteStream(outputPath))

const BRAND  = '#a10f5a'
const GRIJS  = '#6b7280'
const DONKER = '#111827'
const L      = 50
const W      = 495
const BOTTOM = 800

let y = 0
let totaal = 0

// ── helpers ───────────────────────────────────────────────────────────────────

function euro(n) {
  const str = Math.round(n).toString()
  let withDots = ''
  let count = 0
  for (let i = str.length - 1; i >= 0; i--) {
    withDots = str[i] + withDots
    count++
    if (count % 3 === 0 && i !== 0) withDots = '.' + withDots
  }
  return '€ ' + withDots + ',00'
}

function nieuwePagina() {
  doc.addPage()
  y = 40
}

function ruimteVoor(h) {
  if (y + h > BOTTOM) nieuwePagina()
}

function spatie(pt = 10) { y += pt }

// Sectiebalk met titel + prijs rechts uitgelijnd
function prijsKop(titel, prijs, nieuwBlad = false) {
  if (nieuwBlad) {
    nieuwePagina()
    spatie(8)
  } else {
    ruimteVoor(46)
    spatie(18)
  }
  doc.rect(L, y, W, 26).fill(BRAND)
  doc.fillColor('white').fontSize(10.5).font('Helvetica-Bold')
     .text(titel, L + 12, y + 8, { lineBreak: false, width: W - 160 })
  doc.fontSize(10.5).font('Helvetica-Bold')
     .text(prijs, L + 12, y + 8, { width: W - 24, align: 'right', lineBreak: false })
  doc.fillColor(DONKER)
  y += 26
  spatie(10)
}

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

function totaalBox(label, prijs) {
  ruimteVoor(50)
  spatie(14)
  doc.rect(L, y, W, 40).fill('#111827')
  doc.fillColor('white').fontSize(12).font('Helvetica-Bold')
     .text(label, L + 16, y + 13, { lineBreak: false, width: W - 200 })
  doc.fontSize(14).font('Helvetica-Bold')
     .text(prijs, L + 16, y + 11, { width: W - 32, align: 'right', lineBreak: false })
  doc.fillColor(DONKER)
  y += 40
  spatie(6)
}

// helperfunctie: prijs-sectie met items, telt automatisch op bij totaal
function onderdeel(titel, prijs, items, nieuwBlad = false) {
  totaal += prijs
  prijsKop(titel, euro(prijs), nieuwBlad)
  items.forEach(i => item(i))
}

// ── Header ────────────────────────────────────────────────────────────────────
doc.rect(0, 0, 595, 84).fill(BRAND)
doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
   .text('TipDirect', L, 16, { lineBreak: false })
doc.fontSize(11).font('Helvetica')
   .text('Projectplan & investeringsoverzicht  |  Fooien applicatie voor dienstverleners', L, 48, { lineBreak: false })
doc.fontSize(9).font('Helvetica-Oblique')
   .text('Voorstel ter besluitvorming  —  ' + new Date().toLocaleDateString('nl-NL', {
     day: 'numeric', month: 'long', year: 'numeric'
   }), L, 64, { lineBreak: false })

y = 102

tekst(
  'Hier volgt het projectplan voor de verdere ontwikkeling van TipDirect.be. De genoemde bedragen zijn eenmalig en ' +
  'los van de fee die we overeenkomen: van de opbrengst is 80% voor Strictly Hospitality, 20% voor Miller Creative.'
)
spatie(4)

// ── Investeringsoverzicht ─────────────────────────────────────────────────────
kop('Investeringsoverzicht — onderdelen van het platform')

onderdeel('1. Fundament', 3000, [
  'Firebase Auth en Firestore voor accountbeheer en data-opslag',
  'Firebase Admin SDK voor server-side verwerking van betalingen',
  'Stabiele technische basis (Next.js, beveiligde architectuur)',
  'Inrichting conform de beveiligingseisen van de betaalprovider (PCI DSS niveau 1)',
])

onderdeel('2. Landingspagina, registratie & persoonlijk profiel', 7000, [
  'Introductiepagina met uitleg over TipDirect voor nieuwe gebruikers',
  'Berekening in real-time: berekening van mogelijke inkomsten via schuifregelaars',
  'Veelgestelde vragen (FAQ) en meertalige beschikbaarheid (NL, FR, DE, EN)',
  'Keuzestap bij aanmelden: individuele dienstverlener of bedrijf',
  'Account aanmaken met e-mail en wachtwoord',
  'Profielpagina met naam, gebruikersnaam en profielfoto',
  'Persoonlijke betaalpagina op tipdirect.be/[naam]',
  'Korte persoonlijke voorstelling, zichtbaar op de betaalpagina',
  'Story Behind the Smile: waarvoor spaart de medewerker?',
  'Spaardoel instellen met naam, doelbedrag en voortgangsbalk in het dashboard',
])

onderdeel('3. Betaalpagina, dashboard & zakelijke module', 10500, [
  'Klant scant QR-code en ziet naam en foto van de medewerker',
  'Keuze uit vaste bedragen of een eigen bedrag invoeren',
  'Sterrenbeoordeling, complimenten en persoonlijke boodschap bij elke tip',
  'Bedrijfslogo zichtbaar als de medewerker bij een aangesloten zaak werkt',
  'Succespagina direct na een geslaagde betaling',
  'Dashboard met overzicht van ontvangen tips: vandaag, week, maand, totaal',
  'QR-code genereren en downloaden, plus exportfunctie van het overzicht',
  'Badges voor mijlpalen (eerste tip, 10 tips, 100 tips, EUR 500 ontvangen)',
  'Recente tips inclusief boodschappen en beoordelingen van klanten',
  'Zakelijk account met bedrijfsnaam en logo',
  'Teambeheer: medewerkers toevoegen, bewerken, activeren en verwijderen',
  'Bedrijfsdashboard met teamtotalen en activiteit per medewerker',
])

onderdeel('4. Mollie-koppeling & livegang van de betaalflow', 8000, [
  'Koppeling met Mollie Connect voor directe uitbetaling aan medewerkers',
  'Bancontact toevoegen als betaalmethode',
  'IBAN-stap in de registratie en verificatie van rekeninghouders',
  'Verwerking van de fee-verdeling tussen de betrokken partijen',
  'End-to-end test van de volledige betaalflow vóór livegang',
])

totaalBox('Totale investering (eenmalig, excl. btw)', euro(totaal))
noot('Dit bedrag betreft de eenmalige investering voor de bouw en oplevering van TipDirect.be op basis van bovengenoemde onderdelen. De onderdelen hieronder vallen hier niet onder en worden niet vooraf in rekening gebracht.')

// ── Inbegrepen in de samenwerking ─────────────────────────────────────────────
kop('Inbegrepen in de samenwerking — geen kosten vooraf', true)
tekst(
  'De onderstaande onderdelen worden niet los gefactureerd. Ze vallen onder de lopende samenwerking ' +
  'tussen Partijen en worden gedekt vanuit de commissie die over de Bruto-opbrengst wordt afgesproken. ' +
  'Onder deze commissie valt ook het reguliere onderhoud en de doorontwikkeling (programmeren) van het ' +
  'platform gedurende de looptijd van de samenwerking.'
)

subKop('Onderhoud en doorontwikkeling')
item('Onderhoud, beveiligingsupdates en bugfixes gedurende de looptijd van de samenwerking')
item('Doorontwikkeling en programmeren van nieuwe onderdelen op verzoek van Strictly Hospitality')
item('Periodieke technische overdracht van broncode en documentatie (per kalenderkwartaal)')

subKop('Nog te bouwen')
item('Foto-upload via Firebase Storage (in plaats van URL-invoer)')
item('Echte PDF-export in het dashboard')
item('Grafieken van inkomsten')
item('Automatische bedankboodschap na betaling')
item('GitHub-repository')
item('Livegang op tipdirect.be via Vercel')
item('Productie Firebase-project')
item('DNS-koppeling')

subKop('Na akkoord')
item('AI-coaching via de Claude API (bouwen op basis van verdere info opdrachtgever)')
item('Claim-codes voor fysieke producten (armbanden, kaartjes)')
item('NFC-leverancier en NFC-functionaliteit')
item('Gamification: beloningen, kortingscodes, partneraanbiedingen')

spatie(6)
noot('Bovenstaande onderdelen worden, zodra gewenst, in overleg opgepakt binnen de bestaande samenwerking en leiden niet tot een aparte factuur.')

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
console.log('Totaal: ' + euro(totaal))
