/**
 * Diretiva listaConsulta
 * Responsável por exibir resultados da consulta com paginação e botões de ação
 */
angular.module('directivesPadrao').directive('listaConsulta', ['$compile', '$rootScope', '$parse', '$timeout', 'APIServ', 'EGFuncoes',
    function($compile, $rootScope, $parse, $timeout, APIServ, EGFuncoes) {
        return {
            restrict: 'EA',
            replace: false,
            templateUrl: '/src/api-front/js/directives/srcDirectivesPadrao/listaConsulta.html',
            scope: {
                campos: '=',
                dados: '=',
                paginacao: '=?',
                ordenacao: '=?',
                acoes: '=?',
                funcaoEditar: '&?',
                funcaoExcluir: '&?'
            },
            link: function(scope, element, attrs) {
                console.log('listaConsulta');
                
                // Inicializar variáveis
                scope.paginacao = scope.paginacao || {
                    paginaAtual: 1,
                    totalPaginas: 1,
                    itensPorPagina: 10,
                    totalItens: 0
                };
                
                scope.ordenacao = scope.ordenacao || {
                    campo: '',
                    direcao: 'asc'
                };
                
                scope.acoes = scope.acoes || [];
                
                // Verifica permissão para ações
                scope.temPermissao = function(acao) {
                    console.log(APIServ.buscaDadosLocais('usuario'));
                    
                    if (!scope.acoes || !angular.isArray(scope.acoes)) {
                        return false;
                    }
                    
                    return scope.acoes.some(function(a) {
                        return a.nome === acao;
                    });
                };
                
                // Executa ação nos botões
                scope.executarAcao = function(acao, item) {
                    var acaoObj = scope.acoes.find(function(a) {
                        return a.nome === acao;
                    });
                    
                    if (acaoObj && angular.isFunction(acaoObj.funcao)) {
                        acaoObj.funcao(item);
                    } else if (acao === 'alterar' && scope.funcaoEditar) {
                        scope.funcaoEditar({item: item});
                    } else if (acao === 'excluir' && scope.funcaoExcluir) {
                        scope.funcaoExcluir({item: item});
                    }
                };
                
                // Funções de paginação
                scope.mudarPagina = function(novaPagina) {
                    if (novaPagina < 1 || novaPagina > scope.paginacao.totalPaginas) {
                        return;
                    }
                    
                    scope.paginacao.paginaAtual = novaPagina;
                    
                    // Se há função de carregamento externa
                    if (scope.$parent.filtrar) {
                        scope.$parent.filtrar(novaPagina);
                    }
                };
                
                scope.getPaginas = function() {
                    var paginas = [];
                    var totalPaginas = scope.paginacao.totalPaginas;
                    var paginaAtual = scope.paginacao.paginaAtual;
                    
                    var inicio = Math.max(1, paginaAtual - 2);
                    var fim = Math.min(totalPaginas, paginaAtual + 2);
                    
                    // Sempre mostrar pelo menos 5 páginas se possível
                    if (fim - inicio + 1 < 5) {
                        if (inicio === 1) {
                            fim = Math.min(5, totalPaginas);
                        } else {
                            inicio = Math.max(1, fim - 4);
                        }
                    }
                    
                    for (var i = inicio; i <= fim; i++) {
                        paginas.push(i);
                    }
                    
                    return paginas;
                };
                
                // Ordenação de colunas
                scope.ordenarPor = function(campo) {
                    if (scope.ordenacao.campo === campo) {
                        scope.ordenacao.direcao = scope.ordenacao.direcao === 'asc' ? 'desc' : 'asc';
                    } else {
                        scope.ordenacao.campo = campo;
                        scope.ordenacao.direcao = 'asc';
                    }
                    
                    // Se há função de ordenação externa
                    if (scope.$parent.filtrar && scope.$parent.ordemFiltro !== undefined) {
                        scope.$parent.ordemFiltro = campo;
                        scope.$parent.sentidoFiltro = scope.ordenacao.direcao === 'asc' ? '' : 'desc';
                        scope.$parent.filtrar(scope.paginacao.paginaAtual);
                    }
                };
                
                // Calcular total de páginas quando os dados mudam
                scope.$watchCollection('dados', function(newVal) {
                    if (newVal && angular.isArray(newVal)) {
                        scope.paginacao.totalItens = newVal.length;
                        scope.paginacao.totalPaginas = Math.ceil(newVal.length / scope.paginacao.itensPorPagina) || 1;
                        
                        // Ajustar página atual se estiver fora de limites
                        if (scope.paginacao.paginaAtual > scope.paginacao.totalPaginas) {
                            scope.paginacao.paginaAtual = scope.paginacao.totalPaginas;
                        }
                    }
                });
                
                // Items da página atual
                scope.itensPaginaAtual = function() {
                    if (!scope.dados || !angular.isArray(scope.dados)) {
                        return [];
                    }
                    
                    var inicio = (scope.paginacao.paginaAtual - 1) * scope.paginacao.itensPorPagina;
                    var fim = inicio + scope.paginacao.itensPorPagina;
                    
                    return scope.dados.slice(inicio, fim);
                };
                
                // Exibir detalhes de um item
                scope.toggleDetalhes = function(item) {
                    item.exibirDetalhes = !item.exibirDetalhes;
                    
                    if (item.exibirDetalhes && !item.detalhes && scope.$parent.detalhar) {
                        scope.$parent.detalhar(item);
                    }
                };
            }
        };
    }
]);
