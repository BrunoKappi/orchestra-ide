# Orquestra - Plataforma Industrial de Modelagem de Objetos e Telas Sinóticas (IHM)

O **Orquestra** é uma plataforma de desenvolvimento integrada (IDE) de nível industrial para modelar ativos de chão de fábrica, configurar telemetrias dinâmicas, projetar interfaces homem-máquina (IHMs) interativas e monitorar variáveis de sensores em tempo real.

A solução utiliza persistência local com `localStorage` e gerencia estados dinâmicos e reativos com **Zustand** e **Immer**, simulando de forma robusta e otimizada o comportamento de um sistema SCADA/IHM profissional direto no navegador.

---

## 🚀 Arquitetura e Principais Tecnologias

- **Core**: React (v19) com TypeScript para tipagem estática rigorosa de objetos industriais.
- **Estilização**: Tailwind CSS v4 para interfaces modernas com suporte nativo a Dark Mode e animações de telemetria.
- **Gerenciamento de Estado**: Zustand com Immer middleware para atualizações imutáveis e reatividade instantânea.
- **Icons**: Lucide React para representação visual consistente de elementos industriais.
- **Roteamento**: React Router para navegação suave entre as abas operacionais do sistema.

---

## 💻 Abas e Funcionalidades Detalhadas

A aplicação está estruturada em 6 abas principais acessíveis pelo cabeçalho global:

```
[ Orquestra IDE ] ➔ [ Componentes Gráficos ] ➔ [ Simulador ] ➔ [ Designer de Telas ] ➔ [ Runtime ] ➔ [ Banco de Dados ]
```

### 1. Orquestra IDE (Aba Principal)
Espaço de engenharia e modelagem estrutural da planta industrial. Divide-se em duas perspectivas na barra lateral esquerda:

#### A. Árvore de Derivação (Derivation Tree)
- **Modelagem Orientada a Objetos (Herança)**: Criação de **Templates Base** e **Templates Derivados** que herdam recursivamente todas as propriedades, scripts de automação e mapeamentos dos templates pais.
- **Instanciação**: Criação de instâncias de objetos físicos (ex: *Bomba 1*, *Tanque de Mistura A*) que materializam a estrutura dos templates em variáveis reais.
- **CRUD e Customização**: Renomear, duplicar e excluir templates ou instâncias.
- **Importação/Exportação JSON**: Permite importar e exportar a definição completa de um modelo ou ramo de herança para transporte e backup.

#### B. Árvore de Deployment (Deployment Tree)
- **Estruturação Física da Planta**: Criação de pastas lógicas (ex: *Setor de Tratamento*, *Linha de Envase 2*) para representar o layout físico da fábrica.
- **Drag & Drop**: Arrastar e soltar instâncias de objetos entre as pastas ou para a seção "Sem Destino".
- **Controle de Deploy**: Ativação (Deploy) e desativação (Undeploy) individual de objetos no ambiente de runtime físico.

#### C. Editor Central (Central Workspace)
Ao selecionar um template ou objeto, o painel central exibe abas contextuais:
- **Tabela de Propriedades**: Gerenciamento de variáveis. Permite criar propriedades definindo tipo de dado (`String`, `Boolean`, `Integer`, `Float`, `Date`, `Enum`), valor padrão e descrição. Propriedades herdadas de modelos superiores são marcadas visualmente com o ícone de camadas, garantindo rastreabilidade.
- **Editor de Scripts**: Criação de lógicas dinâmicas escritas em JavaScript executadas automaticamente quando o valor de uma variável associada muda.
- **Mapeamento de Widgets**: Definição de propriedades dos componentes gráficos que serão ligadas às variáveis de telemetria do objeto.
- **Configuração de Simulação (Mocks)**: Configuração de simuladores dinâmicos para cada variável numérica ou lógica (ondas senoidais, dentes de serra, rampas lineares e ruído aleatório) para gerar telemetrias vivas.

---

### 2. Componentes Gráficos (Widgets Designer)
Permite projetar componentes visuais reutilizáveis.
- **Geometrias Básicas**: Retângulos, círculos, linhas e caixas de texto.
- **Configurações Estáticas**: Cor de fundo, bordas, espessuras e rotações.
- **Suporte a Imagens**: Upload ou link de imagens industriais que renderizam diretamente nos componentes e sinóticos.
- **Variáveis Dinâmicas**: Definição de "slots" ou mapeamentos de propriedades para as variáveis que o objeto associado irá preencher no runtime (ex: alterar cor de fundo com base em alarme booleano, ou preenchimento de tanque proporcional a um valor de nível).

---

### 3. Simulador (Painel de Simulação)
Controla a geração dos sinais físicos e execução dos scripts da aplicação.
- **Execução Global**: Botões para iniciar/pausar a simulação geral.
- **Configuração de Velocidade**: Controle de intervalo em milissegundos para os ticks de atualização (ex: atualização a cada 100ms ou 1000ms).
- **Lista de Telemetria**: Visualização tabular unificada de todas as variáveis rodando no sistema, exibindo seu valor atual de simulação.
- **Animações de Mudança (Flash Effect)**: Quando uma variável atualiza seu valor no tick, sua célula na tabela pisca em tom amarelo, dando feedback visual imediato do fluxo de dados ativo.

---

### 4. Designer de Telas
Permite construir painéis sinóticos de monitoramento operacional (IHM/SCADA).
- **Canvas de Desenho**: Área de design com grade (grid) ajustável e alinhamento inteligente (Snap to Grid) para fácil posicionamento.
- **Inserção de Variáveis Diretas**: Arraste uma variável de qualquer objeto ativo diretamente para a tela para criar instantaneamente um mostrador numérico/textual reativo.
- **Inserção de Widgets**: Instanciação de componentes gráficos criados na aba de Componentes Gráficos, amarrando-os aos dados de sensores dos objetos.
- **Ferramentas de Layout**: Redimensionar, girar e reposicionar elementos geometricamente no espaço tridimensional Z-index.

---

### 5. Runtime de Telas
Uma vez criada a tela operacional, ela pode ser executada nesta aba.
- **Modo de Operação Real**: Desativa os controles de design e renderiza as telas como seriam vistas em uma sala de controle real.
- **Preenchimento Gradual (Gradual Fill & Fill Level)**: Suporte a níveis visuais realistas (ex: tanques de água que enchem e esvaziam dinamicamente, alternando cores e alturas proporcionais ao valor da telemetria).
- **Rotação Dinâmica**: Objetos como ventiladores ou motores giram em velocidades proporcionais aos dados de telemetria das propriedades mapeadas.

---

### 6. Runtime Monitor
Monitor central de telemetria do sistema em execução.
- **Listagem de Objetos Ativos**: Navegação simplificada por árvore de deployment dos objetos rodando em tempo real.
- **Mecanismos de Busca**: Barra de busca rápida por propriedades, valores ou descrições específicas.
- **Filtros Avançados**: Filtragem por tipo de dados específico da variável e múltiplas opções de ordenação (alfabética, tipo, etc.).
- **Deseleção Amigável**: Clique no fundo vazio da barra lateral ou sobre os nós de pasta para fechar a visualização do painel central e limpar o foco atual.

---

### 7. Banco de Dados (Database Explorer) 🆕
Painel de controle técnico que funciona como um simulador de injeção e inspeção de banco de dados diretamente no `localStorage` do navegador.

- **Mapeamento de Tabelas**: Exibição detalhada de todas as "tabelas" (chaves de localStorage) do sistema, com contagem em tempo real de registros armazenados em cada uma.
- **Visualizador Tabular**: Listagem ordenada dos itens de cada tabela com identificadores únicos e resumos formatados.
- **Detalhamento de Registros (JSON Inspector)**: Painel lateral interativo que formata e colore a estrutura JSON individual do registro selecionado com botão de cópia rápida.
- **Injeção de Registros (Mock Data Injection)**:
  - Botão de injeção que preenche automaticamente um template JSON estruturado com base no primeiro registro ou formato da tabela.
  - Validação de integridade do JSON digitado pelo usuário antes de salvar.
  - Sincronização em tempo real: ao salvar a injeção, os stores globais reativos (`useObjectModelStore`, `useWidgetStore`, `useScreenStore`) são automaticamente reinicializados, refletindo a injeção em todas as outras abas sem necessidade de recarregar o navegador.
- **CRUD e Exportação**:
  - Exclusão individual de linhas/registros.
  - **Truncar (Limpar Tabela)**: Apaga de forma segura todos os dados da tabela selecionada (resetando para vazio ou false).
  - **Exportação JSON**: Download imediato da tabela completa como arquivo `.json`.
- **Estatísticas de Disco**: Monitoramento de tamanho estimado por tabela em KB e monitor do consumo total de cache da aplicação no `localStorage`.

---

## 🛠️ Como Iniciar o Projeto Localmente

1. **Instalar Dependências**:
   ```bash
   npm install
   ```

2. **Iniciar Servidor de Desenvolvimento**:
   ```bash
   npm run dev
   ```

3. **Compilar/Gerar Build de Produção**:
   ```bash
   npm run build
   ```
