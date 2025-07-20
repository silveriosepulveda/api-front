#!/bin/bash

# Script para publicar o pacote no npm público
echo "🚀 Preparando publicação no npm público..."

# Verificar se está logado no npm
if ! npm whoami; then
    echo "❌ Você precisa estar logado no npm. Execute: npm login"
    exit 1
fi

# Verificar se o nome do pacote está disponível
echo "📦 Verificando disponibilidade do nome do pacote..."
if npm view silveriosepulveda-api-front > /dev/null 2>&1; then
    echo "⚠️  O pacote 'silveriosepulveda-api-front' já existe no npm."
    echo "   Você pode:"
    echo "   1. Incrementar a versão no package.json"
    echo "   2. Usar um nome diferente"
    echo "   3. Publicar como uma nova versão"
    read -p "Deseja continuar com a publicação? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Limpar e construir
echo "🔨 Limpando e construindo o projeto..."
npm run clean
npm run build

# Verificar se a build foi bem-sucedida
if [ ! -d "dist" ]; then
    echo "❌ Falha na construção do projeto"
    exit 1
fi

# Publicar
echo "📤 Publicando no npm..."
npm publish --access public

if [ $? -eq 0 ]; then
    echo "✅ Pacote publicado com sucesso!"
    echo "🌐 Visualize em: https://www.npmjs.com/package/silveriosepulveda-api-front"
else
    echo "❌ Erro na publicação"
    exit 1
fi 