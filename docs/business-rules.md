# Regras de negócio de partidas

## Origem e privacidade

Partidas `platform` são registradas pelo TeaChess, públicas no modelo do protótipo e contam para estatísticas oficiais e ranking. Partidas `external` são cadastradas manualmente, sempre privadas, não alteram o rating oficial e não entram em ranking ou estatísticas públicas. As fontes externas suportadas são presencial, Chess.com, Lichess e outro.

O protótipo usa `currentUser` como jogador comum e usuários mockados para adversários da plataforma. Adversários externos não precisam de perfil `User`.

## Permissões

O jogador pode ver suas partidas privadas e partidas públicas, além de editar somente observações e tags das próprias partidas. Pode excluir somente partidas externas que cadastrou. Partidas da plataforma não podem ser excluídas pelo jogador. A edição completa de dados técnicos fica reservada ao papel `admin`, cuja interface ainda não existe.

Os helpers em `lib/utils/gameRules.ts` centralizam essas decisões, e a store repete as validações para edição de notas e exclusão. Isso é apenas uma representação no cliente: em produção, autenticação, autorização e privacidade devem ser validadas novamente por um backend. Ocultar botões no frontend não é segurança real.

## Estatísticas e ranking

`countsForOfficialStats` e `countsForRanking` aceitam somente partidas `platform`. O Dashboard começa na visão oficial. A preferência “Incluir partidas externas” habilita uma visão pessoal combinada, privada e persistida no `localStorage`; ela não muda a curva oficial de rating, o ranking ou o perfil.

Análises, precisão, erros e recomendações continuam simulados. Na visão combinada, métricas pessoais e histórico recente podem incluir partidas externas; a evolução oficial do rating sempre usa apenas partidas da plataforma.

## Rating histórico e atual

`playerRatingAtGame` e `opponentRatingAtGame` guardam o valor histórico no momento da partida quando ele é conhecido. Em partidas externas, ambos os ratings, a abertura e a quantidade de lances podem não ser informados; a interface preserva essa ausência sem criar valores fictícios. Em partidas da plataforma, esses quatro dados continuam obrigatórios e registrados pelo sistema. O rating atual nunca é copiado para a partida: ele vem de `User.currentPlatformRating`. Quando um adversário externo não possui usuário TeaChess, seu rating atual é indisponível.

Uma partida externa pode comparar o rating histórico do jogador ao rating oficial atual, mas essa diferença é apenas informativa e não significa que a partida alterou o rating. Sem rating histórico, nenhuma diferença, alta ou queda é calculada.

## Persistência e migração

A store de partidas usa persistência Zustand versão 3 mantendo a chave anterior do `localStorage`. A migração converte `playerRating` e `opponentRating`, remove as chaves legadas, preserva campos técnicos e pessoais e preenche propriedade, origem e visibilidade. IDs dos mocks oficiais recebem classificação determinística; registros antigos sem correspondência com mocks são tratados como partidas externas privadas pertencentes ao usuário atual. Campos opcionais ausentes nessas partidas permanecem ausentes.

## Limitações do protótipo

Não há autenticação, backend, banco de dados, multiplayer real, Stockfish, IA, LLM, OCR ou visão computacional. Os dados permanecem no navegador. Não existe painel administrativo nem proteção real de servidor.

## Professor IA

A página Professor IA contém somente demonstrações locais e inicialmente aceita apenas análise de partida e posição específica privada. Partida isolada, tema de treinamento e contexto geral foram removidos das opções de novas conversas. Nenhuma resposta é produzida por modelo: perguntas sugeridas e livres selecionam templates determinísticos que combinam apenas dados mockados ou registros do usuário atual que ele pode visualizar. A interface sempre identifica respostas e reconhecimento de posições como simulados e preserva explicitamente a ausência de análise ou FEN, sem inventar avaliações, melhores lances ou variantes.

Motor de xadrez, visão computacional e modelo de linguagem possuem responsabilidades diferentes. Um motor futuro deverá fornecer avaliações e alternativas técnicas; visão computacional deverá reconhecer e preparar uma posição para confirmação; um modelo de linguagem futuro poderá explicar dados validados e adaptar a linguagem, mas não deverá criar avaliações de tabuleiro. Backend futuro deverá aplicar autenticação, permissões, persistência, auditoria e segurança.

O histórico da demonstração é privado, limitado às 30 interações mais recentes, ordenado deterministicamente da mais recente para a mais antiga e persistido somente no `localStorage`. A migração preserva conversas de contextos antigos como leitura, sem oferecê-los para novas perguntas. “Nova conversa” limpa apenas esse histórico e preserva partidas, análises, posições e treinamento. Segurança real dependerá de validação no backend; ocultar dados ou controles no cliente não constitui autorização.

## Professor humano

A área Professor humano é exclusivamente um catálogo e fluxo de agendamento simulados. Professores, títulos, avaliações, horários e valores são fictícios; não representam pessoas reais. Confirmar uma aula cria apenas um registro versionado no `localStorage`, sem contato, pagamento, reserva, mensagem ou aula real.

Partidas externas, posições e observações permanecem privadas. Nenhum dado é compartilhado nesta versão. Um compartilhamento futuro deverá exigir escolha e autorização explícitas do aluno, autenticação, controle de acesso e backend seguro. Professores verão somente conteúdo conscientemente autorizado.

Uma IA futura não poderá alterar rating ou ranking fora das regras oficiais. Partidas externas continuam privadas e não entram em estatísticas públicas. Respostas futuras deverão identificar fontes, separar conteúdo técnico de explicação, sinalizar incerteza e permitir rastreabilidade e revisão humana.

## Demonstração local da página Jogar

A página Jogar demonstra localmente a futura experiência multiplayer, mas não conecta jogadores reais. O usuário controla legalmente os dois lados do tabuleiro para testar o fluxo; não existe bot, IA, motor ou escolha automática de lances. A presença dos adversários é mockada e não representa pessoas online.

As sessões não criam `ChessGame`, não entram na store de partidas e não alteram rating, ranking, estatísticas, treinamento ou análises. A partida em andamento ou finalizada, seu histórico, relógios, orientação e chat são persistidos somente no `localStorage` por uma store Zustand versionada. Ao restaurar, o tempo decorrido é descontado do jogador da vez, mas esses relógios do navegador não são autoritativos nem seguros para competição. A demonstração só é removida pela ação explícita de encerramento. Nenhuma mensagem do chat é enviada a outro usuário.

A procura de partida é simulada e usa por padrão a faixa de rating ±200. Busca e salas aceitam faixas configuráveis (±100, ±200, ±400 ou sem limite), aplicadas deterministicamente aos mocks disponíveis. Desafios diretos também respeitam a faixa de adversários aceita por cada jogador simulado. Nenhuma dessas ações cria presença, convite ou conexão real.

As salas abertas são mocks determinísticos. Uma sala própria pode ser criada e cancelada apenas na sessão atual do navegador; nenhum outro usuário pode vê-la. Entrar em uma sala compatível apenas configura a mesma demonstração local de partida.

Matchmaking e partidas reais futuras dependerão de backend, autenticação, websocket ou outra comunicação em tempo real, validação de movimentos e relógios autoritativos no servidor, persistência e sistema de rating. Elas contarão para o ranking somente após validação do servidor.

As mensagens do chat permanecem até o fim da partida e não podem ser apagadas manualmente durante a sessão. Exemplos e sugestões são apenas elementos da interface do chat vazio, desaparecem após a primeira mensagem e não são persistidos como mensagens reais.

Cada usuário pode manter somente uma partida demonstrativa ativa. Seleção direta, matchmaking, salas abertas e demais entradas usam a mesma validação central da store e não podem substituir posição, relógios, lances ou chat de uma sessão jogável. Após abandono, empate, xeque-mate ou término por tempo, `activeMatch` é limpa e o resumo terminal permanece apenas para o diálogo de resultado; “Nova demonstração” retorna à preparação.

A store sincroniza alterações entre abas do mesmo navegador pelo evento `storage` e consulta o estado persistido antes de criar uma sessão. Essa coordenação via `localStorage` serve somente ao protótipo, não é garantia de concorrência e não substitui validação de servidor. A regra real de uma única partida ativa dependerá de backend e autenticação.

## Treinamento pessoal

O plano de treinamento é privado. Por padrão, recomendações e indicadores usam somente partidas da plataforma. A preferência “Incluir partidas externas” permite que partidas próprias externas participem apenas da visão pessoal combinada; elas nunca alteram ranking, rating ou estatísticas oficiais e seus dados não são expostos publicamente. A proteção real desta separação dependerá de autenticação e autorização em backend.

Temas, exercícios, prioridades e plano semanal são simulações determinísticas derivadas dos mocks de `TrainingTopic`, análises, categorias de erro, pontos fortes, pontos a melhorar, aberturas, resultados e `CoachRecommendation`. Quando não há análises suficientes, a interface identifica o uso do catálogo mockado como fallback. Não há geração real de exercícios, análise automática, Stockfish, IA ou LLM.

Conclusões de atividades, progresso de exercícios, histórico e temas adicionados são persistidos somente no `localStorage` por uma store Zustand versionada. Restaurar o plano substitui esses dados pelo estado demonstrativo inicial. Nenhuma atividade de treinamento influencia o ranking ou o rating oficial. Futuramente, IA generativa poderá explicar erros e adaptar planos, desde que seja integrada de forma explícita e com regras adequadas de privacidade.

## Envios de imagens

Cada upload representa exclusivamente uma posição de estudo e aceita uma única imagem PNG, JPEG ou WebP de até 10 MB. A imagem pode ser uma foto de tabuleiro físico ou um print de partida online, com plataforma ou contexto compatível com a origem escolhida. Não há suporte a sequências nem reconstrução de partidas.

Todo upload pertence ao usuário atual, é privado e não afeta ranking, rating ou estatísticas públicas. O protótipo não cria links públicos e permite ao usuário consultar, estudar e excluir somente seus próprios registros. Essa proteção é apenas uma simulação no cliente; permissões reais dependerão de backend e autenticação.

As imagens reais não são persistidas: `File`, `Blob`, base64 e object URLs permanecem fora do estado salvo. Apenas nome, tipo MIME, tamanho e informações do formulário ficam no `localStorage`. O preview usa object URL temporário durante a sessão, é revogado ao substituir ou excluir a imagem e fica indisponível após recarregar a página.

No produto futuro, visão computacional poderá reconhecer as peças e gerar o FEN automaticamente. Nesta versão não há OCR, reconhecimento de peças, extração nem geração real de FEN: todo FEN, lado a jogar e confiança apresentados são dados mockados determinísticos, rotulados como demonstração simulada. O tabuleiro permite apenas estudo local com movimentos legais via `chess.js`, sem Stockfish, avaliação ou sugestão automática.

Os controles dentro do estudo da posição continuam desabilitados. As páginas de Professor IA e Professor humano oferecem fluxos demonstrativos separados, mas não existe modelo de IA, compartilhamento público, revisão humana ou agendamento real nesta versão.

A persistência de uploads usa Zustand versão 3 na mesma chave do `localStorage`. A migração preserva registros anteriores, converte sua origem e contexto para o modelo atual e, quando encontra múltiplos arquivos, guarda somente os metadados do primeiro e registra uma observação de migração sem exigir limpeza do navegador.

## Ranking da comunidade

O ranking oficial usa exclusivamente partidas com `origin === "platform"`. Partidas externas são privadas e ficam integralmente excluídas das partidas jogadas, vitórias, derrotas, empates, taxa de vitória, rating, posição e perfil público. O perfil público demonstrativo mostra somente identidade comunitária e estatísticas oficiais da plataforma; nunca expõe partidas externas, uploads, posições e notas privadas, tags privadas, análises, plano de treinamento ou dados de contato.

O rating atual vem do perfil oficial mockado. A classificação ordena por maior rating, depois maior número de vitórias, maior taxa de vitória e nome em ordem alfabética. Rating, histórico de posição e critérios de desempate são simulados nesta versão; não existe cálculo Elo nem competição real.

Treinamentos, uploads de imagens e análises simuladas não interferem na classificação. Segurança, autorização, cálculo competitivo e validação reais dependerão de autenticação e backend futuros.
