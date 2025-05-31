/**
 * Diretiva selectFiltrosPesquisa
 * Responsável por montar a seleção de campos de filtro e integração com valores
 */
angular.module('directivesPadrao').directive('selectFiltrosPesquisa', ['$compile', '$parse', '$timeout', 'APIServ', 'EGFuncoes', 'APIAjuFor', 
    function ($compile, $parse, $timeout, APIServ, EGFuncoes, APIAjuFor) {
        return {
            restrict: 'E',
            replace: true,
            template: '<select id="campo_consulta" class="form-control"><option value="">Selecione o Campo</option></select>',
            link: function (scope, elem, attr) {
                /**
                 * Monta HTML de campo de valor de acordo com o tipo/mascara
                 */
                var montaCampoValor = function (mascara, valor, indice, campo) {
                    var atributos = [];
                    var classes = [];
                    
                    // Mapeamento de tipos para atributos e classes para melhor manutenção
                    var tiposParaAtributos = {
                        'data': {
                            attr: ['ui-data', 'placeholder="dd/mm/aaaa"'],
                            classes: ['data']
                        },
                        'hora': {
                            attr: ['ui-hora', 'placeholder="hh:mm"'],
                            classes: ['hora']
                        },
                        'telefone': {
                            attr: ['ui-Telefone'],
                            classes: ['telefone']
                        },
                        'inteiro': {
                            attr: ['ui-Inteiro'],
                            classes: ['inteiro']
                        },
                        'decimal2': {
                            attr: ['ui-Decimal2'],
                            classes: ['decimal2']
                        },
                        'decimal': {
                            attr: ['ui-Decimal2'],
                            classes: ['decimal']
                        },
                        'cep': {
                            attr: ['ui-cep'],
                            classes: ['cep']
                        },
                        'cpf-cnpj': {
                            attr: ['ui-cpf-cnpj'],
                            classes: ['cpf-cnpj']
                        },
                        'placa': {
                            attr: ['ui-placa'],
                            classes: ['placa']
                        }
                    };
                    
                    // Aplicar configuração para o tipo especificado
                    if (tiposParaAtributos[mascara]) {
                        atributos = tiposParaAtributos[mascara].attr || [];
                        classes = tiposParaAtributos[mascara].classes || [];
                    }
                    
                    var modeloValor = `filtros[${indice}]['valor']`;
                    var idValor = EGFuncoes.modeloParaId(modeloValor);

                    // Montar HTML para input simples ou select
                    if (!angular.isObject(valor)) {
                        var input = `
                        <input type="text" ng-model="${modeloValor}" id="${idValor}" ${atributos.join(' ')} class="${classes.join(' ')} form-control valorConsulta" placeholder="Defina o Valor">`;
                    } else if (angular.isObject(valor)) {
                        var input = `
                            <select ng-model="${modeloValor}" ng-options="key as value for (key, value) in filtro.valoresMascara" id="${idValor}" ${atributos.join(' ')} class="${classes.join('')} form-control">
                            </select>`;
                    }

                    return input;
                }

                // CORREÇÃO TIMING: Função para configurar o select após a estrutura estar pronta
                function configurarSelect() {
                    // CORREÇÃO SCOPE: Acessar camposFiltroPesquisa do scope pai (estruturaGerencia)
                    var scopePai = scope.$parent || scope;
                    var camposDisponiveis = scopePai.camposFiltroPesquisa || {}; 
                    
                    // Verificar localStorage também
                    var camposNoStorage = APIServ.buscaDadosLocais('camposFiltroPesquisa');
                    
                    // Se não há campos no scope pai, tentar buscar em scopes ancestrais
                    if (Object.keys(camposDisponiveis).length === 0) {
                        var currentScope = scope;
                        while (currentScope.$parent && Object.keys(camposDisponiveis).length === 0) {
                            currentScope = currentScope.$parent;
                            if (currentScope.camposFiltroPesquisa) {
                                camposDisponiveis = currentScope.camposFiltroPesquisa;
                                break;
                            }
                        }
                    }
                    
                    // CORREÇÃO ADICIONAL: Garantir que todos os campos tenham texto definido
                    angular.forEach(camposDisponiveis, function(campo, key) {
                        if (!campo.texto || campo.texto === 'undefined' || typeof campo.texto === 'undefined') {
                            campo.texto = key.replace(/_/g, ' ')
                                             .replace(/bloco/g, 'Bloco')
                                             .replace(/\b\w/g, function(l) { return l.toUpperCase(); });
                            
                        }
                    });
                    
                    // CORREÇÃO: Usar variável local para evitar sobrescrever o scope pai
                    scope.camposFiltroPesquisaLocal = camposDisponiveis;

                    // Configurar atributos do select
                    elem.attr('ng-model', `filtros[${scope.$index}]['campo']`);
                    elem.attr('id', `filtros_${scope.$index}_campo`);
                    // CORREÇÃO: Usar variável local para ng-options
                    elem.attr('ng-options', 'key as c.texto for (key, c) in camposFiltroPesquisaLocal');
                    $compile(elem)(scope);
                }

                // CORREÇÃO TIMING: Aguardar evento de estrutura inicializada
                var estruturaInicializadaListener = scope.$on('estruturaGerenciaInicializada', function() {
                    console.log('DEBUG selectFiltrosPesquisa - Evento estruturaGerenciaInicializada RECEBIDO!');
                    configurarSelectComCacheGlobal(); // USAR NOVA FUNÇÃO
                    if (estruturaInicializadaListener) {
                        estruturaInicializadaListener(); // Remove o listener após execução
                        estruturaInicializadaListener = null;
                    }
                });

                // CORREÇÃO DEFINITIVA: Registrar no cache global para receber updates
                if (window.estruturaGerenciaCache) {
                    window.estruturaGerenciaCache.listeners.push(function(campos) {
                        console.log('DEBUG - Cache global atualizado, reconfigurando select...');
                        configurarSelectComCacheGlobal();
                    });
                }

                // Fallback: Se a estrutura já estiver pronta, configurar imediatamente
                $timeout(function() {
                    // CORREÇÃO DEFINITIVA: Tentar cache global primeiro
                    if (window.estruturaGerenciaCache && window.estruturaGerenciaCache.inicializado) {
                        console.log('selectFiltroPesquisa - Fallback: Configurando com cache global');
                        configurarSelectComCacheGlobal();
                        if (estruturaInicializadaListener) {
                            estruturaInicializadaListener();
                            estruturaInicializadaListener = null;
                        }
                        return;
                    }
                    
                    // CORREÇÃO SCOPE: Verificar campos no scope pai (fallback original)
                    var scopePai = scope.$parent || scope;
                    var camposDisponiveis = scopePai.camposFiltroPesquisa || {};
                    
                    if (Object.keys(camposDisponiveis).length > 0) {
                        console.log('selectFiltroPesquisa - Fallback: Configurando com campos do scope pai');
                        configurarSelectComCacheGlobal();
                        if (estruturaInicializadaListener) {
                            estruturaInicializadaListener(); // Remove o listener se não for mais necessário
                            estruturaInicializadaListener = null;
                        }
                    } else {
                        console.log('selectFiltroPesquisa - Fallback: Aguardando evento de inicialização');
                    }
                }, 100);

                // CORREÇÃO SCOPE: Watch para monitorar mudanças nos campos do scope pai
                scope.$watch(function() {
                    // Priorizar cache global
                    if (window.estruturaGerenciaCache && window.estruturaGerenciaCache.inicializado) {
                        return Object.keys(window.estruturaGerenciaCache.camposFiltroPesquisa).length;
                    }
                    
                    var scopePai = scope.$parent || scope;
                    return scopePai.camposFiltroPesquisa ? Object.keys(scopePai.camposFiltroPesquisa).length : 0;
                }, function(novoValor, valorAnterior) {
                    if (novoValor > 0 && novoValor !== valorAnterior) {
                        console.log('selectFiltroPesquisa - Watch: Campos alterados, reconfigurando...');
                        $timeout(function() {
                            configurarSelectComCacheGlobal(); // USAR NOVA FUNÇÃO
                        }, 50);
                    }
                });

                // CORREÇÃO #3: Evento de alteração do select com binding mais robusto
                elem.bind('change', function () {
                    if (this.value == '') {
                        return false;
                    }
                    
                    var indice = scope.$index;
                    var campo = scope.filtros[indice]['campo'];

                    // CORREÇÃO #3: Validações adicionais para evitar erros
                    if (!campo || !scope.estrutura) {
                        return false;
                    }

                    // Obter dados do campo a partir de múltiplas fontes com validação
                    let dadosCampo = {};
                    let dadosCampoFiltroPesquisa = {};
                    let dadosCampoFiltroPadrao = {};
                    
                    try {
                        dadosCampo = scope.estrutura && scope.estrutura.campos ? 
                            APIServ.buscarValorVariavel(scope.estrutura.campos, campo) : {};
                        
                        dadosCampoFiltroPesquisa = scope.estrutura && scope.estrutura.camposFiltroPesquisa && 
                            scope.estrutura.camposFiltroPesquisa[campo] ? scope.estrutura.camposFiltroPesquisa[campo] : {};
                        
                        dadosCampoFiltroPadrao = scope.estrutura && scope.estrutura.filtrosPadrao && 
                            scope.estrutura.filtrosPadrao[campo] ? scope.estrutura.filtrosPadrao[campo] : {};
                    } catch (erro) {
                        console.warn('Erro ao obter dados do campo:', campo, erro);
                    }
                    
                    // Mesclar dados com precedência correta
                    let dadosFiltro = Object.assign({}, dadosCampoFiltroPadrao, dadosCampo, dadosCampoFiltroPesquisa);

                    // Configurar texto e valor do filtro com validações
                    if (this.options && this.options[this.selectedIndex]) {
                        scope.filtros[indice]['texto'] = this.options[this.selectedIndex].innerHTML;
                    }
                    
                    scope.filtros[indice]['valor'] = dadosFiltro['padrao'] != undefined ? dadosFiltro['padrao'] : 
                        dadosFiltro['valor'] != undefined ? dadosFiltro['valor'] : '';

                    // Definir tipo do filtro
                    let tipoFiltro = dadosFiltro.tipoFiltro != undefined ?
                        dadosFiltro.tipoFiltro : dadosFiltro.tipo != undefined ? dadosFiltro.tipo : '';

                    scope.filtros[indice]['tipo'] = tipoFiltro;

                    // CORREÇÃO #3: Atualização de atributos com validação de elemento
                    try {
                        elem.attr('tipoFiltro', tipoFiltro);
                        $compile(elem)(scope);
                        
                        // Validar se o elemento existe antes de tentar alterar valor
                        var elementoCampo = angular.element('#filtros_' + indice + '_campo');
                        if (elementoCampo.length > 0) {
                            elementoCampo.val('string:' + campo);
                        }
                        
                        scope.filtros[indice]['campo'] = campo;
                    } catch (erro) {
                        console.warn('Erro ao compilar elemento:', erro);
                    }

                    // Tratar tipos diferentes de filtros com validações robustas
                    if (tipoFiltro != 'intervaloDatas') {
                        let cF = dadosFiltro;
                        let campos = scope.estrutura && scope.estrutura.campos ? scope.estrutura.campos : {};

                        // Determinar a máscara a ser usada
                        let mascara = '';
                        if (cF['tipo'] != undefined && cF['tipo'] != 'texto') {
                            mascara = cF['tipo'];
                        } else if (campo != undefined && campos[campo] != undefined && 
                                 campos[campo]['tipo'] != undefined && campos[campo]['tipo'] != 'texto') {
                            mascara = campos[campo]['tipo'];
                        }

                        // Configurar valor da máscara e operador
                        var valorMascara = '';
                        if (campo != '' && campo != null) {
                            let keyArray = angular.element(elem).attr('keyArray');
                            valorMascara = cF['valor'] != undefined ? cF['valor'] : '';
                            
                            // CORREÇÃO #3: Validação de função APIAjuFor antes de usar
                            if (valorMascara == 'data' && typeof APIAjuFor !== 'undefined' && APIAjuFor.dataAtual) {
                                valorMascara = APIAjuFor.dataAtual();
                            }
                            
                            if (keyArray && scope.filtros[keyArray]) {
                                scope.filtros[keyArray]['valoresMascara'] = valorMascara;
                                var valor = angular.isObject(valorMascara) ? valorMascara[0] : valorMascara;

                                let operador = cF.operador != undefined ? cF.operador : 'like';
                                scope.filtros[keyArray]['operador'] = operador;
                            }
                        }                        
                        

                        // CORREÇÃO #3: Substituir campo de valor com validações melhoradas
                        try {
                            let div = angular.element(elem).parent('div').siblings('div.divValorConsulta');
                            if (div.length > 0) {
                                angular.element(div).html('');
                                div.removeClass('input-group').addClass('form-group');

                                let inputValor = montaCampoValor(mascara, valorMascara, indice, campo);
                                div.append(inputValor);

                                // Configurar autocomplete se necessário
                                if (cF['autoCompleta'] != undefined) {
                                    var modeloValor = `filtros[${indice}]['valor']`;
                                    var idValor = EGFuncoes.modeloParaId(modeloValor);
                                    scope.filtros[indice]['campo_chave'] = cF.autoCompleta['campoChave'];
                                    angular.element('#' + idValor).attr('auto-completa', campo);
                                    angular.element('#' + idValor).attr('indice', indice);
                                }

                                $compile(div.contents())(scope);
                            }
                        } catch (erro) {
                            console.warn('Erro ao configurar campo de valor:', erro);
                        }

                    } else if (scope.filtros[indice]['tipo'] == 'intervaloDatas') {
                        // CORREÇÃO #1: Handling corrigido para intervalo de datas - evitar duplicação
                        try {
                            let div = angular.element(elem).parent('div').siblings('div.divValorConsulta');
                            if (div.length > 0) {
                                // Limpar conteúdo anterior completamente
                                angular.element(div).html('');
                                div.removeClass('input-group').addClass('form-group');

                                // Criar campos de intervalo de datas com IDs únicos para evitar conflitos
                                let inputValor = `
                                <div class="input-group mb-2">
                                    <span class="input-group-addon">D.I.</span>
                                    <input type="text" class="data form-control" ng-model="filtros[${indice}].di" ui-data placeholder="Data Inicial" id="di_${indice}">
                                </div>
                                <div class="input-group">
                                    <span class="input-group-addon">D.F.</span>
                                    <input type="text" class="data form-control" ng-model="filtros[${indice}].df" ui-data placeholder="Data Final" id="df_${indice}">
                                </div>`;
                                
                                div.append(inputValor);
                                $compile(div.contents())(scope);
                                
                                // Definir datas padrão se não definidas e APIAjuFor disponível
                                if (!scope.filtros[indice].di && typeof APIAjuFor !== 'undefined' && APIAjuFor.primeiroDiaMes) {
                                    scope.filtros[indice].di = APIAjuFor.primeiroDiaMes();
                                }
                                
                                if (!scope.filtros[indice].df && typeof APIAjuFor !== 'undefined' && APIAjuFor.dataAtual) {
                                    scope.filtros[indice].df = APIAjuFor.dataAtual();
                                }
                                
                                // Definir operador para intervalos de data
                                scope.filtros[indice].operador = 'between';
                                
                                // Evitar aplicação múltipla do $digest cycle
                                if (!scope.$$phase) {
                                    scope.$apply();
                                }
                            }
                        } catch (erro) {
                            console.warn('Erro ao configurar intervalo de datas:', erro);
                        }
                    }
                    
                    // CORREÇÃO #3: Aplicar mudanças no scope com validação
                    try {
                        if (!scope.$$phase) {
                            scope.$apply();
                        }
                    } catch (erro) {
                        // Se já estamos em um ciclo de digest, não precisamos aplicar novamente
                        console.debug('Scope já em processo de digest');
                    }
                });
                
                // CORREÇÃO DEFINITIVA: Função que usa cache global
                function configurarSelectComCacheGlobal() {
                    console.log('DEBUG - configurarSelectComCacheGlobal EXECUTANDO');
                    
                    // Primeira tentativa: cache global
                    var camposDisponiveis = {};
                    
                    if (window.estruturaGerenciaCache && window.estruturaGerenciaCache.inicializado) {
                        camposDisponiveis = angular.copy(window.estruturaGerenciaCache.camposFiltroPesquisa);
                        console.log('DEBUG - Obtido do cache global:', Object.keys(camposDisponiveis));
                    }
                    
                    // Segunda tentativa: scope pai
                    if (Object.keys(camposDisponiveis).length === 0) {
                        var scopePai = scope.$parent || scope;
                        camposDisponiveis = scopePai.camposFiltroPesquisa || {};
                        console.log('DEBUG - Obtido do scope pai:', Object.keys(camposDisponiveis));
                    }
                    
                    // Terceira tentativa: localStorage
                    if (Object.keys(camposDisponiveis).length === 0) {
                        var camposNoStorage = APIServ.buscaDadosLocais('camposFiltroPesquisa');
                        if (camposNoStorage && Object.keys(camposNoStorage).length > 0) {
                            camposDisponiveis = camposNoStorage;
                            console.log('DEBUG - Obtido do localStorage:', Object.keys(camposDisponiveis));
                        }
                    }
                    
                    // Garantir texto para todos os campos
                    angular.forEach(camposDisponiveis, function(campo, key) {
                        if (!campo.texto || campo.texto === 'undefined' || typeof campo.texto === 'undefined') {
                            campo.texto = key.replace(/_/g, ' ')
                                             .replace(/bloco/g, 'Bloco')
                                             .replace(/\b\w/g, function(l) { return l.toUpperCase(); });
                        }
                    });
                    
                    // CORREÇÃO: Usar variável local para evitar sobrescrever o scope pai
                    scope.camposFiltroPesquisaLocal = camposDisponiveis;
                    
                    // Configurar atributos do select
                    elem.attr('ng-model', `filtros[${scope.$index}]['campo']`);
                    elem.attr('id', `filtros_${scope.$index}_campo`);
                    // CORREÇÃO: Usar variável local para ng-options
                    elem.attr('ng-options', 'key as c.texto for (key, c) in camposFiltroPesquisaLocal');
                    $compile(elem)(scope);
                    
                    console.log('DEBUG - SELECT CONFIGURADO com', Object.keys(camposDisponiveis).length, 'campos');
                }
                
                // FUNÇÃO ORIGINAL MANTIDA COMO FALLBACK
                function configurarSelectFallback() {
                    // DEBUG: Log entrada da função
                    console.log('DEBUG configurarSelectFallback - ENTRADA');
                    
                    // CORREÇÃO SCOPE: Acessar camposFiltroPesquisa do scope pai (estruturaGerencia)
                    var scopePai = scope.$parent || scope;
                    var camposDisponiveis = scopePai.camposFiltroPesquisa || {};
                    
                    // DEBUG: Log após obter do scope pai
                    console.log('DEBUG configurarSelectFallback - Campos do scope pai:', 
                        JSON.stringify(camposDisponiveis, null, 2));
                    
                    // Verificar localStorage também
                    var camposNoStorage = APIServ.buscaDadosLocais('camposFiltroPesquisa');
                    console.log('DEBUG configurarSelectFallback - Campos no localStorage:', 
                        JSON.stringify(camposNoStorage, null, 2));
                    
                    // Se não há campos no scope pai, tentar buscar em scopes ancestrais
                    if (Object.keys(camposDisponiveis).length === 0) {
                        console.log('DEBUG configurarSelectFallback - Buscando em scopes ancestrais...');
                        var currentScope = scope;
                        while (currentScope.$parent && Object.keys(camposDisponiveis).length === 0) {
                            currentScope = currentScope.$parent;
                            if (currentScope.camposFiltroPesquisa) {
                                camposDisponiveis = currentScope.camposFiltroPesquisa;
                                console.log('DEBUG configurarSelectFallback - Encontrado em scope ancestral:', 
                                    JSON.stringify(camposDisponiveis, null, 2));
                                break;
                            }
                        }
                    }
                    
                    // CORREÇÃO ADICIONAL: Garantir que todos os campos tenham texto definido
                    angular.forEach(camposDisponiveis, function(campo, key) {
                        if (!campo.texto || campo.texto === 'undefined' || typeof campo.texto === 'undefined') {
                            campo.texto = key.replace(/_/g, ' ')
                                             .replace(/bloco/g, 'Bloco')
                                             .replace(/\b\w/g, function(l) { return l.toUpperCase(); });
                            
                            console.log('selectFiltroPesquisa - Texto corrigido para', key + ':', campo.texto);
                        }
                    });
                    
                    // DEBUG: Stack trace para ver de onde vem a chamada
                    console.trace('DEBUG configurarSelectFallback - Stack trace da chamada');
                    
                    // DEBUG: Comparar todas as fontes de dados
                    console.log('DEBUG COMPARAÇÃO DE FONTES:');
                    console.log('1. Scope pai camposFiltroPesquisa:', scope.$parent?.camposFiltroPesquisa ? Object.keys(scope.$parent.camposFiltroPesquisa) : 'VAZIO');
                    console.log('2. LocalStorage camposFiltroPesquisa:', camposNoStorage ? Object.keys(camposNoStorage) : 'VAZIO');
                    console.log('3. camposDisponiveis final:', Object.keys(camposDisponiveis));
                    
                    // Garantir que temos os campos no scope local para ng-options funcionar
                    console.log('DEBUG LINHA 116 - ANTES da atribuição:');
                    console.log('- camposDisponiveis:', JSON.stringify(camposDisponiveis, null, 2));
                    console.log('- scope.camposFiltroPesquisa antes:', JSON.stringify(scope.camposFiltroPesquisa, null, 2));
                    
                    // CORREÇÃO: Usar variável local para evitar sobrescrever o scope pai
                    scope.camposFiltroPesquisaLocal = camposDisponiveis;
                    
                    console.log('DEBUG LINHA 116 - DEPOIS da atribuição:');
                    console.log('- scope.camposFiltroPesquisaLocal depois:', JSON.stringify(scope.camposFiltroPesquisaLocal, null, 2));
                    
                    // Log para debug
                    console.log('selectFiltroPesquisa - Campos disponíveis:', Object.keys(camposDisponiveis));

                    // Configurar atributos do select
                    elem.attr('ng-model', `filtros[${scope.$index}]['campo']`);
                    elem.attr('id', `filtros_${scope.$index}_campo`);
                    // CORREÇÃO: Usar variável local para ng-options
                    elem.attr('ng-options', 'key as c.texto for (key, c) in camposFiltroPesquisaLocal');
                    $compile(elem)(scope);
                }
            }
        };
    }
]);
