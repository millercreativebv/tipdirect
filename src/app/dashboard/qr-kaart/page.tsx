'use client'

import { useEffect, useState } from 'react'
import { auth, db, type Ober } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import QRCode from 'qrcode'
import Link from 'next/link'

export default function QrKaartPagina() {
  const [ober, setOber] = useState<Ober | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setLaden(false); return }
      const snap = await getDoc(doc(db, 'obers', user.uid))
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Ober
        setOber(data)
        const url = `https://tipdirect.be/${data.gebruikersnaam}`
        const dataUrl = await QRCode.toDataURL(url, { width: 400, margin: 1, color: { dark: '#111827', light: '#ffffff' } })
        setQrDataUrl(dataUrl)
      }
      setLaden(false)
    })
    return () => unsub()
  }, [])

  if (laden) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Laden…</p></div>
  }

  if (!ober || !qrDataUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Niet ingelogd. <Link href="/inloggen" className="underline">Inloggen</Link></p>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @media screen {
          .alleen-print { display: none !important; }
        }
        @media print {
          .geen-print { display: none !important; }
          .alleen-print { display: block !important; }
          body { margin: 0; padding: 0; }
          .print-pagina {
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            box-sizing: border-box;
          }
          .pasjes-rij {
            display: flex;
            flex-wrap: wrap;
            gap: 10mm;
          }
        }
      `}</style>

      {/* Schermweergave */}
      <div className="geen-print min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-md mx-auto">
          <Link href="/dashboard" className="text-sm text-[#a10f5a] mb-6 inline-block">
            ← Terug naar dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Mijn QR-pasje</h1>
          <p className="text-gray-500 text-sm mb-8">
            Druk af, knip langs de stippellijnen en lamineer. Exacte creditcardmaat (85,6 × 54 mm).
          </p>

          {/* Voorbeeld op scherm (4× schaal) */}
          <div className="flex justify-center mb-8">
            <Pasje ober={ober} qrDataUrl={qrDataUrl} schaal={4} />
          </div>

          <button
            onClick={() => window.print()}
            className="w-full bg-[#a10f5a] text-white font-semibold py-3 rounded-xl hover:bg-[#8a0d4d] transition"
          >
            Afdrukken
          </button>
          <p className="text-center text-xs text-gray-400 mt-3">
            Stel in je printerinstellingen "Werkelijke grootte" in voor exacte afmetingen.
          </p>
        </div>
      </div>

      {/* Printpagina: 4 pasjes (snijden → 4 kaartjes) */}
      <div className="alleen-print print-pagina">
        <div className="pasjes-rij">
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ border: '1.5px dashed #9ca3af', padding: '2mm', borderRadius: '4mm', display: 'inline-block' }}>
              <Pasje ober={ober} qrDataUrl={qrDataUrl} schaal={1} />
            </div>
          ))}
        </div>
        <p style={{ marginTop: '12mm', fontSize: '8pt', color: '#9ca3af', fontFamily: 'Helvetica, Arial, sans-serif' }}>
          TipDirect — knip langs de stippellijnen en lamineer voor gebruik als pasje.
        </p>
      </div>
    </>
  )
}

function Pasje({ ober, qrDataUrl, schaal }: { ober: Ober; qrDataUrl: string; schaal: number }) {
  const s = (mm: number) => schaal === 1 ? `${mm}mm` : `${mm * schaal}px`

  return (
    <div style={{
      width: s(85.6),
      height: s(54),
      borderRadius: s(3),
      overflow: 'hidden',
      background: 'white',
      border: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Helvetica, Arial, sans-serif',
      boxShadow: schaal > 1 ? '0 4px 20px rgba(0,0,0,0.12)' : 'none',
    }}>
      {/* Header */}
      <div style={{
        background: '#a10f5a',
        padding: `${s(2.5)} ${s(4)}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <span style={{ color: 'white', fontWeight: 700, fontSize: s(5.5), letterSpacing: '0.02em' }}>
          TipDirect
        </span>
        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: s(3.8) }}>
          tipdirect.be/{ober.gebruikersnaam}
        </span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: `${s(3)} ${s(4)}`, gap: s(3) }}>
        {/* Tekst links */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: s(6), color: '#111827', margin: 0, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {ober.naam}
          </p>
          <p style={{ fontSize: s(4.2), color: '#6b7280', margin: `${s(1.5)} 0 0`, lineHeight: 1.35 }}>
            Scan de QR-code<br />en geef een fooi
          </p>
          <p style={{ fontSize: s(3.5), color: '#a10f5a', fontWeight: 600, margin: `${s(2)} 0 0` }}>
            Geen app nodig
          </p>
        </div>

        {/* QR code rechts */}
        <div style={{ flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt="QR code"
            style={{ width: s(27), height: s(27), display: 'block', borderRadius: s(1.5) }}
          />
        </div>
      </div>

      {/* Footer */}
      <div style={{
        background: '#f9fafb',
        borderTop: '1px solid #f3f4f6',
        padding: `${s(1.8)} ${s(4)}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: s(3.2), color: '#9ca3af' }}>Cashless · Veilig · Direct</span>
        <span style={{ fontSize: s(3.2), color: '#9ca3af' }}>© Miller Creative</span>
      </div>
    </div>
  )
}
