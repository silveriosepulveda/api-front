var app = angular.module("app");
// Diretiva para o cabeçalho da tabela de listaConsultaTabela
app.directive("cabecalhoListaConsultaTabela", [
    "$compile",
    "FuncoesConsulta",
    "$timeout",
    function ($compile, FuncoesConsulta, $timeout) {
        return {
            restrict: "E",
            replace: true,
            template: "",
            scope: false, // Herdar o scope do controller pai
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

                    // Função para obter contador de filtros ativos
                    scope.getContadorFiltrosAtivos = function () {
                        var contador = 0;
                        angular.forEach(scope.filtrosAtivos, function () {
                            contador++;
                        });
                        return contador;
                    };

                    // Função para obter valores únicos de uma coluna
                    scope.obterValoresUnicosColuna = function (nomeColuna) {
                        var listaBase = scope.listaConsultaCompleta || scope.listaConsulta || [];
                        var valoresUnicos = [];
                        var valoresVistos = {};

                        angular.forEach(listaBase, function (item) {
                            var valor = item[nomeColuna];
                            if (valor !== null && valor !== undefined && valor !== '') {
                                var valorStr = String(valor).trim();
                                if (!valoresVistos[valorStr]) {
                                    valoresVistos[valorStr] = true;
                                    valoresUnicos.push(valorStr);
                                }
                            }
                        });

                        // Ordenar valores
                        return valoresUnicos.sort();
                    };

                    // Função para limpar filtro individual
                    scope.limparFiltroIndividual = function (nomeColuna) {
                        scope.filtrosColuna[nomeColuna] = '';
                        scope.aplicarFiltroColuna();
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

                    // Adicionar CSS para o ícone de limpar no select
                    var css = `
                        <style>
                        .select-with-clear {
                            position: relative;
                            display: inline-block;
                            width: 100%;
                        }
                        
                        .select-clearable {
                            padding-right: 30px !important;
                            -webkit-appearance: none;
                            -moz-appearance: none;
                            appearance: none;
                            background-image: none !important;
                        }
                        
                        .clear-icon {
                            position: absolute;
                            right: 8px;
                            top: 50%;
                            transform: translateY(-50%);
                            cursor: pointer;
                            color: #999;
                            font-size: 14px;
                            z-index: 10;
                            padding: 2px;
                            border-radius: 2px;
                        }
                        
                        .clear-icon:hover {
                            color: #d9534f;
                            background-color: rgba(217, 83, 79, 0.1);
                        }
                        
                        .select-clearable:not(.has-filters) {
                            background-image: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'%3E%3Cpath fill='%23666' d='M2 0L0 2h4zm0 5L0 3h4z'/%3E%3C/svg%3E") !important;
                            background-repeat: no-repeat !important;
                            background-position: right 8px center !important;
                            background-size: 8px 10px !important;
                        }
                        
                        /* Para navegadores que não suportam appearance: none */
                        .select-clearable::-ms-expand {
                            display: none;
                        }
                        </style>
                    `;
                    
                    // Adicionar CSS ao head se ainda não foi adicionado
                    if (!document.getElementById('select-clear-css')) {
                        var styleElement = document.createElement('div');
                        styleElement.id = 'select-clear-css';
                        styleElement.innerHTML = css;
                        document.head.appendChild(styleElement);
                    }
                }

                // Função para gerar o cabeçalho da tabela
                function gerarCabecalhoTabela(scope, parametros) {
                    var classes = FuncoesConsulta.gerarClassesBotoes("direita");
                    var classeBotoes = classes.classeBotoes;
                    var classeLista = classes.classeLista;

                    // Usar função do serviço para mesclar campos
                    //var camposMesclados = FuncoesConsulta.mesclarCampos(parametros.listaConsulta, parametros.campos);
                    var camposMesclados = parametros.listaConsulta;

                    var htmlCabecalho = `
                <div class=" linhaFiltrosListaConsultaTabela" ng-if="tela=='consulta'">
                    <div class="table-responsive-excel">
                        <div class="table-container-excel-cabecalho">
                            <table class="table table-excel table-hover">
                                <thead>
                                    <tr>
                                        <td colspan="100%" class="linhaListaConsulta-excel">
                                            <div class="row-excel">
                                                <div class="${classeLista}">
                                                    <div class=" inicioItem-excel">`;

                    // Criar cabeçalhos baseados nos campos mesclados
                    angular.forEach(camposMesclados, function (val, key) {
                       // console.log(val, key);
                        
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

                            htmlCabecalho += `<div class="${classeColuna} campo-excel">
                                <strong class="texto-cabecalho-excel">${texto}</strong>
                            </div>`;
                        }
                    });

                    htmlCabecalho += `
                                                    </div>
                                                </div>
                                                <div class="${classeBotoes}">
                                                    <strong class="texto-cabecalho-excel">Ações</strong>                                                      
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr class="filtros-tabela-excel">
                                        <td colspan="100%" class="linhaListaConsultaCabecalho-excel">
                                            <div class="row row-excel">
                                                <div class="${classeLista}">
                                                    <div class="row inicioItem-excel">`;

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

                            htmlCabecalho += `<div class="${classeColuna} campo-excel">`;
                            
                            // Select com valores únicos e ícone de borracha customizado
                            htmlCabecalho += `<div class="select-with-clear">`;
                            htmlCabecalho += `<select class="form-control input-excel select-clearable" ng-model="filtrosColuna['${key}']" ng-change="aplicarFiltroColuna()" ng-class="{'has-filters': filtrosAtivos['${key}']}" data-field="${key}">`;
                            htmlCabecalho += `<option value="">Todos os ${textoPlaceholder}</option>`;
                            htmlCabecalho += `<option ng-repeat="valor in obterValoresUnicosColuna('${key}')" value="{{valor}}">{{valor}}</option>`;
                            htmlCabecalho += `</select>`;
                            htmlCabecalho += `<i class="fa fa-eraser clear-icon" ng-click="limparFiltroIndividual('${key}')" ng-show="filtrosAtivos['${key}']" title="Limpar filtro ${textoPlaceholder}"></i>`;
                            htmlCabecalho += `</div>`;
                            
                            htmlCabecalho += `</div>`;
                        }
                    });

                    htmlCabecalho += `
                                                    </div>
                                                </div>
                                                <div class="${classeBotoes}">
                                                    <div class="btn-group" role="group">
                                                        <button class="btn btn-excel btn-warning" ng-click="limparFiltrosLocal()" title="Limpar filtros" ng-disabled="getContadorFiltrosAtivos() == 0">
                                                            <i class="fa fa-eraser"></i> Limpar
                                                        </button>
                                                        <button type="button" class="btn btn-excel btn-info" ng-click="alterarExibicaoConsulta()" title="Alternar exibição de filtros">
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
                    <!-- Linha de resumo da lista compacta -->
                    <!--div class="resumo-lista-excel">
                        <div class="col-xs-12">
                            <div class="pull-left">
                                <strong>Total:</strong> {{listaConsultaCompleta ? listaConsultaCompleta.length : 0}}
                            </div>
                            <div class="pull-right">
                                <strong>Exibindo:</strong> {{listaConsultaVisivel ? listaConsultaVisivel.length : 0}}                                    
                            </div>
                            <div class="clearfix"></div>
                        </div>
                    </div-->
                </div>`;

                    return htmlCabecalho;
                }

                // CSS movido para formCabecalhoConsultaPadrao.css

                // CSS já está no arquivo formCabecalhoConsultaPadrao.css
            },
        };
    },
]);
