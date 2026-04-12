# Convite digital de casamento

Aplicação **React + Vite + TypeScript** com **Tailwind CSS v4** e **Framer Motion**: convite em página única, pensado primeiro para celular.

## Personalizar

Edite `src/data/eventData.ts` (nomes, textos, links, data ISO da contagem, URLs de fotos e, se quiser, `backgroundAudioUrl` apontando para um ficheiro em `public/audio/`).

Com **Supabase** (`CMS_SETUP.md`): convite público em **`/c/<slug>`** (ex. `/c/default`), portfólio em **`/`**, painel em **`/admin?slug=...`**.

## Comandos

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
npm run preview
```

## Especificação original

O ficheiro `README-original.docx` na raiz é o documento Word que serviu de base ao projeto (renomeado porque tinha extensão `.md` mas era DOCX).
