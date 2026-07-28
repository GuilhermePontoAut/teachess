# Arquitetura futura de análise e explicação pedagógica

Este documento descreve a direção de produto, não uma integração ativa. A rota `/futura-ia` deixou o formato de chat e agora prepara localmente um job demonstrativo de análise de partida ou posição. Não há requisição de rede, modelo, motor, OCR, visão computacional, banco ou backend de produto.

## Entradas previstas

- PGN e FEN fornecidos ou confirmados pelo jogador;
- imagem privada de tabuleiro físico ou print de partida;
- partida da plataforma autorizada para o usuário;
- histórico pessoal e plano de treinamento com acesso permitido;
- rating do jogador como sinal pedagógico inicial, com limites provisórios e configuráveis.

## Fluxo técnico futuro

1. Receber a entrada e declarar seu propósito.
2. Validar autenticação, propriedade, consentimento e escopo de acesso no servidor.
3. Normalizar dados da partida ou posição e pedir confirmação quando houver reconhecimento.
4. Enviar somente a posição validada a um motor de xadrez para avaliação técnica.
5. Recuperar histórico e padrões autorizados do jogador com indicação de origem.
6. Derivar um perfil pedagógico inicial, usando rating com cautela e sem tratá-lo como classificação universal.
7. Fornecer os fatos técnicos e fontes a um modelo de linguagem para explicação didática.
8. Validar formato, incerteza, atribuição e rastreabilidade da resposta.
9. Persistir resultados e reutilizar com segurança análises equivalentes por FEN e configuração do motor.
10. Apresentar a explicação ao jogador e oferecer revisão por professor humano.

## Responsabilidades

O motor de xadrez futuro será responsável por movimentos legais, avaliações, alternativas, classificação técnica de erros e variantes. Ele não deverá definir sozinho a linguagem pedagógica ou o plano pessoal.

A visão computacional futura será responsável por detectar o tabuleiro, identificar peças, estimar orientação e gerar uma representação candidata. O jogador deverá revisar a posição antes que ela seja usada tecnicamente.

O modelo de linguagem futuro será responsável por explicação, adaptação ao nível, organização do estudo e diálogo. Ele não deverá inventar avaliações, variantes, fontes ou fatos ausentes. Nenhum provedor está definido.

O backend futuro será responsável por autenticação, autorização, privacidade, persistência, auditoria, histórico, exclusão e segurança. Um banco e um cache por FEN/configuração poderão evitar processamento repetido, mas ainda não foram escolhidos nem integrados. Regras no frontend servem apenas à demonstração.

## Privacidade e rastreabilidade

Partidas externas, imagens, posições, observações pessoais e conversas permanecem privadas. Estatísticas públicas continuam usando somente partidas da plataforma. Cada resposta futura deverá registrar quais dados autorizados, versão de processamento técnico e fontes foram usados, sem expor material privado a outro usuário.

## Riscos e controles

O principal risco de um modelo de linguagem é apresentar uma inferência plausível como fato técnico. Para reduzir alucinações, a resposta deverá separar avaliação do motor, reconhecimento ainda não confirmado, dados históricos e explicação gerada. Conteúdo incerto deverá ser rotulado, e ausência de dados não poderá ser preenchida silenciosamente. Revisão humana, testes de segurança, monitoramento de qualidade e trilha de auditoria serão necessários antes de qualquer uso real.

## Limitações atuais

A demonstração atual apenas percorre estados locais de um job. Ela não chama a integração OpenAI histórica, não carrega ou executa Stockfish, não avalia posições e não produz relatório pedagógico. O `localStorage` guarda somente a seleção e resultados estruturais estáveis; estados transitórios não são restaurados. Banco, cache por FEN e processamento real permanecem futuros.
