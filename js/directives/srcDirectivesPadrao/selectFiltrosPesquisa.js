/**
 * Diretiva selectFiltrosPesquisa
 * Responsável por montar a seleção de campos de filtro e integração com valores
 */
angular.module('directivesPadrao')
    .directive('selectFiltrosPesquisa', ['$compile', '$parse', 'APIServ', 'EGFuncoes', 'APIAjuFor', function ($compile, $parse, APIServ, EGFuncoes, APIAjuFor) {
        return {
            restrict: 'E',
            replace: true,
            template: '<select id="campo_consulta" class="form-control"><option value="">Selecione o Campo</option></select>',
            link: function (scope, elem, attr) {

                var montaCampoValor = function (mascara, valor, indice, campo) {

                    atributos = [];
                    classes = [];
                    if (mascara == 'data') {
                        atributos.push('ui-data');
                        atributos.push('placeholder="dd/mm/aaaa"');
                        classes.push('data');
                    } else if (mascara == 'hora') {
                        atributos.push('ui-hora');
                        atributos.push('placeholder="hh:mm"');
                    } else if (mascara == 'telefone') {
                        atributos.push('ui-Telefone');
                    } else if (mascara == 'inteiro') {
                        atributos.push('ui-Inteiro');
                    } else if (mascara == 'decimal2') {
                        atributos.push('ui-Decimal2');
                    } else if (mascara == 'cep') {
                        atributos.push('ui-cep');
                    } else if (mascara == 'cpf-cnpj') {
                        atributos.push('ui-cpf-cnpj')
                    } else if (mascara == 'placa') {
                        atributos.push('ui-placa');
                    }
                    var modeloValor = `filtros[${indice}]['valor']`;
                    var idValor = EGFuncoes.modeloParaId(modeloValor);

                    if (!angular.isObject(valor)) {
                        var input = `
                        <input type="text" ng-model="${modeloValor}" id="${idValor}" ${atributos.join(' ')} class="${classes.join(' ')}  form-control valorConsulta" ng-if="filtro.tipo != 'intervaloDatas'" placeholder="Defina o Valor">
                        <!--monta-html campo="${campo}" class="valorConsulta" ng-if="filtro.tipo != 'intervaloDatas'"></monta-html -->
                        
                        <div class="input-group" ng-if="filtro.tipo == 'intervaloDatas'">
                            <span class="input-group-addon">D. F.</span>
                            <input type="text" class="data form-control" ng-model="filtro.df" ui-data placeholder="Data Final">
                        </div>`;
                    } else if (angular.isObject(valor)) {

                        var input = `
                            <select ng-model="${modeloValor}" ng-options="key as value for (key, value) in filtro.valoresMascara" id="${idValor}" ${atributos.join(' ')} class="${classes.join(' ')} form-control">
                            </select>`;
                    }

                    return input;
                }

                $parse('camposFiltroPesquisa').assign(scope, scope.camposFiltroPesquisa);

                elem.attr('ng-model', `filtros[${scope.$index}]['campo']`);
                elem.attr('id', `filtros_${scope.$index}_campo`);
                elem.attr('ng-options', 'key as c.texto for (key, c) in camposFiltroPesquisa');
                $compile(elem)(scope);

                elem.bind(' change', function () {
                    if (this.value == '') {
                        return false;
                    }
                    console.log('mudando');
                    var indice = scope.$index;
                    var campo = scope.filtros[indice]['campo'];

                    //Juntando os valores do campo nos tres locais possiveis, campo, campos filtro pesquisa e campos filtros padrao
                    var dadosCampo = APIServ.buscarValorVariavel(scope.estrutura.campos, campo);
                    var dadosCampoFiltroPesquisa = scope.estrutura.camposFiltroPesquisa != undefined && scope.estrutura.camposFiltroPesquisa[campo] != undefined ? scope.estrutura.camposFiltroPesquisa[campo] : {};
                    var dadosCampoFiltroPadrao = scope.estrutura.filtrosPadrao != undefined && scope.estrutura.filtrosPadrao[campo] != undefined ? scope.estrutura.filtrosPadrao[campo] : {};
                    var dadosFiltro = Object.assign({}, dadosCampoFiltroPadrao, dadosCampo, dadosCampoFiltroPesquisa);

                    scope.filtros[indice]['texto'] = this.options[this.selectedIndex].innerHTML;
                    scope.filtros[indice]['valor'] = dadosFiltro['padrao'] != undefined ? dadosFiltro['padrao'] : dadosFiltro['valor'] != undefined ? dadosFiltro['valor'] : '';

                    var tipoFiltro = dadosFiltro.tipoFiltro != undefined ?
                        dadosFiltro.tipoFiltro : dadosFiltro.tipo != undefined ? dadosFiltro.tipo : '';

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
                            valorMascara = valorMascara == 'data' ? APIAjuFor.dataAtual() : valorMascara;
                            scope.filtros[keyArray]['valoresMascara'] = valorMascara;
                            valor = angular.isObject(valorMascara) ? valorMascara[0] : valorMascara;

                            //cF != undefined && cF[campo]['valor'] != undefined ? cF[campo]['valor'] : '';

                            //scope.filtros[keyArray]['valor'] = padrao;
                            var operador = cF.operador != undefined ? cF.operador : 'like'; // cF != undefined && cF[campo]['operador'] != undefined ? cF[campo]['operador'] : 'like';
                            scope.filtros[keyArray]['operador'] = operador;
                        }

                        var div = angular.element(elem).parent('div').siblings('div.divValorConsulta');
                        angular.element(div).html('');

                        // if (scope.dispositivoMovel) {
                        //div.append('<span class="input-group-addon">Valor</span>');
                        //      div.removeClass('form-group').addClass('input-group');
                        //  } else {
                        //div.append('<label ng-if="key == 0">Valor</label>');
                        div.removeClass('input-group').addClass('form-group');
                        //   }

                        var inputValor = montaCampoValor(mascara, valorMascara, indice, campo);
                        div.append(inputValor);

                        //console.log(cF);

                        if (cF['autoCompleta'] != undefined) {
                            var modeloValor = `filtros[${indice}]['valor']`;
                            var idValor = EGFuncoes.modeloParaId(modeloValor);
                            scope.filtros[indice]['campo_chave'] = cF.autoCompleta['campoChave'];
                            //console.log(scope.filtros[indice]);
                            angular.element('#' + idValor).attr('auto-completa', campo);
                            angular.element('#' + idValor).attr('indice', indice);
                        }

                        $compile(div.contents())(scope);

                    } else if (scope.filtros[indice]['tipo'] == 'intervaloDatas') {
                        if (elem.attr('tipoFiltro') != undefined && elem.attr('tipoFiltro') != 'intervaloDatas') {
                            angular.element(this).trigger('blur');
                        }
                    }
                });
            }
        }
    }])