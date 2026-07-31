const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: true })
const outputPath = path.join(__dirname, '..', 'TipDirect-Concurrentieanalyse.pdf')
doc.pipe(fs.createWriteStream(outputPath))

const BRAND  = '#a10f5a'
const GRIJS  = '#6b7280'
const DONKER = '#111827'
const ROOD   = '#dc2626'
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

// Concurrentie-kaart: naam, website, herkomst/taal als badge rechts
function concurrentKop(naam, badge, nieuwBlad = false) {
  if (nieuwBlad) {
    nieuwePagina()
    spatie(8)
  } else {
    ruimteVoor(40)
    spatie(16)
  }
  doc.rect(L, y, W, 24).fill('#1f2937')
  doc.fillColor('white').fontSize(10.5).font('Helvetica-Bold')
     .text(naam, L + 12, y + 7, { lineBreak: false, width: W - 160 })
  doc.fontSize(8.5).font('Helvetica-Oblique')
     .text(badge, L + 12, y + 8, { width: W - 24, align: 'right', lineBreak: false })
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

function item(inhoud, kleur = DONKER) {
  ruimteVoor(16)
  doc.fontSize(9).font('Helvetica-Bold').fillColor(BRAND)
     .text('-', L + 10, y, { lineBreak: false, width: 12 })
  doc.fontSize(9).font('Helvetica').fillColor(kleur)
     .text(inhoud, L + 24, y, { width: W - 34, lineGap: 2 })
  y = doc.y + 4
}

function kortom(inhoud) {
  ruimteVoor(24)
  spatie(4)
  doc.rect(L + 10, y, W - 20, 18).fill('#f3f4f6')
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(GRIJS)
     .text('KORTOM:', L + 16, y + 5, { lineBreak: false, width: 60 })
  doc.fontSize(8.5).font('Helvetica-Oblique').fillColor(DONKER)
     .text(inhoud, L + 74, y + 5, { width: W - 90, lineBreak: false })
  y += 18
  spatie(8)
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
   .text('Concurrentieanalyse — vergelijkbare tip-oplossingen op de markt', L, 48, { lineBreak: false })
doc.fontSize(9).font('Helvetica-Oblique')
   .text('Interne notitie  —  ' + new Date().toLocaleDateString('nl-NL', {
     day: 'numeric', month: 'long', year: 'numeric'
   }), L, 64, { lineBreak: false })

y = 102

// ── Inleiding ─────────────────────────────────────────────────────────────────
tekst(
  'Voorafgaand aan de samenwerking is gekeken naar bestaande digitale tip-oplossingen, om te bepalen hoe TipDirect ' +
  'zich verhoudt tot de markt. Onderstaand overzicht laat zien dat het concept van digitaal fooi ontvangen via QR of ' +
  'NFC al langer bestaat, bij meerdere aanbieders, ruim vóórdat deze samenwerking is gestart.'
)
tekst(
  'De meeste alternatieven zijn Engels- of Amerikaans georiënteerd, vereisen vaak een app of apparaat aan de kant ' +
  'van de dienstverlener of de gast, en zijn niet of slecht toegesneden op de Belgische en Nederlandse markt.'
)

// ── TackPay ───────────────────────────────────────────────────────────────────
concurrentKop('TackPay  (tackpay.net)', 'Engelstalige app')
item('Vereist een app om te kunnen tippen')
item('Maandelijks abonnement')
item('Transactiekosten: 5% + $0,30 per tip')
kortom('Duur — vast abonnement plus een relatief hoog percentage per transactie.')

// ── EasyTip ───────────────────────────────────────────────────────────────────
concurrentKop('EasyTip  (easytip.net)', 'Engelstalig')
item('Werkt alleen met een fysieke "tipping terminal"')
item('Maandelijks abonnement')
item('Vaag en niet transparant over de daadwerkelijke fee')
item('Alleen actief in het Verenigd Koninkrijk, de Verenigde Arabische Emiraten en de Verenigde Staten')
kortom('Niet heel handig en niet beschikbaar in België of Nederland.')

// ── TipTap Payments ───────────────────────────────────────────────────────────
concurrentKop('TipTap Payments', 'Alleen VS')
item('Lijkt niet, of nog niet, actief te zijn')
item('Geen prijzen vermeld op de website')
kortom('Nog niks concreets — geen werkend product op de markt.')

// ── TipStap ───────────────────────────────────────────────────────────────────
concurrentKop('TipStap', 'Belgisch / Frans')
item('Website ziet er redelijk compleet uit, maar de dienst werkt in de praktijk niet')
item('Geen contact mogelijk via e-mail')
item('Kosten: 10% per tip, zonder maximum')
kortom('Geen serieuze concurrentie — niet functioneel en relatief duur.')

// ── Conclusie ─────────────────────────────────────────────────────────────────
kop('Conclusie', true)
tekst(
  'Het concept van digitaal tippen via QR-code of NFC is geen nieuw idee en bestaat al bij meerdere internationale ' +
  'aanbieders. Geen van deze partijen biedt echter een oplossing die specifiek, transparant en voordelig is ingericht ' +
  'voor de Belgische en Nederlandse markt, zonder app, met heldere kosten en met lokale betaalmethodes zoals WERO, ' +
  'Apple Pay en Bancontact.'
)
tekst(
  'Deze opsomming is vastgelegd om vooraf vast te leggen dat vergelijkbare concepten al bestonden vóórdat deze ' +
  'samenwerking begon. TipDirect is dus geen idee dat is ontstaan uit of eigendom is van de Belgische partij. Mocht de ' +
  'samenwerking om welke reden dan ook niet doorgaan, dan staat niets eraan in de weg om TipDirect alsnog zelfstandig ' +
  'naar Nederland, Duitsland of een ander land te brengen.'
)
noot('Deze notitie is bedoeld als interne onderbouwing en geheugensteun, niet als juridisch document.')

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
