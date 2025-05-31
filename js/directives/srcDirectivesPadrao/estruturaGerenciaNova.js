/**
 * Estrutura Gerencia Modernizada
 * Versão 2.0 - Refatorada com separação de arquivos
 * Sistema de filtros dinâmicos, grid responsivo e sub-diretivas integradas
 */

angular.module('segmedApp').directive('estruturaGerencia', function($compile, $templateCache, $timeout) {
    return {
        restrict: 'EA',
        scope: true,
        replace: false,
        templateUrl: '/api/js/directives/srcDirectivesPadrao/estruturaGerencia.html',
        link: function(scope, element, attrs) {
            
            // ===== CONFIGURAÇÃO INICIAL =====
            var configPadrao = {
                tela: 'consulta',
                tipoCrud: 'lista',
                exibirCabecalho: true,
                exibirFormulario: true,
                gridColunas: 12,
                filtrosPrecedencia: true // camposFiltroPesquisa > campos
            };
            
            // Aplicar configurações padrão
            angular.forEach(configPadrao, function(valor, chave) {
                if (angular.isUndefined(scope[chave])) {
                    scope[chave] = valor;
                }
            });
            
            // ===== SISTEMA DE FILTROS DINÂMICOS =====
            
            /**
             * Mescla campos com precedência: camposFiltroPesquisa > campos
             */
            function mesclaCamposFiltro() {
                scope.camposFiltroMesclados = [];
                
                // Prioridade 1: camposFiltroPesquisa
                if (scope.camposFiltroPesquisa && angular.isArray(scope.camposFiltroPesquisa)) {
                    scope.camposFiltroMesclados = angular.copy(scope.camposFiltroPesquisa);
                }
                
                // Prioridade 2: campos (apenas se não existe camposFiltroPesquisa)
                else if (scope.campos && angular.isArray(scope.campos)) {
                    scope.camposFiltroMesclados = angular.copy(scope.campos);
                }
                
                return scope.camposFiltroMesclados;
            }
            
            /**
             * Processa grid responsivo baseado em classes Bootstrap
             */
            function processaGridResponsivo(campos) {
                if (!campos || !angular.isArray(campos)) return [];
                
                return campos.map(function(campo) {
                    if (!campo.grid) {
                        // Grid padrão se não especificado
                        campo.grid = { md: 6, sm: 12, xs: 12 };
                    }
                    
                    // Gerar classes CSS do grid
                    var classes = [];
                    ['xs', 'sm', 'md', 'lg'].forEach(function(breakpoint) {
                        if (campo.grid[breakpoint]) {
                            classes.push('col-' + breakpoint + '-' + campo.grid[breakpoint]);
                        }
                    });
                    campo.classesGrid = classes.join(' ');
                    
                    return campo;
                });
            }
            
            // ===== CONTROLE DE TELA =====
            
            scope.alternarTela = function(novaTela) {
                if (['consulta', 'cadastro'].indexOf(novaTela) !== -1) {
                    scope.tela = novaTela;
                    scope.$broadcast('mudancaTela', { tela: novaTela });
                }
            };
            
            scope.isTelaConsulta = function() {
                return scope.tela === 'consulta';
            };
            
            scope.isTelaCadastro = function() {
                return scope.tela === 'cadastro';
            };
            
            // ===== MÁSCARAS DE FORMATAÇÃO =====
            
            var mascaras = {
                cpfCnpj: function(valor) {
                    if (!valor) return '';
                    valor = valor.replace(/\D/g, '');
                    if (valor.length <= 11) {
                        return valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                    } else {
                        return valor.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
                    }
                },
                telefone: function(valor) {
                    if (!valor) return '';
                    valor = valor.replace(/\D/g, '');
                    if (valor.length === 10) {
                        return valor.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
                    } else if (valor.length === 11) {
                        return valor.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                    }
                    return valor;
                },
                cep: function(valor) {
                    if (!valor) return '';
                    return valor.replace(/(\d{5})(\d{3})/, '$1-$2');
                },
                data: function(valor) {
                    if (!valor) return '';
                    return valor.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3');
                }
            };
            
            scope.aplicarMascara = function(campo, valor) {
                if (!campo.mascara || !valor) return valor;
                
                var funcaoMascara = mascaras[campo.mascara];
                return funcaoMascara ? funcaoMascara(valor) : valor;
            };
            
            // ===== INTEGRAÇÃO COM SUB-DIRETIVAS =====
            
            /**
             * Configuração para cabecalhoConsulta
             */
            scope.configurarCabecalho = function() {
                return {
                    campos: scope.camposFiltroMesclados,
                    filtro: scope.filtro || {},
                    funcaoPesquisar: scope.pesquisar,
                    funcaoLimpar: scope.limparFiltros,
                    exibirBotaoNovo: scope.exibirBotaoNovo !== false
                };
            };
            
            /**
             * Configuração para listaConsulta
             */
            scope.configurarLista = function() {
                return {
                    campos: scope.campos,
                    dados: scope.dados || [],
                    paginacao: scope.paginacao,
                    ordenacao: scope.ordenacao,
                    acoes: scope.acoes
                };
            };
            
            /**
             * Configuração para formularioCadastro
             */
            scope.configurarFormulario = function() {
                return {
                    campos: scope.campos,
                    modelo: scope.modelo || {},
                    validacao: scope.validacao,
                    funcaoSalvar: scope.salvar,
                    funcaoCancelar: scope.cancelar
                };
            };
            
            // ===== FUNÇÕES DE APOIO =====
            
            scope.pesquisar = function() {
                if (angular.isFunction(scope.funcaoPesquisar)) {
                    scope.funcaoPesquisar(scope.filtro);
                }
            };
            
            scope.limparFiltros = function() {
                scope.filtro = {};
                if (angular.isFunction(scope.funcaoLimpar)) {
                    scope.funcaoLimpar();
                }
            };
            
            scope.novoRegistro = function() {
                scope.alternarTela('cadastro');
                scope.modelo = {};
                if (angular.isFunction(scope.funcaoNovo)) {
                    scope.funcaoNovo();
                }
            };
            
            scope.editarRegistro = function(item) {
                scope.alternarTela('cadastro');
                scope.modelo = angular.copy(item);
                if (angular.isFunction(scope.funcaoEditar)) {
                    scope.funcaoEditar(item);
                }
            };
            
            scope.salvar = function() {
                if (angular.isFunction(scope.funcaoSalvar)) {
                    scope.funcaoSalvar(scope.modelo).then(function(resultado) {
                        if (resultado && resultado.sucesso) {
                            scope.alternarTela('consulta');
                            scope.pesquisar();
                        }
                    });
                }
            };
            
            scope.cancelar = function() {
                scope.alternarTela('consulta');
                scope.modelo = {};
                if (angular.isFunction(scope.funcaoCancelar)) {
                    scope.funcaoCancelar();
                }
            };
            
            // ===== SISTEMA DE AUTO COMPLETA =====
            
            scope.configurarAutoCompleta = function(campo) {
                if (!campo.autoCompleta) return null;
                
                return {
                    fonte: campo.autoCompleta.fonte,
                    campoTexto: campo.autoCompleta.campoTexto || 'texto',
                    campoValor: campo.autoCompleta.campoValor || 'valor',
                    placeholder: campo.placeholder || 'Digite para buscar...',
                    minimoCaracteres: campo.autoCompleta.minimoCaracteres || 2
                };
            };
            
            // ===== INICIALIZAÇÃO =====
            
            function inicializar() {
                // Processar campos de filtro
                mesclaCamposFiltro();
                
                // Aplicar grid responsivo aos campos
                if (scope.campos) {
                    scope.campos = processaGridResponsivo(scope.campos);
                }
                
                if (scope.camposFiltroMesclados) {
                    scope.camposFiltroMesclados = processaGridResponsivo(scope.camposFiltroMesclados);
                }
                
                // Inicializar objetos se não existem
                scope.filtro = scope.filtro || {};
                scope.modelo = scope.modelo || {};
                scope.dados = scope.dados || [];
                
                // Aguardar próximo ciclo para garantir que template foi carregado
                $timeout(function() {
                    scope.$broadcast('estruturaGerenciaInicializada');
                }, 0);
            }
            
            // ===== WATCHERS =====
            
            // Observar mudanças nos campos
            scope.$watchGroup(['campos', 'camposFiltroPesquisa'], function(novosValores) {
                if (novosValores[0] || novosValores[1]) {
                    mesclaCamposFiltro();
                    
                    if (scope.campos) {
                        scope.campos = processaGridResponsivo(scope.campos);
                    }
                    
                    if (scope.camposFiltroMesclados) {
                        scope.camposFiltroMesclados = processaGridResponsivo(scope.camposFiltroMesclados);
                    }
                }
            });
            
            // Observar mudanças na tela
            scope.$watch('tela', function(novaTela, telaAnterior) {
                if (novaTela !== telaAnterior) {
                    scope.$broadcast('mudancaTela', { 
                        tela: novaTela, 
                        telaAnterior: telaAnterior 
                    });
                }
            });
            
            // ===== LISTENERS =====
            
            scope.$on('atualizarDados', function(event, dados) {
                scope.dados = dados || [];
            });
            
            scope.$on('selecionarItem', function(event, item) {
                scope.editarRegistro(item);
            });
            
            scope.$on('excluirItem', function(event, item) {
                if (angular.isFunction(scope.funcaoExcluir)) {
                    scope.funcaoExcluir(item);
                }
            });
            
            // ===== INÍCIO =====
            inicializar();
        }
    };
});
