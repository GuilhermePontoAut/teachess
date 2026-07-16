# Tools do Professor IA: contrato inicial de `get_position_context`

Este documento registra a investigação da Etapa 6A, a implementação determinística da Etapa 6B e o fluxo técnico de function calling da Etapa 6C-A. `get_position_context` possui schemas, runtime interno, definição compatível com a Responses API e um orquestrador testado sem rede. A Tool continua sem integração com a interface real do Professor IA, e nenhuma chamada ao provedor foi feita na Etapa 6C-A.

## 1. Classificação das definições

### Decisões adotadas

- `get_position_context` será a primeira Tool candidata do Professor IA.
- A Tool poderá consultar somente o snapshot mínimo da posição específica selecionada e autorizada pela aplicação para aquela requisição.
- O argumento inicial recomendado é apenas `positionContextId`, validado contra o único snapshot autorizado.
- FEN, confirmação, origem e demais fatos não serão aceitos como argumentos produzidos pelo modelo.
- Presença, validade, aceitação pela biblioteca, confirmação da origem e suficiência para análise serão estados separados.
- Quando nenhuma posição estiver selecionada, a definição de `get_position_context` preferencialmente não será disponibilizada ao modelo.
- Toda execução bem-sucedida terá um snapshot autorizado; tentativa de execução sem esse snapshot retornará `SNAPSHOT_MISSING`, nunca um sucesso que represente ausência de contexto.
- O contrato será implementado e testado deterministicamente antes de qualquer registro em function calling.

### Hipóteses iniciais

- O frontend normalizará `UploadedPosition` para um snapshot menor, próprio da integração de servidor.
- A futura implementação usará `validateFen` e/ou a construção de `Chess` do `chess.js` 1.4.0 para registrar se o FEN é aceito pela biblioteca.
- O resultado poderá usar os estados candidatos descritos neste documento; nomes e limites serão congelados somente na etapa de implementação e testes.
- Enquanto não houver um campo explícito de confirmação, o estado seguro será `not_recorded`, nunca `confirmed` por inferência.

### Alternativas consideradas

- Tool sem argumentos, vinculada implicitamente ao único snapshot da requisição.
- Tool com `positionContextId`, vinculada ao mesmo snapshot, mas com verificação explícita de correspondência.
- Enviar a posição completa diretamente ao modelo, sem recuperá-la por Tool.
- Enviar todo o estado da store ou todo o `localStorage`, alternativa descartada por violar minimização e isolamento entre posições.

### Decisões ainda pendentes após a Etapa 6B

- A futura adição de um campo explícito de confirmação ao modelo de dados.
- Se o contexto principal continuará sendo recuperado por Tool depois de medições de latência, custo e auditabilidade.
- Autenticação, autorização verificável e recuperação a partir de uma fonte confiável de servidor.

### Fora do escopo atual

- executar chamadas reais de function calling contra a OpenAI;
- implementar `get_legal_moves`;
- usar Stockfish ou qualquer engine;
- usar RAG;
- conectar o Professor IA à interface;
- criar banco de dados, autenticação ou backend de produto;
- alterar a persistência atual;
- criar ou alterar prompts, evals existentes ou o schema de resposta final.

## 2. Função interna e Tool não são a mesma coisa

Uma futura função TypeScript será código determinístico da aplicação. Ela receberá valores já validados pelo runtime e consultará o snapshot disponibilizado naquela execução.

A definição de Tool será o nome, a descrição e o JSON Schema apresentados ao modelo. Essa definição informa que uma capacidade existe e quais argumentos podem ser solicitados; ela não entrega ao modelo acesso ao código.

A solicitação de Tool será uma saída estruturada do modelo, por exemplo o nome `get_position_context` e um `positionContextId`. O modelo não executa diretamente a função e não lê memória, stores ou `localStorage`.

A execução real será responsabilidade da aplicação. O runtime validará o nome e os argumentos, verificará se o identificador corresponde ao snapshot autorizado, decidirá se a operação é permitida e só então chamará a função TypeScript.

O resultado da Tool será um objeto estruturado criado pela aplicação e devolvido ao modelo. Somente depois desse retorno o modelo poderá interpretar os fatos e produzir a resposta final do Professor IA.

```text
definição apresentada ao modelo
→ solicitação produzida pelo modelo
→ validação e autorização pela aplicação
→ execução da função TypeScript
→ resultado estruturado devolvido ao modelo
```

Argumentos válidos não constituem autorização. A autorização é definida pela aplicação e aplicada pelo servidor/runtime.

## 3. Por que começar por `get_position_context`

O Professor IA atual já possui o conceito de posição específica: `components/future-ai/ContextSelector.tsx` permite escolher `saved-position`, e `components/future-ai/AiProfessorDemo.tsx` resolve o ID escolhido contra as posições privadas do usuário atual.

Os evals documentados em `docs/llm-prompting-evals.md` mostraram que dado presente, dado válido, dado confirmado, dado confiável e evidência suficiente não são equivalentes. O `EV-006`, em particular, preservou como requisito a diferença entre FEN interpretável e posição automática ainda não confirmada.

Hoje o contexto está no navegador e é persistido em `localStorage`. Uma Tool permite entregar ao modelo um resultado pequeno e estruturado, com os qualificadores necessários, sem dar acesso livre às posições armazenadas. Ela também estabelece a base para uma futura `get_legal_moves`, que poderá consumir apenas uma posição previamente validada e autorizada. `get_legal_moves` não faz parte desta etapa.

## 4. Estado real da posição no TeaChess

### 4.1 Criação e modelo de dados

- A rota de upload é `app/enviar-imagem/page.tsx` e renderiza `components/uploads/UploadContent.tsx`.
- `components/uploads/UploadForm.tsx`, `components/uploads/UploadDropzone.tsx` e `components/uploads/uploadForm.ts` coletam uma imagem e os campos do formulário.
- `components/uploads/UploadContent.tsx` cria a posição com `crypto.randomUUID()`, metadados do formulário e um FEN escolhido deterministicamente por `imageOrigin`. Esse FEN não é extraído da imagem.
- O tipo real é `UploadedPosition`, em `lib/types/chess.ts`.
- Os registros iniciais são mocks de `lib/data/uploads.ts`.

Campos reais de `UploadedPosition`:

| Grupo | Campos existentes |
| --- | --- |
| Identificação e acesso local | `id`, `ownerUserId`, `visibility` |
| Descrição e origem | `title`, `imageOrigin`, `sourceContext`, `sourceDetails`, `date`, `description`, `linkedGameId`, `tags` |
| Metadados da imagem | `fileName`, `fileSize`, `mimeType` |
| Reconhecimento demonstrativo | `simulatedDetectedFen`, `simulatedSideToMove`, `simulatedConfidence`, `recognitionStatus` |
| Estudo | `favorite`, `personalStudyNotes` |
| Migração e tempo | `migrationNote`, `createdAt`, `updatedAt` |

Não existe atualmente no modelo de dados um campo de confirmação do usuário. Também não existem campos separados de validade sintática do FEN, legalidade/aceitação pela biblioteca, confiabilidade da origem ou suficiência para análise.

### 4.2 Armazenamento e persistência

- `store/useUploadStore.ts` mantém `uploads: UploadedPosition[]`, permite criar, excluir e atualizar favorito/anotação e executa a migração da versão 3.
- A store usa `persist`, `createJSONStorage(getSafeStorage)`, `skipHydration: true` e a chave `teachess-uploads-v1` declarada em `lib/storage/storage.ts`.
- `lib/storage/storage.ts` devolve `window.localStorage` no navegador e armazenamento em memória durante execução no servidor.
- A persistência inclui somente `{ uploads }`.
- A imagem real, `File`, `Blob`, base64 e object URL não são persistidos. `store/useUploadStore.ts` mantém previews apenas em um `Map` em memória durante a sessão.

Portanto, há referência persistida à imagem por nome, tipo MIME e tamanho, mas não há imagem persistida nem URL durável. Após recarregar, `components/study/PositionSourceCard.tsx` informa que a imagem original não está disponível.

### 4.3 Identificação, seleção e abertura no tabuleiro

- `UploadedPosition.id` é um identificador estável dentro da persistência atual: mocks usam valores como `upload-01`, e novos registros usam UUID do navegador.
- Na página do Professor IA, `components/future-ai/ContextSelector.tsx` cria `FutureAiContextRef` com `type: "saved-position"` e o `id` da posição.
- `components/future-ai/AiProfessorDemo.tsx` guarda a seleção em estado React local e resolve a posição com `positions.find(item => item.id === context.id)`.
- Não há uma posição globalmente selecionada na store. A seleção ativa do Professor IA não é persistida; somente as interações históricas guardam a referência de contexto em `store/useFutureAiDemoStore.ts`.
- A lista, o diálogo e a confirmação de upload abrem `/estudo/posicoes/[id]`; os links estão em `components/uploads/SavedUploads.tsx`, `components/uploads/UploadDetailsDialog.tsx`, `components/uploads/FutureImageAnalysis.tsx` e `components/uploads/UploadContent.tsx`.
- `app/estudo/posicoes/[id]/page.tsx` entrega o parâmetro a `components/study/PositionStudyContent.tsx`, que reidrata a store e procura uma posição cujo `id` e `ownerUserId` correspondam.
- `components/study/PositionBoard.tsx` constrói `new Chess(originalFen)` e permite movimentos legais locais. O FEN resultante dos movimentos fica apenas no estado do componente; ele não substitui `simulatedDetectedFen` na store e não é o contexto selecionado pelo Professor IA.

### 4.4 FEN, origem, confirmação e natureza dos dados

- Há FEN de posição no campo nullable `simulatedDetectedFen`.
- Há também FEN em partidas e análises, mas esses dados pertencem a outros contextos e não integram o snapshot desta Tool.
- `imageOrigin`, `sourceContext` e `sourceDetails` registram a origem informada para a imagem/posição.
- `recognitionStatus` registra o estado demonstrativo (`demo_available`, `preview_only` ou `not_processed`), não uma confirmação humana.
- `simulatedSideToMove` existe, mas o lado também pode ser derivado deterministicamente do segundo campo de um FEN aceito.
- `simulatedConfidence` é um número mockado da demonstração; não comprova correção e não deve entrar no contrato inicial da Tool.
- Não existe atualmente no modelo de dados um campo de confirmação do usuário.
- Os FENs criados pelo upload são mocks determinísticos. Não há OCR, visão computacional ou reconhecimento real.
- Os mocks de `lib/data/uploads.ts` também contêm FENs e metadados simulados.
- `createdAt` e `updatedAt` existem, mas não são necessários para responder sobre a posição e não devem atravessar inicialmente a fronteira.
- `linkedGameId`, descrição, tags e anotações pessoais existem, mas não são necessários para o contrato mínimo inicial. As notas não devem ser enviadas por padrão.

## 5. Fronteira de autorização

Fluxo planejado:

```text
frontend
→ identifica a posição atualmente selecionada
→ cria snapshot mínimo autorizado
→ envia o snapshot ao Route Handler
→ o servidor disponibiliza somente esse snapshot ao runtime da Tool
→ get_position_context retorna apenas o contexto autorizado
```

O Route Handler executa no servidor e não consegue ler diretamente o `localStorage` do navegador. A Tool não navegará livremente pelos dados do navegador, não receberá toda a store e não receberá todo o `localStorage`. Somente a posição selecionada, normalizada para uma allowlist mínima, atravessará a fronteira.

No protótipo sem autenticação e backend confiável, o snapshot enviado pelo navegador continuará sendo dado não confiável. Validar seu schema reduz entradas inválidas e exposição acidental, mas não prova identidade, propriedade ou permissão. A autorização conceitual para aquela chamada é definida pela aplicação; nunca pelo modelo e nunca pela simples presença de um argumento.

## 6. Formato inicial dos argumentos

### Alternativa A — sem argumentos

```json
{}
```

É adequada a uma única posição ativa, reduz a chance de o modelo inventar identificadores e possui o menor contrato possível. Como desvantagem, a correlação entre solicitação, snapshot e logs fica implícita.

### Alternativa B — identificador opaco

```json
{
  "positionContextId": "upload-01"
}
```

Permite correlação explícita e rejeição controlada de um ID divergente. O valor continua sem conceder acesso: deve corresponder exatamente ao único snapshot já autorizado.

### Decisão recomendada

Adotar a alternativa B. O código atual já possui `UploadedPosition.id`, persiste esse valor, usa-o nas rotas e o utiliza para selecionar a posição no Professor IA. Portanto, o identificador é estável e útil; não é necessário criar um ID artificial. O modelo deverá tratá-lo como token opaco, sem extrair significado de seu formato.

Embora haja apenas uma posição selecionada por requisição, o ID já faz parte do fluxo real e melhora rastreabilidade. A aplicação deverá fornecer ao modelo somente a referência da posição autorizada e comparar o argumento com o `positionContextId` do snapshot. Um ID diferente produz erro de autorização, não uma busca em outras posições.

O ID já existe no modelo atual, mas não concede autorização. Ele deve corresponder exatamente ao único snapshot autorizado. Se houver divergência, o runtime não pesquisará a store nem tentará localizar outras posições: retornará `POSITION_CONTEXT_NOT_AUTHORIZED`.

## 7. Contrato candidato de entrada da Tool

```json
{
  "type": "object",
  "properties": {
    "positionContextId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 128,
      "description": "Identificador opaco da única posição autorizada para esta requisição."
    }
  },
  "required": ["positionContextId"],
  "additionalProperties": false
}
```

O limite de 128 caracteres é uma hipótese inicial a confirmar na implementação. O schema não aceita FEN, origem, `confirmationStatus`, notas, IDs alternativos nem propriedades extras. O modelo não pode alterar o snapshot nem escolher arbitrariamente outro dado do navegador.

A Tool não deve receber uma resposta natural do modelo como argumento. Pergunta, instruções e resposta final pertencem a outras partes do fluxo.

## 8. Snapshot interno autorizado

O schema de argumentos acima é apresentado ao modelo. O snapshot abaixo é interno, enviado pelo frontend ao Route Handler e disponibilizado ao runtime; ele não é argumento da Tool.

Forma candidata:

```ts
interface AuthorizedPositionSnapshot {
  positionContextId: string;
  fen: string | null;
  imageOrigin: "physical_board_photo" | "online_game_screenshot";
  sourceContext:
    | "in_person_game"
    | "tournament"
    | "club"
    | "personal_study"
    | "teachess"
    | "chess.com"
    | "lichess"
    | "other";
  recognitionStatus: "demo_available" | "preview_only" | "not_processed";
  dataNature: "simulated_demo";
  confirmationStatus: "confirmed" | "unconfirmed" | "not_recorded";
}
```

O tipo é proposta documental, não código existente.

| Campo candidato | Situação no código atual | Decisão inicial |
| --- | --- | --- |
| `positionContextId` | Existe como `UploadedPosition.id` | Incluir |
| `fen` | Existe como `simulatedDetectedFen: string \| null` | Incluir, normalizando o nome e preservando `null` |
| `imageOrigin` | Existe | Incluir |
| `sourceContext` | Existe | Incluir |
| `sourceDetails` | Existe | Não incluir inicialmente; texto livre não é necessário para os estados básicos |
| `recognitionStatus` | Existe | Incluir para distinguir disponibilidade demonstrativa; não confundir com confirmação |
| `dataNature` | Pode ser derivado deterministicamente do campo `simulatedDetectedFen` e do fluxo atual | Incluir como `simulated_demo` enquanto esse for o único fluxo |
| `confirmationStatus` | Não existe atualmente no modelo de dados | Precisará ser adicionado futuramente; até lá, normalizar como `not_recorded` |
| `sideToMove` | Existe como `simulatedSideToMove` e pode ser derivado do FEN | Não enviar; derivar no servidor somente após validação |
| disponibilidade de contexto | Derivada da existência do snapshot autorizado | Não incluir como campo: é pré-condição de sucesso; sem snapshot, retornar `SNAPSHOT_MISSING` |
| `simulatedConfidence` | Existe, mas é mock e não comprova confiabilidade | Não incluir |
| imagem/binário/preview | O binário não é persistido; o preview é temporário | Não incluir |
| `fileName`, `fileSize`, `mimeType` | Existem | Não incluir |
| `title`, `date`, `description`, `tags` | Existem | Não incluir no contrato mínimo |
| `linkedGameId` | Existe | Não incluir |
| `personalStudyNotes` | Existe e é privado | Não incluir por padrão |
| `favorite` | Existe | Não incluir |
| `createdAt`, `updatedAt`, `migrationNote` | Existem | Não incluir |

Enquanto `confirmationStatus` não existir na entidade, o frontend não poderá inventar `confirmed` ou `unconfirmed`. A camada de normalização deverá usar `not_recorded` e registrar a limitação. Uma etapa futura poderá adicionar o campo e uma ação explícita do usuário, sem alterar silenciosamente o significado de `recognitionStatus`.

## 9. Contrato candidato de saída

```ts
interface GetPositionContextResult {
  positionContextId: string;
  recognition: {
    status: "demo_available" | "preview_only" | "not_processed";
    dataNature: "simulated_demo" | "unknown";
  };
  fen: {
    presence: "present" | "absent";
    value: string | null;
    syntaxStatus: "valid" | "invalid" | "not_verified";
    chessJsValidationStatus: "accepted" | "rejected" | "not_verified";
  };
  origin: {
    status: "known" | "unknown";
    imageOrigin: "physical_board_photo" | "online_game_screenshot" | null;
    sourceContext:
      | "in_person_game"
      | "tournament"
      | "club"
      | "personal_study"
      | "teachess"
      | "chess.com"
      | "lichess"
      | "other"
      | null;
  };
  confirmationStatus: "confirmed" | "unconfirmed" | "not_recorded";
  sideToMove: "white" | "black" | "unknown";
  analysisReadiness: "sufficient_for_position_context" | "insufficient";
  limitations: string[];
}
```

Esse resultado mantém dimensões independentes:

- `positionContextId` identifica obrigatoriamente o snapshot autorizado consultado pela execução bem-sucedida;
- `recognition.status` preserva o `recognitionStatus` real da aplicação;
- `recognition.dataNature` informa que o reconhecimento atual é uma demonstração simulada ou que sua natureza não é conhecida;
- `fen.presence` informa apenas se há string;
- `fen.syntaxStatus` registra a estrutura FEN;
- `fen.chessJsValidationStatus` registra se a posição foi aceita ou rejeitada pelos critérios do `chess.js` instalado;
- `confirmationStatus` registra a decisão humana, quando existir;
- `analysisReadiness` sintetiza se os fatos confiáveis são suficientes para perguntas sobre a posição, sem esconder os estados anteriores;
- `limitations` explica fatos ausentes ou qualificadores relevantes.

O schema de runtime correspondente deverá tornar todos esses campos obrigatórios e proibir propriedades adicionais. Novas naturezas de dado, como reconhecimento automático real ou FEN informado pelo usuário, exigirão evolução explícita do contrato; não fazem parte do modelo atual.

`recognition.status` vem do campo real `recognitionStatus`, mas não representa confirmação humana. `demo_available`, `preview_only` e `not_processed` descrevem o fluxo demonstrativo de reconhecimento; nenhum desses valores responde se o usuário confirmou que o FEN corresponde à posição pretendida.

No estado atual, um FEN demonstrativo pode estar presente e ser aceito pelo `chess.js`, mas ainda retornar `confirmationStatus: "not_recorded"`, `recognition.dataNature: "simulated_demo"` e `analysisReadiness: "insufficient"`. Isso impede que presença ou validade promovam um mock a posição real confirmada.

A saída não contém avaliação, melhor lance, variantes, explicação pedagógica, interpretação de LLM ou resultado fictício de engine. A Tool fornece fatos; o Professor IA os interpretará depois, dentro do schema final já existente.

### Regra inicial de `analysisReadiness`

`analysisReadiness: "sufficient_for_position_context"` exige simultaneamente:

1. execução com snapshot autorizado;
2. `fen.presence: "present"`;
3. `fen.syntaxStatus: "valid"`;
4. `fen.chessJsValidationStatus: "accepted"`;
5. `confirmationStatus: "confirmed"`.

Qualquer outra combinação resulta deterministicamente em `analysisReadiness: "insufficient"`. Em particular:

- `confirmationStatus: "not_recorded"` sempre produz análise insuficiente;
- `recognition.status` não substitui confirmação;
- `simulatedConfidence` não substitui confirmação e nem integra o snapshot mínimo;
- um FEN aceito pelo `chess.js` não substitui confirmação do usuário.

A existência do snapshot é pré-condição de sucesso, não um estado opcional dentro do resultado. Por isso, `contextAvailability` foi removido como redundante e `positionContextId` é obrigatório em toda saída bem-sucedida.

## 10. FEN: quatro perguntas separadas

### Presença

Existe uma string não vazia em `simulatedDetectedFen`? `null` ou string vazia significa ausência. A posição inicial usada visualmente por `PositionStudyContent.tsx` quando falta FEN é apenas placeholder e não pode ser promovida a FEN da posição enviada.

### Validade sintática

A string contém os campos e formatos reconhecidos como FEN? O helper atual `isPlausibleFen`, em `lib/utils/chess.ts`, verifica somente seis partes e oito fileiras; ele não é suficiente para o contrato futuro e não aparece ligado ao fluxo de posições.

### Legalidade enxadrística segundo a biblioteca disponível

O projeto instala `chess.js` 1.4.0, confirmado por `package-lock.json` e `node_modules/chess.js/package.json`. A versão exporta `validateFen(fen)`, que retorna `{ ok, error? }`, e `new Chess(fen)`/`load(fen)` executam essa validação por padrão.

Na versão instalada, `validateFen` verifica, entre outros critérios, seis campos, contadores, lado a mover, roque, en passant, oito fileiras, peças válidas, exatamente um rei de cada cor e ausência de peões na primeira e oitava fileiras. A biblioteca combina verificações de estrutura com alguns requisitos enxadrísticos. Ela não deve ser descrita como prova de que toda a história da posição é alcançável ou de legalidade histórica completa.

Na implementação, a aplicação deverá registrar separadamente `syntaxStatus` e `chessJsValidationStatus`. `syntaxStatus` deverá vir de uma checagem estrutural determinística, com critérios próprios e testáveis; não deverá depender de interpretação improvisada das mensagens de erro da biblioteca. `chessJsValidationStatus` registrará somente o resultado dos critérios aplicados pelo `chess.js` instalado. Um valor `accepted` não prova alcançabilidade histórica completa da posição e não confirma que o FEN corresponde à imagem pretendida pelo usuário. Não se deve afirmar validação não executada.

### Confiabilidade da origem

O usuário confirmou que o FEN representa a posição pretendida? Isso não é respondido por `validateFen`, por `new Chess`, por `recognitionStatus` nem por `simulatedConfidence`. Não existe atualmente no modelo de dados. Até a adição de um estado explícito e de uma ação de confirmação, o resultado deve ser `not_recorded` e insuficiente para tratar o FEN como representação confiável da imagem.

## 11. Estados e erros controlados

### Estados normais de uma execução bem-sucedida

- `fen.presence: "absent"`: há snapshot autorizado, mas não há FEN; os demais estados de FEN ficam `not_verified`.
- `fen.syntaxStatus: "invalid"` ou `fen.chessJsValidationStatus: "rejected"`: o FEN existe, mas falhou na verificação; isso é um fato controlado do domínio, não uma exceção genérica.
- `confirmationStatus: "unconfirmed"`: posição automática explicitamente não confirmada, depois que esse campo existir.
- `confirmationStatus: "not_recorded"`: o modelo atual não registra confirmação.

Nenhuma posição selecionada não produz um resultado normal da função. Nesse caso, a definição de `get_position_context` preferencialmente não será disponibilizada ao modelo. Se, apesar disso, o runtime tentar executá-la sem o snapshot obrigatório, retornará `SNAPSHOT_MISSING`. Uma execução bem-sucedida sempre possui exatamente um snapshot autorizado.

### Erros de contrato

- `TOOL_ARGUMENTS_INVALID`: argumento ausente, tipo incorreto, string vazia, limite excedido ou propriedade extra.
- `SNAPSHOT_MISSING`: o runtime tentou executar a Tool sem o snapshot obrigatório; ausência de snapshot nunca é convertida em resultado de sucesso.
- `SNAPSHOT_INVALID`: o snapshot não obedece à allowlist, aos tipos ou aos limites definidos.

### Erro de autorização

- `POSITION_CONTEXT_NOT_AUTHORIZED`: `positionContextId` não corresponde exatamente ao único snapshot autorizado. O runtime não procura esse ID em outra posição nem revela se ele existe no navegador.

### Erro interno inesperado

- `INTERNAL_TOOL_ERROR`: falha não prevista depois das validações. O retorno público deve ser sanitizado, e detalhes sensíveis não devem ser enviados ao modelo nem registrados sem necessidade.

Não se deve usar uma única exceção genérica para ausência de FEN, não confirmação, argumento inválido, divergência de ID e falha interna. O orquestrador poderá encerrar o ciclo de forma controlada conforme a categoria.

## 12. Segurança e privacidade

- Aplicar menor contexto: apenas os campos estritamente necessários da posição selecionada.
- O servidor não acessa diretamente o `localStorage`.
- Não enviar o armazenamento completo, a store inteira ou dados de outra posição.
- Não enviar notas, descrição, tags ou metadados de arquivo sem necessidade explícita aprovada.
- Nunca colocar API key no navegador; a chave continua exclusivamente server-side.
- Não registrar pergunta, FEN, snapshot, notas, headers, credenciais ou conteúdo bruto por conveniência. Logs devem conter apenas identificadores/códigos necessários, com política de redaction e retenção ainda pendente.
- Não devolver conteúdo do snapshot que não faça parte do contrato de saída.
- Tratar argumentos da Tool como entrada não confiável, não como autorização.
- Validar no servidor argumentos, snapshot, correspondência do ID e resultado.
- O protótipo sem autenticação não oferece autorização real; produção exigirá identidade e fonte confiável no backend.

## 13. Fluxo técnico de function calling

Fluxo implementado e testado com transporte simulado:

1. O Route Handler recebe a pergunta e o snapshot autorizado.
2. O servidor prepara a primeira chamada lógica com a definição de `get_position_context`.
3. O modelo solicita a Tool com o `positionContextId` autorizado.
4. A aplicação valida nome, schema dos argumentos e correspondência com o snapshot.
5. A função determinística consulta somente o snapshot autorizado.
6. O resultado estruturado é enviado ao modelo.
7. Uma segunda chamada lógica produz a resposta final conforme o schema provisório do Professor IA.

A Tool não recebe diretamente uma resposta natural do modelo. Ela recebe apenas os argumentos mínimos do contrato. Pergunta do usuário, resultado da Tool e resposta final são artefatos diferentes.

## 14. Cenários iniciais de avaliação

Os casos determinísticos de função, runtime e schemas abaixo foram implementados e executados na Etapa 6B. Os evals envolvendo o modelo continuam apenas propostos e não foram executados nesta etapa.

### Testes determinísticos da função e do runtime

- posição confirmada com FEN válido: estados presentes, aceitos, confirmados e lado a mover derivado;
- posição não confirmada gerada automaticamente: preservar `unconfirmed` e retornar análise insuficiente;
- posição selecionada sem FEN: ausência normal, sem inventar placeholder;
- nenhuma posição selecionada: a Tool não é disponibilizada; se o runtime tentar executá-la sem snapshot, retorna `SNAPSHOT_MISSING`;
- snapshot malformado: `SNAPSHOT_INVALID`;
- identificador divergente: `POSITION_CONTEXT_NOT_AUTHORIZED`, sem busca alternativa;
- FEN sintaticamente inválido: `syntaxStatus: "invalid"` e nenhuma derivação de lado a mover;
- FEN rejeitado pelos requisitos da biblioteca: `chessJsValidationStatus: "rejected"`;
- resultado preservando `confirmationStatus: "unconfirmed"` sem promovê-lo;
- falha inesperada: erro interno sanitizado.

### Testes do schema da Tool

- objeto com somente `positionContextId` válido é aceito;
- ausência de `positionContextId` é rejeitada;
- valor vazio, não string ou acima do limite é rejeitado;
- tentativa do modelo de passar `fen`, `confirmationStatus` ou qualquer propriedade extra é rejeitada;
- JSON malformado é rejeitado antes da função;
- FEN nunca é aceito como argumento da Tool.

### Evals do comportamento do modelo com a Tool

- o modelo solicita `get_position_context` quando a pergunta depende da posição selecionada;
- o modelo não inventa outro ID nem tenta enumerar posições;
- o modelo preserva FEN ausente, inválido, simulado ou não confirmado;
- o modelo não confunde aceitação por `chess.js` com confirmação humana;
- o Professor IA não indica melhor lance quando a Tool informa contexto insuficiente;
- o modelo não apresenta resultado da Tool como avaliação de engine;
- o modelo responde de forma controlada após erro de contrato ou autorização;
- a Tool não é chamada quando não é necessária.

## 15. Diagrama

```mermaid
flowchart LR
    R[Route Handler] --> C1[Primeira Responses API]
    C1 --> FC[function_call]
    FC --> D[Runtime determinístico<br/>executeGetPositionContext]
    D --> FO[function_call_output<br/>mesmo call_id]
    FO --> C2[Segunda Responses API]
    C2 --> SO[Structured Output]

    classDef server fill:#f5f5f5,stroke:#404040,color:#171717;
    classDef model fill:#fff7ed,stroke:#ea580c,color:#431407;
    class R,D,FO server;
    class C1,FC,C2,SO model;
```

O modelo solicita a função, mas a aplicação valida e executa o código. O modelo nunca acessa diretamente o snapshot: ele recebe somente o identificador de correlação e, depois, os fatos produzidos pelo runtime. Nesta rota técnica, a Tool é forçada para validar a infraestrutura; a seleção automática será avaliada posteriormente.

## 16. Implementação determinística da Etapa 6B

### Caminhos implementados

- `lib/ai/tools/get-position-context.schemas.ts`: schemas Zod estritos de argumentos, snapshot autorizado e resultado, com tipos TypeScript derivados;
- `lib/ai/tools/tool-errors.ts`: erro tipado e códigos públicos controlados;
- `lib/ai/tools/get-position-context.ts`: checagem estrutural de FEN, função pura `getPositionContext` e fronteira `executeGetPositionContext`;
- `lib/ai/tools/get-position-context.test.ts`: testes determinísticos sem LLM e sem rede;
- `tsconfig.tools-tests.json`: compilação isolada da suíte para diretório temporário;
- `package.json`: script `npm run test:get-position-context`, baseado no test runner nativo do Node.js.

### Contrato congelado da versão inicial

Os argumentos aceitam somente `{ positionContextId: string }`. O valor recebe `trim`, precisa conter de 1 a 128 caracteres úteis e propriedades adicionais são rejeitadas. FEN, confirmação e quaisquer outros dados não podem ser escolhidos nos argumentos.

O snapshot é uma allowlist estrita com todos os campos obrigatórios documentados. `positionContextId` usa as mesmas regras dos argumentos; `fen` aceita `null` ou uma string após `trim` de 1 a 256 caracteres. Os enums de origem, contexto e reconhecimento correspondem aos tipos exportados em `lib/types/chess.ts`. A entidade `UploadedPosition`, a store e a persistência não foram alteradas.

O resultado também é estrito, exige todos os campos e limita cada mensagem de `limitations` a 160 caracteres, com no máximo oito itens. Além de validar tipos, campos e limites, o schema verifica as relações semânticas entre os estados: coerência entre presença e valor do FEN, validações sintática e pelo `chess.js`, lado a mover, confirmação, origem e `analysisReadiness`. Readiness suficiente é impossível sem confirmação e só é aceita quando o FEN está presente, possui valor, tem sintaxe válida e foi aceito pelo `chess.js`; quando todos esses requisitos e a confirmação estão presentes, readiness insuficiente também é rejeitada. Itens duplicados em `limitations` não são aceitos. O schema não tenta conferir se a função produziu todas as mensagens de limitação necessárias, pois essa composição permanece responsabilidade determinística da função.

O schema não contém avaliação, melhor lance, variantes, engine, confidence, notas pessoais ou texto pedagógico.

### FEN, lado a mover e suficiência

A checagem estrutural própria exige exatamente seis campos separados por um espaço, oito fileiras, somente peças FEN e dígitos de 1 a 8 nas fileiras, exatamente oito casas por fileira, lado `w` ou `b`, roque em formato canônico, en passant `-` ou casa das fileiras 3/6, halfmove inteiro não negativo e fullmove inteiro a partir de 1. Ela verifica estrutura e não prova legalidade completa ou alcançabilidade histórica.

Somente depois de a estrutura ser aceita, a função chama `validateFen` do `chess.js` 1.4.0 instalado. O resultado registra `accepted` ou `rejected`; ausência de FEN ou rejeição estrutural registra `not_verified` sem executar a validação da biblioteca. Mensagens brutas do `chess.js` não atravessam o contrato público.

O lado a mover só é derivado depois de estrutura válida e aceitação pelo `chess.js`. `analysisReadiness` é `sufficient_for_position_context` somente com FEN presente, estrutura válida, aceitação pela biblioteca e `confirmationStatus: "confirmed"`. Reconhecimento, natureza simulada e confiança mockada não promovem confirmação.

### Limitações e erros

`limitations` usa mensagens fixas, sem duplicações e nesta ordem: ausência do FEN, estrutura inválida, rejeição pelo `chess.js`, confirmação não registrada, não confirmação explícita, reconhecimento não processado, natureza demonstrativa/simulada e lado a mover indisponível. A natureza `simulated_demo` permanece explícita inclusive em um resultado suficiente, pois suficiência para descrever a posição não transforma o dado demonstrativo em reconhecimento real.

O runtime verifica, nesta ordem, presença do snapshot, schema do snapshot, schema dos argumentos, correspondência exata do ID, execução e schema do resultado. Os erros públicos são `SNAPSHOT_MISSING`, `SNAPSHOT_INVALID`, `TOOL_ARGUMENTS_INVALID`, `POSITION_CONTEXT_NOT_AUTHORIZED` e `INTERNAL_TOOL_ERROR`. Eles não incluem FEN, snapshot, IDs divergentes, stack trace ou valores brutos. O runtime recebe somente um snapshot e nunca procura IDs alternativos.

### Testes e limitações atuais

O projeto não possuía runner de testes. Sem instalar dependências, a suíte usa `node:test`: o TypeScript compila apenas os arquivos desta função para `/tmp`, e o Node executa o JavaScript gerado. Foram executados 28 testes: os 18 casos originais continuam cobrindo função, runtime e contratos estruturais; dez casos adicionais confirmam que resultados reais permanecem aceitos e que combinações semanticamente incoerentes de FEN, validações, confirmação, readiness, origem e limitações são rejeitadas. O comando concluiu com 28 aprovações e nenhuma falha.

Esta etapa não cria normalizador de `UploadedPosition`, campo persistido de confirmação, autenticação ou autorização real de servidor. A interface e a persistência continuam inalteradas.

## 17. Definição OpenAI e orquestração da Etapa 6C-A

### Definição da Tool

`lib/ai/tools/get-position-context.openai.ts` exporta a constante única `GET_POSITION_CONTEXT_TOOL_NAME`, a descrição pública, a definição e a lista com somente uma Tool. A definição usa o tipo oficial `FunctionTool` do SDK `openai` 6.47.0 e `satisfies` para verificar o formato achatado da Responses API:

- `type: "function"`;
- `name: "get_position_context"`;
- `strict: true`;
- objeto com somente `positionContextId`;
- string obrigatória de 1 a 128 caracteres;
- `additionalProperties: false`;
- nenhum FEN, snapshot, confirmação ou flag de autorização.

O helper `zodFunction` existe na versão instalada, mas cria a estrutura aninhada de Chat Completions (`function: { name, parameters, strict }`), incompatível com `FunctionTool` da Responses API. O SDK também exporta `zodResponsesFunction`, mas a definição manual foi mantida para tornar o contrato público inspecionável, preservar explicitamente os limites e não depender de conversão implícita. Os testes cruzam o limite compartilhado e as rejeições essenciais com `getPositionContextArgumentsSchema`, reduzindo risco de divergência.

### Primeira interação

`runPositionContextToolFlow` recebe mensagem e snapshot já validados, além do prompt selecionado pelo registro existente. A entrada contém a mensagem original e um pequeno contexto técnico confiável gerado no servidor com o `positionContextId` derivado exclusivamente do snapshot. A primeira requisição usa:

- `model: "gpt-5-mini"`;
- `instructions` com o prompt versionado;
- somente `get_position_context` em `tools`;
- `tool_choice: { type: "function", name: "get_position_context" }`;
- `parallel_tool_calls: false`;
- `store: false`.

A chamada forçada valida o encadeamento técnico e não demonstra que o modelo seleciona autonomamente a Tool correta.

### Validação e execução

`response.output` é tratado como não confiável. O fluxo exige exatamente um item `type: "function_call"`, confere o nome, exige `call_id` não vazio, exige `arguments` string e aplica `JSON.parse` para obter `unknown`. O valor é entregue exclusivamente a `executeGetPositionContext({ rawArguments, authorizedSnapshot })`; a orquestração não chama diretamente `getPositionContext`, não consulta store e não usa fallback de ID.

Falhas de contrato, snapshot ou autorização encerram o fluxo antes da segunda interação. Elas não são devolvidas ao modelo para reinterpretação. Ausência normal de FEN permanece um resultado bem-sucedido da função.

Em sucesso, o item associado à chamada é:

```json
{
  "type": "function_call_output",
  "call_id": "o mesmo identificador recebido",
  "output": "{\"success\":true,\"data\":{...}}"
}
```

`output` recebe uma única serialização com `JSON.stringify`. Snapshot bruto, argumentos brutos, stack trace, detalhes do Zod e mensagens internas do `chess.js` não são incluídos.

### Segunda interação e preservação do protocolo

A entrada final concatena, nesta ordem:

1. a entrada original;
2. todos os itens da primeira `response.output`, sem filtragem ou reordenação;
3. o `function_call_output`.

O SDK 6.47.0 possui uma divergência de união entre `ResponseOutputItem` e `ResponseInputItem` para estados de algumas tools embutidas. Por isso, há uma conversão de tipo localizada depois da concatenação integral; nenhum item é removido. A segunda chamada não disponibiliza `tools` nem `tool_choice`, usa novamente o prompt, `store: false`, `responses.parse(...)`, `zodTextFormat(...)` e `provisionalTeacherResponseSchema`. O fluxo exige `status: "completed"` e valida novamente `output_parsed` com o schema Zod.

O teste de preservação cobre, na mesma resposta, uma variante real `reasoning` (`ResponseReasoningItem`), uma `message` e a `function_call`. Ele confirma a mesma ordem, as mesmas referências e o `function_call_output` somente depois de todos os itens, evitando que uma evolução do protocolo seja filtrada ou modificada silenciosamente.

O ciclo possui limite fixo de duas interações lógicas: uma para solicitar a Tool e outra para produzir o Structured Output. Não há loop, retry, streaming, execução paralela, terceira rodada ou múltiplas Tools.

### Rota técnica e testes sem rede

`POST /api/ai/test/tools/position-context` usa runtime Node.js e fica desabilitada por padrão. A flag `ENABLE_AI_TEST_ROUTE` é verificada antes da leitura do body. Depois dela, a versão de prompt é selecionada por `AI_TEST_PROMPT_VERSION`; somente então o JSON e o schema estrito do body são validados. O body aceita apenas `message` com trim, de 1 a 2.000 caracteres, e `authorizedSnapshot` validado pelo schema compartilhado. A chave e o cliente OpenAI só são consultados/criados depois de todas essas validações locais.

A resposta pública de sucesso contém modelo, versões, resumo da execução da Tool e o objeto pedagógico final. Ela não contém `call_id`, argumentos, output bruto do provedor, snapshot ou objetos do SDK. Erros públicos usam códigos e mensagens controlados. Falhas do provedor ou do protocolo recebido usam HTTP `502`; falhas internas do runtime/snapshot posteriores à validação da rota usam `500`; autorização divergente usa `403`; configuração ausente ou inválida usa `503`. Um erro inesperado da aplicação usa `internal_error`/`500`, nunca é atribuído automaticamente ao provedor e não recebe diagnóstico de provedor. Logs registram somente a classificação segura, acrescentando diagnóstico filtrado apenas ao erro já classificado como `PROVIDER_ERROR`.

Os testes do orquestrador usam transporte injetável e objetos limitados aos campos consumidos. Testes adicionais chamam o handler `POST` real com a Web API `Request`, sem monkey patch global e sem rede. Eles cobrem a rota desabilitada, prompt desconhecido, JSON inválido, mensagem ou snapshot inválido e chave ausente depois de um body válido; também confirmam que as variáveis de ambiente são restauradas e que a execução é serial. O mapeamento HTTP possui teste exaustivo sobre o union type, além da cobertura de definição, schema HTTP, sucesso com duas chamadas, preservação integral, autorização, argumentos inválidos, respostas ausentes/múltiplas/recusadas/incompletas, output estruturado inválido, configuração das chamadas e sanitização.

### Limitações

- a rota é técnica, forçada e não é endpoint de produto;
- nenhuma chamada real foi feita nesta etapa;
- seleção automática de Tool ainda não foi avaliada;
- a interface real do Professor IA, stores e persistência não foram alteradas;
- o snapshot vindo do navegador continua sem autenticação ou autorização real;
- não há engine, OCR, visão computacional, backend de produto, retries ou streaming.
