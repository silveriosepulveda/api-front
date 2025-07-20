# silveriosepulveda-api-front

Módulos frontend do sistema SegMed - AngularJS com suporte a bundling moderno.

## 📦 Instalação

### Via NPM (Recomendado)
```bash
npm install silveriosepulveda-api-front
```

### Via Git (Desenvolvimento)
```bash
cd api/front
npm install
```

## 🚀 Uso Rápido

### Instalação via NPM
```bash
npm install silveriosepulveda-api-front
```

### Importação no seu projeto

#### Opção 1: Carregamento Individual (Recomendado)
```html
<!-- Carregamento via node_modules - arquivos originais -->
<script src="node_modules/silveriosepulveda-api-front/js/helpers/ajudaFormatacoes.js"></script>
<script src="node_modules/silveriosepulveda-api-front/js/services/services.js"></script>
<script src="node_modules/silveriosepulveda-api-front/js/directives/directivesPadrao.js"></script>
<script src="node_modules/silveriosepulveda-api-front/js/services/authService.js"></script>
<script src="node_modules/silveriosepulveda-api-front/js/menuPainel.js"></script>
```

#### Opção 2: Carregamento Otimizado (com hashes para cache)
```html
<!-- Carregamento via dist - arquivos otimizados com hashes -->
<script src="node_modules/silveriosepulveda-api-front/dist/js/ajudaFormatacoes.abc123.js"></script>
<script src="node_modules/silveriosepulveda-api-front/dist/js/services.def456.js"></script>
<script src="node_modules/silveriosepulveda-api-front/dist/js/directives.ghi789.js"></script>
```

### Configuração AngularJS

#### Para Aplicação Principal (com variável 'app')
Se sua aplicação já cria uma variável `app` (ex: em `apiLocal/js/app.js`):

```javascript
// O pacote detecta automaticamente a variável 'app' e a utiliza
var app = angular.module('app', [
    'ajudaFormatacoes',
    'servicos', 
    'directivesPadrao',
    'authService',
    'menuPainel'
    // ... outros módulos
]);
```

#### Para Aplicação Independente (sem variável 'app')
Se você não tem uma variável `app` global:

```javascript
// O pacote cria módulos independentes automaticamente
var app = angular.module('app', [
    'ajudaFormatacoes',
    'servicos',
    'directivesPadrao', 
    'authService',
    'menuPainel'
    // ... outros módulos
]);
```

## 🔧 Compatibilidade

### Detecção Automática
O pacote detecta automaticamente se existe uma variável `app` global:

- **Se `app` existe**: Usa a variável existente da aplicação principal
- **Se `app` não existe**: Cria módulos independentes

### Estrutura da Aplicação
O pacote é compatível com aplicações que:

1. **Criam variável `app`** em `apiLocal/js/app.js`
2. **Usam `authService.js`** que precisa da variável `app`
3. **Têm estrutura modular** com dependências entre serviços

### Arquivos Modificados para Compatibilidade
- ✅ `js/services/authService.js` - Detecta variável `app`
- ✅ `js/menuPainel.js` - Detecta variável `app`  
- ✅ `js/directives/srcDirectivesPadrao/estruturaGerencia.js` - Detecta variável `app`
- ✅ `templates/eventosSistema/eventosSistema.js` - Detecta variável `app`

## 📁 Estrutura do Pacote

```
silveriosepulveda-api-front/
├── js/
│   ├── helpers/
│   │   └── ajudaFormatacoes.js          # Módulo: ajudaFormatacoes
│   ├── services/
│   │   ├── services.js                   # Módulo: servicos
│   │   ├── authService.js                # Módulo: authService (compatível)
│   │   └── mascarasValidacoesService.js # Módulo: mascarasValidacoes
│   ├── directives/
│   │   ├── directivesPadrao.js          # Módulo: directivesPadrao
│   │   └── srcDirectivesPadrao/
│   │       └── estruturaGerencia.js     # Módulo: estruturaGerencia (compatível)
│   ├── controllers/
│   │   ├── controllersBasicos.js        # Módulo: app.controllersBasicos
│   │   └── controllersUsuarios.js       # Módulo: app.controllersUsuarios
│   └── menuPainel.js                    # Módulo: menuPainel (compatível)
├── css/
│   ├── painel.css
│   ├── sistema-unificado.css
│   └── ...
├── dist/                                # Arquivos otimizados (com hashes)
└── templates/
    └── eventosSistema/
        └── eventosSistema.js            # Módulo: eventosSistema (compatível)
```

## 🎯 Módulos Disponíveis

### Módulos Principais
- **ajudaFormatacoes** - Funções auxiliares de formatação
- **servicos** - Serviços principais da aplicação
- **directivesPadrao** - Diretivas padrão do sistema
- **mascarasValidacoes** - Máscaras e validações

### Módulos Compatíveis (detectam variável 'app')
- **authService** - Serviço de autenticação
- **menuPainel** - Sistema de menu lateral
- **estruturaGerencia** - Diretiva de estrutura gerencial
- **eventosSistema** - Sistema de eventos

### Módulos de Controllers
- **app.controllersBasicos** - Controllers básicos
- **app.controllersUsuarios** - Controllers de usuários

## 🔄 Desenvolvimento

### Build
```bash
npm run build          # Build de produção
npm run build:dev      # Build de desenvolvimento
npm run dev            # Servidor de desenvolvimento
```

### Scripts Disponíveis
```bash
npm run lint           # Verificar código
npm run lint:fix       # Corrigir código automaticamente
npm run clean          # Limpar arquivos de build
npm run prepare        # Build antes de publicar
```

## 📄 Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📝 Exemplos

Veja o arquivo [example-usage.html](example-usage.html) para um exemplo completo de como usar o pacote.

## 🔗 Links

- **NPM:** https://www.npmjs.com/package/silveriosepulveda-api-front
- **GitHub:** https://github.com/silveriosepulveda/api-front
- **Documentação:** https://github.com/silveriosepulveda/api-front#readme 