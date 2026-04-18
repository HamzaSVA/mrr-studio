'use client'
import { useState, useCallback, useEffect } from 'react'

// ── Helpers ──────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard?.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500) }}
      style={{ background: ok ? '#1D9E75' : 'transparent', border: `1px solid ${ok ? '#1D9E75' : '#3d3d5c'}`, borderRadius: 6, padding: '3px 10px', color: ok ? '#fff' : '#9ca3af', fontSize: 11, cursor: 'pointer', transition: 'all .15s' }}>
      {ok ? '✓ Copié' : 'Copier'}
    </button>
  )
}

function SL({ txt }: { txt: string }) {
  return <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase' as const, color: '#6b7280', marginBottom: 5 }}>{txt}</div>
}

function safeParseJSON(raw: string) {
  const c = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
  try { return JSON.parse(c) } catch { const m = c.match(/\{[\s\S]*\}/); if (m) { try { return JSON.parse(m[0]) } catch { } } return null }
}

// ── Types ────────────────────────────────────────────────
interface TikTokUser { username: string; display_name: string; follower_count: number; following_count: number; likes_count: number; video_count: number; bio_description: string; avatar_url: string; is_verified: boolean }
interface TikTokVideo { id: string; title: string; video_description: string; view_count: number; like_count: number; comment_count: number; share_count: number; cover_image_url: string; create_time: number }

// ── Constantes ───────────────────────────────────────────
const NICHES = ['Business en ligne', 'E-commerce', 'Fitness & Sport', 'Nutrition & Santé', 'Finance & Investissement', 'Marketing Digital', 'Coaching de vie', 'Productivité', 'Tech & IA', 'Immobilier']
const OBJECTIFS_TK = [{ val: 'viral', label: 'Viralité', icon: '🔥' }, { val: 'engagement', label: 'Engagement', icon: '💬' }, { val: 'lead', label: 'Lead', icon: '🎯' }, { val: 'vente', label: 'Vente', icon: '💰' }]
const FORMATS = ['15s', '30s', '60s', '90s']
const TONS = ['Autoritaire', 'Éducatif', 'Authentique', 'Storytelling', 'Humoristique', 'Direct', 'Inspirant']
const PR_CANAUX = ['DM TikTok', 'DM Instagram', 'LinkedIn', 'Email', 'SMS / WhatsApp']
const PR_PROFILS = ['Créateur de contenu', 'Entrepreneur', 'Coach / Consultant', 'E-commerçant', 'Dirigeant', 'Expert / Freelance']
const PR_SEQUENCES = [{ val: 'message_unique', label: 'Message unique' }, { val: 'sequence_3j', label: 'Séquence 3 jours' }, { val: 'sequence_5j', label: 'Séquence 5 jours' }, { val: 'sequence_closing', label: 'Séquence closing' }]
const PR_OBJECTIFS = [{ val: 'rdv', label: 'Prise de RDV', icon: '📅' }, { val: 'info', label: 'Info / Réponse', icon: '💬' }, { val: 'lien', label: 'Envoi ressource', icon: '🔗' }, { val: 'doux', label: 'Lien doux', icon: '🤝' }]
const NICHES_AUDIT = ['Business / Entrepreneuriat', 'Marketing Digital', 'Finance / Investissement', 'Coaching de vie', 'Fitness / Sport', 'Nutrition / Santé', 'E-commerce', 'Tech / IA', 'Développement personnel', 'Autre']

// ── Composant principal ───────────────────────────────────
export default function Dashboard() {
  const [tool, setTool] = useState<'tiktok' | 'prosp' | 'audit'>('tiktok')
  const [tiktokUser, setTiktokUser] = useState<TikTokUser | null>(null)
  const [tiktokVideos, setTiktokVideos] = useState<TikTokVideo[]>([])
  const [connecting, setConnecting] = useState(false)

  // Vérifie si TikTok est connecté au chargement
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') === 'true') {
      fetchTikTokData()
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [])

  async function fetchTikTokData() {
    try {
      setConnecting(true)
      const [profileRes, videosRes] = await Promise.all([
        fetch('/api/tiktok/profile'),
        fetch('/api/tiktok/videos?count=20')
      ])
      if (profileRes.ok) { const d = await profileRes.json(); setTiktokUser(d.user) }
      if (videosRes.ok) { const d = await videosRes.json(); setTiktokVideos(d.videos || []) }
    } catch (e) { console.error(e) }
    finally { setConnecting(false) }
  }

  const S: Record<string, React.CSSProperties> = {
    app: { minHeight: '100vh', background: '#08081a', color: '#e2e8f0', fontFamily: "'DM Sans', system-ui, sans-serif", display: 'flex', flexDirection: 'column' },
    header: { borderBottom: '1px solid #1a1a30', padding: '0 18px', display: 'flex', alignItems: 'center', gap: 10, height: 50, flexShrink: 0 },
    switcher: { display: 'flex', gap: 2, marginLeft: 16, background: '#111124', borderRadius: 9, padding: 3, border: '1px solid #2d2d4a' },
    main: { flex: 1, display: 'flex', overflow: 'hidden' },
  }

  return (
    <div style={S.app}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#2d2d4a;border-radius:2px}select,input,textarea{font-family:inherit}`}</style>

      {/* HEADER */}
      <div style={S.header}>
        <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>🚀</div>
        <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em' }}>MRR Studio</span>
        <span style={{ background: '#141428', border: '1px solid #2d2d4a', borderRadius: 5, padding: '2px 7px', fontSize: 10, color: '#9ca3af' }}>Growth OS</span>

        <div style={S.switcher}>
          {([['tiktok', '🎬', 'Script TikTok', 'linear-gradient(135deg,#4f46e5,#7c3aed)'],
            ['prosp', '✉️', 'Prospection', 'linear-gradient(135deg,#0ea5e9,#6366f1)'],
            ['audit', '📊', 'Audit TikTok', 'linear-gradient(135deg,#D4537E,#7c3aed)']] as const).map(([v, icon, label, grad]) => (
              <button key={v} onClick={() => setTool(v)}
                style={{ background: tool === v ? grad : 'transparent', border: 'none', borderRadius: 7, padding: '5px 13px', fontSize: 11, fontWeight: 600, color: tool === v ? '#fff' : '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all .15s' }}>
                <span>{icon}</span>{label}
              </button>
            ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {tiktokUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0a1a12', border: '1px solid #1D9E7533', borderRadius: 8, padding: '4px 12px' }}>
              <span style={{ fontSize: 10, color: '#1D9E75' }}>✓ TikTok connecté</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0' }}>@{tiktokUser.username}</span>
            </div>
          ) : (
            <a href="/api/auth/tiktok"
              style={{ background: 'linear-gradient(135deg,#ff0050,#ff4d8d)', border: 'none', borderRadius: 8, padding: '6px 14px', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
              {connecting ? '⏳ Connexion...' : '🔗 Connecter TikTok'}
            </a>
          )}
        </div>
      </div>

      {/* CONTENU */}
      <div style={S.main}>
        {tool === 'tiktok' && <TikTokTool />}
        {tool === 'prosp' && <ProspTool />}
        {tool === 'audit' && <AuditTool tiktokUser={tiktokUser} tiktokVideos={tiktokVideos} onConnect={fetchTikTokData} />}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// OUTIL SCRIPT TIKTOK
// ══════════════════════════════════════════════════════════
function TikTokTool() {
  const [form, setForm] = useState({ niche: 'Business en ligne', objectif: 'viral', format: '60s', ton: 'Autoritaire', sujet: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [script, setScript] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')
  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const generate = async () => {
    if (!form.sujet.trim()) { setError('Saisis un sujet.'); return }
    setError(''); setStatus('loading'); setScript(null)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1500,
          system: `Tu es un expert copywriter TikTok. Génère un script pour la niche "${form.niche}", ton "${form.ton}", format ${form.format}, objectif ${form.objectif}. Réponds UNIQUEMENT en JSON strict: {"titre_seo":"","hook":"","corps":{"acte1":"","pattern_interrupt":"","acte2":"","acte3":""},"cta":"","hashtags":["","","","",""],"conseil_tournage":"","overlay_text":["","",""],"duree_estimee":""}`,
          messages: [{ role: 'user', content: `Génère un script TikTok sur le sujet: "${form.sujet}". Phrases courtes, langage parlé direct, hook percutant qui stoppe le scroll. JSON uniquement.` }]
        })
      })
      const data = await res.json()
      const raw = data.content?.filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('')
      const parsed = safeParseJSON(raw)
      if (!parsed) throw new Error('Réponse invalide')
      setScript(parsed); setStatus('success')
    } catch (e) { setStatus('error'); setError(String(e)) }
  }

  const corps = script?.corps as Record<string, string> | undefined

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: 270, borderRight: '1px solid #1a1a30', padding: '14px 12px', overflowY: 'auto' as const, flexShrink: 0, display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
        <SL txt="Niche" />
        <select value={form.niche} onChange={e => upd('niche', e.target.value)} style={{ width: '100%', background: '#111124', border: '1px solid #2d2d4a', borderRadius: 7, padding: '7px 10px', color: '#e2e8f0', fontSize: 12, outline: 'none', marginBottom: 2 }}>
          {NICHES.map(n => <option key={n}>{n}</option>)}
        </select>
        <SL txt="Objectif" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 2 }}>
          {OBJECTIFS_TK.map(o => <button key={o.val} onClick={() => upd('objectif', o.val)} style={{ background: form.objectif === o.val ? '#1c1c40' : '#111124', border: `1px solid ${form.objectif === o.val ? '#4f46e5' : '#2d2d4a'}`, borderRadius: 7, padding: '6px 3px', color: form.objectif === o.val ? '#a5b4fc' : '#6b7280', fontSize: 11, cursor: 'pointer', textAlign: 'center' as const }}><div style={{ fontSize: 13, marginBottom: 1 }}>{o.icon}</div>{o.label}</button>)}
        </div>
        <SL txt="Format" />
        <div style={{ display: 'flex', gap: 3, marginBottom: 2 }}>
          {FORMATS.map(f => <button key={f} onClick={() => upd('format', f)} style={{ flex: 1, background: form.format === f ? '#1c1c40' : '#111124', border: `1px solid ${form.format === f ? '#4f46e5' : '#2d2d4a'}`, borderRadius: 7, padding: '5px 2px', color: form.format === f ? '#a5b4fc' : '#6b7280', fontSize: 11, cursor: 'pointer' }}>{f}</button>)}
        </div>
        <SL txt="Ton" />
        <select value={form.ton} onChange={e => upd('ton', e.target.value)} style={{ width: '100%', background: '#111124', border: '1px solid #2d2d4a', borderRadius: 7, padding: '7px 10px', color: '#e2e8f0', fontSize: 12, outline: 'none', marginBottom: 2 }}>
          {TONS.map(t => <option key={t}>{t}</option>)}
        </select>
        <SL txt="Sujet *" />
        <textarea value={form.sujet} onChange={e => upd('sujet', e.target.value)} placeholder="Ex: comment générer 1000€/mois en dropshipping..." rows={3} style={{ width: '100%', background: '#111124', border: '1px solid #2d2d4a', borderRadius: 7, padding: '7px 9px', color: '#e2e8f0', fontSize: 12, outline: 'none', resize: 'vertical', lineHeight: 1.5, marginBottom: 2 }} />
        {error && <div style={{ background: '#1f0a0a', border: '1px solid #7f1d1d', borderRadius: 7, padding: '7px 9px', fontSize: 11, color: '#fca5a5' }}>{error}</div>}
        <button onClick={generate} disabled={status === 'loading'} style={{ background: status === 'loading' ? '#1c1c40' : 'linear-gradient(135deg,#4f46e5,#7c3aed)', border: 'none', borderRadius: 8, padding: '9px 0', color: '#fff', fontSize: 12, fontWeight: 700, cursor: status === 'loading' ? 'not-allowed' : 'pointer', opacity: status === 'loading' ? 0.75 : 1 }}>
          {status === 'loading' ? '✨ Génération…' : '✨ Générer le script'}
        </button>
      </div>
      {/* Résultat */}
      <div style={{ flex: 1, overflowY: 'auto' as const, padding: '20px 24px' }}>
        {status === 'idle' && <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', height: '80%', gap: 10, opacity: 0.45 }}><div style={{ fontSize: 40 }}>🎬</div><div style={{ fontSize: 16, fontWeight: 700 }}>Prêt à générer</div><div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center' as const }}>Configure ton script à gauche</div></div>}
        {status === 'loading' && <div style={{ background: '#0d0d20', border: '1px solid #1e1e38', borderRadius: 12, padding: 20 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1' }} /><span style={{ fontSize: 13, color: '#a5b4fc' }}>Claude génère ton script…</span></div></div>}
        {status === 'success' && script && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div><div style={{ fontSize: 10, color: '#4b5563', textTransform: 'uppercase' as const, marginBottom: 3 }}>Script TikTok</div><h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{script.titre_seo as string}</h2></div>
              <CopyBtn text={[`🎬 ${script.titre_seo}`, `\n🔥 HOOK\n${script.hook}`, `\n📖 CORPS\n${corps?.acte1}\n⚡ ${corps?.pattern_interrupt}\n${corps?.acte2}\n${corps?.acte3}`, `\n💬 CTA\n${script.cta}`, `\n${(script.hashtags as string[])?.join(' ')}`].join('')} />
            </div>
            {[{ title: 'Hook', icon: '🔥', content: script.hook as string, color: '#E8593C' }, { title: 'CTA', icon: '💬', content: script.cta as string, color: '#1D9E75' }].map(s => (
              <div key={s.title} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, color: s.color }}>{s.icon} {s.title}</span><CopyBtn text={s.content} /></div>
                <div style={{ background: '#0d0d20', border: `1px solid ${s.color}22`, borderRadius: 8, padding: '10px 12px', borderLeft: `3px solid ${s.color}`, fontSize: 13, color: '#d1d5db', lineHeight: 1.6 }}>{s.content}</div>
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, color: '#6366f1' }}>📖 Corps</span><CopyBtn text={Object.values(corps || {}).join(' ')} /></div>
              <div style={{ background: '#0d0d20', border: '1px solid #6366f122', borderRadius: 8, padding: '10px 12px', borderLeft: '3px solid #6366f1' }}>
                {corps && Object.entries(corps).map(([k, v]) => <div key={k} style={{ marginBottom: k === 'acte3' ? 0 : 7 }}>{k === 'pattern_interrupt' ? <div style={{ background: '#6366f110', borderRadius: 5, padding: '4px 9px', fontSize: 12, color: '#c4b5fd', fontStyle: 'italic', margin: '2px 0' }}>⚡ {v}</div> : <div style={{ fontSize: 13, color: '#d1d5db', lineHeight: 1.6 }}>{v}</div>}</div>)}
              </div>
            </div>
            <div style={{ background: '#0a1a12', border: '1px solid #1D9E7533', borderRadius: 8, padding: '9px 11px', borderLeft: '3px solid #1D9E75' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#1D9E75', textTransform: 'uppercase' as const, marginBottom: 4 }}>🎥 Conseil tournage</div>
              <div style={{ fontSize: 12, color: '#d1d5db' }}>{script.conseil_tournage as string}</div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5, marginTop: 12 }}>
              {(script.hashtags as string[])?.map((h, i) => <span key={i} style={{ background: '#1c1c40', borderRadius: 5, padding: '2px 8px', fontSize: 11, color: '#a5b4fc' }}>{h}</span>)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// OUTIL PROSPECTION
// ══════════════════════════════════════════════════════════
function ProspTool() {
  const [form, setForm] = useState({ canal: 'DM TikTok', profil: 'Entrepreneur', sequence: 'message_unique', objectif_cta: 'rdv', offre: '', contexte: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [script, setScript] = useState<Record<string, string> | null>(null)
  const [error, setError] = useState('')
  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const generate = async () => {
    if (!form.offre.trim()) { setError('Saisis ton offre / service.'); return }
    setError(''); setStatus('loading'); setScript(null)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1200,
          system: `Tu es un expert en prospection et copywriting de vente. Canal: ${form.canal}. Profil prospect: ${form.profil}. Séquence: ${form.sequence}. Objectif CTA: ${form.objectif_cta}. Ton humain, authentique. JAMAIS "J'espère que ce message vous trouve bien" ou "Je me permets". JSON strict: {"objet_email":"ou null","message_principal":"","variante_courte":"","conseil_personnalisation":"","signal_a_surveiller":"","suite_si_pas_reponse":""}`,
          messages: [{ role: 'user', content: `Offre: "${form.offre}". Contexte/accroche: "${form.contexte || 'Prospection froide'}". Génère le script de prospection adapté au canal ${form.canal}. JSON uniquement.` }]
        })
      })
      const data = await res.json()
      const raw = data.content?.filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('')
      const parsed = safeParseJSON(raw)
      if (!parsed) throw new Error('Réponse invalide')
      setScript(parsed); setStatus('success')
    } catch (e) { setStatus('error'); setError(String(e)) }
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <div style={{ width: 270, borderRight: '1px solid #1a1a30', padding: '14px 12px', overflowY: 'auto' as const, flexShrink: 0, display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
        <SL txt="Canal" />
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4, marginBottom: 2 }}>
          {PR_CANAUX.map(c => <button key={c} onClick={() => upd('canal', c)} style={{ background: form.canal === c ? '#1c1c40' : '#111124', border: `1px solid ${form.canal === c ? '#4f46e5' : '#2d2d4a'}`, borderRadius: 6, padding: '4px 8px', color: form.canal === c ? '#a5b4fc' : '#6b7280', fontSize: 10, cursor: 'pointer' }}>{c}</button>)}
        </div>
        <SL txt="Profil prospect" />
        <select value={form.profil} onChange={e => upd('profil', e.target.value)} style={{ width: '100%', background: '#111124', border: '1px solid #2d2d4a', borderRadius: 7, padding: '7px 10px', color: '#e2e8f0', fontSize: 12, outline: 'none', marginBottom: 2 }}>
          {PR_PROFILS.map(p => <option key={p}>{p}</option>)}
        </select>
        <SL txt="Séquence" />
        <select value={form.sequence} onChange={e => upd('sequence', e.target.value)} style={{ width: '100%', background: '#111124', border: '1px solid #2d2d4a', borderRadius: 7, padding: '7px 10px', color: '#e2e8f0', fontSize: 12, outline: 'none', marginBottom: 2 }}>
          {PR_SEQUENCES.map(s => <option key={s.val} value={s.val}>{s.label}</option>)}
        </select>
        <SL txt="Objectif CTA" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 2 }}>
          {PR_OBJECTIFS.map(o => <button key={o.val} onClick={() => upd('objectif_cta', o.val)} style={{ background: form.objectif_cta === o.val ? '#1c1c40' : '#111124', border: `1px solid ${form.objectif_cta === o.val ? '#4f46e5' : '#2d2d4a'}`, borderRadius: 7, padding: '5px 3px', color: form.objectif_cta === o.val ? '#a5b4fc' : '#6b7280', fontSize: 10, cursor: 'pointer', textAlign: 'center' as const }}><div style={{ fontSize: 12, marginBottom: 1 }}>{o.icon}</div>{o.label}</button>)}
        </div>
        <SL txt="Offre / Service *" />
        <textarea value={form.offre} onChange={e => upd('offre', e.target.value)} placeholder="Ex: Accompagnement TikTok Growth..." rows={2} style={{ width: '100%', background: '#111124', border: '1px solid #2d2d4a', borderRadius: 7, padding: '7px 9px', color: '#e2e8f0', fontSize: 12, outline: 'none', resize: 'vertical', lineHeight: 1.5, marginBottom: 2 }} />
        <SL txt="Contexte / Accroche" />
        <textarea value={form.contexte} onChange={e => upd('contexte', e.target.value)} placeholder="Ex: J'ai vu ta vidéo sur les revenus passifs..." rows={2} style={{ width: '100%', background: '#111124', border: '1px solid #2d2d4a', borderRadius: 7, padding: '7px 9px', color: '#e2e8f0', fontSize: 12, outline: 'none', resize: 'vertical', lineHeight: 1.5, marginBottom: 2 }} />
        {error && <div style={{ background: '#1f0a0a', border: '1px solid #7f1d1d', borderRadius: 7, padding: '7px 9px', fontSize: 11, color: '#fca5a5' }}>{error}</div>}
        <button onClick={generate} disabled={status === 'loading'} style={{ background: status === 'loading' ? '#1c1c40' : 'linear-gradient(135deg,#0ea5e9,#6366f1)', border: 'none', borderRadius: 8, padding: '9px 0', color: '#fff', fontSize: 12, fontWeight: 700, cursor: status === 'loading' ? 'not-allowed' : 'pointer', opacity: status === 'loading' ? 0.75 : 1 }}>
          {status === 'loading' ? '✉️ Rédaction…' : '✉️ Générer le script'}
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' as const, padding: '20px 24px' }}>
        {status === 'idle' && <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', height: '80%', gap: 10, opacity: 0.45 }}><div style={{ fontSize: 40 }}>✉️</div><div style={{ fontSize: 16, fontWeight: 700 }}>Prêt à prospecter</div></div>}
        {status === 'loading' && <div style={{ background: '#0d0d20', border: '1px solid #1e1e38', borderRadius: 12, padding: 20 }}><span style={{ fontSize: 13, color: '#7dd3fc' }}>Claude rédige ton script…</span></div>}
        {status === 'success' && script && (
          <div>
            <div style={{ fontSize: 10, color: '#4b5563', textTransform: 'uppercase' as const, marginBottom: 12 }}>Script · {form.canal} · Pattern : {script.pattern_utilise || 'adapté'}</div>
            {script.objet_email && <div style={{ marginBottom: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, color: '#0ea5e9' }}>📧 Objet email</span><CopyBtn text={script.objet_email} /></div><div style={{ background: '#0a1a20', border: '1px solid #0ea5e922', borderRadius: 8, padding: '9px 12px', borderLeft: '3px solid #0ea5e9', fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>{script.objet_email}</div></div>}
            {[{ key: 'message_principal', title: 'Message principal', color: '#6366f1' }, { key: 'variante_courte', title: 'Variante courte (A/B)', color: '#0ea5e9' }].filter(s => script[s.key]).map(s => (
              <div key={s.key} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, color: s.color }}>{s.title}</span><CopyBtn text={script[s.key]} /></div>
                <div style={{ background: '#0d0d20', border: `1px solid ${s.color}22`, borderRadius: 8, padding: '12px 14px', borderLeft: `3px solid ${s.color}`, fontSize: 13, color: '#d1d5db', lineHeight: 1.75, whiteSpace: 'pre-line' }}>{script[s.key]}</div>
              </div>
            ))}
            {script.suite_si_pas_reponse && <div style={{ background: '#0d0d20', border: '1px solid #D4537E22', borderRadius: 8, padding: '10px 12px', borderLeft: '3px solid #D4537E' }}><div style={{ fontSize: 10, fontWeight: 700, color: '#D4537E', textTransform: 'uppercase' as const, marginBottom: 4 }}>🔄 Suite sans réponse</div><div style={{ fontSize: 12, color: '#d1d5db' }}>{script.suite_si_pas_reponse}</div><div style={{ marginTop: 6 }}><CopyBtn text={script.suite_si_pas_reponse} /></div></div>}
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// OUTIL AUDIT TIKTOK
// ══════════════════════════════════════════════════════════
function AuditTool({ tiktokUser, tiktokVideos, onConnect }: { tiktokUser: TikTokUser | null; tiktokVideos: TikTokVideo[]; onConnect: () => void }) {
  const [niche, setNiche] = useState('Business / Entrepreneuriat')
  const [objectif, setObjectif] = useState('Croissance abonnés')
  const [contexte, setContexte] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [audit, setAudit] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')

  const runAudit = useCallback(async () => {
    if (!tiktokUser) return
    setStatus('loading'); setAudit(null); setError('')
    try {
      const avgViews = tiktokVideos.length ? Math.round(tiktokVideos.reduce((s, v) => s + v.view_count, 0) / tiktokVideos.length) : 0
      const avgLikes = tiktokVideos.length ? Math.round(tiktokVideos.reduce((s, v) => s + v.like_count, 0) / tiktokVideos.length) : 0
      const avgComments = tiktokVideos.length ? Math.round(tiktokVideos.reduce((s, v) => s + v.comment_count, 0) / tiktokVideos.length) : 0
      const engRate = avgViews > 0 ? ((avgLikes + avgComments) / avgViews * 100).toFixed(1) : '0'
      const bestVideo = tiktokVideos.sort((a, b) => b.view_count - a.view_count)[0]

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 2500,
          system: `Tu es un expert TikTok Growth Strategist. Analyse ce compte et fournis un audit actionnable. JSON strict: {"score_global":0,"score_profil":0,"score_contenu":0,"score_engagement":0,"score_croissance":0,"score_monetisation":0,"synthese":"","points_forts":[{"icon":"✅","label":"","text":""}],"points_faibles":[{"icon":"⚠️","label":"","text":""}],"actions_prioritaires":[{"icon":"🎯","label":"","text":""}],"analyse_contenu":{"frequence_verdict":"","format_recommande":"","heure_recommandee":"","type_contenu_manquant":""},"potentiel_monetisation":{"niveau":"","canaux_recommandes":[],"prochaine_etape":""},"objectif_30_jours":"","objectif_90_jours":""}`,
          messages: [{ role: 'user', content: `Compte: @${tiktokUser.username} | Niche: ${niche} | Objectif: ${objectif}\nAbonnés: ${tiktokUser.follower_count.toLocaleString()} | Abonnements: ${tiktokUser.following_count} | Likes totaux: ${tiktokUser.likes_count.toLocaleString()} | Vidéos: ${tiktokUser.video_count}\nBio: "${tiktokUser.bio_description}" | Vérifié: ${tiktokUser.is_verified}\nVues moyennes: ${avgViews.toLocaleString()} | Likes moyens: ${avgLikes} | Commentaires moyens: ${avgComments} | Engagement: ${engRate}%\nMeilleure vidéo: ${bestVideo?.view_count.toLocaleString() || 0} vues\nTop 5 vidéos:\n${tiktokVideos.slice(0, 5).map((v, i) => `${i + 1}. "${v.video_description?.slice(0, 60)}" — ${v.view_count.toLocaleString()} vues`).join('\n')}\nContexte: ${contexte || 'Aucun'}\nJSON uniquement.` }]
        })
      })
      const data = await res.json()
      const raw = data.content?.filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('')
      const parsed = safeParseJSON(raw)
      if (!parsed) throw new Error('Réponse invalide')
      setAudit(parsed); setStatus('success')
    } catch (e) { setStatus('error'); setError(String(e)) }
  }, [tiktokUser, tiktokVideos, niche, objectif, contexte])

  if (!tiktokUser) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ fontSize: 44 }}>📊</div>
      <div style={{ fontSize: 17, fontWeight: 700 }}>Audit TikTok IA</div>
      <div style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center' as const, maxWidth: 320, lineHeight: 1.6 }}>Connecte ton compte TikTok pour importer automatiquement tes données et lancer l'audit complet</div>
      <a href="/api/auth/tiktok" style={{ background: 'linear-gradient(135deg,#ff0050,#ff4d8d)', border: 'none', borderRadius: 10, padding: '12px 28px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
        🔗 Connecter mon compte TikTok
      </a>
    </div>
  )

  const pts = audit?.points_forts as { icon: string; label: string; text: string }[] | undefined
  const ptf = audit?.points_faibles as { icon: string; label: string; text: string }[] | undefined
  const actions = audit?.actions_prioritaires as { icon: string; label: string; text: string }[] | undefined
  const contenu = audit?.analyse_contenu as Record<string, string> | undefined
  const monet = audit?.potentiel_monetisation as { niveau: string; canaux_recommandes: string[]; prochaine_etape: string } | undefined

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: 270, borderRight: '1px solid #1a1a30', padding: '14px 12px', overflowY: 'auto' as const, flexShrink: 0, display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
        {/* Profil connecté */}
        <div style={{ background: '#0a1a12', border: '1px solid #1D9E7533', borderRadius: 9, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: '#1D9E75', fontWeight: 700, marginBottom: 6 }}>✓ COMPTE CONNECTÉ</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>@{tiktokUser.username}</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{tiktokUser.follower_count.toLocaleString()} abonnés · {tiktokVideos.length} vidéos importées</div>
        </div>
        <SL txt="Niche" />
        <select value={niche} onChange={e => setNiche(e.target.value)} style={{ width: '100%', background: '#111124', border: '1px solid #2d2d4a', borderRadius: 7, padding: '7px 10px', color: '#e2e8f0', fontSize: 12, outline: 'none' }}>
          {NICHES_AUDIT.map(n => <option key={n}>{n}</option>)}
        </select>
        <SL txt="Objectif principal" />
        <select value={objectif} onChange={e => setObjectif(e.target.value)} style={{ width: '100%', background: '#111124', border: '1px solid #2d2d4a', borderRadius: 7, padding: '7px 10px', color: '#e2e8f0', fontSize: 12, outline: 'none' }}>
          {['Croissance abonnés', 'Monétisation', 'Personal branding', 'Générer des leads', 'Vendre un produit'].map(o => <option key={o}>{o}</option>)}
        </select>
        <SL txt="Contexte (optionnel)" />
        <textarea value={contexte} onChange={e => setContexte(e.target.value)} placeholder="Problèmes rencontrés, objectifs spécifiques..." rows={3} style={{ width: '100%', background: '#111124', border: '1px solid #2d2d4a', borderRadius: 7, padding: '7px 9px', color: '#e2e8f0', fontSize: 12, outline: 'none', resize: 'vertical', lineHeight: 1.5 }} />
        {error && <div style={{ background: '#1f0a0a', border: '1px solid #7f1d1d', borderRadius: 7, padding: '7px 9px', fontSize: 11, color: '#fca5a5' }}>{error}</div>}
        <button onClick={runAudit} disabled={status === 'loading'} style={{ background: status === 'loading' ? '#1c1c40' : 'linear-gradient(135deg,#D4537E,#7c3aed)', border: 'none', borderRadius: 8, padding: '9px 0', color: '#fff', fontSize: 12, fontWeight: 700, cursor: status === 'loading' ? 'not-allowed' : 'pointer', opacity: status === 'loading' ? 0.75 : 1 }}>
          {status === 'loading' ? '🔍 Analyse en cours…' : '🔍 Lancer l\'audit IA'}
        </button>
        <button onClick={onConnect} style={{ background: 'transparent', border: '1px solid #2d2d4a', borderRadius: 8, padding: '7px 0', color: '#9ca3af', fontSize: 11, cursor: 'pointer' }}>🔄 Rafraîchir les données</button>
      </div>
      {/* Résultat */}
      <div style={{ flex: 1, overflowY: 'auto' as const, padding: '20px 24px' }}>
        {status === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', height: '80%', gap: 12, opacity: 0.6 }}>
            <div style={{ fontSize: 44 }}>📊</div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Données TikTok importées ✅</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 8 }}>
              {[{ label: 'Abonnés', val: tiktokUser.follower_count.toLocaleString() }, { label: 'Vidéos analysées', val: tiktokVideos.length }, { label: 'Likes totaux', val: tiktokUser.likes_count.toLocaleString() }].map(s => (
                <div key={s.label} style={{ background: '#0d0d20', border: '1px solid #1a1a30', borderRadius: 8, padding: '12px 14px', textAlign: 'center' as const }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#a5b4fc' }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: '#6b7280', marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 8 }}>Configure et lance l'audit à gauche →</div>
          </div>
        )}
        {status === 'loading' && <div style={{ background: '#0d0d20', border: '1px solid #1e1e38', borderRadius: 12, padding: 20 }}><span style={{ fontSize: 13, color: '#f9a8d4' }}>L'IA analyse les données de @{tiktokUser.username}…</span></div>}
        {status === 'success' && audit && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div><div style={{ fontSize: 10, color: '#4b5563', textTransform: 'uppercase' as const }}>Audit TikTok · @{tiktokUser.username}</div></div>
              <div style={{ background: (audit.score_global as number) >= 7 ? '#0a1a12' : (audit.score_global as number) >= 5 ? '#1a1200' : '#1a0a0a', border: `1px solid ${(audit.score_global as number) >= 7 ? '#1D9E75' : (audit.score_global as number) >= 5 ? '#EF9F27' : '#E8593C'}44`, borderRadius: 8, padding: '8px 16px', textAlign: 'center' as const }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: (audit.score_global as number) >= 7 ? '#1D9E75' : (audit.score_global as number) >= 5 ? '#EF9F27' : '#E8593C' }}>{audit.score_global as number}/10</div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>Score global</div>
              </div>
            </div>
            <div style={{ background: '#111124', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#d1d5db', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 14 }}>💡 {audit.synthese as string}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {[{ title: '💪 Points forts', items: pts, color: '#1D9E75' }, { title: '🔧 Points faibles', items: ptf, color: '#E8593C' }].map(s => (
                <div key={s.title} style={{ background: '#0d0d20', border: `1px solid ${s.color}22`, borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid ${s.color}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>{s.title}</div>
                  {s.items?.map((item, i) => <div key={i} style={{ marginBottom: 6, paddingBottom: 6, borderBottom: i < (s.items?.length || 0) - 1 ? '1px solid #1a1a30' : 'none' }}><div style={{ fontSize: 10, color: s.color, fontWeight: 600, marginBottom: 1 }}>{item.label}</div><div style={{ fontSize: 12, color: '#d1d5db', lineHeight: 1.5 }}>{item.text}</div></div>)}
                </div>
              ))}
            </div>
            <div style={{ background: '#0d0d20', border: '1px solid #6366f122', borderRadius: 10, padding: '12px 14px', borderLeft: '3px solid #6366f1', marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>🎯 Actions prioritaires</div>
              {actions?.map((a, i) => <div key={i} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: i < (actions?.length || 0) - 1 ? '1px solid #1a1a30' : 'none' }}><div style={{ fontSize: 11, color: '#a5b4fc', fontWeight: 600, marginBottom: 2 }}>{a.label}</div><div style={{ fontSize: 12, color: '#d1d5db', lineHeight: 1.5 }}>{a.text}</div></div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: '#0d0d20', border: '1px solid #6366f122', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', marginBottom: 8 }}>📅 Objectif 30 jours</div>
                <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 500 }}>{audit.objectif_30_jours as string}</div>
              </div>
              <div style={{ background: '#0d0d20', border: '1px solid #D4537E22', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#D4537E', marginBottom: 8 }}>🚀 Objectif 90 jours</div>
                <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 500 }}>{audit.objectif_90_jours as string}</div>
              </div>
            </div>
            {monet && <div style={{ marginTop: 10, background: '#0d0d20', border: '1px solid #EF9F2722', borderRadius: 10, padding: '12px 14px', borderLeft: '3px solid #EF9F27' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ fontSize: 11, fontWeight: 700, color: '#EF9F27' }}>💰 Potentiel monétisation</span><span style={{ background: '#EF9F2722', borderRadius: 20, padding: '1px 10px', fontSize: 10, color: '#EF9F27', fontWeight: 700 }}>{monet.niveau}</span></div>
              <div style={{ fontSize: 12, color: '#d1d5db', marginBottom: 6 }}>{monet.prochaine_etape}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>{monet.canaux_recommandes?.map((c: string, i: number) => <span key={i} style={{ background: '#EF9F2722', borderRadius: 5, padding: '2px 8px', fontSize: 10, color: '#EF9F27' }}>{c}</span>)}</div>
            </div>}
          </div>
        )}
      </div>
    </div>
  )
}
