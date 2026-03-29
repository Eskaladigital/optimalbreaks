'use client'

import { useState, useEffect, useCallback } from 'react'
import { adminCreate } from '@/lib/admin-api'
import { useParams } from 'next/navigation'

type PendingQueue = {
  count: number
  prefix: string
  artists: { slug: string; name: string }[]
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function AgentPage() {
  const params = useParams()
  const lang = (params.lang as string) || 'es'

  const [artistName, setArtistName] = useState('')
  const [slug, setSlug] = useState('')
  const [notes, setNotes] = useState('')
  const [search, setSearch] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [persistMessage, setPersistMessage] = useState<string | null>(null)
  const [pendingQueue, setPendingQueue] = useState<PendingQueue | null>(null)
  const [queueError, setQueueError] = useState<string | null>(null)
  const [queueLoading, setQueueLoading] = useState(true)
  const [queueSelect, setQueueSelect] = useState('')

  const loadPendingQueue = useCallback(async () => {
    setQueueLoading(true)
    setQueueError(null)
    try {
      const res = await fetch('/api/admin/agent?queue=listado-extendido')
      const data = (await res.json()) as PendingQueue & { error?: string }
      if (!res.ok) throw new Error(data.error || res.statusText)
      setQueueSelect('')
      setPendingQueue({
        count: data.count,
        prefix: data.prefix,
        artists: data.artists || [],
      })
    } catch (e) {
      setPendingQueue(null)
      setQueueError(e instanceof Error ? e.message : 'No se pudo cargar la cola')
    } finally {
      setQueueLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPendingQueue()
  }, [loadPendingQueue])

  function applySlugFromName() {
    setSlug(toSlug(artistName))
  }

  function onPickFromQueue(value: string) {
    setQueueSelect(value)
    if (!value) return
    const row = pendingQueue?.artists.find((a) => a.slug === value)
    if (!row) return
    setArtistName(row.name)
    setSlug(row.slug)
    setResult(null)
    setSaved(false)
    setPersistMessage(null)
    setError(null)
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!artistName.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)
    setSaved(false)
    setPersistMessage(null)

    try {
      const res = await fetch('/api/admin/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, artistName, notes, search }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || res.statusText)
      }

      const json = (await res.json()) as {
        artist?: Record<string, unknown>
        saved?: boolean
        row?: { id?: string }
        dbError?: string
      }
      const artist = json.artist
      if (!artist || typeof artist !== 'object') {
        throw new Error('Respuesta del servidor sin objeto artist')
      }
      setResult(artist)
      if (json.saved) {
        setSaved(true)
        setPersistMessage(
          json.row?.id
            ? `Guardado en Supabase (id: ${json.row.id}).`
            : 'Guardado en Supabase.',
        )
        void loadPendingQueue()
      } else if (json.dbError) {
        setPersistMessage(
          `No se pudo escribir en la base automáticamente: ${json.dbError} Puedes usar «Guardar en BD» abajo o revisar credenciales en el servidor.`,
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!result) return
    setError(null)

    try {
      await adminCreate('artists', result)
      setSaved(true)
      setPersistMessage('Artista guardado correctamente en la base de datos.')
      void loadPendingQueue()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  function handleDownload() {
    if (!result) return
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-[#12121f] text-gray-200 p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-white">Agente IA — Generador de Biografías</h1>

        <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-amber-100">Prioridad editorial: cola «listado extendido»</h2>
          <p className="text-sm text-amber-100/90 leading-relaxed">
            Hay fichas en la base que siguen con la bio en español mínima generada al dar de alta el listado
            extendido (empieza por «Incluido en el listado extendido…»).{' '}
            <strong className="text-amber-50 font-medium">
              Redacta o genera con IA solo esas entradas
            </strong>{' '}
            hasta vaciar la cola; evita reescribir artistas que ya tienen texto definitivo.
          </p>
          {queueLoading && (
            <p className="text-xs text-amber-200/70">Cargando cola…</p>
          )}
          {queueError && (
            <p className="text-xs text-red-300">{queueError}</p>
          )}
          {!queueLoading && pendingQueue && (
            <>
              <p className="text-sm text-amber-50">
                Pendientes: <strong>{pendingQueue.count}</strong>
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <label htmlFor="queuePick" className="text-xs text-amber-200/80 shrink-0">
                  Elegir de la cola
                </label>
                <select
                  id="queuePick"
                  value={queueSelect}
                  onChange={(e) => onPickFromQueue(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 rounded-md bg-[#12121f] border border-amber-900/40 text-gray-200 text-sm focus:outline-none focus:border-amber-600"
                >
                  <option value="">— Selecciona un artista pendiente —</option>
                  {pendingQueue.artists.map((a) => (
                    <option key={a.slug} value={a.slug}>
                      {a.name} ({a.slug})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => loadPendingQueue()}
                  className="px-3 py-2 rounded-md bg-amber-900/40 hover:bg-amber-800/50 text-amber-100 text-xs border border-amber-800/50"
                >
                  Actualizar cola
                </button>
              </div>
              {queueSelect ? (
                <a
                  href={`/${lang}/artists/${queueSelect}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs text-amber-300 hover:text-amber-200 underline"
                >
                  Ver ficha pública (nueva pestaña)
                </a>
              ) : null}
            </>
          )}
        </div>

        <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6">
          <form onSubmit={handleGenerate} className="space-y-5">
            <div>
              <label htmlFor="artistName" className="block text-sm font-medium text-gray-300 mb-1">
                Nombre del artista
              </label>
              <input
                id="artistName"
                type="text"
                required
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                placeholder="Ej: Charlotte de Witte"
                className="w-full px-3 py-2 rounded-md bg-[#12121f] border border-[#2a2a4a] text-gray-200 text-sm focus:outline-none focus:border-[#4a4a6a]"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <label htmlFor="slug" className="block text-sm font-medium text-gray-300">
                  Slug
                </label>
                <button
                  type="button"
                  onClick={applySlugFromName}
                  className="text-xs text-emerald-400 hover:text-emerald-300 underline"
                >
                  Generar slug desde el nombre
                </button>
              </div>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-[#12121f] border border-[#2a2a4a] text-gray-200 text-sm focus:outline-none focus:border-[#4a4a6a]"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">
                Notas editoriales (opcional)
              </label>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Indicaciones adicionales para el agente..."
                className="w-full px-3 py-2 rounded-md bg-[#12121f] border border-[#2a2a4a] text-gray-200 text-sm focus:outline-none focus:border-[#4a4a6a] resize-y"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="search"
                type="checkbox"
                checked={search}
                onChange={(e) => setSearch(e.target.checked)}
                className="w-4 h-4 rounded border-[#2a2a4a] bg-[#12121f] text-emerald-600 focus:ring-emerald-600"
              />
              <label htmlFor="search" className="text-sm text-gray-300">
                Buscar información en la web (SerpAPI)
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !artistName.trim()}
              className="px-6 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Generar
            </button>
          </form>
        </div>

        {loading && (
          <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6 text-center">
            <p className="text-emerald-400 animate-pulse text-lg">Generando biografía con IA...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {persistMessage && (
          <div
            className={`rounded-xl p-4 border text-sm ${
              saved
                ? 'bg-emerald-900/20 border-emerald-700/40 text-emerald-200'
                : 'bg-amber-900/20 border-amber-700/40 text-amber-100'
            }`}
          >
            {persistMessage}
          </div>
        )}

        {result && (
          <div className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Resultado</h2>

            <textarea
              readOnly
              value={JSON.stringify(result, null, 2)}
              rows={20}
              className="w-full px-3 py-2 rounded-md bg-[#12121f] border border-[#2a2a4a] text-gray-300 text-sm font-mono focus:outline-none resize-y"
            />

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saved}
                className="px-6 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saved ? 'Ya en BD' : 'Guardar en BD'}
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-md bg-[#2a2a4a] hover:bg-[#3a3a5a] text-gray-200 text-sm transition-colors"
              >
                Descargar JSON
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
