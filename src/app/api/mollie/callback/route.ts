import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { mollieTokenUitwisselen, verbondenMollieClient } from '@/lib/mollie'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const base = process.env.NEXT_PUBLIC_BASE_URL

  if (error || !code || !state) {
    return NextResponse.redirect(`${base}/dashboard/profiel?mollie=fout`)
  }

  // Verifieer state en haal uid op
  const stateDoc = await adminDb.collection('mollie_oauth_state').doc(state).get()
  if (!stateDoc.exists) {
    return NextResponse.redirect(`${base}/dashboard/profiel?mollie=fout`)
  }

  const { uid } = stateDoc.data()!

  try {
    const tokens = await mollieTokenUitwisselen(code)
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    // Ophalen van de naam van het verbonden Mollie account
    let mollieNaam = ''
    try {
      const verbonden = verbondenMollieClient(tokens.access_token)
      const org = await verbonden.organizations.getCurrent()
      mollieNaam = org.name
    } catch {
      // niet kritisch — naam is optioneel
    }

    await adminDb.collection('obers').doc(uid).update({
      mollie_access_token: tokens.access_token,
      mollie_refresh_token: tokens.refresh_token,
      mollie_token_expires_at: expiresAt,
      mollie_connected: true,
      mollie_connected_naam: mollieNaam || null,
    })

    // State opruimen
    await stateDoc.ref.delete()

    return NextResponse.redirect(`${base}/dashboard/profiel?mollie=verbonden`)
  } catch (err) {
    console.error('Mollie OAuth callback fout:', err)
    return NextResponse.redirect(`${base}/dashboard/profiel?mollie=fout`)
  }
}
