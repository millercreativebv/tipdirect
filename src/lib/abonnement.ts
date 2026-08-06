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

// Haal tarief op per account-type — instelbaar in admin dashboard
async function getAbonnementsBedrag(accountType: string): Promise<number> {
  const snap = await adminDb.collection('config').doc('fees').get()
  if (snap.exists) {
    const data = snap.data()!
    if (accountType === 'bedrijf') {
      return data.abonnementsBedragBedrijf ?? 6000
    }
    return data.abonnementsBedragOber ?? data.abonnementsBedrag ?? 2500
  }
  return accountType === 'bedrijf' ? 6000 : 2500
}

// Haal abonnement op voor een ober, maak het aan als het nog niet bestaat
export async function getOfMaakAbonnement(oberId: string, accountType = 'individueel'): Promise<Abonnement> {
  const ref = adminDb.collection('abonnementen').doc(oberId)
  const snap = await ref.get()

  if (snap.exists) {
    return { oberId, ...snap.data() } as Abonnement
  }

  const bedrag = await getAbonnementsBedrag(accountType)
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
  bedragCenten: number,
  accountType = 'individueel'
): Promise<{ bestemming: 'tipdirect' | 'klant'; abonnementNuActief: boolean }> {
  const ref = adminDb.collection('abonnementen').doc(oberId)
  const abonnement = await getOfMaakAbonnement(oberId, accountType)

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

type Check30Resultaat = {
  incasso_gestart: string[]
  vervallen: string[]
}

// Controleer accounts ouder dan 30 dagen die nog 'pending' zijn
// - Heeft IBAN + SEPA-machtiging → probeer incasso voor resterend bedrag
// - Geen IBAN/machtiging → zet direct op vervallen
export async function check30DagenRegel(): Promise<Check30Resultaat> {
  const grens = new Date()
  grens.setDate(grens.getDate() - 30)

  const snap = await adminDb
    .collection('abonnementen')
    .where('status', '==', 'pending')
    .get()

  const incasso_gestart: string[] = []
  const vervallen: string[] = []

  for (const abDoc of snap.docs) {
    const ab = abDoc.data()
    const startDatum = new Date(ab.start_datum)
    if (startDatum >= grens) continue

    const oberId = abDoc.id
    const resterend = Math.max(0, (ab.bedrag ?? 0) - (ab.voldaan ?? 0))

    // Haal ober op voor IBAN en SEPA-consent
    const oberSnap = await adminDb.collection('obers').doc(oberId).get()
    const ober = oberSnap.data()

    const heeftSepa = ober?.sepa_akkoord === true && ober?.iban && ober?.iban_naam

    if (heeftSepa && resterend > 0) {
      // Probeer SEPA-incasso via Mollie
      try {
        const { mollie } = await import('@/lib/mollie')
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

        // Maak Mollie Customer aan als die nog niet bestaat
        let mollieCustomerId = ober!.mollie_customer_id as string | undefined

        if (!mollieCustomerId) {
          const klant = await mollie.customers.create({
            name: ober!.iban_naam as string,
            email: ober!.email as string,
          })
          mollieCustomerId = klant.id
          await adminDb.collection('obers').doc(oberId).update({ mollie_customer_id: mollieCustomerId })
        }

        // Maak SEPA-mandaat aan
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mandate = await (mollie.customers as any).mandates.create(mollieCustomerId, {
          method: 'directdebit',
          consumerName: ober!.iban_naam as string,
          consumerAccount: ober!.iban as string,
          signatureDate: new Date().toISOString().split('T')[0],
          mandateReference: `TD-${oberId}-${Date.now()}`,
        })

        // Start incasso-betaling
        const betaling = await mollie.payments.create({
          amount: { currency: 'EUR', value: (resterend / 100).toFixed(2) },
          description: 'TipDirect abonnement (automatische incasso)',
          redirectUrl: `${baseUrl}/dashboard`,
          webhookUrl: `${baseUrl}/api/webhook`,
          customerId: mollieCustomerId,
          mandateId: mandate.id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          sequenceType: 'recurring' as any,
          metadata: { oberId, bedragCenten: resterend.toString() },
        })

        await adminDb.collection('betalingen').add({
          ober_id: oberId,
          mollie_id: betaling.id,
          bedrag: resterend,
          betaling_type: 'abonnement_incasso',
          status: 'open',
          bestemming: null,
          beschrijving: 'TipDirect abonnement (SEPA incasso)',
          aangemaakt_op: new Date().toISOString(),
          betaald_op: null,
          abonnement_verwerkt: false,
        })

        await abDoc.ref.update({ incasso_gestart: true, incasso_datum: new Date().toISOString() })
        incasso_gestart.push(oberId)
      } catch (err) {
        console.error(`Incasso mislukt voor ${oberId}:`, err)
        // Incasso mislukt → alsnog vervallen
        await abDoc.ref.update({ status: 'vervallen' })
        vervallen.push(oberId)
      }
    } else {
      // Geen SEPA-machtiging of niets te incasseren → vervallen
      await abDoc.ref.update({ status: 'vervallen' })
      vervallen.push(oberId)
    }
  }

  return { incasso_gestart, vervallen }
}
