# Sistema de Temas - PlayerOn

Este diretório contém os arquivos de tema do sistema PlayerOn.

## Estrutura

- `theme-base.css` - Estrutura base (documentação das variáveis)
- `theme-light.css` - Tema claro (padrão)
- `theme-dark.css` - Tema escuro (exemplo)

## Como Adicionar um Novo Tema

1. **Crie o arquivo do tema**
   Crie um novo arquivo `theme-[nome].css` neste diretório.

2. **Use o seletor correto**
   ```css
   [data-theme="nome"] {
     /* Suas variáveis CSS aqui */
   }
   ```

3. **Importe no themes.css**
   Adicione no arquivo `../themes.css`:
   ```css
   @import url('themes/theme-[nome].css');
   ```

4. **Registre no ThemeManager**
   No arquivo `theme-manager.js`, adicione o nome do tema:
   ```javascript
   themes: ['light', 'dark', 'nome'],
   ```

5. **Use o tema**
   ```javascript
   ThemeManager.setTheme('nome');
   ```

## Exemplo de Tema Personalizado

```css
/**
 * Tema Personalizado - PlayerOn
 */

[data-theme="personalizado"] {
  --color-primary: #seu-azul;
  --color-background: #seu-fundo;
  --color-text: #seu-texto;
  /* ... outras variáveis ... */
}
```

## Variáveis Disponíveis

Consulte `theme-light.css` para ver todas as variáveis disponíveis que devem ser definidas em cada tema.

## Uso Programático

```javascript
// Definir tema
ThemeManager.setTheme('dark');

// Obter tema atual
const temaAtual = ThemeManager.getTheme();

// Alternar entre light/dark
ThemeManager.toggleTheme();

// Escutar mudanças de tema
document.addEventListener('themechange', function(e) {
    console.log('Tema alterado para:', e.detail.theme);
});
```

## Preferência do Sistema

O sistema detecta automaticamente a preferência do usuário (`prefers-color-scheme`) e aplica o tema escuro se configurado, a menos que o usuário tenha escolhido manualmente um tema.
