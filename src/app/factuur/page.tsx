'use client'

import { useEffect, useState } from 'react'
import { onAuthStateChanged, getIdToken } from 'firebase/auth'
import { auth } from '@/lib/firebase'

const BTW = 21

interface FactuurData {
  factuur_nummer: string
  factuur_datum: string
  ober: {
    naam: string
    email: string
    straat: string
    postcode: string
    stad: string
    account_type: string
    bedrijfsnaam: string | null
    btw_nummer: string | null
    kvk: string | null
  }
  abonnement: {
    bedrag: number
    actief_sinds: string
  }
}

function euro(centen: number) {
  return (centen / 100).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function datumNl(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function FactuurPage() {
  const [data, setData] = useState<FactuurData | null>(null)
  const [fout, setFout] = useState('')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) { window.location.href = '/inloggen'; return }
      const token = await getIdToken(user)
      const res = await fetch('/api/mijn/factuur', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) { setFout((await res.json()).fout ?? 'Factuur niet beschikbaar.'); return }
      setData(await res.json())
    })
    return () => unsub()
  }, [])

  if (fout) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">{fout}</p>
        <a href="/dashboard" className="text-brand-600 underline text-sm">← Terug naar dashboard</a>
      </div>
    </div>
  )

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const { factuur_nummer, factuur_datum, ober, abonnement } = data
  const isBedrijf = ober.account_type === 'bedrijf'

  // Bedrijf: bedrag is ex-BTW. Individueel: bedrag is incl-BTW.
  const bedragExBtw = isBedrijf
    ? abonnement.bedrag
    : Math.round(abonnement.bedrag * 100 / (100 + BTW))
  const btwBedrag = isBedrijf
    ? Math.round(abonnement.bedrag * BTW / 100)
    : abonnement.bedrag - bedragExBtw
  const bedragInclBtw = bedragExBtw + btwBedrag

  const actiefSinds = new Date(abonnement.actief_sinds)
  const verlooptOp = new Date(actiefSinds)
  verlooptOp.setFullYear(verlooptOp.getFullYear() + 1)

  const klantNaam = isBedrijf && ober.bedrijfsnaam ? ober.bedrijfsnaam : ober.naam
  const omschrijving = isBedrijf
    ? 'TipDirect bedrijfsabonnement — 5 medewerkers'
    : 'TipDirect individueel abonnement'
  const periode = `${datumNl(abonnement.actief_sinds)} – ${datumNl(verlooptOp.toISOString())}`

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .factuur-wrap { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; }
        }
        body { background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        * { box-sizing: border-box; }
      `}</style>

      {/* Print-knop */}
      <div className="no-print flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 shadow-sm">
        <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</a>
        <button
          onClick={() => window.print()}
          className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold rounded-xl transition-all"
        >
          Afdrukken / Opslaan als PDF
        </button>
      </div>

      {/* Factuur */}
      <div className="factuur-wrap max-w-3xl mx-auto my-8 bg-white shadow-lg rounded-2xl overflow-hidden" style={{ minHeight: '297mm' }}>

        {/* Header */}
        <div className="px-12 pt-10 pb-6 flex items-start justify-between" style={{ borderBottom: '3px solid #A1105A' }}>
          <img src="/logotd.png" alt="TipDirect" style={{ height: 52, objectFit: 'contain' }} />
          <div className="text-right">
            <div style={{ fontSize: 28, fontWeight: 800, color: '#A1105A', letterSpacing: '-0.5px' }}>FACTUUR</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{factuur_nummer}</div>
          </div>
        </div>

        {/* Van / Aan */}
        <div className="px-12 py-8 grid grid-cols-2 gap-8">
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Van</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Miller Creative BV</div>
            <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.7 }}>
              Deursenseweg 12<br />
              5351 NN Berghem<br />
              Nederland<br />
              <span style={{ marginTop: 8, display: 'block' }}>
                KvK: 90467906<br />
                BTW: NL865326538B01<br />
                info@millercreative.nl
              </span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Aan</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{klantNaam}</div>
            <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.7 }}>
              {isBedrijf && ober.naam && ober.naam !== klantNaam && <>{ober.naam}<br /></>}
              {ober.straat}<br />
              {ober.postcode} {ober.stad}<br />
              {ober.email}
              {ober.kvk && <><br />KBO: {ober.kvk}</>}
              {ober.btw_nummer && <><br />BTW: {ober.btw_nummer}</>}
            </div>
          </div>
        </div>

        {/* Factuurdetails */}
        <div className="px-12 py-4 grid grid-cols-3 gap-4" style={{ background: '#f8faff', borderTop: '1px solid #e5e9f5', borderBottom: '1px solid #e5e9f5' }}>
          {[
            { label: 'Factuurnummer', waarde: factuur_nummer },
            { label: 'Factuurdatum', waarde: datumNl(factuur_datum) },
          ].map(({ label, waarde }) => (
            <div key={label}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 13, color: '#111827', fontWeight: 600 }}>{waarde}</div>
            </div>
          ))}
        </div>

        {/* Regels tabel */}
        <div className="px-12 pt-8">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#A1105A', color: 'white' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600, borderRadius: '6px 0 0 6px' }}>Omschrijving</th>
                <th style={{ textAlign: 'center', padding: '10px 14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Periode</th>
                <th style={{ textAlign: 'center', padding: '10px 14px', fontWeight: 600 }}>BTW</th>
                <th style={{ textAlign: 'right', padding: '10px 14px', fontWeight: 600, borderRadius: '0 6px 6px 0', whiteSpace: 'nowrap' }}>Bedrag (ex. BTW)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '14px 14px', color: '#111827' }}>{omschrijving}</td>
                <td style={{ padding: '14px 14px', color: '#6b7280', textAlign: 'center', whiteSpace: 'nowrap' }}>{periode}</td>
                <td style={{ padding: '14px 14px', color: '#6b7280', textAlign: 'center' }}>{BTW}%</td>
                <td style={{ padding: '14px 14px', color: '#111827', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>€&nbsp;{euro(bedragExBtw)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totalen */}
        <div className="px-12 pt-4 pb-8 flex justify-end">
          <div style={{ width: 280 }}>
            {[
              { label: 'Subtotaal (ex. BTW)', bedrag: bedragExBtw, bold: false },
              { label: `BTW ${BTW}%`, bedrag: btwBedrag, bold: false },
            ].map(({ label, bedrag, bold }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13, color: '#4b5563', fontWeight: bold ? 700 : 400 }}>
                <span>{label}</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>€&nbsp;{euro(bedrag)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', marginTop: 6, background: '#A1105A', color: 'white', borderRadius: 8, fontSize: 15, fontWeight: 700 }}>
              <span>Totaal incl. BTW</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>€&nbsp;{euro(bedragInclBtw)}</span>
            </div>
          </div>
        </div>

        {/* Betaling voldaan */}
        <div className="mx-12 mb-10 p-5 rounded-xl" style={{ background: '#fdf5f9', border: '1px solid #e8c0d4', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 36, height: 36, background: '#A1105A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'white', fontSize: 18, fontWeight: 700 }}>✓</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#A1105A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              {isBedrijf ? 'Betaling voldaan' : 'Abonnementsbijdrage voldaan'}
            </div>
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
              {isBedrijf ? (
                <>Betaling van <strong>€&nbsp;{euro(bedragInclBtw)}</strong> ontvangen op <strong>{datumNl(abonnement.actief_sinds)}</strong> via Mollie.<br />Dit document dient als betalingsbewijs. Geen verdere actie vereist.</>
              ) : (
                <>Abonnementsbijdrage van <strong>€&nbsp;{euro(bedragInclBtw)}</strong> voldaan via ontvangen fooien.<br />Dit document dient als betalingsbewijs. Geen verdere actie vereist.</>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e5e7eb', margin: '0 48px', paddingTop: 20, paddingBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>
            Miller Creative BV · KvK 90467906 · BTW NL865326538B01<br />
            Deursenseweg 12, 5351 NN Berghem · info@millercreative.nl
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'right' }}>
            Bedankt voor uw vertrouwen<br />in TipDirect!
          </div>
        </div>
      </div>
    </>
  )
}
