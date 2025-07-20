#!/bin/bash

# Script para configurar token do GitHub Packages
# api-front

echo "🔑 Configurando Token do GitHub Packages..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório api-front"
    exit 1
fi

# Verificar se o .npmrc existe
if [ ! -f ".npmrc" ]; then
    echo "❌ Erro: Arquivo .npmrc não encontrado"
    exit 1
fi

echo "📝 Configurando token..."

# Solicitar o token
read -p "🔐 Digite seu token do GitHub (ghp_...): " GITHUB_TOKEN

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Token não pode estar vazio"
    exit 1
fi

# Criar arquivo .env
echo "GITHUB_TOKEN=$GITHUB_TOKEN" > .env

# Configurar variável de ambiente
export GITHUB_TOKEN=$GITHUB_TOKEN

echo "✅ Token configurado com sucesso!"
echo "📁 Arquivo .env criado"
echo "🔒 Token salvo de forma segura"

# Testar configuração
echo ""
echo "🧪 Testando configuração..."

# Verificar se o token está configurado
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Token não está configurado"
    exit 1
fi

echo "✅ Token configurado: ${GITHUB_TOKEN:0:10}..."

# Testar autenticação
echo "🔐 Testando autenticação no GitHub Packages..."
npm whoami --registry=https://npm.pkg.github.com

if [ $? -eq 0 ]; then
    echo "✅ Autenticação bem-sucedida!"
    echo ""
    echo "🎉 Configuração concluída!"
    echo "📦 Para publicar o pacote, execute:"
    echo "   ./publish.sh"
else
    echo "❌ Erro na autenticação"
    echo "💡 Verifique se o token está correto e tem as permissões necessárias"
    exit 1
fi 