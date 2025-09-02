var directivesPadrao = angular.module('directivesPadrao', ['angularUtils.directives.dirPagination'])    
    .directive('expandeComprimeBloco', function ($compile, APIServ, EGFuncoes) {
        return {
            restrict: 'E',
            replace: true,
            template: '<button type="button" class="btn btn-default col-xs-3 col-md-1 glyphicon"></button>',
            link: function (scope, elem, attr) {
                var tamanho = elem.attr('tamanho') != undefined ? elem.attr('tamanho') : 'pequeno';

                var tamanhos = {
                    original: '',
                    pequeno: 'iconePequeno',
                    medio: 'iconeMedio',
                    grande: 'iconeGrande'
                };

                var comprimir = false;

                var classeIcone = 'glyphicon-collapse-down';

                //Fiz esta comaracao pois a diretiva pode ser chamanda de fora de uma estruturaGerencia
                if (scope.estrutura != undefined) {
                    dadosBloco = APIServ.buscarValorVariavel(scope.estrutura.campos, elem.attr('nome-bloco'));
                    comprimir = dadosBloco.iniciarComprimido != undefined ? dadosBloco.iniciarComprimido : false;
                    classeIcone = comprimir ? 'glyphicon-expand' : 'glyphicon-collapse-down';
                } else {
                    //Depois tenho que tratar para que eles se auto comprimam vindo pela atributo
                    comprimir = attr.iniciarComprimido != undefined && attr.iniciarComprimido ? true : false;
                    classeIcone = comprimir ? 'glyphicon-expand' : 'glyphicon-collapse-down';
                }

                elem.addClass(classeIcone);

                elem.bind("click", function ($event) {
                    console.log('teste');
                    let classeBloco = attr.classeBloco != undefined ? attr.classeBloco : 'conteudoBloco';
                    console.log(classeBloco);

                    var obj = $event.target;
                    //var objConteudo = angular.element(obj).parent('div').siblings('div.' + classeBloco);
                    var objConteudo = $(obj).closest('monta-bloco-html').find('.conteudoBloco');
                    console.log(objConteudo);


                    var visible = !objConteudo.is(':visible');

                    objConteudo.toggle('collapse');

                    if (visible) {
                        angular.element(obj).removeClass('glyphicon-expand').addClass('glyphicon-collapse-down');
                    } else {
                        angular.element(obj).removeClass('glyphicon-collapse-down').addClass('glyphicon-expand');
                    }

                });
                elem.addClass(tamanhos[tamanho]);
                $compile(elem.contents())(scope);
            }
        }
    })

    .directive('montaHtmlPosicao', ['$rootScope', '$parse', '$compile', 'APIServ', 'EGFuncoes', function ($rootScope, $parse, $compile, APIServ, EGFuncoes) {
        return {
            restrict: 'E',
            replace: true,
            transclude: false,
            template: '',
            link: function (scope, elem, attr) {
                var campo = 'posicao'; // elem.attr('campo');
                var e = angular.fromJson(scope.estrutura);
                var nomeBloco = elem.attr('nome-bloco');
                let indice = attr.indice;

                let posicao = parseInt(indice) + 1;
                let itemRepetir = elem.attr('item-repetir')

                //Faco essa comparaca, pois o campo dentro do bloco, pode ter o mesmo nome de outro campa em outro bloco ou fora de blocos
                var dadosBloco = nomeBloco != undefined ? APIServ.buscarValorVariavel(e.campos, nomeBloco) : false;

                let variavelSalvar = dadosBloco.variavelSalvar;
                let modelo = '';
                if (variavelSalvar) {
                    modelo = `${e.raizModelo}.${variavelSalvar}[$index]['posicao']`;
                } else {
                    modelo = `${e.raizModelo}[$index]['posicao']`;
                }

                nomeElemento = EGFuncoes.modeloParaId(modelo);
                idElemento = nomeElemento;

                var filho = '';

                var classes = ['form-control'];
                var label = '';//'Posição';
                let tituloInput = 'Posição do Ítem';
                var input = `
                    <select name="${nomeElemento}" ng-model="${modelo}" id="${idElemento}" nome-bloco="${attr.nomeBloco}" ng-change="trocarPosicao('${idElemento}')" indice="{{$index}}"
                        class="input-lg form-control selectPosicao" ng-options="item for item in opcoesPosicao" item-repetir="${itemRepetir}" posicao="${posicao}" >
                    </select>`;

                var html = `
                    <div class="form-group col-md-1"  id="div_${campo}" >
                        ${label}
                        ${input}
                    </div>`;

                elem.html(html);
                $compile(elem.contents())(scope);

                let qtd = eval('scope.' + attr.itemRepetir).length;
                let array = [];
                for (var i = 0; i < qtd; i++) {
                    array.push(i + 1);
                }

                $parse('opcoesPosicao').assign($rootScope, array);

                $parse(modelo).assign(scope, posicao);
            }
        }
    }])
    // .directive('cabecalhoConsulta', ['$compile', 'APIServ', 'EGFuncoes', 'APIAjuFor', function ($compile, APIServ, EGFuncoes, APIAjuFor) {
    //     return {
    //         restrict: 'E',
    //         replace: true,
    //         template: '',
    //         link: function (scope, elem) {
    //             var parametros = scope.estrutura;
    //             let raizModelo = scope.estrutura.raizModelo;
    //             let campoChave = scope.estrutura.raizModelo + '.' + scope.estrutura.campo_chave;
    //             const usuario = APIServ.buscaDadosLocais('usuario');
    //             const admSistema = usuario['administrador_sistema'] == 'S';

    //             let nomeFormConsulta = 'formCon' + parametros.raizModelo;
    //             let tipoConsulta = parametros.tipoConsulta != undefined ? parametros.tipoConsulta : 'camposDinamicos';
    //             //Vou por o acoes inicio consulta, quando houver
    //             let acoesInicioConsulta = '';
    //             let mostrarAcoesInicioConsultaSemResultado = false;
    //             if (parametros.acoesInicioConsulta != undefined) {
    //                 angular.forEach(parametros.acoesInicioConsulta, function (val, key) {
    //                     mostrarAcoesInicioConsultaSemResultado = val.mostrarSemResultados != undefined && val.mostrarSemResultados ? true :
    //                         mostrarAcoesInicioConsultaSemResultado;
    //                     if (val == 'diretiva' || (val.tipo != undefined && val.tipo == 'diretiva')) {
    //                         let nomeDiretivaIC = APIAjuFor.variavelParaDiretiva(key);
    //                         acoesInicioConsulta += `<${nomeDiretivaIC}></${nomeDiretivaIC}>`;
    //                     } else {
    //                         acoesInicioConsulta += `<input-botao parametros="${key}" ng-if="tela=='consulta'"></input-botao>`; // ' EGFuncoes.montarBotao(val);
    //                     }
    //                 })
    //             }

    //             var acao = scope.estrutura.acao != undefined ? scope.estrutura.acao : APIServ.parametrosUrl()[1];
    //             $rS[acao] = $rS[acao] == undefined ? $rS[acao] = {} : $rS[acao];
    //             if ($rS[acao]['acoes'] == undefined) {
    //                 $rS[acao]['acoes'] = {
    //                     Cadastrar: scope.estrutura.acoes != undefined && scope.estrutura.acoes.Cadastrar != undefined ? scope.estrutura.acoes.Cadastrar : false,
    //                     Alterar: scope.estrutura.acoes != undefined && scope.estrutura.acoes.Alterar != undefined ? scope.estrutura.acoes.Alterar : false,
    //                     Excluir: scope.estrutura.acoes != undefined && scope.estrutura.acoes.Excluir != undefined ? scope.estrutura.acoes.Excluir : false
    //                 }
    //             }

    //             angular.element('.navbar-brand').html(parametros.textoPagina);


    //             htmlFiltroResultado = `
    //                 <div class="col-xs-12 col-md-3 form-group" ng-class="{'baixarbotao': !dispositivoMovel}">
    //                     <input type="text" ng-change="alterarFiltroResultado(filtroResultadoTela)" ng-model="filtroResultadoTela" class="form-control" placeholder="Buscar nos Ítens da Tela">
    //                 </div>`;
    //             let html =
    //                 `<div class="row">
    //                     <h2 class="col-xs-12 col-md-8" ng-if="!dispositivoMovel && tela == 'consulta'">${parametros.textoPagina} - Consulta</h2>
    //                     <h2 class="col-xs-12 col-md-8" ng-if="!dispositivoMovel && tela == 'cadastro' && (${campoChave} == 0 || ${campoChave} == undefined)">${parametros.textoPagina} - Inclusão</h2>
    //                     <h2 class="col-xs-12 col-md-8" ng-if="!dispositivoMovel && tela == 'cadastro' && ${campoChave} > 0">${parametros.textoPagina} - Alteração</h2>`;

    //             if (EGFuncoes.temCadastro(parametros) && ($rS[acao]['acoes']['Cadastrar'] || admSistema)) {
    //                 html += `<button class="col-xs-12 col-md-4 btn btn-success" ng-class="{'top10': !dispositivoMovel}" ng-if="tela != 'cadastro'" ng-click="mudaTela('cadastro')">${parametros.textoNovo}</button>`;
    //             }

    //             if (!scope.popUp) {
    //                 html += `<button id="botaoIrConsulta" class="col-xs-12 col-md-4 btn btn-primary" ng-class="{'top10': !dispositivoMovel}" ng-if="tela == 'cadastro'" ng-click="mudaTela('consulta')">Ir Para Consulta</button>`;
    //             }

    //             html += `
    //             </div>`;


    //             if (scope.estrutura.filtroPersonalzadoDiretiva != undefined) {
    //                 var temp = '<' + APIAjuFor.variavelParaDiretiva(scope.estrutura.filtroPersonalzadoDiretiva) + ' ng-if="tela != \'cadastro\'"></' + APIAjuFor.variavelParaDiretiva(scope.estrutura.filtroPersonalzadoDiretiva) + '>';
    //                 html += temp;
    //             } else {
    //                 html += '<form-cabecalho-consulta-padrao></form-cabecalho-consulta-padrao>';
    //             }

    //             let ngIfAcoesInicioConsulta = !mostrarAcoesInicioConsultaSemResultado ? 'ng-if="listaConsulta.length > 0"' : '';
    //             html += `
    //             <div class="col-xs-12 acoesInicioConsulta teste" ${ngIfAcoesInicioConsulta}>
    //                 <div class="row">
    //                     ${acoesInicioConsulta}
    //                 </div>
    //             </div>
    //             <hr>

    //             <div class="col-xs-12 resumoConsulta"  ng-if="resumoConsulta != undefined">
    //                 <div class="row">
    //                     <div class="col-xs-12 col-md-4 divitemLista div6 itemResumoConsulta" ng-repeat="(key, val) in resumoConsulta">
    //                         <span>{{estrutura.resumoConsulta[key]['texto']}}: <label>{{val}}</label></span>
    //                     </div>
    //                 </div>
    //             </div>`;

    //             // html += scope.estrutura.naoFiltrarAoIniciar == undefined || scope.estrutura.naoFiltrarAoIniciar == false ?
    //             //     `<div ng-init="filtrar(0)" ng-if="estrutura.tipoEstrutura == 'consultaDireta' && tela != 'cadastro'""></div>` : '';
    //             elem.html(html);
    //             elem.addClass('row-fluid cabecalhoConsulta')
    //             $compile(elem.contents())(scope);
    //         }
    //     }
    // }])
    .directive('filtroPersonalizado', function ($compile) {
        return {
            restrict: 'E',
            link: function (scope, elem, attr) {
                let html = '';
                for (i in scope.estrutura.camposFiltroPersonalizado) {
                    let campoCampos = scope.estrutura.campos[i] != undefined ? Object.assign({}, scope.estrutura.campos[i]) : [];
                    scope.estrutura.camposFiltroPersonalizado[i] = angular.merge({}, campoCampos, scope.estrutura.camposFiltroPersonalizado[i]);
                    html += `<monta-html campo="${i}"></monta-html>`;
                }
                elem.html(html);
                $compile(elem.contents())(scope);

            }
        }
    })
    .directive('selectFiltrosPesquisaOriginal', ['$compile', '$parse', 'APIServ', 'EGFuncoes', 'APIAjuFor', function ($compile, $parse, APIServ, EGFuncoes, APIAjuFor) {
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
                    let dadosCampo = APIServ.buscarValorVariavel(scope.estrutura.campos, campo);
                    let dadosCampoFiltroPesquisa = scope.estrutura.camposFiltroPesquisa != undefined && scope.estrutura.camposFiltroPesquisa[campo] != undefined ? scope.estrutura.camposFiltroPesquisa[campo] : {};
                    let dadosCampoFiltroPadrao = scope.estrutura.filtrosPadrao != undefined && scope.estrutura.filtrosPadrao[campo] != undefined ? scope.estrutura.filtrosPadrao[campo] : {};
                    let dadosFiltro = Object.assign({}, dadosCampoFiltroPadrao, dadosCampo, dadosCampoFiltroPesquisa);

                    scope.filtros[indice]['texto'] = this.options[this.selectedIndex].innerHTML;
                    scope.filtros[indice]['valor'] = dadosFiltro['padrao'] != undefined ? dadosFiltro['padrao'] : dadosFiltro['valor'] != undefined ? dadosFiltro['valor'] : '';

                    let tipoFiltro = dadosFiltro.tipoFiltro != undefined ?
                        dadosFiltro.tipoFiltro : dadosFiltro.tipo != undefined ? dadosFiltro.tipo : '';

                    scope.filtros[indice]['tipo'] = tipoFiltro;

                    //Pondo este elemente para ver se ele ira fazer o blur ao clicar
                    elem.attr('tipoFiltro', tipoFiltro);
                    $compile(elem)(scope);
                    angular.element('#filtros_' + indice + '_campo').val('string:' + campo);
                    scope.filtros[indice]['campo'] = campo;


                    if (tipoFiltro != 'intervaloDatas') {
                        let cF = dadosFiltro; // scope.estrutura.camposFiltroPesquisa;

                        let campos = scope.estrutura.campos;

                        let mascara = '';
                        if (cF['tipo'] != undefined && cF['tipo'] != 'texto') {
                            mascara = cF['tipo'];
                        } else if (campo != undefined && campos[campo] != undefined && campos[campo]['tipo'] != undefined && campos[campo]['tipo'] != 'texto') {
                            mascara = campos[campo]['tipo'];
                        }

                        var valorMascara = '';
                        if (campo != '' && campo != null) {
                            let keyArray = angular.element(elem).attr('keyArray');
                            valorMascara = cF['valor'] != undefined ? cF['valor'] : '';
                            valorMascara = valorMascara == 'data' ? APIAjuFor.dataAtual() : valorMascara;
                            scope.filtros[keyArray]['valoresMascara'] = valorMascara;
                            valor = angular.isObject(valorMascara) ? valorMascara[0] : valorMascara;

                            //cF != undefined && cF[campo]['valor'] != undefined ? cF[campo]['valor'] : '';

                            //scope.filtros[keyArray]['valor'] = padrao;
                            let operador = cF.operador != undefined ? cF.operador : 'like'; // cF != undefined && cF[campo]['operador'] != undefined ? cF[campo]['operador'] : 'like';
                            scope.filtros[keyArray]['operador'] = operador;
                        }

                        let div = angular.element(elem).parent('div').siblings('div.divValorConsulta');
                        angular.element(div).html('');

                        // if (scope.dispositivoMovel) {
                        //div.append('<span class="input-group-addon">Valor</span>');
                        //      div.removeClass('form-group').addClass('input-group');
                        //  } else {
                        //div.append('<label ng-if="key == 0">Valor</label>');
                        div.removeClass('input-group').addClass('form-group');
                        //   }

                        let inputValor = montaCampoValor(mascara, valorMascara, indice, campo);
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
    .directive('detalhesItemConsulta', ['$rootScope', '$compile', 'APIServ', 'EGFuncoes', 'APIAjuFor', function ($rootScope, $compile, APIServ, EGFuncoes, APIAjuFor) {
        return {
            restrict: 'E',
            replace: true,
            link: function (scope, elem) {
                var indice = angular.element(elem).closest('.itemConsulta').attr('indice');

                //Fazendo rotina para exibir detalhes quando for somente consulta
                //20/11/2017 Acrescentei a juncao dos campos com os camposDetalhes quando existirem
                var campos = scope.estrutura.camposDetalhes != undefined ? angular.merge(scope.estrutura.campos, scope.estrutura.camposDetalhes) : scope.estrutura.campos;

                var html = '';

                var camposNaoMostrar = Object.keys(scope.estrutura.listaConsulta);
                let camposOcultarDetalhes = scope.estrutura.camposOcultarDetalhes != undefined ? scope.estrutura.camposOcultarDetalhes : [];
                //console.log(camposNaoMostrar);


                angular.forEach(campos, function (val, key) {
                    var mostrar = !APIServ.valorExisteEmVariavel(camposOcultarDetalhes, key);

                    if (mostrar) {
                        if (key.substr(0, 5) == 'bloco') {
                            html += `<bloco-html-detalhe nome-bloco="${key}" indice="${indice}"></bloco-html-detalhe>`; //_montaBlocoHtmlDetalhes(key, val);
                        } else if (val == 'diretiva') {
                            let nomeDiretiva = APIAjuFor.variavelParaDiretiva(key);
                            html += `<${nomeDiretiva} indice="${indice}"></${nomeDiretiva}>`;

                        } else if ((val.tipo == undefined || val.tipo != 'oculto') && key.substr(0, 5) != 'botao' && val.tipo != 'senha') {
                            var mostrar = !APIServ.valorExisteEmVariavel(camposNaoMostrar, key);
                            console.log(mostrar);
                            if (mostrar) {
                                html += `<html-detalhe campo="${key}" indice="${indice}"></html-detalhe>`
                            }
                        }
                    }
                });
                elem.html(html);
                $compile(elem.contents())(scope);
            }
        }
    }])
    .directive('htmlDetalhe', ['$compile', 'APIServ', 'EGFuncoes', function ($compile, APIServ, EGFuncoes) {
        return {
            restrict: 'E',
            replace: true,
            link: function (scope, elem) {
                let campo = elem.attr('campo');

                let camposOcultarDetalhes = scope.estrutura.camposOcultarDetalhes != undefined ? scope.estrutura.camposOcultarDetalhes : [];

                var mostrar = !APIServ.valorExisteEmVariavel(camposOcultarDetalhes, campo);
                if (mostrar) {
                    var val = APIServ.buscarValorVariavel(scope.estrutura.campos, campo);
                    //console.log(val);

                    var label = val.texto != undefined && val.tipo != 'oculto' ? val.texto + ':' : '';
                    var atributosDiv = val.atributos_div != undefined ? EGFuncoes.montarAtributos(val.atributos_div) : [];

                    var tamanho = EGFuncoes.montarTamanhos(val);
                    var classesDiv = val.classes_div != undefined ? val.classes_div.split(' ') : [];
                    //if(val.porcent != undefined && val.porc > 0) classesDiv.push('larg' + val.porc + 'p');
                    classesDiv = classesDiv.concat(tamanho);

                    var html = `                    
                    <div class="campoDetalheConsulta ${classesDiv.join(' ')}"  ${atributosDiv.join(' ')}>${label} <strong> {{item.detalhes.${campo}}}</strong></div>`;

                    elem.html(html);
                    $compile(elem.contents())(scope);
                }
            }
        }
    }])

    .directive('autoCompleta', ['$compile', '$rootScope', function ($compile, $rootScope) {
        return {
            restrict: "A",
            link: function (scope, elem) {
                if ($rootScope.autoCompletaCarregado == undefined) {
                    $rootScope.autoCompletaCarregado = true;
                    $.getScript('src/api-front/js/directives/autoCompleta.js');
                    //var domElem = '<script src="api/js/directives/autoCompleta.js" async defer></script>';
                    //angular.element(elem).append($compile(domElem)(scope));
                }
            }
        }
    }])
    .directive('uiLista', ['$compile', '$parse', 'APIServ', 'EGFuncoes', function ($compile, $parse, APIServ, EGFuncoes) {
        return {
            restrict: "A",
            link: function (scope, elem) {
                elem.bind('focus', function () {
                    var campo = elem.attr('campo');
                    var nomeBloco = elem.attr('nome-bloco');
                    var dadosBloco = APIServ.buscarValorVariavel(scope.estrutura.campos, nomeBloco);

                    var temBloco = nomeBloco != undefined;

                    if (temBloco) {
                        var indice = scope.$index;
                        var dadosCampo = APIServ.buscarValorVariavel(dadosBloco, campo);
                    } else {
                        var dadosCampo = APIServ.buscarValorVariavel(dadosBloco, campo);
                    }
                    var elementoChave = elem.siblings('.chave_lista');

                    if (temBloco) {
                        if (dadosBloco.variavelSuperior != undefined) {
                            var indice = scope.$parent.$index;
                            var indice2 = scope.$index;
                            //Depois tenho que fazer uma comparacao igual fiz em baixo, pois pode nao haver repeticao no bloco e neste caso nao precisaria do indice2
                            var modeloChave = scope.estrutura.raizModelo + '.' + dadosBloco.variavelSuperior + '[' + indice + ']["' + dadosBloco.nomeBloco + '"][' + indice2 + ']["' + dadosCampo.lista.campoChave + '"]';
                        } else {
                            if (dadosBloco.repeticao != undefined) {
                                var modeloChave = scope.estrutura.raizModelo + '.' + dadosBloco.nomeBloco + '[' + indice + ']["' + dadosCampo.lista.campoChave + '"]';
                            } else {
                                modeloChave = scope.estrutura.raizModelo + '.' + dadosBloco.nomeBloco + '["' + dadosCampo.lista.campoChave + '"]';
                            }

                        }
                        var idChave = EGFuncoes.modeloParaId(modeloChave);
                        elementoChave.attr('ng-model', modeloChave);
                        elementoChave.attr('id', idChave);
                        elementoChave.attr('name', modeloChave);
                        $compile(elementoChave)(scope);
                    } else {
                        var modeloChave = scope.estrutura.raizModelo + '.' + dadosCampo.lista.campoChave;
                        var idChave = modeloChave.split('.').join('_');
                        elementoChave.attr('ng-model', modeloChave);
                        elementoChave.attr('id', idChave);
                        elementoChave.attr('name', modeloChave);
                        $compile(elementoChave)(scope);
                    }
                    elem.attr('nome_lista', dadosCampo.lista.nomeLista);
                    elem.attr('id_chave', idChave);
                    var info = $.defineinfo(elem);
                    elem.attr('info', JSON.stringify(info));

                    $compile(elem)(scope);

                    var mostrar = elem.attr('mostrarNoFoco') != undefined;

                    if (mostrar && $(elem).val() == '') {
                        $(elem).autocomplete('search', '');
                    }
                    $(elem).listas({
                        letra: "mai",
                        mostrarnofoco: mostrar
                    });


                })
            }
        }
    }])
    .directive('validaFormulario', ['config', '$rootScope', 'APIAjuFor', function (config, $rootScope, APIAjuFor) {
        return {
            require: '^form',
            priority: -1,
            link: function (scope, element, attr, form) {
                element.bind('submit', function () {
                    $rootScope.formularioCadsatro = form;
                    var nomeForm = form.$name;

                    angular.forEach(form, function (value, key) {
                        //Varrendo os itens de do formulario e vendo se sao objeto se tem ngModel se e obrigatorio e se nao e valido
                        var elemento = typeof value === 'object' && value.hasOwnProperty('$modelValue') ? angular.element("[name='" + value.$name + "']") : undefined;

                        let temComparacoes = elemento != undefined && (elemento.attr('igual') != undefined || elemento.attr('minimo') != undefined || elemento.attr('maximo') != undefined);

                        if (elemento != undefined && value.$valid) {
                            //Inserindo essa comparacao para trabalhar com ng-required 14/10/2024                            
                            var elementoPai = elemento.closest('div.form-group');
                            APIAjuFor.manipularSpan(elemento, elementoPai, '', !value.$valid);

                        } else if (elemento != undefined && (!value.$valid || temComparacoes)) {
                            console.log(value.$valid, elemento.attr('id'));


                            var nomeElemento = elemento[0].name;
                            var elementoPai = elemento.closest('div.form-group');
                            //let mensagem = _montaMensagem();
                            let mensagem = APIAjuFor.montaMensagem();

                            let desabilitado = elemento.attr('disabled') == 'disabled';

                            let valido = form[nomeElemento].$valid && !elemento.hasClass('ng-invalid') && !elemento.attr('disabled') && !desabilitado;


                            if (elemento.attr('minimo') != undefined && APIAjuFor.textoParaFloat(elemento[0].value) < elemento.attr('minimo')) {
                                valido = false;
                                mensagem = 'Valor Abaixo do Mínimo';
                            }

                            if (elemento.attr('maximo') != undefined && APIAjuFor.textoParaFloat(elemento[0].value) > elemento.attr('maximo')) {
                                valido = false;
                                mensagem = 'Valor Abaixo do Mínimo';
                            }

                            if (!valido) {
                                scope.formInvalido = true;
                                APIAjuFor.manipularSpan(elemento, elementoPai, mensagem, !valido);
                            } else if (elemento.attr('igual') != undefined) {
                                var valorElemento = form[nomeElemento].$viewValue != undefined ? form[nomeElemento].$viewValue : '';

                                var valorComparar = form[elemento.attr('igual').split('-')[0]].$viewValue;
                                if (valorElemento != valorComparar) {
                                    valido = false;
                                    mensagem = APIAjuFor.montaMensagem('igual', elemento.attr('igual').split('-')[1])
                                    APIAjuFor.manipularSpan(elemento, elementoPai, mensagem, !valido);
                                }
                            }

                            elemento.bind('keyup change click keypress', function () {
                                mensagem = '';
                                var valorElemento = form[nomeElemento].$viewValue != undefined ? form[nomeElemento].$viewValue : '';
                                valido = form[nomeElemento].$valid;

                                let minimo = elemento.attr('minimo') != undefined ? elemento.attr('minimo') : undefined;
                                let maximo = elemento.attr('maximo') != undefined ? elemento.attr('maximo') : undefined;

                                //Acredito que essa comparacao seja para comparar campso iguais, tipo senhas ou emails
                                //Mas nao sei exatamente pois nao comentei quando fiz.
                                if (elemento.attr('igual') != undefined) {
                                    var valorComparar = form[elemento.attr('igual').split('-')[0]].$viewValue;
                                    if (valorElemento != valorComparar) {
                                        valido = false;
                                        mensagem = APIAjuFor.montaMensagem('igual', elemento.attr('igual').split('-')[1])
                                    }
                                } else if (valorElemento == '') {
                                    mensagem = APIAjuFor.montaMensagem();
                                } else if (!valido) {
                                    mensagem = APIAjuFor.montaMensagem('invalido');
                                } else if (minimo != undefined && APIAjuFor.textoParaFloat(valorElemento) < minimo) {
                                    valido = false;
                                    mensagem = 'Valor Abaixo do Mínimo';
                                } else if (maximo != undefined && APIAjuFor.textoParaFloat(valorElemento) > maximo) {
                                    valido = false;
                                    mensagem = 'Valor Acima do Máximo';
                                }

                                APIAjuFor.manipularSpan(elemento, elementoPai, mensagem, !valido);
                            });
                        }
                    });
                });
            }
        }
    }])
    .directive('valorExiste', ['$parse', '$compile', '$rootScope', 'APIServ', 'APIAjuFor', 'EGFuncoes',
        function ($parse, $compile, $rootScope, APIServ, APIAjuFor, EGFuncoes) {
            return {
                link: function (scope, elem, attrs, ctrl) {
                    let zerarVariavelLocal = function (variavelLocal, campoElemento, valorElemento) {
                        // var nova = {};
                        // angular.forEach(eval('scope.' + variavelLocal), function (valor, campo) {
                        //     if (campo != campoElemento) {
                        //         nova[campo] = campo == campoElemento ? valorElemento : '';
                        //     }
                        // });
                        let nova = EGFuncoes.novaVariavelRaizModelo(scope.estrutura);
                        $parse(variavelLocal).assign(scope, nova);
                        scope.$apply();

                    }

                    let _setarFoco = function () {
                        setTimeout(function () {
                            document.getElementById(elem.attr('id')).focus();
                        }, 200);

                    }

                    let elementoPai = $(elem).closest('div.form-group');

                    elem.bind('keyup blur', function () {
                        var valido = elem.hasClass('ng-valid');
                        let campo = elem.attr('campo') != undefined ? elem.attr('campo') : elem.parents('monta-html').attr('campo');
                        let obrigatorio = elem.attr('required') != undefined;
                        console.log(obrigatorio);

                        var dadosCampo = APIServ.buscarValorVariavel(scope.estrutura.campos, campo);
                        let attrInp = dadosCampo.atributos_input.valor_existe;
                        //console.log(attrInp);

                        //Define se buscarei todos os dados da tabela para jogar no escopo
                        //var variavel_local = elem.attr('variavel_local') != undefined ? elem.attr('variavel_local') : '';
                        var variavel_local = attrInp != undefined && attrInp.variavel_local != undefined ? attrInp.variavel_local : '';
                        //var campo_valor = dadosCampo.atributos_input.campo_valor; // elem.attr('campo_valor') != undefined ? elem.attr('campo_valor') : '';
                        let campo_valor = attrInp != undefined && attrInp.campo_valor != undefined ? attrInp.campo_valor : campo;
                        var tabela = attrInp != undefined && attrInp.tabela != undefined ? attrInp.tabela : scope.$parent.estrutura.tabela;
                        //var tabela = elem.attr('tabela') != undefined ? elem.attr('tabela') : scope.$parent.estrutura.tabela;
                        var modelo = elem.attr('ng-model');
                        var valor = elem.val();

                        if (elem.val() != '' && valido) {
                            var parametros = {
                                tabela: tabela,
                                campo: campo,
                                retornar_completo: variavel_local != '',
                                campo_valor: campo_valor,
                                campo_chave: scope.estrutura.campo_chave,
                                chave: scope[scope.estrutura.raizModelo][scope.estrutura.campo_chave],
                                valor: elem.val()
                            }
                            //console.log(parametros);

                            APIServ.executaFuncaoClasse('classeGeral', 'valorExiste', parametros).success(function (retorno) {
                                if (retorno.length > 0) {
                                    if (dadosCampo.atributos_input.camposLimpar != undefined) {
                                        angular.forEach(dadosCampo.atributos_input.camposLimpar, function (campoLimpar) {
                                            if (retorno[0][campoLimpar] != undefined) {
                                                retorno[0][campoLimpar] = '';
                                            }
                                        });
                                    }

                                    if (variavel_local == '' || scope[scope.estrutura.raizModelo][scope.estrutura.campo_chave] > 0) { //Neste caso vou apenas verificar se existe e informar


                                        if (obrigatorio) {
                                            $rootScope.formularioInvalido = true;
                                            elem.addClass('ng-invalid valorExiste').removeClass('ng-valid-required').attr('aria-invalid', 'true');
                                            var formulario = elem.parents('form').attr('name');
                                            let idForm = elem.parents('form').attr('id');

                                            let objForm = angular.element('#' + idForm);

                                            objForm.addClass('ng-invalid ng-invalid-required ng-submitted').removeClass('ng-valid');
                                            var campo = elem.attr('name');
                                            scope[formulario].$valid = false;
                                            scope[formulario].$invalid = true;
                                            scope[formulario][campo].$valid = false;
                                        }



                                        var texto = campo_valor != undefined && campo_valor != '' ? 'Valor Já Cadastrado para ' + retorno[0][campo_valor] : 'Valor Já Cadastrado';
                                        //manipularSpan(texto);
                                        APIAjuFor.manipularSpan(elem, elementoPai, texto, true);
                                    } else { //Neste caso vejo se existe, e se sim insiro o retorno no escopo
                                        var temBloco = elem.attr('nome-bloco') != undefined;
                                        $rootScope.formularioInvalido = false;

                                        if (temBloco) {
                                            var dB = APIServ.buscarValorVariavel(scope.estrutura.campos, elem.attr('nome-bloco'));
                                            var dC = APIServ.buscarValorVariavel(dB, campo);
                                            if (dB.variavelSuperior != undefined) {
                                                /*
                                                var indice = scope.$parent.$index;
                                                var indice2 = scope.$index;
                                                //Depois tenho que fazer uma comparacao igual fiz em baixo, pois pode nao haver repeticao no bloco e neste caso nao precisaria do indice2
                                                var variavelLocal = e.raizModelo + '.' + dB.variavelSuperior + '[' + indice + ']["' + dB.nomeBloco + '"][' + indice2 + ']["' + dC.autoCompleta.campoChave + '"]';
    
                                                objValor2 = dC.autoCompleta.objValor2 != undefined ?
                                                    e.raizModelo + '.' + dB.variavelSuperior + '[' + indice + ']["' + dB.nomeBloco + '"][' + indice2 + ']["' + dC.autoCompleta.objValor2 + '"]' : '';
                                                    */
                                            } else {
                                                var indice = scope.$index;
                                                variavel_local = indice != undefined ? `${scope.estrutura.raizModelo}['${dB.variavelSalvar}'][${indice}]` : `${scope.estrutura.raizModelo}.${dB.variavelSalvar}`;
                                            }
                                        }
                                        console.log(retorno);

                                        $parse(variavel_local).assign(scope, retorno[0]);

                                        //_setarFoco();
                                        APIAjuFor.manipularSpan(elem, elementoPai, '', false);
                                    }
                                } else { //Valor Nao existe
                                    elem.removeClass('ng-invalid ng-invalid-required');
                                    $rootScope.formularioInvalido = false;
                                    if (variavel_local == '') {
                                        //APIAjuFor.manipularSpan(elem, elementoPai, 'Valor Já Cadastrado', true)
                                        APIAjuFor.manipularSpan(elem, elementoPai, '', false)
                                    } else {
                                        APIAjuFor.manipularSpan(elem, elementoPai, '', false)
                                        //Depois tenho que ver
                                    }
                                }
                            })
                        } else {
                            APIAjuFor.manipularSpan(elem, elementoPai, '', false);
                            if (variavel_local != '' && !scope[scope.estrutura.raizModelo][scope.estrutura.campo_chave] > 0) {
                                zerarVariavelLocal(variavel_local, campo, valor);
                            }
                        }
                    })
                }
            }
        }])

    .directive('semAcento', function () {
        return {
            require: 'ngModel',
            restrict: 'A',
            link: function (scope, element, attr, ctrl) {
                function _removerAcentos(newStringComAcento) {
                    var string = newStringComAcento;
                    var mapaAcentosHex = {
                        a: /[\xE0-\xE6]/g,
                        e: /[\xE8-\xEB]/g,
                        i: /[\xEC-\xEF]/g,
                        o: /[\xF2-\xF6]/g,
                        u: /[\xF9-\xFC]/g,
                        c: /\xE7/g,
                        n: /\xF1/g,
                        A: /[\xE0-\xE6]/g,
                        E: /[\xE8-\xEB]/g,
                        I: /[\xEC-\xEF]/g,
                        F: /[\xF2-\xF6]/g,
                        U: /[\xF9-\xFC]/g,
                        C: /\xE7/g,
                        N: /\xF1/g
                    };

                    for (var letra in mapaAcentosHex) {
                        var expressaoRegular = mapaAcentosHex[letra];
                        string = string.replace(expressaoRegular, letra);
                    }

                    return string;
                }

                element.bind('change', function () {
                    ctrl.$setViewValue(_removerAcentos(ctrl.$viewValue));
                    ctrl.$render();
                })
            }
        }
    })
    .directive('selectUf', function () {
        let UFs = ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO"];
        let html = `
            <select class="form-control">
                <option value="">Estado</option>`;
        angular.forEach(UFs, function (val, key) {
            html += `<option value="${val}">${val}</option>`;
        });
        html += `</select>`
        return {
            restrict: 'E',
            replace: true,
            template: html
        }
    })
    .directive('selectSexo', function () {
        var ddo = {
            restrict: 'E',
            template: `
            <select class="form-control">
                <option value="">Sexo</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
            </select>`,
            replace: true
        }
        return ddo;
    })
    .directive('selectSimNao', function ($compile) {
        var ddo = {
            restrict: 'E',
            template: `
            <select class="form-control">
                <option value="S">Sim</option>
                <option value="N">Não</option>
            </select>`,
            replace: true
        }
        return ddo;
    })
    .directive('selectPessoaTipo', function () {
        var ddo = {
            restrict: "E",
            template: `
            <select class="form-control">
                <option value="">Pessoa</option>
                <option value="F">Física</option>
                <option value="J">Jurídica</option>
            </select>`,
            replace: true
        }
        return ddo;
    })
    .directive('selectTelefoneOperadora', function () {
        var ddo = {
            restrict: 'E',
            template: `
                <select class="form-control">
                    <option value="">Operadora</option>
                    <option value="FIXO">Fixo</option>
                    <option value="OI">OI</option>
                    <option value="VIVO">Vivo</option>
                    <option value="TIM">Tim</option>
                    <option value="CLARO">Claro</option>
                    <option value="NEXTEL">Nextel</option>
                </select>`,
            replace: true
        }
        return ddo;
    })
    .directive('selectTipoSanguineo', () => {
        return {
            restrict: 'E',
            template: `
            <select class="form-control">
                <option value=""></option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="B+">B+</option>
                <option value="B">B-</option>
                <option value="O-">O-</option>
                <option value="O+">O+</option>
            </select>`,
            replace: true
        }
    })
    .directive('selectOperadores', function () {
        var ddo = {
            restrict: 'E',
            template: `
                <select class="form-control">
                <option value="">Selecione</option>
                    <option value="like">Contendo</option>
                    <option value="=">Igual</option>
                    <option value="!=">Diferente</option>
                    <option value=">">Maior</option>
                    <option value=">=">Maior ou Igual</option>
                    <option value="<">Menor</option>
                    <option value="<=">Menor ou Igual</option>
                </select>`,
            replace: true
        }
        return ddo;
    })
    .directive('estruturaPaginacao', ['$compile', function ($compile) {
        return {
            restrict: 'E',
            controller: function ($scope, $element, $attrs) {
                $scope.limitePaginaAtiva = $scope.limitePaginaAtiva != undefined ? $scope.limitePaginaAtiva : 5;
                $scope.qtdPaginas = $scope.qtdPaginas != undefined ? $scope.qtdPaginas : 1;
                $scope.pagina = $scope.pagina != undefined ? $scope.pagina : 1;
                $scope.primeiroNumero = $scope.primeiroNumero != undefined ? $scope.primeiroNumero : 1;
                $scope.ultimoNumero = $scope.ultimoNumero != undefined ? $scope.ultimoNumero : 1;
                let maxSize = $scope.dispositivoMovel ? 5 : 12;

                let html = `<nav class="text-center">
                    <dir-pagination-controls
                    boundary-links="true"
                    direction-links="true" max-size="${maxSize}">
                </dir-pagination-controls></nav>`;



                $element.html(html);
                $compile($element.contents())($scope);
            }
        }
    }])
    .directive('inputFile', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                //let campo = attrs.ngModel.split('.')[Object.keys(attrs.ngModel.split('.')).length - 1];

                if (attrs.tipo == 'formulario') {
                    var model = $parse(attrs.ngModel);
                    var modelSetter = model.assign;

                    var aoMudar = $parse(attrs.inputFile);

                    element.bind('change', function (event) {
                        scope.$apply(function () {
                            modelSetter(scope, element[0].files[0]['name']);
                        });

                        aoMudar(scope, {
                            $files: event.target.files
                        });
                    });
                } else if (attrs.tipo == 'anexos') {
                    var aoMudar = $parse(attrs.inputFile);
                    element.on('change', function (event) {
                        aoMudar(scope, {
                            $files: event.target.files
                        });
                    });

                }
            }
        }
    }])
    .directive('carregando', function (APIServ) {
        return {
            restrict: 'E',
            replace: true,
            link: function (scope, element, attr) {
                scope.$watch('carregando', function (val) {

                    if (val)
                        APIServ.telaAguarde();
                    else
                        APIServ.telaAguarde('fechar');
                });
            }
        }
    })
    .directive('resumoConsulta', function () {
        return {
            restrict: 'E',
            template: `<div class="row divResumoConsulta" ng-if="resumo != undefined && resumo.length > 0"></div>`,
            link: function (scope, element) {
                let html = `
                    <div ng-repeat="(key, item) in resumoConsulta" class="${montaTamanhos()}
                    </div>`;
            }
        }
    })
    .directive('modeloDinamico', ['$compile', '$parse', function ($compile, $parse) {
        return {
            restrict: 'A',
            terminal: true,
            priority: 100000,
            link: function (scope, elem) {
                var modelo = $parse(elem.attr('modelo-dinamico'))(scope);
                elem.removeAttr('modelo-dinamico');
                elem.attr('ng-model', modelo);
                $compile(elem)(scope);
            }
        }
    }])
    .directive('inputBotao', ['$compile', 'EGFuncoes', 'APIServ', function ($compile, EGFuncoes, APIServ) {
        return {
            restrict: 'E',
            tempplate: '<button type="button" class="btn"></button>',
            link: function (scope, elem) {
                var acaoTela = APIServ.parametrosUrl()[1];
                var acao = elem.attr('parametros');
                const usuario = APIServ.buscaDadosLocais('usuario');
                const adm = usuario.administrador_sistema == 'S';
                

                var p = APIServ.buscarValorVariavel(scope.estrutura, acao);
                var classes = [];
                classes = EGFuncoes.montarTamanhos(p);

                let icones = {
                    "impressora": "glyphicon-print",
                    "lixeira": "glyphicon-trash",
                    "alterar": "glyphicon-pencil",
                    "imagens": "glyphicon-picture",
                    "anexos": "glyphicon-open-file",
                    "ok": "glyphicon-ok",
                    "calendario": "glyphicon-calendar",
                    "pesquisa": "glyphicon-search",
                    "informacoes": "glyphicon-info-sign",
                    "dinheiro": "glyphicon-usd",
                    "compartilhar": "glyphicon-share",
                    'mais': "glyphicon-plus",
                    'menos': "glyphicon-minus"
                }

                p.tipo = p.tipo != undefined ? p.tipo : 'button';

                let temAncora = false;
                let abreAncora = '';
                let botao = '';
                let fechaAncora = '</a>';
                let click = '';
                let desabilitado = '';
                let titulo = p.titulo != undefined && p.titulo != '' ? p.titulo : '';
                let texto = p.texto != undefined && p.texto != '' ? p.texto : '';                                

                //Vendo se ignorara o perfil ou se o respeitara
                let ngIf = !adm && (p.ignorarPerfil == undefined || p.ignorarPerfil == false) ? `${acaoTela}['acoes']['${acao}'] != undefined ` : '';

                let atributos = undefined;
                if (p.atributosButton != undefined)
                    atributos = p.atributosButton
                else if (p.atributos_button != undefined)
                    atributos = p.atributos_button;

                if (atributos != undefined) {
                    if (atributos.link != undefined) {
                        temAncora = true;

                        let link = atributos.link;

                        if (atributos.dadosEnviar != undefined) {
                            var enviar = '{{' + atributos.dadosEnviar + '}}';
                            let nomeParametros = atributos.dadosEnviar;
                            //Depois tenho que fazer uma rotina para enviar mais de um valor
                            link += `?${nomeParametros}=${enviar}`;
                        }
                        var target = atributos.pagina == undefined || atributos.pagina == 'nova' ? '_new' : '';

                        abreAncora += `<a target="${target}" href="${link}"`;
                    }

                    if (atributos.icone != undefined) {
                        classes.push('glyphicon');
                        classes.push(icones[atributos.icone]);
                    }

                    if (atributos.se != undefined) {
                        ngIf += ngIf != '' ? ` && ${atributos['se']}` : `${atributos['se']}`;
                    }

                    if (p.classes != undefined) {
                        let tempClasses = p.classes.split(' ');
                        for (let k in tempClasses) {
                            classes.push(tempClasses[k]);
                        }
                    }                //Este e para botoes na lista da consulta
                if (atributos.click != undefined) {
                    // Ensure proper escaping to prevent bracket substitution issues
                    let clickValue = atributos.click.replace(/\]/g, ')');
                    click += `ng-click="${clickValue}"`;
                }

                    desabilitado = atributos.desabilitado != undefined ? `ng-disabled="${atributos.desabilitado}"` : '';
                }

                //Este e para botoes na lista da consulta
                if (p.click != undefined) {
                    // Ensure proper escaping to prevent bracket substitution issues
                    let clickValue = p.click.replace(/\]/g, ')');
                    click += `ng-click="${clickValue}"`;
                }

                botao += `<button ui-topo id="${acao}" type="${p.tipo}" class="btn ${classes.join(' ')} ${p.classes}" ${desabilitado}`;

                let html = '';

                if (temAncora) {
                    abreAncora += ngIf != '' ? `ng-if="${ngIf}"` : '';
                    abreAncora += ` title="${titulo}" ${click}`;
                    html = `${abreAncora}>${botao}>${texto}</button>${fechaAncora}`;
                } else {
                    botao += ngIf != '' ? `ng-if="${ngIf}" title="${titulo}" ${click}` : ` title="${titulo}" ${click}`;
                    html = `${botao}>${texto}</button>`;
                }

                elem.html(html);
                $compile(elem.contents())(scope);
            }
        }
    }])

    .directive('selectItemConsulta', ['$rootScope', '$compile', 'APIServ', 'EGFuncoes', '$parse', function ($rootScope, $compile, APIServ, EGFuncoes, $parse) {
        return {
            restrict: 'E',
            replace: true,
            link: function (scope, elem, attr) {
                let indice = scope.$index;
                let campo = angular.element(elem).attr('campo');
                let p = APIServ.buscarValorVariavel(scope.estrutura.acoesItensConsulta, campo);
                let tamanhos = EGFuncoes.montarTamanhos(p);

                let aoAlterar = p.aoAlterar != undefined ? p.aoAlterar : '';

                let html = '';
                if ($rootScope[$rootScope['acao']]['acoes'][campo] != undefined || p.ignorarPerfil) {
                    html = `                
                    <div class="form-group ${tamanhos.join(' ')}">
                        <select class="form-control" ng-model="item.${p.campoValor}" ng-change="${aoAlterar}">`;

                    angular.forEach(p.opcoesSelect, function (val, key) {
                        html += `<option value="${key}" ng-selected="'${key}' == '{{item.${p.campoValor}}}'">${val}</option>`;
                    });

                    if (scope.listaConsulta[indice][p.campoValor] == undefined) {
                        if (p.padrao != undefined) {
                            $parse(`item.${p.campoValor}`).assign(scope, p.padrao);
                        }
                    }

                    elem.html(html);
                    $compile(elem.contents())(scope);
                }
            }
        }
    }])
    .directive('uiTopo', function ($location, $anchorScroll) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                /*
                element.bind('click', function() {
                    $location.hash('botao_0');
                    $anchorScroll();
                        console.log('teste');

                });
                */
            }
        }
    })
    // .directive('formCabecalhoConsultaPadrao', function () {
    //     return {
    //         restrict: 'E',
    //         //replace: 'true',
    //         templateUrl: 'api-front/js/directives/templates/formCabecalhoConsultaPadrao.html'            
    //     }
    // })
    .directive('objetoVisualizacao', function ($compile) {
        return {
            restrict: "E",
            link: (scope, elem, attrs) => {
                let largura = attrs.largura != undefined ? attrs.largura + 'px' : '100%';
                let altura = attrs.altura != undefined ? attrs.altura + 'px' : '100%';

                let html = `<object data="${attrs.arquivo}" width="${largura}" height="${altura}"></object>`;
                elem.html(html);
                $compile(elem.contents())(scope);
            }
        }
    })
    .directive('selectValorNumerico', function () {
        return {
            require: 'ngModel',
            link: function (scope, elem, attrs, ngModel) {
                ngModel.$parsers.push(function (val) {
                    return val != null ? parseInt(val, 10) : null;
                });
                ngModel.$formatters.push(function (val) {
                    return val != null ? '' + val : null;
                });
            }
        }
    })
    .directive('selectFormaPagamento', function (APIServ) {
        return {
            restrict: 'E',
            template: '<select></select>',
            link: function (scope, elem, attr) {

            }
        }
    })
    .directive('imagemDinamica', ($compile) => {
        return {
            restrict: 'A',
            link: function (scope, elem, attr) {
                setTimeout(() => {
                    let temp = attr.ngSrc != undefined ? attr.ngSrc : attr.src;
                    $(elem).attr('src', temp + '?m=' + new Date().getTime());
                    $(elem).attr('ng-src', temp + '?m=' + new Date().getTime());
                }, 300);

                if (elem.hasClass('imagemZoom')) {
                    $(elem).mouseover(() => {
                        let indice = scope.$index;
                        let imagem = scope.item.arquivosAnexados[indice]['grande'];
                        let larguraDiv = 500;
                        let alturaDiv = 500;


                        let larguraJanela = $(window).width();
                        let larguraImagem = $(elem).width();

                        let alturaJanela = $(window).height();
                        let alturaImagem = $(elem).height();

                        let leftImagem = $(elem).offset().left;
                        let topImagem = $(elem).offset().top;


                        let posicao = larguraJanela / 2 > leftImagem ? 'direita' : 'esquerda';
                        let leftZoom = posicao == 'direita' ? larguraImagem + leftImagem : leftImagem - larguraDiv - 50;

                        let divImagemComZoom = document.createElement('div');
                        $(divImagemComZoom).addClass('divImagemComZoom');
                        let imagemComZoom = document.createElement('img');
                        //$(imagemComZoom).addClass('imagemComZoom');
                        imagemComZoom.src = imagem;

                        $(divImagemComZoom).css('left', leftZoom);
                        //$(divImagemComZoom).css('top', topImagem * -1);

                        imagemComZoom.id = 'imagemAmpliada'

                        if (!$('.divImagemComZoom').length > 0) {
                            $(divImagemComZoom).append(imagemComZoom);
                            $(elem).closest('.divListaAnexos').append(divImagemComZoom);
                        }


                        let larguraImagemZoom = $(imagemComZoom).width();
                        if ((larguraImagem <= larguraDiv) && (alturaImagem < 500)) {
                            $(imagemComZoom).addClass('width', larguraDiv);
                        } else {
                            // POSICAO ABSOLUTA DO CONTEUDO NA TELA
                            var pos_x = $(elem).offset().left;
                            var pos_y = $(elem).offset().top;

                            // LARGURA E ALTURA DO CONTAINER
                            var container_x = $(divImagemComZoom).width();
                            var container_y = $(divImagemComZoom).height();

                            // LARGURA E ALTURA DO CONTEUDO
                            var conteudo_x = $(imagemComZoom).width();
                            var conteudo_y = $(imagemComZoom).height();

                            // LARGURA E ALTURA DO#thumb
                            var thumb_x = $(elem).width();
                            var thumb_y = $(elem).height();

                            // QUANTOS PX DO CONTE�DO FICAM PRA FORA DO CONTAINER
                            var diferenca_x = conteudo_x - container_x;
                            var diferenca_y = conteudo_y - container_y;

                            // POSICAO INICIAL ( na metade da tela)
                            var metade_x = - parseInt(diferenca_x / 2);
                            var metade_y = - parseInt(diferenca_y / 2);

                            // POSICIONANDO CONTEUDO
                            $(elem).mousemove(function (e) {
                                porcentagem_x = parseInt((e.pageX - pos_x) / thumb_x * 100);
                                porcentagem_y = parseInt((e.pageY - pos_y) / thumb_y * 100);
                                leftPosition = parseInt(0 - (diferenca_x / 100 * porcentagem_x));
                                topPosition = parseInt(0 - (diferenca_y / 100 * porcentagem_y));

                                $('#imagemAmpliada').css({
                                    'left': leftPosition,
                                    'top': topPosition
                                });
                            });
                        }
                        //*/
                    })

                    $(elem).mouseleave(() => {
                        if ($('.divImagemComZoom').length > 0) {
                            $('.divImagemComZoom').remove();
                        }
                    })
                }
            }
        }
    })
    .directive('focoCadastrar', () => {
        return {
            restrict: 'A',
            link: (scope, elem, attr) => {
                setTimeout(() => {
                    if (scope.tela == 'cadastro') {
                        elem.focus();
                    }
                }, 100);
            }
        }
    })
    .directive('quebraLinha', () => {
        return {
            template: '<div class="col-xs-12"></div>'
        }
    })
    .directive('timerConsulta', ($rootScope) => {
        return {
            restrict: 'E',
            template: `
                <div class="col-xs-12">                    
                    <div class="botoesTimerConsulta">
                        <button type="button" class="btn btn-default btn-xs glyphicon glyphicon-play" id="playTimerConsulta" ng-if="timerPausado" ng-click="iniciarTimer()"></button>
                        <button type="button" class="btn btn-default btn-xs glyphicon glyphicon-pause" id="pauseTimerConsulta" ng-if="!timerPausado" ng-click="pausarTimer()"></button>                            
                    </div>
                    <div id="#barraProgressoTimer" class="barraProgressoTimer"></div>                    
                </div>
            `,
            link: (scope, elem, attr) => {
                var delay = attr.intervalo * 1000;
                //console.log(delay);
                var progress = document.getElementById("#barraProgressoTimer");

                setTimeout(() => {
                    scope.timerPausado = false;
                    scope.iniciarTimer();
                }, 1000);

                function timer(callback, delay) {
                    var timerId;
                    var start;
                    var remaining = delay;

                    this.pause = function () {
                        window.clearTimeout(timerId);
                        remaining -= new Date() - start;
                        // console.log(remaining);
                    };

                    var resume = function () {
                        start = new Date();
                        //  console.log(remaining);
                        timerId = window.setTimeout(function () {
                            console.log('teste');
                            remaining = delay;
                            resume();
                            callback();
                        }, remaining);
                    };
                    this.resume = resume;

                    this.reset = function () {
                        remaining = delay;
                    };
                }

                var t = new timer(function () {
                    // console.log('aqui');
                    let novaData = new Date();
                    let proximaData = new Date();
                    proximaData.setSeconds(novaData.getSeconds() + parseInt(attr.intervalo));

                    $rootScope.proximoDisparoTimer = $rootScope.proximoDisparoTimer == undefined ? proximaData : $rootScope.proximoDisparoTimer;

                    if (novaData > $rootScope.proximoDisparoTimer) {
                        scope.filtrar(1, 'timer');
                        $rootScope.proximoDisparoTimer = proximaData;
                    } else {

                    }

                }, delay);

                progress.style.animationDuration = delay + "ms";

                $rootScope.iniciarTimer = () => {
                    console.log('iniciando');
                    scope.timerPausado = false;
                    t.resume();
                    progress.classList.add("animate");
                    progress.classList.remove("pause");
                };

                $rootScope.pausarTimer = () => {
                    scope.timerPausado = true;
                    t.pause();
                    progress.classList.add("pause");
                };

                $rootScope.reiniciarTimer = () => {
                    t.reset();
                    progress.classList.remove("animate");
                    void progress.offsetWidth;
                    progress.classList.add("animate");
                };


            }
        }
    })
    .directive('ordenacaoConsulta', ($compile) => {
        return {
            restrict: 'E',
            link: (scope, elem, attr) => {
                let campoOrdem = scope.estrutura.campoOrdemConsulta != undefined ? scope.estrutura.campoOrdemConsulta : 'posicao';
                let repeticao = [];
                for (let p in scope.listaConsulta) {
                    repeticao.push(scope.listaConsulta[p][campoOrdem]);
                }

                let html = `
                <div class="form-group"
                <select ng-model="item.${campoOrdem}" ng-options="p.${campoOrdem} as p.${campoOrdem} for p in listaConsulta"></select>`;
                elem.html(html);
                $compile(elem.contents())(scope);
            }
        }
    })
    .directive('selectMes', () => {
        return {
            restrict: 'E',
            replace: true,
            template: `
                <select class="form-control input-xs" >
                    <option value="">Selecione</option>
                    <option value="1">Janeiro</option>
                    <option value="2">Fevereiro</option>
                    <option value="3">Março</option>
                    <option value="4">Abril</option>
                    <option value="5">Maio</option>
                    <option value="6">Junho</option>
                    <option value="7">Julho</option>
                    <option value="8">Agosto</option>
                    <option value="9">Setembro</option>
                    <option value="10">Outubro</option>
                    <option value="11">Novembro</option>
                    <option value="12">Dezembro</option>
                </select>
            `
        }
    })
    .directive('linhaDivisoria', () => {
        return {
            restrict: 'E',
            template: '<div class="col-xs-12" style="border-bottom: 2px solid"></div>',
            replace: true
        }
    })
