directivesPadrao.directive("listaConsultaTabela", [
    "$compile",
    "APIServ",
    "EGFuncoes",
    "APIAjuFor",
    "FuncoesConsulta",
    "$timeout",
    "$q",
    function ($compile, APIServ, EGFuncoes, APIAjuFor, FuncoesConsulta, $timeout, $q) {
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
                    ITENS_POR_PAGINA: 20,
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
                var camposMesclados = FuncoesConsulta.mesclarCampos(parametros.listaConsulta, parametros.campos);

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

                            // Carregar primeiros itens
                            scope.carregarMaisItens();
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
                        return;
                    }

                    // Verificar se já carregamos todos os itens
                    if (scope.listaConsultaVisivel.length >= scope.listaConsultaCompleta.length) {
                        scope.temMaisItens = false;
                        return;
                    }

                    estado.carregando = true;
                    scope.carregandoMaisItens = true;

                    $timeout(function () {
                        scope.carregarDaListaAtual();
                    }, CONFIG.TIMEOUT_CARREGAMENTO);
                };

                // Função para carregar dados da lista atual
                scope.carregarDaListaAtual = function () {
                    try {
                        var listaParaUsar = scope.listaConsultaCompleta || [];

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
                            }
                        } else {
                            limparListaVisivel();
                        }
                    } catch (error) {
                        console.error("Erro ao carregar dados da lista:", error);
                        limparListaVisivel();
                    } finally {
                        estado.carregando = false;
                        scope.carregandoMaisItens = false;

                        if (!scope.$$phase && !scope.$root.$$phase) {
                            scope.$apply();
                        }
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
                    var htmlBotoes = `<div class="col-acoes">`;

                    // Botão detalhar
                    if (
                        (parametros.funcaoDetalhar == undefined || parametros.funcaoDetalhar != "desativada") &&
                        (parametros.ocultarDetalhes == undefined || !parametros.ocultarDetalhes)
                    ) {
                        var funcaoDet = parametros.funcaoDetalhar != undefined ? parametros.funcaoDetalhar : "detalhar";
                        htmlBotoes += `<button type="button" name="button" class="btn btn-modern btn-outline-secondary glyphicon"
                    ng-class="{'glyphicon-plus' : !item.exibirDetalhes, 'glyphicon-minus':item.exibirDetalhes}" title="Ver Detalhes"  ng-click=${funcaoDet}(item)></button>`;
                    }

                    // Botão alterar
                    var funcaoAlt = parametros.funcaoAlterar != undefined ? parametros.funcaoAlterar : "alterar";
                    var textoBotaoAlterar = parametros.textoBotaoAlterar != undefined ? parametros.textoBotaoAlterar : "";
                    var iconeBotaoAlterar =
                        parametros.ocultarIconeBotaoAlterar == undefined || !parametros.ocultarIconeBotaoAlterar ? "glyphicon-pencil glyphicon" : "";
                    var classesBotaoAlterar =
                        parametros.classesBotaoAlterar == undefined || !parametros.classesBotaoAlterar
                            ? "btn-modern btn-outline-primary"
                            : parametros.classesBotaoAlterar;
                    var ocultarAlterar = parametros.ocultarAlterar != undefined ? `ng-if="${parametros.ocultarAlterar}"` : "";
                    htmlBotoes += `<button type="button" class="btn ${classesBotaoAlterar} ${iconeBotaoAlterar}" title="Alterar ${parametros.nomeUsual}" ng-click="${funcaoAlt}(item)" ${ocultarAlterar}>${textoBotaoAlterar}</button>`;

                    // Botão excluir
                    var funcaoExc = parametros.funcaoExcluir != undefined ? parametros.funcaoExcluir : "excluir";
                    var ocultarExcluir = parametros.ocultarExcluir != undefined ? `ng-if="${parametros.ocultarExcluir}"` : "";
                    htmlBotoes += `<button type="button" class="btn btn-modern btn-outline-danger glyphicon glyphicon-trash" title="Excluir ${parametros.nomeUsual}" ng-click="${funcaoExc}(item)" ${ocultarExcluir}></button>`;

                    // Botões de salvar/cancelar
                    if (habilitarSalvar) {
                        htmlBotoes += `
                        <button type="button" class="btn btn-modern btn-success glyphicon glyphicon-ok" ng-click="salvarAlteracoesItem(item, $event)" ng-if="item.habilitarSalvar">
                        <button type="button" class="btn btn-modern btn-danger glyphicon glyphicon-remove-circle" ng-click="cancelarAlteracoesItem(item, $event)" ng-if="item.habilitarSalvar">
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

                function gerarHtmlTabela(camposMesclados, classeLista, classeBotoes, htmlBotoes, parametros) {
                    var html = `
                <div ng-if="tela == 'consulta'" class="listaConsulta">
                    <div class="itemConsulta col-xs-12 bg-danger text-center" ng-if="listaConsulta.length == 0 && tela != 'cadastro'">
                        <h3>Nenhum Ítem Encontrado</h3>
                    </div>
                    <div class="conteudoBusca col-xs-12">
                        
                        <div class="table-responsive">
                            <div class="table-container">
                                <table class="table table-striped table-hover">
                                    <tbody>
                                    <tr ng-repeat="item in listaConsultaVisivel track by $index" ng-if="tela != 'cadastro'"
                                        indice="{{$index}}" id="divItemConsulta_{{$index}}" class="itemConsulta">
                                        <td colspan="100%" class="linhaListaConsulta">
                                            <div class="row">
                                                <div class="${classeLista}">
                                                    <div class="row inicioItem">`;

                    // Adicionar células de dados com sistema de grid responsivo
                    angular.forEach(camposMesclados, function (val, key) {
                        if (val.tipo != "oculto") {
                            var tamanhoColuna = val.md || 12;
                            var classeColuna = `col-xs-12 col-md-${tamanhoColuna}`;

                            html += `<div class="${classeColuna}">`;

                            if (val.tipo == "caixaSelecao") {
                                html += `<monta-html campo="selecionado"></monta-html>`;
                            } else if (val.tipo == "imagem") {
                                html += `<img ng-src="{{item.${key}}}" class="img-responsive" style="max-height:120px !important" imagem-dinamica>`;
                            } else if (val == "diretiva") {
                                var nomeDiretiva = APIAjuFor.variavelParaDiretiva(key);
                                html += `<${nomeDiretiva}></${nomeDiretiva}>`;
                            } else if (val.tipo == "select") {
                                html += `<monta-html campo="${key}"></monta-html>`;
                            } else if (val.tipo == "ordenacaoConsulta") {
                                html += `<ordenacao-consulta campo="${key}"></ordenacao-consulta>`;
                            } else if (val.habilitarEdicao != undefined && val.habilitarEdicao) {
                                html += `<input class="form-control input-xs" type="text" ng-model="item.${key}" campo="${key}" 
                                        ng-focus="aoEntrarInputConsulta(item, $event)" 
                                        ng-keyup="alteracaoItemConsulta(item, $event)">`;
                            } else {
                                html += `<span>{{item.${key}}}</span>`;
                            }

                            html += `</div>`;
                        }
                    });

                    html += `
                                        </div>
                                    </div>
                                    <div class="${classeBotoes}">
                                        ${htmlBotoes}
                                    </div>
                                </div>`;

                    var textoDetalhes = parametros.textoDetalhesConsulta != undefined ? parametros.textoDetalhesConsulta : "Mais Informações";
                    html += `
                            <div ng-if="item.exibirDetalhes" class="fundoDetalheConsulta">                        
                                <div class="row">
                                    <div class="col-xs-12">
                                        <h4 class="campoItemConsulta text-center fundobranco">${textoDetalhes}</h4>`;

                    var diretivaDetalhes = parametros.diretivaDetalhesConsulta != undefined ? parametros.diretivaDetalhesConsulta : "detalhes-item-consulta";
                    html += `<${diretivaDetalhes}></${diretivaDetalhes}>`;

                    if (parametros.anexos != undefined) {
                        html += `<arquivos-anexos tela="detalhes" chave-array="key"></arquivos-anexos>`;
                    }

                    html += `                            
                                        </div>
                                    </div>
                                    </div>
                                </td>
                            </tr>
                                </tbody>
                            </table>
                            </div>
                        </div>`;

                    if (parametros.acoesRodapeConsulta != undefined) {
                        html += `<div class="col-xs-12><div class="row">`;
                        angular.forEach(parametros.acoesRodapeConsulta, function (val, key) {
                            html += `<input-botao parametros="${key}" ng-if="tela=='consulta'"></input-botao>`;
                        });
                        html += `</div></div>`;
                        html += "<hr>";
                    }

                    html += "</div>";
                    html += `
                                     <!-- Indicador de carregamento -->
                     <div class="lazy-loading-indicator text-center" ng-show="carregandoMaisItens" style="padding: 20px;">
                         <i class="fa fa-spinner fa-spin"></i> Carregando mais itens...
                     </div>
                     
                     <!-- Botões de controle -->
                     <div class="text-center" ng-if="temMaisItens && !carregandoMaisItens" style="padding: 20px;">
                         <button class="btn btn-primary" ng-click="carregarMaisItens()" style="margin-right: 10px;">
                             <i class="fa fa-plus"></i> Carregar mais itens
                         </button>
                         <button class="btn btn-success" ng-click="carregarTodosItens()">
                             <i class="fa fa-list"></i> Carregar todos os itens
                         </button>
                     </div>
                     
                     <!-- Informações de debug -->
                     <div class="text-center" style="padding: 10px; background: #f8f9fa; border-top: 1px solid #dee2e6;">
                         <small class="text-muted">
                             Itens exibidos: {{listaConsultaVisivel.length}} | 
                             Total na lista: {{listaConsultaCompleta.length}} | 
                             Tem mais itens: {{temMaisItens}}
                         </small>
                     </div>
                    </div>
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
                            if ($(window).scrollTop() + $(window).height() >= $(document).height() - 100) {
                                if (!scope.carregandoMaisItens && scope.temMaisItens) {
                                    scope.$apply(function () {
                                        scope.carregarMaisItens();
                                    });
                                }
                            }
                        }, CONFIG.DEBOUNCE_SCROLL);
                    };

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

                    // Remover listener de scroll
                    if (estado.scrollListener) {
                        $(window).off("scroll", estado.scrollListener);
                    }

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

// Diretiva para o cabeçalho da tabela de listaConsultaTabela
directivesPadrao.directive("cabecalhoListaConsultaTabela", [
    "$compile",
    "FuncoesConsulta",
    "$timeout",
    function ($compile, FuncoesConsulta, $timeout) {
        return {
            restrict: "E",
            replace: true,
            template: "",
            link: function (scope, elem) {
                // Verificar se deve exibir o cabeçalho da tabela
                if (scope.estrutura.tipoListaConsulta === "tabela" && scope.tela === "consulta") {
                    var parametros = scope.estrutura;
                    var html = gerarCabecalhoTabela(scope, parametros);

                    // ==================== SISTEMA DE FILTROS MELHORADO ====================

                    // Estado dos filtros
                    scope.filtrosColuna = {};
                    scope.filtrosAtivos = {};
                    scope.resultadosFiltrados = 0;
                    scope.modoFiltro = "lazy"; // 'lazy' ou 'todos'

                    var filtroColunaTimeout = null;
                    var cacheFiltros = {};

                    // Função para validar e normalizar valor de filtro
                    function normalizarValorFiltro(valor) {
                        if (valor === null || valor === undefined) return "";
                        return String(valor).trim().toLowerCase();
                    }

                    // Função para verificar se um item passa em um filtro específico
                    function itemPassaNoFiltro(item, coluna, valorFiltro) {
                        var valorItem = item[coluna];

                        // Tratar diferentes tipos de dados
                        if (valorItem === null || valorItem === undefined) {
                            return valorFiltro === ""; // Aceitar se filtro estiver vazio
                        }

                        // Se o valor é um objeto ou array, tentar converter para string
                        if (typeof valorItem === "object") {
                            try {
                                valorItem = JSON.stringify(valorItem);
                            } catch (e) {
                                valorItem = String(valorItem);
                            }
                        }

                        var valorItemStr = normalizarValorFiltro(valorItem);
                        var valorFiltroStr = normalizarValorFiltro(valorFiltro);

                        // Busca por substring (case-insensitive)
                        return valorItemStr.indexOf(valorFiltroStr) !== -1;
                    }

                    // Função para aplicar filtros com cache
                    scope.aplicarFiltroColuna = function () {
                        // Cancelar timeout anterior se existir
                        if (filtroColunaTimeout) {
                            $timeout.cancel(filtroColunaTimeout);
                        }

                        // Aplicar filtro com debounce otimizado
                        filtroColunaTimeout = $timeout(function () {
                            try {
                                // Usar sempre listaConsultaCompleta como base
                                var listaBase = scope.listaConsultaCompleta || scope.listaConsulta || [];
                                if (!listaBase || listaBase.length === 0) {
                                    scope.listaConsultaVisivel = [];
                                    scope.resultadosFiltrados = 0;
                                    return;
                                }

                                // Verificar se há filtros ativos
                                var filtrosAtivos = {};
                                var temFiltrosAtivos = false;

                                angular.forEach(scope.filtrosColuna, function (valorFiltro, nomeColuna) {
                                    var valorNormalizado = normalizarValorFiltro(valorFiltro);
                                    if (valorNormalizado !== "") {
                                        filtrosAtivos[nomeColuna] = valorNormalizado;
                                        temFiltrosAtivos = true;
                                    }
                                });

                                // Atualizar estado dos filtros ativos
                                scope.filtrosAtivos = filtrosAtivos;
                                scope.modoFiltro = temFiltrosAtivos ? "todos" : "lazy";

                                var listaFiltrada;

                                if (temFiltrosAtivos) {
                                    // Aplicar filtros
                                    listaFiltrada = listaBase.filter(function (item) {
                                        // Item deve passar em TODOS os filtros ativos
                                        for (var coluna in filtrosAtivos) {
                                            if (!itemPassaNoFiltro(item, coluna, filtrosAtivos[coluna])) {
                                                return false;
                                            }
                                        }
                                        return true;
                                    });
                                } else {
                                    // Sem filtros, usar lista original
                                    listaFiltrada = listaBase;
                                }

                                // Atualizar resultados
                                scope.resultadosFiltrados = listaFiltrada.length;

                                if (scope.modoFiltro === "todos") {
                                    // Modo filtro: mostrar todos os resultados
                                    scope.listaConsultaVisivel = listaFiltrada;
                                    scope.temMaisItens = false;
                                } else {
                                    // Modo lazy: aplicar lazy loading
                                    scope.listaConsultaFiltrada = listaFiltrada;
                                    // Inicializar lazy loading diretamente
                                    scope.listaConsultaVisivel = [];
                                    scope.ultimaPaginaCarregada = 0;
                                    scope.temMaisItens = true;
                                    scope.carregandoMaisItens = false;
                                    scope.carregarMaisItens();
                                }

                                // Forçar atualização da view
                                if (!scope.$$phase && !scope.$root.$$phase) {
                                    scope.$apply();
                                }
                            } catch (error) {
                                console.error("Erro ao aplicar filtro coluna:", error);
                                scope.resultadosFiltrados = 0;
                            }
                        }, 200); // Debounce reduzido para 200ms para melhor responsividade
                    };

                    // Função para limpar filtros
                    scope.limparFiltrosLocal = function () {
                        try {
                            // Limpar todos os campos de filtro
                            scope.filtrosColuna = {};
                            scope.filtrosAtivos = {};
                            scope.resultadosFiltrados = 0;
                            scope.modoFiltro = "lazy";

                            // Limpar campos visuais
                            var inputs = elem.find('input[ng-model^="filtrosColuna"]');
                            inputs.val("");

                            // Restaurar lista completa e lazy loading
                            if (scope.listaConsultaCompleta && scope.listaConsultaCompleta.length > 0) {
                                scope.listaConsultaVisivel = [];
                                scope.listaConsultaFiltrada = scope.listaConsultaCompleta;
                                scope.temMaisItens = true;
                                scope.carregandoMaisItens = false;
                                scope.ultimaPaginaCarregada = 0;

                                // Carregar primeiros itens
                                scope.carregarMaisItens();
                            }
                        } catch (error) {
                            console.error("Erro ao limpar filtros:", error);
                        }
                    };

                    // Função para alternar exibição de filtros
                    scope.alterarExibicaoFiltros = function () {
                        scope.exibirFiltros = !scope.exibirFiltros;
                    };

                    // Função para obter contador de filtros ativos
                    scope.getContadorFiltrosAtivos = function () {
                        var contador = 0;
                        angular.forEach(scope.filtrosAtivos, function () {
                            contador++;
                        });
                        return contador;
                    };

                    // Watch para detectar mudanças na lista completa
                    var unwatchListaCompleta = scope.$watch("listaConsultaCompleta", function (novaLista) {
                        if (novaLista && novaLista.length > 0) {
                            // Reaplicar filtros se houver filtros ativos
                            if (scope.getContadorFiltrosAtivos() > 0) {
                                scope.aplicarFiltroColuna();
                            }
                        }
                    });

                    // Cleanup
                    scope.$on("$destroy", function () {
                        if (filtroColunaTimeout) {
                            $timeout.cancel(filtroColunaTimeout);
                        }
                        if (unwatchListaCompleta) {
                            unwatchListaCompleta();
                        }
                    });

                    elem.html(html);
                    $compile(elem.contents())(scope);
                }

                // Função para gerar o cabeçalho da tabela
                function gerarCabecalhoTabela(scope, parametros) {
                    var classes = FuncoesConsulta.gerarClassesBotoes("direita");
                    var classeBotoes = classes.classeBotoes;
                    var classeLista = classes.classeLista;

                    // Usar função do serviço para mesclar campos
                    var camposMesclados = FuncoesConsulta.mesclarCampos(parametros.listaConsulta, parametros.campos);

                    var htmlCabecalho = `
                    <div class="col-xs-12 linhaFiltrosListaConsultaTabela" ng-if="tela=='consulta'">
                        <div class="table-responsive">
                            <div class="table-container">
                                <table class="table table-striped table-hover">
                                    <thead>
                                        <tr>
                                            <td colspan="100%" class="linhaListaConsulta">
                                                <div class="row">
                                                    <div class="${classeLista}">
                                                        <div class="row">`;

                    // Criar cabeçalhos baseados nos campos mesclados
                    angular.forEach(camposMesclados, function (val, key) {
                        if (val.tipo != "oculto") {
                            var tamanhoColuna = val.md || 12;
                            var classeColuna = `col-xs-12 col-md-${tamanhoColuna}`;

                            var texto = "";
                            if (val.texto != undefined && val.texto !== null && val.texto !== "") {
                                texto = val.texto;
                            } else if (val.label != undefined && val.label !== null && val.label !== "") {
                                texto = val.label;
                            } else {
                                texto = key;
                            }

                            htmlCabecalho += `<div class="${classeColuna}">
                                    <strong>${texto}</strong>
                                </div>`;
                        }
                    });

                    htmlCabecalho += `
                                                        </div>
                                                    </div>
                                                    <div class="${classeBotoes}">
                                                        <strong>Ações</strong>                                                      
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr class="filtros-tabela">
                                            <td colspan="100%" class="linhaListaConsulta">
                                                <div class="row">
                                                    <div class="${classeLista}">
                                                        <div class="row">`;

                    // Criar filtros baseados nos campos mesclados
                    angular.forEach(camposMesclados, function (val, key) {
                        if (val.tipo != "oculto") {
                            var tamanhoColuna = val.md || 12;
                            var classeColuna = `col-xs-12 col-md-${tamanhoColuna}`;

                            var textoPlaceholder = "";
                            if (val.texto != undefined && val.texto !== null && val.texto !== "") {
                                textoPlaceholder = val.texto;
                            } else if (val.label != undefined && val.label !== null && val.label !== "") {
                                textoPlaceholder = val.label;
                            } else {
                                textoPlaceholder = key;
                            }

                            htmlCabecalho += `<div class="${classeColuna}">`;
                            htmlCabecalho += `<input type="text" class="form-control input-sm" placeholder="Filtrar ${textoPlaceholder}" ng-model="filtrosColuna['${key}']" ng-change="aplicarFiltroColuna()" ng-class="{'has-filters': filtrosAtivos['${key}']}">`;
                            htmlCabecalho += `</div>`;
                        }
                    });

                    htmlCabecalho += `
                                                        </div>
                                                    </div>
                                                    <div class="${classeBotoes}">
                                                        <div class="btn-group" role="group">
                                                            <button class="btn btn-xs btn-warning" ng-click="limparFiltrosLocal()" title="Limpar filtros" ng-disabled="getContadorFiltrosAtivos() == 0">
                                                                <i class="fa fa-eraser"></i> Limpar
                                                            </button>
                                                            <button type="button" class="btn btn-xs btn-info" ng-click="alterarExibicaoFiltros()" title="Alternar exibição de filtros">
                                                                <i class="fa fa-search"></i> Busca
                                                            </button>
                                                        </div>

                                                        </div>
                                                </div>
                                            </td>
                                        </tr>
                                    </thead>
                                </table>
                            </div>
                        </div>
                        <!-- Linha de resumo da lista -->
                        
                            <div class="col-xs-12">
                                <div class="pull-left font12">
                                    <strong>Total de itens:</strong> {{listaConsultaCompleta ? listaConsultaCompleta.length : 0}}
                                </div>
                                <div class="pull-right font12" >
                                    <strong>Exibindo:</strong> {{listaConsultaVisivel ? listaConsultaVisivel.length : 0}} itens
                                    <span ng-if="getContadorFiltrosAtivos && getContadorFiltrosAtivos() > 0" style="margin-left: 15px;">
                                        <i class="fa fa-filter text-success"></i> 
                                        <strong>{{getContadorFiltrosAtivos()}} filtro(s) ativo(s)</strong>
                                    </span>
                                </div>
                                <div class="clearfix"></div>
                            </div>
                        
                    </div>`;

                    return htmlCabecalho;
                }

                // Adicionar CSS para filtros ativos
                var css = `
                    <style>
                        .has-filters {
                            border-color: #5cb85c !important;
                            box-shadow: 0 0 5px rgba(92, 184, 92, 0.3) !important;
                        }
                        
                        .btn-group .btn {
                            margin-right: 2px;
                        }
                        
                        .btn-group .btn:last-child {
                            margin-right: 0;
                        }
                        
                        .resumo-lista {
                            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                            border: 1px solid #dee2e6;
                            border-radius: 5px;
                            padding: 10px 15px;
                            margin-bottom: 15px;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                        }
                        
                        .resumo-lista .pull-left,
                        .resumo-lista .pull-right {
                            font-size: 13px;
                        }
                        
                        .resumo-lista .text-success {
                            color: #28a745 !important;
                        }
                    </style>
                `;

                // Inserir CSS no head se ainda não existir
                if (!document.getElementById("filtros-css")) {
                    var styleElement = document.createElement("div");
                    styleElement.innerHTML = css;
                    styleElement.id = "filtros-css";
                    document.head.appendChild(styleElement);
                }
            },
        };
    },
]);
