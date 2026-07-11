# Arquitetura futura de IA

Este documento descreve uma possibilidade de produto, não uma integração ativa. A rota `/futura-ia` usa apenas React, Zustand, `localStorage`, mocks existentes e templates determinísticos locais. Não há requisição de rede, modelo, motor, OCR, visão computacional ou backend.

## Entradas previstas

- PGN e FEN fornecidos ou confirmados pelo jogador;
- imagem privada de tabuleiro físico ou print de partida;
- partida da plataforma autorizada para o usuário;
- histórico pessoal e plano de treinamento com acesso permitido;
- pergunta em linguagem natural.

## Fluxo técnico futuro

1. Receber a entrada e declarar seu propósito.
2. Validar autenticação, propriedade, consentimento e escopo de acesso no servidor.
3. Normalizar dados da partida ou posição e pedir confirmação quando houver reconhecimento.
4. Enviar somente a posição validada a um motor de xadrez para avaliação técnica.
5. Recuperar histórico e padrões autorizados do jogador com indicação de origem.
6. Fornecer os fatos técnicos e fontes a um modelo de linguagem para explicação didática.
7. Validar formato, incerteza, atribuição e rastreabilidade da resposta.
8. Apresentar a explicação ao jogador e oferecer revisão por professor humano.

## Responsabilidades

O motor de xadrez futuro será responsável por movimentos legais, avaliações, alternativas, classificação técnica de erros e variantes. Ele não deverá definir sozinho a linguagem pedagógica ou o plano pessoal.

A visão computacional futura será responsável por detectar o tabuleiro, identificar peças, estimar orientação e gerar uma representação candidata. O jogador deverá revisar a posição antes que ela seja usada tecnicamente.

O modelo de linguagem futuro será responsável por explicação, adaptação ao nível, organização do estudo e diálogo. Ele não deverá inventar avaliações, variantes, fontes ou fatos ausentes. Nenhum provedor está definido.

O backend futuro será responsável por autenticação, autorização, privacidade, persistência, auditoria, histórico, exclusão e segurança. Regras no frontend servem apenas à demonstração.

## Privacidade e rastreabilidade

Partidas externas, imagens, posições, observações pessoais e conversas permanecem privadas. Estatísticas públicas continuam usando somente partidas da plataforma. Cada resposta futura deverá registrar quais dados autorizados, versão de processamento técnico e fontes foram usados, sem expor material privado a outro usuário.

## Riscos e controles

O principal risco de um modelo de linguagem é apresentar uma inferência plausível como fato técnico. Para reduzir alucinações, a resposta deverá separar avaliação do motor, reconhecimento ainda não confirmado, dados históricos e explicação gerada. Conteúdo incerto deverá ser rotulado, e ausência de dados não poderá ser preenchida silenciosamente. Revisão humana, testes de segurança, monitoramento de qualidade e trilha de auditoria serão necessários antes de qualquer uso real.

## Limitações atuais

A demonstração atual não interpreta perguntas semanticamente com um modelo. Ela usa correspondência simples de termos para escolher variações de templates e combina somente campos existentes. O pequeno atraso serve para demonstrar o estado de interface “Preparando demonstração local...”, não simula processamento inteligente. O histórico fica no navegador, limitado a 30 interações, e pode ser apagado sem alterar qualquer outra store.
