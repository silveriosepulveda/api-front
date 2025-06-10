/**
 * PopUpModal Directive - Sistema de Modal para Substituir popup.php
 * 
 * Esta diretiva cria um modal que carrega apenas a diretiva estruturaGerencia
 * de uma rota específica, ocultando menuPainel e cabecalhoSistema.
 * 
 * INTEGRAÇÃO COM local-exibicao="modal":
 * - Automaticamente adiciona local-exibicao="modal" na estruturaGerencia
 * - Oculta cabecalhoSistema e menuPainel automaticamente
 * - Remove botões Fechar e Salvar do modal quando local-exibicao="modal"
 * - Copia a tag <estrutura-gerencia> da rota especificada
 * 
 * Substitui a função $scope.abrirPopUp e retorna uma Promise.
 * 
 * Uso:
 * - No menuPainel: ng-click="abrirModal(rota, parametros)"
 * - Em botões: PopUpModal.abrir(rota, parametros).then(...)
 * - Diretiva HTML: <a abre-popup rota="/sistema-servicos/servicos" titulo="Serviços">
 * - Função específica: abrirModalServicos(parametros)
 */

angular.module('app').directive('popUpModal', function () {
    return {
        restrict: 'E',
        template: `
            <div id="{{modalId}}" class="modal fade popup-modal" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">                       
                        <div class="modal-body popup-modal-body">
                            <!-- Estrutura-gerencia com local-exibicao="modal" carregada imediatamente -->
                            <div ng-show="rotaCarregada" class="estrutura-container">
                                <!-- Input hidden com parâmetros codificados em base64 -->
                                <input type="hidden" id="parametrosEnviados" ng-value="parametrosBase64" ng-if="parametrosBase64" />
                                
                                <!-- Estrutura-gerencia será inserida dinamicamente conforme funcaoEstrutura -->
                                <div id="estrutura-container-dinamico"></div>
                            </div>
                            <div ng-show="!rotaCarregada" class="loading-container">
                                <div class="text-center">
                                    <i class="fa fa-spinner fa-spin fa-2x"></i>
                                    <p>Preparando modal...</p>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Fechar</button>
                            <button type="button" class="btn btn-primary" ng-click="salvar()" ng-if="mostrarBotaoSalvar">
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `,
        scope: {
            modalId: '@',
            titulo: '@',
            rota: '@',
            subacao: '=?',
            parametros: '=?',
            onClose: '&',
            onSave: '&',
            classeEstrutura: '@',
            funcaoEstrutura: '@'
        },
        controller: ['$scope', '$location', '$route', '$timeout', '$q', '$routeParams', '$compile', function ($scope, $location, $route, $timeout, $q, $routeParams, $compile) {
            console.log('🚀 [PopUpModal] Controller inicializado');
            console.log('   - Rota recebida:', $scope.rota);
            console.log('   - Classe recebida:', $scope.classeEstrutura);
            console.log('   - Parâmetros recebidos:', $scope.parametros);
            
            $scope.rotaCarregada = false;
            $scope.mostrarBotaoSalvar = false;
            $scope.carregamentoIniciado = false; // Controle para evitar múltiplas execuções

            // Extrair classe da estrutura baseada na rota (sempre o segundo item)
            $scope.extrairClasseEstrutura = function () {
                if (!$scope.rota) return '';

                // Dividir rota e filtrar partes vazias
                var partesRota = $scope.rota.split('/').filter(function (parte) {
                    return parte.length > 0;
                });

                // A classe é sempre o segundo item da rota
                // Exemplo: /sistema-servicos/servicos -> classe = "servicos"
                // Exemplo: /cadastro/usuario -> classe = "usuario"
                return partesRota.length >= 2 ? partesRota[1] : (partesRota.length > 0 ? partesRota[0] : '');
            };

            $scope.extrairSubaAcao = function () {
                if (!$scope.rota) return '';

                // Dividir subação e filtrar partes vazias
                var partesSubacao = $scope.rota.split('/').filter(function (parte) {
                    return parte.length > 0;
                });

                // A subação é sempre o terceiro item da rota
                // Exemplo: /sistema-servicos/servicos/cadastro -> subação = "cadastro"
                return partesSubacao.length >= 3 ? partesSubacao[2] : '';
            };

            $scope.extrairParametros = function () {
                if (!$scope.rota) return '';

                // Dividir parâmetros e filtrar partes vazias
                var partesParametros = $scope.rota.split('/').filter(function (parte) {
                    return parte.length > 0;
                });

                // Os parâmetros são sempre o quarto item da rota
                // Exemplo: /sistema-servicos/servicos/cadastro/123 -> parametros = "123"
                return partesParametros.length >= 4 ? partesParametros[3] : '';
            };

            // Função para carregar a rota no modal (SEM NAVEGAR NA APLICAÇÃO)
            $scope.carregarRota = function () {
                // Evitar múltiplas execuções
                if ($scope.carregamentoIniciado) {
                    console.log('⚠️ [PopUpModal] carregarRota já está em execução, ignorando');
                    return;
                }
                
                console.log('🔄 [PopUpModal] carregarRota iniciado');
                console.log('   - Rota inicial:', $scope.rota);
                
                if (!$scope.rota) {
                    console.error('❌ [PopUpModal] Rota não definida!');
                    return;
                }

                $scope.carregamentoIniciado = true; // Marcar como iniciado

                try {
                    // Definir classe da estrutura
                    var classeAnterior = $scope.classeEstrutura;
                    $scope.classeEstrutura = $scope.classeEstrutura || $scope.extrairClasseEstrutura();
                    $scope.subacao = $scope.subacao || $scope.extrairSubaAcao();
                    
                    console.log('🔍 [PopUpModal] Extração de classe:');
                    console.log('   - Classe anterior:', classeAnterior);
                    console.log('   - Classe extraída:', $scope.extrairClasseEstrutura());
                    console.log('   - Classe final:', $scope.classeEstrutura);
                    
                    // Garantir que sempre tenha uma classeEstrutura válida
                    if (!$scope.classeEstrutura) {
                        console.warn('⚠️ [PopUpModal] classeEstrutura vazia, usando rota padrão');
                        $scope.classeEstrutura = 'default';
                    }
                    
                    // Não sobrescrever parâmetros se já foram passados pelo service
                    if (!$scope.parametros || Object.keys($scope.parametros).length === 0) {
                        $scope.parametros = $scope.extrairParametros();
                    }

                    console.log('🔧 [PopUpModal] Preparando modal sem navegação:');
                    console.log('   - Rota:', $scope.rota);
                    console.log('   - Classe estrutura:', $scope.classeEstrutura);
                    console.log('   - Subação:', $scope.subacao);
                    console.log('   - Parâmetros:', $scope.parametros);

                    // NÃO navegar - apenas definir que a rota está carregada
                    // A estrutura-gerencia será inicializada com a classe correta
                    $timeout(function () {
                        console.log('⏰ [PopUpModal] Timeout executado - definindo rotaCarregada = true');
                        console.log('   - classeEstrutura antes:', $scope.classeEstrutura);
                        console.log('   - rotaCarregada antes:', $scope.rotaCarregada);
                        
                        $scope.rotaCarregada = true;
                        $scope.mostrarBotaoSalvar = false; // Ocultar botão salvar pois já é feito pela estrutura
                        
                        // Converter parâmetros para JSON se for objeto
                        if (typeof $scope.parametros === 'object' && $scope.parametros !== null) {
                            $scope.parametrosJson = JSON.stringify($scope.parametros);
                        } else {
                            $scope.parametrosJson = $scope.parametros || '';
                        }

                        // Gerar base64 dos parâmetros para input hidden se houver parâmetros
                        if ($scope.parametrosJson && $scope.parametrosJson !== '{}' && $scope.parametrosJson !== '') {
                            try {
                                $scope.parametrosBase64 = btoa(encodeURIComponent($scope.parametrosJson));
                                console.log('🔐 [PopUpModal] Parâmetros codificados em base64 para input hidden');
                            } catch (erro) {
                                console.warn('⚠️ [PopUpModal] Erro ao codificar parâmetros em base64:', erro);
                                $scope.parametrosBase64 = '';
                            }
                        } else {
                            $scope.parametrosBase64 = '';
                        }

                        console.log('✅ [PopUpModal] Modal preparado com local-exibicao="modal"');
                        console.log('   - rotaCarregada definido como:', $scope.rotaCarregada);
                        console.log('   - estrutura-gerencia será inicializada com classe:', $scope.classeEstrutura);
                        console.log('   - funcao-estrutura:', $scope.funcaoEstrutura);
                        console.log('   - Parâmetros JSON:', $scope.parametrosJson);
                        console.log('   - Parâmetros Base64:', $scope.parametrosBase64 ? 'Codificado' : 'Vazio');
                        console.log('ℹ️ [PopUpModal] Ocultação de elementos será feita pela estruturaGerencia via local-exibicao="modal"');
                        
                        // Criar dinamicamente a tag estrutura-gerencia com atributos condicionais
                        var estruturaHtml = '<estrutura-gerencia ' +
                            'local-exibicao="modal" ' +
                            'classe="' + $scope.classeEstrutura + '" ' +
                            'subacao="' + ($scope.subacao || '') + '" ';
                        
                        // Incluir funcao-estrutura apenas se existir e não for vazio
                        if ($scope.funcaoEstrutura && $scope.funcaoEstrutura.trim() !== '') {
                            estruturaHtml += 'funcao-estrutura="' + $scope.funcaoEstrutura + '" ';
                            console.log('🎯 [PopUpModal] Incluindo atributo funcao-estrutura:', $scope.funcaoEstrutura);
                        } else {
                            console.log('ℹ️ [PopUpModal] Atributo funcao-estrutura omitido (vazio ou undefined)');
                        }
                        
                        estruturaHtml += 'parametros="' + ($scope.parametrosJson || '') + '">' +
                            '</estrutura-gerencia>';
                        
                        // Inserir a estrutura-gerencia no container
                        var container = document.getElementById('estrutura-container-dinamico');
                        if (container) {
                            container.innerHTML = estruturaHtml;
                            
                            // Compilar o HTML para ativar as diretivas do AngularJS
                            var compiledElement = $compile(container)($scope);
                            console.log('🏗️ [PopUpModal] estrutura-gerencia inserida e compilada dinamicamente');
                        }
                        
                        // Resetar controle após sucesso
                        $scope.carregamentoIniciado = false;
                        
                        // $scope.$apply() não é necessário dentro de $timeout
                        
                    }, 100); // Reduzido o timeout para carregamento mais rápido

                } catch (erro) {
                    console.error('❌ [PopUpModal] Erro ao preparar modal:', erro);
                    $scope.carregamentoIniciado = false; // Resetar controle em caso de erro
                    $scope.fecharModal();
                }
            };

            // // Função para salvar dados
            // $scope.salvar = function () {
            //     if ($scope.onSave) {
            //         var resultado = $scope.onSave();
            //         if (resultado) {
            //             $scope.fecharModal(resultado);
            //         }
            //     }
            // };

            // Função para fechar modal
            $scope.fecharModal = function (dados) {
                $('#' + $scope.modalId).modal('hide');

                if ($scope.onClose) {
                    $scope.onClose({ dados: dados });
                }
            };

            // Inicializar modal quando o scope for criado
            $scope.$on('$viewContentLoaded', function () {
                console.log('🔄 [PopUpModal] ViewContentLoaded - verificando se precisa inicializar');
                if (!$scope.rotaCarregada && !$scope.carregamentoIniciado) {
                    console.log('🔄 [PopUpModal] ViewContentLoaded - inicializando modal');
                    $scope.carregarRota();
                }
            });

            // Inicializar imediatamente também (apenas se ainda não foi carregado)
            $timeout(function () {
                console.log('⏰ [PopUpModal] Timeout inicial - verificando estado');
                console.log('   - rotaCarregada:', $scope.rotaCarregada);
                console.log('   - carregamentoIniciado:', $scope.carregamentoIniciado);
                console.log('   - rota disponível:', $scope.rota);
                console.log('   - classeEstrutura disponível:', $scope.classeEstrutura);
                
                if (!$scope.rotaCarregada && !$scope.carregamentoIniciado) {
                    console.log('🔄 [PopUpModal] Timeout - inicializando modal (rotaCarregada=false)');
                    $scope.carregarRota();
                } else {
                    console.log('✅ [PopUpModal] Modal já carregado ou em carregamento, não inicializando novamente');
                }
            }, 50);
        }],
        link: function (scope, element, attrs) {
            console.log('🔗 [PopUpModal] Link function executada');
            console.log('   - scope.rota:', scope.rota);
            console.log('   - scope.classeEstrutura:', scope.classeEstrutura);
            console.log('   - scope.rotaCarregada:', scope.rotaCarregada);
            console.log('   - scope.carregamentoIniciado:', scope.carregamentoIniciado);
            console.log('   - attrs:', attrs);
            
            // Garantir que carregarRota seja chamado após link (apenas se ainda não foi)
            if (!scope.rotaCarregada && !scope.carregamentoIniciado) {
                console.log('🔄 [PopUpModal] Link - chamando carregarRota()');
                scope.carregarRota();
            } else {
                console.log('✅ [PopUpModal] Link - modal já carregado ou em carregamento');
            }
            
            // Configurar eventos do modal
            element.find('.modal').on('shown.bs.modal', function () {
                console.log('👁️ [PopUpModal] Modal mostrado - verificando carregamento');
                console.log('   - rotaCarregada:', scope.rotaCarregada);
                console.log('   - carregamentoIniciado:', scope.carregamentoIniciado);
                
                if (!scope.rotaCarregada && !scope.carregamentoIniciado) {
                    console.log('🔄 [PopUpModal] Modal mostrado - chamando carregarRota()');
                    scope.carregarRota();
                    scope.$apply();
                } else {
                    console.log('✅ [PopUpModal] Modal mostrado - já carregado ou em carregamento');
                }
            });

            element.find('.modal').on('hidden.bs.modal', function () {
                console.log('🚪 [PopUpModal] Modal ocultado');
                scope.fecharModal();
            });
        }
    };
});

/**
 * PopUpModal Service - Serviço para gerenciar modais programaticamente
 */
angular.module('app').service('PopUpModal', ['$rootScope', '$compile', '$q', '$timeout',
    function ($rootScope, $compile, $q, $timeout) {

        var self = this;
        var modaisAtivos = [];
        var contadorId = 0;

        /**
         * Converte rota para caminho do arquivo HTML
         */
        self.rotaParaArquivoHTML = function(rota) {
            if (!rota) return '';
            
            var partes = rota.split('/').filter(p => p.length > 0);
            
            // Remover 'cadastro' se existir no final
            if (partes.length > 2 && partes[partes.length - 1] === 'cadastro') {
                partes.pop();
            }
            
            if (partes.length >= 2) {
                // Converter formato: sistema-empresas/empresasSetores -> sistema/empresas/empresasSetores.html
                var pasta = partes[0].replace('sistema-', 'sistema/');
                var arquivo = partes[1];
                return pasta + '/' + arquivo + '.html';
            }
            
            return '';
        };

        /**
         * Abrir modal com rota específica
         */
        self.abrir = function (opcoes) {
            var deferred = $q.defer();

            // Configurações padrão
            var config = angular.extend({
                rota: '',
                parametros: {},
                titulo: 'Modal',
                mostrarBotaoSalvar: true,
                classeEstrutura: '',
                funcaoEstrutura: ''
            }, opcoes);

            // Auto-extrair classe se não fornecida (segundo item da rota)
            if (!config.classeEstrutura && config.rota) {
                var partesRota = config.rota.split('/').filter(p => p.length > 0);
                // A classe é sempre o segundo item da rota
                config.classeEstrutura = partesRota.length >= 2 ? partesRota[1] : (partesRota.length > 0 ? partesRota[0] : '');
            }

            // Auto-extrair funcaoEstrutura do arquivo HTML se não fornecida
            if (!config.funcaoEstrutura && config.rota) {
              //  config.funcaoEstrutura = self.extrairFuncaoEstruturaDoHTML(config.rota);
            }

            console.log('🚀 [PopUpModal.Service] Abrindo modal (SEM NAVEGAÇÃO):');
            console.log('   - Rota:', config.rota);
            console.log('   - Classe extraída:', config.classeEstrutura);
            console.log('   - FuncaoEstrutura extraída:', config.funcaoEstrutura);
            console.log('   - Título:', config.titulo);
            console.log('   - Parâmetros:', config.parametros);

            // Gerar ID único
            var modalId = 'popup-modal-' + (++contadorId);

            // Criar scope do modal
            var modalScope = $rootScope.$new();
            modalScope.modalId = modalId;
            modalScope.titulo = config.titulo;
            modalScope.rota = config.rota;
            modalScope.parametros = config.parametros;
            modalScope.mostrarBotaoSalvar = config.mostrarBotaoSalvar;
            modalScope.classeEstrutura = config.classeEstrutura;
            modalScope.funcaoEstrutura = config.funcaoEstrutura;

            // Callbacks
            modalScope.onClose = function (dados) {
                self.fechar(modalId);
                if (dados && dados.dados) {
                    deferred.resolve(dados.dados);
                } else {
                    deferred.reject('Modal fechado sem dados');
                }
            };

            modalScope.onSave = function () {
                // Implementar lógica de salvamento específica
                return config.onSave ? config.onSave() : { sucesso: true };
            };

            // Criar elemento HTML
            var modalHtml = '<pop-up-modal ' +
                'modal-id="' + modalId + '" ' +
                'titulo="' + config.titulo + '" ' +
                'rota="' + config.rota + '" ' +
                'parametros="' + JSON.stringify(config.parametros || {}).replace(/"/g, '&quot;') + '" ' +
                'classe-estrutura="' + config.classeEstrutura + '" ' +
                (config.funcaoEstrutura ? 'funcao-estrutura="' + config.funcaoEstrutura + '" ' : '') +
                'on-close="onClose(dados)" ' +
                'on-save="onSave()">' +
                '</pop-up-modal>';
                
            console.log('🔧 [PopUpModal.Service] HTML gerado:');
            console.log('   - HTML:', modalHtml);
            console.log('   - modalScope.parametros:', modalScope.parametros);
            console.log('   - modalScope.classeEstrutura:', modalScope.classeEstrutura);

            var modalElement = $compile(modalHtml)(modalScope);

            // Adicionar ao DOM
            angular.element(document.body).append(modalElement);

            // Mostrar modal
            $timeout(function () {
                $('#' + modalId).modal({
                    backdrop: 'static',
                    keyboard: false
                });

                // Adicionar à lista de modais ativos
                modaisAtivos.push({
                    id: modalId,
                    element: modalElement,
                    scope: modalScope
                });
            }, 100);

            return deferred.promise;
        };

        /**
         * Fechar modal específico
         */
        self.fechar = function (modalId) {
            var modal = modaisAtivos.find(m => m.id === modalId);
            if (modal) {
                $('#' + modalId).modal('hide');

                $timeout(function () {
                    modal.element.remove();
                    modal.scope.$destroy();

                    // Remover da lista
                    var index = modaisAtivos.indexOf(modal);
                    if (index > -1) {
                        modaisAtivos.splice(index, 1);
                    }
                }, 300);
            }
        };

        /**
         * Fechar todos os modais
         */
        self.fecharTodos = function () {
            modaisAtivos.forEach(function (modal) {
                self.fechar(modal.id);
            });
        };

        /**
         * Migração da função abrirPopUp original
         */
        self.migrarAbrirPopUp = function (parametros, tipoEnvio) {
            // Converter parâmetros para formato de rota
            var rota = '/estrutura'; // rota padrão
            var params = {};

            if (typeof parametros === 'string') {
                // Parse dos parâmetros
                var urlParams = new URLSearchParams(parametros);
                urlParams.forEach(function (value, key) {
                    params[key] = value;
                });
            } else if (typeof parametros === 'object') {
                params = parametros;
            }

            return self.abrir({
                rota: rota,
                parametros: params,
                titulo: 'Cadastro Rápido',
                mostrarBotaoSalvar: true
            });
        };
    }
]);

/**
 * Função global para compatibilidade com código existente
 */
angular.module('app').run(['$rootScope', 'PopUpModal', function ($rootScope, PopUpModal) {
    // Adicionar função abrirModal no escopo global para compatibilidade
    $rootScope.abrirModal = function (rota, parametros, titulo, classeEstrutura) {
        return PopUpModal.abrir({
            rota: rota,
            parametros: parametros,
            titulo: titulo || 'Modal',
            classeEstrutura: classeEstrutura
        });
    };

    // Função para abrir modal com parâmetros codificados (evita problemas de parse)
    $rootScope.abrirModalSeguro = function (rota, parametrosEncodados, tituloEncodado, classeEstrutura) {
        console.log('🔒 [abrirModalSeguro] Iniciando com parâmetros:');
        console.log('   - Rota:', rota);
        console.log('   - Parâmetros codificados:', parametrosEncodados);
        console.log('   - Título codificado:', tituloEncodado);
        console.log('   - Classe estrutura:', classeEstrutura);
        
        try {
            var parametros = JSON.parse(decodeURIComponent(atob(parametrosEncodados)));
            var titulo = decodeURIComponent(atob(tituloEncodado));
            
            console.log('🔓 [abrirModalSeguro] Parâmetros decodificados:');
            console.log('   - Parâmetros:', parametros);
            console.log('   - Título:', titulo);
            
            return PopUpModal.abrir({
                rota: rota,
                parametros: parametros,
                titulo: titulo || 'Modal',
                classeEstrutura: classeEstrutura
            });
        } catch (error) {
            console.error('❌ [abrirModalSeguro] Erro ao decodificar parâmetros:', error);
            // Fallback para modal simples
            return PopUpModal.abrir({
                rota: rota,
                parametros: {},
                titulo: 'Modal',
                classeEstrutura: classeEstrutura
            });
        }
    };

    // Substituir função abrirPopUp existente
    $rootScope.abrirPopUp = function (parametros, tipoEnvio) {
        return PopUpModal.migrarAbrirPopUp(parametros, tipoEnvio);
    };

    // Função específica para abrir modal de serviços (exemplo)
    $rootScope.abrirModalServicos = function (parametros) {
        //console.log('📋 [Global] Abrindo modal de serviços com local-exibicao="modal"');
        return PopUpModal.abrir({
            rota: '/sistema-servicos/servicos',
            parametros: parametros || {},
            titulo: 'Serviços',
            classeEstrutura: 'servicos'
        });
    };
}]);

/**
 * Diretiva abre-popup - Para uso em elementos HTML (especialmente no menuPainel)
 * 
 * Uso em elementos HTML como no menuPainel:
 * <a abre-popup 
 *    rota="/sistema-servicos/servicos" 
 *    titulo="Serviços"
 *    classe-estrutura="servicos"
 *    largura="800" 
 *    altura="600"
 *    ao-fechar="callback(dados)">
 *    Abrir Modal
 * </a>
 */
angular.module('app').directive('abrePopup', ['PopUpModal', function (PopUpModal) {
    return {
        restrict: 'A',
        scope: {
            rota: '@',
            titulo: '@',
            classeEstrutura: '@',
            subAcao: '@',
            largura: '@',
            altura: '@',
            parametros: '=?',
            aoFechar: '&?',
            aoSalvar: '&?'
        },
        link: function (scope, element, attrs) {
            element.on('click', function (event) {
                event.preventDefault();
                event.stopPropagation();

                // Configurações do modal
                var config = {
                    rota: scope.rota || '/',
                    titulo: scope.titulo || 'Modal',
                    classeEstrutura: scope.classeEstrutura || '',
                    largura: parseInt(scope.largura) || 800,
                    altura: parseInt(scope.altura) || 600,
                    parametros: scope.parametros || {},
                    mostrarBotaoSalvar: true
                };

                //console.log('🔗 [abrePopup] Disparando modal com local-exibicao="modal":', config);

                // Callbacks
                if (scope.aoSalvar) {
                    config.onSave = function () {
                        return scope.aoSalvar();
                    };
                }

                // Abrir modal
                PopUpModal.abrir(config).then(function (dados) {
                    //console.log('✅ Modal fechado com dados:', dados);
                    if (scope.aoFechar) {
                        scope.aoFechar({ dados: dados });
                    }
                }).catch(function (erro) {
                    console.log('ℹ️ Modal fechado sem dados:', erro);
                    if (scope.aoFechar) {
                        scope.aoFechar({ dados: null });
                    }
                });
            });
        }
    };
}]);
