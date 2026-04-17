import { NextRequest, NextResponse } from 'next/server'
import { getTikTokVideos, computeMetrics } from '@/lib/tiktok'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const count = Math.min(parseInt(searchParams.get('count') || '20'), 20)

    const supabase = getSupabaseAdmin()

    const { data: account, error } = await supabase
      .from('tiktok_accounts')
      .select('access_token, open_id')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !account) {
      return NextResponse.json({ error: 'No TikTok account connected' }, { status: 404 })
    }

    // Récupère les vidéos depuis TikTok API
    const videos = await getTikTokVideos(account.access_token, count)

    // Calcule les métriques agrégées
    const metrics = computeMetrics(videos)

    // Sauvegarde en cache dans Supabase
    if (videos.length > 0) {
      await supabase
        .from('tiktok_videos_cache')
        .upsert(
          videos.map(v => ({
            video_id: v.id,
            open_id: account.open_id,
            title: v.title,
            description: v.video_description,
            view_count: v.view_count,
            like_count: v.like_count,
            comment_count: v.comment_count,
            share_count: v.share_count,
            duration: v.duration,
            cover_url: v.cover_image_url,
            share_url: v.share_url,
            created_at_tiktok: new Date(v.create_time * 1000).toISOString(),
            cached_at: new Date().toISOString(),
          })),
          { onConflict: 'video_id' }
        )
    }

    return NextResponse.json({
      success: true,
      videos,
      metrics,
      count: videos.length,
    })

  } catch (err) {
    console.error('[/api/tiktok/videos]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
