# Palácio Mental

PWA offline-first de conhecimento pessoal. Cada **livro** é uma área de conhecimento, cada
**neurônio** é um conceito, e as conexões entre eles nascem sozinhas por significado.
Conexões entre livros diferentes aparecem em dourado.

> Estado: **Fases 0–9 concluídas na parte que dá para verificar aqui** — o fluxo completo funciona de ponta a ponta:
> criar um neurônio embute o texto com o modelo real, calcula a vizinhança e persiste
> as conexões, o palácio inteiro vai e volta num arquivo JSON, e a estante mostra os
> livros como lombadas com os fios dourados que saem deles. O acabamento visual
> (textura, luz, a porta de entrada) fica para uma passada final.

## Rodando

```bash
npm install
npm run dev
```

| Script                  | O que faz                                                     |
| ----------------------- | ------------------------------------------------------------- |
| `npm run dev`           | Servidor de desenvolvimento (5173)                            |
| `npm run build`         | `tsc -b` + build de produção em `dist/`                       |
| `npm run preview`       | Serve o `dist/` — **use este** para testar PWA/service worker |
| `npm run test`          | Vitest                                                        |
| `npm run typecheck`     | `tsc -b`                                                      |
| `npm run lint`          | ESLint (inclui a regra que mantém `src/core` puro)            |
| `npm run format`        | Prettier                                                      |
| `npm run build:android` | Build com o modelo embutido + `cap sync android`              |
| `npm run modelo`        | Só baixa o modelo para `dist/modelos/`                        |

O service worker só existe no build: em `npm run dev` ele está desligado de propósito
(`devOptions.enabled: false`), senão o cache atrapalha o desenvolvimento.

## Estrutura

```
src/
  core/            TypeScript puro — zero DOM, zero Dexie, zero React
    domain/        tipos, id canônico de aresta, codec base64, snapshot
    motor/         o algoritmo de conexões: vetores, fusão, grafo, incremental
    ports/         EmbeddingProvider, RerankProvider, PalacioRepo, ConnectionEngine
  services/
    db.ts          schema Dexie
    repo/          DexieRepo (implementa PalacioRepo) + validação Zod
  services/
    engine/        fachada ConnectionEngine + o Worker do motor
    inferencia/    TransformersEmbedding (o reranker está desligado)
    native/        adapters de plataforma (arquivo hoje; Capacitor depois)
  store/           Zustand, hidratado pela fachada
  pages/           uma por rota: Estante, Livro, Rede, Novo, Neurônio, Editar, Ajustes
  router.tsx       as rotas
  features/
    palacio/       seed de exemplo
  lib/             utils puras
  spike/           página crua de medição dos modelos — não faz parte do app
scripts/           gerador de ícones e lançador do spike
assets/            referências visuais — ainda vazio, ver assets/README.md
```

A dependência aponta sempre para dentro: `services` e `features` importam de `core`, nunca
o contrário. O ESLint quebra o build se alguém importar Dexie, React ou tocar no DOM dentro
de `src/core`.

## Android

O projeto nativo está em `android/` (`appId: com.palaciomental.app`). **Nada é baixado em
tempo de execução:** o runtime ONNX e o modelo de 129 MB viajam dentro do pacote.

```bash
npm run build:android     # tsc + vite (VITE_ANDROID=1) + modelo + cap sync
npx cap open android      # abre no Android Studio
```

Ou, sem abrir o Studio:

```bash
cd android && ./gradlew assembleDebug
```

O APK sai em `android/app/build/outputs/apk/debug/`. Para isso é preciso ter **JDK 21** e o
**Android SDK** instalados — o `build:android` acima não precisa de nenhum dos dois, só o
Gradle precisa.

### O que muda no build do Android

|                        | `npm run build` (web)                 | `npm run build:android`          |
| ---------------------- | ------------------------------------- | -------------------------------- |
| Modelo (129 MB)        | baixado do HuggingFace na 1ª execução | dentro do pacote, em `/modelos/` |
| Runtime ONNX (22,5 MB) | `/assets/`, mesma origem              | idem, mas lido do APK            |
| Service worker         | sim                                   | não — tudo já está em disco      |
| `dist/`                | ~1 MB                                 | ~153 MB                          |

As duas saídas usam a mesma pasta `dist/`, então **rode `npm run build` antes de publicar na
web** se o último comando tiver sido o do Android.

### Exportar backup

Na web é um `<a download>`. Na WebView esse link não faz nada, então o backup vai para
`Directory.Cache` e abre a folha de compartilhamento do Android — o usuário escolhe onde
guardar. Os dois caminhos vivem em `src/services/native/arquivos.ts`.

### Ainda não verificado

O APK nunca foi compilado nem instalado: esta máquina não tem JDK, Android SDK, `adb` nem
Gradle. O que foi verificado no navegador, servindo o `dist/` do build do Android:
o modelo carrega de `/modelos/` sem tocar a rede (`allowRemoteModels: false`) e o palácio
conecta normalmente. Falta medir no aparelho: tempo de carga, inferência por neurônio e o
comportamento do canvas no toque — é a medição da Fase 3 que continua pendente
(`npm run spike`).
