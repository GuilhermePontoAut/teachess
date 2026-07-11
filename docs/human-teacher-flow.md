# Fluxo demonstrativo de Professor humano

## Descoberta e filtros

A rota `/professor-humano` apresenta dez personas fictícias. Busca e filtros locais cobrem nome, especialidade, região, idioma, formato, preço, disponibilidade, título e ordenação. Nenhuma consulta externa é realizada.

## Perfil e seleção de horário

O perfil detalha biografia, metodologia, experiência, idiomas, formatos e avaliações simuladas sem dados de contato. A agenda mostra horários determinísticos para sete dias, no fuso local, e permite uma única seleção. Professores com formato “ambos” permitem escolher online ou presencial.

## Confirmação e persistência

O resumo inclui professor, data, horário, duração, formato, preço demonstrativo, tema e observação opcionais. A confirmação salva um registro Zustand versionado no `localStorage`. “Meus agendamentos” permite consultar, cancelar localmente e repetir o fluxo. Nenhum horário é bloqueado globalmente.

## Privacidade

Nenhuma partida, posição ou observação pessoal é compartilhada. Os controles de contato e compartilhamento exibem apenas avisos locais. O aluno deverá autorizar explicitamente qualquer compartilhamento futuro, e professores verão somente o conteúdo autorizado.

## Integrações futuras e limitações

Autenticação, backend, autorização, agenda real, comunicação, notificações, pagamento e proteção de dados serão necessários para um produto real. O protótipo não usa API externa, calendário, e-mail, WhatsApp, videochamada ou meio de pagamento.
