export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getTikTokUser, getTikTokVideos, computeMetrics } from '@/lib/tiktok'
import { getSupabaseAdmin } from '@/lib/supabase'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { niche, objectif, contexte } = body

    const supabase = getSupabaseAdmin()

    // 1. Récupère le compte TikTok
    const { data: account, error } = await supabase
      .from('tiktok_accounts')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !account) {
      return NextResponse.json({ error: 'No TikTok account connected' }, { status: 404 })
    }

    // 2. Récupère profil + vidéos en parallèle
    const [user, videos] = await Promise.all([
      getTikTokUser(account.access_token),
      getTikTokVideos(account.access_token, 20),
    ])

    const metrics = computeMetrics(videos)

    // 3. Construit le prompt avec les vraies données
    const engagementRate = metrics
      ? (((metrics.avgLikes + metrics.avgComments + metrics.avgShares) / metrics.avgViews) * 100).toFixed(1)
      : '0'

    const systemPrompt = `Tu es un expert TikTok Growth Strategist. Tu analyses des comptes TikTok avec précision et fournis des audits actionnables et honnêtes.

BARÈMES DE RÉFÉRENCE :
- Engagement moyen : 5-8% (bon > 8%, excellent > 12%, faible < 3%)
- Ratio vues/abonnés sain : > 30%
- Fréquence recommandée croissance : 1-3 vidéos/jour
- Taux de complétion idéal : > 50%

JSON STRICT — zéro texte avant ou après :
{
  "score_global": <0-10>,
  "score_profil": <0-10>,
  "score_contenu": <0-10>,
  "score_engagement": <0-10>,
  "score_croissance": <0-10>,
  "score_monetisation": <0-10>,
  "synthese": "<2-3 phrases honnêtes>",
  "points_forts": [{"icon":"✅","label":"<titre>","text":"<observation chiffrée>"}],
  "points_faibles": [{"icon":"⚠️","label":"<titre>","text":"<problème précis>"}],
  "actions_prioritaires": [{"icon":"🎯","label":"Action #N — <nom>","text":"<action concrète avec résultat attendu>"}],
  "analyse_contenu": {
    "frequence_verdict": "<verdict>",
    "format_recommande": "<format>",
    "heure_recommandee": "<créneaux>",
    "type_contenu_manquant": "<ce qui manque>"
  },
  "analyse_audience": {
    "profil_audience": "<qui est l'audience>",
    "gap_audience": "<écart>",
    "strategie_acquisition": "<comment attirer la bonne audience>"
  },
  "potentiel_monetisation": {
    "niveau": "<faible|moyen|élevé|très élevé>",
    "canaux_recommandes": ["<canal>"],
    "seuil_atteint": "<statut monétisation>",
    "prochaine_etape": "<action>"
  },
  "objectif_30_jours": "<objectif réaliste chiffré>",
  "objectif_90_jours": "<objectif réaliste chiffré>"
}`

    const userPrompt = `Analyse ce compte TikTok avec les données réelles.

PROFIL :
- Username : @${user.username}
- Nom : ${user.display_name}
- Abonnés : ${user.follower_count.toLocaleString()}
- Abonnements : ${user.following_count.toLocaleString()}
- Likes totaux : ${user.likes_count.toLocaleString()}
- Vidéos publiées : ${user.video_count}
- Bio : "${user.bio_description}"
- Vérifié : ${user.is_verified ? 'Oui' : 'Non'}
- Niche déclarée : ${niche || 'Non spécifiée'}
- Objectif : ${objectif || 'Croissance'}

MÉTRIQUES (${videos.length} dernières vidéos) :
- Vues totales récentes : ${metrics?.totalViews.toLocaleString() || 0}
- Vues moyennes/vidéo : ${metrics?.avgViews.toLocaleString() || 0}
- Likes moyens : ${metrics?.avgLikes.toLocaleString() || 0}
- Commentaires moyens : ${metrics?.avgComments.toLocaleString() || 0}
- Partages moyens : ${metrics?.avgShares.toLocaleString() || 0}
- Taux d'engagement calculé : ${engagementRate}%
- Ratio vues/abonnés : ${user.follower_count > 0 ? ((metrics?.avgViews || 0) / user.follower_count * 100).toFixed(0) : 0}%
- Fréquence de publication : ${metrics?.frequency || 0} vidéos/semaine
- Vidéos publiées (28j) : ${metrics?.videoCount28j || 0}
- Meilleure vidéo : ${metrics?.bestVideo?.view_count.toLocaleString() || 0} vues

TOP 5 VIDÉOS :
${videos.slice(0,5).map((v,i) => `${i+1}. "${v.title || v.video_description?.slice(0,60)}" — ${v.view_count.toLocaleString()} vues, ${v.like_count} likes, ${v.comment_count} commentaires`).join('\n')}

CONTEXTE : ${contexte || 'Aucun contexte supplémentaire.'}

Génère l'audit complet. JSON uniquement.`

    // 4. Appel Claude avec streaming
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    // 5. Stream la réponse au client
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Envoie d'abord les données brutes TikTok
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({
              type: 'tiktok_data',
              user,
              metrics,
              videos: videos.slice(0, 10),
            })}\n\n`
          ))

          // Stream les tokens de l'audit IA
          let fullText = ''
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              fullText += chunk.delta.text
              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({ type: 'delta', text: chunk.delta.text })}\n\n`
              ))
            }
          }

          // Parse et sauvegarde l'audit en base
          const auditResult = (() => {
            const cleaned = fullText.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```\s*$/i,'').trim()
            try { return JSON.parse(cleaned) } catch { return null }
          })()

          if (auditResult) {
            await supabase.from('tiktok_audits').insert({
              open_id: user.open_id,
              username: user.username,
              niche,
              objectif,
              audit_result: auditResult,
              tiktok_data: { user, metrics, videos: videos.slice(0,10) },
              created_at: new Date().toISOString(),
            })
          }

          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'done', audit: auditResult })}\n\n`
          ))
          controller.close()

        } catch (err) {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'error', message: String(err) })}\n\n`
          ))
          controller.close()
        }
      }
    })

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })

  } catch (err) {
    console.error('[/api/tiktok/analytics]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
