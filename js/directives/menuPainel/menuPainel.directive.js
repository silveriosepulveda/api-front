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
            templateUrl: 'api/front/js/directives/menuPainel/menuPainel.template.html',
            controller: MenuPainelController,
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                usuario: '=',
                onNavigate: '&?'
            }
        };
    }

    MenuPainelController.$inject = ['$scope', '$rootScope', 'APIServ', '$location'];

    function MenuPainelController($scope, $rootScope, APIServ, $location) {
        var vm = this;

        // ========== PROPRIEDADES ==========
        vm.menuPainel = [];
        vm.favoritos = [];
        vm.favoritosExpanded = true;
        vm.searchText = '';

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

        // ========== INICIALIZAÇÃO ==========
        init();

        function init() {
            carregarMenuPainel();
            carregarFavoritos();
            carregarEstadoFavoritos();
            setupEventListeners();
        }

        // ========== FUNÇÕES PRINCIPAIS ==========

        /**
         * Carrega/recarrega dados do menu
         */
        function carregarMenuPainel() {
            vm.menuPainel = APIServ.buscaDadosLocais('menuPainel');
            console.log('MenuPainel carregado/recarregado:', vm.menuPainel);
            
            // Atualizar estado de expansão dos menus
            if (vm.menuPainel) {
                angular.forEach(vm.menuPainel, function(menu, key) {
                    const savedState = localStorage.getItem('menu_expanded_' + key);
                    menu.expanded = savedState ? JSON.parse(savedState) : false;
                    menu.active = false;
                });
            }
        }

        /**
         * Alterna expansão de um menu
         */
        function toggleMenuExpansion(menuKey, menu) {
            // Fechar outros menus se necessário
            angular.forEach(vm.menuPainel, function(otherMenu, otherKey) {
                if (otherKey !== menuKey && otherMenu.expanded) {
                    otherMenu.expanded = false;
                    otherMenu.active = false;
                    localStorage.setItem('menu_expanded_' + otherKey, 'false');
                }
            });

            // Alternar o menu atual
            menu.expanded = !menu.expanded;
            menu.active = menu.expanded;
            
            // Salvar estado no localStorage
            localStorage.setItem('menu_expanded_' + menuKey, JSON.stringify(menu.expanded));
            
            console.log('Menu', menu.menu, menu.expanded ? 'expandido' : 'recolhido');
        }

        /**
         * Navega para uma página
         */
        function navegar(pagina, acao, subacao) {
            console.log('Navegando para:', pagina, acao, subacao);
            
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
            console.log('Abrindo popup para:', item);
            // Implementar lógica de popup conforme necessário
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
                    console.log('Favoritos carregados:', vm.favoritos);
                } catch (e) {
                    console.error('Erro ao carregar favoritos:', e);
                    vm.favoritos = [];
                }
            } else {
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
            var index = vm.favoritos.findIndex(function(fav) {
                return fav.pagina === item.pagina && 
                       fav.acao === item.acao && 
                       fav.subacao === item.subacao;
            });
            
            if (index > -1) {
                // Remover dos favoritos
                vm.favoritos.splice(index, 1);
                console.log('Item removido dos favoritos:', item.item);
            } else {
                // Adicionar aos favoritos
                var novoFavorito = {
                    item: item.item,
                    pagina: item.pagina,
                    acao: item.acao,
                    subacao: item.subacao,
                    target: item.target
                };
                vm.favoritos.push(novoFavorito);
                console.log('Item adicionado aos favoritos:', item.item);
            }
            
            salvarFavoritos();
            
            // Aplicar mudanças de forma segura
            if (!$scope.$$phase) {
                $scope.$apply();
            }
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

        // ========== EVENT LISTENERS ==========

        /**
         * Configura listeners de eventos
         */
        function setupEventListeners() {
            // Escutar eventos de login para recarregar dados do menu
            $scope.$on('usuarioLogado', function(event, usuario) {
                console.log('🔄 MenuPainel: Recarregando dados após login do usuário:', usuario?.nome);
                setTimeout(function() {
                    carregarMenuPainel();
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                }, 500);
            });

            // Escutar mudanças no menuPainel global
            $scope.$on('menuPainelAtualizado', function() {
                carregarMenuPainel();
            });

            // Watch para mudanças nos favoritos
            $scope.$watch(function() { return vm.favoritos; }, function(newVal, oldVal) {
                if (newVal !== oldVal) {
                    console.log('Favoritos atualizados:', newVal);
                }
            }, true);
        }

        // ========== BUSCA NO MENU ==========

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
