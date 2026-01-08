directivesPadrao.directive('montaBlocoHtml', ['$parse', '$compile', 'APIServ', 'EGFuncoes', 'APIAjuFor', function ($parse, $compile, APIServ, EGFuncoes, APIAjuFor) {
    return {
        restrict: 'E',
        replace: true,
        template: '',
        link: function (scope, elem) {
            var p = scope.estrutura;
            var nomeBloco = elem.attr('nome-bloco');

            var bloco = APIServ.buscarValorVariavel(scope.estrutura, nomeBloco);

            if (bloco == undefined) {
                return false;
            }

            if (bloco.campos == undefined || Object.keys(bloco.campos).length == 0) {
                return false;
            }

            var repeticao = bloco.repeticao != undefined ? bloco.repeticao : undefined;
            var temPosicao = repeticao != undefined && repeticao.temPosicao != undefined && repeticao.temPosicao;
            var tamanhoDivCampos = repeticao != undefined && repeticao.tamanhoDivCampos != undefined ? repeticao.tamanhoDivCampos : 'col-md-10';
            var tamanhoDivBotoes = repeticao != undefined && repeticao.tamanhoDivBotoes != undefined ? repeticao.tamanhoDivCampos : 'col-md-2';
            var baixarBotao = '';

            var variavelSuperior = bloco.variavelSuperior;
            var variavelSalvar = bloco.variavelSalvar;

            var classesDiv = bloco.classes != undefined ? bloco.classes : '';
            var atributosBloco = bloco.atributosBloco != undefined ? bloco.atributosBloco :
                bloco.atributos_bloco != undefined ? bloco.atributos_bloco : undefined;

            atributosBloco = atributosBloco != undefined ? EGFuncoes.montarAtributos(atributosBloco) : [];

            var htmlCompleto = '';
            

            var acao = scope.acao != undefined ? scope.acao : APIServ.parametrosUrl()[1];

            var verificarPerfil = bloco.verificarPerfil != undefined && bloco.verificarPerfil;                        

            var temAcao = $rS[acao] != undefined && $rS[acao]['campos'] != undefined && $rS[acao]['campos'][nomeBloco] != undefined;

            //console.log(nomeBloco, temAcao);

            var botaoComprimir = bloco.opcaoComprimir == undefined || bloco.opcaoComprimir == true ? `<expande-comprime-bloco nome-bloco="${nomeBloco}"></expande-comprime-bloco>` : '<div class="col-xs-1"></div>';
            var botaoAdicionar = bloco.variavelSalvar != undefined && bloco.repeticao != undefined &&
                (bloco.repeticao.ocultarBotaoAdicionar == undefined || bloco.repeticao.ocultarBotaoAdicionar == false) ?
                `<button type="button" class="btn btn-primary btn-modern input-lg glyphicon glyphicon-plus botaoAdicionarItemRepeticao"  ng-click="adicionarItemRepeticao('${nomeBloco}')"></button>` : '';

            var atributosBotaoExcluir = bloco.repeticao != undefined && bloco.repeticao.atributosBotaoExcluir != undefined ? EGFuncoes.montarAtributos(bloco.repeticao.atributosBotaoExcluir) : [];
            var botaoExcluir = bloco.variavelSalvar != undefined && bloco.repeticao != undefined && (bloco.repeticao.ocultarBotaoExcluir == undefined || bloco.repeticao.ocultarBotaoExcluir == false) ?
                `<button type="button" class="btn btn-danger btn-modern input-lg glyphicon glyphicon-trash botaoRemoverItemRepeticao ${baixarBotao} col-md-3" indice="{{$index}}" 
                    indice-parent="{{this.$parent.$index}}" ng-click="removerItemRepeticao('${nomeBloco}')" ${atributosBotaoExcluir.join(' ')}></button>` : '';

            var botaoAddTodos = botaoAdicionar != '' && bloco.repeticao.adicionarTodos ?
                `<button type="button" class="btn btn-primary btn-modern input-lg glyphicon glyphicon-plus"  ng-click="adicionarTodosItensRepeticao('${nomeBloco}')">Todos</button>` : '';

            var htmlTitulo = bloco.titulo != undefined ? `
                <div class="row tituloBloco">
                    ${botaoComprimir}
                    <h2 ng-if="!dispositivoMovel" id="titulo_${nomeBloco}" class="col-md-10 text-center">${bloco.titulo}</h2>
                    <h4 ng-if="dispositivoMovel" id="titulo_${nomeBloco}" class="col-xs-9 text-center">${bloco.titulo}</h4>
                    
                    <span>${botaoAdicionar}</span>
                    ${botaoAddTodos}
                </div>` :
                '';


            //var htmlAbreRepeticao = `<div class="row conteudoBloco" id="${elem.attr('nome-bloco')}">`;
            var htmlAbreRepeticao = '';
            var htmlRepeticao = '';
            var htmlSubRepeticao = '';
            var htmlFechaRepeticao = '';

            var itemRepetir = '';
            var htmlPosicao = '';
            var htmlBotoesRepeticao = '';
            var htmlNumeracao = '';

            if (!repeticao) {
                angular.forEach(bloco.campos, function (propriedades, campo) {

                    if (campo.substr(0, 5) == "botao") {
                        htmlRepeticao += `<input-botao parametros="${campo}"></input-botao>`; // EGFuncoes.montarBotao(propriedades);
                    } else if (propriedades.tipo == 'diretiva' || propriedades == 'diretiva') {
                        var nomeDiretivaCampo = propriedades.nomeDiretiva != undefined ? APIAjuFor.variavelParaDiretiva(propriedades.nomeDiretiva) :
                            APIAjuFor.variavelParaDiretiva(campo);
                        htmlRepeticao += `<${nomeDiretivaCampo}></${nomeDiretivaCampo}>`;
                    } else if (campo == 'incluirTemplate') {
                        htmlRepeticao += `<ng-include src="${val}.html">`;
                    } else if (campo.substr(0, 5) == 'bloco') {
                        htmlRepeticao += `<monta-bloco-html nome-bloco="${campo}"></monta-bloco-html>`;

                    } else {
                        if (propriedades.tipoEtiqueta != undefined && propriedades.tipoEtiqueta == 'embutido') {
                            baixarBotao = '';
                        }
                        htmlRepeticao += `<monta-html campo="${campo}" nome-bloco="${elem.attr('nome-bloco')}" indice="{{$index}}"></monta-html> `
                    }
                });
            } else if (repeticao) {
                var classeBloco = bloco.variavelSuperior ? 'itemSubRelacionado' : 'itemRelacionado';

                if (repeticao.raizModeloItemRepetir != undefined && !variavelSuperior) {
                    itemRepetir = repeticao.raizModeloItemRepetir + '.' + repeticao.itemRepetir;
                } else if (variavelSuperior) {
                    if (repeticao.raizModeloItemRepetir != undefined)
                        itemRepetir = `${repeticao.raizModeloItemRepetir}.${variavelSuperior}[${scope.$index}]['${variavelSalvar}']`
                    else
                        itemRepetir = `${p.raizModelo}.${variavelSuperior}[${scope.$index}]['${variavelSalvar}']`;
                } else {
                    itemRepetir = p.raizModelo + '.' + repeticao.itemRepetir;
                }

                htmlAbreRepeticao = `<div class="${classeBloco} col-xs-12 conteudoBloco ng-class-even:'linhaImpar'; ng-class-odd:'linhaPar'" 
                    ng-repeat="(${repeticao.campoValor}, ${bloco.nomeBloco}) in ${itemRepetir}" indice-bloco="{{$index}}">`;
                htmlFechaRepeticao = '</div>';

                htmlNumeracao = bloco.repeticao.numerar != undefined && bloco.repeticao.numerar ? '<label class="numeracaoRepeticao">{{$index + 1}}º</label>' : '';

                if (temPosicao) {
                    var classePosicao = bloco.variavelSalvar + '_posicao';
                    htmlPosicao = `<monta-html-posicao indice="{{$index}}" nome-bloco="${nomeBloco}" item-repetir="${itemRepetir}"></monta-html-posicao>`;
                }

                var classeRepeticao = temPosicao ? 'col-md-9' : tamanhoDivCampos;
                htmlRepeticao = `<div class="${classeRepeticao}">`;
                angular.forEach(bloco.campos, function (propriedades, campo) {

                    if (campo.substr(0, 5) == "botao") {
                        htmlRepeticao += `<input-botao parametros="${campo}"></input-botao>`; // EGFuncoes.montarBotao(propriedades);
                    } else if (propriedades.tipo == 'diretiva' || propriedades == 'diretiva') {
                        atributosDiretiva = propriedades.atributos_diretiva != undefined ? EGFuncoes.montarAtributos(propriedades.atributos_diretiva) : '';
                        atributosDiretiva = atributosDiretiva.length > 0 ? atributosDiretiva.join(' ') : '';
                        htmlRepeticao += `<${APIAjuFor.variavelParaDiretiva(campo)} ${atributosDiretiva} ></${APIAjuFor.variavelParaDiretiva(campo)}>`;
                    } else if (campo == 'incluirTemplate') {
                        htmlRepeticao += `<ng-include src="${val}.html">`;
                    } else if (campo.substr(0, 5) == 'bloco') {
                        htmlRepeticao += `<monta-bloco-html nome-bloco="${campo}"></monta-bloco-html>`;
                    } else {
                        if (propriedades.tipoEtiqueta != undefined && propriedades.tipoEtiqueta == 'embutido') {
                            baixarBotao = '';
                        }

                        htmlRepeticao += `<monta-html campo="${campo}" nome-bloco="${elem.attr('nome-bloco')}" ng-attr-indice="{{$index}}"></monta-html> `
                    }
                });

                htmlBotoesRepeticao = `
                    <div class="col-xs-12 col-md-4 ${tamanhoDivBotoes} divBotoesRepeticao">                        
                        ${botaoAdicionar}                        
                        ${botaoExcluir}
                    </div>
                `;
                //htmlRepeticao+= htmlBotoesRepeticao;

                if (bloco.repeticao != undefined && bloco.repeticao.minimoItensBloco != undefined && bloco.repeticao.minimoItensBloco > 0) {
                    for (var i = 0; i < bloco.repeticao.minimoItensBloco; i++) {
                        //Comparo, pois pode já haver item adicionado na funcao aoCarregar
                        // console.log(itemRepetir);
                        if (eval('scope.' + itemRepetir) == undefined || Object.keys(eval('scope.' + itemRepetir)).length <= i) {
                            scope.adicionarItemRepeticao(nomeBloco);
                        }
                    }
                }
            }
            htmlRepeticao += '</div>';


            if (repeticao && bloco.repeticao.campos != undefined) {
                console.log('teste');

                angular.forEach(bloco.repeticao.campos, function (propriedadesCR, campoR) {
                    if (EGFuncoes.eBloco(campoR)) {
                        htmlSubRepeticao += `<monta-bloco-html nome-bloco="${campoR}"></monta-bloco-html>`;
                    }
                });
            }

            htmlCompleto =
                `<div class="${classesDiv}" ${atributosBloco.join(' ')}>
                   ${htmlTitulo}
                   <div class="conteudoBloco" style="display: block;">
                   ${htmlAbreRepeticao}
                   ${htmlNumeracao}
                   ${htmlPosicao}
                   
                   ${htmlRepeticao}
                   ${htmlBotoesRepeticao}
                   ${htmlSubRepeticao}
                   
                   ${htmlFechaRepeticao}
                   </div>
               </div>`;

            elem.html(htmlCompleto);
            $compile(elem.contents())(scope);
        }
    }
}])
    .directive('blocoHtmlDetalhe', ['$compile', 'APIServ', 'EGFuncoes', 'APIAjuFor', function ($compile, APIServ, EGFuncoes, APIAjuFor) {
        return {
            restrict: 'E',
            replace: true,
            link: function (scope, elem) {
                
                var nomeBloco = elem.attr('nome-bloco');
                var dadosBloco = APIServ.buscarValorVariavel(scope.estrutura.campos, nomeBloco);
                var indice = elem.attr('indice');
                var dados = scope.listaConsulta[indice]['detalhes']
                var classesDiv = dadosBloco.titulo != undefined ? dadosBloco.classes : '';
                var atributosBloco = dadosBloco.atributos_bloco != undefined ? EGFuncoes.montarAtributos(dadosBloco.atributos_bloco) : [''];
                var titulo = dadosBloco.titulo != undefined ? `<h3 class="text-center">${dadosBloco.titulo}</h3>` : '';

                var html = '';

                if (dadosBloco.repeticao != undefined) {
                    html += `<repeticao-bloco-detalhes nome-bloco="${nomeBloco}" indice="${indice}"></repeticao-bloco-detalhes>`;
                } else {
                    angular.forEach(dadosBloco.campos, function (propriedades, campo) {
                        if (campo.substr(0, 5) == 'bloco') {
                            html += `<bloco-html-detalhe nome-bloco="${nomeBloco}" indice="${indice}"></bloco-html-detalhe>`; //_montaBlocoHtmlDetalhes(campo, propriedades, html);
                        } else if (propriedades == 'diretiva') {
                            var nomeDiretiva = APIAjuFor.variavelParaDiretiva(campo);
                            html += `<${nomeDiretiva} nome-bloco="${nomeBloco}" indice="$index" ></${nomeDiretiva}>`;
                        } else if ((propriedades.tipo == undefined || propriedades.tipo != 'oculto') && APIServ.chaveExisteEmVariavel(dadosBloco.campos, campo) && campo.substr(0, 5) != 'botao') {
                            var camposNaoMostrar = scope.estrutura.tipoListaConsulta == 'tabela' ? [] : Object.keys(scope.estrutura.listaConsulta);
                            var mostrar = !APIServ.valorExisteEmVariavel(camposNaoMostrar, campo);
                            if (mostrar) {
                                html += `<html-detalhe campo="${campo}" indice="${indice}"></html-detalhe>`
                            }
                        }
                    });
                }

                var html =
                    `<div class="${classesDiv}" ${atributosBloco.join(' ')}>
                        ${titulo}
                        ${html}
                    </div>`;
                elem.html(html);
                $compile(elem.contents())(scope);
            }
        }
    }])
    .directive('repeticaoBlocoDetalhes', ['$compile', 'APIServ', 'EGFuncoes', 'APIAjuFor', function ($compile, APIServ, EGFuncoes, APIAjuFor) {
        return {
            restrict: 'E',
            replace: true,
            link: function (scope, elem) {
                var nomeBloco = elem.attr('nome-bloco');
                var dadosBloco = APIServ.buscarValorVariavel(scope.estrutura.campos, nomeBloco);

                var indice = elem.attr('indice');

                if (dadosBloco.variavelSuperior != undefined) {
                    var variavelRepetir = `item['detalhes']['${dadosBloco.variavelSuperior}'][${scope.$index}]['${dadosBloco.variavelSalvar}']`;
                } else {
                    var variavelRepetir = `item['detalhes']['${dadosBloco.variavelSalvar}']`;
                }

                var nomeRepeticao = dadosBloco.repeticao.nomeRepeticao != undefined ? dadosBloco.repeticao.nomeRepeticao : 'k';
                var classes = dadosBloco.repeticao.classes != undefined ? dadosBloco.repeticao.classes : '';
                html =
                    `<div class="col-xs-12 itemConsulta ${classes}" ng-repeat="(keyItemDetalhe, ${nomeRepeticao}) in ${variavelRepetir}">
                    <div class="row">`;

                if (dadosBloco.repeticao.numerar) {
                    html += '<label class="numeracaoRepeticao2">{{$index + 1}}º</label>';
                }

                //console.log(dadosBloco);
                angular.forEach(dadosBloco.repeticao.itens, function (val, key) {
                    console.log(val);
                    //var eObjeto = angular.isObject(val);
                    var campo = angular.isObject(val) ? key : val;
                    var valoresCampo = APIServ.buscarValorVariavel(scope.estrutura.campos, campo);
                    var valoresTemp = angular.isObject(val) ? val : {};
                    var valores = Object.assign({}, valoresCampo, valoresTemp);

                    //var textoRI = Number.isInteger(key) ? '' : val.texto != undefined ? val.texto + ': ' : '';
                    var label = valores.texto != undefined && valores.texto != '' ? valores.texto + ': ' : '';
                    var tamanho = EGFuncoes.montarTamanhos(valores);

                    if (val == 'diretiva') {
                        var nomeDiretiva = APIAjuFor.variavelParaDiretiva(key);
                        html += `<${nomeDiretiva} nome-bloco="${dadosBloco['nomeBloco']}" indice="{{keyItemDetalhe}}" modelo="${dadosBloco.repeticao.nomeRepeticao}"></${nomeDiretiva}>`;
                    } else {
                        html += `   <div class="campoDetalheConsulta ${tamanho.join(' ')}">`;
                        if (valoresCampo.tipo != undefined && valoresCampo.tipo == 'imagem') {
                            html += `    <img ng-src="{{${dadosBloco.repeticao.nomeRepeticao}.${campo}}}" class="img-responsive">`;
                        } else {
                            html += `    
                                    <span>${label}</span>
                                    <label ng-model="item[${indice}][${dadosBloco.repeticao.nomeRepeticao}][${campo}]">{{${dadosBloco.repeticao.nomeRepeticao}.${campo}}} </label>`;
                        }
                        html += '</div>';
                    }
                });

                if (dadosBloco.repeticao.campos != undefined) {
                    angular.forEach(dadosBloco.repeticao.campos, function (val, key) {
                        if (key.substr(0, 5) == 'bloco') {
                            html += `<bloco-html-detalhe nome-bloco="${key}" indice="${indice}"></bloco-html-detalhe>`; //_montaBlocoHtmlDetalhes(key, val);
                        } else if (val.tipo == undefined || val.tipo != 'oculto') {
                            html += `<html-detalhe campo="${key}" indice="${indice}"></html-detalhe>`;
                        }
                    })
                }


                var htmlAnexosBloco = '';
                if (dadosBloco.anexos != undefined) {

                    var paramAnexo = typeof dadosBloco.anexos == 'string' ? dadosBloco.anexos : 'anexos';
                    html += `<input-botao parametros="${paramAnexo}"></input-botao>`;
                    htmlAnexosBloco = `<arquivos-anexos tela="anexosBloco" item-repetir="${dadosBloco.repeticao.itemRepetir}" nome-bloco="${nomeBloco}"
                        ng-if="${dadosBloco.repeticao.itemRepetir}.exibirAnexos" parametros="${paramAnexo}" chave-array="key"></arquivos-anexos>`;
                }

                html +=
                    ` 
                    </div>  
                                 
                    ${htmlAnexosBloco}
                </div>`;
                elem.html(html);
                $compile(elem.contents())(scope);
            }
        }
    }])
    .directive('modeloBloco', ['$parse', '$compile', 'APIServ', 'EGFuncoes', function ($parse, $compile, APIServ, EGFuncoes) {
        return {
            restrict: 'A',
            terminal: true,
            priority: 1000,
            link: function (scope, elem) {

                var nomeBloco = elem.attr('modelo-bloco');
                var bloco = APIServ.buscarValorVariavel(scope.estrutura, nomeBloco);
                var campo = elem.attr('campo');
                var dadosCampo = APIServ.buscarValorVariavel(bloco, campo);
                var autoCompleta = dadosCampo['autoCompleta'];
                var raizModeloBloco;

                if (bloco.variavelSuperior != undefined) {
                    //tenho que alterar esta rotina, pois pode ser um subbloco sem repeticao, como fiz para o relacionamento.
                    var chave = scope[bloco.variavelSalvar][bloco.campoChave];
                    //var indice = scope.$parent.$index;
                    //var indice2 = scope.$index;
                    raizModeloBloco = bloco.raizModeloBloco != undefined ? bloco.raizModeloBloco : scope.estrutura.raizModelo;
                    var baseModelo = raizModeloBloco + '.' + bloco.variavelSuperior + '[$parent.$index]["' + bloco.nomeBloco + '"][$index]';
                    //var modelo = scope.estrutura.raizModelo + '.' + bloco.variavelSuperior + '[' + indice + ']["' + bloco.nomeBloco + '"][' + indice2 + ']["' + campo + '"]';
                    var modelo = baseModelo + '["' + campo + '"]';

                    var id = EGFuncoes.modeloParaId(modelo);

                } else if (bloco.nomeBloco != undefined) {
                    if (bloco.repeticao != undefined) {
                        var chave = scope[bloco.variavelSalvar] != undefined && scope[bloco.variavelSalvar][bloco.campoChave];
                        var indice = chave == 0 ? EGFuncoes.maiorChaveArray(eval('scope.' + scope.estrutura.raizModelo + '.' + bloco.nomeBloco)) : scope.$index;
                        raizModeloBloco = bloco.raizModeloBloco != undefined ? bloco.raizModeloBloco : scope.estrutura.raizModelo;
                        var baseModelo = raizModeloBloco + '.' + bloco.nomeBloco + `[$index]`;

                        //var modelo = scope.estrutura.raizModelo + '.' + bloco.nomeBloco + `[${indice}]['${campo}']`;
                        var modelo = baseModelo + `['${campo}']`;

                    } else {
                        console.log('aqui');
                        //Neste caso o bloco nao tem repeticao
                        var baseModelo = scope.estrutura.raizModelo + '.' + bloco.nomeBloco;
                        //var modelo = scope.estrutura.raizModelo + '.' + bloco.nomeBloco + `['${campo}']`;
                        var modelo = baseModelo + `['${campo}']`;
                    }
                    var id = EGFuncoes.modeloParaId(modelo);
                } else {
                    var baseModelo = scope.estrutura.raizModelo
                    //var modelo = scope.estrutura.raizModelo + '.' + campo;
                    var modelo = baseModelo + '.' + campo;
                    var id = EGFuncoes.modeloParaId(modelo);
                }

                var modeloChave = '';
                if (autoCompleta) {
                    modeloChave = autoCompleta.objChave != undefined ? baseModelo + `['${autoCompleta.objChave}']` : baseModelo + `['${autoCompleta.campoChave}']`;
                    elem.attr('modelo-chave', modeloChave);
                }


                elem.removeAttr('modelo-bloco');
                elem.removeAttr('ng-model');
                elem.attr('nome-bloco', nomeBloco);
                elem.attr('ng-model', modelo);
                elem.attr('id', id);
                elem.attr('name', id);


                //Vendo se estará desabilitado na Edicao
                if (dadosCampo.habilitadoEdicao != undefined && dadosCampo.habilitadoEdicao == 'false' && bloco.campoChave != undefined) {
                    var chaveBloco = baseModelo + `['${bloco.campoChave}']`;
                    elem.attr('ng-disabled', `${chaveBloco} > 0`);
                }

                $compile(elem)(scope);
            }
        }
    }])
    .directive("expandeComprimeBloco", function ($compile, APIServ, EGFuncoes) {
        return {
            restrict: "E",
            replace: true,
            template: '<button type="button" class="btn btn-default col-xs-3 col-md-1 glyphicon"></button>',
            link: function (scope, elem, attr) {
                var tamanho = elem.attr("tamanho") != undefined ? elem.attr("tamanho") : "pequeno";

                var tamanhos = {
                    original: "",
                    pequeno: "iconePequeno",
                    medio: "iconeMedio",
                    grande: "iconeGrande",
                };

                var comprimir = false;

                var classeIcone = "glyphicon-collapse-down";

                //Fiz esta comaracao pois a diretiva pode ser chamanda de fora de uma estruturaGerencia
                if (scope.estrutura != undefined) {
                    dadosBloco = APIServ.buscarValorVariavel(scope.estrutura.campos, elem.attr("nome-bloco"));
                    comprimir = dadosBloco.iniciarComprimido != undefined ? dadosBloco.iniciarComprimido : false;
                    classeIcone = comprimir ? "glyphicon-expand" : "glyphicon-collapse-down";
                } else {
                    //Depois tenho que tratar para que eles se auto comprimam vindo pela atributo
                    comprimir = attr.iniciarComprimido != undefined && attr.iniciarComprimido ? true : false;
                    classeIcone = comprimir ? "glyphicon-expand" : "glyphicon-collapse-down";
                }

                elem.addClass(classeIcone);

                elem.bind("click", function ($event) {   
                    console.log($event);
                                     
                    let classeBloco = attr.classeBloco != undefined ? attr.classeBloco : "conteudoBloco";                    

                    var obj = $event.target;
                    //var objConteudo = angular.element(obj).parent('div').siblings('div.' + classeBloco);
                    var objConteudo = $(obj).closest("monta-bloco-html").find(".conteudoBloco");

                    var visible = !objConteudo.is(":visible");

                    objConteudo.toggle("collapse");

                    if (visible) {
                        angular.element(obj).removeClass("glyphicon-expand").addClass("glyphicon-collapse-down");
                    } else {
                        angular.element(obj).removeClass("glyphicon-collapse-down").addClass("glyphicon-expand");
                    }
                });
                elem.addClass(tamanhos[tamanho]);
                $compile(elem.contents())(scope);
            },
        };
    })