#!/bin/bash

echo "🔑 Atualizando Token do GitHub..."
echo ""
echo "📝 Cole o novo token aqui (ghp_...):"
read -s NEW_TOKEN

if [ -z "$NEW_TOKEN" ]; then
    echo "❌ Token não pode estar vazio"
    exit 1
fi

# Atualizar arquivo .env
echo "GITHUB_TOKEN=$NEW_TOKEN" > .env

# Carregar novo token
export GITHUB_TOKEN=$NEW_TOKEN

echo "✅ Token atualizado com sucesso!"
echo "🔒 Token salvo em: .env"

# Testar autenticação
echo ""
echo "🧪 Testando autenticação..."
npm whoami --registry=https://npm.pkg.github.com

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Token configurado corretamente!"
    echo "📦 Para publicar o pacote, execute:"
    echo "   ./publish.sh"
else
    echo ""
    echo "❌ Erro na autenticação"
    echo "💡 Verifique se o token está correto"
fi 