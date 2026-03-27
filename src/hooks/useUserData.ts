// ============================================
// OPTIMAL BREAKS — User Hooks
// Favorites, sightings, attendance, ratings
// ============================================

'use client'

import { useCallback, useEffect, useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import type { ProfileRow } from '@/types/database'

// Tipos manuales: Insert/Omit no encajan con `GenericTable` de supabase-js → mutaciones inferidas como `never`; el runtime es correcto.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase: any = createBrowserSupabase()

// =============================================
// FAVORITE ARTISTS
// =============================================
export function useFavoriteArtists() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) { setFavorites([]); setLoading(false); return }
    const { data } = await supabase.from('favorite_artists').select('artist_id').eq('user_id', user.id)
    setFavorites(data?.map((d: any) => d.artist_id) || [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const toggle = async (artistId: string) => {
    if (!user) return
    if (favorites.includes(artistId)) {
      await supabase.from('favorite_artists').delete().eq('user_id', user.id).eq('artist_id', artistId)
      setFavorites((f) => f.filter((id) => id !== artistId))
    } else {
      await supabase.from('favorite_artists').insert({ user_id: user.id, artist_id: artistId })
      setFavorites((f) => [...f, artistId])
    }
  }

  return { favorites, loading, toggle, isFavorite: (id: string) => favorites.includes(id), refetch: fetch }
}

// =============================================
// FAVORITE LABELS
// =============================================
export function useFavoriteLabels() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) { setFavorites([]); setLoading(false); return }
    const { data } = await supabase.from('favorite_labels').select('label_id').eq('user_id', user.id)
    setFavorites(data?.map((d: any) => d.label_id) || [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const toggle = async (labelId: string) => {
    if (!user) return
    if (favorites.includes(labelId)) {
      await supabase.from('favorite_labels').delete().eq('user_id', user.id).eq('label_id', labelId)
      setFavorites((f) => f.filter((id) => id !== labelId))
    } else {
      await supabase.from('favorite_labels').insert({ user_id: user.id, label_id: labelId })
      setFavorites((f) => [...f, labelId])
    }
  }

  return { favorites, loading, toggle, isFavorite: (id: string) => favorites.includes(id), refetch: fetch }
}

// =============================================
// SAVED MIXES
// =============================================
export function useSavedMixes() {
  const { user } = useAuth()
  const [saved, setSaved] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) { setSaved([]); setLoading(false); return }
    const { data } = await supabase.from('saved_mixes').select('mix_id').eq('user_id', user.id)
    setSaved(data?.map((d: any) => d.mix_id) || [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const toggle = async (mixId: string) => {
    if (!user) return
    if (saved.includes(mixId)) {
      await supabase.from('saved_mixes').delete().eq('user_id', user.id).eq('mix_id', mixId)
      setSaved((s) => s.filter((id) => id !== mixId))
    } else {
      await supabase.from('saved_mixes').insert({ user_id: user.id, mix_id: mixId })
      setSaved((s) => [...s, mixId])
    }
  }

  return { saved, loading, toggle, isSaved: (id: string) => saved.includes(id), refetch: fetch }
}

// =============================================
// EVENT ATTENDANCE
// =============================================
type AttendanceStatus = 'wishlist' | 'attending' | 'attended' | null

export function useEventAttendance() {
  const { user } = useAuth()
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) { setAttendance({}); setLoading(false); return }
    const { data } = await supabase.from('event_attendance').select('event_id, status').eq('user_id', user.id)
    const map: Record<string, AttendanceStatus> = {}
    data?.forEach((d: any) => { map[d.event_id] = d.status })
    setAttendance(map)
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const setStatus = async (eventId: string, status: AttendanceStatus) => {
    if (!user) return
    if (status === null) {
      await supabase.from('event_attendance').delete().eq('user_id', user.id).eq('event_id', eventId)
      setAttendance((a) => { const n = { ...a }; delete n[eventId]; return n })
    } else {
      await supabase.from('event_attendance').upsert(
        { user_id: user.id, event_id: eventId, status },
        { onConflict: 'user_id,event_id' }
      )
      setAttendance((a) => ({ ...a, [eventId]: status }))
    }
  }

  return { attendance, loading, setStatus, getStatus: (id: string): AttendanceStatus => attendance[id] || null, refetch: fetch }
}

// =============================================
// ARTIST SIGHTINGS
// =============================================
export interface Sighting {
  id: string
  artist_id: string
  seen_at: string
  venue: string
  city: string
  country: string
  event_name: string
  notes: string
  rating: number | null
}

export function useArtistSightings() {
  const { user } = useAuth()
  const [sightings, setSightings] = useState<Sighting[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) { setSightings([]); setLoading(false); return }
    const { data } = await supabase.from('artist_sightings').select('*').eq('user_id', user.id).order('seen_at', { ascending: false })
    setSightings((data as Sighting[]) || [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const add = async (sighting: Omit<Sighting, 'id'>) => {
    if (!user) return
    const { data } = await supabase.from('artist_sightings').insert({ ...sighting, user_id: user.id }).select().single()
    if (data) setSightings((s) => [data as Sighting, ...s])
  }

  const remove = async (id: string) => {
    if (!user) return
    await supabase.from('artist_sightings').delete().eq('id', id).eq('user_id', user.id)
    setSightings((s) => s.filter((sight) => sight.id !== id))
  }

  return { sightings, loading, add, remove, refetch: fetch }
}

// =============================================
// EVENT RATINGS
// =============================================
export function useEventRatings() {
  const { user } = useAuth()
  const [ratings, setRatings] = useState<Record<string, { rating: number; review: string }>>({})
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) { setRatings({}); setLoading(false); return }
    const { data } = await supabase.from('event_ratings').select('event_id, rating, review').eq('user_id', user.id)
    const map: Record<string, { rating: number; review: string }> = {}
    data?.forEach((d: any) => { map[d.event_id] = { rating: d.rating, review: d.review || '' } })
    setRatings(map)
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const rate = async (eventId: string, rating: number, review: string = '') => {
    if (!user) return
    await supabase.from('event_ratings').upsert({ user_id: user.id, event_id: eventId, rating, review }, { onConflict: 'user_id,event_id' })
    setRatings((r) => ({ ...r, [eventId]: { rating, review } }))
  }

  return { ratings, loading, rate, getRating: (id: string) => ratings[id] || null, refetch: fetch }
}

// =============================================
// USER PROFILE
// =============================================
export type UserProfile = ProfileRow

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) { setProfile(null); setLoading(false); return }
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(data as UserProfile | null)
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const update = async (updates: Partial<Omit<ProfileRow, 'id'>>) => {
    if (!user) return
    const { data } = await supabase.from('profiles').update(updates).eq('id', user.id).select().single()
    if (data) setProfile(data as UserProfile)
  }

  return { profile, loading, update, refetch: fetch }
}
