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

## Treinamento pessoal

O plano de treinamento é privado. Por padrão, recomendações e indicadores usam somente partidas da plataforma. A preferência “Incluir partidas externas” permite que partidas próprias externas participem apenas da visão pessoal combinada; elas nunca alteram ranking, rating ou estatísticas oficiais e seus dados não são expostos publicamente. A proteção real desta separação dependerá de autenticação e autorização em backend.

Temas, exercícios, prioridades e plano semanal são simulações determinísticas derivadas dos mocks de `TrainingTopic`, análises, categorias de erro, pontos fortes, pontos a melhorar, aberturas, resultados e `CoachRecommendation`. Quando não há análises suficientes, a interface identifica o uso do catálogo mockado como fallback. Não há geração real de exercícios, análise automática, Stockfish, IA ou LLM.

Conclusões de atividades, progresso de exercícios, histórico e temas adicionados são persistidos somente no `localStorage` por uma store Zustand versionada. Restaurar o plano substitui esses dados pelo estado demonstrativo inicial. Nenhuma atividade de treinamento influencia o ranking ou o rating oficial. Futuramente, IA generativa poderá explicar erros e adaptar planos, desde que seja integrada de forma explícita e com regras adequadas de privacidade.

## Envios de imagens

Cada upload representa exclusivamente uma posição de estudo e aceita uma única imagem PNG, JPEG ou WebP de até 10 MB. A imagem pode ser uma foto de tabuleiro físico ou um print de partida online, com plataforma ou contexto compatível com a origem escolhida. Não há suporte a sequências nem reconstrução de partidas.

Todo upload pertence ao usuário atual, é privado e não afeta ranking, rating ou estatísticas públicas. O protótipo não cria links públicos e permite ao usuário consultar, estudar e excluir somente seus próprios registros. Essa proteção é apenas uma simulação no cliente; permissões reais dependerão de backend e autenticação.

As imagens reais não são persistidas: `File`, `Blob`, base64 e object URLs permanecem fora do estado salvo. Apenas nome, tipo MIME, tamanho e informações do formulário ficam no `localStorage`. O preview usa object URL temporário durante a sessão, é revogado ao substituir ou excluir a imagem e fica indisponível após recarregar a página.

No produto futuro, visão computacional poderá reconhecer as peças e gerar o FEN automaticamente. Nesta versão não há OCR, reconhecimento de peças, extração nem geração real de FEN: todo FEN, lado a jogar e confiança apresentados são dados mockados determinísticos, rotulados como demonstração simulada. O tabuleiro permite apenas estudo local com movimentos legais via `chess.js`, sem Stockfish, avaliação ou sugestão automática.

Os controles de professor IA e professor humano são recursos futuros desabilitados. Não existe modelo de IA, compartilhamento público, revisão humana ou agendamento real nesta versão.

A persistência de uploads usa Zustand versão 3 na mesma chave do `localStorage`. A migração preserva registros anteriores, converte sua origem e contexto para o modelo atual e, quando encontra múltiplos arquivos, guarda somente os metadados do primeiro e registra uma observação de migração sem exigir limpeza do navegador.
