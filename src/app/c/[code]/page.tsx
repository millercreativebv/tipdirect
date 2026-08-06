import { redirect, notFound } from 'next/navigation'
import { adminDb } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

export default async function KaartRedirect({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const normalized = code.toUpperCase()

  const snap = await adminDb.collection('kaart_codes').doc(normalized).get()

  if (!snap.exists) {
    notFound()
  }

  const data = snap.data()!

  if (!data.redirect_url) {
    // Code bestaat maar is nog niet toegewezen aan een account
    notFound()
  }

  redirect(data.redirect_url)
}
