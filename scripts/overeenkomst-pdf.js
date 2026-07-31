const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: true })
const outputPath = path.join(__dirname, '..', 'TipDirect-Overeenkomst-Concept.pdf')
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

// Brand-gekleurde sectiebalk (artikel of bijlage)
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

function puntKop(tekst) {
  ruimteVoor(20)
  spatie(6)
  doc.fontSize(10).font('Helvetica-Bold').fillColor(DONKER)
     .text(tekst, L + 10, y, { width: W - 20 })
  y = doc.y + 6
}

function tekst(inhoud) {
  ruimteVoor(30)
  doc.fontSize(9).font('Helvetica').fillColor(GRIJS)
     .text(inhoud, L + 10, y, { width: W - 20, lineGap: 3 })
  y = doc.y + 5
}

// genummerde clausule, bv. "2.3."
function clausule(nr, inhoud, indent = 10) {
  ruimteVoor(20)
  const startY = y
  doc.fontSize(9).font('Helvetica-Bold').fillColor(BRAND)
     .text(nr, L + indent, startY, { lineBreak: false, width: 36 })
  doc.fontSize(9).font('Helvetica').fillColor(DONKER)
     .text(inhoud, L + indent + 38, startY, { width: W - indent - 48, lineGap: 2 })
  y = doc.y + 6
}

// letter-item, bv. "A." of "a."
function letterItem(letter, inhoud, indent = 10) {
  ruimteVoor(20)
  const startY = y
  doc.fontSize(9).font('Helvetica-Bold').fillColor(BRAND)
     .text(letter, L + indent, startY, { lineBreak: false, width: 20 })
  doc.fontSize(9).font('Helvetica').fillColor(DONKER)
     .text(inhoud, L + indent + 22, startY, { width: W - indent - 32, lineGap: 2 })
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
  doc.fontSize(8.5).font('Helvetica-Oblique').fillColor('#9f1239')
     .text(inhoud, L + 10, y, { width: W - 20, lineGap: 2 })
  y = doc.y + 6
}

// generieke tabel met automatische rij-hoogte en kolombreedtes
function tabel(kolommen, rijen) {
  const headerH = 22
  ruimteVoor(headerH + 24)
  spatie(4)

  function tekenHeader() {
    doc.rect(L + 10, y, W - 20, headerH).fill('#dbeafe')
    let cx = L + 10
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(DONKER)
    kolommen.forEach(k => {
      doc.text(k.titel, cx + 5, y + 7, { width: k.breedte - 10, lineBreak: false })
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
doc.fillColor('white').fontSize(20).font('Helvetica-Bold')
   .text('Concept-overeenkomst TipDirect.be België', L, 16, { lineBreak: false })
doc.fontSize(10.5).font('Helvetica')
   .text('Miller Creative BV  |  Strictly Hospitality BV', L, 44, { lineBreak: false })
doc.fontSize(9).font('Helvetica-Oblique')
   .text('Datum: [invullen]', L, 62, { lineBreak: false })

y = 102

noot('CONCEPT — dit document is een eerste opzet ter bespreking en is niet juridisch gecontroleerd. Laat het vóór ondertekening juridisch controleren.')
spatie(4)

// ── Partijen ──────────────────────────────────────────────────────────────────
puntKop('Partijen')
clausule('1.', 'Miller Creative BV, statutair gevestigd te Berghem, kantoorhoudende te Deursenseweg 12, ingeschreven in de Kamer van Koophandel onder nummer 90467906, rechtsgeldig vertegenwoordigd door Ad Mulders, hierna te noemen: "Miller Creative";')
clausule('2.', 'Strictly Hospitality BV, statutair gevestigd te [plaats], kantoorhoudende te [adres], ingeschreven in [handelsregister/KBO] onder nummer [nummer], rechtsgeldig vertegenwoordigd door [naam], hierna te noemen: "Strictly Hospitality";')
tekst('Miller Creative en Strictly Hospitality worden hierna afzonderlijk aangeduid als "Partij" en gezamenlijk als "Partijen".')

// ── Overwegingen ──────────────────────────────────────────────────────────────
puntKop('Overwegingen')
letterItem('A.', 'Miller Creative heeft een systeem ontwikkeld onder de naam TipDirect, waarmee bedienend personeel in de horeca via een QR-code fooi kan ontvangen van gasten, zonder contant geld en zonder app.')
letterItem('B.', 'Betalingen binnen TipDirect vinden plaats via onder meer WERO of Apple Pay, waarbij Mollie optreedt als payment service provider.')
letterItem('C.', 'TipDirect kan functioneren met of zonder tussenkomst van de werkgever van het bedienend personeel.')
letterItem('D.', 'Miller Creative wenst de Belgische uitvoering van het systeem, waaronder TipDirect.be, de broncodes en de URL/domeinnaam tipdirect.be, aan Strictly Hospitality te verkopen en over te dragen.')
letterItem('E.', 'Strictly Hospitality wenst eigenaar te worden van TipDirect.be om het systeem in België commercieel te kunnen exploiteren, onder de voorwaarden zoals vastgelegd in deze overeenkomst.')
letterItem('F.', 'Miller Creative blijft na de overdracht uitsluitend op de achtergrond betrokken als technische ondersteuner en behoudt daarvoor toegang tot de achterkant van het systeem.')
spatie(2)
tekst('Partijen komen het volgende overeen.')

// ── Artikel 1 — Definities ───────────────────────────────────────────────────
kop('Artikel 1 — Definities')
clausule('1.1.', 'TipDirect.be: de Belgische uitvoering van het door Miller Creative ontwikkelde TipDirect-systeem, bestemd voor gebruik en exploitatie in België.')
clausule('1.2.', 'Gebied: België.')
clausule('1.3.', 'Systeem: de software, technische inrichting, QR-functionaliteit, betaalflow, gebruikersomgeving, documentatie, broncodes en overige technische onderdelen van TipDirect.be, voor zover deze betrekking hebben op de Belgische uitvoering.')
clausule('1.4.', 'Broncode: de programmeercode, scripts, configuratiebestanden en technische bestanden die nodig zijn voor het functioneren, beheren en doorontwikkelen van TipDirect.be, voor zover aanwezig en overdraagbaar.')
clausule('1.5.', 'Domeinnaam: de URL/domeinnaam tipdirect.be, inclusief bijbehorende toegangs- en beheergegevens, voor zover deze bij Miller Creative berusten of door Miller Creative kunnen worden overgedragen.')
clausule('1.6.', 'Back-end: de beheeromgeving en technische achterkant van het Systeem, inclusief beheerfuncties, logs, instellingen, transactierelevante gegevens en technische supporttoegang.')
clausule('1.7.', 'Transactievergoeding: de vergoeding die per ontvangen fooi wordt ingehouden of in rekening wordt gebracht ten behoeve van TipDirect.be en/of de betaalprovider.')
clausule('1.8.', 'Netto-opbrengst: alle door Strictly Hospitality gerealiseerde inkomsten uit exploitatie van TipDirect.be in het Gebied, verminderd met rechtstreeks aan Mollie of een andere payment service provider verschuldigde transactiekosten, tenzij Partijen schriftelijk anders overeenkomen.')
clausule('1.9.', 'Periodieke technische overdracht: de door Miller Creative per kalenderkwartaal uit te voeren overdracht van actuele broncode, technische documentatie en overige technische informatie aan Strictly Hospitality, zoals omschreven in artikel 6A.')
clausule('1.10.', 'Technisch overdrachtsmateriaal: de broncode, scripts, configuratiebestanden, release notes, databasewijzigingen, migratiescripts, build- en deploymentinstructies, technische documentatie, repository-export en overige technische informatie die redelijkerwijs nodig is voor beheer, onderhoud, foutanalyse, doorontwikkeling en continuïteit van TipDirect.be.')
clausule('1.11.', 'Overdrachtsmethode: de door Partijen overeengekomen veilige methode voor de periodieke technische overdracht, zoals een beveiligde bestandsomgeving of andere passende digitale overdrachtswijze.')
clausule('1.12.', 'Release notes: een beknopt overzicht van wijzigingen, updates, bugfixes, beveiligingsaanpassingen en relevante technische bijzonderheden sinds de vorige technische overdracht.')

// ── Artikel 2 ─────────────────────────────────────────────────────────────────
kop('Artikel 2 — Onderwerp van de overeenkomst')
clausule('2.1.', 'Miller Creative verkoopt en draagt aan Strictly Hospitality over het eigendom van TipDirect.be voor België, waaronder de Belgische uitvoering van het Systeem, de bijbehorende broncodes en de URL/domeinnaam tipdirect.be, zoals nader omschreven in Bijlage 1.')
clausule('2.2.', 'De overdracht ziet op TipDirect.be en de exploitatie daarvan in België. Strictly Hospitality is na overdracht bevoegd TipDirect.be in België te gebruiken, te exploiteren, te vermarkten en aan te bieden aan horecazaken, bedienend personeel en overige relevante hospitality-partijen.')
clausule('2.3.', 'Tenzij uitdrukkelijk schriftelijk anders overeengekomen, verkrijgt Strictly Hospitality geen rechten voor exploitatie van TipDirect buiten België of op andere door Miller Creative ontwikkelde systemen, domeinen, concepten of handelsactiviteiten.')
clausule('2.4.', 'Partijen leggen in Bijlage 1 nader vast welke technische onderdelen, accounts, documentatie, domeinnamen, broncodes, toegangsrechten en overige activa worden overgedragen of beschikbaar worden gesteld.')
clausule('2.5.', 'Miller Creative blijft gedurende de looptijd uitsluitend op de achtergrond betrokken als technische ondersteuner. Voor dat doel behoudt Miller Creative toegang tot de Back-end van het Systeem, zonder dat deze toegang afbreuk doet aan het eigendom van Strictly Hospitality.')

// ── Artikel 3 ─────────────────────────────────────────────────────────────────
kop('Artikel 3 — Vergoeding, commissie en betalingsvoorwaarden')
clausule('3.1.', 'Strictly Hospitality betaalt aan Miller Creative een eenmalige upfront koopprijs van € 20.000 exclusief btw voor de overdracht van het eigendom van TipDirect.be, inclusief de broncodes en de URL/domeinnaam tipdirect.be, zoals omschreven in deze overeenkomst en Bijlage 1.')
clausule('3.2.', 'De in artikel 3.1 bedoelde koopprijs wordt gefactureerd na ondertekening van deze overeenkomst en dient binnen 14 dagen na factuurdatum te worden voldaan, tenzij Partijen schriftelijk anders overeenkomen.')
clausule('3.3.', 'Naast de upfront koopprijs draagt Strictly Hospitality gedurende de looptijd van deze overeenkomst 20% van de Netto-opbrengst af aan Miller Creative als commissie voor de technische ondersteuning, het onderhoud, de beschikbaarstelling van technische kennis en de oorspronkelijke ontwikkeling van TipDirect.be.')
clausule('3.4.', 'De commissie als bedoeld in artikel 3.3 wordt periodiek berekend en via Mollie aan Miller Creative uitbetaald, voor zover de betaaltechnische inrichting via Mollie dit mogelijk maakt. Indien uitbetaling via Mollie tijdelijk niet mogelijk is, betaalt Strictly Hospitality de verschuldigde commissie per bank binnen 15 dagen na afloop van de betreffende kalendermaand.')
clausule('3.5.', 'De berekening van de commissie vindt plaats op basis van de gegevens in het platform en/of de betaalomgeving, waartoe Miller Creative gedurende de looptijd toegang en inzicht behoudt voor technische ondersteuning en controle van de commissie. Strictly Hospitality hoeft geen uitgebreide specificatie te verstrekken, behoudens een beknopte betalingsbevestiging en redelijke toelichting op verzoek.')
clausule('3.6.', 'Per verwerkte fooi wordt een vergoeding van € 0,50 ingehouden of in rekening gebracht ten behoeve van TipDirect.be plus € 0,31 aan transactiekosten voor Mollie. Wijzigingen in deze bedragen worden vooraf tussen Partijen afgestemd.')

// ── Artikel 4 ─────────────────────────────────────────────────────────────────
kop('Artikel 4 — Technische ondersteuning, onderhoud en updates')
clausule('4.1.', 'Miller Creative blijft gedurende de looptijd op de achtergrond actief als technische ondersteuner van TipDirect.be.')
clausule('4.2.', 'De technische ondersteuning door Miller Creative omvat het in redelijkheid ondersteunen bij het beschikbaar houden van het Systeem, het beoordelen en herstellen van technische fouten, het uitvoeren of begeleiden van noodzakelijke beveiligingsupdates, het adviseren over technische verbeteringen en het voorbereiden en uitvoeren van de periodieke technische overdracht zoals omschreven in artikel 6A, voor zover Miller Creative wijzigingen of updates aan TipDirect.be uitvoert.')
clausule('4.3.', 'Miller Creative voert deze werkzaamheden uit als tegenprestatie voor de afspraken in artikel 3.1 en artikel 3.3. Strictly Hospitality blijft als eigenaar verantwoordelijk voor de commerciële exploitatie, operationele keuzes en het gebruik van TipDirect.be in België.')
clausule('4.4.', 'Niet onder reguliere technische ondersteuning vallen ingrijpende maatwerkontwikkelingen, nieuwe functionaliteiten, koppelingen met andere systemen, aanpassingen voor specifieke klanten of werkzaamheden die voortvloeien uit wijzigingen in wet- en regelgeving, tenzij Partijen daarover schriftelijk aanvullende afspraken maken.')
clausule('4.5.', 'De Back-end toegang van Miller Creative is beperkt tot wat redelijkerwijs noodzakelijk is voor technische ondersteuning, onderhoud, updates, continuïteit en controle van de commissie. Miller Creative zal deze toegang niet gebruiken voor zelfstandige commerciële exploitatie van TipDirect.be in België.')

// ── Artikel 5 ─────────────────────────────────────────────────────────────────
kop('Artikel 5 — Exploitatie door Strictly Hospitality')
clausule('5.1.', 'Strictly Hospitality is als eigenaar verantwoordelijk voor de commerciële introductie, verkoop, marketing en exploitatie van TipDirect.be in België.')
clausule('5.2.', 'Strictly Hospitality zal TipDirect.be op professionele wijze aanbieden aan horecazaken, bedienend personeel en overige relevante marktpartijen.')
clausule('5.3.', 'Strictly Hospitality is verantwoordelijk voor lokale klantcontacten, onboarding, eerstelijnsondersteuning, commerciële afspraken met Belgische klanten en naleving van lokale operationele verplichtingen, tenzij Partijen schriftelijk anders overeenkomen.')
clausule('5.4.', 'Strictly Hospitality kan als eigenaar commerciële en operationele beslissingen nemen over TipDirect.be. Wijzigingen aan de kernfunctionaliteit, betaalflow, beveiliging of technische inrichting die gevolgen kunnen hebben voor de technische ondersteuning door Miller Creative of de berekening van de commissie worden vooraf tussen Partijen afgestemd.')

// ── Artikel 6 ─────────────────────────────────────────────────────────────────
kop('Artikel 6 — Eigendom, broncodes, domeinnaam en intellectueel eigendom')
clausule('6.1.', 'Na volledige betaling van de upfront koopprijs als bedoeld in artikel 3.1 worden de in Bijlage 1 genoemde eigendomsrechten op TipDirect.be, waaronder de broncodes en de URL/domeinnaam tipdirect.be, aan Strictly Hospitality overgedragen, voor zover deze rechten juridisch en feitelijk overdraagbaar zijn.')
clausule('6.2.', 'Miller Creative zal na ontvangst van de upfront koopprijs alle redelijkerwijs noodzakelijke medewerking verlenen aan de overdracht van de broncodes, technische documentatie, relevante toegangsrechten en de domeinnaam tipdirect.be.')
clausule('6.3.', 'Strictly Hospitality wordt eigenaar van TipDirect.be voor België en mag de naam TipDirect.be, de Belgische uitvoering van het Systeem en de bijbehorende broncodes gebruiken, beheren, exploiteren en doorontwikkelen binnen de grenzen van deze overeenkomst.')
clausule('6.4.', 'Miller Creative behoudt algemene kennis, ervaring, vaardigheden, ideeën, werkwijzen en generieke technische knowhow die niet uitsluitend in TipDirect.be zijn vastgelegd. Dit behoud doet geen afbreuk aan de eigendomsoverdracht van TipDirect.be aan Strictly Hospitality.')
clausule('6.5.', 'Nieuwe functionaliteiten, verbeteringen of uitbreidingen die specifiek voor TipDirect.be in opdracht van Strictly Hospitality worden ontwikkeld, komen toe aan Strictly Hospitality, tenzij Partijen vooraf schriftelijk anders overeenkomen. Generieke verbeteringen of technische kennis die Miller Creative los van TipDirect.be ontwikkelt, blijven bij Miller Creative.')
clausule('6.6.', 'Voor zover in de broncode open source software, standaard componenten of rechten van derden zijn verwerkt, geldt de overdracht onder de voorwaarden waaronder deze onderdelen rechtmatig mogen worden gebruikt en overgedragen.')

// ── Artikel 6A ────────────────────────────────────────────────────────────────
kop('Artikel 6A — Periodieke technische overdracht')
clausule('6A.1.', 'Miller Creative voert gedurende de looptijd van deze overeenkomst eenmaal per kalenderkwartaal een periodieke technische overdracht uit aan Strictly Hospitality van de op dat moment actuele versie van de broncode, technische documentatie en overige technische informatie die betrekking hebben op TipDirect.be.')
clausule('6A.2.', 'Het technisch overdrachtsmateriaal als bedoeld in artikel 6A.1 omvat in ieder geval, voor zover van toepassing en beschikbaar:')
letterItem('a.', 'de bijgewerkte broncode en relevante technische bestanden;', 24)
letterItem('b.', 'configuratiebestanden, voor zover overdraagbaar en niet strijdig met beveiligings- of privacy verplichtingen;', 24)
letterItem('c.', 'release notes of een beknopt overzicht van wijzigingen sinds de vorige overdracht;', 24)
letterItem('d.', 'technische documentatie die nodig is voor beheer, onderhoud, foutanalyse en doorontwikkeling;', 24)
letterItem('e.', 'database wijzigingen, migratie scripts en relevante installatie- of deployment-instructies;', 24)
letterItem('f.', 'informatie over gebruikte koppelingen, afhankelijkheden, software bibliotheken en versies.', 24)
clausule('6A.3.', 'De overdracht vindt plaats uiterlijk binnen tien werkdagen na afloop van ieder kalenderkwartaal, tenzij Partijen schriftelijk een andere termijn overeenkomen.')
clausule('6A.4.', 'De overdracht vindt plaats via een door Partijen overeengekomen veilige methode, zoals een beveiligde bestandsomgeving of andere passende digitale overdrachtswijze.')
clausule('6A.5.', 'Indien in een kalenderkwartaal geen wijzigingen, updates of doorontwikkelingen hebben plaatsgevonden, bevestigt Miller Creative dit schriftelijk aan Strictly Hospitality. In dat geval geldt de meest recent overgedragen versie als actuele versie.')
clausule('6A.6.', 'Miller Creative blijft gerechtigd om toegang tot de Back-end te behouden voor technische ondersteuning, onderhoud, foutanalyse, beveiliging, continuïteit en controle van de commissie, maar deze toegang laat de verplichting tot periodieke overdracht van actuele broncode en technische informatie onverlet.')
clausule('6A.7.', 'Strictly Hospitality behandelt de ontvangen broncode en technische informatie als vertrouwelijke informatie in de zin van artikel 10 van deze overeenkomst en zal deze uitsluitend gebruiken voor eigendom, beheer, exploitatie, onderhoud en doorontwikkeling van TipDirect.be.')

// ── Artikel 7 ─────────────────────────────────────────────────────────────────
kop('Artikel 7 — Payment service provider en transacties')
clausule('7.1.', 'Betalingen binnen TipDirect.be verlopen via Mollie of een andere door Partijen schriftelijk goedgekeurde payment service provider.')
clausule('7.2.', 'Partijen erkennen dat Mollie zelfstandig transactiekosten in rekening kan brengen. Op dit moment bedraagt deze vergoeding volgens de uitgangspunten van Partijen € 0,31 per transactie.')
clausule('7.3.', 'Indien Mollie of een andere payment service provider tarieven, voorwaarden of technische vereisten wijzigt, treden Partijen in overleg over de gevolgen voor de exploitatie, de commissiebetaling en de financiële afspraken.')
clausule('7.4.', 'Strictly Hospitality is verantwoordelijk voor het naleven van alle voorwaarden van de payment service provider voor zover deze betrekking hebben op exploitatie in België.')
clausule('7.5.', 'Partijen richten de betaalomgeving waar mogelijk zo in dat de maandelijkse commissie van 20% aan Miller Creative via Mollie kan worden uitbetaald of administratief inzichtelijk kan worden gemaakt.')

// ── Artikel 8 ─────────────────────────────────────────────────────────────────
kop('Artikel 8 — Looptijd')
clausule('8.1.', 'Deze overeenkomst treedt in werking op [ingangsdatum] en wordt aangegaan voor een periode van vijf jaar.')
clausule('8.2.', 'De verplichtingen met betrekking tot technische ondersteuning, Back-endtoegang, commissiebetaling en periodieke afstemming gelden gedurende de looptijd van deze overeenkomst, tenzij Partijen schriftelijk anders overeenkomen.')
clausule('8.3.', 'De eigendomsoverdracht van TipDirect.be aan Strictly Hospitality wordt door het verstrijken van de looptijd niet automatisch teruggedraaid.')
clausule('8.4.', 'Na afloop van de looptijd eindigt deze overeenkomst van rechtswege, tenzij Partijen uiterlijk drie maanden vóór het einde van de looptijd schriftelijk verlenging overeenkomen.')

// ── Artikel 9 ─────────────────────────────────────────────────────────────────
kop('Artikel 9 — Administratie, Back-end toegang en controle')
clausule('9.1.', 'Miller Creative behoudt gedurende de looptijd toegang tot de Back-end en inzicht in de relevante gegevens en activiteiten op het platform die verband houden met TipDirect.be in België, waaronder transacties, vergoedingen en commissies gegevens, voor zover technisch beschikbaar binnen het Systeem.')
clausule('9.2.', 'De toegang van Miller Creative is bedoeld voor technische ondersteuning, onderhoud, updates, continuïteit, foutanalyse en controle van de verschuldigde commissie. Deze toegang geeft Miller Creative geen eigendomsrecht of commercieel exploitatierecht op TipDirect.be in België.')
clausule('9.3.', 'Omdat Miller Creative deze platforminzage heeft, rust op Strictly Hospitality geen verplichting tot het verstrekken van uitgebreide periodieke rapportages. Strictly Hospitality verstrekt uitsluitend aanvullende toelichting of gegevens voor zover de platforminformatie of betaalinformatie niet toereikend is voor controle van de verschuldigde commissie of voor de financiële administratie van Miller Creative.')
clausule('9.4.', 'Strictly Hospitality bewaart uitsluitend de administratie die redelijkerwijs nodig is voor haar eigen bedrijfsvoering en voor controle van de aan Miller Creative verschuldigde commissie, voor zover deze gegevens niet reeds beschikbaar zijn via het platform, de Back-end of de betaalomgeving.')
clausule('9.5.', 'Indien er concrete aanleiding bestaat om te twijfelen aan de juistheid van de commissiebetaling, kan Miller Creative na voorafgaande schriftelijke aankondiging en tijdens normale kantooruren de relevante administratie laten controleren door een onafhankelijke accountant. Indien blijkt dat Strictly Hospitality meer dan 5% te weinig heeft afgedragen, komen de redelijke kosten van de controle voor rekening van Strictly Hospitality en dient het tekort binnen 14 dagen te worden voldaan.')

// ── Artikel 10 ────────────────────────────────────────────────────────────────
kop('Artikel 10 — Geheimhouding')
clausule('10.1.', 'Partijen verplichten zich tot geheimhouding van alle vertrouwelijke informatie die zij in het kader van deze overeenkomst van elkaar ontvangen.')
clausule('10.2.', 'Onder vertrouwelijke informatie valt in ieder geval technische documentatie, broncode, prijsafspraken, klantgegevens, commerciële strategieën, financiële gegevens, toegangsgegevens en overige bedrijfsgevoelige informatie.')
clausule('10.3.', 'De geheimhoudingsverplichting blijft van kracht gedurende vijf jaar na beëindiging van deze overeenkomst.')

// ── Artikel 11 ────────────────────────────────────────────────────────────────
kop('Artikel 11 — Privacy en gegevensbescherming')
clausule('11.1.', 'Voor zover bij het gebruik van TipDirect.be persoonsgegevens worden verwerkt, zullen Partijen voldoen aan de toepasselijke privacywetgeving, waaronder de Algemene Verordening Gegevensbescherming.')
clausule('11.2.', 'Partijen zullen voorafgaand aan commerciële livegang vaststellen welke Partij optreedt als verwerkingsverantwoordelijke en/of verwerker, en leggen eventuele afspraken vast in een afzonderlijke verwerkersovereenkomst indien dit juridisch vereist is.')
clausule('11.3.', 'Strictly Hospitality is verantwoordelijk voor de juiste informatievoorziening aan Belgische gebruikers en klanten voor zover die informatie betrekking heeft op de exploitatie in België.')
clausule('11.4.', 'Miller Creative verwerkt gegevens waartoe zij via de Back-end toegang heeft uitsluitend voor zover dit noodzakelijk is voor technische ondersteuning, onderhoud, foutanalyse, beveiliging, continuïteit of controle van de commissie, tenzij Partijen schriftelijk anders overeenkomen.')

// ── Artikel 12 ────────────────────────────────────────────────────────────────
kop('Artikel 12 — Garanties')
clausule('12.1.', 'Miller Creative verklaart dat TipDirect.be door Miller Creative is ontwikkeld en dat zij naar haar beste weten bevoegd is om de in deze overeenkomst omschreven rechten, broncodes en domeinnaam aan Strictly Hospitality over te dragen.')
clausule('12.2.', 'Miller Creative garandeert niet dat TipDirect.be te allen tijde foutloos, ononderbroken of volledig vrij van technische storingen zal functioneren.')
clausule('12.3.', 'Strictly Hospitality staat ervoor in dat zij TipDirect.be in België zal exploiteren in overeenstemming met toepasselijke wet- en regelgeving en met de voorwaarden van deze overeenkomst.')
clausule('12.4.', 'Strictly Hospitality aanvaardt dat voor bepaalde onderdelen, zoals betaalproviders, hosting, open source componenten en derde-diensten, voorwaarden van derden kunnen gelden.')

// ── Artikel 13 ────────────────────────────────────────────────────────────────
kop('Artikel 13 — Aansprakelijkheid')
clausule('13.1.', 'Iedere Partij is aansprakelijk voor schade die het gevolg is van een toerekenbare tekortkoming in de nakoming van deze overeenkomst.')
clausule('13.2.', 'De aansprakelijkheid van Miller Creative is beperkt tot het bedrag dat Strictly Hospitality in de twaalf maanden voorafgaand aan de schadeveroorzakende gebeurtenis daadwerkelijk aan Miller Creative heeft betaald, met een maximum van € 20.000, tenzij sprake is van opzet of bewuste roekeloosheid.')
clausule('13.3.', 'Miller Creative is niet aansprakelijk voor indirecte schade, gevolgschade, gederfde winst, gemiste besparingen, reputatieschade, verlies van data of schade door storingen bij Mollie, WERO, Apple Pay, hostingproviders of andere derde partijen.')
clausule('13.4.', 'Strictly Hospitality vrijwaart Miller Creative voor aanspraken van Belgische klanten, gebruikers, horecazaken, bedienend personeel of derden die voortvloeien uit de commerciële exploitatie van TipDirect.be in België, tenzij de aanspraak het rechtstreekse gevolg is van een toerekenbare tekortkoming van Miller Creative.')

// ── Artikel 14 ────────────────────────────────────────────────────────────────
kop('Artikel 14 — Beëindiging')
clausule('14.1.', 'Iedere Partij kan deze overeenkomst met onmiddellijke ingang schriftelijk beëindigen indien de andere Partij:')
letterItem('a.', 'wezenlijk tekortschiet in de nakoming van deze overeenkomst en, na schriftelijke ingebrekestelling, deze tekortkoming niet binnen 30 dagen herstelt;', 24)
letterItem('b.', 'faillissement aanvraagt of failliet wordt verklaard;', 24)
letterItem('c.', 'surseance van betaling aanvraagt;', 24)
letterItem('d.', 'haar onderneming staakt of liquideert;', 24)
letterItem('e.', 'handelt op een wijze die de reputatie of exploitatie van TipDirect.be ernstig schaadt.', 24)
clausule('14.2.', 'Beëindiging laat bestaande betalingsverplichtingen, waaronder de verplichting tot betaling van reeds verschuldigde commissies, onverlet.')
clausule('14.3.', 'Reeds rechtsgeldig overgedragen eigendomsrechten op TipDirect.be, de broncodes en de domeinnaam tipdirect.be blijven na beëindiging bij Strictly Hospitality, tenzij de overeenkomst rechtsgeldig wordt ontbonden en uit de wet of uit een schriftelijke afspraak tussen Partijen anders voortvloeit.')
clausule('14.4.', 'Na beëindiging eindigen de verplichtingen van Miller Creative tot technische ondersteuning en Back-end toegang, behoudens voor zover toegang tijdelijk noodzakelijk is voor een ordentelijke technische of financiële afwikkeling.')
clausule('14.5.', 'Partijen zullen bij beëindiging in redelijkheid meewerken aan een ordentelijke afwikkeling richting bestaande klanten en gebruikers.')

// ── Artikel 15 ────────────────────────────────────────────────────────────────
kop('Artikel 15 — Exclusiviteit')
clausule('15.1.', 'De rechten van Strictly Hospitality voor TipDirect.be in België in het kader van deze overeenkomst zijn exclusief.')
clausule('15.2.', 'Deze exclusiviteit geldt uitsluitend voor het Gebied en gedurende de looptijd van deze overeenkomst, mits Strictly Hospitality haar betalings- en exploitatieverplichtingen volledig nakomt.')
clausule('15.3.', 'Partijen kunnen aanvullende minimumprestaties of commerciële doelstellingen opnemen in Bijlage 2.')

// ── Artikel 16 ────────────────────────────────────────────────────────────────
kop('Artikel 16 — Overdracht aan derden')
clausule('16.1.', 'Strictly Hospitality mag de rechten op TipDirect.be, de broncodes of de domeinnaam tipdirect.be gedurende de looptijd niet overdragen aan een derde zonder voorafgaande schriftelijke mededeling aan Miller Creative en zonder dat de verkrijgende derde de lopende verplichtingen uit deze overeenkomst, waaronder de commissiebetaling en geheimhouding, schriftelijk overneemt. Miller Creative zal redelijke medewerking aan een overdracht niet op onredelijke gronden weigeren.')
clausule('16.2.', 'Miller Creative mag haar rechten en verplichtingen als technische ondersteuner overdragen aan een groepsmaatschappij of rechtsopvolger, mits de continuïteit van de technische ondersteuning redelijkerwijs gewaarborgd blijft.')

// ── Artikel 17 ────────────────────────────────────────────────────────────────
kop('Artikel 17 — Wijzigingen')
clausule('17.1.', 'Wijzigingen van deze overeenkomst zijn uitsluitend geldig indien zij schriftelijk door beide Partijen zijn overeengekomen.')
clausule('17.2.', 'Mondelinge toezeggingen of afspraken binden Partijen uitsluitend indien deze schriftelijk zijn bevestigd door beide Partijen.')

// ── Artikel 18 ────────────────────────────────────────────────────────────────
kop('Artikel 18 — Toepasselijk recht en geschillen')
clausule('18.1.', 'Op deze overeenkomst is Nederlands recht van toepassing.')
clausule('18.2.', 'Geschillen die voortvloeien uit of verband houden met deze overeenkomst worden bij uitsluiting voorgelegd aan de bevoegde rechter van de rechtbank Oost-Brabant, locatie \'s-Hertogenbosch, tenzij Partijen schriftelijk arbitrage of mediation overeenkomen.')

// ── Artikel 19 ────────────────────────────────────────────────────────────────
kop('Artikel 19 — Slotbepalingen')
clausule('19.1.', 'Indien een bepaling uit deze overeenkomst nietig of vernietigbaar blijkt te zijn, blijven de overige bepalingen volledig van kracht. Partijen zullen de betreffende bepaling vervangen door een geldige bepaling die zoveel mogelijk aansluit bij het doel en de strekking van de oorspronkelijke bepaling.')
clausule('19.2.', 'Deze overeenkomst bevat de volledige afspraken tussen Partijen met betrekking tot TipDirect.be in België en vervangt alle eerdere mondelinge en schriftelijke afspraken daarover.')

// ── Ondertekening ─────────────────────────────────────────────────────────────
nieuwePagina()
kop('Ondertekening')
tekst('Aldus overeengekomen en in tweevoud ondertekend te [plaats] op [datum].')
spatie(10)

const kolomBreedte = (W - 20) / 2
const linksX = L + 10
const rechtsX = L + 10 + kolomBreedte

doc.fontSize(10).font('Helvetica-Bold').fillColor(DONKER)
   .text('Miller Creative BV', linksX, y, { width: kolomBreedte - 10, lineBreak: false })
doc.text('Strictly Hospitality BV', rechtsX, y, { width: kolomBreedte - 10, lineBreak: false })
y += 26

function handtekeningVeld(label) {
  doc.fontSize(9).font('Helvetica').fillColor(GRIJS)
     .text(label, linksX, y, { lineBreak: false })
  doc.text(label, rechtsX, y, { lineBreak: false })
  y += 16
  doc.rect(linksX, y, kolomBreedte - 20, 0.5).fill('#9ca3af')
  doc.rect(rechtsX, y, kolomBreedte - 20, 0.5).fill('#9ca3af')
  doc.fillColor(DONKER)
  y += 22
}

handtekeningVeld('Naam:')
handtekeningVeld('Functie:')
y += 14
handtekeningVeld('Handtekening:')

// ── Bijlage 1 ─────────────────────────────────────────────────────────────────
nieuwePagina()
kop('Bijlage 1 — Over te dragen onderdelen en technische toegang', true)
tekst('Deze bijlage vormt een nadere uitwerking van artikel 2 en artikel 6 van de overeenkomst. Voor zover bepalingen in deze bijlage afwijken van de overeenkomst, prevaleert de overeenkomst, tenzij Partijen uitdrukkelijk schriftelijk anders bepalen.')
tekst('Uitgangspunt is dat Strictly Hospitality door de verkoop eigenaar wordt van TipDirect.be, inclusief de broncodes en de URL/domeinnaam tipdirect.be. Miller Creative blijft uitsluitend op de achtergrond actief als technische ondersteuner en behoudt daarvoor Back-endtoegang.')

puntKop('1. Reikwijdte van de overdracht')
tekst('Strictly Hospitality verkrijgt na volledige betaling van de upfront koopprijs het eigendom van TipDirect.be voor België.')
tekst('De overdracht omvat de Belgische uitvoering van het Systeem, de broncodes voor TipDirect.be, de domeinnaam tipdirect.be, de beschikbare technische documentatie en de toegangsrechten die nodig zijn voor eigendom, beheer en exploitatie.')
tekst('Miller Creative behoudt geen zelfstandig commercieel exploitatierecht op TipDirect.be in België, behoudens haar Back-endtoegang voor technische ondersteuning, onderhoud, continuïteit en controle van de commissie.')
tekst('De overdracht ziet niet op exploitatie buiten België en niet op andere systemen, domeinen, handelsnamen of activiteiten van Miller Creative, tenzij Partijen dit uitdrukkelijk schriftelijk overeenkomen.')

puntKop('2. Onderdelen die worden overgedragen of beschikbaar blijven')
tabel(
  [
    { titel: 'Onderdeel', breedte: 105 },
    { titel: 'Status', breedte: 105 },
    { titel: 'Toelichting', breedte: 265 },
  ],
  [
    ['Eigendom TipDirect.be', 'Overdragen aan Strictly Hospitality', 'Strictly Hospitality wordt eigenaar van de Belgische uitvoering van TipDirect.be na volledige betaling van de upfront koopprijs.'],
    ['URL/domeinnaam tipdirect.be', 'Overdragen aan Strictly Hospitality', 'Miller Creative verleent alle redelijke medewerking aan overdracht van domeinregistratie, DNS-beheer en relevante accountgegevens, voor zover deze bij Miller Creative berusten.'],
    ['Broncodes TipDirect.be', 'Overdragen aan Strictly Hospitality', 'De broncodes en relevante technische bestanden worden aan Strictly Hospitality geleverd, voor zover aanwezig en overdraagbaar. Rechten of licenties van derden blijven onder hun eigen voorwaarden vallen.'],
    ['QR-codefunctionaliteit', 'Inbegrepen', 'Gebruik en beheer van de bestaande QR-functionaliteit voor het ontvangen van digitale fooien in België.'],
    ['Beheeromgeving / Back-end', 'Eigendom en exploitatie bij Strictly Hospitality; technische toegang voor Miller Creative', 'Strictly Hospitality is eigenaar/gebruiker voor België. Miller Creative behoudt noodzakelijke supporttoegang voor onderhoud, foutanalyse, updates, continuïteit en controle van de commissie.'],
    ['Platformgegevens België', 'In beheer van Strictly Hospitality', 'Miller Creative heeft inzage voor technische ondersteuning en controle van de commissie, voor zover toegestaan onder privacywetgeving en noodzakelijk voor de overeenkomst.'],
    ['Betaalflow en Mollie-koppeling', 'Inbegrepen / nader technisch in te richten', 'Partijen richten de betaalomgeving zo in dat transacties, kosten en de maandelijkse commissie van 20% inzichtelijk zijn en waar mogelijk via Mollie kunnen worden uitbetaald.'],
    ['Technische documentatie', 'Inbegrepen voor zover beschikbaar', 'Documentatie die redelijkerwijs nodig is voor beheer, overdracht, support en doorontwikkeling van TipDirect.be.'],
    ['Verkoop- en klantdocumentatie', 'Inbegrepen voor België', 'Beschikbare algemene documentatie mag door Strictly Hospitality worden gebruikt en aangepast voor de Belgische markt.'],
    ['Hostingomgeving', 'Nader praktisch in te richten', 'Hosting kan worden voortgezet in de bestaande omgeving of worden gemigreerd naar een omgeving van Strictly Hospitality. Partijen stemmen technische migratie en continuïteit schriftelijk af.'],
    ['Naam TipDirect.be', 'Inbegrepen voor België', 'Strictly Hospitality mag TipDirect.be gebruiken voor Belgische exploitatie. Gebruik buiten België of verwarring met andere activiteiten van Miller Creative is niet toegestaan zonder schriftelijke toestemming.'],
    ['Generieke kennis en knowhow Miller Creative', 'Niet overdragen', 'Algemene ideeën, ervaring, werkwijzen en technische knowhow die niet uitsluitend in TipDirect.be zijn vastgelegd blijven bij Miller Creative.'],
    ['Nieuwe functionaliteiten', 'Afhankelijk van opdracht', 'Specifiek voor TipDirect.be ontwikkelde functionaliteiten komen toe aan Strictly Hospitality, tenzij Partijen schriftelijk anders overeenkomen. Generieke verbeteringen blijven bij de ontwikkelende Partij.'],
    ['Periodieke technische overdracht', 'Kwartaalgewijs overdragen', 'Miller Creative draagt elk kalenderkwartaal de actuele broncode, technische documentatie en technische informatie over aan Strictly Hospitality overeenkomstig artikel 6A.'],
    ['Technisch overdrachtsmateriaal', 'Beschikbaar stellen aan Strictly Hospitality', 'Broncode, scripts, configuratiebestanden, release notes, databasewijzigingen, migratiescripts, build- en deploymentinstructies, technische documentatie en overige relevante technische informatie.'],
  ]
)

puntKop('3. Levering en overdrachtsmoment')
tekst('De overdracht van eigendom vindt plaats na volledige betaling van de upfront koopprijs, tenzij Partijen schriftelijk een ander overdrachtsmoment overeenkomen.')
tekst('De levering van de broncodes, toegangsrechten, technische documentatie en domeingegevens vindt plaats binnen een redelijke termijn na betaling, bij voorkeur binnen 10 werkdagen.')
tekst('Partijen leggen praktische overdrachtsdetails, zoals hosting, repository-toegang, domeinregistrar, DNS-instellingen en beheeraccounts, schriftelijk vast in een overdrachtsprotocol of opleverlijst.')

puntKop('4. Back-endtoegang Miller Creative')
tekst('Miller Creative behoudt gedurende de looptijd noodzakelijke Back-end toegang voor technische ondersteuning, onderhoud, foutanalyse, beveiligingsupdates, continuïteit en controle van de commissie.')
tekst('Miller Creative gebruikt deze toegang uitsluitend voor de uitvoering van haar technische en financiële controletaken onder de overeenkomst.')
tekst('Miller Creative mag zonder toestemming van Strictly Hospitality geen commerciële klantcontacten, prijswijzigingen of operationele wijzigingen doorvoeren in België, tenzij dit noodzakelijk is om een acute storing of beveiligingskwestie te verhelpen.')

puntKop('5. Open punten ter bevestiging door Partijen')
item('Registrar en huidige houder van tipdirect.be: [CSN media].')
item('Moment en wijze van domeinoverdracht: [invullen].')
item('Overdrachtsmethode broncode.')
item('Hosting na overdracht: [bestaande hosting / hosting Strictly Hospitality / nader te bepalen].')
item('Mollie-account en inrichting commissiebetalingen: [op naam van Strictly Hospitality / gekoppelde uitbetaling aan Miller Creative].')
item('Exacte inrichting van gebruikersrollen en Back-end toegang.')
item('Wijze van periodieke technische overdracht: beveiligde bestandsomgeving.')
item('Contactpersonen voor technische overdracht: [invullen].')
item('Frequentie van technische overdracht: eenmaal per kalenderkwartaal, tenzij Partijen schriftelijk anders overeenkomen.')
item('Bevestiging van overdracht en release notes: [invullen / opnemen in opleverlijst].')

// ── Bijlage 2 ─────────────────────────────────────────────────────────────────
nieuwePagina()
kop('Bijlage 2 — Commerciële afspraken, commissie en support', true)
tekst('Deze bijlage vormt een nadere uitwerking van artikel 3, artikel 4, artikel 5, artikel 9 en artikel 15 van de overeenkomst.')
tekst('Uitgangspunt is dat Strictly Hospitality eigenaar en commerciële exploitant is van TipDirect.be in België. Miller Creative ondersteunt op de achtergrond als technische partij.')

puntKop('1. Commerciële rolverdeling')
tekst('Strictly Hospitality is als eigenaar verantwoordelijk voor de commerciële introductie, verkoop, marketing, onboarding en eerstelijns klantcontacten in België.')
tekst('Miller Creative is verantwoordelijk voor technische ondersteuning op de achtergrond, voor zover omschreven in de overeenkomst.')
tekst('Strictly Hospitality voert commerciële gesprekken met Belgische horecazaken en gebruikers. Miller Creative ondersteunt uitsluitend waar redelijkerwijs nodig bij technische uitleg, implementatievragen, storingen of onderhoud.')

puntKop('2. Financiële afspraken en maandelijkse commissie via Mollie')
tekst('De eenmalige upfront koopprijs bedraagt € 20.000 exclusief btw, te voldoen conform artikel 3.1 en 3.2 van de overeenkomst.')
tekst('Strictly Hospitality draagt gedurende de looptijd 20% van de Netto-opbrengst af aan Miller Creative.')
tekst('De maandelijkse commissie wordt bij voorkeur automatisch of administratief via Mollie aan Miller Creative uitbetaald, voor zover de technische en contractuele inrichting van Mollie dit mogelijk maakt.')
tekst('Indien Mollie geen rechtstreekse maandelijkse uitbetaling aan Miller Creative ondersteunt, betaalt Strictly Hospitality de commissie maandelijks per bank binnen 15 dagen na afloop van de betreffende kalendermaand.')
tekst('De berekening van de maandelijkse commissie vindt plaats op basis van de gegevens in het platform, de Back-end en/of de betaalomgeving. Omdat Miller Creative daarin toegang en inzicht behoudt, hoeft Strictly Hospitality geen uitgebreide maandrapportage te verstrekken.')
tekst('Strictly Hospitality verstrekt wel een beknopte betalingsbevestiging en redelijke toelichting indien de platforminformatie, betaalinformatie of administratie onvoldoende duidelijk is voor controle van de commissie.')
tekst('De huidige uitgangspunten zijn € 0,50 per ontvangen fooi ten behoeve van TipDirect.be en € 0,31 transactiekosten voor Mollie. Wijzigingen worden vooraf tussen Partijen afgestemd.')

puntKop('3. Minimumprestaties en commerciële doelstellingen')
tekst('Omdat Strictly Hospitality eigenaar wordt van TipDirect.be en exclusieve rechten voor België verkrijgt, spreken Partijen commerciële streefdoelen af. Deze streefdoelen zijn bedoeld om de samenwerking actief te houden en vormen geen automatische voorwaarde voor de eigendomsoverdracht, tenzij Partijen dit uitdrukkelijk schriftelijk anders overeenkomen.')
tabel(
  [
    { titel: 'Periode', breedte: 90 },
    { titel: 'Voorgestelde doelstelling', breedte: 175 },
    { titel: 'Toelichting', breedte: 210 },
  ],
  [
    ['Eerste 6 maanden', 'Pilotfase met minimaal 5 aangesloten horecalocaties', 'Gericht op testen, lokale validatie, feedback en optimalisatie van onboarding.'],
    ['Jaar 1', 'Minimaal 25 aangesloten horecalocaties of een aantoonbare actieve salespipeline van vergelijkbare omvang', 'Een horecalocatie geldt als aangesloten wanneer deze is ingericht in het platform en operationeel QR-codes kan gebruiken.'],
    ['Jaar 2', 'Minimaal 60 aangesloten horecalocaties', 'Partijen evalueren na jaar 2 of bijstelling nodig is op basis van marktomstandigheden.'],
    ['Jaar 3 t/m 5', 'Jaarlijkse groei van minimaal 25% in actieve horecalocaties of Netto-opbrengst', 'Een actieve horecalocatie is een locatie met ten minste één transactie in de voorafgaande 60 dagen.'],
  ]
)
tekst('Indien Strictly Hospitality de commerciële doelstellingen niet haalt, leidt dit niet automatisch tot beëindiging van de overeenkomst of terugval van eigendom. Partijen treden dan in overleg over bijstelling van de commerciële aanpak, aanvullende ondersteuning of andere redelijke maatregelen.')

puntKop('4. Marketing, merkgebruik en communicatie')
tekst('Strictly Hospitality mag TipDirect.be in België promoten via eigen verkoopkanalen, presentaties, brochures, e-mail, social media en klantgesprekken.')
tekst('Gebruik van de naam TipDirect.be, logo\'s, huisstijl en publieke uitingen vindt plaats op professionele wijze.')
tekst('Strictly Hospitality zorgt voor Belgische vertalingen, lokale commerciële teksten en klantcommunicatie voor zover dat nodig is voor exploitatie in België.')
tekst('Belangrijke publieke communicatie over de technische rol van Miller Creative wordt vooraf met Miller Creative afgestemd.')

puntKop('5. Support en operationele afspraken')
tekst('Strictly Hospitality verzorgt eerstelijns support richting Belgische horecazaken, bedienend personeel en overige lokale gebruikers.')
tekst('Miller Creative verzorgt tweedelijns technische ondersteuning voor problemen die verband houden met het Systeem zelf.')
tekst('Urgente technische storingen worden door Strictly Hospitality zo spoedig mogelijk gemeld aan Miller Creative, inclusief beschikbare foutmeldingen, klantgegevens, screenshots of transactiereferenties.')
tekst('Partijen stemmen periodiek af over platformgebruik, technische werking, klantfeedback, eventuele bugs, beveiligingsupdates en gewenste doorontwikkeling.')

puntKop('6. Back-endtoegang en periodieke afstemming')
tekst('Miller Creative behoudt Back-endtoegang voor technische ondersteuning, continuïteit en controle van de commissie.')
tekst('Van Strictly Hospitality wordt geen uitgebreide periodieke rapportage verlangd zolang de platformgegevens en betaalinformatie toereikend zijn voor controle van transacties, vergoedingen en commissies.')
tekst('Partijen plannen bij voorkeur eenmaal per kwartaal een kort overleg over commerciële voortgang, technische werking, klantfeedback, commissiebetaling via Mollie en eventuele wijzigingen in tarieven of processen.')

puntKop('7. Tarieven en prijswijzigingen')
tekst('Strictly Hospitality mag als eigenaar prijsvoorstellen en commerciële voorwaarden voor Belgische klanten bepalen, mits wijzigingen die gevolgen hebben voor de commissie aan Miller Creative vooraf schriftelijk met Miller Creative worden afgestemd.')
tekst('Wijzigingen in kosten of voorwaarden van Mollie, WERO, Apple Pay of andere derde partijen worden zo spoedig mogelijk tussen Partijen besproken.')
tekst('Partijen streven ernaar prijswijzigingen richting Belgische klanten tijdig, duidelijk en professioneel te communiceren.')

puntKop('8. Belgische klanten en leads')
tekst('Nieuwe Belgische klanten die tijdens de looptijd worden aangesloten, vallen binnen de commerciële exploitatie van Strictly Hospitality, met behoud van de financiële commissie aan Miller Creative.')
tekst('Leads of klantvragen uit België die rechtstreeks bij Miller Creative binnenkomen, worden in beginsel doorgeleid naar Strictly Hospitality, tenzij Partijen anders overeenkomen.')
tekst('Klanten buiten België vallen niet onder het exclusieve recht van Strictly Hospitality, tenzij Partijen dit schriftelijk overeenkomen.')

puntKop('9. Evaluatie')
tekst('Partijen evalueren de samenwerking na de pilotfase en vervolgens ten minste jaarlijks.')
tekst('Tijdens de evaluatie bespreken Partijen in ieder geval de commerciële resultaten, actieve klanten, technische werking, klanttevredenheid, tariefstructuur, commissiebetaling via Mollie en eventuele gewenste aanpassingen in de samenwerking.')
tekst('Aanpassingen van commerciële doelstellingen, tarieven, support afspraken of commissiebetalingen zijn uitsluitend geldig indien zij schriftelijk door beide Partijen worden bevestigd.')

puntKop('10. Periodieke technische overdracht en technische continuïteit')
tekst('Partijen voeren de periodieke technische overdracht uit zoals omschreven in artikel 6A van de overeenkomst. Deze overdracht is bedoeld om te waarborgen dat Strictly Hospitality als eigenaar steeds beschikt over de actuele broncode en technische informatie die redelijkerwijs nodig is om TipDirect.be te beheren, onderhouden en voortzetten.')
tekst('Het technisch overdrachtsmateriaal bevat ten minste de onderdelen zoals omschreven in artikel 1.10 en artikel 6A, voor zover van toepassing en beschikbaar. Partijen stemmen praktisch af via welke veilige overdrachtsmethode dit materiaal wordt geleverd.')
tekst('Partijen bespreken tijdens de periodieke afstemming of het technisch overdrachtsmateriaal actueel en volledig is, of er nieuwe releases of wijzigingen zijn geweest en of aanvullende documentatie, toegangsgegevens of instructies moeten worden overgedragen.')
noot('De periodieke technische overdracht geldt als praktische continuïteitsmaatregel en vervangt de eerder overwogen escrowconstructie, tenzij Partijen later uitdrukkelijk schriftelijk alsnog een afzonderlijke escrowregeling overeenkomen.')

// ── Footer (laatste pagina) ──────────────────────────────────────────────────
ruimteVoor(30)
spatie(20)
doc.rect(L, y, W, 0.5).fill('#e5e7eb')
spatie(8)
doc.fontSize(8).font('Helvetica').fillColor(GRIJS)
   .text(
     'TipDirect.be  |  Concept — vertrouwelijk  |  ' + new Date().toLocaleDateString('nl-NL', {
       day: 'numeric', month: 'long', year: 'numeric'
     }),
     L, y, { width: W, align: 'center' }
   )

doc.end()
console.log('PDF aangemaakt: ' + outputPath)
