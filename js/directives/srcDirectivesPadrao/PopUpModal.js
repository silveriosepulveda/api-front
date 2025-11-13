/**
 * PopUpModal - Modal Simples com Carregamento de Rotas
 * 
 * Uso:
 * - PopUpModal.abrir({ rota: '/sistema-comunicados/comunicados/cadastro', parametros: {}, titulo: 'Cadastro' })
 */

angular.module('app').service('PopUpModal', ['$rootScope', '$compile', '$q', '$timeout', '$http', '$route', '$ocLazyLoad', '$injector', '$parse',
    function ($rootScope, $compile, $q, $timeout, $http, $route, $ocLazyLoad, $injector, $parse) {
        var self = this;
        var modaisAtivos = [];
        var contadorId = 0;

        /**
         * Buscar configuração da rota no routes.js
         */
        function buscarRotaConfigurada(rota) {
            if (!$route || !$route.routes) {
                return null;
            }

            var rotas = $route.routes;
            
            // Primeiro, tentar correspondência exata
            if (rotas[rota]) {
                return rotas[rota];
            }

            // Se não encontrou correspondência exata, tentar match por padrão
            var rotasOrdenadas = Object.keys(rotas).sort(function(a, b) {
                // Ordenar por número de parâmetros (menos parâmetros primeiro)
                var paramsA = (a.match(/:[^/]+/g) || []).length;
                var paramsB = (b.match(/:[^/]+/g) || []).length;
                
                if (paramsA !== paramsB) {
                    return paramsA - paramsB;
                }
                
                // Se mesmo número de parâmetros, ordenar por tamanho (mais específico primeiro)
                if (b.length !== a.length) {
                    return b.length - a.length;
                }
                
                return 0;
            });

            for (var i = 0; i < rotasOrdenadas.length; i++) {
                var pattern = rotasOrdenadas[i];
                if (pattern === null || pattern === undefined || pattern === '') continue;
                
                var route = rotas[pattern];
                if (!route) continue;
                
                // Converter padrão de rota em regex
                var regexPattern = pattern;
                
                // Proteger placeholders temporários para parâmetros
                var placeholderMap = {};
                var placeholderCounter = 0;
                
                // Substituir parâmetros opcionais :param? primeiro
                regexPattern = regexPattern.replace(/:([^/?]+)\?/g, function(match, paramName) {
                    var placeholder = '__OPTIONAL_PARAM_' + placeholderCounter + '__';
                    // Parâmetro opcional: a barra já está antes do :param, então só tornamos o valor opcional
                    placeholderMap[placeholder] = '([^/]+)?';
                    placeholderCounter++;
                    return placeholder;
                });
                
                // Substituir parâmetros obrigatórios :param
                regexPattern = regexPattern.replace(/:([^/]+)/g, function(match, paramName) {
                    var placeholder = '__REQUIRED_PARAM_' + placeholderCounter + '__';
                    placeholderMap[placeholder] = '([^/]+)';
                    placeholderCounter++;
                    return placeholder;
                });
                
                // Escapar caracteres especiais do regex
                regexPattern = regexPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                
                // Restaurar os placeholders
                for (var placeholder in placeholderMap) {
                    regexPattern = regexPattern.replace(placeholder, placeholderMap[placeholder]);
                }
                
                var regex = new RegExp('^' + regexPattern + '$');
                
                if (regex.test(rota)) {
                    return route;
                }
            }

            return null;
        }

        /**
         * Processar parâmetros e avaliar expressões (recursivo)
         */
        function processarParametros(parametros, scopeOrigem) {
            if (!parametros || typeof parametros !== 'object') {
                return parametros;
            }
            
            // Se for array, processar cada item
            if (Array.isArray(parametros)) {
                return parametros.map(function(item) {
                    return processarParametros(item, scopeOrigem);
                });
            }
            
            var resultado = {};
            
            for (var key in parametros) {
                if (!parametros.hasOwnProperty(key)) continue;
                
                var valor = parametros[key];
                
                // Se for objeto, processar recursivamente
                if (valor !== null && typeof valor === 'object' && !Array.isArray(valor)) {
                    resultado[key] = processarParametros(valor, scopeOrigem);
                }
                // Se for string, tentar avaliar como expressão
                else if (typeof valor === 'string' && scopeOrigem) {
                    try {
                        // Tentar avaliar a expressão no scope de origem
                        var valorAvaliado = $parse(valor)(scopeOrigem);
                        resultado[key] = valorAvaliado !== undefined ? valorAvaliado : valor;
                    } catch (e) {
                        // Se falhar, usar o valor literal
                        resultado[key] = valor;
                    }
                }
                // Outros tipos (number, boolean, null), copiar diretamente
                else {
                    resultado[key] = valor;
                }
            }
            
            return resultado;
        }

        /**
         * Abrir modal
         */
        self.abrir = function (opcoes, scopeOrigem) {
            var deferred = $q.defer();
            
            var config = angular.extend({
                rota: '',
                parametros: {},
                titulo: 'Modal'
            }, opcoes);
            
            // Processar parâmetros para avaliar expressões
            if (scopeOrigem) {
                config.parametros = processarParametros(config.parametros, scopeOrigem);
            }

            var modalId = 'popup-modal-' + (++contadorId);
            
            // Criar scope do modal
            var modalScope = $rootScope.$new();
            modalScope.modalId = modalId;
            modalScope.titulo = config.titulo;
            modalScope.carregando = true;
            
            // Criar HTML do modal
            var modalHtml = `
                <div id="${modalId}" class="modal fade popup-modal" tabindex="-1" role="dialog">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h4 class="modal-title">${config.titulo}</h4>
                                <button type="button" class="close" data-dismiss="modal">&times;</button>
                            </div>
                            <div class="modal-body">
                                <div ng-show="carregando" class="text-center">
                                    <i class="fa fa-spinner fa-spin fa-2x"></i>
                                    <p>Carregando...</p>
                                </div>
                                <div ng-show="!carregando" id="${modalId}-content"></div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-dismiss="modal">Fechar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            var modalElement = $compile(modalHtml)(modalScope);
            angular.element(document.body).append(modalElement);

            // Configurar modal Bootstrap
            $timeout(function () {
                $('#' + modalId).modal({
                    backdrop: 'static',
                    keyboard: false,
                    show: true
                });
                
                // Ajustar z-index para modais aninhados
                $('#' + modalId).css('z-index', 1050 + (modaisAtivos.length * 10));
                
                if (modaisAtivos.length > 0) {
                    $('.modal-backdrop').last().css('z-index', 1040 + (modaisAtivos.length * 10) - 5);
                }
            }, 50);

            // Carregar conteúdo
            var routeConfig = buscarRotaConfigurada(config.rota);
            
            if (!routeConfig) {
                modalScope.carregando = false;
                var container = document.getElementById(modalId + '-content');
                if (container) {
                    container.innerHTML = '<div class="alert alert-danger">Rota não encontrada: ' + config.rota + '</div>';
                }
                return deferred.promise;
            }

            // Função para processar template
            function processarTemplate(templateContent) {
                $timeout(function() {
                    var container = document.getElementById(modalId + '-content');
                    if (!container) {
                        modalScope.carregando = false;
                        return;
                    }

                    try {
                        // Criar scope para o conteúdo
                        var contentScope = $rootScope.$new();
                        
                        // Copiar parâmetros
                        if (config.parametros) {
                            contentScope.parametros = angular.copy(config.parametros);
                        }
                        
                        // Garantir abrirModal disponível
                        if ($rootScope.abrirModal) {
                            contentScope.abrirModal = $rootScope.abrirModal;
                        }

                        // Se usa estrutura-gerencia, adicionar atributos
                        if (templateContent.indexOf('<estrutura-gerencia') !== -1) {
                            var attrs = [];
                            
                            if (routeConfig.classe) {
                                attrs.push('classe="' + routeConfig.classe + '"');
                            }
                            
                            if (routeConfig.funcaoEstrutura) {
                                attrs.push('funcao-estrutura="' + routeConfig.funcaoEstrutura + '"');
                            }
                            
                            // Extrair ação da rota
                            var partesRota = config.rota.split('/').filter(function(p) { return p.length > 0; });
                            var acaoRota = partesRota.length > 2 ? partesRota[2] : '';
                            if (acaoRota) {
                                attrs.push('subacao="' + acaoRota + '"');
                            }
                            
                            attrs.push('local-exibicao="modal"');
                            
                            if (config.parametros) {
                                var parametrosStr = JSON.stringify(config.parametros)
                                    .replace(/"/g, '&quot;')
                                    .replace(/'/g, '&#39;');
                                attrs.push('parametros="' + parametrosStr + '"');
                            }
                            
                            if (attrs.length > 0) {
                                templateContent = templateContent.replace(
                                    /<estrutura-gerencia([^>]*)>/,
                                    '<estrutura-gerencia $1 ' + attrs.join(' ') + '>'
                                );
                            }
                        }
                        
                        // Inserir HTML
                        var containerElement = angular.element(container);
                        containerElement.html(templateContent);
                        
                        // Instanciar controller se existir
                        if (routeConfig.controller) {
                            try {
                                var $controller = $injector.get('$controller');
                                $controller(routeConfig.controller, {
                                    $scope: contentScope,
                                    $element: containerElement
                                });
                            } catch (e) {
                                console.error('Erro ao instanciar controller:', e);
                            }
                        }
                        
                        // Compilar
                        $compile(containerElement.contents())(contentScope);
                        
                        // Esconder loading
                        $timeout(function() {
                            modalScope.carregando = false;
                        }, 300);
                        
                        // Armazenar scope para limpeza
                        modaisAtivos.push({
                            id: modalId,
                            element: modalElement,
                            scope: modalScope,
                            contentScope: contentScope
                        });
                        
                    } catch (e) {
                        console.error('Erro ao processar template:', e);
                        container.innerHTML = '<div class="alert alert-danger">Erro ao carregar conteúdo: ' + e.message + '</div>';
                        modalScope.carregando = false;
                    }
                }, 100);
            }

            // Carregar arquivos da rota se necessário
            if (routeConfig.resolve && routeConfig.resolve.loadMyCtrl) {
                var resolveFn = routeConfig.resolve.loadMyCtrl[1];
                if (resolveFn && typeof resolveFn === 'function') {
                    var promise = resolveFn($ocLazyLoad);
                    if (promise && promise.then) {
                        promise.then(function() {
                            if (routeConfig.template) {
                                processarTemplate(routeConfig.template);
                            } else if (routeConfig.templateUrl) {
                                $http.get(routeConfig.templateUrl).then(function(response) {
                                    processarTemplate(response.data);
                                }).catch(function(err) {
                                    console.error('Erro ao carregar template:', err);
                                    modalScope.carregando = false;
                                });
                            }
                        }).catch(function(err) {
                            console.error('Erro ao carregar arquivos:', err);
                            modalScope.carregando = false;
                        });
                        return deferred.promise;
                    }
                }
            }

            // Se não tem resolve, carregar template diretamente
            if (routeConfig.template) {
                processarTemplate(routeConfig.template);
            } else if (routeConfig.templateUrl) {
                $http.get(routeConfig.templateUrl).then(function(response) {
                    processarTemplate(response.data);
                }).catch(function(err) {
                    console.error('Erro ao carregar template:', err);
                    modalScope.carregando = false;
                });
            }

            // Listener para quando fechar
            $('#' + modalId).on('hidden.bs.modal', function() {
                self.fechar(modalId);
                deferred.reject('Modal fechado');
            });

            return deferred.promise;
        };

        /**
         * Fechar modal
         */
        self.fechar = function (modalId) {
            var modal = modaisAtivos.find(function(m) { return m.id === modalId; });
            if (!modal) return;
            
            // Remover do $rootScope['estruturas'] antes de destruir
            if (modal.contentScope && $rootScope['estruturas']) {
                for (var classe in $rootScope['estruturas']) {
                    if ($rootScope['estruturas'][classe] === modal.contentScope) {
                        delete $rootScope['estruturas'][classe];
                        break;
                    }
                }
            }
            
            // Esconder modal
            $('#' + modalId).modal('hide');
            
            $timeout(function () {
                // Destruir scopes
                if (modal.contentScope) {
                    modal.contentScope.$destroy();
                }
                if (modal.scope) {
                    modal.scope.$destroy();
                }
                
                // Remover elemento
                modal.element.remove();
                
                // Remover da lista
                var index = modaisAtivos.indexOf(modal);
                if (index > -1) {
                    modaisAtivos.splice(index, 1);
                }
            }, 300);
        };

        /**
         * Fechar todos os modais
         */
        self.fecharTodos = function () {
            var modais = modaisAtivos.slice();
            modais.forEach(function(modal) {
                self.fechar(modal.id);
            });
        };

        /**
         * Identifica o modal que contém o elemento informado e o fecha.
         * Útil para formulários carregados dentro de modais aninhados.
         * @param {Element|angular.element|jQuery} elementoReferencia
         * @returns {boolean} true se encontrou e fechou algum modal
         */
        self.identificarEFecharModalAtual = function (elementoReferencia) {
            if (!elementoReferencia) {
                return false;
            }

            var node = elementoReferencia;

            // Tratar angular.element ou jQuery
            if (node.jquery) {
                node = node[0];
            } else if (node[0]) {
                node = node[0];
            }

            if (!node) {
                return false;
            }

            // Procurar ancestral com classe popup-modal
            var modalNode = null;
            var current = node;
            while (current) {
                if (current.classList && current.classList.contains('popup-modal')) {
                    modalNode = current;
                    break;
                }
                current = current.parentNode;
            }

            if (!modalNode) {
                return false;
            }

            var modalId = modalNode.id;
            if (!modalId) {
                return false;
            }

            self.fechar(modalId);
            return true;
        };
    }
]);

/**
 * Função global para abrir modais
 */
angular.module('app').run(['$rootScope', 'PopUpModal', function ($rootScope, PopUpModal) {
    /**
     * Função para abrir modal com rota
     * @param {string} rota - Rota a ser carregada (do routes.js)
     * @param {Object} parametros - Parâmetros para passar ao conteúdo (expressões serão avaliadas)
     * @param {string} titulo - Título do modal
     * @returns {Promise} Promise que resolve quando o modal é fechado
     */
    $rootScope.abrirModal = function (rota, parametros, titulo) {
        // Capturar o scope de quem está chamando (this no contexto Angular)
        var scopeOrigem = this;
        
        return PopUpModal.abrir({
            rota: rota || '',
            parametros: parametros || {},
            titulo: titulo || 'Modal'
        }, scopeOrigem);
    };
}]);
