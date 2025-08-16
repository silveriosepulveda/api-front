# Diretiva listaConsultaTabela

## Descrição
A diretiva `listaConsultaTabela` é uma nova versão da diretiva `listaConsulta` que exibe os dados em formato de tabela com cabeçalhos e filtros por coluna.

## Características
- **Layout em Tabela**: Exibe os dados em formato de tabela HTML com cabeçalhos
- **Filtros por Coluna**: Cada coluna possui um campo de filtro individual
- **Responsivo**: Adapta-se a diferentes tamanhos de tela
- **Lazy Loading**: Carregamento sob demanda para melhor performance
- **Compatibilidade**: Mantém todas as funcionalidades da diretiva original

## Como Usar

### 1. Configuração Básica
Para usar a nova diretiva, adicione o parâmetro `tipoListaConsulta: 'tabela'` na estrutura:

```javascript
var estrutura = {
    // ... outras configurações
    tipoListaConsulta: 'tabela', // Ativa a nova diretiva
    listaConsulta: {
        nome: {
            texto: "Nome",
            tipo: "texto"
        },
        email: {
            texto: "E-mail",
            tipo: "texto"
        },
        status: {
            texto: "Status",
            tipo: "select"
        }
    }
};
```

### 2. Estrutura da Tabela
A tabela é composta por:
- **Cabeçalhos**: Nomes das colunas baseados no campo `texto` de cada item
- **Linha de Filtros**: Campos de entrada para filtrar cada coluna
- **Dados**: Linhas com os dados da consulta
- **Ações**: Botões de ação (editar, excluir, etc.)

### 3. Posicionamento dos Botões
Os botões de ação podem ser posicionados usando o parâmetro `botoesAcoesItensConsultaPosicao`:
- `"esquerda"`: Botões na primeira coluna (padrão)
- `"direita"`: Botões na última coluna
- `"superior"`: Botões acima dos dados
- `"inferior"`: Botões abaixo dos dados

### 4. Tipos de Campo Suportados
- `texto`: Campo de texto simples
- `select`: Campo de seleção
- `imagem`: Exibição de imagem
- `caixaSelecao`: Checkbox
- `diretiva`: Diretiva customizada
- `ordenacaoConsulta`: Campo de ordenação

## Exemplo Completo

```html
<lista-consulta estrutura="estrutura" lista-consulta="dados"></lista-consulta>
```

```javascript
$scope.estrutura = {
    tipoListaConsulta: 'tabela',
    tabela: 'usuarios',
    campo_chave: 'id',
    nomeUsual: 'Usuário',
    botoesAcoesItensConsultaPosicao: 'esquerda',
    listaConsulta: {
        id: {
            texto: "ID",
            tipo: "texto"
        },
        nome: {
            texto: "Nome",
            tipo: "texto",
            habilitarEdicao: true
        },
        email: {
            texto: "E-mail",
            tipo: "texto"
        },
        status: {
            texto: "Status",
            tipo: "select",
            opcoes: [
                {valor: 'A', texto: 'Ativo'},
                {valor: 'I', texto: 'Inativo'}
            ]
        },
        foto: {
            texto: "Foto",
            tipo: "imagem"
        }
    },
    funcaoAlterar: "editarUsuario",
    funcaoExcluir: "excluirUsuario",
    funcaoDetalhar: "detalharUsuario"
};
```

## Estilos CSS
A diretiva inclui estilos CSS específicos no arquivo `lista-consulta-tabela.css`:
- Design moderno e responsivo
- Hover effects nas linhas
- Estilos para filtros
- Animações suaves
- Adaptação para dispositivos móveis

## Funcionalidades Mantidas
- Lazy loading
- Filtros globais
- Edição inline
- Detalhes expandíveis
- Ações personalizadas
- Anexos
- Ordenação

## Diferenças da Versão Original
1. **Layout**: Tabela ao invés de cards/divs
2. **Filtros**: Por coluna ao invés de filtro global
3. **Cabeçalhos**: Fixos com nomes das colunas
4. **Responsividade**: Melhor adaptação para telas pequenas
5. **Performance**: Otimizada para grandes volumes de dados

## Compatibilidade
A diretiva é totalmente compatível com a versão original. Para voltar ao formato anterior, simplesmente remova o parâmetro `tipoListaConsulta` ou defina como `'lista'`.

