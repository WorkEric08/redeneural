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
livros:     { id, tipo: 'conceitos' | 'acervo', titulo, cor, estilo, prateleira, ordem, executavel, diasParaAdormecer, createdAt }
neuronios:  { id, livroId: string | null, titulo, conteudo, embedding: Float32Array | null,
              estado: 'para_fazer' | 'fazendo' | 'feita' | null, ultimoToque, resultadoLink,
              resultadoImagem: { mime, largura, altura } | null, createdAt, updatedAt }
conexoes:   { id, aId, bId, score, emb, rr, cross, mantidaPorA, mantidaPorB, updatedAt }
vagas:      { prateleira, ordem }
enfeites:   { prateleira, ordem, cor, estilo, larguraLombada, comprimentoLombada, dourado, detalheEscuro }
resultados: { neuronioId, imagem: Uint8Array, miniatura: Uint8Array }
anexos:     { id, livroId, legenda, midia, embedding: Float32Array | null, createdAt, updatedAt }
arquivos:   { anexoId, imagem: Uint8Array, miniatura: Uint8Array }
vinculos:   { id: 'anexoId::conceitoId', anexoId, conceitoId, score, updatedAt }
```

- As três últimas são das pastas de acervo (24/09/2026) — ver "Pastas de
  acervo". Um anexo nunca entra no grafo de conceitos; os `vinculos` são a
  escolha dele, só num sentido.

- `enfeites` (Dexie v13, 07/10/2026; v15 em 08/10/2026 corrigiu o `dourado`) guarda só os enfeites que a pessoa **definiu ou
  moveu**; o resto continua sorteado pelo lugar. Ver "Enfeites que se definem e se movem".

- `neuronios.resultadoImagem` e `resultados` (Dexie v14, 07/10/2026) são a imagem do que saiu
  de uma ideia feita; os bytes ficam à parte, como os do anexo. Ver "Executáveis: desfazer e a
  imagem do resultado".

- `neuronios.livroId` `null` é o **porto** (01/10/2026): um neurônio que o
  motor não soube onde guardar, esperando a pessoa escolher. Ver "O Porto".

- `meta` guarda, além do perfil, das posições da Rede e das preferências, o
  **mapa** (chave `'mapa'`, 01/10/2026): o centro e o raio de cada ilha e o
  lugar de cada neurônio nela. Diferente das posições da Rede, **vai no
  backup**. Ver "O Mapa".

- `livros.executavel`/`diasParaAdormecer` e `neuronios.estado`/`ultimoToque`/
  `resultadoLink` são dos livros executáveis (Dexie v11, 01/10/2026). O estado
  só tem sentido num livro executável; fora dele fica guardado sem aparecer.
  Ver "Ideias executáveis".

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

> **Substituído em 06/10/2026 (estilo Noite):** o ouro deixou de ser "só do título" e
> de significar a ponte (a ponte é azul desde 15/09). Na estante ele **marca estado**
> (Fazendo, Feita) e **acabamento** (filetes dos enfeites, fio da prateleira). Ver
> "A estante no estilo Noite".

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
  mostra sem você abrir nada. (O ponto no topo, "livro com fio saindo", só aparece desde
  06/10/2026 no livro que acende por ponte, em azul — ver "A estante no estilo Noite".)
- **De longe a luz lava a cor do pano.** A lombada é `color-mix` da cor do livro com
  `--lavagem`; dentro do livro a barra usa a cor real, sem lavagem. É a primeira
  referência virando regra: distância desbota.
- **A lombada é sempre um objeto escuro**, nos dois temas. Livro é escuro contra
  parede, não o contrário. (Desde 06/10/2026 o título não é mais gravado em ouro: é
  claro ou escuro conforme a cor, e o **Creme é o único tom claro** da paleta.)
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
- **Panos** (substituídos em 06/10/2026 pela paleta Noite de 10 tons — ver "A estante no estilo Noite"): 8 cores hex (`features/estante/panos.ts`), nenhuma na faixa do ouro.
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

> **Substituída em 07/10/2026**: a luz agora tem o 50 no meio (cores reais), com sombra abaixo e
> brilho acima, uma para os livros e outra para os enfeites — ver "Ajustes: sem a seção Mapa…".
> O que segue é o histórico da "lavagem".

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

| Peça       | Antes                                            | Agora                                                       |
| ---------- | ------------------------------------------------ | ----------------------------------------------------------- |
| Título     | campo com borda e rótulo "Título", no corpo      | `input` na **barra de topo**, no lugar do nome da tela      |
| Livro      | `select` de 52 px com rótulo "Livro"             | etiqueta (`.chip`) com o ponto da cor, logo abaixo da barra |
| Texto      | `textarea` com borda, fundo e rótulo             | a folha: sem caixa, ocupando o que sobra da tela            |
| Explicação | "As conexões nascem sozinhas" + "Escreva livre…" | saíram as duas                                              |

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

> **Revogada em 17/09/2026.** A barra saiu a pedido do usuário e, com ela, a
> convenção de markdown que esta seção estabeleceu — o conteúdo de um neurônio
> é **texto, e só**. Ver "O conteúdo é texto puro, sem convenção de marcação".
> O que segue fica como registro do que foi construído e por quê, não como
> regra vigente.

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

| Ícone da referência         | Aqui                                           |
| --------------------------- | ---------------------------------------------- |
| B, itálico, tachado         | `**`, `*`, `~~` — alternam, não empilham       |
| Listas, numerada, checklist | `- `, `1. `, `- [ ] `                          |
| Recuo ↔                     | dois espaços por passo                         |
| Desfazer / refazer          | histórico próprio (ver abaixo)                 |
| "Aa" e tamanho "15"         | viraram **um** botão: ciclo `#` → `##` → `###` |
| Sublinhado                  | **fora** — markdown não tem                    |
| Alinhamento, caixa de texto | **fora** — markdown não tem                    |
| Caneta de desenho           | **fora** — não existe em texto puro            |

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

> Esse passo seguinte nunca aconteceu, e agora não vai: em 17/09/2026 a barra
> foi removida e a convenção, revogada. Era exatamente esta pendência que
> deixava o markdown sem nenhuma das duas pontas.

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

## O balanço: um teste com movimento contínuo na Rede (17/09/2026)

Pedido do usuário: "os neurônios podem se mexer levemente", como teste.
Isso esbarra em duas decisões já registradas — "o layout é determinístico...
você precisa reencontrar o conceito no mesmo canto amanhã" (Fase 7) e "sem
laço de animação... um `requestAnimationFrame` eterno é bateria queimando
para mostrar imagem parada" (também Fase 7, repetido a cada animação nova
desde então). Apontei as duas antes de mexer, com uma pergunta para cada:

1. **A posição gravada muda de verdade, ou é só visual?** Escolha do
   usuário: só visual, nunca grava. "Reencontrar amanhã" continua valendo —
   fechar e abrir a Rede de novo, ela volta exatamente onde a física por
   significado deixou.
2. **Vale o custo de bateria de um laço contínuo enquanto a tela está
   aberta?** Escolha do usuário: sim, mas só enquanto a Rede está na tela —
   nunca em segundo plano.

### Como fica sem quebrar a promessa

`balanco(id, tempoMs)` (`layout.ts`, pura e testada) devolve um vetor em
`[-1, 1]` por eixo — período (3,2-5,4s) e fase tirados da `semente` do id
(o mesmo utilitário que a estante usa para não repetir cada lombada igual),
não de `Math.random`: o balanço de um neurônio é sempre o mesmo desenho no
tempo, só que "sempre o mesmo" agora quer dizer "o mesmo movimento", não "o
mesmo ponto parado". Frequências de x e y levemente diferentes (`* 0.87` em
y) desenham uma órbita que muda de forma devagar, não um círculo repetindo.

`pintar()` soma esse vetor — já na amplitude de **tela** (`AMPLITUDE_DO_
BALANCO_PX`, 2,5px, dividida pela escala da câmera a cada quadro, do mesmo
jeito que o próprio ponto já é desenhado em tamanho de tela) — em cima da
posição real de cada neurônio, **antes** do overlay de arrasto/assentamento:
um nó sendo arrastado não balança, a posição dele é a mão de quem arrasta.
A posição gravada em `meta.posicoesDaRede` nunca é tocada — o balanço não
existe fora do quadro que acabou de ser pintado.

### A exceção de verdade a "sem laço de animação"

As outras animações desta tela (assentamento, deslize, revelação) são todas
limitadas no tempo e param sozinhas — "assenta e para". O balanço é
diferente: um `useEffect` novo inicia um `requestAnimationFrame` contínuo
ao montar e cancela ao desmontar, sem duração — a primeira vez que este
arquivo tem um laço que não para sozinho. `prefers-reduced-motion: reduce`
desliga o laço inteiro: quem pediu menos movimento não pediu um balanço de
fundo perpétuo.

### Verificado

`balanco` é pura e testada: nunca passa de 1 em nenhum eixo, é determinística
(mesmo id + mesmo instante = mesmo vetor), e dois neurônios não balançam em
cardume (fases diferentes no mesmo instante) — 3 testes novos (273 no
total). A etiqueta do selecionado usa o mesmo mapa de posições que o
desenho, então acompanha o balanço do ponto sem código a mais. Typecheck e
lint limpos.

**Não verificado num navegador de verdade nesta sessão** — mesma ressalva de
sempre, e esta é a que mais precisa de um aparelho de verdade: é sensação de
movimento, bateria e desempenho com centenas de nós, nenhum dos três se mede
lendo código. Vale conferir se a amplitude (2,5px) está mesmo "leve", se o
laço contínuo pesa a bateria de um jeito perceptível, e se um palácio grande
continua fluido com todo mundo balançando a cada quadro.

## Toda troca de tela começa do topo (17/09/2026)

Pedido do usuário: abrir um neurônio (ou qualquer outra tela) não pode
herdar a rolagem de onde a pessoa estava — sempre do topo para baixo, nunca
caindo no meio ou no fim de uma tela nova. Pedido como regra geral, sem
exceção até ele explicitar uma.

**A causa:** este é um SPA — trocar de rota não recarrega a página, então o
navegador não tem motivo nenhum para mexer no `scrollTop` sozinho. Ler um
neurônio comprido até o fim e depois tocar num fio para outro neurônio (ou
voltar para a lista do livro) mantinha a rolagem exatamente onde estava.

**Onde mora, e por que só ali:** um `useLayoutEffect` novo em `App.tsx`,
disparado por `pathname` — o casco que envolve toda rota, então uma correção
só resolve o app inteiro, sem repetir a mesma linha em cada página.
`useLayoutEffect`, não `useEffect`: roda antes do navegador pintar, para não
piscar "ainda rolado" por um instante antes do salto. **Só por `pathname`,
não pela busca inteira**: os painéis do app (`?apagar=1`, `?editar=1`,
`?filtros=1`, e por aí vai) mudam a URL sem trocar de rota, e abrir um deles
não pode jogar a página para cima por baixo do painel que acabou de subir —
só a barra de cima ficaria visível, com a folha cobrindo o resto.

**Não conflita com o resto:** a Estante e a Rede já travam a própria rolagem
(`useTravarRolagem`) e já tinham o próprio `window.scrollTo(0, 0)` só para
elas — chamar de novo por cima não faz diferença (não há o que rolar). As
folhas rolam dentro de `.folha-corpo`, um elemento à parte da página; `window.
scrollTo` nunca toca nelas.

**Não verificado num navegador de verdade nesta sessão** — mesma ressalva de
sempre. Vale conferir especificamente: ler um neurônio comprido até o fim,
tocar num fio para outro, e confirmar que a tela nova abre do topo; e que
abrir uma folha (apagar, filtros) não faz a página pular por baixo dela.
Typecheck, lint e os 273 testes continuam limpos (mudança de efeito único,
sem lógica pura nova para testar).

## Os ícones do app tinham um fundo cravado, e a barra de status vira preta (17/09/2026)

Dois pedidos do usuário, depois de uma conversa identificando as partes do
PWA que o Android desenha por cima do app: splash screen e barra de status.

### A "borda escura" da splash screen

Não era falta de centralização — medi a forma da porta dentro do canvas de
512×512 (`sharp`, num script descartável) e ela já estava quase perfeita
(399×421px de conteúdo, margens de 56/57px e 45/46px, 1px de diferença,
imperceptível). A causa real: os cinco arquivos de ícone (`logo-192`,
`logo-512`, `logo-maskable-512`, `favicon`, `apple-touch-icon`) tinham um
fundo quase preto (`#101010`) **cravado no PNG**, diferente do
`background_color` do manifest (`#0d1b2a`, Rich Black) — a splash screen
pinta a cor do manifest atrás do ícone, e o quadrado escuro do próprio
arquivo aparecia como uma borda que não batia com o resto.

**Corrigido por tipo de ícone, não do mesmo jeito para todos:**

- `logo-192.png`, `logo-512.png`, `favicon.png` (propósito "any" — ou sem
  propósito): fundo virou **transparente**. O navegador preenche por baixo
  com `background_color`, sem costura nenhuma.
- `logo-maskable-512.png` e `apple-touch-icon.png`: **precisam** continuar
  opacos — o padrão maskable proíbe transparência, e o iOS pinta
  transparência de preto sozinho. Recoloridos de `#101010` para `#0d1b2a`
  em vez de removidos.

**O detalhe que quase passou batido:** a primeira versão do script só
ajustava o alfa dos pixels de borda (antialiasing), mantendo a cor RGB
original — que ainda carregava a mistura com o preto antigo. Resultado: um
halo escuro fino sobrevivendo na borda mesmo com o fundo "transparente".
Corrigido despremultiplicando a cor (tirando a contribuição do fundo antigo
do RGB do pixel, não só do alfa) antes de salvar — só assim a borda
recompõe limpa sobre qualquer fundo novo. Verificado compondo o resultado
sobre o azul real do manifest antes de aceitar (visualmente limpo, sem
frame).

### A barra de status vira preta, sempre

**Isto diverge da "Direção visual"** (Fase 6: "o fundo é azul-marinho
profundo, não... preto... preto puro não tem profundidade") e de uma
decisão registrada na Fase 8/"A paleta e a interface" (a barra de status
seguia a sala — Rich Black à noite, Platinum de dia, trocada ao passar pela
porta). Pedido explícito do usuário, duas vezes ("no padrão, preto") — a
regra de ouro não mudou para o _app_, só a barra de status parou de segui-la.

Como "padrão" também significou "sem condição nenhuma": as três metas
`theme-color` de `index.html` (a da porta + duas por `prefers-color-scheme`)
viraram uma só, `#000000`, fixa. `theme_color` no manifest (`vite.config.ts`)
foi para o mesmo preto — é ele que vale para o app instalado, não a meta do
HTML. `background_color` do manifest **não mudou**: continua Rich Black,
porque é a cor da splash screen, uma coisa diferente da barra de status.

**Código morto removido junto:** o `useEffect` em `App.tsx` que tirava a
meta `id="cor-da-porta"` ao passar pela porta não tinha mais função — com
uma cor só, não há mais meta para trocar. Saiu, pelo mesmo motivo de sempre
(regra 7 do mestre).

**Não verificado num navegador de verdade nesta sessão** — mesma ressalva
de sempre; os ícones foram conferidos lendo os pixels e compondo sobre o
fundo real (dá para confiar nisso), mas a barra de status e a splash screen
de verdade só se veem num Android de verdade. Typecheck, lint e os 273
testes continuam limpos (mudança de assets e configuração, sem lógica nova).

## Editar livro vira rota própria, e a seleção múltipla sai (17/09/2026)

Dois pedidos do usuário sobre o menu de ações de um livro (segurar na
estante): trocar o texto de "Renomear e trocar o pano" para "Renomear e
editar livro", tirar "Selecionar vários" do menu, e fazer o editar abrir
como tela cheia — a mesma forma de `/novo-livro` — em vez da folha que
abria hoje.

### Editar livro: de folha-dentro-de-folha para rota

`editar` saiu do tipo `Painel` (`painel.ts`) e virou `/livro/:livroId/editar`
(nova página, `EditarLivro.tsx`, espelhando `NovoLivro.tsx` ponta a ponta:
mesma barra de topo, mesmo `FormularioDeLivro`, só com `inicial` vindo do
livro existente em vez de vazio). O botão no menu de ações virou `<Link
replace>`, no mesmo padrão de "Novo neurônio neste livro" — `replace` para o
painel de ações não ficar no histórico atrás da tela de editar; voltar dali
cai direto na estante.

**`FormularioDeLivro` perdeu o `onCancelar`.** Ele existia só para a folha
de editar ter um botão "Cancelar" ao lado do salvar — sem folha, virou
código morto (ninguém mais passa essa prop). Removido dos dois lados: o
prop e o ramo condicional que desenhava os dois botões lado a lado. O
formulário agora só tem o caminho de tela cheia — o mesmo que
`NovoLivro.tsx` sempre usou.

### Seleção múltipla (Fase 14) removida por completo

"Selecionar vários" era a **única** porta para o modo de seleção — sem ela,
nada mais no app liga `selecionando` a `true`. Deixar o resto ligado seria
código sem uso concreto (regra 7 do mestre), o mesmo raciocínio das
remoções de 14/09/2026 (modo organizar, ordenar, nome de prateleira):
melhor tirar tudo agora do que deixar meio-removido.

Saiu de ponta a ponta: `Estante.tsx` (estado `selecionados`, a fileira de
baixo alternativa "N livros selecionados · toque num lugar..."),
`Movel.tsx` (a prop e o desvio no gesto — tocar sempre espia agora, nunca
mais alterna seleção), `Lombada.tsx` (o selo de check no pé da lombada — o
emblema, que dividia aquele lugar com ele, agora aparece sempre), `index.css`
(`.lombada-selecionado`, `.lombada--livro[data-selecionado]`), e
`moverVariosLivros` da store (`palacio.ts`) — a única coisa que ele fazia
era mover o grupo marcado, e não existe mais grupo marcado.

**Ficou:** `primeiroLugarLivre` (o helper que `moverVariosLivros` usava) —
continua servindo `criarLivro`, `motor.worker.ts` e `dexieRepo.ts`, então
não tinha por que sair.

**Não verificado num navegador de verdade nesta sessão** — mesma ressalva de
sempre. Vale conferir: o menu de ações mostra só "Renomear e editar livro",
"Novo neurônio neste livro" e "Apagar livro"; tocar em editar abre a tela
cheia com os dados certos; salvar volta para a estante; voltar sem salvar
também cai na estante, não no menu. Typecheck, lint e os 273 testes
continuam limpos.

## O pano sugerido de um livro novo é Azul (17/09/2026)

Pedido do usuário: criar um livro (tocando um enfeite, uma vaga, ou pelo
menu) sempre sugeria Vinho. Causa: `panoSugerido` (`panos.ts`) pega "o
primeiro pano que nenhum livro ainda usa" — no palácio do usuário, Violeta,
Verde-azulado, Terracota e Azul já estavam todos em uso, e Vinho era o
próximo da lista. Não era um valor fixo em Vinho, era essa lista que sempre
parava ali para aquele palácio específico.

**Corrigido ancorando em Azul primeiro:** `panoSugerido` agora sugere Azul
sempre que ele ainda não estiver em uso — o caso comum — e só cai para a
lógica antiga (primeiro pano livre, depois o resto por variedade) quando
Azul já está em uso por outro livro. Mantém o motivo de existir da lógica
antiga ("o novo nasce diferente dos vizinhos") como reserva, em vez de
substituí-la por um valor sempre fixo.

**Largura e comprimento já estavam certos:** `NovoLivro.tsx` já inicia os
dois em `LARGURA_PADRAO`/`COMPRIMENTO_PADRAO` ("Normal") desde 16/09/2026 —
nada para mudar aí, só confirmado.

Único ponto de uso: `panoSugerido` só é chamada em `NovoLivro.tsx`, a
mesma tela para criar um livro por qualquer caminho (enfeite, vaga vazia,
"Novo livro" pelo menu) — a correção vale para todos de uma vez.

**Verificado com teste automatizado** (diferente das últimas sessões — este
é lógica pura, sem tela): `panoSugerido` sugere Azul com a estante vazia e
com Violeta/Verde-azulado em uso; com Azul já em uso, cai para o primeiro
pano livre (Verde-azulado); com tudo em uso, continua sugerindo algo da
paleta. 1 teste novo (274 no total), typecheck e lint limpos.

## A lista de neurônios do livro ganha duas setas (17/09/2026)

Pedido do usuário: dentro de um livro, cada neurônio tinha só um alvo de
toque — o cartão inteiro expandia os fios. Chegar à tela cheia do neurônio
(para ler o texto completo) exigia expandir primeiro e achar o "Abrir"
pequeno escondido lá dentro, no fim da lista de fios.

Agora o cartão tem duas setas lado a lado, cada uma com o próprio alvo de
toque: `ChevronDown` continua abrindo os fios ali mesmo, sem trocar de tela
(o comportamento de expandir ficou como estava — só o botão de abrir que
morava dentro dele mudou de lugar); `ChevronRight`, **sempre visível**, é um
`Link` direto para `/neuronio/:id`. Os dois vivem em `flex items-stretch`
dentro do `<li>`, cada um com sua própria área de toque (`px-4`), para
expandir e abrir não disputarem o dedo um do outro.

O "Abrir" antigo — um botão pequeno e secundário dentro do bloco expandido
de fios — foi removido: a nova seta substitui essa função e fica visível o
tempo todo, sem precisar expandir primeiro para achá-la.

**Não verificado num navegador de verdade nesta sessão** — sem ferramenta de
automação de navegador disponível no ambiente desta conversa. Verificado com
typecheck, lint e os 274 testes automatizados (nenhum teste novo — é JSX e
CSS, sem lógica pura nova para testar, mesmo padrão de mudanças de layout
anteriores).

## A barra de escrita sai (17/09/2026)

Pedido do usuário: a barra de formatação da seção anterior ("A barra de
escrita acima do teclado") saiu — junto com `BarraDeEscrita.tsx`,
`marcacao.ts`/`marcacao.test.ts` e `useTextoComHistorico.ts`, removidos por
inteiro, não só desconectados da tela.

**Por que a remoção foi total, não parcial.** A barra existia só para
escrever markdown num campo que é `string` pura — o motivo registrado na
seção anterior. Sem ela, `marcacao.ts` (as funções de marcar/desmarcar
`**`, `*`, `~~`, listas, títulos, recuo) e `useTextoComHistorico` (o
histórico de desfazer/refazer feito à mão, porque o desfazer nativo do
navegador não sobrevive a um campo controlado) perdem o único motivo de
existir: nada mais no app precisa de histórico próprio de texto ou de
marcação de markdown. `conteudo` em `Formulario.tsx` voltou a ser um
`useState<string>` simples — sem `digitar`/`aplicar`/`desfazer`/`refazer`,
sem o `useEffectEvent` que repunha o cursor depois de um botão reescrever o
campo (não existe mais botão reescrevendo o campo). O `<textarea>` voltou a
ser só texto, sem nenhum controle extra em volta.

### O controle de tamanho de fonte entrou e saiu na mesma sessão

Um primeiro pedido pediu, no lugar da barra, um controle de tamanho de
fonte (A−/A+) fora do fluxo de foco/teclado — implementado, verificado
(typecheck, lint, 258 testes) e documentado. Um pedido seguinte, na mesma
sessão, revisitou a ideia: o controle deveria valer por trecho de texto
("uma linha em 16, outra em 20"), não no texto inteiro.

Isso esbarra num limite técnico, não numa escolha de design: uma
`<textarea>` HTML não tem como renderizar partes do texto em tamanhos
diferentes enquanto se escreve, não importa que marcação exista por trás —
é uma propriedade CSS só para o campo inteiro. Fazer isso ao vivo exigiria
trocar a `<textarea>` por um editor `contentEditable`, o que reabre a
decisão fechada na seção anterior ("A barra de escrita acima do teclado":
markdown em texto puro, não rich text, exatamente para não pagar esse
custo — cursor mais difícil de controlar, teclado do Android menos
confiável em `contentEditable`). Apontei o limite e as alternativas antes
de implementar; a resposta do usuário foi **reverter o pedido inteiro**, não
escolher uma alternativa — o controle de tamanho de fonte saiu por completo
(`Minus`/`Plus`, `fontePx`, o `style={{ fontSize }}` no `<textarea>`, a
segunda coluna na linha da etiqueta do livro), devolvendo `Formulario.tsx`
exatamente ao estado de antes desse pedido.

### A lupa do Android não tem API web

Um pedido à parte, ainda de pé: "melhore a lupa que ajuda a ver um texto
quando selecionado uma parte do texto" é sobre a lupa nativa que o Android
desenha sozinho ao arrastar as alças de seleção de texto: ela amplia o
trecho embaixo do dedo enquanto ele se move. **Não existe API web para
estilizar, reposicionar ou de qualquer forma customizar essa lupa** — é
desenhada pela WebView/Chrome no nível do sistema, no mesmo grupo de coisas
fora do alcance da web que já apareceram nesta sessão (cor da barra de
navegação, força do autofill do Gboard). Não há gambiarra CSS ou JS que a
alcance — e, com o controle de fonte revertido, não sobra nenhuma alavanca
indireta sobre ela neste momento.

**Não verificado num navegador de verdade nesta sessão** — mesma ressalva
de sempre: sem ferramenta de automação disponível, a remoção da barra (e,
depois, a remoção do controle de fonte) foram conferidas lendo o código e a
cascata do CSS, não numa tela de verdade. Verificado com typecheck, lint e
a suíte de testes (258 testes — perde os 16 de `marcacao.test.ts`,
removidos junto do arquivo).

## A tela cheia do neurônio deixa de mostrar as conexões (17/09/2026)

Pedido do usuário: dentro de um livro, clicar na seta ">" (que abre a tela
cheia do neurônio, ver "A lista de neurônios do livro ganha duas setas") não
deve mostrar as conexões ali.

A tela cheia (`Neuronio.tsx`) tinha uma seção "N conexões" com os mesmos
`Fios` que o livro já mostra inline ao tocar `ChevronDown` — duplicava o que
a outra seta já entrega, na mesma tela que a seção anterior redesenhou para
ser "como se lê o texto inteiro". Removida a seção inteira (o `<h2>` de
contagem e o `<Fios lista={meus} />`), junto do import de `Fios` e de
`contar`, que ficaram sem uso ali.

**O que ficou:** `vizinhos`/`meus` continuam existindo no arquivo — não para
desenhar conexão nenhuma, mas porque a contagem de fios ainda entra na frase
de confirmação de apagar ("Os N fios que saem dele vão junto..."). Essa
frase não é a seção visual removida, é aviso de consequência de uma ação
destrutiva, e continua servindo ao mesmo propósito de sempre.

**Escopo:** a mudança tira a seção de toda a tela cheia do neurônio, não só
de quem chega até ela pela seta do livro — não existe hoje um jeito de
diferenciar a origem da navegação nesta tela (a Rede e a Busca também levam
para cá), e criar esse desvio só para esconder a seção condicionalmente
seria complexidade que o pedido não trouxe. As conexões continuam visíveis
em dois lugares: inline no livro (`ChevronDown`) e na Rede.

**Não verificado num navegador de verdade nesta sessão** — mesma ressalva de
sempre. Typecheck, lint e os 258 testes automatizados continuam limpos
(sem teste novo — é remoção de JSX e imports, sem lógica pura nova).

## URLs dentro do texto viram link (17/09/2026)

Pedido do usuário: colar um link externo (o exemplo dado foi um vídeo do
YouTube) dentro do texto de um neurônio e conseguir abri-lo, sem fugir do
layout atual da tela de leitura.

**Sem mexer no dado.** `conteudo` continua `string` pura de ponta a ponta —
o mesmo motivo já registrado para o markdown em texto puro ("A barra de
escrita acima do teclado": é o contrato do núcleo, o que o modelo de
embedding lê, o que vai no backup). `dividirEmSegmentos` (nova,
`features/neuronio/links.ts`, pura e testada — 7 testes) só olha o texto na
hora de **desenhar** e separa em trechos comuns e URLs (`http://`/
`https://`), sem gravar marcação nenhuma de volta no texto. Uma URL colada
no meio de uma frase, com pontuação de frase colada nela (`"veja
https://x.com/y, legal"`, `"(veja https://x.com/y)"`), tem a pontuação
reconhecida como parte da frase, não da URL — testado com vírgula, ponto,
parênteses e combinações.

**`TextoComLinks`** (novo componente) substitui o `<p>` simples que
desenhava `neuronio.conteudo` na tela cheia do neurônio: mesmas classes de
sempre no `<p>` (`texto-do-usuario`, tamanho, `whitespace-pre-wrap`), só que
agora o texto vem fatiado em segmentos, e cada URL vira um `<a target=
"_blank" rel="noopener noreferrer">` no meio do fluxo — o texto ao redor
não muda de posição nem de tamanho de caixa, só a URL ganha sublinhado.

**Por que não fugiu do layout:** `break-all` só no `<a>`, não no parágrafo
inteiro. `whitespace-pre-wrap` já quebra linha nos espaços normais de uma
frase; uma URL longa não tem espaço nenhum para quebrar e, sem uma regra de
quebra forçada, ela empurraria a caixa de texto para fora da tela (o mesmo
tipo de estouro horizontal que o app evita em toda tela desde a Fase 6).
Com `break-all` só na URL, ela quebra no meio de si mesma quando precisa,
sem alterar como o resto do texto quebra.

**Escopo: só a tela cheia do neurônio.** A prévia de duas linhas dentro do
livro (`line-clamp-2` em `Livro.tsx`) continua mostrando o texto puro, sem
linkificar — um link cortado no meio por `line-clamp` (mostrando só
"https://youtu.be/abc" sem o resto, ou pior, cortando o próprio texto ao
redor) seria mais confuso que útil ali, e tocar aquele cartão já abre os
fios/a tela cheia, não o link.

**Limite assumido:** só reconhece `http://`/`https://` — o caso pedido
(colar um link) sempre vem com o protocolo. Um texto tipo "www.exemplo.com"
sem protocolo continua texto puro.

**Não verificado num navegador de verdade nesta sessão** — mesma ressalva
de sempre: a quebra de linha da URL comprida foi conferida lendo o CSS
(`break-all` vs. o `whitespace-pre-wrap` do parágrafo), não vista numa tela
de verdade. Vale colar um link comprido de verdade e confirmar que ele
quebra dentro da caixa, e que tocar nele abre numa aba nova. Typecheck,
lint e os 265 testes automatizados (7 novos, de `links.ts`) continuam
limpos.

## Três correções saídas de uma revisão crítica (17/09/2026)

O usuário pediu uma análise crítica do projeto — o que valeria melhorar em
design, layout ou funcionalidade —, com o pedido explícito de não inventar
ideia só para prolongar o trabalho. Levantei cinco pontos lendo o código (não
este arquivo); ele mandou fazer três. Os outros dois ficam registrados no fim
desta seção, como decisão pendente e não como pendência esquecida.

### 1. O palácio podia ser despejado pelo navegador, sem cópia nenhuma

`navigator.storage.persist()` nunca era chamado. Sem isso o IndexedDB é
"best-effort": sob pressão de armazenamento o navegador pode apagar os dados
do site sem avisar. Junte-se a isso que a UI de backup saiu em 14/09 e o
resultado é que **a única cópia dos dados vivia num lugar que o navegador tem
permissão de limpar**, sem via de recuperação.

`services/native/armazenamento.ts` (novo) pede armazenamento durável uma vez,
em `main.tsx`, ao lado de `travarGestosDeNavegador` — mesmo critério de pasta
de `gestos.ts` e `arquivos.ts`: existe porque o ambiente é um navegador, não
porque o palácio precisa. Pergunta antes se já é durável (`persisted()`), para
não repetir o pedido; falha em silêncio, porque não é uma ação que ninguém
pediu — nem o sucesso nem a recusa viram aviso na tela. No Chrome (a base da
WebView do Android) a decisão é automática e sem diálogo; o Firefox pergunta,
e a recusa não quebra nada.

**Zero botão novo**, de propósito: isto é a metade invisível do problema.
A metade visível — um jeito de exportar o backup — continua fora, que foi a
decisão do usuário em 14/09; o custo está apontado, e a escolha é dele.

### 2. A lista de neurônios de um livro estava ordenada por uuid

`listNeuronios` fazia `toArray()` sem ordenação, então a ordem era a da chave
primária: um uuid v4, ou seja, ordem nenhuma. Escrever três neurônios seguidos
e vê-los aparecer embaralhados contradiz o que o projeto defende em todo outro
lugar — a estante tem ordem gravada desde a Fase 10, a Rede tem posição
gravada desde 15/09, e justamente a lista mais textual não tinha ordem.

Agora ordena por `porMaisRecente` no repositório — **o mais recente primeiro**,
escolha do usuário entre alfabética, mais recente e mais antigo. Dois detalhes
que não são óbvios:

- **Por `createdAt`, não pelo `updatedAt` que é indexado.** Corrigir um typo
  não pode fazer o neurônio saltar para o topo do livro. Como `createdAt` não
  é índice, a ordenação é em JS — mesmo padrão dos campos não indexados das
  Fases 16/17/19, sem bump de versão do Dexie.
- **O id desempata.** Dois neurônios criados no mesmo milissegundo trocariam
  de lugar entre sessões, de novo pela ordem crua do banco — o desempate
  determinístico é a mesma promessa de "a mobília não anda" que o resto do app
  faz.

Ordenar no repositório, e não na tela, faz a ordem valer de uma vez para todo
consumidor (a lista do livro, a busca, a Rede), porque `estadoAtual()` no
Worker monta `neuronios` a partir de `listNeuronios()`. Seguro para o núcleo:
o motor de grafo e o de layout são explicitamente independentes da ordem dos
arrays (Fase 7, com teste cobrindo) — foi por não poder confiar na ordem do
IndexedDB que eles nasceram assim.

Na store, o insert otimista passou a entrar **no topo** da lista, não no fim:
senão o neurônio recém-escrito aparecia embaixo e saltava para o topo quando a
inferência terminasse.

### 3. A busca abria vazia

Com o campo vazio, `/busca` mostrava só uma frase explicativa — a tela com
autofoco, a rota mais rápida do app, não respondia à pergunta mais comum de um
caderno: "o que eu escrevi ultimamente?". Não havia caminho nenhum para isso —
a estante é por assunto, a Rede é por significado, e o livro só mostra o que
está dentro dele.

Agora o estado vazio lista os 8 últimos neurônios escritos, já ordenados pelo
repositório (item 2 acima) — a tela só recorta. A frase explicativa saiu
quando há o que mostrar: o `placeholder` do campo já diz o que se busca ali,
e o projeto já tinha tirado frases desse tipo do formulário de neurônio em
16/09. Num palácio ainda sem neurônio nenhum a frase volta, porque aí não há
lista para pôr no lugar.

`LinhaDeNeuronio` saiu daqui: a mesma linha desenha um resultado e um
recente, e o destino (`/neuronio/:id` ou `/rede?centralizar=` para quem veio
da Rede) passou a ser calculado num lugar só — sem isso, os recentes teriam
que repetir a regra do `?de=rede` por fora.

### O ponto que ficou sem decisão

- **A porta cobra um toque a cada abertura do app.** São 840 ms mais um toque
  deliberado, sempre. No arranque frio ela é útil, porque mascara o
  carregamento (que roda em paralelo — o `useEffect` do `carregar` dispara
  antes do retorno antecipado que mostra a porta); no arranque quente é
  pedágio sobre o gesto mais frequente de uma ferramenta de captura. A decisão
  é se ela aparece sempre ou só na primeira abertura da sessão.

**Não verificado num navegador de verdade nesta sessão** — mesma ressalva de
sempre. O que mais merece um olho no aparelho: se os recentes cabem sem
empurrar o campo de busca para fora da tela em 320 px, e se o Chrome do
Android concede mesmo a persistência (dá para conferir no console com
`navigator.storage.persisted()`). Typecheck, lint e 268 testes automatizados
limpos — 3 novos, todos do repositório: a ordem do mais recente para o mais
antigo, editar não mudando o lugar na lista, e dois neurônios do mesmo
instante não trocando de lugar entre leituras.

## O conteúdo é texto puro, sem convenção de marcação (17/09/2026)

Decisão do usuário, fechando o ponto que a revisão crítica tinha deixado em
aberto: **a convenção de markdown está revogada.** O conteúdo de um neurônio é
texto, e só.

### Por que apagar, e não renderizar

As duas saídas eram legítimas — escrever um parser pequeno na tela de leitura,
ou tirar a convenção do papel. O que decidiu foi um detalhe prático: **a barra
de escrita era o que tornava o markdown plausível.** Ninguém digita `**` na mão
num teclado de Android para deixar uma palavra em negrito, e sem a barra
(removida hoje, a pedido) era exatamente isso que sobraria. Manter no papel um
formato que não tem como ser escrito é carregar dívida por nada — e um parser
meio-feito seria pior que nenhum: negrito renderizado ao lado de `- item`
literal é mais confuso que texto cru inteiro.

### O que isso quer dizer, exatamente

- `conteudo` continua `string`, como sempre foi — **isto nunca foi o problema**
  e nada muda no banco, no embedding, no backup ou no protocolo do Worker.
- **O que você digita é o que você lê.** Nenhum caractere é interpretado,
  escondido ou transformado na exibição. Quebra de linha e parágrafo continuam
  funcionando (`whitespace-pre-wrap`), que é de longe a formatação que uma nota
  curta realmente usa.
- **Uma exceção, e ela é deliberada:** uma URL vira link clicável na tela de
  leitura (ver "URLs dentro do texto viram link"). Não contradiz o que está
  aqui porque ela não interpreta nada — o texto continua à mostra, caractere
  por caractere, exatamente como foi escrito; só ganha toque. Marcação de
  verdade seria o contrário: `**` some da tela e vira um estilo.

### O que não foi feito, de propósito

**Nenhuma migração de dado.** Se algum neurônio foi escrito com a barra
enquanto ela existiu (16 e 17/09), os `**` e `- ` estão gravados ali e
continuam aparecendo como caracteres comuns. Sair reescrevendo o texto da
pessoa para limpar marcadores é pior que deixar: é texto dela, o app não tem
como saber o que era marcação e o que era um asterisco de propósito, e o
estrago seria irreversível.

### Para quem ler isto numa sessão futura

Não trate `conteudo` como markdown, e não "restaure" a convenção por achar
que ela sumiu por engano — ela foi revogada. Se formatação voltar a ser pedida,
é decisão nova, e ela precisa responder de novo a pergunta de 16/09 ("onde a
formatação vive"), sabendo que: uma `<textarea>` não renderiza estilo nenhum
enquanto se escreve, e o caminho de rich text de verdade (`contentEditable`)
foi avaliado duas vezes e recusado duas vezes pelo custo.

Nenhuma linha de código mudou nesta decisão — só o comentário de `links.ts`,
que citava a convenção como parente do que ele faz, e este arquivo. Typecheck,
lint e os 268 testes continuam limpos.

## Duas divergências visuais corrigidas por auditoria (17/09/2026)

Pedido do usuário: revisar o projeto inteiro por Design, Layout, UX e UI e
deixar tudo de forma padrão — sem inventar funcionalidade nova, só corrigir o
que já existe. Levantei o achado lendo o código (`Grep` por `size={}`,
`botao(...)`, `pt-*` em toda tela), não este arquivo, e só toquei no que tinha
divergência real e sem motivo registrado — nada de gosto.

### O botão de busca da estante tinha variante e tamanho fora do padrão

Seis das sete telas que levam para `/busca` usam
`botao({ tipo: 'fantasma', tamanho: 'icone' })` com `Search` de 20px — a
`Estante.tsx` era a única com `tipo: 'secundario'` e 18px. Sobra da Fase 12
("Busca global"): o ícone nasceu **ao lado** dos botões de modo organizar e
ordenar, que precisavam de `secundario` para mostrar o estado ligado com
borda. Os dois saíram em 14/09/2026 ("A estante fica mais simples"), e o botão
de busca ficou sozinho na fileira — mas ninguém devolveu o estilo dele ao
padrão que toda outra tela usa para a mesma ação. Corrigido para `fantasma` +
20px, igual ao resto do app.

### O respiro abaixo da barra de topo variava sem motivo documentado

`pt-3`, `pt-4`, `pt-5` e `pt-6` conviviam nas telas internas, cada uma criada
numa sessão diferente sem comparar com as outras. Só uma divergência tinha
motivo escrito: `pt-4` em `NovoLivro.tsx`/`EditarLivro.tsx`, ajustado em
16/09/2026 para o formulário caber sem rolar em 320px — essa ficou como
estava. As outras três viraram duas, por papel de tela:

- **`pt-5`** nas telas de leitura/navegação: `Ajustes.tsx` e `Busca.tsx` já
  usavam; `Livro.tsx` tinha o mesmo valor, só que aplicado no filho (`<p>`) em
  vez do wrapper `.animar-entrada` — moveu para o wrapper, mesmo padrão de
  código das outras; `Neuronio.tsx` estava em `pt-6`, o único ponto fora
  desse grupo, e desceu para `pt-5`.
- **`pt-4`** nas telas de formulário em tela cheia: `Formulario.tsx` (Novo/
  Editar neurônio) estava em `pt-3` — o menor valor do app, e no filho em vez
  do wrapper —, e é estruturalmente a mesma categoria de tela que
  `NovoLivro.tsx`/`EditarLivro.tsx` (barra de topo com "fechar", formulário
  que preenche a tela). Subiu para `pt-4` e moveu para o wrapper.

Regra que fica valendo: o respiro sob a barra de topo mora sempre no wrapper
`.animar-entrada`, nunca num filho interno — é o que faz a próxima tela nova
começar do padrão certo em vez de inventar um terceiro valor sem querer.

**Fora do escopo, por já ter motivo registrado:** a Estante não tem barra de
topo (decisão da Fase 6) e o respiro de topo dela é 0px no celular por pedido
explícito do usuário (15/09/2026) — não é a mesma categoria de tela e não foi
tocada.

**Não verificado num navegador de verdade nesta sessão** — mesma ressalva de
sempre; a diferença de 4px entre `pt-5` e `pt-6` (Neuronio) e a troca de
variante do botão foram conferidas lendo classe a classe, não vistas lado a
lado numa tela. Typecheck, lint e os 268 testes automatizados continuam
limpos — mudança sem lógica nova, só classes.

## A splash screen também vira preta (17/09/2026)

Pedido do usuário: a cor de fundo da splash screen do PWA (`background_color`
do manifest) muda de Rich Black (`#0d1b2a`) para preto (`#000000`), igual à
barra de status.

**Conflito apontado antes de mexer:** a Fase 6 registra que o fundo do app é
"azul-marinho profundo, não preto — preto puro não tem profundidade", e a
seção "Os ícones do app tinham um fundo cravado" (17/09/2026, mais cedo nesta
sessão) tratou `background_color` e `theme_color` como propositalmente
diferentes — a barra de status virou preta ali, e a splash **ficou** Rich
Black, de propósito. Pedido explícito agora; a regra de ouro não mudou para o
resto do app, só a splash deixou de segui-la, do mesmo jeito que a barra de
status já tinha deixado.

### Os ícones opacos precisaram ser refeitos, não só o manifest

`logo-maskable-512.png` e `apple-touch-icon.png` tinham o fundo achatado em
`#0d1b2a` (a correção de mais cedo hoje) — só trocar `background_color` sem
mexer neles recriaria a mesma costura que aquela correção resolveu: um
quadrado da cor antiga por trás do ícone, agora contra um fundo preto.

Confirmado por pixel que os dois nasceram da mesma arte de `logo-512.png`
(que já é transparente): nas mesmas coordenadas, um pixel totalmente opaco
tem o valor idêntico nos dois arquivos, e só a borda antisserrilhada
(alpha parcial) varia por frações de tom — a assinatura de "mesma arte,
achatada sobre fundo sólido". Refeitos com `sharp().flatten({ background:
'#000000' })` a partir de `logo-512.png`, em vez de recolorir o arquivo
antigo pixel a pixel: `flatten` já faz a mistura alfa correta na borda, sem
o halo que apareceu na primeira tentativa de transparência desta sessão.
Verificado pixel a pixel: canto em `(0,0,0)`, pixel central do ícone idêntico
ao arquivo anterior.

`logo-192.png`/`logo-512.png`/`favicon.png` não precisaram de nada — já são
transparentes desde a correção de mais cedo, e um fundo transparente não tem
costura com nenhuma cor por trás.

### A cor pareada em `capacitor.config.ts` foi junto

`android.backgroundColor` (a cor da WebView nativa, o equivalente do splash
para quando o app virar APK — Fase 9, ainda não compilado) também era
`#0d1b2a`. Atualizado para `#000000` na mesma leva: as três cores (barra de
status, splash do PWA, fundo da WebView nativa) tinham nascido iguais como
Rich Black, e deixar uma murcha para trás criaria uma divergência sem
motivo entre o caminho web e o caminho nativo — o tipo de trilha que a
instrução permanente de não fechar esse caminho pede para evitar, mesmo sem
poder testar num APK real nesta máquina.

**Não verificado num navegador de verdade nesta sessão** — mesma ressalva de
sempre. A splash screen de verdade só se vê reinstalando o PWA num Android; o
que dava para confirmar sem isso (valor do manifest, pixels dos ícones
recompostos) foi conferido. Typecheck, lint e os 268 testes automatizados
continuam limpos — mudança de assets e configuração, sem lógica nova.

## Pastas de acervo: links e imagens presos aos conceitos (24/09/2026)

Pedido do usuário: livros que sirvam de **pasta de links, imagens e vídeos**,
ligados à Rede — sem saber ainda como isso apareceria nela. Explorei as
possibilidades antes de escrever código; o plano tem quatro etapas, uma por
vez, parando para revisão a cada uma.

### O que decidiu o desenho

**O motor só entende texto.** O e5 lê `título + conteúdo`; uma imagem ou um
vídeo sozinho não significa nada para ele. Todo anexo precisa de uma
**legenda** — ou, no nativo, de texto tirado da própria mídia (ver a tabela
abaixo).

**Um anexo não é um neurônio.** Cada conceito mantém no máximo seis vizinhos:
dez vídeos sobre um conceito tomariam todas as vagas dele, e os fios entre
conceitos — o produto — sumiriam. E quase todo fio de um anexo atravessa
livros, então a contagem de pontes viraria ruído.

### Decisões do usuário

| Pergunta               | Escolha                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| Como entra na Rede     | **Satélite**: o anexo escolhe conceitos, o conceito nunca perde vizinho por causa dele     |
| Quando aparece na Rede | Ao aproximar (≥ 2,2×, o mesmo zoom dos nomes) ou ao tocar o conceito dono                  |
| Mídias agora (web)     | **Links + imagens**. Vídeo entra como link; vídeo do aparelho fica para o nativo           |
| Onde o conceito mostra | **Só na Rede e na pasta**. A tela do neurônio continua só texto (decisão de 17/09 mantida) |

Opções recusadas: anexo como nó pleno (o problema das seis vagas, acima) e
anexo fora da Rede com vínculo manual (contraria "as conexões nascem
sozinhas").

**"Combina com a rede ou não" é regra, não botão:** anexo sem legenda, ou cujo
melhor score é 0, fica só na pasta. Diferente do "nunca órfão" dos conceitos
— anexo não ganha fio tracejado forçado.

**Fio de anexo nunca é ponte.** Não entra na contagem, não usa a cor de ponte.
"Ponte significa uma coisa só" continua valendo: o achado entre conceitos.

### Etapa 1 de 4: o núcleo

- `Anexo`, `MidiaDoAnexo` e `Vinculo` em `core/domain/types.ts`. `Vinculo` tem
  direção (`anexoId::conceitoId`), sem a ordem canônica de `conexaoId` — é
  sempre o anexo que escolhe.
- `ancorarAnexos` (`core/motor/anexos.ts`): a mesma régua das conexões —
  cosseno centralizado no perfil congelado, `escalaEmbedding` na escala do
  corpus, corte `razaoCorte × melhor` —, mas **só num sentido**, com teto
  `OpcoesMotor.maxAncoras` (3) e **sem mínimo**. Sem reranker: legenda é texto
  curto, e o reranker está fora do MVP de qualquer jeito. Não existe
  `marcasPerdidas`: nenhum conceito fica sabendo, então o grafo de conceitos é
  idêntico com ou sem anexo.
- `Livro.tipo` (`'conceitos' | 'acervo'`) ficou para a Etapa 2, junto da
  migração do Dexie: entrar agora quebraria todo lugar que monta um `Livro`
  antes de o banco saber dele.

9 testes novos (277 no total): sem conceito e sem vetor não há vínculo; anexo
indistinto (igual ao centroide) fica só na pasta; escolhe os conceitos do
próprio assunto; teto e corte relativo; um anexo não mexe no que o outro
escolhe; independe da ordem de entrada; não muta as entradas. Typecheck e lint
limpos.

### Etapa 2 de 4: dados e motor

- **`Livro.tipo`** (`'conceitos' | 'acervo'`), escolhido ao criar e nunca
  trocado — `EditarLivroInput` não tem o campo. O Worker recusa neurônio em
  pasta e anexo fora de pasta.
- **Dexie v10:** `anexos`, `arquivos` (os bytes à parte: listar anexos nunca
  arrasta imagem, e `EstadoDoPalacio` nunca carrega um byte) e `vinculos`. O
  upgrade dá `tipo: 'conceitos'` a todo livro que já existia.
- **Bytes são `Uint8Array`, não `Blob`** — pelo mesmo motivo do
  `Float32Array` do embedding: vira BLOB no SQLite e `ByteArray` no nativo. A
  tela pede os bytes à parte (`lerImagem(id, 'miniatura' | 'inteira')`).
- **Link só `http`/`https`** (`urlDeLink` em `schemas.ts`): o endereço vira
  link tocável, e `javascript:` num link é porta aberta.
- **A imagem é reduzida no Worker** (`services/midia/imagem.ts`:
  `createImageBitmap` + `OffscreenCanvas` → WebP; 1600 px e miniatura de 320 px).
  Reescrever os pixels também tira os metadados da câmera, GPS incluído.
- **Quando reancora:** criar/editar um anexo ancora só ele; toda escrita de
  conceito (`escrever`, `reprocessarTudo` e, por ele, apagar neurônio ou livro
  de conceitos) reancora todos. Apagar anexo ou pasta **não reprocessa nada**.
  O anexo é gravado antes da inferência, como o neurônio; `reprocessarTudo`
  também embute anexo com legenda que ficou sem vetor.
- **Backup:** anexos entram com a imagem em base64; vínculos não entram — são
  recalculados na chegada, como o perfil. Backup de antes entra com todo livro
  de conceitos e nenhum anexo.

**Medido (reancorar tudo, 500 conceitos × 300 anexos, 384 dim, comunidades
sintéticas):** ~67 ms no desktop, com os 900 vínculos na comunidade certa —
menos que o `perfilDoPalacio` que todo reprocessamento já roda (~106 ms no
mesmo palácio). Ficou o caminho simples (ordenar o ranking); um top-3 por
inserção dava ~50 ms e não pagava o código a mais. Pegadinha: o mesmo cálculo
no ambiente jsdom do Vitest levava ~280 ms — mediu-se no ambiente `node`.

32 testes novos (`acervo.test.ts` e `lib/imagem.test.ts`): migração v10, tipo
do livro, anexos do mais recente primeiro, imagem à parte que sobrevive a
regravar a legenda, link `javascript:` recusado, cascatas (anexo, pasta,
conceito, livro de conceitos — nenhuma conexão entre conceitos tocada),
vínculos de outro anexo recusados, backup com imagem e idempotente, backup de
antes das pastas, e a conta da redução. 295 testes no total, typecheck e lint
limpos. **O Worker não tem teste automatizado** (nunca teve); a verificação
dele fica para o navegador, na Etapa 3.

### Etapa 3 de 4: a pasta na estante e as telas

- **Criar:** `/novo-livro` ganhou a escolha "Livro | Pasta de links e
  imagens" no topo (só ao criar — `FormularioDeLivro` recebe `tipo` só de
  `NovoLivro`). O formulário continua cabendo sem rolar em 390×844.
- **Na estante:** a pasta mostra um clipe (`Paperclip`) no lugar do emblema,
  e a altura mede os itens na mesma régua dos neurônios (`montarEstante`
  recebe os anexos). Espiar, ações e apagar falam de "itens"; apagar uma pasta
  avisa que nenhum conceito muda.
- **A pasta aberta** (`features/acervo/Pasta.tsx`, desviada por `Livro.tsx`):
  grade de cartões — **2 colunas também no celular**, divergência do §6
  aprovada no plano: é galeria, e foto em fila única vira uma rolagem de uma
  foto por tela. Cada cartão diz "com Recursão e mais 1" ou "fica só na
  pasta".
- **Rotas:** `/novo-anexo?livro=`, `/anexo/:anexoId` e `/anexo/:anexoId/editar`
  — voltar fecha, como o resto. Na tela do item: a imagem inteira (a caixa já
  nasce na proporção gravada, nada pula quando os bytes chegam) ou o link com
  "Abrir"; a legenda; e "Combina com", levando a cada neurônio. Apagar
  pergunta numa folha na URL (`?apagar=1`), no molde da tela do neurônio.
- **O seletor de imagem** mora em `services/native/midia.ts` (`<input
type="file">` hoje, `@capacitor/camera` depois). A tela nunca recebe bytes
  junto do estado: `useImagemDoAnexo` pede ao motor e devolve o `blob:` ao
  sair.
- **Link do YouTube** ganha a miniatura (`i.ytimg.com`, só com rede; offline
  ou quebrada, fica o glifo com o domínio). Link sem miniatura não desenha
  caixa vazia na tela do item.
- **O `/novo` e o editar neurônio** só oferecem livros de conceitos, e uma
  sugestão `?livro=` que aponte para uma pasta é ignorada. O Worker recusa
  de qualquer jeito.

**Dois bugs que só o navegador mostrou**, os dois corrigidos com teste:

1. **Palácio nunca lido não ancora nada.** O seed nasce com 9 neurônios sem
   vetor e sem perfil — sem régua, todo anexo dizia "nada se parece". Agora,
   sem perfil e com conceitos, guardar um anexo com legenda **reprocessa
   tudo** primeiro (como o primeiro neurônio já fazia). Por isso criar,
   editar e apagar anexo devolvem o **palácio inteiro** (`EstadoDoPalacio`),
   e não só o acervo: o reprocessamento muda neurônios, conexões e Rede.
2. **Score saturado escolhia pelo id.** Com 9 neurônios a escala do corpus é
   minúscula e quase tudo bate 100%; empatados, "Viés de confirmação" virou
   a segunda âncora de um vídeo de recursão. `ancorarAnexos` passou a
   ordenar e cortar pelo **cosseno antes do teto** — fora da saturação dá o
   mesmo resultado, porque a escala é só um divisor — e `Vinculo.ordem`
   (0 = o mais parecido) grava a posição, porque o score empatado não a
   guarda. Depois disso, o vídeo de recursão se prende só a "Recursão", e o
   diagrama só a "Memória de trabalho".

**Verificado no navegador de verdade:** Chrome headless dirigido por CDP
(driver de ~150 linhas no scratchpad, sem dependência nova). Fluxo completo
no celular (412×892): criar a pasta tocando um lugar vazio, guardar link e
imagem (a imagem pelo seletor de arquivo interceptado), grade, abrir, editar,
apagar, e a pasta ausente da escolha de livro do `/novo`. Estante, pasta,
item, novo item e novo livro em 320×568, 390×844, 768×1024, 1024×768 e
1440×900: **nenhuma rolagem lateral** em nenhuma. Tema claro na pasta e no
item. Nenhum erro no console. 310 testes, typecheck e lint limpos.

### Etapa 4 de 4: os satélites na Rede (01/10/2026)

Feita entre as Atualizações 2 e 3 da série de 30/09, antes de o Mapa mexer na
tela da Rede.

- **Posição calculada a cada pintura, nunca gravada** (`posicaoDoSatelite`,
  `features/rede/layout.ts`): em volta do ponto **desenhado** do conceito de
  ordem 0, num de dois anéis (11 ou 16 px de tela). Ângulo e anel saem da
  `semente` do id do **anexo**, e não da ordem entre irmãos — um item novo na
  pasta não empurra os outros. Por partir do ponto desenhado, acompanha o
  balanço e o arrasto do dono sem código a mais.
- **Quadrado para imagem, losango para link**, com o mesmo tratamento do ponto
  de neurônio e o toque da cor da pasta por cima (escolha do usuário).
- **Quando aparece** (`satelitesVisiveis`): a partir de 2,2× — o mesmo zoom dos
  nomes, agora uma constante só, `ESCALA_QUE_REVELA` —, com o dono tocado, ou
  ele mesmo tocado. "Só as pontes" tira todos.
- **Fios** (escolha do usuário): um curto até o dono, sempre que o satélite
  aparece, na cor dos fios — nunca na de ponte. Até os outros conceitos que ele
  escolheu, só com ele tocado.
- **Tocar** (escolha do usuário): o cartão do pé, como o do neurônio — legenda,
  pasta e "Abrir", que leva à tela do item —, e acendem só ele e os conceitos
  dele. Um satélite ou um neurônio, nunca os dois. O satélite orbita dentro do
  alvo de toque do dono (22 px), então o toque fica com **o mais perto dos
  dois**; satélite não se arrasta, e duplo toque nele não aproxima.
- **A etiqueta do neurônio tocado sobe acima da órbita de fora** quando ele tem
  satélites: visto ampliando a tela, a caixa dela cobria a metade de cima de
  quem orbitava por cima do ponto.

Verificado no navegador de verdade (build de produção, toque por CDP):

- Dois links pelo formulário e uma imagem pelo seletor de arquivo interceptado
  se prenderam pelo motor real. A palestra sobre medo de falar em público foi
  para "Ansiedade antes de apresentar", o artigo de refatoração para
  "Refatoração" e o gráfico do sono para "Sono e memória".
- Com a Rede centrada no dono, tocar no ponto calculado do satélite abre o
  cartão do item, tocar no dono volta ao do neurônio, e "Abrir" leva ao item
  certo.
- "Só as pontes" tira os satélites.

Sem rolagem lateral em 320, 412 e 1440 px, nos dois temas. 349 testes (6
novos), typecheck e lint limpos. Bundle principal: 136,3 KB gzipped.

**Fora daqui:** os satélites são da Rede. Se aparecem no Mapa (Atualizações
3–4) fica para o plano dele; pasta de acervo não vira ilha.

### A pasta tem 8 imagens e 8 links, com um "+" e um contador (07/10/2026)

Pedido do usuário: a pasta passa a comportar **até 8 imagens e 8 links**, organizados no
layout dela, mostrando só um "+" e um contador que desce a cada item guardado — sem mostrar
os oito lugares. Duas leituras minhas, avisadas a ele: "anexos" são os **links** (o outro
tipo de item da pasta), e o contador é o de **quantos ainda cabem**.

- **A regra** (`core/domain/pasta.ts`, pura): `restantesNaPasta(anexos, livroId)` devolve
  quantas imagens e quantos links ainda cabem, cada tipo na sua conta. O **Worker recusa** o
  nono item de um tipo (`criarAnexo`, com a frase `pastaCheia`); a tela só mostra o "+"
  enquanto cabe, mas quem garante é o motor. Pasta que **já passava** do limite não perde
  nada: conta 0 restantes e deixa de aceitar aquele tipo.
- **O layout:** duas seções. **Imagens** em grade de 2 colunas (3 e 4 a partir de 768 e 1024
  px, como era); **Links** em lista, uma linha por link (rosto pequeno só com o ícone — o
  domínio já está no texto ao lado —, legenda e com que conceito combinou). Cada seção
  termina com **um só "+"** dentro de uma caixa tracejada, com o número de quantos ainda
  cabem (8, 7, 6…); com 0 o "+" some. O "N itens" e o botão "Adicionar" do alto, e o cartão
  de pasta vazia, saíram: o "+" de cada seção os substitui.
- **O "+" leva ao formulário já no tipo certo** (`/novo-anexo?livro=&tipo=imagem|link`). No
  formulário, o tipo que encheu a pasta fica desabilitado.
- **Verificado** no Chrome (build de produção): pasta com 3 imagens e 5 links mostra "5" e
  "3"; guardar um link pelo "+" levou o contador de 3 para 2 sem mexer no das imagens; com 7
  links, guardar o oitavo fez o "+" sumir; com a pasta cheia o formulário desabilita os dois
  tipos e o motor recusa o nono com "A pasta já tem 8 links.". 549 testes.

### Segurar um item da pasta: trocar ou excluir (07/10/2026)

Pedido do usuário: segurar um link ou uma imagem da pasta deixa trocá-lo por outro no lugar
dele, ou excluí-lo. Leitura minha: **trocar** é pôr outro do mesmo tipo, no mesmo item
(imagem por imagem, link por link — as seções de 8 continuam valendo).

- **O gesto.** `hooks/useSegurar.ts`: segurar 380 ms (a mesma medida do dial e do livro) ou o
  botão direito chama o gesto; andar mais de 8 px ou o `pointercancel` de uma rolagem o
  cancela, e o clique do fim de um segurar é engolido. Tocar continua abrindo o item.
- **O menu** (`AcoesDoItem`, uma `Folha` que mora na URL: `?item=<id>`, e `?apagar=<id>` para a
  pergunta — voltar fecha, e do menu para a pergunta a troca é `replace`): "Trocar a imagem" /
  "Trocar o link" e "Excluir". Cabe inteiro, sem rolar.
- **Trocar** leva à tela de editar o item (`replace`: voltar cai na pasta). O link já tinha o
  endereço editável; a **imagem passou a poder ser trocada** ("Trocar imagem" na edição). O
  motor (`editarAnexo`, `EditarAnexoInput.imagem`) reduz a nova e grava no lugar da antiga: mesmo
  id, mesma legenda, mesma data, mesmos vínculos (eles saem da legenda, não dos pixels). O
  cache da tela (`useImagemDoAnexo`) passou a incluir o `updatedAt` na chave, senão seguiria
  mostrando a imagem antiga.
- **Excluir** pergunta ("Excluir este link/esta imagem?"), apaga o item e os bytes, não mexe
  em conceito nenhum, e o "+" da seção ganha o lugar de volta (7 → 8 no teste).
- **Verificado** no Chrome (build de produção, mouse): tocar abre o item e segurar abre o menu
  sem abri-lo; trocar a imagem (40×20 para 20×40) manteve o item e a legenda; trocar o link
  pelo endereço; botão direito; cancelar não apaga; confirmar exclui link e imagem (e os
  bytes); o contador do "+" sobe. 564 testes. **Não verificado em toque real:** segurar com o
  dedo e rolar a lista (o cancelamento por `pointercancel` está coberto só por teste).
- **Fora daqui:** reordenar os itens de uma seção (não há ordem escolhida: é a mais recente
  primeiro) e trocar o tipo (de imagem para link).

### Web agora, nativo depois

| Capacidade                         | Web (PWA)                                                          | Nativo (Capacitor)                                |
| ---------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------- |
| Link com legenda                   | ✅                                                                 | ✅                                                |
| Imagem da galeria ou câmera        | ✅ `input file`, Blob no IndexedDB                                 | ✅ `@capacitor/camera`, arquivo no Filesystem     |
| Título automático de qualquer link | ❌ CORS; só provedores com oEmbed aberto, a testar                 | ✅ `CapacitorHttp` lendo o OpenGraph ao salvar    |
| Miniatura de link guardada offline | ⚠️ depende de o servidor liberar CORS                              | ✅ baixa pelo nativo, grava no Filesystem         |
| Vídeo do aparelho                  | ⚠️ só copiando (50–150 MB cada); sem referência durável ao arquivo | ✅ referência ao arquivo da galeria (plugin)      |
| "Compartilhar → Palácio"           | ✅ Web Share Target, só no PWA instalado (precisa do SW)           | ✅ intent-filter + plugin (o APK não tem SW)      |
| Entender imagem **sem legenda**    | ❌ 100–300 MB de modelo, fora do espaço do e5                      | ✅ ML Kit no aparelho (rótulos, OCR) → texto → e5 |

Cada linha do nativo é **um adapter novo**: o seletor mora em
`services/native/`, os bytes passam pela porta do repositório, e o texto tirado
da mídia entra antes do `embutir`. Nem o núcleo nem a UI mudam.

Sugestões registradas, não incluídas: Web Share Target no PWA, anexos na busca
global, título automático via oEmbed do YouTube.

## Atualizações aprovadas (30/09/2026)

O usuário trouxe um documento com seis atualizações já discutidas, a fazer uma
por vez, cada uma começando por um plano aprovado e terminando num relatório:
**1. Busca**, 2. Porto, 3–4. Modo Mapa na Rede, 5–6. Ideias executáveis. O
documento não está no repositório; as decisões que saem dele ficam aqui.

Decisões da Etapa 0 (respostas dele), que valem para a série toda:

| Ponto                   | Decisão                                                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Cores no Mapa e na Rede | Ponte agrupada em `--ponte` (o azul de sempre), trilha em `--rede-fio` fina e tracejada, anel das ideias feitas em `--ouro-gravado` |
| Livro executável        | `Livro.tipo` não muda (`conceitos \| acervo`); entram `executavel: boolean` e `diasParaAdormecer`, só em livro de conceitos         |
| Termo na interface      | Continua "neurônio", não "ideia"                                                                                                    |
| Porto                   | Pelo "+", o livro começa em "Automático"; escolha explícita (chip ou "Novo neurônio neste livro") é respeitada                      |
| Satélites de anexo      | Passo próprio entre a Atualização 2 e a 3, antes de o Mapa mexer na Rede; pasta de acervo não vira ilha                             |

### Busca por sentido (Atualização 1)

`/busca` ganhou dois modos, num seletor de chips como o "Livro | Pasta":

- **Por sentido** — para quem nunca escolheu. A frase passa pelo mesmo modelo,
  com o mesmo `query:` e o mesmo truncamento dos neurônios, e voltam até 20
  neurônios. Livros e anexos não entram nesse modo.
- **Palavra exata** — a busca que já existia, sem mudança: pedaço de palavra
  (escolha do usuário — "prat" acha "prática" enquanto se digita), sem acento e
  sem caixa, no título e no conteúdo **inteiros**. É a que garante achar um
  trecho do fim de um texto longo: o modelo só lê os primeiros 2500 caracteres.

**A tela abre no último modo escolhido** (pedido do usuário, depois de testar —
a primeira versão abria sempre em "Por sentido"). Fica em
`meta.preferencias.modoDaBusca`, junto da quantidade de prateleiras e da luz:
preferência local, fora do backup pelo mesmo motivo das outras duas. A store
troca na hora e grava por trás; se gravar falhar, a busca continua no modo
tocado e o aviso diz que não ficou lembrado.

**As preferências deixaram de apagar umas às outras.** Cada escrita copiava os
campos irmãos à mão — o gotcha da Fase 17 —, e um terceiro campo exigiria
lembrar de copiá-lo em três lugares (prateleiras, luz e a fusão do import).
`preferenciasCom` lê o documento e põe só a mudança por cima; há teste de
prateleiras, luz e import não apagando o modo, e do modo não apagando as duas.
É o mesmo lugar que o modo do Mapa (Atualização 3) vai usar.

**Onde mora:** `buscarPorSentido` em `core/motor/busca.ts`, puro, rodando no
Worker; a porta devolve só ids, e a tela monta as linhas com o que já tem
(`resultadosPorSentido`). A store não guarda a resposta, como `lerImagem`.
`useBuscaPorSentido` espera 300 ms depois da última tecla e descarta a resposta
de uma consulta já substituída; enquanto a nova não volta, a lista anterior
fica, mais apagada, em vez de piscar.

**Palácio nunca lido não busca.** Sem perfil não há régua, e carregar o modelo
só para uma busca baixaria 129 MB — devolve vazio sem tocar no modelo.

**Uma inferência por vez.** O Worker atende mensagens em paralelo, e uma busca
pode chegar enquanto um neurônio está sendo lido. O adapter de embedding passou
a enfileirar as chamadas: duas inferências simultâneas na mesma sessão ONNX
não são seguras.

#### O mínimo: destaque sobre o fundo, não um cosseno fixo

Calibrado com o e5 de verdade, rodando no Node (o `onnxruntime-node` vem com o
transformers.js) sobre o seed mais 24 notas escritas para isso, e 25 consultas
— cinco delas sem resposta nenhuma no palácio.

- **Cosseno fixo não separa nada.** "Previsão do tempo para amanhã", sem
  resposta, teve o primeiro colocado mais parecido (0,13) que "função que chama
  a si mesma" com a Recursão (0,10). Frase curta tem um fundo próprio, que o
  centroide do palácio não tira.
- **O que separa é o resultado se destacar do resto.** Por consulta, mede-se a
  média e o desvio do cosseno centralizado sobre os **80% menos parecidos** (o
  fundo), e entra quem fica **3,5 desvios** acima. Com o palácio inteiro como
  régua, um assunto que ocupa uma fatia grande dele inflaria a régua e deixaria
  de se destacar — com 2 de 10 batendo, nenhum passava de 2 desvios (há teste).
- 3,5 é onde as cinco consultas sem resposta pararam de devolver qualquer
  coisa, no seed (9) e nas 33 notas, mantendo o primeiro colocado de quase toda
  consulta com resposta. Abaixo de 5 neurônios não há fundo para medir: vale ter
  cosseno centralizado positivo.

#### O limite do modelo: "recomeçar"

O critério do documento — "aquele texto sobre recomeçar" achar textos de
recomeço sem a palavra — **não passa**, e não é o mínimo: é o e5-small. Para ele
"recomeçar" é "repetir", e o primeiro colocado é sempre Prática deliberada
("repetir de propósito… tocar de novo") ou Recursão; as notas de recomeço caem
entre as últimas de 33. Frases descritivas funcionam: "virar a página e começar
outra fase" acha "Nova fase" em primeiro, "reconstruir a vida do zero" acha
"Mudar de cidade", "mudar de curso na faculdade" acha "Começar outra faculdade".

Medido e **não** feito: gravar os neurônios com o prefixo `passage:` (o uso
assimétrico que o e5 recomenda) subiu o MRR das consultas de 0,68 para 0,79 —
mas exige recalcular todo embedding gravado, muda o grafo de conexões, e o
documento pede a convenção que já existe.

Outro efeito visto no navegador: um texto muito diferente do resto do palácio
(um diário de viagem comprido) atrai consultas sem resposta — "receita de bolo
de cenoura" devolveu só ele.

**Verificado no navegador de verdade** (Chrome headless pelo CDP, build de
produção): o modelo processa o palácio dentro do Chrome, a primeira busca
responde em ~1,5 s (modelo saindo do cache) e as seguintes em ~300 ms (a espera
da digitação mais ~10 ms de inferência); tocar no resultado abre o neurônio;
sem rolagem lateral em 320, 768, 1024 e 1440 px; os dois temas. **Offline de
verdade**: servidor desligado e rede cortada, a tela abre pelo service worker e
as mesmas buscas dão o mesmo resultado. 322 testes (12 novos; 328 com o modo lembrado), typecheck e lint
limpos. Bundle principal: 133,7 KB gzipped.

### O Porto (Atualização 2)

> **Revisto em 07/10/2026 (pedido do usuário):** em "Automático" o neurônio **nunca mais
> fica no porto por falta de resposta clara** — o motor escolhe sempre um livro pelo que
> está escrito. O porto só recebe quem nasce quando **não existe nenhum livro** que possa
> recebê-lo (de conceitos e não executável). A regra de 3 votos mínimos saiu; ver
> "O automático sempre escolhe um livro" abaixo. O resto desta seção é o histórico.

Pelo "+", o livro de um neurônio novo começa em **"Automático"**: o motor lê o
texto, calcula as conexões como sempre e guarda no livro que os mais parecidos
apontam. ~~Sem resposta clara, o neurônio fica **no porto** (`livroId = null`) e a
pessoa escolhe.~~ Livro escolhido à mão — no chip, ou vindo de "Novo neurônio
neste livro" — não passa pelo Porto, e editar também não.

#### O automático sempre escolhe um livro (07/10/2026)

`livroAutomatico` (`core/motor/porto.ts`, puro, no lugar de `livroDoPorto`) devolve **sempre
um livro**, e `null` só sem livro disponível. Os mesmos 5 vizinhos votam, mas:

- **Votam só os neurônios que moram num livro disponível** (de conceitos, não executável).
  Antes, quem estava num executável ou no porto votava e não vencia, e a pergunta era da
  pessoa; agora o texto vai para o livro disponível que mais se parece com ele.
- **Vence o livro com mais votos, sem mínimo.** Empate: a maior soma de cossenos (o mais
  perto do texto), depois a ordem da estante. Num palácio com poucos neurônios o mais
  parecido já decide.
- **Sem vizinho nenhum para votar** (o primeiro neurônio, ou texto sem vetor): o primeiro
  livro disponível, na ordem da estante.
- **A tela não mudou:** o aviso "Guardado em X." com "Mudar" já era o caminho de quem o motor
  decidia. A pergunta "Onde guardar?" só abre agora quando não há livro nenhum que receba.
- **Custo assumido:** o que antes caía no porto por ser ambíguo agora vai para o palpite mais
  provável, e erra de vez em quando — o "Mudar" é a saída. Visto no navegador (e5 de verdade,
  palácio de exemplo): cache → Programação e ensaio no violão → Música, certos; "ansiedade ao
  apresentar" → Música, em vez de Psicologia (parece com prática de palco); um texto sem
  relação nenhuma (receita de bolo) foi para Música em vez do porto. **Precisão não medida de
  novo** com as 33 notas da calibração de 01/10 — só a regra mudou, não o modelo.

#### A regra: voto dos 5 mais parecidos, não a soma das conexões fortes

O documento pedia "o livro com a maior soma de conexões fortes". Calibrado com o
e5 de verdade, deixando cada uma das 33 notas de fora por vez, **essa regra
errava muito**: neste palácio as conexões mais fortes atravessam livros de
propósito — são as pontes, o achado. No seed ela mandaria 7 de 9 neurônios para
o livro errado com qualquer limiar; nas 33 notas, o melhor equilíbrio acertava
cerca de 60% do que decidia sozinha. Exigir que o livro vencedor concentrasse as
fortes não ajudou: o problema é as fortes apontarem para outro livro, não se
dividirem.

**Escolha do usuário: o voto** (`livroDoPorto`, `core/motor/porto.ts`). Votam os
5 neurônios mais parecidos pelo cosseno centralizado no perfil congelado; 3 do
mesmo livro levam o neurônio. Nas 33 notas, decidiu 17 sozinho com 4 erros; no
seed, perguntou sempre e não errou nenhum. Livro excluído (os executáveis, na
Atualização 5) e neurônio no porto votam, mas não vencem — aí a pessoa escolhe.

**O `LIMIAR_FORTE` não nasceu aqui.** O documento o queria num lugar só, para o
Porto e para o despertar da Atualização 6; com o voto, o Porto não o usa, e uma
constante sem uso não entra (regra 7 do mestre). Ele nasceu na Atualização 6, com
calibração própria: **0,7** (ver "Ideias executáveis, parte 2").

#### O que muda quando não há livro

- **Ponte é entre dois livros de verdade** (`ehPonte`). As conexões de um
  neurônio no porto não são ponte; viram, ou não, quando ele ganha livro.
- **`guardarNeuronio`** põe o neurônio num livro sem reler o texto: o vetor e as
  conexões ficam, só o `cross` das conexões dele é refeito. É a resposta da
  pergunta, o "Mudar" — e será o "Tornar executável" da Atualização 5.
- Estante, busca, Rede, anexos e fios tratam "sem livro": "No porto" no lugar do
  nome, anel vazio no lugar da cor, nenhum toque de cor de livro na Rede, e o
  foco num livro apaga quem está no porto.
- **Banco:** nenhuma versão nova. O índice `livroId` não muda (o IndexedDB só
  deixa de fora do índice quem tem `null`), e nenhum dado antigo precisa de
  reescrita. O backup leva `livroId: null`, e no import um neurônio no porto não
  conta como órfão; backup antigo importa igual.

#### A pergunta e onde os pendentes aparecem (escolhas do usuário)

- **Colocou sozinho:** o aviso diz "Guardado em Programação." com **"Mudar"**. O
  aviso ganhou um botão — um link para `?guardar=<id>` na tela atual, e não uma
  função, porque o aviso mora no casco e sobrevive à tela que o pediu. Com botão
  ele dura 6 s.
- **Não soube:** a pergunta "Onde guardar?" abre na própria tela de escrever, por
  cima do texto. Escolher guarda e segue para a Rede; fechar segue para a Rede
  com "Ficou no porto."; o voltar do Android sai da tela de escrever inteira (a
  pergunta tomou o lugar dela no histórico, porque o neurônio já existe) e o
  aviso aparece onde cair.
- **"Criar livro novo"** abre a tela de livro que já existia, sem a escolha de
  pasta, com o livro no primeiro lugar livre da estante
  (`primeiroLugarDaEstante`). O parâmetro ali é `?neuronio=`, e não `?guardar=`:
  visto no navegador, `?guardar=` abria a própria pergunta por cima do
  formulário de livro.
- **Pendentes:** "N no porto" na fileira de baixo da estante, só quando há algum;
  `/porto` lista com "Guardar em…"; a tela do neurônio mostra "No porto" no lugar
  do livro, com o mesmo "Guardar em…".
- Fora da tela de escrever, a pergunta é uma só para o app inteiro
  (`GuardarNoPorto`, no casco, aberta por `?guardar=`). A lista de livros é a
  mesma da escolha do formulário (`EscolhaDeLivro`).

**Verificado no navegador de verdade** (build de produção, toque por CDP, palácio
de 35 notas com os vetores do e5):

- "Automático" com texto de programação foi sozinho para Programação, e o
  "Mudar" levou a Leituras com as pontes refeitas.
- Texto sem livro óbvio abriu a pergunta. Fechar deixou no porto com o aviso, e
  ele apareceu na estante e em `/porto`.
- A tela do neurônio guardou pelo "Guardar em…", e "Criar livro novo" criou o
  livro e guardou dentro.
- Livro escolhido à mão não passou pelo Porto.
- O voltar do Android com a pergunta aberta deixou no porto.

Em todos, o `cross` gravado bate com o livro dos dois lados. Sem rolagem lateral
em 320, 768, 1024 e 1440 px, nos dois temas, sem erro no console. 343 testes (15
novos), typecheck e lint limpos. Bundle principal: 135,3 KB gzipped.

**Visto e não resolvido:** na Rede, o aviso com "Mudar" ocupa a mesma altura do
cartão do neurônio selecionado e o cobre pelos 6 s em que aparece; tocar no
aviso o dispensa.

### O Mapa, parte 1 (Atualização 3)

**Da Atualização 3 em diante, o usuário mandou seguir as minhas recomendações
sem esperar aprovação do plano.** O que precisar mudar, ele muda quando as seis
estiverem prontas e puderem ser testadas juntas. Por isso as decisões abaixo
são minhas, e cada uma diz o motivo, para ser fácil de reverter.

A tela `/rede` ganhou um segundo jeito de ver o palácio: **Rede | Mapa**, dois
chips no alto ("Como ver o palácio"). A Rede é por significado e se rearruma
quando o grafo muda. O Mapa é por **livro**, e é memória: cada livro é uma
ilha, e o lugar de cada coisa nela não muda sozinho.

- **A tela abre no último modo escolhido**, como a busca:
  `meta.preferencias.modoDaRede`, padrão Rede, fora do backup.
- **Uma ilha por livro de conceitos com pelo menos um neurônio.** Não viram
  ilha a pasta de acervo, o livro vazio (a ilha aparece com o primeiro
  neurônio) nem o porto (sem livro, sem ilha). Os satélites de anexo ficam só
  na Rede.
- **O raio cresce com a raiz do tamanho do livro:** `max(70, 34·√n)`.
- ~~A costa é orgânica e sempre a mesma.~~ **Desde 02/10/2026 a ilha é um
  círculo perfeito** (pedido do usuário): a costa é o raio, e os pontos moram
  até 16 de margem dele. Ver "O Mapa vira carta náutica".
- **Dentro da ilha, o lugar é o sentido.** Os vetores do livro são
  centralizados no perfil e reduzidos para 2D por PCA (iteração de potência,
  com partida e sinal fixos, para ser determinístico). Depois são espalhados
  até ficarem a 22 um do outro. Com menos de 5 neurônios a redução é instável,
  e vale a espiral de girassol por ordem de id. Quem ainda não tem vetor entra
  pela espiral também.
- **Entre as ilhas, livros parecidos ficam perto.** As ilhas se dispõem por
  força: o centro de cada livro puxa os parecidos, e todas se afastam até ter
  46 de mar entre elas.

#### Crescer sem remexer

O mapa é gravado, e cada escrita só **encaixa** o que mudou
(`atualizarMapa`, no núcleo, rodando no Worker). Há teste de cada caso.

| O que aconteceu                    | O que anda                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| Neurônio novo num livro com ilha   | só ele: entra perto dos 3 mais parecidos dali, num vão                        |
| Primeiro neurônio de um livro      | a ilha nova, a um mar de distância da mais parecida, no primeiro ângulo livre |
| Ilha cresceu e encostou noutra     | **só ela**, o mínimo para fora                                                |
| Neurônio apagado ou mudou de livro | sai de onde estava; na outra ilha, entra como novo                            |
| Livro esvaziado ou apagado         | a ilha some                                                                   |

**A ilha que cresce quase nunca encosta**, e isso foi de propósito. A primeira
versão dispunha as ilhas justas: qualquer neurônio novo fazia a ilha crescer e
andar, e o teste "um neurônio novo não mexe em mais ninguém" falhava. Agora a
disposição reserva **25% de crescimento** em cada raio (`RESERVA_DE_CRESCIMENTO`).
A ilha só anda quando encosta de verdade, e vai para um lugar onde a reserva
caiba de novo.

**Só "Reorganizar mapa" redesenha tudo do zero**, porque desfaz a memória espacial de
uma vez. É a saída para um palácio que cresceu torto. ~~Fica em Ajustes, numa seção
"Mapa", com confirmação.~~ **A seção saiu de Ajustes em 07/10/2026** (pedido do usuário):
`reorganizarMapa` continua no motor e na store, só não tem mais tela — como o backup.

#### Onde fica gravado, e por que vai no backup

Em `meta`, chave `'mapa'`, sem versão nova do Dexie. Ao abrir, `carregar`
encaixa quem ainda não tem lugar, e é isso que cria o mapa de um palácio de
antes dele: a migração é a própria atualização incremental.

**Vai no backup, ao contrário das posições da Rede.** A Rede é derivada do
grafo e se rearruma de qualquer jeito. O mapa é a memória de onde as coisas
ficam, e um backup restaurado deve devolver a mesma geografia. No import as
ilhas do arquivo vencem (`fundirMapas`). Uma ilha que só existe no aparelho
fica onde está se não encostar em nenhuma do arquivo; se encostar, sai, e a
próxima atualização a encaixa de novo. Backup de antes do mapa importa sem ele.

#### A tela

- `features/mapa/`: `TelaDoMapa` (o canvas), `desenharMapa` (a pintura) e
  `ilha.ts` (costa, lugares no mundo e toque, puro e testado).
- **A pintura:** a sala é o mar, a parede é a terra, e cada ilha leva um toque
  da cor do livro, o mesmo toque que pinta os pontos da Rede. Os pontos ficam
  do mesmo tamanho na tela em qualquer zoom. O nome do livro e a contagem ficam
  acima da ilha, em pixels de tela.
- **O nome da ilha some quando o centro dela sai da tela pelos lados.** Ele é
  empurrado para dentro da tela para não ser cortado, e com a ilha lá fora
  ficaria flutuando sobre o mar, longe dela. O enquadramento reserva 40 px a
  mais no alto (`ALTURA_DO_NOME_DA_ILHA`), senão o nome da ilha de cima caía
  por cima da contagem.
- **Visto na parte 1, tratado na parte 2:** em 320 px, com o mapa inteiro
  enquadrado, o nome de uma ilha pode encostar na ilha vizinha. O nome tem
  tamanho fixo na tela, e as ilhas encolhem com o zoom. Desde a parte 2 os
  nomes não se sobrepõem entre si e ganharam um contorno da cor do mar, que os
  mantém legíveis por cima de terra e de ponte.
- **Toque:** tocar seleciona, com o mesmo cartão da Rede, e tocar no mar tira a
  seleção. O duplo toque foca o neurônio, ou aproxima no mar. Pinça, roda do
  mouse e deslize funcionam como na Rede. (A parte 2 acrescentou tocar na ilha
  e na ponte.)
- ~~Sem arrastar ponto: o lugar é do núcleo.~~ **Desde 02/10/2026 a pessoa
  move ilhas e neurônios** — ver "O Mapa vira carta náutica". Sozinho, o mapa
  continua sem andar.
- **Sem laço de animação e sem balanço:** a tela pinta quando algo muda, e só.
- **A seleção sobrevive à troca de modo**, e a câmera vai até ela.
  `?centralizar=` (a busca) e o neurônio recém-criado funcionam nos dois modos:
  `TelaDoMapa` cumpre o mesmo `ControleDaTela` da Rede.
- Os filtros (foco num livro, só as pontes) são da Rede e não valem no Mapa. A
  contagem diz "N ilhas · M neurônios".
- As conexões, os níveis de zoom, o porto e a legenda vieram na parte 2,
  abaixo.

**A câmera virou um hook** (`features/rede/useCamera.ts`). Pan, pinça, roda,
deslize e toque/duplo toque saíram de `Tela.tsx`, que encolheu de 810 para 586
linhas, e as duas telas usam o mesmo código. A Rede pluga o arrasto de neurônio
por ganchos (`aoDescer` / `aoArrastarTomado` / `aoSoltarTomado`).
`features/rede/canvas.ts` reúne `lerCor` e o repintar ao mudar de tamanho ou de
tema.

**Verificado no navegador de verdade** (build de produção, toque por CDP,
palácio de 35 notas com os vetores do e5):

- O mapa foi criado ao abrir (migração), com 7 ilhas, e a primeira visita
  abriu na Rede.
- Os gestos da Rede depois do hook, um por um: centralizar, tocar e tirar,
  arrastar neurônio (posição gravada), pan, deslize e pinça.
- No Mapa:
  - a seleção continuou ao trocar de modo;
  - tocar o mar tirou a seleção, e tocar o ponto selecionou;
  - reabrir o app voltou no Mapa, com o mapa gravado idêntico e a tela igual
    pixel a pixel.
- Um neurônio novo entrou na ilha de Psicologia sem mover mais nada (0
  coordenadas mudaram) e apareceu tocado.
- "Reorganizar mapa" pediu confirmação, avisou e redesenhou.

Sem rolagem lateral em 320, 412, 768, 1024 e 1440 px, nos dois temas; a roda do
mouse aproxima no desktop; nenhum erro no console. 376 testes (novos: 17 do
núcleo do mapa, 5 de `ilha.ts` e 5 do repositório — modo e mapa, backup
incluído), typecheck e lint limpos. Bundle principal: 139,0 KB gzipped.

### O Mapa, parte 2 (Atualização 4)

As conexões entram no Mapa sem virar novelo: três distâncias, cada uma
mostrando só o que se lê dali. Tudo isto existe **só no modo Mapa** — a Rede
continua igual, e isso foi conferido no navegador. Decisões minhas, pela regra
da série.

#### As três distâncias

| Distância                                     | O que aparece                                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **De longe** (zoom abaixo de 0,9)             | ilhas, nomes de livro e as pontes mais fortes de cada ilha; pontos e trilhas escondidos           |
| **Perto de uma ilha** (0,9 ou mais)           | os pontos, as trilhas, os nomes dos neurônios que cabem e **todas** as pontes                     |
| **Com um neurônio tocado** (em qualquer zoom) | o resto esmaece debaixo de um véu; por cima, as conexões dele uma por uma, os vizinhos e os nomes |

- **O limiar é um número só** (`ESCALA_DE_PERTO`, 0,9), não relativo ao
  palácio: os pontos ficam a 22 do mundo um do outro em qualquer ilha, e a 0,9
  eles já estão a uns 20 px na tela. Pontos e trilhas aparecem aos poucos entre
  0,65 e 0,9 (`presencaDePerto`), sem pular de uma vez.
- **De longe, cada ilha mostra as 3 pontes mais fortes dela** (`pontesAMostra`).
  Uma ponte aparece se é das mais fortes de **qualquer um** dos dois lados —
  senão uma ilha pequena, cuja única ponte vai para um livro cheio delas,
  ficaria sem nenhuma. Força: mais conexões, depois maior soma de scores.
- **O neurônio tocado vale em qualquer zoom.** De longe, os vizinhos dele
  aparecem como pontos acesos mesmo com os outros escondidos, e dá para tocá-los.

#### Trilha e ponte

- **Trilha:** as conexões de dentro do livro, finas (menos de 1 px) e tracejadas
  em `--rede-fio`. Nunca na cor de ponte.
- **Ponte agrupada:** uma por par de livros (`agruparPontes`), cheia, em
  `--ponte` — o azul que cumpre o "dourado" do documento desde 15/09 (decisão da
  Etapa 0). A espessura cresce com a quantidade, de 1,5 px até o teto de 7 px:
  trilha e ponte se distinguem também pela espessura e pelo tracejado.
- **A ponte vai de centro a centro, por baixo das ilhas.** A terra cobre o pedaço
  de dentro, e o que se vê sai exatamente pela praia, sem calcular a costa — e
  some debaixo de qualquer ilha que esteja no caminho.
- **Com um neurônio tocado**, cada conexão dele é desenhada até o vizinho:
  tracejada como trilha dentro do livro, cheia como ponte para os outros, e
  tracejada fina quando o score é zero, como em todo o app.

#### Toque

A ordem decide quem fica com o toque: **ponto, terra, ponte, mar.**

- **Ponto:** só o que se vê. De perto, todos; de longe, só os da vizinhança
  acesa. Seleciona, e o duplo toque foca.
- **Terra:** de longe, **aproxima da ilha** — enquadra com 30% de mar em volta,
  e nunca a menos que 0,9, para chegar onde os pontos aparecem. De perto, tirar
  a seleção (o duplo toque aproxima no dedo, como no mar). Aproximar só de longe
  é de propósito: de perto, um toque que errasse o ponto por pouco faria a
  câmera pular.
- **Ponte:** só as que aparecem, com 14 px de tolerância. Como ela passa por
  baixo da terra, o toque na terra já ficou com a ilha: o que chega aqui é o
  pedaço no mar. Abre a folha da ponte (`?ponte=livroA::livroB`) com os pares de
  neurônios, um de cada livro, do mais parecido para o menos, e cada nome abre o
  neurônio. Voltar devolve a lista.
- **Mar:** tira a seleção.

#### O que mais entrou

- **O cartão do neurônio, no Mapa, traz o começo do texto** (duas linhas). Na
  Rede o cartão continua como era.
- **"Ver todas as pontes" e a legenda moram numa folha** aberta pelo botão que,
  na Rede, abre os filtros (`?filtros=1`, com o conteúdo de cada modo). Na
  fileira do pé, num celular de 320 px, não cabe mais um botão ao lado do de
  criar. É o mesmo lugar do "Só as pontes" da Rede. A folha diz quantas pontes
  ficam escondidas de longe. Não fica gravado, como os filtros.
- **O porto** aparece no pé do Mapa, só quando alguém espera livro: "N no
  porto", e só o número abaixo de 360 px. Leva a `/porto`, o fluxo de sempre.
- **A busca** é a da Atualização 1: a lupa leva a `/busca?de=rede`, e o
  resultado volta ao Mapa centralizado e tocado — é o véu que o destaca.
- **Nomes não se atropelam.** Os de ilha (maior primeiro) e os de neurônio (mais
  conectado primeiro, até 40) ficam de fora quando encostariam num já posto, num
  trecho coberto pela página (`cobertas`: o alto com seletor e contagem, o pé
  com os botões) ou na borda da tela. E todos têm um contorno da cor do mar.

**Puro e testado:** `features/mapa/pontes.ts` (agrupar, as de longe, as
visíveis, espessura, distância ao segmento e toque) e, em `ilha.ts`,
`raioDaCosta`, `ilhaEm` e `presencaDePerto`. **Banco:** nenhuma mudança.

**Verificado no navegador de verdade** (build de produção, toque por CDP,
palácio de 35 notas: 7 ilhas, 17 pontes agrupadas, 5 escondidas de longe):

- A folha mostra a legenda e as 5 escondidas, e "Ver todas" desenha as 5 no
  canvas e volta ao mesmo quadro ao desligar.
- Tocar a ponte Programação–Psicologia no mar abriu os 4 pares; um nome abriu o
  neurônio, e voltar devolveu a lista.
- Tocar a ilha de longe aproximou (0,56 → 1,64) sem selecionar ninguém.
- De perto, o ponto selecionou com o resumo no cartão. Enquadrar manteve a
  seleção, com as conexões até as outras ilhas por cima do véu.
- Um neurônio no porto apareceu como "1 no porto" e levou até ele. Na Rede, nem
  o indicador nem o resumo aparecem.
- A busca por palavra voltou ao Mapa com o resultado tocado.

Sem rolagem lateral e sem o porto encostar no botão de criar em 320, 412, 768,
1024 e 1440 px, nos dois temas; nenhum erro no console. 389 testes (13 novos),
typecheck e lint limpos. Bundle principal: 142,2 KB gzipped.

**Não medido:** um palácio com dezenas de livros. A regra das 3 por ilha limita
cada ilha, mas um palácio de 20 livros ainda pode mostrar umas 30 pontes de
longe — o "limpo" do documento foi visto com 7.

### Ideias executáveis, parte 1 (Atualização 5)

Um livro pode ser de **ideias para fazer** — textos, estudos, vídeos —, cada
uma com um andamento: **para fazer, fazendo, feita**. Sem prazo, sem data, sem
subtarefa e sem etiqueta: o livro não vira gerenciador de tarefas. Decisões
minhas, pela regra da série.

#### O dado

- **`Livro.executavel`, e não um terceiro `tipo`** (decisão da Etapa 0): um
  livro executável continua sendo de conceitos em tudo — conexões, pontes,
  Rede, Mapa. `diasParaAdormecer` (padrão 30, de 0 a 365) vale a partir da
  Atualização 6; 0 existe para testar o adormecer na hora. **Uma pasta de
  acervo nunca é executável** — o schema recusa, o motor força `false`, e o
  import também, mesmo num arquivo mexido à mão.
- **`Neuronio.estado` é `null` em quem nunca entrou num livro executável.**
  - Entrar num (nascer nele, vir de outro livro ou do porto) começa em "para
    fazer".
  - Continuar no mesmo mantém o que tinha.
  - **Sair guarda o estado sem mostrar.** Um livro que deixa de ser executável
    e volta devolve os estados como estavam — verificado.
  - A regra é `estadoAoGuardar` (`core/domain/executavel.ts`, pura e
    testada), usada igual pelo motor e pelo otimismo da store. A tela mostra o
    estado por `estadoVisivel`: só num livro executável, e "para fazer" para
    quem estava no livro antes de ele virar executável.
- **`ultimoToque`** é o relógio do adormecer. A migração usa a última edição.
  Nesta parte ele anda ao nascer, ao entrar num livro executável e ao mudar de
  estado. Abrir, editar, "Acordar" e o despertar por conexão entraram na
  Atualização 6, que é quem os pede.
- **`resultadoLink`** só se grava junto de "feita", e só http/https (a mesma
  régua do link de anexo). Mudar de estado depois não o apaga.
- **Dexie v11**, sem índice novo: todo livro fica de pensamentos com 30 dias, e
  toda ideia fica sem estado e sem link, com o toque na última edição. O
  backup leva os campos novos; backup antigo importa com os mesmos padrões.

#### As entradas, sempre explícitas

- **"Quero executar isso", na captura**, ao lado da etiqueta do livro:
  - com um livro executável, vai para ele;
  - com vários, abre a folha "Em qual livro executável?";
  - com nenhum, a mesma folha **oferece criar um ali mesmo**, com "Ideias
    executáveis" de nome sugerido. Sair para o formulário de livro perderia o
    texto escrito. O livro nasce como qualquer livro novo (pano sugerido,
    tamanho normal) no primeiro lugar livre da estante, e o resto se troca
    depois em "Renomear e editar livro".
  - **O botão não tem estado próprio**: está ligado quando o livro escolhido é
    executável. Escolher um pela etiqueta também o liga, e desligar volta ao
    "Automático".
- **"Tornar executável", na tela de qualquer ideia** que não está num livro
  executável, inclusive no porto: com um, direto e com aviso; com vários ou
  nenhum, a mesma folha. É o `guardarNeuronio` de sempre: as conexões ficam e
  o `cross` é refeito, e no Mapa ela entra na ilha nova perto dos vizinhos.
- **O Porto passa a excluir os executáveis** (a exclusão preparada na
  Atualização 2): eles votam, mas nunca vencem. Verificado com Programação
  executável: um texto de programação que ia sozinho para lá ficou no porto,
  com a pergunta.
- **Escolher à mão continua livre:** a etiqueta do livro, a pergunta do porto e
  o editar mostram os executáveis, marcados com um martelo.

#### As telas

- **Formulário de livro:** "Livro executável" logo abaixo do tipo (só para
  livro, nunca para pasta), e com ele ligado "Adormece com [30] dias parada".
  Cabe sem rolar em 412×892.
- **Livro executável:** seções "Fazendo", "Para fazer" e "Feitas", com a
  contagem; seção vazia não aparece. Cada cartão ganha à esquerda o círculo do
  estado, com alvo de toque próprio.
- **Folha do andamento** (`?estado=<id>` no livro, `?estado=1` na ideia): "Para
  fazer" e "Fazendo" mudam e fecham. "Feita" abre o link do resultado,
  opcional, antes de confirmar; link que não é http/https não passa.
- **Tela da ideia:** o andamento num botão que abre a mesma folha e, feita, o
  "Resultado" abrindo o link. Fora de livro executável, o "Tornar executável".
- **Livros de pensamentos não mudaram** — verificado.
- **O visual da Rede e do Mapa** (névoa, anel das feitas) veio na Atualização 6.

**Puro e testado:** `estadoAoGuardar`, `entraEmExecutavel`, `estadoVisivel` e
`clampDiasParaAdormecer` (8 testes). No repositório:

- migração v11;
- pasta executável recusada;
- link que não é http recusado;
- backup de ida e volta e backup antigo;
- pasta executável num arquivo mexido;
- link inválido num arquivo.

**Verificado no navegador de verdade** (build de produção, toque por CDP,
palácio de 35 notas com os vetores do e5):

- As três situações da captura: nenhum livro executável (criou "Ideias
  executáveis" sem perder o texto), um só, e vários.
- "Tornar executável" com um e com vários, a ponte refeita dos dois lados.
- O formulário gravando executável com 7 dias.
- Os estados mudando pelas seções e o link inválido barrado.
- "Feita" com o link e um toque novo, e o "Resultado" na tela da ideia.
- Executável desligado e religado sem perder estado.
- O Porto evitando um livro executável.
- Recarregar mantendo tudo.

Sem rolagem lateral em 320, 412, 768, 1024 e 1440 px, nos dois temas; nenhum
erro no console. 404 testes (15 novos), typecheck e lint limpos. Bundle
principal: 145,0 KB gzipped.

### Ideias executáveis, parte 2: adormecer e despertar (Atualização 6)

Uma ideia executável parada **adormece** — sem cobrança — e **acorda** quando
volta a ser relevante. Decisões minhas, pela regra da série.

#### Adormecer

- **A regra** (`estaAdormecida`, `core/domain/executavel.ts`, pura e testada):
  livro executável, estado diferente de "feita", e mais de `diasParaAdormecer`
  dias desde o `ultimoToque`.
- **Calculada na hora de mostrar**, sem tarefa em segundo plano e igual sem
  rede. O relógio é o de quando a tela abriu (`useState(() => new Date())`):
  acordar uma ideia a tira da névoa na hora, mesmo num livro de 0 dias, e ela
  só volta a dormir na próxima abertura.
- **0 dias é para testar:** a ideia adormece logo depois de qualquer toque. Com
  1 dia, o que foi tocado hoje continua acordado — verificado.
- **O que é um toque** (`ultimoToque`):
  - criar, entrar num livro executável e mudar o estado (Atualização 5);
  - abrir a tela da ideia (`tocar`, ao montar a tela);
  - editar (o motor, ao gravar uma ideia de livro executável);
  - o "Acordar";
  - o despertar por conexão.
    Fora de livro executável, `tocar` não grava nada.

#### Despertar

- **`LIMIAR_FORTE = 0,7`**, num lugar só (`core/motor/despertar.ts`).
  Calibrado com o e5 de verdade: cada uma das 33 notas de teste entrou como
  "nova" no palácio das outras.
  - De 0,7 para cima todo par é parente de verdade: débito técnico e
    refatoração, reserva de emergência e antifrágil, cache e memória de
    trabalho, o grupo dos recomeços.
  - Entre 0,6 e 0,7 aparecem pares fracos; abaixo, falsos ("Ansiedade antes de
    apresentar" com "Ouvido relativo").
  - Com 0,7, 20 das 33 notas acordariam alguém.
  - O score é relativo à escala do palácio (`escalaEmb`), então o número vale
    para outro tamanho.
- **`quemDesperta`** (puro, testado): toda ideia de livro executável ligada à
  nova por uma conexão forte ganha um toque; as que dormiam voltam como
  "acordadas", da conexão mais forte para a mais fraca.
  - Só uma ideia **nova** desperta alguém, em qualquer livro; editar não.
  - Roda no motor depois de as conexões assentarem, e as acordadas vêm em
    `ResultadoDeEscrita.acordadas`.
- **O aviso** é o flutuante de sempre, na hora de salvar: "Isso acordou
  “Refatoração”." No máximo dois nomes, e o resto vira contagem ("e mais 2",
  `textoDoDespertar`). Quando o Porto também guardou sozinho, os dois vão no
  mesmo aviso, com o "Mudar".

#### O que se vê

- **Tela do livro:** seção "Adormecidas · N", depois das outras, recolhida
  (abre num toque). Cada ideia ali aparece esmaecida, com "Acordar". Mudar o
  estado, ou abrir a ideia, também acorda.
- **Rede:** a adormecida ganha um chumaço de névoa, o ponto perde luz, e os
  fios dela ficam mais fracos. A feita **fica dourada** — o próprio ponto, em
  **ouro gravado**, sem anel em volta (a decisão da Etapa 0 era um anel; trocado em
  02/10/2026 a pedido do usuário). É o ouro das lombadas, nunca o azul da ponte.
- **Mapa:** as adormecidas ficam debaixo de uma área de névoa na ilha, visível
  **de qualquer distância** — de longe ela diz onde há ideia parada sem precisar
  dos pontos. As feitas são pontos dourados. As trilhas das
  adormecidas também ficam mais fracas.
- **A névoa tem token próprio, `--nevoa`**, que sempre clareia: quase branca de
  dia, azul-acinzentada clara à noite. A primeira versão usava `--poeira`, que de
  dia é azul-escuro e virava uma mancha na ilha. A névoa é um sprite desenhado
  uma vez por cor e reaproveitado (`spriteDeNevoa`): a Rede repinta a cada
  quadro com o balanço, e um degradê novo por ideia a cada quadro pesaria numa
  WebView.
- **Sem cobrança:** nenhuma notificação, nenhum contador fora da própria seção
  do livro, nada em vermelho.

**Testes:** `estaAdormecida`, `quemDesperta`, `textoDoDespertar` e
`marcasDoAndamento` (13 novos).

**Verificado no navegador de verdade** (build de produção, toque por CDP,
palácio de 35 notas com os vetores do e5), num livro executável de 0 dias com
"Refatoração" para fazer e "Testes automatizados" feita:

- A adormecida apareceu em "Adormecidas · 1", recolhida, e a feita ficou em
  "Feitas".
- "Acordar" gravou o toque e devolveu a ideia a "Para fazer" na hora.
- Uma nota nova sobre pagar a dívida técnica, no livro de Programação, ligou-se
  a "Refatoração" com score 1,00. O aviso disse "Isso acordou “Refatoração”.", e
  o toque foi gravado.
- Abrir a tela da ideia e editá-la gravaram toques.
- Com 1 dia, nada adormeceu.
- A névoa e o anel apareceram na Rede e no Mapa, nos dois temas.

Sem rolagem lateral em 320, 768 e 1440 px com a seção aberta; nenhum erro no
console. 417 testes, typecheck e lint limpos. Bundle principal: 146,4 KB
gzipped.

**Visto e não resolvido:** de dia, na Rede, a névoa clara sobre a sala clara é
bem discreta. Quem marca a ideia ali é o ponto esmaecido e os fios mais fracos.
Fica para a passada de acabamento.

## O Mapa vira carta náutica, e as ilhas se movem com a mão (02/10/2026)

Primeiros ajustes do teste conjunto das seis atualizações. Pedidos do usuário:
o Mapa "visualmente mais bonito e bem trabalhado", as ilhas como **círculo
perfeito**, e mover ilhas e neurônios com o dedo, "que nem no modo rede".
Perguntei duas coisas antes de mexer:

- **A cara:** carta náutica, entre carta náutica, planetário e limpo-moderno.
- **Arrastar um neurônio até outra ilha:** só dentro da própria ilha, entre só
  dentro e trocar de livro. Na Rede, arrastar nunca troca de livro, e trocar
  continua sendo pelo editar ou pelo "Mudar".

### A carta

`desenharMapa.ts`, em camadas:

- **O mar:** a sala com a borda escurecida (vinheta) e uma grade de latitude e
  longitude presa ao mundo. O passo da grade dobra e divide com o zoom, para as
  linhas ficarem sempre a 80–180 px uma da outra.
- **A água em volta de cada ilha:** um raso da cor do livro que se apaga no mar,
  e três isóbatas (anéis de profundidade) a 9, 20 e 32 do mundo, a de fora
  tracejada. Com a ilha pequena na tela, só o raso.
- **As pontes viram rotas em arco** (curva quadrática, curvatura 0,12 do
  comprimento, sempre do mesmo lado de A→B), com um halo fraco por baixo. Duas
  pontes da mesma ilha deixam de se sobrepor. O toque segue a curva
  (`controleDoArco`, `pontoNoArco`), e não a reta.
- **A ilha:**
  - uma sombra no mar;
  - a terra com uma luz de cima à esquerda (um domo, não um disco chapado);
  - o toque da cor do livro;
  - a costa dupla, um traço firme e um fio por dentro;
  - hachura por fora, como as cartas antigas marcavam a praia, só com a ilha
    grande na tela (mais de 70 px de raio): pequena, vira serrilha.
- **A rosa dos ventos** no canto de cima, à direita: enfeite discreto, que não
  anda com o mapa.
- **Os nomes das ilhas** em versalete espaçado; a contagem em itálico.
- **Tokens novos**, nos três blocos de tema: `--mapa-grade`, `--mapa-vinheta`
  e `--mapa-sombra`. De dia, tinta; à noite, a grade é luz fraca e a borda
  afunda no escuro.

### O círculo

`RECORTE_DA_COSTA`, `contornoDaIlha` e `raioDaCosta` saíram. A costa é o
raio, e os pontos moram até `raio − MARGEM_DA_COSTA`. O raio de uma ilha
existente pode encolher um pouco na próxima atualização dela (não divide mais
por 0,85), sem mover ponto nenhum. Os mapas já gravados continuam válidos: os
pontos já estavam dentro do círculo menor.

### A mão

| Gesto                                   | O que faz                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------------ |
| Tocar e arrastar um neurônio que se vê  | Leva ele, como na Rede. Não sai da ilha: o dedo vai, o ponto fica na beira de dentro |
| **Segurar** (380 ms) a terra e arrastar | Ergue a ilha — a sombra desce e abre — e leva ela com todos os neurônios             |
| Arrastar a terra sem segurar            | Navega, como sempre                                                                  |
| Segurar e soltar parado                 | Põe a ilha de volta no lugar                                                         |

- **Por que a ilha pede segurar:** ela é grande, e é onde o dedo também
  navega. Pegar ao primeiro toque tiraria o arrastar do mapa de quem só quer
  passear. É o mesmo gesto do livro na estante.
- **O núcleo decide o lugar final**, puro e testado:
  - `moverIlha`: a ilha fica onde foi solta. Em cima de outra, anda o mínimo
    até o mar inteiro em volta, sem a reserva de crescimento — o lugar foi da
    pessoa, e é respeitado o mais perto possível.
  - `moverPontoNoMapa`: dentro da ilha; colado noutro neurônio, um passo para o
    lado.
  - Em nenhum dos dois casos mais nada se mexe. O afastar da ilha que cresceu e
    o novo procuram vão pela mesma função (`lugarLivreMaisPerto`).
- **Na tela:** enquanto está na mão, o lugar é só da tela (`comAMao`). Ao
  soltar, o motor grava em `meta.mapa` e devolve o mapa, e o que estava na mão
  desliza (260 ms) até o lugar decidido antes de a mão largar.
- **`useCamera` ganhou `aoSegurar`**: o dedo parado 380 ms sem que `aoDescer`
  tenha tomado o gesto. Soltar depois de segurar nunca vira toque. A Rede não
  usa, e não mudou.
- **Sem retorno de vibração:** o app não usa em nenhum outro gesto.

**Testes:** 6 novos do núcleo — ilha solta no mar, solta em cima de outra,
neurônio no lugar, fora da ilha, colado noutro, e alvo inexistente —, mais o do
círculo em `ilhaEm` e o do toque no arco. 420 testes, typecheck e lint limpos.

**Verificado no navegador de verdade** (build de produção, toque por CDP,
palácio de 35 notas):

- Arrastar a terra sem segurar navega, e a ilha fica.
- Segurar e arrastar levou Trabalho exatamente aonde soltou, com os neurônios
  dentro e as outras ilhas paradas.
- Solta em cima de Psicologia, Saúde foi para o vão mais perto, e Psicologia
  ficou.
- O neurônio mudou de lugar sem mexer os outros. Arrastado para fora, ficou
  junto da beira, dentro da ilha e no mesmo livro.
- Um toque continua selecionando.
- Recarregar manteve tudo onde a pessoa deixou.

Capturas em 320, 412 e 1440 px, nos dois temas, de longe, de perto e com a ilha
erguida. Bundle principal: 148,4 KB gzipped.

## O Mapa volta a ser simples (02/10/2026)

Segundo ajuste do teste conjunto, pedido do usuário logo depois de ver a carta
náutica. Quatro mudanças, todas no sentido de tirar enfeite:

- **O fundo do Mapa é o da Rede**: a sala lisa. Saíram a grade de latitude e
  longitude e a borda escurecida.
- **A rosa dos ventos saiu.**
- **A ilha é um círculo com a borda na cor do livro**, e o interior (a
  `--parede`) um tom mais claro que o mar, só para os neurônios se destacarem —
  sem sombra, anéis de profundidade, hachura ou luz de domo. Erguida (a pessoa
  está segurando), cresce 3% e a borda engrossa. As pontes em
  arco e os nomes em versalete ficaram.
- **Os neurônios estão sempre à mostra**, como na Rede. **Mas só se tocam e se
  movem de perto** (zoom a partir de `ESCALA_DE_PERTO`, 0,9): na visão inicial
  um toque em cima de um deles é da ilha e aproxima dela, como antes, e arrastar
  navega — segurar é que move a ilha. Perto de uma ilha continuam aparecendo só
  as trilhas e os nomes. O ponto não leva mais o toque da cor do livro por cima
  (ele sumiria sobre uma ilha da mesma cor).
- **A ideia feita é um ponto dourado, sem anel** — na Rede e no Mapa. O anel
  de ouro gravado (Atualização 6) saiu.

Saíram os tokens `--mapa-grade`, `--mapa-vinheta` e `--mapa-sombra`. O que
mover ilha e neurônio faz não mudou.

**De perto**, segurar a terra a menos de 22 px de um neurônio pega o neurônio, não
a ilha — a ilha se pega na terra vazia.

Verificado no navegador de verdade (build de produção, toque por CDP, 35
notas, com ideias feitas semeadas): Mapa de longe e de perto nos dois temas
(412 px) e a Rede com os pontos dourados; de longe, arrastar em cima de um
neurônio só navega e tocar aproxima da ilha; as 13 conferências de arrastar ilha e
neurônio continuam passando. 420 testes, typecheck e lint limpos.

## Auditoria mobile: folhas na metade da tela e alvos de toque (02/10/2026)

Pedido do usuário: rever o app inteiro atrás de itens fora do padrão mobile e do
padrão do projeto, e, nas folhas (bottom sheets), fazer a lista rolar em vez de a
folha crescer até o topo.

- **A folha para na metade da tela** (`.folha`, abaixo de 768 px; **substituído em 05/10/2026** pelas paradas de altura — ver "Folhas que se esticam"):
  `max-height: min(max(50dvh, 300px), 88dvh)`, e o `.folha-corpo` rola por dentro,
  com a alça fixa em cima. Antes era 88dvh — uma lista de livros chegava quase
  ao topo. O piso de 300 px é para tela baixa e para o teclado aberto, que
  encolhe o `dvh` (`interactive-widget=resizes-content`). A partir de 768 px
  (diálogo centralizado) continua `min(88dvh, 720px)`.
- **Alvo de toque de 44 px no mínimo** (o padrão iOS/Android que o projeto já
  adotava em `botao` e nas linhas de lista): `.chip` 36 → 44, `botao`
  `pequeno` 40 → 44, o campo "Adormece com N dias" 36 → 44, o controle de
  intensidade da luz (`range` nativo, antes só a altura da trilha) `h-11`, e o
  botão "Mudar" do aviso flutuante.
- **Texto secundário a partir de 12 px**: `.rotulo-de-secao` (11,5 → 12 px), os
  nomes dos panos/larguras/comprimentos do formulário de livro e a etiqueta
  "processando" (11,2 → 12 px).
- **Custo:** os alvos maiores empurraram o formulário de novo livro 19 px além
  de 390×844, onde ele cabia sem rolar; o espaço entre os campos (`gap`) foi de
  20 para 16 px e ele voltou a caber (em 320×568 já rolava, e rola 1 px menos).

**Visto e não mudado:** a porta usa `vh` (`--pt-altura`) — fica como está, por
instrução do usuário. A lombada gravada e as legendas decorativas da estante
têm texto menor que 12 px, de propósito: é gravação em objeto, não texto de
leitura. A folha "Escolher livro" (formulário do neurônio) é a única sem texto
de título visível (as outras dizem "Em qual livro executável?", "Onde guardar?"
ou o nome do neurônio) — apontado, não alterado.

Verificado no navegador de verdade (build de produção, toque por CDP): a folha
"Escolher livro" (8 linhas) com 446 px em 412×892, 300 px em 320×568 e 422 px
em 390×844, com o corpo rolando; em 1440×900 continua diálogo centralizado, sem
rolar. Dez rotas em 320, 768, 1024 e 1440 px sem rolagem lateral; nenhum erro no
console. 420 testes, typecheck e lint limpos.

## Folhas sem rolagem, cantos mais retos e o tipo do livro numa fileira (02/10/2026)

Pedido do usuário depois da auditoria acima: otimizar o layout das folhas para
elas não precisarem rolar, deixar os ícones de seleção menos redondos (os chips
de 44 px, com cantos de pílula, ficaram mais redondos que os de 36 px) e
compactar a escolha de tipo na tela de novo livro. A rolagem da folha continua
existindo como rede de segurança (lista sem limite), mas as folhas de tamanho
conhecido agora cabem na metade da tela em 390×844 e 412×892.

- **Cantos:** `.chip` de pílula (999px) para 10px — vale em todo chip do app
  (Rede|Mapa, os modos da busca, o livro do neurônio, os filtros). As pílulas
  de "Pontes com" no espiar viraram `rounded-lg`. Botões de ícone continuam
  redondos (são ícone, não seleção).
- **Escolha de livro em duas colunas** (`EscolhaDeLivro`, usada em "Escolher
  livro", "Onde guardar?" e "Em qual livro executável?"): opções compactas
  (`.opcao`, 44 px, cantos de 10px, ponto da cor, nome e `Check`) em vez de
  linhas de 56 px. "Automático" e "Criar livro novo" ocupam a largura toda
  (`col-span-2`). Com oito livros a folha caiu de 477 px de conteúdo para 280.
- **O espiar do livro lista 3 neurônios** (antes 6), com linhas de 44 px, uma
  linha "e mais N" mais baixa e as pontes numa fileira só que rola de lado
  (`faixa-rolavel`): de 577 px para 386. Quem quer ver todos abre o livro.
- **Andamento** (`FolhaDeEstado`): linhas de 48 px (eram 56).
- **Tela de novo livro:** os dois blocos de chips (Livro | Pasta, e o chip de
  livro executável) viraram **um controle segmentado** de uma fileira só
  (`.segmentado`/`.segmento`): **Livro | Executável | Pasta**. Criando, as três;
  editando, só Livro | Executável (o tipo não muda), e uma pasta não mostra
  nada. "Adormece com N dias" só aparece com Executável. Saíram ~60 px, e o
  formulário (com o espaço de 16 px entre campos da auditoria) passou a caber em
  390×844 mesmo com o Executável ligado.

Medido com o Chrome (build de produção) em 390×844 e 412×892: espiar, escolher
livro, "Onde guardar?", andamento, filtros da Rede e do Mapa, apagar e
reorganizar — todas cabem sem rolar. Em 320×568 (folha de 300 px) o espiar, o
andamento e as listas de livros ainda rolam, como esperado nessa altura.
Nenhuma rolagem lateral; nenhum erro no console. 420 testes, typecheck e lint
limpos.

## Folhas que se esticam, como os sheets do Spotify (05/10/2026)

> **Revisto em 06/10/2026:** a folha só abre pela metade quando o conteúdo **não cabe** na
> tela; o que cabe abre inteiro, sem esticar nem rolar — ver "Mostrar tudo sem deslize
> vertical". O resto desta seção continua valendo.

Pedido do usuário: as folhas passam a crescer conforme o conteúdo, com duas
paradas de altura e o efeito de esticar. **Isto substitui o teto fixo de metade
da tela** da auditoria de 02/10/2026 (`max-height: min(max(50dvh, 300px), 88dvh)`):
a metade virou a altura em que a folha **abre**, e não o máximo dela. A
compactação das folhas (duas colunas, espiar com 3 neurônios, etc.) fica, porque
faz mais folhas caberem na parada de baixo sem precisar esticar.

### Como se comporta (só abaixo de 768 px)

- **Abre pela metade** da tela (piso de 300 px) — ou no tamanho do conteúdo, se
  ele for menor. Folha curta não estica e não rola (apagar, reorganizar, ações).
- **Passando da metade, a folha se estica**: puxar para cima, na alça ou no
  corpo, leva até 92% da tela (ou ao tamanho do conteúdo, se for menor). Pela
  metade a lista **não rola** — o dedo que sobe estica. Só na parada de cima a
  lista rola por dentro.
- **Elástico:** passou de 92%, a folha segue o dedo a 35% e no máximo 36 px; ao
  soltar volta macia para a parada (a transição de altura passa um fio e volta).
- **Fechar é em etapas:** com a lista no topo, descer recolhe para a metade;
  descer de novo (ou da metade, descer pelo corpo) escorrega e fecha. Rápido o
  bastante, o gesto pula a parada para onde o dedo apontou (0,35 px/ms) ou fecha
  (0,6 px/ms). A alça, o toque no fundo escurecido, o Esc e o voltar do Android
  continuam fechando direto.
- **Com a lista rolada**, descer só rola de volta: o gesto de recolher exige a
  lista no topo **no começo do toque**.
- Do tablet em diante é diálogo centralizado, sem paradas, como antes.

### Onde mora

`components/Folha.tsx`. A altura e o `transform` vão direto no elemento (sem
passar pelo React), e só na soltura entra a transição (`.folha--solta`). Um
`ResizeObserver` no `.folha-conteudo` refaz as paradas quando o conteúdo muda de
tamanho (a lista carrega, um campo some) e `resize` refaz quando a tela gira ou
o teclado abre. O `<dialog>` fechado não tem tamanho, então a medida acontece
depois do `showModal`, num `useLayoutEffect` — antes de pintar. O CSS lê dois
atributos que o componente escreve (`data-expansivel`, `data-altura`):
pela metade e com mais por ver, `overflow: hidden` e `touch-action: none`.

O gesto do corpo usa `touchmove` **sem passividade**: depois que a rolagem
nativa começa, o navegador não deixa cancelá-la. A direção do dedo no começo
(mais de 6 px, mais vertical que horizontal) decide: sobe com a folha pela
metade → estica; desce com a lista no topo → recolhe; o resto é rolagem comum.
Uma fileira que rola de lado (as pontes do espiar) continua sua, porque o gesto
horizontal nunca vira do sheet. Mouse só arrasta pela alça.

### Verificado

No navegador de verdade (build de produção, toque por CDP, 412×892, com 40
livros a mais para a lista passar de uma tela): abre pela metade e a lista não
rola; subir estica até 821 px (92%) e aí a lista rola (scrollTop 298); descer
com a lista rolada só rola de volta; com ela no topo, recolhe para 446 px;
arrastar muito além do topo estica só até 857 px e volta a 821 ao soltar; a alça
recolhe e depois fecha; reabrir volta pela metade sem herdar o arrasto; do meio,
descer pelo corpo fecha; folha curta não muda ao subir e fecha ao descer; tocar
numa opção ainda escolhe; em 1440×900 continua diálogo. 420 testes, typecheck e
lint limpos.

**Não verificado num aparelho de verdade:** o teclado aberto numa folha com
campo (o único é "Criar livro executável", dentro da escolha do porto) e o
ritmo do elástico sob um dedo real.

## As ilhas viram hexágonos, e as linhas afinam (05/10/2026)

Pedido do usuário na tela da Rede, modo Mapa.

- **A ilha é um hexágono regular**, com um lado reto em cima e embaixo e os
  vértices à esquerda e à direita. O `raio` gravado passou a ser o **apótema**
  (do centro ao meio de um lado), e não o vértice: assim o hexágono **contém** o
  círculo que o núcleo continua usando para espaçar ilhas, soltar pontos e
  prender o neurônio arrastado — nada do que já estava dentro de uma ilha ficou
  fora, e **nenhum dado gravado mudou** (o núcleo `core/motor/mapa.ts` não foi
  tocado). O vértice fica a `raio / cos 30°` (≈ 1,155 × o raio), em
  `RAZAO_DO_VERTICE`. O nome da ilha continua em cima, porque o lado de cima
  está a um raio do centro.
- **O toque é o hexágono** (`dentroDoHexagono`, `ilhaEm`) e o enquadramento
  (`bordasDoMapa`, aproximar de uma ilha) conta os vértices, mais largos que o
  raio. O resto — pontos, arrastar neurônio, arrastar ilha — é o de antes.
- **Custo assumido:** o espaçamento entre ilhas continua medido em círculos, então
  os cantos podem chegar mais perto que os 46 de mar quando duas ilhas grandes
  (raio acima de ~150) ficam alinhadas na horizontal, vértice com vértice. Com os
  tamanhos de hoje não se encostam; se um palácio crescer a ponto de isso
  aparecer, a conta mora em `seSobrepoem` e `separarIlhas`.
- **Linhas mais finas** (cerca de 25%): ponte de 1 → 0,75 px e teto de 3 → 2,25
  px (`espessuraDaPonte`); borda da ilha de 1,25 → 1 px (2,5 → 2 px segurada);
  trilhas de 0,9 → 0,7 px; as conexões do neurônio tocado de 1,3 → 1 px (trilha)
  e 1,8 → 1,4 px (ponte).

Verificado no navegador de verdade (build de produção, toque por CDP, 35 notas):
Mapa de longe e de perto nos dois temas; as 13 conferências de arrastar ilha e
neurônio continuam passando. 422 testes (2 novos: o hexágono e os vértices),
typecheck e lint limpos.

## Enquadrar no Mapa anima a volta (05/10/2026)

Pedido do usuário: tocar numa ilha de longe aproxima com animação, mas voltar à
visão do arquipélago inteiro (o botão "Enquadrar") pulava de uma vez. Agora, no
Mapa, esse botão leva a câmera de volta com a mesma animação e a mesma duração
(450 ms) da aproximação, e `prefers-reduced-motion` continua indo direto.

`TelaDoMapa` expõe `voltarAoInicio` (animado) como o `enquadrar` do
`ControleDaTela`. O `enquadrar` instantâneo continua existindo por dentro, só
para a abertura e para quando o arquipélago muda de forma — ali pular é o
certo, não há câmera de onde sair. A Rede não mudou: o botão dela segue
instantâneo.

**Não verificado num navegador de verdade nesta sessão.** Typecheck e lint
limpos.

## A estante no estilo Noite (06/10/2026)

Pedido do usuário: levar a estante (`Estante.tsx`, `Movel`, `Lombada`, `LugarSemLivro`,
`FormularioDeLivro`) para o estilo visual "Noite" e deixar quem usa controlar a forma e a
cor de cada livro. Feito em oito passos, um por vez; as decisões abaixo foram do usuário
ou, onde o prompt dele não bastava, confirmadas por ele antes de implementar.

### As quatro regras de design que mudaram

Estas quatro regras deixaram de valer como estavam escritas acima:

1. **Ouro deixa de ser só do título.** O título é claro ou escuro conforme a cor. O ouro
   marca **estado** (Fazendo, Feita) e **acabamento** (filetes dos enfeites, fio da tábua).
2. **O azul-claro `#7FA8FF` (`#A9C4FF` no ponto) é exclusivo da ponte.** Nenhum outro
   elemento da lombada o usa. O token global `--ponte` (Rede, Mapa, textos) **não mudou**
   e é outro tom: a ponte da estante usa literais próprios, só na lombada.
3. **A lombada continua sendo objeto escuro.** O Creme (`#F1EEE6`) é o único tom claro.
4. **A cor do livro é um dos 10 tons da paleta, não um hex livre.**

### Dados

- `Livro.estilo`: `solido`, `faixa`, `duas-cores`, `contorno`, `ponto`, `fio`, `degrade`,
  `papel`, `metade` ou `bloco`, padrão `'solido'`, validado com Zod. Dexie **v12**: todo livro ganha
  `solido` e a `cor` vai ao tom mais próximo.
- `core/domain/paletaNoite.ts`: a paleta, as formas e `corMaisProxima(hex)` (distância em
  Lab, ΔE76). `Livro.cor` continua um hex guardado, mas o repositório **só aceita um dos
  10** (em qualquer caixa de hex); o **backup** aceita hex livre e o mapeia em vez de
  recusar, e `estilo` ausente vira `solido`.
- Paleta Noite: Azul base `#1B2A6B` (o padrão de livro novo), Azul profundo `#12204F`, Azul
  vivo `#2A3A8A`, Azul noite `#0E1744`, Azul médio `#243580`, Petróleo `#17505A`, Violeta
  `#3A2F6B`, Vinho `#4A2540`, Grafite `#2D3A4F`, Creme `#F1EEE6`.
- **O mapeamento em Lab pesa a luminosidade mais que o matiz.** Como a paleta é toda escura
  exceto o Creme, os panos antigos claros caem assim: Violeta `#7b6ae0` e Azul `#5b7fd6` →
  Azul vivo; **Terracota `#c8734a` → Creme**; Ardósia e Musgo → Petróleo; Couro → Vinho.
  Quem tinha Terracota passou a ter lombada creme. O seed foi fixado à mão (Violeta,
  Petróleo, Vinho).
- Cor do texto: `#F2F2F5` ou `#14141C` quando a luminância (0,299R + 0,587G + 0,114B) passa de
  0,55 — só o Creme.

### A lombada

`features/estante/lombadaNoite.ts` (puro) calcula e `.lombada` em `index.css` desenha. As
dez formas são um pseudo-elemento só (`::before`) lido de `data-estilo`; a sombra lateral é o
`::after`; o papel é sempre Creme com texto escuro, título como foi digitado e a contagem
de ideias no pé (a cor guardada continua valendo na Rede e no Mapa).

- **Em repouso** o fundo é a cor lavada `color-mix(srgb, cor 84%, #5565B5 16%)`; escolhido,
  erguido e alvo usam a cor real. **O slider de luz** (Ajustes) escala a lavagem: 42 (o
  padrão) dá os 16%, 0 mostra a cor real e 100 chega a 38%.
- **Só `transform` e `opacity` animam.** Saíram as transições de cor da lombada e a
  animação do halo da ponte.
- **O tamanho do título** é `min(0,46 × W, espaço ÷ (n × 0,9))`, piso de 9 px, e o que não
  cabe vira reticências. Dois desvios do desenho, medidos no navegador: o espaço é a **zona
  do título da forma** (no sólido, 75% de H — a conta do desenho; com 0,75 × H fixo "FAIXA"
  virava "FAI…"), e cada caractere conta **0,9** do corpo, não 0,78 (a Literata em negrito,
  maiúscula e com 0,1em dá média 0,81 e O, D, M passam de 0,9: "CONTORNO" virava
  "CONTOR…").
- **A altura em px** vem de `useAlturaDaFileira`, que **mede** a fileira em vez de repetir a
  fórmula do CSS. Medido, a lombada de verdade tem as mesmas proporções de antes (altura de
  63% a 93,5% da fileira, largura de 24 a 68 px).
- **O emblema** só aparece se o título terminar acima dele, nunca no papel (a contagem ocupa
  o pé) nem no livro Feito (o disco ocupa o pé); usa a cor do texto, para ler no Creme.
- **Fantasma, abertura do livro, Rede e Mapa** ficaram só com cor e título.

### O formulário

Cor: 10 amostras (`radiogroup`, 5 por linha), cada uma com o nome em português. Forma: lista
de 10 opções em 2 colunas, com a miniatura da lombada ao lado do nome, na cor atual do
formulário. A amostra mostra forma, cor, largura, comprimento e emblema ao vivo, **sem
estado** e sem a contagem do papel. Editar carrega e salva `estilo` e `cor` do mesmo jeito.
Com a lista de formas o formulário **rola** no celular (~1075 px em 390 de largura, contra
~840 antes); o botão de criar continua preso no pé.

**O enfeite nunca tem luz branca (06/10/2026, pedido do usuário):** os detalhes da forma
(faixa, fio, bloco de cima do "duas cores") se misturam com `--fg`, que num livro escuro é
o texto claro — no enfeite isso desenhava um bloco e filetes esbranquiçados. O enfeite
sobrescreve `--fg` com `TOM_DO_DETALHE_DO_ENFEITE` (`#070d2e`, mais escuro que o fundo), então os
detalhes viram sulco, não brilho. O único claro do enfeite são os filetes dourados. **O
enfeite também não escurece o topo:** "duas cores" e "degradê" saíram do sorteio (o bloco e o
degradê escuros no alto liam como sombra), e ficam só `solido`, `faixa` e `fio`.

### Os estados

- **Ponte:** `data-ponte` ganha moldura de 1 px `#7FA8FF`, anel de 3 px a 30% e o ponto
  `#A9C4FF` a 7 px do topo. **O ponto só existe com `data-ponte`**: o pontinho que marcava
  sempre "este livro tem fio saindo" deixou de existir (o prompt dizia "substitui").
- **Os três estados do livro executável não tinham origem no livro** — Fazendo, Feita e
  Adormecido eram do neurônio (`estadoVisivel`, `estaAdormecida`). Regra confirmada pelo
  usuário, em `andamentoDoLivro` (`core/domain/executavel.ts`, puro, testado), só para livro
  executável (pasta nunca): **Feita** — há ideias e todas estão feitas; **Adormecido** —
  sobrou ideia por fazer e todas dormem; **Fazendo** — alguma ideia **acordada** está em
  "fazendo"; o resto não tem marca. Exclusivos entre si. A estante usa o relógio de quando
  a tela abriu, então o livro só adormece na próxima abertura.
- **Fazendo:** tira `#E8C471` no topo (`max(2px; 1,25% H)`) e ponto logo acima. **Feita:**
  disco `#E8C471` a 90% de H com a marca `#1C1504`. **Adormecido:** a lombada a 42% de
  opacidade com a névoa `#A9BAF0` de 12% a 40% (a névoa também fica a 42%: a opacidade é do
  botão inteiro). O vão do arrasto (20%) vence o adormecido.
- O leitor de tela ganhou "em andamento", "tudo feito" ou "adormecido" no nome da lombada.

### Os enfeites

Lombada **`#1B2A6B`** sem título, emblema nem contagem, sem lavagem de luz (a cor real: é o
que faz os livros seus saltarem). Forma entre `solido`, `faixa` e `fio` (eram cinco; ver acima),
largura 24, 38 ou 52 px e altura de 63% a 93,5% — tudo sorteado pela semente do lugar
(prateleira, ordem), então o mesmo lugar dá sempre o mesmo enfeite. **Isso reverte o pedido
de 14/09/2026** (todo enfeite do mesmo tamanho, sem filete dourado), por decisão do prompt
novo. **A vaga tem a largura que o enfeite daquele lugar teria**, para tirar o enfeite não
mexer a fileira. Filetes dourados (9,4% e 11,9% de H, de 1,6 e 0,8 px, e 90,6%, 1,6 px, a
85%) saem em todo enfeite com outro enfeite ao lado (grupo) e em 1 de 5 dos isolados — como
quase todo enfeite tem vizinho enfeite, **quase todos levam dourado**. Os gestos (tocar abre
`/novo-livro`, segurar abre o menu do lugar) não mudaram.

### O móvel

Dentro de `.cores-de-antes`, como variáveis `--mv-*`, sem tocar nos tokens globais. **O escopo
agora é sempre escuro, nos dois temas**: comparado pixel a pixel, a estante é idêntica de dia
e de noite (só os 32 pixels dos cantos arredondados diferem). Parede `#0B1230`, trilho de
10 px `#121A44`, tábua de 8 px `#1A2557` com a linha `#3446A6` (1,6 px) no topo, o fio dourado
(1,2 px a 50%) logo abaixo e sombra de 10 px, pilastras `#12204F` com borda `#2A3A8A` de 24 px
à esquerda e **14 px à direita**. A penumbra de 62% a 10% em 32% da altura **saiu** (pedido
do usuário, 06/10/2026, depois da madeira): **nenhuma sombra cai sobre o alto dos livros** —
nem a penumbra, nem a sombra de 10 px embaixo da tábua, nem a do trilho de cima. A vinheta
das bordas ficou.
Desvios: o prompt dizia "como hoje" para as pilastras, mas hoje as duas tinham 24 px (segui
os números); e "6 px da base" da tábua colidiria com a linha do topo, então o fio ficou logo
abaixo dela.

### A amostra do formulário é a lombada que vai para a estante (07/10/2026)

Pedido do usuário: o preview do livro às vezes não era igual ao que ia para a prateleira, e
tem que ser fiel. Causa, medida: a amostra media a altura contra uma referência fixa de
130 px, enquanto a lombada usa a **altura medida da fileira** (92 a 132 px, pela tela) — e o
tamanho do título e as reticências saem dessa altura. Um título que cabia na amostra era
cortado na prateleira. Havia mais três divergências: o "automático" da amostra era um chute
(96 px de altura, 38 px de largura), o papel não mostrava a contagem, e uma pasta sendo
editada não mostrava o clipe.

- **A mesma conta, uma vez só.** `alturaDaLombadaEmPercentual` (`prateleiras.ts`) é usada pela
  `Lombada` e pela amostra. A largura automática da amostra é `larguraDoLivroGravado` (a semente
  do id), e a altura automática e a contagem do papel vêm de `montarEstante` — o editar passa
  `livroId`, `alturaAutomatica` e `contagem`. Livro novo: 0, e a largura e o comprimento já nascem
  em "Normal".
- **A fileira é medida, não calculada.** O formulário esconde um `.movel` com uma `.movel-fila` vazia
  (a altura sai do mesmo CSS da estante, `useMedidasDaFileira`), então a fórmula não é repetida.
  A amostra desenha a lombada nos **mesmos px** da prateleira.
- **O teclado não encolhe a amostra.** A fileira se mede por `dvh`, e o teclado aberto a
  encolhe; a medida do formulário só cresce (`semEncolher`), e a primeira vale direto. Visto
  com a tela baixada de 892 para 480 px: a altura da amostra não mudou.
- **Enfeite.** A amostra de editar enfeite leva os filetes dourados e, enquanto a forma e a cor
  forem as do sorteado, os detalhes em azul escuro — o acabamento que ele tem na estante.
- **Verificado** no Chrome, criando livros reais e comparando amostra e lombada da estante em
  320×568, 412×892 e 768×1024 (4 combinações de forma, largura e comprimento, com título
  longo): largura, altura, tamanho do título, corte do texto e contagem **idênticos** em todas
  (12 de 12), e a edição de 3 livros em automático também (um deles em papel, com contagem).
  Não coberto: os estados do livro executável (Fazendo, Feita, Adormecido) e a ponte, que
  a amostra nunca mostrou — são da estante, não da escolha de forma e cor.

### As laterais são sólidas (06/10/2026)

Pedido do usuário, depois do estilo Noite: nenhum livro (que não seja enfeite) passa das
laterais do móvel nem fica cortado ao meio quando a estante é reorganizada. **Isto revoga
a regra antiga** de que os livros "somem atrás da pilastra da direita, como em estante
cheia". O corte vinha de a largura de cada lugar depender do conteúdo: enfeites de 24, 38
ou 52 px e livros de 24 a 68 px, então um livro empurrado ou solto na ponta da fileira podia
ficar atrás da lateral.

Escolhas do usuário: os **enfeites mudam de largura, até a versão mais fina possível**, e a
adaptação considera isso; e os livros **já gravados** onde não cabem são **mostrados
inteiros**.

- **A fileira termina onde a pilastra da direita começa** (`margin-right: 14px` em
  `.movel-fila`, com `overflow: hidden`): o que passa da lateral é cortado ali. Só enfeite
  pode ser cortado.
- **`ajustarALargura`** (`prateleiras.ts`, puro, testado) protege tudo até o **último livro**
  da prateleira: se não cabe do tamanho de sempre, enfeites e vagas encolhem **na mesma
  escala**, até `LARGURA_MINIMA_DO_ENFEITE` (10 px); se nem assim cabe, enfeites e vagas
  **somem, do mais perto da lateral para o mais longe**, até os livros caberem. Só aparência:
  nada é gravado, e os lugares que sobram mantêm o índice. A escala vale também depois do
  último livro, para o enfeite não mudar de espessura no meio da prateleira. A vaga encolhe
  junto com o enfeite, então a fileira não anda quando um vira o outro.
- **Nem enfeite fica pela metade na lateral** (revisto em 06/10/2026, pedido do usuário: o
  último enfeite aparecia cortado atrás da lateral direita). `semCortarNaLateral` roda depois do
  ajuste acima: o primeiro enfeite ou vaga que não cabe inteiro **encolhe até a lateral** (se
  sobrar os 10 px mínimos) e os seguintes somem; uma sobra menor que isso é repartida entre os
  enfeites depois do último livro. Resultado medido em 320, 360, 412, 768 e 1440 px: nenhum
  lugar passa da borda da fileira. O `overflow: hidden` da fileira fica só de rede de segurança.
- **A largura útil é medida**, não calculada: `useMedidasDaFileira` (que substituiu
  `useAlturaDaFileira`) observa a primeira fileira e entrega altura e largura. Antes da
  primeira medida a fileira fica do tamanho de sempre.
- **Mover ou criar é recusado** quando os livros da prateleira de destino deixariam de caber
  (os enfeites cedem, então o que conta é a soma dos livros, com 1 px entre eles): o livro
  volta e o aviso diz "A prateleira N não tem espaço para mais um livro." (`cabeNaPrateleira`).
  Quem já estava além do limite pode ser mexido, desde que não piore. Tocar um lugar vazio
  para criar só vale se couber o menor livro (24 px).
- **Medido no navegador** com livros espalhados até o lugar 25 (larguras de 24 a 68): todos
  inteiros em 320, 412, 768 e 1440 px; seis livros de 52 px lotam uma prateleira de 362 px e
  o sétimo é recusado; para uma prateleira com folga ele vai.

**O que não é coberto:** se os livros **sozinhos** passam da fileira (oito livros de 68 px em
320 px), não há onde encolher e eles continuam cortados; mexer na **largura de um livro**
no formulário (de Fina para Grande) e o menu "criar aqui" do lugar não passam pela
recusa — a adaptação visual cobre os dois, mas não os impede.

### A estante: madeira, laterais iguais e base (06/10/2026)

Pedido do usuário, com duas referências: a **textura** (madeira azul-marinho de tábuas
verticais, `2.jpg`) e o **estilo da base** (o pé de um armário de livros preto, `1.jpg`).
Revisa "O móvel" acima: o que dizia das pilastras (24 px à esquerda, 14 px à direita), do
assoalho e do "estante em CSS, sem imagem" não vale mais.

- **Laterais iguais:** as duas têm 18 px (`--mv-lateral`), o mesmo corte da madeira e a mesma
  aresta de sombra (1 px, preta); a fileira vai de uma à outra (`margin-inline`), então a
  folga é a mesma dos dois lados — medido: 18/18 px, folga 0/0, em 320, 412, 768 e 1440.
  **Sem linha de cor sólida:** a primeira versão tinha um fio azul (`#26357f`) na aresta de
  dentro das laterais, que o usuário viu como "parte azul sólida"; saiu, e o friso de luz no
  topo das tábuas também deixou de ser azul opaco (agora `rgb(150 180 255 / 0.3)`, com a
  madeira aparecendo por baixo). Nenhum elemento da estrutura usa cor sólida: é madeira.
- **Textura só na estrutura, nunca atrás dos livros** (pedido explícito): laterais, trilho
  de cima, tábuas e base. O fundo atrás dos livros segue liso (`#0B1230`). Dois arquivos em
  `src/assets`, ambos WebP derivados do mesmo original: `madeira-azul-v` (como veio, para as
  laterais) e `madeira-azul-h` (girado 90°, para o veio correr no comprimento nas tábuas,
  no trilho e na base). Levantei o brilho em ×2,1 — o original é mais escuro que o fundo e
  a estrutura sumiria — e ficou com ~40 KB cada. `webp` entrou no precache do PWA
  (`vite.config.ts`), senão a estante perderia a madeira offline.
- **A base** (`.movel-base`) imita o pé da referência e tem duas partes. A **moldura** (metade
  de cima, o `::before`: friso, canaleta redonda e degrau) é **escura** — só a luz nas curvas
  a desenha, sob um véu de sombra. O **soco** (metade de baixo, o `::after`) é um painel de
  móvel de verdade: o quadro de madeira de veio na horizontal, com o chanfro de luz em cima, e
  dentro dele um **painel rebaixado de veio na vertical** (`.movel-base-painel`, a fresa escura
  em cima e à esquerda e a luz fina embaixo). Um véu leve de verniz tira o jeito de madeira
  crua. **É mais larga que o corpo**, 4 px de cada lado (`--mv-projecao`), como no móvel da foto.
- **A tábua das prateleiras** (8 px) é nítida e escura, na cor da madeira: o fio de luz da quina, a
  canaleta escura que a separa dos livros, o fio dourado, a face de madeira (véu leve, veio
  à mostra) e a quina de sombra no pé que a recorta.
- **A base ficou mais escura** (07/10/2026, pedido do usuário): véus da moldura (0,5), do soco
  (0,42) e do painel rebaixado (0,34), e as luzes das curvas reduzidas; o veio e o relevo
  continuam à mostra. Cuidado: com véus bem acima disso o soco
  vira preto chapado, e o painel perde o aspecto de madeira (já aconteceu na primeira versão).
- **O tampo** (`.movel-cornija`, o trilho de 10 px em cima) é escuro como a moldura da base
  (07/10/2026, pedido do usuário): véu de sombra (`rgb(4 9 28 / 0.45)`) sobre a madeira e só um
  fio de luz de 1 px na quina.
- **Uma versão para cada quantidade de prateleiras (1 a 6):** `--mv-base` vale 52, 46, 42, 38,
  34 e 30 px (`.movel[data-prateleiras='N']`, escrito por `Movel.tsx`). Com poucas prateleiras
  a fileira é alta (até 132 px) e há altura de sobra, então a base cresce; com seis ela
  encolhe para as prateleiras não perderem espaço. A conta da fileira desconta trilho + base
  (`--mv-bordas`) e a tábua de 8 px.
- **Igual nos dois temas:** o interior da estante (excluindo os 4 px de projeção, onde
  aparece o fundo da página) é idêntico, pixel a pixel, no claro e no escuro.

**O que ficou visível:** em 320×568 a estante com 5 ou 6 prateleiras passa da tela (a fileira
já está no piso de 92 px) e a página não rola na estante — vale antes desta mudança, mas
agora o teto é 6 e fica claro. O corte da madeira nas laterais é o mesmo nos dois lados, então
não há "espelho" do veio: ficou igual, e não espelhado.

### Verificado

Chrome (Playwright-core, build de produção): as 10 formas nas larguras 24, 38, 52 e 68 em
fileiras de 92 e 132 px; as 10 cores × 10 formas a 24 px com título legível; ponte, Fazendo,
Feita, Adormecido, escolhido e erguido; os dois temas idênticos; sem rolagem lateral em 320,
412, 768 e 1440. Gestos (por mouse): tocar espia, segurar ergue e soltar parado abre o menu,
arrastar para um lugar vazio leva só o livro e deixa uma vaga, soltar sobre um livro o empurra
para o buraco mais perto, tocar numa vaga ou num enfeite abre o novo livro naquele lugar,
segurar um enfeite abre o menu do lugar, e tudo sobrevive a recarregar. 474 testes, tipos e
lint limpos. **Não verificado num aparelho de verdade** (toque real, teclado aberto).

### O que ficou de fora, ou visível

- A contagem do papel a 24 px tem ~5 px de corpo (22% de W, como no desenho): ilegível.
- Títulos longos em lombada baixa mostram reticências (o piso de 9 px é do desenho).
- Pastilhas de cor da Rede, do Mapa e das listas leem `livro.cor` direto: o Azul noite quase
  some sobre a sala escura e o Creme é muito claro no tema claro. O desenho mandava herdar.
- No papel feito, a contagem e o disco se sobrepõem um pouco.
- O tom `#7FA8FF` da ponte na estante difere do `--ponte` da Rede e do Mapa.

## Enfeites que se definem e se movem (07/10/2026)

Pedido do usuário: definir as características de um enfeite como as de um livro e movê-lo
para onde quiser. Duas escolhas dele, antes de implementar: o enfeite tem **cor, forma,
largura e comprimento** (sem nome, sem emblema — continua só visual, sem neurônio e fora do
grafo), e ao largar sobre um livro valem **as mesmas regras do livro**.

- **O dado.** Tabela `enfeites` (Dexie v13, chave `[prateleira+ordem]`), sem migração: sem
  registro o lugar mostra o enfeite sorteado, como sempre. Um registro **vence o sorteio** do
  lugar; `larguraLombada`/`comprimentoLombada` `null` caem no sorteio. A cor é um dos 10 tons da
  paleta (o repositório recusa o resto; o backup mapeia hex livre). Nunca embaixo de um livro,
  como a vaga: `upsertLivro`, `moverLivro` e o import tiram o enfeite do lugar onde um livro
  chega; tirar o enfeite apaga o registro; diminuir as prateleiras apaga os das que somem. Vai
  no backup (`enfeites`, opcional — backup antigo importa sem eles).
- **Mover** (`moverEnfeiteNaEstante`, `core/domain/ordem.ts`, pura, a mesma conta na store e no
  repositório): destino sem livro (outro enfeite ou vaga) — só o enfeite anda e o que estava ali
  dá lugar a ele; destino com livro — a fila empurra até o buraco mais perto (o código de
  empurrar é o mesmo do livro, `empurrarParaAbrir`); prateleira cheia de livros — recusa. O
  lugar de onde saiu **vira vaga** (nada anda sozinho), a não ser que um livro empurrado
  chegue a ele. A recusa por falta de largura (`cabeNaPrateleira`) vale igual.
- **O que viaja.** `dadosDoEnfeite` leva a cara que a tela mostra, com as medidas explícitas
  (`null` seria "a do sorteio do lugar", e no lugar novo o sorteio é outro). Mover um enfeite
  **sorteado** o grava no destino com a mesma forma, altura e filetes dourados.
- **`detalheEscuro`.** O enfeite sorteado leva os detalhes da forma em azul escuro (ver "O
  enfeite nunca tem luz branca"); o **gravado** é desenhado como um livro — a forma e a cor que a
  pessoa escolheu —, a não ser que ela tenha só movido, ou só mexido nas medidas, de um sorteado:
  `detalheEscuro` fica ligado até ela mudar a cor ou a forma.
- **Gestos.** Segurar um enfeite o ergue (como o livro) e soltar parado abre o menu do lugar;
  arrastar o leva, com um fantasma (`FantasmaDoEnfeite`) e o vão que ele deixa a 20%. A vaga
  não se arrasta (é só um buraco); tocar um lugar ainda cria um livro ali. O `Gesto` ganhou
  `enfeite` (o lugar do que está na mão) no lugar de `livroId`: é um ou outro.
- **Editar.** O menu do lugar ganhou "Editar o enfeite", que leva a `/enfeite/:prateleira/:lugar/editar`
  — a tela cheia do livro (`FormularioDeLivro` com `enfeite`: sem nome, tipo, emblema nem
  executável). O enfeite sorteado também se edita; salvar o grava, e o que não foi mexido fica.
- **A tela mostra uma das quatro opções, nunca "automático" nem porcentagem** (pedido do
  usuário, 07/10/2026). Editar abre com a largura e o comprimento do enfeite na opção de sempre
  mais perto (`opcaoMaisProxima`: Fina a Grande, Curto a Enorme; empate fica com a menor). O
  comprimento sorteado (63–93,5%) quase nunca cai numa opção, então ele aparece na vizinha — 85%
  abre como "Alto" (88%) — e salvar grava a opção. Quem quiser a medida exata de antes não salva.
- **Fora daqui:** os filetes dourados não se escolhem (vêm do sorteio ou do que o enfeite já
  tinha); "voltar ao sorteado" é tirar o enfeite e pôr outro.
- **Verificado** no Chrome (build de produção, mouse): editar pelo menu, gravar, arrastar para
  outro enfeite, para outra prateleira e sobre um livro (que é empurrado), tirar o enfeite e
  recarregar. 532 testes (31 novos: núcleo, estante, repositório e backup), tipos e lint limpos.
  **Não verificado em toque real** nem no APK.

## Executáveis: desfazer e a imagem do resultado (07/10/2026)

Dois pedidos do usuário sobre a tela do neurônio num livro executável.

### Deixar de ser executável

"Tornar executável" não tinha volta. Agora, numa ideia que está num livro executável, o botão
**"Deixar de ser executável"** abre uma folha (`?desfazer=1`, `FolhaDeixarDeSerExecutavel`) com
**"Automático"** e os livros de conceitos que não são executáveis.

- **Para onde:** o livro escolhido, ou, com "Automático", o que o palácio achar pelo texto
  (`livroAutomatico`, o mesmo do "Automático" ao escrever — ver "O automático sempre escolhe
  um livro"). `guardarNeuronio(id, null)` é "Automático"; sem livro comum para receber, o motor
  recusa, e o botão fica desabilitado quando não há nenhum.
- **O andamento** fica guardado na ideia, sem aparecer. Entrar de novo num livro executável
  recomeça em "para fazer" (a regra de sempre para quem entra) — só o livro que deixa de ser
  executável devolve os estados como estavam.
- O aviso diz onde ficou ("Agora em X."). Não escolhi "voltar ao livro de onde veio": a ideia
  não guarda o livro anterior, e a escolha explícita evita adivinhar.

### A imagem do resultado

Ao concluir uma ideia ("Feita"), além do link, dá para anexar **uma imagem**, no padrão das
imagens do sistema: o mesmo seletor (`escolherImagem`), a mesma redução no Worker (WebP, 1600 px e
miniatura de 320 px, sem os metadados da câmera), o mesmo desenho (`ImagemDoResultado`: caixa
`bg-realce`, cantos redondos, glifo enquanto os bytes não chegam, proporção reservada).

- **O dado.** `Neuronio.resultadoImagem` ({ mime, largura, altura } ou `null`) e a tabela
  `resultados` (Dexie v14, chave `neuronioId`) com os bytes: listar neurônios nunca arrasta
  imagem. `upsertNeuronio(n, resultado?)` grava as duas na mesma transação; sem `resultado` a
  imagem que já estava fica, e `resultadoImagem: null` a apaga. Apagar a ideia ou o livro leva a
  imagem junto. **Vai no backup** (`resultadoImagem` + `resultadoArquivo` em base64); backup
  antigo importa sem imagem, e um arquivo sem os bytes não deixa a ideia apontando para nada.
- **Igual ao link:** só vale junto de "feita", e mudar de estado depois não a apaga. No
  `definirEstado`, `undefined` mantém a imagem, uma nova a troca e `null` a tira. Sem otimismo para
  a imagem (ela ainda vai ser reduzida no Worker); o estado e o link continuam otimistas.
- **A folha de concluir** ganhou o botão da imagem **na mesma linha do link** (a folha não
  cresce: segue cabendo sem rolar em 412×892 e 320×568). Com imagem, o botão mostra a prévia
  (tocar troca) e ganha um "tirar" ao lado. O placeholder do link encurtou para "Link (opcional)",
  para caber ao lado dos botões em 320 px.
- **A tela da ideia feita** mostra uma seção "Resultado" com a imagem inteira, na proporção
  dela (`max-h-96`). O cache da tela (`useImagemDoResultado`) tem o `ultimoToque` na chave: trocar
  a imagem mantém o id da ideia.
- **Verificado** no Chrome (build de produção): concluir com link e uma imagem 60×30 gravou
  estado, link, metadados e bytes; a tela mostra a imagem; reabrir mostra a prévia; tirar apaga
  imagem e bytes e deixa o link; "Deixar de ser executável" para Psicologia (a ideia volta a
  oferecer "Tornar executável"), de volta a um executável (recomeça em "para fazer") e depois
  por "Automático". 582 testes (9 novos de repositório, backup e migração, 4 da folha).
  Não verificado em toque real.
- **A caixa do andamento e a do "Resultado" são iguais e fixas** (07/10/2026, pedido do usuário):
  o botão do estado ("Para fazer", "Fazendo", "Feita") e o "Resultado" têm **128 × 44 px** (`w-32`,
  `CAIXA_DO_ANDAMENTO` em `Neuronio.tsx`), a mesma borda e o mesmo fundo, e o tamanho **não muda com o
  status** (o texto mais longo, "Para fazer" com o ícone, cabe sem cortar). Numa grade de duas
  colunas: o "Resultado" **sob** o andamento, e o "Deixar de ser executável" **à direita** do
  andamento, como era — em 320 px o texto dele quebra em duas linhas. Medido em 320, 412 e 768 px,
  nos três estados.
- **Fora daqui:** mais de uma imagem por ideia, e imagem em ideia que não é executável (o
  resultado só existe em "feita").

## O visor de imagens (07/10/2026)

Pedido do usuário: tocar numa imagem de um neurônio a põe **no meio da tela, com o fundo
desfocado**; com mais de uma imagem (as da pasta, até 8) troca-se **arrastando para o lado ou por
uma seta**. Leitura minha, avisada: "imagem de um neurônio" é a **imagem do resultado** de uma
ideia feita (uma só), e "até 8 imagens" são as da **pasta de acervo**.

- **Onde abre.** Na tela da ideia feita, a imagem do "Resultado" (uma imagem: sem contador nem
  setas). Na tela de um item de imagem da pasta, a imagem inteira: o visor percorre **todas as
  imagens da pasta**, na ordem da grade, começando na tocada. Na grade da pasta, tocar num cartão
  continua abrindo a tela do item — o visor é um toque a mais, dali.
- **O componente** (`components/VisorDeImagens.tsx`): `<dialog>` nativo com `showModal`, como a
  `Folha` (camada do topo, foco preso, tela de baixo inerte). No meio da tela, `object-contain`
  (nada é cortado, retrato ou paisagem), cantos redondos e sombra. O fundo é uma camada
  (`.visor-vidro`) com `backdrop-filter: blur(18px)` e um véu escuro.
- **Trocar de imagem:** arrastar para o lado (a pista acompanha o dedo; passando de 56 px, ou
  soltando rápido — 0,45 px/ms —, troca; menos que isso volta; nas pontas ela só segue 30% do
  dedo, como a folha elástica), as setas ‹ › (a da ponta fica desabilitada), as teclas ← →, e o
  contador "2 / 3" no alto. A conta do gesto é pura e testada (`lib/visor.ts`).
- **Fechar:** o ×, tocar fora da imagem (tocar na imagem não fecha), o Esc e o **voltar do
  Android**: o visor mora na URL (`?ver=<id da imagem>`, `hooks/useVisorNaUrl.ts`). Abrir empilha;
  trocar de imagem **substitui** a entrada (voltar fecha o visor, em vez de passar foto a foto).
  Um `?ver=` que não é de nenhuma imagem (apagada) é visor fechado.
- **Memória:** só a imagem à mostra e as duas vizinhas são desenhadas (a vizinha já está pronta
  quando o dedo chega); as outras não carregam. As imagens vêm do motor pela imagem inteira
  (`lerImagem` / `lerImagemDoResultado`), como as telas de item e de ideia.
- **Armadilha achada: o desfoque não aparecia no build.** O otimizador de CSS (lightningcss)
  **descartava `backdrop-filter`** quando o bloco também tinha `-webkit-backdrop-filter`, e o Chrome só
  entende a propriedade padrão. O mesmo valia para as folhas (`.folha::backdrop`) e o dial: o desfoque
  deles **nunca apareceu** num build de produção. Agora o CSS declara só `backdrop-filter` (o build
  acrescenta o prefixo sozinho), e o visor, as folhas e o dial desfocam de verdade — as folhas
  ficam visivelmente mais desfocadas atrás do que antes. Se um desfoque sumir de novo, olhar o
  CSS gerado (`dist/assets/*.css`), não o fonte.
- **Verificado** no Chrome (build de produção) em 320×568, 412×892 e 1440×900, com uma pasta de 3
  imagens (paisagem e retrato) e uma ideia com imagem de resultado: abre no meio da tela e dentro
  dela; fundo com `blur(18px)`; seta, tecla e arrasto trocam (também além da ponta, sem passar);
  arrasto curto volta; voltar fecha e fica na tela; tocar fora e Esc e × fecham; tocar na imagem não
  fecha; a ideia abre com uma imagem só, sem contador nem setas. Um bug visto no caminho: a
  segunda arrastada era cancelada pelo navegador (`pointercancel`, um arrasto nativo de seleção) —
  resolvido com `user-select: none` no visor. 608 testes. **Não verificado em toque real.**
- **Fora daqui:** zoom por pinça (o zoom da página está travado no app inteiro), e abrir o
  visor direto de um cartão da grade da pasta.

## Ajustes: sem a seção Mapa, e uma luz para os livros e outra para os enfeites (07/10/2026)

Pedido do usuário: tirar a seção "Mapa" de Ajustes e, na seção "Estante", deixar **duas**
opções de luz — a dos livros e a dos enfeites.

- **A seção Mapa saiu**, com a folha de confirmação de "Reorganizar mapa". O motor e a store
  continuam com `reorganizarMapa`, sem chamador na tela; o Mapa se arruma sozinho como sempre.
- **A luz agora tem o 50 no meio** (pedido do usuário, 07/10/2026; **substitui a "lavagem" da
  Fase 17**, em que 42 era o padrão e 0 a cor real). As duas — "Luz dos livros" e "Luz dos
  enfeites" — começam em **50, que mostra as cores reais**. A conta é pura, em
  `core/domain/luz.ts` (`sombraDaLuz`, `brilhoDaLuz`, de 0 a 1), e quem desenha é
  `features/estante/lombadaNoite.ts` (`corNaLuz`):
  | | Abaixo de 50 | Acima de 50 |
  | --- | --- | --- |
  | **Livros** | cada um ganha uma sombra, até 60% de preto no 0 | ficam mais brilhantes, até 32% de uma luz azul-clara no 100 |
  | **Enfeites** | o mesmo, até 60% de preto — **e o fundo da estante também**, até 70% | ficam um pouco mais brancos, até 18% de branco no 100, **sem mexer no fundo** |
- **Só a luz dos enfeites mexe no fundo** (`--mv-sombra-do-fundo` em `.movel-corpo`); a luz dos
  livros nunca. A madeira da estrutura (laterais, tampo, tábuas, base) não muda com nenhuma das duas.
- **A variável CSS virou `--cor-na-luz`** (era `--cor-lavada`). O livro escolhido, erguido ou alvo
  continua usando a cor real (`--base: var(--cor)`): abaixo de 50 isso o "puxa para perto" da sombra;
  acima de 50 ele volta à cor real, um pouco menos brilhante que em repouso. O papel também segue a
  luz agora (a lavagem azul que o isentava saiu).
- **Chaves novas no banco** (`luzDosLivros`, `luzDosEnfeites`, em `meta.preferencias`; sem versão
  nova do Dexie, fora do backup). As antigas (`intensidadeDaLuz`) são **ignoradas**: nelas 0 era a
  cor real, e lido agora viraria sombra máxima. Quem tinha o ajuste volta ao 50. Os nomes no código
  (`intensidadeDaLuz`, `intensidadeDaLuzDoEnfeite`) não mudaram.
- **Na mão** (o fantasma do livro e do enfeite) vale a cor real, sem sombra nem brilho. A **amostra
  do formulário** e as miniaturas das formas usam a luz da peça (a do enfeite, ao editar um
  enfeite), para continuar iguais ao que vai para a prateleira.
- **Escolha minha, avisada:** "a luz dos livros efetivo" foi lida como os **livros de verdade**, em
  oposição aos enfeites. O tom do brilho do livro (azul-claro) e os máximos acima são meus — ficam
  nas constantes do topo de `lombadaNoite.ts`. O branco do enfeite começou em 30% e baixei para 18%
  depois de ver: 30% já deixava o enfeite cinza-claro, mais que "um pouco".
- **Verificado** no Chrome (build de produção) em 412×892, 320×568 e 1440×900: os dois controles em
  50; livros a 0 e a 100 mudam só os livros; enfeites a 0 e a 25 escurecem enfeite e fundo (a 25 no
  meio do caminho) sem tocar nos livros; enfeites a 100 clareiam só o enfeite; sobrevive a recarregar
  e voltar a 50 devolve as cores reais; sem rolagem lateral. 619 testes, tipos, lint e prettier
  limpos. **Não verificado em toque real.**

## O enfeite não muda quando a estante muda (08/10/2026)

Pedido do usuário: ao criar ou reordenar um livro, os enfeites (azuis, com uma listra dourada
embaixo e duas juntas em cima) ficavam só azuis, sem o dourado, ou de um azul diferente.

- **Causa do dourado, reproduzida:** o dourado do enfeite sorteado dependia dos **vizinhos** —
  todo enfeite ao lado de outro enfeite o levava ("grupo"), e o isolado só em 1 de 5. Pôr um livro
  de cada lado de um enfeite (criando ou arrastando) o isolava, e ele perdia os filetes na hora.
  Pior: mover um enfeite que estava isolado **gravava** `dourado: false` no registro dele, e ele
  ficava sem filete para sempre.
- **Agora tudo do enfeite sai do lugar**, e nada dos vizinhos: forma, altura, largura (já era) e
  **os filetes dourados**. Todo enfeite sorteado os leva (`enfeite()` em `prateleiras.ts`); a regra de
  grupo e o 1 em 5 saíram, e `enfeiteDoLugar` não olha mais os lados. **Isto revoga** o "dourado em
  grupo e 1 de 5 isolados" de "A estante no estilo Noite": como quase todo enfeite tinha vizinho
  enfeite, quase todos já o levavam — mudam só os que antes ficavam isolados.
- ~~**O `dourado` gravado é ignorado**~~ **Revisto no mesmo dia** (ver "Editar enfeite: a Forma troca
  os filetes"): o `dourado` gravado voltou a valer, e uma migração (Dexie v15) corrigiu os `false`
  que o bug deixou.
- **O "azul de cor diferente" não reproduzi.** Criar livros, mover livro e mover enfeite, medidos
  (cor, forma, filetes e altura de cada enfeite, antes e depois, em 320, 412 e 1440 px), só mostravam
  a perda do dourado. O que pode ter parecido outro azul: um enfeite que **a pessoa editou** (cor
  ou forma diferentes, detalhes sem o tom escuro) ou a luz dos enfeites fora de 50 em Ajustes. Se
  persistir, preciso saber o que foi feito antes e em qual lugar.
- **Verificado** no Chrome (build de produção): todo enfeite com filetes; dois livros novos deixando
  o enfeite do meio isolado, arrastar um livro e arrastar um enfeite (ele chega com a mesma forma,
  cor, filetes e altura) sem mudar nenhum outro enfeite; recarregar mantém tudo; um enfeite gravado
  com `dourado: false` semeado no banco aparece com os filetes. 619 testes (os de grupo e do 1 em 5
  foram trocados por três que cobrem o enfeite isolado), tipos, lint e prettier limpos. **Não
  verificado em toque real.**

## Editar enfeite: a Forma troca os filetes dourados (08/10/2026)

Pedido do usuário: ao editar um enfeite, os detalhes das linhas douradas do enfeite original
devem poder ser trocados pelos presets que ele escolhe — e, respondido por ele, **os presets são
as próprias opções de "Forma"** (as 10 da tela), só para enfeites (os livros não mudam).

- **Os filetes são da Forma original.** Escolher **outra** Forma tira os filetes dourados e põe os
  detalhes dela (Contorno desenha o retângulo, Ponto o ponto, e assim por diante); **voltar à
  original** traz os filetes de volta. A amostra do formulário faz isso ao vivo
  (`acabamentoDoEnfeite.douradoEm`, a Forma em que os filetes valem), e salvar grava
  `dourado = dourado de antes && Forma escolhida = Forma de antes` (`EditarEnfeite`).
- **Só a cor ou as medidas não tiram os filetes**: um enfeite em Vinho, na Forma original, segue
  dourado. (O azul escuro dos detalhes, `detalheEscuro`, continua indo embora com qualquer troca
  de cor ou Forma, como antes.)
- **Quem já trocou de Forma não ganha os filetes de volta** só por escolher a antiga: o "original"
  é o enfeite como estava ao abrir a edição.
- **`dourado` voltou a ser um dado de verdade**: `enfeiteGravado` desenha o que o registro diz (a
  decisão de ignorá-lo, de horas antes, saiu). Como todo `false` que existia vinha do bug dos
  vizinhos (ver "O enfeite não muda quando a estante muda"), **Dexie v15** põe `dourado: true` em
  todo enfeite já gravado. Um backup de antes de 08/10/2026 pode trazer esses `false` de volta ao ser
  importado — não tratei, porque é raro e o enfeite se edita de novo.
- **Verificado** no Chrome (build de produção) em 412×892, 320×568 e 1440×900: a amostra abre com os
  filetes; Contorno os tira; voltar à Forma original os traz; salvar com Contorno deixa na estante um
  enfeite de contorno sem filetes, o vizinho segue dourado, e reabrir a edição mostra o salvo.
  622 testes (3 novos de amostra e migração, mais o de `montarPrateleiras` reescrito), tipos, lint
  e prettier limpos. **Não verificado em toque real.**

## A imagem inteira não tem fundo nas laterais (08/10/2026)

Pedido do usuário: ao adicionar uma imagem, em pé ou deitada, aparecia um azul mais claro nas
laterais, atrás da foto. Agora aparece só a imagem.

- **Causa:** a caixa da imagem ocupava a largura toda (`w-full`) e tinha a altura limitada
  (`max-h-*`). Com a altura capada, a proporção da caixa deixava de ser a da foto, e o fundo
  `bg-realce` sobrava dos dois lados de toda foto em pé (e do preview do formulário, que punha o
  fundo no próprio `<img>`).
- **Agora a caixa tem a forma exata da imagem** (`lib/caixaDaImagem.ts`, pura e testada):
  `aspect-ratio` da imagem e largura `min(100%, altura máxima × proporção)`. O limite de altura
  passa a valer pela largura, sem deformar, e a caixa — centralizada — nunca é mais larga que a foto.
  `Miniatura` e `ImagemDoResultado` ganharam `alturaMaxima` (a tela do item: `70dvh`; a ideia:
  `24rem`; a edição do item: `18rem`), no lugar do `max-h-*` que os chamadores passavam.
- **O preview do formulário** (imagem recém-escolhida) é só a `<img>` (`max-h-72 max-w-full`,
  centralizada, sem fundo): ali ainda não há medida gravada. Imagem pequena aparece no tamanho dela,
  sem ampliar.
- **Antes de os bytes chegarem**, a caixa reservada (com o ícone) já tem a forma da foto, então
  nada pula.
- **Não mudou:** os cartões da pasta (miniaturas recortadas, `object-cover` em 4:3) e o visor (que
  já mostrava só a imagem, sobre o desfoque).
- **Verificado** no Chrome (build de produção) em 412×892, 320×568 e 1440×900, com imagens deitada
  (800×500), em pé (500×800) e quadrada: na tela do item e na da ideia a caixa tem exatamente a forma
  e o tamanho da imagem (diferença de 0 px); no formulário a prévia sai sem fundo, em pé e deitada.
  625 testes (3 novos), tipos, lint e prettier limpos. **Não verificado em toque real.**

## A Forma vira uma fileira que rola de lado (08/10/2026)

Pedido do usuário: a seção "Forma" da tela de criar/editar livro (e de enfeite) deve se comportar
como a fileira das pontes no espiar do livro — mostra algumas e o resto se vê rolando para a
direita. O nome disso é **rolagem horizontal** (ou carrossel); no código é a classe
`.faixa-rolavel`.

- **Antes:** as 10 Formas numa grade de 2 colunas, 5 linhas de 48 px. **Agora:** uma fileira só,
  cada opção com a miniatura em cima e o nome embaixo (`.forma-opcao`, 80 px), que se arrasta com o
  dedo, sem barra. A quinta opção aparece cortada na borda em 320–412 px: é o aviso de que continua.
  O formulário de livro novo caiu de ~1075 px para ~930 px de altura em 412×892.
- **Rola em toda largura de tela**, não só no celular: `.faixa-rolavel` solta o `overflow-x` a
  partir de 768 px (as pontes cabem), mas as 10 Formas não — a fileira usa `md:overflow-x-auto`.
- **Ao editar, a Forma já escolhida abre no meio da fileira** (um livro de Forma "Bloco" não abre com
  ela escondida além da borda). A conta é no `scrollLeft` da própria fileira, e não um
  `scrollIntoView`, que poderia rolar a página junto. Só no primeiro desenho.
- **Duas armadilhas achadas:** (1) um `<fieldset>` nunca é mais estreito que o conteúdo, e a fileira
  esticava a página em vez de rolar — `min-w-0` no fieldset; (2) os `<input>` invisíveis (`sr-only`,
  posição absoluta) escapavam do corte da fileira e alargavam a página — a fileira é `relative`.
- **Verificado** no Chrome (build de produção) em 412×892, 320×568 e 1440×900: as 10 Formas numa
  fileira que rola; rolar até o fim mostra a última; escolher uma Forma pelo toque no rótulo muda a
  amostra; editar um livro de Forma "Bloco" abre com ela à vista; **sem rolagem lateral na página**.
  625 testes, tipos, lint e prettier limpos. **Não verificado em toque real.**

## Os formulários de livro cabem na tela, e a amostra não move nada (08/10/2026)

Pedido do usuário: as telas de criar livro, editar livro, editar enfeite "etc." devem mostrar todas
as configurações sem rolagem vertical, e as mudanças de largura e altura da amostra não podem
mexer na tela. Honra a regra permanente "mostrar tudo sem deslize vertical".

- **Antes** rolavam em **todos** os tamanhos medidos (930 px numa tela de 892; 928 em 568).
  **Agora** cabem em 412×892, 390×844, 360×640, **320×568**, 1024×768 e 1440×900, em livro novo, pasta,
  livro executável e editar enfeite (`FormularioDeLivro`).
- **Cada configuração é uma seção de duas linhas** (`LinhaDeEscolha`): o **título em cima** — Cor,
  Forma, Largura, Comprimento — com o nome da opção escolhida ao lado ("COR  Vinho"), e as **opções
  embaixo**, numa fileira que rola de lado (ver "A Forma vira uma fileira que rola de lado"), cada
  uma só a figura, com 44 px de toque (a figura tem 34 px). O nome de cada opção segue acessível
  (`sr-only` e `title`). **O tamanho das opções não mudou** (pedido do usuário, mesmo dia: só
  reordenar). A primeira versão deixava o título à esquerda das opções, numa linha de 52 px por
  seção; empilhar custa ~16 px por seção, que em telas baixas (`max-height: 700px`) se recuperam só
  nos espaçamentos (entre seções 12 → 6 px, respiro da fileira 4 → 0 px) — sem tocar em item nenhum.
  Com 2 px de respiro na fileira, 320×568 estoura (+7 a +10 px), então ficou 0. Sem `<fieldset>`, que
  esticava a página (ver a seção acima).
- **A amostra mora numa caixa de tamanho fixo à direita do Nome** (e dos dias, num executável), em
  vez de uma linha sua: altura = o maior comprimento (o "Enorme", 98%) sobre a fileira **medida
  nesta tela**; largura = a da maior (a "Grande", 68 px). A lombada dentro tem as medidas reais da
  estante e cresce para cima, ancorada embaixo. **Trocar largura, comprimento, cor ou forma não muda
  a caixa nem nada em volta.**
- **Em tela muito baixa (`max-height: 600px`) o rótulo "Nome" some**: o placeholder e o `aria-label`
  já dizem o que o campo é, e o formulário executável (que ganha o campo de dias) só cabe assim em
  320×568. O botão de criar fica no pé da tela quando sobra altura (`mt-auto`).
- **A tela de novo item da pasta** (`FormularioDeAnexo`) também estourava em 360×640 e 320×568: a
  prévia da imagem passou a ter no máximo `min(18rem, 28dvh)`, o botão de escolher `min(10rem, 24dvh)`,
  e a legenda ocupa o que sobra (`flex-1`, no lugar de uma altura fixa).
- **Custo assumido:** as opções de cor, forma, largura e comprimento não mostram o nome embaixo; só o
  da escolhida aparece na legenda. Em tela larga (1440 px) as dez Formas já cabem sem rolar.
- **Verificado** no Chrome (build de produção): altura da página igual à da tela nos 6 tamanhos e nos
  4 formulários de livro + os 4 de item; e, para cada um, as **16 combinações de largura × comprimento**
  (mais cor, forma e automático) **sem nenhum deslocamento** das fileiras, do nome, do botão e da altura
  da página, e com a amostra sempre dentro da caixa. 625 testes, tipos, lint e prettier limpos.
  **Não verificado em toque real, nem com o teclado aberto** (o teclado encolhe a tela e aí a
  rolagem volta; o botão continua preso no pé).

## Todo livro tem o ícone da espécie no pé, e Ajustes liga e desliga (08/10/2026)

Pedido do usuário: na tela de criar livro, a pasta mostrava um clipe no preview, mas o livro criado
não o tinha na estante. Todos os livros devem ter o ícone no pé — no preview e na estante — e
Ajustes ganha uma seção para ligar e desligar.

- **Por que o clipe sumia na estante:** `emblemaCabe` só deixava o ícone aparecer se o título, já
  medido, terminasse acima dele. O preview mostra "…" até se digitar, então cabia; com um título de
  verdade quase nunca cabia (a pasta de teste, "Referências, vídeos e fotos de estudo", ficava sem).
- **Agora o espaço é reservado, e o título é que cede:** `geometriaDaLombada` recebe `icone` e sobe
  o fim da zona do título para acima do ícone (`reservaDoIcone`: 7 px de base + 11 do ícone + 2 de
  folga = 20 px; **26 no papel**, onde o ícone sobe para ficar acima da contagem). O corpo do título
  se recalcula nessa zona menor, e o que não cabe vira reticências; a zona nunca passa de 9 px a
  menos. `emblemaCabe` saiu (e seus testes).
- **O ícone é a espécie do livro** (`especieDoLivro`, `core/domain/icones.ts`): o mesmo ícone do
  controle de tipo — **livro aberto**, **martelo** (executável) e **clipe** (pasta). Vale na estante
  (`Lombada`) e na amostra do formulário, que mostra a espécie escolhida e troca ao vivo. O enfeite não
  tem. O fantasma do arrasto continua só com cor e título.
- **Dois casos em que o pé é de outra coisa:** a lombada **feita** (o disco dourado ocupa o pé) fica
  sem ícone, como já ficava sem emblema; e um **emblema que a pessoa escolheu antes de 14/09/2026**
  (estrela, coração…) vale mais que o ícone da espécie — a pasta é a exceção, que sempre mostra o clipe.
- **Ajustes → nova seção "Ícones"**, com um interruptor ("Ícone no pé dos livros"; `components/
  Interruptor.tsx`, `role="switch"`). A preferência é `meta.preferencias.iconesNosLivros` (ligada por
  padrão; sem versão nova do Dexie; fora do backup) e vale na hora, na estante e no formulário.
  **Desligada, a lombada não tem ícone nenhum** e o título volta a usar o pé.
- **Verificado** no Chrome (build de produção) em 412×892, 320×568 e 1440×900, com livro comum,
  executável, pasta, papel e contorno de **título longo**: cada um com o ícone certo a 7 px da base (13
  no papel), dentro da lombada e com o título terminando acima dele; os livros do seed também; o
  interruptor liga e desliga (a amostra do formulário acompanha), recarregar mantém, e Ajustes não ganha
  rolagem lateral. Os formulários continuam cabendo sem rolagem vertical e sem nada se mexer ao trocar
  largura e comprimento. 634 testes (9 novos), tipos, lint e prettier limpos. **Não verificado em toque real.**

## Mostrar tudo sem deslize vertical: as folhas e o andamento (06/10/2026)

Pedido do usuário, sobre os livros executáveis: melhorar de forma geral, e em especial a
folha (bottom sheet) de uma ideia adormecida, que **deve mostrar todo o conteúdo sem
precisar deslizar**. A regra que vale daqui em diante, para qualquer tela ou folha:
**dê sempre preferência a mostrar todo o conteúdo sem deslize vertical.**

### A folha abre inteira quando cabe

`paradasDaFolha(natural, tela)` (`components/paradasDaFolha.ts`, puro, testado) decide as
alturas. **Revoga em parte** "Folhas que se esticam" (05/10/2026), em que a folha abria
**no máximo pela metade** da tela: um conteúdo de 420 px numa tela de 568 px, ou com o
teclado aberto (a janela encolhe, `interactive-widget=resizes-content`), abria em 300 px e
pedia deslize para ser lido.

- **Cabe em 92% da tela:** abre no tamanho do conteúdo — sem esticar, sem rolar.
- **Passa disso:** o de sempre — abre pela metade (piso de 300 px), estica até 92% e rola
  ali dentro. O gesto de esticar e o elástico não mudaram.

### A folha do andamento (`FolhaDeEstado`)

- **O título inteiro**, quebrando em linhas — antes terminava em reticências, e a folha
  existe para mudar o andamento _desta_ ideia.
- **As três opções numa fileira só** (`.segmentado`), e não três linhas de 48 px: a folha
  caiu de 270 para **177 px**, e de 420 para **285 px** com o link da "Feita".
- **O link do resultado sem rótulo à parte** (o placeholder diz "Link do resultado
  (opcional)"; o `aria-label` continua) e campo e botão com 44 px.
- **Medido no navegador, sem rolagem nenhuma** em 320, 390 e 412 px, com título comprido,
  e **também com o teclado aberto** (janela a 55%, 312 px de altura em 320 de largura) —
  o pior caso, que antes rolava 120 px.

Na lista do livro, o título de cada cartão quebra em até **duas linhas** (`line-clamp-2`)
em vez de ser cortado na primeira — vale para livro comum e executável.

### O que não mudou, de propósito

Não criei funcionalidade nova nos executáveis (regra 10 do mestre): o pedido de "melhorar de
forma geral" virou ajuste de tela, não de comportamento. A seção "Adormecidas" continua
recolhida (dois toques para ver e acordar), e a folha do andamento não diz que a ideia está
adormecida nem há quantos dias — sugestão, não implementada.

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
24. ✅ Pastas de acervo — links e imagens como satélites dos conceitos na
    Rede (as 4 etapas; a última em 01/10/2026)
25. ✅ Atualizações aprovadas (30/09/2026) — as 6 feitas (Busca, Porto, Mapa
    partes 1 e 2, Executáveis partes 1 e 2), e os satélites de anexo entre o
    Porto e o Mapa. **Falta o teste conjunto do usuário**, com os ajustes que
    vierem dele
26. ✅ A estante no estilo Noite — paleta de 10 tons, 10 formas de lombada,
    estados do livro executável, enfeites e móvel (06/10/2026)
27. ✅ Enfeites que se definem e se movem — cor, forma e medidas como as de um livro, e
    arrastar com as regras do livro (07/10/2026)
