/**
 * Diretiva Menu Painel - SEGMED
 * 
 * Diretiva completa para o menu lateral do sistema SEGMED
 * Inclui funcionalidades de favoritos, busca, navegação e persistência
 * 
 * Uso: <menu-painel></menu-painel>
 */

(function() {
    'use strict';

    angular
        .module('app')
        .directive('menuPainel', MenuPainelDirective);

    function MenuPainelDirective() {
        return {
            restrict: 'E',
            templateUrl: 'api-front/js/directives/menuPainel/menuPainel.template.html',
            controller: MenuPainelController,
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                usuario: '=',
                onNavigate: '&?'
            }
        };
    }

    MenuPainelController.$inject = ['$scope', '$rootScope', 'APIServ', '$location', 'PopUpModal'];

    function MenuPainelController($scope, $rootScope, APIServ, $location, PopUpModal) {
        var vm = this;

        // ========== PROPRIEDADES ==========
        vm.menuPainel = [];
        vm.favoritos = [];
        vm.favoritosExpanded = true;
        vm.searchText = '';
        vm.allMenusExpanded = false; // Estado de expansão global
        
        // Flag para evitar carregamentos múltiplos
        vm.isLoadingMenu = false;

        // ========== MÉTODOS PÚBLICOS ==========
        vm.carregarMenuPainel = carregarMenuPainel;
        vm.toggleMenuExpansion = toggleMenuExpansion;
        vm.navegar = navegar;
        vm.abrirPopUpMenu = abrirPopUpMenu;
        vm.closeMenuOnNavigation = closeMenuOnNavigation;

        // Métodos de Favoritos
        vm.carregarFavoritos = carregarFavoritos;
        vm.salvarFavoritos = salvarFavoritos;
        vm.isFavorito = isFavorito;
        vm.toggleFavorito = toggleFavorito;
        vm.toggleFavoritosExpansion = toggleFavoritosExpansion;
        vm.carregarEstadoFavoritos = carregarEstadoFavoritos;

        // Método para expandir/colapsar todos os menus
        vm.toggleAllMenus = toggleAllMenus;

        // ========== INICIALIZAÇÃO ==========
        init();

        function init() {
            console.log('MenuPainel: Inicializando diretiva...');
            
            // Carregar dados na ordem correta
            carregarFavoritos();
            carregarEstadoFavoritos();
            carregarEstadoGlobalMenus();
            carregarMenuPainel();
            setupEventListeners();
            
            console.log('MenuPainel: Inicialização concluída');
        }

        // ========== FUNÇÕES PRINCIPAIS ==========

        /**
         * Carrega/recarrega dados do menu
         */
        function carregarMenuPainel() {
            // Evitar carregamentos múltiplos simultâneos
            if (vm.isLoadingMenu) {
                console.log('MenuPainel: Carregamento já em andamento, ignorando chamada duplicada');
                return;
            }
            
            vm.isLoadingMenu = true;
            
            try {
                vm.menuPainel = APIServ.buscaDadosLocais('menuPainel');
                console.log('MenuPainel carregado/recarregado:', vm.menuPainel ? vm.menuPainel.length : 0, 'menus');
                
                // Atualizar estado de expansão dos menus
                if (vm.menuPainel && Array.isArray(vm.menuPainel)) {
                    angular.forEach(vm.menuPainel, function(menu, key) {
                        if (menu && typeof menu === 'object') {
                            const savedState = localStorage.getItem('menu_expanded_' + key);
                            menu.expanded = savedState ? JSON.parse(savedState) : false;
                            menu.active = false;
                        }
                    });
                    
                    // Atualizar estado global após carregar os menus
                    updateAllMenusState();
                }
            } catch (error) {
                console.error('Erro ao carregar MenuPainel:', error);
            } finally {
                vm.isLoadingMenu = false;
            }
        }

        /**
         * Alterna expansão de um menu (permite múltiplos menus expandidos)
         */
        function toggleMenuExpansion(menuKey, menu) {
            // Alternar apenas o menu atual (removida lógica de fechar outros menus)
            menu.expanded = !menu.expanded;
            menu.active = menu.expanded;
            
            // Salvar estado no localStorage
            localStorage.setItem('menu_expanded_' + menuKey, JSON.stringify(menu.expanded));
            
            console.log('Menu', menu.menu, menu.expanded ? 'expandido' : 'recolhido');
            
            // Atualizar estado global
            updateAllMenusState();
        }

        /**
         * Expande ou colapsa todos os menus
         */
        function toggleAllMenus() {
            vm.allMenusExpanded = !vm.allMenusExpanded;
            
            angular.forEach(vm.menuPainel, function(menu, key) {
                if (menu.exibir) {
                    menu.expanded = vm.allMenusExpanded;
                    menu.active = vm.allMenusExpanded;
                    localStorage.setItem('menu_expanded_' + key, JSON.stringify(menu.expanded));
                }
            });
            
            // Salvar estado global
            localStorage.setItem('all_menus_expanded', JSON.stringify(vm.allMenusExpanded));
            
            console.log('Todos os menus', vm.allMenusExpanded ? 'expandidos' : 'recolhidos');
        }

        /**
         * Atualiza o estado global baseado nos menus individuais
         */
        function updateAllMenusState() {
            if (!vm.menuPainel || !Array.isArray(vm.menuPainel)) {
                return;
            }
            
            var expandedCount = 0;
            var totalCount = 0;
            
            angular.forEach(vm.menuPainel, function(menu) {
                if (menu && menu.exibir) {
                    totalCount++;
                    if (menu.expanded) {
                        expandedCount++;
                    }
                }
            });
            
            vm.allMenusExpanded = (expandedCount === totalCount && totalCount > 0);
        }

        /**
         * Carrega estado global dos menus
         */
        function carregarEstadoGlobalMenus() {
            var estadoSalvo = localStorage.getItem('all_menus_expanded');
            if (estadoSalvo !== null) {
                vm.allMenusExpanded = JSON.parse(estadoSalvo);
            } else {
                updateAllMenusState();
            }
        }

        /**
         * Navega para uma página
         */
        function navegar(pagina, acao, subacao) {
          //  console.log('Navegando para:', pagina, acao, subacao);
            
            if (vm.onNavigate) {
                vm.onNavigate({
                    pagina: pagina,
                    acao: acao,
                    subacao: subacao
                });
            }
            
            // Lógica de navegação padrão
            var url = pagina;
            if (acao) {
                url += '/' + acao;
            }
            if (subacao) {
                url += '/' + subacao;
            }
            
            $location.path('/' + url);
        }

        /**
         * Abre popup do menu
         */
        function abrirPopUpMenu(item) {
            console.log('🔧 [MenuPainel] Abrindo popup para:', item);
            
            // Construir rota baseada no item do menu
            var rota = '';
            if (item.pagina && item.acao) {
                rota = '/' + item.pagina + '/' + item.acao;
                
                // Item 6.1: Adicionar subação 'cadastro' por padrão quando através do menuPainel a.addSubMenu
                // Exemplo: /sistema-servicos/servicos -> /sistema-servicos/servicos/cadastro
                rota += '/cadastro';
            } else {
                console.error('❌ [MenuPainel] Item do menu não possui pagina/acao:', item);
                return;
            }
            
            var titulo = 'Cadastro de ' + (item.item || 'Item');
            
            console.log('🚀 [MenuPainel] Abrindo modal com:');
            console.log('   - Rota:', rota);
            console.log('   - Título:', titulo);
            console.log('   - Item original:', item);
            
            // Usar o serviço PopUpModal diretamente
            PopUpModal.abrir({
                rota: rota,
                titulo: titulo,
                parametros: {
                    // Adicionar parâmetros específicos do menuPainel se necessário
                    fromMenu: true,
                    menuItem: item.item,
                    pagina: item.pagina,
                    acao: item.acao
                }
            }).then(function(dados) {
                console.log('✅ [MenuPainel] Modal fechado com dados:', dados);
                // Fechar menu após sucesso se necessário
                vm.closeMenuOnNavigation();
                
                // Aqui poderia implementar lógica adicional como:
                // - Atualizar listas
                // - Mostrar notificação de sucesso
                // - Recarregar dados se necessário
                
            }).catch(function(erro) {
                console.log('ℹ️ [MenuPainel] Modal fechado sem dados:', erro);
                // Modal foi cancelado ou fechado sem dados
            });
        }

        /**
         * Fecha menu após navegação
         */
        function closeMenuOnNavigation() {
            // Verificar se deve fechar o menu baseado na preferência
            if (typeof closeNavCondicional === 'function') {
                closeNavCondicional();
            }
        }

        // ========== SISTEMA DE FAVORITOS ==========

        /**
         * Carrega favoritos do localStorage
         */
        function carregarFavoritos() {
            var favoritosSalvos = localStorage.getItem('menuFavoritos');
            if (favoritosSalvos) {
                try {
                    vm.favoritos = JSON.parse(favoritosSalvos);
                    // Garantir que não há duplicatas no carregamento inicial
                    removerDuplicatasFavoritos();
                    console.log('Favoritos carregados:', vm.favoritos);
                } catch (e) {
                    console.error('Erro ao carregar favoritos:', e);
                    vm.favoritos = [];
                }
            } else {
                vm.favoritos = [];
                console.log('Nenhum favorito salvo encontrado');
            }
        }

        /**
         * Salva favoritos no localStorage
         */
        function salvarFavoritos() {
            localStorage.setItem('menuFavoritos', JSON.stringify(vm.favoritos));
        }

        /**
         * Verifica se um item é favorito
         */
        function isFavorito(item) {
            if (!item || !vm.favoritos) {
                return false;
            }
            return vm.favoritos.some(function(fav) {
                return fav.pagina === item.pagina && 
                       fav.acao === item.acao && 
                       fav.subacao === item.subacao;
            });
        }

        /**
         * Alterna favorito
         */
        function toggleFavorito(item) {
            if (!item) return;
            
            // Normalizar subacao para evitar undefined vs ""
            var itemNormalizado = {
                item: item.item,
                pagina: item.pagina,
                acao: item.acao,
                subacao: item.subacao || "",
                target: item.target || ""
            };
            
            var index = vm.favoritos.findIndex(function(fav) {
                return fav.pagina === itemNormalizado.pagina && 
                       fav.acao === itemNormalizado.acao && 
                       (fav.subacao || "") === itemNormalizado.subacao;
            });
            
            if (index > -1) {
                // Remover dos favoritos
                vm.favoritos.splice(index, 1);
                console.log('Item removido dos favoritos:', itemNormalizado.item);
            } else {
                // Verificar se já existe antes de adicionar (segurança extra)
                var jaExiste = vm.favoritos.some(function(fav) {
                    return fav.pagina === itemNormalizado.pagina && 
                           fav.acao === itemNormalizado.acao && 
                           (fav.subacao || "") === itemNormalizado.subacao;
                });
                
                if (!jaExiste) {
                    vm.favoritos.push(itemNormalizado);
                    console.log('Item adicionado aos favoritos:', itemNormalizado.item);
                }
            }
            
            // Limpar duplicatas como precaução
            removerDuplicatasFavoritos();
            salvarFavoritos();
            
            // Não é necessário fazer $apply aqui pois já estamos dentro de um evento Angular
            // O ciclo de digest será executado automaticamente
        }

        /**
         * Alterna expansão dos favoritos
         */
        function toggleFavoritosExpansion() {
            vm.favoritosExpanded = !vm.favoritosExpanded;
            localStorage.setItem('favoritos_expanded', JSON.stringify(vm.favoritosExpanded));
        }

        /**
         * Carrega estado de expansão dos favoritos
         */
        function carregarEstadoFavoritos() {
            var estadoSalvo = localStorage.getItem('favoritos_expanded');
            if (estadoSalvo !== null) {
                vm.favoritosExpanded = JSON.parse(estadoSalvo);
            }
        }

        /**
         * Remove duplicatas dos favoritos
         */
        function removerDuplicatasFavoritos() {
            if (!vm.favoritos || vm.favoritos.length === 0) return;
            
            var favoritosUnicos = [];
            var chaves = new Set();
            
            vm.favoritos.forEach(function(favorito) {
                // Validar se o favorito tem as propriedades necessárias
                if (!favorito || !favorito.pagina || !favorito.acao || !favorito.item) {
                    console.warn('Favorito inválido ignorado:', favorito);
                    return;
                }
                
                var chave = favorito.pagina + '|' + favorito.acao + '|' + (favorito.subacao || "");
                if (!chaves.has(chave)) {
                    chaves.add(chave);
                    favoritosUnicos.push({
                        item: favorito.item,
                        pagina: favorito.pagina,
                        acao: favorito.acao,
                        subacao: favorito.subacao || "",
                        target: favorito.target || ""
                    });
                } else {
                    console.log('Duplicata removida:', favorito.item);
                }
            });
            
            if (favoritosUnicos.length !== vm.favoritos.length) {
                console.log('Duplicatas removidas. Antes:', vm.favoritos.length, 'Depois:', favoritosUnicos.length);
                vm.favoritos = favoritosUnicos;
                // Salvar estado limpo
                salvarFavoritos();
            }
        }

        // ========== EVENT LISTENERS ==========

        /**
         * Configura listeners de eventos
         */
        function setupEventListeners() {
            // Escutar eventos de login para recarregar dados do menu
            $scope.$on('usuarioLogado', function(event, usuario) {
                console.log('🔄 MenuPainel: Recarregando dados após login do usuário:', usuario?.nome);
                // Usar timeout para evitar conflitos com outras inicializações
                setTimeout(function() {
                    if (!vm.isLoadingMenu) {
                        carregarMenuPainel();
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    }
                }, 500);
            });

            // Escutar mudanças no menuPainel global
            $scope.$on('menuPainelAtualizado', function() {
                if (!vm.isLoadingMenu) {
                    carregarMenuPainel();
                }
            });

            // Watch para mudanças nos favoritos
            $scope.$watch(function() { return vm.favoritos; }, function(newVal, oldVal) {
                if (newVal !== oldVal && newVal && oldVal) {
                    console.log('Favoritos atualizados:', newVal.length, 'itens');
                }
            }, true);

            // Watch para mudanças na busca - expandir menus automaticamente
            $scope.$watch(function() { return vm.searchText; }, function(newVal, oldVal) {
                if (newVal !== oldVal && vm.menuPainel && vm.menuPainel.length > 0) {
                    expandirMenusComResultados();
                }
            });
        }

        // ========== BUSCA NO MENU ==========

        /**
         * Expande automaticamente os menus que contêm resultados da busca
         */
        function expandirMenusComResultados() {
            if (!vm.searchText || vm.searchText.trim() === '' || !vm.menuPainel || vm.menuPainel.length === 0) {
                // Se não há busca ou menus, não alterar estado
                return;
            }

            var searchLower = vm.searchText.toLowerCase();
            var menusExpandidos = 0;

            angular.forEach(vm.menuPainel, function(menu, key) {
                if (!menu || !menu.exibir || !menu.menu) return;

                var temResultados = false;

                // Verificar se o nome do menu contém a busca
                if (menu.menu.toLowerCase().indexOf(searchLower) !== -1) {
                    temResultados = true;
                }

                // Verificar se algum item do menu contém a busca
                if (!temResultados && menu.itens && typeof menu.itens === 'object') {
                    temResultados = Object.keys(menu.itens).some(function(itemKey) {
                        var item = menu.itens[itemKey];
                        return item && item.item && item.item.toLowerCase().indexOf(searchLower) !== -1;
                    });
                }

                // Expandir automaticamente se há resultados
                if (temResultados && !menu.expanded) {
                    menu.expanded = true;
                    menu.active = true;
                    localStorage.setItem('menu_expanded_' + key, JSON.stringify(true));
                    menusExpandidos++;
                    console.log('🔍 Menu expandido automaticamente:', menu.menu);
                }
            });

            if (menusExpandidos > 0) {
                console.log('🔍 Pesquisa "' + vm.searchText + '" expandiu ' + menusExpandidos + ' menu(s) automaticamente');
                updateAllMenusState();
            }
        }

        /**
         * Filtra itens do menu baseado na busca
         */
        vm.filtrarMenu = function(menu) {
            if (!vm.searchText) {
                return true;
            }
            
            var searchLower = vm.searchText.toLowerCase();
            
            // Buscar no nome do menu
            if (menu.menu.toLowerCase().indexOf(searchLower) !== -1) {
                return true;
            }
            
            // Buscar nos itens do menu
            return menu.itens && menu.itens.some(function(item) {
                return item.item.toLowerCase().indexOf(searchLower) !== -1;
            });
        };

        /**
         * Filtra itens individuais
         */
        vm.filtrarItem = function(item) {
            if (!vm.searchText) {
                return true;
            }
            
            var searchLower = vm.searchText.toLowerCase();
            return item.item.toLowerCase().indexOf(searchLower) !== -1;
        };
    }

})();
