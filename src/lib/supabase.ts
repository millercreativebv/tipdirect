import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Gebruik dit in de browser en server components (beperkte rechten)
export const supabase = createClient(url, anon)

// Gebruik dit alleen in API routes en server actions (volledige rechten)
export const supabaseAdmin = createClient(url, service, {
  auth: { persistSession: false },
})

export type Ober = {
  id: string
  email: string
  naam: string
  gebruikersnaam: string
  foto_url: string | null
  iban: string | null
  iban_naam: string | null
  actief: boolean
  aangemaakt_op: string
}

export type Betaling = {
  id: string
  ober_id: string
  mollie_id: string
  bedrag: number
  fee: number
  status: 'open' | 'betaald' | 'mislukt' | 'teruggestort'
  beschrijving: string | null
  aangemaakt_op: string
  betaald_op: string | null
}
