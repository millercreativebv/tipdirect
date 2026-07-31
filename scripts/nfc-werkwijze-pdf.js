const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: true })
const outputPath = path.join(__dirname, '..', 'TipDirect-NFC-QR-Werkwijze.pdf')
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

function stap(nr, titel, inhoud) {
  ruimteVoor(34)
  const startY = y
  doc.circle(L + 17, startY + 7, 9).fill(BRAND)
  doc.fillColor('white').fontSize(8.5).font('Helvetica-Bold')
     .text(String(nr), L + 17 - 4, startY + 3, { lineBreak: false, width: 10 })
  doc.fillColor(DONKER).fontSize(9.5).font('Helvetica-Bold')
     .text(titel, L + 34, startY, { width: W - 44, lineBreak: false })
  y = startY + 14
  doc.fontSize(9).font('Helvetica').fillColor(GRIJS)
     .text(inhoud, L + 34, y, { width: W - 44, lineGap: 2 })
  y = doc.y + 8
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
   .text('Werkwijze: QR- en NFC-producten in bulk produceren en koppelen', L, 48, { lineBreak: false })
doc.fontSize(9).font('Helvetica-Oblique')
   .text('Toelichting voor de opdrachtgever  —  ' + new Date().toLocaleDateString('nl-NL', {
     day: 'numeric', month: 'long', year: 'numeric'
   }), L, 64, { lineBreak: false })

y = 102

// ── Inleiding ─────────────────────────────────────────────────────────────────
tekst(
  'TipDirect werkt in de basis volledig digitaal: iedere medewerker en iedere zaak heeft een persoonlijke betaalpagina ' +
  '(bijvoorbeeld tipdirect.be/jan) die altijd bereikbaar is via een QR-code die op de telefoon getoond kan worden. ' +
  'Dat blijft de snelste en goedkoopste manier om te starten en is voor iedere gebruiker direct beschikbaar, zonder ' +
  'wachttijd en zonder productiekosten.'
)
tekst(
  'Daarnaast kan TipDirect worden uitgebreid met fysieke producten: gedrukte QR-kaartjes, NFC-armbanden, tafelkaartjes, ' +
  'stickers of badges. Dit document beschrijft hoe zo\'n fysiek product technisch werkt, hoe het in bulk geproduceerd ' +
  'wordt en hoe één kaartje of chip aan het account van een specifieke medewerker wordt gekoppeld.'
)

// ── 1. Twee manieren om een tip te ontvangen ─────────────────────────────────
kop('1. Twee manieren om een tip te ontvangen')
tekst('Beide manieren leiden de klant naar exact dezelfde betaalpagina. Voor het systeem maakt het geen verschil hoe de klant er komt.')

subKop('Digitaal — QR op de telefoon')
item('De medewerker toont de QR-code uit zijn eigen dashboard op het scherm van de telefoon')
item('Geen voorraad, geen productiekosten, direct beschikbaar voor iedere gebruiker')
item('Ideaal voor wie net begint of geen fysiek product nodig heeft')

subKop('Fysiek — gedrukte QR of NFC-chip')
item('Een gedrukte QR-code of een NFC-chip op een kaartje, tafelkaartje, sticker, armband of badge')
item('Voelt professioneel en tactiel, handig op plekken waar de telefoon niet altijd bij de hand is (bijvoorbeeld op tafels of bij de bar)')
item('NFC werkt met een tik (tap) van de telefoon van de klant, zonder dat de camera nodig is — vaak sneller dan scannen')

// ── 2. Het principe achter een fysiek product ────────────────────────────────
kop('2. Het principe achter een fysiek product')
tekst(
  'Een fysiek kaartje of chip bevat nooit rechtstreeks de naam of betaalpagina van een medewerker. In plaats daarvan ' +
  'bevat het object een vaste, unieke code die verwijst naar een systeem-adres, bijvoorbeeld: tipdirect.be/c/AB12CD34.'
)
tekst(
  'Deze tussenstap (een "claim-code") is het kernprincipe van het systeem. De code zelf wordt nooit aangepast nadat ' +
  'het kaartje gedrukt of geprogrammeerd is — maar waar de code naartoe verwijst, kan op elk moment worden gewijzigd ' +
  'via het dashboard. Zo kan TipDirect grote aantallen kaartjes vooraf laten produceren, zonder al te weten wie het ' +
  'kaartje uiteindelijk gaat gebruiken.'
)
noot('Voordeel: bij personeelswissel kan een bestaand kaartje opnieuw worden uitgegeven aan een nieuwe medewerker, zonder dat er een nieuw fysiek product nodig is.')

// ── 3. Het claim-code systeem ─────────────────────────────────────────────────
kop('3. Het claim-code systeem stap voor stap')
stap(1, 'Codes genereren', 'Voordat een batch geproduceerd wordt, genereert TipDirect een lijst unieke codes (bijvoorbeeld 8 tekens, letters en cijfers). Iedere code krijgt de status "niet geclaimd" en wordt gekoppeld aan een batch-nummer en aanmaakdatum.')
stap(2, 'Codes omzetten naar QR of NFC-data', 'Per code wordt automatisch de bijbehorende QR-afbeelding gegenereerd (een afbeelding van tipdirect.be/c/[code]), of de URL die in de NFC-chip geprogrammeerd moet worden.')
nieuwePagina()
stap(3, 'Aanleveren bij de producent', 'Een overzicht met alle codes en de bijbehorende QR-afbeeldingen of NFC-data wordt aangeleverd aan de leverancier die de kaartjes, stickers of armbanden fysiek drukt of programmeert.')
stap(4, 'Productie en kwaliteitscontrole', 'De leverancier produceert de batch. Voor levering wordt een steekproef getest: scannen of tappen moet altijd naar de juiste, werkende redirect-pagina leiden.')
stap(5, 'Uitleveren aan de zaak', 'De horecazaak ontvangt de kaartjes of armbanden en deelt deze uit aan het personeel, of legt ze klaar op tafels of bij de bar.')
stap(6, 'Activeren door de medewerker', 'De medewerker logt in op zijn dashboard, kiest "Kaartje koppelen" en voert de code in die op het kaartje staat. Vanaf dat moment verwijst de code naar zijn eigen betaalpagina en is het kaartje live.')

// ── 4. Beheer van codes en batches ───────────────────────────────────────────
kop('4. Beheer van codes en batches')
tekst('Voor TipDirect en voor de uitbater is er inzicht in alle uitgegeven codes, georganiseerd per batch en per status.')
item('Per batch zichtbaar: totaal aantal codes, aantal geclaimd, aantal nog beschikbaar')
item('Codes van medewerkers die uit dienst gaan, kunnen worden losgekoppeld en opnieuw worden uitgegeven aan een nieuwe medewerker')
item('Bij verlies of beschadiging van een kaartje wordt de oude code gedeactiveerd; de medewerker krijgt een nieuw kaartje met een nieuwe code, gekoppeld aan zijn bestaande account')
item('Nieuwe batches kunnen op elk moment worden bijbesteld zodra de voorraad van een zaak op is')

// ── 5. Beveiliging ────────────────────────────────────────────────────────────
kop('5. Beveiliging en misbruikpreventie')
item('Een claim-code geeft geen toegang tot een account of geld — hij bepaalt alleen naar welke betaalpagina wordt doorverwezen')
item('Alleen een ingelogde medewerker kan een code aan zijn eigen account koppelen')
item('Codes worden willekeurig gegenereerd, niet voorspelbaar of doorlopend genummerd, om misbruik door gokken te voorkomen')
item('Een code die al geclaimd is door iemand anders, kan niet opnieuw worden gekoppeld zonder tussenkomst van de beheerder')

// ── 6. Wat is er nodig om te starten ──────────────────────────────────────────
kop('6. Wat is er nodig om te starten')
tekst('Om de eerste batch fysieke producten te kunnen laten produceren, zijn de volgende keuzes nodig:')
item('Het gewenste producttype: kaartje, sticker, tafelkaartje, armband of badge — en QR, NFC, of beide')
item('Een leverancier die NFC-chips kan programmeren en/of QR-codes kan bedrukken op het gewenste materiaal')
item('Het gewenste aantal voor de eerste batch, per horecazaak of voor algemene voorraad')
item('Een prijsafspraak per stuk met de gekozen leverancier (deze kosten vallen buiten de TipDirect-investering en worden apart met de leverancier afgerekend)')

spatie(4)
noot('De digitale QR-code op de telefoon blijft in alle gevallen beschikbaar als gratis basisoptie. Fysieke producten zijn een uitbreiding op het platform, geen vervanging.')

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
