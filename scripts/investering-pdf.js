const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: true })
const outputPath = path.join(__dirname, '..', 'TipDirect-Investering.pdf')
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

function noot(inhoud) {
  ruimteVoor(28)
  spatie(4)
  doc.rect(L + 10, y, W - 20, 1).fill('#fce7f3')
  spatie(4)
  doc.fontSize(8.5).font('Helvetica').fillColor('#9f1239')
     .text(inhoud, L + 10, y, { width: W - 20, lineGap: 2 })
  y = doc.y + 6
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
    const totaalH = 22
    ruimteVoor(totaalH)
    doc.rect(L + 10, y, W - 20, totaalH).fill(BRAND)
    let cx = L + 10
    kolommen.forEach((k, i) => {
      doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
         .text(totaalRij[i], cx + 5, y + 7, { width: k.breedte - 10, lineBreak: false, align: k.align || 'left' })
      cx += k.breedte
    })
    y += totaalH
  }

  y += 8
}

function statBox(label, waarde, sub, x, breedte) {
  doc.rect(x, y, breedte - 8, 54).fill('#fdf2f8')
  doc.rect(x, y, 3, 54).fill(BRAND)
  doc.fontSize(9).font('Helvetica').fillColor(GRIJS)
     .text(label, x + 12, y + 8, { width: breedte - 20, lineBreak: false })
  doc.fontSize(18).font('Helvetica-Bold').fillColor(BRAND)
     .text(waarde, x + 12, y + 20, { width: breedte - 20, lineBreak: false })
  doc.fontSize(8).font('Helvetica').fillColor(GRIJS)
     .text(sub, x + 12, y + 42, { width: breedte - 20, lineBreak: false })
}

// ── Header ────────────────────────────────────────────────────────────────────
doc.rect(0, 0, 595, 90).fill(BRAND)
doc.fillColor('white').fontSize(24).font('Helvetica-Bold')
   .text('TipDirect', L, 16, { lineBreak: false })
doc.fontSize(12).font('Helvetica')
   .text('Platform — Investeringsoverzicht', L, 48, { lineBreak: false })
doc.fontSize(9).font('Helvetica-Oblique')
   .text('Vertrouwelijk document — Miller Creative BV', L, 68, { lineBreak: false })

y = 108

// ── Inleiding ────────────────────────────────────────────────────────────────
tekst(
  'Dit document geeft een overzicht van de investering die Miller Creative BV heeft gedaan in de ontwikkeling van ' +
  'het TipDirect platform. Het platform is volledig op maat gebouwd — van de betaalinfrastructuur en ' +
  'abonnementslogica tot het partner-dashboard voor Strictly Hospitality. Onderstaande uren en bedragen ' +
  'weerspiegelen de werkelijke bouwkosten op basis van een marktconform bureautarief van €175 per uur.'
)

// ── Stat boxes ────────────────────────────────────────────────────────────────
spatie(8)
ruimteVoor(60)
const bw = W / 3
statBox('Ontwikkeltijd', '83 uur', 'Netto codering', L, bw)
statBox('Marktwaarde', '€14.525', 'Bij €175/uur', L + bw, bw)
statBox('Bureauprijs', '€18.000–€25.000', 'Incl. design & PM', L + bw * 2, bw)
y += 62

// ── Componentenoverzicht ──────────────────────────────────────────────────────
kop('Overzicht gebouwde onderdelen')

tabel(
  [
    { titel: 'Onderdeel', breedte: 175 },
    { titel: 'Omschrijving', breedte: 245 },
    { titel: 'Uren', breedte: 55, align: 'right' },
    { titel: 'Bedrag', breedte: 20, align: 'right' },
  ],
  [
    ['Project setup', 'Next.js, TypeScript, Tailwind, Firebase, Mollie koppeling', '4', ''],
    ['Betaalflow', 'Publieke betaalpagina, Mollie checkout, redirect, webhook', '8', ''],
    ['Abonnementssysteem', 'Pending/actief/vervallen logica, 30-dagenregel, idempotency', '6', ''],
    ['Ober dashboard', 'Stats per periode, abonnement-widget, QR-code, badges', '8', ''],
    ['QR-kaart print', 'Creditcardformaat, 4 per A4, klaar voor druk', '2', ''],
    ['Profiel & IBAN', 'Profielbeheer, IBAN-validatie server-side', '3', ''],
    ['Uitbater dashboard', 'Teambeheer, tips per medewerker, bedrijfsinstellingen', '8', ''],
    ['Admin dashboard', '4 tabs: abonnementen, uitbetalingen, partners, instellingen', '10', ''],
    ['Partner systeem (SH)', 'SH dashboard, webhook revenue tracking, automatische uitbetaling', '12', ''],
    ['Registratie & login', 'Multi-stap registratie, partner referral via URL, meertalig', '5', ''],
    ['Landingspagina', 'Calculator, FAQ, NL/EN/FR/DE, responsive', '5', ''],
    ['Authenticatie & security', 'Bearer tokens, Firestore security rules, admin routes', '4', ''],
    ['Scripts & bugfixes', 'Admin scripts, TypeScript fixes, technische correcties', '4', ''],
    ['Go-live & deployment', 'GitHub, Vercel, Firebase productie, DNS, environment config', '4', ''],
  ],
  ['Totaal', '', '83 uur', '']
)

// ── Wat is gebouwd ────────────────────────────────────────────────────────────
kop('Wat het platform vandaag kan', true)

tekst(
  'TipDirect is geen prototype — het is een volledig werkend platform dat vandaag live staat op tipdirect.be. ' +
  'Onderstaand een overzicht van de functionaliteit die direct beschikbaar is voor klanten en partners.'
)

spatie(6)

tabel(
  [
    { titel: 'Functie', breedte: 165 },
    { titel: 'Detail', breedte: 310 },
  ],
  [
    ['Betaalflow end-to-end', 'Gast scant QR → kiest bedrag → betaalt via Mollie → tip direct verwerkt'],
    ['Abonnement automatisch', 'Eerste fooien dekken abonnement (€29,99). Daarna volledig automatisch actief.'],
    ['Meerdere gebruikersrollen', 'Individuele ober, horecazaak (uitbater + team), partner (SH), superadmin'],
    ['Partner dashboard', 'SH logt in op /partner: aangebrachte accounts, open tegoed, uitbetalingshistorie'],
    ['Automatische fee-verdeling', 'Bij elke betaling: 42,5% Miller / 42,5% SH / 15% Marketing — geen handmatig werk'],
    ['Admin dashboard', 'Volledig beheer: abonnementen, uitbetalingen, partners aanmaken, fees aanpassen'],
    ['QR-kaarten klaar voor druk', 'Elke ober print eigen QR-kaart (creditcardformaat) direct vanuit het dashboard'],
    ['Meertalig platform', 'Betaalpagina beschikbaar in Nederlands, Engels, Frans en Duits'],
    ['Productie-klaar', 'Live op tipdirect.be via Vercel, Firebase productie-database, security rules actief'],
  ]
)

// ── Marktperspectief ──────────────────────────────────────────────────────────
kop('Marktperspectief')

tekst(
  'Vergelijkbare platforms worden door gespecialiseerde bureaus ontwikkeld voor bedragen tussen €20.000 en €80.000, ' +
  'afhankelijk van de scope. TipDirect heeft een unieke positie: het platform is volledig eigendom van Miller Creative BV ' +
  'en combineert betalingsinfrastructuur, abonnementslogica, partnercommissies en multi-rol dashboards in één systeem.'
)

spatie(6)

tabel(
  [
    { titel: 'Vergelijking', breedte: 175 },
    { titel: 'Marktwaarde', breedte: 110, align: 'right' },
    { titel: 'Toelichting', breedte: 190 },
  ],
  [
    ['Extern bureau (laagtarief)', '€20.000 – €35.000', 'Basis betalingsplatform, geen partner-systeem'],
    ['Extern bureau (premium)', '€45.000 – €80.000', 'Vergelijkbare scope, inclusief design en PM'],
    ['SaaS platform licentie', '€300 – €800/maand', 'Geen eigendom, beperkte aanpassing, doorlopende kosten'],
    ['TipDirect (Miller Creative)', '€14.525 netto', 'Volledig eigendom, maatwerk, doorontwikkelbaar'],
  ]
)

noot(
  'Bovenstaande marktbedragen zijn gebaseerd op gangbare tarieven voor vergelijkbare betalingsplatforms in de Benelux (2025–2026). ' +
  'De investering van Miller Creative BV ligt significant lager doordat het platform intern is ontwikkeld.'
)

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
