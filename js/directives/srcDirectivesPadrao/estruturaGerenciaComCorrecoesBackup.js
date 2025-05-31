/**
 * Estrutura Gerencia Modernizada
 * Versão 2.0 - Refatorada com separação de arquivos
 * Sistema de filtros dinâmicos, grid responsivo e sub-diretivas integradas
 */

angular.module('directivesPadrao').directive('estruturaGerencia', ['$compile', '$templateCache', '$timeout', '$http', 'APIServ', '$rootScope', '$parse', 'EGFuncoes', 'operadoresConsulta',
    function($compile, $templateCache, $timeout, $http, APIServ, $rootScope, $parse, EGFuncoes, operadoresConsulta) {
    return {
        restrict: 'EA',
        scope: true,
        replace: false,
        templateUrl: '/api/js/directives/srcDirectivesPadrao/estruturaGerencia.html',
        link: function(scope, element, attrs) {
            
            // ===== VARIÁVEIS GLOBAIS =====
            if (!$rootScope.$files) {
                $rootScope.$files = {};
            }
            
            // ===== SISTEMA DE CACHE GLOBAL =====
            // Inicializar cache global para comunicação entre diretivas
            function inicializarCacheGlobal() {
                if (!window.estruturaGerenciaCache) {
                    window.estruturaGerenciaCache = {
                        camposFiltroPesquisa: {},
                        listeners: [],
                        inicializado: false
                    };
                }
                window.estruturaGerenciaCache.inicializado = true;
                console.log('DEBUG - Cache global inicializado:', window.estruturaGerenciaCache);
            }
            
            // Salvar dados no cache global e notificar listeners
            function salvarCamposGlobal(campos) {
                if (!window.estruturaGerenciaCache) {
                    inicializarCacheGlobal();
                }
                
                console.log('DEBUG - Salvando no cache global:', campos);
                window.estruturaGerenciaCache.camposFiltroPesquisa = angular.copy(campos);
                
                // Notificar todos os listeners
                angular.forEach(window.estruturaGerenciaCache.listeners, function(listener) {
                    try {
                        listener(angular.copy(campos));
                    } catch (e) {
                        console.error('Erro ao notificar listener:', e);
                    }
                });
            }
            
            // Obter dados do cache global
            function obterCamposGlobal() {
                if (!window.estruturaGerenciaCache) {
                    inicializarCacheGlobal();
                }
                return angular.copy(window.estruturaGerenciaCache.camposFiltroPesquisa);
            }
            
            // Inicializar o cache imediatamente
            inicializarCacheGlobal();
            
            // Configurações iniciais importantes do sistema original
            scope.popUp = document.getElementById('popUp') != undefined && document.getElementById('popUp').value;
            scope.larguraTela = window.screen.availWidth;
            scope.alturaTela = window.screen.availHeight;
            scope.dispositivoMovel = scope.larguraTela <= 900;
            scope.tipoSalvar = 'post';
            scope.tipoConsulta = 'post';
            scope.fd = new FormData();
            
            // Parâmetros da URL
            scope.parametrosUrl = APIServ.parametrosUrl ? APIServ.parametrosUrl() : [];
            scope.pagina = scope.parametrosUrl[0];
            scope.acao = scope.parametrosUrl[1];
            
            // Variáveis de controle importantes
            scope.filtros = [];
            scope.ordemFiltro = '';
            scope.sentidoFiltro = '';
            scope.listaConsulta = [];
            scope.todosItensSelecionados = false;
            scope.desabilitarSalvar = false;
            scope.usarTimerConsulta = false;
            scope.usarDataAlteracaoAoFiltrar = false;
            scope.dataUltimaConsulta = undefined;
            
            // Configurar operadores de consulta 
            scope.operadoresConsulta = operadoresConsulta;
            
            // CORREÇÃO #1: Configuração inicial de paginação
            scope.itensPorPaginaOpcoes = [50, 100, 200, 500, 1000];
            scope.itensPagina = 200;
            scope.paginacao = {
                paginaAtual: 1,
                totalPaginas: 1,
                itensPorPagina: 200,
                totalItens: 0
            };
            
            // Variáveis de controle para lista filtrada
            scope.listaConsultaFiltrada = [];
            scope.filtroResultado = '';
            
            // ===== CONFIGURAÇÃO INICIAL =====
            var configPadrao = {
                tela: 'consulta',
                tipoCrud: 'lista',
                exibirCabecalho: true,
                exibirFormulario: true,
                gridColunas: 12,
                filtrosPrecedencia: true, // camposFiltroPesquisa > campos
                exibirBotaoNovo: true,
                exibirBotaoAlterar: true,
                exibirBotaoExcluir: true,
                itensPagina: 200 // PROBLEMA #2 CORRIGIDO - Valor padrão de 200 itens
            };
            
            // Aplicar configurações padrão
            angular.forEach(configPadrao, function(valor, chave) {
                if (angular.isUndefined(scope[chave])) {
                    scope[chave] = valor;
                }
            });
            
            // ===== CONFIGURAÇÃO DE AÇÕES PADRÃO =====
            
            /**
             * Configura as ações padrão dos botões de consulta - PROBLEMA #5 CORRIGIDO
             */
            function configurarAcoesPadrao() {
                if (!scope.acoes) {
                    scope.acoes = [];
                }
                
                // Verificar se já existem ações configuradas
                var temAlterar = scope.acoes.some(function(acao) { return acao.nome === 'alterar'; });
                var temExcluir = scope.acoes.some(function(acao) { return acao.nome === 'excluir'; });
                var temDetalhe = scope.acoes.some(function(acao) { return acao.nome === 'detalhar'; });
                
                // Adicionar ação de detalhes se não existe
                if (!temDetalhe) {
                    scope.acoes.push({
                        nome: 'detalhar',
                        icone: 'fa fa-eye',
                        classe: 'btn btn-info btn-sm',
                        tooltip: 'Ver detalhes',
                        funcao: scope.detalhar || function(item) {
                            item.exibirDetalhes = !item.exibirDetalhes;
                        }
                    });
                }
                
                // Adicionar ação de alterar se não existe e está habilitada
                if (!temAlterar && scope.exibirBotaoAlterar !== false) {
                    scope.acoes.push({
                        nome: 'alterar',
                        icone: 'fa fa-edit',
                        classe: 'btn btn-primary btn-sm',
                        tooltip: 'Alterar registro',
                        funcao: scope.alterar || function(item) {
                            scope.editarRegistro(item);
                        }
                    });
                }
                
                // Adicionar ação de excluir se não existe e está habilitada
                if (!temExcluir && scope.exibirBotaoExcluir !== false) {
                    scope.acoes.push({
                        nome: 'excluir',
                        icone: 'fa fa-trash',
                        classe: 'btn btn-danger btn-sm',
                        tooltip: 'Excluir registro',
                        funcao: scope.excluir || function(item) {
                            if (confirm('Deseja realmente excluir este registro?')) {
                                scope.excluirRegistro(item);
                            }
                        }
                    });
                }
                
                // Configurar ações personalizadas se existirem na estrutura
                if (scope.estrutura && scope.estrutura.acoes) {
                    angular.forEach(scope.estrutura.acoes, function(acao, nome) {
                        if (acao !== false) { // Se a ação não está desabilitada
                            var acaoExistente = scope.acoes.find(function(a) {
                                return a.nome === nome;
                            });
                            
                            if (!acaoExistente) {
                                scope.acoes.push({
                                    nome: nome,
                                    icone: acao.icone || 'fa fa-cog',
                                    classe: acao.classe || 'btn btn-default btn-sm',
                                    tooltip: acao.tooltip || nome,
                                    funcao: acao.funcao || function(item) {
                                        console.log('Ação ' + nome + ' executada para item:', item);
                                    }
                                });
                            }
                        }
                    });
                }
                
                // Garantir que existe pelo menos uma função padrão para editar/excluir
                if (!scope.editarRegistro) {
                    scope.editarRegistro = function(item) {
                        scope.modelo = angular.copy(item);
                        scope.tela = 'cadastro';
                    };
                }
                
                if (!scope.excluirRegistro) {
                    scope.excluirRegistro = function(item) {
                        // Implementação básica de exclusão
                        if (scope.estrutura && scope.estrutura.campo_chave && item[scope.estrutura.campo_chave]) {
                            console.log('Excluindo item com chave:', item[scope.estrutura.campo_chave]);
                            // Aqui deveria chamar a API para excluir
                        }
                    };
                }
            }
            
            /**
             * Inicializa e configura a paginação (CORREÇÃO #1 - PROBLEMA itensPagina)
             */
            function inicializarPaginacao() {
                // Configuração padrão da paginação com valor correto de 200 itens
                scope.paginacao = scope.paginacao || {
                    paginaAtual: 1,
                    totalPaginas: 1,
                    itensPorPagina: 200,
                    totalItens: 0
                };
                
                // CORREÇÃO #1: Força inicialização correta do binding ng-model para #itensPagina
                scope.itensPagina = 200;
                scope.itensPorPaginaOpcoes = [50, 100, 200, 500, 1000];
                
                // CORREÇÃO #1: Garantir que o valor 200 seja aplicado corretamente ao elemento select
                $timeout(function() {
                    // Primeira tentativa: definir valor direto no scope
                    scope.itensPagina = 200;
                    scope.$apply();
                    
                    // Segunda tentativa: forçar atualização DOM após render
                    $timeout(function() {
                        var elementoItensPagina = document.getElementById('itensPagina');
                        if (elementoItensPagina) {
                            // Se o ng-model não estiver sincronizado, forçar manualmente
                            if (elementoItensPagina.value !== '200') {
                                elementoItensPagina.value = '200';
                                // Disparar evento change para sincronizar com AngularJS
                                angular.element(elementoItensPagina).triggerHandler('change');
                            }
                        }
                    }, 50);
                }, 10);
                
                // Observar mudanças na lista de consulta para atualizar paginação
                scope.$watch('listaConsulta.length', function(novoValor) {
                    if (scope.listaConsulta && angular.isArray(scope.listaConsulta)) {
                        scope.paginacao.totalItens = scope.listaConsulta.length;
                        scope.paginacao.totalPaginas = Math.ceil(scope.listaConsulta.length / scope.paginacao.itensPorPagina) || 1;
                                 // PROBLEMA #3 CORRIGIDO - Aplicar filtro automaticamente após carregar paginação
                if (novoValor > 0 && !scope.paginacaoInicializada) {
                    scope.paginacaoInicializada = true;
                    $timeout(function() {
                        // Aplicar filtro inicial se necessário
                        if (scope.estrutura && (scope.estrutura.filtrarAoIniciar === undefined || scope.estrutura.filtrarAoIniciar === true)) {
                            scope.filtrar(1, 'inicializacao');
                        }
                        scope.aplicarFiltroResultado();
                    }, 250);
                }
                    }
                });
                
                // Configurar ordenação
                scope.ordenacao = {
                    campo: scope.ordemFiltro || '',
                    direcao: scope.sentidoFiltro === 'desc' ? 'desc' : 'asc'
                };
                
                // Navegação de páginas
                scope.irParaPagina = function(pagina) {
                    if (pagina >= 1 && pagina <= scope.paginacao.totalPaginas) {
                        scope.paginacao.paginaAtual = pagina;
                        scope.filtrar(pagina);
                    }
                };
                
                scope.paginaAnterior = function() {
                    if (scope.paginacao.paginaAtual > 1) {
                        scope.irParaPagina(scope.paginacao.paginaAtual - 1);
                    }
                };
                
                scope.proximaPagina = function() {
                    if (scope.paginacao.paginaAtual < scope.paginacao.totalPaginas) {
                        scope.irParaPagina(scope.paginacao.paginaAtual + 1);
                    }
                };
                
                // CORREÇÃO #2: Função para alterar itens por página
                scope.alterarItensPagina = function(novoValor) {
                    scope.itensPagina = parseInt(novoValor) || 200;
                    scope.paginacao.itensPorPagina = scope.itensPagina;
                    scope.paginacao.paginaAtual = 1; // Reset para primeira página
                    
                    // Recalcular paginação
                    if (scope.listaConsulta && angular.isArray(scope.listaConsulta)) {
                        scope.paginacao.totalPaginas = Math.ceil(scope.listaConsulta.length / scope.itensPagina) || 1;
                    }
                    
                    // Aplicar filtro resultado se existir
                    scope.aplicarFiltroResultado();
                };
                
                // Funções auxiliares de paginação
                scope.calcularInfoPaginacao = function() {
                    var total = scope.listaConsultaFiltrada ? scope.listaConsultaFiltrada.length : 
                               (scope.listaConsulta ? scope.listaConsulta.length : 0);
                    var inicio = ((scope.paginacao.paginaAtual - 1) * scope.itensPagina) + 1;
                    var fim = Math.min(scope.paginacao.paginaAtual * scope.itensPagina, total);
                    
                    return {
                        inicio: inicio,
                        fim: fim,
                        total: total
                    };
                };
            }
            
            // ===== CONTROLE DE VISIBILIDADE DOS FILTROS =====
            
            /**
             * Inicializa controle de exibição da consulta
             */
            function inicializarControleExibicao() {
                // Valor padrão ou da estrutura
                scope.exibirConsulta = scope.estrutura && scope.estrutura.exibirConsulta !== undefined 
                    ? scope.estrutura.exibirConsulta 
                    : true;
            }
            
            /**
             * Alterna exibição dos filtros de consulta
             */
            scope.alterarExibicaoConsulta = function() {
                scope.exibirConsulta = !scope.exibirConsulta;
                
                // Controlar timer se disponível
                if (typeof $rootScope !== 'undefined') {
                    if (scope.exibirConsulta && $rootScope.pausarTimer) {
                        $rootScope.pausarTimer();
                    } else if (!scope.exibirConsulta && $rootScope.iniciarTimer) {
                        $rootScope.iniciarTimer();
                    }
                }
            };
            
            // ===== SISTEMA DE FILTROS DINÂMICOS =====
            
            /**
             * Verifica se um campo é um bloco (baseado na função _eBloco do sistema original)
             */
            function eBloco(campo) {
                return typeof campo === 'string' && 
                       (campo.substr(0, 5) === 'bloco' || campo.indexOf('bloco_') !== -1);
            }
            
            /**
             * Mescla campos com precedência: camposFiltroPesquisa > campos
             * Versão melhorada que processa também campos dentro de blocos
             */
            function mesclaCamposFiltro() {
                var camposBase = {};
                var filtrosPesquisa = scope.estrutura && scope.estrutura.camposFiltroPesquisa ? 
                    scope.estrutura.camposFiltroPesquisa : {};
                
                // Incluir campos gerais no filtro (exceto se explicitamente excluídos)
                var incluirCamposNoFiltro = scope.estrutura && scope.estrutura.camposOcultarFiltroPesquisa === undefined || 
                    (scope.estrutura && scope.estrutura.camposOcultarFiltroPesquisa !== '*');
                
                /**
                 * Função recursiva para processar campos e subcampos dentro de blocos
                 */
                function processarCampos(campos, resultado) {
                    if (!campos) return resultado;
                    
                    angular.forEach(campos, function(config, campo) {
                        // Processar campos dentro de blocos recursivamente
                        if (eBloco(campo) && config.campos) {
                            // Processar subcampos dentro do bloco
                            processarCampos(config.campos, resultado);
                        } 
                        // Verificar se é um campo que deve ser incluído no filtro
                        else if (
                            // Verificar se é um objeto válido
                            typeof config === "object" &&
                            // Excluir botões 
                            (typeof campo !== 'string' || campo.substr(0, 5) !== 'botao') &&
                            // Excluir campos especiais
                            (!config.tipo || 
                             (config.tipo !== 'diretiva' && 
                              config.tipo !== 'oculto' && 
                              config.tipo !== 'linhaDivisoria')) &&
                            // Verificar se não é uma tabela 
                            !config.tabela
                        ) {
                            // Adicionar ao mapa de campos base para filtros
                            resultado[campo] = angular.copy(config);
                        }
                    });
                    
                    return resultado;
                }
                
                // Iniciar o processamento de campos se permitido
                if (incluirCamposNoFiltro && scope.estrutura && scope.estrutura.campos) {
                    processarCampos(scope.estrutura.campos, camposBase);
                }
                
                // Aplicar precedência: camposFiltroPesquisa > campos
                scope.camposFiltroPesquisa = {};
                
                // Primeiro processar os campos base
                angular.forEach(camposBase, function(config, campo) {
                    // Garantir que o campo tenha um texto para exibição
                    if (!config.texto) {
                        // Gerar texto legível a partir do nome do campo
                        config.texto = campo.replace(/_/g, ' ')
                                           .replace(/bloco/g, 'Bloco')
                                           .replace(/\b\w/g, function(l) { return l.toUpperCase(); });
                    }
                    scope.camposFiltroPesquisa[campo] = config;
                });
                
                // Depois aplicar os filtros personalizados com precedência
                angular.forEach(filtrosPesquisa, function(config, campo) {
                    // Garantir texto para campos de filtro
                    if (!config.texto && scope.camposFiltroPesquisa[campo] && scope.camposFiltroPesquisa[campo].texto) {
                        config.texto = scope.camposFiltroPesquisa[campo].texto;
                    } else if (!config.texto) {
                        // Gerar texto legível a partir do nome do campo
                        config.texto = campo.replace(/_/g, ' ')
                                           .replace(/bloco/g, 'Bloco')
                                           .replace(/\b\w/g, function(l) { return l.toUpperCase(); });
                    }
                    
                    scope.camposFiltroPesquisa[campo] = angular.merge(
                        scope.camposFiltroPesquisa[campo] || {}, 
                        config
                    );
                });
                
                // Validação final e correção de textos undefined
                var filtroFinal = {};
                angular.forEach(scope.camposFiltroPesquisa, function(config, campo) {
                    if (config) {
                        // Garantir que texto existe e não é undefined
                        if (!config.texto || config.texto === 'undefined' || typeof config.texto === 'undefined') {
                            config.texto = campo.replace(/_/g, ' ')
                                               .replace(/bloco/g, 'Bloco')
                                               .replace(/\b\w/g, function(l) { return l.toUpperCase(); });
                        }
                        
                        // Incluir todos os campos válidos
                        filtroFinal[campo] = config;
                    }
                });
                
                // Substituir pelo filtro validado
                scope.camposFiltroPesquisa = filtroFinal;
                
                // Debug: Log dos campos finais para verificar textos
                console.log('mesclaCamposFiltro - Campos finais:', 
                    Object.keys(scope.camposFiltroPesquisa).map(function(key) {
                        return key + ': ' + (scope.camposFiltroPesquisa[key].texto || 'SEM TEXTO');
                    })
                );
                
                // CORREÇÃO DEFINITIVA: Salvar no cache global antes do localStorage
                salvarCamposGlobal(scope.camposFiltroPesquisa);
                
                // Criar alias para compatibilidade
                APIServ.salvaDadosLocais('camposFiltroPesquisa', scope.camposFiltroPesquisa);
                
                // DEBUG DETALHADO: Log antes do salvamento
                console.log('DEBUG ESTRUTURA LINHA 443 - Salvando no localStorage:', 
                    JSON.stringify(scope.camposFiltroPesquisa, null, 2));
                
                scope.camposFiltroMesclados = scope.camposFiltroPesquisa;                               
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
            
            // Função de compatibilidade com código legado
            scope.mudaTela = scope.alternarTela;
            
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
            
            // Função auxiliar para acessar valores dinâmicos de forma segura
            function getScopeValue(expr) {
                try {
                    return $parse(expr)(scope);
                } catch (e) {
                    return undefined;
                }
            }
            
            // Função auxiliar para atribuir valores dinâmicos de forma segura
            function setScopeValue(expr, value) {
                try {
                    $parse(expr).assign(scope, value);
                } catch (e) {}
            }
            
            // ===== FUNÇÕES DE EDIÇÃO E EXCLUSÃO =====
            
            /**
             * Função para editar um registro
             */
            scope.editarRegistro = function(item) {
                if (!item) return;
                
                // Se há função personalizada de edição, usar ela
                if (scope.estrutura && scope.estrutura.funcaoEditar) {
                    var funcaoPersonalizada = eval('scope.' + scope.estrutura.funcaoEditar);
                    if (angular.isFunction(funcaoPersonalizada)) {
                        return funcaoPersonalizada(item);
                    }
                }
                
                // Lógica padrão de edição
                if (scope.usarTimerConsulta && typeof $rootScope !== 'undefined' && $rootScope.pausarTimer) {
                    $rootScope.pausarTimer();
                }
                
                if (typeof $rootScope !== 'undefined') {
                    $rootScope.carregando = true;
                }
                
                let filtros = {
                    tabela: scope.estrutura ? scope.estrutura.tabela : '',
                    tabelaConsulta: scope.estrutura ? scope.estrutura.tabelaConsulta : undefined,
                    campo_chave: scope.estrutura ? scope.estrutura.campo_chave : '',
                    chave: item[scope.estrutura ? scope.estrutura.campo_chave : 'id']
                };

                if (scope.estrutura && scope.estrutura.tabelasRelacionadas != undefined) {
                    filtros['tabelasRelacionadas'] = scope.estrutura.tabelasRelacionadas;
                }

                if (scope.estrutura && scope.estrutura.campoChaveSecundaria != undefined && 
                    item[scope.estrutura.campoChaveSecundaria] != undefined) {
                    filtros['campoChaveSecundaria'] = scope.estrutura.campoChaveSecundaria;
                    filtros['valorChaveSecundaria'] = item[scope.estrutura.campoChaveSecundaria];
                }

                if (scope.antesDeBuscarParaAlterar != undefined) {
                    scope.antesDeBuscarParaAlterar(filtros);
                }

                if (typeof APIServ !== 'undefined' && APIServ.executaFuncaoClasse) {
                    let fd = new FormData();
                    fd.append('filtros', JSON.stringify(filtros));
                    
                    APIServ.executaFuncaoClasse('classeGeral', 'buscarParaAlterar', fd, 'post')
                        .success(function(data) {
                            if (typeof $rootScope !== 'undefined') {
                                $rootScope.carregando = false;
                            }
                            
                            if (scope.usarTimerConsulta && typeof $rootScope !== 'undefined' && $rootScope.iniciarTimer) {
                                $rootScope.iniciarTimer();
                            }

                            if (typeof data === 'string') {
                                if (typeof APIServ !== 'undefined' && APIServ.mensagemSimples) {
                                    APIServ.mensagemSimples('Informação', 'Erro, Tente Novamente');
                                }
                            } else {
                                // Definir dados no modelo
                                scope[scope.estrutura ? scope.estrutura.raizModelo : 'dados'] = data;
                                scope.tela = 'cadastro';
                                scope.alternarTela('cadastro');
                                
                                if (scope.usarTimerConsulta && typeof $rootScope !== 'undefined' && $rootScope.pausarTimer) {
                                    $rootScope.pausarTimer();
                                }

                                // Carregar TinyMCE se necessário
                                if ((scope.tela == 'cadastro' || scope.tela == 'consulta') && 
                                    scope.estrutura && scope.estrutura.usarTinyMCE == true && 
                                    scope.carregarTinyMCE != undefined) {
                                    scope.carregarTinyMCE();
                                }

                                if (scope.estrutura && scope.estrutura.funcaoAoAlterar != undefined) {
                                    let nomeFuncaoAlterar = eval('scope.' + scope.estrutura.funcaoAoAlterar);
                                    nomeFuncaoAlterar(data);
                                } else if (scope.aoAlterar != undefined) {
                                    scope.aoAlterar(data);
                                }
                            }
                        })
                        .error((a, b, c) => {
                            console.log(a);
                            if (typeof $rootScope !== 'undefined') {
                                $rootScope.carregando = false;
                            }
                        });
                }
            };
            
            /**
             * Função para excluir um registro
             */
            scope.excluirRegistro = function(item) {
                if (!item) return;
                
                // Se há função personalizada de exclusão, usar ela
                if (scope.estrutura && scope.estrutura.funcaoExcluir) {
                    var funcaoPersonalizada = eval('scope.' + scope.estrutura.funcaoExcluir);
                    if (angular.isFunction(funcaoPersonalizada)) {
                        return funcaoPersonalizada(item);
                    }
                }
                
                // Lógica padrão de exclusão
                if (typeof $rootScope !== 'undefined') {
                    $rootScope.carregando = true;
                }
                
                let filtros = {
                    tabela: scope.estrutura ? scope.estrutura.tabela : '',
                    campo_chave: scope.estrutura ? scope.estrutura.campo_chave : '',
                    chave: item[scope.estrutura ? scope.estrutura.campo_chave : 'id']
                };

                if (scope.antesDeExcluir != undefined) {
                    scope.antesDeExcluir(filtros);
                }

                if (typeof APIServ !== 'undefined' && APIServ.executaFuncaoClasse) {
                    let fd = new FormData();
                    fd.append('filtros', JSON.stringify(filtros));
                    
                    APIServ.executaFuncaoClasse('classeGeral', 'excluir', fd, 'post')
                        .success(function(data) {
                            if (typeof $rootScope !== 'undefined') {
                                $rootScope.carregando = false;
                            }

                            if (typeof data === 'string') {
                                if (typeof APIServ !== 'undefined' && APIServ.mensagemSimples) {
                                    APIServ.mensagemSimples('Informação', data);
                                }
                            } else {
                                if (typeof APIServ !== 'undefined' && APIServ.mensagemSimples) {
                                    APIServ.mensagemSimples('Sucesso', 'Registro excluído com sucesso!');
                                }
                                
                                // Atualizar lista após exclusão
                                scope.filtrar(scope.pagina || 1);
                                
                                if (scope.aposExcluir != undefined) {
                                    scope.aposExcluir(data);
                                }
                            }
                        })
                        .error((a, b, c) => {
                            console.log(a);
                            if (typeof $rootScope !== 'undefined') {
                                $rootScope.carregando = false;
                            }
                            if (typeof APIServ !== 'undefined' && APIServ.mensagemSimples) {
                                APIServ.mensagemSimples('Erro', 'Erro ao excluir registro');
                            }
                        });
                }
            };
            
            /**
             * Função para criar novo registro
             */
            scope.novoRegistro = function() {
                // Se há função personalizada de novo registro, usar ela
                if (scope.estrutura && scope.estrutura.funcaoNovo) {
                    var funcaoPersonalizada = eval('scope.' + scope.estrutura.funcaoNovo);
                    if (angular.isFunction(funcaoPersonalizada)) {
                        return funcaoPersonalizada();
                    }
                }
                
                // Lógica padrão para novo registro
                if (scope.usarTimerConsulta && typeof $rootScope !== 'undefined' && $rootScope.pausarTimer) {
                    $rootScope.pausarTimer();
                }
                
                // Limpar modelo de dados
                if (EGFuncoes && EGFuncoes.novaVariavelRaizModelo) {
                    scope[scope.estrutura ? scope.estrutura.raizModelo : 'dados'] = EGFuncoes.novaVariavelRaizModelo(scope.estrutura);
                } else {
                    scope[scope.estrutura ? scope.estrutura.raizModelo : 'dados'] = {};
                }
                
                scope.tela = 'cadastro';
                scope.alternarTela('cadastro');
                
                if (scope.aoNovo != undefined) {
                    scope.aoNovo();
                }
            };
            
            // Função para tratar informações de campos
            scope.mostrarInformacoes = function(campo) {
                let elemento = angular.element(event.target);
                let campoTemp = scope.estrutura.campos[campo];
                if (campoTemp && campoTemp.informacoes) {
                    let mensagem = campoTemp.informacoes;
                    let elementoPai = elemento.closest('div.form-group');
                    elementoPai.attr('data-toggle', 'popover')
                             .attr('data-content', mensagem)
                             .popover({'placement': 'bottom'})
                             .popover('show');
                }
            };
            
            // Função auxiliar para converter filtros para envio
            scope.converterFiltroParaEnvio = function() {
                let retorno = [];

                if (scope.estrutura.camposFiltroPersonalizado != undefined) {
                    let camposPer = Object.assign({}, scope.estrutura.camposFiltroPersonalizado);
                    for (let i in camposPer) {
                        let campoPerFil = camposPer[i]['campoFiltro'] != undefined ? camposPer[i]['campoFiltro'] : i;
                        let valor = getScopeValue(scope.estrutura.raizModelo + '.' + campoPerFil);
                        if (valor != undefined) {
                            retorno.push({
                                campo: campoPerFil,
                                operador: camposPer[i]['operador'] != undefined ? camposPer[i]['operador'] : 'like',
                                valor: valor
                            });
                        }
                    }
                }

                if (scope.filtros && angular.isArray(scope.filtros)) {
                    angular.forEach(scope.filtros, function(filtro, key) {
                        if (filtro.tipo != undefined && filtro.tipo == 'intervaloDatas') {
                            retorno.push({
                                campo: filtro.campo,
                                operador: 'between',
                                valor: filtro.di + '__' + filtro.df,
                                texto: filtro.texto != undefined ? filtro.texto : filtro.campo,
                                tipo: filtro.tipo != undefined ? filtro.tipo : 'varchar'
                            });
                        } else {
                            // Trocando o campo chave do filtro para o valor do objChave do auto completa caso exista
                            if (scope.estrutura.camposFiltroPesquisa != undefined && 
                                scope.estrutura.camposFiltroPesquisa[filtro['campo']] != undefined &&
                                scope.estrutura.camposFiltroPesquisa[filtro['campo']]['autoCompleta'] != undefined &&
                                scope.estrutura.camposFiltroPesquisa[filtro['campo']]['autoCompleta']['objChave'] != undefined && 
                                filtro['campo_chave'] != undefined) {
                                filtro['campo_chave'] = scope.estrutura.camposFiltroPesquisa[filtro['campo']]['autoCompleta']['objChave'];
                            }

                            filtro['valor'] = filtro['valor'] != '' && filtro['valor'] != undefined ? 
                                filtro['valor'].toString().split('--')[0].trim() : '';
                            retorno.push(filtro);
                        }
                    });
                }
                return retorno;
            };

            scope.filtrar = function(pagina = 1, origem = 'filtro') {
                // Vendo se a funcao de filtrar e personalizada e tem outro nome
                if (scope.estrutura && scope.estrutura.funcaoFiltrar != undefined) {
                    scope.filtrar = eval('scope.' + scope.estrutura.funcaoFiltrar);
                    return scope.filtrar(pagina, origem);
                }

                // Testando por limite no filtro inicial, para buscar apenas os últimos 500 registros
                let limite = 0;

                if (scope.antesDeFiltrar != undefined) {
                    scope.antesDeFiltrar();
                }

                if (scope.estrutura && scope.estrutura.filtroObrigatorio != undefined && scope.estrutura.filtroObrigatorio) {
                    if (!scope.filtros || !angular.isArray(scope.filtros) || scope.filtros.length === 0) {
                        if (typeof APIServ !== 'undefined' && APIServ.mensagemSimples) {
                            APIServ.mensagemSimples('Defina ao Menos um Filtro');
                        }
                        return false;
                    }
                    let filtroVer = scope.filtros[0];
                    let temValor = filtroVer.valor != '' || (filtroVer.di != undefined && filtroVer.di != '') || 
                                  (filtroVer.df != undefined && filtroVer.df != '');
                    if (filtroVer.campo == '' || !temValor) {
                        if (typeof APIServ !== 'undefined' && APIServ.mensagemSimples) {
                            APIServ.mensagemSimples('Defina ao Menos um Filtro');
                        }
                        return false;
                    }
                }

                // Esta função foi criada, pois pode haver casos de ter intervalo de datas no filtro
                scope.filtroEnviar = scope.converterFiltroParaEnvio();

                if (typeof $rootScope !== 'undefined') {
                    $rootScope.carregando = true;
                }

                let resumo = [];
                if (scope.estrutura && scope.estrutura.resumoConsulta != undefined) {
                    angular.forEach(scope.estrutura.resumoConsulta, function(val, key) {
                        resumo.push({
                            campo: key,
                            operacao: val.operacao
                        });
                    });
                }

                let addFiltro = function(campo, operador, valor, exibir) {
                    scope.filtroEnviar.push({
                        campo: campo,
                        operador: operador,
                        valor: valor,
                        exibir: exibir
                    });
                };

                // Aplicar filtros por usuário
                if (scope.estrutura && scope.estrutura.filtrosPorUsuario != undefined) {
                    if (typeof APIServ !== 'undefined' && APIServ.buscaDadosLocais) {
                        var usuario = APIServ.buscaDadosLocais('usuario');
                        if (usuario && usuario.chave_usuario > 0) {
                            angular.forEach(scope.estrutura.filtrosPorUsuario, function(valores, campo) {
                                var valor = usuario[valores.valor] != undefined ? usuario[valores.valor] : usuario[campo];
                                if (valor != null && typeof APIServ !== 'undefined' && APIServ.operacoesMatematicas && 
                                    APIServ.operacoesMatematicas(valores.operador, usuario[campo], valor)) {
                                    addFiltro(campo, '=', usuario[campo], false);
                                }
                            });
                        }
                    }
                }

                var campos = [];
                if (scope.estrutura && scope.estrutura.listaConsulta) {
                    angular.forEach(scope.estrutura.listaConsulta, function(itemLC, keyLC) {
                        if (angular.isObject(itemLC)) {
                            campos.push(keyLC);
                        } else {
                            campos.push(itemLC);
                        }
                    });
                }

                let ordemCampoTela = angular.element('#ordemFiltro').val();
                let ordemFiltro = ordemCampoTela != undefined && ordemCampoTela != '' ? 
                    angular.element('#ordemFiltro').val().split(':')[1] : 
                    (scope.ordemFiltro != '' ? scope.ordemFiltro : '');

                let sentidoFiltro = angular.element('#sentidoFiltro').length > 0 ? 
                    angular.element('#sentidoFiltro').val() : 
                    (scope.sentidoFiltro != '' ? scope.sentidoFiltro : '');

                // Usar data de alteração ao filtrar (para atualizações incrementais)
                if (scope.usarDataAlteracaoAoFiltrar && scope.dataUltimaConsulta != undefined && origem == 'timer') {
                    if (typeof APIAjuFor !== 'undefined' && APIAjuFor.dateParaTimestamp) {
                        let data_alteracao = APIAjuFor.dateParaTimestamp(scope.dataUltimaConsulta);
                        addFiltro('data_alteracao', '>=', data_alteracao, false);
                    }
                }

                let filtros = {
                    tabela: scope.estrutura ? scope.estrutura.tabela : '',
                    tabelaConsulta: scope.estrutura && scope.estrutura.tabelaConsulta != undefined ? 
                        scope.estrutura.tabelaConsulta : (scope.estrutura ? scope.estrutura.tabela : ''),
                    tela: scope.acao || 'consulta',
                    campo_chave: scope.estrutura ? scope.estrutura.campo_chave : '',
                    pagina: pagina,
                    campos: campos,
                    filtros: scope.filtroEnviar,
                    ordemFiltro: ordemFiltro != '' ? ordemFiltro + ' ' + sentidoFiltro : '',
                    itensPagina: '',
                    resumoConsulta: resumo,
                    dispositivoMovel: scope.dispositivoMovel || false,
                    //tabelasRelacionadas: scope.estrutura ? scope.estrutura.tabelasRelacionadas : undefined,
                    todosItensSelecionados: scope.todosItensSelecionados != undefined ? scope.todosItensSelecionados : false,
                    tirarCampoChaveConsulta: scope.estrutura ? scope.estrutura.tirarCampoChaveConsulta : undefined,
                    acaoAposFiltrar: scope.estrutura && scope.estrutura.acaoAposFiltrar != undefined ? 
                        scope.estrutura.acaoAposFiltrar : undefined,
                    limite: limite
                };

                // Fazendo comparacao se e pagina sem consulta, mostrando resultados direto ao abrir
                if (pagina > 0) {
                    filtros.ordemFiltro = filtros.ordemFiltro == '' && angular.element('#ordemFiltro').length > 0 ? 
                        angular.element('#ordemFiltro').val().split(':')[1] : filtros.ordemFiltro;
                    filtros.itensPagina = angular.element('#itensPagina').length > 0 ? 
                        angular.element('#itensPagina').val() : 0;
                }

                let fd = new FormData();
                fd.append('parametros', angular.toJson(filtros));

                let parametrosEnviarFiltro = scope.tipoConsulta == 'post' ? fd : filtros;

                // Executar consulta
                if (typeof APIServ !== 'undefined' && APIServ.executaFuncaoClasse) {
                    APIServ.executaFuncaoClasse('classeGeral', 'consulta', parametrosEnviarFiltro, scope.tipoConsulta || 'get')
                        .success(function(data) {
                            console.log(data);
                            
                            if (scope.usarTimerConsulta && typeof $rootScope !== 'undefined' && $rootScope.reiniciarTimer) {
                                $rootScope.reiniciarTimer();
                            }

                            if (scope.usarDataAlteracaoAoFiltrar) {
                                scope.dataUltimaConsulta = new Date();
                            }

                            if (typeof $rootScope !== 'undefined') {
                                $rootScope.carregando = false;
                            }

                            if (typeof data === 'object') {
                                scope.todosItensSelecionados = false;
                                angular.element('#todosItensSelecionados').attr('checked', false);
                                scope.pagina = pagina;

                                // Lógica de atualização incremental
                                if (scope.usarDataAlteracaoAoFiltrar && scope.dataUltimaConsulta != undefined && 
                                    origem == 'timer' && scope.listaConsulta != undefined) {
                                    
                                    let novaLista = Object.assign([], data.lista);
                                    let listaAtual = Object.assign([], scope.listaConsulta);
                                    let novaListaDefinitiva = Object.assign([], novaLista);

                                    if (Object.keys(novaLista).length > 0) {
                                        for (let x in listaAtual) {
                                            let inserir = false;
                                            for (let y in novaLista) {
                                                if (listaAtual[x][scope.estrutura.campo_chave] != 
                                                    novaLista[y][scope.estrutura.campo_chave]) {
                                                    inserir = true;
                                                }
                                            }
                                            if (inserir) {
                                                novaListaDefinitiva.push(listaAtual[x]);
                                            }
                                        }
                                        scope.listaConsulta = novaListaDefinitiva;
                                    }
                                } else {
                                    scope.listaConsulta = data.lista || [];
                                }

                                if (data.resumoConsulta != undefined) {
                                    scope.resumoConsulta = data.resumoConsulta;
                                }

                                if (data.resumoConsultaPersonalizado != undefined) {
                                    scope.resumoConsultaPersonalizado = data.resumoConsultaPersonalizado;
                                }

                                if (scope.aposFiltrar != undefined) {
                                    scope.aposFiltrar();
                                }
                            } else {
                                if (typeof APIServ !== 'undefined' && APIServ.mensagemSimples) {
                                    APIServ.mensagemSimples('Informação', 'Erro ao Filtrar');
                                }
                            }
                        })
                        .error(function(a, b, c) {
                            console.log(a, b, c);
                            if (typeof $rootScope !== 'undefined') {
                                $rootScope.carregando = false;
                            }
                            if (typeof APIServ !== 'undefined' && APIServ.mensagemSimples) {
                                APIServ.mensagemSimples('Informação', 'Erro ao Filtrar');
                            }
                        });
                } else {
                    // Fallback caso APIServ não esteja disponível
                    console.warn('APIServ não disponível para filtrar');
                    if (typeof $rootScope !== 'undefined') {
                        $rootScope.carregando = false;
                    }
                }
            };
            
            scope.pesquisar = function() {
                scope.filtrar();
            };
            
            // ===== FUNÇÕES DE FILTRO RESULTADO (PROBLEMA #3 CORRIGIDO) =====
            
            /**
             * Altera o filtro de resultado (busca na lista carregada)
             */
            scope.alterarFiltroResultado = function(filtro) {
                scope.filtroResultado = filtro;
                scope.aplicarFiltroResultado();
            };
            
            /**
             * Limpa o filtro de resultado - CORREÇÃO #2: Limpeza completa e eficaz
             */
            scope.limparFiltroResultado = function() {
                // Cancelar qualquer timeout pendente
                if (filtroTimeout) {
                    $timeout.cancel(filtroTimeout);
                }
                
                // Limpar variável scope
                scope.filtroResultado = '';
                
                // CORREÇÃO #2: Limpar elementos DOM para garantir limpeza visual
                $timeout(function() {
                    // Limpar elemento específico #filtro_resultado
                    var elementoFiltro = document.getElementById('filtro_resultado');
                    if (elementoFiltro) {
                        elementoFiltro.value = '';
                        // Disparar evento para notificar a mudança
                        angular.element(elementoFiltro).triggerHandler('input');
                        angular.element(elementoFiltro).triggerHandler('change');
                    }
                    
                    // Limpar outros elementos que possam estar vinculados ao filtroResultado
                    var elementosFiltro = document.querySelectorAll('[ng-model="filtroResultado"], [ng-model*="filtroResultado"]');
                    angular.forEach(elementosFiltro, function(elemento) {
                        elemento.value = '';
                        angular.element(elemento).triggerHandler('input');
                        angular.element(elemento).triggerHandler('change');
                    });
                    
                    // Aplicar mudanças imediatamente
                    scope.aplicarFiltroResultado();
                    
                    // Forçar aplicação das mudanças no scope
                    if (!scope.$$phase) {
                        scope.$apply();
                    }
                }, 10);
            };
            
            /**
             * Aplica o filtro de resultado na lista já carregada - CORREÇÃO #2: Melhorado
             */
            scope.aplicarFiltroResultado = function() {
                // Garantir que temos uma lista válida
                if (!scope.listaConsulta || !Array.isArray(scope.listaConsulta)) {
                    scope.listaConsultaFiltrada = [];
                    return;
                }
                
                // Se não há filtro de resultado, mostrar todos
                if (!scope.filtroResultado || scope.filtroResultado.trim() === '') {
                    scope.listaConsultaFiltrada = angular.copy(scope.listaConsulta);
                } else {
                    var termo = scope.filtroResultado.toLowerCase().trim();
                    scope.listaConsultaFiltrada = scope.listaConsulta.filter(function(item) {
                        // Buscar em todas as propriedades do item
                        return Object.keys(item).some(function(key) {
                            var valor = item[key];
                            if (valor === null || valor === undefined) return false;
                            
                            // Converter valor para string e buscar
                            var valorString = String(valor).toLowerCase();
                            return valorString.includes(termo);
                        });
                    });
                }
                
                // CORREÇÃO #2: Atualizar paginação baseada na lista filtrada
                if (scope.paginacao) {
                    scope.paginacao.totalItens = scope.listaConsultaFiltrada.length;
                    scope.paginacao.totalPaginas = Math.ceil(scope.listaConsultaFiltrada.length / scope.itensPagina) || 1;
                    scope.paginacao.paginaAtual = 1; // Reset para primeira página
                }
                
                // Forçar aplicação das mudanças se necessário
                if (!scope.$$phase) {
                    try {
                        scope.$apply();
                    } catch (e) {
                        // Já em digest cycle
                    }
                }
            };
            
            // CORREÇÃO #2: Watch melhorado para aplicar filtro automaticamente quando filtroResultado mudar
            var filtroTimeout;
            scope.$watch('filtroResultado', function(newVal, oldVal) {
                if (newVal !== oldVal) {
                    // Cancelar timeout anterior para debouncing
                    if (filtroTimeout) {
                        $timeout.cancel(filtroTimeout);
                    }
                    
                    // Aplicar filtro com debounce de 300ms para melhor performance
                    filtroTimeout = $timeout(function() {
                        scope.aplicarFiltroResultado();
                    }, 300);
                }
            });
            
            scope.limparFiltros = function() {
                // PROBLEMA #7 CORRIGIDO - Função limparFiltros aprimorada
                scope.filtro = {};
                scope.filtros = [];
                scope.filtroResultado = ''; // Limpar também o filtro de resultado
                scope.ordemFiltro = ''; // Limpar ordenação
                scope.sentidoFiltro = ''; // Limpar sentido
                
                // Reset da paginação
                if (scope.paginacao) {
                    scope.paginacao.paginaAtual = 1;
                }
                
                scope.adicionarFiltro();
                
                // Reaplica filtros padrão
                aplicarFiltrosPadrao();
                
                // Limpar lista de resultados
                scope.listaConsulta = [];
                scope.listaConsultaFiltrada = [];
                
                if (angular.isFunction(scope.funcaoLimpar)) {
                    scope.funcaoLimpar();
                }
            };
            
            scope.adicionarFiltro = function() {
                scope.filtros.push({
                    campo: '',
                    operador: 'like',
                    valor: '',
                    texto: '',
                    tipo: 'text',
                    exibir: true
                });
            };
            
            scope.removerFiltro = function(indice) {
                if (indice >= 0 && scope.filtros.length > 1) {
                    scope.filtros.splice(indice, 1);
                }
            };
            
            /**
             * Função auxiliar para obter data atual
             */
            function obterDataAtual() {
                var hoje = new Date();
                var dia = String(hoje.getDate()).padStart(2, '0');
                var mes = String(hoje.getMonth() + 1).padStart(2, '0');
                var ano = hoje.getFullYear();
                return dia + '/' + mes + '/' + ano;
            }
            
            /**
             * Aplica filtros padrão definidos na estrutura
             */
            function aplicarFiltrosPadrao() {
                if (scope.estrutura && scope.estrutura.filtrosPadrao) {
                    var tirarPrimeiroFiltro = false;
                    
                    angular.forEach(scope.estrutura.filtrosPadrao, function(val, key) {
                        // Configurar valor padrão para datas
                        if (val.tipo === 'intervaloDatas') {
                            val.di = val.di === 'dataAtual' ? obterDataAtual() : val.di;
                            val.df = val.df === 'dataAtual' ? obterDataAtual() : val.df;
                        }
                        
                        // Se o filtro é visível, remove o primeiro filtro vazio
                        if (val.exibir) {
                            tirarPrimeiroFiltro = true;
                        }
                        
                        scope.filtros.push({
                            campo: key,
                            operador: val.operador,
                            valor: val.valor === 'data' ? obterDataAtual() : val.valor,
                            exibir: val.exibir !== undefined ? val.exibir : false,
                            tipo: val.tipo,
                            texto: val.texto,
                            di: val.di,
                            df: val.df
                        });
                    });
                    
                    if (tirarPrimeiroFiltro && scope.filtros.length > 1) {
                        scope.filtros.splice(0, 1);
                    }
                }
            }
            
            /**
             * Inicializa filtros se estiverem vazios
             */
            function inicializarFiltros() {
                // Se não há filtros definidos, adicionar pelo menos um filtro vazio
                if (!scope.filtros || scope.filtros.length === 0) {
                    scope.adicionarFiltro();
                }
                
                // Aplicar filtros padrão da estrutura
                aplicarFiltrosPadrao();
                
                // Garantir que sempre tenha pelo menos um filtro
                if (scope.filtros.length === 0) {
                    scope.adicionarFiltro();
                }
            }
            
            
            // ===== FUNÇÕES DE SELEÇÃO E DETALHAMENTO =====
            
            if (scope.selecionarItemConsulta == undefined) {
                scope.selecionarItemConsulta = function(key, item) {
                    let parametros = {
                        tela: scope.acao || 'consulta',
                        key: key,
                        campo_chave: scope.estrutura ? scope.estrutura.campo_chave : '',
                        chave: item[scope.estrutura ? scope.estrutura.campo_chave : 'id'],
                        selecionado: item.selecionado != undefined && item.selecionado
                    };
                    
                    if (typeof APIServ !== 'undefined' && APIServ.executaFuncaoClasse) {
                        APIServ.executaFuncaoClasse('classeGeral', 'selecionarItemConsulta', parametros)
                            .success(function(retorno) {
                                // Callback de sucesso se necessário
                            });
                    }
                };
            }

            if (scope.selecionarTodosItensConsulta == undefined) {
                scope.selecionarTodosItensConsulta = function() {
                    scope.todosItensSelecionados = scope.todosItensSelecionados == 'false' || !scope.todosItensSelecionados;
                    
                    if (scope.listaConsulta != undefined && Object.keys(scope.listaConsulta).length > 0) {
                        let parametros = {
                            tela: scope.acao || 'consulta',
                            selecionado: scope.todosItensSelecionados
                        };
                        
                        if (typeof APIServ !== 'undefined' && APIServ.executaFuncaoClasse) {
                            APIServ.executaFuncaoClasse('classeGeral', 'selecionarTodosItensConsulta', parametros)
                                .success(function() {
                                    angular.forEach(scope.listaConsulta, function(item) {
                                        item.selecionado = scope.todosItensSelecionados;
                                    });
                                });
                        }
                    }
                };
            }

            if (scope.detalhar == undefined) {
                scope.detalhar = function(item) {
                    let filtros = {
                        tabela: scope.estrutura ? scope.estrutura.tabela : '',
                        campo_chave: scope.estrutura ? scope.estrutura.campo_chave : '',
                        chave: item[scope.estrutura ? scope.estrutura.campo_chave : 'id']
                    };

                    // Vendo se há tabelas relacionadas
                    if (scope.estrutura && scope.estrutura.tabelasRelacionadas != undefined) {
                        filtros['tabelasRelacionadas'] = scope.estrutura.tabelasRelacionadas;
                    }

                    // Vendo se o detalhe do item já foi carregado
                    if (item['detalhes'] == undefined) {
                        if (typeof APIServ !== 'undefined' && APIServ.executaFuncaoClasse) {
                            APIServ.executaFuncaoClasse('classeGeral', 'detalhar', filtros)
                                .success(function(data) {
                                    console.log(data);
                                    item['arquivosAnexados'] = data.arquivosAnexados;
                                    item['exibirDetalhes'] = true;
                                    item['detalhes'] = data;
                                    
                                    if (scope.aoDetalhar != undefined) {
                                        scope.aoDetalhar(item);
                                    }
                                });
                        }
                    } else {
                        item['exibirDetalhes'] = !item['exibirDetalhes'];
                    }
                };
            }


            
            // ===== FUNÇÃO PARA ATUALIZAR CAMPO DE FILTRO =====
            
            scope.atualizarCampoFiltro = function(campo, valor) {
                setScopeValue(campo, valor);
                let campoOrdenar = scope.ordemFiltro;

                function crescente(varA, varB) {
                    return (varA[campoOrdenar] > varB[campoOrdenar]) ? 1 : ((varB[campoOrdenar] > varA[campoOrdenar]) ? -1 : 0);
                }
                
                function decrescente(varA, varB) {
                    return (varA[campoOrdenar] < varB[campoOrdenar]) ? 1 : ((varB[campoOrdenar] < varA[campoOrdenar]) ? -1 : 0);
                }

                if (scope.listaConsulta && angular.isArray(scope.listaConsulta)) {
                    if (scope.sentidoFiltro == '') {
                        scope.listaConsulta.sort(crescente);
                    } else {
                        scope.listaConsulta.sort(decrescente);
                    }
                }
            };
            
            // ===== INICIALIZAÇÃO =====
            
            // Executar inicializações necessárias
            inicializarControleExibicao();
            mesclaCamposFiltro();
            
            // Notificar que a estrutura foi inicializada via broadcast
            $timeout(function() {
                scope.$broadcast('estruturaGerenciaInicializada', {
                    camposFiltroPesquisa: scope.camposFiltroPesquisa
                });
                console.log('DEBUG - Evento estruturaGerenciaInicializada disparado');
            }, 0);
            
            configurarAcoesPadrao();
            inicializarFiltros();
            inicializarPaginacao();
        }
    };
}]);
