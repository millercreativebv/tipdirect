import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'smtp.hostnet.nl',
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false, // STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const FROM = `TipDirect <${process.env.SMTP_USER ?? 'noreply@tipdirect.be'}>`
const ADMIN = process.env.ADMIN_EMAIL ?? 'info@tipdirect.be'
const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://tipdirect.be'
const MERK = '#A1105A'

// ─── HTML-wrapper voor alle mails ────────────────────────────────────────────
function mailHtml(inhoud: string): string {
  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TipDirect</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:${MERK};border-radius:14px 14px 0 0;padding:28px 36px;text-align:center;">
            <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">TipDirect</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:36px;border-radius:0 0 14px 14px;">
            ${inhoud}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 0;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.8;">
              Miller Creative BV · Deursenseweg 12, 5351 NN Berghem<br>
              <a href="${BASE}" style="color:#9ca3af;">${BASE}</a> ·
              <a href="mailto:info@tipdirect.be" style="color:#9ca3af;">info@tipdirect.be</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Helper: knop ────────────────────────────────────────────────────────────
function knop(url: string, tekst: string): string {
  return `<div style="text-align:center;margin:28px 0;">
    <a href="${url}" style="display:inline-block;background:${MERK};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;">${tekst}</a>
  </div>`
}

// ─── Helper: info-regel ──────────────────────────────────────────────────────
function infoRegel(label: string, waarde: string): string {
  return `<tr>
    <td style="padding:8px 0;font-size:13px;color:#6b7280;width:140px;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;font-size:13px;color:#111827;font-weight:600;">${waarde}</td>
  </tr>`
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. WELKOMSTMAIL BIJ ABONNEMENT ACTIEF
// ─────────────────────────────────────────────────────────────────────────────
export async function sendAbonnementActiefMail(params: {
  email: string
  naam: string
  accountType: 'bedrijf' | 'individueel'
}) {
  const { email, naam, accountType } = params
  const isBedrijf = accountType === 'bedrijf'

  const inhoud = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111827;">Welkom bij TipDirect, ${naam}! 🎉</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.7;">
      Je ${isBedrijf ? 'bedrijfsabonnement' : 'abonnement'} is nu actief.
      Je ontvangt binnenkort een setje QR-kaarten op het door jou opgegeven adres.
    </p>

    <div style="background:#fdf5f9;border:1px solid #e8c0d4;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:${MERK};letter-spacing:0.08em;text-transform:uppercase;">Volgende stappen</p>
      ${isBedrijf ? `
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.8;">
        1. Koppel je Mollie-account via het dashboard<br>
        2. Voeg je medewerkers toe<br>
        3. Deel de QR-kaarten met je team zodra ze arriveren
      </p>` : `
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.8;">
        1. Koppel je Mollie-account via het dashboard<br>
        2. Je QR-code is dan direct actief<br>
        3. Je kaarten zijn onderweg
      </p>`}
    </div>

    ${knop(`${BASE}/dashboard`, 'Naar mijn dashboard')}

    <p style="margin:24px 0 0;font-size:13px;color:#6b7280;text-align:center;">
      Vragen? Mail ons op <a href="mailto:info@tipdirect.be" style="color:${MERK};">info@tipdirect.be</a>
    </p>
  `

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Welkom bij TipDirect — je account is actief!`,
    html: mailHtml(inhoud),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. WACHTWOORD RESET MAIL
// ─────────────────────────────────────────────────────────────────────────────
export async function sendWachtwoordResetMail(params: {
  email: string
  resetLink: string
}) {
  const { email, resetLink } = params

  const inhoud = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111827;">Wachtwoord opnieuw instellen</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.7;">
      We hebben een verzoek ontvangen om het wachtwoord van je TipDirect-account te resetten.
      Klik op de knop hieronder om een nieuw wachtwoord in te stellen.
    </p>

    ${knop(resetLink, 'Nieuw wachtwoord instellen')}

    <p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-align:center;">
      De link is 1 uur geldig.
    </p>
    <p style="margin:0;font-size:13px;color:#6b7280;text-align:center;">
      Heb je dit niet zelf aangevraagd? Dan kun je deze mail veilig negeren — je wachtwoord wordt niet gewijzigd.
    </p>
  `

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Wachtwoord resetten — TipDirect',
    html: mailHtml(inhoud),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. REGISTRATIEBEVESTIGING BIJ NIEUW ACCOUNT (direct na profiel opslaan)
// ─────────────────────────────────────────────────────────────────────────────
export async function sendRegistratieBevestigingMail(params: {
  email: string
  naam: string
  gebruikersnaam: string
  accountType: 'individueel' | 'bedrijf'
}) {
  const { email, naam, gebruikersnaam, accountType } = params
  const isIndividueel = accountType === 'individueel'

  const inhoud = isIndividueel ? `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111827;">Welkom bij TipDirect, ${naam}! 👋</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.7;">
      Je account is aangemaakt. Je persoonlijke betaalpagina staat al live op:
    </p>

    <div style="text-align:center;margin-bottom:24px;">
      <a href="${BASE}/${gebruikersnaam}" style="display:inline-block;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:10px;padding:12px 24px;font-family:monospace;font-size:15px;color:#A1105A;text-decoration:none;font-weight:700;">
        tipdirect.be/${gebruikersnaam}
      </a>
    </div>

    <div style="background:#fdf5f9;border:1px solid #e8c0d4;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:${MERK};letter-spacing:0.08em;text-transform:uppercase;">Volgende stap — koppel je Mollie-account</p>
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.8;">
        Ga naar je dashboard en koppel je Mollie-account. Zodra dat gedaan is, is je QR-code actief en kunnen gasten je een fooi geven.
      </p>
    </div>

    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:0.08em;text-transform:uppercase;">Zo werkt je abonnement</p>
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.8;">
        Je betaalt <strong>niets vooraf</strong>. De eerste fooien die je ontvangt gaan naar je abonnement (€25). Zodra dat bedrag bereikt is, gaan alle volgende tips direct naar jou — min alleen de Mollie-transactiekost van €0,32.<br><br>
        Je QR-kaarten worden naar jouw adres verstuurd zodra je abonnement voldaan is.
      </p>
    </div>

    ${knop(`${BASE}/dashboard`, 'Naar mijn dashboard')}

    <p style="margin:24px 0 0;font-size:13px;color:#6b7280;text-align:center;">
      Vragen? Mail ons op <a href="mailto:info@tipdirect.be" style="color:${MERK};">info@tipdirect.be</a>
    </p>
  ` : `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111827;">Bijna klaar, ${naam}! 🏁</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.7;">
      Je bedrijfsgegevens zijn opgeslagen. Er is nog één stap nodig om je account te activeren: de betaling.
    </p>

    <div style="background:#fdf5f9;border:1px solid #e8c0d4;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:${MERK};letter-spacing:0.08em;text-transform:uppercase;">Wat gebeurt er na betaling?</p>
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.8;">
        1. Je account wordt direct geactiveerd<br>
        2. Je ontvangt een bevestiging per mail<br>
        3. Je QR-kaarten voor je team worden verstuurd<br>
        4. Koppel je Mollie-account via het dashboard om fooien te ontvangen
      </p>
    </div>

    ${knop(`${BASE}/dashboard`, 'Naar mijn dashboard')}

    <p style="margin:24px 0 0;font-size:13px;color:#6b7280;text-align:center;">
      Vragen? Mail ons op <a href="mailto:info@tipdirect.be" style="color:${MERK};">info@tipdirect.be</a>
    </p>
  `

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: isIndividueel
      ? `Je TipDirect-account staat klaar — koppel nu Mollie`
      : `Één stap nog — voltooi je TipDirect-account`,
    html: mailHtml(inhoud),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ADMIN-NOTIFICATIE BIJ NIEUWE REGISTRATIE
// ─────────────────────────────────────────────────────────────────────────────
export async function sendAdminNieuweRegistratieNotificatie(params: {
  naam: string
  email: string
  accountType: 'individueel' | 'bedrijf'
  telefoon: string | null
  straat: string | null
  postcode: string | null
  stad: string | null
  land: string | null
  iban: string | null
  ibanNaam: string | null
  btwNummer: string | null
  kvk: string | null
  gebruikersnaam: string
}) {
  const { naam, email, accountType, telefoon, straat, postcode, stad, land, iban, ibanNaam, btwNummer, kvk, gebruikersnaam } = params

  const adresRegel = [straat, `${postcode ?? ''} ${stad ?? ''}`.trim(), land]
    .filter(Boolean)
    .join(', ')

  const isIndividueel = accountType === 'individueel'

  const inhoud = `
    <h1 style="margin:0 0 4px;font-size:20px;font-weight:800;color:#111827;">🆕 Nieuwe registratie</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">
      ${isIndividueel
        ? 'Individueel account aangemaakt. Kaarten worden verstuurd zodra abonnement via fooien voldaan is.'
        : 'Bedrijfsaccount aangemaakt. Wacht op betaling — daarna kaartorder aanmaken.'}
    </p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#15803d;letter-spacing:0.08em;text-transform:uppercase;">Accountgegevens</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRegel('Naam', naam)}
        ${infoRegel('Type', isIndividueel ? 'Individueel' : 'Bedrijf')}
        ${infoRegel('Pagina', `tipdirect.be/${gebruikersnaam}`)}
        ${infoRegel('Status', isIndividueel ? 'Actief — wacht op Mollie-koppeling' : 'Wacht op betaling (€75)')}
      </table>
    </div>

    <div style="background:#f8faff;border:1px solid #e5e9f5;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:0.08em;text-transform:uppercase;">Contactgegevens</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRegel('E-mail', email)}
        ${telefoon ? infoRegel('Telefoon', telefoon) : ''}
        ${adresRegel ? infoRegel('Adres', adresRegel) : infoRegel('Adres', '⚠️ Niet ingevuld')}
      </table>
    </div>

    ${isIndividueel && iban ? `
    <div style="background:#f8faff;border:1px solid #e5e9f5;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:0.08em;text-transform:uppercase;">Bankgegevens (SEPA-incasso)</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRegel('IBAN', iban)}
        ${ibanNaam ? infoRegel('T.n.v.', ibanNaam) : ''}
      </table>
    </div>` : ''}

    ${btwNummer || kvk ? `
    <div style="background:#f8faff;border:1px solid #e5e9f5;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:0.08em;text-transform:uppercase;">Fiscaal</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${kvk ? infoRegel('KBO-nummer', kvk) : ''}
        ${btwNummer ? infoRegel('BTW-nummer', btwNummer) : ''}
      </table>
    </div>` : ''}

    ${knop(`${BASE}/admin`, 'Naar admin dashboard')}
  `

  await transporter.sendMail({
    from: FROM,
    to: ADMIN,
    subject: `🆕 Nieuwe registratie: ${naam} (${isIndividueel ? 'individueel' : 'bedrijf'})`,
    html: mailHtml(inhoud),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ADMIN-NOTIFICATIE BIJ NIEUWE KAARTORDER (inclusief verzendadres)
// ─────────────────────────────────────────────────────────────────────────────
export async function sendAdminKaartorderNotificatie(params: {
  setId: string | null
  accountType: string
  naam: string
  email: string
  straat: string | null
  postcode: string | null
  stad: string | null
  land: string | null
  aantalKaarten: number
  heeftVoorraad: boolean
  orderType?: 'inclusief' | 'bijbestelling'
  codes?: string[]
}) {
  const { setId, accountType, naam, email, straat, postcode, stad, land, aantalKaarten, heeftVoorraad, orderType = 'inclusief', codes = [] } = params

  const isBijbestelling = orderType === 'bijbestelling'
  const adresRegel = [straat, `${postcode ?? ''} ${stad ?? ''}`.trim(), land]
    .filter(Boolean)
    .join(', ')

  const setLabel = setId
    ? `<span style="display:inline-block;background:${MERK};color:#fff;font-weight:700;font-size:16px;padding:6px 16px;border-radius:8px;letter-spacing:1px;">${setId}</span>`
    : `<span style="color:#6b7280;font-style:italic;">${isBijbestelling ? 'Handmatig te verwerken' : 'Geen voorraad — staat op wacht'}</span>`

  // Tabel met codes en NFC/QR-URLs voor de partner
  const codesTabel = codes.length > 0 ? `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:0.08em;text-transform:uppercase;">NFC / QR codes voor de kaarten</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td style="font-size:11px;font-weight:700;color:#6b7280;padding:4px 8px 8px 0;border-bottom:1px solid #d1fae5;">Code</td>
          <td style="font-size:11px;font-weight:700;color:#6b7280;padding:4px 0 8px 0;border-bottom:1px solid #d1fae5;">URL (NFC programmeren / QR genereren)</td>
        </tr>
        ${codes.map(c => `
        <tr>
          <td style="font-size:13px;font-family:monospace;font-weight:700;color:#111827;padding:8px 8px 8px 0;border-bottom:1px solid #f0fdf4;">${c}</td>
          <td style="font-size:12px;font-family:monospace;color:#047857;padding:8px 0;border-bottom:1px solid #f0fdf4;">${BASE}/c/${c}</td>
        </tr>`).join('')}
      </table>
    </div>
  ` : ''

  const inhoud = `
    <h1 style="margin:0 0 4px;font-size:20px;font-weight:800;color:#111827;">
      ${isBijbestelling ? '🔄 Bijbestelling kaarten' : '📦 Nieuwe kaartorder'}
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">
      ${isBijbestelling
        ? `Klant vraagt ${aantalKaarten} extra kaarten aan. Verstuur naar onderstaand adres.`
        : heeftVoorraad
          ? `Stuur <strong>${setId}</strong> naar onderstaand adres.`
          : 'Geen voorraad beschikbaar — bestel bij de fabrikant.'}
    </p>

    <div style="background:#f8faff;border:1px solid #e5e9f5;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:0.08em;text-transform:uppercase;">Te versturen</p>
      <div style="text-align:center;margin-bottom:12px;">${setLabel}</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRegel('Type', accountType === 'bedrijf' ? `Bedrijf (${aantalKaarten} kaarten)` : `Individueel (${aantalKaarten} kaarten)`)}
        ${infoRegel('Soort', isBijbestelling ? 'Bijbestelling' : 'Inclusief bij abonnement')}
      </table>
    </div>

    <div style="background:#f8faff;border:1px solid #e5e9f5;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:0.08em;text-transform:uppercase;">Verzendadres</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRegel('Naam', naam)}
        ${adresRegel ? infoRegel('Adres', adresRegel) : infoRegel('Adres', '⚠️ Niet ingevuld')}
        ${infoRegel('E-mail', email)}
      </table>
    </div>

    ${codesTabel}

    ${knop(`${BASE}/admin`, 'Naar admin dashboard')}
  `

  await transporter.sendMail({
    from: FROM,
    to: ADMIN,
    subject: isBijbestelling
      ? `🔄 Bijbestelling: ${aantalKaarten} kaarten voor ${naam}`
      : heeftVoorraad
        ? `📦 Kaartorder: stuur ${setId} naar ${naam}`
        : `⚠️ Kaartorder: geen voorraad voor ${naam}`,
    html: mailHtml(inhoud),
  })
}
