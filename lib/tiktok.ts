// ─────────────────────────────────────────────────────────
// LIB TIKTOK OAUTH — Gestion complète du flow OAuth TikTok
// ─────────────────────────────────────────────────────────

const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/'
const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/'
const TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2'

// ── Types ────────────────────────────────────────────────

export interface TikTokTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  refresh_expires_in: number
  scope: string
  token_type: string
  open_id: string
}

export interface TikTokUser {
  open_id: string
  union_id: string
  avatar_url: string
  avatar_url_100: string
  display_name: string
  username: string
  follower_count: number
  following_count: number
  likes_count: number
  video_count: number
  bio_description: string
  profile_deep_link: string
  is_verified: boolean
}

export interface TikTokVideo {
  id: string
  title: string
  cover_image_url: string
  share_url: string
  video_description: string
  duration: number
  height: number
  width: number
  view_count: number
  like_count: number
  comment_count: number
  share_count: number
  create_time: number
}

export interface TikTokAnalytics {
  followers_count: number
  likes_count: number
  video_views: number
  profile_views: number
  comments_count: number
  shares_count: number
}

// ── Génération de l'URL d'autorisation ──────────────────

export function getTikTokAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    response_type: 'code',
    scope: [
      'user.info.basic',
      'user.info.profile',
      'user.info.stats',
      'video.list',
    ].join(','),
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    state,
  })

  return `${TIKTOK_AUTH_URL}?${params.toString()}`
}

// ── Échange du code contre les tokens ───────────────────

export async function exchangeCodeForTokens(code: string): Promise<TikTokTokens> {
  const body = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    client_secret: process.env.TIKTOK_CLIENT_SECRET!,
    code,
    grant_type: 'authorization_code',
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
  })

  const res = await fetch(TIKTOK_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`TikTok token exchange failed: ${err}`)
  }

  const data = await res.json()

  if (data.error) {
    throw new Error(`TikTok OAuth error: ${data.error_description || data.error}`)
  }

  return data
}

// ── Refresh du token ─────────────────────────────────────

export async function refreshAccessToken(refreshToken: string): Promise<TikTokTokens> {
  const body = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    client_secret: process.env.TIKTOK_CLIENT_SECRET!,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const res = await fetch(TIKTOK_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) throw new Error('Token refresh failed')
  return res.json()
}

// ── Récupération du profil utilisateur ──────────────────

export async function getTikTokUser(accessToken: string): Promise<TikTokUser> {
  const fields = [
    'open_id', 'union_id', 'avatar_url', 'avatar_url_100',
    'display_name', 'username', 'follower_count', 'following_count',
    'likes_count', 'video_count', 'bio_description',
    'profile_deep_link', 'is_verified',
  ].join(',')

  const res = await fetch(`${TIKTOK_API_BASE}/user/info/?fields=${fields}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) throw new Error('Failed to fetch TikTok user')

  const data = await res.json()

  if (data.error?.code !== 'ok' && data.error?.code !== 0) {
    throw new Error(`TikTok API error: ${data.error?.message}`)
  }

  return data.data.user
}

// ── Récupération des vidéos ──────────────────────────────

export async function getTikTokVideos(
  accessToken: string,
  maxCount = 20
): Promise<TikTokVideo[]> {
  const fields = [
    'id', 'title', 'cover_image_url', 'share_url',
    'video_description', 'duration', 'height', 'width',
    'view_count', 'like_count', 'comment_count', 'share_count',
    'create_time',
  ].join(',')

  const res = await fetch(`${TIKTOK_API_BASE}/video/list/?fields=${fields}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ max_count: maxCount }),
  })

  if (!res.ok) throw new Error('Failed to fetch TikTok videos')

  const data = await res.json()

  if (data.error?.code !== 'ok' && data.error?.code !== 0) {
    throw new Error(`TikTok API error: ${data.error?.message}`)
  }

  return data.data?.videos || []
}

// ── Calcul des métriques agrégées ────────────────────────

export function computeMetrics(videos: TikTokVideo[]) {
  if (!videos.length) return null

  const sorted = [...videos].sort((a, b) => b.view_count - a.view_count)
  const totalViews = videos.reduce((s, v) => s + v.view_count, 0)
  const totalLikes = videos.reduce((s, v) => s + v.like_count, 0)
  const totalComments = videos.reduce((s, v) => s + v.comment_count, 0)
  const totalShares = videos.reduce((s, v) => s + v.share_count, 0)
  const avgViews = Math.round(totalViews / videos.length)
  const avgLikes = Math.round(totalLikes / videos.length)
  const avgComments = Math.round(totalComments / videos.length)
  const avgShares = Math.round(totalShares / videos.length)
  const engagementRate = avgViews > 0
    ? (((avgLikes + avgComments + avgShares) / avgViews) * 100).toFixed(1)
    : '0'

  // Vidéos des 28 derniers jours
  const now = Date.now() / 1000
  const recent = videos.filter(v => now - v.create_time < 28 * 24 * 3600)
  const recentViews = recent.reduce((s, v) => s + v.view_count, 0)

  // Fréquence (vidéos par semaine sur les 28j)
  const frequency = recent.length > 0
    ? +(recent.length / 4).toFixed(1)
    : 0

  return {
    totalViews,
    avgViews,
    avgLikes,
    avgComments,
    avgShares,
    engagementRate,
    recentViews,
    frequency,
    bestVideo: sorted[0],
    videoCount28j: recent.length,
  }
}
