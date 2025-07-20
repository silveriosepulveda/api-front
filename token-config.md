# 🔑 Configuração do Token GitHub

## 📝 Passos para Configurar o Token

### 1. Criar arquivo .env
Crie um arquivo `.env` na raiz do projeto `api-front`:

```bash
# .env
GITHUB_TOKEN=ghp_seu_token_aqui
```

**⚠️ IMPORTANTE**: Substitua `ghp_seu_token_aqui` pelo seu token real do GitHub.

### 2. Configurar variável de ambiente
No terminal, execute:

```bash
# Navegar para o diretório correto
cd api-front

# Carregar o token do arquivo .env
export $(cat .env | xargs)

# Ou definir diretamente
export GITHUB_TOKEN=ghp_seu_token_aqui
```

### 3. Verificar configuração
```bash
# Verificar se o token está configurado
echo $GITHUB_TOKEN

# Verificar se o .npmrc está correto
cat .npmrc
```

## 🔒 Segurança

- ✅ **NUNCA** commite o arquivo `.env` no Git
- ✅ O arquivo `.env` já está no `.gitignore`
- ✅ Use apenas o token com permissões necessárias
- ✅ Revogue tokens antigos regularmente

## 🚀 Próximos Passos

Após configurar o token:

1. **Testar configuração**:
   ```bash
   npm whoami --registry=https://npm.pkg.github.com
   ```

2. **Publicar pacote**:
   ```bash
   ./publish.sh
   ```

## 🆘 Troubleshooting

### Token não encontrado
```bash
# Verificar se a variável está definida
echo $GITHUB_TOKEN

# Se estiver vazia, recarregar
export $(cat .env | xargs)
```

### Erro de autenticação
```bash
# Reautenticar
npm login --registry=https://npm.pkg.github.com
```

## 📍 Localização Correta

Este projeto está localizado em:
```
/Users/silverio/Dev/Web/apiV4/api-front/
```

Certifique-se de executar todos os comandos neste diretório! 