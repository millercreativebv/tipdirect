import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { resolve } from 'path'

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
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
  }),
})

const db = getFirestore()
const snap = await db.collection('obers').get()
snap.forEach(d => {
  const data = d.data()
  console.log(`uid: ${d.id}`)
  console.log(`  naam: ${data.naam}`)
  console.log(`  email: ${data.email}`)
  console.log(`  gebruikersnaam: ${data.gebruikersnaam}`)
  console.log('---')
})
process.exit(0)
