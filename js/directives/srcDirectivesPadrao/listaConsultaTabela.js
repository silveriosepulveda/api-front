directivesPadrao.directive("listaConsultaTabela", [
    "$compile",
    "APIServ",
    "EGFuncoes",
    "APIAjuFor",
    "FuncoesConsulta",
    "$timeout",
    "$q",
    function ($compile, APIServ, EGFuncoes, APIAjuFor, FuncoesConsulta, $timeout, $q) {
        // Carregar CSS específico para listaConsultaTabela
        if (!document.querySelector('link[href*="listaConsultaTabela.css"]')) {
            var link = document.createElement("link");
            link.rel = "stylesheet";
            link.type = "text/css";
            link.href = "/api-front/css/listaConsultaTabela.css";
            document.head.appendChild(link);
        }
        return {
            restrict: "E",
            replace: true,
            template: "",
            link: function (scope, elem) {
                // ==================== CONFIGURAÇÕES INICIAIS ====================

                // Usar funções do serviço centralizado
                var acao = FuncoesConsulta.obterParametrosUrl(scope.acao);
                var infoUsuario = FuncoesConsulta.obterInformacoesUsuario();
                var usuario = infoUsuario.usuario;
                var admSistema = infoUsuario.admSistema;
                var parametros = scope.estrutura;

                // Configurações de performance
                var CONFIG = {
                    ITENS_POR_PAGINA: 30,
                    DEBOUNCE_FILTRO: 300,
                    DEBOUNCE_SCROLL: 150,
                    TIMEOUT_CARREGAMENTO: 200,
                };

                // Variáveis de estado
                var estado = {
                    carregando: false,
                    filtroTimeout: null,
                    scrollTimeout: null,
                    watchingUpdate: false,
                    ultimoFiltroAplicado: "",
                    scrollListener: null,
                };

                // ==================== INICIALIZAÇÃO ====================

                // Forçar posição dos botões para direita
                var posicaoBotoes = "direita";
                var classes = FuncoesConsulta.gerarClassesBotoes(posicaoBotoes);
                var classeBotoes = classes.classeBotoes;
                var classeLista = classes.classeLista;
                var habilitarSalvar = false;

                // Usar funções do serviço centralizado
                scope.aoEntrarInputConsulta = FuncoesConsulta.aoEntrarInputConsulta;
                scope.alteracaoItemConsulta = FuncoesConsulta.alteracaoItemConsulta;
                scope.salvarAlteracoesItem = function (item, event) {
                    FuncoesConsulta.salvarAlteracoesItem(item, event, parametros);
                };
                scope.cancelarAlteracoesItem = FuncoesConsulta.cancelarAlteracoesItem;

                // Usar função do serviço para mesclar campos
                //var camposMesclados = FuncoesConsulta.mesclarCampos(parametros.listaConsulta, parametros.campos);
                var camposMesclados = parametros.listaConsulta;

                // ==================== CONFIGURAÇÃO DOS CAMPOS ====================

                // Verificar se há campos com habilitação de edição para definir habilitarSalvar
                angular.forEach(camposMesclados, function (val, key) {
                    if (val.tipo != "oculto") {
                        habilitarSalvar = val.habilitarEdicao || habilitarSalvar;
                    }
                });

                // ==================== GERAÇÃO DOS BOTÕES ====================

                var htmlBotoes = gerarHtmlBotoes(parametros, habilitarSalvar);

                // ==================== CONFIGURAÇÃO DO FILTRO ====================

                var filtro = configurarFiltro(scope.estrutura);
                scope.filtroResultado = filtro;

                // ==================== GERAÇÃO DO HTML ====================
                // CSS específico carregado dinamicamente em /api-front/css/listaConsultaTabela.css

                var html = gerarHtmlTabela(camposMesclados, classeLista, classeBotoes, htmlBotoes, parametros);
                elem.html(html);
                $(elem).css("margin-top", "400px !important");

                // ==================== SISTEMA DE LAZY LOADING ====================

                // Inicializar variáveis de estado
                scope.listaConsultaVisivel = [];
                scope.carregandoMaisItens = false;
                scope.temMaisItens = true;
                scope.itensPorCarregamento = CONFIG.ITENS_POR_PAGINA;
                scope.ultimaPaginaCarregada = 0;
                scope.listaConsultaCompleta = [];
                scope.listaConsultaFiltrada = [];
                scope.filtroResultadoAtivo = "";

                // ==================== WATCHERS OTIMIZADOS ====================

                // Watch para detectar mudanças na lista original e reaplicar filtros
                var unwatchListaCompleta = scope.$watch("listaConsultaCompleta", function (novaLista) {
                    if (novaLista && novaLista.length > 0 && scope.filtrosColuna) {
                        var temFiltrosAtivos = Object.keys(scope.filtrosColuna).some(function (key) {
                            return scope.filtrosColuna[key] && scope.filtrosColuna[key].trim() !== "";
                        });

                        if (temFiltrosAtivos) {
                            scope.aplicarFiltroColuna();
                        }
                    }
                });

                // Watch principal para listaConsulta com tratamento de erro
                var unwatchListaConsulta = scope.$watch("listaConsulta", function (novaLista, listaAnterior) {
                    try {
                        if (estado.watchingUpdate) return;

                        if (novaLista && novaLista.length > 0) {
                            // Salvar como lista completa
                            scope.listaConsultaCompleta = angular.copy(novaLista);

                            // Inicializar lazy loading
                            inicializarLazyLoading();

                            // Carregar primeiros itens imediatamente
                            scope.$evalAsync(function () {
                                scope.carregarDaListaAtual();
                            });
                        } else {
                            limparListaVisivel();
                        }
                    } catch (error) {
                        console.error("Erro no watch listaConsulta:", error);
                        limparListaVisivel();
                    }
                });

                // Watch para filtroResultado com debounce otimizado
                var unwatchFiltroResultado = scope.$watch("filtroResultado", function (novoFiltro, filtroAnterior) {
                    if (estado.watchingUpdate) return;

                    // Cancelar timeout anterior
                    if (estado.filtroTimeout) {
                        $timeout.cancel(estado.filtroTimeout);
                    }

                    // Aplicar filtro com debounce
                    estado.filtroTimeout = $timeout(function () {
                        try {
                            scope.filtroResultadoAtivo = novoFiltro || "";
                            scope.aplicarFiltroResultado();
                        } catch (error) {
                            console.error("Erro ao aplicar filtro:", error);
                        }
                    }, CONFIG.DEBOUNCE_FILTRO);
                });

                // ==================== FUNÇÕES DE FILTRO OTIMIZADAS ====================

                // Função para filtrar itens da lista baseado no filtroResultado
                scope.aplicarFiltroResultado = function () {
                    try {
                        if (!scope.listaConsultaCompleta || scope.listaConsultaCompleta.length === 0) {
                            scope.listaConsultaFiltrada = [];
                            atualizarListaConsulta([]);
                            return;
                        }

                        var filtro = scope.filtroResultadoAtivo;
                        if (!filtro || filtro === "") {
                            scope.listaConsultaFiltrada = angular.copy(scope.listaConsultaCompleta);
                        } else {
                            scope.listaConsultaFiltrada = scope.listaConsultaCompleta.filter(function (item) {
                                return scope.itemPassaNoFiltro(item, filtro);
                            });
                        }

                        // Atualizar listaConsulta com o resultado filtrado
                        atualizarListaConsulta(scope.listaConsultaFiltrada);

                        // Resetar lista visível para mostrar itens filtrados
                        inicializarLazyLoading();

                        // Carregar primeiros itens imediatamente se há dados
                        if (scope.listaConsultaFiltrada.length > 0) {
                            scope.ultimaPaginaCarregada = 1;
                            scope.$evalAsync(function () {
                                scope.carregarDaListaAtual();
                            });
                        }
                    } catch (error) {
                        console.error("Erro ao aplicar filtro resultado:", error);
                    }
                };

                // Função para verificar se um item passa no filtro (otimizada)
                scope.itemPassaNoFiltro = function (item, filtro) {
                    if (!filtro || filtro === "") return true;

                    var filtroLower = filtro.toLowerCase();

                    // Cache para propriedades do item
                    var propriedades = Object.keys(item);

                    for (var i = 0; i < propriedades.length; i++) {
                        var prop = propriedades[i];
                        var valor = item[prop];

                        if (valor !== null && valor !== undefined) {
                            var valorStr = String(valor).toLowerCase();
                            if (valorStr.indexOf(filtroLower) !== -1) {
                                return true;
                            }
                        }
                    }
                    return false;
                };

                // Função para aplicar filtro de forma imediata
                scope.aplicarFiltroImediato = function (filtro) {
                    if (estado.filtroTimeout) {
                        $timeout.cancel(estado.filtroTimeout);
                    }

                    scope.filtroResultadoAtivo = filtro || "";
                    scope.aplicarFiltroResultado();
                };

                // Função para limpar o filtro
                scope.limparFiltroResultado = function () {
                    if (estado.filtroTimeout) {
                        $timeout.cancel(estado.filtroTimeout);
                    }

                    // Limpar o campo visual
                    var campoFiltro = document.getElementById("filtro_resultado");
                    if (campoFiltro) {
                        campoFiltro.value = "";
                    }

                    // Limpar as variáveis do scope
                    scope.filtroResultado = "";
                    scope.filtroResultadoAtivo = "";
                    scope.aplicarFiltroResultado();
                };

                // ==================== FUNÇÕES DE LAZY LOADING OTIMIZADAS ====================

                // Função para carregar mais itens
                scope.carregarMaisItens = function () {
                    if (estado.carregando || !scope.temMaisItens) {
                        console.log("❌ Não pode carregar");
                        return;
                    }

                    // Verificar se já carregamos todos os itens
                    if (scope.listaConsultaVisivel.length >= scope.listaConsultaCompleta.length) {
                        scope.temMaisItens = false;
                        console.log("❌ Todos os itens já carregados");
                        return;
                    }

                    console.log("✅ Iniciando carregamento...");
                    estado.carregando = true;
                    scope.carregandoMaisItens = true;

                    // Usar timeout para garantir que a UI seja atualizada
                    $timeout(function () {
                        scope.carregarDaListaAtual();
                    }, 50);
                };

                // Função para carregar dados da lista atual
                scope.carregarDaListaAtual = function () {
                    try {
                        console.log("=== CARREGAR DA LISTA ATUAL ===");
                        var listaParaUsar = scope.listaConsultaCompleta || [];
                        //console.log("Lista para usar:", listaParaUsar.length);

                        if (listaParaUsar && listaParaUsar.length > 0) {
                            var itensJaCarregados = scope.listaConsultaVisivel.length;
                            var itensRestantes = listaParaUsar.length - itensJaCarregados;
                            var itensParaCarregar = Math.min(scope.itensPorCarregamento, itensRestantes);

                            if (itensParaCarregar > 0) {
                                var novosItens = listaParaUsar.slice(itensJaCarregados, itensJaCarregados + itensParaCarregar);
                                scope.listaConsultaVisivel = scope.listaConsultaVisivel.concat(novosItens);
                                scope.temMaisItens = itensJaCarregados + itensParaCarregar < listaParaUsar.length;
                            } else {
                                scope.temMaisItens = false;
                                //   console.log("❌ Nenhum item para carregar");
                            }
                        } else {
                            limparListaVisivel();
                            // console.log("❌ Lista vazia");
                        }
                    } catch (error) {
                        console.error("Erro ao carregar dados da lista:", error);
                        limparListaVisivel();
                    } finally {
                        estado.carregando = false;
                        scope.carregandoMaisItens = false;
                        //console.log("=== FIM DO CARREGAMENTO ===");
                    }
                };

                // Função para carregar todos os itens de uma vez
                scope.carregarTodosItens = function () {
                    try {
                        scope.listaConsultaVisivel = angular.copy(scope.listaConsultaCompleta);
                        scope.temMaisItens = false;
                        scope.carregandoMaisItens = false;
                    } catch (error) {
                        console.error("Erro ao carregar todos os itens:", error);
                    }
                };

                // ==================== FUNÇÕES AUXILIARES ====================

                function inicializarLazyLoading() {
                    scope.listaConsultaVisivel = [];
                    scope.ultimaPaginaCarregada = 0;
                    scope.temMaisItens = true;
                    scope.carregandoMaisItens = false;
                }

                function limparListaVisivel() {
                    scope.listaConsultaVisivel = [];
                    scope.temMaisItens = false;
                    scope.carregandoMaisItens = false;
                }

                function atualizarListaConsulta(novaLista) {
                    estado.watchingUpdate = true;
                    scope.listaConsulta = angular.copy(novaLista);
                    $timeout(function () {
                        estado.watchingUpdate = false;
                    }, 0);
                }

                function configurarFiltro(estrutura) {
                    if (estrutura.camposFiltroPersonalizado && Object.keys(estrutura.camposFiltroPersonalizado).length > 0) {
                        var filtro = "{";
                        var cont = 1;
                        for (var i in estrutura.camposFiltroPersonalizado) {
                            filtro += i + ":" + estrutura.raizModelo + "." + i;
                            filtro += cont < Object.keys(estrutura.camposFiltroPersonalizado).length ? "," : "";
                            cont++;
                        }
                        filtro += "}";
                        return filtro;
                    } else {
                        return "";
                    }
                }

                function gerarHtmlBotoes(parametros, habilitarSalvar) {
                    var htmlBotoes = `<div class="col-acoes-excel">`;

                    const acoes = APIServ.buscaDadosLocais("menuPainel");
                    const temAlterar = acoes.acoes[scope.acao]["Alterar"] != undefined;
                    const temExcluir = acoes.acoes[scope.acao]["Excluir"] != undefined;

                    // Botão detalhar
                    if (
                        (parametros.funcaoDetalhar == undefined || parametros.funcaoDetalhar != "desativada") &&
                        (parametros.ocultarDetalhes == undefined || !parametros.ocultarDetalhes)
                    ) {
                        var funcaoDet = parametros.funcaoDetalhar != undefined ? parametros.funcaoDetalhar : "detalhar";
                        htmlBotoes += `<button type="button" name="button" class="btn btn-excel btn-outline-secondary glyphicon"
                    ng-class="{'glyphicon-plus' : !item.exibirDetalhes, 'glyphicon-minus':item.exibirDetalhes}" title="Ver Detalhes"  ng-click=${funcaoDet}(item)></button>`;
                    }

                    if (temAlterar) {
                        // Botão alterar
                        var funcaoAlt = parametros.funcaoAlterar != undefined ? parametros.funcaoAlterar : "alterar";
                        var textoBotaoAlterar = parametros.textoBotaoAlterar != undefined ? parametros.textoBotaoAlterar : "";
                        var iconeBotaoAlterar =
                            parametros.ocultarIconeBotaoAlterar == undefined || !parametros.ocultarIconeBotaoAlterar ? "glyphicon-pencil glyphicon" : "";
                        var classesBotaoAlterar =
                            parametros.classesBotaoAlterar == undefined || !parametros.classesBotaoAlterar
                                ? "btn-excel btn-outline-primary"
                                : parametros.classesBotaoAlterar;
                        var ocultarAlterar = parametros.ocultarAlterar != undefined ? `ng-if="${parametros.ocultarAlterar}"` : "";
                        htmlBotoes += `<button type="button" class="btn ${classesBotaoAlterar} ${iconeBotaoAlterar}" title="Alterar ${parametros.nomeUsual}" ng-click="${funcaoAlt}(item)" ${ocultarAlterar}>${textoBotaoAlterar}</button>`;
                    }

                    if (temExcluir) {
                        // Botão excluir
                        var funcaoExc = parametros.funcaoExcluir != undefined ? parametros.funcaoExcluir : "excluir";
                        var ocultarExcluir = parametros.ocultarExcluir != undefined ? `ng-if="${parametros.ocultarExcluir}"` : "";
                        htmlBotoes += `<button type="button" class="btn btn-excel btn-outline-danger glyphicon glyphicon-trash" title="Excluir ${parametros.nomeUsual}" ng-click="${funcaoExc}(item)" ${ocultarExcluir}></button>`;
                    }
                    // Botões de salvar/cancelar
                    if (habilitarSalvar) {
                        htmlBotoes += `
                        <button type="button" class="btn btn-excel btn-success glyphicon glyphicon-ok" ng-click="salvarAlteracoesItem(item, $event)" ng-if="item.habilitarSalvar">
                        <button type="button" class="btn btn-excel btn-danger glyphicon glyphicon-remove-circle" ng-click="cancelarAlteracoesItem(item, $event)" ng-if="item.habilitarSalvar">
                    `;
                    }

                    // Ações personalizadas
                    if (parametros.acoesItensConsulta != undefined) {
                        angular.forEach(parametros.acoesItensConsulta, function (val, key) {
                            if (val == "anexos") {
                                htmlBotoes += `<input-botao parametros="${val}"></input-botao>`;
                            } else if (val == "diretiva" || (val.tipo != undefined && val.tipo == "diretiva")) {
                                var nomeDiretiva = val.nomeDiretiva != undefined ? val.nomeDiretiva : key;
                                nomeDiretiva = APIAjuFor.variavelParaDiretiva(nomeDiretiva);
                                htmlBotoes += `<${nomeDiretiva} campo="${key}"></${nomeDiretiva}>`;
                            } else if (val.tipo == "caixaSelecao") {
                                htmlBotoes += `<span class="form-inline"><input type="checkbox" ng-model="item.${key}" ng-click="selecionarItemConsulta(key, item)"></span>`;
                            } else {
                                val["tipo"] = "button";
                                htmlBotoes += `<input-botao parametros="${key}"></input-botao>`;
                            }
                        });
                    }

                    htmlBotoes += `</div>`;
                    return htmlBotoes;
                }

                function gerarHtmlItemConsulta(camposMesclados) {
                    var html = "";
                    angular.forEach(camposMesclados, function (val, key) {
                        if (val.tipo != "oculto") {
                            var tamanhoColuna = val.md || 12;
                            var classeColuna = `col-xs-12 col-md-${tamanhoColuna}`;

                            html += `<div class="${classeColuna} campo-excel">`;

                            if (val.tipo == "caixaSelecao") {
                                html += `<monta-html campo="selecionado"></monta-html>`;
                            } else if (val.tipo == "imagem") {
                                html += `<img ng-src="{{item.${key}}}" class="img-responsive img-excel" style="max-height:80px !important" imagem-dinamica>`;
                            } else if (val == "diretiva") {
                                var nomeDiretiva = APIAjuFor.variavelParaDiretiva(key);
                                html += `<${nomeDiretiva}></${nomeDiretiva}>`;
                            } else if (val.tipo == "select") {
                                html += `<monta-html campo="${key}"></monta-html>`;
                            } else if (val.tipo == "ordenacaoConsulta") {
                                html += `<ordenacao-consulta campo="${key}"></ordenacao-consulta>`;
                            } else if (val.habilitarEdicao != undefined && val.habilitarEdicao) {
                                html += `<input class="form-control input-excel" type="text" ng-model="item.${key}" campo="${key}" 
                                        ng-focus="aoEntrarInputConsulta(item, $event)" 
                                        ng-keyup="alteracaoItemConsulta(item, $event)">`;
                            } else {
                                html += `<span class="texto-excel">{{item.${key}}}</span>`;
                            }

                            html += `</div>`;
                        }
                    });
                    return html;
                }

                function gerarHtmlTabela(camposMesclados, classeLista, classeBotoes, htmlBotoes, parametros) {
                    const htmlItemConsulta = gerarHtmlItemConsulta(camposMesclados);
                    var textoDetalhes = parametros.textoDetalhesConsulta != undefined ? parametros.textoDetalhesConsulta : "Mais Informações";
                    var diretivaDetalhes =
                        parametros.diretivaDetalhesConsulta != undefined ? parametros.diretivaDetalhesConsulta : "lista-consulta-tabela-detalhes";
                    var htmlAnexos = parametros.anexos != undefined ? `<arquivos-anexos tela="detalhes" chave-array="key"></arquivos-anexos>` : "";

                    var htmlAcoesRodapeConsulta = "";
                    if (parametros.acoesRodapeConsulta != undefined) {
                        htmlAcoesRodapeConsulta += `<div class="col-xs-12><div class="row">`;
                        angular.forEach(parametros.acoesRodapeConsulta, function (val, key) {
                            htmlAcoesRodapeConsulta += `<input-botao parametros="${key}" ng-if="tela=='consulta'"></input-botao>`;
                        });
                        htmlAcoesRodapeConsulta += `</div></div>`;
                        htmlAcoesRodapeConsulta += "<hr>";
                    }                    

                    var html = `
                <div ng-if="tela == 'consulta'" class="listaConsulta row">                    
                    <div class="itemConsulta col-xs-12 bg-danger text-center" ng-if="listaConsulta.length == 0 && tela != 'cadastro'">
                        <h3>Nenhum Ítem Encontrado</h3>
                    </div>
                    <div class="conteudoBusca col-xs-12">                        
                        <div class="table-responsive-excel">
                            <div class="table-container-excel">
                                <table class="table table-excel table-hover">
                                    <tbody>
                                    <tr ng-repeat="item in listaConsultaVisivel track by $index" ng-if="tela != 'cadastro'" indice="{{$index}}" id="divItemConsulta_{{$index}}" class="itemConsulta-excel">
                                        <td colspan="100%" class="linhaListaConsulta-excel">
                                            <div class="row row-excel">
                                                <div class="${classeLista}">
                                                    <div class="row inicioItem-excel">
                                                        ${htmlItemConsulta}
                                                    </div>
                                                </div>
                                                <div class="${classeBotoes}">
                                                    ${htmlBotoes}
                                                </div>
                                            </div>
                                            <!-- Detalhes inline removidos - agora só modal -->
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        ${htmlAcoesRodapeConsulta}
                    </div>
                    
                    <!-- Indicador de carregamento compacto -->
                     <div class="lazy-loading-indicator text-center" ng-show="carregandoMaisItens" style="padding: 10px;">
                         <i class="fa fa-spinner fa-spin"></i> Carregando...
                     </div> 
                    </div>
                    
                    <!-- Modal de detalhes independente -->
                    <${diretivaDetalhes}></${diretivaDetalhes}>
                    <rodape></rodape>
                </div>`;

                    return html;
                }

                // ==================== CONFIGURAÇÃO DO SCROLL INFINITO ====================

                $timeout(function () {
                    estado.scrollListener = function () {
                        if (estado.scrollTimeout) {
                            clearTimeout(estado.scrollTimeout);
                        }

                        estado.scrollTimeout = setTimeout(function () {
                            // Verificar se chegou próximo ao final da página
                            var scrollTop = $(window).scrollTop();
                            var windowHeight = $(window).height();
                            var documentHeight = $(document).height();

                            // Carregar mais itens quando estiver a 300px do final
                            if (scrollTop + windowHeight >= documentHeight - 300) {
                                if (!scope.carregandoMaisItens && scope.temMaisItens) {
                                    scope.$apply(function () {
                                        scope.carregarMaisItens();
                                    });
                                }
                            }
                        }, 100); // Reduzir debounce para ser mais responsivo
                    };

                    // Adicionar listener de scroll
                    $(window).on("scroll", estado.scrollListener);
                }, 500);

                // ==================== LIMPEZA E DESTRUIÇÃO ====================

                scope.$on("$destroy", function () {
                    // Cancelar todos os timeouts
                    if (estado.filtroTimeout) {
                        $timeout.cancel(estado.filtroTimeout);
                    }
                    if (estado.scrollTimeout) {
                        clearTimeout(estado.scrollTimeout);
                    }

                    // Remover listener de scroll da janela
                    if (estado.scrollListener) {
                        $(window).off("scroll", estado.scrollListener);
                    }

                    // Remover listener de scroll da tabela
                    $(document).off("scroll", ".table-responsive-excel");

                    // Remover watchers
                    if (unwatchListaConsulta) {
                        unwatchListaConsulta();
                    }
                    if (unwatchFiltroResultado) {
                        unwatchFiltroResultado();
                    }
                    if (unwatchListaCompleta) {
                        unwatchListaCompleta();
                    }
                });

                $compile(elem.contents())(scope);
            },
        };
    },
]);
