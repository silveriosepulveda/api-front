/**
 * PopUpModal Directive - Modal Simples para Carregar HTML
 * 
 * Carrega o arquivo HTML baseado na rota e exibe em um modal.
 * 
 * Uso:
 * - PopUpModal.abrir({ rota: '/sistema-servicos/servicos', parametros: {} })
 * - <a abre-popup rota="/sistema-servicos/servicos" titulo="Serviços">
 */

angular.module('app').directive('popUpModal', function () {
    return {
        restrict: 'E',
        template: `
            <div id="{{modalId}}" class="modal fade popup-modal" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header" ng-if="titulo">
                            <h4 class="modal-title">{{titulo}}</h4>
                            <button type="button" class="close" data-dismiss="modal">&times;</button>
                        </div>
                        <div class="modal-body popup-modal-body">
                            <div ng-show="carregando" class="text-center">
                                <i class="fa fa-spinner fa-spin fa-2x"></i>
                                <p>Carregando...</p>
                            </div>
                            <div ng-show="!carregando" id="modal-content-container"></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Fechar</button>
                        </div>
                    </div>
                </div>
            </div>
        `,
        scope: {
            modalId: '@',
            titulo: '@',
            rota: '@',
            parametros: '=?',
            onClose: '&'
        },
        controller: ['$scope', '$http', '$compile', '$timeout', '$route', '$ocLazyLoad', '$rootScope', '$injector', function ($scope, $http, $compile, $timeout, $route, $ocLazyLoad, $rootScope, $injector) {
            $scope.carregando = true;
            var contentScope = null; // Scope para o conteúdo do modal

            // Converter rota em caminho do arquivo HTML
            function rotaParaHTML(rota) {
                if (!rota) return '';
                
                var partes = rota.replace(/^\/+/, '').split('/').filter(function(parte) {
                    return parte.length > 0;
                });
                
                if (partes.length >= 2) {
                    var pasta = partes[0].replace(/^sistema-/, 'sistema/');
                    var arquivo = partes[1];
                    return pasta + '/' + arquivo + '.html';
                }
                
                return '';
            }

            // Buscar rota na configuração e obter resolve
            function buscarRotaConfigurada(rota) {
                if (!$route || !$route.routes) {
                    console.warn('$route.routes não disponível');
                    return null;
                }

                var rotas = $route.routes;
                
                // Primeiro, tentar correspondência exata
                if (rotas[rota] && rotas[rota].resolve && rotas[rota].resolve.loadMyCtrl) {
                    return rotas[rota];
                }

                // Se não encontrou correspondência exata, tentar match por padrão
                for (var pattern in rotas) {
                    if (pattern === null || pattern === undefined || pattern === '') continue;
                    
                    var route = rotas[pattern];
                    if (!route || !route.resolve || !route.resolve.loadMyCtrl) continue;
                    
                    // Converter padrão de rota em regex (tratar parâmetros :param e :param?)
                    var regexPattern = pattern
                        .replace(/:[^/?]+\?/g, '[^/]*') // Parâmetros opcionais
                        .replace(/:[^/]+/g, '[^/]+'); // Parâmetros obrigatórios
                    
                    // Escapar caracteres especiais, mas preservar grupos de caracteres
                    var parts = regexPattern.split(/(\[[^\]]+\])/);
                    regexPattern = parts.map(function(part) {
                        if (part.match(/^\[[^\]]+\]$/)) {
                            return part; // Preservar grupos de caracteres
                        }
                        return part.replace(/[.*+?^${}()|\\]/g, '\\$&');
                    }).join('');
                    
                    var regex = new RegExp('^' + regexPattern + '$');
                    
                    if (regex.test(rota)) {
                        return route;
                    }
                }

                return null;
            }

            // Carregar HTML da rota
            function carregarHTML() {
                if (!$scope.rota) {
                    console.error('Rota não definida');
                    $scope.carregando = false;
                    return;
                }

                // Buscar rota na configuração
                var routeConfig = buscarRotaConfigurada($scope.rota);
                var htmlPath = null;
                
                // Obter templateUrl da rota configurada ou converter rota
                if (routeConfig && routeConfig.templateUrl) {
                    htmlPath = routeConfig.templateUrl;
                } else {
                    htmlPath = rotaParaHTML($scope.rota);
                }

                console.log('Carregando HTML:', htmlPath);
                console.log('Rota configurada encontrada:', routeConfig ? 'Sim' : 'Não');

                // Função para verificar se um controller está disponível
                function verificarControllerDisponivel(controllerName) {
                    try {
                        // Tentar obter o controller via $controller
                        var $controller = $injector.get('$controller');
                        try {
                            // Tentar instanciar o controller (mas sem criar scope)
                            var controllerFn = $controller(controllerName + 'Controller', {});
                            return true;
                        } catch (e) {
                            // Se não conseguiu, verificar no módulo Angular
                            var appModule = angular.module('app');
                            if (appModule._invokeQueue) {
                                for (var i = 0; i < appModule._invokeQueue.length; i++) {
                                    var item = appModule._invokeQueue[i];
                                    if (item[0] === '$controllerProvider' && 
                                        item[1] === 'register' && 
                                        item[2] && item[2][0] === controllerName) {
                                        return true;
                                    }
                                }
                            }
                            return false;
                        }
                    } catch (e) {
                        return false;
                    }
                }

                // Função para extrair controllers do HTML
                function extrairControllersDoHTML(htmlContent) {
                    var controllers = [];
                    var matches = htmlContent.match(/ng-controller=["']([^"']+)["']/g);
                    if (matches) {
                        matches.forEach(function(match) {
                            var controllerName = match.match(/ng-controller=["']([^"']+)["']/)[1];
                            if (controllerName && controllers.indexOf(controllerName) === -1) {
                                controllers.push(controllerName);
                            }
                        });
                    }
                    return controllers;
                }

                // Função para carregar e compilar o HTML com retry
                var carregarECompilarHTML = function(tentativas) {
                    tentativas = tentativas || 0;
                    var maxTentativas = 20;
                    var delayInicial = 150;
                    var delayMaximo = 1500;
                    
                    $http.get(htmlPath)
                        .then(function(response) {
                            var container = document.getElementById('modal-content-container');
                            if (!container) {
                                console.error('Container não encontrado');
                                $scope.carregando = false;
                                return;
                            }

                            // Remover tags <script> e <meta> do HTML (já foram carregados via ocLazyLoad)
                            var htmlContent = response.data;
                            htmlContent = htmlContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
                            htmlContent = htmlContent.replace(/<meta[^>]*>/gi, '');
                            
                            // Extrair controllers necessários do HTML
                            var controllersNecessarios = extrairControllersDoHTML(htmlContent);
                            
                            // Verificar se todos os controllers estão disponíveis
                            var todosDisponiveis = true;
                            if (controllersNecessarios.length > 0) {
                                for (var i = 0; i < controllersNecessarios.length; i++) {
                                    var controllerName = controllersNecessarios[i];
                                    if (!verificarControllerDisponivel(controllerName)) {
                                        todosDisponiveis = false;
                                        console.log('Controller', controllerName, 'ainda não disponível, tentativa', tentativas + 1, 'de', maxTentativas);
                                        break;
                                    }
                                }
                            }
                            
                            // Se nem todos os controllers estão disponíveis, tentar novamente
                            if (!todosDisponiveis && tentativas < maxTentativas) {
                                // Calcular delay progressivo
                                var delay = Math.min(delayInicial * Math.pow(1.3, tentativas), delayMaximo);
                                $timeout(function() {
                                    carregarECompilarHTML(tentativas + 1);
                                }, delay);
                                return;
                            }
                            
                            // Se excedeu tentativas sem encontrar controllers
                            if (!todosDisponiveis) {
                                console.error('Controllers não encontrados após', maxTentativas, 'tentativas:', controllersNecessarios);
                                container.innerHTML = '<div class="alert alert-danger">Erro: Controllers não encontrados: ' + 
                                                      controllersNecessarios.join(', ') + '</div>';
                                $scope.carregando = false;
                                return;
                            }
                            
                            // Todos os controllers estão disponíveis, compilar
                            try {
                                // Criar novo scope filho para o conteúdo do modal
                                if (contentScope) {
                                    contentScope.$destroy();
                                }
                                contentScope = $scope.$new();
                                
                                container.innerHTML = htmlContent;
                                $compile(container)(contentScope);
                                
                                $scope.carregando = false;
                                console.log('HTML compilado com sucesso');
                            } catch (compileError) {
                                console.error('Erro ao compilar HTML:', compileError);
                                var errorMessage = compileError.message || compileError.toString();
                                container.innerHTML = '<div class="alert alert-danger">Erro ao compilar conteúdo: ' + 
                                                      (errorMessage || 'Erro desconhecido') + '</div>';
                                $scope.carregando = false;
                            }
                        })
                        .catch(function(error) {
                            console.error('Erro ao carregar HTML:', error);
                            var container = document.getElementById('modal-content-container');
                            if (container) {
                                container.innerHTML = '<div class="alert alert-danger">Erro ao carregar conteúdo</div>';
                            }
                            $scope.carregando = false;
                        });
                };

                // Se a rota tem resolve.loadMyCtrl, carregar arquivos primeiro
                if (routeConfig && routeConfig.resolve && routeConfig.resolve.loadMyCtrl) {
                    var resolveFn = routeConfig.resolve.loadMyCtrl[1];
                    if (resolveFn && typeof resolveFn === 'function') {
                        console.log('Carregando arquivos JS/CSS da rota...');
                        try {
                            var promise = resolveFn($ocLazyLoad);
                            if (promise && promise.then) {
                                promise
                                    .then(function() {
                                        console.log('Arquivos carregados com sucesso');
                                        // Aguardar um delay para garantir que o Angular processe os controllers
                                        // Aguardar um tempo suficiente para o Angular processar o código JavaScript
                                        $timeout(function() {
                                            // Tentar compilar (com retry automático se necessário)
                                            carregarECompilarHTML(0);
                                        }, 800);
                                    })
                                    .catch(function(error) {
                                        console.error('Erro ao carregar arquivos:', error);
                                        // Tentar carregar HTML mesmo assim
                                        carregarECompilarHTML(0);
                                    });
                                return;
                            }
                        } catch (e) {
                            console.error('Erro ao executar resolve:', e);
                        }
                    }
                }

                // Se não tem resolve ou se houve erro, carregar HTML diretamente
                carregarECompilarHTML(0);
            }

            // Fechar modal
            $scope.fecharModal = function(dados) {
                // Destruir scope do conteúdo
                if (contentScope) {
                    contentScope.$destroy();
                    contentScope = null;
                }
                
                $('#' + $scope.modalId).modal('hide');
                if ($scope.onClose) {
                    $scope.onClose({ dados: dados });
                }
            };

            // Limpar scope quando o modal for destruído
            $scope.$on('$destroy', function() {
                if (contentScope) {
                    contentScope.$destroy();
                    contentScope = null;
                }
            });

            // Inicializar
            $timeout(function() {
                carregarHTML();
            }, 100);
        }]
    };
});

/**
 * PopUpModal Service - Serviço Simples para Modais
 */
angular.module('app').service('PopUpModal', ['$rootScope', '$compile', '$q', '$timeout',
    function ($rootScope, $compile, $q, $timeout) {
        var self = this;
        var modaisAtivos = [];
        var contadorId = 0;

        /**
         * Abrir modal
         */
        self.abrir = function (opcoes) {
            var deferred = $q.defer();
            
            var config = angular.extend({
                rota: '',
                parametros: {},
                titulo: 'Modal'
            }, opcoes);

            console.log('Abrindo modal:', config);

            var modalId = 'popup-modal-' + (++contadorId);
            var modalScope = $rootScope.$new();
            
            modalScope.modalId = modalId;
            modalScope.titulo = config.titulo;
            modalScope.rota = config.rota;
            modalScope.parametros = config.parametros;

            modalScope.onClose = function (dados) {
                self.fechar(modalId);
                if (dados && dados.dados) {
                    deferred.resolve(dados.dados);
                } else {
                    deferred.reject('Modal fechado');
                }
            };

            var modalHtml = '<pop-up-modal ' +
                'modal-id="' + modalId + '" ' +
                'titulo="' + config.titulo + '" ' +
                'rota="' + config.rota + '" ' +
                'parametros="parametros" ' +
                'on-close="onClose(dados)">' +
                '</pop-up-modal>';

            var modalElement = $compile(modalHtml)(modalScope);
            angular.element(document.body).append(modalElement);

            $timeout(function () {
                $('#' + modalId).modal({
                    backdrop: 'static',
                    keyboard: false
                });

                modaisAtivos.push({
                    id: modalId,
                    element: modalElement,
                    scope: modalScope
                });
            }, 100);

            return deferred.promise;
        };

        /**
         * Fechar modal
         */
        self.fechar = function (modalId) {
            var modal = modaisAtivos.find(m => m.id === modalId);
            if (modal) {
                $('#' + modalId).modal('hide');

                $timeout(function () {
                    modal.element.remove();
                    modal.scope.$destroy();

                    var index = modaisAtivos.indexOf(modal);
                    if (index > -1) {
                        modaisAtivos.splice(index, 1);
                    }
                }, 300);
            }
        };
    }
]);

/**
 * Funções globais simples
 */
angular.module('app').run(['$rootScope', 'PopUpModal', function ($rootScope, PopUpModal) {
    
    // Função principal para abrir modais
    $rootScope.abrirModal = function (rota, parametros, titulo) {
        return PopUpModal.abrir({
            rota: rota,
            parametros: parametros || {},
            titulo: titulo || 'Modal'
        });
    };

}]);

/**
 * Diretiva simples para elementos HTML
 */
angular.module('app').directive('abrePopup', ['PopUpModal', function (PopUpModal) {
    return {
        restrict: 'A',
        scope: {
            rota: '@',
            titulo: '@',
            parametros: '=?'
        },
        link: function (scope, element, attrs) {
            element.on('click', function (event) {
                event.preventDefault();
                
                PopUpModal.abrir({
                    rota: scope.rota,
                    titulo: scope.titulo || 'Modal',
                    parametros: scope.parametros || {}
                });
            });
        }
    };
}]);
