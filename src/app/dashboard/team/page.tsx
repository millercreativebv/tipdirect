'use client'

import { useEffect, useState } from 'react'
import { auth, db, type Ober } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, collection, query, where, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import Link from 'next/link'

type FormData = { naam: string; gebruikersnaam: string; fotoUrl: string }
const LEEG: FormData = { naam: '', gebruikersnaam: '', fotoUrl: '' }

export default function TeamPagina() {
  const [uitbater, setUitbater] = useState<Ober | null>(null)
  const [medewerkers, setMedewerkers] = useState<Ober[]>([])
  const [laden, setLaden] = useState(true)
  const [toonForm, setToonForm] = useState(false)
  const [bewerkenId, setBewerkenId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(LEEG)
  const [opslaan, setOpslaan] = useState(false)
  const [fout, setFout] = useState('')

  async function laadMedewerkers(bedrijfId: string) {
    const snap = await getDocs(
      query(collection(db, 'obers'), where('bedrijf_id', '==', bedrijfId), where('account_type', '==', 'medewerker'))
    )
    const lijst = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Ober)
    lijst.sort((a, b) => a.naam.localeCompare(b.naam))
    setMedewerkers(lijst)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { window.location.href = '/inloggen'; return }

      const snap = await getDoc(doc(db, 'obers', user.uid))
      if (!snap.exists()) { window.location.href = '/registreer'; return }

      const data = { id: snap.id, ...snap.data() } as Ober
      if (data.account_type !== 'bedrijf') { window.location.href = '/dashboard'; return }
      setUitbater(data)

      await laadMedewerkers(data.bedrijf_id!)
      setLaden(false)
    })

    return () => unsubscribe()
  }, [])

  function bewerkStart(ober: Ober) {
    setBewerkenId(ober.id)
    setForm({ naam: ober.naam, gebruikersnaam: ober.gebruikersnaam, fotoUrl: ober.foto_url ?? '' })
    setToonForm(true)
    setFout('')
  }

  function annuleer() {
    setToonForm(false)
    setBewerkenId(null)
    setForm(LEEG)
    setFout('')
  }

  async function opslaan_fn(e: React.FormEvent) {
    e.preventDefault()
    if (!uitbater) return
    setOpslaan(true)
    setFout('')

    const slug = form.gebruikersnaam.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (slug.length < 3) {
      setFout('Gebruikersnaam moet minimaal 3 tekens bevatten.')
      setOpslaan(false)
      return
    }

    const bestaand = medewerkers.find(m => m.gebruikersnaam === slug && m.id !== bewerkenId)
    if (bestaand) {
      const q = query(collection(db, 'obers'), where('gebruikersnaam', '==', slug))
      const check = await getDocs(q)
      if (!check.empty) {
        setFout('Deze gebruikersnaam is al in gebruik.')
        setOpslaan(false)
        return
      }
    }

    try {
      if (bewerkenId) {
        await updateDoc(doc(db, 'obers', bewerkenId), {
          naam: form.naam,
          gebruikersnaam: slug,
          foto_url: form.fotoUrl || null,
        })
      } else {
        const ref = doc(collection(db, 'obers'))
        await setDoc(ref, {
          email: null,
          naam: form.naam,
          gebruikersnaam: slug,
          foto_url: form.fotoUrl || null,
          iban: null,
          iban_naam: null,
          actief: true,
          account_type: 'medewerker',
          bedrijf_id: uitbater.bedrijf_id,
          aangemaakt_op: new Date().toISOString(),
        })
      }

      await laadMedewerkers(uitbater.bedrijf_id!)
      annuleer()
    } catch {
      setFout('Opslaan mislukt. Probeer het opnieuw.')
    }
    setOpslaan(false)
  }

  async function toggleActief(ober: Ober) {
    await updateDoc(doc(db, 'obers', ober.id), { actief: !ober.actief })
    setMedewerkers(prev => prev.map(m => m.id === ober.id ? { ...m, actief: !m.actief } : m))
  }

  async function verwijder(ober: Ober) {
    if (!confirm(`Weet je zeker dat je ${ober.naam} wilt verwijderen?`)) return
    await deleteDoc(doc(db, 'obers', ober.id))
    setMedewerkers(prev => prev.filter(m => m.id !== ober.id))
  }

  if (laden) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/uitbater" className="text-gray-400 hover:text-gray-600 text-sm">
              ← Terug
            </Link>
            <h1 className="font-bold text-gray-900">Team beheren</h1>
          </div>
          {!toonForm && (
            <button
              onClick={() => { setToonForm(true); setBewerkenId(null); setForm(LEEG) }}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition-all"
            >
              + Medewerker
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* Formulier: toevoegen / bewerken */}
        {toonForm && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">
              {bewerkenId ? 'Medewerker bewerken' : 'Medewerker toevoegen'}
            </h2>
            <form onSubmit={opslaan_fn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Naam</label>
                <input
                  type="text"
                  required
                  value={form.naam}
                  onChange={e => setForm(f => ({ ...f, naam: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                  placeholder="Thomas Janssen"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gebruikersnaam</label>
                <div className="flex items-center border-2 border-gray-200 rounded-xl focus-within:border-brand-500 overflow-hidden">
                  <span className="pl-4 text-gray-400 text-sm whitespace-nowrap">tipdirect.nl/</span>
                  <input
                    type="text"
                    required
                    value={form.gebruikersnaam}
                    onChange={e => setForm(f => ({ ...f, gebruikersnaam: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') }))}
                    className="flex-1 px-2 py-3 focus:outline-none bg-transparent placeholder:text-gray-400 text-gray-900"
                    placeholder="thomas"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto URL <span className="text-gray-400 font-normal">(optioneel)</span></label>
                <input
                  type="url"
                  value={form.fotoUrl}
                  onChange={e => setForm(f => ({ ...f, fotoUrl: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 placeholder:text-gray-400 text-gray-900"
                  placeholder="https://..."
                />
              </div>

              {form.fotoUrl && (
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <img src={form.fotoUrl} alt="Preview" className="w-10 h-10 rounded-full object-cover" />
                  <p className="text-sm text-gray-500">Foto preview</p>
                </div>
              )}

              {fout && <p className="text-red-500 text-sm">{fout}</p>}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={opslaan}
                  className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 text-white font-bold rounded-xl transition-all"
                >
                  {opslaan ? 'Opslaan...' : bewerkenId ? 'Wijzigingen opslaan' : 'Toevoegen'}
                </button>
                <button
                  type="button"
                  onClick={annuleer}
                  className="px-4 py-3 border-2 border-gray-200 text-gray-600 font-medium rounded-xl hover:border-gray-300 transition-all"
                >
                  Annuleer
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Medewerkerlijst */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-50">
            <p className="font-semibold text-gray-900">{medewerkers.length} medewerker{medewerkers.length !== 1 ? 's' : ''}</p>
          </div>

          {medewerkers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-4xl mb-3">👥</p>
              <p className="text-gray-500">Nog geen medewerkers toegevoegd.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {medewerkers.map(ober => (
                <div key={ober.id} className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {ober.foto_url
                        ? <img src={ober.foto_url} alt={ober.naam} className="w-full h-full object-cover" />
                        : <span className="text-lg">👤</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{ober.naam}</p>
                      <p className="text-xs text-gray-400">tipdirect.nl/{ober.gebruikersnaam}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ober.actief ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {ober.actief ? 'Actief' : 'Inactief'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3 ml-13">
                    <button
                      onClick={() => bewerkStart(ober)}
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:border-brand-500 hover:text-brand-600 transition-all"
                    >
                      Bewerken
                    </button>
                    <button
                      onClick={() => toggleActief(ober)}
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:border-gray-300 transition-all"
                    >
                      {ober.actief ? 'Deactiveren' : 'Activeren'}
                    </button>
                    <a
                      href={`/${ober.gebruikersnaam}`}
                      target="_blank"
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:border-brand-500 hover:text-brand-600 transition-all"
                    >
                      Betaalpagina ↗
                    </a>
                    <button
                      onClick={() => verwijder(ober)}
                      className="text-xs px-3 py-1.5 border border-red-100 rounded-lg text-red-400 hover:border-red-300 hover:text-red-600 transition-all ml-auto"
                    >
                      Verwijderen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
