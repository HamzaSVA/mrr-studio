export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens, getTikTokUser } from '@/lib/tiktok'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  // L'utilisateur a refusé l'autorisation
  if (error) {
    return NextResponse.redirect(`${appUrl}/dashboard?error=auth_denied`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/dashboard?error=missing_params`)
  }

  try {
    const supabase = getSupabaseAdmin()

    // 1. Vérifie que le state est valide (anti-CSRF)
    const { data: stateData } = await supabase
      .from('oauth_states')
      .select('state')
      .eq('state', state)
      .single()

    if (!stateData) {
      return NextResponse.redirect(`${appUrl}/dashboard?error=invalid_state`)
    }

    // Supprime le state utilisé
    await supabase.from('oauth_states').delete().eq('state', state)

    // 2. Échange le code contre les tokens
    const tokens = await exchangeCodeForTokens(code)

    // 3. Récupère le profil TikTok
    const tikTokUser = await getTikTokUser(tokens.access_token)

    // 4. Upsert en base : tiktok_accounts
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    const refreshExpiresAt = new Date(Date.now() + tokens.refresh_expires_in * 1000).toISOString()

    const { error: upsertError } = await supabase
      .from('tiktok_accounts')
      .upsert({
        open_id: tikTokUser.open_id,
        username: tikTokUser.username,
        display_name: tikTokUser.display_name,
        avatar_url: tikTokUser.avatar_url,
        follower_count: tikTokUser.follower_count,
        following_count: tikTokUser.following_count,
        likes_count: tikTokUser.likes_count,
        video_count: tikTokUser.video_count,
        bio: tikTokUser.bio_description,
        is_verified: tikTokUser.is_verified,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
        refresh_expires_at: refreshExpiresAt,
        scope: tokens.scope,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'open_id'
      })

    if (upsertError) throw upsertError

    // 5. Redirige vers le dashboard avec succès
    return NextResponse.redirect(
      `${appUrl}/dashboard?connected=true&username=${tikTokUser.username}`
    )

  } catch (err) {
    console.error('[/api/auth/callback]', err)
    return NextResponse.redirect(`${appUrl}/dashboard?error=auth_failed`)
  }
}
