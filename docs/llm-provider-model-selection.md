# Estratégia de seleção de provedor e modelo de LLM

Este documento registra a escolha do provedor e do modelo inicial da primeira integração real do Professor IA do TeaChess. Ele não descreve uma integração implementada nem resultados de testes. A escolha do provedor e do primeiro modelo a implementar está resolvida; a decisão de manter esse modelo ou subir de faixa dependerá da avaliação do fluxo real.

## 1. Estado da decisão

- **Provedor da primeira integração real:** OpenAI.
- **Modelo inicial da primeira implementação:** `gpt-5-mini`.
- **SDK e interface específicos:** ainda não definidos em caráter final.
- **Estratégia prática:** implementar e avaliar primeiro o `gpt-5-mini`, sem comparação extensa prévia nem integração paralela com outros provedores nesta etapa.

A escolha do modelo inicial está resolvida. Isso não significa que o `gpt-5-mini` tenha sido demonstrado como o melhor modelo possível, nem que seja o modelo definitivo do TeaChess. Ele será o primeiro modelo implementado e avaliado no fluxo real.

A OpenAI foi escolhida por uma decisão de engenharia orientada pelas restrições atuais do projeto. Essa escolha não representa uma conclusão de superioridade absoluta sobre Anthropic, Google Gemini ou outras alternativas.

As justificativas principais são:

- prazo limitado para conclusão da segunda etapa;
- necessidade de reduzir a complexidade de integração;
- familiaridade prévia do desenvolvedor com o ecossistema OpenAI;
- uso já estabelecido de ferramentas OpenAI no fluxo de desenvolvimento;
- possibilidade de concentrar o esforço da avaliação em prompting, tools, parâmetros, arquitetura, evals e documentação;
- suporte às capacidades arquiteturais necessárias para o TeaChess.

Essa familiaridade reduz a curva de aprendizado e o tempo de integração, mas não reduz diretamente o preço da API. A assinatura ChatGPT Plus não inclui nem paga o uso da OpenAI API: ChatGPT Plus e OpenAI API são produtos com cobrança separada.

## 2. Provedor e modelo são escolhas diferentes

**Provedor** é a empresa, o serviço ou a infraestrutura que disponibiliza a API ou o ambiente de inferência. Ele influencia autenticação, cobrança, disponibilidade, políticas de dados, SDKs e operação.

**Modelo** é o modelo específico executado pelo provedor ou pela infraestrutura. Ele possui capacidades, limites, custo e comportamento próprios.

Escolher a OpenAI como provedor não escolheu automaticamente um modelo. O `gpt-5-mini` foi definido posteriormente como ponto de partida da primeira implementação. Seu comportamento ainda deverá ser avaliado com os critérios registrados neste documento.

## 3. Estado dos candidatos considerados

### OpenAI — selecionada para os experimentos práticos

A OpenAI será o provedor da primeira integração real. A decisão reduz o número de integrações necessárias nesta etapa e permite concentrar a avaliação nas variáveis internas do fluxo do Professor IA. O `gpt-5-mini` será o primeiro modelo implementado. Ainda deverão ser avaliados no fluxo real seu tool calling, saída estruturada, grounding, qualidade pedagógica, latência, custo e aderência às instruções.

### `gpt-5-mini` — modelo inicial selecionado

O `gpt-5-mini` foi selecionado porque combina:

- baixo custo;
- adequação esperada a tarefas bem definidas e prompts precisos;
- suporte necessário à arquitetura planejada;
- Responses API;
- function calling;
- Structured Outputs;
- integração com o ecossistema OpenAI já escolhido.

Essa adequação é uma expectativa a validar, não um resultado de teste no TeaChess. A seleção define a ordem de implementação, não uma superioridade demonstrada sobre outros modelos.

Preços consultados na documentação oficial em **2026-07-15**:

| Entrada | Entrada em cache | Saída |
| --- | --- | --- |
| US$ 0,25 por 1 milhão de tokens | US$ 0,025 por 1 milhão de tokens | US$ 2,00 por 1 milhão de tokens |

Os preços podem mudar, por isso a data da consulta deve permanecer registrada. Os custos reais do TeaChess serão medidos durante a implementação; os valores acima são preços unitários consultados, não custos reais de produção.

### `gpt-5-nano` — alternativa considerada

O `gpt-5-nano` possui custo significativamente menor e suporta function calling e Structured Outputs. Ele foi considerado, mas não foi escolhido como modelo inicial porque seu posicionamento é mais orientado a tarefas como sumarização e classificação, enquanto o Professor IA também exige interpretação, explicação pedagógica, grounding e decisões sobre uso de tools.

Isso não significa que o modelo seja incapaz de executar o Professor IA: ele não foi testado no TeaChess. O `gpt-5-nano` permanece como possível alternativa futura para subtarefas mais simples.

Preços consultados na documentação oficial em **2026-07-15**:

| Entrada | Entrada em cache | Saída |
| --- | --- | --- |
| US$ 0,05 por 1 milhão de tokens | US$ 0,005 por 1 milhão de tokens | US$ 0,40 por 1 milhão de tokens |

### `gpt-5.4-mini` — alternativa de faixa superior considerada

O `gpt-5.4-mini` foi considerado como possível próximo nível de capacidade. Ele suporta Responses API, function calling e Structured Outputs, mas não será usado inicialmente porque possui custo superior sem que essa necessidade tenha sido demonstrada.

Preços consultados na documentação oficial em **2026-07-15**:

| Entrada | Entrada em cache | Saída |
| --- | --- | --- |
| US$ 0,75 por 1 milhão de tokens | US$ 0,075 por 1 milhão de tokens | US$ 4,50 por 1 milhão de tokens |

O `gpt-5.4-mini` poderá ser considerado futuramente somente se a avaliação real demonstrar que o modelo inicial não atinge os requisitos mínimos. Não há resultado que prove que ele seja melhor para o TeaChess.

### Anthropic — fora do escopo prático desta etapa

A Anthropic continua sendo uma alternativa tecnicamente válida. Não será incluída nos experimentos práticos desta etapa por restrição de tempo e escopo, e não foi descartada por incapacidade técnica.

### Google Gemini — fora do escopo prático desta etapa

O Google Gemini continua sendo uma alternativa tecnicamente válida. Não será incluído nos experimentos práticos desta etapa por restrição de tempo e escopo, e não foi descartado por incapacidade técnica.

### Ollama / modelo local — fora da comparação prática inicial

Ollama ou outra infraestrutura de modelo local continua sendo uma alternativa arquitetural, mas não será incluída na comparação prática inicial. Os motivos são:

- necessidade de infraestrutura adicional para servir o modelo ao TeaChess hospedado na Vercel;
- um modelo executado apenas em `localhost` não fica automaticamente acessível ao deployment;
- a complexidade operacional adicional não é prioritária para os objetivos atuais da avaliação.

Essa alternativa não foi descartada por incapacidade técnica. Uma avaliação futura ainda precisaria considerar hardware, hospedagem, segurança, disponibilidade, latência e operação, sem confundir ausência de cobrança por token de um provedor local com custo operacional zero.

## 4. Princípio de custo

Custo não é apenas mais um critério secundário. Ele é uma premissa central do TeaChess.

A pergunta de engenharia passa a ser:

> **Qual é o modelo de menor custo que atende satisfatoriamente aos requisitos do Professor IA?**

O objetivo não é selecionar o modelo mais poderoso disponível. Modelos premium de maior custo não serão incluídos inicialmente. Um modelo mais caro somente deverá ser considerado se modelos mais econômicos não atingirem os requisitos mínimos.

Essa premissa não significa escolher automaticamente o menor preço nominal. A comparação deverá considerar o custo necessário para produzir uma interação bem-sucedida, incluindo eventuais repetições, falhas de schema, tool calls desnecessárias, tamanho de entrada e saída e capacidade de concluir o fluxo com qualidade suficiente.

## 5. Critérios mínimos do modelo

Para ser considerado adequado, um modelo deverá demonstrar:

- qualidade pedagógica suficiente;
- aderência ao system prompt;
- grounding satisfatório;
- capacidade adequada de structured output;
- uso correto de tools;
- tratamento apropriado de dados insuficientes;
- latência aceitável;
- custo compatível com a premissa do projeto.

Os valores numéricos finais, rubricas, pesos e limites de aprovação ainda não estão definidos. Eles deverão ser estabelecidos antes da interpretação dos resultados para evitar favorecer retrospectivamente um candidato.

## 6. Matriz histórica de alternativas consideradas

A matriz abaixo preserva o registro inicial das alternativas. Ela não representa o escopo atual dos experimentos: somente a OpenAI permanece ativa na comparação prática desta etapa. As demais colunas documentam candidatos tecnicamente considerados, mas retirados do escopo prático pelas restrições já descritas.

| Critério | OpenAI — ativa | Anthropic — fora do escopo prático | Gemini — fora do escopo prático | Ollama/local — fora da comparação inicial |
| --- | --- | --- | --- | --- |
| Qualidade pedagógica | A verificar para cada modelo testado | Não medida; alternativa tecnicamente válida | Não medida; alternativa tecnicamente válida | Não medida; depende do modelo e da infraestrutura |
| Aderência ao system prompt | A verificar para cada modelo testado | Não medida | Não medida | Não medida |
| Tool calling | Avaliar suporte e comportamento real do modelo | Capacidade não descartada; sem teste nesta etapa | Capacidade não descartada; sem teste nesta etapa | Depende do modelo e da camada de integração |
| Saída estruturada | Avaliar suporte e aderência real ao schema | Capacidade não descartada; sem teste nesta etapa | Capacidade não descartada; sem teste nesta etapa | Depende do modelo e da camada de integração |
| Grounding | A verificar por experimento | Não medido | Não medido | Não medido |
| Segurança | A verificar por experimento | Não medida | Não medida | Não medida; operação da infraestrutura também importaria |
| Latência | Medir chamada básica e ciclos com tools | Não medida | Não medida | Dependeria de hardware, rede e topologia de deploy |
| Custo | Medir uso real dos modelos economicamente viáveis | Não medido | Não medido | Sem cobrança por token do provedor local, mas com custos de hardware, energia, hospedagem e operação |
| Facilidade de integração | Favorecida no recorte atual pela familiaridade existente; integração real ainda não executada | Não testada nesta etapa | Não testada nesta etapa | Exigiria integrar e operar a inferência |
| Privacidade | API externa; políticas concretas ainda deverão ser verificadas | API externa; não avaliada nesta etapa | API externa; não avaliada nesta etapa | Dependeria da configuração, dos logs e do acesso à infraestrutura |
| Deploy | Serviço externo acessível pelo servidor; compatibilidade concreta ainda deverá ser verificada | Não avaliado nesta etapa | Não avaliado nesta etapa | `localhost` não atende à Vercel; exigiria inferência hospedada ou demonstração local |

Nenhuma célula da matriz deve ser interpretada como resultado de teste. Ela combina características arquiteturais conhecidas e itens ainda pendentes de evidência.

## 7. Estratégia escalonada de avaliação do modelo

A estratégia seguirá uma progressão pragmática orientada à suficiência:

1. implementar o `gpt-5-mini`;
2. avaliar seu comportamento no fluxo real;
3. medir qualidade, grounding, structured output, tool calling, latência e custo;
4. manter o modelo se ele atingir os requisitos mínimos;
5. considerar um modelo de faixa superior apenas se houver deficiência relevante demonstrada.

```text
gpt-5-mini
→ atende aos critérios mínimos?
  → sim: manter o modelo
  → não: considerar o próximo nível de capacidade
```

Não haverá comparação extensa de modelos antes da implementação. O modelo mais barato absoluto não foi escolhido automaticamente, pois preço nominal não comprova suficiência para todo o fluxo. O modelo mais poderoso também não será escolhido automaticamente, pois capacidade adicional pode não justificar seu custo. A avaliação será pragmática e orientada à suficiência, mantendo a pergunta:

> **Qual é o modelo de menor custo que atende satisfatoriamente aos requisitos do Professor IA?**

## 8. Estratégia experimental

### Decisão de provedor

Resolvida por restrições concretas do projeto: **OpenAI**.

Não será feita integração paralela com vários provedores. A decisão não depende de uma comparação científica entre todas as alternativas e não afirma superioridade objetiva da OpenAI.

### Decisão de modelo

O modelo inicial está resolvido: será o `gpt-5-mini`. Permanece pendente de avaliação real decidir se ele deverá ser mantido ou se uma deficiência relevante justifica subir de faixa.

Não serão testados modelos premium inicialmente nem haverá subida de faixa apenas para obter a maior qualidade absoluta. Uma alternativa mais cara somente entrará na avaliação diante de necessidade demonstrada porque o `gpt-5-mini` não alcançou requisitos mínimos relevantes.

### Fases de avaliação

#### Fase A — chamada básica

Sem tools, avaliar:

- qualidade pedagógica;
- latência;
- custo;
- aderência ao system prompt;
- grounding e tratamento de dados insuficientes.

#### Fase B — saída estruturada

Avaliar:

- aderência ao schema;
- estabilidade entre execuções;
- tratamento de campos e dados ausentes.

#### Fase C — tool calling

Avaliar:

- seleção da tool correta;
- validade dos argumentos;
- chamadas necessárias e desnecessárias;
- comportamento após erro;
- custo e latência dos ciclos adicionais.

Cada fase deverá usar casos, prompts, schemas, configurações e rubricas versionados. Resultados somente poderão ser registrados após a execução real dos experimentos.

## 9. Registro e revisão das alternativas

Os modelos inicialmente registrados são `gpt-5-mini`, `gpt-5-nano` e `gpt-5.4-mini`, com papéis diferentes nesta estratégia. O primeiro será implementado; os demais são alternativas consideradas, não uma fila obrigatória de testes.

Antes de qualquer implementação ou avaliação futura, a documentação oficial vigente da OpenAI deverá ser consultada novamente. Identificação exata, versão ou alias usado, capacidades exigidas e preço vigente deverão permanecer datados. Estar registrado como alternativa não implica aprovação nem resultado favorável.

Um modelo de faixa superior somente deverá ser avaliado se os resultados demonstrarem que o `gpt-5-mini` não atinge os critérios mínimos.

## 10. Decisões pendentes

### Resolvidas

- [x] provedor da primeira integração real: OpenAI;
- [x] primeiro provedor dos experimentos: OpenAI;
- [x] modelo inicial da primeira implementação: `gpt-5-mini`;
- [x] não realizar integração paralela com vários provedores nesta etapa.

### Ainda pendentes

- [ ] parâmetros iniciais;
- [ ] reasoning effort ou configuração equivalente;
- [ ] limite de saída;
- [ ] orçamento máximo;
- [ ] limite de custo aceitável por interação;
- [ ] schema final;
- [ ] tools finais;
- [ ] critérios quantitativos de aprovação;
- [ ] decisão de permanecer no `gpt-5-mini` ou subir de faixa após avaliação real.

Também continuam pendentes os detalhes concretos de SDK e instrumentação, que pertencem à futura implementação e não são definidos por esta decisão de modelo.

## 11. Riscos metodológicos

- Tratar a escolha de engenharia do provedor como prova de superioridade técnica distorceria a decisão.
- Comparar prompts ou configurações diferentes entre modelos pode distorcer resultados.
- Executar apenas um teste por caso pode ser insuficiente por causa da variabilidade.
- Custo menor não significa automaticamente melhor custo-benefício.
- Modelo maior não significa necessariamente melhor para o fluxo.
- Tool calling precisa ser avaliado separadamente da qualidade textual.
- Alterar critérios depois de observar resultados pode favorecer um candidato.
- Resultados devem ser registrados com data, modelo e configuração.

Para reduzir esses riscos, prompts, casos, schemas, tools conceituais, parâmetros e rubricas deverão ser versionados. Exceções e adaptações por modelo também deverão aparecer no registro do experimento.

## 12. Limites desta etapa

Nenhum teste com provedor ou modelo foi executado para este documento. Não foram instalados SDKs, criadas variáveis de ambiente ou implementadas chamadas de LLM. O `gpt-5-mini` foi escolhido somente como modelo inicial; não foi testado no TeaChess, não foi demonstrado como superior ao `gpt-5-nano` ou ao `gpt-5.4-mini` e não é tratado como modelo definitivo. Custos reais, latências, qualidade e aderência ainda não medidos permanecem explicitamente como itens a verificar durante a implementação e a avaliação.
