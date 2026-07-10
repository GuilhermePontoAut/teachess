<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repository Guidelines

## Visão do projeto

O TeaChess é um protótipo web de professor digital de xadrez. Nesta fase, desenvolva a experiência completa de interface: navegação, formulários, tabuleiros, gráficos, estados e fluxos simulados. O resultado deve parecer um produto real, mas não deve executar análises inteligentes nem depender de serviços externos.

## Stack e organização

Use Next.js com App Router e TypeScript. Antes de alterar código do framework, consulte a documentação correspondente em `node_modules/next/dist/docs/`, pois esta versão possui mudanças incompatíveis.

- `app/`: rotas, layouts, páginas e estilos globais.
- `public/`: imagens e outros arquivos estáticos.
- Componentes reutilizáveis devem ser extraídos para uma estrutura coerente, como `components/`.
- Estado local compartilhado pode usar Zustand e persistência no `localStorage`.
- Use Tailwind CSS, Lucide React, Recharts, `chess.js`, `react-chessboard` e `react-dropzone` somente quando forem adequados ao recurso.

## Limites obrigatórios

- Não integre OpenAI, Anthropic, Gemini ou qualquer LLM.
- Não integre Stockfish nem outro motor de xadrez.
- Não implemente OCR, visão computacional, backend, autenticação ou multiplayer reais.
- Represente futuras funções de IA apenas com mocks, placeholders, dados simulados, avisos visuais ou controles desabilitados.
- Não exponha dados sensíveis nem crie ou registre arquivos de credenciais.
- Não altere dependências ou a arquitetura sem necessidade clara.
- Nunca execute `npm audit fix --force` sem autorização explícita.

## Padrões de implementação

Crie componentes pequenos e reutilizáveis, com props e estados bem tipados. Evite `any`, duplicação e lógica de domínio dentro da apresentação. Use nomes descritivos: componentes em PascalCase, funções e variáveis em camelCase. A interface deve ser moderna, responsiva, acessível por teclado e consistente, com estados de carregamento, vazio, erro e indisponibilidade quando aplicáveis.

## Validação e conclusão

Execute `npm run build` após cada etapa relevante. Antes de concluir, corrija todos os erros de TypeScript, lint e build; rode também os scripts específicos disponíveis em `package.json` quando pertinentes. Não considere uma tarefa pronta apenas porque a interface renderiza.

Ao final de cada tarefa, informe:

- arquivos alterados;
- comandos e testes executados, com seus resultados;
- limitações, mocks e recursos ainda não implementados.
