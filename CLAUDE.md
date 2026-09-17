# CLAUDE.md — Prompt Mestre de Projeto

> **Fonte de verdade absoluta.** Leia este arquivo completamente antes de qualquer ação.
> Quando houver conflito entre este documento e uma instrução pontual, este documento vence — exceto se o usuário explicitamente autorizar a exceção em tempo real.

---

## 0. Protocolo de entrada obrigatório

Ao receber este arquivo pela primeira vez em uma conversa, você deve:

1. **Confirmar leitura** em no máximo 3 linhas: o que entendeu como propósito do projeto e as 3 maiores prioridades.
2. **Executar o Checklist de Decisões Iniciais** (Seção 5) — uma pergunta por vez, aguardando resposta antes da próxima.
3. **Solicitar assets visuais** (Seção 8) e **parar** até o usuário confirmar que adicionou.
4. **Propor o design system** (paleta, tipografia, espaçamento, radius, motion) e aguardar aprovação explícita.
5. **Só então** iniciar o setup técnico conforme a stack da Seção 3.

**Nunca pule etapas. Nunca assuma o que pode ser perguntado.**

---

## 1. Identidade do agente

Você é um **arquiteto e desenvolvedor frontend especializado em PWAs offline-first**, focado em produtos simples, rápidos e com clara sensação de progresso para o usuário. Sua entrega padrão é uma base sólida, responsiva, testada e empacotável para lojas (Play Store / App Store) via Capacitor.

Você age como um parceiro técnico sênior: aponta problemas antes que aconteçam, sugere alternativas com trade-offs claros, e nunca entrega código que você mesmo não testaria em produção.

---

## 2. Regras invariantes (não-negociáveis)

| #   | Regra                                                                                                                                               |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Mobile-first sempre.** Layout, fluxo e densidade são projetados primeiro para 320–414 px.                                                         |
| 2   | **Offline-first obrigatório.** Todo MVP deve funcionar 100% sem rede após a primeira visita.                                                        |
| 3   | **Sem login no MVP.** Dados ficam apenas no dispositivo. Auth/sync entram em fase futura, nunca no MVP sem pedido explícito.                        |
| 4   | **Responsividade total.** Testar 320, 768, 1024 e 1440 px antes de declarar qualquer tela pronta.                                                   |
| 5   | **Assets antes de UI.** Sem referências visuais aprovadas → não iniciar nenhum componente.                                                          |
| 6   | **Tipagem estrita.** Proibido `any` e `// @ts-ignore`. `strict: true` no `tsconfig.json`.                                                           |
| 7   | **Zero over-engineering.** Se 3 linhas resolvem, não criar abstração. Cada dependência adicionada precisa de justificativa de tamanho e manutenção. |
| 8   | **Código em inglês, UI no idioma do usuário-alvo.** Nunca misturar idiomas num mesmo contexto.                                                      |
| 9   | **Lógica de negócio fora de componentes.** Vive em `services/` e `store/` — componentes só compõem e renderizam.                                    |
| 10  | **Nenhuma funcionalidade não solicitada.** Se detectar algo útil que não foi pedido, mencione como sugestão — nunca implemente silenciosamente.     |

---

## 3. Stack padrão (fixa por default)

| Camada             | Escolha padrão                         |
| ------------------ | -------------------------------------- |
| Build / dev        | **Vite**                               |
| Framework          | **React 18+**                          |
| Linguagem          | **TypeScript** (`strict: true`)        |
| Estilização        | **Tailwind CSS** + **shadcn/ui**       |
| Estado global      | **Zustand**                            |
| Estado de servidor | **TanStack Query** (quando houver API) |
| Persistência local | **IndexedDB** via **Dexie.js**         |
| Roteamento         | **React Router DOM v6+**               |
| PWA                | **vite-plugin-pwa** (Workbox)          |
| Wrapper nativo     | **Capacitor** (Android + iOS)          |
| Formulários        | **React Hook Form** + **Zod**          |
| Datas              | **date-fns**                           |
| Ícones             | **lucide-react**                       |
| Testes unitários   | **Vitest** + **React Testing Library** |
| Testes E2E         | **Playwright**                         |
| Lint / Format      | **ESLint** + **Prettier**              |
| CI                 | **GitHub Actions**                     |

### Quando sugerir alternativas (você DEVE fazê-lo, nunca silenciosamente)

| Alternativa                                   | Quando propor                                  |
| --------------------------------------------- | ---------------------------------------------- |
| **Next.js** em vez de Vite                    | SSR/SSG, SEO crítico, roteamento server-driven |
| **TanStack Router** em vez de React Router    | Rotas fortemente tipadas, aninhamento pesado   |
| **Jotai / Valtio** em vez de Zustand          | Estado fortemente atômico ou baseado em proxy  |
| **SQLite (wa-sqlite / OPFS)** em vez de Dexie | Consultas relacionais complexas                |
| **Tauri** em vez de Capacitor                 | Alvo principal é desktop, não mobile           |

**Protocolo de troca de stack:** apresente a alternativa + motivo + trade-off + impacto no prazo → aguarde decisão → só então aplique.

---

## 4. Caminho Web → Nativo (Play Store / App Store)

O projeto deve ser arquitetado **desde o dia 1** para virar app nativo:

- Evite Web APIs sem equivalente em WebView Android/iOS sem fallback explícito.
- Acesso a recursos nativos (câmera, notificações, sistema de arquivos) passa obrigatoriamente por `src/services/native/` — usa plugins Capacitor quando wrapped, Web APIs quando PWA puro.
- `npm run build` gera `dist/` que o Capacitor empacota. Nenhuma gambiarra de build duplo.
- `capacitor.config.ts` com `appId`, `appName` e `webDir: 'dist'` configurados desde o setup inicial, mesmo que o wrap venha depois.
- Alerte o usuário **imediatamente** se qualquer escolha comprometer o caminho Web → nativo.

---

## 5. Checklist de decisões iniciais (executar sempre, uma pergunta por vez)

1. Qual o **nome** e o **propósito em uma frase**?
2. Quais as **funcionalidades core do MVP**? (máximo 5)
3. Qual o **público-alvo** e faixa etária?
4. Existe **identidade visual** — assets, referências, paleta definida? _(se não → parar e solicitá-los antes de continuar)_
5. **Notificações push locais** são necessárias no MVP?
6. **Compartilhamento de dados entre dispositivos** está previsto para alguma fase?
7. O **wrapper nativo** (Capacitor) será gerado agora ou em fase futura?
8. Qual o **deploy preferido**? (Vercel / Netlify / Cloudflare Pages / GitHub Pages)

Registre as respostas e cite-as nas decisões técnicas subsequentes.

---

## 6. Padrões de responsividade (fixos)

### Breakpoints Tailwind

| Token | Largura | Faixa de uso               |
| ----- | ------- | -------------------------- |
| `sm`  | 640 px  | Mobile grande / phablet    |
| `md`  | 768 px  | Tablet portrait            |
| `lg`  | 1024 px | Tablet landscape / desktop |
| `xl`  | 1280 px | Desktop                    |
| `2xl` | 1536 px | Desktop largo              |

### Comportamentos por viewport

| Elemento            | < 768 px (mobile)           | 768–1023 px (tablet)    | ≥ 1024 px (desktop)              |
| ------------------- | --------------------------- | ----------------------- | -------------------------------- |
| Navegação principal | Bottom nav fixa             | Drawer lateral (toggle) | Sidebar fixa à esquerda          |
| Modais              | Bottom sheet (slide-up)     | Dialog centralizado     | Dialog centralizado              |
| Listas longas       | Scroll vertical             | Scroll vertical         | Grid 2–3 colunas                 |
| Tabelas             | Cards empilhados            | Tabela compacta         | Tabela completa                  |
| Formulários         | Full-width, inputs grandes  | Max-width 480 px        | Max-width 600 px                 |
| Botões primários    | Largura total, bottom-fixed | Inline                  | Inline                           |
| Hover states        | Não usar (touch)            | Sutis                   | Completos                        |
| Densidade           | Baixa, espaçamentos maiores | Média                   | Alta permitida                   |
| FAB                 | Visível bottom-right        | Visível                 | Substituído por botão na sidebar |

> Se um padrão diferente servir melhor para um caso específico, **explique o motivo e peça aprovação** antes de divergir.

---

## 7. Modelagem de dados

- Modelos: `src/features/<feature>/types.ts`
- Schema do banco: `src/services/db.ts` (Dexie)

```typescript
// Template base — adaptar conforme a feature
interface Entity {
  id: string // uuid v4 — nunca auto-increment
  createdAt: Date
  updatedAt: Date
}
```

**Regras:**

- `id` sempre `string` (uuid v4).
- Sempre `createdAt` e `updatedAt`.
- Datas exibidas ao usuário → ISO string (`YYYY-MM-DD` ou full ISO).
- Validação de entrada com **Zod** antes de gravar no IndexedDB.
- Nunca usar `localStorage` para dados de domínio — apenas IndexedDB via Dexie.

---

## 8. Fluxo de trabalho obrigatório (ordem não pode ser alterada)

```
1.  Criar /assets e /CLAUDE.md na raiz do projeto
2.  PARAR → solicitar ao usuário: referencia-1.png, referencia-2.png, icon.jpg
3.  Aguardar confirmação de que os arquivos foram adicionados
4.  Analisar assets: paleta, tipografia, espaçamento, padrões de UI, mood
5.  Propor design system (cores, fontes, radius, shadows, motion) → aguardar aprovação
6.  Setup: Vite + React + TS + Tailwind + shadcn/ui + ESLint + Prettier + Vitest + Playwright
7.  Configurar PWA (manifest, service worker, ícones 192/512/maskable)
8.  Configurar Capacitor (mesmo que o wrap fique para depois)
9.  Implementar shell: layout responsivo + roteamento + navegação adaptativa
10. Implementar features na ordem do MVP acordada
11. Testes unitários + E2E + Lighthouse + QA responsivo antes de declarar "done"
```

---

## 9. Estrutura de pastas

```
/assets                     # referências visuais e ícone-base (não versionados)
/public                     # estáticos servidos sem processamento pelo Vite
  sw.js                     # service worker
  manifest.json             # web app manifest
  logo.png / logo-192.png / logo-512.png
/android                    # gerado pelo Capacitor — não editar manualmente
/ios                        # gerado pelo Capacitor — não editar manualmente
/src
  /features
    /<feature>              # ex: habits, tasks, journal
      components/
      hooks/
      types.ts
      store.ts              # slice Zustand da feature
      service.ts            # acesso ao Dexie
      <feature>.test.ts
  /components               # componentes compartilhados (Button, Card, BottomSheet…)
    /ui                     # primitivos shadcn/ui
  /hooks                    # hooks compartilhados (useMediaQuery, useOnline…)
  /services
    db.ts                   # Dexie schema centralizado
    /native                 # adapters Capacitor ↔ Web API
  /store                    # stores Zustand globais (theme, settings…)
  /pages                    # uma página por rota; só compõe features
  /lib                      # utils puras (formatters, validators)
  /styles                   # tailwind.css + design tokens
  App.tsx
  main.tsx
  router.tsx
/tests
  /e2e                      # Playwright
capacitor.config.ts
vite.config.ts
tailwind.config.ts
tsconfig.json               # strict: true obrigatório
```

---

## 10. PWA — Estratégia de cache

| Asset                             | Estratégia                          |
| --------------------------------- | ----------------------------------- |
| App shell (HTML, JS, CSS)         | Cache-first                         |
| Assets estáticos (fontes, ícones) | Cache-first, expiração longa        |
| Dados de API (quando houver)      | Stale-while-revalidate              |
| Dados de domínio (usuário)        | IndexedDB — nunca no service worker |

**Requisitos do manifest:** `display: standalone`, ícones 192 (`purpose: any`) e 512 (`purpose: any` + entrada separada `purpose: maskable`), `theme_color`, `background_color`, `start_url: "/"`.

**Registro do SW:** o listener `beforeinstallprompt` deve ser capturado em um script inline no `index.html`, **antes** do bundle React carregar, e armazenado em `window.__deferredInstallPrompt`. O React lê essa referência no mount — nunca depender apenas de `useEffect` para capturar o evento.

---

## 11. Performance

- Lighthouse PWA, Performance, Accessibility, Best Practices ≥ 90 antes do deploy.
- Code splitting por rota (`React.lazy` + `Suspense`).
- Imagens em WebP/AVIF com `loading="lazy"`.
- `memo`, `useCallback`, `useMemo` **somente quando um problema de performance foi medido** — nunca preventivamente.
- Bundle inicial < 200 KB gzipped (alvo).
- Nunca usar `useEffect` para fetch quando TanStack Query está disponível.

---

## 12. Testes

- **Vitest:** utils, hooks e componentes isolados. Foco em comportamento, não em implementação.
- **React Testing Library:** query por papel/texto/label — nunca por classe CSS ou estrutura DOM.
- **Playwright:** fluxos críticos do MVP (criar item, editar, deletar, persistir após reload offline).
- **Meta:** testar comportamento crítico e regressões reais, não buscar 100% de cobertura por cobertura.
- **CI (GitHub Actions):** lint → typecheck → unit → e2e em cada PR. Nenhum merge com pipeline vermelho.

---

## 13. Anti-padrões (proibidos)

```
❌  Usar `any` ou `// @ts-ignore`
❌  Adicionar Redux ou MobX (Zustand resolve)
❌  Salvar dados de domínio em localStorage/sessionStorage (usar Dexie/IndexedDB)
❌  Usar Material UI ou Ant Design (Tailwind + shadcn cobre)
❌  Criar UI antes de analisar e aprovar assets/referências visuais
❌  Acoplar lógica de negócio em componentes React
❌  Implementar backend, auth ou sync no MVP sem pedido explícito
❌  Criar abstrações "para o futuro" sem caso de uso imediato e concreto
❌  Usar `useEffect` para fetch quando TanStack Query existe
❌  Comentários explicando o QUE o código faz (só o POR QUE, quando não óbvio)
❌  Declarar tela pronta sem testar em 320 / 768 / 1024 / 1440 px
❌  Adicionar dependência sem justificar tamanho de bundle e manutenção
❌  Misturar idiomas (código em inglês, UI no idioma do usuário-alvo)
❌  Ignorar teste em dispositivo real ou BrowserStack (não apenas DevTools)
❌  Trocar qualquer item da stack silenciosamente
```

---

## 14. Checklist de MVP pronto

- [ ] Vite + React + TypeScript + Tailwind + shadcn/ui configurados
- [ ] ESLint + Prettier + `tsconfig` com `strict: true`
- [ ] PWA instalável + funcionamento 100% offline verificado
- [ ] Capacitor configurado (`capacitor.config.ts` com `appId`, `appName`, `webDir`)
- [ ] Build Android gerado e testado pelo menos uma vez
- [ ] IndexedDB via Dexie operando (criar, ler, atualizar, deletar)
- [ ] Layout responsivo: bottom nav mobile / sidebar fixa desktop
- [ ] Todas as rotas do MVP implementadas
- [ ] Vitest + Playwright rodando no CI sem falhas
- [ ] Lighthouse ≥ 90 em todas as categorias
- [ ] README com: setup local, scripts disponíveis, como gerar APK
- [ ] Testado manualmente em 320 / 768 / 1024 / 1440 px

---

## 15. Comportamento esperado do assistente

| Situação                                        | Comportamento correto                                                       |
| ----------------------------------------------- | --------------------------------------------------------------------------- |
| Tecnologia diferente serviria melhor            | Apontar com justificativa + trade-off + impacto no prazo → aguardar decisão |
| Padrão de responsividade diferente seria melhor | Explicar + aguardar aprovação antes de divergir                             |
| Pedido ambíguo                                  | Perguntar — nunca assumir                                                   |
| Funcionalidade útil não pedida                  | Mencionar como sugestão — nunca implementar                                 |
| Decisão com impacto no caminho Web → nativo     | Alertar imediatamente                                                       |
| Final de fase                                   | Resumir decisões tomadas e confirmar antes de avançar                       |
| Stack sendo alterada                            | Nunca silenciosamente — sempre apresentar e aguardar aprovação              |

---

_Versão: 2.0 — Revisado e consolidado a partir das lições aprendidas em produção._

---

# Parte II — Palácio Mental (decisões deste projeto)

> Esta parte é específica do Palácio Mental e **complementa** o prompt mestre acima.
> Onde houver conflito, o que está aqui vale, porque foi decidido para este projeto.

## O produto

Conhecimento pessoal inspirado em neuroplasticidade. O usuário atravessa uma porta, entra
na sua biblioteca — o "palácio mental". Cada **livro** é uma área de conhecimento, cada
**neurônio** é um conceito. As conexões entre neurônios nascem **sozinhas**, por
significado, sem o usuário configurar nada. Conexões entre livros diferentes são douradas —
o "achado".

## Regra de ouro da arquitetura

**O núcleo não sabe onde está rodando.**

```
UI (React)  →  Núcleo (TS puro)  ←  Adapters (web hoje, nativo amanhã)
```

- **`src/core`** — algoritmo de conexões + tipos de domínio. Zero DOM, zero Dexie, zero
  transformers.js, zero React. Só matemática sobre arrays. **O ESLint bloqueia** esses
  imports e globais (ver `eslint.config.js`); não contorne a regra, receba a dependência
  por parâmetro ou por porta.
- **`src/services`** — adapters: `DexieRepo` hoje, `SqliteRepo` depois.
- **UI** — fala com a fachada `ConnectionEngine`. **Nunca** chama `worker.postMessage` nem
  Dexie direto.

Motivo prático: em WebView Android o transformers.js roda em WASM sem WebGPU confiável e
com poucas threads. Trocar por ONNX Runtime nativo deve custar _um arquivo novo_, não uma
refatoração.

## Processo

**Não usamos Spec-Driven Development.** Uma fase por vez, parando ao fim de cada uma para
revisão. Não adiantar fases.

## Modelo de dados

```
livros:     { id, titulo, cor, prateleira, ordem, createdAt }
neuronios:  { id, livroId, titulo, conteudo, embedding: Float32Array | null, createdAt, updatedAt }
conexoes:   { id, aId, bId, score, emb, rr, cross, mantidaPorA, mantidaPorB, updatedAt }
vagas:      { prateleira, ordem }
```

- `livros.ordem` é o lugar na prateleira (0..25), gravado porque quem decide é
  a pessoa arrastando o livro. **Esparso** desde 14/09/2026 — pode haver
  buraco entre dois livros (ver "A estante vira fileira de lugares").
- `vagas` guarda os lugares deixados abertos, não os enfeites: todo lugar sem
  livro e sem vaga mostra um enfeite.

- `embedding` é **`Float32Array` (BLOB), nunca array JSON** — ~1.5KB contra ~8KB por
  neurônio, e migra direto para SQLite depois. É `null` só enquanto a inferência não
  terminou: o neurônio é persistido antes do Worker responder para nada se perder num crash.
- `conexoes.id` é o par canônico `menorId::maiorId` (`conexaoId()` em `src/core`). O mesmo
  par nunca vira duas linhas, e regravar é idempotente.
- `cross` não é indexado: booleano não é chave válida em IndexedDB.
- `mantidaPorA` / `mantidaPorB` dizem **qual dos dois lados sustenta** a aresta. Como ela
  existe enquanto qualquer um dos dois a mantiver, sem esses flags é impossível recalcular
  um neurônio sozinho sem derrubar o que o vizinho ainda quer — e o `melhorFused` de cada
  nó sairia inflado por arestas que não são dele.

### Estado derivado (`PerfilDoPalacio`)

Dois números que só o grafo inteiro sabe calcular e que ficam **congelados** entre
reprocessamentos:

- `centroide` — o vetor médio. Se fosse recalculado a cada inserção, todo vetor
  centralizado mudaria um pouco e o grafo inteiro tremeria. Há teste cobrindo isso.
- `limiarPorNo` — o cosseno do último candidato que coube na lista de cada nó. É o que
  permite descobrir, numa passada, quem consideraria o recém-chegado um vizinho, sem
  recalcular o ranking de todo mundo.

- `escalaEmb` — o divisor da escala do embedding, derivado do corpus. Ver a calibração
  medida na Fase 3.

**Persistido** desde a Fase 4, na tabela `meta` (Dexie v2). Recalcular no boot custaria
O(N²) e, pior, mudaria: as arestas guardadas foram pontuadas com o centroide e a escala
de quando foram criadas, e perfil novo com aresta antiga dá score incoerente no mesmo
grafo.

## Motor de conexões (núcleo puro)

1. **Embedding** — `Xenova/multilingual-e5-small` quantizado sobre
   `"query: " + titulo + ". " + conteudo`, mean pooling, normalizado. O prefixo `query:` é
   exigência do e5.
2. **Centralização** — subtrair o vetor médio de todos e re-normalizar.
3. **Candidatos** — top ~6 por cosseno centralizado, sempre incluindo o melhor.
4. **Reranker** — **desligado no MVP web** (decisão da Fase 3). `available() === false`,
   e o motor roda só com o embedding. Volta no nativo via ONNX Runtime.
5. **Fusão com escala derivada** — `embS = clamp(cosCentralizado / perfil.escalaEmb, 0, 1)`;
   `fused = 0.5*embS + 0.5*rr`. O divisor sai do `PerfilDoPalacio`, congelado entre
   reprocessamentos — nunca do min/max do conjunto atual, senão adicionar um neurônio
   reembaralharia as conexões dos outros. A constante 0,45 do plano estava errada por
   ~6× e foi substituída na Fase 3.
6. **Seleção** — cada neurônio mantém vizinhos com `fused >= 0.6 * melhorFused`, **mínimo 1**
   (nunca órfão) e **máximo ~6** (nunca vira novelo). A aresta existe se **qualquer** um dos
   dois lados a mantém.
7. **Cross** — livros diferentes → `cross = true` → conexão dourada.

Incremental: ao criar/editar, recalcular só a vizinhança daquele neurônio.

### Como o incremental fica exato

`recalcularVizinhanca()` devolve **duas coisas**, e gravar só a primeira deixa o grafo
errado:

- `arestas` — as que tocam o alvo, para `replaceConexoesDe(alvoId, ...)`.
- `marcasPerdidas` — arestas que **não** tocam o alvo e que um vizinho deixou de sustentar
  quando o alvo entrou na lista dele, para `soltarMarcas(...)`. Um alvo que chega muito
  mais perto que todos levanta o corte daquele vizinho e derruba vários de uma vez.

Os candidatos do alvo vêm de dois lados: o top-K dele **e** todo nó cujo `limiar` ele
supera — quem _o_ consideraria vizinho. Sem essa segunda metade, um nó de região esparsa
que escolhesse o alvo ficaria sem a aresta porque o alvo não o escolheu de volta.

Há teste comparando os dois caminhos: aplicar o incremental sobre o grafo anterior tem que
dar **exatamente** o mesmo grafo que reprocessar tudo do zero.

> **Contrato do repositório:** ele é burro — `replaceConexoesDe` apaga toda aresta que
> tocava o neurônio e grava as que recebeu; `soltarMarcas` tira a marca de um lado e só
> apaga a aresta quando ninguém mais a sustenta. Quem decide o que existe é o núcleo.

## Decisões tomadas (10/09/2026)

| Decisão           | Escolha                                                                    |
| ----------------- | -------------------------------------------------------------------------- |
| Ordem de trabalho | Plano v2 (motor antes de telas). Estética por último — ver Direção visual. |
| Deploy            | Vercel, `base: '/'`                                                        |
| Toolchain         | ESLint + Prettier + Vitest agora; Playwright + GitHub Actions na Fase 6    |
| Reranker          | Decisão adiada para a Fase 3 (spike no Android real), conforme o plano     |

## Divergências conscientes do prompt mestre

| Item                  | Mestre        | Aqui                   | Motivo                                                                        |
| --------------------- | ------------- | ---------------------- | ----------------------------------------------------------------------------- |
| `src/core`            | não previsto  | existe                 | regra de ouro da arquitetura; é o que sobrevive ao nativo                     |
| React Router          | stack fixa    | entra na Fase 6        | a estante já tem duas visões, e sem rota o botão voltar do Android sai do app |
| TanStack Query        | stack fixa    | não entra              | não há API — o app é 100% local                                               |
| Playwright + CI       | setup inicial | Fase 6                 | não há fluxo de UI para testar antes disso                                    |
| `neuronios.embedding` | —             | `Float32Array \| null` | o neurônio é salvo antes de o Worker responder                                |

## Divergências conscientes do plano v2 (decididas na Fase 2)

| Item                              | Plano v2     | Aqui                           | Motivo                                                                        |
| --------------------------------- | ------------ | ------------------------------ | ----------------------------------------------------------------------------- |
| `conexoes.mantidaPorA/B`          | não previsto | dois booleanos por aresta      | sem eles o recálculo incremental derruba arestas que o vizinho ainda sustenta |
| Centroide                         | recalculado  | congelado, parâmetro do núcleo | recalcular a cada inserção quebra a promessa de não reembaralhar              |
| `limiarPorNo`                     | não previsto | parte do `PerfilDoPalacio`     | fecha o caso do vizinho que escolhe sem ser escolhido de volta                |
| `marcasPerdidas` + `soltarMarcas` | não previsto | saída do incremental           | é o que torna o incremental idêntico ao reprocessamento completo              |
| Prefixo `query:` do e5            | no núcleo    | no adapter de embedding        | é detalhe daquele modelo, não do algoritmo                                    |

## Números medidos na Fase 3 (desktop, 12 núcleos, Chromium 152)

Página `spike.html`, fora do bundle do app. `npm run spike` sobe HTTPS na rede local
para repetir a medição num celular; `npm run build:spike` inclui a página no `dist`.

| Medida              | Embedding (e5-small q8) | Reranker (bge-reranker-base q8) |
| ------------------- | ----------------------- | ------------------------------- |
| Bytes na rede       | 129 MB                  | 283 MB                          |
| Carga a frio        | 16,1 s                  | 28,2 s                          |
| Carga com cache     | 1,3 s                   | **não cacheia**                 |
| Primeira inferência | 137 ms                  | 275 ms                          |
| Por item (mediana)  | 58 ms (texto curto)     | 270 ms por par                  |
| Por item (p95)      | 80 ms                   | 341 ms                          |

**O Chrome recusa guardar o reranker.** `cache.put` falha com
`UnknownError: Failed to execute 'put' on 'Cache'` no arquivo de 267 MB, com 3 GB de
quota livre. O `cacheadoDepois` do spike expõe isso; os 283 MB voltam a cada início a
frio. Isso mata o requisito offline-first (regra 2 do mestre) no PWA.

### Calibração: `escalaEmb` estava errado por ~6× (corrigido)

Com os 9 neurônios do seed:

| Cosseno      | mediana | p90   | máximo    |
| ------------ | ------- | ----- | --------- |
| Bruto        | 0,903   | 0,918 | 0,920     |
| Centralizado | −0,129  | 0,029 | **0,070** |

O cosseno bruto é inútil (todo par ~0,9 — é a "semelhança de fundo"), e a
centralização resolve isso: o ranking centralizado é semanticamente bom
(Recursão ↔ Forma e repetição no topo; Cache ↔ Memória de trabalho em segundo).
Mas `embS = clamp(cos / 0,45, 0, 1)` sobre um máximo de 0,070 dá `embS ≤ 0,16` —
**o voto do embedding fica praticamente zerado**.

A seleção continua funcionando (o corte é relativo, `0,6 × melhorFused`), então não
há órfão nem grafo errado. O que quebra é o _significado absoluto_ do score: tudo
aparece como conexão fraquíssima.

Medido em N=9. Com mais neurônios o centroide se afasta de cada vetor e os cossenos
centralizados espalham mais — o divisor certo depende do tamanho do corpus.

**Corrigido:** `escalaEmb` saiu de `OpcoesMotor` e virou campo do `PerfilDoPalacio`,
derivado do corpus (p90 do melhor cosseno de cada nó), congelado entre
reprocessamentos como o centroide e os limiares. `OpcoesMotor.escalaEmbMinima` (0,02)
é só um piso contra divisão por ~zero num palácio recém-nascido.

Como a seleção é por corte relativo, isto **não muda quais arestas existem** — há
teste cobrindo. Muda o que o score significa:

| Par (seed, sem reranker)              | Antes | Depois    |
| ------------------------------------- | ----- | --------- |
| Forma e repetição ↔ Recursão          | 0,16  | **1,000** |
| Cache ↔ Memória de trabalho           | 0,08  | **0,529** |
| Neuroplasticidade ↔ Forma e repetição | 0,08  | **0,484** |
| Improvisação ↔ Viés de confirmação    | 0,07  | **0,419** |

## Decisões da Fase 3 (10/09/2026)

| Decisão         | Escolha                                                                                                                                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Reranker**    | **Fora do MVP web.** `TransformersRerank` vai existir devolvendo `available() === false`; o motor roda só com o embedding — o fallback que a arquitetura já prevê e os testes cobrem. Volta na Fase 9+ via ONNX nativo. |
| **`escalaEmb`** | Derivado do corpus, no `PerfilDoPalacio`. Feito.                                                                                                                                                                        |

Motivo do reranker: 283 MB que o navegador se recusa a cachear quebram o
offline-first, e o ganho de qualidade medido foi de um acerto (`Forma e repetição ↔
Recursão`, rr 0,97) e um erro (`Cache ↔ Memória de trabalho`, rr 0,08 sobre um
embedding de 0,53).

### O que o MVP ganha sem o reranker (desktop)

| Cenário           | Com reranker | Só embedding |
| ----------------- | ------------ | ------------ |
| Criar um neurônio | 1,68 s       | **45 ms**    |
| Reprocessar 300   | 4,4 min      | **13,5 s**   |
| Download total    | 412 MB       | **129 MB**   |
| Cacheável offline | não          | **sim**      |

## Como o fluxo funciona (Fase 4)

```
tela → store (Zustand) → ConnectionEngine → [ Worker: modelo + núcleo + Dexie ]
```

**Tudo que é pesado mora no Worker**: inferência, algoritmo e banco. A thread da
interface só guarda estado em memória e fala com a fachada. É por isso que o bundle
principal caiu para 71 KB gzipped — Dexie, Zod e transformers.js saíram dele.

- **Nenhuma mensagem carrega `embedding`.** O vetor fica do lado do banco; a tela
  recebe `NeuronioNaTela`, que troca os 384 floats por um booleano `processando`.
- **O id do neurônio é gerado por quem chama**, não pelo motor. É o que permite o
  otimismo sem precisar correlacionar nada depois.
- **Uma escrita devolve o palácio inteiro** (`neuronios` + `conexoes`), não só o que
  mudou: uma escrita pode disparar reprocessamento, e aí os _outros_ neurônios
  também deixam de estar processando.
- **O texto é persistido antes da inferência.** Se o Worker morrer no meio, perde-se
  o cálculo, nunca o que a pessoa escreveu.

### Quando reprocessa sozinho

O perfil fica congelado, mas um perfil tirado de 2 neurônios não descreve um palácio
de 40. Regra: **se o palácio cresceu mais de 50% desde o último perfil, reprocessa
tudo**; senão, incremental. Barato porque reprocessar não recalcula embedding — os
vetores já estão gravados, sobra a matemática. Acontece muito no começo e cada vez
menos depois.

Apagar sempre reprocessa: alguém pode ter perdido o único vizinho que tinha, e
apagar é raro o bastante para não valer nada mais esperto.

### Pendência resolvida na Fase 9: o runtime ONNX

Era assim: o transformers.js apontava `wasmPaths` para o **jsdelivr**, o runtime ONNX
vinha de um CDN na primeira execução, e o Vite ainda emitia uma cópia local de 23,5 MB
em `dist/` que **nunca era usada**.

Resolvido apontando para a cópia que já estava lá. `onnxruntime-web` exporta os
arquivos por subpath (`onnxruntime-web/ort-wasm-simd-threaded.asyncify.wasm`), então
dois `import … ?url` bastam — o Rollup deduplica, e o `dist` cresceu 47 KB (o `.mjs`
da fábrica, que antes também vinha do CDN). Verificado: o `transformers-cache` agora
guarda `http://localhost:4173/assets/ort-…` e **zero** URLs do jsdelivr.

O Safari usa o par não-asyncify e continua no caminho padrão. Embutir os dois pares
custaria 35 MB por um navegador que não é o alvo; a troca está escrita no adapter.

## Export/import (Fase 5)

Um arquivo JSON só, com livros, neurônios (embedding em base64) e conexões.
`services/native/arquivos.ts` isola o download e a leitura — sob Capacitor um
`<a download>` não faz nada numa WebView, e aquele arquivo vira Filesystem +
Share sem quem chama saber.

- **Importar funde, não substitui.** É por id, então reimportar o mesmo arquivo não
  duplica nada.
- **Importar sempre reprocessa.** Os scores do arquivo saíram do perfil de _outro_
  palácio, e depois da fusão o corpus é outro. Como os embeddings vêm no arquivo,
  isso não baixa modelo nenhum.
- **Um backup restaura um palácio funcionando sem baixar os 129 MB.** Verificado com
  o `transformers-cache` vazio: 11 neurônios e 9 conexões em ~1 s, e o cache
  continuou vazio no fim.
- `exportar()` devolve **texto**, não objeto: o snapshot de um palácio grande passa
  de alguns MB, e devolver o objeto faria a travessia do Worker copiar tudo para a
  thread da interface só serializar de novo em seguida.
- O perfil **não** vai no arquivo, justamente porque é recalculado na chegada.

## Direção visual (Fase 6)

Definida a partir de duas referências que o usuário passou: uma biblioteca à noite sob
luz de lua fria, e uma porta entreaberta com luz dourada vazando pela fresta.

### As duas regras que saem daí

**O fundo é azul-marinho profundo, não violeta nem preto.** Parede lambrilhada, luz fria
no assoalho. Preto puro não tem profundidade e apaga o ouro.

**O ouro é luz, não folha.** É a fresta da porta: quente, quase branca na origem,
vazando e iluminando o que está perto. Isso muda o comportamento, não só o valor — luz
sangra (halo, reflexo), pigmento não. Um fio dourado **ilumina** os dois neurônios que
liga, em vez de só ser da cor deles.

E a regra que já valia continua: **ouro significa uma coisa só — a conexão que atravessa
livros**. Ação primária é papel claro sobre a sala, nunca ouro.

Ideia guardada para a passada final: na primeira referência a luz azul **dessatura as
lombadas** — de longe não se vê a cor real dos livros. Na estante afastada as cores
chegam lavadas de azul e ganham cor de verdade quando você se aproxima.

### Processo: estética por último

**Decisão do usuário.** O sistema tem que funcionar perfeitamente primeiro, e o
acabamento vem no fim — inclusive para não criar gargalos quando virar app Android.

Na prática: os tokens entram agora (é barato e evita retrabalho estrutural), e as telas
das Fases 6–8 saem **corretas e sóbrias, não bonitas**. Textura, bloom, transição de
escala e a porta de entrada ficam para uma passada final de acabamento.

**Tema claro e escuro, os dois bem-feitos**, são entrega — não opcional. Também na
passada final; os tokens dos dois já existem.

### Público-alvo

**O próprio usuário.** Ferramenta experimental e pessoal, sem outro público no MVP.
Isso libera densidade de informação e dispensa onboarding — mas não dispensa
acessibilidade (contraste e alvo de toque continuam valendo).

### Tipografia: sem CDN

A proposta original usava Google Fonts por CDN. Num APK isso é dependência de rede em
tempo de execução, no cold start, dentro de uma WebView — exatamente o gargalo que o
usuário pediu para evitar.

**Agora:** pilha do sistema (`ui-serif`/`ui-sans-serif`), zero bytes e zero dependência.
**Na passada final:** Literata (títulos) e Source Sans 3 (interface) **auto-hospedadas**
em `public/`, com subset latino. Os nomes dos tokens não mudam.

## A estante (Fase 6)

Três rotas: `/` (estante), `/livro/:livroId`, `/laboratorio`.

- **A altura da lombada é a quantidade de neurônios** — a única métrica que a estante
  mostra sem você abrir nada. O ponto dourado no topo marca livro com fio saindo.
- **De longe a luz lava a cor do pano.** A lombada é `color-mix` da cor do livro com
  `--lavagem`; dentro do livro a barra usa a cor real, sem lavagem. É a primeira
  referência virando regra: distância desbota.
- **A lombada é sempre um objeto escuro**, nos dois temas — é o que faz a gravação em
  ouro (`--ouro-gravado`) continuar legível numa sala clara. Livro é escuro contra
  parede, não o contrário.
- **O fio dourado carrega o nome do livro do outro lado.** Sem isso, "atravessa livros"
  não quer dizer nada para quem está lendo.
- **Score zero é tracejado**, conforme a regra do design system.

`cor` do livro é **dado**, não token: viaja no export e não segue o tema. Quem segue o
tema é a lavagem aplicada em cima.

### Custo do React Router

O bundle principal foi de 71,7 KB para **103,2 KB** gzipped (+31,5 KB). O teto do
CLAUDE.md é 200 KB. Justificativa: sem histórico, o botão voltar do Android sai do app
em vez de fechar o livro — e o roteador já é stack fixa do mestre.

### Divergência de navegação

O mestre (§6) pede bottom nav no celular e sidebar fixa no desktop. Hoje há duas
destinações, e uma delas é uma tela de desenvolvimento — bottom nav para isso seria
mobília vazia. Por ora o laboratório é um link discreto no rodapé. **A navegação de
verdade é a Fase 8**, quando existirem porta, estante e rede.

## A rede (Fase 7)

Canvas, não SVG — decisão do plano: centenas de nós viram centenas de elementos no
DOM, e numa WebView isso derruba a rolagem.

### O layout é determinístico, e isso é do produto

`features/rede/layout.ts` é puro e **não tem simulação viva**. Nada de
`Math.random`, nada de relógio: a posição de cada neurônio sai de um hash do id, e o
relaxamento tem número fixo de passos.

Um palácio da memória cuja mobília anda não serve — você precisa reencontrar o
conceito no mesmo canto amanhã. É a mesma promessa que o motor já faz com os scores,
agora no espaço.

Duas consequências que viraram código:

- **As forças são acumuladas e aplicadas de uma vez por passo.** Em cascata, o
  resultado dependeria da ordem em que os neurônios chegaram — e essa ordem vem do
  IndexedDB, que não a garante entre sessões. O palácio mudaria de forma sozinho ao
  reabrir. Há teste cobrindo.
- **Os raios saem do conteúdo**, não de constantes: o livro cresce com a raiz do que
  tem dentro, e o palácio abre o bastante para os livros não se encostarem. Fixo, um
  palácio de nove neurônios vira três pontinhos no vazio.

A repulsão só age dentro do mesmo livro — livros já estão separados pelas âncoras, e
isso tira o O(N²) global do caminho.

### Desenho

> **Substituído em 14/09/2026** pela constelação — ver "A Rede como
> constelação". Ficam valendo: pontes em ouro por cima, score zero tracejado e a
> etiqueta do selecionado em pixels de tela.

- Fios internos na cor da lombada, pontes em ouro **por cima** e com brilho: a ponte
  é o achado e não pode ficar debaixo de nada.
- Espessura e opacidade seguem o score; score zero é tracejado.
- O raio do neurônio segue o grau — o hub cresce porque o motor já o faz crescer.
- O nome do livro fica **para fora** da região, e a largura do texto entra nos
  limites do mapa: sem isso o enquadramento corta justamente o nome.
- A etiqueta do selecionado é desenhada em pixels de tela, fora da câmera — nome de
  neurônio não pode encolher com o zoom.

### Interação

Sem laço de animação: pinta quando alguma coisa muda, e só. Um
`requestAnimationFrame` eterno é bateria queimando para mostrar imagem parada.

**O canvas não tem cascata.** Trocar de tema não o repinta sozinho — as cores já
viraram pixels na última pintura. Há um ouvinte de `prefers-color-scheme`, e outro de
`resize` para girar o celular.

O alvo de toque é maior que o desenho: um nó de 5 px é impossível de acertar com o
dedo. Arrastar e pinçar não podem virar seleção, então um toque só conta como toque
se o dedo andou menos de 8 px.

## Criação e navegação (Fase 8)

Sete rotas: estante, livro, rede, novo, neurônio, editar, ajustes. O laboratório
saiu — export, import e reprocessar foram morar em **Ajustes**.

### O aviso de "conectou com…"

É o momento em que o produto entrega o que prometeu: a pessoa só escreveu um texto,
e o palácio responde com quem ele conversa. Depois de criar, a navegação vai para
`/neuronio/:id?nasceu=1` e a tela mostra o aviso.

**A ponte entre livros vem primeiro e sozinha.** Misturá-la com as conexões de
dentro do próprio livro apagaria justamente o que ela tem de raro:

> **Achou 2 pontes** — Depuração, em Programação e Prática deliberada, em Música.
> E dentro do livro: Memória de trabalho e Atenção seletiva.

### Criar e editar são rotas, não bottom sheets

O mestre (§6) sugere bottom sheet para modais no celular. Aqui são rotas, pelo mesmo
motivo do roteador: **voltar tem que fechar o formulário**, não sair do app. E depois
de salvar a navegação é `replace` — voltar não pode trazer o formulário de volta.

Editar não é um caso menor: mudar o texto refaz o embedding e as conexões podem
mudar. Os dois caminhos usam o mesmo formulário e o mesmo otimismo.

### Navegação

Coluna fixa à esquerda a partir de 1024 px, conforme o mestre. Abaixo disso a barra
de baixo **deixou de existir** em 12/09/2026: quem navega é o dial, na seção a
seguir. O botão de criar continua sendo o botão de criar — ele é que passou a ser
também a navegação.

### A porta de entrada não foi feita

Ela está no plano desta fase, mas é **pura atmosfera** — não faz nada funcional. Pela
decisão de estética por último, construí-la sóbria agora seria construir algo para
jogar fora. Ela entra na passada de acabamento, junto com a luz da fresta.

## É um app, não uma página

Decidido em 12/09/2026, depois de o menu do Chrome — "copiar endereço do link",
"abrir no navegador Chrome" — aparecer num toque longo sobre o botão de criar.
Um app não faz isso, e cada gesto desses entrega que por baixo havia um site.

Três respostas fecham o escopo:

- **Seleção só onde o texto é da pessoa.** Campos sempre; e na tela do neurônio
  o título e o conteúdo (`.texto-do-usuario`), onde segurar o dedo copia, como
  em app de notas. O resto — rótulos, contagens, nomes de livro, a lista do
  livro aberto — é mobília, e mobília não se seleciona.
- **Zoom da página travado** (`user-scalable=no`). A pinça da Rede é do canvas e
  continua. Custo assumido: some o zoom do navegador como saída de
  acessibilidade. O público é uma pessoa só (ver "Público-alvo"), e foi ela que
  decidiu; contraste e alvo de toque continuam valendo.
- **Só no toque.** A chave é `@media (pointer: coarse)`, e
  `services/native/gestos.ts` usa a mesma. No desktop seleção e botão direito
  ficam inteiros: ali a mesma tela é bancada de trabalho.

**O que não tem CSS:** no Android o menu de contexto só some recusando o evento
`contextmenu` — `-webkit-touch-callout` é só do WebKit. Daí o módulo em
`services/native/`, pelo mesmo critério de `arquivos.ts`: existe porque o
ambiente é uma WebView, não porque o palácio precisa dele. A consulta ao
ponteiro é feita a cada toque longo, não uma vez no início — um tablet ganha e
perde teclado.

**O que estava escondido:** `overscroll-behavior` vivia no `body`, mas o Chrome
do Android lê a do elemento raiz. Era por isso que puxar de cima ainda
recarregava mesmo com a regra escrita.

Junto foram embora o texto que a WebView inflava sozinha
(`text-size-adjust: 100%`), arrastar link e imagem, a lista de preenchimento
automático no campo de título e o atraso de 300 ms do duplo toque
(`touch-action: manipulation`, que é também a metade que funciona no iOS, onde
`user-scalable=no` é ignorado de propósito).

## O dial — o botão que também navega (12/09/2026)

Pedido do usuário a partir de uma referência visual: segurar o botão de criar abre
os destinos em volta do polegar, e a barra de baixo some por não ter mais serventia.

**Isso diverge do mestre §6**, que pede bottom nav no celular, e da decisão da
Fase 8 que a implementou. Apontado antes de executar; decidido assim: o dial vale
**só abaixo de 1024 px**. No desktop a coluna fixa fica, porque segurar o botão do
mouse não é gesto que alguém faça por conta própria e lá sobra espaço de lado.

### O gesto

| Ação                                 | O que acontece                                     |
| ------------------------------------ | -------------------------------------------------- |
| Toque curto                          | Cria um neurônio, como sempre                      |
| Segurar 380 ms                       | O anel abre sob o dedo                             |
| Arrastar até a cunha e soltar        | Navega — um movimento só                           |
| Soltar no centro                     | O anel fica aberto; escolher vira um segundo toque |
| Soltar fora do arco, Esc, tocar fora | Fecha sem navegar                                  |

O segundo caminho existe porque o primeiro não perdoa o dedo que erra. Ambos estão
verificados com toque de verdade (eventos de toque pelo CDP, não o mouse fingindo
de dedo), nos dois temas.

**Três destinos, não dois.** Sem a barra, Ajustes ficava sem saída — aquela tela
não tinha link de voltar (a barra de topo só veio em 13/09). A Estante entrou no
anel junto com Rede e Ajustes.

**O botão aparece em toda rota menos `/novo` e `/editar`**, onde a tela já é a
escrita e o X da barra de topo é a saída. Antes ele também sumia em `/ajustes`;
não pode mais, porque o anel é a navegação de lá.

### O que veio da referência e o que não veio

Vieram o anel escuro de cunhas, o botão serrilhado no centro, a cunha escolhida
hachurada e o fio fino ligando-a ao nome da opção.

**Não veio o halo quente.** Na imagem o botão acende em laranja; aqui ouro
significa uma coisa só — conexão que atravessa livros —, e um dial dourado
roubaria esse significado. A luz do botão é de papel.

**O anel é um objeto escuro nos dois temas**, como a lombada e pela mesma razão: é
o que mantém o ícone claro legível quando a sala está clara.

O arco ocupa só o quadrante que sobra acima e à esquerda do botão (75°–195°) — é
onde o polegar alcança sem tapar o que está escolhendo. A matemática mora em
`lib/dial.ts`, pura e testada; o componente só desenha e escuta o dedo.

## A estante se mede pela tela (12/09/2026)

A fileira do móvel deixou de ser um número fixo — 92 px, calibrados para um
320×568 — e passou a sair da altura do viewport dividida pelas prateleiras que
existem:

```
clamp(92px, (100dvh − 144px − safe-area − 39px) / --mv-prateleiras − 7px, 132px)
```

O piso é o que cabe no menor celular comum. O teto, 132 px, é a altura que a
estante tinha **antes** de o fix de 11/09 apertá-la para caber junto com a barra:
num telefone de 844 px ela volta inteira a esse tamanho, que é o "maior para
baixo" que o espaço da barra liberou.

Por isso as alturas de lombada e de enfeite viraram **%** da fileira (63–93,5% e
65–91%): são as mesmas proporções de antes, agora acompanhando sozinhas. E o
número de prateleiras é a única coisa que o componente precisa contar para a
folha (`--mv-prateleiras`).

Verificado sem rolagem em 320×568, 390×844, 768×1024 e 1440×900, nos dois temas.
O bundle principal ficou em 117 KB gzipped, contra o teto de 200 KB do mestre.

**Respiro do topo, no celular: 5px (13/09/2026) → 0px (15/09/2026), os dois
pedidos do usuário.** É o `pt-*` de `<main>` em `App.tsx`, só na rota da
estante (`naEstante`) — as outras telas têm `BarraDeTopo` e usam a área segura
do aparelho, esta não. A cornija do móvel encosta no topo real da tela agora;
laterais (5px) e o respiro de baixo (24px) não mudaram. Verificado sem
rolagem em 320×568, 390×844 e 412×892 — `--mv-fora` (144px, o que na fileira
não é prateleira) não precisou mudar, a folga a mais só sobra embaixo do
móvel, sem cortar nada.

## A estante na mão (12/09/2026)

A estante deixou de ser vitrine: o livro é um objeto que se pega. Pedido do
usuário, com as decisões dele:

| Gesto                      | O que faz                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------- |
| Tocar num livro            | Espia: o livro sai da prateleira e o painel mostra neurônios, pontes e "Abrir o livro" |
| Segurar um livro           | Ergue o livro e **acende as pontes** dele em ouro                                      |
| Segurar e soltar parado    | Menu: renomear e trocar o pano, novo neurônio aqui, apagar                             |
| Segurar, arrastar e soltar | **Troca de lugar** com o livro de baixo; no vazio, ele volta                           |
| Tocar numa lombada escura  | Cria um livro naquela prateleira                                                       |

Abrir um livro passou a levar dois toques (espiar → abrir) — escolha consciente
do usuário. Botão direito e a tecla de menu abrem o menu; Enter e Espaço espiam.

### Ordem

- **Troca, não inserção.** Os dois livros trocam de lugar e mais nenhum se mexe;
  a distribuição pelas prateleiras continua automática.
- **`ordem` é gravada** (Dexie v3). A migração dá aos livros existentes a ordem
  que a tela mostrava até então — `createdAt`, desempatado pelo id —, então
  ninguém vê livro mudar de lugar ao atualizar. O seed nasce na mesma ordem.
- **Livro novo nasce na prateleira tocada** (`posicaoParaNovoLivro`). Como a
  distribuição é automática, num palácio pequeno demais aquela prateleira ainda
  não recebe livro, e ele nasce na última ocupada. Há teste de 0 a 60 livros.
- **Backup leva a ordem.** No import, o arquivo vence para os livros que vieram
  nele — o mesmo "arquivo vence" de título e cor, e é o que faz um backup devolver
  a estante arrumada. Livro que só existe no aparelho vai para depois. Backup de
  antes da ordem cai na ordem daquela época.
- `reordenarLivros` recusa lista que não bate com a estante gravada: gravar
  metade deixaria dois livros no mesmo lugar.
- A Rede **não** acompanha a estante: posiciona os livros por `createdAt` (ver
  "A rede"). Arrumar a estante não desmonta o mapa.

### Livro: criar, editar, apagar

- Criar e editar livro não mexem no grafo (`cross` depende do id, não da cor), e a
  store é otimista. **Apagar apaga em cascata** (neurônios e fios), com
  confirmação que diz quantos neurônios vão junto, e reprocessa — exceto livro
  vazio, que não tem vizinho a perder.
- **Panos**: 8 cores hex (`features/estante/panos.ts`), nenhuma na faixa do ouro.
  O formulário sugere o primeiro pano sem uso e mostra a lombada sob a mesma
  lavagem da estante, porque na prateleira nenhum pano aparece com a cor que tem.

### Painéis na URL, não rotas

Os painéis são bottom sheets (diálogo a partir de 768 px, conforme o §6) — mas
moram na busca da URL (`?espiar=`, `?acoes=`, `?editar=`, `?apagar=`, `?novo=`).
É o mesmo motivo que fez criar neurônio virar rota (ver "Criação e navegação"):
**voltar tem que fechar o que está aberto**, e uma busca deixa a entrada no
histórico sem desmontar a estante por baixo. Do menu para renomear ou apagar a
troca é `replace`, para voltar cair na estante e não no menu.

`<dialog>` nativo com `showModal`: fica na camada do topo, fora do `transform` de
`.animar-entrada`, prende o foco e fecha no Esc, sem dependência.

**A posição da folha zera a cada abertura** (corrigido em 15/09/2026). Fechar
puxando a alça deixa o `<dialog>` com `translateY` até fora da tela, e isso
só era zerado quando o rótulo mudava — o que na estante sempre acontece, mas
não nos filtros da Rede, de rótulo fixo. Lá, a segunda abertura mostrava só o
fundo desfocado, com o painel preso abaixo da tela e nenhuma saída a não ser
voltar.

### Distância desbota, agora como comportamento

A ideia guardada para a passada final virou regra: na prateleira a cor do pano
chega lavada de luz; o livro **puxado para perto** (espiado, erguido, alvo) mostra
a cor que tem. O fantasma do arrasto também.

### Luz, rolagem e botão

- **Sem luar no canto de cima à esquerda.** A luz cai de cima, por igual, e as
  bordas afundam na penumbra; nenhum canto vale mais que outro numa estante que
  se mexe.
- **A estante não rola.** `useTravarRolagem` trava o `<html>`, e a página tem a
  altura exata da tela: sem a folga de 96 px de baixo (`pb-6` só nesta rota),
  que sobrava como rolagem.
- **Botão +:** mesmo metal, acabamento novo. As ranhuras são degradê e não corte
  seco (corte seco em 90 dentes numa roda de 56 px virava chuvisco em tela densa),
  entraram o bisel e o sulco concêntrico da referência, e o + ficou mais grosso.

### Detalhes que não são óbvios

- Tocar é o `click` nativo; segurar e arrastar engolem o clique que vem no fim.
- O `contextmenu` que o Android dispara no meio de um segurar é ignorado — senão
  o menu abriria por cima de um livro que ainda vai ser arrastado.
- O fantasma anda por `transform` direto no elemento, sem render do React, e mora
  em portal no `body`: a fileira recorta (`overflow: hidden`) e o `transform` de
  `.animar-entrada` desalinharia qualquer `position: fixed` lá dentro.
- `.movel-vao` tem `isolation: isolate`: sem isso a fileira subiria por cima das
  pilastras e os livros deixariam de sumir atrás da da direita.
- Largar sobre um livro que também é ponte é o caso comum; o anel de alvo vence o
  halo da ponte, que continua por fora.

Verificado com toque de verdade (CDP) em 412×892, tema escuro: 24 conferências —
tocar, voltar, segurar, menu, arrastar e trocar, troca que sobrevive a recarregar,
criar na prateleira tocada, renomear, apagar — mais capturas em 320, 360 (claro),
768 e 1440. Bundle principal: 121 KB gzipped.

## A paleta e a interface (13/09/2026)

Pedido do usuário: melhorar UI, UX e design de tudo **menos a estante e o
retângulo da Rede**, que vão ser trabalhados à parte, seguindo uma paleta que ele
passou — com **Silver Lake Blue e Platinum nos textos**.

### A paleta

A imagem de referência trazia os HEX errados (o de Rich Black é um rosa); os
valores saem do RGB dela, que é o que bate com as amostras.

| Papel (token)                      | Noite                                           | Dia (derivado)                      |
| ---------------------------------- | ----------------------------------------------- | ----------------------------------- |
| `--sala` (fundo)                   | Rich Black `#0d1b2a`                            | Platinum `#e5e7e6`                  |
| `--parede` (superfície)            | `#192438` — Oxford Blue 15% mais perto do fundo | `#f6f7f7`                           |
| `--realce` (escolhido, sob o dedo) | YInMn Blue 45% sobre a parede                   | Silver Lake Blue 24% sobre a parede |
| `--linha` (bordas)                 | YInMn Blue 60%                                  | Silver Lake Blue 45%                |
| `--papel` (texto principal)        | Platinum                                        | Rich Black                          |
| `--poeira` (texto secundário)      | Silver Lake Blue                                | YInMn Blue                          |

- **À noite a paleta entra como veio**, e o texto é exatamente o pedido. De dia
  (escolha do usuário: "claro derivado da paleta") os papéis invertem, porque
  Silver Lake Blue e Platinum não se leem sobre fundo claro.
- **Oxford Blue puro não serviu de superfície:** Silver Lake Blue sobre ele dá
  4,45:1. Puxado 15% para o Rich Black dá 4,57:1, sem diferença que se veja.
- Contraste medido com os tokens resolvidos pelo navegador: texto principal
  12,5–16:1; secundário 4,57–6,6:1; ouro 4,9:1 de dia (era 2,97:1) e 9,5:1 à
  noite; vermelho de perigo 4,9–6,2:1.
- **Ouro continua sendo só a ponte** (escolha do usuário). Foco, botão e
  escolhido usam realce e Platinum.
- **O aviso flutuante é o inverso da sala de dia** (Oxford Blue e Platinum): um
  aviso claro sumia entre os cartões claros.

### O que não mudou, e como isso está garantido

- **A estante e o retângulo da Rede ficaram com as cores de antes.** (A Rede
  deixou de ficar em 14/09/2026: virou constelação em tela cheia e segue a
  paleta atual — ver "A Rede como constelação".)
  `.cores-de-antes` (em `index.css`) devolve os tokens antigos ao `.movel`, ao
  fantasma do arrasto, à lombada de amostra do formulário e ao retângulo do
  canvas (que lê as cores do próprio elemento). Comparação pixel a pixel antes e
  depois, nos dois temas: **zero pixels diferentes dentro da estante**; no
  retângulo muda só a última fileira da borda de baixo, que cai em fração de
  pixel e se mistura com o fundo da página — que mudou de cor.
- **A porta não foi tocada** (escolha do usuário): ela só lê as variáveis `--pt-*`.

### As quatro mudanças de uso (escolhidas pelo usuário)

| Mudança                            | Como ficou                                                                                                                                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Barra de topo nas telas internas   | `BarraDeTopo`: voltar ou fechar, título, ações. Voltar é o histórico, o mesmo do botão do Android; a saída fixa só vale quando o app abriu direto na tela. Presa no alto, com desfoque |
| Confirmar antes de apagar neurônio | Lixeira na barra → folha em `?apagar=1` (`Confirmacao`). Voltar fecha a pergunta; confirmar apaga e volta **duas** casas, para o voltar seguinte não cair no neurônio que não existe   |
| Aviso flutuante (snackbar)         | `Aviso`: o erro e o aviso da store saíram das caixas no meio das telas. Popover, na camada do topo — aparece por cima de uma folha aberta. Some em 3,5 s (erro: 6 s) ou no toque       |
| Salvar fixo embaixo no formulário  | `.barra-de-acao` presa no pé no celular; do tablet em diante, botão no fim do formulário (§6). O "Cancelar" saiu: fechar é o X da barra                                                |

Detalhes que não são óbvios:

- **`interactive-widget=resizes-content` no viewport.** Sem isso o teclado cobre
  o botão preso no pé; com isso o teclado encolhe a tela, que é o que a WebView
  do APK já faz sozinha. Efeito esperado, ainda não visto num aparelho (o
  navegador de teste não tem teclado): com uma folha aberta e o teclado à
  mostra, a estante atrás dela também encolhe, porque se mede por `dvh`.
- **Popover acima de diálogo modal é inerte.** O aviso aparece por cima da
  folha, mas o toque passa através dele — por isso ele some sozinho.
- **O foco automático da folha continuava lá desde 12/09.** Tirar o `autoFocus`
  do campo não bastou: `showModal()` foca a primeira coisa focável, e num painel
  com campo isso abre o teclado. No próprio `<dialog>` o Chrome ignora
  `autofocus`; num descendente, respeita — então ele vai no `.folha-corpo`.
- **O apagado continua desenhado** o instante entre o motor responder e a
  navegação sair da tela; senão piscaria "não existe mais" sob a folha.
- **Salvar a edição volta uma casa** em vez de empilhar a mesma tela de novo.
- Na barra de topo, fundo e linha são o `fill` de um `border-image` com outset:
  assim atravessam a tela do desktop em vez de terminar na coluna do conteúdo, e
  outset é tinta — não cria rolagem lateral.
- Ancestral com animação de entrada vira raiz do desfoque da barra. Por isso
  `.animar-entrada` fica no conteúdo, abaixo dela.
- `theme-color` é noite enquanto a porta está na tela (ela é noite nos dois
  temas) e depois segue o tema: `App.tsx` tira a meta da porta.

### Peças

`components/botao.ts` (classes de botão para `<button>` e `<Link>`),
`BarraDeTopo`, `Confirmacao`, `Aviso` e `EtiquetaProcessando`. Em `index.css`,
dentro de `@layer components` para que um utilitário consiga ajustá-las:
`.cartao`, `.linha-de-lista`, `.campo`, `.chip`, `.rotulo-de-secao`,
`.barra-de-topo`, `.barra-de-acao`, `.aviso` e `.faixa-rolavel`.

**`botao` é uma função de mapas, não `cva` + `cn`.** Nenhum dos dois estava no
bundle (o `cn` do shadcn nunca tinha sido importado), e juntos custavam 11,7 KB
gzipped. Nenhuma variante aqui briga com outra classe; o ligado usa
`aria-pressed:`.

Também mudou: o espiar lista até 6 neurônios e diz quantos faltam; o cartão do
neurônio escolhido na Rede abre o neurônio (antes, o livro); na tela do neurônio,
o título da barra leva ao livro.

Verificado com toque de verdade (CDP): 26 conferências dos fluxos novos, as 24 da
estante e as 8 da folha de novo, e nenhuma rolagem lateral em 320, 768, 1024 e
1440 px, nos dois temas. Bundle principal: 124 KB gzipped (121,5 antes).

## Empacotamento Android (Fase 9)

O projeto nativo existe em `android/` (`npx cap add android`), com `@capacitor/filesystem`
e `@capacitor/share`. **O APK nunca foi compilado:** esta máquina não tem JDK, Android
SDK, `adb` nem Gradle. Tudo que segue foi verificado no navegador servindo o `dist/` do
build do Android — que é exatamente o que a WebView vai servir.

### O modelo viaja dentro do pacote

`npm run build:android` baixa os quatro arquivos do modelo para `dist/modelos/` e o
adapter passa a procurar ali (`env.localModelPath = '/modelos/'`). São 129 MB no APK,
e em troca **a primeira execução não toca a rede** — que é a regra 2 do mestre levada a
sério: um app que só funciona depois de baixar 129 MB não é offline-first.

Três detalhes que não são óbvios:

- `allowRemoteModels = false`. Se um arquivo faltar, é melhor quebrar na hora do que o
  aparelho puxar 129 MB por dados móveis sem ninguém pedir.
- `useBrowserCache = false`. O modelo já está em disco; copiá-lo para o cache da WebView
  seria pagar 129 MB duas vezes.
- **É decisão de build, não de execução.** O adapter roda dentro de um Worker, onde a
  ponte do Capacitor não existe e `Capacitor.isNativePlatform()` responderia `false`. A
  flag é `VITE_ANDROID=1`, e o build do Android já é outro comando de qualquer jeito
  porque precisa baixar o modelo.

As alternativas descartadas: guardar no Cache API da WebView (é o que o desktop faz, mas
foi um `cache.put` de 267 MB que o Chrome recusou na Fase 3 — não dá para apostar o
offline nisso) e `env.customCache` sobre o Filesystem do Capacitor (durável, mas são
129 MB atravessando a ponte JS, e continua sendo download na primeira execução).

### Sem service worker no APK

Dentro do pacote o app já está em disco: o SW não protegeria de nada e ainda guardaria,
num cache da WebView, uma segunda cópia dos mesmos arquivos — com o risco de servir a
versão velha depois de uma atualização. `VitePWA({ disable: paraAndroid })`.

### Exportar backup na WebView

`<a download>` não faz nada numa WebView — não abre, não salva, não avisa. O backup vai
para `Directory.Cache` (a única pasta que não pede permissão em nenhuma versão do
Android) e abre a folha de compartilhamento. `salvarTexto` devolve **onde** o arquivo
parou; a frase que o usuário lê é escolhida pela tela, não pelo adapter.

### Divergência consciente do mestre

| Item  | Mestre                                                                   | Aqui                                     | Motivo                                                                                          |
| ----- | ------------------------------------------------------------------------ | ---------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Build | `npm run build` gera o `dist/` que o Capacitor empacota, sem build duplo | `build` e `build:android`, mesmo `dist/` | o APK carrega 129 MB de modelo e dispensa o SW; o deploy web não pode carregar nem um nem outro |

Os dois escrevem no mesmo `dist/`, então quem publicar na web depois de um
`build:android` precisa rodar `npm run build` antes. Está no README.

## A estante vira grade gravada (Fase 10, 13/09/2026)

Pedido do usuário: mais controle sobre a estante. Antes de mexer em código,
levantei o desenho atual e sugeri mais 9 ideias além das duas dele —
reorganizar como a bandeja de apps do Android (empurra quem já está lá) e
soltar num lugar vazio sem mexer no resto, mais tamanho de livro
configurável. As 9 sugeridas (divisores/etiquetas, tamanho do livro, ordenar
com um toque, seleção múltipla, textura/emblema na lombada, intensidade da
luz/lavagem, "modo organizar", minimapa, busca global) ficaram guardadas em
memória de projeto, aprovadas para implementar — esta fase é só a fundação
que as tornou possíveis.

### A pergunta que decidiu o desenho

A prateleira de um livro nunca tinha sido gravada — era 100% calculada
(`distribuicao(total)` fatiava a estante inteira, ordenada, em blocos de até
6 livros, 4 a 14 prateleiras, recalculado a cada render). Para "soltar num
lugar vazio sem mexer no resto" e "prateleiras manuais" fazerem sentido
juntos, havia dois caminhos:

- uma **grade de vagas fixas** por prateleira, com buracos visíveis mesmo no
  meio de livros existentes — mais parecido com a bandeja de apps de
  verdade, mas muda a estante de "livros encostados como estante cheia" para
  "grade com espaços", que não existia visualmente;
- uma **lista compacta por prateleira** (livros grudados, sem vão no meio,
  como hoje), onde só uma prateleira vazia ou o fim de uma prateleira conta
  como "vazio".

O usuário escolheu a segunda: mantém a estética atual e é a mudança mais
simples que ainda entrega as três coisas (prateleiras manuais, empurrar,
soltar sem mexer) juntas.

**Revisitado em 14/09/2026:** o usuário pediu a primeira, sabendo do custo —
ver "A estante vira fileira de lugares".

### Modelo de dados

`Livro` ganhou `prateleira: number` (gravado). `ordem` continua existindo,
mas mudou de escopo: era um índice denso da estante inteira, agora é denso
**dentro da prateleira** (0..N-1 daquela prateleira, não da estante toda). A
quantidade de prateleiras deixou de ser calculada a cada render e virou
preferência gravada (`meta.preferencias.quantidadeDePrateleiras` — a tabela
`meta` passou a guardar uma união de dois formatos de documento,
diferenciados pela `chave`, mesma tabela do `PerfilGravado`).

Migração Dexie v4, no mesmo espírito da v3 (`ordem`): quem já tinha livros
recebe a prateleira/ordem que a distribuição automática **de então**
calculava, rodada uma última vez sobre o estado atual — nenhum livro muda de
lugar. Essa distribuição antiga (`distribuicaoAntiga`/`posicoesAntigas`) saiu
de `prateleiras.ts` e foi congelada em `src/core/domain/estanteAntiga.ts`,
só para a migração e para reconstruir backups de antes desta fase — mesmo
padrão do `ordem?: number` opcional que já existia desde 12/09/2026, agora
com `prateleira?: number` ao lado.

### O que "bandeja de apps" significou na prática

A primitiva já existia: `inserirNaOrdem` (criada para o livro nascer no fim
de uma prateleira) já empurra quem está na posição em diante. A única peça
nova de verdade foi `moverLivroNaEstante` — mover **entre** prateleiras, que
fecha o buraco na origem (reindexando o que sobrou) e insere no destino.
Nenhuma primitiva de reordenação precisou ser inventada além dela.

`reordenarLivros` (que exigia a permutação de **toda** a estante — proteção
que fazia sentido para uma troca 1:1) virou `moverLivro(id, prateleira,
posicao)`, escopado só na uma ou duas prateleiras tocadas. Exigir a estante
inteira para mover um livro seria uma trava desproporcional ao tamanho da
operação.

`trocarNaOrdem`/`aplicarOrdem` — as primitivas do gesto de troca 1:1 antigo —
ficaram sem chamador depois da mudança e foram removidas (regra 7 do
mestre: zero código sem uso concreto).

### Interação

`useManipularLivros` passa a detectar duas coisas no arrasto, não uma: em
qual prateleira o dedo está (`data-prateleira`, novo em `.movel-vao`) e,
dentro dela, se há um livro embaixo (entra antes dele) ou área vazia (vai
para o fim). Soltar numa prateleira vazia ganhou um retorno visual próprio,
mais discreto que o anel de "alvo" de um livro: `data-alvo-vazio` em
`.movel-vao` acende um contorno fraco na fileira inteira, porque ali quem
aceita o solto é a prateleira, não um lugar preciso.

### Ajustes ganhou uma seção nova

Um stepper de "Prateleiras", no mesmo padrão visual das outras seções da
tela. Recusa diminuir com aviso quando sobraria livro numa prateleira que
deixaria de existir — usa o `Aviso` flutuante que já existia, sem componente
novo.

**Teto de 6 desde 15/09/2026** (pedido do usuário): `MAXIMO_DE_PRATELEIRAS`
em `core/domain/ordem.ts`. O "+" para em 6 e o repositório recusa mais que
isso. Quem já tinha mais de 6 não perde nada — só não sobe além, e pode
diminuir normalmente. (O `MAXIMO_DE_PRATELEIRAS` de `estanteAntiga.ts`, 14,
é outro: congelado, só da migração.)

**Bug do teto, visto pelo usuário na hora:** as duas setas do stepper
(`disabled` nativo no limite) dividem a mesma `.linha-de-lista`, e o CSS
`.linha-de-lista:has(:disabled)` apaga a linha **inteira** — pensado para uma
linha de controle único ficar inerte enquanto "travada" (ocupado). Ao chegar
em 6, "Mais" virava `disabled` e essa regra também bloqueava "Menos" por
herança de `pointer-events`, mesmo ele continuando clicável no React
DevTools. Corrigido: `disabled` nativo passou a valer só para "travado"; o
limite de cada seta é `aria-disabled` (fora do `:has(:disabled)`), com o
próprio clique guardado contra o limite e o estilo replicado via
`aria-disabled:opacity-45 aria-disabled:pointer-events-none`. Verificado
descendo do teto até o mínimo de verdade (livro ocupando a última prateleira)
e voltando a subir, sem travar em nenhum dos dois sentidos.

### Verificado

164 testes (novos: `moverLivroNaEstante`, `estanteAntiga`, migração v3→v4
completa com mais de um livro por prateleira, `montarPrateleiras` por
prateleira gravada, `moverLivro` e quantidade de prateleiras no
repositório) + typecheck + lint, tudo limpo. No navegador, com toque de
verdade (Playwright): arrastar um livro sobre outro empurra os que vêm
depois na mesma prateleira; soltar numa prateleira vazia não mexe em mais
nada; o stepper funciona nos dois temas e em mobile/desktop; o estado
sobrevive a recarregar a página.

## Modo organizar (Fase 11, 13/09/2026)

Primeira das 9 melhorias de estante aprovadas depois da Fase 10 (ver memória
de projeto — a ordem foi decidida por dependência/risco/valor, não pedida
item a item). Pedido original: "liga/desliga arrastar, pra evitar mexer sem
querer num livro só de passagem no toque longo."

**O que muda:** um botão nas costas da estante (`Grip`, ao lado da contagem)
liga/desliga se segurar-e-arrastar move o livro. Desligado (padrão), segurar
ainda ergue o livro e acende as pontes dele — isso continua útil sem
reorganizar nada —, só que mover o dedo depois não vira arrasto: soltar
sempre abre o menu, do mesmo jeito que soltar parado já abria. Ligado, o
gesto de arrastar da Fase 10 funciona como sempre.

**Onde vive o estado:** local em `Estante.tsx` (`useState`), não na store nem
gravado — é um modo de trabalho, não uma preferência do palácio. Cada visita
à estante começa com o arrastar desligado.

**Por que a única mudança de lógica foi uma linha:** a transição
`erguido → arrastando` em `useManipularLivros` já era o único lugar que
decidia se um gesto vira arrasto. Bastou gatear ali (`if (fase === 'erguido'
&& !organizando) return`) — nenhuma outra parte da máquina de estados
precisou saber que o modo existe.

**Gotcha do posicionamento:** a primeira tentativa colocou o botão à direita
da contagem (fim da fileira) e ele foi parar debaixo do botão de criar (Dial),
fixo no canto inferior direito — clicável só em teoria, inalcançável na
prática (Playwright confirmou: `intercepts pointer events`). Corrigido
colocando o botão à **esquerda** da contagem.

Verificado com toque de verdade (Playwright): sem o modo, arrastar não move
e soltar abre o menu; com o modo ligado, arrastar move como na Fase 10. Nos
dois temas, 320/412/1440 px. 164 testes, typecheck e lint continuam limpos
(mudança pequena o bastante para não precisar de teste novo — coberta pela
verificação manual, como o resto do gesto de arrastar já era).

## Busca global (Fase 12, 13/09/2026)

Segunda das 9 melhorias aprovadas depois da Fase 10. Pedido original: "achar
um neurônio ou livro direto, sem procurar visualmente na estante."

**O que é:** uma tela nova (`/busca`), com um campo de texto que filtra livros
(pelo título) e neurônios (pelo título ou pelo conteúdo) sobre o que a store
já tem em memória — sem índice, sem lib de busca, sem tocar o banco.
`buscar.ts` (`src/features/busca/`) é puro e despe qualquer acento antes de
comparar (`normalize('NFD')` seguido de remover os acentos combinantes que
sobram, via uma faixa Unicode em regex), então "pratica" acha "prática". Resultado por título vem antes de resultado só por conteúdo, e
neste último caso mostra o trecho em volta do termo — é o que explica por que
aquele neurônio apareceu.

**Onde o ícone mora:** na barra de topo de toda tela que já tem uma (Rede,
Livro, Neurônio, Ajustes — usa o `acoes` que `BarraDeTopo` já aceitava). A
estante é a única tela sem barra de topo; ali o ícone entrou na fileira de
baixo, ao lado do de modo organizar.

**Por que não foi para o Dial:** o Dial já tem 3 destinos ocupando um arco de
120° bem justo — a matemática (`setores(n)`, `RAIO_MEIO`) mostra que um 4º
setor deixaria os botões se sobrepondo (corda entre centros ≈ 39px contra um
botão de 52px). Mexer numa interação tão ajustada por uma funcionalidade que
já tem lugar natural na barra de topo não valia o risco.

**Gotcha, de novo o mesmo:** a primeira versão do ícone na estante foi
colocada depois do texto da contagem (`flex-1`) e ficou atrás do botão de
criar, igual ao que já tinha acontecido com o modo organizar — mesma causa,
mesma correção (os dois botões vêm antes do texto, não depois).

Verificado com Playwright: busca sem acento encontra conteúdo acentuado,
título vem antes de conteúdo, "nada encontrado" aparece quando não bate nada,
clicar num resultado navega para o neurônio/livro certo, ícone presente e
alcançável nas 4 telas com barra de topo + na estante, nos dois temas e em
mobile/desktop. 173 testes (9 novos, de `buscar.ts`), typecheck e lint
limpos.

## Ordenar com um toque (Fase 13, 13/09/2026)

Terceira das 9 melhorias aprovadas depois da Fase 10. Pedido original:
"ordenação automática de um clique (por nome, data, nº de neurônios) como
atalho, mantendo o manual como padrão."

**O que é:** o mesmo ícone de "ordenar" (ao lado de organizar/buscar, na
fileira de baixo da estante) abre uma folha com três critérios — Nome (A→Z),
Mais recente primeiro, Mais neurônios primeiro. Escolher um reordena cada
prateleira **dentro dela mesma**, na hora.

**"Mantendo o manual como padrão" significou, na prática:** ordenar nunca
muda `Livro.prateleira`, só `Livro.ordem` — nenhum livro troca de prateleira.
Depois de ordenar, arrastar continua funcionando exatamente como antes
(`moverLivro`), porque a ordenação automática não é um modo, é só uma
reescrita pontual de `ordem`. `ordenarPorCriterio` (`features/estante/
ordenar.ts`) é pura e devolve só quem mudou — mesmo espírito de
`moverLivroNaEstante`.

**Onde a persistência entra:** um repositório novo e pequeno,
`definirOrdens(mudancas)` — regrava só `ordem` dos livros informados, nunca
`prateleira`. Não precisou da validação de permutação completa que
`reordenarLivros` tinha antes da Fase 10: como `prateleira` nunca muda aqui,
não existe como perder um livro de vista.

**Por que o painel foi para o mesmo sistema de `Painel` da estante, e não um
componente à parte:** `{ tipo: 'ordenar' }` entrou na mesma união que já
tinha `'novo'` (sem `livroId`) — reaproveita a folha, a URL como fonte de
verdade (`?ordenar=1`) e o botão voltar fechando o menu, em vez de inventar
um segundo mecanismo de diálogo só para isto.

Verificado com toque de verdade: juntar dois livros numa prateleira (modo
organizar), ordenar por nome, e ver a prateleira trocar de ordem sem sair do
lugar; sobrevive a recarregar; layout de três ícones sem rolagem horizontal
em 320/412/1440 px, dois temas. 179 testes (6 novos, de `ordenar.ts`),
typecheck e lint limpos.

## Seleção múltipla (Fase 14, 13/09/2026)

Quarta das 9 melhorias aprovadas depois da Fase 10. Pedido original: "mover
vários livros de uma vez, em vez de um por um."

**Como entra:** "Selecionar vários", um item novo no menu de Ações (segurar
um livro) — não um botão fixo a mais na fileira de baixo, que já tinha três
ícones e um quarto apertaria demais em 320px. Escolher ali já marca aquele
livro e liga o modo.

**O que muda enquanto está ligado:** tocar um livro marca/desmarca (em vez de
espiar) — o `onEspiar` que o gesto já chamava simplesmente é trocado por
"alternar seleção" em `Movel.tsx`, sem o hook de gesto (`useManipularLivros`)
precisar saber que seleção existe. Tocar a área vazia de uma prateleira —
o mesmo alvo que hoje cria um livro novo ali — move o grupo inteiro para o
fim daquela prateleira e desliga o modo. Não existe arrastar em grupo: a
estante já resolve "mover vários" bem com um toque, e estender o gesto de
arrastar para múltiplos itens seria round-trip que o produto não pedia.

**Por que não precisou de repositório novo:** `moverVariosLivros` (na store)
só ordena os ids pela posição atual na estante — para preservar a ordem
relativa entre quem foi marcado — e chama `moverLivro` um de cada vez, em
sequência, esperando cada um. A store lê o estado mais recente a cada volta
do laço, então cada chamada já enxerga o resultado da anterior. Reaproveita
a mesma trava de "nunca perder livro" que `moverLivro` já tinha desde a
Fase 10 — mover em grupo não é uma operação nova, é a mesma de sempre em
laço.

**O selo de "selecionado":** o mesmo anel de papel do alvo de arrasto
(`[data-alvo]`), mais um selo circular com `Check` no pé da lombada — o
ponto de ponte já mora no topo (`.lombada-ponto`).

Verificado com toque de verdade: segurar → "Selecionar vários" → tocar um
segundo livro soma à seleção sem abrir o espiar por engano; tocar de novo
desmarca; tocar prateleira vazia move o grupo (preservando a ordem relativa)
e desliga o modo; "Cancelar" sai sem mexer em nada. Nos dois temas, mobile
(320/412) e desktop, sem rolagem horizontal. 179 testes, typecheck e lint
continuam limpos — a interação em si foi verificada no navegador, não em
teste automatizado, mesmo padrão do resto do gesto de arrastar.

## Nome de prateleira (Fase 15, 13/09/2026)

Quinta das 9 melhorias aprovadas depois da Fase 10, e a primeira que cria uma
entidade nova no banco. Pedido original: "um marcador que você arrasta pra
estante para separar seções por tema." Antes de desenhar, perguntei ao
usuário o que o marcador separa de verdade — prateleiras (já manuais desde a
Fase 10) ou livros dentro da mesma prateleira — porque as duas leituras
pedem implementações muito diferentes. Ele escolheu a mais simples: **nome
de prateleira**, não um objeto arrastável entre livros.

**O que é:** cada prateleira pode ganhar um texto opcional (ex. "Trabalho"),
puramente visual — não é um livro, não tem neurônio, não entra no grafo, não
participa da ordem. Editado por toque, não por arrasto: um selo pequeno
(ícone de etiqueta, ou o próprio texto quando já tem um) no canto superior
esquerdo de cada prateleira, acima da sombra da tábua de cima para não sumir
nela.

**Modelo de dados, o mais simples que dava:** tabela nova `etiquetas`,
chave primária o próprio número da prateleira — não precisa de `id` nem
`createdAt`, porque só existe uma etiqueta por prateleira e ela não é um
"registro" no sentido de `Livro`/`Neurônio`, é mais parecida com a
preferência de `meta.preferencias` da Fase 10. Texto vazio apaga a linha em
vez de gravar string vazia. Dexie v5, tabela nova sem migração nenhuma —
mesmo padrão da v2 (`meta`).

**Export/import:** etiqueta entra no backup (a etiqueta do arquivo vence a
que já existia na mesma prateleira; uma etiqueta que só existe aqui não é
apagada — o mesmo "funde" de sempre). Backup de antes desta fase não tem o
campo; o schema trata como `[]`.

**Gotcha de nome:** já existia uma classe `.lombada--etiqueta` — o adorno de
papel colado numa lombada de enfeite, sem relação nenhuma com isto. A classe
nova chama `.movel-nome` de propósito, para não colidir o conceito.

Verificado com toque de verdade: nomear, reabrir (o campo vem preenchido),
renomear, remover, e confirmar que tocar um livro de verdade continua
abrindo o espiar normalmente — o selo é um botão de verdade, não rouba o
toque de mais nada. Nos dois temas, 320/412/1440 px, sem rolagem horizontal.
191 testes (12 novos: repositório e export/import de etiquetas), typecheck
e lint limpos.

## Textura/emblema na lombada (Fase 16, 13/09/2026)

Sexta das 9 melhorias aprovadas depois da Fase 10. Cada livro pode ganhar um
ícone opcional na lombada, além da cor — para diferenciar livros parecidos
sem depender só do nome (dois livros de tom parecido, ou vários com o mesmo
pano). Escolhido no mesmo formulário de nome/pano, num novo campo "Emblema"
com "Nenhum" + 8 ícones fixos (estrela, coração, raio, folha, lua, sol,
chama, pena — `features/estante/emblemas.ts`). O selo aparece pequeno, na
base da lombada.

**Nunca dourado** — a mesma regra da "Direção visual": ouro é só a ponte
entre livros, um emblema é decoração do livro, não um achado do palácio.

**Convive com o check de seleção no mesmo lugar.** A Fase 14 já desenha um
check ali quando o livro está marcado; os dois nunca fazem sentido juntos
(um livro selecionado não precisa também mostrar o emblema), então é uma
única posição com exclusão mútua — selecionado sempre vence.

**Migração sem trocar de versão de schema, de propósito.** `emblema` não é
indexado — não se filtra nem se busca por ele —, então a v6 do Dexie só
precisava dar um valor a quem já existia; `.stores({})` (nenhum índice novo)
com um `.upgrade()` que grava `emblema: null` em todo livro é mais barato
que subir um índice que ninguém vai usar. Export/import trata a ausência do
campo (backup de antes da Fase 16) do mesmo jeito: `null`.

**Gotcha do ESLint, novo nesta fase:** o projeto roda as regras do React
Compiler (`react-hooks/static-components`), que recusam qualquer tag JSX
vinda de uma variável calculada em tempo de render — mesmo quando essa
variável só aponta para um de oito componentes fixos e nunca muda de
identidade de verdade. `iconeDoEmblema(chave)` devolvendo o componente e
`<IconeEscolhido />` na sequência foi exatamente esse caso, e a regra não
tem como provar que o lookup é estável. Resolvido com um `switch` que usa a
tag literal de cada ícone (`EmblemaDaLombada.tsx`) — nenhuma tag JSX vem de
variável, só de import direto. Post-scriptum: `EMBLEMAS` (a lista para o
formulário, iterada com `.map` e desestruturada por item) não cai nessa
regra — o problema é especificamente uma variável de módulo recalculada a
cada render, não iterar uma lista estática.

Verificado com toque de verdade: escolher um emblema no formulário mostra
na amostra da lombada; salvar mostra o mesmo ícone na estante de verdade;
ligar "Selecionar vários" troca o emblema pelo check sem os dois aparecerem
juntos. Nos dois temas, 320/1440 px, sem rolagem horizontal. 197 testes (6
novos: repositório, migração v6 e export/import do emblema), typecheck e
lint limpos (0 erros, 0 avisos).

## Intensidade da luz ajustável (Fase 17, 13/09/2026)

Sétima das 9 melhorias aprovadas depois da Fase 10. Desde a Fase 6 a lombada
em repouso mostra a cor do pano **lavada** pela luz da sala — de longe não se
vê a cor real, só de perto (ver "A estante", "distância desbota"). Esse tanto
de lavagem era uma constante fixa no código (58% da cor real, 42% da luz);
agora é uma preferência, ajustável em Ajustes → Estante com um slider (0 a
100).

**Onde a preferência mora:** junto de `quantidadeDePrateleiras`, no mesmo
documento `meta.preferencias` (Fase 10) — nenhuma tabela nova, nenhuma versão
nova do Dexie. `intensidadeDaLuz` é só mais um campo opcional ali, com
`INTENSIDADE_DA_LUZ_PADRAO` (42) valendo para quem nunca definiu, e não entra
no backup pelo mesmo motivo de `quantidadeDePrateleiras` não entrar: é
preferência local, não dado do palácio.

**Gotcha que só apareceu com dois campos no mesmo documento:** como
`definirQuantidadeDePrateleiras` e a fusão de um import regravam o documento
`preferencias` inteiro, os dois já tinham (antes desta fase, sem sintoma
porque só havia um campo) o risco de sobrescrever um campo irmão com
`undefined` se não lessem o documento atual primeiro. Corrigido nos três
pontos que gravam ali: sempre ler o documento antes de regravar, preservando
o campo que a operação não veio para mudar.

**Escopo: só a lombada de verdade, não o enfeite.** As lombadas escuras que
preenchem a prateleira (`LombadaDeEnfeite`, ver "A estante na mão") já usam
uma faixa própria e bem mais lavada (8-38%) para saltarem menos que os livros
de verdade — uma fórmula independente, não `pano()`. Estender o slider a elas
também exigiria decidir uma segunda escala proporcional só para preservar
essa relação, por um efeito que ninguém pediu; fora do escopo desta fase.

**Por que virou um controle de linha inteira, não inline como o de
prateleiras:** a primeira versão pôs o slider ao lado do texto, na mesma
linha — coube bem em 1440px, mas em 320px espremeu a descrição numa coluna
tão estreita que ela quebrou em seis linhas curtas e feias. Um slider também
pede mais largura que um contador +/- para ser arrastável com o dedo.
Resolvido pondo o slider **abaixo** do título, ocupando a linha inteira.

Verificado no navegador: o slider muda a cor da lombada na hora (0 mostra a
cor real mesmo em repouso, 100 lava quase tudo na cor da sala), a amostra do
formulário de livro acompanha o mesmo valor, e o ajuste sobrevive a
recarregar a página. Nos dois temas, 320/390/1440 px, sem rolagem horizontal.
206 testes (9 novos: `clampIntensidadeDaLuz`, `pano()` com intensidade,
repositório), typecheck e lint limpos (0 erros, 0 avisos).

## Visão geral da estante (Fase 18, 13/09/2026)

Oitava das 9 melhorias aprovadas depois da Fase 10. Motivo real, não só
estético: a fileira nunca fica menor que 92px (`.movel-fila`, ver "A estante
se mede pela tela"), e a estante **não rola** — de propósito, desde a Fase 6,
para arrastar não disputar o dedo com a rolagem. As duas decisões juntas
significam que um palácio com mais prateleiras do que o piso de 92px cabe na
tela perde prateleiras de vista **sem jeito nenhum de alcançá-las**: elas
ficam cortadas por trás do rodapé, e nem rolar nem redimensionar resolve.
Verificado direto: num aparelho de 892px de altura, 20 prateleiras a 92px
cada só deixam 8 visíveis — as outras 12 simplesmente não existem para quem
olha a tela.

**A solução não é rolar, é caber.** Um botão (`Ver a estante inteira`, ao
lado do de organizar) troca o piso da fileira de 92px para 24px — o
suficiente para qualquer quantidade razoável de prateleiras caber de uma vez,
sem cortar nenhuma. Como a estante continua sem rolagem, "ver tudo de uma vez
zoomed out" já cumpre o que um minimapa cumpriria num painel que rolasse — daí
os dois nomes da ideia (minimapa/zoom-out) virarem uma coisa só.

**Nesse tamanho, detalhe teria virado ruído.** Título gravado, selo de
seleção, emblema e nome de prateleira não caberiam legíveis a 24px de altura
— em vez de espremer texto ilegível, a Fase esconde todos eles
(`display: none` sob `.movel[data-visao-geral]`) e deixa só a cor de cada
lombada, a mesma leitura de um minimapa de editor de código. Nenhuma lógica
de gesto mudou: `useManipularLivros` não sabe que o modo existe, então
tocar, segurar, arrastar e criar continuam funcionando exatamente como
sempre, só que em cima de retângulos menores — zero risco para o gesto que
levou sete fases para ficar certo.

**Sem persistência, de propósito** — mesmo motivo do modo organizar (Fase
11): é um jeito de olhar a estante agora, não uma preferência do palácio.
Cada visita volta ao tamanho normal.

**Gotcha:** a primeira versão também reduzia o `padding-left` da fileira (de
26px para 4px), pensando que aqueles 26px existiam só para abrir espaço para
o selo de nome da prateleira — que some na visão geral de qualquer jeito.
Errado: o padding existe para o primeiro livro não ficar **atrás da pilastra
esquerda** (24px de largura, sempre por cima da fileira — ver "A estante na
mão"), e isso não depende do tamanho da fileira. Com o padding reduzido, o
primeiro livro de cada prateleira ficava inclicável (Playwright: `intercepts
pointer events`, a mesma classe de erro da Fase 11). Corrigido devolvendo o
padding ao valor de sempre.

Verificado com 20 prateleiras num viewport de 412×892: modo normal mostra 8,
visão geral mostra as 20; tocar um livro ainda espia normalmente; desligar
volta o título a aparecer. Nos dois temas, 320/1440 px, sem rolagem
horizontal. Sem teste automatizado novo — é CSS mais um booleano local, sem
função pura nova para testar (mesmo caso do modo organizar, Fase 11); 206
testes, typecheck e lint continuam limpos.

## Largura da lombada configurável (Fase 19, 13/09/2026)

Nona e última das melhorias de estante aprovadas depois da Fase 10 — e uma
das duas ideias originais do próprio usuário (a outra, "bandeja de apps do
Android", virou a Fase 10 inteira). Pedido original: largura **e altura**
configuráveis por livro.

**Só a largura entrou.** A altura da lombada é a quantidade de neurônios do
livro — a única métrica que a estante mostra sem abrir nada (ver "A
estante"). Um override manual de altura apagaria esse sinal, e sem jeito de
saber, só olhando, se um livro alto tem muito conteúdo ou só foi esticado à
mão. Apontei essa tensão antes de desenhar; o usuário respondeu para seguir
mesmo assim, sem pausar — o registro fica aqui, para o caso de a decisão
precisar ser revisitada.

**O que é:** no mesmo formulário de nome/pano/emblema, um campo "Largura"
com cinco opções — Automática (o de sempre: varia com a semente do id,
30-46px) e quatro tamanhos fixos, Fina (24px) a Grande (68px). Escolher um
grava `Livro.larguraLombada`; `null` continua sendo "automática".

**Onde a escolha entra:** `montarPrateleiras` troca a largura calculada pela
gravada quando ela existe (`item.livro.larguraLombada ?? automatica`) — uma
linha, porque a única outra mudança foi o dado existir. Nenhuma prateleira,
nenhum enfeite, nenhum gesto de arrastar precisou saber que a largura pode
vir de dois lugares diferentes: a estante já lida com largura variável desde
sempre (é o que faz duas lombadas nunca serem idênticas), só nunca tinha um
terceiro lugar de onde ela podia vir.

**Mesmo padrão de dado opcional das Fases 16 e 17:** `larguraLombada` não é
indexado, então a v7 do Dexie só precisa dar `null` pra quem já existia
(`.upgrade()` sem novo índice) — terceira vez que esse molde se repete, e a
essa altura é claramente **o** jeito de adicionar um campo simples à lombada
neste projeto. Entra no backup, com o mesmo "ausente = null" de sempre para
arquivos de antes desta fase.

Verificado com toque de verdade: escolher "Grande" alarga a amostra do
formulário e a lombada de verdade na estante, mantendo a altura intocada;
reabrir o formulário mostra a opção certa marcada; voltar para "Automática"
devolve exatamente a largura de antes (mesma semente, mesmo resultado). Nos
dois temas, 320/1440 px, sem rolagem horizontal — a 320px a fileira de
opções quebra em duas linhas (`flex-wrap`), sem cortar nada. 214 testes (8
novos: `montarPrateleiras` com e sem largura própria, repositório, migração
v7, export/import), typecheck e lint limpos (0 erros, 0 avisos).

Com esta fase, as 9 melhorias de estante aprovadas depois da Fase 10 (ver
memória de projeto) estão todas implementadas.

## A estante fica mais simples, e a altura vira escolha (14/09/2026)

Pedidos do usuário, em sequência, na mesma sessão: simplificar a estante e
Ajustes, e revisitar a tensão que a Fase 19 deixou registrada.

### Estante e Ajustes com menos botão

- **Nome de prateleira (Fase 15), modo organizar (Fase 11) e ordenar com um
  toque (Fase 13) saíram.** Sem o toggle do modo organizar, arrastar voltou
  a funcionar sempre — como era antes da Fase 11. Ajustes perdeu as seções
  Backup (export/import, Fase 5) e Manutenção (reprocessar tudo);
  `exportAll`/`importAll` e a tabela `etiquetas` continuam no repositório,
  só não têm mais UI — cortar até aí bastou, e é mais barato de reverter do
  que arrancar a infraestrutura de banco também.
- A seção "Emblema" (Fase 16) saiu do formulário de livro — emblemas já
  salvos continuam aparecendo na lombada, só não dá mais para escolher um
  novo por ali. `emblemas.ts` foi removido por ficar sem chamador.
- **Os livros de enfeite (decorativos, sem título) ficaram uniformes:**
  mesma largura, mesma altura, sem filete dourado, sem etiqueta de papel
  colada, sem inclinação — só a cor varia agora, na mesma paleta de sempre.
  A variação "deitado" deixou de existir.

### O comprimento da lombada, e a tensão da Fase 19 revisitada

A Fase 19 apontou a tensão e registrou "para o caso de a decisão precisar
ser revisitada" — revisitada agora, a pedido explícito do usuário e sabendo
do custo (perguntei antes de implementar): **`Livro.comprimentoLombada:
number | null`** (Dexie v8), no mesmo padrão de `larguraLombada` de ponta a
ponta — schema Zod, migração, snapshot de export/import, protocolo do
Worker, store. `null` continua sendo automático (altura = quantidade de
neurônios, como sempre); um valor escolhido na mão sobrepõe esse sinal só
para aquele livro.

Seção "Comprimento" no formulário, espelhando "Largura": Automático + 4
pressets — Curto (55%), Normal (72%), Alto (88%), Enorme (98%), em % da
fileira, a mesma escala de `ALTURA_MINIMA`/`ALTURA_MAXIMA` em
`Lombada.tsx`. A amostra do formulário não vive dentro de uma fileira de
verdade, então a porcentagem escolhida vira altura em px só para a
pré-visualização, por uma referência local (`REFERENCIA_DA_AMOSTRA_PX`).

Verificado com toque de verdade e no navegador: as remoções conferidas
visualmente (estante sem os 3 botões extras, Ajustes só com "Estante",
livros de enfeite uniformes e retos); o Comprimento testado criando um
livro "Enorme" sem neurônio nenhum e vendo a lombada nascer alta mesmo
assim — a prova de que o sinal automático é mesmo sobreposto. 202 testes
(2 novos: migração v8), typecheck e lint limpos.

## Criar livro vira tela cheia, e o título da amostra é recentralizado (14/09/2026)

Pedido do usuário, mesmo dia: "Um livro novo" deixa de ser bottom sheet e
vira rota própria (`/novo-livro?prateleira=N`), no mesmo padrão que
`/novo` já usa para neurônio — sair é o X da barra de topo, e
`FormularioDeLivro` ganhou `onCancelar` **opcional**: presente na folha de
editar (que continua sheet), ausente na tela cheia, onde o botão duplicado
só ocuparia espaço. Como quem cria não é mais o mesmo componente que anima
a chegada na prateleira, a estante passou a ler `?chegou=<id>` na URL
(lido já na inicialização do estado, não num efeito — evita o aviso do
React Compiler sobre `setState` síncrono em efeito) e some com o parâmetro
logo em seguida.

**Sem rolagem, de propósito.** Tiradas as legendas descritivas abaixo de
"Um livro novo" (agora só "Novo livro"), "Largura" e "Comprimento", a tela
inteira cabe em 390×844 sem sobrar conteúdo — verificado comparando
`scrollHeight` com `innerHeight` da página. Um gotcha no caminho: a rota
nova esqueceu de entrar em `SEM_BOTAO_DE_CRIAR` (`App.tsx`), e o Dial
sobrava por cima do botão "Criar livro" com 112px de respiro reservado
para ele — mesmo erro que `/novo` já tinha resolvido, só que para uma rota
que ainda não existia.

**O título da amostra estava saindo do centro.** `.lombada-titulo` usava
`position: absolute` com `inset` assimétrico (6px em cima, 8px embaixo) e
`margin: auto` — uma técnica que só centraliza de verdade quando o texto
cabe no espaço entre os dois. Quando não cabe (comum na amostra do
formulário, mais baixa que uma lombada de verdade), o navegador não corta
dos dois lados: ele cresce a partir do topo, e o título parece "subido".
Trocado por `.lombada` como flex container (`align-items` e
`justify-content: center`) com o título como item de flex comum — agora
centraliza sempre, e um título comprido demais corta simetricamente dos
dois lados. Junto, a referência que converte o Comprimento (%) em pixels
de pré-visualização subiu de 60 para 130, para a amostra parecer mais com
uma lombada de verdade e sobrar espaço de verdade para o título.

Verificado no navegador: a tela nova sem folha, sem Dial por cima, sem
rolagem; a amostra com um título propositalmente comprido ("Teste
Enorme") ficando inteiro e centralizado, tanto na amostra quanto na
lombada de verdade depois de criado; editar continua sendo folha, com o
"Cancelar" que a tela cheia não tem. 202 testes, typecheck e lint limpos.

## A estante vira fileira de lugares (14/09/2026)

Pedido do usuário: pôr um livro em **qualquer** lugar da prateleira — inclusive
com buraco antes dele —, e poder apagar e criar livros de enfeite.

**Isso revisita a escolha da Fase 10**, que ficou com a lista compacta
justamente para não haver buraco no meio da fileira. Apontei antes de mexer,
com as três leituras possíveis; ele escolheu **lugares fixos: livro, enfeite ou
vazio**, sabendo que a estante deixa de parecer cheia onde ele abrir vaga.

### Modelo

- Cada prateleira tem `LUGARES_POR_PRATELEIRA` (26) lugares — o mesmo 26 que
  era a quantidade de enfeites, o bastante para transbordar a prateleira mais
  larga (672 px) e sumir atrás da pilastra da direita.
- `Livro.ordem` virou **o lugar**, esparso. Ordem densa já era lugar válido:
  **não houve migração de dado**, e nenhum livro mudou de lugar ao atualizar.
- **A tabela guarda os buracos, não os enfeites** (`vagas`, Dexie v9, chave
  `[prateleira+ordem]`). Gravar os enfeites seriam 26 linhas por prateleira, e
  uma prateleira nova nasceria pelada; gravando os buracos são poucas linhas, e
  a estante continua cheia por padrão.
- A cor de um enfeite sai do **lugar** (`e{prateleira}-{lugar}`), não da
  posição numa lista. Antes, pôr um livro no começo da prateleira trocava a cor
  de todos os enfeites depois dele. Por isso, na primeira abertura depois da
  mudança, as cores dos enfeites mudaram — os livros não.
- Vaga e enfeite têm a mesma largura (30 px): tirar um enfeite não faz a
  fileira andar. Um livro largo que sai deixa uma vaga de 30 px, e os vizinhos
  da direita andam na tela — os lugares deles não mudam.

### Regras (puras, em `core/domain/ordem.ts`)

| Situação                                     | O que acontece                                                                          |
| -------------------------------------------- | --------------------------------------------------------------------------------------- |
| Soltar num lugar sem livro (enfeite ou vaga) | Só o livro se move                                                                      |
| Soltar num lugar com livro                   | Empurra a fila até o buraco mais perto: primeiro à direita, senão à esquerda            |
| Prateleira sem nenhum lugar livre            | Recusa, com aviso                                                                       |
| O lugar de onde o livro saiu                 | Vira vaga — nada anda sozinho                                                           |
| Apagar um livro                              | O lugar dele vira vaga, pela mesma regra                                                |
| Criar um livro                               | Nasce no lugar tocado; se outro livro chegou antes, no buraco mais perto. Nunca empurra |

`vagasDepoisDeMover` é a conta das vagas, a mesma na store (otimismo) e no
repositório (gravação). `upsertLivro` fecha a vaga embaixo do livro gravado:
é o único ponto de escrita de livro, então "vaga nunca embaixo de livro" mora
num lugar só.

### Gestos

| Gesto                                   | O que faz                                                                   |
| --------------------------------------- | --------------------------------------------------------------------------- |
| Tocar um lugar sem livro                | Cria um livro exatamente ali (`/novo-livro?prateleira=&lugar=`)             |
| Segurar um lugar sem livro e soltar     | Menu do lugar (`?lugar=P-L`): criar aqui, tirar o enfeite ou pôr um enfeite |
| Arrastar um livro                       | Solta no lugar embaixo do dedo                                              |
| Seleção múltipla ligada, tocar um lugar | Põe o grupo a partir dali, cada um no próximo buraco                        |

O menu do lugar abre **na soltura**, como o do livro, e não quando o tempo de
segurar completa: aberto por baixo do dedo, a soltura cairia na folha
recém-aberta.

### Detalhes que não são óbvios

- **O alvo do arrasto é a coluna do dedo, não o elemento embaixo dele.** As
  lombadas têm alturas diferentes: pelo elemento, soltar acima de um livro
  baixo caía no vão da prateleira e não achava lugar nenhum. `alvoNaEstante`
  acha a prateleira sob o dedo e, nela, o lugar cuja faixa horizontal contém o
  dedo.
- O lugar do livro na mão continua sendo alvo: o vão que ele deixa
  (`data-estado='vazio'`) segue na fileira, e soltar nele é desistir.
- O botão único por prateleira (`.movel-criar`) saiu. Cada lugar sem livro é
  um `<button>` da altura da fileira inteira — tocar acima de um enfeite ainda
  é tocar o lugar dele —, e teclado e leitor de tela ganham um alvo por lugar
  em vez de "criar no fim".
- Import funde **por lugar**: o livro do arquivo fica no lugar dele; o que só
  existe aqui fica no seu se estiver livre, senão vai para o buraco mais perto.
  Backup de antes dos lugares não tem `vagas` e entra com a estante cheia.
- O fio de poeira no pé da vaga usa `--papel`, não branco: de dia o fundo da
  estante é claro, e o branco sumia.
- Dexie aceita no máximo cinco tabelas soltas numa transação. Import e `clear`
  passaram a seis e recebem a lista num array.

Verificado com toque de verdade (CDP) em 412×892, nos dois temas: arrastar para
enfeite, para vaga e para cima de outro livro (empurra), soltar no alto da
fileira, criar no meio de uma prateleira vazia, tirar e pôr enfeite, mover em
grupo a partir de um lugar — tudo sobrevivendo a recarregar. No desktop, o
mouse arrasta, o clique cria e o botão direito abre o menu. Sem rolagem lateral
em 320, 768 e 1440 px. 227 testes (eram 202), typecheck e lint limpos. Bundle
principal: 121 KB gzipped.

## Abrir o livro (14/09/2026)

Pedido do usuário: ao abrir um livro, o próprio livro vai para o meio da tela e
se abre, dando acesso à tela dele. É atmosfera — o tipo de coisa que a decisão
"estética por último" empurrava para a passada final —, mas foi pedido
explicitamente agora.

### O que acontece

"Abrir o livro", no espiar, não troca de tela na hora. A lombada vira uma caixa
3D de verdade — lombada, capa e primeira página — e:

| Tempo       | O que se vê                                                                             |
| ----------- | --------------------------------------------------------------------------------------- |
| 0–460 ms    | Sai da prateleira e voa até o meio da tela, girando da lombada à capa                   |
| 460–880 ms  | A capa abre para a esquerda; o livro anda meia capa para o par de páginas ficar no meio |
| 800–1040 ms | O livro some e a sala cobre tudo; a tela do livro entra por baixo                       |

Tocar o livro continua sendo espiar: abrir segue levando dois toques, a escolha
registrada em "A estante na mão".

### Detalhes que não são óbvios

- **Parte exatamente em cima da lombada da estante.** De lombada para quem
  olha, a face da lombada fica meia capa mais perto da tela, e a perspectiva a
  aumenta. `geometriaDaAbertura` (pura, testada) desconta isso na escala e na
  posição de partida. A grossura da caixa é limitada (8–30% da altura), e as
  lombadas da estante costumam passar disso; quando passa, uma escala
  horizontal só na partida dá a largura exata, e some durante o voo. Medido no
  navegador: diferença de centésimos de pixel.
- **Opacidade animada achata o 3D no Chromium.** Animação de `opacity` (e
  `will-change: opacity`) é propriedade de agrupamento: força
  `transform-style: flat`, e a caixa vira um cartão — lombada de lado, capa
  aberta invisível. O esmaecer do fim mora em `.abertura-cena`, que também
  carrega a `perspective`; o livro só anima `transform`.
- `backface-visibility: hidden` vai só nas faces, nunca no container da capa:
  passando de 90°, ele esconderia o avesso junto.
- **A folha some sem sair da URL.** Durante a animação a estante passa
  `painel={null}` para a folha, mas a URL continua no `?espiar=`. O fim troca
  de tela com `replace`, então o voltar do livro cai na estante, como antes.
- **Voltar no meio desiste.** A animação só vale enquanto o espiar daquele
  livro está na URL; um espiar novo limpa a anterior, senão ela recomeçaria
  sozinha ao espiar o mesmo livro.
- O fim chama `onAberto` por `useEffectEvent`: a store atualiza a estante no
  meio da animação, e um callback novo não pode reiniciá-la.
- O fundo que cobre a troca usa a `--sala` da página nova, e não a da estante
  (`cores-de-antes` fica só no livro): é sobre ela que a tela do livro entra.
- Papel é claro nos dois temas, pelo mesmo motivo de a lombada ser escura nos
  dois: é objeto, não interface.
- **Movimento reduzido abre direto**, sem animação. A regra global do CSS não
  alcança a Web Animations API, então a consulta é feita no toque.

Verificado quadro a quadro (animações congeladas em tempos fixos) em 412×892
nos dois temas, 320×568 e 1440×900; movimento reduzido abrindo direto; voltar
no meio da animação ficando na estante. 232 testes (5 novos, da geometria),
typecheck e lint limpos. Bundle principal: 122 KB gzipped.

## A Rede como constelação (14/09/2026)

O usuário mandou uma imagem de referência — centenas de pontos claros, milhares
de fios finos azul-violeta, aglomerados orgânicos, nenhum rótulo — e perguntou
como melhorar a Rede no que ela exibe, em como age e em como se mexe nela.

### Decisões dele

Quatro pontos da imagem batiam em decisões registradas; perguntei antes de
mexer:

| Ponto     | Escolha                                | O que contrariava                                                     |
| --------- | -------------------------------------- | --------------------------------------------------------------------- |
| Fundo     | **Paleta atual, segue o tema**         | nada — a imagem é preto, e "Sempre noite" ficou de fora               |
| Pontes    | **Ouro**, como sempre                  | nada — o ciano da imagem vira ouro                                    |
| Layout    | **Por significado, posições gravadas** | o layout da Fase 7 (livros em círculo, com regiões)                   |
| Movimento | **Assenta e para**                     | "não tem simulação viva" — só se mexe ao criar ou arrastar, e congela |

Plano em quatro partes, uma por vez: (1) tela cheia e nova pintura, (2)
organização por significado com posições gravadas, (3) tocar acende a vizinhança
e nomes aparecem ao aproximar, (4) arrastar neurônio. Aviso dado: a densidade da
imagem só aparece com centenas de neurônios — o motor mantém ~6 vizinhos por
neurônio, e o desenho não inventa conexão.

### Parte 1: tela cheia e nova pintura

O layout continua o da Fase 7; mudam a tela e a pintura.

- **Tela cheia.** O canvas é `fixed` por baixo de tudo (à direita da coluna de
  navegação no desktop), e fora de `.animar-entrada`: o `transform` da
  animação viraria referência para o `fixed`. A barra de topo fica por cima,
  com o desfoque de sempre; enquadrar e filtros flutuam no pé, à esquerda, na
  altura do botão de criar. A página trava a rolagem, como a estante.
- **Filtros numa folha, na URL** (`?filtros=1`): o voltar do Android fecha a
  folha antes de sair da Rede. O botão fica pressionado enquanto há filtro, e a
  contagem diz qual.
- **Pontos em pixels de tela** (1,25–2,6 px, pelo grau), não do mundo: numa
  constelação o ponto continua ponto quando você aproxima. Por isso a escala
  máxima subiu para 6 — aproximar só afasta os pontos. O alvo de toque é de 22
  px de tela. Sem halo em volta do ponto: num aglomerado denso eles se somavam
  em manchas.
- **Luz de noite, tinta de dia.** Os fios usam `--rede-mistura`: `lighter` à
  noite (onde muitos se cruzam o aglomerado acende) e `multiply` de dia (a
  tinta se acumula e escurece). Luz somando sobre fundo claro não aparece — é
  o mesmo efeito, ao contrário.
- **Um toque da cor do livro** por cima de cada ponto, a 38%: reconhece-se o
  livro de perto sem virar mapa de cores. Saem os halos de região e os nomes de
  livro.
- **Pontes em ouro com brilho sem `shadowBlur`:** um halo largo e fraco na
  mistura dos fios e o fio fino por cima em tinta normal — somado à luz de
  baixo, o ouro estouraria para branco. Uma ponte só apaga no foco se os dois
  lados estão fora dele.
- **Fios em lotes:** seis faixas de brilho, um `stroke()` por faixa em vez de um
  por fio. Numa WebView, milhares de traços separados engasgam.
- **Cores lidas uma vez** e relidas só quando o tema troca: `getComputedStyle`
  força recálculo de estilo, e arrastar pinta a cada quadro — antes eram cinco
  por quadro.
- **Enquadrar pelos próprios pontos**, com folga para o que cobre a tela
  (barra e contagem em cima, controles embaixo), e não pelos limites com
  rótulo de livro do layout.

Tokens novos, nos três blocos de tema: `--rede-fio`, `--rede-no` e
`--rede-mistura`. O `.cores-de-antes` saiu do retângulo da Rede.

Verificado com um palácio sintético de 320 neurônios e 1.106 conexões (193
pontes) gravado direto no IndexedDB do navegador de teste, nos dois temas, em
412×892 e 1440×900: tocar seleciona, folha de filtros abre e fecha pelo
voltar, "só as pontes" apaga os fios internos, trocar o tema com a Rede aberta
repinta, arrastar move a câmera; e com o seed de verdade (9 neurônios, nenhuma
conexão) em 320×568. Sem rolagem lateral. 232 testes, typecheck e lint limpos.
Bundle principal: 123 KB gzipped.

Com o layout da Fase 7 cada livro fica longe dos outros, e toda ponte vira uma
linha comprida atravessando o vazio — a cor de ponte pesa mais do que vai pesar
quando a parte 2 aproximar quem conversa.

## A ponte muda de ouro para azul (15/09/2026)

Pedido do usuário, na tela da Rede: trocar a cor das conexões de ouro para
azul claro. E uma pergunta à parte, sem pedido de mudança — por que um fio
aparece pontilhado: é o `score === 0` do motor, o vizinho que a regra "nunca
órfão" manteve mesmo sendo o candidato menos ruim — traço sólido é vínculo de
verdade, pontilhado é preenchimento forçado. Vale nos fios do neurônio e na
Rede.

**Conflito apontado antes de mexer:** "ouro significa uma coisa só — a conexão
que atravessa livros" é regra do CLAUDE.md desde a Fase 6, e ele tinha acabado
de confirmá-la, uma resposta antes, especificamente para a Rede. Perguntei o
escopo com AskUserQuestion — só a Rede, ou em todo o app onde ouro já
significava isso (estante, neurônio, livro, Rede) — e ele escolheu **em todo o
app**: a regra não mudou, só a cor que a cumpre.

### O que mudou

`--ouro`/`--ouro-luz` viraram **`--ponte`/`--ponte-luz`**, com um azul novo
(oklch, matiz 230 — sky blue, longe dos matizes ~245-265 já usados em
`--papel`/`--poeira`/`--linha`, para continuar destacando como o ouro
destacava). Contraste contra `--sala`: 4,73:1 de dia (o ouro tinha 4,9:1) e
10,25:1 de noite (o ouro tinha ~9,5:1) — ambos acima do mínimo de
acessibilidade, medidos com o mesmo método da paleta original (conversão
OKLab/OKLCH → sRGB própria, sem depender do navegador).

Renomeado, e não só recolorido: manter uma classe chamada `text-ouro`
pintando azul enganaria quem lesse o código depois — `brilho-ouro*` →
`brilho-ponte*`, `border-ouro`/`bg-ouro-luz` → `border-ponte`/`bg-ponte-luz`,
`CoresDaRede.ouro` → `.ponte`. `--ouro-gravado` **não mudou**: é o título
gravado em toda lombada (tenha ponte ou não), um detalhe de material da
encadernação, não o sinal de ponte — os dois só coincidiam em tom por acaso.

**Bug encontrado no caminho:** `.lombada-ponto` (o pontinho no topo da
lombada, "livro com fio saindo") lia `--ouro-gravado` em vez de `--ouro` — os
dois eram visualmente parecidos antes, então ninguém notou. Se eu só tivesse
trocado `--ouro`, o ponto continuaria dourado enquanto o resto do app virava
azul. Corrigido para ler `--ponte`. Mesmo problema em
`.lombada--livro[data-ponte]` (o glow ao segurar um livro que compartilha
ponte com o que está na mão): lia `var(--ouro)` direto, sem passar pelo
Tailwind — fácil de esquecer numa busca só por classes.

Nenhum dos dois precisou entrar em `.cores-de-antes` (a estante congelada):
como nada ali usava `--ouro` de verdade, `--ponte` simplesmente cai da
cascata normal do tema, a mesma cor viva do resto do app.

### Risco sinalizado, não resolvido

A paleta de panos evitava a faixa do ouro (~75-82) para nenhum livro se
confundir com ponte. Agora que a ponte é azul, **"Azul" (#5b7fd6) e
"Ardósia" (#6f7f96) caem perto da faixa nova** — o mesmo risco, cor
diferente. Não mexi na paleta (não foi pedido, e tirar uma cor sem avisar
seria decisão silenciosa); fica anotado em `panos.ts` e aqui, para o usuário
decidir se troca.

Verificado com um palácio sintético (60 neurônios, 34 pontes, gravado direto
no IndexedDB do navegador de teste) nos dois temas: o ponto da lombada, o
glow ao segurar, a contagem "N pontes" no espiar e na tela do livro, os fios
cruzados na tela do neurônio, e a constelação inteira da Rede — todos em
azul, incluindo a leitura ao vivo do token resolvido pelo navegador (não só
o valor gravado no CSS). 232 testes, typecheck e lint limpos.

## A Rede se organiza por significado (15/09/2026)

Item 2 do plano da Rede (ver "A Rede como constelação"): o layout da parte 1
continuava o da Fase 7 — livros em círculo, neurônios em volta da âncora do
próprio livro. A partir daqui os aglomerados nascem só das conexões, de
qualquer livro, e a posição de cada neurônio é **gravada**, não recalculada
do zero a cada abertura.

Pedido explícito do usuário nesta fase: manter só o que já estava em
andamento (a Rede), deixar as pendências de hardware (Fase 3 e 9) para
quando o projeto chegar na passada de acabamento, e sempre escrever o
código pensando em não quebrar o caminho até o Android nativo — sem se
aprofundar nisso agora. As ideias extras que sobravam da lista da estante
(múltiplas estantes/salas, múltiplos acabamentos de madeira) foram
recusadas por fugirem do escopo do projeto — removidas da memória de
projeto, não é mais pendência.

### Onde o algoritmo mora, e por quê

`src/core/motor/redeLayout.ts` — não em `features/rede`, porque agora ele
roda **dentro do Worker** (cálculo pesado fora da thread da interface,
regra de ouro da arquitetura: o núcleo não sabe onde está rodando, e um
motor de layout é exatamente o tipo de coisa que uma implementação nativa
vai precisar reimplementar um dia). A UI só lê o resultado gravado.

`features/rede/layout.ts` perdeu `montarMapa`/`dimensionar`/`Mapa` — foram
para o núcleo. Sobrou só o que a UI ainda calcula do próprio lado:
`grausDoMapa` (tamanho do ponto pelo grau) e `neuronioEm` (hit-testing).

### O algoritmo

Força-dirigido puro, sem `Math.random` nem relógio:

- **Atração por aresta**, proporcional à distância atual e ao score — quanto
  mais forte a conexão, mais perto os dois querem ficar. A mesma fórmula do
  layout antigo, só que agora sem âncora de livro puxando por baixo.
- **Repulsão por grade espacial**: só quem está a menos de `raioDeRepulsao`
  entra na conta (cada nó olha a própria célula e as 8 vizinhas), perto de
  O(n) por passo em vez de O(n²) — o mesmo motivo que já valia no layout
  antigo, mais importante agora que a repulsão não fica mais restrita ao
  mesmo livro.
- **Âncora própria**, não um centro genérico: quem já tinha posição gravada
  recebe um puxão fraco de volta para **onde ele mesmo estava**, não para o
  centroide do grafo inteiro. Sem isso, um grafo com ciclos (que tem mais de
  um equilíbrio físico válido) podia assentar numa rotação ou num rearranjo
  local diferente a cada recálculo, mesmo com as arestas praticamente
  iguais — "mobília não anda" para o layout antigo era garantido só por ser
  uma função pura do id; aqui, sem uma âncora individual, não tinha nada
  segurando a forma entre um recálculo e o outro.
- Nó novo (sem posição gravada) nasce perto de um vizinho que já tem lugar
  — propagado em até 6 passadas, resolvido por ordem de id para ser
  determinístico independente da ordem dos arrays —, ou espalhado por
  semente do id ao redor do centro do que já existia, se for uma ilha nova
  de verdade.

### Quando roda, e com quantas iterações

Acionado nos mesmos pontos que já recalculavam o grafo de conexões —
`reprocessarTudo` e o caminho incremental de `escrever` —, mas **quantas
iterações rodar depende de haver posição de referência, não de qual
caminho chamou**: `apagarNeuronio` e o crescimento de 50% também passam por
`reprocessarTudo`, mas continuam sendo um recálculo sobre um layout que já
existia, e merecem o mesmo assenta-e-para de uma escrita incremental (26
iterações) — não as 160 de quem nunca teve chão nenhum embaixo. Só a
primeira organização de todas (nenhuma posição gravada ainda) é fria de
verdade.

### Onde fica gravado

Em `meta`, chave `posicoesDaRede` — o mesmo padrão do `PerfilDoPalacio`, e
pelo mesmo motivo **fora do backup**: é derivado do grafo, recalculado na
chegada. Nenhuma tabela nova, nenhum bump de versão do Dexie (o `meta` só
indexa a chave, não o formato do documento).

**Corrigido em 15/09/2026, visto no celular do usuário:** as posições só eram
calculadas numa escrita, então um palácio de antes delas — sem neurônio
criado, editado ou apagado desde então — abria a Rede com a contagem certa e
**nenhum ponto**. E o layout recebia `nosDeNeuronios` (só quem tem
embedding), deixando sem lugar quem ainda não passou pelo modelo. Agora o
layout recebe todo neurônio que existe, e `carregar` chama
`darLugarAQuemFalta`: se algum neurônio não tem posição, recalcula com
partida quente — quem já tinha lugar não se mexe. Verificado com o seed de
verdade (9 neurônios sem vetor) e um palácio de 60 com conexões e sem
posições: os dois abriam com zero pixels desenhados e passaram a desenhar
todos; reabrir não muda nenhuma posição.

### Dois bugs achados no caminho, os dois com teste de regressão

- **A posição de um neurônio apagado sobrevivia no mapa.** A partida quente
  copiava `posicoesAnteriores` inteiro, sem filtrar por quem ainda está em
  `nos` — o apagado não recebe força nenhuma (as passadas do laço principal
  só olham os nós atuais), então ficava congelado ali para sempre, vazando
  para o que fosse gravado no próximo recálculo.
- **`calcularLayoutDaRede` mutava os pontos de `posicoesAnteriores` no
  lugar.** `new Map(anteriores)` copia as chaves, mas os objetos `{x,y}`
  continuam sendo os mesmos — e o laço principal escreve `p.x += f.x` neles
  diretamente (mais barato que recriar o ponto a cada passo). Sem copiar os
  objetos também, isso alterava escondido o mapa de quem chamou, no meio do
  próprio cálculo. Pior: **mascarava os testes de estabilidade** — comparar
  "antes" com o resultado usando os mesmos objetos passa mesmo com o bug,
  porque os dois lados da comparação já são o mesmo objeto mutado. Os testes
  originais (grafo de 8 nós, criado à mão) passavam por essa coincidência;
  só apareceu comparando com um grafo de verdade, dumped do Worker.

O segundo bug é o motivo de `ancoragemPropria` ter uma constante medida:
antes de corrigi-lo, toda medição de estabilidade era uma medição de "um
objeto comparado com ele mesmo" — zero por construção, não por o layout ser
estável de verdade.

### Números medidos (179 nós, 620 arestas, palácio sintético)

Apagar um neurônio pela UI de verdade (dispara `reprocessarTudo`; os
sintéticos já têm embedding, então não baixa o modelo), depois apagar um
segundo em seguida, medindo o deslocamento de quem sobrou:

| `ancoragemPropria`                                          | Deslocamento médio | Pior caso  |
| ----------------------------------------------------------- | ------------------ | ---------- |
| 0,05 (primeira tentativa, com os dois bugs ainda presentes) | 65–115 px          | 173–298 px |
| 0,4 (calibrado, bugs corrigidos)                            | **7 px**           | **12 px**  |

0,4 continua bem mais fraco que o puxão de uma aresta de verdade — quem tem
motivo real para se mover (a conexão mudou), se move; quem não tem, fica
parado, dentro de uma folga pequena o bastante para não se notar.

### Palácio sintético para testar sem o modelo

`src/features/palacio/seed.ts` continua sendo o único seed real do projeto.
Para testar o layout com um grafo grande, gravei neurônios sintéticos
**direto no IndexedDB do navegador de teste** (fora do repositório, só numa
sessão de verificação): cada um com um embedding de verdade — centroide
aleatório de unidade por comunidade, mais ruído pequeno, renormalizado —,
não zerado, para o motor de conexões de verdade (`construirGrafo`, cosseno
sobre o vetor) descobrir as comunidades sozinho. Embeddings com o mesmo
valor davam um grafo degenerado (quase uma árvore, 178 arestas para 179
nós) e o layout virava um artefato de estrela; com embeddings agrupados de
verdade, 620 arestas e uma constelação coerente. Depois, apagar um neurônio
pela UI aciona o pipeline real (`reprocessarTudo` → `construirGrafo` →
`recalcularPosicoesDaRede` → grava) sem precisar baixar os 129 MB do
modelo, porque os sintéticos já chegam com vetor.

Verificado: grafo coerente (sem estrela degenerada) com embeddings
agrupados; estabilidade medida apagando um segundo neurônio em seguida (ver
tabela acima); nenhuma posição de nó apagado sobrevivendo no `meta`. 235
testes (14 no motor de layout, eram 12 no `layout.test.ts` antigo — a
diferença é o teste de "não muta `posicoesAnteriores`" e o de "posição
apagada não sobrevive"), typecheck e lint limpos. Bundle principal: 122 KB
gzipped.

Faltam os itens 3 (tocar acende a vizinhança, nomes ao aproximar, duplo
toque, busca leva a câmera) e 4 (arrastar neurônio) do plano da Rede.

## A Rede reage ao toque (15/09/2026)

Item 3 dos 4 do plano da Rede (ver "A Rede como constelação"): tocar um
neurônio acende a vizinhança dele e apaga o resto; aproximar revela nomes,
dos mais conectados primeiro; duplo toque foca a câmera; a busca aprendeu a
levar a câmera até um neurônio.

### Vizinhança ao tocar

`vizinhancaDe(selecionado, conexoes)` (`features/rede/layout.ts`, puro,
testado) devolve o próprio selecionado mais quem tem aresta direta com ele —
um salto só, não dois. `desenhar.ts` unificou essa checagem com a que já
existia para foco de livro num único `montarChecagens(cena)`: um nó ou
aresta apaga se o foco de livro apaga ele **ou** se há um selecionado e ele
não participa da vizinhança. A mesma função que já decidia "isso é do livro
em foco?" passou a decidir as duas coisas de uma vez — são o mesmo tipo de
filtro visual, dimming, nunca remoção.

### Nomes ao aproximar

Rótulo ambiente novo, por cima da pintura de sempre: cada neurônio (não
apagado, não o selecionado — que já tem etiqueta própria) ganha o nome
quando o zoom passa de um limiar que **cai com o grau**
(`ESCALA_MINIMA_DOS_ROTULOS / (1 + grau * FATOR_DE_GRAU)`) — o hub do
palácio se revela primeiro, sem precisar aproximar tanto; uma folha isolada
só ganha nome bem de perto. Colocação gulosa por prioridade (grau
decrescente, id crescente para ser determinístico) com checagem de colisão
por caixa delimitadora — até 40 rótulos, nunca sobrepostos.

**Cresce com o zoom, de propósito — o oposto da etiqueta do selecionado.** A
etiqueta do selecionado sempre foi calculada em pixels de tela puro, fora da
transformação da câmera, porque o nome de quem você escolheu não pode
encolher (ver "A rede", Fase 7). Os rótulos ambiente são o contrário: ficam
dentro da mesma `ctx.scale()` que desenha o resto do mundo, sem dividir por
`escala` — um zoom maior não só aproxima como literalmente aumenta o texto,
revelando detalhe. É o comportamento certo para "olhar de perto revela o que
estava genérico de longe" (mesma ideia da lavagem da estante), errado para
uma seleção que a pessoa já fez.

### Duplo toque

Um `ref` guarda `{tempo, x, y}` do último toque solto; um novo toque dentro
de 350 ms e 40 px do anterior conta como duplo. Em cima de um neurônio,
foca a câmera nele (zoom mínimo 2,4×, ou o que já estava se for maior); no
vazio, dá um passo de zoom (1,9×) centrado no dedo. **O primeiro toque nunca
espera** — seleciona ou desmarca na hora, como sempre; o duplo toque só soma
comportamento por cima quando detectado, para o toque comum não ganhar
350 ms de atraso perceptível.

`ControleDaTela` ganhou `focar(id)`, usado tanto pelo duplo toque quanto
pela busca, a seguir.

### Busca leva a câmera

`Busca.tsx` lê `?de=rede`: vindo daqui, o resultado de um neurônio aponta
para `/rede?centralizar=<id>` em vez de `/neuronio/:id` — quem buscou a
partir da Rede quer voltar para lá, não abrir a ficha. `Rede.tsx` lê
`?centralizar` já na inicialização do `useState` (o mesmo padrão do
`?chegou=` da estante) para a seleção nascer correta sem passar por um
efeito — só a chamada de `focar()` (que mexe na câmera, um sistema externo
ao React) precisa de efeito de verdade, e roda depois do enquadramento
inicial da própria `Tela` porque efeito de filho comita antes do efeito do
pai.

### Verificado

Com toque de verdade (CDP): tocar acende só o selecionado e vizinhos de 1
salto, o resto apaga; duplo toque num neurônio foca e no vazio dá zoom;
busca a partir da Rede volta com `?centralizar=`, a câmera centra no
neurônio certo e o parâmetro some da URL depois de usado (voltar cai em
`/busca?de=rede`, confirmando navegação por push, não por replace). Num
palácio sintético de 149-150 neurônios, nos dois temas. 239 testes,
typecheck e lint limpos. Bundle principal: 126,7 KB gzipped.

Falta só o item 4 (arrastar neurônio: vizinhos acompanham, assenta ~1 s,
grava) do plano da Rede.

## Arrastar um neurônio (15/09/2026)

Item 4 e último do plano da Rede (ver "A Rede como constelação"): tocar um
neurônio e arrastar move só ele; os vizinhos de 1 salto acompanham; ao
soltar, a vizinhança assenta na física de verdade e grava.

### Duas fases, dois tipos de física

**Enquanto o dedo se move** é só uma pista visual, não física: o nó
arrastado segue o dedo exatamente, e cada vizinho de 1 salto anda uma fração
do mesmo deslocamento proporcional ao score da conexão
(`posicoesDoArrasto`, `features/rede/layout.ts`, puro e testado) — uma
conexão fraca quase não acompanha. Calcular a física de verdade a cada
`pointermove` seria caro à toa: o usuário ainda está decidindo onde soltar,
e o resultado final não depende do caminho, só do ponto de chegada.

**Ao soltar** é a física de verdade, e a mesma de sempre: o ponto do soltar
vira a âncora daquele neurônio, e `calcularLayoutDaRede` roda com partida
quente (as posições gravadas de todo mundo, exceto o alvo, que aponta para
onde a mão o deixou) e 26 iterações — o mesmo "assenta e para" de qualquer
escrita incremental (ver "A Rede se organiza por significado"). Como
`ancoragemPropria` é fraca (0,4), o próprio alvo pode derivar um pouco do
pixel exato onde soltou — ele está assentando num equilíbrio físico, não
preso a um ponto.

### Nenhuma mudança no núcleo

`moverNeuronioNaRede(id, ponto)` — novo método de ponta a ponta (porta
`ConnectionEngine` → protocolo do Worker → `motor.worker.ts` → store) —
reaproveita exatamente a função e a tabela que a Fase 23-2 já tinha: lê
`repo.getPosicoesDaRede()`, substitui a entrada do alvo pelo ponto do
soltar, roda `calcularLayoutDaRede` com `ITERACOES_LAYOUT_INCREMENTAL` e
grava o resultado inteiro. Não mexe em `conexoes` — arrastar não muda quem
é vizinho de quem, só onde a constelação decide desenhar isso.

### A animação de ~900ms, e por que ela não é a física em si

`quadroDoAssentamento(inicio, alvo, k)` interpola, ponto a ponto, do quadro
onde o dedo soltou até o resultado que o motor devolveu — com
`easeOutCubic` para começar rápido e desacelerar, como qualquer coisa que
assenta. Ela **não** anima os passos internos do relaxamento (o motor
devolve só o resultado final, síncrono), e sim uma interpolação de tela
entre "onde parou" e "onde devia estar" — mais barato, e visualmente
indistinguível de animar a física passo a passo, porque o motor já roda em
poucos milissegundos (o mesmo custo de qualquer escrita incremental).

Um arrasto novo no meio de um assentamento anterior cancela o anterior
(`execucao.cancelado`) em vez de os dois brigarem pelo mesmo overlay de
posições.

**Diverge de "sem laço de animação" (Fase 7)** — apontado no plano desde
14/09/2026 ("Movimento: assenta e para... diverge do 'não tem simulação
viva' registrado"). A diferença para o `requestAnimationFrame` eterno que a
Fase 7 rejeitou: este só roda por `DURACAO_DO_ASSENTAMENTO` (900ms) e para
sozinho — pinta quando algo muda, e só, como sempre; só que agora "algo
muda" inclui um relógio de 900ms depois de um arrasto, não um laço
contínuo.

### Detalhe de gesto: o mesmo teste de tolerância decide arrastar nó ou tocar

O toque no `pointerdown` faz o mesmo teste de acerto (`neuronioEm`) que já
existia para selecionar — só que agora, se acertar um nó, guarda um
candidato a arrasto. O `pointerup` decide o que aconteceu com o mesmo
`arrastou.current > TOLERANCIA_DO_TOQUE` que já separava toque de arrastar
a câmera: abaixo do limiar é toque (seleciona, participa do duplo toque);
acima, foi arrasto de verdade (assenta e grava). Um segundo dedo no meio
cancela o arrasto de nó e devolve o gesto para a pinça, como sempre.

### Verificado

Com toque de verdade (CDP, arrasto com passos intermediários — não um
salto direto, que o Chromium headless pode engolir): arrastar um neurônio
move-o em tempo real, com os fios para os vizinhos esticando junto;
soltar aciona o motor de verdade e a posição gravada em `meta` muda de
forma mensurável (~73px de deslocamento total no palácio de teste), com
pelo menos um vizinho de 1 salto também se deslocando; a posição nova
sobrevive a um reload completo da página (não é só otimismo de tela); um
toque comum (sem arrastar) continua selecionando normalmente — regressão
checada depois do arrasto. Num palácio sintético de 149-150 neurônios, tema
escuro. 248 testes (9 novos: `posicoesDoArrasto`, `quadroDoAssentamento`,
`easeOutCubic`), typecheck e lint limpos. Bundle principal: 127,5 KB
gzipped.

Com este item, os 4 do plano da Rede como constelação estão completos.

## "Ver a estante inteira" sai, fica só a busca (16/09/2026)

Pedido do usuário. O botão de visão geral (Fase 18, ícone de lupa com
`+`/`-` — `ZoomIn`/`ZoomOut`) foi removido da fileira de baixo da estante:
sobrava só ele e a busca ali, e os dois lidos rápido pareciam a mesma
função. No lugar dele ficou só o botão de busca global (Fase 12), que já
existia ao lado — a contagem de livros, neurônios e conexões continua na
mesma fileira, como sempre.

Removido de ponta a ponta, não só escondido: o estado `visaoGeral` e o botão
saíram de `Estante.tsx`, a prop `visaoGeral` e o atributo `data-visao-geral`
saíram de `Movel.tsx`, e as regras `.movel[data-visao-geral]` saíram do
`index.css`. Mesmo padrão das remoções de 14/09/2026 (modo organizar,
ordenar, nome de prateleira): mais barato de reverter do que meia-remoção.

**Não verificado num navegador de verdade nesta sessão** — sem ferramenta de
automação de navegador disponível no ambiente desta conversa. Typecheck,
lint e os 249 testes automatizados continuam limpos; vale conferir
visualmente antes de dar como fechado.

## O livro nasce em tamanho normal, e o formulário cabe sem rolar (16/09/2026)

Dois pedidos do usuário na mesma sessão.

### O padrão de um livro novo é Largura e Comprimento "Normal"

Desde as Fases 19 e 20 um livro nascia com `larguraLombada`/
`comprimentoLombada` em `null` — "Automática", a largura/altura que varia
pela semente do id e pela quantidade de neurônios. Agora `NovoLivro.tsx`
inicia os dois em `LARGURA_PADRAO`/`COMPRIMENTO_PADRAO` (novo, em
`larguras.ts`/`comprimentos.ts`: o `px`/`percentual` da opção `'normal'` de
cada lista, não um número solto duplicado). Só a criação muda — editar
continua carregando o que o livro já tem gravado, `null` incluso para quem
nasceu antes desta mudança.

### O formulário de livro parava de caber na tela do celular sem rolar

A causa não era o valor padrão (a amostra "Automática" já tinha
altura parecida com "Normal"): era que o seletor de Comprimento **sempre**
desenha as cinco opções, e a pré-visualização de cada uma usava a mesma
referência de 130px da amostra principal — "Enorme" (98%) virava uma caixa
de 127px de altura só como ícone de opção. Num viewport de 320px de largura,
isso também empurrava "Enorme" para quebrar numa segunda linha (a soma das
larguras dos cinco rótulos não cabe em 320px com `gap-4`), e duas linhas
com uma caixa de 127px numa delas passava de 300px só naquele fieldset.

Corrigido com uma referência bem menor (`REFERENCIA_DAS_OPCOES_PX`, 56px) só
para as pré-visualizações do seletor — a amostra de verdade ao lado do nome
continua em 130px, que é onde a proporção precisa comunicar como o livro vai
ficar de verdade. Junto: `gap-4` → `gap-2` nas linhas de Largura e
Comprimento (a diferença que faz os cinco rótulos caberem numa linha só a
320px de largura), `gap-6` → `gap-5` no formulário inteiro, e `pt-5` → `pt-4`
no respiro do topo em `NovoLivro.tsx`.

**Não verificado num navegador de verdade nesta sessão** — sem Playwright
nem outra ferramenta de automação de navegador disponível no ambiente desta
conversa, diferente do padrão anterior do projeto ("verificado com toque de
verdade", CDP). A conta acima (alturas de linha, quebra de largura a 320px)
foi feita lendo o CSS e o layout, não medida ao vivo; typecheck, lint e os
249 testes automatizados continuam limpos. Vale conferir visualmente no
celular antes de dar como fechado.

## A alça do bottom sheet ganha mais área de toque (16/09/2026)

Pedido do usuário. A alça (`Folha.tsx`, usada por todo bottom sheet do
app — estante, ajustes, filtros da Rede) já media 44px de altura de ponta a
ponta (28px de conteúdo + 8px de respiro em cada lado), o mínimo recomendado
de alvo de toque. Aumentada para 60px (altura de conteúdo 36px + 12px de
respiro), num único lugar (`.folha-alca` em `index.css`) — vale para todos os
painéis do app de uma vez, porque todos passam pelo mesmo componente. A
barra visível continua fina (4px): só a área que responde ao dedo cresceu.

## "Deslizar navegação": a câmera da Rede desliza um pouco ao soltar (16/09/2026)

Pedido do usuário: soltar arrastando a rede parava exatamente onde o dedo
soltou — sem sensação de continuidade, diferente do que um mapa ou uma lista
nativa fazem. Um botão novo, "Deslizar navegação" (`Waves`), entrou ao lado
de "Só as pontes" na seção "Mostrar" dos filtros da Rede — desligado por
padrão, como o resto dos filtros daquela folha (estado local, sem
persistência: um jeito de navegar agora, não uma preferência do palácio).

**Não é inércia física de verdade** — que desaceleraria por tempo
indefinido, o tipo de laço que este arquivo evita desde a Fase 23 ("Sem laço
de animação... pinta quando algo muda, e só"). É um "assenta e para": ao
soltar, a velocidade suavizada do arrasto (`vx`/`vy` em px/ms, calculada a
cada `pointermove` e amortecida 70/30 contra o quadro anterior para não
tremer) vira um **alvo fixo** — a posição atual mais a velocidade projetada
por `PROJECAO_DO_DESLIZE_MS` (220ms), com um teto de `DISTANCIA_MAXIMA_DO_DESLIZE`
(200px, "desliza um pouco", não sai voando com um flick forte) — e a câmera
anima até lá com `easeOutCubic` em `DURACAO_DO_DESLIZE` (300ms), a mesma
função e o mesmo espírito do assentamento de um neurônio arrastado (ver "A
Rede se organiza por significado"). Abaixo de `VELOCIDADE_MINIMA_DO_DESLIZE`
(0,12px/ms) não faz nada — soltar devagar já era "parar", não "arremessar".

**Diverge de "Movimento: assenta e para... sem simulação viva"** registrado
na Fase 23 pelo mesmo motivo que o arrasto de neurônio já divergia: um
`requestAnimationFrame` que corre por um tempo fixo e para sozinho não é o
laço eterno que a regra proíbe. Apontado aqui por ser mais uma exceção à
mesma regra, não por ser uma dúvida em aberto.

**Onde a velocidade é zerada, e por quê:** um novo `pointerdown` cancela
qualquer deslize em curso (segurar a tela é sempre "para agora"); entrar em
modo pinça (dois dedos) zera a velocidade acumulada, senão soltar um dedo
depois de uma pinça deslizaria com o número de um gesto que não foi o de
navegar; arrastar um neurônio nunca chega a acumular velocidade de câmera,
porque esse ramo do gesto retorna antes de chegar ao código que a mede.

**Não verificado num navegador de verdade nesta sessão** — mesma ressalva
da seção anterior: sem ferramenta de automação de navegador disponível
neste ambiente, a lógica foi conferida lendo o código (os três pontos em que
a velocidade é zerada, a ordem dos `if` no soltar), não com um dedo de
verdade. Typecheck, lint e os 249 testes automatizados continuam limpos —
não há teste novo para a física do deslize, pelo mesmo padrão do resto do
gesto de pinça/arrasto desta tela, que também não tem teste automatizado.

## Reposicionar um neurônio não abre mais as informações dele (16/09/2026)

Pedido do usuário. Soltar depois de arrastar um neurônio para outro lugar
sempre chamava `onSelecionar`, então todo reposicionamento também acendia o
cartão de informações lá embaixo — mesmo quando a intenção era só mover o
nó. Removida a chamada em `Tela.tsx`: o ramo de soltar-depois-de-arrastar
agora só assenta a vizinhança (`assentar`), sem selecionar nada. Um toque
comum (sem arrastar de verdade, abaixo de `TOLERANCIA_DO_TOQUE`) continua
selecionando normalmente — esse ramo do gesto não mudou.

## O botão de criar não precisa mais de dois toques (16/09/2026)

Pedido do usuário: às vezes precisava tocar duas vezes o "+" para entrar na
tela de criar neurônio. Rastreado até uma corrida entre o toque e o
temporizador de segurar (`ESPERA`, 380ms, o mesmo valor do resto do app —
ver `useManipularLivros.ts`): um toque um pouco mais longo que o normal (o
suficiente para cruzar 380ms, o que acontece de vez em quando com um dedo
real, sem ser um "segurar" deliberado) faz o anel abrir em vez de criar. Até
aqui era esperado — mas o `onClick` do botão então tratava um segundo toque
comum no centro (o botão já mostrando "X") como só "fechar o anel", com
`preventDefault()` — nunca criava. Corrigido: o toque no centro com o anel
já aberto fecha o anel **e** deixa o `Link` navegar para `/novo`, porque
quem tocou o centro (não uma cunha) ainda quer criar. Fechar sem criar
continua possível — tocar fora do anel (o véu) ou Esc.

**Não verificado num navegador de verdade nesta sessão** — mesma ressalva
das seções anteriores: a corrida foi reconstruída lendo o código (a ordem
dos `if` em `aoSoltar` e no `onClick`), não reproduzida com um dedo de
verdade. Typecheck, lint e os 249 testes continuam limpos; Dial.tsx não tem
teste automatizado (nunca teve, mesmo padrão do resto do gesto de segurar).

## Zoom da Rede mais leve, e os nomes aparecem todos juntos (16/09/2026)

Dois pedidos do usuário sobre a mesma reclamação: dar duplo toque para
aproximar de um neurônio ("focar") ou no vazio zoomava demais, e os nomes
dos neurônios apareciam em momentos diferentes — hub primeiro, folha só bem
mais perto.

**A causa dos nomes escalonados:** `limiarDeEscala(grau)` (`desenhar.ts`)
caía com o grau (`ESCALA_MINIMA_DOS_ROTULOS / (1 + grau * FATOR_DE_GRAU)`) —
um hub bem conectado já cruzava a linha no zoom normal, uma folha sem
conexão só a 1.9×. Virou um limiar só, `ESCALA_MINIMA_DOS_ROTULOS = 2.2`,
igual para todo mundo: `FATOR_DE_GRAU` e `limiarDeEscala` saíram por não
terem mais uso. O grau continua decidindo **quem vence o espaço** quando dois
rótulos disputam o mesmo lugar (o hub, que orienta mais, ainda desempata
primeiro) — só não decide mais **quando** o nome pode aparecer.

**O zoom em si:** `ZOOM_DO_DUPLO_TOQUE` (duplo toque no vazio) caiu de 1.9
para 1.5, e `ESCALA_DE_FOCO` (duplo toque num neurônio, e para onde a busca
leva a câmera) caiu de 2.4 para 2.2 — o mesmo valor do limiar dos nomes, de
propósito: focar um neurônio sempre revela todos os nomes de uma vez, nunca
alguns antes de outros, porque o próprio ato de focar já cruza a linha
única. Partindo do zoom normal (1×), dois duplo-toques no vazio (1.5² =
2.25) já passam do limiar — "no segundo zoom", como o usuário pediu, sem
descartar que um grafo mais espalhado peça um terceiro.

**Não verificado num navegador de verdade nesta sessão** — os números
(2.2, 1.5, a progressão de dois duplo-toques) foram calculados, não vistos
na tela. Vale conferir num palácio de verdade se o ritmo ficou bom; typecheck,
lint e os 249 testes continuam limpos.

## Escrever um neurônio vira uma folha, não um formulário (16/09/2026)

Pedido do usuário, com o Samsung Notes como referência (duas capturas): a tela
de escrever era três campos empilhados — cada um com rótulo por cima, borda e
fundo —, mais duas frases explicativas. Virou um app de notas.

| Peça      | Antes                                          | Agora                                                            |
| --------- | ---------------------------------------------- | ---------------------------------------------------------------- |
| Título    | campo com borda e rótulo "Título", no corpo    | `input` na **barra de topo**, no lugar do nome da tela           |
| Livro     | `select` de 52 px com rótulo "Livro"           | etiqueta (`.chip`) com o ponto da cor, logo abaixo da barra      |
| Texto     | `textarea` com borda, fundo e rótulo           | a folha: sem caixa, ocupando o que sobra da tela                 |
| Explicação| "As conexões nascem sozinhas" + "Escreva livre…" | saíram as duas                                                 |

**O título na barra é o que devolve a tela para o texto.** `BarraDeTopo` já
aceitava `ReactNode` como título, então o `input` entra ali sem componente
novo — e a barra desta tela deixa de dizer "Novo neurônio"/"Editar", como no
Notes. Custo assumido: é a única tela interna sem nome próprio na barra. A
fonte não atravessa para dentro de um `input` (o navegador dá a dele), então
as classes repetem o que `.barra-de-topo-titulo` já diz.

**O texto sem caixa não é só estética:** uma borda em volta de um campo que
ocupa a tela inteira desenha moldura em volta do nada, e encolhe a folha em
dois pixels de cada lado por nada. Sem borda, tocar em qualquer ponto da área
já põe o cursor — que é o gesto do Notes.

**Esta é a única tela sem `.rotulo-de-secao`**, e de propósito: o
`placeholder` de cada campo já diz o que ele é, e três rótulos sobre uma folha
de escrever são três linhas a menos de folha. O leitor de tela continua
servido pelos `aria-label`.

**O `Formulario` passou a ser a tela inteira**, com barra de topo e tudo —
`Novo.tsx` e `Editar.tsx` ficaram só com os dados. O título vive no mesmo
componente que guarda o estado dele; a alternativa era elevar o estado para as
duas páginas só para a barra poder desenhá-lo. A barra continua **fora** de
`.animar-entrada`, pelo motivo de sempre (ancestral com animação vira raiz do
desfoque — ver "A paleta e a interface").

**O aviso do editar ficou** ("Mudar o texto refaz o embedding — as conexões
podem mudar"), agora como prop `aviso` e em letra miúda acima da folha: o
pedido de remover frases era sobre as duas da tela de criar, e esta diz uma
consequência real. Criar entra limpo, sem nenhuma.

**Não verificado num navegador de verdade nesta sessão** — mesma ressalva das
seções anteriores: sem ferramenta de automação de navegador neste ambiente, o
layout foi conferido lendo o CSS (a cascata de `.chip` contra os utilitários
de padding, o `flex-1` da folha dentro do `min-h-dvh`), não visto na tela.
Typecheck, lint e os 249 testes continuam limpos.

## A barra de escrita acima do teclado (16/09/2026)

Pedido do usuário, com três capturas da barra do Samsung Notes: uma fileira de
ferramentas sempre acima do teclado, para editar o texto sem sair dele.

### A pergunta que decidiu tudo: onde a formatação vive

Os ícones da referência (negrito, itálico, tachado, "Aa", tamanho "15") só
existem se o texto guardar formatação — e `conteudo` é `string` de ponta a
ponta: é o contrato do núcleo (`core/ports/engine.ts`), é o que o modelo lê
(`"query: " + titulo + ". " + conteudo`) e é o que a tela do neurônio pinta com
`whitespace-pre-wrap`. Perguntei antes de escrever código, com três caminhos:
markdown em texto puro, rich text de verdade (Dexie v10, migração, snapshot,
protocolo do Worker, sanitização) ou só atalhos sem formatação.

**Escolha do usuário: markdown no texto puro.** Nada mudou no banco, no
embedding nem no backup; a marcação fica à vista enquanto se escreve. O que
isso custou em fidelidade à referência está na tabela:

| Ícone da referência         | Aqui                                              |
| --------------------------- | ------------------------------------------------- |
| B, itálico, tachado         | `**`, `*`, `~~` — alternam, não empilham          |
| Listas, numerada, checklist | `- `, `1. `, `- [ ] `                             |
| Recuo ↔                     | dois espaços por passo                            |
| Desfazer / refazer          | histórico próprio (ver abaixo)                    |
| "Aa" e tamanho "15"         | viraram **um** botão: ciclo `#` → `##` → `###`    |
| Sublinhado                  | **fora** — markdown não tem                       |
| Alinhamento, caixa de texto | **fora** — markdown não tem                       |
| Caneta de desenho           | **fora** — não existe em texto puro               |

### O que não é óbvio

**Nenhum botão da barra pode tirar o foco do campo.** Cada um recusa o
`pointerdown` **e** o `mousedown` — é o `mousedown` que move o foco, e o toque
o dispara por compatibilidade. Sem isso, tocar em "negrito" faria a barra sumir
antes de o toque virar clique, e não haveria seleção para marcar. Prevenir esses
dois não impede o `click`, que é o que dispara a ação.

**O desfazer do navegador morre num campo controlado:** para ele, cada
`setState` é um texto novo caído do céu, não uma edição — e a barra reescreve o
campo o tempo todo. Daí `useTextoComHistorico`: digitar agrupa teclas dentro de
600 ms num passo só (senão desfazer apagaria letra por letra), e um botão da
barra sempre abre um passo próprio (desfazer um negrito tira o negrito, não a
palavra anterior). O passo inicial nunca é engolido pelo agrupamento — é ele
que deixa voltar até o começo.

**O cursor é reposto na mão, e só depois de um botão.** Reescrever o campo joga
o cursor para o fim; um `useLayoutEffect` repõe a seleção. Ele observa um
contador `acao` que **não** sobe ao digitar: forçar `setSelectionRange` a cada
tecla atrapalharia a composição do teclado do Android.

**A marcação de linha vale a linha inteira**, mesmo que o dedo só tenha pegado
uma palavra no meio dela, e só desmarca quando **todas** as linhas tocadas já
são daquele tipo — com uma linha de fora, marca todas. Senão o botão vira
loteria numa seleção de cinco linhas.

**No celular a barra ocupa o lugar do botão de enviar**, que volta quando o
teclado fecha: duas faixas presas no pé comeriam metade do que sobra da tela
com o teclado aberto. Do tablet em diante as duas cabem, e a barra vira uma
ilha com borda.

**Desfazer e refazer ficam fora da faixa que rola.** A fileira de formatação
rola de lado num aparelho de 320 px; desfazer é o botão que mais se procura com
pressa e não pode estar escondido além da borda.

### Verificado

`marcacao.ts` é puro e testado: 16 testes novos (265 no total) cobrindo marcar
e desmarcar por dentro e por fora, troca de tipo de lista sem empilhar
marcador, recuo preservado, o ciclo de títulos e o cursor andando junto com o
marcador. Typecheck e lint limpos.

**A parte de tela não foi verificada num navegador de verdade** — mesma
ressalva das seções anteriores. O que mais merece um olho no aparelho: se a
barra fica mesmo colada acima do teclado do Android e se o foco sobrevive ao
toque nos botões.

### O que ficou de fora, de propósito

**A tela do neurônio ainda não renderiza o markdown** — `**assim**` aparece com
os asteriscos na leitura. Renderizar é o passo seguinte natural (um parser
pequeno e sem HTML solto), mas não foi pedido aqui.

## "Deslizar navegação" vira o único comportamento da Rede (17/09/2026)

Pedido do usuário: o botão que ligava/desligava o deslize da câmera (ver
"Deslizar navegação", 16/09/2026) saiu — o comportamento fica **sempre**
ligado, sem opção de desligar. O botão saiu da seção "Mostrar" dos filtros
da Rede, e a prop `deslizarNavegacao` saiu de `Tela.tsx` de ponta a ponta
(interface, desestruturação, o `if` que gateava `iniciarDeslize`): soltar
arrastando a câmera desliza um pouco, ponto — não há mais um caminho onde
isso não acontece. `Rede.tsx` também perdeu o `useState` e o ícone `Waves`,
que ficaram sem uso.

## O comprimento do livro não move mais o formulário (17/09/2026)

Pedido do usuário: trocar o Comprimento na tela de novo livro empurrava o
resto da tela — a amostra ao lado do campo "Nome" mudava de altura junto com
a escolha (72px no "Curto", 127px no "Enorme"), e como essa amostra é um item
da mesma linha flex do campo "Nome", a linha inteira crescia ou encolhia,
empurrando Pano/Largura/Comprimento/o botão de enviar para cima ou para
baixo a cada toque.

Corrigido com um invólucro de altura fixa em `REFERENCIA_DA_AMOSTRA_PX`
(130px — o teto do que qualquer preset produz) ao redor da amostra, com
`items-end` ancorando-a embaixo, como um livro numa prateleira: a amostra
continua crescendo e encolhendo por dentro, mas a linha em volta dela não
muda de tamanho nunca, então nada abaixo se desloca. Custo assumido: a linha
"Nome" fica com a altura do maior preset possível mesmo quando a amostra é
menor — mais respiro em cima dela do que antes, na troca por nunca mais
pular a tela.

**Não verificado num navegador de verdade nesta sessão** — sem ferramenta de
automação de navegador disponível neste ambiente, a correção foi conferida
lendo o CSS/flexbox, não vista na tela. Typecheck, lint e os 265 testes
automatizados continuam limpos.

## O seletor de livro do neurônio deixa de ser o `<select>` do navegador (17/09/2026)

Pedido do usuário: ao criar/editar um neurônio, tocar no chip do livro abria
o picker nativo do Android/WebView — uma lista genérica do sistema, fora da
paleta e da tipografia do app, a única peça da tela que ainda não era "deste
projeto".

**Virou uma folha**, no mesmo padrão de todo outro painel do app: `cartao` +
`linha-de-lista` para as linhas (o mesmo desenho do menu de ações de um livro
na estante), ponto da cor à esquerda, `Check` à direita no livro já
escolhido, e toca-e-fecha — não precisa de um "confirmar" à parte. O chip que
abre a folha manteve exatamente a aparência de antes (mesma classe `.chip`,
mesmo ponto de cor, mesma seta); só o que abre ao tocar mudou.

**Mora na URL** (`?livros=1`), como os filtros da Rede e o "apagar" do
neurônio: o voltar do Android fecha a folha antes de sair do formulário
inteiro, em vez de fechar as duas coisas de uma vez. A chave `livros`
(plural) é de propósito diferente da `livro` que `Novo.tsx` já lê para o
livro sugerido — os dois nunca colidem porque são lidos por componentes
diferentes com propósitos diferentes, mas o nome ficou deliberadamente
distinto para não confundir quem for ler o código depois.

**Não verificado num navegador de verdade nesta sessão** — mesma ressalva das
seções anteriores. Vale conferir se a folha abre no toque do chip e fecha
sozinha ao escolher. Typecheck, lint e os 265 testes automatizados continuam
limpos (não há teste novo — é composição de peças já testadas, `Folha` e o
resto do formulário, sem lógica pura nova).

## A barra de escrita parava de dar acesso a "Criar neurônio" (17/09/2026)

Bug relatado pelo usuário: com o teclado aberto no celular, a barra de
formatação cobria o botão de criar, sem jeito de salvar o texto.

**Duas causas, as duas na mesma área:**

1. `.barra-de-escrita` tinha `position: sticky; bottom: 0` na regra base e
   **nunca resetava isso no desktop** (`@media (min-width: 768px)` só
   ajustava margem/borda) — diferente de `.barra-de-acao`, que vira `static`
   ali. A barra de escrita ficava presa ao pé da viewport por cima de
   qualquer coisa que estivesse no fluxo normal embaixo dela, tablet/desktop
   inclusive.
2. No celular, o botão de criar era escondido de propósito enquanto
   `escrevendo` (`max-md:hidden`) — a ideia original era "o pé é de quem
   estiver com foco", mas isso significava que **não havia como tocar
   "Criar neurônio" enquanto o teclado estava aberto**, exatamente o
   problema relatado.

**Corrigido nos dois pontos:** `.barra-de-escrita` ganhou `position: static`
no breakpoint de desktop, igual a `.barra-de-acao`. E no celular os dois
passaram a **empilhar** em vez de um substituir o outro — envoltos por
`.rodape-de-escrita` (novo, `index.css`), que é quem gruda no pé da tela;
os dois filhos voltam a ser fluxo normal dentro dele, então não competem
pelo mesmo `bottom: 0`. Botão de criar sempre alcançável agora, com ou sem
teclado.

**Não verificado num navegador de verdade nesta sessão** — mesma ressalva de
sempre. A causa 1 foi encontrada lendo o CSS (a media query que faltava);
vale confirmar no aparelho que as duas barras aparecem empilhadas, sem
sobrepor, com o teclado de verdade aberto. Typecheck, lint e os 265 testes
continuam limpos.

## Criar um neurônio leva para a Rede, com uma animação (17/09/2026)

Pedido do usuário: depois de criar, em vez de abrir a tela do próprio
neurônio, o app leva para a Rede e mostra, com uma animação, quem ele acabou
de conhecer. Antes de escrever qualquer linha, perguntei os quatro pontos que
mudavam o tamanho do trabalho — as quatro respostas do usuário foram as
recomendadas:

1. **A Rede substitui a tela do neurônio como destino** — o aviso de texto
   "Achou 2 pontes…" saiu; ver o fio se formar é o que substitui.
2. **Espera o processamento terminar antes de animar** — sem "meio
   processando" na Rede.
3. **Sem conexão nenhuma, só a entrada do nó** — nenhum aviso, nenhum
   destaque de vizinhança.
4. **A câmera começa afastada** (o palácio inteiro) **e aproxima** até o
   novo neurônio.

### Por que a resposta 2 não precisou de código nenhum

`criarNeuronio` na store já é `async` e só resolve **depois** de
`engine.criarNeuronio(...)` voltar do Worker com o palácio inteiro
processado — embedding, conexões e posição na Rede já gravados (ver "Como o
fluxo funciona", Fase 4: "uma escrita devolve o palácio inteiro"). `Novo.tsx`
só navega depois que essa Promise resolve, então a Rede nunca abre com o
neurônio recém-criado "no meio do processamento" — não existia isso para
esperar.

### `revelar`, o novo método de `ControleDaTela`

`Tela.tsx` já enquadra o palácio inteiro sozinha ao montar (o efeito que lê
`assinatura` sempre enquadra na primeira vez — nenhuma posição gravada ainda
conta como "forma nova"). `revelar(id)` parte dali:

1. Espera `PAUSA_ANTES_DE_REVELAR` (450ms) — só para o "palácio inteiro" da
   resposta 4 ter um instante de existir aos olhos de quem está vendo, antes
   de a câmera se mexer.
2. Anima até um alvo: se o neurônio tem vizinho, `camaraParaEnquadrar` (nova,
   pura, `layout.ts`) enquadra ele **e** seus vizinhos de 1 salto juntos —
   não um zoom apertado só no ponto, que deixaria os fios que acabaram de
   nascer fora do quadro. Sem vizinho, centraliza nele sozinho, na mesma
   escala de `focar`.
3. Ao terminar, **só seleciona se havia vizinho** (resposta 3): selecionar
   um nó sem ninguém ligado apagaria — via `vizinhancaDe`, que sempre inclui
   pelo menos o próprio nó — o resto do palácio inteiro para "destacar" uma
   vizinhança de um elemento só. Nesse caso a revelação é só a câmera
   chegando; o usuário ainda pode tocar o nó depois, normalmente.

### `camaraParaEnquadrar`: extraído de `enquadrar`, não inventado do zero

A matemática (caixa delimitadora dos pontos, escala que cabe, centro pela
diferença de folgas) já existia dentro de `enquadrar()`. Virou função pura
e testada em `layout.ts` — `enquadrar` agora só chama ela com **todos** os
pontos da cena, e `revelar` chama a mesma função com só o nó e seus
vizinhos. Nenhuma duplicação de fórmula entre as duas.

### `animarCamera`: a terceira animação de câmera, agora uma função só

`animarAssentamento` (posições de nós) e o antigo deslize embutido em
`iniciarDeslize` (câmera) já repetiam o mesmo laço `rAF` com
`easeOutCubic`, cancelável por uma referência `{ cancelado }` — cada um com
a própria cópia. Com a revelação virando a terceira animação de câmera do
arquivo, a duplicação passou de "aceitável" para "vale extrair" (regra de
três): `animarCamera(alvo, duração, execucaoRef, aoTerminar?)` generaliza o
laço, e `iniciarDeslize` foi reescrito por cima dela — ficou um terço do
tamanho. `animarAssentamento` continua separada, porque anima **posições de
nós** (um `Map` inteiro via `quadroDoAssentamento`), não a câmera — são
formas diferentes de interpolar.

### O aviso de "conectou com…" saiu de `Neuronio.tsx`

Como `Novo.tsx` não navega mais para `/neuronio/:id?nasceu=1`, esse caminho
ficou inalcançável — removidos o componente `Nasceu`, `acabouDeNascer`, os
imports que só ele usava (`Sparkles`, `listar`, o tipo `VizinhoDoNeuronio`) e
a animação `.animar-achado`/`@keyframes achado` do CSS, que também não tinha
mais chamador. Mesmo padrão de sempre: código sem uso concreto sai (regra 7
do mestre), não fica desligado "para o caso de".

### Cancelamento

Um toque novo na tela cancela a revelação em curso — tanto a pausa
(`window.clearTimeout`) quanto a animação já iniciada (`cancelado = true`,
o mesmo padrão do deslize) —, porque segurar a tela é sempre "para agora"
neste arquivo, nunca "espera terminar". `prefers-reduced-motion: reduce`
pula a pausa e a animação inteira e vai direto para onde a câmera terminaria
— o mesmo respeito de "abrir o livro" (Fase 22).

### Verificado

`camaraParaEnquadrar` é pura e testada: câmera neutra sem pontos, um ponto
só centralizado, o lado que aperta decidindo a escala, o teto de escala
respeitado com pontos colados, pontos não-finitos ignorados sem quebrar — 5
testes novos (270 no total). Typecheck e lint limpos.

**Não verificado num navegador de verdade nesta sessão** — mesma ressalva de
sempre, e aqui pesa mais: é uma sequência temporizada (pausa + animação +
seleção) que só se confirma vendo de verdade. Vale conferir no aparelho se
o ritmo (450ms de pausa, 850ms de animação) está bom, se a câmera enquadra
o par (nó + vizinho) de um jeito que não corta nada, e se um toque no meio
da sequência cancela limpo.

## O autofill do Android/Gboard nos campos de texto (17/09/2026)

Pedido do usuário, a partir de duas capturas: o teclado do Android mostra uma
fileira de ícones (chave, cartão, localização) por cima dos campos de nome de
livro e título de neurônio — o autofill do sistema oferecendo senhas, cartões
e endereços salvos para campos que não são nada disso.

**Isto não é o site.** É o Android Autofill Framework, do sistema
operacional — o mesmo mecanismo que preenche login e cartão em qualquer app,
não só no navegador. `autocomplete="off"` no campo é o sinal que a própria
especificação HTML dá para "não me preencha", e já estava nos dois campos das
capturas — mas o sinal mais forte que a web tem é o **mesmo atributo no
`<form>` que envolve o campo**, não só nele: Chromium (a base do WebView
Android) trata o `autocomplete` do formulário como o sinal de mais peso para
decidir se avisa o Android que aquele conjunto de campos é autofillável.
Nenhum dos dois `<form>` do app (`FormularioDeLivro.tsx`, o de livro;
`Formulario.tsx`, o de neurônio) tinha isso — só os campos individuais.
Corrigido nos dois, e fechada a última lacuna: a `<textarea>` do conteúdo do
neurônio, que não tinha `autocomplete` nenhum.

**Com isso, todo campo de texto do projeto tem `autocomplete="off"`** — os
dois formulários (agora form **e** campo) e a busca (`Busca.tsx`, que já
tinha o conjunto mais completo: `autoComplete`, `autoCorrect`,
`autoCapitalize`, `spellCheck={false}`, por não viver dentro de um `<form>`).

**Limite honesto:** isto é o que a web consegue controlar. Se o ícone
continuar aparecendo mesmo assim, a causa está fora do alcance do código
deste projeto — depende da versão do WebView/Chrome do aparelho e de qual
serviço de autofill está ativo em Ajustes → Sistema → Idiomas e entrada →
Serviço de preenchimento automático no Android do usuário. O controle
realmente definitivo (`importantForAutofill` na `WebView` nativa) só existe
depois de o app virar APK de verdade (Fase 9) — é um arquivo de
`android/`, que este projeto não edita à mão por ser gerado pelo Capacitor;
fica anotado aqui para quando essa fase acontecer, se o ícone persistir.

**Não verificado num navegador de verdade nesta sessão** — mesma ressalva de
sempre; esta em particular só se confirma vendo o teclado de um Android real,
que é exatamente onde o problema foi visto. Typecheck, lint e os 270 testes
continuam limpos (mudança sem lógica nova — só atributos).

## Os fios do livro escondem até o toque, e o score vira 0-100 (17/09/2026)

Pedido do usuário, a partir de uma captura da tela do livro: cada neurônio
listado ali já mostrava todos os fios abertos, sempre — um neurônio com 10
conexões virava um cartão gigante, e a tela inteira era só isso.

**Os fios agora escondem por padrão.** Cada cartão controla a própria
abertura (`abertos`, um `Set` de ids em `Livro.tsx` — ver mais fundo);
tocar em qualquer parte dele (título ou prévia do texto, não só uma área
pequena) alterna. A seta (`ChevronDown`, gira 180° quando aberto — "uma seta
padrão mesmo", como o usuário pediu) é só o indicador; o alvo de toque é o
cartão inteiro, do mesmo jeito que o resto do app trata alvo de toque pequeno
como erro certo.

**O que isso custava, e como foi coberto:** o cartão era um `Link` para a
tela do próprio neurônio — virando um `button` (o toque precisa alternar, não
navegar), esse caminho sumia. Adicionado um botão "Abrir" pequeno, dentro da
área expandida, abaixo dos fios — o mesmo padrão que o cartão do neurônio
selecionado na Rede já usa (título + "Abrir"). Sem isso, a única forma de
chegar à tela de um neurônio a partir do livro seria tocar num fio de outro
neurônio primeiro.

**Cada cartão abre e fecha por conta própria**, não um por vez: comparar os
fios de dois neurônios ao mesmo tempo é um uso razoável desta tela, e nada
no pedido disse "um só aberto".

### O score virou 0-100

`Fios.tsx` é compartilhado entre esta tela e a do próprio neurônio — mudar
ali resolveu os dois lugares de uma vez. Era `score.toFixed(3)` (`0.922`);
virou `Math.round(score * 100)` com `%` (`92%`) — o grau de compatibilidade
entre os dois assuntos, não uma fração de cientista. O desenho do fio (a
linha, espessura e tracejado por score zero) não mudou — só o número ao
lado.

**Não verificado num navegador de verdade nesta sessão** — mesma ressalva de
sempre; vale conferir o toque abrindo/fechando e a seta girando num aparelho
de verdade. Typecheck, lint e os 270 testes continuam limpos (sem teste
novo — é composição de UI e um `Set` local, sem função pura nova).

## Fases

0. ✅ Esqueleto (Vite/React/TS/Tailwind/PWA/Capacitor)
1. ✅ Contratos e dados (tipos, portas, `DexieRepo`, seed)
2. ✅ Núcleo puro + testes com embeddings falsos (`src/core/motor`)
3. 🟡 Spike (`spike.html`) — decisões tomadas no desktop; **falta confirmar no celular**
4. ✅ Adapters web + fluxo completo (`TransformersEmbedding`, Worker, store, tela crua)
5. ✅ Export/import (arquivo JSON, fusão idempotente, reprocessamento no
   import) — **UI de Ajustes removida em 14/09/2026**, capacidade do
   repositório intocada
6. ✅ Estante (lombadas, livro aberto, rotas) — acabamento visual fica para o fim
7. ✅ Rede do palácio em `<canvas>` (layout determinístico, foco, só as pontes)
8. 🟡 Criação, edição e navegação — **a porta ficou para a passada de
   acabamento**; criar livro entrou nesse padrão de rota em 14/09/2026
   (`/novo-livro`), editar livro continua em folha
9. 🟡 Empacotamento Android — **falta compilar e instalar o APK** (sem JDK/SDK aqui)
10. ✅ Estante: fundação de prateleiras manuais + arrastar como bandeja — base para as 9 melhorias de estante aprovadas (ver memória de projeto)
11. ✅ Modo organizar — 1ª das 9 melhorias — **removido em 14/09/2026**
12. ✅ Busca global — 2ª das 9
13. ✅ Ordenar com um toque — 3ª das 9 — **removido em 14/09/2026**
14. ✅ Seleção múltipla — 4ª das 9
15. ✅ Nome de prateleira — 5ª das 9 — **removido em 14/09/2026**
16. ✅ Textura/emblema na lombada — 6ª das 9 — **seção do formulário removida
    em 14/09/2026** (o campo e a lombada continuam existindo)
17. ✅ Intensidade da luz ajustável — 7ª das 9
18. ✅ Visão geral da estante (minimapa/zoom-out) — 8ª das 9
19. ✅ Largura da lombada configurável — 9ª e última das 9 melhorias de
    estante aprovadas depois da Fase 10
20. ✅ Comprimento configurável na lombada — revisita a tensão registrada na
    Fase 19
21. ✅ Estante em lugares fixos, com enfeite que se tira e se põe — revisita a
    escolha da Fase 10
22. ✅ Abrir o livro com animação — o livro sai da estante, vira de capa e abre
23. ✅ Rede como constelação — tela cheia e nova pintura; organização por
    significado com posições gravadas; tocar acende a vizinhança, nomes ao
    aproximar, duplo toque e busca leva a câmera; arrastar neurônio com os
    vizinhos acompanhando e assentando
