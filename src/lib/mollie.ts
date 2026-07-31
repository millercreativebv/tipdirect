import { createMollieClient } from '@mollie/api-client'

if (!process.env.MOLLIE_API_KEY) {
  throw new Error('MOLLIE_API_KEY is niet ingesteld in .env.local')
}

export const mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY })

export const MOLLIE_FEE_CENTEN = 32

export function centen(euro: number): number {
  return Math.round(euro * 100)
}

export function euroString(centen: number): string {
  return (centen / 100).toFixed(2)
}
