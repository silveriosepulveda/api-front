/**
 * PopUpModal Directive - Modal Simples para Carregar HTML
 * 
 * Carrega o arquivo HTML baseado na rota e exibe em um modal.
 * 
 * Uso:
 * - PopUpModal.abrir({ rota: '/sistema-servicos/servicos', parametros: {} })
 * - <a abre-popup rota="/sistema-servicos/servicos" titulo="Serviços">
 */

// Verifica se a variável 'app' já existe (aplicação principal)
if (typeof app !== 'undefined') {
    // Usa a variável 'app' existente da aplicação principal
    app.directive('popUpModal', function () {
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
            controller: ['$scope', '$http', '$compile', '$timeout', function ($scope, $http, $compile, $timeout) {
                $scope.carregando = true;

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

                // Carregar HTML da rota
                function carregarHTML() {
                    if (!$scope.rota) {
                        console.error('Rota não definida');
                        $scope.carregando = false;
                        return;
                    }

                    var htmlPath = rotaParaHTML($scope.rota);
                    console.log('Carregando HTML:', htmlPath);

                    $http.get(htmlPath)
                        .then(function(response) {
                            var container = document.getElementById('modal-content-container');
                            if (container) {
                                container.innerHTML = response.data;
                                $compile(container)($scope);
                            }
                            $scope.carregando = false;
                        })
                        .catch(function(error) {
                            console.error('Erro ao carregar HTML:', error);
                            var container = document.getElementById('modal-content-container');
                            if (container) {
                                container.innerHTML = '<div class="alert alert-danger">Erro ao carregar conteúdo</div>';
                            }
                            $scope.carregando = false;
                        });
                }

                // Fechar modal
                $scope.fecharModal = function(dados) {
                    $('#' + $scope.modalId).modal('hide');
                    if ($scope.onClose) {
                        $scope.onClose({ dados: dados });
                    }
                };

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
    app.service('PopUpModal', ['$rootScope', '$compile', '$q', '$timeout',
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
    app.run(['$rootScope', 'PopUpModal', function ($rootScope, PopUpModal) {
        
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
    app.directive('abrePopup', ['PopUpModal', function (PopUpModal) {
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

} else {
    // Cria um módulo independente se a variável 'app' não existir
    angular.module('popUpModal', [])
        .directive('popUpModal', function () {
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
                controller: ['$scope', '$http', '$compile', '$timeout', function ($scope, $http, $compile, $timeout) {
                    $scope.carregando = true;

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

                    // Carregar HTML da rota
                    function carregarHTML() {
                        if (!$scope.rota) {
                            console.error('Rota não definida');
                            $scope.carregando = false;
                            return;
                        }

                        var htmlPath = rotaParaHTML($scope.rota);
                        console.log('Carregando HTML:', htmlPath);

                        $http.get(htmlPath)
                            .then(function(response) {
                                var container = document.getElementById('modal-content-container');
                                if (container) {
                                    container.innerHTML = response.data;
                                    $compile(container)($scope);
                                }
                                $scope.carregando = false;
                            })
                            .catch(function(error) {
                                console.error('Erro ao carregar HTML:', error);
                                var container = document.getElementById('modal-content-container');
                                if (container) {
                                    container.innerHTML = '<div class="alert alert-danger">Erro ao carregar conteúdo</div>';
                                }
                                $scope.carregando = false;
                            });
                    }

                    // Fechar modal
                    $scope.fecharModal = function(dados) {
                        $('#' + $scope.modalId).modal('hide');
                        if ($scope.onClose) {
                            $scope.onClose({ dados: dados });
                        }
                    };

                    // Inicializar
                    $timeout(function() {
                        carregarHTML();
                    }, 100);
                }]
            };
        })
        .service('PopUpModal', ['$rootScope', '$compile', '$q', '$timeout',
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
        ])
        .run(['$rootScope', 'PopUpModal', function ($rootScope, PopUpModal) {
            
            // Função principal para abrir modais
            $rootScope.abrirModal = function (rota, parametros, titulo) {
                return PopUpModal.abrir({
                    rota: rota,
                    parametros: parametros || {},
                    titulo: titulo || 'Modal'
                });
            };

        }])
        .directive('abrePopup', ['PopUpModal', function (PopUpModal) {
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
}
