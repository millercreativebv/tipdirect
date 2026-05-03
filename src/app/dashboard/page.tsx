'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase, type Ober, type Betaling } from '@/lib/supabase'
import { euro } from '@/lib/mollie'
import Link from 'next/link'
import QRCode from 'qrcode'

export default function DashboardPagina() {
  const [ober, setOber] = useState<Ober | null>(null)
  const [betalingen, setBetalingen] = useState<Betaling[]>([])
  const [laden, setLaden] = useState(true)
  const [qrUrl, setQrUrl] = useState('')
  const [qrZichtbaar, setQrZichtbaar] = useState(false)
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    async function laadData() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/inloggen'
        return
      }

      const { data: oberData } = await supabase
        .from('obers')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!oberData) {
        window.location.href = '/registreer'
        return
      }

      setOber(oberData)

      const { data: betalingenData } = await supabase
        .from('betalingen')
        .select('*')
        .eq('ober_id', user.id)
        .order('aangemaakt_op', { ascending: false })
        .limit(50)

      setBetalingen(betalingenData ?? [])
      setLaden(false)
    }

    laadData()
  }, [])

  useEffect(() => {
    if (ober && qrZichtbaar && qrCanvasRef.current) {
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/${ober.gebruikersnaam}`
      QRCode.toCanvas(qrCanvasRef.current, url, {
        width: 250,
        margin: 2,
        color: { dark: '#1a1a1a', light: '#ffffff' },
      })
      setQrUrl(url)
    }
  }, [ober, qrZichtbaar])

  function qrDownloaden() {
    if (!qrCanvasRef.current || !ober) return
    const link = document.createElement('a')
    link.download = `tipdirect-qr-${ober.gebruikersnaam}.png`
    link.href = qrCanvasRef.current.toDataURL()
    link.click()
  }

  async function uitloggen() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (laden) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!ober) return null

  const betaaldeTips = betalingen.filter(b => b.status === 'betaald')
  const totaalOntvangen = betaaldeTips.reduce((sum, b) => sum + (b.bedrag - b.fee), 0)
  const vandaagTips = betaaldeTips.filter(b => {
    const vandaag = new Date().toDateString()
    return new Date(b.betaald_op ?? b.aangemaakt_op).toDateString() === vandaag
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 overflow-hidden flex items-center justify-center">
              {ober.foto_url
                ? <img src={ober.foto_url} alt={ober.naam} className="w-full h-full object-cover" />
                : <span className="text-xl">👤</span>
              }
            </div>
            <div>
              <p className="font-bold text-gray-900">{ober.naam}</p>
              <p className="text-xs text-gray-400">tipdirect.nl/{ober.gebruikersnaam}</p>
            </div>
          </div>
          <button onClick={uitloggen} className="text-sm text-gray-400 hover:text-gray-600">
            Uitloggen
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">

        {/* Statistieken */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-emerald-500">€{euro(totaalOntvangen)}</p>
            <p className="text-xs text-gray-500 mt-1">Totaal ontvangen</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{betaaldeTips.length}</p>
            <p className="text-xs text-gray-500 mt-1">Totaal tips</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-green-500">{vandaagTips.length}</p>
            <p className="text-xs text-gray-500 mt-1">Vandaag</p>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => setQrZichtbaar(!qrZichtbaar)}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📱</span>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Mijn QR-code</p>
                <p className="text-sm text-gray-400">Klanten scannen dit om te betalen</p>
              </div>
            </div>
            <span className="text-gray-400">{qrZichtbaar ? '▲' : '▼'}</span>
          </button>

          {qrZichtbaar && (
            <div className="px-4 pb-4 flex flex-col items-center gap-4">
              <canvas ref={qrCanvasRef} className="rounded-xl" />
              <p className="text-sm text-gray-400 text-center">{qrUrl}</p>
              <button
                onClick={qrDownloaden}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all"
              >
                QR-code downloaden
              </button>
              <Link
                href={`/${ober.gebruikersnaam}`}
                target="_blank"
                className="w-full py-3 border-2 border-emerald-500 text-emerald-700 font-bold rounded-xl transition-all text-center"
              >
                Betaalpagina bekijken
              </Link>
            </div>
          )}
        </div>

        {/* Recente tips */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Recente tips</h2>
          </div>

          {betaaldeTips.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-4xl mb-3">💸</p>
              <p className="text-gray-500">Nog geen tips ontvangen.</p>
              <p className="text-sm text-gray-400 mt-1">Deel je QR-code met gasten!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {betaaldeTips.slice(0, 20).map((b) => (
                <div key={b.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      +€{euro(b.bedrag - b.fee)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(b.betaald_op ?? b.aangemaakt_op).toLocaleDateString('nl-NL', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">
                    Ontvangen
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profiel bewerken */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Profiel</h2>
          <Link
            href="/dashboard/profiel"
            className="block w-full py-3 border-2 border-gray-200 hover:border-emerald-500 text-gray-700 font-medium rounded-xl transition-all text-center"
          >
            Profiel bewerken
          </Link>
        </div>

      </div>
    </div>
  )
}
