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

Se o teu projeto já tinha uma versão anterior da `005` aplicada, não precisas rodá-la de novo. Nesse caso, aplica só as migrations incrementais abaixo.

Se você já ativou uploads de convidados e quiser guardar também a duração dos vídeos para validação/mobile, execute
`supabase/migrations/007_guest_upload_video_metadata.sql`.

Para **processamento assíncrono de vídeo**, execute também `supabase/migrations/008_guest_upload_video_processing.sql`.

## 3. Criar utilizador administrador

**Authentication** → **Users** → **Add user** → email + password (ou convida por email).

Depois de executar a migration `005`, abre `/admin`, entra com a conta criada e usa o botão **Tornar esta conta administradora**. Isto cria a primeira linha em `app_account_roles` sem precisares de service role no frontend.

Só contas com papel `admin` conseguem **guardar** alterações; qualquer pessoa pode **ver** o convite (política de leitura pública).

## 4. Variáveis de ambiente

Cria `.env` na raiz (não commits o ficheiro; já está no `.gitignore` se usares `*.local` — acrescenta `.env` se necessário):

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_PUBLIC_SITE_URL=https://www.convitesdiversos.com.br
```

No **Render** (Static Site): define as mesmas variáveis em **Environment** e faz **redeploy** (o Vite injeta `VITE_*` no **build**).

### Deploy automático na HostGator

Se o frontend continuar hospedado na HostGator, o repositório já inclui o workflow `\.github/workflows/deploy-hostgator.yml` para publicar o conteúdo de `dist/` automaticamente a cada `push` na `main` (ou manualmente em `workflow_dispatch`).

Antes de ativar esse fluxo, cadastra estes **GitHub Actions Secrets** no repositório:

```text
HOSTGATOR_FTP_HOST=ftp.seu-hostgator.com.br
HOSTGATOR_FTP_USERNAME=seu-usuario-ftp
HOSTGATOR_FTP_PASSWORD=sua-senha-ftp
HOSTGATOR_FTP_PORT=21
HOSTGATOR_FTP_SERVER_DIR=convitesdiversos.com.br/
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_PUBLIC_SITE_URL=https://www.convitesdiversos.com.br
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Notas:

- `HOSTGATOR_FTP_SERVER_DIR` deve ser a pasta onde hoje está o `index.html` do site. Se o primeiro deploy falhar por caminho, ajusta apenas este valor.
- `VITE_PUBLIC_SITE_URL` deve apontar para o domínio público usado no compartilhamento do convite. Ex.: `https://www.convitesdiversos.com.br`.
- `VITE_GA_MEASUREMENT_ID` é opcional; pode ficar vazio se não estiver a usar GA4.
- O deploy automático está configurado sem limpeza agressiva do diretório remoto (`dangerous-clean-slate: false`), para não apagar ficheiros do servidor fora do `dist/`.

Depois de cadastrar os secrets:

1. Vai em **GitHub → Settings → Secrets and variables → Actions**.
2. Cria cada secret listado acima.
3. Faz um novo `push` para a `main` ou executa manualmente o workflow em **Actions → Deploy HostGator**.
4. Confirma nos logs que o build rodou com `npm ci && npm run build` e que o upload FTP concluiu sem erros.

### Processamento de vídeo (Supabase + Railway)

O pipeline de vídeo agora fica dividido em duas partes:

- a Edge Function `supabase/functions/process-guest-video` continua a receber `uploadId` do frontend e responder `202`;
- o serviço `services/video-worker` roda no Railway com `ffmpeg` e faz a transcodificação real.

#### 4.1 Deploy do worker no Railway

1. No Railway, cria um novo serviço a partir deste mesmo repositório.
2. Configura o **Root Directory** para `services/video-worker`.
3. Usa o `Dockerfile` dessa pasta para o deploy.
4. Define as variáveis de ambiente do worker:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
VIDEO_WORKER_SECRET=um-segredo-forte-e-unico
GUEST_UPLOADS_BUCKET=invite-guest-uploads
VIDEO_OUTPUT_MAX_WIDTH=1280
VIDEO_OUTPUT_CRF=28
VIDEO_OUTPUT_PRESET=veryfast
VIDEO_AUDIO_BITRATE=128k
```

5. Após o deploy, anota a URL pública do Railway. O endpoint de processamento será:

```text
https://seu-servico.up.railway.app/process
```

O worker também expõe `GET /health` para conferência rápida de disponibilidade.

#### 4.2 Secrets da Edge Function

Na função `process-guest-video`, configura estes secrets:

- `RAILWAY_VIDEO_WORKER_URL` com a URL completa do endpoint `/process`
- `RAILWAY_VIDEO_WORKER_SECRET` com o mesmo valor de `VIDEO_WORKER_SECRET`

Os secrets `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` continuam a ser usados pela Edge Function para marcar falhas de despacho no `guest_uploads`.

#### 4.3 Publicar a Edge Function

1. Faz o deploy da função em `supabase/functions/process-guest-video`.
2. Garante que ela tenha acesso a:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RAILWAY_VIDEO_WORKER_URL`
   - `RAILWAY_VIDEO_WORKER_SECRET`
3. A função responde imediatamente `202` e usa `EdgeRuntime.waitUntil(...)` só para despachar o job ao Railway sem bloquear o upload do convidado.

#### 4.4 Fluxo final

1. O convidado envia o vídeo pelo frontend.
2. O frontend grava o ficheiro original no bucket `invite-guest-uploads` e cria a linha em `guest_uploads` com `processing_status = 'uploaded'`.
3. O frontend chama a Edge Function `process-guest-video`.
4. A Edge Function envia o `uploadId` para o Railway.
5. O worker:
   - baixa o original em `original/...`;
   - converte para MP4 H.264/AAC com foco em mobile;
   - grava o resultado em `processed/...`;
   - atualiza `processing_status` para `ready` ou `failed`.

Isto mantém o frontend e a moderação exatamente no contrato já existente: `uploaded`, `processing`, `ready` e `failed`.

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

### Vídeos de convidados (mobile-first)

- Fotos continuam com compressão leve no browser.
- Vídeos são validados no navegador:
  - até `120 MB`
  - até `60 segundos`
- Depois do upload, o vídeo entra em processamento assíncrono.
- O responsável só aprova vídeos quando o estado estiver `Pronto para aprovação`.

### Checklist de validação

Depois de publicar a Edge Function e o worker no Railway, valida este fluxo:

1. Envia um vídeo curto no convite público e confirma que a linha nasce com `processing_status = 'uploaded'`.
2. Confirma que, poucos instantes depois, o estado muda para `processing`.
3. Aguarda o fim da compressão e valida `processing_status = 'ready'`, `processed_storage_path` preenchido e `processed_file_size_bytes` menor que o original sempre que possível.
4. Aprova o vídeo no `/owner` e confirma que ele aparece no convite público.
5. Testa uma falha operacional (por exemplo, URL/secret do worker inválido) e confirma que o estado vira `failed` com mensagem em `processing_error`.
6. Reenvia o mesmo ficheiro em novo upload e confirma que cada `uploadId` gera o seu próprio vídeo processado sem sobrescrever outro registo.

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
