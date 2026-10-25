# Google Ads + GA4 — Convites Diversos

Guia para corrigir o alerta **"Conversion tracking setup is incomplete"** e alinhar a campanha de Pesquisa com o site.

A conta Google Ads **não é acessível por este repositório**. Os passos 1 a 5 abaixo continuam manuais, no painel do Google, com o login do dono da conta `AW-17639334282`.

## O que o site já faz (outubro/2026)

- O convite é vendido por um **valor único de R$ 50,00**, o mesmo preço do checkout. Não há prazo nem preço riscado. O popup de compra mostra esse valor.
- No checkout, o pedido grava em `orders.source_path` o `gclid` (ou `gbraid` / `wbraid`) e os ids `ga_cid` / `ga_sid` da visita. O `purchase` enviado pelo servidor usa esses ids, para a compra entrar na sessão do anúncio mesmo quando o Pix não devolve o navegador à página de sucesso.

## Status verificado no site (produção)

| Item | Status |
|------|--------|
| Domínio | `https://convitesdiversos.com.br` |
| GA4 (`VITE_GA_MEASUREMENT_ID`) | `G-7SHFNFTTP3` — presente no bundle |
| Google Ads tag (`VITE_GOOGLE_ADS_ID`) | `AW-17639334282` — presente no bundle |
| Eventos no código | `generate_lead`, `clique_whatsapp`, `conversion_event_contact`, `begin_checkout`, `purchase` |
| `VITE_GOOGLE_ADS_CONVERSION_ORCAMENTO_SEND_TO` | Opcional (importação GA4 não exige) |

O tag **está instalado em produção**. Se o Google Ads ainda mostra rastreamento incompleto, o problema está na ligação GA4 ↔ Ads ou na configuração de metas/conversões — não na ausência do script no site.

---

## Eventos que o site dispara

| Ação do visitante | Eventos enviados ao GA4 |
|-------------------|-------------------------|
| Clique em WhatsApp comercial | `generate_lead`, `clique_whatsapp`, `conversion_event_contact`* |
| Clique em email de orçamento | `generate_lead`, `conversion_event_contact`* |
| Inicia checkout Mercado Pago | `begin_checkout` (+ `cta_click`) |
| Pagamento aprovado (retorno `/pagamento/sucesso` **ou** webhook/servidor) | `purchase` |

\* `conversion_event_contact` depende de `VITE_GOOGLE_ADS_CONVERSION_CONTACT_EVENT_NAME` (padrão: `conversion_event_contact`).

**Importante:** o `purchase` no browser falha com frequência no fluxo Pix (página pendente / adblock). Em produção o evento também é enviado **pelo servidor** (Measurement Protocol) quando o pedido fica `approved`. Configure `GA4_MEASUREMENT_ID` + `GA4_API_SECRET` nas secrets do Supabase (ver `MERCADOPAGO_SETUP.md`).

**Recomendação de metas:**

1. **Compra (primária para receita):** marque **`purchase`** como evento-chave no GA4 e importe-o no Google Ads como conversão **Primária** (meta Compra / Purchase). Valor e moeda BRL já vão no evento.
2. **Lead (secundária / volume):** mantenha **`generate_lead`** como conversão secundária (WhatsApp/e-mail).
3. **Funil (opcional):** use **`begin_checkout`** para remarketing e diagnóstico de abandono — não precisa ser conversão primária da campanha.

---

## Passo 1 — GA4: marcar eventos-chave

1. Abra [Google Analytics](https://analytics.google.com) → propriedade **G-7SHFNFTTP3**.
2. **Admin** → **Exibição de dados** → **Eventos**.
3. Aguarde aparecer `generate_lead` (clique no WhatsApp ou email do site) e `purchase` (fluxo de pagamento de teste ou real).
4. Ative **Marcar como evento-chave** em:
   - `purchase` (primário — receita)
   - `generate_lead` (secundário — lead WhatsApp/e-mail)
   - `begin_checkout` (opcional — funil)
   - `clique_whatsapp` (opcional — só WhatsApp)
5. Valide em **Relatórios → Tempo real**: clique no WhatsApp e, se possível, complete um pagamento de teste até `/pagamento/sucesso`.

---

## Passo 2 — Vincular GA4 ao Google Ads

### No GA4

1. **Admin** → **Links do produto** → **Links do Google Ads**.
2. **Vincular** → selecione a conta Google Ads correta.
3. Ative **Importação de conversões personalizadas** (ou equivalente) e confirme.

### No Google Ads

1. **Admin** → **Contas vinculadas** → **Google Analytics (GA4)**.
2. Confirme a propriedade **G-7SHFNFTTP3** com status **Vinculada**.

---

## Passo 3 — Importar conversões no Google Ads

1. **Ferramentas e configurações** → **Medição** → **Conversões**.
2. **+ Nova ação de conversão** → **Importar** → **Google Analytics 4**.
3. Selecione **`purchase`** como conversão **Primária** (meta Compra). Confirme que o valor da conversão usa o valor do evento.
4. Importe **`generate_lead`** como conversão **Secundária** (meta Leads/Contato) — útil para volume enquanto há poucas compras.
5. (Opcional) Importe **`begin_checkout`** como secundária para remarketing de abandono.
6. Aguarde status **Ativa** (pode levar 24–72 h após o primeiro evento).

Se a campanha ainda usar só `generate_lead` como primária, mude a meta para priorizar **`purchase`** assim que houver volume mínimo de compras (ou rode em paralelo: Maximizar conversões com `purchase` + observação de leads).

---

## Passo 4 — Metas da campanha

1. **Metas** → **Resumo de conversões** (nível conta).
2. Confirme que a meta de **Compra** inclui `purchase` e a de **Leads** inclui `generate_lead`.
3. Abra a campanha **Pesquisa - Convite Digital Casamento - Brasil**.
4. Em **Configurações** → **Metas**, prefira a meta que inclui **`purchase`**. Enquanto houver poucas compras, pode manter Maximizar cliques / CPA manual (Passo 5) e observar `generate_lead` em paralelo.

---

## Passo 5 — Estratégia de lances (destravar entrega)

Enquanto **nenhuma conversão** aparecer no Ads (fase inicial):

| Situação | Ação recomendada |
|----------|------------------|
| 0 conversões nos últimos 30 dias | Temporariamente: **Maximizar cliques** ou **CPA manual** (ex.: R$ 5–15) |
| Primeiras conversões registradas | Voltar para **Maximizar conversões** |
| Status "Eligible (Limited)" | Normal na fase de aprendizado; melhora após conversões + impressões |

Orçamento atual: **R$ 50/dia** — adequado para teste; verifique se palavras-chave têm volume (aba **Palavras-chave** e **Termos de pesquisa**).

---

## Passo 6 — Checklist da campanha

- [ ] URL final: use a landing específica da ocasião com `?lang=pt-BR` (ex.: `https://convitesdiversos.com.br/convite-digital/casamento?lang=pt-BR`)
- [ ] Rede: **Pesquisa** ativa (Display/Parceiros só se intencional)
- [ ] Local: **Brasil**
- [ ] Anúncios: status **Aprovado**
- [ ] Palavras-chave: sem status "Poucas impressões" em todas

---

## Estrutura recomendada de campanhas e termos

Use grupos separados por intenção para que anúncio, palavra-chave e URL final falem da mesma ocasião. Isso tende a melhorar relevância e taxa de contato no WhatsApp.

### Grupo: Casamento

URL final recomendada: `https://convitesdiversos.com.br/convite-digital/casamento?lang=pt-BR`

- `convite digital casamento`
- `convite virtual casamento`
- `convite online casamento`
- `convite de casamento digital`
- `convite casamento whatsapp`
- `convite digital casamento com música`
- `convite digital casamento com confirmação de presença`
- `convite interativo casamento`
- `convite de casamento por link`
- `convite casamento personalizado digital`

### Grupo: Aniversário infantil

URL final recomendada: `https://convitesdiversos.com.br/convite-digital/aniversario-infantil?lang=pt-BR`

- `convite digital aniversário infantil`
- `convite virtual aniversário infantil`
- `convite aniversário infantil whatsapp`
- `convite digital infantil personalizado`
- `convite animado aniversário infantil`
- `convite de aniversário por link`
- `convite digital tema infantil`

### Grupo: 15 anos

URL final recomendada: `https://convitesdiversos.com.br/convite-digital/15-anos?lang=pt-BR`

- `convite digital 15 anos`
- `convite virtual 15 anos`
- `convite debutante digital`
- `convite 15 anos whatsapp`
- `convite 15 anos personalizado`
- `convite digital debutante com música`

### Grupo: Chá de bebê e chá revelação

URLs finais recomendadas:

- `https://convitesdiversos.com.br/convite-digital/cha-de-bebe?lang=pt-BR`
- `https://convitesdiversos.com.br/convite-digital/cha-revelacao?lang=pt-BR`

Termos:

- `convite digital chá de bebê`
- `convite virtual chá de bebê`
- `convite chá de bebê whatsapp`
- `convite digital chá revelação`
- `convite virtual chá revelação`
- `convite chá revelação personalizado`

### Grupo: Bodas

URL final recomendada: `https://convitesdiversos.com.br/convite-digital/bodas?lang=pt-BR`

- `convite digital bodas`
- `convite bodas de prata digital`
- `convite bodas de ouro digital`
- `convite virtual bodas`

### Grupo: Evento corporativo

URL final recomendada: `https://convitesdiversos.com.br/convite-digital/evento-corporativo?lang=pt-BR`

- `convite digital corporativo`
- `convite digital empresa`
- `convite virtual confraternização`
- `convite digital lançamento`
- `convite digital evento empresarial`
- `convite corporativo whatsapp`
- `convite digital renovação de votos`

### Palavras negativas iniciais

Adicione como negativas para reduzir cliques de pessoas procurando arquivo grátis ou DIY:

- `grátis`
- `gratuito`
- `baixar`
- `download`
- `pdf`
- `png`
- `editar`
- `editável`
- `canva`
- `modelo grátis`
- `fazer convite grátis`
- `imprimir`
- `impressão`
- `molde`
- `arquivo`
- `template grátis`

---

## Secrets no GitHub (deploy)

Obrigatórios para importação GA4:

```text
VITE_GA_MEASUREMENT_ID=G-7SHFNFTTP3
VITE_GOOGLE_ADS_ID=AW-17639334282
VITE_GOOGLE_ADS_CONVERSION_CONTACT_EVENT_NAME=conversion_event_contact
```

Opcional (só se usar conversão via tag `send_to`, não importação GA4):

```text
VITE_GOOGLE_ADS_CONVERSION_ORCAMENTO_SEND_TO=AW-XXXXXXXXXX/label
```

Após alterar secrets: **Actions → Deploy HostGator → Run workflow** (ou push na `main`).

---

## Teste rápido (5 minutos)

1. Abra `https://convitesdiversos.com.br` em aba anônima.
2. Clique no botão flutuante de WhatsApp.
3. No GA4 **Tempo real**, confirme: `generate_lead`, `clique_whatsapp`.
4. No Google Ads **Conversões**, aguarde até 24 h para o primeiro registro importado.

---

## Diagnóstico do erro nos seus prints

| Alerta | Causa provável | Correção |
|--------|----------------|----------|
| Conversion tracking setup is incomplete | Meta usa conversão, mas GA4 não está ligado ou evento-chave não importado | Passos 1–4 acima |
| Eligible (Limited) | Poucos dados de conversão + Maximizar conversões | Passo 5 |
| 0 impressões na semana | Limitação + palavras/lances | Passos 5–6 |

---

## Referência no código

- Módulo de analytics: `src/lib/analytics.ts`
- Leads WhatsApp/email: `trackLeadContact()`, `trackWhatsappLead()`
- Inicialização: `src/App.tsx` → `AnalyticsListener`
