import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'

// GET — partner dashboard data
export async function GET(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ fout: 'Niet ingelogd' }, { status: 401 })

  const partnerSnap = await adminDb.collection('partners').doc(userId).get()
  if (!partnerSnap.exists) {
    return NextResponse.json({ fout: 'Geen partner account' }, { status: 403 })
  }

  // Aangebrachte accounts
  const obersSnap = await adminDb
    .collection('obers')
    .where('aangebracht_door', '==', userId)
    .get()

  const oberIds = obersSnap.docs.map(d => d.id)

  // Abonnementen van aangebrachte accounts
  const abonnementen = await Promise.all(
    oberIds.map(id => adminDb.collection('abonnementen').doc(id).get())
  )

  const abStats = { actief: 0, pending: 0, vervallen: 0 }
  for (const ab of abonnementen) {
    if (!ab.exists) continue
    const status = ab.data()?.status as string
    if (status in abStats) abStats[status as keyof typeof abStats]++
  }

  // Tegoed per maand
  const tegoedSnap = await adminDb
    .collection('partner_tegoed')
    .where('partner_id', '==', userId)
    .get()

  const tegoedLijst = tegoedSnap.docs
    .map(d => ({ id: d.id, ...d.data() as { maand: string; bedrag: number; status: string; uitbetaald_op: string | null } }))
    .sort((a, b) => b.maand.localeCompare(a.maand))

  const openTegoed = tegoedSnap.docs
    .filter(d => d.data().status === 'open')
    .reduce((sum, d) => sum + (d.data().bedrag ?? 0), 0)

  return NextResponse.json({
    partner: { id: partnerSnap.id, ...partnerSnap.data() },
    accounts: {
      totaal: oberIds.length,
      ...abStats,
    },
    openTegoed,
    tegoedLijst,
  })
}
