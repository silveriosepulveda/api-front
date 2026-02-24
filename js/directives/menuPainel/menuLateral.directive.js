/**
 * Menu Lateral Responsivo - Versão 2.0
 * 
 * Diretiva Angular completa para menu lateral com:
 * - Sistema de favoritos
 * - Busca/filtro
 * - Expansão/colapso de menus
 * - Responsividade mobile-first
 * - Gestos touch em mobile
 * - Persistência de preferências
 * 
 * Uso: <menu-lateral></menu-lateral>
 */

(function() {
    'use strict';

    angular
        .module('app')
        .directive('menuLateral', MenuLateralDirective);

    function MenuLateralDirective() {
        return {
            restrict: 'E',
            templateUrl: '/api-front/js/directives/menuPainel/menuLateral.template.html',
            controller: MenuLateralController,
            controllerAs: 'ml',
            bindToController: true,
            scope: {},
            link: function(scope, element, attrs) {
                // Setup de gestos touch após renderização
                scope.ml.setupTouchGestures();
            }
        };
    }

    MenuLateralController.$inject = ['$scope', '$timeout', 'APIServ', '$location', 'config'];

    function MenuLateralController($scope, $timeout, APIServ, $location, config) {
        var ml = this;
      
        // ==================== CONFIGURAÇÕES ====================
        
        // Distância da borda esquerda para ativar preview do menu (em pixels)
        var DISTANCIA_PREVIEW_MENU = -10;
      
        // ==================== PROPRIEDADES ====================
        
        ml.menus = [];              // Lista de menus carregados
        ml.favoritos = [];          // Lista de favoritos
        ml.buscaTexto = '';         // Texto de busca
        ml.menuAberto = false;      // Estado do menu lateral
        ml.menuPreviewAtivo = false; // Estado de preview temporário (não salva)
        ml.todosExpandidos = false; // Estado global de expansão
        ml.favoritosExpandido = true; // Favoritos expandidos por padrão

        // ==================== MÉTODOS PÚBLICOS ====================
        
        // Controle do menu lateral
        ml.toggleMenu = toggleMenu;
        ml.fecharMenu = fecharMenu;
        ml.abrirMenu = abrirMenu;
        
        // Navegação
        ml.navegar = navegar;
        
        // Favoritos
        ml.toggleFavorito = toggleFavorito;
        ml.isFavorito = isFavorito;
        ml.toggleFavoritosExpansao = toggleFavoritosExpansao;
        
        // Expansão de menus
        ml.toggleMenuExpansao = toggleMenuExpansao;
        ml.toggleTodosMenus = toggleTodosMenus;
        
        // Filtros
        ml.filtrarMenu = filtrarMenu;
        ml.filtrarItem = filtrarItem;
        
        // Touch gestures
        ml.setupTouchGestures = setupTouchGestures;

        // ==================== INICIALIZAÇÃO ====================
        
        init();

        function init() {
            carregarMenus();
            carregarFavoritos();
            carregarPreferencias();
            setupListeners();
            
            // Expor funções globalmente para compatibilidade
            window.toggleMenuLateral = ml.toggleMenu;
        }

        // ==================== FUNÇÕES PRIVADAS ====================

        /**
         * Carrega os menus do localStorage
         */
        function carregarMenus() {
            try {
                var dados = APIServ.buscaDadosLocais('menuPainel');
                
                if (dados && typeof dados === 'object') {
                    // Converter para array se necessário
                    ml.menus = Array.isArray(dados) ? dados : Object.values(dados);
                    
                    // Aplicar estado de expansão
                    angular.forEach(ml.menus, function(menu, index) {
                        var estadoSalvo = localStorage.getItem('menu_exp_' + index);
                        menu.expandido = estadoSalvo ? JSON.parse(estadoSalvo) : false;
                    });
                } else {
                    ml.menus = [];
                }
            } catch (erro) {
                console.error('Erro ao carregar menus:', erro);
                ml.menus = [];
            }
        }

        /**
         * Carrega favoritos do localStorage
         */
        function carregarFavoritos() {
            try {
                var dados = localStorage.getItem('menuFavoritos_v2');
                ml.favoritos = dados ? JSON.parse(dados) : [];
                
                // Carregar estado de expansão
                var expSalvo = localStorage.getItem('favoritos_expandido');
                ml.favoritosExpandido = expSalvo !== null ? JSON.parse(expSalvo) : true;
            } catch (erro) {
                console.error('Erro ao carregar favoritos:', erro);
                ml.favoritos = [];
            }
        }

        /**
         * Salva favoritos no localStorage
         */
        function salvarFavoritos() {
            try {
                localStorage.setItem('menuFavoritos_v2', JSON.stringify(ml.favoritos));
            } catch (erro) {
                console.error('Erro ao salvar favoritos:', erro);
            }
        }

        /**
         * Carrega preferências do usuário
         */
        function carregarPreferencias() {
            // Carregar estado de expansão global
            var estadoGlobal = localStorage.getItem('todos_menus_expandidos');
            ml.todosExpandidos = estadoGlobal ? JSON.parse(estadoGlobal) : false;

            // Carregar estado do menu salvo no localStorage
            var estadoMenuSalvo = localStorage.getItem('menuLateralEstado');
            var menuAbertoSalvo = estadoMenuSalvo ? JSON.parse(estadoMenuSalvo) : null;

            var menuForcadoFechado = config && config.usarMenuLateralFechado === true;
            
            // Abrir automaticamente apenas em telas grandes
            $timeout(function() {
                if (menuForcadoFechado) {
                    fecharMenu();
                    salvarEstadoMenu(false);
                    console.log('⚙️ Menu lateral configurado para iniciar fechado');
                } else {
                    // Se há estado salvo, usar ele (prioridade)
                    if (menuAbertoSalvo !== null) {
                        if (menuAbertoSalvo) {
                            abrirMenu();
                        } else {
                            fecharMenu();
                        }
                        console.log('💾 Menu lateral restaurado do estado salvo:', menuAbertoSalvo ? 'aberto' : 'fechado');
                    } else {
                        // Se não há estado salvo, usar comportamento padrão
                        if (window.innerWidth >= 1000) {
                            abrirMenu();
                            salvarEstadoMenu(true);
                            console.log('🎯 Menu lateral aberto automaticamente em tela grande');
                        } else {
                            fecharMenu();
                            salvarEstadoMenu(false);
                            console.log('📱 Menu lateral mantido fechado em dispositivo móvel');
                        }
                    }
                    
                    // Garantir que o texto do botão seja atualizado após carregar estado
                    $timeout(function() {
                        atualizarTextoBotao(ml.menuAberto);
                    }, 100);
                }
            }, 500); // Delay para garantir que o DOM esteja pronto
        }

        /**
         * Salva o estado do menu no localStorage
         */
        function salvarEstadoMenu(aberto) {
            try {
                localStorage.setItem('menuLateralEstado', JSON.stringify(aberto));
            } catch (erro) {
                console.error('Erro ao salvar estado do menu:', erro);
            }
        }

        /**
         * Configura listeners de eventos
         */
        function setupListeners() {
            // Watch para busca - expandir menus com resultados
            $scope.$watch('ml.buscaTexto', function(newVal) {
                if (newVal && newVal.trim()) {
                    expandirMenusComResultados(newVal);
                }
            });

            // Listener de redimensionamento
            angular.element(window).on('resize', function() {
                // Fechar menu em mobile ao rotacionar
                if (window.innerWidth < 1000 && ml.menuAberto) {
                    $scope.$apply(function() {
                        fecharMenu();
                    });
                }
            });

            // Listener de tecla ESC
            angular.element(document).on('keyup', function(e) {
                if (e.keyCode === 27 && ml.menuAberto) {
                    $scope.$apply(function() {
                        fecharMenu();
                    });
                }
            });

            // Listener para preview do menu ao aproximar mouse da borda esquerda
            var previewTimeout = null;
            var menuElement = null;
            
            // Obter referência ao elemento do menu após renderização
            $timeout(function() {
                menuElement = document.getElementById('menuLateral');
                
                // Listener adicional quando mouse entra no menu para manter preview
                if (menuElement) {
                    angular.element(menuElement).on('mouseenter', function() {
                        if (previewTimeout) {
                            clearTimeout(previewTimeout);
                            previewTimeout = null;
                        }
                        if (!ml.menuAberto && window.innerWidth >= 1000) {
                            mostrarMenuPreview();
                        }
                    });
                    
                    angular.element(menuElement).on('mouseleave', function(e) {
                        // Só esconder se mouse não está na área configurada da borda
                        if (!ml.menuAberto && window.innerWidth >= 1000) {
                            var distanciaBordaEsquerda = e.clientX;
                            if (distanciaBordaEsquerda > DISTANCIA_PREVIEW_MENU) {
                                previewTimeout = setTimeout(function() {
                                    //esconderMenuPreview();
                                }, 300);
                            }
                        }
                    });
                }
            }, 600);
            
            angular.element(document).on('mousemove', function(e) {
                // Só funciona em desktop (telas >= 1000px)
                if (window.innerWidth < 1000) return;
                
                // Se o menu já está aberto, não fazer nada
                if (ml.menuAberto) return;
                
                var distanciaBordaEsquerda = e.clientX;
                
                // Verificar se o mouse está sobre o menu
                var mouseSobreMenu = false;
                if (menuElement) {
                    var menuRect = menuElement.getBoundingClientRect();
                    mouseSobreMenu = e.clientX >= menuRect.left && 
                                    e.clientX <= menuRect.right &&
                                    e.clientY >= menuRect.top && 
                                    e.clientY <= menuRect.bottom;
                }
                
                // Limpar timeout anterior
                if (previewTimeout) {
                    clearTimeout(previewTimeout);
                    previewTimeout = null;
                }
                
                // Se mouse está dentro da distância configurada da borda esquerda OU sobre o menu
                if (distanciaBordaEsquerda <= DISTANCIA_PREVIEW_MENU || mouseSobreMenu) {
                    // Mostrar preview do menu
                   // mostrarMenuPreview();
                } else {
                    // Se mouse saiu da área, aguardar um pouco antes de esconder
                    previewTimeout = setTimeout(function() {
                        esconderMenuPreview();
                    }, 300); // 300ms de delay antes de esconder
                }
            });

            // Limpar listeners ao destruir
            $scope.$on('$destroy', function() {
                angular.element(window).off('resize');
                angular.element(document).off('keyup');
                angular.element(document).off('mousemove');
                if (previewTimeout) {
                    clearTimeout(previewTimeout);
                }
                if (menuElement) {
                    angular.element(menuElement).off('mouseenter');
                    angular.element(menuElement).off('mouseleave');
                }
            });
        }

        // ==================== CONTROLE DO MENU LATERAL ====================

        /**
         * Alterna abertura/fechamento do menu
         */
        function toggleMenu() {
            // Se está em preview, abrir permanentemente
            if (ml.menuPreviewAtivo && !ml.menuAberto) {
                abrirMenu();
            } else {
                ml.menuAberto ? fecharMenu() : abrirMenu();
            }
        }

        /**
         * Mostra preview do menu sem alterar estado salvo (temporário)
         */
        function mostrarMenuPreview() {
            if (ml.menuPreviewAtivo || ml.menuAberto) return;
            
            ml.menuPreviewAtivo = true;
            var menu = document.getElementById('menuLateral');
            var conteudo = document.getElementById('conteudoEstruturaGerencia');
            
            if (menu) menu.style.width = '350px';
            if (conteudo) conteudo.style.marginLeft = '350px';
            document.body.classList.add('menu-lateral-aberto');
        }

        /**
         * Esconde preview do menu (volta ao estado original)
         */
        function esconderMenuPreview() {
            if (!ml.menuPreviewAtivo || ml.menuAberto) return;
            
            ml.menuPreviewAtivo = false;
            var menu = document.getElementById('menuLateral');
            var conteudo = document.getElementById('conteudoEstruturaGerencia');
            
            if (menu) menu.style.width = '0';
            if (conteudo) conteudo.style.marginLeft = '0';
            document.body.classList.remove('menu-lateral-aberto');
        }

        /**
         * Abre o menu lateral
         */
        function abrirMenu() {
            // Se estava em preview, desativar preview primeiro
            if (ml.menuPreviewAtivo) {
                esconderMenuPreview();
            }
            
            ml.menuAberto = true;
            var menu = document.getElementById('menuLateral');
            var conteudo = document.getElementById('conteudoEstruturaGerencia');
            
            if (window.innerWidth >= 1000) {
                // Desktop: menu lateral fixo
                if (menu) menu.style.width = '350px';
                if (conteudo) conteudo.style.marginLeft = '350px';
                document.body.classList.add('menu-lateral-aberto');
            } else {
                // Mobile: overlay
                if (menu) menu.style.width = '90%';
                document.body.style.overflow = 'hidden';
                criarOverlay();
            }
            
            // Salvar estado do menu como aberto
            salvarEstadoMenu(true);
            
            // Atualizar ícone e texto do botão
            atualizarIconeBotao(true);
            atualizarTextoBotao(true);
        }

        /**
         * Fecha o menu lateral
         */
        function fecharMenu() {
            // Se estava em preview, desativar preview primeiro
            if (ml.menuPreviewAtivo) {
                esconderMenuPreview();
            }
            
            ml.menuAberto = false;
            var menu = document.getElementById('menuLateral');
            var conteudo = document.getElementById('conteudoEstruturaGerencia');
            
            if (menu) menu.style.width = '0';
            if (conteudo) conteudo.style.marginLeft = '0';
            
            document.body.style.overflow = '';
            document.body.classList.remove('menu-lateral-aberto');
            removerOverlay();
            
            // Salvar estado do menu como fechado
            salvarEstadoMenu(false);
            
            // Atualizar ícone e texto do botão
            atualizarIconeBotao(false);
            atualizarTextoBotao(false);
        }

        /**
         * Atualiza ícone do botão menu
         */
        function atualizarIconeBotao(aberto) {
            var icone = document.getElementById('iconeBotaoMenu');
            if (icone) {
                icone.className = aberto ? 'fa fa-times' : 'fa fa-bars';
            }
        }

        /**
         * Atualiza texto do botão menu
         */
        function atualizarTextoBotao(aberto) {
            var botao = document.getElementById('botaoMenu');
            if (botao) {
                botao.textContent = aberto ? 'Ocultar Menu' : 'Mostrar Menu';
                botao.setAttribute('title', aberto ? 'Ocultar Menu' : 'Mostrar Menu');
            }
        }

        /**
         * Cria overlay para mobile
         */
        function criarOverlay() {
            if (!document.getElementById('menuOverlay')) {
                var overlay = document.createElement('div');
                overlay.id = 'menuOverlay';
                overlay.className = 'menu-lateral-overlay';
                overlay.onclick = function(e) {
                    // Apenas fechar se o clique foi direto no overlay
                    if (e.target === overlay) {
                        $scope.$apply(function() {
                            fecharMenu(); 
                        });
                    }
                };
                // Inserir antes do menu para garantir z-index correto
                var menuContainer = document.querySelector('.menu-lateral-container');
                if (menuContainer && menuContainer.parentNode) {
                    menuContainer.parentNode.insertBefore(overlay, menuContainer);
                } else {
                    document.body.appendChild(overlay);
                }
            }
            
            $timeout(function() {
                var overlay = document.getElementById('menuOverlay');
                if (overlay) overlay.classList.add('ativo');
            }, 10);
        }

        /**
         * Remove overlay
         */
        function removerOverlay() {
            var overlay = document.getElementById('menuOverlay');
            if (overlay) {
                overlay.classList.remove('ativo');
                $timeout(function() {
                    if (overlay && overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                }, 300);
            }
        }

        // ==================== NAVEGAÇÃO ====================

        /**
         * Navega para uma rota
         */
        function navegar(pagina, acao, subacao) {
            var url = '/' + pagina;
            if (acao) url += '/' + acao;
            if (subacao) url += '/' + subacao;
            
            // Fechar menu após navegação (tanto em desktop quanto mobile)
            fecharMenu();
            
            // Forçar ciclo de digest para garantir que a navegação funcione mesmo após período de inatividade
            if (!$scope.$$phase && !$scope.$root.$$phase) {
                $scope.$apply(function() {
                    $location.path(url);
                });
            } else {
                // Se já está em digest cycle, usar $timeout para garantir execução
                $timeout(function() {
                    $location.path(url);
                }, 0);
            }
        }

        // ==================== FAVORITOS ====================

        /**
         * Adiciona/remove item dos favoritos
         */
        function toggleFavorito(item) {
            var index = ml.favoritos.findIndex(function(fav) {
                return fav.pagina === item.pagina && 
                       fav.acao === item.acao &&
                       fav.subacao === item.subacao;
            });
            
            if (index > -1) {
                ml.favoritos.splice(index, 1);
            } else {
                ml.favoritos.push({
                    item: item.item,
                    pagina: item.pagina,
                    acao: item.acao,
                    subacao: item.subacao || '',
                    target: item.target || ''
                });
            }
            
            salvarFavoritos();
        }

        /**
         * Verifica se item é favorito
         */
        function isFavorito(item) {
            return ml.favoritos.some(function(fav) {
                return fav.pagina === item.pagina && 
                       fav.acao === item.acao &&
                       fav.subacao === item.subacao;
            });
        }

        /**
         * Alterna expansão dos favoritos
         */
        function toggleFavoritosExpansao() {
            ml.favoritosExpandido = !ml.favoritosExpandido;
            localStorage.setItem('favoritos_expandido', JSON.stringify(ml.favoritosExpandido));
        }

        // ==================== EXPANSÃO DE MENUS ====================

        /**
         * Alterna expansão de um menu
         */
        function toggleMenuExpansao(index, menu) {
            menu.expandido = !menu.expandido;
            localStorage.setItem('menu_exp_' + index, JSON.stringify(menu.expandido));
            
            // Atualizar estado global
            atualizarEstadoGlobal();
        }

        /**
         * Expande/colapsa todos os menus
         */
        function toggleTodosMenus() {
            ml.todosExpandidos = !ml.todosExpandidos;
            
            angular.forEach(ml.menus, function(menu, index) {
                if (menu.exibir) {
                    menu.expandido = ml.todosExpandidos;
                    localStorage.setItem('menu_exp_' + index, JSON.stringify(menu.expandido));
                }
            });
            
            localStorage.setItem('todos_menus_expandidos', JSON.stringify(ml.todosExpandidos));
        }

        /**
         * Atualiza estado global baseado nos menus individuais
         */
        function atualizarEstadoGlobal() {
            var total = 0;
            var expandidos = 0;
            
            angular.forEach(ml.menus, function(menu) {
                if (menu.exibir) {
                    total++;
                    if (menu.expandido) expandidos++;
                }
            });
            
            ml.todosExpandidos = (expandidos === total && total > 0);
        }

        /**
         * Expande menus que contêm resultados da busca
         */
        function expandirMenusComResultados(texto) {
            var busca = texto.toLowerCase();
            
            angular.forEach(ml.menus, function(menu, index) {
                if (!menu.exibir) return;
                
                var temResultado = false;
                
                // Verifica nome do menu
                if (menu.menu && menu.menu.toLowerCase().indexOf(busca) !== -1) {
                    temResultado = true;
                }
                
                // Verifica itens do menu
                if (!temResultado && menu.itens) {
                    temResultado = Object.keys(menu.itens).some(function(key) {
                        var item = menu.itens[key];
                        return item.item && item.item.toLowerCase().indexOf(busca) !== -1;
                    });
                }
                
                // Expandir se encontrou resultado
                if (temResultado && !menu.expandido) {
                    menu.expandido = true;
                    localStorage.setItem('menu_exp_' + index, 'true');
                }
            });
        }

        // ==================== FILTROS ====================

        /**
         * Filtra menus baseado na busca
         */
        function filtrarMenu(menu) {
            if (!ml.buscaTexto || !ml.buscaTexto.trim()) {
                return true;
            }
            
            var busca = ml.buscaTexto.toLowerCase();
            
            // Buscar no nome do menu
            if (menu.menu && menu.menu.toLowerCase().indexOf(busca) !== -1) {
                return true;
            }
            
            // Buscar nos itens
            if (menu.itens) {
                return Object.keys(menu.itens).some(function(key) {
                    var item = menu.itens[key];
                    return item.item && item.item.toLowerCase().indexOf(busca) !== -1;
                });
            }
            
            return false;
        }

        /**
         * Filtra itens baseado na busca
         */
        function filtrarItem(item) {
            if (!ml.buscaTexto || !ml.buscaTexto.trim()) {
                return true;
            }
            
            var busca = ml.buscaTexto.toLowerCase();
            return item.item && item.item.toLowerCase().indexOf(busca) !== -1;
        }

        // ==================== GESTOS TOUCH ====================

        /**
         * Configura gestos de swipe para mobile
         */
        function setupTouchGestures() {
            var menu = document.getElementById('menuLateral');
            if (!menu) return;

            var touchStartX = 0;
            var touchEndX = 0;

            menu.addEventListener('touchstart', function(e) {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            menu.addEventListener('touchend', function(e) {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe();
            }, { passive: true });

            function handleSwipe() {
                var diff = touchEndX - touchStartX;
                
                // Swipe para esquerda fecha o menu
                if (diff < -80 && window.innerWidth < 1000) {
                    $scope.$apply(function() {
                        fecharMenu();
                    });
                }
            }
        }
    }

})();

