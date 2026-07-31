import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export type AbonnementStatus = 'pending' | 'actief' | 'vervallen'

export interface Abonnement {
  oberId: string
  bedrag: number        // abonnementsbedrag in centen (configureerbaar)
  voldaan: number       // hoeveel al via fooien betaald
  status: AbonnementStatus
  start_datum: string
  actief_sinds: string | null
  uitbetaling: 'iban' | 'mollie'
  iban: string | null
  mollie_token: string | null
}

// Haal config op — abonnementsbedrag staat in /config/fees
async function getAbonnementsBedrag(): Promise<number> {
  const snap = await adminDb.collection('config').doc('fees').get()
  if (snap.exists) return snap.data()?.abonnementsBedrag ?? 2999
  return 2999 // standaard €29,99 als config nog niet bestaat
}

// Haal abonnement op voor een ober, maak het aan als het nog niet bestaat
export async function getOfMaakAbonnement(oberId: string): Promise<Abonnement> {
  const ref = adminDb.collection('abonnementen').doc(oberId)
  const snap = await ref.get()

  if (snap.exists) {
    return { oberId, ...snap.data() } as Abonnement
  }

  const bedrag = await getAbonnementsBedrag()
  const nieuw: Omit<Abonnement, 'oberId'> = {
    bedrag,
    voldaan: 0,
    status: 'pending',
    start_datum: new Date().toISOString(),
    actief_sinds: null,
    uitbetaling: 'iban',
    iban: null,
    mollie_token: null,
  }

  await ref.set(nieuw)
  return { oberId, ...nieuw }
}

// Verwerk een betaalde fooi tegen het abonnement
// Geeft terug waar het geld naartoe gaat: 'tipdirect' of 'klant'
export async function verwerkBetalingVoorAbonnement(
  oberId: string,
  bedragCenten: number
): Promise<{ bestemming: 'tipdirect' | 'klant'; abonnementNuActief: boolean }> {
  const ref = adminDb.collection('abonnementen').doc(oberId)
  const abonnement = await getOfMaakAbonnement(oberId)

  if (abonnement.status === 'actief') {
    return { bestemming: 'klant', abonnementNuActief: false }
  }

  if (abonnement.status === 'vervallen') {
    // Vervallen account → geld naar TipDirect totdat alsnog betaald
    return { bestemming: 'tipdirect', abonnementNuActief: false }
  }

  // Status is 'pending' → voeg bij aan teller
  const nieuweVoldaan = abonnement.voldaan + bedragCenten
  const isNuVoldaan = nieuweVoldaan >= abonnement.bedrag

  if (isNuVoldaan) {
    await ref.update({
      voldaan: nieuweVoldaan,
      status: 'actief',
      actief_sinds: new Date().toISOString(),
    })
    return { bestemming: 'tipdirect', abonnementNuActief: true }
  } else {
    await ref.update({ voldaan: FieldValue.increment(bedragCenten) })
    return { bestemming: 'tipdirect', abonnementNuActief: false }
  }
}

// Controleer accounts ouder dan 30 dagen die nog 'pending' zijn → vervallen
export async function check30DagenRegel(): Promise<string[]> {
  const grens = new Date()
  grens.setDate(grens.getDate() - 30)

  const snap = await adminDb
    .collection('abonnementen')
    .where('status', '==', 'pending')
    .get()

  const vervallen: string[] = []

  for (const doc of snap.docs) {
    const data = doc.data()
    const startDatum = new Date(data.start_datum)
    if (startDatum < grens && data.voldaan === 0) {
      await doc.ref.update({ status: 'vervallen' })
      vervallen.push(doc.id)
    }
  }

  return vervallen
}
