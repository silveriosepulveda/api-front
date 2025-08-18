directivesPadrao.directive("listaConsultaTabela", [
    "$compile",
    "APIServ",
    "EGFuncoes",
    "APIAjuFor",
    "FuncoesConsulta",
    function ($compile, APIServ, EGFuncoes, APIAjuFor, FuncoesConsulta) {
        return {
            restrict: "E",
            replace: true,
            template: "",
            link: function (scope, elem) {
                // Usar funções do serviço centralizado
                var acao = FuncoesConsulta.obterParametrosUrl(scope.acao);
                var infoUsuario = FuncoesConsulta.obterInformacoesUsuario();
                var usuario = infoUsuario.usuario;
                var admSistema = infoUsuario.admSistema;

                var parametros = scope.estrutura;

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

                /************************ CRIANDO OS CAMPOS DA LISTA **********************/
                // Verificar se há campos com habilitação de edição para definir habilitarSalvar
                angular.forEach(camposMesclados, function (val, key) {
                    if (val.tipo != "oculto") {
                        habilitarSalvar = val.habilitarEdicao || habilitarSalvar;
                    }
                });

                /***************************** FIM DOS CAMPOS DA LISTA  **********************************/

                /******************CRIANDO OS BOTOES DAS FUNCOES *******************************************/
                var htmlBotoes = `<div class="col-acoes">`;

                if (
                    (parametros.funcaoDetalhar == undefined || parametros.funcaoDetalhar != "desativada") &&
                    (parametros.ocultarDetalhes == undefined || !parametros.ocultarDetalhes)
                ) {
                    var funcaoDet = parametros.funcaoDetalhar != undefined ? parametros.funcaoDetalhar : "detalhar";
                    htmlBotoes += `<button type="button" name="button" class="btn btn-modern btn-outline-secondary glyphicon"
                ng-class="{'glyphicon-plus' : !item.exibirDetalhes, 'glyphicon-minus':item.exibirDetalhes}" title="Ver Detalhes"  ng-click=${funcaoDet}(item)></button>`;
                }

                var funcaoAlt = parametros.funcaoAlterar != undefined ? parametros.funcaoAlterar : "alterar";
                var textoBotaoAlterar = parametros.textoBotaoAlterar != undefined ? parametros.textoBotaoAlterar : "";
                var iconeBotaoAlterar =
                    parametros.ocultarIconeBotaoAlterar == undefined || !parametros.ocultarIconeBotaoAlterar ? "glyphicon-pencil glyphicon" : "";
                var classesBotaoAlterar =
                    parametros.classesBotaoAlterar == undefined || !parametros.classesBotaoAlterar
                        ? "btn-modern btn-outline-primary"
                        : parametros.classesBotaoAlterar;
                var ocultarAlterar = parametros.ocultarAlterar != undefined ? `ng-if="${parametros.ocultarAlterar}"` : "";
                htmlBotoes += `<button type="button" class="btn ${classesBotaoAlterar} ${iconeBotaoAlterar}" title="Alterar ${parametros.nomeUsual}" ng-click="${funcaoAlt}(item)"
                        ${ocultarAlterar}>${textoBotaoAlterar}</button>`;

                var funcaoExc = parametros.funcaoExcluir != undefined ? parametros.funcaoExcluir : "excluir";
                var ocultarExcluir = parametros.ocultarExcluir != undefined ? `ng-if="${parametros.ocultarExcluir}"` : "";
                htmlBotoes += `<button type="button" class="btn btn-modern btn-outline-danger glyphicon glyphicon-trash" title="Excluir ${parametros.nomeUsual}" ng-click="${funcaoExc}(item)"
                        ${ocultarExcluir}></button>`;

                if (habilitarSalvar) {
                    htmlBotoes += `
                    <button type="button" class="btn btn-modern btn-success glyphicon glyphicon-ok" ng-click="salvarAlteracoesItem(item, $event)" ng-if="item.habilitarSalvar">
                    <button type="button" class="btn btn-modern btn-danger glyphicon glyphicon-remove-circle" ng-click="cancelarAlteracoesItem(item, $event)" ng-if="item.habilitarSalvar">
                `;
                }

                if (parametros.acoesItensConsulta != undefined) {
                    angular.forEach(parametros.acoesItensConsulta, function (val, key) {
                        if (val == "anexos") {
                            htmlBotoes += `<input-botao parametros="${val}"></input-botao>`; // EGFuncoes.montarBotao(parametros.anexos);
                        } else if (val == "diretiva" || (val.tipo != undefined && val.tipo == "diretiva")) {
                            var nomeDiretiva = val.nomeDiretiva != undefined ? val.nomeDiretiva : key;
                            nomeDiretiva = APIAjuFor.variavelParaDiretiva(nomeDiretiva);
                            htmlBotoes += `<${nomeDiretiva} campo="${key}"></${nomeDiretiva}>`;
                        } else if (val.tipo == "caixaSelecao") {
                            htmlBotoes += `<span class="form-inline"><input type="checkbox" ng-model="item.${key}" ng-click="selecionarItemConsulta(key, item)"></span>`;
                        } else {
                            val["tipo"] = "button";
                            htmlBotoes += `<input-botao parametros="${key}"></input-botao>`; // EGFuncoes.montarBotao(val);
                        }
                    });
                }

                htmlBotoes += `</div>`;
                /*********************** FIM DOS BOTOES ******************************/

                var filtro = "";
                if (scope.estrutura.camposFiltroPersonalizado != undefined && Object.keys(scope.estrutura.camposFiltroPersonalizado).length > 0) {
                    filtro = "{";
                    var cont = 1;
                    for (var i in scope.estrutura.camposFiltroPersonalizado) {
                        filtro += i + ":" + scope.estrutura.raizModelo + "." + i;

                        filtro += cont < Object.keys(scope.estrutura.camposFiltroPersonalizado).length ? "," : "";
                        cont++;
                    }
                    filtro += "}";
                    scope.filtroResultado = filtro;
                } else {
                    filtro = "filtroResultado";
                    scope.filtroResultado = "";
                }

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
                        // Calcular tamanho da coluna baseado no valor md do campo
                        var tamanhoColuna = val.md || 12; // Padrão: 12 colunas (largura total)
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
                        html += `<input-botao parametros="${key}" ng-if="tela=='consulta'"></input-botao>`; // montarBotao(val);
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

                elem.html(html);
                $(elem).css("margin-top", "400px !important");

                // SISTEMA DE LAZY LOADING OTIMIZADO
                scope.listaConsultaVisivel = [];
                scope.carregandoMaisItens = false;
                scope.temMaisItens = true;
                scope.itensPorCarregamento = 15; // Carregar 15 itens por vez
                scope.ultimaPaginaCarregada = 0;
                scope.listaConsultaCompleta = []; // Lista completa original

                // Sistema de filtros por coluna - Funções movidas para cabecalhoConsulta.js
                // scope.filtrosColuna e scope.aplicarFiltroColuna são definidos no cabecalhoConsulta.js

                // Watch para detectar mudanças na lista original e reaplicar filtros
                scope.$watch("listaConsultaCompleta", function (novaLista) {
                    if (novaLista && novaLista.length > 0) {
                        // Se há filtros ativos, reaplicar
                        var temFiltrosAtivos = false;
                        angular.forEach(scope.filtrosColuna, function (valor) {
                            if (valor && valor.trim() !== "") {
                                temFiltrosAtivos = true;
                            }
                        });

                        if (temFiltrosAtivos) {
                            scope.aplicarFiltroColuna();
                        }
                    }
                });

                // Variáveis para controle do filtro de resultado
                scope.listaConsultaCompleta = []; // Lista completa original (fonte de dados)
                scope.listaConsultaFiltrada = []; // Lista filtrada (resultado do filtro)
                scope.filtroResultadoAtivo = "";

                // Variável para controle de debounce do filtro
                var filtroTimeout = null;

                // Inicializar lista visível quando listaConsulta mudar
                scope.$watch("listaConsulta", function (novaLista) {
                    console.log("=== WATCH LISTA CONSULTA CHAMADO ===");
                    console.log("novaLista.length:", novaLista ? novaLista.length : "null");

                    if (novaLista && novaLista.length > 0) {
                        console.log("=== INICIANDO LAZY LOADING ===");
                        console.log("novaLista.length:", novaLista.length);

                        // Salvar como lista completa
                        scope.listaConsultaCompleta = angular.copy(novaLista);
                        console.log("listaConsultaCompleta definida:", scope.listaConsultaCompleta.length);

                        // Inicializar lazy loading
                        scope.listaConsultaVisivel = [];
                        scope.ultimaPaginaCarregada = 0;
                        scope.temMaisItens = true;
                        scope.carregandoMaisItens = false;

                        // Carregar primeiros itens
                        scope.carregarMaisItens();
                    } else {
                        console.log("Lista vazia ou null");
                        scope.listaConsultaVisivel = [];
                        scope.temMaisItens = false;
                    }
                });

                // Função para filtrar itens da lista baseado no filtroResultado
                scope.aplicarFiltroResultado = function () {
                    if (!scope.listaConsultaCompleta || scope.listaConsultaCompleta.length === 0) {
                        scope.listaConsultaFiltrada = [];
                        // Evitar trigger do watch durante atualização interna
                        watchingUpdate = true;
                        scope.listaConsulta = [];
                        setTimeout(function () {
                            watchingUpdate = false;
                        }, 0);
                        return;
                    }

                    var filtro = scope.filtroResultadoAtivo;
                    if (!filtro || filtro === "") {
                        // Se não há filtro, usar lista completa
                        scope.listaConsultaFiltrada = angular.copy(scope.listaConsultaCompleta);
                    } else {
                        // Aplicar filtro na lista completa
                        scope.listaConsultaFiltrada = scope.listaConsultaCompleta.filter(function (item) {
                            return scope.itemPassaNoFiltro(item, filtro);
                        });
                    }

                    // Atualizar listaConsulta com o resultado filtrado (evitar trigger do watch)
                    watchingUpdate = true;
                    scope.listaConsulta = angular.copy(scope.listaConsultaFiltrada);
                    setTimeout(function () {
                        watchingUpdate = false;
                    }, 0);

                    // Resetar lista visível para mostrar itens filtrados
                    scope.listaConsultaVisivel = [];
                    scope.ultimaPaginaCarregada = 0;
                    scope.temMaisItens = scope.listaConsultaFiltrada.length > 0;

                    // Carregar primeiros itens imediatamente se há dados
                    if (scope.listaConsultaFiltrada.length > 0) {
                        scope.ultimaPaginaCarregada = 1;
                        scope.$evalAsync(function () {
                            scope.carregarDaListaAtual();
                        });
                    }
                };

                // Função para verificar se um item passa no filtro
                scope.itemPassaNoFiltro = function (item, filtro) {
                    if (!filtro || filtro === "") return true;

                    var filtroLower = filtro.toLowerCase();

                    // Buscar em todas as propriedades do item
                    for (var prop in item) {
                        if (item.hasOwnProperty(prop) && item[prop] !== null && item[prop] !== undefined) {
                            var valor = item[prop].toString().toLowerCase();
                            if (valor.indexOf(filtroLower) !== -1) {
                                return true;
                            }
                        }
                    }
                    return false;
                };

                // Função para aplicar filtro de forma imediata (sem debounce)
                scope.aplicarFiltroImediato = function (filtro) {
                    scope.filtroResultadoAtivo = filtro || "";

                    // Cancelar timeout pendente
                    if (filtroTimeout) {
                        clearTimeout(filtroTimeout);
                        filtroTimeout = null;
                    }

                    scope.aplicarFiltroResultado();
                };

                // Função para limpar o filtro
                scope.limparFiltroResultado = function () {
                    // Cancelar timeout pendente
                    if (filtroTimeout) {
                        clearTimeout(filtroTimeout);
                        filtroTimeout = null;
                    }

                    // Limpar o campo visual diretamente
                    $("#filtro_resultado").val("");

                    // Limpar as variáveis do scope
                    scope.filtroResultado = "";
                    scope.filtroResultadoAtivo = "";

                    // Aplicar a limpeza do filtro
                    scope.aplicarFiltroResultado();

                    // Forçar atualização do Angular se necessário
                    if (!scope.$$phase && !scope.$root.$$phase) {
                        scope.$apply();
                    }
                };

                // Watch para alterações no filtroResultado com debounce
                scope.$watch("filtroResultado", function (novoFiltro, filtroAnterior) {
                    // Cancelar timeout anterior se existir
                    if (filtroTimeout) {
                        clearTimeout(filtroTimeout);
                    }

                    // Aplicar filtro com debounce para evitar execuções desnecessárias
                    filtroTimeout = setTimeout(function () {
                        scope.$apply(function () {
                            scope.filtroResultadoAtivo = novoFiltro || "";
                            scope.aplicarFiltroResultado();
                        });
                        filtroTimeout = null;
                    }, 300); // 300ms de debounce
                });

                // Watch adicional sem debounce para detectar mudanças muito rápidas
                var ultimoFiltroAplicado = "";
                scope.$watch("filtroResultado", function (novoFiltro) {
                    // Se o filtro mudou muito rápido e ainda não foi aplicado
                    if (novoFiltro !== ultimoFiltroAplicado && filtroTimeout) {
                        ultimoFiltroAplicado = novoFiltro;

                        // Para strings muito curtas ou vazias, aplicar imediatamente
                        if (!novoFiltro || novoFiltro.length <= 2) {
                            clearTimeout(filtroTimeout);
                            scope.aplicarFiltroImediato(novoFiltro);
                            filtroTimeout = null;
                        }
                    }
                });

                // FUNÇÕES DE LAZY LOADING OTIMIZADAS

                // Função para carregar mais itens
                scope.carregarMaisItens = function () {
                    if (scope.carregandoMaisItens || !scope.temMaisItens) {
                        console.log("Retornando - já carregando ou não tem mais itens");
                        return;
                    }

                    // Verificar se já carregamos todos os itens
                    if (scope.listaConsultaVisivel.length >= scope.listaConsultaCompleta.length) {
                        console.log("Todos os itens já foram carregados");
                        scope.temMaisItens = false;
                        return;
                    }

                    scope.carregandoMaisItens = true;
                    console.log("Iniciando carregamento de mais itens");

                    // Simular delay de carregamento (pode ser removido em produção)
                    setTimeout(function () {
                        scope.carregarDaListaAtual();
                    }, 200);
                };

                // Função para carregar dados da lista atual
                scope.carregarDaListaAtual = function () {
                    // Usar sempre listaConsultaCompleta como fonte
                    var listaParaUsar = scope.listaConsultaCompleta || [];

                    if (listaParaUsar && listaParaUsar.length > 0) {
                        // Calcular quantos itens já foram carregados
                        var itensJaCarregados = scope.listaConsultaVisivel.length;

                        // Calcular quantos itens ainda faltam carregar
                        var itensRestantes = listaParaUsar.length - itensJaCarregados;

                        // Determinar quantos itens carregar nesta vez
                        var itensParaCarregar = Math.min(scope.itensPorCarregamento, itensRestantes);

                        if (itensParaCarregar > 0) {
                            // Pegar os próximos itens da lista completa
                            var novosItens = listaParaUsar.slice(itensJaCarregados, itensJaCarregados + itensParaCarregar);

                            // Adicionar novos itens à lista visível
                            scope.listaConsultaVisivel = scope.listaConsultaVisivel.concat(novosItens);
                            scope.temMaisItens = itensJaCarregados + itensParaCarregar < listaParaUsar.length;
                        } else {
                            scope.temMaisItens = false;
                            console.log("Nenhum item novo para carregar");
                        }
                    } else {
                        scope.listaConsultaVisivel = [];
                        scope.temMaisItens = false;
                        console.log("Lista vazia");
                    }

                    scope.carregandoMaisItens = false;

                    // Aplicar escopo apenas se não estamos dentro de um digest
                    if (!scope.$$phase && !scope.$root.$$phase) {
                        scope.$apply();
                    }
                };

                // Função para carregar todos os itens de uma vez
                scope.carregarTodosItens = function () {
                    console.log("=== carregarTodosItens chamado ===");
                    scope.listaConsultaVisivel = angular.copy(scope.listaConsultaCompleta);
                    scope.temMaisItens = false;
                    scope.carregandoMaisItens = false;
                    console.log("Todos os itens carregados:", scope.listaConsultaVisivel.length);
                };

                // Configurar scroll infinito
                setTimeout(function () {
                    var scrollTimeout = null;

                    // Usar scroll da window para detectar quando chegar ao final
                    $(window).on("scroll", function () {
                        // Cancelar timeout anterior para evitar múltiplas chamadas
                        if (scrollTimeout) {
                            clearTimeout(scrollTimeout);
                        }

                        scrollTimeout = setTimeout(function () {
                            if ($(window).scrollTop() + $(window).height() >= $(document).height() - 100) {
                                if (!scope.carregandoMaisItens && scope.temMaisItens) {
                                    console.log("=== SCROLL DETECTADO - Carregando mais itens ===");
                                    scope.$apply(function () {
                                        scope.carregarMaisItens();
                                    });
                                }
                            }
                        }, 100); // Debounce de 100ms
                    });
                }, 500);

                $compile(elem.contents())(scope);
            },
        };
    },
]);

// Diretiva para o cabeçalho da tabela de listaConsultaTabela
directivesPadrao.directive("cabecalhoListaConsultaTabela", [
    "$compile",
    "FuncoesConsulta",
    function ($compile, FuncoesConsulta) {
        return {
            restrict: "E",
            replace: true,
            template: "",
            link: function (scope, elem) {
                // Verificar se deve exibir o cabeçalho da tabela
                if (scope.estrutura.tipoListaConsulta === "tabela" && scope.tela === "consulta") {
                    var parametros = scope.estrutura;
                    var html = gerarCabecalhoTabela(scope, parametros);

                    // Adicionar funções de filtro ao escopo
                    scope.filtrosColuna = {};
                    var filtroColunaTimeout = null;

                    // Função para aplicar filtros por coluna
                    scope.aplicarFiltroColuna = function () {
                        // Cancelar timeout anterior se existir
                        if (filtroColunaTimeout) {
                            clearTimeout(filtroColunaTimeout);
                        }

                        // Aplicar filtro com debounce
                        filtroColunaTimeout = setTimeout(function () {
                            // Usar sempre listaConsultaCompleta como base
                            var listaBase = scope.listaConsultaCompleta || scope.listaConsulta || [];

                            console.log("=== aplicarFiltroColuna ===");
                            console.log("listaBase.length:", listaBase.length);

                            var listaFiltrada = angular.copy(listaBase);

                            // Aplicar filtros para cada coluna
                            angular.forEach(scope.filtrosColuna, function (valorFiltro, nomeColuna) {
                                if (valorFiltro && valorFiltro.trim() !== "") {
                                    listaFiltrada = listaFiltrada.filter(function (item) {
                                        var valorItem = item[nomeColuna];
                                        if (valorItem === null || valorItem === undefined) {
                                            return false;
                                        }
                                        // Converter para string para comparação
                                        var valorItemStr = String(valorItem).toLowerCase();
                                        var valorFiltroStr = valorFiltro.toLowerCase();
                                        return valorItemStr.indexOf(valorFiltroStr) !== -1;
                                    });
                                }
                            });

                            console.log("listaFiltrada.length:", listaFiltrada.length);

                            // Para filtros, mostrar todos os itens filtrados
                            scope.$apply(function () {
                                scope.listaConsultaVisivel = listaFiltrada;
                                scope.temMaisItens = false; // Não há mais itens para carregar quando filtrado
                            });
                        }, 300); // Debounce de 300ms
                    };

                    // Função para limpar filtros
                    scope.limparFiltrosLocal = function () {
                        scope.filtrosColuna = {};
                        scope.listaConsultaVisivel = scope.listaConsultaCompleta || scope.listaConsulta || [];
                        scope.temMaisItens = scope.listaConsultaCompleta && scope.listaConsultaCompleta.length > scope.listaConsultaVisivel.length;
                    };

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
                    <div class="col-xs-12" ng-if="tela=='consulta'">
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
                            // Calcular tamanho da coluna baseado no valor md do campo
                            var tamanhoColuna = val.md || 12; // Padrão: 12 colunas (largura total)
                            var classeColuna = `col-xs-12 col-md-${tamanhoColuna}`;

                            // Verificar se o campo tem texto definido, caso contrário usar o key
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
                            // Calcular tamanho da coluna baseado no valor md do campo
                            var tamanhoColuna = val.md || 12; // Padrão: 12 colunas (largura total)
                            var classeColuna = `col-xs-12 col-md-${tamanhoColuna}`;

                            // Verificar se o campo tem texto definido para o placeholder
                            var textoPlaceholder = "";
                            if (val.texto != undefined && val.texto !== null && val.texto !== "") {
                                textoPlaceholder = val.texto;
                            } else if (val.label != undefined && val.label !== null && val.label !== "") {
                                textoPlaceholder = val.label;
                            } else {
                                textoPlaceholder = key;
                            }

                            htmlCabecalho += `<div class="${classeColuna}">`;
                            htmlCabecalho += `<input type="text" class="form-control input-sm" placeholder="Filtrar ${textoPlaceholder}" ng-model="filtrosColuna['${key}']" ng-change="aplicarFiltroColuna()">`;
                            htmlCabecalho += `</div>`;
                        }
                    });

                    htmlCabecalho += `
                                                        </div>
                                                    </div>
                                                    <div class="${classeBotoes}">
                                                        <button class="btn btn-xs btn-warning" ng-click="limparFiltrosLocal()" title="Limpar filtros" style="margin-left: 5px; padding: 2px 4px;">
                                                            <i class="fa fa-times"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    </thead>
                                </table>
                            </div>
                        </div>
                    </div>`;

                    return htmlCabecalho;
                }
            },
        };
    },
]);
