var app = angular.module("app");
app.directive("rodape", [
    "$compile",
    "EGFuncoes",
    function ($compile, EGFuncoes) {
        return {
            restrict: "E",
            replace: true,
            scope: false, // Herdar o scope do controller pai
            link: function (scope, element) {
                scope.obterClassesTamanho = function (parametros) {
                    return EGFuncoes.montarTamanhos(parametros).join(" ");
                };

                // Função para converter valor formatado brasileiro para número
                function converterValorFormatado(valor) {
                    if (!valor || valor === "") return 0;

                    // Se já é um número, retorna como está
                    if (typeof valor === "number") return valor;

                    // Converte string formatada para número
                    var valorString = valor.toString();

                    // Remove R$ e espaços
                    valorString = valorString.replace(/R\$\s*/g, "");

                    // Remove pontos (separadores de milhares)
                    valorString = valorString.replace(/\./g, "");

                    // Substitui vírgula por ponto (separador decimal)
                    valorString = valorString.replace(",", ".");

                    // Converte para número
                    var numero = parseFloat(valorString);

                    return isNaN(numero) ? 0 : numero;
                }

                // Função para formatar número para moeda brasileira
                function formatarMoeda(valor) {
                    return (
                        "R$ " +
                        valor
                            .toFixed(2)
                            .replace(".", ",")
                            .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.")
                    );
                }

                // Função para formatar número brasileiro
                function formatarNumero(valor) {
                    return valor.toFixed(2).replace(".", ",");
                }

                // Função para calcular os valores do resumo baseado nos dados filtrados
                scope.calcularResumoConsulta = function () {
                    if (!scope.estrutura || !scope.estrutura.resumoConsulta) {
                        return;
                    }

                    // console.log(scope.estrutura.resumoConsulta);
                    // console.log(scope.resumoConsulta);
                    
                    

                    // Inicializa o objeto resumoConsulta se não existir
                    if (!scope.resumoConsulta) {
                        scope.resumoConsulta = {};
                    }

                    // Obtém os dados corretos baseados no estado dos filtros
                    var dadosLista = [];

                    // Verificar se há filtros ativos
                    var temFiltrosAtivos = false;
                    if (scope.filtrosAtivos) {
                        angular.forEach(scope.filtrosAtivos, function () {
                            temFiltrosAtivos = true;
                        });
                    }

                    // Disponibilizar no escopo para uso no template
                    scope.temFiltrosAtivos = temFiltrosAtivos;

                    if (temFiltrosAtivos) {
                        // Se há filtros ativos, usar listaConsultaVisivel (que contém todos os dados filtrados)
                        // Quando há filtros, o sistema coloca todos os dados filtrados em listaConsultaVisivel
                        dadosLista = scope.listaConsultaVisivel || [];
                    } else {
                        // Se não há filtros, usar listaConsultaCompleta (todos os dados)
                        dadosLista = scope.listaConsultaCompleta || scope[scope.estrutura.raizModelo] || [];
                    }

                    // Para cada item configurado no resumoConsulta
                    angular.forEach(scope.estrutura.resumoConsulta, function (config, key) {
                        var valor = 0;

                        if (config.operacao === "soma") {
                            // Calcula a soma do campo especificado
                            angular.forEach(dadosLista, function (item) {
                                if (item && item[key] !== undefined && item[key] !== null) {
                                    var valorItem = converterValorFormatado(item[key]);
                                    valor += valorItem;
                                }
                            });
                        } else if (config.operacao === "contagem") {
                            // Conta quantos itens existem
                            valor = dadosLista.length;
                        } else if (config.operacao === "media") {
                            // Calcula a média do campo especificado
                            var soma = 0;
                            var contador = 0;
                            angular.forEach(dadosLista, function (item) {
                                if (item && item[key] !== undefined && item[key] !== null) {
                                    var valorItem = converterValorFormatado(item[key]);
                                    soma += valorItem;
                                    contador++;
                                }
                            });
                            valor = contador > 0 ? soma / contador : 0;
                        }else if (config.operacao === "texto") {
                            valor = dadosLista != undefined && dadosLista.length > 0 && dadosLista[0][key] != undefined ? dadosLista[0][key] : 0;
                        }

                        // Formata o valor para exibição na tela
                        if (config.formato === "moeda") {
                            scope.resumoConsulta[key] = formatarMoeda(valor);
                        } else if (config.formato === "numero") {
                            scope.resumoConsulta[key] = formatarNumero(valor);
                        } else {
                            // Por padrão, formata como moeda para valores monetários
                            scope.resumoConsulta[key] = formatarMoeda(valor);
                        }
                    });
                };

                // Função para obter a quantidade correta de registros
                scope.obterQuantidadeRegistros = function () {
                    // Verificar se há filtros ativos
                    var temFiltrosAtivos = false;
                    if (scope.filtrosAtivos) {
                        angular.forEach(scope.filtrosAtivos, function () {
                            temFiltrosAtivos = true;
                        });
                    }

                    if (temFiltrosAtivos && scope.listaConsultaVisivel) {
                        return scope.listaConsultaVisivel.length;
                    } else if (scope.listaConsulta) {
                        return scope.listaConsulta.length;
                    }
                    return 0;
                };

                // Observa mudanças na lista de dados para recalcular automaticamente
                scope.$watch(
                    "listaConsultaVisivel",
                    function () {
                        scope.calcularResumoConsulta();
                    },
                    true
                );

                // Observa mudanças na lista filtrada para recalcular quando filtros mudarem
                scope.$watch(
                    "listaConsultaFiltrada",
                    function () {
                        scope.calcularResumoConsulta();
                    },
                    true
                );

                // Observa mudanças na lista completa para recalcular
                scope.$watch(
                    "listaConsultaCompleta",
                    function () {
                        scope.calcularResumoConsulta();
                    },
                    true
                );

                // Observa mudanças nos filtros ativos para recalcular
                scope.$watch(
                    "filtrosAtivos",
                    function () {
                        scope.calcularResumoConsulta();
                    },
                    true
                );

                // Observa mudanças na estrutura para recalcular
                scope.$watch(
                    "estrutura.resumoConsulta",
                    function () {
                        scope.calcularResumoConsulta();
                    },
                    true
                );

                // Calcula o resumo inicial
                scope.calcularResumoConsulta();
                    

                let html = `
                <div class="rodape bordasuperior">
                    <div class="col-xs-12 resumoConsulta">                                 
                        <div class="row">
                            <div class="col-xs-12 col-md-2 divItemLista itemResumoConsulta" ng-if="listaConsulta && listaConsulta.length > 0">                            
                                <strong>Total de registros:</strong> {{obterQuantidadeRegistros()}} / {{listaConsulta.length}}
                            </div>
                            <div class="col-xs-12 col-md-2 divItemLista itemResumoConsulta" ng-if="!listaConsulta || listaConsulta.length === 0">
                                Nenhum registro encontrado
                            </div>                    
                            <div class="col-md-8 col-xs-12">
                            <div class="row">
                                <div ng-class="obterClassesTamanho(estrutura.resumoConsulta[key])" 
                                    class="divitemLista div6 itemResumoConsulta"
                                    ng-repeat="(key, val) in resumoConsulta">
                                    <span>{{estrutura.resumoConsulta[key]['texto']}}: <label>{{val}}</label></span>
                                </div>
                            </div>
                        </div>                                    
                    </div>
                </div>
            </div>
              `;
                element.html(html);
                $compile(element.contents())(scope);
            },
        };
    },
]);
