# Estilos visuais do Locus — A · Papel, D · Marca-texto, E · Padrão

> Documento de referência das três versões de interface desenhadas em mockup (12–13/10/2026).
> **Só a versão E · Padrão está no app** (desde 13/10/2026, como um tema escolhido em Ajustes — ver
> [§12](#12-a-versão-e-no-app)). A e D seguem só como mockup. O app continua, por padrão, no estilo "Noite"
> (o tema **Clássico**), descrito no `CLAUDE.md`.
> Adotar qualquer uma das versões troca paleta, fontes e algumas regras de design do `CLAUDE.md`
> e exige confirmação explícita (ver [Impacto ao implementar](#10-impacto-ao-implementar)).

Mockups (canvas privado "Locus: estilos de livro"): https://claude.ai/artifact/JwfmoSW8n1bmZkYuV6xq2w
— só o dono abre, até compartilhar pelo menu Share da página.

**Versão em PDF (13/10/2026):** `C:\Users\Pichau\Documents\Locus\design\` guarda quatro PDFs com a documentação
completa (fundamentos, tokens, componentes e as 45 telas de cada versão):
`Locus-Design-A-Papel.pdf`, `Locus-Design-D-Marca-texto.pdf`, `Locus-Design-E-Padrao.pdf` e
`Locus-Design-00-Comparativo.pdf`. São fotografias do canvas na data de geração; se o canvas mudar, os PDFs
precisam ser gerados de novo. Este arquivo continua sendo a referência em texto, dentro do projeto.

---

## 1. Escopo e status

| Item                | Situação                                                                                                                                                         |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Versões válidas     | **A · Papel**, **D · Marca-texto**, **E · Padrão**                                                                                                               |
| Versões descartadas | B · Tinta digital e C · Edição. Seguem no canvas (a C foi base de cores da A), mas **não se estendem nem se propõem de novo**                                    |
| Temas               | Cada tela existe em **claro e escuro**, lado a lado na mesma prancha (860 × 844 px; cada celular 390 × 844)                                                      |
| Aplicado ao app     | **A versão E, sim** (tema "Padrão claro" e "Padrão escuro", 13/10/2026). **A e D, não**: são mockups em HTML/CSS                                                 |
| Verificação         | As pranchas foram geradas e publicadas, mas **não foram abertas e conferidas visualmente** pelo assistente. Pode haver cortes ou desalinhamentos pontuais        |
| Textos de exemplo   | Os rótulos de interface (botões, títulos de sheet, frases dos alertas) seguem o app. **Legendas, nomes de neurônios, trechos e números são exemplos inventados** |

---

## 2. Regras de design comuns às três versões

1. **Proximidade entre temas (regra permanente, 12/10/2026).** A pessoa pode trocar de versão sem achar o app
   "totalmente estranho". Por isso a **estrutura** é a mesma nas três: ordem dos elementos, hierarquia, alinhamentos,
   posição dos botões. Muda só o "vestido": paleta, fonte, cantos, espessura de traço e acabamento.
   Ao criar uma tela nova, define-se primeiro a estrutura comum e só depois se veste cada versão. Se uma versão precisar
   divergir na estrutura, aponta-se antes.
2. **Claro e escuro bem definidos** em todas as telas.
3. **A lombada é objeto escuro nas três versões** (paleta Noite de 10 tons, formas e estados idênticos). Muda a prateleira por baixo, não o livro.
4. **Alvo de toque mínimo de 44 px** em botões, chips e linhas.
5. **Mostrar tudo sem deslize vertical** em celular (regra do projeto). As pranchas respeitam em 390 × 844; telas mais baixas (320 × 568) não foram medidas nos mockups.
6. **Sem ouro como sinal de ponte.** A ponte usa o acento de cada versão (terracota/âmbar em A, o próprio azul-marinho/branco em D, azul em E). O dourado `#E8C471` fica só para estado e acabamento da lombada (fazendo, feita, filetes do enfeite).
7. **Conteúdo do neurônio é texto puro** (sem markdown). URLs viram link, sublinhadas.

---

## 3. Anatomia comum (as peças que se repetem)

Todas as telas são montadas com as mesmas peças. A tabela diz como cada versão "veste" cada uma.

| Peça                     | Estrutura (igual nas três)                                                           | A · Papel                                                                   | D · Marca-texto                                                                        | E · Padrão                                                |
| ------------------------ | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **Barra superior**       | 56 px; voltar (ou fechar) à esquerda, ações à direita (buscar, editar, apagar)       | Linha fina embaixo                                                          | Sem linha                                                                              | Sem linha                                                 |
| **Bloco de título**      | Rótulo pequeno, título, subtítulo, marca de cor do livro opcional                    | Rótulo em caixa-alta espaçada, título 28/500 serifado, subtítulo em itálico | Rótulo em caixa-alta, título 32/900 **terminado em ponto**, subtítulo também com ponto | Rótulo 13/600, título 28/700, subtítulo simples           |
| **Linha de lista**       | Título + detalhe, ícone/seta opcional, mín. 56 px                                    | Divisória fina                                                              | Sem divisória, bloco marcado para destaque                                             | Divisória fina                                            |
| **Seção**                | Rótulo + contagem à direita                                                          | Caixa-alta espaçada                                                         | Caixa-alta em negrito                                                                  | 13/600 cinza                                              |
| **Chip / segmentado**    | Opção escolhida preenchida, as outras com contorno                                   | Abas sublinhadas (formulários) ou chips de canto 10                         | Bloco invertido atrás da opção                                                         | Pílula em trilho cinza (formulários) ou chips de canto 12 |
| **Botão principal**      | Largura total, 52 px, cor cheia                                                      | Canto 10, tinta cheia                                                       | Canto 8, bloco cheio, peso 800                                                         | Canto 14, preto/branco, peso 700                          |
| **Botão secundário**     | Contorno de 1 px                                                                     | idem                                                                        | idem (mais grosso nas áreas de formulário)                                             | idem                                                      |
| **Campo de texto**       | Rótulo + texto                                                                       | Linha embaixo / contorno de 1 px, canto 2                                   | Contorno de 2 px, canto 8                                                              | Fundo cinza, canto 14–16, sem borda                       |
| **Bottom sheet**         | Alça, título, conteúdo, ações; fundo escurecido atrás                                | Canto superior 18, linha fina no topo                                       | Canto superior 22                                                                      | Canto superior 26                                         |
| **Botão de criar ("+")** | Canto inferior direito, 56 px                                                        | Círculo, tinta cheia                                                        | **Quadrado de canto 16**                                                               | Círculo com sombra suave                                  |
| **Alerta (snackbar)**    | Faixa invertida (escura no claro, clara no escuro), texto à esquerda, ação à direita | Canto 10, ação em texto sublinhado itálico                                  | Canto 8, ação em bloco marcado                                                         | Canto 16, ação em pílula                                  |
| **Ícones**               | Traço, 20–24 px                                                                      | Traço 1,5                                                                   | Traço 2                                                                                | Traço 1,75                                                |

### Formulário de livro (estrutura comum)

Barra com fechar → linha de tipo (Livro · Executável · Pasta) com o botão de livro deitado à direita → campo Nome com a prévia da lombada ao lado → Cor (10 tons, 5 por linha) → Forma (8 opções) → Largura (Fina, Normal, Grossa, Grande) → Comprimento (Curto, Normal, Alto, Enorme) → botão principal fixo embaixo.
Executável acrescenta "Adormece com 30 dias parada". Enfeite remove tipo e nome e mostra os filetes dourados na prévia.

---

## 4. Versão A · Papel

**Ideia:** caderno/impresso. Fundo morno, serifa, linhas finas, quase nada de sombra.

| Token                                 | Claro                | Escuro            |
| ------------------------------------- | -------------------- | ----------------- |
| Fundo (`bg`)                          | `#E4E0D7`            | `#131312`         |
| Superfície (`surf`, sheets e cartões) | `#EEEBE3`            | `#1B1B19`         |
| Texto (`ink`)                         | `#1B1A17`            | `#F4F0E6`         |
| Texto secundário (`sub`)              | `#5A564E`            | `#ABA69B`         |
| Linha fina (`line`)                   | `#C3BDAF`            | `#34332F`         |
| Linha forte (`line2`)                 | `#9C9689`            | `#56544E`         |
| Acento / ponte (`acc`)                | `#A33A22`            | `#E3B566`         |
| Perigo                                | `#A33A22`            | `#E3735E`         |
| Escurecimento atrás de sheet          | `rgba(27,26,23,.42)` | `rgba(0,0,0,.65)` |

- **Fontes:** Literata (400/500/600 e itálico) para o texto; Source Sans 3 (400/600) em caixa-alta espaçada para rótulos pequenos.
- **Geometria:** botões de ação em **retângulos de canto arredondado** (10–12 px), exceto o "+", que é círculo. Chips de canto 10. Sheets de canto 18.
- **Marca registrada:** divisórias de 1 px, rótulos "Capítulo I / II" nos Ajustes, linhas pontilhadas ligando nome e contagem nas listas, seleção por sublinhado.
- **Prateleira:** linha de 1 px na base de cada prateleira.

---

## 5. Versão D · Marca-texto

**Ideia:** livro marcado com marca-texto. Destaque por **bloco invertido**; títulos pesados terminados em ponto.

| Token                              | Claro                 | Escuro                 |
| ---------------------------------- | --------------------- | ---------------------- |
| Fundo (`bg`)                       | `#FFF5E0`             | `#14153A`              |
| Superfície (`surf`)                | `#FFEFCF`             | `#1D1E4C`              |
| Texto (`ink`)                      | `#081548`             | `#F3F2FB`              |
| Texto secundário (`sub`)           | `#4B5689`             | `#A4A8D2`              |
| Linha (`line`)                     | `rgba(8,21,72,.35)`   | `rgba(243,242,251,.4)` |
| Bloco de destaque (`blk` / `blkt`) | `#081548` / `#FFF5E0` | `#FFFFFF` / `#14153A`  |
| Perigo                             | `#B3261E`             | `#FF8F85`              |
| Escurecimento atrás de sheet       | `rgba(8,21,72,.45)`   | `rgba(3,3,16,.72)`     |

- **Fonte:** Nunito (400/600/800/900).
- **Geometria:** cantos pequenos (2–8 px), "+" em **quadrado de canto 16**, sheets de canto 22, contornos de 2 px.
- **Marca registrada:** título em 900 com ponto final ("Psicologia."), nome do livro e itens importantes sobre bloco invertido, seleção por bloco preenchido, ícones de traço 2.
- **Fundo azul-marinho do escuro:** foi escurecido a pedido do usuário (hoje `#14153A` no fundo e `#1D1E4C` nas superfícies).
- **Prateleira:** linha de 2 px translúcida na base.

---

## 6. Versão E · Padrão

**Ideia:** interface neutra e familiar (cinza-claro/preto), cartões arredondados, botões pretos ou brancos.

| Token                        | Claro                 | Escuro                |
| ---------------------------- | --------------------- | --------------------- |
| Fundo (`bg`)                 | `#F3F3F5`             | `#000000`             |
| Superfície/cartão (`surf`)   | `#FFFFFF`             | `#1B1B1D`             |
| Campo/trilho (`field`)       | `#F1F1F4`             | `#2A2A2E`             |
| Texto (`ink`)                | `#111113`             | `#F5F5F7`             |
| Texto secundário (`sub`)     | `#6E6E75`             | `#9A9AA2`             |
| Linha (`line`)               | `#D9D9DF`             | `#48484D`             |
| Botão cheio (`blk` / `blkt`) | `#111113` / `#FFFFFF` | `#FFFFFF` / `#000000` |
| Acento / ponte (`acc`)       | `#2F6BFF`             | `#3F6FD8`             |
| Perigo                       | `#D92D20`             | `#FF6B61`             |
| Escurecimento atrás de sheet | `rgba(17,17,19,.42)`  | `rgba(0,0,0,.65)`     |

- **Fonte:** Figtree (400/500/600/700).
- **Geometria:** cartões de canto 18, campos de canto 14–16, chips 12, botões 14, "+" em círculo com sombra, sheets de canto 26.
- **Marca registrada:** trilhos segmentados em pílula, cartão branco/cinza sobre o fundo, ícones sem círculo atrás (decisão de 12/10: os sheets perderam os círculos de ícone e as caixas internas para ficarem iguais a A e D).
- **Prateleira:** cada prateleira é um cartão arredondado.
- **Detalhe a alinhar:** nas pranchas mais antigas o acento do escuro aparece como `#6C9BFF` em alguns lugares; nas novas é `#3F6FD8`.

---

## 7. Inventário completo de telas

Arquivos no canvas: `{A|D|E}-<Nome>.dc.html`. Cada um tem claro e escuro lado a lado, exceto onde indicado. São **cerca de 45 pranchas por versão**.

### 7.1 Telas inteiras originais

| Nome                                       | O que mostra                                                                                                                                                                                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ajustes**                                | Números do palácio (livros, neurônios, conexões), prateleiras com − / +, luz dos livros e dos enfeites (faixa com marca no meio), ícones nos livros. _A e D têm pranchas separadas para claro (`Main`/`Ajustes`) e escuro (`Ajustes-escuro`)_ |
| **Estante**                                | Quatro prateleiras com lombadas, barra inferior com busca e contagem, "+"                                                                                                                                                                     |
| **Livro**                                  | Lista de neurônios do livro, com fios que abrem e a seta para o neurônio                                                                                                                                                                      |
| **Neurônio**                               | Cabeçalho com o livro, título, texto com link                                                                                                                                                                                                 |
| **Escrever**                               | Título na barra, seletor de livro ("Automático"), "Quero executar isso", texto, botão de criar                                                                                                                                                |
| **Rede**                                   | Constelação com neurônio selecionado, cartão de resumo, enquadrar e filtros, seletor Rede/Mapa                                                                                                                                                |
| **Mapa**                                   | Ilhas hexagonais com pontes em arco, cartão da ilha, seletor Rede/Mapa                                                                                                                                                                        |
| **Novo livro**                             | Formulário completo (ver §3)                                                                                                                                                                                                                  |
| **Novo livro deitado**                     | O mesmo formulário com o livro na horizontal                                                                                                                                                                                                  |
| **Bottom sheet "Onde guardar?"** (`Folha`) | Automático, três livros e "Criar livro novo" sobre a tela de escrever. _A e D têm prancha separada para claro e escuro; a E tem uma só_                                                                                                       |

### 7.2 Bottom sheets

| Nome                                         | O que mostra                                                                     |
| -------------------------------------------- | -------------------------------------------------------------------------------- |
| **Sheet · Espiar livro**                     | Livro, neurônios, pontes e "Abrir o livro"                                       |
| **Sheet · Ações do livro**                   | Editar livro, Novo neurônio neste livro, Apagar livro (perigo)                   |
| **Sheet · Menu do lugar**                    | Editar o enfeite → Criar um livro aqui → Tirar o enfeite (essa ordem)            |
| **Sheet · Apagar livro**                     | "Apagar “Psicologia”?" com Cancelar e Apagar                                     |
| **Sheet · Andamento da ideia**               | Para fazer / Fazendo / Feita, link, botão de imagem, Concluir                    |
| **Sheet · Filtros da Rede**                  | "Só as pontes" e "Livro em foco"                                                 |
| **Sheet · Escolher livro** (`EscolherLivro`) | Automático, seis livros em duas colunas, Criar livro novo                        |
| **Sheet · Concluir ideia**                   | Andamento em "Feita", link preenchido, miniatura da imagem com botão de tirar    |
| **Sheet · Item da pasta**                    | Miniatura e título do item, Trocar a imagem, Excluir                             |
| **Sheet · Excluir item**                     | Confirmação de excluir a imagem                                                  |
| **Sheet · Ponte do Mapa**                    | "Psicologia e Música", pares de neurônios com percentual                         |
| **Sheet · Filtros do Mapa**                  | "Ver todas as pontes" e a legenda (trilha, ponte, ideia feita, ideia adormecida) |
| **Sheet · Em qual livro executável?**        | Livros executáveis e "Criar livro executável"                                    |
| **Sheet · Deixar de ser executável**         | Automático e livros de conceitos                                                 |

> "Onde guardar?" e "Em qual livro executável?" compartilham o mesmo desenho de escolha de livro.

### 7.3 Alertas

| Nome        | Variações mostradas                                                                                                                                                                                                               |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Alertas** | (1) "Guardado em Programação." com **Mudar**; (2) "Isso acordou “Refatoração”."; (3) "Isso acordou “Refatoração” e mais 2."; (4) erro "A prateleira 2 não tem espaço para esse livro." com ícone de alerta; (5) "Ficou no porto." |

### 7.4 Busca, porto e pastas

| Nome                       | O que mostra                                                                                                                           |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Busca**                  | Campo na barra, chips Por sentido / Palavra exata, resultados com livro, percentual e trecho                                           |
| **Busca sem resultado**    | "Nada encontrado" com sugestão de mudar para Palavra exata                                                                             |
| **Porto**                  | "No porto", dois neurônios com "Guardar em…"                                                                                           |
| **Porto vazio**            | "Tudo guardado"                                                                                                                        |
| **Pasta de acervo**        | Imagens em grade com o "+" e o contador, links em lista com outro "+"                                                                  |
| **Pasta vazia**            | Os dois "+" com contador 8                                                                                                             |
| **Novo item da pasta**     | Seletor Imagem / Link, área de escolher imagem, legenda, Guardar                                                                       |
| **Item da pasta · imagem** | Imagem inteira, legenda como título, "Combina com"                                                                                     |
| **Editar item da pasta**   | Imagem com "Trocar imagem", legenda, Salvar (a edição de **link** é igual, com o campo do endereço no lugar da imagem — não desenhada) |
| **Visor de imagens**       | Fundo desfocado, contador "2 / 3", imagem central, setas para trocar                                                                   |

### 7.5 Ideias executáveis e formulários

| Nome                         | O que mostra                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| **Livro executável**         | Seções Fazendo, Para fazer, Feitas e Adormecidas (recolhida), com o círculo de estado    |
| **Ideia executável (feita)** | Botão de andamento "Feita", "Resultado", "Deixar de ser executável", imagem do resultado |
| **Neurônio no porto**        | Chip "No porto", "Guardar em…", "Tornar executável"                                      |
| **Novo livro · executável**  | Formulário com "Adormece com 30 dias parada" e martelo no pé da lombada                  |
| **Novo livro · pasta**       | Formulário com clipe no pé da lombada                                                    |
| **Editar enfeite**           | Prévia com filetes dourados, sem tipo e sem nome                                         |

### 7.6 Estante e botão de criar

| Nome                            | O que mostra                                                                                                                  |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Estante vazia**               | Prateleiras só com enfeites e "Nenhum livro ainda"                                                                            |
| **Estados da lombada**          | Comum, Escolhido, Com ponte, Papel; Fazendo, Feita, Adormecido, Enfeite; pilha de três deitados, um deitado, um em pé ao lado |
| **Botão de criar · segurando**  | Os três ícones (Ajustes, Rede, Estante) em arco ao redor do botão, cada um com o contorno da versão                           |
| **Botão de criar · escolhendo** | A Rede sob o dedo: ícone preenchido e maior, nome "Rede" aparece à **esquerda** do ícone                                      |

---

## 8. Detalhes que não são óbvios

- **Botão de criar:** o gesto é segurar o botão; aparecem só os ícones. Ao pressionar um deles, o nome aparece à esquerda dele, só daquele. O botão central mostra "X". Ícones: círculo com traço fino (A), quadrado de canto 14 com contorno de 2 px (D), círculo sem borda com sombra (E).
- **Estados da lombada** (iguais nas três):
  - _Ponte_: moldura de 1 px `#7FA8FF`, anel de 3 px a 30% e ponto `#A9C4FF` no topo.
  - _Fazendo_: tira `#E8C471` no topo e ponto.
  - _Feita_: disco `#E8C471` com visto escuro no pé.
  - _Adormecido_: 42–50% de opacidade com névoa azulada.
  - _Escolhido_: sobe 10 px, cor real e sombra.
  - _Enfeite_: sem título, filetes dourados.
  - _Pilha_: livros deitados somam no máximo 90 px de altura (limite fixo do app).
- **Alerta de erro:** ícone de alerta à esquerda em vermelho claro (no claro) ou escuro (no escuro), para ter contraste sobre a faixa invertida.
- **Visor:** é escuro nos dois temas (fundo desfocado com véu escuro); só a moldura e os botões mudam por versão.
- **Textos de apoio inventados nos mockups:** "Link e imagem são opcionais.", "Sem legenda, o item fica só na pasta.", "Trocar a imagem não muda com o que o item combina.", "Sem livro, o neurônio ainda não entra nas pontes.", "Tudo guardado", "Nada encontrado". São sugestões; não estão no app.

---

## 9. O que ainda não foi desenhado

1. **Tela larga** (tablet 768–1023 px e desktop ≥ 1024 px): coluna lateral fixa e sheets como diálogo centralizado. Só existe o celular.
2. **Abrir o livro** (animação do livro saindo da prateleira): é movimento, não uma tela parada.
3. **Edição de link** de item da pasta (igual à de imagem, com o endereço).
4. **Medidas em 320 × 568 e com o teclado aberto** nos mockups novos.
5. **Conferência visual** das pranchas geradas por script (alertas, busca, porto, pastas, sheets, formulários, lombadas, botão de criar).

---

## 10. Impacto ao implementar

Adotar uma das versões mexe em decisões registradas no `CLAUDE.md`. Pontos a decidir antes:

| Ponto                     | Hoje (Noite)                                                    | O que as versões mudam                                                                                                                                                                             |
| ------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Paleta**                | Azul-marinho/Rich Black e a paleta de 10 tons da lombada        | Fundo, superfície, texto e acento passam a ser os da versão (§4–6). A **lombada continua igual**                                                                                                   |
| **Tema claro**            | Platinum derivado da paleta                                     | Cada versão traz seu próprio claro                                                                                                                                                                 |
| **Fontes**                | Source Sans 3 (interface) e Literata (títulos), auto-hospedadas | A reaproveita as duas. **D (Nunito) e E (Figtree) são novas** e precisam ser **auto-hospedadas** (o projeto proíbe CDN de fonte por causa do APK). Os mockups usam Google Fonts só para demonstrar |
| **Ponte**                 | Azul claro em todo o app                                        | A: terracota/âmbar; D: o próprio bloco/branco; E: azul. Decidir se a ponte acompanha o acento da versão                                                                                            |
| **"+" e botões**          | Círculo e botões atuais                                         | D troca o "+" por quadrado de canto 16                                                                                                                                                             |
| **Alertas**               | Faixa invertida com ação "Mudar"                                | Mesma lógica; muda o acabamento da ação                                                                                                                                                            |
| **Divergências pequenas** | —                                                               | Pranchas antigas e novas diferem em detalhes (ex.: raio do botão principal: A 12 → 10, D 14 → 8, E 16 → 14; acento escuro da E). Normalizar numa passada só                                        |

**Sugestão de caminho, quando houver decisão:** escolher uma versão → trocar os tokens CSS (`--sala`, `--parede`, `--papel`, `--poeira`, `--linha`, `--realce`, ponte) → ajustar raios e fontes → revisar tela por tela com o inventário da §7 → só então atualizar o `CLAUDE.md`.

---

## 11. Como o canvas está organizado

Cada versão tem linhas de pranchas separadas, de cima para baixo no canvas:

| Linha                       | Conteúdo                                                                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A: y 0 · D: y 3600          | Ajustes e bottom sheet "Onde guardar?" (pranchas de 390 px, claro e escuro separados)                                                                          |
| A: 4800 · D: 7200 · E: 8400 | Telas originais (Estante, Livro, Neurônio, Escrever, Rede, Novo livro, Mapa, Novo livro deitado). A linha da E inclui também Ajustes e a folha "Onde guardar?" |
| 9600 · 10800 · 12000        | Bottom sheets (A · D · E)                                                                                                                                      |
| 13200 · 14400 · 15600       | Alertas, busca, porto, pasta, novo item, visor, botão de criar, escolher livro, livro executável                                                               |
| 16800 · 18000 · 19200       | Item da pasta, editar item, ideia executável, neurônio no porto, formulários executável/pasta/enfeite                                                          |
| 20400 · 21600 · 22800       | Sheets restantes, telas vazias e estados da lombada                                                                                                            |

Cada prancha de 860 × 844 tem o celular **claro à esquerda** e o **escuro à direita**.

---

## 12. A versão E no app

Implementada em 13/10/2026 como **tema escolhido em Ajustes** (seção "Tema": Clássico · Padrão claro ·
Padrão escuro). O registro técnico completo está no `CLAUDE.md`, seção "Temas: Clássico e Padrão". Em resumo:

- **Clássico** é o estilo de sempre (segue o sistema, claro ou escuro) e continua sendo o padrão.
- **Padrão claro / escuro** são fixos (não seguem o sistema) e usam os tokens da §6, a fonte Figtree
  auto-hospedada, os cantos da versão e a estante em cartões. A lombada é a mesma.
- **Acento:** o das pranchas (`#2f6bff` no claro, `#3f6fd8` no escuro), com o contraste que elas mesmas registram (§ "Cores · contraste").
- **Telas:** foram feitas contra as pranchas (as medidas dos HTML dos mockups). O que o app mostra de outro jeito, e por quê, está em "Onde o Padrão difere da prancha" no `CLAUDE.md`.
- **Botão de criar:** no Padrão, segurar mostra só os ícones em arco — Ajustes em cima, Rede no meio, Estante junto
  da borda — e o nome aparece à esquerda do ícone sob o dedo; o Clássico mantém o anel de cunhas.
- As versões **A e D** continuam não implementadas.
