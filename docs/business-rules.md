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

## Envios de imagens

Todo upload pertence ao usuário atual, é privado e não afeta ranking, rating ou estatísticas públicas. O protótipo não cria links públicos e permite ao usuário consultar e excluir somente seus próprios registros.

As imagens reais não são persistidas: `File`, `Blob`, base64 e object URLs permanecem fora da store. Apenas metadados (nomes, tipos MIME, tamanhos, quantidade e informações do formulário) ficam no `localStorage`. Os previews usam object URLs temporários, revogados ao remover arquivos ou desmontar o componente, e ficam indisponíveis após recarregar a página.

Não há OCR, reconhecimento de peças ou visão computacional. O FEN, quando presente, é informado manualmente pelo usuário e validado localmente com `chess.js`; ele nunca é extraído da imagem. A prévia de análise é inteiramente simulada e não executa IA, motor de xadrez, geração de PGN ou análise real.
