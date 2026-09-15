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

- **A estante e o retângulo da Rede ficaram com as cores de antes.**
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
