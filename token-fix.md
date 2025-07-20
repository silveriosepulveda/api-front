# 🔧 Solução para Erro 403 - Permissões do Token

## 🚨 Problema Identificado

O erro `403 Forbidden` indica que o token do GitHub não tem as permissões necessárias para publicar pacotes.

## 🔑 Criar Novo Token com Permissões Corretas

### 1. Acessar GitHub Settings
- Vá para: https://github.com/settings/tokens
- Clique em "Generate new token (classic)"

### 2. Configurar Permissões
Selecione **TODAS** estas permissões:

#### ✅ Escopos Obrigatórios:
- `write:packages` - Publicar pacotes
- `read:packages` - Ler pacotes
- `repo` - Acesso completo ao repositório

#### ✅ Escopos Adicionais (Recomendados):
- `delete:packages` - Deletar pacotes (se necessário)
- `workflow` - Se usar GitHub Actions

### 3. Configurar Repositório
- **Repository access**: Selecione "Only select repositories"
- **Repositories**: Selecione o repositório `api-front`

### 4. Gerar Token
- Clique em "Generate token"
- **IMPORTANTE**: Copie o token imediatamente (não será mostrado novamente)

## 🔄 Atualizar Configuração

### 1. Atualizar arquivo .env
```bash
# Editar o arquivo .env
nano .env

# Substituir o token antigo pelo novo
GITHUB_TOKEN=ghp_novo_token_aqui
```

### 2. Recarregar variável de ambiente
```bash
# Carregar novo token
export $(cat .env | xargs)

# Verificar se foi carregado
echo $GITHUB_TOKEN
```

### 3. Testar autenticação
```bash
# Testar login
npm whoami --registry=https://npm.pkg.github.com

# Deve retornar: silveriosepulveda
```

## 🚀 Tentar Publicação Novamente

```bash
# Publicar o pacote
./publish.sh
```

## 🆘 Se Ainda Der Erro 403

### Verificar Permissões do Repositório
1. Vá para o repositório no GitHub
2. Settings > Collaborators and teams
3. Verifique se você tem permissão de "Write" ou "Admin"

### Verificar Configuração do Package
```bash
# Verificar nome do pacote
cat package-github.json | grep '"name"'

# Deve ser: "@silveriosepulveda/api-front"
```

### Verificar .npmrc
```bash
# Verificar configuração
cat .npmrc

# Deve ter:
# @silveriosepulveda:registry=https://npm.pkg.github.com
# //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

## 📋 Checklist de Permissões

- [ ] Token tem `write:packages`
- [ ] Token tem `read:packages`
- [ ] Token tem `repo` (se repositório privado)
- [ ] Token tem acesso ao repositório específico
- [ ] Usuário tem permissão de Write/Admin no repositório
- [ ] Nome do pacote está correto (`@silveriosepulveda/api-front`)
- [ ] Variável `GITHUB_TOKEN` está carregada

## 🔍 Debug Adicional

```bash
# Verificar todas as variáveis de ambiente
env | grep GITHUB

# Verificar configuração do npm
npm config list

# Verificar logs detalhados
npm publish --verbose
``` 