# ValidaSmart - Controle de Validade & Lote por Foto com OCR e Planilha

Aplicativo completo em **React 19**, **TypeScript** e **Tailwind CSS** para captura e controle inteligente de validades e lotes de produtos através de foto, extração por OCR (reconhecimento óptico de caracteres) e geração/exportação de planilhas com alertas preventivos para itens com vencimento a partir de 6 meses.

---

## 🚀 Principais Funcionalidades

1. **Captura de Foto com Mira & OCR**:
   - Câmera em tempo real com visor direcionador (`viewfinder`) para enquadrar a data de validade e lote.
   - Alternância entre câmera traseira (`environment`) e frontal (`user`).
   - Suporte a upload de fotos da galeria ou arquivos (`input file`).
   - Pré-processamento no Canvas (escala de cinza, realce de contraste e binarização) para ler caracteres impressos por jato de tinta (*inkjet dot-matrix*).
   - Motor OCR com **Tesseract.js** em Português e Inglês com barra de progresso em tempo real.
   - Analisador Regex em Português para datas (`VAL: 15/08/2026`, `VENC: 10/26`, `VAL 28/02/2027`, `15 AGO 2026`, etc.) e lotes (`LOTE: AB1234`, `LT: 89341`, `L: 20240901`, etc.).
   - Modo de testes com fotos simuladas de embalagens (leite, café, remédio) para experimentação instantânea mesmo sem câmera física.

2. **Planilha Completa de Controle**:
   - **Código de Barras**: Entrada manual, catálogo pré-configurado de produtos brasileiros (EAN-13 com preenchimento automático da descrição) ou gerador de teste.
   - **Descrição do Produto**: Nome e categoria (Laticínios, Bebidas, Matinais, Mercearia, Limpeza, etc.).
   - **Lote**: Extraído da foto e editável.
   - **Validade**: Extraída da foto e padronizada em formato brasileiro (`DD/MM/YYYY`).
   - **Quantidade**: Controle de estoque com seletores rápidos `+` e `-`.
   - **Comprovante Fotográfico**: Miniatura salva com visualizador em alta resolução em tela cheia.

3. **Sistema de Alertas Preventivos a partir de 6 Meses**:
   - **🚨 Vencido**: Data anterior a hoje (ação imediata: descarte/devolução).
   - **⚠️ Crítico (≤ 30 dias)**: Vencimento iminente (queima rápida de estoque / 1 mês).
   - **⏳ Alerta (31 a 90 dias / ~3 meses)**: Planejamento de promoções.
   - **🕒 Atenção (91 a 180 dias / ~6 meses)**: Janela de atenção preventiva solicitada no projeto.
   - **✅ Seguro (> 180 dias / > 6 meses)**: Estoque com prazo saudável.
   - Banner com contadores em tempo real e filtros com 1 clique para visualizar apenas produtos em risco.

4. **Exportação da Planilha**:
   - **Excel (.xlsx)**: Cria arquivo formatado com colunas ajustadas e inclui uma aba exclusiva extra com os itens em alerta (≤ 6 meses).
   - **CSV (.csv)**: Exportação com codificação UTF-8 BOM para abertura perfeita no Microsoft Excel e Google Planilhas.

5. **Armazenamento e Usabilidade**:
   - Persistência automática em `localStorage` para não perder dados ao fechar o navegador.
   - Alternância entre visualização em **Tabela Planilha** (desktop) e **Cards** (mobile touch).
   - Pesquisa instantânea por texto, código ou lote.

---

## 🛠️ Tecnologias Utilizadas

- **React 19**
- **TypeScript 5**
- **Vite 6**
- **Tailwind CSS 3**
- **Tesseract.js 5** (OCR no navegador via Web Workers)
- **SheetJS (xlsx)** (Geração de planilhas Excel)
- **Lucide React** (Ícones)

---

## 📦 Como Executar

### Stack local com Docker (pré-deploy)

Requisitos: Docker Engine e Docker Compose v2.

1. Copie `.env.example` para `.env` e troque as senhas de desenvolvimento.
2. Construa e inicie a aplicação:

```bash
docker compose up --build -d
```

3. Acesse `http://localhost:8080` ou `http://<IP-DA-MAQUINA>:8080` (ou a porta definida em `APP_PORT`). O Nginx serve o frontend e encaminha `/api` à API Node.js. Somente o Nginx publica uma porta no host; API, MariaDB e Redis ficam em redes Docker internas, sem portas próprias expostas.
4. Verifique a prontidão com `docker compose ps` e `curl http://localhost:8080/api/health`.
5. Para acompanhar logs: `docker compose logs -f api nginx`. Para parar sem apagar dados: `docker compose down`. `docker compose down -v` apaga os dados persistidos.

O endpoint `PUT /api/products` substitui a lista inteira, conforme o contrato usado pelo frontend. Faça backup do volume `mariadb_data` antes de qualquer migração ou limpeza. `.env.example` contém somente credenciais locais de exemplo; use segredos próprios e TLS gerenciado antes de expor qualquer ambiente fora da máquina.

Para desenvolvimento sem Docker, a API fica em `server/`: `cd server && npm install && npm start`. Configure `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` e `REDIS_URL` para serviços MariaDB e Redis acessíveis. O cache Redis é invalidado a cada gravação e os dados permanecem no volume `mariadb_data`.

### 1. Iniciar o servidor de desenvolvimento:
```bash
npm run dev
```
O servidor iniciará em `http://localhost:5173`.

### 2. Gerar build de produção:
```bash
npm run build
```

---

## 📱 Utilização no Celular ou Tablet

Para acesso externo, libere no firewall da máquina apenas a porta definida por `APP_PORT` (8080 por padrão). Não encaminhe as portas 3306, 6379 ou 3000; elas não são publicadas pelo Compose. A publicação em `0.0.0.0` permite acesso pelos endereços de rede da máquina, sujeito ao firewall local.
