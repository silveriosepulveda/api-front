# 🚀 Guia de Publicação - GitHub Packages

## 📋 Pré-requisitos

1. **Conta no GitHub** com repositório criado
2. **Token de Acesso** do GitHub com permissões `write:packages`
3. **Node.js** versão 14+ instalado
4. **NPM** versão 6+ instalado

## 🔑 Criar Token do GitHub

1. Vá para [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Clique em "Generate new token (classic)"
3. Selecione os escopos:
   - ✅ `write:packages`
   - ✅ `read:packages`
   - ✅ `repo` (se o repositório for privado)
4. Copie o token gerado

## 📦 Passos para Publicação

### Opção 1: Script Automatizado (Recomendado)

```bash
# 1. Navegar para o diretório
cd api/front

# 2. Executar script de publicação
./publish.sh
```

O script irá:
- ✅ Fazer backup do package.json
- ✅ Configurar para GitHub Packages
- ✅ Instalar dependências
- ✅ Fazer build
- ✅ Verificar qualidade do código
- ✅ Fazer login no GitHub
- ✅ Publicar o pacote
- ✅ Restaurar package.json original

### Opção 2: Manual

```bash
# 1. Navegar para o diretório
cd api/front

# 2. Backup do package.json
cp package.json package.json.backup

# 3. Usar configuração do GitHub
cp package-github.json package.json

# 4. Instalar dependências
npm install

# 5. Build para produção
npm run build

# 6. Login no GitHub Packages
npm login --registry=https://npm.pkg.github.com

# 7. Publicar
npm publish

# 8. Restaurar package.json
cp package.json.backup package.json
```

## 🔧 Configuração do Repositório

### Criar Repositório no GitHub

1. Vá para [GitHub](https://github.com) e crie um novo repositório
2. Nome: `api-front`
3. Descrição: "Módulos frontend do sistema SegMed - AngularJS"
4. Público ou Privado (sua escolha)
5. Não inicialize com README (já temos)

### Configurar .npmrc

Crie um arquivo `.npmrc` na raiz do projeto:

```bash
# .npmrc
@silveriosepulveda:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

### Configurar Variável de Ambiente

```bash
# No terminal
export GITHUB_TOKEN=ghp_seu_token_aqui

# Ou adicionar ao ~/.bashrc ou ~/.zshrc
echo 'export GITHUB_TOKEN=ghp_seu_token_aqui' >> ~/.zshrc
source ~/.zshrc
```

## 📤 Publicação

### Executar Publicação

```bash
# Usando o script (mais fácil)
./publish.sh

# Ou manualmente
npm login --registry=https://npm.pkg.github.com
npm publish
```

### Verificar Publicação

```bash
# Verificar se foi publicado
npm view @silveriosepulveda/api-front

# Verificar no GitHub
# Vá para: https://github.com/silveriosepulveda/api-front/packages
```

## 📥 Instalação em Outros Projetos

### Configuração do Projeto Cliente

1. **Criar .npmrc** no projeto que vai usar o pacote:

```bash
# .npmrc
@silveriosepulveda:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

2. **Instalar o pacote**:

```bash
npm install @silveriosepulveda/api-front
```

3. **Usar no projeto**:

```html
<!-- No HTML -->
<script src="node_modules/@silveriosepulveda/api-front/dist/js/ajudaFormatacoes.js"></script>
<script src="node_modules/@silveriosepulveda/api-front/dist/js/servicos.js"></script>
<script src="node_modules/@silveriosepulveda/api-front/dist/js/directivesPadrao.js"></script>
```

```javascript
// No app.js
var app = angular.module('app', [
    'ajudaFormatacoes',
    'servicos',
    'directivesPadrao'
]);
```

## 🔄 Atualizações

### Nova Versão

```bash
# 1. Atualizar versão
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# 2. Publicar
./publish.sh
```

### Atualizar em Projetos Clientes

```bash
# Atualizar para última versão
npm update @silveriosepulveda/api-front

# Ou versão específica
npm install @silveriosepulveda/api-front@2.0.0
```

## 🚨 Troubleshooting

### Erro: "401 Unauthorized"
```bash
# Verificar token
echo $GITHUB_TOKEN

# Reautenticar
npm login --registry=https://npm.pkg.github.com
```

### Erro: "Package name already exists"
- Verificar se o nome `@silveriosepulveda/api-front` está disponível
- Se não, usar outro nome no package-github.json

### Erro: "Repository not found"
- Verificar se o repositório existe no GitHub
- Verificar se o token tem permissões corretas

### Erro: "Build failed"
```bash
# Verificar dependências
npm install

# Verificar erros de linting
npm run lint

# Verificar se todos os arquivos existem
ls -la js/helpers/ajudaFormatacoes.js
ls -la js/services/services.js
ls -la js/directives/directivesPadrao.js
```

## 📊 Monitoramento

### Verificar Downloads
```bash
npm view @silveriosepulveda/api-front
```

### Verificar no GitHub
- Vá para: https://github.com/silveriosepulveda/api-front/packages
- Clique no pacote para ver estatísticas

## 🎉 Sucesso!

Após a publicação bem-sucedida, você verá:

```
🎉 Pacote publicado com sucesso!
📦 Para instalar em outros projetos:
   npm install @silveriosepulveda/api-front

🔗 URL do pacote:
   https://github.com/silveriosepulveda/api-front/packages
```

O pacote estará disponível para instalação em qualquer projeto que configure o GitHub Packages! 🚀 