// Diretiva original selectFiltrosPesquisaOriginal para fallback/teste
angular.module('directivesPadrao').directive('selectFiltrosPesquisaOriginal', ['$compile', '$parse', 'APIServ', 'EGFuncoes', 'APIAjuFor',
    function ($compile, $parse, APIServ, EGFuncoes, APIAjuFor) {
        return {
            restrict: 'E',
            replace: true,
            template: '<select id="campo_consulta" class="form-control"><option value="">Selecione o Campo</option></select>',
            link: function (scope, elem, attr) {
                $parse('camposFiltroPesquisa').assign(scope, scope.camposFiltroPesquisa);
                elem.attr('ng-model', `filtros[${scope.$index}]['campo']`);
                elem.attr('id', `filtros_${scope.$index}_campo`);
                elem.attr('ng-options', 'key as c.texto for (key, c) in camposFiltroPesquisa');
                $compile(elem)(scope);
                elem.bind(' change', function () {
                    if (this.value == '') {
                        return false;
                    }
                    var indice = scope.$index;
                    var campo = scope.filtros[indice]['campo'];
                    //Juntando os valores do campo nos tres locais possiveis, campo, campos filtro pesquisa e campos filtros padrao
                    var dadosCampo = APIServ.buscarValorVariavel(scope.estrutura.campos, campo);
                    var dadosCampoFiltroPesquisa = scope.estrutura.camposFiltroPesquisa != undefined && scope.estrutura.camposFiltroPesquisa[campo] != undefined ? scope.estrutura.camposFiltroPesquisa[campo] : {};
                    var dadosCampoFiltroPadrao = scope.estrutura.filtrosPadrao != undefined && scope.estrutura.filtrosPadrao[campo] != undefined ? scope.estrutura.filtrosPadrao[campo] : {};
                    var dadosFiltro = Object.assign({}, dadosCampoFiltroPadrao, dadosCampo, dadosCampoFiltroPesquisa);
                    scope.filtros[indice]['texto'] = this.options[this.selectedIndex].innerHTML;
                    scope.filtros[indice]['valor'] = dadosFiltro['padrao'] != undefined ? dadosFiltro['padrao'] : dadosFiltro['valor'] != undefined ? dadosFiltro['valor'] : '';
                    var tipoFiltro = dadosFiltro.tipoFiltro != undefined ? dadosFiltro.tipoFiltro : dadosFiltro.tipo != undefined ? dadosFiltro.tipo : '';
                    scope.filtros[indice]['tipo'] = tipoFiltro;
                    //Pondo este elemente para ver se ele ira fazer o blur ao clicar
                    elem.attr('tipoFiltro', tipoFiltro);
                    $compile(elem)(scope);
                    angular.element('#filtros_' + indice + '_campo').val('string:' + campo);
                    scope.filtros[indice]['campo'] = campo;
                    if (tipoFiltro != 'intervaloDatas') {
                        var cF = dadosFiltro; // scope.estrutura.camposFiltroPesquisa;
                        var campos = scope.estrutura.campos;
                        var mascara = '';
                        if (cF['tipo'] != undefined && cF['tipo'] != 'texto') {
                            mascara = cF['tipo'];
                        } else if (campo != undefined && campos[campo] != undefined && campos[campo]['tipo'] != undefined && campos[campo]['tipo'] != 'texto') {
                            mascara = campos[campo]['tipo'];
                        }
                        var valorMascara = '';
                        if (campo != '' && campo != null) {
                            var keyArray = angular.element(elem).attr('keyArray');
                            valorMascara = cF['valor'] != undefined ? cF['valor'] : '';
                            if (valorMascara == 'data' && typeof APIAjuFor !== 'undefined' && APIAjuFor.dataAtual) {
                                valorMascara = APIAjuFor.dataAtual();
                            }
                            if (keyArray && scope.filtros[keyArray]) {
                                scope.filtros[keyArray]['valoresMascara'] = valorMascara;
                                var valor = angular.isObject(valorMascara) ? valorMascara[0] : valorMascara;
                                var operador = cF.operador != undefined ? cF.operador : 'like';
                                scope.filtros[keyArray]['operador'] = operador;
                            }
                        }
                        try {
                            var div = null;
                            if (elem.closest('.linhaFiltro').length > 0) {
                                div = elem.closest('.linhaFiltro').find('.divValorConsulta');
                            }
                            if (!div || div.length === 0) {
                                div = angular.element(elem).parent('div').siblings('div.divValorConsulta');
                            }
                            if (!div || div.length === 0) {
                                div = angular.element(document).find('.divValorConsulta').eq(indice);
                            }
                            if (div && div.length > 0) {
                                angular.element(div).html('');
                                div.removeClass('input-group').addClass('form-group');
                                var inputValor = '';
                                if (!angular.isObject(valorMascara)) {
                                    inputValor = `<input type="text" ng-model="filtros[${indice}]['valor']" id="filtros_${indice}_valor" class="form-control valorConsulta" placeholder="Defina o Valor">`;
                                } else {
                                    inputValor = `<select ng-model="filtros[${indice}]['valor']" ng-options="key as value for (key, value) in filtro.valoresMascara" id="filtros_${indice}_valor" class="form-control"></select>`;
                                }
                                div.append(inputValor);
                                $compile(div.contents())(scope);
                            }
                        } catch (erro) {
                            console.warn('Erro ao configurar campo de valor:', erro);
                        }
                    } else if (scope.filtros[indice]['tipo'] == 'intervaloDatas') {
                        try {
                            var div = null;
                            if (elem.closest('.linhaFiltro').length > 0) {
                                div = elem.closest('.linhaFiltro').find('.divValorConsulta');
                            }
                            if (!div || div.length === 0) {
                                div = angular.element(elem).parent('div').siblings('div.divValorConsulta');
                            }
                            if (!div || div.length === 0) {
                                div = angular.element(document).find('.divValorConsulta').eq(indice);
                            }
                            if (div && div.length > 0) {
                                angular.element(div).html('');
                                div.removeClass('input-group').addClass('form-group');
                                var inputValor = `<div class="input-group"><span class="input-group-addon">Data Inicial</span><input type="text" class="data form-control" ng-model="filtros[${indice}].di" ui-data placeholder="Data Inicial"><span class="input-group-addon">Data Final</span><input type="text" class="data form-control" ng-model="filtros[${indice}].df" ui-data placeholder="Data Final"></div>`;
                                div.append(inputValor);
                                $compile(div.contents())(scope);
                                if (!scope.filtros[indice].di && typeof APIAjuFor !== 'undefined' && APIAjuFor.primeiroDiaMes) {
                                    scope.filtros[indice].di = APIAjuFor.primeiroDiaMes();
                                }
                                if (!scope.filtros[indice].df && typeof APIAjuFor !== 'undefined' && APIAjuFor.dataAtual) {
                                    scope.filtros[indice].df = APIAjuFor.dataAtual();
                                }
                                scope.filtros[indice].operador = 'between';
                            }
                        } catch (erro) {
                            console.warn('Erro ao configurar intervalo de datas:', erro);
                        }
                    }
                });
            }
        };
    }
]);
