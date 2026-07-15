# Experimentos de LLM do TeaChess

Este documento registra somente resultados realmente observados em execuções da integração técnica de LLM do TeaChess. Ele não contém estimativas, resultados inventados nem generalizações para casos que não foram executados. Quando uma medição não foi realizada, ela permanece explicitamente ausente.

As rotas usadas nestes experimentos são técnicas, isoladas e temporárias. Elas não estão conectadas à interface do Professor IA e não representam a integração final do produto. O schema estruturado também permanece uma hipótese inicial, não um contrato definitivo.

## E-001 — chamada textual mínima

### Objetivo

Validar a conectividade server-side entre o TeaChess e a OpenAI.

### Configuração executada

- **Endpoint:** `POST /api/ai/test`;
- **modelo:** `gpt-5-mini`;
- **API:** Responses API;
- **tools:** não utilizadas;
- **Structured Outputs:** não utilizados;
- **streaming:** não utilizado;
- **entrada:** “Responda apenas com uma saudação curta.”

### Resultado observado

- HTTP `200`;
- `success: true`;
- `model: "gpt-5-mini"`;
- `response: "Olá!"`;
- aproximadamente 5,5 segundos observados no servidor de desenvolvimento.

### O que esta execução comprovou

No ambiente local e para esta chamada, o experimento comprovou:

- carregamento de `.env.local`;
- acesso server-side a `OPENAI_API_KEY`;
- autenticação e permissão da chave;
- funcionamento do SDK;
- funcionamento da Responses API;
- extração de `response.output_text`;
- retorno do contrato JSON do TeaChess.

Custo e quantidade de tokens não foram registrados porque não foram medidos.

## E-002 — Structured Outputs

### Objetivo

Validar a aderência da resposta a um schema estruturado.

### Configuração executada

- **Endpoint:** `POST /api/ai/test/structured`;
- **modelo:** `gpt-5-mini`;
- **API:** Responses API;
- **implementação:** `responses.parse(...)`, `zodTextFormat(...)`, `response.output_parsed` e schema Zod provisório;
- **tools:** não utilizadas;
- **entrada:** “Dados disponíveis: joguei de brancas e perdi após deixar a dama ameaçada no lance 12. Não há PGN, FEN nem análise de engine.”

### Resultado observado

- `success: true`;
- `model: "gpt-5-mini"`;
- todos os campos do schema foram retornados;
- os campos definidos como arrays foram retornados como arrays;
- `evidenceStatus` foi retornado como `"insufficient"`;
- `limitations` mencionou corretamente a ausência de PGN, FEN e análise de engine;
- a resposta não indicou um melhor lance nem descreveu uma posição concreta inexistente.

Latência, custo e quantidade de tokens não foram registrados porque não foram medidos neste teste.

### Principal observação crítica de grounding

O campo `strengths` recebeu a frase:

> “O jogo chegou ao lance 12, indicando alguma continuidade da abertura/mediado de jogo.”

Essa frase é uma inferência fraca. Os dados fornecidos não apresentavam claramente um ponto forte, portanto o array poderia ter permanecido vazio. O resultado não representa falha do schema: o campo existiu e respeitou o tipo esperado. Ele representa uma limitação de grounding e prompting, pois uma estrutura correta não garante conteúdo correto.

Algumas recomendações também foram genéricas, embora coerentes com a quantidade limitada de informação disponível.

## E-003 — execução do caso EV-001 com o prompt v1

### Configuração executada

- **caso de avaliação:** `EV-001`;
- **conjunto de evals:** `professor-ia-evals-v1`;
- **modelo:** `gpt-5-mini`;
- **prompt:** `professor-ia-v1`;
- **schema:** `provisional-teacher-response-v1`;
- **endpoint:** `POST /api/ai/test/structured`;
- **execução:** 1 de 1;
- **tools:** não utilizadas;
- **entrada:** “Dados disponíveis: joguei de brancas e perdi após deixar a dama ameaçada no lance 12. Não há PGN, FEN nem análise de engine.”

### Resultado observado

- HTTP `200`;
- `success: true`;
- `strengths` retornou `[]`;
- `evidenceStatus` retornou `"insufficient"`;
- não houve indicação de melhor lance;
- não houve invenção de posição concreta;
- o fato de chegar ao lance 12 não foi transformado em ponto forte;
- `limitations` mencionou a ausência de PGN e FEN;
- `evidenceUsed` preservou os fatos fornecidos;
- o tempo observado no servidor de desenvolvimento foi de aproximadamente 18,9 segundos.

Tokens e custo não foram registrados porque não foram medidos.

### Classificação

- **objetivo central do EV-001:** aprovado;
- **rubrica completa:** parcialmente aprovada.

O objetivo central foi aprovado porque a falha real observada anteriormente em `strengths` foi corrigida: sem evidência explícita de ponto forte, o campo retornou vazio.

A rubrica completa foi apenas parcialmente aprovada porque a ausência de análise de engine não foi mencionada explicitamente em `limitations`, embora aparecesse nos dados e em `evidenceUsed`; surgiu uma recomendação condicional sobre estar com pouco tempo, apesar de essa informação não ter sido fornecida; e algumas recomendações permaneceram genéricas.

Não houve falha estrutural. Os pontos restantes são de grounding e de proporcionalidade das recomendações. Como houve somente uma execução, este resultado não comprova estabilidade.

### Comparação com E-002

#### E-002 — instrução técnica temporária

`strengths` recebeu uma inferência fraca:

> “O jogo chegou ao lance 12...”

#### E-003 / EV-001 — professor-ia-v1

`strengths` retornou vazio.

Nesta execução, o prompt v1 corrigiu o problema específico que motivou sua criação. O resultado isolado não permite afirmar que a correção seja estável em todas as execuções.

## E-004 — primeira tentativa do EV-002 inconclusiva

### Configuração executada

- **caso de avaliação:** `EV-002`;
- **conjunto de evals:** `professor-ia-evals-v1`;
- **modelo:** `gpt-5-mini`;
- **prompt:** `professor-ia-v1`;
- **schema:** `provisional-teacher-response-v1`;
- **endpoint:** `POST /api/ai/test/structured`;
- **execução:** primeira tentativa.

### Resultado observado

- HTTP `502`;
- contrato retornado com `success: false` e `code: "provider_error"`;
- tempo observado de aproximadamente 33,0 segundos;
- o log disponível naquele momento mostrou status indefinido;
- nenhum output estruturado foi produzido;
- não havia resposta do modelo para avaliar.

### Classificação

Esta execução foi classificada como **inconclusiva**: não foi aprovada nem reprovada. Sem uma resposta do modelo, o evento não permite avaliar nem atribuir falha ao modelo, ao prompt, ao schema ou ao caso. O registro disponível também não permite afirmar a causa exata do erro.

Depois desse evento, foi implementado um diagnóstico server-side seguro para distinguir erros HTTP, erros de conexão, timeouts e erros inesperados. A resposta pública permanece genérica, e o diagnóstico não expõe dados sensíveis.

## E-005 — segunda tentativa do EV-002 com o prompt v1

### Configuração executada

- **caso de avaliação:** `EV-002`;
- **conjunto de evals:** `professor-ia-evals-v1`;
- **modelo:** `gpt-5-mini`;
- **prompt:** `professor-ia-v1`;
- **schema:** `provisional-teacher-response-v1`;
- **endpoint:** `POST /api/ai/test/structured`;
- **execução:** segunda tentativa;
- **tools:** não utilizadas;
- **entrada:** “Dados disponíveis: ganhei uma torre com um garfo no lance 10, mas no lance 18 deixei minha dama sem proteção e ela foi capturada. Não há PGN nem FEN.”

### Resultado observado

- HTTP `200`;
- `success: true`;
- `promptVersion: "professor-ia-v1"`;
- `schemaVersion: "provisional-teacher-response-v1"`;
- `evidenceStatus: "partial"`;
- `strengths` mencionou o garfo e o ganho da torre;
- `improvements` mencionou a perda da dama sem proteção;
- `evidenceUsed` preservou somente os fatos fornecidos;
- `limitations` mencionou a ausência de PGN e FEN;
- não foram inventadas as peças que participaram do garfo;
- não foram inventados lances intermediários;
- não foi inventada posição concreta, avaliação de engine ou melhor lance;
- o tempo observado no servidor de desenvolvimento foi de aproximadamente 27,4 segundos.

Tokens e custo não foram registrados porque não foram medidos.

### Classificação

O `EV-002` foi **aprovado integralmente nesta execução**. O modelo separou corretamente um fato positivo explícito de um erro explícito, e as interpretações foram apresentadas de forma proporcional às evidências disponíveis.

Esta aprovação descreve somente a segunda tentativa. Uma execução aprovada não demonstra estabilidade geral do modelo, do prompt ou do fluxo.

## Conclusão metodológica

Com base exclusivamente nas execuções registradas:

- a integração de Structured Outputs foi validada;
- a aderência ao schema provisório foi validada neste caso;
- o parsing com Zod foi validado;
- o conteúdo factual e pedagógico obteve resultados distintos por caso: aprovação parcial da rubrica completa no `EV-001` e aprovação integral da execução posterior do `EV-002`;
- prompting, grounding, tools e evals continuam necessários.

Uma única execução não demonstra estabilidade nem permite generalizar a aderência estrutural ou a qualidade semântica para todas as respostas. O schema continua sendo uma hipótese inicial; não há tools implementadas nestes experimentos, validação factual completa ou integração com o Professor IA real.
