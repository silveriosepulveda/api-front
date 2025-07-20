#!/bin/bash

# Script de publicação para GitHub Packages
# silveriosepulveda-api-front

echo "🚀 Iniciando publicação do pacote..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório api/front"
    exit 1
fi

# Backup do package.json original
echo "📦 Fazendo backup do package.json original..."
cp package.json package.json.backup

# Substituir pelo package.json do GitHub
echo "🔄 Configurando package.json para GitHub Packages..."
cp package-github.json package.json

# Limpar builds anteriores
echo "🧹 Limpando builds anteriores..."
npm run clean

# Instalar dependências
echo "📥 Instalando dependências..."
npm install

# Build para produção
echo "🔨 Fazendo build para produção..."
npm run build

# Verificar se o build foi bem-sucedido
if [ ! -d "dist" ]; then
    echo "❌ Erro: Build falhou - diretório dist não encontrado"
    cp package.json.backup package.json
    exit 1
fi

# Verificar se há erros de linting
echo "🔍 Verificando qualidade do código..."
npm run lint

# Perguntar se quer continuar
echo ""
echo "✅ Build concluído com sucesso!"
echo "📋 Resumo:"
echo "   - Nome: @silveriosepulveda/api-front"
echo "   - Versão: $(node -p "require('./package.json').version")"
echo "   - Registry: GitHub Packages"
echo ""
read -p "🤔 Deseja continuar com a publicação? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔐 Fazendo login no GitHub Packages..."
    npm login --registry=https://npm.pkg.github.com
    
    echo "📤 Publicando pacote..."
    npm publish
    
    if [ $? -eq 0 ]; then
        echo "🎉 Pacote publicado com sucesso!"
        echo "📦 Para instalar em outros projetos:"
        echo "   npm install @silveriosepulveda/api-front"
        echo ""
        echo "🔗 URL do pacote:"
        echo "   https://github.com/silveriosepulveda/api-front/packages"
    else
        echo "❌ Erro na publicação"
    fi
else
    echo "❌ Publicação cancelada"
fi

# Restaurar package.json original
echo "🔄 Restaurando package.json original..."
cp package.json.backup package.json
rm package.json.backup

echo "✅ Processo concluído!" 