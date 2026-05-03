'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function BetaaldInhoud() {
  const params = useSearchParams()
  const ober = params.get('ober')

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bedankt!</h1>
        <p className="text-gray-500 text-lg mb-8">
          Je fooi is succesvol verzonden. De ober ontvangt het bedrag direct.
        </p>

        {ober && (
          <Link
            href={`/${ober}`}
            className="block w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all text-center mb-3"
          >
            Nog een fooi geven
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
