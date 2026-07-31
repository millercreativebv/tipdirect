// Gebruik: node scripts/set-admin.mjs <email>
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Laad .env.local handmatig
const envPath = resolve(process.cwd(), '.env.local')
const envLines = readFileSync(envPath, 'utf-8').split('\n')
for (const line of envLines) {
  const idx = line.indexOf('=')
  if (idx === -1) continue
  const key = line.slice(0, idx).trim()
  let val = line.slice(idx + 1).trim()
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1)
  }
  val = val.replace(/\\n/g, '\n')
  if (key) process.env[key] = val
}

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
})

const db = getFirestore()
const adminAuth = getAuth()

const email = process.argv[2]
if (!email) {
  console.error('Gebruik: node scripts/set-admin.mjs <email>')
  process.exit(1)
}

const user = await adminAuth.getUserByEmail(email)
await db.collection('obers').doc(user.uid).update({ admin: true })
console.log(`✅ Admin toegang verleend aan ${email} (uid: ${user.uid})`)
process.exit(0)
