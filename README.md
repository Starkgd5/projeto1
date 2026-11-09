# ValidaSmart - Controle de Validade & Lote por Foto com OCR e Planilha

Aplicativo completo em **React 19**, **TypeScript** e **Tailwind CSS** para captura e controle inteligente de validades e lotes de produtos através de foto, extração por OCR (reconhecimento óptico de caracteres) e geração/exportação de planilhas com alertas preventivos para itens com vencimento a partir de 6 meses.

---

## 🚀 Principais Funcionalidades

1. **Captura de Foto com Mira & OCR**:
   - Câmera em tempo real com visor direcionador (`viewfinder`) para enquadrar a data de validade e lote.
   - Alternância entre câmera traseira (`environment`) e frontal (`user`).
   - Suporte a upload de fotos da galeria ou arquivos (`input file`).
   - Pré-processamento no Canvas (escala de cinza e realce de contraste) para ajudar na leitura de caracteres impressos por jato de tinta (_inkjet dot-matrix_).
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
- **Vitest** (testes automatizados)

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

### 3. Executar os testes automatizados:

```bash
npm test
```

Os testes cobrem limites das faixas de validade, datas impossíveis, extração OCR de texto, catálogo e dígito verificador EAN-13, persistência local e o contrato HTTP usado para sincronização. A checagem de sintaxe da API é `npm --prefix server run check`.

## Requisitos e Limitações por Funcionalidade

- **Cadastro, pesquisa, alertas, filtros e exportação Excel/CSV** funcionam no navegador. Sem a API, os registros ficam somente no `localStorage` do navegador/perfil em uso; limpar os dados do site ou trocar de navegador/dispositivo não transfere os registros.
- **Câmera** precisa de permissão do navegador e de um contexto seguro: HTTPS em dispositivos/rede ou `localhost` na própria máquina. Se não houver câmera ou permissão, use o envio de uma foto. A leitura de código por câmera depende de `BarcodeDetector`, disponível apenas em alguns navegadores; digitar o código continua disponível.
- **OCR** roda no navegador com Tesseract.js. Na primeira leitura, o navegador precisa conseguir baixar os arquivos do worker e os idiomas Português/Inglês; bloqueios de rede, proxy ou política corporativa podem impedir essa etapa. A extração é uma sugestão e deve ser conferida antes de salvar.
- **Fotos** são armazenadas como dados embutidos no registro, no `localStorage` e na API. Elas consomem espaço do navegador e aumentam o tamanho da lista sincronizada; o Nginx/API aceitam até 32 MB por requisição por padrão (`client_max_body_size` e `API_BODY_LIMIT`). Para muitas fotos, use uma solução de armazenamento de objetos antes de ampliar a operação.
- **Persistência compartilhada e backup** precisam da stack Docker (MariaDB e Redis) e das variáveis de `.env.example`. `npm run dev` sem a API funciona em modo local; para sincronizar, inicie MariaDB/Redis e a API conforme as instruções acima. O endpoint atual substitui a lista completa, portanto não deve ser exposto como colaboração multiusuário concorrente sem controle de conflitos/autenticação.
- **Acesso fora da máquina** exige HTTPS para a câmera e proteção de acesso à aplicação. O Compose de exemplo não configura TLS nem autenticação de usuários; não exponha diretamente à internet sem adicioná-los e trocar as credenciais de exemplo.

---

## 📱 Utilização no Celular ou Tablet

Para acesso externo, libere no firewall da máquina apenas a porta definida por `APP_PORT` (8080 por padrão). Não encaminhe as portas 3306, 6379 ou 3000; elas não são publicadas pelo Compose. A publicação em `0.0.0.0` permite acesso pelos endereços de rede da máquina, sujeito ao firewall local.
