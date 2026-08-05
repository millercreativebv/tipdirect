import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export type Ober = {
  id: string
  email: string
  naam: string
  gebruikersnaam: string
  foto_url: string | null
  iban: string | null
  iban_naam: string | null
  actief: boolean
  account_type: 'individueel' | 'bedrijf' | 'medewerker'
  bedrijf_id: string | null
  aangebracht_door: string | null
  aangemaakt_op: string
  // Contactgegevens
  telefoon?: string | null
  adres_straat?: string | null
  adres_postcode?: string | null
  adres_stad?: string | null
  adres_land?: string | null
  // Fiscaal
  btw_nummer?: string | null
  // Profiel
  voorstelling?: string | null
  verhaal?: string | null
  spaardoel_naam?: string | null
  spaardoel_bedrag?: number | null
  admin?: boolean
  abonnement_actief?: boolean
}

export type Partner = {
  id: string
  naam: string
  email: string
  iban: string | null
  iban_naam: string | null
  land: string
  actief: boolean
  aangemaakt_op: string
}

export type PartnerTegoed = {
  id: string
  partner_id: string
  maand: string        // 'YYYY-MM'
  bedrag: number       // centen
  betalingen: string[] // betaling IDs
  status: 'open' | 'uitbetaald'
  uitbetaald_op: string | null
  aangemaakt_op: string
}

export type Betaling = {
  id: string
  ober_id: string
  mollie_id: string
  bedrag: number
  fee?: number          // oud veld — nog aanwezig in vroege testbetalingen
  status: 'open' | 'betaald' | 'mislukt' | 'teruggestort'
  bestemming?: 'tipdirect' | 'klant' | null
  netto_klant?: number | null
  mollie_fee?: number | null
  beschrijving: string | null
  aangemaakt_op: string
  betaald_op: string | null
  boodschap?: string | null
  sterren?: number | null
  complimenten?: string[]
  abonnement_verwerkt?: boolean
  uitbetaald?: boolean
  uitbetaald_op?: string | null
}

export type Bedrijf = {
  id: string
  naam: string               // handelsnaam
  statutaire_naam: string | null
  email: string
  telefoon: string | null
  // Adres
  adres_straat: string | null
  adres_postcode: string | null
  adres_stad: string | null
  adres_land: string | null
  // Fiscaal
  kvk: string | null         // KvK (NL) of ondernemingsnummer (BE)
  btw_nummer: string | null
  // Media
  logo_url?: string | null
  aangemaakt_op: string
}
