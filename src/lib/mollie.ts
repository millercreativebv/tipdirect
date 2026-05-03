import { createMollieClient } from '@mollie/api-client'

if (!process.env.MOLLIE_API_KEY) {
  throw new Error('MOLLIE_API_KEY is niet ingesteld in .env.local')
}

export const mollie = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY })

export const TIPDIRECT_FEE = parseInt(process.env.TIPDIRECT_FEE ?? '50')

export function centen(euro: number): number {
  return Math.round(euro * 100)
}

export function euro(centen: number): string {
  return (centen / 100).toFixed(2).replace('.', ',')
}
