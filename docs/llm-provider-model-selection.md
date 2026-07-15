# Estratégia de seleção de provedor e modelo de LLM

Este documento registra a escolha do provedor da primeira integração real do Professor IA do TeaChess e define como o modelo será selecionado futuramente. Ele não descreve uma integração implementada nem resultados de testes. A escolha do provedor está resolvida; a escolha do modelo continua pendente de experimento.

## 1. Estado da decisão

- **Provedor da primeira integração real:** OpenAI.
- **Modelo:** ainda não escolhido.
- **SDK e interface específicos:** ainda não definidos em caráter final.
- **Estratégia prática:** comparar um pequeno conjunto de modelos OpenAI economicamente viáveis, sem integração paralela com outros provedores nesta etapa.

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

Escolher a OpenAI como provedor não escolhe automaticamente um modelo. Os modelos OpenAI específicos somente serão definidos após consulta à documentação vigente e experimentos com os critérios registrados neste documento.

## 3. Estado dos candidatos considerados

### OpenAI — selecionada para os experimentos práticos

A OpenAI será o provedor da primeira integração real. A decisão reduz o número de integrações necessárias nesta etapa e permite concentrar a avaliação nas variáveis internas do fluxo do Professor IA. Ainda deverão ser avaliados, para cada modelo candidato, tool calling, saída estruturada, grounding, qualidade pedagógica, latência, custo e aderência às instruções.

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

## 7. Estratégia escalonada de seleção de modelo

A seleção seguirá uma progressão orientada a custo:

1. começar com um modelo econômico plausível para o fluxo;
2. avaliá-lo contra os critérios mínimos;
3. somente subir para uma faixa de maior capacidade se necessário.

```text
modelo econômico
→ atende aos critérios mínimos?
  → sim: candidato forte
  → não: testar próximo nível de capacidade
```

O modelo mais barato não vence automaticamente, pois pode falhar nos requisitos e gerar repetições ou respostas inutilizáveis. O modelo mais poderoso também não vence automaticamente, pois capacidade adicional pode não justificar seu custo no fluxo real. A decisão será baseada em custo-benefício.

## 8. Estratégia experimental

### Decisão de provedor

Resolvida por restrições concretas do projeto: **OpenAI**.

Não será feita integração paralela com vários provedores. A decisão não depende de uma comparação científica entre todas as alternativas e não afirma superioridade objetiva da OpenAI.

### Decisão de modelo

Continua pendente de experimento. Será comparado apenas um pequeno conjunto de modelos OpenAI economicamente viáveis, cujos nomes e versões ainda não foram escolhidos.

Não serão testados modelos premium apenas para descobrir se produzem respostas melhores. Modelos mais caros somente entrarão na avaliação se houver necessidade demonstrada porque os candidatos econômicos não alcançaram os requisitos mínimos.

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

## 9. Seleção dos candidatos antes dos experimentos

Não há lista definitiva nem IDs de modelos registrados nesta etapa. Antes dos experimentos, a documentação oficial e vigente da OpenAI deverá ser consultada.

A seleção inicial deverá privilegiar modelos economicamente viáveis que suportem as capacidades necessárias. Para cada candidato, deverão ser registrados data, identificação exata, versão ou alias usado, capacidades exigidas, preço vigente consultado e justificativa de inclusão. Estar na lista de teste não implica aprovação final.

Um modelo de faixa superior somente deverá ser adicionado se os resultados demonstrarem que os candidatos econômicos não atingem os critérios mínimos.

## 10. Decisões pendentes

### Resolvidas

- [x] provedor da primeira integração real: OpenAI;
- [x] primeiro provedor dos experimentos: OpenAI;
- [x] não realizar integração paralela com vários provedores nesta etapa.

### Ainda pendentes

- [ ] modelos OpenAI específicos;
- [ ] orçamento máximo dos experimentos;
- [ ] limite de custo considerado aceitável;
- [ ] número de casos;
- [ ] métricas e pesos;
- [ ] nível mínimo de qualidade necessário para aprovação de um modelo;
- [ ] parâmetros;
- [ ] política de repetição;
- [ ] critério final de escolha.

Também continuam pendentes os detalhes concretos de SDK, interface da API, schemas e instrumentação, que pertencem à futura implementação e não são definidos por esta decisão de provedor.

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

Nenhum teste com provedor ou modelo foi executado para este documento. Não foram instalados SDKs, criadas variáveis de ambiente ou implementadas chamadas de LLM. Nenhum modelo OpenAI específico foi escolhido. Custos, latências, qualidade e aderência ainda não medidos permanecem explicitamente como itens a verificar por experimento.
