const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: true })
const outputPath = path.join(__dirname, '..', 'TipDirect-Platform-Investering.pdf')
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

function tekst(inhoud) {
  ruimteVoor(36)
  doc.fontSize(9).font('Helvetica').fillColor(DONKER)
     .text(inhoud, L + 10, y, { width: W - 20, lineGap: 3 })
  y = doc.y + 5
}

function tabel(kolommen, rijen, totaalRij = null) {
  const headerH = 20
  ruimteVoor(headerH + 20)
  spatie(4)

  function tekenHeader() {
    doc.rect(L + 10, y, W - 20, headerH).fill('#fce7f3')
    let cx = L + 10
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(DONKER)
    kolommen.forEach(k => {
      doc.text(k.titel, cx + 5, y + 6, { width: k.breedte - 10, lineBreak: false, align: k.align || 'left' })
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
         .text(rij[i], cx + 5, y + 6, { width: k.breedte - 10, lineGap: 1, align: k.align || 'left' })
      cx += k.breedte
    })
    doc.rect(L + 10, y, W - 20, maxH).stroke('#e5e7eb')
    y += maxH
  })

  if (totaalRij) {
    const totaalH = 24
    ruimteVoor(totaalH)
    doc.rect(L + 10, y, W - 20, totaalH).fill(BRAND)
    let cx = L + 10
    kolommen.forEach((k, i) => {
      doc.fillColor('white').fontSize(9.5).font('Helvetica-Bold')
         .text(totaalRij[i], cx + 5, y + 8, { width: k.breedte - 10, lineBreak: false, align: k.align || 'left' })
      cx += k.breedte
    })
    y += totaalH
  }

  y += 8
}

function statBox(label, waarde, sub, x, breedte) {
  doc.rect(x, y, breedte - 8, 60).fill('#fdf2f8')
  doc.rect(x, y, 4, 60).fill(BRAND)
  doc.fontSize(8.5).font('Helvetica').fillColor(GRIJS)
     .text(label, x + 14, y + 10, { width: breedte - 24, lineBreak: false })
  doc.fontSize(20).font('Helvetica-Bold').fillColor(BRAND)
     .text(waarde, x + 14, y + 22, { width: breedte - 24, lineBreak: false })
  doc.fontSize(8).font('Helvetica').fillColor(GRIJS)
     .text(sub, x + 14, y + 46, { width: breedte - 24, lineBreak: false })
}

// ── Header ────────────────────────────────────────────────────────────────────
doc.rect(0, 0, 595, 90).fill(BRAND)
doc.fillColor('white').fontSize(24).font('Helvetica-Bold')
   .text('TipDirect', L, 16, { lineBreak: false })
doc.fontSize(12).font('Helvetica')
   .text('Platforminvestering — Miller Creative BV', L, 48, { lineBreak: false })
doc.fontSize(9).font('Helvetica-Oblique')
   .text(new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }), L, 68, { lineBreak: false })

y = 108

// ── Inleiding ────────────────────────────────────────────────────────────────
tekst(
  'Miller Creative BV heeft TipDirect volledig op maat ontwikkeld als eigen platform. Van de betaalinfrastructuur ' +
  'en abonnementslogica tot de partner-omgeving en het admin dashboard — alles is eigendom van Miller Creative BV ' +
  'en specifiek gebouwd voor de Belgische horeca. Het platform staat live op tipdirect.be.'
)

// ── Stat boxes ────────────────────────────────────────────────────────────────
spatie(8)
ruimteVoor(68)
const bw = W / 2
statBox('Ontwikkeltijd', '83 uur', 'Effectieve bouwuren', L, bw)
statBox('Totale investering', '€18.500', 'Op basis van bureautarief €225/uur', L + bw, bw)
y += 68

// ── Componentenoverzicht ──────────────────────────────────────────────────────
kop('Wat is gebouwd')

tabel(
  [
    { titel: 'Onderdeel', breedte: 175 },
    { titel: 'Omschrijving', breedte: 265 },
    { titel: 'Uren', breedte: 55, align: 'right' },
  ],
  [
    ['Project setup', 'Next.js, TypeScript, Tailwind, Firebase, Mollie koppeling', '4'],
    ['Betaalflow', 'Publieke betaalpagina, Mollie checkout, redirect, webhook', '8'],
    ['Abonnementssysteem', 'Pending/actief/vervallen logica, 30-dagenregel, idempotency', '6'],
    ['Ober dashboard', 'Stats per periode, abonnement-widget, QR-code, badges', '8'],
    ['QR-kaart print', 'Creditcardformaat, 4 per A4, klaar voor druk', '2'],
    ['Profiel & IBAN', 'Profielbeheer, IBAN-validatie server-side', '3'],
    ['Uitbater dashboard', 'Teambeheer, tips per medewerker, bedrijfsinstellingen', '8'],
    ['Admin dashboard', '4 tabs: abonnementen, uitbetalingen, partners, instellingen', '10'],
    ['Partner systeem', 'Partner dashboard, webhook revenue tracking, automatische uitbetaling', '12'],
    ['Registratie & login', 'Multi-stap registratie, partner referral via URL, meertalig', '5'],
    ['Landingspagina', 'Calculator, FAQ, beschikbaar in NL, EN, FR en DE', '5'],
    ['Authenticatie & security', 'Tokenbeveiliging, Firestore security rules, beveiligde routes', '4'],
    ['Scripts & bugfixes', 'Admin scripts, technische correcties en optimalisaties', '4'],
    ['Go-live & deployment', 'GitHub, Vercel, Firebase productie, DNS, omgevingsconfiguratie', '4'],
  ],
  ['Totaal', '', '83 uur']
)

// ── Platform functies ────────────────────────────────────────────────────────
kop('Platformfunctionaliteit — live op tipdirect.be')

tabel(
  [
    { titel: 'Functie', breedte: 165 },
    { titel: 'Detail', breedte: 310 },
  ],
  [
    ['Betaalflow end-to-end', 'Gast scant QR-code → kiest bedrag → betaalt → tip direct verwerkt'],
    ['Abonnement automatisch', 'Eerste fooien dekken abonnement. Na activatie 100% naar medewerker.'],
    ['Meerdere gebruikersrollen', 'Individuele ober, horecazaak (uitbater + team), partner, superadmin'],
    ['Partner dashboard', 'Partner logt in, ziet aangebrachte accounts, tegoed en uitbetalingen'],
    ['Automatische fee-verdeling', 'Per betaling automatisch gesplitst — geen handmatig werk vereist'],
    ['Admin dashboard', 'Volledig beheer van abonnementen, uitbetalingen, partners en instellingen'],
    ['QR-kaarten drukklaar', 'Elke medewerker print eigen kaart (creditcardformaat) vanuit dashboard'],
    ['Meertalig', 'Betaalpagina beschikbaar in Nederlands, Engels, Frans en Duits'],
    ['Productie-klaar', 'Live op tipdirect.be — Firebase productie, beveiliging actief'],
  ]
)

// ── Totaalblok ────────────────────────────────────────────────────────────────
spatie(16)
ruimteVoor(70)
doc.rect(L, y, W, 64).fill('#fdf2f8')
doc.rect(L, y, 4, 64).fill(BRAND)
doc.fontSize(9).font('Helvetica').fillColor(GRIJS)
   .text('Totale platforminvestering Miller Creative BV', L + 16, y + 10, { lineBreak: false })
doc.fontSize(28).font('Helvetica-Bold').fillColor(BRAND)
   .text('€18.500', L + 16, y + 22, { lineBreak: false })
doc.fontSize(8.5).font('Helvetica').fillColor(GRIJS)
   .text('83 ontwikkeluren  ×  €225 bureautarief  =  €18.675  →  afgerond €18.500', L + 16, y + 54, { lineBreak: false })
y += 72

// ── Footer ────────────────────────────────────────────────────────────────────
ruimteVoor(30)
spatie(20)
doc.rect(L, y, W, 0.5).fill('#e5e7eb')
spatie(8)
doc.fontSize(8).font('Helvetica').fillColor(GRIJS)
   .text(
     'TipDirect  |  Miller Creative BV  |  tipdirect.be',
     L, y, { width: W, align: 'center' }
   )

doc.end()
console.log('PDF aangemaakt: ' + outputPath)
