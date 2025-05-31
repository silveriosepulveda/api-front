directivesPadrao.directive('montaHtml', ['$parse', '$compile', 'APIServ', 'EGFuncoes', function ($parse, $compile, APIServ, EGFuncoes) {
    return {
        restrict: 'E',
        replace: false,
        template: '',
        link: function (scope, elem, attr) {
            let campo = elem.attr('campo');

            var e = angular.fromJson(scope.estrutura);

            let tela = attr.tela != undefined ? attr.tela : scope.tela;

            var nomeBloco = elem.attr('nome-bloco');
            //Faco essa comparaca, pois o campo dentro do bloco, pode ter o mesmo nome de outro campa em outro bloco ou fora de blocos
            var dadosBloco = nomeBloco != undefined ? APIServ.buscarValorVariavel(e.campos, nomeBloco) : false;

            let campoLista = scope.estrutura.listaConsulta != undefined ? Object.assign({}, scope.estrutura.listaConsulta) : {};

            let raizModelo = attr.raizModelo != undefined ? attr.raizModelo : tela == 'consulta' && e.tipoEstrutura != 'personalizado' ? 'item' : e.raizModelo;

            if (tela == 'consulta' && scope.estrutura.camposFiltroPersonalizado != undefined) {
                let camposPerso = Object.assign({}, scope.estrutura.camposFiltroPersonalizado);
                var campos = angular.merge(campoLista, scope.estrutura.campos, camposPerso);
            } else {
                //var campos = angular.merge({}, scope.estrutura.campos, campoLista);
                var campos = Object.assign({}, scope.estrutura.campos);
            }


            var p = dadosBloco ? APIServ.buscarValorVariavel(dadosBloco, campo) : APIServ.buscarValorVariavel(campos, campo);
            if (tela == 'consulta') {
                p = Object.assign({}, p, APIServ.buscarValorVariavel(e.listaConsulta, campo));
            }

            p = p == '' ? [] : p;

            if (p == 'linhaDivisoria') {
                let html = '<linha-divisoria></linha-divisoria>';
                elem.html(html);
                $compile(elem.contents())(scope);
                return false;
            }

            if (p == 'quebraLinha') {
                let html = '<quebra-linha></quebra-linha>';
                elem.html(html);
                $compile(elem.contents())(scope);
                return false;
            }

            let campoChaveAC;

            p.tipo = p.tipo != undefined ? p.tipo : 'texto';
            let tipoEtiqueta = p.tipoEtiqueta != undefined ? p.tipoEtiqueta : (e.todasEtiquetasEmbutidas != undefined && (e.todasEtiquetasEmbutidas == true || e.todasEtiquetasEmbutidas == 'true')) ||
                (p.tipoEtiqueta != undefined && p.tipoEtiqueta == 'embutido') ? 'embutido' : 'normal';

            tipoEtiqueta = tela == 'consulta' ? '' : tipoEtiqueta;
            //Definindo o modelo, pois com a criacao de blocos no arquivo pode vir undefined nos blocos sem nome
            //p.modelo = p.modelo != undefined ? p.modelo : e.raizModelo + '.' + campo;
            //Esta linha era como esta acima, mudei para ficar com o final(nome do campo) igual aos blocos
            //p.modelo = p.modelo != undefined ? p.modelo : e.raizModelo + "['" + campo + "']";
            if (tela == 'consulta') {
                p.modelo = raizModelo + "[$index]" + "['" + campo + "']";
            } else {
                let raizModeloBloco = dadosBloco.raizModeloBloco != undefined ? dadosBloco.raizModeloBloco : raizModelo;
                p.modelo = p.modelo != undefined ? p.modelo : raizModeloBloco + "['" + campo + "']";
            }

            var acao = scope.acao != undefined ? scope.acao : APIServ.parametrosUrl()[1];

            let verificarPerfil = p.verificarPerfil != undefined && p.verificarPerfil;

            let temAcao = $rS[acao] != undefined && $rS[acao]['campos'] != undefined && $rS[acao]['campos'][campo] != undefined;

            if (!verificarPerfil || (verificarPerfil && temAcao)) {
                var dadosUsuario = APIServ.buscarValorVariavel(APIServ.buscaDadosLocais('usuario'), campo);
                var temDadosUsuario = dadosUsuario != undefined && dadosUsuario != '' && APIServ.valorExisteEmVariavel(scope.estrutura.camposBuscarNoUsuario, campo);

                let spanObrigatorio = '';
                let info = '';

                if (!temDadosUsuario) {
                    //O elemento pode estar dentro de um bloco, assim o modelo e dinamico
                    if (nomeBloco != undefined) {
                        var dadosBloco = APIServ.buscarValorVariavel(e.campos, nomeBloco);
                        if (dadosBloco.nomeBloco) {
                            p.atributos_input = p.atributos_input != undefined ? p.atributos_input : {};
                            p.atributos_input['modelo-bloco'] = elem.attr('nome-bloco');
                            p.atributos_input['campo'] = campo;
                        }
                    }

                    //Criando a variável com todos os campos do formulario vazios para
                    //juntar com a preenchida ao enviar para os servidor, para não ter que verificar no servidor se a mesma existe

                    var tempS = p.modelo != undefined ? p.modelo.split('.') : [];
                    for (i = 1; i <= tempS.length; i++) {
                        e.raizModelo[tempS[i]] = '';
                    }


                    p.obrigatorio = p.obrigatorio != undefined && (p.obrigatorio === "true" || p.obrigatorio) ? true : false;


                    nomeElemento = EGFuncoes.modeloParaId(p.modelo); // e.raizModelo + '.' + campo;
                    //idElemento = nomeElemento.split('.').join('_') + '_' + campo;
                    idElemento = nomeElemento; // nomeElemento.split('.').join('_');

                    var inputs = ['texto', 'data', 'hora', 'horaCompleta', 'decimal1', 'decimal2', 'decimal3', 'decimal4', 'inteiro', 'telefone', 'email', 'arquivo', 'imagem', 'oculto', 'area-texto', 'cep', 'cpf-cnpj', 'placa', 'caixaSelecao', 'senha'];
                    var selects = ['select-uf', 'select-sexo', 'select-pessoa-tipo', 'select-telefone-operadora', 'select-sim-nao', 'select-operadores', 'select', 'select-posicao'];


                    if (typeof (selectsLocais) != 'undefined') {
                        selects = Object.assign(selects, selectsLocais);
                    }

                    var temInput = inputs.indexOf(p.tipo) >= 0;
                    var temSelect = selects.indexOf(p.tipo) >= 0 || p.tipo.split('-')[0] == 'select';

                    if (temInput || temSelect) {
                        var filho = '';

                        var classes = (temInput && p.tipo != 'oculto') || (p.tipo == 'select') ? ['form-control'] : [];
                        let classesInput = p.classes_input != undefined ? p.classes_input.split(' ') : [];
                        classes = p.classes_input != undefined ? [].concat(classes, classesInput) : classes;

                        let atributos = p.atributosInput != undefined ? p.atributosInput : p.atributos_input != undefined ? p.atributos_input : undefined;
                        atributos = atributos != undefined ? EGFuncoes.montarAtributos(atributos) : [];

                        if (elem.attr('foco') != undefined) {
                            //atributos.push('foco-cadastrar="Sim"');
                        };

                        if (p.minimo != undefined) {
                            atributos.push(`minimo="${p.minimo}")`);
                        }

                        //atributos.push('autocomplete="off"');
                        atributos.push('autocomplete="off"');

                        atributos.push(`campo="${campo}"`);

                        var typeElemento = 'text';

                        if (p.tipo == 'data') {
                            atributos.push('ui-data');
                            atributos.push('placeholder="dd/mm/aaaa"');
                            classes.push('data');
                        } else if (p.tipo == 'hora') {
                            atributos.push('ui-hora');
                            atributos.push('placeholder="hh:mm"');
                        } else if (p.tipo == 'horaCompleta') {
                            atributos.push('ui-hora-completa');
                            atributos.push('placeholder="hh:mm:ss.ms"');
                        } else if (p.tipo == 'telefone') {
                            atributos.push('ui-Telefone');
                        } else if (p.tipo == 'inteiro') {
                            atributos.push('ui-Inteiro');
                            //typeElemento = 'number';
                        } else if (p.tipo == 'decimal1') {
                            atributos.push('ui-Decimal1');
                        } else if (p.tipo == 'decimal2') {
                            //typeElemento = 'number'
                            atributos.push('ui-Decimal2');
                            if (p.modeloDecimal != undefined) {
                                atributos.push(`modelo-decimal="${p.modeloDecimal}"`);
                            }
                        } else if (p.tipo == 'decimal3') {
                            atributos.push('ui-Decimal3');
                        } else if (p.tipo == 'decimal4') {
                            atributos.push('ui-Decimal4');
                        } else if (p.tipo == 'arquivo' || p.tipo == 'imagem') {
                            //Ponho esse atributo por causa da diretiva de upload de arquivos que uso para o angular.
                            atributos.push(`input-file="pegarArquivos($files)"`);
                            atributos.push(`input-file="${p.modelo}"`);
                            atributos.push(`tipo="formulario"`);
                            typeElemento = 'file'
                        } else if (p.tipo == 'oculto') {
                            classes.push('oculto');
                            //typeElemento = 'hidden';
                        } else if (p.tipo == 'cep') {
                            atributos.push('ui-cep');
                        } else if (p.tipo == 'cpf-cnpj') {
                            atributos.push('ui-cpf-cnpj')
                        } else if (p.tipo == 'placa') {
                            atributos.push('ui-placa');
                        } else if (p.tipo == 'caixaSelecao') {
                            typeElemento = 'checkbox';
                            if (p.padrao != undefined) {
                                atributos.push(`ng-init="${p.modelo} = ${p.padrao}"`);
                            }
                        } else if (p.tipo == 'senha') {
                            typeElemento = 'password';
                        } else if (p.tipo == 'select') {
                            var opcoesSelect = [{
                                'key': '',
                                'value': p.titulo != undefined ? p.titulo : 'Selecione'
                            }];
                            angular.forEach(p.opcoesSelect, function (value, key) {
                                opcoesSelect.push({
                                    'key': key,
                                    'value': value
                                });
                            });
                            var idOpcoes = 'opcoes' + idElemento;
                            scope[idOpcoes] = opcoesSelect;
                            atributos.push(`ng-options="sp.key as sp.value for sp in ${idOpcoes}"`);
                        } else if ((p.campoMaiusculo == undefined || p.campoMaiusculo == true) && (e.todosCamposMaiusculo != undefined && e.todosCamposMaiusculo) || (p.campoMaiusculo != undefined && p.campoMaiusculo)) {
                            atributos.push('ui-maiusculo');
                        }

                        if (p.limiteCaracteres != undefined) {
                            atributos.push(`limite-caracteres="${p.limiteCaracteres}"`);
                        }

                        //Vendo se nos atributos do elemento tem o atributo obrigatorio
                        if (p.obrigatorio) atributos.push('required');
                        spanObrigatorio = p.obrigatorio ? `<span class="vermelho asterisco font14">*</span>` : '';

                        //Vendo se e para tirar acentos
                        if (p.semAcento) atributos.push('sem-acento');

                        //vendo se tem atributo nome_lista
                        if (p.lista != undefined) {
                            atributos.push('lista-auto-completa');
                        }

                        //VENDO SE HA AUTOCOMPLETA
                        var htmlChave = '';
                        if (p.autoCompleta != undefined) {
                            var campoChave = p.autoCompleta.objChave != undefined ? p.autoCompleta.objChave : p.autoCompleta.campoChave;
                            campoChaveAC = p.modelo.split('.');
                            campoChaveAC.splice(campoChaveAC.length - 1, 1);
                            campoChaveAC.push(campoChave);

                            //Sera utilizada caso haja complementoValor do autoCompleta
                            var complementoValor = p.autoCompleta != undefined && p.autoCompleta.complementoValor != undefined ? p.autoCompleta.complementoValor : '';
                            if (complementoValor != '') {
                                var campoComplementoValor = p.modelo.split('.')
                                campoComplementoValor.splice(campoComplementoValor.length - 1, 1);
                                campoComplementoValor.push(complementoValor);
                                campoComplementoValor = campoComplementoValor.join('.');
                            }
                            //console.log(campoComplementoValor);

                            //Vendo se esta em um bloco e se estiver se e modelo dinamico
                            atributosChave = [];
                            if (p.modeloBloco != undefined && p.modeloBloco != '') {
                                var attrChave = {}
                                attrChave['modelo-bloco'] = p.modeloBloco;
                                attrChave['campo'] = p.autoCompleta.campoChave;

                                var atributosChave = EGFuncoes.montarAtributos(attrChave);
                            }

                            atributos.push(`auto-completa="${campo}"`);

                            var htmlChave = `<input type="text" class="chave_auto_completa oculto" ng-model="${campoChaveAC.join('.')}" id="${campoChaveAC.join('_')}" ${atributosChave.join(' ')}>`;
                            //console.log(campoChaveAC);
                        }

                        //Ver se posso apagar este bloco
                        if (p.lista != undefined) {
                            campoChaveAC = p.modelo.split('.');
                            campoChaveAC.splice(campoChaveAC.length - 1, 1);
                            campoChaveAC.push(p.lista.campoChave);

                            //Vendo se esta em um bloco e se estiver se e modelo dinamico
                            atributosChave = [];
                            if (p.modeloBloco != undefined && p.modeloBloco != '') {
                                var attrChave = {}
                                attrChave['modelo-bloco'] = p.modeloBloco;
                                attrChave['campo'] = p.lista.campoChave;

                                var atributosChave = EGFuncoes.montarAtributos(attrChave);
                            }
                            atributos.push(`campo="${campo}"`);
                            var htmlChave = `<input type="text" class="chave_lista oculto" ng-model="${campoChaveAC.join('.')}" id="${campoChaveAC.join('_')}" ${atributosChave.join(' ')}>`;
                        }
                        //Fim do ver se posso apagar
                        //FIM VERIFICACAO AUTOCOMPLETA

                        var label = p.texto != undefined && p.tipo != 'oculto' && tipoEtiqueta == 'normal' ?
                            `<label for="${campo}">${p.texto} ${spanObrigatorio}</label>` : '';

                        //Tentando criar a desabilitacao do elemento
                        if (p.habilitadoEdicao != undefined && p.habilitadoEdicao == false && !dadosBloco) {
                            atributos.push(`ng-disabled="${e.raizModelo}.${e.campo_chave} > 0"`);

                        } else if (p.habilitadoEdicao != undefined && p.habilitadoEdicao == false) {
                            //Neste caso esta em um bloco e a comparacao sera feita
                            atributos.push(`ng-disabled="${e.raizModelo}.${e.campo_chave} > 0"`);
                        }

                        let tituloInput = p.titulo != undefined ? `title="${p.titulo}"` : '';
                        let placeHolder = p.titulo != undefined ? p.titulo : '';

                        let tamanhoInput = p.tamanhoInput != undefined ? 'input-' + p.tamanhoInput :
                            e.tamanhoInputs != undefined ? 'input-' + e.tamanhoInputs : 'input-lg';
                        tamanhoInput = tela == 'consulta' ? 'input-xs' : tamanhoInput;


                        if (temInput) {
                            if (p.tipo == 'area-texto') {
                                let linhas = p.linhas != undefined ? p.linhas : 3;
                                var input = `<textarea name="${nomeElemento}" ng-model="${p.modelo}" id="${idElemento}" ${atributos.join(' ')} rows="${linhas}" ${tituloInput} class="${classes.join(' ')}"></textarea>`
                            } else {
                                if (p.tipo == 'imagem' && p.tipoImagem != undefined && p.tipoImagem == 'exibicao') {
                                    var input = `<img ng-src="" placeholder="${placeHolder}" indice="{{$index}}" indice-superior="{{$parent.$index}}" name="${nomeElemento}" ng-model="${p.modelo}"
                                id="${idElemento}" ${atributos.join(' ')} ${tituloInput} class="img-responsive">`;
                                } else {

                                    let modeloChaveAC = campoChaveAC != undefined ? `modelo-chave="${campoChaveAC.join('.')}"` : '';


                                    var input = `<input type="${typeElemento}" placeholder="${placeHolder}" indice="{{$index}}" indice-superior="{{$parent.$index}}" name="${nomeElemento}" ng-model="${p.modelo}" ${modeloChaveAC}
                                id="${idElemento}" ${atributos.join(' ')} ${tituloInput} class="${classes.join(' ')} ${tamanhoInput}">`;
                                }
                            }
                        } else if (temSelect) {
                            if (p.tipo != 'select') {
                                var input = `<${p.tipo} name="${nomeElemento}" ng-model="${p.modelo}" id="${idElemento}" ${atributos.join(' ')} class="${tamanhoInput}"></${p.tipo}>`;
                            } else {
                                var input = `<select name="${nomeElemento}" ng-model="${p.modelo}" id="${idElemento}" ${atributos.join(' ')} class="${classes.join(' ')} ${tamanhoInput}"></select>`;
                            }
                        }
                    }

                    let atributosDiv = [];
                    if (p.atributos_div != undefined)
                        atributosDiv = EGFuncoes.montarAtributos(p.atributos_div)
                    else if (p.atributosDiv != undefined)
                        atributosDiv = EGFuncoes.montarAtributos(p.atributosDiv);

                    let classesDiv = p.classes_div != undefined ? p.classes_div.split(' ') : [];

                    //Acrecentando as classes de tamanho do elemento div
                    if (tela == 'cadastro') {
                        if (p.xs >= 1) {
                            classesDiv.push('col-xs-' + p.xs)
                        } else {
                            classesDiv.push('col-xs-12');
                        };
                        if (p.sm >= 1) classesDiv.push('col-sm-' + p.sm);
                        if (p.md >= 1) classesDiv.push('col-md-' + p.md);
                        if (p.lg >= 1) classesDiv.push('col-lg-' + p.lg);
                    } else if (tela == 'consulta') {
                        classesDiv.push('col-xs-12');
                    }


                    if (p.porcent != undefined && p.porc > 0) classesDiv.push('larg' + p.porc + 'p');

                    let textoNovo = '';
                    let htmlAbreInputGroup = '';
                    let htmlFechaInputGroup = '';
                    let htmlNovo = '';
                    let htmlEtiqueta = '';

                    if (p.novo != undefined && p.novo != '') {
                        let parametrosClick = APIServ.criptografa(JSON.stringify(p.novo));
                        textoNovo = p.novo['texto'] != undefined ? p.novo['texto'] : 'Novo(a)';
                        htmlAbreInputGroup = '<div class="input-group">';

                        let clickNovo = p.novo['click'] == undefined ? `abrirPopUp('${parametrosClick}')` : p.novo['click'];

                        let atributosNovo = p.novo.atributos_novo != undefined ? EGFuncoes.montarAtributos(p.novo.atributos_novo).join(' ') : '';

                        htmlNovo = `<span class="input-group-btn btn btn-primary" tabindex="false" parametros="' ${parametrosClick}'" ${atributosNovo} ng-click="${clickNovo}" indice="{{$index}}" indice-superior="{{$parent.$index}}"> ${textoNovo}</span>`;

                        htmlFechaInputGroup = '</div>';
                    }

                    if (p.informacoes != undefined && tipoEtiqueta != 'embutido') {
                        info = `<span class="glyphicon glyphicon-info-sign" tabIndex="-1" ng-click="mostrarInformacoes('${campo}')"></span>`;
                        //<div class="col-xs-12 div6 informacoes" ng-if="${e.raizModelo}.mostrarInformacoes_${campo}">${p.informacoes}</div>`;
                    }

                    //Vendo o tipo de Etiqueta (Label)
                    if (tipoEtiqueta == 'embutido') {
                        htmlAbreInputGroup = '<div class="input-group">';
                        let infoEmb = p.informacoes != undefined ? `<span class="glyphicon glyphicon-info-sign"  tabIndex="-1" ng-click="mostrarInformacoes('${campo}')"></span>` : '';
                        htmlEtiqueta = `<span class="input-group-addon ">${p.texto} ${spanObrigatorio} ${infoEmb} </span>`;

                        let htmlPosInputGroup = p.informacoes != undefined ? `<div class="col-xs-12 div6 informacoes" ng-if="${e.raizModelo}.mostrarInformacoes_${campo}">${p.informacoes}</div>` : '';

                        if (tela == 'consulta' && (p.autoCompleta != undefined && p.autoCompleta.opcaoLimpar)) {
                            htmlFechaInputGroup = `<span class="input-group-btn btn btn-default glyphicon glyphicon-erase" title="Limpar o Campo"  
                                ng-click="limparCampoConsulta(${p.modelo})" tabindex="false"></span></div>`;
                        } else {
                            if (p.autoCompleta != undefined && p.autoCompleta.opcaoLimpar) {
                                htmlFechaInputGroup = `<span class="input-group-btn btn btn-default glyphicon glyphicon-erase" title="Limpar o Campo"  
                                ng-click="limparCampo(${p.modelo})" tabindex="false"></span></div>`;
                            } else {
                                htmlFechaInputGroup = '</div>';
                            }
                        }
                    } else if (p.autoCompleta != undefined && p.autoCompleta.opcaoLimpar) {
                        htmlAbreInputGroup = '<div class="input-group">';
                        if (p.autoCompleta.funcaoLimpar != undefined) {
                            htmlFechaInputGroup = `<span class="input-group-btn btn btn-default glyphicon glyphicon-erase" title="Limpar o Campo"  
                            ng-click="${p.autoCompleta.funcaoLimpar}"></span></div>`;
                        } else {
                            htmlFechaInputGroup = `<span class="input-group-btn btn btn-default glyphicon glyphicon-erase" title="Limpar o Campo"  ng-click="limparCampoConsulta($event)"></span></div>`;
                        }
                    }

                    if (label != '') {
                        classesDiv.push('divItemCadastro');
                    }



                    //Fazendo teste de por a chave apenas no scopo
                    htmlChave = '';
                    // console.log(p.atributos_input);
                    // console.log(atributos);
                    //$(elem).attr('class', classesDiv.join(' '));
                    var html = p.tipo != 'oculto' ? `
                <div class="form-group ${classesDiv.join(' ')}"  id="div_${campo}"  ${atributosDiv.join(' ')}>
                    ${label}
                    ${info}
                    ${htmlAbreInputGroup}
                    ${htmlChave}
                    ${htmlEtiqueta}
                    ${input}
                    ${htmlNovo}
                    ${htmlFechaInputGroup}
                    ` : `${input}`;


                    elem.html(html);
                    $compile(elem.contents())(scope);

                    //  var e = $compile(html)(scope);
                    //  elem.replaceWith(e);
                    //  $compile(e)(scope);
                } else if (temDadosUsuario) {
                    $parse(p.modelo).assign(scope, dadosUsuario);
                }
            }
        }
    }
}])