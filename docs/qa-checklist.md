# Checklist de QA integrado

Revisão realizada em 11/07/2026. Os estados abaixo distinguem inspeção de código, validação automatizada e verificações que ainda dependem de navegador e tecnologias assistivas.

## Rotas verificadas

| Rota | Estado | Observação |
| --- | --- | --- |
| `/` | Verificado pelo código | Dashboard hidrata partidas e preferência antes de exibir cálculos. |
| `/partidas` | Verificado pelo código | Lista, filtros, ordenação, estados vazio/sem resultado, exclusão permitida e restauração. |
| `/partidas/nova` | Verificado pelo código | Cadastra somente partida externa, privada e local. |
| `/partidas/[id]` | Verificado pelo código | Trata hidratação, ID ausente, permissão, campos opcionais e ações por origem. |
| `/partidas/[id]/editar` | Verificado pelo código | Edição completa para externa própria; somente observações e tags para partida da plataforma própria. |
| `/partidas/[id]/analise` | Verificado pelo código | Trata ID ausente/sem permissão, análise ausente e fallback estático simulado. |
| `/enviar-imagem` | Verificado pelo código | Upload único, validação, preview temporário e persistência apenas de metadados. |
| `/estudo/posicoes/[id]` | Verificado pelo código | Trata hidratação, ID inexistente, propriedade, imagem indisponível e FEN ausente. |
| `/treinamento` | Verificado pelo código | Escopo oficial/combinado, persistência de progresso e fallback mockado. |
| `/ranking` | Verificado pelo código | Perfil e classificação usam somente estatísticas oficiais. |
| `/jogar` | Verificado pelo código | Sessão local única, restauração, relógios, orientação, histórico, chat e encerramento. |
| `/futura-ia` | Verificado pelo código | Página apresentada como Professor IA e inteiramente simulada. |
| `/professor-ia` | Limitação conhecida | Não existe como alias; o endereço legado `/futura-ia` é o endereço atual da demonstração. |
| `/professor-humano` | Verificado pelo código | Catálogo fictício, aulas somente online e agendamento local. |

Todas as rotas acima existentes foram incluídas com sucesso no build de produção. As rotas dinâmicas mantêm estados locais explícitos de carregamento e indisponibilidade; não foi realizado teste manual de cada URL em navegador nesta revisão.

## Funcionalidades verificadas

- **Navegação — Verificado pelo código:** ordem e nomes do menu conferem com a especificação; Professor IA e Professor humano aparecem juntos; item ativo usa `aria-current`; o menu móvel fecha ao selecionar um link.
- **Textos — Verificado pelo código:** termos de origem, rating, análise simulada, edição e professores estão consistentes nos fluxos principais. “Futura IA” não aparece como nome de menu.
- **Partidas — Verificado pelo código:** helpers e store centralizam visualização, edição e exclusão. Partidas da plataforma não podem ser excluídas e permitem apenas observações/tags; externas próprias permitem edição completa e exclusão.
- **Estatísticas — Verificado pelo código:** total, vitórias, derrotas, empates e taxa são derivados das partidas selecionadas; visão oficial filtra `origin === "platform"`; gráfico de rating permanece oficial; aberturas ausentes são ignoradas; números opcionais ausentes ficam ao final das ordenações.
- **Ranking — Verificado pelo código:** partidas externas não entram no cálculo do usuário nem no perfil público; rating atual vem do perfil; ordenação oficial aplica rating, vitórias, taxa e nome.
- **Persistência — Verificado pelo código:** todas as stores persistidas usam armazenamento seguro, `skipHydration` e reidratação manual. Há versões e migrações para partidas, uploads, partida local, Professor IA e Professor humano. Preferências, ranking e treinamento também são versionados.
- **Jogar — Verificado pelo código:** a store bloqueia nova sessão antes e depois da leitura direta do `localStorage`; nenhuma sessão cria `ChessGame`; o chat não possui ação de limpeza; exemplos não são mensagens persistidas; terminar a partida limpa `activeMatch`.
- **Professor IA — Verificado pelo código:** novas conversas aceitam apenas Análise de partida e Posição específica; histórico mantém pares pergunta/resposta, ordena os mais recentes primeiro e preserva contextos legados apenas para leitura; respostas são determinísticas e rotuladas como simuladas.
- **Professor humano — Verificado pelo código:** não existe filtro de formato; todos os horários e agendamentos são online; migração converte formatos antigos; preços são exibidos em reais; não há contato, cobrança ou aula real.
- **Rede e integrações — Verificado pelo código:** não há `fetch`, cliente de API, WebSocket, IA, LLM, Stockfish, OCR ou visão computacional. Links externos presentes são dados mockados e não são necessários para renderizar a interface.
- **Metadados — Validado por lint/build:** TeaChess, descrição global, idioma `pt-BR`, favicon e títulos das páginas principais estão definidos.
- **Responsividade e acessibilidade — Verificado pelo código:** layouts usam breakpoints, contêineres com largura mínima segura e overflow localizado; formulários possuem labels e erros; abas, menus, diálogos e botões por ícone têm semântica e atributos acessíveis nos fluxos inspecionados.

## Correções aplicadas nesta revisão

- Restaurada a ação **Editar partida** nos detalhes de partidas externas próprias.
- Mantida a ação **Editar observações** para partidas da plataforma próprias.
- Tornada tolerante a dados legados incompletos a migração do chat da partida local.
- Adicionados títulos de rota ausentes para navegação assistiva e identificação no navegador.
- Reforçada a contenção horizontal do shell sem retirar overflow específico de tabelas e blocos de notação.

## Testes automatizados executados

| Comando | Resultado final |
| --- | --- |
| `npm run lint` | Aprovado, sem erros ou avisos. |
| `npm run build` | Aprovado com Next.js 16.2.10; compilação, TypeScript e geração de páginas concluídos. |
| `git diff --check` | Aprovado, sem erros de whitespace. |

Antes das correções, `npm run lint` e `npm run build` já concluíam sem erros. O build base reconheceu 14 páginas de aplicação, incluindo a página padrão de não encontrado.

## Testes manuais ainda necessários

- **Requer validação manual:** percorrer todas as rotas em Chrome, Firefox e Safari, incluindo IDs válidos e inexistentes após popular `localStorage` com versões antigas.
- **Requer validação manual:** conferir visualmente desktop largo, notebook, tablet e celulares pequenos, em especial tabuleiros, tabelas, gráficos, diálogos, abas, chat e grade de horários.
- **Requer validação manual:** testar teclado completo, ordem de foco, retorno de foco dos diálogos, leitor de tela e contraste com ferramenta especializada.
- **Requer validação manual:** simular F5 e múltiplas abas durante uma partida local, incluindo timeout, abandono, empate e chat.
- **Requer validação manual:** validar previews de upload e revogação de object URLs com arquivos reais de todos os formatos e no limite de tamanho.
- **Requer validação manual:** inspecionar o console do navegador durante todos os fluxos; lint e build não substituem essa verificação em runtime.

## Limitações conhecidas e dados simulados

- O protótipo não possui backend, autenticação, banco de dados, multiplayer, pagamentos, motor de xadrez, OCR, visão computacional, IA ou LLM.
- Autorização e privacidade são representadas apenas no cliente e não constituem segurança real.
- Partidas, usuários, análises, ranking, professores, horários, preços, recomendações e respostas são mocks ou derivações determinísticas locais.
- Imagens reais e seus previews não sobrevivem ao recarregamento; somente metadados são persistidos.
- Relógios e sincronização entre abas usam o relógio e o `localStorage` do navegador e não são adequados para competição real.
- A demonstração Professor IA permanece na URL histórica `/futura-ia`; não há alias `/professor-ia` nesta versão.
