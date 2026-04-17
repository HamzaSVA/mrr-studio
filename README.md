# 🚀 MRR Studio — Guide de déploiement

## Structure du projet

```
mrr-studio/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── tiktok/route.ts      ← Démarre l'OAuth TikTok
│   │   │   └── callback/route.ts    ← Reçoit le code TikTok
│   │   ├── tiktok/
│   │   │   ├── profile/route.ts     ← Profil TikTok connecté
│   │   │   ├── videos/route.ts      ← Vidéos + métriques
│   │   │   └── analytics/route.ts   ← Audit IA complet
│   │   └── scripts/
│   │       └── generate/route.ts    ← Générateur de scripts
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── tiktok.ts                    ← Client OAuth TikTok
│   └── supabase.ts                  ← Client Supabase
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql   ← Schéma BDD
├── .env.local.example               ← Template variables d'env
└── README.md
```

---

## Étape 1 — GitHub ✅
Le dépôt est créé. Tu copies tous ces fichiers dedans.

---

## Étape 2 — Supabase

1. Va sur **supabase.com** → "New project"
2. Nom : `mrr-studio` | Région : West EU (Paris)
3. Une fois créé → **SQL Editor** → colle le contenu de `supabase/migrations/001_initial_schema.sql` → Run
4. Va dans **Settings → API** et note :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

---

## Étape 3 — TikTok Developers

1. Va sur **developers.tiktok.com** → ton app
2. Dans **Credentials** note :
   - `Client key` → `TIKTOK_CLIENT_KEY`
   - `Client secret` → `TIKTOK_CLIENT_SECRET`
3. Dans **Redirect URI** ajoute :
   - `https://mrr-studio.vercel.app/api/auth/callback`
4. Dans **Scopes** active :
   - `user.info.basic`
   - `user.info.profile`
   - `user.info.stats`
   - `video.list`

---

## Étape 4 — Vercel

1. Va sur **vercel.com** → "New Project"
2. Importe ton dépôt GitHub `mrr-studio`
3. Dans **Environment Variables** ajoute :

```
ANTHROPIC_API_KEY        = sk-ant-...
NEXT_PUBLIC_SUPABASE_URL = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
SUPABASE_SERVICE_ROLE_KEY = eyJ...
TIKTOK_CLIENT_KEY        = xxx
TIKTOK_CLIENT_SECRET     = xxx
NEXT_PUBLIC_APP_URL      = https://mrr-studio.vercel.app
```

4. Clique **Deploy** → attends 2 minutes

---

## Étape 5 — Test final

1. Va sur `https://mrr-studio.vercel.app`
2. Clique **Connexion TikTok**
3. Autorise l'app sur TikTok
4. Tu es redirigé → tes données TikTok sont chargées automatiquement
5. Lance l'audit IA → les données réelles sont importées

---

## Variables d'environnement complètes

```env
ANTHROPIC_API_KEY=sk-ant-XXXXXXXX
NEXT_PUBLIC_SUPABASE_URL=https://XXXXXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyXXXXXX
SUPABASE_SERVICE_ROLE_KEY=eyXXXXXX
TIKTOK_CLIENT_KEY=XXXXXXXX
TIKTOK_CLIENT_SECRET=XXXXXXXX
NEXT_PUBLIC_APP_URL=https://mrr-studio.vercel.app
```
