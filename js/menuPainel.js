/**
 * Funcionalidade Menu Persistente - SEGMED
 * 
 * Controla o comportamento do menu lateral com nova lógica:
 * - Menu ABRE por padrão em desktop na inicialização
 * - Checkbox "Manter oculto" controla se o menu deve ficar fechado
 * - Corpo do site se ajusta automaticamente quando menu expande/contrai
 * 
 * Funções principais:
 * - toggleManterMenu(): Alterna a preferência "manter oculto" e salva no localStorage
 * - carregarPreferenciaMenu(): Carrega a preferência e abre menu por padrão (se não marcado "oculto")
 * - manipularMenu(): Controla abertura/fechamento via botão
 * - fecharMenuSeNecessario(): Fecha menu ao navegar apenas se "manter oculto" estiver marcado
 * - closeNav(): Fecha o menu forçadamente e ajusta o corpo do site
 * - closeNavCondicional(): Fecha o menu apenas se "manter oculto" estiver marcado
 * 
 * NOVO COMPORTAMENTO POR AÇÃO:
 * - Inicialização: Menu ABRE por padrão, só fica fechado se "manter oculto" estiver marcado
 * - Botão "Mostrar Menu"/"Ocultar Menu": Controla abertura/fechamento e ajusta preferência
 * - Navegação pelos itens: Respeita "manter oculto" (desktop), sempre fecha (mobile)
 * - Tecla ESC: Respeita "manter oculto" (não fecha se NÃO estiver marcada em desktop)
 * - Checkbox "Manter oculto": Inverte lógica - se marcado mantém fechado, se não marcado mantém aberto
 */

app.controller('menuPainelCtrl', function ($rootScope, $scope, APIServ, $location) {        
    // Função para carregar/recarregar dados do menu
    $scope.carregarMenuPainel = function() {
        $scope.menuPainel = APIServ.buscaDadosLocais('menuPainel');
        //console.log('MenuPainel carregado/recarregado:', $scope.menuPainel);
        
        // Atualizar estado de expansão dos menus se já existem dados
        if ($scope.menuPainel) {
            angular.forEach($scope.menuPainel, function(menu, key) {
                // Carregar preferência salva do localStorage
                const savedState = localStorage.getItem('menu_expanded_' + key);
                menu.expanded = savedState ? JSON.parse(savedState) : false;
                menu.active = false;
            });
        }
    };
    
    // Carregar dados inicialmente
    $scope.carregarMenuPainel();
    
    // Escutar eventos de login para recarregar dados do menu
    $scope.$on('usuarioLogado', function(event, usuario) {
        //console.log('🔄 MenuPainel: Recarregando dados após login do usuário:', usuario?.nome);
        // Aguardar um pouco para garantir que os dados foram salvos
        setTimeout(function() {
            $scope.carregarMenuPainel();
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        }, 500);
    });
    
    // Escutar eventos de atualização do menu
    $scope.$on('menuPainelAtualizado', function() {
        //console.log('🔄 MenuPainel: Recarregando dados após atualização');
        $scope.carregarMenuPainel();
        if (!$scope.$$phase) {
            $scope.$apply();
        }
    });
    
    // Inicializar favoritos
    $scope.favoritos = [];
    $scope.favoritosExpanded = true;
    
    // Carregar favoritos salvos
    $scope.carregarFavoritos = function() {
        var favoritosSalvos = localStorage.getItem('menuFavoritos');
        if (favoritosSalvos) {
            try {
                $scope.favoritos = JSON.parse(favoritosSalvos);
                //console.log('Favoritos carregados:', $scope.favoritos.length, 'itens');
            } catch (e) {
                console.error('Erro ao carregar favoritos:', e);
                $scope.favoritos = [];
            }
        }
    };
    
    // Salvar favoritos
    $scope.salvarFavoritos = function() {
        localStorage.setItem('menuFavoritos', JSON.stringify($scope.favoritos));
        //console.log('Favoritos salvos:', $scope.favoritos.length, 'itens');
    };
    
    // Verificar se item é favorito
    $scope.isFavorito = function(item) {
        return $scope.favoritos.some(function(fav) {
            return fav.pagina === item.pagina && 
                   fav.acao === item.acao && 
                   fav.subacao === item.subacao;
        });
    };
    
    // Alternar favorito
    $scope.toggleFavorito = function(item) {
        var index = $scope.favoritos.findIndex(function(fav) {
            return fav.pagina === item.pagina && 
                   fav.acao === item.acao && 
                   fav.subacao === item.subacao;
        });
        
        if (index > -1) {
            // Remover dos favoritos
            $scope.favoritos.splice(index, 1);
            //console.log('Item removido dos favoritos:', item.item);
        } else {
            // Adicionar aos favoritos
            var novoFavorito = {
                item: item.item,
                pagina: item.pagina,
                acao: item.acao,
                subacao: item.subacao,
                target: item.target
            };
            $scope.favoritos.push(novoFavorito);
            //console.log('Item adicionado aos favoritos:', item.item);
        }
        
        $scope.salvarFavoritos();
        
        // Aplicar mudanças de forma segura
        if (!$scope.$$phase) {
            $scope.$apply();
        }
    };
    
    // Alternar expansão dos favoritos
    $scope.toggleFavoritosExpansion = function() {
        $scope.favoritosExpanded = !$scope.favoritosExpanded;
        localStorage.setItem('favoritos_expanded', JSON.stringify($scope.favoritosExpanded));
    };
    
    // Carregar estado de expansão dos favoritos
    $scope.carregarEstadoFavoritos = function() {
        var estadoSalvo = localStorage.getItem('favoritos_expanded');
        if (estadoSalvo !== null) {
            $scope.favoritosExpanded = JSON.parse(estadoSalvo);
        }
    };
    
    // Inicializar favoritos
    $scope.carregarFavoritos();
    $scope.carregarEstadoFavoritos();
    
    // Função para alternar expansão do menu
    $scope.toggleMenuExpansion = function(menuKey, menu) {
        // Fechar outros menus se necessário
        angular.forEach($scope.menuPainel, function(otherMenu, otherKey) {
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
        
        //console.log('Menu', menu.menu, menu.expanded ? 'expandido' : 'recolhido');
    };
    
    $scope.navegar = function (pagina, acao, subacao) {
        //console.log('Navegando para:', pagina, acao, subacao);
        $location.path('/' + pagina + '/' + acao );
        
        // Fechar menu após navegação se necessário
        $scope.closeMenuOnNavigation();
    };
    
    // Função para fechar menu após navegação (respeita preferência "manter aberto")
    $scope.closeMenuOnNavigation = function() {
        // Chama a função global que respeita as preferências do usuário
        if (typeof fecharMenuSeNecessario === 'function') {
            fecharMenuSeNecessario();
        }
    };
    
    $scope.abrirPopUpMenu = function (parametros) {
        console.log($(event));
        
        //console.log('🔄 [menuPainel] abrirPopUpMenu: Migrando para novo sistema PopUpModal');
        
        // Construir rota baseada nos parâmetros
        let rota = '';
        if (parametros.pagina && parametros.acao) {
            rota = '/' + parametros.pagina + '/' + parametros.acao + '/cadastro';
        } else {
            console.error('❌ [menuPainel] Parâmetros inválidos:', parametros);
            return;
        }
        
        let titulo = 'Cadastro de ' + (parametros.item || parametros.acao || 'Item');
        
        // Usar o novo sistema PopUpModal
        if (typeof PopUpModal !== 'undefined') {
            return PopUpModal.abrir({
                rota: rota,
                titulo: titulo,
                parametros: {
                    fromMenu: true,
                    menuItem: parametros.item,
                    pagina: parametros.pagina,
                    acao: parametros.acao
                }
            }).then(function(dados) {
                //console.log('✅ [menuPainel] Modal fechado com dados:', dados);
                // Fechar menu após sucesso se necessário
                if (typeof fecharMenuSeNecessario === 'function') {
                    fecharMenuSeNecessario();
                }
                return dados;
            }).catch(function(erro) {
                //console.log('ℹ️ [menuPainel] Modal fechado sem dados:', erro);
                return null;
            });
        } else {
            // Fallback para sistema antigo se PopUpModal não estiver disponível
            console.warn('⚠️ [menuPainel] PopUpModal não encontrado, usando sistema antigo');
            
            let p = {
                pagina: parametros.pagina,
                acao: parametros.acao,
                subAcao: 'cadastro',
                altura: screen.availHeight,
                largura: screen.availWidth
            }

            let largura = p.largura != undefined ? p.largura : 800;
            let altura = p.altura != undefined ? p.altura : 800;

            let idPopUp = 'popUp_' + parseInt(Math.random() * 100);
            p['idPopUp'] = idPopUp;
            parametros = APIServ.criptografa(angular.toJson(p));

            var mapForm = document.createElement("form");
            mapForm.target = idPopUp;
            mapForm.method = "POST";
            mapForm.action = "popup.php";

            var mapInput = document.createElement("input");
            mapInput.type = "hidden";
            mapInput.name = "parametros";
            mapInput.value = parametros;
            APIServ.salvaDadosLocais('parametrosUrl', p);
            mapForm.appendChild(mapInput);

            document.body.appendChild(mapForm);
            map = window.open("", idPopUp, "status=0,title=0,height=" + altura + ",width=" + largura + ",scrollbars=1");

            if (map) {
                mapForm.submit();
            } else {
                alert('You must allow popups for this map to work.');
            }
        }
    }

    $scope.fecharMenu = function() {
        //console.log('Fechando o menu lateral');
        
        // Fecha o menu lateral (Bootstrap collapse)
        var menu = document.getElementById('menuencolhido');
        if (menu && menu.classList.contains('in')) {
            menu.classList.remove('in');
            menu.classList.add('collapse');
        }
        // Alternativamente, para compatibilidade Bootstrap 3/4:
        if (window.jQuery) {
            $('#menuencolhido').collapse('hide');
        }
    };
    
    // Funções de busca/filtro
    $scope.filtrarMenu = function(menu) {
        if (!$scope.searchText || $scope.searchText.trim() === '') {
            return true;
        }
        
        var texto = $scope.searchText.toLowerCase();
        
        // Verificar se o nome do menu contém o texto
        if (menu.menu && menu.menu.toLowerCase().indexOf(texto) !== -1) {
            return true;
        }
        
        // Verificar se algum item do menu contém o texto
        if (menu.itens) {
            return Object.keys(menu.itens).some(function(key) {
                var item = menu.itens[key];
                return item.item && item.item.toLowerCase().indexOf(texto) !== -1;
            });
        }
        
        return false;
    };
    
    $scope.filtrarItem = function(item) {
        if (!$scope.searchText || $scope.searchText.trim() === '') {
            return true;
        }
        
        var texto = $scope.searchText.toLowerCase();
        return item.item && item.item.toLowerCase().indexOf(texto) !== -1;
    };

    // Função para expandir automaticamente menus com resultados da busca
    $scope.expandirMenusComResultados = function() {
        if (!$scope.searchText || $scope.searchText.trim() === '') {
            // Se não há busca, não alterar estado dos menus
            return;
        }

        var searchLower = $scope.searchText.toLowerCase();
        var menusExpandidos = 0;

        angular.forEach($scope.menuPainel, function(menu, key) {
            if (!menu.exibir) return;

            var temResultados = false;

            // Verificar se o nome do menu contém a busca
            if (menu.menu.toLowerCase().indexOf(searchLower) !== -1) {
                temResultados = true;
            }

            // Verificar se algum item do menu contém a busca
            if (!temResultados && menu.itens) {
                temResultados = Object.keys(menu.itens).some(function(itemKey) {
                    var item = menu.itens[itemKey];
                    return item.item && item.item.toLowerCase().indexOf(searchLower) !== -1;
                });
            }

            // Expandir automaticamente se há resultados
            if (temResultados && !menu.expanded) {
                menu.expanded = true;
                menu.active = true;
                localStorage.setItem('menu_expanded_' + key, JSON.stringify(true));
                menusExpandidos++;
                // console.log('🔍 Menu expandido automaticamente:', menu.menu);
            }
        });

        if (menusExpandidos > 0) {
            // console.log('🔍 Pesquisa "' + $scope.searchText + '" expandiu ' + menusExpandidos + ' menu(s) automaticamente');
        }
    };

    // Watch para mudanças na busca - expandir menus automaticamente
    $scope.$watch('searchText', function(newVal, oldVal) {
        if (newVal !== oldVal) {
            $scope.expandirMenusComResultados();
        }
    });
})




$(document).on('click', 'li a', function () {
    if ($(this).siblings('ul').is(':visible')) {
        $(this).siblings('ul').fadeOut('slow');
    } else {
        $(this).siblings('ul').fadeIn('slow');
    }
})

$(document).ready(function () {
    $(window).resize(function () {
        $('.menu').css('width', 'auto');
        $('.menu').css('width', $('#divmenu').css('width'));
    });

    $.expr[':'].containsIgnoreCase = function (n, i, m) {
        return jQuery(n).text().toUpperCase().indexOf(m[3].toUpperCase()) >= 0;
    };
    $("#procuramenu").keyup(function () {
        var texto = this.value;
        
        // Expandir menus automaticamente se há texto de busca
        if (texto && texto.trim() !== '') {
            $("li.menu").each(function (index) {
                var $menu = $(this);
                var temResultados = $menu.find(".submenu a:containsIgnoreCase('" + texto + "')").length > 0;
                
                if (temResultados) {
                    // Expandir o menu que contém resultados
                    $menu.addClass('expanded');
                    $menu.removeClass('collapsed');
                    $menu.find('ul[role="menu"]').show();
                    $menu.fadeIn('fast');
                } else {
                    $menu.fadeOut('fast');
                }
            });
        } else {
            // Se não há busca, mostrar todos os menus na configuração padrão
            $("li.menu").each(function (index) {
                $(this).fadeIn('fast');
            });
        }

        // Mostrar/ocultar itens individuais baseado na busca
        $(".submenu a:not(:containsIgnoreCase('" + texto + "'))").fadeOut('fast');
        $(".submenu a:containsIgnoreCase('" + texto + "')").fadeIn('fast');
    });

    // Carregar preferência de manter menu aberto
    carregarPreferenciaMenu();
    
    // Debug adicional para identificar problemas
    setTimeout(function() {
        var manterOculto = localStorage.getItem('manterMenuOculto') === 'true';
        var botao = document.getElementById('botaoMenu');
        var largura = $(document).width();
        
        //console.log('🧪 DEBUG INICIAL DO MENU:');
        //console.log('  - Largura da tela:', largura + 'px');
        //console.log('  - localStorage manterMenuOculto:', localStorage.getItem('manterMenuOculto'));
        //console.log('  - Valor interpretado (manterOculto):', manterOculto);
        //console.log('  - Estado do botão:', botao ? botao.innerHTML : 'BOTÃO NÃO ENCONTRADO');
        //console.log('  - Classes do body:', document.body.className);
        
        if (largura > 1000 && !manterOculto && botao && botao.innerHTML === 'Mostrar Menu') {
            //console.log('⚠️  PROBLEMA DETECTADO: Menu deveria estar aberto mas não está!');
        }
    }, 1000);
});

$(document).keyup(function (e) {
    if (e.keyCode == 27) {
        closeNavCondicional();
    }
});

function fecharMenuSeNecessario() {
    // Função específica para navegação - respeita a preferência "manter oculto"
    var manterOculto = localStorage.getItem('manterMenuOculto') === 'true';
    
    // Em mobile, sempre fecha o menu
    if ($(document).width() <= 1000) {
        closeNav();
        return;
    }
    
    // Em desktop, fecha se "manter oculto" estiver ativo, mantém aberto caso contrário
    if (manterOculto) {
        closeNav();
    }
    
    //console.log('Navegação - Menu permanece:', manterOculto ? 'fechado' : 'aberto');
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

function openNav() {
    var menuPainel = document.getElementById("menuPainel");
    var conteudo = document.getElementById("conteudoEstruturaGerencia");
    
    if ($(document).width() > 1000) {
        // Desktop: expande menu lateral e move conteúdo
        menuPainel.style.width = "350px";
        if (conteudo) {
            conteudo.style.marginLeft = "350px";
        }
        // Adicionar classe para controle CSS
        document.body.classList.add('menu-aberto');
        document.body.classList.remove('menu-fechado');
    } else {
        // Mobile/Tablet: menu overlay
        menuPainel.style.width = "100%";
        document.body.style.overflow = "hidden"; // Prevenir scroll do body
        
        // Criar overlay se não existir
        if (!document.querySelector('.menu-overlay')) {
            var overlay = document.createElement('div');
            overlay.className = 'menu-overlay';
            overlay.onclick = function() { closeNavCondicional(); };
            document.body.appendChild(overlay);
        }
        document.querySelector('.menu-overlay').classList.add('active');
    }

    document.getElementById('botaoMenu').innerHTML = 'Ocultar Menu';
    setTimeout(function() {
        var searchInput = document.getElementById('procuramenu');
        if (searchInput) {
            searchInput.focus();
        }
    }, 300);
}

function closeNav() {
    var menuPainel = document.getElementById("menuPainel");
    var conteudo = document.getElementById("conteudoEstruturaGerencia");
    var overlay = document.querySelector('.menu-overlay');
    
    menuPainel.style.width = "0";
    document.body.style.overflow = ""; // Restaurar scroll do body
    document.body.style.backgroundColor = "";
    
    if (conteudo) {
        conteudo.style.marginLeft = "0";
    }
    
    if (overlay) {
        overlay.classList.remove('active');
    }
    
    // Adicionar classe para controle CSS
    document.body.classList.add('menu-fechado');
    document.body.classList.remove('menu-aberto');
    
    document.getElementById('botaoMenu').innerHTML = 'Mostrar Menu';
}

function closeNavCondicional() {
    var manterOculto = localStorage.getItem('manterMenuOculto') === 'true';
    
    // Se "manter oculto" NÃO estiver marcado e estivermos em desktop, não fechar
    if (!manterOculto && $(document).width() > 1000) {
        return;
    }
    
    closeNav();
}

// Listener para redimensionamento da janela
window.addEventListener('resize', function() {
    var botao = document.getElementById('botaoMenu');
    if (botao && botao.innerHTML == 'Ocultar Menu') {
        // Reajustar o menu se estiver aberto durante redimensionamento
        closeNav();
        setTimeout(openNav, 100);
    }
});

// Função para gerenciar a preferência de manter menu oculto
function toggleManterMenu() {
    // Obter estado atual do menu (se está oculto ou não)
    var menuHidden = localStorage.getItem('manterMenuOculto') === 'true';
    
    // Alternar estado
    menuHidden = !menuHidden;
    
    // Salvar nova preferência no localStorage
    localStorage.setItem('manterMenuOculto', menuHidden);
    
    // Atualizar ícone do olho
    var eyeIcon = document.getElementById('eyeIcon');
    var eyeBtn = document.querySelector('.eye-toggle-btn');
    
    if (menuHidden) {
        // Menu oculto - mostrar olho fechado
        eyeIcon.className = 'fa fa-eye-slash';
        eyeBtn.classList.add('menu-hidden');
        eyeBtn.title = 'Mostrar menu';
        
        console.log('Preferência "manter menu oculto": true');
        
        // Se está em desktop e menu está aberto, fechar
        if ($(document).width() > 1000) {
            var botao = document.getElementById('botaoMenu');
            if (botao && botao.innerHTML == 'Ocultar Menu') {
                closeNav();
            }
        }
    } else {
        // Menu visível - mostrar olho aberto
        eyeIcon.className = 'fa fa-eye';
        eyeBtn.classList.remove('menu-hidden');
        eyeBtn.title = 'Ocultar menu';
        
        console.log('Preferência "manter menu oculto": false');
        
        // Se está em desktop e menu está fechado, abrir
        if ($(document).width() > 1000) {
            var botao = document.getElementById('botaoMenu');
            if (botao && botao.innerHTML == 'Mostrar Menu') {
                openNav();
            }
        }
    }
}

// Função para carregar a preferência salva
function carregarPreferenciaMenu() {
    var manterOculto = localStorage.getItem('manterMenuOculto') === 'true';
    
    // Atualizar ícone do olho baseado na preferência salva
    var eyeIcon = document.getElementById('eyeIcon');
    var eyeBtn = document.querySelector('.eye-toggle-btn');
    
    if (eyeIcon && eyeBtn) {
        if (manterOculto) {
            // Menu oculto - mostrar olho fechado
            eyeIcon.className = 'fa fa-eye-slash';
            eyeBtn.classList.add('menu-hidden');
            eyeBtn.title = 'Mostrar menu';
        } else {
            // Menu visível - mostrar olho aberto
            eyeIcon.className = 'fa fa-eye';
            eyeBtn.classList.remove('menu-hidden');
            eyeBtn.title = 'Ocultar menu';
        }
    }
    
    console.log('🔧 Carregando preferência do menu:', manterOculto ? 'manter oculto' : 'manter visível');
    
    // NOVO COMPORTAMENTO: Menu abre por padrão, só fica fechado se "manter oculto" estiver marcado
    if ($(document).width() > 1000) {
        setTimeout(function() {
            var botao = document.getElementById('botaoMenu');
            
            // Sempre aplicar as classes de controle CSS
            document.body.classList.remove('menu-aberto', 'menu-fechado');
            
            if (!manterOculto) {
                // Se "manter oculto" NÃO está marcado, abrir o menu por padrão
                document.body.classList.add('menu-aberto');
                
                if (botao && botao.innerHTML == 'Mostrar Menu') {
                    openNav();
                    console.log('✅ Menu aberto por padrão (preferência: manter visível)');
                } else {
                    console.log('🔄 Menu já estava aberto');
                }
            } else {
                // Se "manter oculto" está marcado, garantir que o menu esteja fechado
                document.body.classList.add('menu-fechado');
                
                if (botao && botao.innerHTML == 'Ocultar Menu') {
                    closeNav();
                    console.log('❌ Menu fechado (preferência: manter oculto)');
                } else {
                    console.log('🔄 Menu já estava fechado');
                }
            }
        }, 300); // Delay reduzido mas suficiente para garantir que a página carregou
    } else {
        console.log('📱 Mobile detectado - menu permanece fechado');
    }
}

// NOTA: Inicialização removida - já está sendo feita em carregarPreferenciaMenu() 
// que é chamada na linha 316 dentro do $(document).ready() principal