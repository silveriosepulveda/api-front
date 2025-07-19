app.directive('estruturaGerencia', ['$compile', '$base64', '$parse', 'filtroPadrao', 'operadoresConsulta', '$http', 'APIServ', '$filter', 'APIAjuFor', 'EGFuncoes', 'PopUpModal',
    function ($compile, $base64, $parse, filtroPadrao, operadoresConsulta, $http, APIServ, $filter, APIAjuFor, EGFuncoes, PopUpModal) {
        ////////////////////////////////////////////////////////////////////////////////////////
        ////////////////FUNCOES DE MONTAGEM DE HTML/////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////////////

        var controller = function ($rootScope, $scope, $element, $attrs, $route, $routeParams, EGFuncoes, APIAjuFor, PopUpModal) {
            // Detectar contexto modal através do atributo local-exibicao
            $scope.localExibicao = $attrs.localExibicao || 'normal';
            $scope.isModal = $scope.localExibicao === 'modal';

            // Se estiver em contexto modal, aplicar CSS para ocultar elementos
            if ($scope.isModal) {
                //console.log('🎭 [estruturaGerencia] Contexto MODAL detectado - aplicando ocultação');

                // CSS completo para contexto modal (unificado - antes havia duplicação com PopUpModal)
                var css = `
                        /* Ocultar elementos do sistema principal */
                        .estrutura-modal .cabecalhoSistema,
                        .estrutura-modal #cabecalhoSistema,
                        .estrutura-modal .menu-painel,
                        .estrutura-modal #menuPainel,
                        .estrutura-modal nav.sidebar,
                        .estrutura-modal .navbar,
                        .estrutura-modal #botaoIrConsulta,
                        .estrutura-modal .cancelaCadastro,
                        .estrutura-modal .header {
                            display: none !important;
                        }
                        
                        /* Ocultar botões de controle do formulário */
                        .estrutura-modal .btn[ng-click*="fechar"],
                        .estrutura-modal .btn[data-dismiss*="modal"],
                        .estrutura-modal button[ng-click*="salvar"]:not([ng-click*="salvarPersonalizado"]) {
                            display: none !important;
                        }
                        
                        /* Layout otimizado para modal */
                        .estrutura-modal {
                            width: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        
                        /* Melhorias específicas para o container do modal */
                        .popup-modal .modal-dialog {
                            width: 90%;
                            max-width: 1200px;
                        }
                        
                        .popup-modal-body {
                            max-height: 70vh;
                            overflow-y: auto;
                            padding: 15px;
                        }
                        
                        .loading-container {
                            text-align: center;
                            padding: 50px;
                        }
                    `;

                // Injetar CSS se não existir
                if (!document.getElementById('estrutura-modal-styles')) {
                    var style = document.createElement('style');
                    style.id = 'estrutura-modal-styles';
                    style.textContent = css;
                    document.head.appendChild(style);
                    //console.log('🎨 [estruturaGerencia] CSS modal injetado no documento');
                }

                // Aplicar classe modal ao elemento da estrutura
                if ($element[0]) {
                    $element[0].classList.add('estrutura-modal');
                    //console.log('🏗️ [estruturaGerencia] Classe "estrutura-modal" aplicada ao elemento');
                }

                // Aplicar classe modal ao body para controle global
                document.body.classList.add('estrutura-modal-ativa');
                //console.log('🌐 [estruturaGerencia] Classe "estrutura-modal-ativa" aplicada ao body');

                // Configurar limpeza quando o escopo for destruído
                $scope.$on('$destroy', function () {
                    document.body.classList.remove('estrutura-modal-ativa');
                    if ($element[0]) {
                        $element[0].classList.remove('estrutura-modal');
                    }
                    //console.log('🧹 [estruturaGerencia] Limpeza modal: classes removidas');
                });
            }

            $scope.popUp = document.getElementById('popUp') != undefined && document.getElementById('popUp').value;

            $scope.larguraTela = window.screen.availWidth
            $scope.alturaTela = window.screen.availHeight;
            $scope.dispositivoMovel = $scope.larguraTela <= 900;
            $scope.tipoSalvar = 'post';
            $scope.tipoConsulta = 'post';

            var html = '';
            $scope.fd = new FormData();

            var montarEstrutura = function (estrutura) {
                var retorno = estrutura;

                //Fazendo a validacao dos poderes do usuario
                var menuPainel = APIServ.buscaDadosLocais('menuPainel');

                var parametrosUrl = APIServ.parametrosUrl();

                var parametrosLocal = undefined;
                var parametrosLocalTemp = { pagina: '', acao: '', subAcao: '' };

                if (!$scope.popUp) {
                    APIServ.apagaDadosLocais('parametrosUrl');
                }

                if (parametrosUrl.length == 0) {
                    parametrosLocal = APIServ.buscaDadosLocais('parametrosUrl');
                    parametrosLocal = parametrosLocal ? parametrosLocal : parametrosLocalTemp;
                }

                var raizModelo = retorno.raizModelo;
                var pagina;
                var acao;
                var subacao;
                var parametrosAcao;


                if ($scope.isModal) {
                    //  pagina = $attrs.classe;
                    acao = $attrs.subacao || '';
                    subacao = $attrs.subacao || '';
                    parametrosAcao = $attrs.parametros || '';
                } else {
                    pagina = parametrosUrl[0] != undefined ? parametrosUrl[0] : parametrosLocal['pagina'];
                    acao = parametrosUrl[1] != undefined ? parametrosUrl[1] : parametrosLocal['acao'];
                    subacao = parametrosUrl[2] != undefined ? parametrosUrl[2] : parametrosLocal != undefined && parametrosLocal['subAcao'] != undefined ? parametrosLocal['subAcao'] : '';

                }

                $scope.pagina = pagina;
                $scope.acao = acao;
                $scope.subacao = subacao;


                // var subacao = parametrosUrl[2] != undefined ?
                //     parametrosUrl[2] : parametrosLocal != undefined && parametrosLocal['subAcao'] != undefined ?
                //         parametrosLocal['subAcao'] : '';

                // var subacao = '';
                // if(parametrosUrl[2] != undefined)
                //     subacao = parametrosUrl[2];
                // else if( parametrosLocal != undefined && parametrosLocal['subAcao'] != undefined)
                //     subacao = parametrosLocal['subAcao'];
                // else if($attrs.subacao != undefined) 
                //     subacao = $attrs.subacao;

                
                $rS['acao'] = acao;
                if ($rS[acao] == undefined) {
                    $rS[acao] = {};
                    $rS[acao]['acoes'] = menuPainel.acoes != undefined && menuPainel.acoes[acao] != undefined ? menuPainel.acoes[acao] : [];
                    $rS[acao]['campos'] = menuPainel.campos != undefined && menuPainel.campos[acao] != undefined ? menuPainel.campos[acao] : [];
                }

                $scope.parametrosUrl = parametrosUrl;

                $scope.estrutura = retorno;

                $scope.exibirConsulta = retorno.exibirConsulta != undefined && retorno.exibirConsulta;

                if ($scope.antesCarregar != undefined) {
                    $scope.antesCarregar();
                }
                retorno['tipoEstrutura'] = retorno.tipoEstrutura != undefined ? retorno.tipoEstrutura : 'padrao';

                var _montarCamposFiltroConsulta = function (campos, retornoEnt) {
                    //Despois tenho que por opcoes de pesquisar por tabelas relacionadas
                    var retornoMCFC = retornoEnt != undefined ? retornoEnt : [];
                    var filtrosPersonalizados = $scope.estrutura.camposFiltroPesquisa != undefined ? $scope.estrutura.camposFiltroPesquisa : {};


                    angular.forEach(campos, function (val, campo) {
                        var temCampoFiltro = $scope.estrutura.camposFiltroPesquisa != undefined && $scope.estrutura.camposFiltroPesquisa[campo] != undefined;

                        if (EGFuncoes.eBloco(campo) && val.nome == undefined) {
                            retornoMCFC = _montarCamposFiltroConsulta(val.campos, retornoMCFC);
                        } else if ((val.tipo != 'oculto' || temCampoFiltro) && val.tipo != 'area-texto' && campo.substr(0, 5) != 'botao' && typeof (val) === "object" && val.tipo != 'diretiva') {

                            var ocultarCampoFiltro = $scope.estrutura.camposOcultarFiltroPesquisa != undefined &&
                                APIServ.valorExisteEmVariavel($scope.estrutura.camposOcultarFiltroPesquisa, campo);

                            if (!ocultarCampoFiltro) {

                                var campoEmCampos = null;
                                if (temCampoFiltro) {
                                    campoEmCampos = Object.assign(APIServ.buscarValorVariavel($scope.estrutura.campos, campo), $scope.estrutura.camposFiltroPesquisa[campo]);
                                } else
                                    campoEmCampos = APIServ.buscarValorVariavel($scope.estrutura.campos, campo);

                                retornoMCFC[campo] = filtrosPersonalizados[campo] != undefined ? Object.assign(campoEmCampos, filtrosPersonalizados[campo], val) : val;
                            }
                        } else {
                            //console.log($scope.estrutura.camposFiltroPesquisa);
                        }
                    });


                    //var retornoMCFC = Object.assign({}, filtrosPersonalizados, retornoMCFC);
                    return retornoMCFC;
                }

                var MergeRecursive = (obj1E, obj2E) => {
                    var obj1 = Object.assign({}, obj1E);
                    var obj2 = Object.assign({}, obj2E);

                    for (var p in obj2) {
                        try {
                            // Property in destination object set; update its value.
                            if (obj2[p].constructor == Object) {
                                obj1[p] = MergeRecursive(obj1[p], obj2[p]);
                            } else {
                                obj1[p] = obj2[p];
                            }
                        } catch (e) {
                            // Property in destination object not set; create it and set its value.
                            obj1[p] = obj2[p];
                        }
                    }

                    return obj1;
                }


                var camposPes = $scope.estrutura.camposFiltroPesquisa != undefined ? Object.assign({}, $scope.estrutura.camposFiltroPesquisa) : {};

                var incluirCamposNoFiltro = $scope.estrutura.camposOcultarFiltroPesquisa == undefined || $scope.estrutura.camposOcultarFiltroPesquisa != '*';
                var camposMontagemFiltro = incluirCamposNoFiltro ? Object.assign({}, Object.assign({}, $scope.estrutura.campos)) : {};
                var campoEnviarMontarfiltro = MergeRecursive(camposPes, camposMontagemFiltro);

                $scope.camposFiltroPesquisa = _montarCamposFiltroConsulta(campoEnviarMontarfiltro);

                $scope.campo_chave = retorno.campo_chave;
                var estrutura = retorno;
                $scope.operadoresConsulta = operadoresConsulta;
                $scope.filtros = [];
                $scope.ordemFiltro = '';
                //$scope.itensPagina = "25";
                $scope.opcaoSelecionarTodosItensConsulta = $scope.estrutura.opcaoSelecionarTodosItensConsulta != undefined && $scope.estrutura.opcaoSelecionarTodosItensConsulta;
                $scope.ocultarItensPagina = $scope.estrutura.itensPagina != undefined && $scope.estrutura.itensPagina == -1;
                $scope.itensPagina = $scope.estrutura.itensPagina != undefined ? $scope.estrutura.itensPagina : "50";

                //Vendo se ha a subAcao se sim ponho ela como tela, mais usado no caso de popup
                $scope.tela = $scope.tela != undefined ? $scope.tela : subacao != undefined && subacao != '' ? subacao : 'consulta';

                $scope[retorno.raizModelo] = {};

                var usarTimerConsulta = estrutura.usarTimerConsulta != undefined && estrutura.usarTimerConsulta;
                var usarDataAlteracaoAoFiltrar = estrutura.usarDataAlteracaoAoFiltrar != undefined && estrutura.usarDataAlteracaoAoFiltrar



                //Rotina para por o atalho em Incluir
                window.onkeydown = function (ev) {
                    var e = ev || window.event,
                        key = e.keyCode;

                    if (key == 107) {
                        if ($scope.tela != 'cadastro') {
                            $scope.mudaTela('cadastro');
                            $scope.$apply();
                        }
                        e.preventDefault();
                    }
                }
                
                $scope.abrirVisualizacao = (arquivo, largura, altura) => {
                    var retorno = [];
                    var temp = window.location.href;
                    var raiz = temp.split('?')[0];
                    window.open(raiz + arquivo, 'popup', 'width=' + largura + ',height=' + largura);
                }

                $scope.alterarFiltroResultado = function (filtro) {
                    $parse('filtroResultado').assign($scope, filtro)
                }

                $scope.limparCampo = (e) => {
                    var input = $(event.target).closest('monta-html').find(':input');
                    var campo = input.attr('campo');
                    var modelo = input.attr('ng-model');
                    //console.log(modelo);
                    var modeloChave = $scope.estrutura.raizModelo + '["' + input.attr('modelo-chave') + '"]';

                    var indice = input.attr('indice');
                    var indiceSuperior = input.attr('indice-superior');

                    var campoEstrutura = APIServ.buscarValorVariavel($scope.estrutura.campos, campo);

                    var desabilitado = input.attr('disabled') == 'disabled';

                    const limpar = () => {
                        if (indice != undefined) {
                            modelo = modelo.replace('[$index]', `[${indice}]`);
                            modeloChave = modeloChave.replace('[$index]', `[${indice}]`);
                        }

                        if (indiceSuperior != undefined) {
                            modelo = modelo.replace('[$parent.$index]', `[${indiceSuperior}]`);
                            modeloChave = modeloChave.replace('[$parent.$index]', `[${indiceSuperior}]`);
                        }

                        $parse(modelo).assign($scope, '');

                        //console.log(modeloChave);
                        if (modeloChave != undefined) {
                            $parse(modeloChave).assign($scope, '');
                        }

                        if (desabilitado) {
                            input.attr('disabled', false)
                            //console.log($scope.temporada);
                        }
                    }

                    if (campoEstrutura.autoCompleta != undefined) {
                        if (campoEstrutura.autoCompleta.confirmarLimpar) {
                            const textoExibir = campoEstrutura.autoCompleta.confirmarLimparTexto != undefined ? campoEstrutura.autoCompleta.confirmarLimparTexto : 'Confirmar';
                            APIServ.dialogoSimples(textoExibir, '', 'Confirmar', 'Cancelar', limpar)
                        } else
                            limpar();
                    }


                    input.focus();
                }

                $scope.limparCampoConsulta = function (event) {
                    var input = $(event.target).closest('monta-html').find(':input');
                    var campo = input.attr('campo');
                    var modelo = input.attr('ng-model');
                    var modeloChave = input.attr('modelo-chave');

                    var indice = input.attr('indice');
                    var indiceSuperior = input.attr('indice-superior');

                    if (indice != undefined) {
                        modelo = modelo.replace('[$index]', `[${indice}]`);
                        modeloChave = modeloChave.replace('[$index]', `[${indice}]`);
                    }

                    if (indiceSuperior != undefined) {
                        modelo = modelo.replace('[$parent.$index]', `[${indiceSuperior}]`);
                        modeloChave = modeloChave.replace('[$parent.$index]', `[${indiceSuperior}]`);
                    }

                    $parse(modelo).assign($scope, '');

                    if (modeloChave != undefined) {
                        $parse(modeloChave).assign($scope, '');
                    }
                    input.focus();
                }

                $scope[estrutura.raizModelo] = EGFuncoes.novaVariavelRaizModelo($scope.estrutura);


                $scope.adicionarItemRepeticao = function (nomeBloco, obj, valor) {
                    var objEnviar = obj != undefined ? obj : this;
                    return EGFuncoes.adicionarItemRepeticao($scope, nomeBloco, objEnviar, valor);
                }

                $scope.adicionarTodosItensRepeticao = function (nomeBloco) {
                    var dadosBloco = APIServ.buscarValorVariavel($scope.estrutura.campos, nomeBloco);
                    var autoCompleta = APIServ.buscarValorVariavel(dadosBloco, 'autoCompleta');
                    var parametros = {
                        tabela: autoCompleta.tabela
                    }
                }

                if ($scope.removerItemRepeticao == undefined) {
                    $scope.removerItemRepeticao = function (nomeBloco) {
                        return EGFuncoes.removerItemRepeticao($scope, nomeBloco);
                    }
                }

                $scope.trocarPosicao = (idElemento) => {
                    var objeto = angular.element('#' + idElemento);
                    var posicaoAtual = Number(objeto.attr('indice')) + 1;
                    var posicaoNova = objeto.val().split(':')[1];

                    var indiceAtual = objeto.attr('indice');
                    var indiceNovo = parseInt(posicaoNova) - 1;

                    var nomeVariavelRepeticao = objeto.attr('item-repetir');
                    var variavelRepeticao = eval('$scope.' + objeto.attr('item-repetir'));

                    var valorAtual = variavelRepeticao[indiceAtual];
                    valorAtual['posicao'] = parseInt(posicaoNova);
                    var valorNovo = variavelRepeticao[indiceNovo];
                    valorNovo['posicao'] = parseInt(posicaoAtual);
                    variavelRepeticao[indiceAtual] = valorNovo;
                    variavelRepeticao[indiceNovo] = valorAtual;
                }

                $scope.mudaTela = function (tela) {
                    if (angular.element('#popUp').val() == 'true') {
                        window.close();
                    }

                    $scope.tela = tela;
                    $scope[estrutura.raizModelo] = EGFuncoes.novaVariavelRaizModelo($scope.estrutura);

                    if (tela == 'cadastro') {
                        if ($scope.aoCarregar != undefined) {
                            $scope.aoCarregar();
                        }
                        if (usarTimerConsulta) {
                            $rootScope.pausarTimer();
                        }
                        $scope.desabilitarSalvar = false;
                    } else if (tela == 'consulta' && usarTimerConsulta) {
                        $rS.reiniciarTimer();
                    }

                    if ((tela == 'cadastro' || tela == 'consulta') && $scope.carregarTinyMCE != undefined && $scope.estrutura.usarTinyMCE == true) {
                        $scope.carregarTinyMCE();
                    }
                }

                if ($scope.tela == undefined && retorno.tipoEstrutura == 'cadastroDireto' || retorno.tipoEstrutura == 'cadastroUnico') {
                    $scope.mudaTela('cadastro');
                } else if ($scope.tela == undefined && retorno.tipoEstrutura == 'consulta') {
                    $scope.mudaTela('consulta');
                }

                $scope.alterarExibicaoConsulta = () => {
                    $scope.exibirConsulta = !$scope.exibirConsulta;
                    if ($scope.exibirConsulta) {
                        $rootScope.pausarTimer();
                    } else {
                        $rootScope.iniciarTimer();
                    }
                }

                if (EGFuncoes.temConsulta(retorno)) {
                    $scope.adicionarFiltro = function () {
                        $scope.filtros.push({
                            'texto': '',
                            'campo': '',
                            'operador': 'like',
                            'valor': ''
                        });
                    }

                    $scope.adicionarFiltro();

                    $scope.ordemFiltro = $scope.estrutura.campoOrdemPadraoFiltro != undefined ? $scope.estrutura.campoOrdemPadraoFiltro : '';
                    $scope.sentidoFiltro = $scope.estrutura.sentidoOrdemPadraoFiltro ? $scope.estrutura.sentidoOrdemPadraoFiltro : '';
                    //  $scope.limiteFiltro = 


                    $scope.manipularFiltro = function (key, filtro) {
                        $scope.filtros[key]['valor'] = '';
                    }

                    $scope.removerFiltro = function (chave) {
                        var novoFiltro = [];
                        angular.forEach($scope.filtros, function (val, key) {
                            if (key != chave) {
                                novoFiltro.push($scope.filtros[key]);
                            }
                        })
                        $scope.filtros = novoFiltro;                        
                    }

                    $scope.limparFiltros = function () {
                        $scope.manipularFiltroLocal($scope.acao, 'limpar');

                        $scope.filtros = [];
                        $scope.adicionarFiltro();
                        if ($scope.estrutura.filtrosPadrao != undefined) {
                            for (var x in $scope.estrutura.filtrosPadrao) {
                                var obrigatorio = $scope.estrutura.filtrosPadrao[x]['obrigatorio'] != undefined && $scope.estrutura.filtrosPadrao[x]['obrigatorio'];
                                //console.log(obrigatorio);

                                if (obrigatorio) {
                                    var novoFiltro = {
                                        campo: x,
                                        operador: $scope.estrutura.filtrosPadrao[x]['operador'],
                                        valor: $scope.estrutura.filtrosPadrao[x]['valor'],
                                        exibir: $scope.estrutura.filtrosPadrao[x]['exibir'] == undefined || $scope.estrutura.filtrosPadrao[x]['exibir']
                                    }
                                    $scope.filtros.push(novoFiltro);
                                }
                            }
                        }
                        //console.log($scope.filtros);

                    }

                    $scope.limparFiltroResultado = (filtroResultado) => {
                        $('#filtro_resultado').val('');
                        $parse('filtroResultado').assign($scope, '');
                    }

                    $scope.manipularFiltroLocal = function(tela, acao = 'buscar', filtros) {
                        var filtrosLocal = APIServ.buscaDadosLocais('filtros') || {};

                        if(acao == 'buscar')       {                  
                            return filtrosLocal[tela] || []
                        }else if(acao == 'salvar') {                            
                            filtrosLocal[tela] = filtros;
                            APIServ.salvaDadosLocais('filtros', filtrosLocal);
                        }else if(acao == 'limpar') {
                            filtrosLocal[tela] = [];
                            APIServ.salvaDadosLocais('filtros', filtrosLocal);
                        }
                    }

                    var filtroLocal = $scope.manipularFiltroLocal($scope.acao, 'buscar');

                    if (filtroLocal.length > 0) {
                        $scope.filtros = filtroLocal;
                    } else if (estrutura.filtrosPadrao) {
                        //$scope.filtros = [];
                        var tirarPrimeiroFiltro = false;
                        angular.forEach(estrutura.filtrosPadrao, function (val, key) {
                            var incluirFiltroPadrao = true;
                            angular.forEach($scope.filtros, function (valF, keyF) {
                                incluirFiltroPadrao = valF.campo != key || valF.operador != val.operador || valF.valor != val.valor ? true : false;
                            })
                            if (incluirFiltroPadrao) {
                                if (val.tipo == 'intervaloDatas') {
                                    //Depois tenho que inserir as opcoes primeiro e ultimo dia do mes
                                    val.di = val.di == 'dataAtual' ? APIAjuFor.dataAtual() : undefined;
                                    val.df = val.df == 'dataAtual' ? APIAjuFor.dataAtual() : undefined;
                                }

                                //Vendo se o filtro e visivel, se sim, tiro o primeiro filtro que e em branco, se nao deixo ele
                                if (val.exibir) {
                                    tirarPrimeiroFiltro = true;
                                }

                                //console.log(key);
                                $scope.filtros.push({
                                    campo: key,
                                    operador: val.operador,
                                    valor: val.valor == 'data' ? APIAjuFor.dataAtual() : val.valor,
                                    exibir: val.exibir != undefined ? val.exibir : false,
                                    tipo: val.tipo,
                                    texto: val.texto,
                                    di: val.di,
                                    df: val.df
                                })
                            }
                        })
                        if (tirarPrimeiroFiltro) {
                            $scope.filtros.splice(0, 1);
                        }
                    }

                    $scope.converterFiltroParaEnvio = function () {
                        var retorno = [];

                        if ($scope.estrutura.camposFiltroPersonalizado != undefined) {
                            var camposPer = Object.assign({}, $scope.estrutura.camposFiltroPersonalizado);
                            for (i in camposPer) {
                                var campoPerFil = camposPer[i]['campoFiltro'] != undefined ? camposPer[i]['campoFiltro'] : i;
                                var valor = eval('$scope.' + $scope.estrutura.raizModelo + '.' + campoPerFil);
                                if (valor != undefined) {
                                    retorno.push({
                                        campo: campoPerFil,
                                        operador: camposPer[i]['operador'] != undefined ? camposPer[i]['operador'] : 'like',
                                        valor: valor
                                    });
                                }
                            }
                            //console.log(eval('$scope.' + $scope.estrutura.raizModelo + '.codigo_tipo_passaro'));    
                        }

                        angular.forEach($scope.filtros, function (filtro, key) {
                            if (filtro.tipo != undefined && filtro.tipo == 'intervaloDatas') {
                                retorno.push({
                                    campo: filtro.campo,
                                    operador: 'between',
                                    valor: filtro.di + '__' + filtro.df,
                                    texto: filtro.texto != undefined ? filtro.texto : filtro.campo,
                                    tipo: filtro.tipo != undefined ? filtro.tipo : 'varchar'
                                })
                            } else {
                                //Trocando o campo chave do filtro para o valor do objChave do auto completa caso exista
                                if ($scope.estrutura.camposFiltroPesquisa != undefined && $scope.estrutura.camposFiltroPesquisa[filtro['campo']] != undefined &&
                                    $scope.estrutura.camposFiltroPesquisa[filtro['campo']]['autoCompleta'] != undefined &&
                                    $scope.estrutura.camposFiltroPesquisa[filtro['campo']]['autoCompleta']['objChave'] != undefined && filtro['campo_chave'] != undefined)
                                    filtro['campo_chave'] = $scope.estrutura.camposFiltroPesquisa[filtro['campo']]['autoCompleta']['objChave'];

                                filtro['valor'] = filtro['valor'] != '' && filtro['valor'] != undefined ? filtro['valor'].toString().split('--')[0].trim() : '';
                                retorno.push(filtro);
                            }
                        })
                        return retorno;
                    }

                    $scope.atualizarCampoFiltro = (campo, valor) => {
                        $parse(campo).assign($scope, valor);
                        var campoOrdenar = $scope.ordemFiltro;

                        function crescente(varA, varB) {
                            return (varA[campoOrdenar] > varB[campoOrdenar]) ? 1 : ((varB[campoOrdenar] > varA[campoOrdenar] ? -1 : 0));
                        }
                        function decrescente(varA, varB) {
                            return (varA[campoOrdenar] < varB[campoOrdenar]) ? 1 : ((varB[campoOrdenar] < varA[campoOrdenar] ? -1 : 0));
                        }

                        if ($scope.sentidoFiltro == '') {
                            $scope.listaConsulta.sort(crescente)
                        } else {
                            $scope.listaConsulta.sort(decrescente);
                        }
                    }

                 
                    


                    //Vendo se a funcao de filtrar e personalizada e tem outro nome
                    if ($scope.estrutura.funcaoFiltrar != undefined) {
                        $scope.filtrar = eval('$scope.' + $scope.estrutura.funcaoFiltrar);
                    }

                    if ($scope.filtrar == undefined) {
                        $scope.filtrar = function (pagina = 1, origem = 'filtro') {
                            //Testando por limite no filtro inicial, para buscar apenas os últimos 500 registros
                            var limite = 0;// pagina == 0 ? 500 : 0;

                            if ($scope.antesDeFiltrar != undefined) {
                                $scope.antesDeFiltrar();
                            }

                            if ($scope.estrutura.filtroObrigatorio != undefined && $scope.estrutura.filtroObrigatorio) {
                                var filtroVer = $scope.filtros[0];
                                var temValor = filtroVer.valor != '' || (filtroVer.di != undefined && filtroVer.di != '') || (filtroVer.df != undefined && filtroVer.df != '');
                                if (filtroVer.campo == '' || !temValor) {
                                    APIServ.mensagemSimples('Defina ao Menos um Filtro');
                                    return false;
                                }
                            }

                            //Esta funcao foi criada, pois pode haver casos de ter intervalo de datas no filtro, ai tenho que divilo em dois.

                            $scope.manipularFiltroLocal($scope.acao, 'salvar', $scope.filtros);
                            $scope.filtroEnviar = $scope.converterFiltroParaEnvio();

                            //if (estrutura.mostrarAguardeAoFiltrar == undefined || estrutura.mostrarAguardeAoFiltrar) {
                            $rS.carregando = true;
                            //}
                            var resumo = [];
                            if (estrutura.resumoConsulta != undefined) {
                                angular.forEach(estrutura.resumoConsulta, function (val, key) {
                                    resumo.push({
                                        campo: key,
                                        operacao: val.operacao
                                    });
                                })
                            }

                            var addFiltro = function (campo, operador, valor, exibir) {
                                $scope.filtroEnviar.push({
                                    campo: campo,
                                    operador: operador,
                                    valor: valor,
                                    exibir: exibir
                                });
                            }

                            if (estrutura.filtrosPorUsuario != undefined) {
                                var usuario = APIServ.buscaDadosLocais('usuario');
                                if (usuario.chave_usuario > 0) {
                                    angular.forEach(estrutura.filtrosPorUsuario, function (valores, campo) {
                                        var valor = usuario[valores.valor] != undefined ? usuario[valores.valor] : usuario[campo];
                                        if (valor != null && APIServ.operacoesMatematicas(valores.operador, usuario[campo], valor)) {
                                            addFiltro(campo, '=', usuario[campo], false)
                                        }
                                    })
                                }
                            }

                            var campos = [];
                            angular.forEach($scope.estrutura.listaConsulta, function (itemLC, keyLC) {
                                if (angular.isObject(itemLC)) {
                                    campos.push(keyLC)
                                } else {
                                    campos.push(itemLC)
                                }
                            });

                            var ordemCampoTela = angular.element('#ordemFiltro').val();

                            var ordemFiltro = ordemCampoTela != undefined && ordemCampoTela != '' > 0 ?
                                angular.element('#ordemFiltro').val().split(':')[1] : $scope.ordemFiltro != '' ?
                                    $scope.ordemFiltro : '';

                            var sentidoFiltro = angular.element('#sentidoFiltro').length > 0 ?
                                angular.element('#sentidoFiltro').val() : $scope.sentidoFiltro != '' ?
                                    $scope.sentidoFiltro : '';

                            if (usarDataAlteracaoAoFiltrar && $scope.dataUltimaConsulta != undefined && origem == 'timer') {
                                var data_alteracao = APIAjuFor.dateParaTimestamp($scope.dataUltimaConsulta);
                                addFiltro('data_alteracao', '>=', data_alteracao, false);
                            }


                            var filtros = {
                                tabela: $scope.estrutura.tabela,
                                tabelaConsulta: $scope.estrutura.tabelaConsulta != undefined ? $scope.estrutura.tabelaConsulta : $scope.estrutura.tabela,
                                tela: acao,
                                campo_chave: $scope.estrutura.campo_chave,
                                pagina: pagina,
                                campos: campos, // Object.keys($scope.estrutura.listaConsulta),
                                filtros: $scope.filtroEnviar,
                                ordemFiltro: ordemFiltro != '' ? ordemFiltro + ' ' + sentidoFiltro : '',
                                itensPagina: '',
                                resumoConsulta: resumo,
                                dispositivoMovel: $scope.dispositivoMovel,
                                tabelasRelacionadas: $scope.estrutura.tabelasRelacionadas,
                                todosItensSelecionados: $scope.todosItensSelecionados != undefined ? $scope.todosItensSelecionados : false,
                                tirarCampoChaveConsulta: $scope.estrutura.tirarCampoChaveConsulta,
                                acaoAposFiltrar: $scope.estrutura.acaoAposFiltrar != undefined ? $scope.estrutura.acaoAposFiltrar : undefined,
                                limite: limite
                            }

                            //console.log(filtros);

                            //Fazendo comparacao se e pagina sem consulta, mostrando resultados direto ao abrir
                            if (pagina > 0) {
                                filtros.ordemFiltro = filtros.ordemFiltro == '' && angular.element('#ordemFiltro').length > 0 ? angular.element('#ordemFiltro').val().split(':')[1] : filtros.ordemFiltro;

                                // Para lazy loading, usar um número fixo de itens por página
                                if (origem === 'lazyLoad') {
                                    filtros.itensPagina = 20; // Número padrão para lazy loading
                                } else {
                                    filtros.itensPagina = angular.element('#itensPagina') != undefined ? angular.element('#itensPagina').val() : 0;
                                }
                            }

                            var fd = new FormData();
                            fd.append('parametros', angular.toJson(filtros));

                            var parametrosEnviarFiltro = $scope.tipoConsulta == 'post' ? fd : filtros;

                            // if (usarTimerConsulta && $scope.listaConsulta == undefined) {
                            //     setTimeout(() => {
                            //         $rootScope.pausarTimer();
                            //     }, 300);
                            // }



                            //APIServ.executaFuncaoClasse('classeGeral', 'consulta', filtros)
                            APIServ.executaFuncaoClasse('classeGeral', 'consulta', parametrosEnviarFiltro, $scope.tipoConsulta)
                                .success(function (data) {
                                    //console.log(data); $rootScope.carregando = false;/*
                                    //                                          console.log(data);
                                    if (usarTimerConsulta) {
                                        $rootScope.reiniciarTimer()
                                    }

                                    if (usarDataAlteracaoAoFiltrar) {
                                        $scope.dataUltimaConsulta = new Date();
                                        //console.log($scope.dataUltimaConsulta);
                                    }

                                    $rS.carregando = false;
                                    if (typeof data === 'object') {
                                        $scope.todosItensSelecionados = false;
                                        angular.element('#todosItensSelecionados').attr('checked', false);

                                        $scope.pagina = pagina;

                                        if (usarDataAlteracaoAoFiltrar && $scope.dataUltimaConsulta != undefined && origem == 'timer' && $scope.listaConsulta != undefined) {
                                            var novaLista = Object.assign([], data.lista);
                                            var listaAtual = Object.assign([], $scope.listaConsulta);
                                            var novaListaDefinitiva = Object.assign([], novaLista);

                                            if (Object.keys(novaLista).length > 0) {
                                                for (var x in listaAtual) {
                                                    var inserir = false;

                                                    for (var y in novaLista) {
                                                        //console.log(listaAtual[x][estrutura.campo_chave]);
                                                        //console.log(novaLista[y][estrutura.campo_chave]);

                                                        if (listaAtual[x][estrutura.campo_chave] != novaLista[y][estrutura.campo_chave]) {
                                                            inserir = true;
                                                        }
                                                    }

                                                    if (inserir) {
                                                        novaListaDefinitiva.push(listaAtual[x]);
                                                    }
                                                }
                                                $parse('listaConsulta').assign($scope, novaListaDefinitiva);
                                            }
                                        } else {
                                            // Implementação do Lazy Loading
                                            if (origem === 'lazyLoad') {
                                                // Para lazy loading, adicionar novos itens à lista existente
                                                if ($scope.listaConsulta === undefined) {
                                                    $scope.listaConsulta = [];
                                                }

                                                if (data.lista && data.lista.length > 0) {
                                                    // Adicionar novos itens evitando duplicatas
                                                    var itensExistentes = $scope.listaConsulta.map(item => item[estrutura.campo_chave]);
                                                    var novosItens = data.lista.filter(item =>
                                                        !itensExistentes.includes(item[estrutura.campo_chave])
                                                    );

                                                    $scope.listaConsulta = $scope.listaConsulta.concat(novosItens);

                                                    // Atualizar lista visível no lazy loading
                                                    if ($scope.listaConsultaVisivel === undefined) {
                                                        $scope.listaConsultaVisivel = [];
                                                    }
                                                    $scope.listaConsultaVisivel = $scope.listaConsultaVisivel.concat(novosItens);
                                                    $scope.temMaisItens = data.lista.length >= (data.paginacao ? data.paginacao.itensPagina : 20);
                                                    $scope.carregandoMaisItens = false;
                                                } else {
                                                    $scope.temMaisItens = false;
                                                    $scope.carregandoMaisItens = false;
                                                }
                                            } else {
                                                // Carregamento normal - substituir lista completa
                                                $parse('listaConsulta').assign($scope, data.lista);

                                                // Inicializar variáveis de lazy loading para filtro normal
                                                $scope.listaConsultaVisivel = undefined; // Será inicializada pela diretiva
                                                $scope.carregandoMaisItens = false;
                                                $scope.temMaisItens = true;
                                                $scope.ultimaPaginaCarregada = 0;
                                            }
                                        }

                                        if (data.resumoConsulta != undefined) {
                                            $parse('resumoConsulta').assign($scope, data.resumoConsulta);
                                        }

                                        if (data.resumoConsultaPersonalizado != undefined) {
                                            $parse('resumoConsultaPersonalizado').assign($scope, data.resumoConsultaPersonalizado)
                                        }

                                        if ($scope.aposFiltrar != undefined) {
                                            $scope.aposFiltrar();
                                        }
                                    } else {
                                        APIServ.mensagemSimples('Informação', 'Erro ao Filtrar');
                                    }

                                    //*/
                                }).error(function (a, b, c) {
                                    //console.log(a);
                                    //console.log(b);
                                    //console.log(c);
                                    $rS.carregando = false;
                                    APIServ.mensagemSimples('Informação', 'Erro ao Filtrar');
                                });
                            //*/
                        }
                    }

                    
                    if (($scope.estrutura.filtrarAoIniciar == undefined || $scope.estrutura.filtrarAoIniciar == true) && $scope.tela == 'consulta') {
                        setTimeout(function () {

                            $scope.filtrar(0);
                        }, 100);
                    }

                    if ($scope.selecionarItemConsulta == undefined) {
                        $scope.selecionarItemConsulta = function (key, item) {
                            var parametros = {
                                tela: acao,
                                key: key,
                                campo_chave: $scope.estrutura.campo_chave,
                                chave: item[$scope.estrutura.campo_chave],
                                selecionado: item.selecionado != undefined && item.selecionado
                            }
                            APIServ.executaFuncaoClasse('classeGeral', 'selecionarItemConsulta', parametros).success(function (retorno) {

                            })
                        }
                    }

                    $scope.itensPaginaPaginacao = () => {
                        //console.log(app.current_page);
                    }

                    if ($scope.selecionarTodosItensConsulta == undefined) {
                        $scope.selecionarTodosItensConsulta = function () {

                            var teste = $scope.itensPaginaPaginacao();
                            //console.log(teste);

                            $scope.todosItensSelecionados = $scope.todosItensSelecionados == 'false' || !$scope.todosItensSelecionados;
                            if ($scope.listaConsulta != undefined && Object.keys($scope.listaConsulta).length > 0) {
                                var parametros = {
                                    tela: acao,
                                    selecionado: $scope.todosItensSelecionados
                                }
                                APIServ.executaFuncaoClasse('classeGeral', 'selecionarTodosItensConsulta', parametros).success(function () {
                                    angular.forEach($scope.listaConsulta, function (item) {
                                        item.selecionado = $scope.todosItensSelecionados;
                                    })
                                })
                            }
                        }
                    }

                    if ($scope.detalhar == undefined) {
                        $scope.detalhar = function (item) {
                            var retorno = [];
                            var keyRetorno = 0;
                            //Monto o filtro com a chave do item

                            var filtros = {
                                tabela: $scope.estrutura.tabela,
                                campo_chave: $scope.estrutura.campo_chave,
                                chave: item[$scope.estrutura.campo_chave],
                            }

                            //Vendo se ha tabelas relac
                            if ($scope.estrutura.tabelasRelacionadas != undefined) {
                                filtros['tabelasRelacionadas'] = $scope.estrutura.tabelasRelacionadas;
                            }

                            //Vendo se o detalhe do item ja foi carregado
                            if (item['detalhes'] == undefined) {
                                APIServ.executaFuncaoClasse('classeGeral', 'detalhar', filtros).success(function (data) {
                                    //console.log(data);
                                    item['arquivosAnexados'] = data.arquivosAnexados;
                                    item['exibirDetalhes'] = true;
                                    item['detalhes'] = {};
                                    item['detalhes'] = data;
                                    if ($scope.aoDetalhar != undefined) {
                                        $scope.aoDetalhar(item);
                                    }
                                })

                            } else {
                                item['exibirDetalhes'] = !item['exibirDetalhes'];
                            }
                        }
                    }
                }

                if (EGFuncoes.temCadastro(retorno)) {
                    if (retorno.variavelValidarAoSubmeter != undefined) {
                        $scope[retorno.variavelValidarAoSubmeter] = false;
                    }

                    if ($scope.salvar == undefined) {

                        $scope.salvar = function (dadosTela, nomeForm) {

                            $invalidos = document.getElementsByClassName('erro').length > 0;
                            if ($scope.formularioInvalido || $invalidos) {
                                return true;
                            }

                            $scope.desabilitarSalvar = true;

                            if ($scope.antesSalvar != undefined) {
                                $scope.antesSalvar();
                            }


                            var indice = dadosTela['indiceVariavel'];
                            var dados = APIServ.transporVariavel($scope[estrutura.raizModelo]);

                            $rootScope.carregando = true;
                            var fd = $scope.fd;

                            var textoSalvou = $scope.estrutura.textoConfirmaSalvamento != undefined ? $scope.estrutura.textoConfirmaSalvamento : 'Dados Inseridos com Sucesso!';

                            fd.append('dados', angular.toJson(dados));

                            //Definindo as configuracoes
                            var configuracoes = {
                                tabela: $scope.estrutura.tabela,
                                campo_chave: $scope.estrutura.campoChave != undefined ? $scope.estrutura.campoChave : $scope.estrutura.campo_chave,
                                classe: $scope.estrutura.classe != undefined ? $scope.estrutura.classe : $scope.estrutura.tabela,
                                funcaoEstrutura: $scope.funcaoEstrutura != undefined ? $scope.funcaoEstrutura : undefined,
                                funcaoManipula: $scope.estrutura.funcaoManipula,
                                tabelasRelacionadas: $scope.estrutura.tabelasRelacionadas,
                                camposSeVazios: []
                            }

                            //console.log(configuracoes);

                            var varrerCamposVerificarAnexos = campos => {
                                angular.forEach(campos, function (val, key) {
                                    if (key.substr(0, 5) == 'bloco') {
                                        varrerCamposVerificarAnexos(campos[key]['campos']);
                                    } else if (val.tipo == 'arquivo' || val.tipo == 'imagem') {

                                        configuracoes['arquivosAnexar'] = configuracoes['arquivosAnexar'] != undefined ? configuracoes['arquivosAnexar'] : [];
                                        var at = val.atributos_arquivo != undefined ? val.atributos_arquivo : [];
                                        fd.append(key, dadosTela[key]);

                                        configuracoes['arquivosAnexar'].push({
                                            campo: key,
                                            tipo_arquivo: at.tipo_arquivo != undefined ? at.tipo_arquivo : '',
                                            largura: at.largura != undefined ? at.largura : '600',
                                            altura: at.altura != undefined ? at.altura : '600',
                                            destino: at.caminhoBase != undefined ? at.caminhoBase : '',
                                            salvarEmDiretorio: at.salvarEmDiretorio != undefined ? at.salvarEmDiretorio : true,
                                            nomeAnexo: at.nomeAnexo != undefined ? at.nomeAnexo : ''

                                        })
                                    } else if (val.seVazio != undefined) {
                                        //Deixar para uma proxima oportunidade
                                    }
                                });
                            }

                            varrerCamposVerificarAnexos($scope.estrutura.campos);

                            if ($scope.estrutura.relacionamentosVerificar != undefined) {
                                configuracoes['relacionamentosVerificar'] = $scope.estrutura.relacionamentosVerificar;
                            }

                            var parametrosEnviar;
                            if ($scope.tipoSalvar == 'post') {
                                fd.append('configuracoes', angular.toJson(configuracoes));

                                angular.forEach($rootScope.$files, function (value, key) {
                                    $scope.fd.append(key, value);
                                });
                                parametrosEnviar = fd;
                            } else if ($scope.tipoSalvar == 'get') {
                                parametrosEnviar = {
                                    dados: dadosTela,
                                    configuracoes: configuracoes
                                }
                            }


                            // APIServ.executaFuncaoClasse('classeGeral', 'manipula', {dados:dadosTela, configuracoes: configuracoes})
                            // $http.post('api/manipulaTabela', fd, {
                            //     transformRequest: angular.identity,
                            //     headers: {
                            //         'Content-Type': undefined
                            //     }
                            // })
                            APIServ.executaFuncaoClasse('classeGeral', 'manipula', parametrosEnviar, $scope.tipoSalvar)
                                .success(function (retorno) {
                                    // console.log(retorno); $scope.desabilitarSalvar = false; $rootScope.carregando = false; /*
                                    if ($scope.tipoSalvar == 'get') {
                                        //console.log(retorno);
                                        return false;
                                    }

                                    $scope.fd = new FormData();
                                    $rootScope.carregando = false;
                                    $scope.desabilitarSalvar = false;

                                    if (retorno.erro != undefined) {
                                        APIServ.mensagemSimples(retorno.erro);

                                    } else if (retorno.camposDuplicados != undefined) {
                                        APIServ.mensagemSimples('Informação!', 'Há Campos Que já existem na base de dados.');
                                    } else if (retorno.camposObrigatoriosVazios != undefined) {
                                        APIServ.mensagemSimples('Informação!', 'Há Campos Obrigatórios Não Preenchidos');
                                    } else if (typeof retorno === 'string') {
                                        APIServ.mensagemSimples('Informação', 'Erro ao Salvar, tente novamente!');
                                    } else {
                                        var cadastroDiretoUrl = parametrosUrl[2] != undefined && parametrosUrl[2] == 'cadastro' ? true : false;
                                        var funcao = function () {
                                            if (EGFuncoes.temConsulta($scope.estrutura) && !cadastroDiretoUrl) {
                                                $scope.tela = 'consulta';

                                                setTimeout(function () {
                                                    //angular.element('#filtrar').trigger('click');
                                                    if ($scope.estrutura.filtrarAoIniciar != undefined && $scope.estrutura.filtrarAoIniciar) {
                                                        $scope.filtrar();
                                                    }
                                                }, 100);
                                            }

                                            // CORREÇÃO: Verificar se estamos em contexto modal antes de recarregar
                                            if (($scope.estrutura.recarregarAposSalvar != undefined && $scope.estrutura.recarregarAposSalvar) || cadastroDiretoUrl) {
                                                // Se estiver em modal, não recarregar a página - apenas fechar o modal
                                                if ($scope.isModal || ($scope.localExibicao && $scope.localExibicao === 'modal')) {
                                                    console.log('🎭 [estruturaGerencia] Contexto modal detectado - evitando window.location.reload()');

                                                    // Fechar o modal se estiver em contexto modal
                                                    if (window.bootstrap && window.bootstrap.Modal) {
                                                        // Bootstrap 5
                                                        var modals = document.querySelectorAll('.modal.show');
                                                        modals.forEach(function (modal) {
                                                            var modalInstance = window.bootstrap.Modal.getInstance(modal);
                                                            if (modalInstance) modalInstance.hide();
                                                        });
                                                    } else if (window.$ && window.$.fn.modal) {
                                                        // Bootstrap 4/jQuery
                                                        $('.modal.show, .popup-modal.show, .popup-modal.in').modal('hide');
                                                    }

                                                    // Resetar modelo se necessário
                                                    if ($scope.estrutura.raizModelo) {
                                                        $scope[$scope.estrutura.raizModelo] = EGFuncoes.novaVariavelRaizModelo($scope.estrutura);
                                                    }
                                                } else {
                                                    // Comportamento normal fora do modal
                                                    window.location.reload();
                                                }
                                            } else {
                                                $scope[$scope.estrutura.raizModelo] = EGFuncoes.novaVariavelRaizModelo($scope.estrutura);
                                            }
                                            if (angular.element('#popUp').val() == 'true') {
                                                window.close();
                                            }
                                            if ($scope.estrutura.executarAposSalvar != undefined) {
                                                $scope[$scope.estrutura.executarAposSalvar.funcao](retorno);
                                            } else if ($scope.executarAposSalvar != undefined) {
                                                $scope.executarAposSalvar();
                                            }
                                        }

                                        if ($scope.aoSalvar != undefined) {
                                            $scope.aoSalvar(retorno);
                                        } else if ($scope.estrutura.tipoEstrutura == 'cadastroUnico') {
                                            var funcaoCadUnico = () => {
                                                // CORREÇÃO: Verificar se estamos em contexto modal antes de recarregar
                                                if ($scope.isModal || ($scope.localExibicao && $scope.localExibicao === 'modal')) {
                                                    console.log('🎭 [estruturaGerencia] CadastroUnico - contexto modal detectado - evitando window.location.reload()');

                                                    // Fechar o modal se estiver em contexto modal
                                                    if (window.bootstrap && window.bootstrap.Modal) {
                                                        // Bootstrap 5
                                                        var modals = document.querySelectorAll('.modal.show');
                                                        modals.forEach(function (modal) {
                                                            var modalInstance = window.bootstrap.Modal.getInstance(modal);
                                                            if (modalInstance) modalInstance.hide();
                                                        });
                                                    } else if (window.$ && window.$.fn.modal) {
                                                        // Bootstrap 4/jQuery
                                                        $('.modal.show, .popup-modal.show, .popup-modal.in').modal('hide');
                                                    }

                                                    // Resetar modelo se necessário
                                                    if ($scope.estrutura.raizModelo) {
                                                        $scope[$scope.estrutura.raizModelo] = EGFuncoes.novaVariavelRaizModelo($scope.estrutura);
                                                    }
                                                } else {
                                                    // Comportamento normal fora do modal
                                                    window.location.reload();
                                                }
                                            }

                                            APIServ.mensagemSimples('Confirmação', textoSalvou, funcaoCadUnico);
                                        } else if ($scope.estrutura.naoMostrarConfirmacaoAoSalvar == undefined || $scope.estrutura.naoMostrarConfirmacaoAoSalvar == false) {
                                            if ($scope.estrutura.usarChaveTextoConfirmaSalvamento != undefined && $scope.estrutura.usarChaveTextoConfirmaSalvamento) {
                                                textoSalvou += ' Com código: ' + retorno.chave;
                                            }
                                            APIServ.mensagemSimples('Confirmação', textoSalvou, funcao, true);
                                        } else {
                                            funcao();
                                        }

                                    }
                                    //*/
                                })
                                .error(function (a, b, c) {
                                    //console.log(a);
                                    $scope.desabilitarSalvar = false;
                                    $rootScope.carregando = false;
                                    APIServ.mensagemSimples('Informação', 'Erro ao Salvar. Tente Novamente!');
                                });
                            //*/
                        }


                    }

                    if ($scope.estrutura.tipoEstrutura == 'cadastroUnico') {
                        var filtros = {
                            tabela: $scope.estrutura.tabela,
                            campo_chave: $scope.estrutura.campo_chave,
                            campos: $scope.estrutura.listaConsulta != undefined ? Object.keys($scope.estrutura.listaConsulta) : '*',
                            chave: 1
                        }


                        APIServ.executaFuncaoClasse('classeGeral', 'buscarParaAlterar', filtros).success(function (data) {

                            $scope[$scope.estrutura.raizModelo] = data;
                        })
                    }

                    if ($scope.alterar == undefined) {
                        $scope.alterar = function (valor) {
                            //console.log(valor);
                            //console.log('alterando');
                            if (usarTimerConsulta) {
                                $rootScope.pausarTimer();
                            }
                            $rS.carregando = true;
                            var indiceVariavel = this.$index;
                            var filtros = {
                                tabela: $scope.estrutura.tabela,
                                tabelaConsulta: $scope.estrutura.tabelaConsulta,
                                campo_chave: $scope.estrutura.campo_chave,
                                chave: valor[$scope.estrutura.campo_chave]
                            }


                            if ($scope.estrutura.tabelasRelacionadas != undefined) {
                                filtros['tabelasRelacionadas'] = $scope.estrutura.tabelasRelacionadas;
                            }

                            if ($scope.estrutura.campoChaveSecundaria != undefined && valor[$scope.estrutura.campoChaveSecundaria] != undefined) {
                                filtros['campoChaveSecundaria'] = $scope.estrutura.campoChaveSecundaria;
                                filtros['valorChaveSecundaria'] = valor[$scope.estrutura.campoChaveSecundaria];
                            }

                            if ($scope.antesDeBuscarParaAlterar != undefined) {
                                $scope.antesDeBuscarParaAlterar(filtros);
                            }

                            var fd = new FormData();
                            fd.append('filtros', JSON.stringify(filtros));
                            APIServ.executaFuncaoClasse('classeGeral', 'buscarParaAlterar', fd, 'post').success(function (data) {
                                //APIServ.executaFuncaoClasse('classeGeral', 'buscarParaAlterar', filtros).success(function (data) {
                                //                                  console.log(data);
                                $rS.carregando = false;
                                if (usarTimerConsulta) {
                                    $rootScope.iniciarTimer();
                                }

                                if (typeof data === 'string') {
                                    APIServ.mensagemSimples('Informação', 'Erro, Tente Novamente');
                                } else {

                                    data['indiceVariavel'] = indiceVariavel;
                                    $scope[$scope.estrutura.raizModelo] = data;

                                    $scope.tela = 'cadastro';
                                    if (usarTimerConsulta) {
                                        $rootScope.pausarTimer();
                                    }

                                    //$scope.mudaTela('cadastro');
                                    if (($scope.tela == 'cadastro' || $scope.tela == 'consulta') && $scope.estrutura.usarTinyMCE == true && $scope.carregarTinyMCE != undefined) {

                                        //console.log('mudando');
                                        $scope.carregarTinyMCE();
                                    }

                                    if ($scope.estrutura.funcaoAoAlterar != undefined) {
                                        var nomeFuncaoAlterar = eval('$scope.' + $scope.estrutura.funcaoAoAlterar);
                                        nomeFuncaoAlterar(data);
                                    } else if ($scope.aoAlterar != undefined) {
                                        $scope.aoAlterar(data);
                                    }
                                }
                            }).error((a, b, c) => {
                                //console.log(a);
                            })
                        }
                    }
                }

                //Fazendo esta comparaca para nao sobrescrever a funcao caso seja declarada no controller
                if ($scope.excluir == undefined) {
                    $scope.excluir = function (item) {
                        var parametros = {
                            tabela: $scope.estrutura.tabela,
                            campo_chave: $scope.estrutura.campo_chave,
                            chave: item[$scope.estrutura.campo_chave]
                        }

                        var funcao = function () {
                            APIServ.executaFuncaoClasse('classeGeral', 'excluir', parametros).success(function (retorno) {
                                console.log(retorno);
                                if (retorno.erro != undefined) {
                                    APIServ.mensagemSimples(retorno.erro)
                                } else if (retorno.chave >= 0) {
                                    var key = $scope.listaConsulta.indexOf(item);
                                    $scope.listaConsulta.splice(key, 1);
                                    APIServ.mensagemSimples('Confirmação', $scope.estrutura.nomeUsual + ' Excluído!');
                                } else if (retorno.chave > 0) {
                                    APIServ.mensagemSimples('Informação', $scope.estrutura.nomeUsual + ' Está em Uso e não pode ser Excluído!');
                                }
                            })
                        }
                        APIServ.dialogoSimples('Confirmação', 'Excluir ' + $scope.estrutura.nomeUsual + '!?', 'Sim', 'Não', funcao);
                    }

                }

                $scope.mostrarInformacoes = (campo) => {
                    var elemento = $(event.target);
                    var campoTemp = APIServ.buscarValorVariavel($scope.estrutura.campos, campo);
                    var mensagem = campoTemp.informacoes;
                    var elementoPai = elemento.closest('div.form-group');
                    elementoPai.attr('data-toggle', 'popover').attr('data-content', mensagem).popover({
                        'placement': 'bottom'
                    }).popover('show')

                    /*
                    $scope[raizModelo]['mostrarInformacoes_' + campo] = !$scope[raizModelo]['mostrarInformacoes_' + campo];
                    console.log($scope[raizModelo]['mostrarInformacoes_' + campo]);
                    */
                }

                var html = '';
                if (EGFuncoes.temConsulta(retorno)) {
                    html += '<cabecalho-consulta></cabecalho-consulta>'; //montaCabecalhoConsulta(retorno, $scope);
                    html += '<lista-consulta></lista-consulta>'; //  montaListaConsulta(estrutura);
                }

                //Esta variavel armazenará todas as campos do formulario vazios
                $scope['campo_vazio'] = {};

                if (EGFuncoes.temCadastro(retorno)) {
                    html += '<formulario-cadastro></formulario-cadastro>'; // montaInicioFormCadastro(retorno, raizModelo);
                }

                if (EGFuncoes.temCadastroDireto(retorno)) {
                    $scope.tela = 'cadastro';
                }
                if (retorno.tipoEstrutura == 'somenteCadastro') {
                    $scope.tela = 'cadastro';
                }

                if (retorno.tipoEstrutura != 'personalizado') {
                    $element.html(html);
                    $compile($element.contents())($scope);
                }

                if ($scope.aoCarregar != undefined) {
                    $scope.aoCarregar();
                }

                //Fiz esta rotina para ver se poe as mascaras nos campos de pesquisa, quando sao padrao
                if ($scope.tela == 'consulta' && estrutura.filtrosPadrao) {
                    setTimeout(function () {
                        angular.forEach($scope.filtros, function (item, key) {
                            if (item.campo != '') {
                                angular.element(`#filtros_${key}_campo`).trigger('change');
                                $scope.filtros[key]['valor'] = estrutura.filtrosPadrao[item['campo']]['valor'] != undefined ? estrutura.filtrosPadrao[item['campo']]['valor'] : '';
                            }
                        });

                        if ($scope.filtros[0]['valor'] == '' && $scope.exibirConsulta) {
                            angular.element('#filtros_0_valor').focus();
                        }
                    }, 200);
                }

                if (!$scope.exibirConsulta && document.querySelector('#filtro_resultado') !== null) {
                    setTimeout(() => {
                        document.querySelector('#filtro_resultado').focus();
                    }, 200);
                }
                //Fim das rotinas do timer da consulta
            }


            var rotaAtual = $route.current;
            var parametrosRota = $routeParams;

            console.log('Dados da rota atual:', rotaAtual);
            console.log('Parâmetros da rota:', parametrosRota);

            //var url = $attrs.urlTemplate; Descontinuado, era para carregar arquivos .tmpls.js que continham as estruturas nas versões anteriores do sistema
            //var classe = $attrs.classe;
            var classe;
            if ($route.current.classe != undefined)
                classe = $route.current.classe;
            else if ($attrs.classe != undefined)
                classe = $attrs.classe;


            //Descontinuada
            // if (url != undefined && $scope.estrutura == undefined) {
            //     $http.get(url).success(function (retorno) {
            //         montarEstrutura(retorno);
            //     })
            // } else 
            if ($scope.estrutura != undefined) {
                montarEstrutura($scope.estrutura);
            } else if ($element.attr('variavelEstrutura') != undefined) {
                $scope.estrutura = $scope[$element.attr('variavelEstrutura')];
                montarEstrutura($scope.estrutura);
            } else if (classe != undefined) {
                let parametrosBuscaEstrutura = {
                    classe: classe,
                    parametrosEnviados: $('#parametrosEnviados').val()
                };

                var funcaoEstrutura;
                if ($route.current.funcaoEstrutura != undefined) 
                    funcaoEstrutura = $route.current.funcaoEstrutura;
                else if($attrs.funcaoEstrutura != undefined)
                    funcaoEstrutura = $attrs.funcaoEstrutura;

                if (funcaoEstrutura != undefined) {
                    parametrosBuscaEstrutura['funcaoEstrutura'] = funcaoEstrutura;
                    $scope.funcaoEstrutura = funcaoEstrutura;
                }

                let paramEnviarBuscaEstrutura = parametrosBuscaEstrutura;

                console.log(paramEnviarBuscaEstrutura);
                if ($scope.tipoConsulta == 'post') {
                    let fdEnviarBuscaEstrutura = new FormData();
                    fdEnviarBuscaEstrutura.append('parametros', JSON.stringify(parametrosBuscaEstrutura));
                    paramEnviarBuscaEstrutura = fdEnviarBuscaEstrutura;
                }

                APIServ.executaFuncaoClasse('classeGeral', 'buscarEstrutura', paramEnviarBuscaEstrutura, $scope.tipoConsulta).success(retorno => {
                    console.log(retorno);
                    montarEstrutura(retorno);
                })


            }
        }

        return {
            restrict: 'E',
            controller: ['$rootScope', '$scope', '$element', '$attrs', '$route', '$routeParams', 'EGFuncoes', 'APIAjuFor', 'PopUpModal', controller]
        }
    }
])