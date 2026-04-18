export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getTikTokUser, refreshAccessToken } from '@/lib/tiktok'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    // Récupère le compte TikTok stocké (le plus récent)
    const { data: account, error } = await supabase
      .from('tiktok_accounts')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !account) {
      return NextResponse.json({ error: 'No TikTok account connected' }, { status: 404 })
    }

    // Vérifie si le token est expiré
    const tokenExpired = new Date(account.token_expires_at) < new Date()

    let accessToken = account.access_token

    if (tokenExpired) {
      // Refresh automatique du token
      try {
        const newTokens = await refreshAccessToken(account.refresh_token)
        accessToken = newTokens.access_token

        // Met à jour les tokens en base
        await supabase
          .from('tiktok_accounts')
          .update({
            access_token: newTokens.access_token,
            refresh_token: newTokens.refresh_token,
            token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
            refresh_expires_at: new Date(Date.now() + newTokens.refresh_expires_in * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('open_id', account.open_id)

      } catch {
        return NextResponse.json(
          { error: 'Token expired and refresh failed. Please reconnect TikTok.' },
          { status: 401 }
        )
      }
    }

    // Récupère les données fraîches depuis TikTok
    const freshUser = await getTikTokUser(accessToken)

    // Met à jour les stats en base
    await supabase
      .from('tiktok_accounts')
      .update({
        follower_count: freshUser.follower_count,
        following_count: freshUser.following_count,
        likes_count: freshUser.likes_count,
        video_count: freshUser.video_count,
        avatar_url: freshUser.avatar_url,
        bio: freshUser.bio_description,
        is_verified: freshUser.is_verified,
        updated_at: new Date().toISOString(),
      })
      .eq('open_id', account.open_id)

    return NextResponse.json({
      success: true,
      user: freshUser,
      connected_at: account.created_at,
    })

  } catch (err) {
    console.error('[/api/tiktok/profile]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
