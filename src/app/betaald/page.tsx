'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import { db, type Ober } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

function BetaaldInhoud() {
  const params = useSearchParams()
  const gebruikersnaam = params.get('ober')
  const [ober, setOber] = useState<Ober | null>(null)

  useEffect(() => {
    if (!gebruikersnaam) return
    async function laadOber() {
      const q = query(collection(db, 'obers'), where('gebruikersnaam', '==', gebruikersnaam))
      const snap = await getDocs(q)
      if (!snap.empty) {
        setOber({ id: snap.docs[0].id, ...snap.docs[0].data() } as Ober)
      }
    }
    laadOber()
  }, [gebruikersnaam])

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <Image src="/logotd.png" alt="TipDirect" width={180} height={72} className="h-12 w-auto mx-auto mb-8" />

        {/* Vinkje + oberfoto */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-brand-100 flex items-center justify-center">
            {ober?.foto_url
              ? <img src={ober.foto_url} alt={ober.naam} className="w-full h-full object-cover" />
              : <span className="text-4xl">👤</span>
            }
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-brand-100">
            <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {ober && <p className="font-bold text-gray-900 text-lg mb-1">{ober.naam}</p>}

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bedankt!</h1>
        <p className="text-gray-500 text-lg mb-8">
          Je tip is succesvol verzonden.{' '}
          {ober ? <>{ober.naam} ontvangt het bedrag direct.</> : 'De ober ontvangt het bedrag direct.'}
        </p>

        {gebruikersnaam && (
          <Link
            href={`/${gebruikersnaam}`}
            className="block w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all text-center mb-3"
          >
            Nog een tip geven
          </Link>
        )}

        <Link
          href="/"
          className="block text-gray-400 text-sm hover:text-gray-600 transition-colors"
        >
          Terug naar TipDirect
        </Link>
      </div>
    </div>
  )
}

export default function BetaaldPagina() {
  return (
    <Suspense>
      <BetaaldInhoud />
    </Suspense>
  )
}
