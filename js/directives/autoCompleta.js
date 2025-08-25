directivesPadrao.directive('autoCompleta', ['$rootScope', '$parse', 'APIServ', 'EGFuncoes', function ($rootScope, $parse, APIServ, EGFuncoes) {
    return {
        restrict: "A",
        link: function (scope, elem, attr) {
            var e = scope.estrutura;
            var campo = elem.attr('auto-completa');

            // Função auxiliar para acessar valores dinâmicos de forma segura
            function getScopeValue(expr) {
                try {
                    return $parse(expr)(scope);
                } catch (e) {
                    return undefined;
                }
            }

            // Função auxiliar para atribuir valores dinâmicos de forma segura
            function setScopeValue(expr, value) {
                try {
                    $parse(expr).assign(scope, value);
                } catch (e) {}
            }

            // Função debounce para evitar execuções excessivas
            function debounce(func, wait) {
                var timeout;
                return function() {
                    const context = this, args = arguments;
                    clearTimeout(timeout);
                    timeout = setTimeout(() => func.apply(context, args), wait);
                };
            }

            var temCampoFiltros = e.camposFiltroPesquisa != undefined && e.camposFiltroPesquisa[campo] != undefined;
            var temCampoCampos = APIServ.buscarValorVariavel(scope.estrutura.campos, campo);

            var buscarCampoCompleto = (campo, nomeBloco) => {
                //Vendo de onde buscar o campo completo
                var campoFiltro = temCampoFiltros && (scope.tela == undefined || scope.tela == 'consulta') ? scope.estrutura.camposFiltroPesquisa[campo] : [];
                var campoCampos;

                if (nomeBloco != undefined && nomeBloco != '') {
                    var dadosBloco = APIServ.buscarValorVariavel(scope.estrutura.campos, nomeBloco);
                    campoCampos = APIServ.buscarValorVariavel(dadosBloco.campos, campo);
                } else {
                    campoCampos = temCampoCampos ? APIServ.buscarValorVariavel(scope.estrutura.campos, campo) : [];
                }

                var retorno;// = Object.assign(campoFiltro, campoCampos);;

                if (scope.tela == 'consulta' && scope.estrutura.camposFiltroPersonalizado != undefined) {
                    retorno = Object.assign(campoFiltro, campoCampos, scope.estrutura.camposFiltroPersonalizado[campo]);
                } else if (scope.tela == 'consulta') {
                    retorno = Object.assign(campoCampos, campoFiltro);
                } else {
                    retorno = Object.assign(campoFiltro, campoCampos);
                }
                return retorno;
            }

            var modeloChave;
            var objValor2 = '';
            var objValor3 = '';
            var objValor4 = '';

            var campoCompleto = buscarCampoCompleto(campo, attr.nomeBloco);

            var dAC = campoCompleto.autoCompleta;
            dAC.nomeBloco = attr.nomeBloco != undefined ? attr.nomeBloco : '';
            var temBloco = attr.nomeBloco != undefined;

            var dC;
            var dB = APIServ.buscarValorVariavel(e.campos, dAC.nomeBloco);

            var limparElemento = (dadosAC, modeloValor, modeloChave, modeloValor2, modeloValor3, modeloValor4) => {
                if (dadosAC.funcaoLimpar != undefined) {
                    // Preferência por $parse ao invés de eval
                    setScopeValue(dadosAC.funcaoLimpar + '()', undefined);
                }

                if (getScopeValue(modeloValor) != undefined) {
                    setScopeValue(modeloValor, undefined);
                }

                if (modeloChave) {
                    setScopeValue(modeloChave, 0);
                }
                if (modeloValor2) {
                    setScopeValue(modeloValor2, undefined);
                }
                if (modeloValor3) {
                    setScopeValue(modeloValor3, undefined);
                }
                if (modeloValor4) {
                    setScopeValue(modeloValor4, undefined);
                }

                // Comentário: $apply não é necessário aqui pois já está em contexto Angular
            }

            elem.bind('keyup', debounce((event) => {
                if (!elem.hasClass('valorConsulta')) {
                    var campoChaveControle = scope.estrutura.campoChave != undefined ? scope.estrutura.campoChave : scope.estrutura.campo_chave;

                    var elemAC = elem; // Usar elem diretamente é mais seguro
                    elemAC.val(elemAC.val().toUpperCase());

                    var indice = elem.attr('indice');
                    var temp = elemAC.attr('modelo-chave').split('.');
                    var campoChave = temp[temp.length - 1];
                    var modeloChaveAC = elemAC.attr('modelo-chave').replace('$index', indice);

                    var oldChave = getScopeValue(modeloChaveAC) != undefined ? getScopeValue(modeloChaveAC) : 0;

                    var parametros = {
                        tabela: dAC.tabela,
                        //campo: campo,
                        campo: dAC.campoValor,
                        valor: elem.val()
                    }
                    APIServ.executaFuncaoClasse('classeGeral', 'objetoexistesimples', parametros).then(retorno => {
                        if (retorno.data.existe) {
                            setScopeValue(modeloChaveAC, retorno.data.valorinformar);
                        } else if (campoChaveControle != campoChave) {
                            setScopeValue(modeloChaveAC, 0);
                        }
                    })
                }
            }, 250)); // 250ms debounce

            elem.bind("change", () => {
                var campo = elem.attr('auto-completa');
                var dadosAC = buscarCampoCompleto(campo, attr.nomeBloco)['autoCompleta'];

                if (dadosAC.camposLimparAoMudar != undefined) {
                    for (var keyCampoApagar in dadosAC.camposLimparAoMudar) {
                        var modeloApagar = elem.attr('ng-model').replace(elem.attr("campo"), dadosAC.camposLimparAoMudar[keyCampoApagar])
                        $parse(modeloApagar).assign(scope, undefined);
                    }
                }
            })

            elem.bind("blur", function (event) {
                //Se for valor de consulta, não precisa verificar se existe na base
                if (elem.hasClass('valorConsulta')) {
                    return false;
                }

                var indice = 0;
                if (temBloco) {
                    indice = elem.attr('indice');
                }

                var elemAC = elem;

                //Se estiver vazio, e tiver o modelo da chave, seto 0
                var campoChaveControle = scope.estrutura.campoChave != undefined ? scope.estrutura.campoChave : scope.estrutura.campo_chave;
                var temp = elemAC.attr('modelo-chave').split('.');
                var campoChave = temp[temp.length - 1];

                var modeloAC = EGFuncoes.indexPorNumero(event, elemAC.attr('ng-model'));
                var campo = elemAC.attr('campo');

                var modeloChaveAC = elemAC.attr('nome-bloco') != undefined ? elemAC.attr('modelo-chave').replace('$index', indice) :
                    modeloAC.replace("'" + campo + "'", "'" + campoChave + "'");

                var modeloValor2 = elemAC.attr('modelo-valor2') != undefined ? elemAC.attr('modelo-valor2').replace('$index', indice) : undefined;

                var valorElemento = getScopeValue(modeloAC);

                var campoCompleto = buscarCampoCompleto(campo, attr.nomeBloco);
                var aC = campoCompleto['autoCompleta'];

                //Valor vazio ou undefined limpo os campos
                if (valorElemento == '' || valorElemento == undefined) {
                    limparElemento(aC, modeloAC, modeloChaveAC, modeloValor2)
                } else { //if (aC.permitirValorInvalido == undefined || aC.permitirValorInvalido == false) {
                    //Se nao, se tem valor vejo se o valor existe
                    var parametrosBuscaChave = {
                        tabela: aC.tabela,
                        tabelaOrigem: aC.tabelaOrigem,
                        campos: [aC.campoValor],
                        valores: aC.complementoValor != undefined ? [getScopeValue(modeloAC).split('--')[0]] : [getScopeValue(modeloAC)]
                    }

                    var fd = new FormData();
                    fd.append('dados', JSON.stringify(parametrosBuscaChave));
                    //APIServ.executaFuncaoClasse('classeGeral', 'buscarChavePorCampos', fd, 'post').then(retorno => {
                        var fd2 = new FormData();
                        fd2.append('dados', JSON.stringify(parametrosBuscaChave));
                        APIServ.executaFuncaoClasse('classeGeral', 'buscarChavePorCampos', fd2, 'post').then(retorno => {
                            console.log(retorno.data);
                        //Nesse caso nao existe e verifico se e para salvar

                        if (retorno.data == '' || (getScopeValue(modeloChaveAC) == 0 || !getScopeValue(modeloChaveAC))) {
                            var permitirValorInvalido = aC.permitirValorInvalido != undefined && aC.permitirValorInvalido;

                            if (aC.salvarAoSair != undefined && aC.salvarAoSair) {
                                var conf = {
                                    tabela: 'listas'
                                }
                                var dados = {
                                    nome: campo,
                                    descricao: valorElemento,
                                    nome_apresentar: aC.nomeApresentar != undefined ? aC.nomeApresentar : ''
                                }

                                var fd = new FormData();
                                fd.append('configuracoes', JSON.stringify(conf));
                                fd.append('dados', JSON.stringify(dados));

                                var parametros = {
                                    configuracoes: conf,
                                    dados: dados
                                }
                                var funcaoSalvar = () => {
                                    APIServ.executaFuncaoClasse('classeGeral', 'manipula', fd, 'post').success(retorno => {
                                        if (retorno.chave > 0) {
                                            setScopeValue(modeloChaveAC, retorno.chave);
                                        }
                                    })
                                }
                                var funcaoNaoSalvar = () => {
                                    limparElemento(aC, modeloAC, modeloChaveAC, modeloValor2);
                                }

                                var nomeApresentar = aC.nomeApresenta != undefined ? aC.nomeApresenta : 'Ítem';
                                APIServ.dialogoSimples('Informação', nomeApresentar + ' Não existe. Salvá-lo', 'Sim', 'Não', funcaoSalvar, funcaoNaoSalvar);

                            } else if (retorno.data == '' && campoChaveControle != campoChave && !permitirValorInvalido) {
                                limparElemento(aC, modeloAC, modeloChaveAC, modeloValor2);
                            } else if (retorno.data == '' && permitirValorInvalido) {
                                //Nesse caso nao existe mas pode ter valor invalido, verifico se tem valor na chave e tiro
                                setScopeValue(modeloChaveAC, undefined);
                            }
                        }
                    })
                    // }else if(aC.permitirValorInvalido){
                    //     
                }
                //*/
            })

            elem.bind("focus", function () {
                $(this).attr('autocomplete', 'off');
                if (temBloco) {
                    var indice = scope.$index;
                }

                //Vendo de onde buscar o campo completo                
                var campoCompleto = buscarCampoCompleto(campo, attr.nomeBloco);

                var aC = campoCompleto.autoCompleta;

                var campoChave = aC.objChave != undefined ? aC.objChave : aC.campoChave != undefined ? aC.campoChave : e.campo_chave;

                if (temBloco) {
                    if (dB.variavelSuperior != undefined) {

                        var indice = scope.$parent.$index;
                        var indice2 = scope.$index;
                        var modeloValor2;
                        var modeloValor3;
                        var modeloValor4;

                        //Depois tenho que fazer uma comparacao igual fiz em baixo, pois pode nao haver repeticao no bloco e neste caso nao precisaria do indice2
                        modeloChave = e.raizModelo + '.' + dB.variavelSuperior + '[' + indice + ']["' + dB.nomeBloco + '"][' + indice2 + ']["' + campoChave + '"]';

                        objValor2 = aC.objValor2 != undefined ?
                            e.raizModelo + '.' + dB.variavelSuperior + '[' + indice + ']["' + dB.nomeBloco + '"][' + indice2 + ']["' + aC.objValor2 + '"]' : '';

                        objValor3 = aC.objValor3 != undefined ?
                            e.raizModelo + '.' + dB.variavelSuperior + '[' + indice + ']["' + dB.nomeBloco + '"][' + indice2 + ']["' + aC.objValor3 + '"]' : '';

                        objValor4 = aC.objValor4 != undefined ?
                            e.raizModelo + '.' + dB.variavelSuperior + '[' + indice + ']["' + dB.nomeBloco + '"][' + indice2 + ']["' + aC.objValor4 + '"]' : '';



                    } else {
                        if (dB.repeticao != undefined) {
                            modeloChave = e.raizModelo + '.' + dB.nomeBloco + '[' + indice + ']["' + campoChave + '"]';
                            objValor2 = aC.objValor2 != undefined ? e.raizModelo + '_' + dB.nomeBloco + '_' + indice + '_' + aC.objValor2 : '';
                            modeloValor2 = objValor2 != '' ? e.raizModelo + "['" + dB.nomeBloco + "'][$index]['" + aC.objValor2 + "']" : '';

                            if (objValor2 != '') {
                                var objValor2Temp = $('#' + objValor2).attr('ng-model') != undefined ? $('#' + objValor2).attr('ng-model') : modeloValor2;
                                //$('#' + attr.id).attr('modelo-valor2', $('#' + objValor2).attr('ng-model'));
                                $('#' + attr.id).attr('modelo-valor2', objValor2Temp);
                            }

                            objValor3 = aC.objValor3 != undefined ? e.raizModelo + '_' + dB.nomeBloco + '_' + indice + '_' + aC.objValor3 : '';
                            modeloValor3 = objValor3 != '' ? e.raizModelo + "['" + dB.nomeBloco + "'][$index]['" + aC.objValor3 + "']" : '';
                            if (objValor3 != '') {
                                var objValor3Temp = $('#' + objValor3).attr('ng-model') != undefined ? $('#' + objValor3).attr('ng-model') : modeloValor3;
                                //$('#' + attr.id).attr('modelo-valor3', $('#' + objValor3).attr('ng-model'));
                                $('#' + attr.id).attr('modelo-valor3', objValor3Temp);
                            }

                            objValor4 = aC.objValor4 != undefined ? e.raizModelo + '_' + dB.nomeBloco + '_' + indice + '_' + aC.objValor4 : '';
                            modeloValor4 = objValor4 != '' ? e.raizModelo + "['" + dB.nomeBloco + "'][$index]['" + aC.objValor4 + "']" : '';
                            if (objValor4 != '') {
                                var objValor4Temp = $('#' + objValor4).attr('ng-model') != undefined ? $('#' + objValor4).attr('ng-model') : modeloValor4;
                                $('#' + attr.id).attr('modelo-valor4', objValor4Temp);
                            }
                        } else {
                            modeloChave = e.raizModelo + '.' + dB.nomeBloco + '["' + campoChave + '"]';

                            objValor2 = aC.objValor2 != undefined && indice != undefined ?
                                e.raizModelo + '.' + dB.nomeBloco + '[' + indice + ']["' + aC.objValor2 + '"]' :
                                aC.objValor2 != undefined && indice == undefined ? e.raizModelo + '_' + dB.nomeBloco + '_' + aC.objValor2 : '';

                            if (objValor2 != '') {
                                elem.attr('modelo-valor2', $('#' + objValor2).attr('ng-model'));
                            }
                        }
                    }
                } else {
                    objValor2 = aC.objValor2 != undefined ? e.raizModelo + '_' + aC.objValor2 : '';
                    objValor3 = aC.objValor3 != undefined ? e.raizModelo + '_' + aC.objValor3 : '';
                    objValor4 = aC.objValor4 != undefined ? e.raizModelo + '_' + aC.objValor4 : '';

                    if (objValor2 != '') {
                        elem.attr('modelo-valor2', $('#' + objValor2).attr('ng-model'));

                    }
                    if (objValor3 != '') {
                        elem.attr('modelo-valor3', $('#' + objValor3).attr('ng-model'));
                    }
                    if (objValor4 != '') {
                        elem.attr('modelo-valor4', $('#' + objValor4).attr('ng-model'));
                    }

                    //Modificado em 07-01-2019 devido a necessidade de por campo autoCompleta em diretiva
                    if (aC.modeloChave != undefined) {
                        modeloChave = e.raizModelo + '.' + aC.modeloChave;
                    } else if (aC.objChave == undefined) {
                        modeloChave = e.raizModelo + '.' + campoChave;
                    } else {
                        modeloChave = elem.attr('modelo-chave');
                    }

                    //20230615
                    //Implmentando a opcao de buscar varios campos dentro de um Array

                    if (aC.valoresAdicionais != undefined && Object.keys(aC.valoresAdicionais).length > 0) {
                        elem.attr('valores-adicionais', JSON.stringify(aC.valoresAdicionais))
                    }
                }

                //Limpando o elemento no foco
                if (aC.limparNoFoco != undefined && (aC.limparNoFoco == 'true' || aC.limparNoFoco == true)) {
                    $parse(elem.attr('ng-model')).assign(scope, '');
                    $parse(modeloChave).assign(scope, '');
                    if (objValor2 != undefined && objValor2 != '') {
                        var elemento2 = angular.element('#' + EGFuncoes.modeloParaId(objValor2));
                        elemento2.val('');
                        $parse(elemento2.attr('ng-model')).assign(scope, '');
                        var chaveElemento2 = elemento2.siblings('.chave_auto_completa');
                        chaveElemento2.val('');
                        $parse(chaveElemento2.attr('ng-model')).assign(scope, '');
                    }

                    if (aC.aoLimparNoFoco != undefined) {
                        eval('scope. ' + aC.aoLimparNoFoco);
                    }
                }


                var chave2;
                if (aC.campoChave2 != undefined) {
                    //Primeiro vejo se a chave 2 esta setada na estrutura
                    if (aC.chave2 != undefined) {
                        chave2 = aC.chave2;
                    } else {
                        //Vendo se tem a chave2 no mesmo nivel do auto completaca
                        var variavelCampoChave2 = EGFuncoes.trocarCampoModelo(event, modeloChave, campoChave, aC.campoChave2);

                        var chave2MesmoNivel = eval('scope.' + variavelCampoChave2);
                        var chave2Raiz = eval('scope.' + e.raizModelo + '.' + aC.campoChave2);

                        if (indice != undefined && aC.objChave2 != undefined) {
                            aC.objChave2 = aC.objChave2.replace("$index", indice);
                        }

                        var chave2Objeto = eval('scope' + '.' + aC.objChave2) != undefined ? eval('scope' + '.' + aC.objChave2) :
                            eval('$rootScope' + '.' + aC.objChave2) != undefined ? eval('$rootScope' + '.' + aC.objChave2) : undefined;

                        chave2 = chave2MesmoNivel ? chave2MesmoNivel : chave2Raiz ? chave2Raiz :
                            chave2Objeto != undefined ? chave2Objeto : undefined;
                    }
                }


                var chave3 = '';
                if (aC.campoChave3 != undefined) {
                  // console.log(aC);
                    if (aC.chave3 != undefined) {
                        chave3 = aC.chave3;
                    } else {
                        //chave3 = aC.chave3 != undefined ? aC.chave3 : eval('scope.' + EGFuncoes.trocarCampoModelo(event, modeloChave, campoChave, aC.campoChave3));
                        var variavelCampoChave3 = EGFuncoes.trocarCampoModelo(event, modeloChave, campoChave, aC.campoChave3);

                        var chave3MesmoNivel = eval('scope.' + variavelCampoChave3);
                        var chave3Raiz = eval('scope.' + e.raizModelo + '.' + aC.campoChave3);

                        var idChaveObjeto = EGFuncoes.indexPorNumero(event, aC.objChave3);
                        
                        var chave3Objeto = eval('scope' + '.' + idChaveObjeto) != undefined ? eval('scope' + '.' + idChaveObjeto) :
                            eval('$rootScope' + '.' + idChaveObjeto) != undefined ? eval('$rootScope' + '.' + idChaveObjeto) : 
                            eval('scope.' + e.raizModelo + '.' + idChaveObjeto) != undefined ? eval('scope.' + e.raizModelo + '.' + idChaveObjeto) : undefined;

                        //console.log( eval('scope.' + e.raizModelo), idChaveObjeto, chave3Objeto);

                        // var chave3Objeto = eval('scope' + '.' + aC.objChave3) != undefined ? eval('scope' + '.' + aC.objChave3) :
                        //     eval('$rootScope' + '.' + aC.objChave3) != undefined ? eval('$rootScope' + '.' + aC.objChave3) : undefined;
                        
                        chave3 = chave3MesmoNivel ? chave3MesmoNivel : chave3Raiz ? chave3Raiz :
                            chave3Objeto != undefined ? chave3Objeto : undefined;
                        //console.log(chave3);
                    }
                }

                var autoCompleta = {
                    tabela: aC.tabela,
                    tabelaOrigem: aC.tabelaOrigem != undefined ? aC.tabelaOrigem : aC.tabela,
                    campo_chave: aC.campoChave,
                    campo_valor: aC.campoValor,
                    classeBusca: aC.classeBusca != undefined ? aC.classeBusca : 'classeGeral',
                    funcaoBusca: aC.funcaoBusca != undefined ? aC.funcaoBusca : 'completaCampo',
                    complemento_valor: aC.complementoValor != undefined ? aC.complementoValor : '',
                    campo_valor2: aC.campoValor2 != undefined ? aC.campoValor2 : '',
                    obj_valor2: EGFuncoes.modeloParaId(objValor2),
                    campo_valor3: aC.campoValor3 != undefined ? aC.campoValor3 : '',
                    obj_valor3: EGFuncoes.modeloParaId(objValor3),
                    campo_valor4: aC.campoValor4 != undefined ? aC.campoValor4 : '',
                    obj_valor4: EGFuncoes.modeloParaId(objValor4),
                    mascara_valor2: aC.mascaraValor2 != undefined ? aC.mascaraValor2 : '', //Remover depois
                    minimo: aC.minimo != undefined ? aC.minimo : 0,
                    mostrarnofoco: aC.minimo != undefined && aC.minimo == 0 ? 'S' : 'N',
                    campo_chave2: aC.campoChave2 != undefined ? aC.campoChave2 : '',
                    chave2: chave2,
                    campo_chave3: aC.campoChave3 != undefined ? aC.campoChave3 : '',
                    chave3: chave3,
                    ordenar: aC.ordenar != undefined ? aC.ordenar : 'S',
                    campoOrdem: aC.campoOrdem != undefined ? aC.campoOrdem : null,
                    obj_chave: aC.objChave != undefined ? aC.objChave : elem.siblings('.chave_auto_completa').attr('id'),
                    apagarsevazio: aC.apagarSeVazio ? aC.apagarSeVazio : 'S',
                    repetirvalores: aC.repetirValores != undefined ? aC.repetirValores : 'N',
                    aoSelecionar: aC.aoSelecionar != undefined ? aC.aoSelecionar : '',
                    modelo: elem.attr('ng-model'),
                    modeloChave: modeloChave,
                    verificarEmpresaUsuario: aC.verificarEmpresaUsuario ? aC.verificarEmpresaUsuario : false,
                    autoSelecionar: aC.autoSelecionar != undefined ? aC.autoSelecionar : true,
                    campoImagem: aC.campoImagem != undefined ? aC.campoImagem : '',
                    valoresAdicionais: aC.valoresAdicionais != undefined ? aC.valoresAdicionais : undefined,
                    usarIniciais: aC.usarIniciais != undefined ? aC.usarIniciais : false,
                    limparNoFoco: aC.limparNoFoco,
                    ignorarPublicar: aC.ignorarPublicar != undefined && aC.ignorarPublicar
                }


                var idElemento = '#' + attr.id; // EGFuncoes.modeloParaId(elem.attr('ng-model'));

                $(idElemento).autocompletaAngular(autoCompleta);

                setTimeout(function () {
                    $(idElemento).autocomplete("search", $(idElemento).val());
                }, 100);

            });

            (function ($) {
                jQuery.fn.autocompletaAngular = function (parametrosBusca) {
                    if (parametrosBusca.campo_chave2 != undefined && parametrosBusca.chave2 <= 0) {
                        return false;
                    }
                    
                    $(this).autocomplete({
                        minLength: parametrosBusca.minimo,
                        autoFocus: parametrosBusca.autoSelecionar,
                        source: function (request, response) {     
                            
                            parametrosBusca['term'] = parametrosBusca.limparNoFoco ? '' : request.term;
                            console.log(parametrosBusca.limparNoFoco, parametrosBusca['term']);                             

                            var fd = new FormData();
                            for (var i in parametrosBusca) {
                                fd.append(i, parametrosBusca[i]);
                            }
                            fd.append('term', parametrosBusca.term);

                            APIServ.executaFuncaoClasse(parametrosBusca.classeBusca, parametrosBusca.funcaoBusca, fd, 'post').
                           //     APIServ.executaFuncaoClasse(parametrosBusca.classeBusca, parametrosBusca.funcaoBusca, parametrosBusca).
                                success(data => {         
                                    if (typeof data === 'string') {
                                        APIServ.mensagemSimples('Informação', 'Erro ao Carregar');
                                    } else {
                                        var maximo_tamanho_valor = 0;
                                        var maximo_tamanho_complemento = 0;

                                        $.map(data, function (item) {
                                            maximo_tamanho_valor = item.valor.length > maximo_tamanho_valor ? item.valor.length : maximo_tamanho_valor;
                                            maximo_tamanho_complemento = item.complemento_valor.length > maximo_tamanho_complemento ? item.complemento_valor.length : maximo_tamanho_complemento;
                                        });

                                        $.retornavalor = function (valor, complemento) {
                                            var tamanho = valor.length + complemento.length + 5;
                                            var tamanho_espaco = maior_tamanho - tamanho;
                                            var espaco = " ";
                                            for (i = 0; i <= tamanho_espaco; i++) {
                                                espaco += "";
                                            }
                                            var retorno = valor;
                                            retorno += complemento != '' ? ' -- ' + espaco + complemento : '';
                                            return retorno.trim();
                                        };

                                        var maior_tamanho = maximo_tamanho_valor + maximo_tamanho_complemento + 5;
                                        response($.map(data, function (item) {
                                            valor = $.retornavalor(item.valor, item.complemento_valor);

                                            return {
                                                label: valor,
                                                id: item.chave,
                                                label2: item.valor2,
                                                label3: item.valor3,
                                                label4: item.valor4,
                                                imagem: item.imagem
                                            };
                                        }));
                                    }
                                    //*/
                                }).error(function (a, b, c) {
                                    console.log(c);

                                });
                        },
                        select: function (event, ui) {
                            var elemAC = $(event.target);
                            var indice = $(event.target).attr('indice');
                            var campo = elemAC.attr('campo');


                            var eConsulta = elem.hasClass('valorConsulta');

                            var modeloAC = eConsulta ? elemAC.attr('ng-model') : EGFuncoes.indexPorNumero(event, elemAC.attr('ng-model'));// elemAC.attr('ng-model').replace('$index', indice);
                            var eItemConsulta = modeloAC.substr(0, 4) == 'item';
                            var raizModelo = eItemConsulta ? 'item' : e.raizModelo;

                            $parse(modeloAC).assign(scope, ui.item.label);

                            var modeloValor2;
                            var modeloValor3;
                            var modeloValor4;
                            var modeloChaveAC;

                            if (!eConsulta) {
                                var modeloChaveACtemp = EGFuncoes.indexPorNumero(event, elemAC.attr('modelo-chave'));
                                var tamanhoRaizModelo = raizModelo.length;

                                var temRaizModelo = !eItemConsulta && (modeloChaveACtemp.substr(0, tamanhoRaizModelo) == raizModelo || modeloChaveACtemp.substr(0, 4) == 'item');

                                var substituirCampoPorChave = elem.attr('substituir-modelo-chave') != undefined;

                                //modeloChaveAC = temRaizModelo ? modeloChaveACtemp : e.raizModelo + '.' + modeloChaveACtemp;                                
                                if (substituirCampoPorChave) {
                                    if (modeloAC.includes("'" + campo + "'")) {
                                        modeloChaveAC = modeloAC.replace("'" + campo + "'", "'" + elemAC.attr('modelo-chave') + "'");
                                    } else if (modeloAC.includes(campo)) {
                                        modeloChaveAC = modeloAC.replace(campo, elemAC.attr('modelo-chave'));
                                    }
                                } else {
                                    modeloChaveAC = temRaizModelo ? modeloChaveACtemp : raizModelo + '.' + modeloChaveACtemp;
                                }


                                //modeloChaveAC = e.raizModelo + '.' + EGFuncoes.indexPorNumero(event, elemAC.attr('modelo-chave'));
                                modeloValor2 = elemAC.attr('modelo-valor2');
                                modeloValor3 = elemAC.attr('modelo-valor3');
                                modeloValor4 = elemAC.attr('modelo-valor4');

                                $parse(modeloChaveAC).assign(scope, ui.item.id);


                                if (modeloValor2 != undefined) {
                                    //Neste caso o campo valor2 sera inserido em um segundo elemento
                                    modeloValor2 = modeloValor2.replace('$index', indice);
                                    $parse(modeloValor2).assign(scope, ui.item.label2);
                                }

                                if (modeloValor3 != undefined) {
                                    //Neste caso o campo valor3 sera inserido em um segundo elemento
                                    modeloValor3 = modeloValor3.replace('$index', indice);
                                    $parse(modeloValor3).assign(scope, ui.item.label3);
                                }

                                if (modeloValor4 != undefined) {
                                    //Neste caso o campo valor4 sera inserido em um segundo elemento
                                    modeloValor4 = modeloValor4.replace('$index', indice);
                                    $parse(modeloValor4).assign(scope, ui.item.label4);
                                }

                                $rootScope.$apply();
                            } else if (eConsulta) {
                                scope.filtros[indice]['chave'] = ui.item.id;
                            }

                            if (parametrosBusca.aoSelecionar != '') {
                                eval('scope. ' + parametrosBusca.aoSelecionar);
                                //console.log(parametrosBusca.aoSelecionar);
                            }

                            //Limpando a mensagem de erro, caso seja obrigatorio
                            var elementoPai = $(event.target).closest('div.form-group');
                            elemAC.removeClass('erro')
                            elementoPai.removeClass('erro');
                            elemAC.popover('hide');

                            if (modeloValor2 != undefined) {
                                var elementoValor2 = $('#' + EGFuncoes.modeloParaId(modeloValor2));
                                var elementoPaiValor2 = elementoValor2.closest('div.form-group');
                                elementoValor2.removeClass('erro');
                                elementoPaiValor2.removeClass('erro');
                            }

                            scope.$apply();
                        }
                    })
                        .data("ui-autocomplete")._renderItem = function (ul, item) {
                            //return $("<li>").append("<a>"+item.label+"</a>").appendTo(ul);
                            var htmlImagem = item.imagem != '' ? '<img width="80" class="col-xs-12 col-md-2" src="' + item.imagem + '">' : '';
                            var classesA = item.imagem != '' ? 'col-xs-12 col-md-9' : 'col-xs-12';
                            return $('<li class="row bordadebaixo"> ' + htmlImagem + ' <a class="' + classesA + '">' + item.label + "</a></li>").appendTo(ul)
                        }
                };
            })(jQuery);
        }
    }
}])
