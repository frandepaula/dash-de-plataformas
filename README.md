# PlatformLens — Comparador de plataformas

Aplicação React + Vite para comparar matrizes CSV de plataformas de CRM/Marketing Automation.

## Executar localmente
1. Instale Node.js 18 ou superior.
2. Extraia o projeto.
3. No terminal, entre na pasta `platform-comparator`.
4. Execute `npm install`.
5. Execute `npm run dev` e abra o endereço exibido pelo Vite.

## Como importar uma nova plataforma
Use **Importar CSV**. O arquivo deve seguir o mesmo padrão das planilhas de exemplo: título nas primeiras linhas, cabeçalho `Categoria` e `Funcionalidade / Módulo` na linha de cabeçalho, seguido das funcionalidades. A aplicação tenta identificar o nome da plataforma pelo título do arquivo/conteúdo.

## Recursos
- Matrizes iniciais AJO e Salesforce Marketing Cloud.
- Busca textual e filtros por categoria e complexidade.
- Visão focada em IA/MCP/agentes e visão de relatórios.
- Seleção de plataformas e exportação do comparativo em CSV.
- Os dados são processados no navegador; não há envio dos CSVs para servidor.

## Observação
A visão de comparação agrupa funcionalidades pelo nome. Funcionalidades com nomes diferentes, mas equivalentes, podem precisar de padronização manual para uma comparação semântica mais precisa.
