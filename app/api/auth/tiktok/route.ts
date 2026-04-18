export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getTikTokAuthUrl } from '@/lib/tiktok'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Génère un state aléatoire pour sécuriser l'OAuth (CSRF protection)
    const state = crypto.randomUUID()

    // Stocke le state en base pour vérification au retour
    const supabase = getSupabaseAdmin()
    await supabase
      .from('oauth_states')
      .insert({ state, created_at: new Date().toISOString() })

    // Redirige vers TikTok
    const authUrl = getTikTokAuthUrl(state)
    return NextResponse.redirect(authUrl)

  } catch (error) {
    console.error('[/api/auth/tiktok]', error)
    return NextResponse.json({ error: 'OAuth init failed' }, { status: 500 })
  }
}
