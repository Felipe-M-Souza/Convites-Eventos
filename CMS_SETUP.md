# CMS do convite (Supabase + `/admin`)

O site continua a funcionar **só com** `src/data/eventData.ts` se não configurares o Supabase. Com variáveis de ambiente, o convite passa a ser lido da base e editável em **`/admin`**.

## 1. Criar projeto Supabase

1. [supabase.com](https://supabase.com) → New project.
2. Anota **Project URL** e **anon public** key (Settings → API).

## 2. Criar tabela e políticas

No Supabase: **SQL Editor** → cola o conteúdo de `supabase/migrations/001_invite_config.sql` → **Run**.

Para **upload de fotos** no painel (galeria «Momentos»), executa também `supabase/migrations/002_invite_gallery_storage.sql` no mesmo editor. Cria o bucket público `invite-gallery` e as políticas de Storage (leitura pública, escrita só com utilizador autenticado).

Para **vários convites** (URL por casal), executa `supabase/migrations/003_invite_slug.sql`. Adiciona a coluna `slug` (única); a linha existente fica com `slug` igual ao `id` (normalmente `default`).

Para **apagar convites** no painel, executa `supabase/migrations/004_invite_config_delete.sql` (política `DELETE` para utilizadores autenticados).

Para **dono do convite + uploads de convidados**, executa `supabase/migrations/005_owner_guest_uploads.sql`. Esta migration:

- cria os papéis internos (`admin` e `owner`);
- restringe o `invite_config` para edição apenas de administradores;
- cria a tabela `invite_owners`;
- cria a tabela `guest_uploads`;
- cria o bucket privado `invite-guest-uploads`;
- cria a função RPC `claim_invite_owner(...)` para o primeiro acesso do dono.

## 3. Criar utilizador administrador

**Authentication** → **Users** → **Add user** → email + password (ou convida por email).

Depois de executar a migration `005`, abre `/admin`, entra com a conta criada e usa o botão **Tornar esta conta administradora**. Isto cria a primeira linha em `app_account_roles` sem precisares de service role no frontend.

Só contas com papel `admin` conseguem **guardar** alterações; qualquer pessoa pode **ver** o convite (política de leitura pública).

## 4. Variáveis de ambiente

Cria `.env` na raiz (não commits o ficheiro; já está no `.gitignore` se usares `*.local` — acrescenta `.env` se necessário):

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

No **Render** (Static Site): define as mesmas variáveis em **Environment** e faz **redeploy** (o Vite injeta `VITE_*` no **build**).

### Rotas SPA (`/admin` em 404)

O servidor só tem ficheiros em `/` e `/assets/…`. Pedidos a `/admin` têm de servir o mesmo `index.html` para o React Router funcionar.

1. No Render: o teu **Static Site** → **Redirects / Rewrites** (ou **Redirects**).
2. Adiciona **Rewrite** (não redirect):
   - **Source:** `/*`
   - **Destination:** `/index.html`
3. (Opcional) Para o pedido automático a `/favicon.ico`, adiciona **Rewrite**:
   - **Source:** `/favicon.ico`
   - **Destination:** `/favicon.svg`  
   Coloca esta regra **antes** da regra `/*` se o painel permitir ordenar.

O ficheiro `render.yaml` na raiz do repo já inclui estas regras; se o serviço foi criado **só pelo dashboard**, tens de as criar à mão ou associar o Blueprint ao serviço.

## 5. Primeira gravação

1. `npm run dev` → abre `/admin` → entra com o utilizador criado.
2. **Guardar alterações** grava o JSON na linha do convite atual (por omissão `slug = default` após a migração `003`).

## 6. Dono do convite e uploads de convidados

Depois da migration `005` e do bootstrap do admin:

1. No `/admin`, abre o convite desejado.
2. Na secção **Dono do convite e uploads**, ativa os uploads públicos e configura:
   - nome do responsável;
   - email do responsável;
   - código/link de acesso.
3. Envia o link de primeiro acesso ao responsável.
4. O responsável entra em `/owner/claim?...`, cria a conta e conclui a vinculação.
5. Depois disso, ele passa a usar `/owner` para aprovar ou rejeitar fotos e vídeos enviados pelos convidados.

## 7. Portfólio e links por cliente

- **`/`** — página de portfólio (apresentação + atalhos).
- **`/c/<slug>`** — convite público (ex.: `/c/default`, `/c/maria-joao`). Partilhas este URL com os convidados.
- **`/admin`** — painel do convite com `slug = default`.
- **`/admin?slug=maria-joao`** — edita outro convite. No painel podes **mudar o convite** no menu, **criar novo** (slug em minúsculas, hífens) e ver o link público.
- **`/owner`** — área do dono do convite para moderar uploads.
- **`/owner/claim?slug=...&code=...`** — link de primeiro acesso do dono do convite.

Sem Supabase, `/c/qualquer-coisa` usa os dados por omissão de `eventData.ts` (útil para desenvolvimento).

---

Resumo técnico: `invite_config` guarda o payload do convite; `app_account_roles` controla os papéis; `invite_owners` liga cada convite ao seu dono; `guest_uploads` guarda a moderação de fotos e vídeos enviados pelos convidados.
