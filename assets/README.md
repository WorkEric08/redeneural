# Assets — pendente

Esta pasta é o passo 2 do fluxo do `CLAUDE.md` (§8) e está **vazia de propósito**.

Por decisão tomada no início do projeto, as Fases 0–5 (esqueleto, contratos, núcleo
puro, spike de performance no Android, adapters e export/import) rodam sem UI. Os
assets são pedidos **antes da Fase 6 (Estante)**, que é a primeira tela de verdade.

Quando chegar a hora, coloque aqui:

- `referencia-1.png` — referência visual do clima/estética desejada
- `referencia-2.png` — segunda referência, de preferência de outro ângulo (cor, tipografia ou layout)
- `icon.jpg` — a imagem-base do ícone do app

Enquanto isso, o app usa placeholders explícitos:

- paleta neutra do shadcn/ui em `src/index.css` (bloco marcado como PLACEHOLDER)
- ícones PWA gerados por `npm run icons` (`scripts/generate-icons.mjs`)
- cores das lombadas dos livros no seed (`src/features/palacio/seed.ts`)
