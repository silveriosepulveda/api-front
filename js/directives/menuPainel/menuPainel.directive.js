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
        vm.allMenusExpanded = false;
        
        // Controle de estado
        vm.isInitialized = false;
        vm.isLoading = false;
        vm.lastUsuarioId = null; // Para evitar recarregamentos desnecessários

        // ========== MÉTODOS PÚBLICOS ==========
        vm.carregarMenuPainel = carregarMenuPainel;
        vm.toggleMenuExpansion = toggleMenuExpansion;
        vm.navegar = navegar;
        vm.abrirPopUpMenu = abrirPopUpMenu;
        vm.closeMenuOnNavigation = closeMenuOnNavigation;
        vm.toggleAllMenus = toggleAllMenus;

        // Métodos de Favoritos
        vm.carregarFavoritos = carregarFavoritos;
        vm.salvarFavoritos = salvarFavoritos;
        vm.isFavorito = isFavorito;
        vm.toggleFavorito = toggleFavorito;
        vm.toggleFavoritosExpansion = toggleFavoritosExpansion;
        vm.carregarEstadoFavoritos = carregarEstadoFavoritos;
        vm.manipularMenu = manipularMenu;

        // ========== INICIALIZAÇÃO ==========
        init();

        function init() {
            // Carregar dados básicos
            carregarFavoritos();
            carregarEstadoFavoritos();
            
            // Carregar menus
            carregarMenuPainel();
            
            // Configurar listeners
            setupEventListeners();
            
            vm.isInitialized = true;
        }

        // ========== FUNÇÕES PRINCIPAIS ==========

        /**
         * Carrega dados do menu
         */
        function carregarMenuPainel() {
            if (vm.isLoading) {
                return;
            }
            
            // Se já foi inicializado e tem dados, não recarregar desnecessariamente
            if (vm.isInitialized && vm.menuPainel && vm.menuPainel.length > 0) {
                return;
            }
            
            vm.isLoading = true;
            
            try {
                // Tentar carregar dados via APIServ primeiro
                var dadosMenu = APIServ.buscaDadosLocais('menuPainel');
                
                // Se não encontrou via APIServ, tentar via localStorage direto
                if (!dadosMenu) {
                    var dadosLocalStorage = window.localStorage.getItem('menuPainel');
                    if (dadosLocalStorage) {
                        try {
                            dadosMenu = JSON.parse(dadosLocalStorage);
                        } catch (e) {
                            console.error('Erro ao parsear dados do localStorage:', e);
                        }
                    }
                }
                
                if (dadosMenu && Array.isArray(dadosMenu)) {
                    vm.menuPainel = dadosMenu;
                    aplicarEstadoMenus();
                } else if (dadosMenu && typeof dadosMenu === 'object') {
                    // Converter objeto para array
                    vm.menuPainel = Object.values(dadosMenu).filter(function(menu) {
                        return menu && typeof menu === 'object';
                    });
                    aplicarEstadoMenus();
                } else {
                    vm.menuPainel = [];
                }
            } catch (error) {
                console.error('Erro ao carregar MenuPainel:', error);
                vm.menuPainel = [];
            } finally {
                vm.isLoading = false;
            }
        }

        /**
         * Aplica o estado salvo aos menus
         */
        function aplicarEstadoMenus() {
            if (!vm.menuPainel || vm.menuPainel.length === 0) return;
            
            // Aplicar estado individual dos menus
            angular.forEach(vm.menuPainel, function(menu, index) {
                if (menu && typeof menu === 'object') {
                    var savedState = localStorage.getItem('menu_expanded_' + index);
                    menu.expanded = savedState ? JSON.parse(savedState) : false;
                    menu.active = menu.expanded;
                }
            });
            
            // Aplicar estado global se necessário
            var estadoGlobal = localStorage.getItem('all_menus_expanded');
            if (estadoGlobal !== null) {
                var globalExpanded = JSON.parse(estadoGlobal);
                if (globalExpanded !== vm.allMenusExpanded) {
                    vm.allMenusExpanded = globalExpanded;
                    
                    angular.forEach(vm.menuPainel, function(menu, index) {
                        if (menu && menu.exibir) {
                            menu.expanded = globalExpanded;
                            menu.active = globalExpanded;
                            localStorage.setItem('menu_expanded_' + index, JSON.stringify(globalExpanded));
                        }
                    });
                }
            } else {
                // Calcular estado global baseado nos menus individuais
                updateAllMenusState();
            }
        }

        function manipularMenu() {
            var botao = document.getElementById('botaoMenu');
            var manterOculto = localStorage.getItem('manterMenuOculto') === 'true';
            
            if (botao.innerHTML == 'Mostrar Menu') {
                openNav();
            } else if (botao.innerHTML == 'Ocultar Menu') {
                // Forçar fechamento do menu e marcar "manter oculto" se necessário
                if (!manterOculto && $(document).width() > 1000) {
                    var checkbox = document.getElementById('manterMenuOculto');
                    if (checkbox) {
                        checkbox.checked = true;
                        localStorage.setItem('manterMenuOculto', true);
                        console.log('Menu fechado via botão - preferência "manter oculto" marcada');
                    }
                }
                closeNav();
            }
        }

        /**
         * Alterna expansão de um menu
         */
        function toggleMenuExpansion(menuKey, menu) {
            if (!menu) return;
            
            menu.expanded = !menu.expanded;
            menu.active = menu.expanded;
            
            // Salvar estado
            localStorage.setItem('menu_expanded_' + menuKey, JSON.stringify(menu.expanded));
            
            // Atualizar estado global
            updateAllMenusState();
        }

        /**
         * Expande ou colapsa todos os menus
         */
        function toggleAllMenus() {
            vm.allMenusExpanded = !vm.allMenusExpanded;
            
            angular.forEach(vm.menuPainel, function(menu, index) {
                if (menu && menu.exibir) {
                    menu.expanded = vm.allMenusExpanded;
                    menu.active = vm.allMenusExpanded;
                    localStorage.setItem('menu_expanded_' + index, JSON.stringify(menu.expanded));
                }
            });
            
            // Salvar estado global
            localStorage.setItem('all_menus_expanded', JSON.stringify(vm.allMenusExpanded));
        }

        /**
         * Atualiza o estado global baseado nos menus individuais
         */
        function updateAllMenusState() {
            if (!vm.menuPainel || vm.menuPainel.length === 0) return;
            
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
         * Navega para uma página
         */
        function navegar(pagina, acao, subacao) {
            if (vm.onNavigate) {
                vm.onNavigate({
                    pagina: pagina,
                    acao: acao,
                    subacao: subacao
                });
            }
            
            var url = pagina;
            if (acao) url += '/' + acao;
            if (subacao) url += '/' + subacao;
            
            $location.path('/' + url);
        }

        /**
         * Abre popup do menu
         */
        function abrirPopUpMenu(item) {
            if (!item || !item.pagina || !item.acao) {
                console.error('Item do menu inválido:', item);
                return;
            }
            
            var rota = '/' + item.pagina + '/' + item.acao + '/cadastro';
            var titulo = 'Cadastro de ' + (item.item || 'Item');
            
            PopUpModal.abrir({
                rota: rota,
                titulo: titulo,
                parametros: {
                    fromMenu: true,
                    menuItem: item.item,
                    pagina: item.pagina,
                    acao: item.acao
                }
            }).then(function(dados) {
                console.log('Modal fechado com dados:', dados);
                vm.closeMenuOnNavigation();
            }).catch(function(erro) {
                console.log('Modal fechado sem dados:', erro);
            });
        }

        /**
         * Fecha menu após navegação
         */
        function closeMenuOnNavigation() {
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
                    removerDuplicatasFavoritos();
                } catch (e) {
                    console.error('Erro ao carregar favoritos:', e);
                    vm.favoritos = [];
                }
            } else {
                vm.favoritos = [];
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
            if (!item || !vm.favoritos) return false;
            
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
                vm.favoritos.splice(index, 1);
            } else {
                vm.favoritos.push(itemNormalizado);
            }
            
            removerDuplicatasFavoritos();
            salvarFavoritos();
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
                if (!favorito || !favorito.pagina || !favorito.acao || !favorito.item) {
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
                }
            });
            
            if (favoritosUnicos.length !== vm.favoritos.length) {
                vm.favoritos = favoritosUnicos;
                salvarFavoritos();
            }
        }

        // ========== EVENT LISTENERS ==========

        /**
         * Configura listeners de eventos
         */
        function setupEventListeners() {
            // Evento de login
            $scope.$on('usuarioLogado', function(event, usuario) {
                // Verificar se é realmente um novo usuário
                var usuarioId = usuario?.id || usuario?.chave_usuario || usuario?.login;
                if (usuarioId && usuarioId !== vm.lastUsuarioId) {
                    vm.lastUsuarioId = usuarioId;
                    setTimeout(function() {
                        carregarMenuPainel();
                    }, 500);
                }
            });

            // Evento de atualização
            $scope.$on('menuPainelAtualizado', function() {
                // Resetar flag para forçar recarregamento
                vm.isInitialized = false;
                carregarMenuPainel();
            });

            // Watch para busca
            $scope.$watch('vm.searchText', function(newVal, oldVal) {
                if (newVal !== oldVal && vm.isInitialized && vm.menuPainel.length > 0) {
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
                return;
            }

            var searchLower = vm.searchText.toLowerCase();
            var menusExpandidos = 0;

            angular.forEach(vm.menuPainel, function(menu, index) {
                if (!menu || !menu.exibir || !menu.menu) return;

                var temResultados = false;

                // Verificar nome do menu
                if (menu.menu.toLowerCase().indexOf(searchLower) !== -1) {
                    temResultados = true;
                }

                // Verificar itens do menu
                if (!temResultados && menu.itens && typeof menu.itens === 'object') {
                    temResultados = Object.keys(menu.itens).some(function(itemKey) {
                        var item = menu.itens[itemKey];
                        return item && item.item && item.item.toLowerCase().indexOf(searchLower) !== -1;
                    });
                }

                // Expandir se há resultados
                if (temResultados && !menu.expanded) {
                    menu.expanded = true;
                    menu.active = true;
                    localStorage.setItem('menu_expanded_' + index, JSON.stringify(true));
                    menusExpandidos++;
                }
            });

                            if (menusExpandidos > 0) {
                    updateAllMenusState();
                }
        }

        /**
         * Filtra itens do menu baseado na busca
         */
        vm.filtrarMenu = function(menu) {
            if (!vm.searchText) return true;
            
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
            if (!vm.searchText) return true;
            
            var searchLower = vm.searchText.toLowerCase();
            return item.item.toLowerCase().indexOf(searchLower) !== -1;
        };
    }

})();
