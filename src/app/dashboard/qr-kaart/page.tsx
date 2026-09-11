'use client'

import { useEffect, useState } from 'react'
import { auth, db, type Ober } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import QRCode from 'qrcode'
import Link from 'next/link'

type Weergave = 'pasje' | 'tafelkaart'
type Papierformaat = 'A4' | 'A5'

export default function QrKaartPagina() {
  const [ober, setOber] = useState<Ober | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [laden, setLaden] = useState(true)
  const [weergave, setWeergave] = useState<Weergave>('pasje')
  const [papierformaat, setPapierformaat] = useState<Papierformaat>('A4')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setLaden(false); return }
      const snap = await getDoc(doc(db, 'obers', user.uid))
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Ober
        setOber(data)
        const url = `https://tipdirect.be/${data.gebruikersnaam}`
        const dataUrl = await QRCode.toDataURL(url, {
          width: 400,
          margin: 4,
          errorCorrectionLevel: 'H',
          color: { dark: '#000000', light: '#ffffff' },
        })
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

  const tafelkaartBreedteMm = papierformaat === 'A4' ? 210 : 148
  const tafelkaartHoogteMm = papierformaat === 'A4' ? 297 : 210
  // Voorbeeldschaal op scherm: mikt op ~300px breed, ongeacht papierformaat.
  const previewSchaal = 300 / tafelkaartBreedteMm

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
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
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
          .tafelkaart-pagina {
            width: ${tafelkaartBreedteMm}mm;
            height: ${tafelkaartHoogteMm}mm;
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
          }
          @page {
            size: ${weergave === 'tafelkaart' ? papierformaat : 'auto'};
            margin: 0;
          }
        }
      `}</style>

      {/* Schermweergave */}
      <div className="geen-print min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-md mx-auto">
          <Link href="/dashboard" className="text-sm text-[#a10f5a] mb-6 inline-block">
            ← Terug naar dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Mijn QR-kaart</h1>
          <p className="text-gray-500 text-sm mb-6">
            Kies een formaat en druk direct af.
          </p>

          {/* Formaat-keuze: pasje of tafelkaart */}
          <div className="flex gap-2 mb-6 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setWeergave('pasje')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                weergave === 'pasje' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              Pasje (creditcard)
            </button>
            <button
              onClick={() => setWeergave('tafelkaart')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                weergave === 'tafelkaart' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              Tafelkaart (A4/A5)
            </button>
          </div>

          {weergave === 'pasje' && (
            <>
              <p className="text-gray-500 text-sm mb-8">
                Druk af, knip langs de stippellijnen en lamineer. Exacte creditcardmaat (85,6 × 54 mm).
              </p>

              {/* Voorbeeld op scherm (4× schaal) */}
              <div className="flex justify-center mb-8">
                <Pasje ober={ober} qrDataUrl={qrDataUrl} schaal={4} />
              </div>
            </>
          )}

          {weergave === 'tafelkaart' && (
            <>
              {/* A4 / A5 keuze */}
              <div className="flex gap-2 mb-6">
                {(['A4', 'A5'] as Papierformaat[]).map((formaat) => (
                  <button
                    key={formaat}
                    onClick={() => setPapierformaat(formaat)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition ${
                      papierformaat === formaat
                        ? 'border-[#a10f5a] text-[#a10f5a] bg-[#a10f5a]/5'
                        : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    {formaat}
                  </button>
                ))}
              </div>

              <p className="text-gray-500 text-sm mb-8">
                Voor op de bar of tafel, bijvoorbeeld in een kaartstandaard. Druk af op {papierformaat}
                {papierformaat === 'A4'
                  ? ' — of stel "verkleinen naar A5" in bij je printer voor een kleinere kaart.'
                  : '.'}
              </p>

              {/* Voorbeeld op scherm */}
              <div className="flex justify-center mb-8">
                <Tafelkaart
                  ober={ober}
                  qrDataUrl={qrDataUrl}
                  breedteMm={tafelkaartBreedteMm}
                  hoogteMm={tafelkaartHoogteMm}
                  schaal={previewSchaal}
                />
              </div>
            </>
          )}

          <button
            onClick={() => window.print()}
            className="w-full bg-[#a10f5a] text-white font-semibold py-3 rounded-xl hover:bg-[#8a0d4d] transition"
          >
            Afdrukken
          </button>
          <p className="text-center text-xs text-gray-400 mt-3">
            {weergave === 'pasje'
              ? 'Stel in je printerinstellingen "Werkelijke grootte" in voor exacte afmetingen.'
              : `Stel in je printerinstellingen papierformaat "${papierformaat}" in, zonder schalen.`}
          </p>
        </div>
      </div>

      {/* Printpagina: pasje (4 stuks) óf tafelkaart (1 volledige pagina) */}
      {weergave === 'pasje' && (
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
      )}

      {weergave === 'tafelkaart' && (
        <div className="alleen-print tafelkaart-pagina">
          <Tafelkaart
            ober={ober}
            qrDataUrl={qrDataUrl}
            breedteMm={tafelkaartBreedteMm}
            hoogteMm={tafelkaartHoogteMm}
            schaal={1}
          />
        </div>
      )}
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

function Tafelkaart({
  ober,
  qrDataUrl,
  breedteMm,
  hoogteMm,
  schaal,
}: {
  ober: Ober
  qrDataUrl: string
  breedteMm: number
  hoogteMm: number
  schaal: number
}) {
  // Alle maten zijn relatief aan de breedte, zodat A4 en A5 dezelfde verhoudingen aanhouden.
  const s = (mm: number) => schaal === 1 ? `${mm}mm` : `${mm * schaal}px`
  const r = (fractie: number) => s(breedteMm * fractie)

  return (
    <div style={{
      width: s(breedteMm),
      height: s(hoogteMm),
      background: 'white',
      border: schaal > 1 ? '1px solid #e5e7eb' : 'none',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Helvetica, Arial, sans-serif',
      boxShadow: schaal > 1 ? '0 4px 20px rgba(0,0,0,0.12)' : 'none',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: '#a10f5a',
        padding: `${r(0.09)} ${r(0.09)}`,
        flexShrink: 0,
      }}>
        <p style={{ color: 'white', fontWeight: 700, fontSize: r(0.075), margin: 0, letterSpacing: '0.01em' }}>
          TipDirect
        </p>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: r(0.032), margin: `${r(0.012)} 0 0` }}>
          tipdirect.be/{ober.gebruikersnaam}
        </p>
      </div>

      {/* Body */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${r(0.06)} ${r(0.08)}`,
        textAlign: 'center',
      }}>
        <p style={{ fontWeight: 700, fontSize: r(0.065), color: '#111827', margin: 0 }}>
          {ober.naam}
        </p>
        <p style={{ fontSize: r(0.032), color: '#6b7280', margin: `${r(0.02)} 0 0`, lineHeight: 1.4 }}>
          Scan de QR-code<br />en geef een fooi
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="QR code"
          style={{ width: r(0.42), height: r(0.42), display: 'block', margin: `${r(0.05)} 0` }}
        />
        <p style={{ fontSize: r(0.038), color: '#a10f5a', fontWeight: 700, margin: 0 }}>
          Geen app nodig
        </p>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid #f3f4f6',
        padding: `${r(0.025)} ${r(0.08)}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: r(0.022), color: '#9ca3af' }}>Cashless · Veilig · Direct</span>
        <span style={{ fontSize: r(0.022), color: '#9ca3af' }}>© Miller Creative</span>
      </div>
    </div>
  )
}
