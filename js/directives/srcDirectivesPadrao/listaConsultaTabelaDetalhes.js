var app = angular.module("app");
app.directive("listaConsultaTabelaDetalhes", [
    "$rootScope",
    "$compile",
    "APIServ",
    "EGFuncoes",
    "APIAjuFor",
    "$timeout",
    function ($rootScope, $compile, APIServ, EGFuncoes, APIAjuFor, $timeout) {
        return {
            restrict: "E",
            replace: true,
            template: `
        <div class="modal-detalhes-item" ng-show="itemSelecionadoModal" ng-click="fecharModalDetalhes($event)">
            <div class="modal-detalhes-container" ng-click="$event.stopPropagation()">
                <div class="modal-detalhes-header">                    
                    <h4 class="modal-detalhes-titulo">{{estrutura.textoDetalhesConsulta || 'Detalhes'}}</h4>
                    <button type="button" class="btn-fechar-modal" ng-click="fecharModalDetalhes($event)" title="Fechar">
                        <span class="glyphicon glyphicon-remove"></span>
                    </button>
                </div>
                <div class="modal-detalhes-body">
                    <div class="fundoDetalheConsulta-excel">
                            <div class="row">
                                <div class="col-xs-12">
                                    <div id="conteudo-detalhes-modal"></div>
                                </div>
                            </div>
                    </div>
                </div>
            </div>
        </div>
    `,
            link: function (scope, elem) {
                console.log("detalhesItemConsultaTabela - Modal Global");

                // Variáveis para controlar o modal
                scope.itemSelecionadoModal = null;
                scope.indiceSelecionado = null;

                // Função para fechar modal
                scope.fecharModalDetalhes = function (event) {
                    if (event) {
                        event.preventDefault();
                        event.stopPropagation();
                    }

                    // Definir exibirDetalhes como false no item original da lista
                    if (scope.itemSelecionadoModal && scope.indiceSelecionado !== null) {
                        // Encontrar o item na lista e definir exibirDetalhes como false
                        if (scope.listaConsultaVisivel && scope.listaConsultaVisivel[scope.indiceSelecionado]) {
                            scope.listaConsultaVisivel[scope.indiceSelecionado].exibirDetalhes = false;
                        }
                        // Também verificar na lista completa
                        if (scope.listaConsultaCompleta && scope.listaConsultaCompleta[scope.indiceSelecionado]) {
                            scope.listaConsultaCompleta[scope.indiceSelecionado].exibirDetalhes = false;
                        }
                    }

                    scope.itemSelecionadoModal = null;
                    scope.indiceSelecionado = null;
                    scope.item = null; // Limpar também a variável item

                    // Forçar atualização da view
                    if (!scope.$$phase) {
                        scope.$apply();
                    }
                };

                // Watch para detectar quando algum item tem exibirDetalhes = true
                scope.$watch(
                    "listaConsultaVisivel",
                    function (novaLista) {
                        if (novaLista && !scope.itemSelecionadoModal) {
                            // Só processar se não há modal aberto
                            angular.forEach(novaLista, function (item, index) {
                                if (item.exibirDetalhes && !scope.itemSelecionadoModal) {
                                    scope.itemSelecionadoModal = item;
                                    scope.indiceSelecionado = index;
                                    scope.item = item; // Definir o item no escopo
                                    gerarConteudoDetalhes();
                                }
                            });
                        }
                    },
                    true
                );

                // Watch para quando o item selecionado mudar
                scope.$watch("itemSelecionadoModal", function (novoItem) {
                    if (novoItem) {
                        // Definir o item no escopo para que as diretivas funcionem
                        scope.item = novoItem;
                        gerarConteudoDetalhes();
                    }
                });

                function gerarConteudoDetalhes() {
                    if (!scope.itemSelecionadoModal || !scope.estrutura) return;

                    //Fazendo rotina para exibir detalhes quando for somente consulta
                    //20/11/2017 Acrescentei a juncao dos campos com os camposDetalhes quando existirem
                    var campos =
                        scope.estrutura.camposDetalhes != undefined
                            ? angular.merge(scope.estrutura.campos, scope.estrutura.camposDetalhes)
                            : scope.estrutura.campos;

                    var html = "";

                    var camposNaoMostrar = []; //Object.keys(scope.estrutura.listaConsulta);
                    let camposOcultarDetalhes = scope.estrutura.camposOcultarDetalhes != undefined ? scope.estrutura.camposOcultarDetalhes : [];
                    console.log(camposOcultarDetalhes, camposNaoMostrar);

                    angular.forEach(campos, function (val, key) {
                        var mostrar = !APIServ.valorExisteEmVariavel(camposOcultarDetalhes, key);
                        console.log(key, mostrar);
                        

                        if (mostrar) {
                            if (key.substr(0, 5) == "bloco") {
                                html += `<bloco-html-detalhe nome-bloco="${key}" indice="${scope.indiceSelecionado}"></bloco-html-detalhe>`;
                            } else if (val == "diretiva") {
                                let nomeDiretiva = APIAjuFor.variavelParaDiretiva(key);
                                html += `<${nomeDiretiva} indice="${scope.indiceSelecionado}"></${nomeDiretiva}>`;
                            } else if ((val.tipo == undefined || val.tipo != "oculto") && key.substr(0, 5) != "botao" && val.tipo != "senha") {
                                var mostrar = !APIServ.valorExisteEmVariavel(camposNaoMostrar, key);
                                if (mostrar) {
                                    html += `<html-detalhe campo="${key}" indice="${scope.indiceSelecionado}"></html-detalhe>`;
                                }
                            }
                        }
                    });

                    var conteudoElement = elem.find("#conteudo-detalhes-modal");
                    if (conteudoElement.length > 0) {
                        conteudoElement.html(html);
                        $compile(conteudoElement.contents())(scope);
                    }
                }
            },
        };
    },
]);