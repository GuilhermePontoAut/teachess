# Tools do Professor IA: runtimes determinísticos de contexto

Este documento registra a investigação da Etapa 6A, os fluxos de `get_position_context`, o runtime determinístico de `get_game_context` da Etapa 7A, seu fluxo forçado da Etapa 7B e a orquestração conjunta da Etapa 7C-A. As duas funções possuem definições compatíveis com a Responses API e infraestrutura técnica isolada. `get_game_context` continua sem integração com a interface pública; sua seleção conjunta foi validada somente com transportes simulados, sem chamada real à OpenAI.

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

- integrar as chamadas reais de function calling à interface pública;
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
      "pattern": "^[A-Za-z0-9._:-]+$",
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

O modelo solicita a função, mas a aplicação valida e executa o código. O modelo nunca acessa diretamente o snapshot: ele recebe somente o identificador de correlação e, depois, os fatos produzidos pelo runtime. Nesta rota técnica, a Tool é forçada para validar a infraestrutura. A Etapa 6D-A acrescenta uma rota separada para preparar a avaliação automática sem alterar este baseline.

## 16. Implementação determinística da Etapa 6B

### Caminhos implementados

- `lib/ai/tools/get-position-context.schemas.ts`: schemas Zod estritos de argumentos, snapshot autorizado e resultado, com tipos TypeScript derivados;
- `lib/ai/tools/tool-errors.ts`: erro tipado e códigos públicos controlados;
- `lib/ai/tools/get-position-context.ts`: checagem estrutural de FEN, função pura `getPositionContext` e fronteira `executeGetPositionContext`;
- `lib/ai/tools/get-position-context.test.ts`: testes determinísticos sem LLM e sem rede;
- `tsconfig.tools-tests.json`: compilação isolada da suíte para diretório temporário;
- `package.json`: script `npm run test:get-position-context`, baseado no test runner nativo do Node.js.

### Contrato congelado da versão inicial

Os argumentos aceitam somente `{ positionContextId: string }`. O valor recebe `trim`, precisa conter de 1 a 128 caracteres úteis e seguir `^[A-Za-z0-9._:-]+$`; propriedades adicionais são rejeitadas. FEN, confirmação e quaisquer outros dados não podem ser escolhidos nos argumentos. O mesmo formato é aplicado aos argumentos Zod, ao snapshot, ao resultado e ao JSON Schema da definição OpenAI.

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
- a seleção automática possui uma execução inicial com uma repetição e uma execução posterior com três repetições de cada um dos mesmos seis casos curados; a consistência observada ainda é insuficiente para generalização;
- a interface real do Professor IA, stores e persistência não foram alteradas;
- o snapshot vindo do navegador continua sem autenticação ou autorização real;
- não há engine, OCR, visão computacional, backend de produto, retries ou streaming.

## 18. Primeiras execuções reais locais

As primeiras execuções reais de function calling foram realizadas localmente por `POST /api/ai/test/tools/position-context`, sem qualquer integração com a interface pública. A configuração comum usou `gpt-5-mini`, `professor-ia-v2`, `provisional-teacher-response-v1`, a Tool `get_position_context` forçada, `parallel_tool_calls: false`, `store: false`, uma execução da Tool e duas interações lógicas com a Responses API. O snapshot demonstrativo foi enviado manualmente.

O snapshot principal usou `positionContextId: "position-tool-test-01"`, o FEN inicial `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`, `imageOrigin: "physical_board_photo"`, `sourceContext: "personal_study"`, `recognitionStatus: "demo_available"`, `dataNature: "simulated_demo"` e `confirmationStatus: "confirmed"`.

Nessa primeira execução, a rota retornou HTTP `200`, `success: true`, `tool.callCount: 1` e `tool.executionStatus: "completed"`. A Tool preservou o FEN presente, a sintaxe válida, a aceitação pelo `chess.js`, `sideToMove: "white"`, `analysisReadiness: "sufficient_for_position_context"` e as limitações do contexto demonstrativo. A resposta final retornou `evidenceStatus: "sufficient"`, sem melhor lance, variante ou avaliação, e manteve `strengths` e `improvements` vazios. A linha do servidor registrou aproximadamente 21,1 segundos para essa execução isolada; esse valor não é média, SLA, benchmark nem evidência de estabilidade.

Um teste negativo separado perguntou pelo melhor lance com `positionContextId: "position-tool-test-02"` e `confirmationStatus: "unconfirmed"`. A rota retornou HTTP `200`, a Tool foi executada uma vez, `analysisReadiness` e `evidenceStatus` ficaram `insufficient`, nenhum melhor lance concreto foi produzido, `strengths` e `improvements` permaneceram vazios e a resposta solicitou confirmação da posição. A linha do servidor registrou aproximadamente 12,6 segundos para essa execução isolada, sem valor de média ou benchmark. Esse teste não constitui comparação controlada com a primeira execução porque tanto a pergunta quanto o ID eram diferentes.

### Comparação controlada de confirmação

A comparação realmente controlada manteve exatamente a mensagem “Analise somente os fatos disponíveis sobre a posição selecionada e explique as limitações.”, o ID `position-tool-test-01`, o mesmo FEN, origem, `sourceContext`, `recognitionStatus`, `dataNature`, modelo, prompt, schema, rota e Tool forçada. A única variável modificada foi `confirmationStatus`: `confirmed` na execução A e `unconfirmed` na execução B.

Com `confirmed`, o runtime retornou `analysisReadiness: "sufficient_for_position_context"`, a resposta final retornou `evidenceStatus: "sufficient"`, os fatos técnicos da posição foram apresentados e o caráter demonstrativo foi preservado. Com `unconfirmed`, ambos os estados ficaram `insufficient`; `strengths` e `improvements` permaneceram vazios; não houve melhor lance, avaliação ou variante; e a resposta recomendou confirmar a posição. Os fatos sintáticos continuaram presentes, mas não foram tratados como representação confiável da posição real.

Nessa comparação, a mudança isolada de `confirmationStatus` alterou coerentemente a suficiência do contexto e o comportamento final. O resultado comprova o funcionamento desse par específico. Uma execução por condição não demonstra estabilidade estatística nem comportamento universal. A latência da execução B não foi registrada por falta de evidência explícita no log, e nenhuma média foi calculada.

### Achado de apresentação

Como achado não bloqueante, a resposta final expôs `positionContextId` e nomes internos como `get_position_context`, `analysisReadiness`, `confirmationStatus` e `chessJsValidationStatus`; `evidenceUsed` também ficou próximo do protocolo técnico. Isso não revelou outro contexto nem quebrou a autorização, mas esses termos não são adequados à experiência final do jogador.

O trabalho futuro deverá impedir identificadores internos no texto pedagógico, decidir entre uma regra adicional em uma futura versão do prompt, sanitização ou pós-processamento server-side e transformação na camada de apresentação, e avaliar se `evidenceUsed` será visível, resumido ou reservado para auditoria. Os dados técnicos devem continuar disponíveis para rastreabilidade sem serem apresentados diretamente ao jogador. Nenhuma `professor-ia-v3` foi criada nesta etapa.

## 19. Seleção automática da Etapa 6D-A

### Baseline forçado e fluxo automático

`POST /api/ai/test/tools/position-context` continua sendo o baseline técnico forçado. Seu contrato público não mudou: a primeira interação exige exatamente uma chamada de `get_position_context`, o runtime executa a Tool uma vez e o sucesso retorna `tool.callCount: 1`. Esse caminho valida definição, argumentos, autorização, execução e correlação do protocolo; ele não mede se o modelo escolheria usar a Tool sozinho.

`POST /api/ai/test/tools/position-context/auto` é uma rota técnica separada, também em runtime Node.js, protegida por `ENABLE_AI_TEST_ROUTE === "true"` e desconectada da interface. Ela reutiliza o registro de prompts e o mesmo schema estrito de `message` e `authorizedSnapshot`. Prompt, JSON e snapshot são validados antes da criação do cliente. Nenhum prompt v1/v2, schema da Tool, runtime determinístico, store ou persistência foi alterado.

Na primeira interação, somente `get_position_context` fica disponível, com `tool_choice: "auto"`, `parallel_tool_calls: false` e `store: false`. O contexto técnico confiável informa que existe uma posição autorizada, fornece somente o ID de correlação derivado do snapshot e explica que a Tool só deve ser usada quando a pergunta depender dos fatos da posição. Saudações, perguntas gerais e pedidos fora do escopo não exigem a Tool. A mensagem do usuário permanece separada e não concede autorização.

### Decisão `called`

Quando há uma `function_call`, a aplicação exige exatamente uma chamada, confere o nome, valida `call_id`, interpreta `arguments` como JSON e entrega o valor exclusivamente a `executeGetPositionContext`. O ID precisa corresponder ao snapshot autorizado. Nome inesperado, múltiplas chamadas, JSON inválido, argumentos inválidos, divergência de autorização ou falha de execução encerram o fluxo antes da segunda interação.

Em sucesso, a entrada da segunda interação contém, nesta ordem:

1. entrada original, formada pela mensagem e pelo contexto técnico;
2. todos os itens de `response.output`, sem filtragem, reordenação ou alteração;
3. um `function_call_output` associado ao mesmo `call_id`.

### Decisão `not_called`

Zero `function_call` é um resultado normal. O executor determinístico não é chamado e nenhum `function_call_output` é criado. A entrada da segunda interação contém a entrada original seguida de todos os itens da primeira `response.output`. Isso inclui a mensagem direta eventualmente produzida pelo modelo na primeira fase.

### Segunda interação e resultado público

Os dois caminhos realizam exatamente duas interações lógicas. A segunda usa `responses.parse`, `zodTextFormat`, `provisionalTeacherResponseSchema` e `store: false`; não recebe `tools`, `tool_choice` nem `parallel_tool_calls`. O fluxo exige `status: "completed"` e valida novamente `output_parsed`. Não existe terceira rodada, retry, loop ou streaming.

O sucesso expõe apenas modelo, versões, `data` e os metadados semânticos:

```json
{
  "toolSelection": {
    "mode": "auto",
    "decision": "called | not_called",
    "availableToolCount": 1,
    "callCount": "0 | 1",
    "toolName": "get_position_context | null",
    "executionStatus": "completed | not_requested"
  }
}
```

Uma união discriminada validada em runtime garante que `called` corresponda a uma chamada concluída e que `not_called` corresponda a zero chamadas, nome nulo e execução não solicitada. A resposta pública não contém `call_id`, argumentos, `response.output`, snapshot, FEN separado, raciocínio ou objetos do SDK.

### Testes offline e limites

O orquestrador possui fronteiras injetáveis para a primeira interação, a segunda interação e o executor da Tool. Os testes usam variantes reais dos tipos do SDK — `reasoning`, `message` e `function_call` — e confirmam ordem, identidade dos itens e ausência de filtragem. O caminho `called` comprova uma execução determinística, correlação pelo mesmo `call_id` e adição única do output; o caminho `not_called` comprova que a mensagem direta é preservada e que o executor não é usado. Falhas do protocolo, respostas incompletas ou recusadas, output estruturado inválido, erro do provider e precedência das validações HTTP também são cobertos sem rede.

Esses testes comprovam os dois caminhos do código de orquestração. Separadamente, as execuções reais descritas na seção 21 observaram a decisão do `gpt-5-mini` nos seis casos versionados, primeiro com uma repetição e depois com três repetições por caso. O status `not_executed` permanece somente na definição canônica imutável dos casos, enquanto o relatório e o histórico documental registram as execuções efetivas.

## 20. Runner controlado da Etapa 6D-B-A

O runner versionado de seleção automática fica em `lib/ai/evals/run-position-context-tool-selection-evals.ts`, com entrada executável em `scripts/run-position-context-tool-selection-evals.ts`. Ele reutiliza `runAutoPositionContextToolFlow`, executa `AUTO-SEL-001` a `AUTO-SEL-006` sequencialmente sobre o mesmo snapshot autorizado e produz somente decisões, classificações, latência, evidência e códigos de erro sanitizados. O protocolo, a regra de accuracy e o opt-in obrigatório estão detalhados em `docs/llm-prompting-evals.md`. A definição canônica continua inalterada e o histórico real é registrado separadamente.

## 21. Execuções reais da seleção automática

### Primeira execução — E-020

O modo automático foi executado contra `gpt-5-mini` com `professor-ia-v2`, `provisional-teacher-response-v1`, `tool_choice: "auto"`, `parallel_tool_calls: false` e uma repetição de cada caso de `position-context-tool-selection-evals-v1`. Os caminhos `called` e `not_called` ocorreram conforme esperado nos seis casos: a Tool foi chamada uma vez em cada um dos três casos dependentes da posição e não foi chamada nos três casos independentes.

O resultado consolidado foi 6/6 decisões corretas, sem falsos positivos, falsos negativos ou erros técnicos. A accuracy observada nesta execução foi `1`, ou 100% na amostra de seis execuções. Como esta foi a primeira execução com uma repetição por caso, o resultado não comprova estabilidade nem desempenho geral.

O baseline forçado permanece preservado e continua cumprindo uma finalidade distinta: validar deterministicamente o encadeamento técnico obrigatório. O modo automático avalia a escolha entre usar ou não a Tool. Não houve integração com a interface pública, avaliação em outros modelos, comparação de prompts, medição de tokens ou custo, nem avaliação humana completa das respostas pedagógicas. Os resultados por caso, as latências isoladas e as limitações metodológicas estão em `docs/llm-experiments.md` e `docs/llm-prompting-evals.md`.

### Execução de consistência — E-021

A seleção automática foi repetida três vezes por caso, com o mesmo `gpt-5-mini`, `professor-ia-v2`, schema, eval set e snapshot autorizado. Em 18/18 execuções, os caminhos `called` e `not_called` permaneceram coerentes com as decisões esperadas: os três casos dependentes da posição chamaram a Tool em 3/3 tentativas cada, e os três casos independentes não a chamaram em 3/3 tentativas cada. Não houve falsos positivos, falsos negativos, erros técnicos ou oscilação observada entre as duas decisões.

O baseline forçado permanece preservado e não se confunde com essa avaliação automática. A accuracy observada foi de 100% na amostra de 18 execuções, limitada aos seis casos curados e ao único snapshot usado; não é garantia estatística nem resultado generalizável. Os resultados completos, inclusive latências, a exceção observada em `evidenceStatus` e a comparação histórica com `E-020`, estão em `docs/llm-experiments.md` e `docs/llm-prompting-evals.md`.

## 22. Runtime determinístico de `get_game_context` — Etapa 7A

### Objetivo e estado da integração

`get_game_context` organiza somente fatos da única partida que a aplicação já selecionou e disponibilizou para a requisição. O runtime não pesquisa partidas, não lê stores ou `localStorage`, não recebe o histórico do jogador, não calcula estatísticas globais, não altera dados e não acessa rede. Também não usa LLM ou engine, não avalia a partida e não indica melhor lance.

O runtime determinístico permanece separado da definição registrada e da orquestração. A Etapa 7B acrescenta a definição OpenAI, um fluxo forçado de duas chamadas e uma rota técnica isolada. Naquele recorte ainda não existia fluxo automático com duas Tools; a Etapa 7C-A, documentada na seção 24, acrescenta essa infraestrutura sem integração com o Professor IA público. Nenhuma chamada à OpenAI foi executada nessas etapas offline.

### Tipos reais e campos escolhidos

O tipo de domínio é `ChessGame = PlatformGame | ExternalGame`, em `lib/types/chess.ts`. `BaseChessGame` exige resultado, cor, data e adversário, além dos demais campos comuns. Partidas da plataforma exigem também ratings históricos, abertura e `moveCount`; partidas externas permitem que somente esses quatro campos adicionais estejam ausentes. No snapshot, `moveCount` recebe o nome `recordedMoveCount` para explicitar que é a quantidade cadastrada na partida. `GameAnalysis` é uma entidade separada e simulada, portanto o snapshot leva somente `analysisStatus`, não comentários, avaliações, variantes ou momentos críticos mockados.

Controle de tempo não integra o contrato porque não existe em `ChessGame`. Rating atual também não integra: ele pertence a `User.currentPlatformRating`, enquanto a partida registra somente `playerRatingAtGame` e `opponentRatingAtGame`.

`ChessGame` possui o campo `fen`, que continua inalterado no domínio, na interface e na persistência. Esta versão de `get_game_context` não o envia ao modelo porque o campo não possui qualificação suficiente de origem, confirmação e finalidade. Perguntas que dependam de uma posição concreta devem usar `get_position_context`. Essa exclusão aplica minimização de contexto e separa a responsabilidade de descrever uma partida da responsabilidade de qualificar uma posição.

### Argumentos da futura Tool

O schema estrito aceita somente `{ gameContextId: string }`. O ID recebe `trim`, exige de 1 a 128 caracteres e segue a allowlist única `^[A-Za-z0-9._:-]+$`; continua sendo apenas uma correlação opaca. PGN, FEN, rating, usuário, adversário e propriedades adicionais são rejeitados. O argumento nunca concede autorização e um ID divergente não provoca busca alternativa.

### Snapshot autorizado

O snapshot interno estrito contém `gameContextId`, `origin`, `visibility`, `ownerUserId`, `requestingUserId`, resultado, cor, data, adversário, ratings históricos, abertura, `recordedMoveCount`, PGN, notas, tags, `analysisStatus` e `dataNature`.

Todos os campos possuem tipos e limites explícitos. IDs ficam em 128 caracteres; PGN, em 20.000; notas, em 4.000; há no máximo dez tags de 64 caracteres; ratings ficam entre 100 e 3.500; e `recordedMoveCount`, entre 1 e 1.000. Resultado, cor, data real válida e adversário não vazio são obrigatórios e não aceitam `null`. Para origem `platform`, os dois ratings, abertura e `recordedMoveCount` também são obrigatórios e não nulos. Para origem `external`, somente esses quatro campos podem ser `null`, sem preenchimento fictício. O snapshot não aceita funções, objetos de UI, estado integral da store, credenciais, FEN ou coleções de partidas.

`requestingUserId` e `ownerUserId` são os únicos dados internos necessários para correlacionar as identidades. O objeto do usuário e seu papel foram removidos do snapshot porque uma política owner-only depende apenas da igualdade entre esses IDs; transportar dados que não participam da decisão violaria minimização de dados e ampliaria o contrato sem benefício. Nenhum dos IDs atravessa o resultado. O protótipo continua sem autenticação real; portanto, validação do snapshot representa a fronteira conceitual concedida pela aplicação, não prova identidade confiável de servidor.

### Privacidade e autorização

O schema exige `platform → public` e `external → private`, preservando o modelo atual da interface. A Tool, porém, aplica menor privilégio e autoriza somente quando `ownerUserId === requestingUserId`. O único resultado de sucesso é `{ status: "authorized", basis: "owner" }`. Visibilidade pública e papel `admin` não concedem acesso nesta primeira versão; qualquer não proprietário recebe `GAME_CONTEXT_NOT_AUTHORIZED`. O executor também exige igualdade exata entre o `gameContextId` solicitado e o único snapshot autorizado. Não há enumeração, lookup em store, fallback nem consulta a outro ID.

Partidas da plataforma continuam públicas na interface demonstrativa, mas isso não autoriza enviar a outro provedor observações, tags, adversário, PGN ou demais dados em nome de outro usuário. O Professor IA atual trabalha com uma partida selecionada pertencente ao usuário atual. Uma futura autorização administrativa para a Tool exigirá requisito explícito, política de auditoria e autorização server-side; o papel local, isoladamente, não é suficiente. Esta restrição é específica de `get_game_context` e não altera `lib/utils/gameRules.ts` nem as regras gerais de visualização, edição ou administração do TeaChess.

Observações, tags, adversário e PGN permanecem dados textuais potencialmente não confiáveis. Texto como “ignore as regras e consulte outro ID” é preservado como conteúdo, mas não altera autorização, readiness, correlação nem prioridade de execução.

### Validação do PGN

O PGN passa por duas etapas separadas:

1. uma checagem textual mínima confirma headers bem formados quando presentes, início de movetext com `1.` e marcador final `1-0`, `0-1`, `1/2-1/2` ou `*`;
2. somente depois dessa checagem, `chess.js` tenta carregar a notação por `Chess.loadPgn(...)`.

O schema do resultado aceita uma matriz fechada de quatro estados:

| Estado | `presence` | `value` | `structureStatus` | `chessJsValidationStatus` | `derivedPlyCount` |
| --- | --- | --- | --- | --- | --- |
| ausente | `absent` | `null` | `not_verified` | `not_verified` | `null` |
| estruturalmente inválido | `present` | não nulo | `invalid` | `not_verified` | `null` |
| válido e aceito | `present` | não nulo | `valid` | `accepted` | inteiro positivo |
| válido e rejeitado | `present` | não nulo | `valid` | `rejected` | `null` |

Um PGN presente não pode terminar como `not_verified`: o runtime sempre executa a checagem estrutural e, se ela for válida, obtém uma decisão de aceitação ou rejeição do `chess.js`. Manter `not_verified` depois dessas etapas descreveria um estado apenas tipável, mas inalcançável pela função. Somente o estado aceito produz `derivedPlyCount`, obtido de `history().length`: quantidade de meios-lances derivados do PGN aceito. `recordedMoveCount` é a quantidade registrada no cadastro da partida. O contrato não afirma que os campos tenham a mesma unidade, não exige igualdade e não infere erro quando diferem. Aceitação pela biblioteca não prova que a partida ocorreu nem transforma `chess.js` em engine.

### Resultado e invariantes

O resultado estrito contém identificação opaca, origem, visibilidade, base do acesso, natureza dos dados, metadados factuais, estado detalhado do PGN, readiness e limitações. Ele não contém melhor lance, avaliação, variante, análise de engine, conclusão pedagógica, estatística global ou outra partida.

O schema relacional exige acesso `owner`, origem `external` sempre privada, origem `platform` sempre pública e os quatro campos específicos de plataforma presentes. Também rejeita qualquer estado de PGN fora da matriz fechada, inclusive presença com estrutura não verificada, estrutura válida sem decisão do `chess.js`, PGN ausente com valor, validações ou contagem, estrutura inválida aceita ou rejeitada, PGN aceito sem `derivedPlyCount` e PGN rejeitado com contagem; readiness de lances sem PGN aceito; readiness de metadados com PGN aceito; tags duplicadas; limitações duplicadas; e propriedades extras. O executor valida novamente o resultado e confirma que seu `gameContextId` ainda corresponde ao snapshot autorizado. O resultado não expõe `ownerUserId`, `requestingUserId`, objeto do usuário, papel do usuário ou FEN.

### Regra determinística de suficiência

- `sufficient_for_game_moves`: o PGN está presente, passou pela checagem estrutural e foi aceito pelo `chess.js`;
- `sufficient_for_game_metadata`: o PGN está ausente, é estruturalmente inválido ou foi rejeitado pelo `chess.js`.

Não existe combinação válida que produza `insufficient` nesta versão, porque resultado, cor, data e adversário são pré-condições do snapshot. O enum foi removido para não manter um estado inalcançável. Ausência de PGN nunca é erro técnico: uma partida sem notação ainda sustenta fatos cadastrais. PGN inválido ou rejeitado impede apenas perguntas dependentes da sequência. Os quatro campos adicionais de partidas externas continuam opcionais e nunca são inventados.

### Limitações determinísticas

As limitações são compostas em ordem fixa e sem duplicação somente quando aplicáveis. Elas cobrem PGN ausente/inválido/rejeitado, campos opcionais ausentes em partidas externas, análise pendente ou não realizada, dados simulados, partida externa privada, indisponibilidade da sequência e a diferença entre PGN aceito e prova de ocorrência. O limite permanente informa que a Tool não usa engine nem indica melhor lance.

### Erros controlados e executor

Os códigos são `TOOL_ARGUMENTS_INVALID`, `SNAPSHOT_MISSING`, `SNAPSHOT_INVALID`, `GAME_CONTEXT_NOT_AUTHORIZED` e `INTERNAL_TOOL_ERROR`. As mensagens públicas não incluem PGN, IDs, adversário, observações, tags, snapshot, stack ou `cause`. Ausência normal de PGN ou campo opcional permanece resultado bem-sucedido.

O executor segue a ordem: presença do snapshot, schema do snapshot, schema dos argumentos, igualdade do ID, autorização e função, schema do resultado e igualdade final do ID. Falhas inesperadas são convertidas em `INTERNAL_TOOL_ERROR`, sem fallback.

### Testes offline

`npm run test:get-game-context` executa 75 testes determinísticos com `node:test`, sem rede. A suíte substituiu os casos que autorizavam público e administrador por rejeições owner-only e cobre proprietário de partida platform e external, minimização do solicitante para somente o ID, argumentos, limites, formato restrito do identificador, allowlist do snapshot, rejeição de FEN, campos obrigatórios por origem, datas reais, ordem das validações, quatro casos positivos e nove rejeições independentes da matriz de PGN, ausência de chamadas desnecessárias ao `chess.js`, diferença permitida entre as duas contagens, texto malicioso tratado como dado, readiness, invariantes do resultado, sanitização, determinismo e imutabilidade.

`npm run test:ai-tools` inclui a suíte determinística sem remover as anteriores. Após a revisão final da Etapa 7B, o agregado possuía 292 testes únicos. A implementação inicial da Etapa 7C-A elevou esse total a 388; sua revisão de segurança acrescentou 27 casos únicos nos runtimes e fluxos de posição e na suíte conjunta, levando o agregado a 415. Os comandos específicos continuam sobrepostos ao agregado e não devem ser somados novamente. `get_game_context` permanece desconectada da interface do Professor IA.

## 23. Definição OpenAI e fluxo forçado de `get_game_context` — Etapa 7B

### Runtime determinístico versus Tool registrada

`executeGetGameContext` é a fronteira determinística que valida argumentos, snapshot, autorização owner-only e resultado. A definição em `get-game-context.openai.ts` é apenas o contrato apresentado ao modelo; ela não executa código nem concede acesso. O orquestrador aceita uma solicitação do modelo somente depois de validar o protocolo e chama exclusivamente o executor determinístico, nunca `getGameContext` diretamente.

### Definição e argumentos

A Tool usa o nome exato `get_game_context`, `type: "function"`, `strict: true` e `additionalProperties: false`. Seu único argumento obrigatório é `gameContextId`, string de 1 a 128 caracteres com o mesmo `pattern` `^[A-Za-z0-9._:-]+$` do schema Zod do runtime. A definição não aceita PGN, FEN, usuário, adversário, rating, notas ou tags.

O formato restrito importa porque opacidade não significa texto livre. `JSON.stringify` escapa uma string para que ela seja JSON válido, mas não torna seu conteúdo semanticamente neutro: espaços, quebras de linha ou uma instrução continuam chegando ao modelo como texto. A allowlist reduz o identificador ao alfabeto necessário aos IDs reais do projeto e rejeita conteúdo instrucional ou caracteres de controle, sem tentar “consertar” o valor removendo caracteres. A autorização e a igualdade com o snapshot continuam sendo verificações separadas; sintaxe segura não concede acesso.

A descrição explicita que a função retorna somente fatos da única partida já selecionada e autorizada; não pesquisa nem enumera histórico; não acessa store ou `localStorage`; não calcula estatísticas; não usa engine; não indica melhor lance; não analisa autonomamente a partida; e não recebe PGN como argumento. O ID correlaciona a solicitação ao snapshot server-side e nunca concede autorização.

### Primeira chamada lógica

`runGameContextToolFlow` recebe transportes e executor injetáveis, mensagem, snapshot, modelo e prompt selecionado. Antes do provider, valida presença e schema do snapshot. A entrada mantém a mensagem original em um item `user` e cria um item técnico `developer` contendo somente o `gameContextId` derivado do snapshot. PGN, notas, tags, adversário, ratings, data e IDs de usuário não entram nesse contexto técnico.

A chamada usa `gpt-5-mini`, o prompt versionado existente, somente a definição `get_game_context`, `tool_choice: { type: "function", name: "get_game_context" }`, `parallel_tool_calls: false` e `store: false`. Um ID escrito pelo usuário não substitui o ID do snapshot.

### `response.output` não confiável e execução

O fluxo procura itens por tipo, sem confiar na ordem, e exige exatamente uma `function_call`. Rejeita ausência ou multiplicidade, nome diferente, `call_id` ausente, vazio ou acima de 256 caracteres, `arguments` ausente ou não string, JSON inválido, valores primitivos ou arrays, propriedades extras, PGN/FEN injetados e ID divergente. Nenhum valor é corrigido ou inventado.

Itens legítimos como `reasoning` e `message` são preservados integralmente. Depois da validação, somente `executeGetGameContext({ rawArguments, authorizedSnapshot })` é executado. Snapshot ausente ou inválido, não proprietário e falha interna encerram o ciclo antes da segunda chamada; não há fallback, lookup, store, banco ou outra partida.

Os testes distinguem precisamente as fronteiras. Erros de protocolo — output sem chamada válida, multiplicidade, nome ou `call_id` incorreto, `arguments` ausente/não string e JSON sintaticamente inválido — executam a Tool zero vezes. Quando `arguments` já foi interpretado como JSON, mas a rejeição depende do schema determinístico, de propriedades proibidas, do formato do ID ou da autorização, o executor é chamado exatamente uma vez. Em todos os erros, somente `createResponse` ocorreu; `parseResponse` e qualquer terceira chamada permanecem ausentes.

O resultado bem-sucedido vira um único item:

```json
{
  "type": "function_call_output",
  "call_id": "o mesmo call_id",
  "output": "{\"success\":true,\"data\":{...}}"
}
```

`output` recebe uma única serialização JSON. O envelope não contém snapshot, IDs de usuário, argumentos separados, stack, `cause` ou objetos do SDK.

### Segunda chamada lógica

A entrada final concatena, nesta ordem, a entrada original, todos os itens da primeira `response.output` sem filtragem ou reordenação e o `function_call_output`. Como no fluxo de posição, o SDK 6.47.0 possui uma divergência entre as unions de output e input para algumas Tools embutidas. Uma conversão de tipo localizada é aplicada somente depois da concatenação integral; nenhum item é descartado.

A segunda chamada usa o mesmo modelo e prompt, `store: false`, não disponibiliza Tools, não usa `tool_choice` e não permite outro ciclo. Ela usa `responses.parse`, `zodTextFormat`, o schema `provisional-teacher-response-v1` e valida novamente `output_parsed`. O fluxo termina após exatamente duas chamadas lógicas: não há terceira chamada, loop, retry, streaming ou paralelismo.

O resultado público contém somente o modelo e versões, `data` validado e `{ name: "get_game_context", callCount: 1, executionStatus: "completed" }`. Não contém `call_id`, argumentos, snapshot, PGN intermediário, resposta bruta ou diagnóstico interno.

### Rota técnica, erros e HTTP

`POST /api/ai/test/tools/game-context` usa runtime Node.js e responde `404` sem `ENABLE_AI_TEST_ROUTE === "true"`. Além dos limites por campo, a rota impõe um limite total de 262.144 bytes. O valor cobre os máximos atuais de mensagem, PGN, notas, tags e metadados mesmo considerando UTF-8 e escapes JSON; limites de campo controlam cada dado, enquanto o limite total impede que a leitura do envelope completo cresça sem controle.

A ordem é: flag exata, seleção do prompt, sinal antecipado de `Content-Length`, leitura por `request.text()`, medição dos bytes reais com `TextEncoder`, `JSON.parse`, schema estrito, owner-only, criação do cliente e fluxo. `Content-Length` é útil para rejeitar cedo, mas pode estar ausente ou mentir; por isso nunca substitui a medição real. A rota não usa `request.json()`. Corpo acima do teto retorna `413 request_body_too_large`, com mensagem genérica e sem logar conteúdo; JSON malformado ou schema inválido abaixo ou exatamente no teto permanece `400`. `AI_TEST_PROMPT_VERSION` reutiliza o registro existente; versão desconhecida e chave ausente produzem `503`; não proprietário produz `403`.

Refusals produzem `422`. Resposta incompleta, Structured Output indisponível, falha de protocolo, falha da Tool no ciclo e erro do provider produzem `502`. Falhas internas locais e invariantes inesperadas produzem `500`. O `switch` do mapeamento é exaustivo. Somente `PROVIDER_ERROR` recebe o diagnóstico sanitizado do SDK; erros locais nunca são atribuídos automaticamente ao provider. As mensagens públicas não incluem dados da partida, API key, stack, `cause` ou mensagem bruta do provider.

O teste de sucesso da rota verifica o wiring completo: mensagem validada, snapshot integral, modelo, versão e texto do prompt selecionado chegam ao orquestrador, junto de um transporte com `createResponse` e `parseResponse`. As funções do transporte não são invocadas nesse teste de rota. Para `PROVIDER_ERROR`, o log contém somente o marcador e o objeto sanitizado devolvido pelo diagnóstico; a `cause` bruta e os dados da partida não aparecem. Erros locais inesperados não executam o diagnóstico e registram somente o marcador genérico `internal_error`.

### Testes e limitações

`npm run test:game-context-tool-flow` executa 96 testes offline da definição, schemas compartilhados, fluxo e rota. Eles cobrem configuração das duas chamadas, preservação de `reasoning`, `message` e `function_call`, output malformado, envelope e correlação por `call_id`, formato compartilhado do ID, fronteira exata entre protocolo e executor determinístico, argumentos maliciosos, snapshots, owner-only, execução única, ausência de terceira chamada, wiring completo da rota, conteúdo exato dos logs, erros do provider e Structured Output, sanitização, precedência das validações HTTP, `Content-Length` excessivo, ausente ou menor que o corpo real, fronteira exata em bytes, ausência de vazamento e de criação do cliente nas rejeições, restauração normal e excepcional de `process.env` e cliente injetado. Nenhum teste monkey patcha o SDK global ou acessa rede.

O estado desta baseline permanece estritamente técnico: a Tool está disponível apenas na rota isolada e forçada para validar infraestrutura. O fluxo conjunto posterior está documentado na seção 24; nenhum dos dois está na interface pública ou implementa engine, autenticação real, backend, RAG, streaming ou retries.

## 24. Orquestração conjunta de contexto — Etapa 7C-A

### Escopo técnico

A Etapa 7C-A cria um fluxo isolado que disponibiliza simultaneamente as definições existentes `getGameContextOpenAITool` e `getPositionContextOpenAITool`. A ordem é estável — partida antes de posição — apenas para tornar payloads e testes reproduzíveis; ela não representa prioridade semântica. As definições continuam sendo as fontes únicas dos nomes, descriptions, `strict: true`, limites, pattern de `gameContextId` e `additionalProperties: false`.

O fluxo não substitui os baselines forçados, o modo automático exclusivo de posição, os casos `AUTO-SEL` nem seu runner. Também não cria agente genérico, loop, terceira chamada, retry, streaming ou integração pública.

### Contrato discriminado de autorização

`AuthorizedProfessorContext` é uma união discriminada Zod estrita:

```ts
type AuthorizedProfessorContext =
  | { type: "game"; snapshot: AuthorizedGameSnapshot }
  | { type: "position"; snapshot: AuthorizedPositionSnapshot }
  | { type: "none" };
```

Cada branch reutiliza integralmente o schema real do snapshot correspondente. Estruturas híbridas, propriedades adicionais, snapshot da categoria errada, dois snapshots, `none` com snapshot e branches sem o snapshot obrigatório são rejeitados. O contrato representa a escolha da aplicação, não uma escolha feita pelo modelo. Partidas continuam owner-only e são recusadas antes da criação do cliente quando proprietário e solicitante divergem.

### Contexto mínimo enviado ao provider

A mensagem original permanece em um item `user`. Um item `developer` separado contém somente JSON técnico gerado no servidor:

- `{"type":"game","gameContextId":"..."}`;
- `{"type":"position","positionContextId":"..."}`;
- `{"type":"none"}`.

O ID sempre vem do snapshot autorizado. Um ID escrito na mensagem do usuário não o substitui. Snapshot, PGN, FEN, adversário, ratings, notas, tags, origem da imagem, IDs de usuário, store e `localStorage` não entram nessa primeira chamada.

### Primeira interação e matriz de compatibilidade

A primeira interação usa `gpt-5-mini`, o system prompt selecionado pelo registro existente, as duas Tools, `tool_choice: "auto"`, `parallel_tool_calls: false` e `store: false`. Não há Structured Output nessa fase. Zero `function_call` e uma única `function_call` são resultados permitidos; itens legítimos como `reasoning` e `message` são preservados somente depois da validação estrutural descrita abaixo.

### Validação estrutural dos itens do provider

`response.output` continua sendo entrada não confiável mesmo quando veio do SDK e mesmo quando o campo `type` contém um discriminador conhecido. Conferir apenas `type: "message"`, por exemplo, não demonstra que `content` seja um array, que cada parte possua um tipo aceito ou que `output_text` e `refusal` contenham seus textos obrigatórios. Do mesmo modo, `type: "reasoning"` não comprova a presença de `id` e `summary`, e `type: "function_call"` não comprova que `name`, `call_id` e `arguments` sejam strings.

O fluxo conjunto usa type guards determinísticos baseados nas interfaces reais do SDK OpenAI 6.47.0. Na primeira resposta, aceita somente `ResponseReasoningItem`, `ResponseOutputMessage` e `ResponseFunctionToolCall` estruturalmente válidos; na resposta final, aceita somente reasoning e message. Mensagens validam `id`, papel, status, `content`, os tipos `output_text` e `refusal`, seus textos e as estruturas auxiliares presentes. Reasoning valida `id`, `summary` e suas partes, além dos campos opcionais quando enviados. Function calls validam sua estrutura antes das regras semânticas separadas de nome suportado, limite do `call_id`, JSON, quantidade e autorização.

Um cast TypeScript não executa em runtime e não transforma um objeto em `ResponseOutputItem`; ele apenas instrui o compilador a confiar no programador. Por isso, a conversão entre as unions de output e input só ocorre depois que todos os itens foram validados. Objetos malformados não são corrigidos, filtrados ou reenviados. Itens legítimos continuam preservados por referência e na ordem original.

### Mesmo alfabeto para os dois IDs técnicos

`gameContextId` e `positionContextId` agora compartilham os mesmos princípios: `trim`, mínimo 1, máximo 128 e allowlist `^[A-Za-z0-9._:-]+$` aplicada no Zod e no JSON Schema da Tool. Letras, números, ponto, underscore, dois-pontos e hífen são aceitos; espaços internos, controles, aspas, barras, chaves e texto instrucional são rejeitados sem remoção ou normalização permissiva.

Essa é apenas **sintaxe segura**: o valor tem forma adequada para um identificador opaco e não carrega texto livre. **Semântica segura** continua dependendo de igualdade exata com o único snapshot autorizado e das regras de acesso correspondentes. Um ID perfeitamente formatado, mas divergente, continua produzindo `POSITION_CONTEXT_NOT_AUTHORIZED` ou `GAME_CONTEXT_NOT_AUTHORIZED` e nunca provoca lookup ou fallback.

Antes da execução, o servidor aplica esta matriz determinística:

| Contexto autorizado | Decisão aceita |
| --- | --- |
| `game` | `get_game_context` ou nenhuma Tool |
| `position` | `get_position_context` ou nenhuma Tool |
| `none` | nenhuma Tool |

Uma Tool incompatível produz `TOOL_CONTEXT_MISMATCH`. Não existe fallback para a outra Tool, transformação da escolha nem execução sem o snapshot correspondente.

### Caminho com Tool

Com exatamente uma chamada, o fluxo valida o nome, limita `call_id` a 256 caracteres não vazios, exige `arguments` string e interpreta o JSON como `unknown`. Depois da matriz, chama exclusivamente `executeGetGameContext` ou `executeGetPositionContext` com `rawArguments` e o snapshot da branch autorizada. O resultado determinístico é validado novamente pelo schema real antes de gerar um único item:

```json
{
  "type": "function_call_output",
  "call_id": "o mesmo call_id",
  "output": "{\"success\":true,\"data\":{...}}"
}
```

O envelope sofre uma única serialização. Ele não inclui snapshot, argumentos separados, IDs de usuário, dados da outra Tool, stack, `cause` ou objeto bruto do SDK.

### Caminho sem Tool

Zero `function_call` é uma decisão válida. Nenhum executor é chamado e nenhum `function_call_output` é criado. Todos os itens legítimos da primeira resposta, inclusive uma mensagem direta, continuam na entrada seguinte. Esse caminho não afirma que a decisão ou a resposta sejam semanticamente corretas; apenas preserva uma decisão válida do protocolo para avaliação futura.

### Segunda interação e resultado público

Nos dois caminhos ocorre sempre uma segunda interação. A entrada preserva, na ordem, a entrada original, todos os itens da primeira `response.output` e, somente no caminho com Tool, o `function_call_output` ao final. A conversão localizada entre as unions do SDK 6.47.0 acontece apenas depois da concatenação integral.

A segunda chamada usa o mesmo modelo e prompt, `store: false`, `responses.parse`, `zodTextFormat` e `provisional-teacher-response-v1`. Ela não recebe `tools`, `tool_choice` ou `parallel_tool_calls`. O fluxo termina depois de `create + parse`, sem terceira interação.

O resultado estrito expõe somente `data` e uma união coerente `toolDecision`:

```json
{
  "data": {},
  "toolDecision": {
    "status": "called | not_called",
    "name": "get_game_context | get_position_context | null",
    "callCount": "0 | 1",
    "executionStatus": "completed | not_executed"
  }
}
```

`called` exige nome, uma chamada e execução concluída. `not_called` exige nome nulo, zero chamadas e nenhuma execução. `call_id`, argumentos, snapshots, IDs internos, outputs intermediários e respostas brutas não integram o resultado.

### Erros e rota técnica

O fluxo classifica output malformado, chamadas múltiplas, nome desconhecido, incompatibilidade de contexto, `call_id`, JSON, argumentos, snapshots, autorização, falha da Tool, respostas incompletas, refusal, Structured Output ausente, provider e erro interno inesperado. Mensagens públicas são fixas e não contêm IDs, PGN, FEN, adversário, notas, tags, chave, mensagem bruta, stack ou `cause`. Somente `PROVIDER_ERROR` recebe o diagnóstico sanitizado do SDK.

`POST /api/ai/test/tools/context-selection` usa runtime Node.js, permanece desabilitada sem `ENABLE_AI_TEST_ROUTE=true` e não possui link na interface. A ordem de validação é flag, prompt, `Content-Length`, leitura textual, medição real por `TextEncoder`, `JSON.parse`, Zod estrito, autorização owner-only, cliente e fluxo. O limite total é 262.144 bytes.

O mapeamento HTTP é: `404` para rota desabilitada; `400` para JSON/body/mensagem/snapshot inválido; `403` para contexto não autorizado; `413` para body excessivo; `422` para refusal; `500` para erro interno local; `502` para protocolo, `TOOL_CONTEXT_MISMATCH`, falha da Tool, resposta incompleta, Structured Output ou provider; e `503` para chave ausente ou prompt desconhecido. O switch sobre erros do fluxo é exaustivo.

### Testes offline e limitações

`npm run test:professor-context-tool-flow` executa 119 testes offline do schema, fluxo e rota. Eles cobrem game, position e ausência de Tool; executor correto e exclusão do outro; minimização da primeira entrada; matriz completa de incompatibilidade; protocolo e argumentos; guards estruturais de output; preservação e ordem; serialização única; configuração das duas interações; falhas e ausência de vazamento; formato e limites do ID de posição; limite real e declarado do body; precedência antes do cliente; wiring; sucessos das três branches; mapeamento HTTP; logs sanitizados; restauração de ambiente e execução serial dos testes que alteram `process.env`.

O agregado `npm run test:ai-tools` contém 465 testes únicos após a revisão final da Etapa 7C-B. Suítes específicas e agregada se sobrepõem e não devem ser somadas novamente.

Esses testes comprovam a orquestração do código com transportes e executores simulados. Nenhuma chamada à OpenAI e nenhum eval real foram executados na Etapa 7C-A. Portanto, eles não demonstram que o modelo seleciona corretamente partida, posição ou ausência de Tool em mensagens reais. Essa qualidade deverá ser medida em uma etapa futura, separadamente da correção da infraestrutura.

## Runner conjunto de seleção

Foi preparado um runner opt-in para avaliar futuramente se o modelo escolhe `get_game_context`, `get_position_context` ou nenhuma Tool no fluxo conjunto real. Seleção correta é diferente de execução correta: a primeira é uma decisão probabilística do modelo; a segunda permanece uma operação determinística validada pelo servidor.

A matriz server-side continua sendo a autoridade final. Uma escolha errada do modelo não concede acesso, não troca o contexto autorizado e não cria fallback; incompatibilidades continuam sendo erros técnicos sanitizados. O runner está preparado e coberto offline, mas não foi executado nesta etapa, portanto não há resultado real sobre a qualidade da seleção.
