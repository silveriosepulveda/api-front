app.directive("estruturaGerencia", [
    "$compile",
    "$base64",
    "$parse",
    "filtroPadrao",
    "operadoresConsulta",
    "$http",
    "APIServ",
    "$filter",
    "APIAjuFor",
    "EGFuncoes",
    "PopUpModal",
    function ($compile, $base64, $parse, filtroPadrao, operadoresConsulta, $http, APIServ, $filter, APIAjuFor, EGFuncoes, PopUpModal) {
        ////////////////////////////////////////////////////////////////////////////////////////
        ////////////////FUNCOES DE MONTAGEM DE HTML/////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////////////

        // console.log('inicializando estruturaGerencia');

        var controller = function ($rootScope, $scope, $element, $attrs, $route, $routeParams, EGFuncoes, APIAjuFor, PopUpModal) {
            //console.log('inicializando estruturaGerencia');

            // Usar o $scope do Angular diretamente como escopo
            const escopo = $scope;

            // Detectar contexto modal através do atributo local-exibicao
            const localExibicao = $attrs.localExibicao || "normal";
            const isModal = localExibicao === "modal";

            var classe;
            // Se estiver em modal, priorizar atributo sobre rota atual
            if (isModal && $attrs.classe != undefined) {
                classe = $attrs.classe;
                //console.log('🔍 [estruturaGerencia] Modal detectado - usando classe do atributo:', classe);
            } else if ($route.current && $route.current.classe != undefined) {
                classe = $route.current.classe;
                //console.log('🔍 [estruturaGerencia] Usando classe da rota atual:', classe);
            } else if ($attrs.classe != undefined) {
                classe = $attrs.classe;
                //console.log('🔍 [estruturaGerencia] Usando classe do atributo:', classe);
            }            

            $element.attr('classe', classe);

            // Se estiver em contexto modal, aplicar CSS para ocultar elementos
            if (isModal) {
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
                if (!document.getElementById("estrutura-modal-styles")) {
                    var style = document.createElement("style");
                    style.id = "estrutura-modal-styles";
                    style.textContent = css;
                    document.head.appendChild(style);
                    //console.log('🎨 [estruturaGerencia] CSS modal injetado no documento');
                }

                // Aplicar classe modal ao elemento da estrutura
                if ($element[0]) {
                    $element[0].classList.add("estrutura-modal");
                    //console.log('🏗️ [estruturaGerencia] Classe "estrutura-modal" aplicada ao elemento');
                }

                // Aplicar classe modal ao body para controle global
                document.body.classList.add("estrutura-modal-ativa");
                //console.log('🌐 [estruturaGerencia] Classe "estrutura-modal-ativa" aplicada ao body');

                // Configurar limpeza quando o escopo for destruído
                // Usar escopo diretamente pois $rootScope['estruturas'][classe] ainda não foi criado
                escopo.$on("$destroy", function () {
                    document.body.classList.remove("estrutura-modal-ativa");
                    if ($element[0]) {
                        $element[0].classList.remove("estrutura-modal");
                    }
                    //console.log('🧹 [estruturaGerencia] Limpeza modal: classes removidas');
                });
            }

            escopo.popUp = document.getElementById("popUp") != undefined && document.getElementById("popUp").value;

            escopo.larguraTela = window.screen.availWidth;
            escopo.alturaTela = window.screen.availHeight;
            escopo.dispositivoMovel = escopo.larguraTela <= 900;
            escopo.tipoSalvar = "post";
            escopo.tipoConsulta = "post";

            var html = "";
            escopo.fd = new FormData();

            var montarEstrutura = function (estrutura) {
                var retorno = estrutura;
                const elementoEstrutura = $element[0];                
               
                // Recuperar e processar o atributo parametros se existir
                var parametrosRecebidos = null;
                if ($attrs.parametros) {
                    try {
                        // Tentar fazer parse do JSON se for string
                        var parametrosStr = $attrs.parametros;
                        if (typeof parametrosStr === 'string' && parametrosStr.trim().startsWith('{')) {
                            parametrosRecebidos = JSON.parse(parametrosStr);
                        } else if (typeof parametrosStr === 'string' && parametrosStr.trim().startsWith('[')) {
                            parametrosRecebidos = JSON.parse(parametrosStr);
                        } else {
                            // Se não for JSON, tentar usar diretamente ou avaliar como expressão Angular
                            try {
                                var parseFn = $parse(parametrosStr);
                                parametrosRecebidos = parseFn($scope);
                            } catch (e) {
                                // Se não conseguir avaliar, manter como string
                                parametrosRecebidos = parametrosStr;
                            }
                        }
                    } catch (e) {
                        // Se não conseguir fazer parse, usar como string
                        parametrosRecebidos = $attrs.parametros;
                    }
                    
                    // Disponibilizar no scope para uso posterior
                    escopo.parametrosRecebidos = parametrosRecebidos;
                }
                                                
                //Fazendo a validacao dos poderes do usuario
                var menuPainel = APIServ.buscaDadosLocais("menuPainel");

                var parametrosUrl = APIServ.parametrosUrl();

                var parametrosLocal = undefined;
                var parametrosLocalTemp = { pagina: "", acao: "", subAcao: "" };

                if (!escopo.popUp) {
                    APIServ.apagaDadosLocais("parametrosUrl");
                }

                if (parametrosUrl.length == 0) {
                    parametrosLocal = APIServ.buscaDadosLocais("parametrosUrl");
                    parametrosLocal = parametrosLocal ? parametrosLocal : parametrosLocalTemp;
                }

                var raizModelo = retorno.raizModelo;
                var pagina;
                var acao;
                var subacao;
                var parametrosAcao;

                if (escopo.isModal) {
                    //  pagina = $attrs.classe;
                    acao = $attrs.subacao || "";
                    subacao = $attrs.subacao || "";
                    // Usar os parâmetros processados se disponíveis, senão usar atributo direto
                    parametrosAcao = escopo.parametrosRecebidos != null ? escopo.parametrosRecebidos : ($attrs.parametros || "");
                } else {
                    pagina = parametrosUrl[0] != undefined ? parametrosUrl[0] : parametrosLocal["pagina"];
                    acao = parametrosUrl[1] != undefined ? parametrosUrl[1] : parametrosLocal["acao"];
                    subacao =
                        parametrosUrl[2] != undefined
                            ? parametrosUrl[2]
                            : parametrosLocal != undefined && parametrosLocal["subAcao"] != undefined
                            ? parametrosLocal["subAcao"]
                            : "";
                }

                escopo.pagina = pagina;
                escopo.acao = acao;
                escopo.subacao = subacao;              

                $rS["acao"] = acao;
                if ($rS[acao] == undefined) {
                    $rS[acao] = {};
                    $rS[acao]["acoes"] = menuPainel.acoes != undefined && menuPainel.acoes[acao] != undefined ? menuPainel.acoes[acao] : [];
                    $rS[acao]["campos"] = menuPainel.campos != undefined && menuPainel.campos[acao] != undefined ? menuPainel.campos[acao] : [];
                }

                escopo.parametrosUrl = parametrosUrl;

                escopo.estrutura = retorno;

                escopo.exibirConsulta = retorno.exibirConsulta != undefined && retorno.exibirConsulta;

                if (escopo.antesCarregar != undefined) {
                    escopo.antesCarregar();
                }
                retorno["tipoEstrutura"] = retorno.tipoEstrutura != undefined ? retorno.tipoEstrutura : "padrao";

                var _montarCamposFiltroConsulta = function (campos, retornoEnt) {
                    //Despois tenho que por opcoes de pesquisar por tabelas relacionadas
                    var retornoMCFC = retornoEnt != undefined ? retornoEnt : [];
                    var filtrosPersonalizados = escopo.estrutura.camposFiltroPesquisa != undefined ? escopo.estrutura.camposFiltroPesquisa : {};

                    angular.forEach(campos, function (val, campo) {
                        var temCampoFiltro = escopo.estrutura.camposFiltroPesquisa != undefined && escopo.estrutura.camposFiltroPesquisa[campo] != undefined;

                        if (EGFuncoes.eBloco(campo) && val.nome == undefined) {
                            retornoMCFC = _montarCamposFiltroConsulta(val.campos, retornoMCFC);
                        } else if (
                            (val.tipo != "oculto" || temCampoFiltro) &&
                            val.tipo != "area-texto" &&
                            campo.substr(0, 5) != "botao" &&
                            typeof val === "object" &&
                            val.tipo != "diretiva"
                        ) {
                            var ocultarCampoFiltro =
                                escopo.estrutura.camposOcultarFiltroPesquisa != undefined &&
                                APIServ.valorExisteEmVariavel(escopo.estrutura.camposOcultarFiltroPesquisa, campo);

                            if (!ocultarCampoFiltro) {
                                var campoEmCampos = null;
                                if (temCampoFiltro) {
                                    campoEmCampos = Object.assign(
                                        APIServ.buscarValorVariavel(escopo.estrutura.campos, campo),
                                        escopo.estrutura.camposFiltroPesquisa[campo]
                                    );
                                } else campoEmCampos = APIServ.buscarValorVariavel(escopo.estrutura.campos, campo);

                                retornoMCFC[campo] =
                                    filtrosPersonalizados[campo] != undefined ? Object.assign(campoEmCampos, filtrosPersonalizados[campo], val) : val;
                            }
                        } else {
                            //console.log(escopo.estrutura.camposFiltroPesquisa);
                        }
                    });

                    //var retornoMCFC = Object.assign({}, filtrosPersonalizados, retornoMCFC);
                    return retornoMCFC;
                };

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
                };

                var camposPes = escopo.estrutura.camposFiltroPesquisa != undefined ? Object.assign({}, escopo.estrutura.camposFiltroPesquisa) : {};

                var incluirCamposNoFiltro = escopo.estrutura.camposOcultarFiltroPesquisa == undefined || escopo.estrutura.camposOcultarFiltroPesquisa != "*";
                var camposMontagemFiltro = incluirCamposNoFiltro ? Object.assign({}, Object.assign({}, escopo.estrutura.campos)) : {};
                var campoEnviarMontarfiltro = MergeRecursive(camposPes, camposMontagemFiltro);

                escopo.camposFiltroPesquisa = _montarCamposFiltroConsulta(campoEnviarMontarfiltro);

                escopo.campo_chave = retorno.campo_chave;
                var estrutura = retorno;
                escopo.operadoresConsulta = operadoresConsulta;
                escopo.filtros = [];
                escopo.ordemFiltro = "";
                //escopo.itensPagina = "25";
                escopo.opcaoSelecionarTodosItensConsulta =
                    escopo.estrutura.opcaoSelecionarTodosItensConsulta != undefined && escopo.estrutura.opcaoSelecionarTodosItensConsulta;
                escopo.ocultarItensPagina = escopo.estrutura.itensPagina != undefined && escopo.estrutura.itensPagina == -1;
                escopo.itensPagina = escopo.estrutura.itensPagina != undefined ? escopo.estrutura.itensPagina : "50";

                //Vendo se ha a subAcao se sim ponho ela como tela, mais usado no caso de popup
                escopo.tela = escopo.tela != undefined ? escopo.tela : subacao != undefined && subacao != "" ? subacao : "consulta";

                $scope[retorno.raizModelo] = {};

                var usarTimerConsulta = estrutura.usarTimerConsulta != undefined && estrutura.usarTimerConsulta;
                var usarDataAlteracaoAoFiltrar = estrutura.usarDataAlteracaoAoFiltrar != undefined && estrutura.usarDataAlteracaoAoFiltrar;

                //Rotina para por o atalho em Incluir
                window.onkeydown = function (ev) {
                    var e = ev || window.event,
                        key = e.keyCode;

                    if (key == 107) {
                        if (escopo.tela != "cadastro") {
                            escopo.mudaTela("cadastro");
                            escopo.$apply();
                        }
                        e.preventDefault();
                    }
                };

                escopo.abrirVisualizacao = (arquivo, largura, altura) => {
                    var retorno = [];
                    var temp = window.location.href;
                    var raiz = temp.split("?")[0];
                    window.open(raiz + arquivo, "popup", "width=" + largura + ",height=" + largura);
                };

                escopo.alterarFiltroResultado = function (filtro) {
                    $parse("filtroResultado").assign($scope, filtro);
                };

                escopo.limparCampo = (e) => {
                    var input = $(event.target).closest("monta-html").find(":input");
                    var campo = input.attr("campo");
                    var modelo = input.attr("ng-model");
                    //console.log(modelo);
                    var modeloChave = escopo.estrutura.raizModelo + '["' + input.attr("modelo-chave") + '"]';

                    var indice = input.attr("indice");
                    var indiceSuperior = input.attr("indice-superior");

                    var campoEstrutura = APIServ.buscarValorVariavel(escopo.estrutura.campos, campo);

                    var desabilitado = input.attr("disabled") == "disabled";

                    const limpar = () => {
                        if (indice != undefined) {
                            modelo = modelo.replace("[$index]", `[${indice}]`);
                            modeloChave = modeloChave.replace("[$index]", `[${indice}]`);
                        }

                        if (indiceSuperior != undefined) {
                            modelo = modelo.replace("[$parent.$index]", `[${indiceSuperior}]`);
                            modeloChave = modeloChave.replace("[$parent.$index]", `[${indiceSuperior}]`);
                        }

                        $parse(modelo).assign($scope, "");

                        //console.log(modeloChave);
                        if (modeloChave != undefined) {
                            $parse(modeloChave).assign($scope, "");
                        }

                        if (desabilitado) {
                            input.attr("disabled", false);
                            //console.log(escopo.temporada);
                        }
                    };

                    if (campoEstrutura.autoCompleta != undefined) {
                        if (campoEstrutura.autoCompleta.confirmarLimpar) {
                            const textoExibir =
                                campoEstrutura.autoCompleta.confirmarLimparTexto != undefined ? campoEstrutura.autoCompleta.confirmarLimparTexto : "Confirmar";
                            APIServ.dialogoSimples(textoExibir, "", "Confirmar", "Cancelar", limpar);
                        } else limpar();
                    }

                    input.focus();
                };

                escopo.limparCampoConsulta = function (event) {
                    console.log(event);
                    
                    var input = $(event.target).closest("monta-html").find(":input");
                    var campo = input.attr("campo");
                    var modelo = input.attr("ng-model");
                    var modeloChave = input.attr("modelo-chave");

                    var indice = input.attr("indice");
                    var indiceSuperior = input.attr("indice-superior");

                    if (indice != undefined) {
                        modelo = modelo.replace("[$index]", `[${indice}]`);
                        modeloChave = modeloChave.replace("[$index]", `[${indice}]`);
                    }

                    if (indiceSuperior != undefined) {
                        modelo = modelo.replace("[$parent.$index]", `[${indiceSuperior}]`);
                        modeloChave = modeloChave.replace("[$parent.$index]", `[${indiceSuperior}]`);
                    }

                    $parse(modelo).assign($scope, "");

                    if (modeloChave != undefined) {
                        $parse(modeloChave).assign($scope, "");
                    }
                    input.focus();
                };

                $scope[estrutura.raizModelo] = EGFuncoes.novaVariavelRaizModelo(escopo.estrutura);

                escopo.adicionarItemRepeticao = function (nomeBloco, obj, valor) {
                    var objEnviar = obj != undefined ? obj : this;
                    return EGFuncoes.adicionarItemRepeticao($scope, nomeBloco, objEnviar, valor);
                };

                escopo.adicionarTodosItensRepeticao = function (nomeBloco) {
                    var dadosBloco = APIServ.buscarValorVariavel(escopo.estrutura.campos, nomeBloco);
                    var autoCompleta = APIServ.buscarValorVariavel(dadosBloco, "autoCompleta");
                    var parametros = {
                        tabela: autoCompleta.tabela,
                    };
                };

                if (escopo.removerItemRepeticao == undefined) {
                    escopo.removerItemRepeticao = function (nomeBloco) {
                        return EGFuncoes.removerItemRepeticao($scope, nomeBloco);
                    };
                }

                escopo.trocarPosicao = (idElemento) => {
                    var objeto = angular.element("#" + idElemento);
                    var posicaoAtual = Number(objeto.attr("indice")) + 1;
                    var posicaoNova = objeto.val().split(":")[1];

                    var indiceAtual = objeto.attr("indice");
                    var indiceNovo = parseInt(posicaoNova) - 1;

                    var nomeVariavelRepeticao = objeto.attr("item-repetir");
                    var variavelRepeticao = eval("escopo." + objeto.attr("item-repetir"));

                    var valorAtual = variavelRepeticao[indiceAtual];
                    valorAtual["posicao"] = parseInt(posicaoNova);
                    var valorNovo = variavelRepeticao[indiceNovo];
                    valorNovo["posicao"] = parseInt(posicaoAtual);
                    variavelRepeticao[indiceAtual] = valorNovo;
                    variavelRepeticao[indiceNovo] = valorAtual;
                };

                escopo.mudaTela = function (tela) {
                    if (angular.element("#popUp").val() == "true") {
                        window.close();
                    }

                    escopo.tela = tela;
                    $scope[estrutura.raizModelo] = EGFuncoes.novaVariavelRaizModelo(escopo.estrutura);

                    if (tela == "cadastro") {
                        if (escopo.aoCarregar != undefined) {
                            escopo.aoCarregar();
                        }
                        if (usarTimerConsulta) {
                            $rootScope.pausarTimer();
                        }
                        escopo.desabilitarSalvar = false;
                    } else if (tela == "consulta" && usarTimerConsulta) {
                        $rS.reiniciarTimer();
                    }

                    if ((tela == "cadastro" || tela == "consulta") && escopo.carregarTinyMCE != undefined && escopo.estrutura.usarTinyMCE == true) {
                        escopo.carregarTinyMCE();
                    }
                };

                if ((escopo.tela == undefined && retorno.tipoEstrutura == "cadastroDireto") || retorno.tipoEstrutura == "cadastroUnico") {
                    escopo.mudaTela("cadastro");
                } else if (escopo.tela == undefined && retorno.tipoEstrutura == "consulta") {
                    escopo.mudaTela("consulta");
                }

                escopo.alterarExibicaoConsulta = () => {
                    console.log("alterarExibicaoConsulta");

                    escopo.exibirConsulta = !escopo.exibirConsulta;
                    if (escopo.exibirConsulta) {
                        if (escopo.filtros.length == 0) {
                            escopo.adicionarFiltro();
                        }
                        // $rootScope.pausarTimer();
                    } else {
                        // $rootScope.iniciarTimer();
                    }
                };

                if (EGFuncoes.temConsulta(retorno)) {                                        
                    escopo.adicionarFiltro = function () {
                        escopo.filtros.push({
                            texto: "",
                            campo: "",
                            operador: "like",
                            valor: "",
                        });
                    };

                    escopo.adicionarFiltro();

                    escopo.ordemFiltro = escopo.estrutura.campoOrdemPadraoFiltro != undefined ? escopo.estrutura.campoOrdemPadraoFiltro : "";
                    escopo.sentidoFiltro = escopo.estrutura.sentidoOrdemPadraoFiltro ? escopo.estrutura.sentidoOrdemPadraoFiltro : "";
                    //  escopo.limiteFiltro =

                    escopo.manipularFiltro = function (key, filtro) {
                        escopo.filtros[key]["valor"] = "";
                    };

                    escopo.removerFiltro = function (chave) {
                        var novoFiltro = [];
                        angular.forEach(escopo.filtros, function (val, key) {
                            if (key != chave) {
                                novoFiltro.push(escopo.filtros[key]);
                            }
                        });
                        escopo.filtros = novoFiltro;
                    };

                    escopo.limparFiltros = function () {
                        escopo.manipularFiltroLocal(escopo.acao, "limpar");

                        escopo.filtros = [];
                        escopo.adicionarFiltro();
                        if (escopo.estrutura.filtrosPadrao != undefined) {
                            for (var x in escopo.estrutura.filtrosPadrao) {
                                var obrigatorio =
                                    escopo.estrutura.filtrosPadrao[x]["obrigatorio"] != undefined && escopo.estrutura.filtrosPadrao[x]["obrigatorio"];
                                //console.log(obrigatorio);

                                if (obrigatorio) {
                                    var novoFiltro = {
                                        campo: x,
                                        operador: escopo.estrutura.filtrosPadrao[x]["operador"],
                                        valor: escopo.estrutura.filtrosPadrao[x]["valor"],
                                        exibir: escopo.estrutura.filtrosPadrao[x]["exibir"] == undefined || escopo.estrutura.filtrosPadrao[x]["exibir"],
                                    };
                                    escopo.filtros.push(novoFiltro);
                                }
                            }
                        }
                        //console.log(escopo.filtros);
                    };

                    escopo.limparFiltroResultado = (filtroResultado) => {
                        $("#filtro_resultado").val("");
                        $parse("filtroResultado").assign($scope, "");
                    };

                    escopo.manipularFiltroLocal = function (tela, acao = "buscar", filtros) {
                        var filtrosLocal = APIServ.buscaDadosLocais("filtros") || {};

                        if (acao == "buscar") {
                            return filtrosLocal[tela] || [];
                        } else if (acao == "salvar") {
                            filtrosLocal[tela] = filtros;
                            APIServ.salvaDadosLocais("filtros", filtrosLocal);
                        } else if (acao == "limpar") {
                            filtrosLocal[tela] = [];
                            APIServ.salvaDadosLocais("filtros", filtrosLocal);
                        }
                    };


                    
                    const filtrosLocal = escopo.manipularFiltroLocal(escopo.acao, "buscar");
                    

                    if (filtrosLocal.length > 0) {
                        escopo.filtros = filtrosLocal;
                    } else
                    if (estrutura.filtrosPadrao) {
                        //escopo.filtros = [];
                        var tirarPrimeiroFiltro = false;
                        angular.forEach(estrutura.filtrosPadrao, function (val, key) {
                            var incluirFiltroPadrao = true;
                            angular.forEach(escopo.filtros, function (valF, keyF) {
                                incluirFiltroPadrao = valF.campo != key || valF.operador != val.operador || valF.valor != val.valor ? true : false;
                            });
                            if (incluirFiltroPadrao) {
                                if (val.tipo == "intervaloDatas") {
                                    //Depois tenho que inserir as opcoes primeiro e ultimo dia do mes
                                    val.di = val.di == "dataAtual" ? APIAjuFor.dataAtual() : undefined;
                                    val.df = val.df == "dataAtual" ? APIAjuFor.dataAtual() : undefined;
                                }

                                //Vendo se o filtro e visivel, se sim, tiro o primeiro filtro que e em branco, se nao deixo ele
                                if (val.exibir) {
                                    tirarPrimeiroFiltro = true;
                                }

                                //console.log(key);
                                escopo.filtros.push({
                                    campo: key,
                                    operador: val.operador,
                                    valor: val.valor == "data" ? APIAjuFor.dataAtual() : val.valor,
                                    exibir: val.exibir != undefined ? val.exibir : false,
                                    tipo: val.tipo,
                                    texto: val.texto,
                                    di: val.di,
                                    df: val.df,
                                });
                            }
                        });
                        if (tirarPrimeiroFiltro) {
                            escopo.filtros.splice(0, 1);
                        }
                    }

                    escopo.converterFiltroParaEnvio = function () {
                        var retorno = [];

                        if (escopo.estrutura.camposFiltroPersonalizado != undefined) {
                            var camposPer = Object.assign({}, escopo.estrutura.camposFiltroPersonalizado);
                            for (i in camposPer) {
                                var campoPerFil = camposPer[i]["campoFiltro"] != undefined ? camposPer[i]["campoFiltro"] : i;
                                var valor = eval("escopo." + escopo.estrutura.raizModelo + "." + campoPerFil);
                                if (valor != undefined) {
                                    retorno.push({
                                        campo: campoPerFil,
                                        operador: camposPer[i]["operador"] != undefined ? camposPer[i]["operador"] : "like",
                                        valor: valor,
                                    });
                                }
                            }
                            //console.log(eval('escopo.' + escopo.estrutura.raizModelo + '.codigo_tipo_passaro'));
                        }

                        angular.forEach(escopo.filtros, function (filtro, key) {
                            if (filtro.tipo != undefined && filtro.tipo == "intervaloDatas") {
                                retorno.push({
                                    campo: filtro.campo,
                                    operador: "between",
                                    valor: filtro.di + "__" + filtro.df,
                                    texto: filtro.texto != undefined ? filtro.texto : filtro.campo,
                                    tipo: filtro.tipo != undefined ? filtro.tipo : "varchar",
                                });
                            } else {
                                //Trocando o campo chave do filtro para o valor do objChave do auto completa caso exista
                                if (
                                    escopo.estrutura.camposFiltroPesquisa != undefined &&
                                    escopo.estrutura.camposFiltroPesquisa[filtro["campo"]] != undefined &&
                                    escopo.estrutura.camposFiltroPesquisa[filtro["campo"]]["autoCompleta"] != undefined &&
                                    escopo.estrutura.camposFiltroPesquisa[filtro["campo"]]["autoCompleta"]["objChave"] != undefined &&
                                    filtro["campo_chave"] != undefined
                                )
                                    filtro["campo_chave"] = escopo.estrutura.camposFiltroPesquisa[filtro["campo"]]["autoCompleta"]["objChave"];

                                filtro["valor"] = filtro["valor"] != "" && filtro["valor"] != undefined ? filtro["valor"].toString().split("--")[0].trim() : "";
                                retorno.push(filtro);
                            }
                        });
                        return retorno;
                    };

                    escopo.atualizarCampoFiltro = (campo, valor) => {
                        $parse(campo).assign($scope, valor);
                        var campoOrdenar = escopo.ordemFiltro;

                        function crescente(varA, varB) {
                            return varA[campoOrdenar] > varB[campoOrdenar] ? 1 : varB[campoOrdenar] > varA[campoOrdenar] ? -1 : 0;
                        }
                        function decrescente(varA, varB) {
                            return varA[campoOrdenar] < varB[campoOrdenar] ? 1 : varB[campoOrdenar] < varA[campoOrdenar] ? -1 : 0;
                        }

                        if (escopo.sentidoFiltro == "") {
                            escopo.listaConsulta.sort(crescente);
                        } else {
                            escopo.listaConsulta.sort(decrescente);
                        }
                    };

                    //Vendo se a funcao de filtrar e personalizada e tem outro nome
                    if (escopo.estrutura.funcaoFiltrar != undefined) {
                        escopo.filtrar = eval("escopo." + escopo.estrutura.funcaoFiltrar);
                    }
                    
                    if (escopo.filtrar == undefined) {

                        escopo.filtrar = function (pagina = 1, origem = "filtro") {
                            //Testando por limite no filtro inicial, para buscar apenas os últimos 500 registros
                            var limite = 0; // pagina == 0 ? 500 : 0;

                            if (escopo.antesDeFiltrar != undefined) {
                                escopo.antesDeFiltrar();
                            }

                            if (escopo.estrutura.filtroObrigatorio != undefined && escopo.estrutura.filtroObrigatorio) {
                                var filtroVer = escopo.filtros[0];
                                var temValor =
                                    filtroVer.valor != "" ||
                                    (filtroVer.di != undefined && filtroVer.di != "") ||
                                    (filtroVer.df != undefined && filtroVer.df != "");
                                if (filtroVer.campo == "" || !temValor) {
                                    APIServ.mensagemSimples("Defina ao Menos um Filtro");
                                    return false;
                                }
                            }

                            //Esta funcao foi criada, pois pode haver casos de ter intervalo de datas no filtro, ai tenho que divilo em dois.

                            escopo.manipularFiltroLocal(escopo.acao, "salvar", escopo.filtros);
                            escopo.filtroEnviar = escopo.converterFiltroParaEnvio();

                            //if (estrutura.mostrarAguardeAoFiltrar == undefined || estrutura.mostrarAguardeAoFiltrar) {
                            $rS.carregando = true;
                            //}
                            var resumo = [];
                            if (estrutura.resumoConsulta != undefined) {
                                angular.forEach(estrutura.resumoConsulta, function (val, key) {
                                    resumo.push({
                                        campo: key,
                                        operacao: val.operacao,
                                    });
                                });
                            }

                            var addFiltro = function (campo, operador, valor, exibir) {
                                escopo.filtroEnviar.push({
                                    campo: campo,
                                    operador: operador,
                                    valor: valor,
                                    exibir: exibir,
                                });
                            };

                            if (estrutura.filtrosPorUsuario != undefined) {
                                var usuario = APIServ.buscaDadosLocais("usuario");
                                if (usuario.chave_usuario > 0) {
                                    angular.forEach(estrutura.filtrosPorUsuario, function (valores, campo) {
                                        var valor = usuario[valores.valor] != undefined ? usuario[valores.valor] : usuario[campo];
                                        if (valor != null && APIServ.operacoesMatematicas(valores.operador, usuario[campo], valor)) {
                                            addFiltro(campo, "=", usuario[campo], false);
                                        }
                                    });
                                }
                            }

                            var campos = [];
                            angular.forEach(escopo.estrutura.listaConsulta, function (itemLC, keyLC) {
                                if (angular.isObject(itemLC)) {
                                    campos.push(keyLC);
                                } else {
                                    campos.push(itemLC);
                                }
                            });

                            var ordemCampoTela = angular.element("#ordemFiltro").val();

                            var ordemFiltro =
                                ordemCampoTela != undefined && ordemCampoTela != "" > 0
                                    ? angular.element("#ordemFiltro").val().split(":")[1]
                                    : escopo.ordemFiltro != ""
                                    ? escopo.ordemFiltro
                                    : "";

                            var sentidoFiltro =
                                angular.element("#sentidoFiltro").length > 0
                                    ? angular.element("#sentidoFiltro").val()
                                    : escopo.sentidoFiltro != ""
                                    ? escopo.sentidoFiltro
                                    : "";

                            if (usarDataAlteracaoAoFiltrar && escopo.dataUltimaConsulta != undefined && origem == "timer") {
                                var data_alteracao = APIAjuFor.dateParaTimestamp(escopo.dataUltimaConsulta);
                                addFiltro("data_alteracao", ">=", data_alteracao, false);
                            }

                            var filtros = {
                                tabela: escopo.estrutura.tabela,
                                tabelaConsulta: escopo.estrutura.tabelaConsulta != undefined ? escopo.estrutura.tabelaConsulta : escopo.estrutura.tabela,
                                tela: acao,
                                campo_chave: escopo.estrutura.campo_chave,
                                pagina: pagina,
                                campos: campos, // Object.keys(escopo.estrutura.listaConsulta),
                                filtros: escopo.filtroEnviar,
                                ordemFiltro: ordemFiltro != "" ? ordemFiltro + " " + sentidoFiltro : "",
                                itensPagina: "",
                                resumoConsulta: resumo,
                                dispositivoMovel: escopo.dispositivoMovel,
                                tabelasRelacionadas: escopo.estrutura.tabelasRelacionadas,
                                todosItensSelecionados: escopo.todosItensSelecionados != undefined ? escopo.todosItensSelecionados : false,
                                tirarCampoChaveConsulta: escopo.estrutura.tirarCampoChaveConsulta,
                                acaoAposFiltrar: escopo.estrutura.acaoAposFiltrar != undefined ? escopo.estrutura.acaoAposFiltrar : undefined,
                                limite: limite,
                            };

                            //console.log(filtros);

                            //Fazendo comparacao se e pagina sem consulta, mostrando resultados direto ao abrir
                            if (pagina > 0) {
                                filtros.ordemFiltro =
                                    filtros.ordemFiltro == "" && angular.element("#ordemFiltro").length > 0
                                        ? angular.element("#ordemFiltro").val().split(":")[1]
                                        : filtros.ordemFiltro;

                                // Para lazy loading, usar um número fixo de itens por página
                                if (origem === "lazyLoad") {
                                    filtros.itensPagina = 20; // Número padrão para lazy loading
                                } else {
                                    filtros.itensPagina = angular.element("#itensPagina") != undefined ? angular.element("#itensPagina").val() : 0;
                                }
                            }

                            var fd = new FormData();
                            fd.append("parametros", angular.toJson(filtros));

                            var parametrosEnviarFiltro = escopo.tipoConsulta == "post" ? fd : filtros;

                            // if (usarTimerConsulta && escopo.listaConsulta == undefined) {
                            //     setTimeout(() => {
                            //         $rootScope.pausarTimer();
                            //     }, 300);
                            // }

                            //APIServ.executaFuncaoClasse('classeGeral', 'consulta', filtros)
                            APIServ.executaFuncaoClasse("classeGeral", "consulta", parametrosEnviarFiltro, escopo.tipoConsulta)
                                .success(function (data) {
                                    //console.log(data); $rootScope.carregando = false;/*
                                    //console.log(data);
                                    if (usarTimerConsulta) {
                                        $rootScope.reiniciarTimer();
                                    }

                                    if (usarDataAlteracaoAoFiltrar) {
                                        escopo.dataUltimaConsulta = new Date();
                                        //console.log(escopo.dataUltimaConsulta);
                                    }

                                    $rS.carregando = false;
                                    if (typeof data === "object") {
                                        escopo.todosItensSelecionados = false;
                                        angular.element("#todosItensSelecionados").attr("checked", false);

                                        escopo.pagina = pagina;

                                        if (
                                            usarDataAlteracaoAoFiltrar &&
                                            escopo.dataUltimaConsulta != undefined &&
                                            origem == "timer" &&
                                            escopo.listaConsulta != undefined
                                        ) {
                                            var novaLista = Object.assign([], data.lista);
                                            var listaAtual = Object.assign([], escopo.listaConsulta);
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
                                                $parse("listaConsulta").assign($scope, novaListaDefinitiva);
                                            }
                                        } else {
                                            // Implementação do Lazy Loading
                                            if (origem === "lazyLoad") {
                                                // Para lazy loading, adicionar novos itens à lista existente
                                                if (escopo.listaConsulta === undefined) {
                                                    escopo.listaConsulta = [];
                                                }

                                                if (data.lista && data.lista.length > 0) {
                                                    // Adicionar novos itens evitando duplicatas
                                                    var itensExistentes = escopo.listaConsulta.map((item) => item[estrutura.campo_chave]);
                                                    var novosItens = data.lista.filter((item) => !itensExistentes.includes(item[estrutura.campo_chave]));

                                                    escopo.listaConsulta = escopo.listaConsulta.concat(novosItens);

                                                    // Atualizar lista visível no lazy loading
                                                    if (escopo.listaConsultaVisivel === undefined) {
                                                        escopo.listaConsultaVisivel = [];
                                                    }
                                                    escopo.listaConsultaVisivel = escopo.listaConsultaVisivel.concat(novosItens);
                                                    escopo.temMaisItens = data.lista.length >= (data.paginacao ? data.paginacao.itensPagina : 20);
                                                    escopo.carregandoMaisItens = false;
                                                } else {
                                                    escopo.temMaisItens = false;
                                                    escopo.carregandoMaisItens = false;
                                                }
                                            } else {
                                                // Carregamento normal - substituir lista completa
                                                $parse("listaConsulta").assign($scope, data.lista);

                                                // Inicializar variáveis de lazy loading para filtro normal
                                                escopo.listaConsultaVisivel = undefined; // Será inicializada pela diretiva
                                                escopo.carregandoMaisItens = false;
                                                escopo.temMaisItens = true;
                                                escopo.ultimaPaginaCarregada = 0;
                                            }
                                        }

                                        if (data.resumoConsulta != undefined) {
                                            $parse("resumoConsulta").assign($scope, data.resumoConsulta);
                                        }

                                        if (data.resumoConsultaPersonalizado != undefined) {
                                            $parse("resumoConsultaPersonalizado").assign($scope, data.resumoConsultaPersonalizado);
                                        }

                                        if (escopo.aposFiltrar != undefined) {
                                            escopo.aposFiltrar();
                                        }
                                    } else {
                                        APIServ.mensagemSimples("Informação", "Erro ao Filtrar");
                                    }

                                    //*/
                                })
                                .error(function (a, b, c) {
                                    console.log(a);
                                    console.log(b);
                                    console.log(c);
                                    $rS.carregando = false;
                                    APIServ.mensagemSimples("Informação", "Erro ao Filtrar");
                                });
                            //*/
                        };
                    }else{

                    }

                    if ((escopo.estrutura.filtrarAoIniciar == undefined || escopo.estrutura.filtrarAoIniciar == true) && escopo.tela == "consulta") {
                        setTimeout(function () {
                            escopo.filtrar(0);
                        }, 100);
                    }

                    if (escopo.selecionarItemConsulta == undefined) {
                        escopo.selecionarItemConsulta = function (key, item) {
                            var parametros = {
                                tela: acao,
                                key: key,
                                campo_chave: escopo.estrutura.campo_chave,
                                chave: item[escopo.estrutura.campo_chave],
                                selecionado: item.selecionado != undefined && item.selecionado,
                            };
                            APIServ.executaFuncaoClasse("classeGeral", "selecionarItemConsulta", parametros).success(function (retorno) {});
                        };
                    }

                    escopo.itensPaginaPaginacao = () => {
                        //console.log(app.current_page);
                    };

                    if (escopo.selecionarTodosItensConsulta == undefined) {
                        escopo.selecionarTodosItensConsulta = function () {
                            var teste = escopo.itensPaginaPaginacao();
                            //console.log(teste);

                            escopo.todosItensSelecionados = escopo.todosItensSelecionados == "false" || !escopo.todosItensSelecionados;
                            if (escopo.listaConsulta != undefined && Object.keys(escopo.listaConsulta).length > 0) {
                                var parametros = {
                                    tela: acao,
                                    selecionado: escopo.todosItensSelecionados,
                                };
                                APIServ.executaFuncaoClasse("classeGeral", "selecionarTodosItensConsulta", parametros).success(function () {
                                    angular.forEach(escopo.listaConsulta, function (item) {
                                        item.selecionado = escopo.todosItensSelecionados;
                                    });
                                });
                            }
                        };
                    }

                    if (escopo.detalhar == undefined) {
                        escopo.detalhar = function (item) {
                            var retorno = [];
                            var keyRetorno = 0;
                            //Monto o filtro com a chave do item

                            var filtros = {
                                tabela: escopo.estrutura.tabela,
                                campo_chave: escopo.estrutura.campo_chave,
                                chave: item[escopo.estrutura.campo_chave],
                            };

                            //Vendo se ha tabelas relac
                            if (escopo.estrutura.tabelasRelacionadas != undefined) {
                                filtros["tabelasRelacionadas"] = escopo.estrutura.tabelasRelacionadas;
                            }

                            //Vendo se o detalhe do item ja foi carregado
                            if (item["detalhes"] == undefined) {
                                APIServ.executaFuncaoClasse("classeGeral", "detalhar", filtros).success(function (data) {                                    
                                    item["arquivosAnexados"] = data.arquivosAnexados;
                                    item["exibirDetalhes"] = true;
                                    item["detalhes"] = {};
                                    item["detalhes"] = data;
                                    if (escopo.aoDetalhar != undefined) {
                                        escopo.aoDetalhar(item);
                                    }
                                });
                            } else {
                                item["exibirDetalhes"] = !item["exibirDetalhes"];
                            }
                        };
                    }
                }

                if (EGFuncoes.temCadastro(retorno)) {
                    if (retorno.variavelValidarAoSubmeter != undefined) {
                        $scope[retorno.variavelValidarAoSubmeter] = false;
                    }

                    if (escopo.salvar == undefined) {
                        escopo.salvar = function (dadosTela, nomeForm) {                            
                            
                            $invalidos = document.getElementsByClassName("erro").length > 0;
                            if (escopo.formularioInvalido || $invalidos) {
                                return true;
                            }

                            escopo.desabilitarSalvar = true;

                            if (escopo.antesSalvar != undefined) {
                                escopo.antesSalvar();
                            }

                            var indice = dadosTela["indiceVariavel"];
                            var dados = APIServ.transporVariavel($scope[estrutura.raizModelo]);

                            $rootScope.carregando = true;
                            var fd = escopo.fd;

                            var textoSalvou =
                                escopo.estrutura.textoConfirmaSalvamento != undefined
                                    ? escopo.estrutura.textoConfirmaSalvamento
                                    : "Dados Inseridos com Sucesso!";

                            fd.append("dados", angular.toJson(dados));

                            //Definindo as configuracoes
                            var configuracoes = {
                                tabela: escopo.estrutura.tabela,
                                campo_chave: escopo.estrutura.campoChave != undefined ? escopo.estrutura.campoChave : escopo.estrutura.campo_chave,
                                classe: escopo.estrutura.classe != undefined ? escopo.estrutura.classe : escopo.estrutura.tabela,
                                funcaoEstrutura: escopo.funcaoEstrutura != undefined ? escopo.funcaoEstrutura : undefined,
                                funcaoManipula: escopo.estrutura.funcaoManipula,
                                tabelasRelacionadas: escopo.estrutura.tabelasRelacionadas,
                                camposSeVazios: [],
                            };

                            //console.log(configuracoes);

                            var varrerCamposVerificarAnexos = (campos) => {
                                angular.forEach(campos, function (val, key) {
                                    if (key.substr(0, 5) == "bloco") {
                                        varrerCamposVerificarAnexos(campos[key]["campos"]);
                                    } else if (val.tipo == "arquivo" || val.tipo == "imagem") {
                                        configuracoes["arquivosAnexar"] = configuracoes["arquivosAnexar"] != undefined ? configuracoes["arquivosAnexar"] : [];
                                        var at = val.atributos_arquivo != undefined ? val.atributos_arquivo : [];
                                        fd.append(key, dadosTela[key]);

                                        configuracoes["arquivosAnexar"].push({
                                            campo: key,
                                            tipo_arquivo: at.tipo_arquivo != undefined ? at.tipo_arquivo : "",
                                            largura: at.largura != undefined ? at.largura : "600",
                                            altura: at.altura != undefined ? at.altura : "600",
                                            destino: at.caminhoBase != undefined ? at.caminhoBase : "",
                                            salvarEmDiretorio: at.salvarEmDiretorio != undefined ? at.salvarEmDiretorio : true,
                                            nomeAnexo: at.nomeAnexo != undefined ? at.nomeAnexo : "",
                                        });
                                    } else if (val.seVazio != undefined) {
                                        //Deixar para uma proxima oportunidade
                                    }
                                });
                            };

                            varrerCamposVerificarAnexos(escopo.estrutura.campos);

                            if (escopo.estrutura.relacionamentosVerificar != undefined) {
                                configuracoes["relacionamentosVerificar"] = escopo.estrutura.relacionamentosVerificar;
                            }

                            var parametrosEnviar;
                            if (escopo.tipoSalvar == "post") {
                                fd.append("configuracoes", angular.toJson(configuracoes));

                                angular.forEach($rootScope.$files, function (value, key) {
                                    escopo.fd.append(key, value);
                                });
                                parametrosEnviar = fd;
                            } else if (escopo.tipoSalvar == "get") {
                                parametrosEnviar = {
                                    dados: dadosTela,
                                    configuracoes: configuracoes,
                                };
                            }

                            // APIServ.executaFuncaoClasse('classeGeral', 'manipula', {dados:dadosTela, configuracoes: configuracoes})
                            // $http.post('api/manipulaTabela', fd, {
                            //     transformRequest: angular.identity,
                            //     headers: {
                            //         'Content-Type': undefined
                            //     }
                            // })
                            APIServ.executaFuncaoClasse("classeGeral", "manipula", parametrosEnviar, escopo.tipoSalvar)
                                .success(function (retorno) {
                                     //console.log(retorno); escopo.desabilitarSalvar = false; $rootScope.carregando = false; /*
                                    if (escopo.tipoSalvar == "get") {
                                        //console.log(retorno);
                                        return false;
                                    }

                                    escopo.fd = new FormData();
                                    $rootScope.carregando = false;
                                    escopo.desabilitarSalvar = false;

                                    if (retorno.erro != undefined) {
                                        APIServ.mensagemSimples(retorno.erro);
                                    } else if (retorno.camposDuplicados != undefined) {
                                        APIServ.mensagemSimples("Informação!", "Há Campos Que já existem na base de dados.");
                                    } else if (retorno.camposObrigatoriosVazios != undefined) {
                                        APIServ.mensagemSimples("Informação!", "Há Campos Obrigatórios Não Preenchidos");
                                    } else if (typeof retorno === "string") {
                                        APIServ.mensagemSimples("Informação", "Erro ao Salvar, tente novamente!");
                                    } else {
                                        //Cadastrado com sucesso, tratando acoes

                                        var cadastroDiretoUrl = parametrosUrl[2] != undefined && parametrosUrl[2] == "cadastro" ? true : false;
                                        var funcao = function () {
                                            if (EGFuncoes.temConsulta(escopo.estrutura) && !cadastroDiretoUrl) {
                                                escopo.tela = "consulta";

                                                setTimeout(function () {
                                                    //angular.element('#filtrar').trigger('click');
                                                    if (escopo.estrutura.filtrarAoIniciar != undefined && escopo.estrutura.filtrarAoIniciar) {
                                                        escopo.filtrar();
                                                    }
                                                }, 100);
                                            }

                                            // CORREÇÃO: Verificar se estamos em contexto modal antes de recarregar
                                            if (
                                                (escopo.estrutura.recarregarAposSalvar != undefined && escopo.estrutura.recarregarAposSalvar) ||
                                                cadastroDiretoUrl
                                            ) {
                                                // Se estiver em modal, não recarregar a página - apenas fechar o modal
                                                if (escopo.isModal || (escopo.localExibicao && escopo.localExibicao === "modal")) {
                                                    console.log("🎭 [estruturaGerencia] Contexto modal detectado - evitando window.location.reload()");

                                                    // Fechar apenas o modal que contém este formulário
                                                    if (PopUpModal && typeof PopUpModal.identificarEFecharModalAtual === 'function') {
                                                        PopUpModal.identificarEFecharModalAtual($element[0]);
                                                    }

                                                    // Resetar modelo se necessário
                                                    if (escopo.estrutura.raizModelo) {
                                                        $scope[escopo.estrutura.raizModelo] = EGFuncoes.novaVariavelRaizModelo(escopo.estrutura);
                                                    }
                                                } else {
                                                    // Comportamento normal fora do modal
                                                    window.location.reload();
                                                }
                                            } else {
                                                $scope[escopo.estrutura.raizModelo] = EGFuncoes.novaVariavelRaizModelo(escopo.estrutura);
                                            }
                                            if (angular.element("#popUp").val() == "true") {
                                                window.close();
                                            }
                                            if (escopo.estrutura.executarAposSalvar != undefined) {
                                                $scope[escopo.estrutura.executarAposSalvar.funcao](retorno);
                                            } else if (escopo.executarAposSalvar != undefined) {
                                                escopo.executarAposSalvar();
                                            }
                                        };

                                        if (escopo.aoSalvar != undefined) {
                                            escopo.aoSalvar(retorno);
                                        } else if (escopo.estrutura.tipoEstrutura == "cadastroUnico" || escopo.estrutura.tipoEstrutura == 'cadastroDireto') {
                                            var funcaoCadUnico = () => {
                                                // CORREÇÃO: Verificar se estamos em contexto modal antes de recarregar
                                                if (escopo.isModal || (escopo.localExibicao && escopo.localExibicao === "modal")) {
                                                    console.log(
                                                        "🎭 [estruturaGerencia] CadastroUnico - contexto modal detectado - evitando window.location.reload()"
                                                    );

                                                    // Fechar apenas o modal que contém este formulário
                                                    if (PopUpModal && typeof PopUpModal.identificarEFecharModalAtual === 'function') {
                                                        PopUpModal.identificarEFecharModalAtual($element[0]);
                                                    }

                                                    // Resetar modelo se necessário
                                                    if (escopo.estrutura.raizModelo) {
                                                        $scope[escopo.estrutura.raizModelo] = EGFuncoes.novaVariavelRaizModelo(escopo.estrutura);
                                                    }
                                                } else {
                                                    // Comportamento normal fora do modal
                                                    window.location.reload();
                                                }
                                            };

                                            APIServ.mensagemSimples("Confirmação", textoSalvou, funcaoCadUnico);
                                        } else if (
                                            escopo.estrutura.naoMostrarConfirmacaoAoSalvar == undefined ||
                                            escopo.estrutura.naoMostrarConfirmacaoAoSalvar == false
                                        ) {
                                            if (
                                                escopo.estrutura.usarChaveTextoConfirmaSalvamento != undefined &&
                                                escopo.estrutura.usarChaveTextoConfirmaSalvamento
                                            ) {
                                                textoSalvou += " Com código: " + retorno.chave;
                                            }
                                            APIServ.mensagemSimples("Confirmação", textoSalvou, funcao, true);
                                        } else {
                                            funcao();
                                        }
                                    }
                                    //*/
                                })
                                .error(function (a, b, c) {
                                    //console.log(a);
                                    escopo.desabilitarSalvar = false;
                                    $rootScope.carregando = false;
                                    APIServ.mensagemSimples("Informação", "Erro ao Salvar. Tente Novamente!");
                                });
                            //*/
                        };
                    }

                    if (escopo.estrutura.tipoEstrutura == "cadastroUnico") {
                        var filtros = {
                            tabela: escopo.estrutura.tabela,
                            campo_chave: escopo.estrutura.campo_chave,
                            campos: escopo.estrutura.listaConsulta != undefined ? Object.keys(escopo.estrutura.listaConsulta) : "*",
                            chave: 1,
                        };

                        APIServ.executaFuncaoClasse("classeGeral", "buscarParaAlterar", filtros).success(function (data) {
                            $scope[escopo.estrutura.raizModelo] = data;
                        });
                    }

                    if (escopo.alterar == undefined) {
                        escopo.alterar = function (valor) {
                            //console.log(valor);
                            //console.log('alterando');
                            if (usarTimerConsulta) {
                                $rootScope.pausarTimer();
                            }
                            $rS.carregando = true;
                            var indiceVariavel = this.$index;
                            var filtros = {
                                tabela: escopo.estrutura.tabela,
                                tabelaConsulta: escopo.estrutura.tabelaConsulta,
                                campo_chave: escopo.estrutura.campo_chave,
                                chave: valor[escopo.estrutura.campo_chave],
                            };

                            if (escopo.estrutura.tabelasRelacionadas != undefined) {
                                filtros["tabelasRelacionadas"] = escopo.estrutura.tabelasRelacionadas;
                            }

                            if (escopo.estrutura.campoChaveSecundaria != undefined && valor[escopo.estrutura.campoChaveSecundaria] != undefined) {
                                filtros["campoChaveSecundaria"] = escopo.estrutura.campoChaveSecundaria;
                                filtros["valorChaveSecundaria"] = valor[escopo.estrutura.campoChaveSecundaria];
                            }

                            if (escopo.antesDeBuscarParaAlterar != undefined) {
                                escopo.antesDeBuscarParaAlterar(filtros);
                            }

                            var fd = new FormData();
                            fd.append("filtros", JSON.stringify(filtros));                            
                            
                            APIServ.executaFuncaoClasse("classeGeral", "buscarParaAlterar", filtros)
                                .success(function (data) {
                                    
                                    $rS.carregando = false;
                                    if (usarTimerConsulta) {
                                        $rootScope.iniciarTimer();
                                    }

                                    if (data.aviso != undefined) {
                                        APIServ.mensagemSimples("Informação", data.aviso);
                                        return;
                                    } else if (typeof data === "string") {
                                        APIServ.mensagemSimples("Informação", "Erro, Tente Novamente");
                                    } else {
                                        data["indiceVariavel"] = indiceVariavel;
                                        $scope[escopo.estrutura.raizModelo] = data;

                                        escopo.tela = "cadastro";
                                        if (usarTimerConsulta) {
                                            $rootScope.pausarTimer();
                                        }

                                        //escopo.mudaTela('cadastro');
                                        if (
                                            (escopo.tela == "cadastro" || escopo.tela == "consulta") &&
                                            escopo.estrutura.usarTinyMCE == true &&
                                            escopo.carregarTinyMCE != undefined
                                        ) {
                                            //console.log('mudando');
                                            escopo.carregarTinyMCE();
                                        }

                                        if (escopo.estrutura.funcaoAoAlterar != undefined) {
                                            var nomeFuncaoAlterar = eval("escopo." + escopo.estrutura.funcaoAoAlterar);
                                            nomeFuncaoAlterar(data);
                                        } else if (escopo.aoAlterar != undefined) {
                                            escopo.aoAlterar(data);
                                        }
                                    }
                                })
                                .error((a, b, c) => {
                                    //console.log(a);
                                });
                        };
                    }
                }

                //Fazendo esta comparaca para nao sobrescrever a funcao caso seja declarada no controller
                if (escopo.excluir == undefined) {
                    escopo.excluir = function (item) {
                        var parametros = {
                            tabela: escopo.estrutura.tabela,
                            campo_chave: escopo.estrutura.campo_chave,
                            chave: item[escopo.estrutura.campo_chave],
                            refazerConsulta: true,
                        };

                        let novaLista = [];

                        const novaConsulta = function(){
                            $parse('listaConsulta').assign($scope, novaLista);
                            $parse('listaConsultaVisivel').assign($scope, novaLista);
                            escopo.$apply();
                        }      

                        var funcao = function () {
                            $rootScope.carregando = true;                            
                            
                            APIServ.executaFuncaoClasse("classeGeral", "excluir", parametros).success(function (retorno) {
                                console.log(retorno);
                                if (retorno.erro != undefined) {
                                    APIServ.mensagemSimples(retorno.erro);
                                } else if (retorno.chave >= 0) {       
                                    novaLista = retorno.novaConsulta.lista;
                                    APIServ.mensagemSimples("Confirmação", escopo.estrutura.nomeUsual + " Excluído!", novaConsulta);
                                } else if (retorno.chave > 0) {
                                    APIServ.mensagemSimples("Informação", escopo.estrutura.nomeUsual + " Está em Uso e não pode ser Excluído!");
                                }
                                $rootScope.carregando = false;
                            });
                        };
                        APIServ.dialogoSimples("Confirmação", "Excluir " + escopo.estrutura.nomeUsual + "!?", "Sim", "Não", funcao);
                    };
                }

                escopo.mostrarInformacoes = (campo) => {
                    var elemento = $(event.target);
                    var campoTemp = APIServ.buscarValorVariavel(escopo.estrutura.campos, campo);
                    var mensagem = campoTemp.informacoes;
                    var elementoPai = elemento.closest("div.form-group");
                    elementoPai
                        .attr("data-toggle", "popover")
                        .attr("data-content", mensagem)
                        .popover({
                            placement: "bottom",
                        })
                        .popover("show");
                };

                var html = "";
                if (EGFuncoes.temConsulta(retorno)) {
                    html += `<cabecalho-consulta class="cabecalhoConsulta" classe="${classe}"></cabecalho-consulta>`; //montaCabecalhoConsulta(retorno, $scope);
                    if (estrutura.tipoListaConsulta != undefined && estrutura.tipoListaConsulta == "tabela") {
                        escopo.tipoListaConsulta = "tabela";
                            html += '<lista-consulta-tabela class="listaConsulta"></lista-consulta-tabela>'; //  montaListaConsulta(estrutura);
                    } else {
                        escopo.tipoListaConsulta = "lista";
                        html += '<lista-consulta class="listaConsulta"></lista-consulta>'; //  montaListaConsulta(estrutura);
                    }
                }

                //Esta variavel armazenará todas as campos do formulario vazios
                $scope["campo_vazio"] = {};

                if (EGFuncoes.temCadastro(retorno)) {
                    html += `<formulario-cadastro classe="${escopo.classe}"></formulario-cadastro>`; // montaInicioFormCadastro(retorno, raizModelo);
                }

                if (EGFuncoes.temCadastroDireto(retorno) || (escopo.estrutura.telaInicial != undefined && escopo.estrutura.telaInicial == "cadastro")) {
                    escopo.tela = "cadastro";
                }
                if (retorno.tipoEstrutura == "somenteCadastro") {
                    escopo.tela = "cadastro";
                }

                console.log('classe', classe);
                if($rootScope['estruturas'] == undefined) {
                    $rootScope['estruturas'] = {};
                }
                $rootScope['estruturas'][classe] = escopo;
                

                if (retorno.tipoEstrutura != "personalizado") {
                    $element.html(html);
                    $compile($element.contents())($rootScope['estruturas'][classe]);
                }

                if (escopo.aoCarregar != undefined) {
                    escopo.aoCarregar();
                }

                //Fiz esta rotina para ver se poe as mascaras nos campos de pesquisa, quando sao padrao
                if (escopo.tela == "consulta" && estrutura.filtrosPadrao) {
                    setTimeout(function () {
                        angular.forEach(escopo.filtros, function (item, key) {                           
                            if (item.campo !== null && item.campo != undefined && item.campo != "" && estrutura.filtrosPadrao[item["campo"]] != undefined) {
                                angular.element(`#filtros_${key}_campo`).trigger("change");
                                
                                const campoF = item['campo'];
                                const valorFiltroPadrao = estrutura.filtrosPadrao[campoF] != undefined && estrutura.filtrosPadrao[campoF]["valor"] != undefined ? 
                                    estrutura.filtrosPadrao[campoF]["valor"] : "";
                                escopo.filtros[key]["valor"] =valorFiltroPadrao;
                            }
                        });

                        if (escopo.filtros != undefined && escopo.filtros.length > 0 && escopo.filtros[0]["valor"] == "" && escopo.exibirConsulta) {
                            angular.element("#filtros_0_valor").focus();
                        }
                    }, 200);
                }

                if (!escopo.exibirConsulta && document.querySelector("#filtro_resultado") !== null) {
                    setTimeout(() => {
                        document.querySelector("#filtro_resultado").focus();
                    }, 200);
                }
                
                
            };

            var rotaAtual = $route.current;
            var parametrosRota = $routeParams;
    
            if (escopo.estrutura != undefined) {
                montarEstrutura(escopo.estrutura);
            } else if ($element.attr("variavelEstrutura") != undefined) {
                escopo.estrutura = $scope[$element.attr("variavelEstrutura")];
                montarEstrutura(escopo.estrutura);
            } else if (classe != undefined) {
                let parametrosBuscaEstrutura = {
                    classe: classe,
                    parametrosEnviados: $("#parametrosEnviados").val(),
                };

                var funcaoEstrutura;
                // Se estiver em modal, priorizar atributo sobre rota atual
                if (isModal && $attrs.funcaoEstrutura != undefined) {
                    funcaoEstrutura = $attrs.funcaoEstrutura;
                } else if ($route.current && $route.current.funcaoEstrutura != undefined) {
                    funcaoEstrutura = $route.current.funcaoEstrutura;
                } else if ($attrs.funcaoEstrutura != undefined) {
                    funcaoEstrutura = $attrs.funcaoEstrutura;
                }

                if (funcaoEstrutura != undefined) {
                    parametrosBuscaEstrutura["funcaoEstrutura"] = funcaoEstrutura;
                    escopo.funcaoEstrutura = funcaoEstrutura;
                }

                let paramEnviarBuscaEstrutura = parametrosBuscaEstrutura;

                if (escopo.tipoConsulta == "post") {
                    let fdEnviarBuscaEstrutura = new FormData();
                    fdEnviarBuscaEstrutura.append("parametros", JSON.stringify(parametrosBuscaEstrutura));
                    paramEnviarBuscaEstrutura = fdEnviarBuscaEstrutura;
                }

                APIServ.executaFuncaoClasse("classeGeral", "buscarEstrutura", parametrosBuscaEstrutura).success((retorno) => {
                     //console.log(retorno);
                    montarEstrutura(retorno);
                });
            }
        };

        return {
            restrict: "E",
            controller: ["$rootScope", "$scope", "$element", "$attrs", "$route", "$routeParams", "EGFuncoes", "APIAjuFor", "PopUpModal", controller],
        };
    },
]);
