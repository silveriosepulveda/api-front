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
                            <div ng-show="!carregando" id="{{modalId}}-content-container" class="modal-content-container"></div>
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
            var containerElement = null; // Referência ao elemento do container

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
                    return null;
                }

                var rotas = $route.routes;
                
                // Primeiro, tentar correspondência exata
                if (rotas[rota] && rotas[rota].resolve && rotas[rota].resolve.loadMyCtrl) {
                    return rotas[rota];
                }

                // Se não encontrou correspondência exata, tentar match por padrão
                // Ordenar rotas para priorizar rotas mais específicas (mais longas primeiro)
                // E também priorizar rotas que correspondem melhor (menos parâmetros)
                var rotasOrdenadas = Object.keys(rotas).sort(function(a, b) {
                    // Contar quantos parâmetros (:param) cada rota tem
                    var paramsA = (a.match(/:[^/]+/g) || []).length;
                    var paramsB = (b.match(/:[^/]+/g) || []).length;
                    
                    // Priorizar rotas com menos parâmetros (mais específicas)
                    if (paramsA !== paramsB) {
                        return paramsA - paramsB;
                    }
                    
                    // Se tiverem o mesmo número de parâmetros, priorizar a mais longa
                    if (b.length !== a.length) {
                        return b.length - a.length;
                    }
                    
                    return 0;
                });

                for (var i = 0; i < rotasOrdenadas.length; i++) {
                    var pattern = rotasOrdenadas[i];
                    if (pattern === null || pattern === undefined || pattern === '') continue;
                    
                    var route = rotas[pattern];
                    if (!route || !route.resolve || !route.resolve.loadMyCtrl) continue;
                    
                    // Converter padrão de rota em regex (tratar parâmetros :param e :param?)
                    var regexPattern = pattern
                        .replace(/:[^/?]+\?/g, '[^/]*') // Parâmetros opcionais
                        .replace(/:[^/]+/g, '[^/]+'); // Parâmetros obrigatórios
                    
                    // Escapar caracteres especiais, mas preservar grupos de caracteres [ ] e quantificadores após eles
                    // Primeiro, proteger grupos com quantificadores usando placeholders temporários
                    var placeholderMap = {};
                    var placeholderCounter = 0;
                    regexPattern = regexPattern.replace(/\[[^\]]+\][\*\+\?]?/g, function(match) {
                        var placeholder = '__PLACEHOLDER_' + placeholderCounter + '__';
                        placeholderMap[placeholder] = match;
                        placeholderCounter++;
                        return placeholder;
                    });
                    
                    // Agora escapar caracteres especiais no restante
                    regexPattern = regexPattern.replace(/[.*+?^${}()|\\]/g, '\\$&');
                    
                    // Restaurar os placeholders (grupos com quantificadores)
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

            // Carregar HTML da rota
            function carregarHTML() {
                // Resetar estado do carregamento
                $scope.carregando = true;
                
                // Limpar qualquer conteúdo anterior se existir
                // Usar o modalId para encontrar o container correto (ID único por modal)
                var containerId = $scope.modalId + '-content-container';
                var container = document.getElementById(containerId);
                
                if (!container) {
                    // Fallback: tentar encontrar dentro do modal
                    var modalElement = document.getElementById($scope.modalId);
                    if (modalElement) {
                        container = modalElement.querySelector('.modal-content-container');
                    }
                }
                
                if (container) {
                    container.innerHTML = '';
                }
                
                // Limpar scope anterior se existir
                if (contentScope) {
                    try {
                        contentScope.$destroy();
                    } catch (e) {
                        // Ignorar erro
                    }
                    contentScope = null;
                }
                
                // Limpar referência do container anterior
                if (containerElement) {
                    try {
                        containerElement.empty();
                    } catch (e) {
                        // Ignorar erro
                    }
                    containerElement = null;
                }
                
                // Debug: verificar qual rota está sendo carregada
                
                if (!$scope.rota) {
                    $scope.carregando = false;
                    return;
                }

                // Buscar rota na configuração
                var routeConfig = buscarRotaConfigurada($scope.rota);
                var htmlPath = null;
                var templateContent = null;
                
                // Extrair parâmetros da rota (ex: /sistema-comunicados/comunicados/cadastro -> acao = "cadastro")
                var partesRota = $scope.rota.split('/').filter(function(p) { return p.length > 0; });
                var acaoRota = partesRota.length > 2 ? partesRota[2] : '';
                
                // Obter templateUrl ou template da rota configurada ou converter rota
                if (routeConfig) {
                    
                    if (routeConfig.templateUrl) {
                        htmlPath = routeConfig.templateUrl;
                    } else if (routeConfig.template) {
                        // A rota usa template inline (string), não templateUrl
                        templateContent = routeConfig.template;
                        
                        // Se o template é estrutura-gerencia, adicionar atributos necessários
                        if (templateContent.indexOf('<estrutura-gerencia') !== -1) {
                            var attrs = [];
                            
                            // Adicionar classe se existir na rota
                            if (routeConfig.classe) {
                                attrs.push('classe="' + routeConfig.classe + '"');
                            }
                            
                            // Adicionar funcao-estrutura se existir na rota
                            if (routeConfig.funcaoEstrutura) {
                                attrs.push('funcao-estrutura="' + routeConfig.funcaoEstrutura + '"');
                            }
                            
                            // Adicionar subacao (ação da rota) se existir
                            if (acaoRota) {
                                attrs.push('subacao="' + acaoRota + '"');
                            }
                            
                            // Adicionar local-exibicao="modal" para contexto modal
                            attrs.push('local-exibicao="modal"');
                            
                            // Adicionar parâmetros se existirem
                            // Passar parâmetros diretamente como string (sem JSON.stringify para manter formato original)
                            if ($scope.parametros) {
                                var parametrosStr = '';
                                if (typeof $scope.parametros === 'string') {
                                    // Se já for string, usar diretamente (mantém formato original)
                                    parametrosStr = $scope.parametros;
                                } else if (typeof $scope.parametros === 'object') {
                                    // Se for objeto, converter para JSON string
                                    parametrosStr = JSON.stringify($scope.parametros);
                                } else {
                                    // Outros tipos, converter para string
                                    parametrosStr = String($scope.parametros);
                                }
                                
                                // Escapar aspas para uso em atributo HTML
                                parametrosStr = parametrosStr.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                                attrs.push('parametros="' + parametrosStr + '"');
                            }
                            
                            // Montar o template com os atributos
                            if (attrs.length > 0) {
                                templateContent = templateContent.replace(
                                    /<estrutura-gerencia([^>]*)>/,
                                    '<estrutura-gerencia $1 ' + attrs.join(' ') + '>'
                                );
                            }
                        }
                    } else {
                        htmlPath = rotaParaHTML($scope.rota);
                    }
                } else {
                    htmlPath = rotaParaHTML($scope.rota);
                }

                // Função para verificar se um controller está disponível
                function verificarControllerDisponivel(controllerName) {
                    if (!controllerName) return false;
                    
                    try {
                        // Tentar obter o controller via $controller
                        var $controller = $injector.get('$controller');
                        
                        // Tentar diferentes variações do nome do controller
                        var variacoes = [
                            controllerName, // Nome original (ex: comunicadoCtrl)
                            controllerName + 'Controller', // Com Controller (ex: comunicadoCtrlController)
                            controllerName.replace(/Ctrl$/, '') + 'Controller', // Sem Ctrl + Controller (ex: comunicadoController)
                            controllerName.replace(/Ctrl$/, '') + 'Ctrl' // Sem Ctrl + Ctrl (ex: comunicadoCtrl)
                        ];
                        
                        // Remover duplicatas
                        variacoes = variacoes.filter(function(value, index, self) {
                            return self.indexOf(value) === index;
                        });
                        
                        // Tentar cada variação
                        for (var i = 0; i < variacoes.length; i++) {
                            try {
                                var nome = variacoes[i];
                                // Tentar instanciar o controller (mas sem criar scope)
                                var controllerFn = $controller(nome, {});
                                if (controllerFn) {
                                    return true;
                                }
                            } catch (e) {
                                // Continuar tentando outras variações
                            }
                        }
                        
                        // Se não conseguiu instanciar, verificar no módulo Angular
                        var appModule = angular.module('app');
                        if (appModule._invokeQueue) {
                            for (var j = 0; j < appModule._invokeQueue.length; j++) {
                                var item = appModule._invokeQueue[j];
                                if (item[0] === '$controllerProvider' && 
                                    item[1] === 'register' && 
                                    item[2] && item[2][0]) {
                                    var registeredName = item[2][0];
                                    // Verificar se algum dos nomes registrados corresponde
                                    for (var k = 0; k < variacoes.length; k++) {
                                        if (registeredName === variacoes[k] || 
                                            registeredName === variacoes[k].replace(/Controller$/, 'Ctrl') ||
                                            registeredName === variacoes[k].replace(/Ctrl$/, 'Controller')) {
                                            return true;
                                        }
                                    }
                                }
                            }
                        }
                        
                        return false;
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
                    var maxTentativas = 30;
                    var delayInicial = 200;
                    var delayMaximo = 2000;
                    
                    // Função interna para processar o HTML
                    var processarHTML = function(htmlContent) {
                        // Aguardar um pequeno delay para garantir que o DOM está atualizado
                        $timeout(function() {
                            // Usar o modalId para encontrar o container correto (ID único por modal)
                            var containerId = $scope.modalId + '-content-container';
                            var container = document.getElementById(containerId);
                            
                            if (!container) {
                                // Fallback: tentar encontrar dentro do modal
                                var modalElement = document.getElementById($scope.modalId);
                                if (modalElement) {
                                    container = modalElement.querySelector('.modal-content-container');
                                }
                            }
                            
                            if (!container) {
                                $scope.carregando = false;
                                return;
                            }

                            // Remover tags <script> e <meta> do HTML (já foram carregados via ocLazyLoad)
                            htmlContent = htmlContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
                            htmlContent = htmlContent.replace(/<meta[^>]*>/gi, '');
                            
                            // Extrair controllers necessários do HTML
                            var controllersNecessarios = extrairControllersDoHTML(htmlContent);
                            
                            // Verificar se todos os controllers estão disponíveis
                            var todosDisponiveis = true;
                            if (controllersNecessarios.length > 0) {
                                for (var i = 0; i < controllersNecessarios.length; i++) {
                                    var controllerName = controllersNecessarios[i];
                                    var disponivel = verificarControllerDisponivel(controllerName);
                                    if (!disponivel) {
                                        todosDisponiveis = false;
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
                                container.innerHTML = '<div class="alert alert-danger">Erro: Controllers não encontrados: ' + 
                                                      controllersNecessarios.join(', ') + '</div>';
                                $scope.carregando = false;
                                return;
                            }
                            
                            // Todos os controllers estão disponíveis, compilar
                            try {
                                // Criar novo scope filho ISOLADO diretamente do $rootScope
                                // Isso garante que o modal não interfira no scope de origem
                                if (contentScope) {
                                    contentScope.$destroy();
                                }
                                // Criar scope isolado diretamente do $rootScope para evitar interferência
                                contentScope = $rootScope.$new(true); // true = scope isolado
                                
                                // Garantir que abrirModal esteja disponível no contentScope
                                // Isso permite abrir modais a partir de outros modais
                                if ($rootScope.abrirModal) {
                                    contentScope.abrirModal = $rootScope.abrirModal;
                                }
                                
                                // Copiar parâmetros para o contentScope se existirem
                                if ($scope.parametros) {
                                    contentScope.parametros = angular.copy($scope.parametros);
                                }
                                
                                // Limpar container antes de inserir
                                container.innerHTML = '';
                                
                                // Limpar referência anterior se existir
                                if (containerElement && containerElement[0] !== container) {
                                    try {
                                        containerElement.empty();
                                    } catch (e) {
                                        // Ignorar erro se já foi limpo
                                    }
                                }
                                
                                // Inserir HTML diretamente no container usando angular.element
                                containerElement = angular.element(container);
                                containerElement.html(htmlContent);
                                
                                // Instanciar o controller da rota se existir (ANTES de compilar)
                                if (routeConfig && routeConfig.controller) {
                                    try {
                                        var $controller = $injector.get('$controller');
                                        
                                        // Criar objeto de parâmetros para o controller
                                        // O AngularJS vai injetar automaticamente os serviços necessários do $injector
                                        // quando passamos um objeto com $scope, ele usa isso e injeta o resto automaticamente
                                        var controllerParams = {
                                            $scope: contentScope,
                                            $element: containerElement,
                                            $attrs: {},
                                            $routeParams: {},
                                            $route: $route
                                        };
                                        
                                        // Instanciar o controller no contentScope
                                        // O AngularJS vai resolver automaticamente todas as dependências do controller
                                        // através do $injector, incluindo $rootScope, APIServ, $parse, $http, etc.
                                        $controller(routeConfig.controller, controllerParams);
                                    } catch (controllerError) {
                                        // Se não conseguir instanciar o controller, continuar mesmo assim
                                        // Ignorar erro ao instanciar controller da rota
                                    }
                                }
                                
                                // Compilar todo o conteúdo do container - isso processará todas as diretivas
                                $compile(containerElement.contents())(contentScope);
                                
                                // A diretiva estrutura-gerencia faz uma chamada HTTP e monta o HTML dinamicamente
                                // Vamos monitorar quando o conteúdo aparecer antes de esconder o loading
                                var estruturaGerencia = container.querySelector('estrutura-gerencia');
                                if (estruturaGerencia) {
                                    // Função para verificar se o conteúdo foi montado
                                    var verificarConteudo = function(tentativas) {
                                        tentativas = tentativas || 0;
                                        var maxTentativas = 50;
                                        var delayVerificacao = 300;
                                        
                                        if (tentativas >= maxTentativas) {
                                            // Mesmo assim, esconder o loading
                                            $scope.carregando = false;
                                            if (!$scope.$$phase && !$rootScope.$$phase) {
                                                $scope.$digest();
                                            }
                                            return;
                                        }
                                        
                                        var estruturaGerenciaAtual = container.querySelector('estrutura-gerencia');
                                        if (estruturaGerenciaAtual && estruturaGerenciaAtual.innerHTML && estruturaGerenciaAtual.innerHTML.trim() !== '') {
                                            // Agora sim, esconder o loading
                                            $scope.carregando = false;
                                            
                                            // Forçar digest para garantir que tudo seja renderizado
                                            if (!$scope.$$phase && !$rootScope.$$phase) {
                                                $scope.$digest();
                                            }
                                        } else {
                                            // Ainda não montou, verificar novamente
                                            $timeout(function() {
                                                verificarConteudo(tentativas + 1);
                                            }, delayVerificacao);
                                        }
                                    };
                                    
                                    // Iniciar verificação após um pequeno delay
                                    $timeout(function() {
                                        verificarConteudo(0);
                                    }, 300);
                                } else {
                                    // Se não encontrou a diretiva, pode ser que não precise dela
                                    // Esconder o loading normalmente
                                    $scope.carregando = false;
                                    if (!$scope.$$phase && !$rootScope.$$phase) {
                                        $scope.$digest();
                                    }
                                }
                            } catch (compileError) {
                                var errorMessage = compileError.message || compileError.toString();
                                container.innerHTML = '<div class="alert alert-danger">Erro ao compilar conteúdo: ' + 
                                                      (errorMessage || 'Erro desconhecido') + '</div>';
                                $scope.carregando = false;
                                if (!$scope.$$phase && !$rootScope.$$phase) {
                                    $scope.$digest();
                                }
                            }
                            }, 50); // Pequeno delay para garantir que o DOM está pronto
                        };
                    
                    // Se temos template inline, usar diretamente
                    if (templateContent) {
                        processarHTML(templateContent);
                        return;
                    }
                    
                    // Caso contrário, fazer requisição HTTP para carregar o arquivo
                    if (!htmlPath) {
                        $scope.carregando = false;
                        return;
                    }
                    
                    $http.get(htmlPath)
                        .then(function(response) {
                            processarHTML(response.data);
                        })
                        .catch(function(error) {
                            // Usar o modalId para encontrar o container correto
                            var containerId = $scope.modalId + '-content-container';
                            var container = document.getElementById(containerId);
                            
                            if (!container) {
                                var modalElement = document.getElementById($scope.modalId);
                                if (modalElement) {
                                    container = modalElement.querySelector('.modal-content-container');
                                }
                            }
                            
                            if (container) {
                                container.innerHTML = '<div class="alert alert-danger">Erro ao carregar conteúdo</div>';
                            }
                            $scope.carregando = false;
                        });
                };

                // Função para verificar se o controller da rota está disponível
                var verificarControllerRota = function(controllerName, callback, tentativas) {
                    tentativas = tentativas || 0;
                    var maxTentativas = 10; // Reduzir de 20 para 10 tentativas (mais rápido)
                    
                    if (!controllerName) {
                        callback(true);
                        return;
                    }
                    
                    // Tentar verificar com o nome original e também sem "Ctrl"
                    var controllerBase = controllerName.replace(/Ctrl$/, '');
                    var disponivel1 = verificarControllerDisponivel(controllerName); // Com Ctrl
                    var disponivel2 = verificarControllerDisponivel(controllerBase); // Sem Ctrl
                    var disponivel = disponivel1 || disponivel2;
                    
                    if (disponivel) {
                        callback(true);
                    } else if (tentativas < maxTentativas) {
                        $timeout(function() {
                            verificarControllerRota(controllerName, callback, tentativas + 1);
                        }, 150);
                    } else {
                        callback(false); // Continuar mesmo assim - o conteúdo pode funcionar sem o controller sendo verificado
                    }
                };
                
                // Se a rota tem resolve.loadMyCtrl, carregar arquivos primeiro
                // IMPORTANTE: Mesmo com template inline, precisamos carregar os arquivos JS/CSS primeiro
                if (routeConfig && routeConfig.resolve && routeConfig.resolve.loadMyCtrl) {
                    var resolveFn = routeConfig.resolve.loadMyCtrl[1];
                    if (resolveFn && typeof resolveFn === 'function') {
                        try {
                            var promise = resolveFn($ocLazyLoad);
                            if (promise && promise.then) {
                                promise
                                    .then(function() {
                                        // Verificar se o controller da rota está disponível antes de compilar
                                        // Mas não bloquear se não encontrar - o conteúdo pode funcionar mesmo assim
                                        var controllerRota = routeConfig.controller;
                                        verificarControllerRota(controllerRota, function(controllerDisponivel) {
                                            // Aguardar um delay adicional para garantir que o Angular processe tudo
                                            var delay = controllerDisponivel ? 600 : 800;
                                            $timeout(function() {
                                                carregarECompilarHTML(0);
                                            }, delay);
                                        });
                                    })
                                    .catch(function(error) {
                                        // Tentar carregar HTML mesmo assim após um delay
                                        $timeout(function() {
                                            carregarECompilarHTML(0);
                                        }, 500);
                                    });
                                return;
                            } else {
                                // Se não retornou promise, aguardar um pouco e tentar mesmo assim
                                $timeout(function() {
                                    carregarECompilarHTML(0);
                                }, 500);
                                return;
                            }
                        } catch (e) {
                            // Tentar mesmo assim após um delay
                            $timeout(function() {
                                carregarECompilarHTML(0);
                            }, 500);
                            return;
                        }
                    }
                }

                // Se não tem resolve ou se houve erro, carregar HTML diretamente
                // Mas aguardar um pequeno delay para garantir que o DOM está pronto
                $timeout(function() {
                    carregarECompilarHTML(0);
                }, 100);
            }

            // Fechar modal
            $scope.fecharModal = function(dados) {
                // Destruir scope do conteúdo PRIMEIRO para evitar watchers ativos
                if (contentScope) {
                    try {
                        // Remover todos os watchers antes de destruir
                        if (contentScope.$$watchers) {
                            contentScope.$$watchers = [];
                        }
                        contentScope.$destroy();
                    } catch (e) {
                        // Ignorar erro
                    }
                    contentScope = null;
                }
                
                // Limpar container HTML depois
                // Usar o modalId para encontrar o container correto (ID único por modal)
                var containerId = $scope.modalId + '-content-container';
                var container = document.getElementById(containerId);
                
                if (!container) {
                    // Fallback: tentar encontrar dentro do modal
                    var modalElement = document.getElementById($scope.modalId);
                    if (modalElement) {
                        container = modalElement.querySelector('.modal-content-container');
                    }
                }
                
                if (container) {
                    // Descompilar e remover conteúdo
                    if (containerElement) {
                        try {
                            containerElement.empty();
                            containerElement = null;
                        } catch (e) {
                            // Ignorar erro
                        }
                    }
                    // Limpar HTML diretamente
                    container.innerHTML = '';
                }
                
                // Esconder modal
                $('#' + $scope.modalId).modal('hide');
                
                // Chamar callback de fechamento
                if ($scope.onClose) {
                    $scope.onClose({ dados: dados });
                }
            };

            // Limpar scope quando o modal for destruído
            $scope.$on('$destroy', function() {
                // Destruir scope do conteúdo PRIMEIRO
                if (contentScope) {
                    try {
                        // Remover todos os watchers antes de destruir
                        if (contentScope.$$watchers) {
                            contentScope.$$watchers = [];
                        }
                        contentScope.$destroy();
                    } catch (e) {
                        // Ignorar erro
                    }
                    contentScope = null;
                }
                
                // Limpar referência do container
                if (containerElement) {
                    try {
                        containerElement.empty();
                    } catch (e) {
                        // Ignorar erro
                    }
                    containerElement = null;
                }
                
                // Limpar container HTML
                // Usar o modalId para encontrar o container correto (ID único por modal)
                var containerId = $scope.modalId + '-content-container';
                var container = document.getElementById(containerId);
                
                if (!container) {
                    // Fallback: tentar encontrar dentro do modal
                    var modalElement = document.getElementById($scope.modalId);
                    if (modalElement) {
                        container = modalElement.querySelector('.modal-content-container');
                    }
                }
                
                if (container) {
                    container.innerHTML = '';
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

            var modalId = 'popup-modal-' + (++contadorId);
            // Criar scope ISOLADO para o modal (true = isolado)
            var modalScope = $rootScope.$new(true);
            
            // Garantir que a rota seja uma string válida
            var rotaParaModal = config.rota || '';
            if (typeof rotaParaModal !== 'string') {
                rotaParaModal = String(rotaParaModal);
            }
            
            // Debug: verificar se a rota está sendo passada corretamente
            
            modalScope.modalId = modalId;
            modalScope.titulo = config.titulo;
            modalScope.rota = rotaParaModal;
            // Copiar parâmetros para evitar referências compartilhadas
            modalScope.parametros = angular.copy(config.parametros);

            modalScope.onClose = function (dados) {
                self.fechar(modalId);
                if (dados && dados.dados) {
                    deferred.resolve(dados.dados);
                } else {
                    deferred.reject('Modal fechado');
                }
            };

            // Escapar a rota corretamente para uso em atributo HTML
            var rotaEscapada = rotaParaModal.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            
            var modalHtml = '<pop-up-modal ' +
                'modal-id="' + modalId + '" ' +
                'titulo="' + (config.titulo || 'Modal').replace(/"/g, '&quot;').replace(/'/g, '&#39;') + '" ' +
                'rota="' + rotaEscapada + '" ' +
                'parametros="parametros" ' +
                'on-close="onClose(dados)">' +
                '</pop-up-modal>';

            var modalElement = $compile(modalHtml)(modalScope);
            angular.element(document.body).append(modalElement);

            $timeout(function () {
                // Configurar modal para permitir modais aninhados
                // Não fechar modais anteriores quando abrir um novo
                $('#' + modalId).modal({
                    backdrop: 'static',
                    keyboard: false,
                    show: true
                });
                
                // Prevenir que o Bootstrap feche modais anteriores quando abrir um novo
                // Isso permite modais aninhados
                $('#' + modalId).on('show.bs.modal', function (e) {
                    // Não esconder modais anteriores
                    $('.modal:not(#' + modalId + ')').not('.modal-backdrop').css('z-index', 1040);
                });
                
                // Ajustar z-index para modais aninhados
                $('#' + modalId).css('z-index', 1050 + (modaisAtivos.length * 10));
                
                // Ajustar backdrop para modais aninhados
                if (modaisAtivos.length > 0) {
                    // Se já existe um modal aberto, não criar novo backdrop
                    $('.modal-backdrop').last().css('z-index', 1040 + (modaisAtivos.length * 10) - 5);
                }

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
                // Esconder modal primeiro
                $('#' + modalId).modal('hide');

                $timeout(function () {
                    // Destruir scope PRIMEIRO para evitar watchers ativos
                    try {
                        // Remover todos os watchers antes de destruir
                        if (modal.scope && modal.scope.$$watchers) {
                            modal.scope.$$watchers = [];
                        }
                        if (modal.scope) {
                            modal.scope.$destroy();
                        }
                    } catch (e) {
                        // Ignorar erro
                    }
                    
                    // Limpar qualquer conteúdo HTML dentro do modal antes de remover
                    // Usar o ID único do container baseado no modalId
                    var containerId = modalId + '-content-container';
                    var containerElement = modal.element.find('#' + containerId);
                    if (!containerElement || containerElement.length === 0) {
                        containerElement = modal.element.find('.modal-content-container');
                    }
                    if (containerElement && containerElement.length > 0) {
                        containerElement.empty();
                    }
                    
                    // Remover elemento do DOM
                    modal.element.remove();

                    // Remover da lista de modais ativos
                    var index = modaisAtivos.indexOf(modal);
                    if (index > -1) {
                        modaisAtivos.splice(index, 1);
                    }
                }, 300);
            }
        };

        /**
         * Identificar e fechar o modal que contém um elemento específico
         * @param {HTMLElement} elemento - Elemento dentro do modal que deve ser fechado
         * @returns {string|null} ID do modal encontrado e fechado, ou null se não encontrar
         */
        self.identificarEFecharModalAtual = function(elemento) {
            if (!elemento) {
                return null;
            }

            // Converter para elemento DOM se for jQuery ou Angular element
            var elementoDOM = elemento;
            if (elemento.jquery || elemento[0]) {
                elementoDOM = elemento[0] || elemento;
            }

            var modalElement = null;
            
            // Procurar pelo elemento modal subindo na hierarquia DOM
            var elementoAtual = elementoDOM;
            while (elementoAtual && elementoAtual !== document.body) {
                // Verificar se o elemento atual é um modal ou está dentro de um modal
                if (elementoAtual.classList && 
                    (elementoAtual.classList.contains('modal') || 
                     elementoAtual.classList.contains('popup-modal'))) {
                    modalElement = elementoAtual;
                    break;
                }
                elementoAtual = elementoAtual.parentElement;
            }
            
            // Se não encontrou pelo elemento, tentar encontrar pelo container do modal
            if (!modalElement) {
                // Procurar pelo container que tem o padrão de ID do PopUpModal
                var container = null;
                if (elementoDOM.closest) {
                    container = elementoDOM.closest('[id*="-content-container"]');
                } else {
                    // Fallback para navegadores que não suportam closest
                    var elementoAtualContainer = elementoDOM;
                    while (elementoAtualContainer && elementoAtualContainer !== document.body) {
                        if (elementoAtualContainer.id && elementoAtualContainer.id.indexOf('-content-container') !== -1) {
                            container = elementoAtualContainer;
                            break;
                        }
                        elementoAtualContainer = elementoAtualContainer.parentElement;
                    }
                }
                
                if (container) {
                    var containerId = container.id;
                    var modalId = containerId.replace('-content-container', '');
                    modalElement = document.getElementById(modalId);
                }
            }
            
            // Se ainda não encontrou, tentar encontrar qualquer modal que contenha este elemento
            if (!modalElement) {
                var modais = document.querySelectorAll('.modal, .popup-modal');
                for (var i = 0; i < modais.length; i++) {
                    if (modais[i].contains(elementoDOM)) {
                        modalElement = modais[i];
                        break;
                    }
                }
            }
            
            if (modalElement && modalElement.id) {
                var modalId = modalElement.id;
                
                // Fechar o modal usando o método fechar do serviço
                self.fechar(modalId);
                
                return modalId;
            } else {
                return null;
            }
        };
    }
]);

/**
 * Função global para abrir modais (compatibilidade com código existente)
 */
angular.module('app').run(['$rootScope', 'PopUpModal', '$parse', '$injector', function ($rootScope, PopUpModal, $parse, $injector) {
    
    /**
     * Função recursiva para avaliar expressões Angular em objetos
     * Procura por strings que parecem expressões Angular e as avalia no contexto do scope
     * @param {Object} obj - Objeto a ser processado
     * @param {Object} scope - Scope do Angular para avaliar expressões
     * @param {Function} avaliadorCustomizado - Função opcional para avaliar expressões (recebe expressao, scope, retorna valor)
     */
    function avaliarExpressoes(obj, scope, avaliadorCustomizado) {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }
        
        // Se for array, processar cada elemento
        if (Array.isArray(obj)) {
            return obj.map(function(item) {
                return avaliarExpressoes(item, scope, avaliadorCustomizado);
            });
        }
        
        // Se for objeto, processar cada propriedade
        var resultado = {};
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                var valor = obj[key];
                
                // Se for objeto ou array, processar recursivamente
                if (typeof valor === 'object' && valor !== null) {
                    resultado[key] = avaliarExpressoes(valor, scope, avaliadorCustomizado);
                }
                // Se for string, verificar se é uma expressão Angular
                else if (typeof valor === 'string' && valor.length > 0) {
                    // Verificar se parece uma expressão Angular (contém ponto, não começa com aspas, etc)
                    // Expressões típicas: "novoResultado.codigo_cidade", "dadosTorneio.tipo_passaro", etc
                    var expressaoRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)+$/;
                    
                    if (expressaoRegex.test(valor.trim())) {
                        try {
                            var valorAvaliado;
                            
                            // Se houver um avaliador customizado, usar ele
                            if (avaliadorCustomizado && typeof avaliadorCustomizado === 'function') {
                                valorAvaliado = avaliadorCustomizado(valor, scope);
                            } else {
                                // Caso contrário, usar avaliação padrão
                                var parseFn = $parse(valor);
                                valorAvaliado = parseFn(scope);
                            }
                            
                            // Se a avaliação retornou algo válido (não undefined por erro), usar o valor avaliado
                            if (valorAvaliado !== undefined) {
                                resultado[key] = valorAvaliado;
                            } else {
                                // Se retornou undefined, manter a string original (pode ser uma string literal)
                                resultado[key] = valor;
                            }
                        } catch (e) {
                            // Se houver erro ao avaliar, manter a string original
                            resultado[key] = valor;
                        }
                    } else {
                        // Não é uma expressão, manter como está
                        resultado[key] = valor;
                    }
                } else {
                    // Outros tipos (number, boolean, null), manter como está
                    resultado[key] = valor;
                }
            }
        }
        return resultado;
    }
    
    // Função auxiliar para encontrar o scope que contém uma variável
    function encontrarScopeComVariavel(expressao, scopeInicial) {
        var partes = expressao.split('.');
        if (partes.length === 0) return scopeInicial;
        
        var primeiraParte = partes[0];
        var scopeAtual = scopeInicial;
        
        // Tentar encontrar o scope que contém a primeira variável
        while (scopeAtual) {
            try {
                var parseFn = $parse(primeiraParte);
                var valor = parseFn(scopeAtual);
                if (valor !== undefined && valor !== null) {
                    return scopeAtual;
                }
            } catch (e) {
                // Continuar procurando
            }
            
            scopeAtual = scopeAtual.$parent;
        }
        
        return scopeInicial; // Retornar o inicial se não encontrar
    }
    
    // Função principal para abrir modais - usada em ng-click nos templates
    $rootScope.abrirModal = function (rota, parametros, titulo) {
        // Debug: verificar qual rota está sendo passada
        
        var parametrosProcessados = {};
        
        if (parametros && typeof parametros === 'object') {
            // Tentar obter o scope atual através do contexto Angular
            // Quando chamada de ng-click, o Angular pode ter o scope disponível
            var scopeParaAvaliar = $rootScope;
            
            // Tentar várias estratégias para obter o scope correto:
            // 1. Verificar se 'this' é um scope (quando chamado de ng-click com contexto)
            try {
                if (this && typeof this === 'object' && this.$id !== undefined && this.$eval) {
                    scopeParaAvaliar = this;
                }
            } catch (e) {
                // Ignorar erro
            }
            
            // 2. Se não encontrou, tentar usar $rootScope e percorrer seus filhos
            // Mas isso é complexo, então vamos usar uma estratégia melhor:
            // Avaliar expressões tentando no $rootScope primeiro, e se não encontrar,
            // tentar com uma busca mais ampla
            
            // Função melhorada de avaliação que tenta múltiplos scopes
            function avaliarExpressaoComFallback(expressao, scope) {
                // Primeiro tentar no scope fornecido
                try {
                    var parseFn = $parse(expressao);
                    var valor = parseFn(scope);
                    if (valor !== undefined) {
                        return valor;
                    }
                } catch (e) {
                    // Continuar tentando
                }
                
                // Tentar encontrar o scope que contém a variável
                var scopeCorreto = encontrarScopeComVariavel(expressao, scope);
                try {
                    var parseFn2 = $parse(expressao);
                    var valor2 = parseFn2(scopeCorreto);
                    if (valor2 !== undefined) {
                        return valor2;
                    }
                } catch (e) {
                    // Se não conseguir, retornar undefined (manter string original)
                }
                
                return undefined;
            }
            
            // Processar parâmetros com avaliação melhorada
            parametrosProcessados = avaliarExpressoes(parametros, scopeParaAvaliar, avaliarExpressaoComFallback);
        } else {
            parametrosProcessados = parametros || {};
        }
        
        // Debug: verificar rota final antes de abrir o modal
        
        return PopUpModal.abrir({
            rota: rota,
            parametros: parametrosProcessados,
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
