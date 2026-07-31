import { adminAuth } from '@/lib/firebase-admin'
import { NextRequest } from 'next/server'

export async function getUserId(req: NextRequest): Promise<string | null> {
  const header = req.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) return null
  try {
    const decoded = await adminAuth.verifyIdToken(header.substring(7))
    return decoded.uid
  } catch {
    return null
  }
}
