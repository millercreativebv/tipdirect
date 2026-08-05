import { createMollieClient } from '@mollie/api-client'

if (!process.env.MOLLIE_API_KEY) {
  throw new Error('MOLLIE_API_KEY is niet ingesteld')
}

export const mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY })

export const MOLLIE_FEE_CENTEN = 32

export function centen(euro: number): number {
  return Math.round(euro * 100)
}

export function euroString(centen: number): string {
  return (centen / 100).toFixed(2)
}

// Mollie Connect OAuth helpers

export function mollieConnectUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.MOLLIE_CLIENT_ID ?? '',
    redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/mollie/callback`,
    response_type: 'code',
    scope: 'payments.read payments.write organizations.read',
    state,
  })
  return `https://my.mollie.com/oauth2/authorize?${params}`
}

async function mollieTokenRequest(body: URLSearchParams) {
  const creds = Buffer.from(
    `${process.env.MOLLIE_CLIENT_ID}:${process.env.MOLLIE_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch('https://api.mollie.com/oauth2/tokens', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!res.ok) {
    const tekst = await res.text()
    throw new Error(`Mollie token request mislukt (${res.status}): ${tekst}`)
  }

  return res.json() as Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
  }>
}

export function mollieTokenUitwisselen(code: string) {
  return mollieTokenRequest(new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/mollie/callback`,
  }))
}

export function mollieTokenVernieuwen(refreshToken: string) {
  return mollieTokenRequest(new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  }))
}

export type MollieTokenData = {
  mollie_access_token: string
  mollie_refresh_token: string
  mollie_token_expires_at: string
}

// Geeft een geldig access token terug — vernieuwt automatisch als het bijna verloopt.
// `vernieuwd` en `nieuweData` zijn alleen gevuld als het token daadwerkelijk vernieuwd is.
export async function getGeldigAccessToken(ober: MollieTokenData): Promise<{
  accessToken: string
  vernieuwd: boolean
  nieuweData?: MollieTokenData
}> {
  const verloopt = new Date(ober.mollie_token_expires_at)
  const buffer = new Date(Date.now() + 5 * 60 * 1000) // 5 minuten marge

  if (verloopt > buffer) {
    return { accessToken: ober.mollie_access_token, vernieuwd: false }
  }

  const tokens = await mollieTokenVernieuwen(ober.mollie_refresh_token)
  const nieuweData: MollieTokenData = {
    mollie_access_token: tokens.access_token,
    mollie_refresh_token: tokens.refresh_token,
    mollie_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
  }

  return { accessToken: tokens.access_token, vernieuwd: true, nieuweData }
}

// Maak een tijdelijke Mollie client voor een verbonden account
export function verbondenMollieClient(accessToken: string) {
  return createMollieClient({ accessToken })
}
