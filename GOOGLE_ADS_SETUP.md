# Google Ads + GA4 — Convites Diversos

Guia para corrigir o alerta **"Conversion tracking setup is incomplete"** e alinhar a campanha de Pesquisa com o site.

## Status verificado no site (produção)

| Item | Status |
|------|--------|
| Domínio | `https://convitesdiversos.com.br` |
| GA4 (`VITE_GA_MEASUREMENT_ID`) | `G-7SHFNFTTP3` — presente no bundle |
| Google Ads tag (`VITE_GOOGLE_ADS_ID`) | `AW-17639334282` — presente no bundle |
| Eventos no código | `generate_lead`, `clique_whatsapp`, `conversion_event_contact` |
| `VITE_GOOGLE_ADS_CONVERSION_ORCAMENTO_SEND_TO` | Opcional (importação GA4 não exige) |

O tag **está instalado em produção**. Se o Google Ads ainda mostra rastreamento incompleto, o problema está na ligação GA4 ↔ Ads ou na configuração de metas/conversões — não na ausência do script no site.

---

## Eventos que o site dispara

| Ação do visitante | Eventos enviados ao GA4 |
|-------------------|-------------------------|
| Clique em WhatsApp comercial | `generate_lead`, `clique_whatsapp`, `conversion_event_contact`* |
| Clique em email de orçamento | `generate_lead`, `conversion_event_contact`* |

\* `conversion_event_contact` depende de `VITE_GOOGLE_ADS_CONVERSION_CONTACT_EVENT_NAME` (padrão: `conversion_event_contact`).

**Recomendação:** marque **`generate_lead`** como evento-chave primário no GA4 e importe-o no Google Ads. Use `clique_whatsapp` como secundário (WhatsApp) se quiser segmentar por canal.

---

## Passo 1 — GA4: marcar eventos-chave

1. Abra [Google Analytics](https://analytics.google.com) → propriedade **G-7SHFNFTTP3**.
2. **Admin** → **Exibição de dados** → **Eventos**.
3. Aguarde aparecer `generate_lead` (clique no WhatsApp ou email do site para gerar tráfego de teste).
4. Ative **Marcar como evento-chave** em:
   - `generate_lead` (primário — cobre email e WhatsApp)
   - `clique_whatsapp` (opcional — só WhatsApp)
5. Valide em **Relatórios → Tempo real**: clique no botão WhatsApp do site e confirme os eventos.

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
3. Selecione **`generate_lead`** como conversão **Primária** (meta Leads/Contato).
4. (Opcional) Importe também **`clique_whatsapp`** como secundária.
5. Aguarde status **Ativa** (pode levar 24–72 h após o primeiro evento).

Se já existir conversão importada de outro evento (ex.: só `conversion_event_contact`), edite a meta da campanha para usar **`generate_lead`**.

---

## Passo 4 — Metas da campanha

1. **Metas** → **Resumo de conversões** (nível conta).
2. Confirme que a meta **Leads** ou **Contato** inclui a conversão importada `generate_lead`.
3. Abra a campanha **Pesquisa - Convite Digital Casamento - Brasil**.
4. Em **Configurações** → **Metas**, verifique que a campanha usa essa meta (não uma meta vazia ou conversão errada).

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

- [ ] URL final: `https://convitesdiversos.com.br` ou landing `/convite-digital/casamento`
- [ ] Rede: **Pesquisa** ativa (Display/Parceiros só se intencional)
- [ ] Local: **Brasil**
- [ ] Anúncios: status **Aprovado**
- [ ] Palavras-chave: sem status "Poucas impressões" em todas

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
