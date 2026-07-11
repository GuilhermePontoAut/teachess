# Fluxo demonstrativo de Professor humano

## Descoberta e filtros

A rota `/professor-humano` apresenta dez personas fictícias. Busca e filtros locais cobrem nome, especialidade, região, idioma, preço, disponibilidade, título e ordenação. Todas as aulas demonstrativas são exclusivamente online e nenhuma consulta externa é realizada.

## Perfil e seleção de horário

O perfil detalha biografia, metodologia, experiência, idiomas, modalidade online e avaliações simuladas sem dados de contato. A agenda mostra horários determinísticos para sete dias, no fuso local, e permite uma única seleção. Não há seleção de modalidade nem atendimento presencial nesta proposta.

## Confirmação e persistência

O resumo inclui professor, data, horário, duração, modalidade online, preço demonstrativo, tema e observação opcionais. A confirmação salva um registro Zustand versionado no `localStorage`. A versão 2 da store migra agendamentos antigos presenciais, mistos ou equivalentes para online, preservando professor, data, horário, duração, preço, observações e status. “Meus agendamentos” permite consultar, cancelar localmente e repetir o fluxo. Nenhum horário é bloqueado globalmente.

## Privacidade

Nenhuma partida, posição ou observação pessoal é compartilhada. Os controles de contato e compartilhamento exibem apenas avisos locais. O aluno deverá autorizar explicitamente qualquer compartilhamento futuro, e professores verão somente o conteúdo autorizado.

## Integrações futuras e limitações

Profissionais, horários e preços são simulados. Autenticação, backend, autorização, agenda real, comunicação, notificações, pagamento e proteção de dados serão necessários para um produto real. O protótipo não usa API externa, calendário, e-mail, WhatsApp, videochamada ou meio de pagamento; uma videochamada real dependerá de backend e integração futura.
