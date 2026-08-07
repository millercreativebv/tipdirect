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
      ${isBedrijf
        ? 'Je ontvangt binnenkort een setje QR-kaarten op het door jou opgegeven adres.'
        : 'Je QR-kaarten worden verstuurd zodra je abonnement is voldaan via ontvangen fooien.'}
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
// 2. ADMIN-NOTIFICATIE BIJ NIEUWE KAARTORDER (inclusief verzendadres)
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
}) {
  const { setId, accountType, naam, email, straat, postcode, stad, land, aantalKaarten, heeftVoorraad } = params

  const adresRegel = [straat, `${postcode ?? ''} ${stad ?? ''}`.trim(), land]
    .filter(Boolean)
    .join(', ')

  const setLabel = setId
    ? `<span style="display:inline-block;background:${MERK};color:#fff;font-weight:700;font-size:16px;padding:6px 16px;border-radius:8px;letter-spacing:1px;">${setId}</span>`
    : `<span style="color:#6b7280;font-style:italic;">Geen voorraad — staat op wacht</span>`

  const inhoud = `
    <h1 style="margin:0 0 4px;font-size:20px;font-weight:800;color:#111827;">📦 Nieuwe kaartorder</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">
      ${heeftVoorraad ? `Stuur <strong>${setId}</strong> naar onderstaand adres.` : 'Geen voorraad beschikbaar — bestel bij de fabrikant.'}
    </p>

    <div style="background:#f8faff;border:1px solid #e5e9f5;border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:0.08em;text-transform:uppercase;">Te versturen</p>
      <div style="text-align:center;margin-bottom:12px;">${setLabel}</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${infoRegel('Type', accountType === 'bedrijf' ? `Bedrijf (${aantalKaarten} kaarten)` : `Individueel (${aantalKaarten} kaarten)`)}
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

    ${knop(`${BASE}/admin`, 'Naar admin dashboard')}
  `

  await transporter.sendMail({
    from: FROM,
    to: ADMIN,
    subject: heeftVoorraad
      ? `📦 Kaartorder: stuur ${setId} naar ${naam}`
      : `⚠️ Kaartorder: geen voorraad voor ${naam}`,
    html: mailHtml(inhoud),
  })
}
