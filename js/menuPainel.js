/**
 * Funcionalidade Menu Persistente - SEGMED
 * 
 * Permite que o usuário mantenha o menu lateral sempre aberto em desktop.
 * A preferência é salva no localStorage e carregada automaticamente.
 * 
 * Funções principais:
 * - toggleManterMenu(): Alterna a preferência e salva no localStorage
 * - carregarPreferenciaMenu(): Carrega a preferência salva na inicialização
 * - manipularMenu(): Controla abertura/fechamento via botão (força fechamento se necessário)
 * - fecharMenuSeNecessario(): Fecha menu ao navegar (respeita "manter aberto" em desktop)
 * - closeNav(): Fecha o menu forçadamente (sempre fecha)
 * - closeNavCondicional(): Fecha o menu respeitando a preferência "manter aberto"
 * 
 * COMPORTAMENTO POR AÇÃO:
 * - Botão "Mostrar Menu"/"Ocultar Menu": SEMPRE fecha o menu, desmarcando a preferência se necessário
 * - Navegação pelos itens do menu: Respeita a preferência "manter aberto" (desktop), sempre fecha (mobile)
 * - Tecla ESC: Respeita a preferência "manter aberto" (não fecha se estiver marcada em desktop)
 * - Checkbox "Manter aberto": Disponível apenas em desktop (>1000px)
 */

app.controller('menuPainelCtrl', function ($rootScope, $scope, APIServ, $location) {        
    $scope.menuPainel = APIServ.buscaDadosLocais('menuPainel');
    
    // Inicializar estado expandido/colapsado dos menus
    if ($scope.menuPainel) {
        angular.forEach($scope.menuPainel, function(menu, key) {
            // Por padrão, menus ficam colapsados. Carregar preferência do localStorage se existir
            const savedState = localStorage.getItem('menu_expanded_' + key);
            menu.expanded = savedState ? JSON.parse(savedState) : false;
            menu.active = false;
        });
    }
    
    // Função para alternar expansão do menu
    $scope.toggleMenuExpansion = function(menuKey, menu) {
        menu.expanded = !menu.expanded;
        
        // Salvar estado no localStorage
        localStorage.setItem('menu_expanded_' + menuKey, JSON.stringify(menu.expanded));
        
        // Adicionar classe de ativação visual
        menu.active = menu.expanded;
        
        console.log('Menu', menu.menu, menu.expanded ? 'expandido' : 'colapsado');
    };
    
    $scope.navegar = function (pagina, acao, subacao) {
        console.log('Navegando para:', pagina, acao, subacao);
        $location.path('/' + pagina + '/' + acao );
    };
    
    // Função para fechar menu após navegação (respeita preferência "manter aberto")
    $scope.closeMenuOnNavigation = function() {
        // Chama a função global que respeita as preferências do usuário
        if (typeof fecharMenuSeNecessario === 'function') {
            fecharMenuSeNecessario();
        }
    };
    
    $scope.abrirPopUpMenu = function (parametros) {

        let p = {
            pagina: parametros.pagina,
            acao: parametros.acao,
            subAcao: 'cadastro',
            altura: screen.availHeight,
            largura: screen.availWidth
        }

        let largura = p.largura != undefined ? p.largura : 800;
        let altura = p.altura != undefined ? p.altura : 800;

        //ModeloValor pode ser tanto relacionada como subrelacionada, pois esta vinculado ao botao clicado
        let modeloValor;
        let modeloRel;


        let idPopUp = 'popUp_' + parseInt(Math.random() * 100);
        p['idPopUp'] = idPopUp;
        parametros = APIServ.criptografa(angular.toJson(p));

        var mapForm = document.createElement("form");
        mapForm.target = idPopUp;
        mapForm.method = "POST"; // or "post" if appropriate
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
        //*/
    }

    $scope.fecharMenu = function() {
        console.log('Fechando o menu lateral');
        
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
        $("li.menu").each(function (index) {
            if ($(this).find(".submenu a:containsIgnoreCase('" + texto + "')").length < 1) {
                $(this).fadeOut('fast');
            } else {
                $(this).fadeIn('fast');
            }
        });

        $(".submenu a:not(:containsIgnoreCase('" + texto + "'))").fadeOut('fast');
        $(".submenu a:containsIgnoreCase('" + texto + "')").fadeIn('fast');
    });

    // Carregar preferência de manter menu aberto
    carregarPreferenciaMenu();
});

$(document).keyup(function (e) {
    if (e.keyCode == 27) {
        closeNavCondicional();
    }
});

function fecharMenuSeNecessario() {
    // Função específica para navegação - respeita a preferência "manter aberto"
    var manterAberto = localStorage.getItem('manterMenuAberto') === 'true';
    
    // Em mobile, sempre fecha o menu
    if ($(document).width() <= 1000) {
        closeNav();
        return;
    }
    
    // Em desktop, só fecha se "manter aberto" NÃO estiver ativo
    if (!manterAberto) {
        closeNav();
    }
    
    console.log('Navegação - Menu permanece:', manterAberto ? 'aberto' : 'fechado');
}

function manipularMenu() {
    var botao = document.getElementById('botaoMenu');
    var manterAberto = localStorage.getItem('manterMenuAberto') === 'true';
    
    if (botao.innerHTML == 'Mostrar Menu') {
        openNav();
    } else if (botao.innerHTML == 'Ocultar Menu') {
        // Forçar fechamento do menu mesmo com "manter aberto" ativo
        // e desmarcar a checkbox se estiver marcada
        if (manterAberto && $(document).width() > 1000) {
            var checkbox = document.getElementById('manterMenuAberto');
            if (checkbox) {
                checkbox.checked = false;
                localStorage.setItem('manterMenuAberto', false);
                console.log('Menu fechado via botão - preferência "manter aberto" desmarcada');
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
    
    document.getElementById('botaoMenu').innerHTML = 'Mostrar Menu';
}

function closeNavCondicional() {
    var manterAberto = localStorage.getItem('manterMenuAberto') === 'true';
    
    // Se "manter aberto" estiver marcado e estivermos em desktop, não fechar
    if (manterAberto && $(document).width() > 1000) {
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

// Função para gerenciar a preferência de manter menu aberto
function toggleManterMenu() {
    var checkbox = document.getElementById('manterMenuAberto');
    var manterAberto = checkbox.checked;
    
    // Salvar preferência no localStorage
    localStorage.setItem('manterMenuAberto', manterAberto);
    
    console.log('Preferência "manter menu aberto":', manterAberto);
    
    // Se acabou de desmarcar e o menu está aberto em desktop, permitir fechar
    if (!manterAberto && $(document).width() > 1000) {
        var botao = document.getElementById('botaoMenu');
        if (botao && botao.innerHTML == 'Ocultar Menu') {
            // Não fazer nada, apenas permitir que o usuário feche manualmente se quiser
        }
    }
    
    // Se acabou de marcar e estivermos em desktop, abrir o menu
    if (manterAberto && $(document).width() > 1000) {
        var botao = document.getElementById('botaoMenu');
        if (botao && botao.innerHTML == 'Mostrar Menu') {
            openNav();
        }
    }
}

// Função para carregar a preferência salva
function carregarPreferenciaMenu() {
    var manterAberto = localStorage.getItem('manterMenuAberto') === 'true';
    var checkbox = document.getElementById('manterMenuAberto');
    
    if (checkbox) {
        checkbox.checked = manterAberto;
        
        // Se a preferência é manter aberto e estivermos em desktop, abrir o menu
        if (manterAberto && $(document).width() > 1000) {
            setTimeout(function() {
                var botao = document.getElementById('botaoMenu');
                if (botao && botao.innerHTML == 'Mostrar Menu') {
                    openNav();
                }
            }, 500); // Delay para garantir que a página carregou completamente
        }
    }
}