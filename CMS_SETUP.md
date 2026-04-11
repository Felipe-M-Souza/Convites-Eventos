# CMS do convite (Supabase + `/admin`)

O site continua a funcionar **só com** `src/data/eventData.ts` se não configurares o Supabase. Com variáveis de ambiente, o convite passa a ser lido da base e editável em **`/admin`**.

## 1. Criar projeto Supabase

1. [supabase.com](https://supabase.com) → New project.
2. Anota **Project URL** e **anon public** key (Settings → API).

## 2. Criar tabela e políticas

No Supabase: **SQL Editor** → cola o conteúdo de `supabase/migrations/001_invite_config.sql` → **Run**.

## 3. Criar utilizador administrador

**Authentication** → **Users** → **Add user** → email + password (ou convida por email).

Só este utilizador consegue **guardar** alterações; qualquer pessoa pode **ver** o convite (política de leitura pública).

## 4. Variáveis de ambiente

Cria `.env` na raiz (não commits o ficheiro; já está no `.gitignore` se usares `*.local` — acrescenta `.env` se necessário):

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

No **Render** (Static Site): define as mesmas variáveis em **Environment** e faz **redeploy** (o Vite injeta `VITE_*` no **build**).

## 5. Primeira gravação

1. `npm run dev` → abre `/admin` → entra com o utilizador criado.
2. **Guardar alterações** cria a linha `id = default` na tabela.

## 6. Encomendas / vários convites

Este modelo usa **um** documento (`id = default`). Para vários clientes, o passo seguinte seria:

- coluna `slug` (ex. `maria-joao`) e rotas `/c/:slug`;
- ou um projeto Supabase por cliente.

---

Resumo técnico: tabela `invite_config` com coluna `payload` (JSON) alinhada ao tipo `EventData` em TypeScript.
