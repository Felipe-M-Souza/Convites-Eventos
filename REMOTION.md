# Remotion + capturas

## 1. Gerar capturas dos convites

Com o site a correr localmente em `http://localhost:5173`:

```bash
npm run capture:invites
```

Para capturar do site publicado:

```bash
npm run capture:invites:live
```

As imagens são guardadas em:

```text
public/remotion-captures/
```

## 2. Abrir o studio

```bash
npm run remotion:studio
```

## 3. Renderizar

Intro/carrossel animado:

```bash
npm run remotion:render:intro
```

Reel/showcase com capturas:

```bash
npm run remotion:render:reel
```

Saída:

```text
out/instagram-intro.mp4
out/invite-showcase-reel.mp4
```
