directivesPadrao.directive('arquivosAnexos', ['$compile', '$http', '$parse', '$rootScope', 'APIServ', 'config',
     function ($compile, $http, $parse, $rootScope, APIServ, config) {
    return {
        restrict: "E",
        replace: true,
        template: `<div class="col-xs-12 div6"></div>`,
        link: function (scope, element, attr) {
            var tela = attr != undefined && attr.tela != undefined ? attr.tela : 'consulta';
            var chaveArray = attr != undefined && attr.chaveArray != undefined ? attr.chaveArray : null;
            var raizModelo = scope.estrutura.raizModelo;

            //Vendo se esta usando estruturaGerencia ou se esta usando a diretiva diretamente na tela
            var anexos = attr.parametros != undefined ? APIServ.buscarValorVariavel(scope.estrutura, attr.parametros) : scope.estrutura.anexos;
            var tiposAnexos = anexos.tipoAnexos != undefined ? anexos.tipoAnexos.split('-') : 'padrao';

            var temUploadPadrao = tiposAnexos.indexOf('padrao') >= 0;
            var temUplodaCopiarColar = tiposAnexos.indexOf('copiarColar') >= 0;
            var temClassificacaoAnexosCopiarColar = scope.estrutura.anexos.opcoesClassificacaoAnexo != undefined;

            scope.$parent[raizModelo]['arquivosAnexosCopiarcolar'] = [];
            scope.$parent[raizModelo]['arquivosAnexosEnviarCopiarcolar'] = [];
            scope.$parent[raizModelo]['infoArquivosCopiarColar'] = {};

            var titulo = anexos.titulo != undefined ? anexos.titulo : '';
            scope.usarNome = anexos.usarNome != undefined ? anexos.usarNome :
                anexos.usar_nome != undefined ? anexos.usar_nome : false;

            scope.usarPosicao = anexos.usarPosicao != undefined ? anexos.usarPosicao : false;

            var aoIniciar = '';
            var itemRepetir = false;
            var idForm = 'formAnexarArquivos';

            if (tela == 'consulta') {
                var chave = scope.item[scope.estrutura.campo_chave];
                idForm = 'formAnexarArquivos_' + chave;
                var aoIniciar = `ng-init="buscarAnexos(item)"`;
                itemRepetir = `item.arquivosAnexados`;
            } else if (tela == 'cadastro') {
                itemRepetir = `${scope.estrutura.raizModelo}.arquivosAnexados`;
                var chave = 0;
            } else if (tela == 'detalhes') {
                itemRepetir = `listaConsulta[${chaveArray}]['arquivosAnexados']`;
            } else if (tela == 'anexosBloco') {
                itemRepetir = attr.itemRepetir + '.arquivosAnexados';
                idForm = `formularioAnexoBloco_` + Math.floor(Math.random() * 100);
            }

            var excluir = tela != 'detalhes' ? `<a href="" class="col-xs-12 col-md-4 vermelho text-center" ng-click="excluirAnexo(${itemRepetir}, anexo, key)" 
                ng-if="anexo.tipoAnexo != 'Relacionado'">Excluir</a>` : '';

            var idArquivos = 'arquivos_' + chave;

            scope.trocarPosicao = (anexo) => {
                var elemento = $(event.target);
                var posicaoAtual = parseInt(elemento.attr('indice')) + 1;
                var posicaoNova = anexo.posicao;

                var indiceAtual = elemento.attr('indice');
                var indiceNovo = parseInt(posicaoNova) - 1;

                var variavelRepeticao = eval('scope.' + itemRepetir);

                var valorAtual = variavelRepeticao[indiceAtual];
                valorAtual['posicao'] = parseInt(posicaoNova);
                var valorNovo = variavelRepeticao[indiceNovo];
                valorNovo['posicao'] = parseInt(posicaoAtual);

                var parametrosAlteracao = {
                    chave1: valorAtual.chave_anexo,
                    posicao1: posicaoNova,
                    chave2: valorNovo.chave_anexo,
                    posicao2: valorNovo.posicao
                }

                APIServ.executaFuncaoClasse('classeGeral', 'alterarPosicaoAnexo', parametrosAlteracao).success(retorno => {
                    console.log(retorno);

                    variavelRepeticao[indiceAtual] = valorNovo;

                    variavelRepeticao[indiceNovo] = valorAtual;
                })
            }

            var htmlConsultaPadrao = `
                <form name="${idForm}" id="${idForm}" ng-submit="${idForm}.$valid && anexarArquivos(item)" novalidade valida-Formulario enctype="multipart/form-data">
                    <div class="row">
                        <input type="file"  name="arquivos" input-file="pegarArquivos($files)" tipo="anexos" multiple class="input-lg col-md-6">
                        <input type="submit" value="Enviar" form="${idForm}" class="btn btn-modern btn-primary col-xs-12 col-md-3 col-md-offset-1" />
                        <input type="button" value="Fechar Anexos" class="btn btn-modern btn-outline-secondary col-xs-12 col-md-2" ng-click="item.exibirAnexos = false" />
                    </div>
                </form>`;

            var htmlBloco = `
                <form name="${idForm}" id="${idForm}" ng-submit="${idForm}.$valid && anexarArquivos(${attr.itemRepetir})" novalidade valida-Formulario enctype="multipart/form-data">
                    <div class="row">
                        <input type="file"  name="arquivos" input-file="pegarArquivos($files)" required tipo="anexos" multiple class="input-lg col-md-6">
                        <input type="submit" value="Enviar" form="${idForm}" class="btn btn-modern btn-primary col-xs-12 col-md-3 col-md-offset-1" />
                        <input type="button" value="Fechar Anexos" class="btn btn-modern btn-outline-secondary col-xs-12 col-md-2" ng-click="${attr.itemRepetir}.exibirAnexos = false" />
                    </div>
                </form>`;


            var htmlCadastroPadrao = `
                <div class="row form-group">
                    <h4 class="text-center">${titulo}</h4>
                    <input type="file"  name="arquivos" ng-model="arquivos" input-file="pegarArquivos($files)" tipo="anexos" multiple class="input-lg form-control">
                </div>`;
            //htmlCadastro = '';

            var htmlListaQuadros = temUplodaCopiarColar && tela != 'detalhes' ? `
                <div class="row div2 divListaQuadros" >
                    <div class="col-md-3 quadroColarImagem tc" style="overflow: auto"
                        ng-click="aoClicarQuadro($event)" ng-repeat="(key, quadro) in ${raizModelo}['arquivosAnexosCopiarcolar']"
                        ng-model="${raizModelo}['arquivosAnexosCopiarColar'][key]" indice="{{$index}}">Copie e Cole Aqui!
                        <!-- select class="col-xs-12" ng-model="${raizModelo}['infoArquivosCopiarColar'][key]['classificacaoAnexo']">
                            <option value="fichas">Fichas</option>
                            <option value="financeiro">Financeiro</option>
                        </select -->
                    </div>                    
                </div>` : '';

            var htmlListaQuadrosDentro = (scope.estrutura.detalhesExibirAnexos != undefined && !scope.estrutura.detalhesExibirAnexos) || tela == 'detalhes' ?
                htmlListaQuadros : '';

            var htmlListaQuadrosFora = (scope.estrutura.detalhesExibirAnexos == undefined || scope.estrutura.detalhesExibirAnexos) || tela != 'detalhes' ?
                htmlListaQuadros : '';

            var htmlBotoesAuxiliaresCopiarColar = temUplodaCopiarColar && !temUploadPadrao ? `
                <button type="submit" form="${idForm}" class="btn btn-modern btn-primary col-xs-12 col-md-2">Enviar</button>
                <button type="button" class="btn btn-modern btn-outline-secondary col-xs-12 col-md-2" ng-click="item.exibirAnexos = false">Fechar Anexos</button>` : '';

            var htmlConsultaCopiarColar = `
                <form name="${idForm}" id="${idForm}" ng-submit="${idForm}.$valid && anexarArquivos(item)" novalidade valida-Formulario enctype="multipart/form-data">
                    <div class="col-xs-12 div5 bordaArredondada">
                        <div class="row div4">
                            <h3 class="col-xs-12 col-md-6">Copiar e Colar Imagens para Anexar</h3>
                            <button class="btn btn-modern btn-primary glyphicon glyphicon-plus col-md-2" type="button" ng-click="adicionarQuadro()">Quadros</button>
                            ${htmlBotoesAuxiliaresCopiarColar}                
                        </div>
                        ${htmlListaQuadrosDentro}
                    </div>                 
                </form>`;

            var htmlCadastroCopiarColar = `
            <div class="col-xs-12 div5 bordaArredondada 123">
                <div class="row div4">
                    <h3 class="col-xs-8">Copiar e Colar Imagens para Anexar</h3>
                    <button class="btn btn-modern btn-primary glyphicon glyphicon-plus" type="button" ng-click="adicionarQuadro()"> Quadros</button>
                </div>                        
                ${htmlListaQuadrosDentro}
            </div>
            `;

            var htmlCliente = `
                <form name="${idForm}" id="${idForm}" ng-submit="${idForm}.$valid && anexarArquivos(cliente)" novalidade valida-Formulario enctype="multipart/form-data">
                    <div class="row">
                        <h4 class="text-center">${titulo}</h4>
                        <input type="file"  name="arquivos" input-file="pegarArquivos($files)" tipo="anexos" required multiple class="input-lg col-md-6">
                        <input type="submit" value="Enviar" form="${idForm}" class="btn btn-modern btn-primary col-xs-12 col-md-3 col-md-offset-1" />
                    </div>
                </form>`;


            var html = '';

            if (tela == 'cadastro') {
                if (temUploadPadrao && temUplodaCopiarColar) {
                    html = htmlCadastroPadrao + htmlCadastroCopiarColar;
                } else if (temUploadPadrao && !temUplodaCopiarColar) {
                    html = htmlCadastroPadrao;
                } else if (!temUploadPadrao && temUplodaCopiarColar) {
                    html = htmlCadastroCopiarColar;
                }
            } else if (tela == 'consulta') {
                if (temUploadPadrao && temUplodaCopiarColar) {
                    html = htmlConsultaPadrao + htmlConsultaCopiarColar;
                } else if (temUploadPadrao && !temUplodaCopiarColar) {
                    html = htmlConsultaPadrao;
                } else if (!temUploadPadrao && temUplodaCopiarColar) {
                    html = htmlConsultaCopiarColar;
                }
            }

            //var html = tela == 'consulta' ? htmlConsulta : tela == 'cadastro' ? htmlCadastro : tela == 'anexosBloco' ? htmlBloco : tela == 'cliente' ? htmlCliente : '';

            var idDivLista = "divListaAnexos_{{$index}}";

            if ((scope.estrutura.detalhesExibirAnexos == undefined || scope.estrutura.detalhesExibirAnexos) || tela != 'detalhes') {
                html += `
                <div class="col-xs-12 listaArquivosAnexos" ${aoIniciar} indice="{{$index}}" id="${idDivLista}">
                    ${htmlListaQuadrosFora}
                    <div ng-repeat="(key, anexo) in ${itemRepetir}" item-repetir="${itemRepetir}" class="divListaAnexos">
                        <div class="col-xs-12 col-md-4 arquivoAnexo">                        
                            <objeto-visualizacao arquivo="{{anexo.grande}}" ng-if="anexo.tipo == 'arquivo'"></objeto-visualizacao>
                            <img ng-src="${config.urlSite}{{anexo.mini}}" ng-if="anexo.tipo == 'imagem'" class="img-responsive imagemZoom" imagem-dinamica>
                            <!--label ng-if="anexo.tipo != 'imagem'" class="text-center">{{anexo.titulo}}</label-->
                            `;


                scope.montaArrayPosicoes = (qtd) => {
                    var retorno = {};
                    for (var i = 0; i < qtd; i++) {
                        retorno[i + 1] = i + 1;
                    }
                    return retorno;

                }
                if (scope.usarNome && tela != 'detalhes') {
                    var idSelectPos = "anexo_{{$index}}";

                    html += `
                            <div class="form-group form-group-modern" ng-class="{'col-xs-9' : usarPosicao, 'col-xs-11': !usarPosicao}">
                                <input type="text" class="form-control nomeAnexo" ng-model="anexo.nome" placeholder="Nome do Arquivo" ng-blur="salvarNomeAnexo(anexo)">
                            </div>                            
                            <div class="form-group form-group-modern col-xs-2" ng-if="usarPosicao">                            
                                <select class="form-control posicaoAnexo" id="${idSelectPos}" indice="{{$index}}" ng-model="anexo.posicao" ng-change="trocarPosicao(anexo)"
                                ng-options="i as i for i in montaArrayPosicoes(${itemRepetir}.length)">                                    
                                </select>
                            </div>
                                <button class="btn btn-modern btn-outline-secondary glyphicon glyphicon-repeat col-xs-1" ng-click="rotacionarImagem(anexo, key)" ng-if="anexo.tipo == 'imagem'"></button>
                    `;
                }
                html += `
                            <div class="row">
                                <a href="{{anexo.grande}}" target="new" class="col-xs-12 col-md-4 text-center preto">Visualizar</a>
                                <a href="download_arquivo.php?arquivo={{anexo.grande}}" class="col-xs-12 col-md-4 preto text-center">Baixar</a>
                                ${excluir}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            }

            html += tela == 'cadastro' ? '<div class="col-xs-12 alt20"></div>' : '';

            scope.salvarNomeAnexo = function (anexo) {
                var parametros = new FormData();
                parametros.append('chave_anexo', anexo.chave_anexo);
                parametros.append('nome', anexo.nome);

                APIServ.executaFuncaoClasse('classeGeral', 'alterarAnexo', parametros, 'post').success(function (retorno) {
                    console.log(retorno);
                }).error(function (a, b, c) {
                    console.log(a);
                    console.log(b);
                    console.log(c);
                })
            }

            scope.anexarArquivos = function (item) {
                var form = $(event.target).attr('id');
                var fd = new FormData();
                fd.append('tabela', scope.estrutura.tabela);
                fd.append('campo_chave', scope.estrutura.campo_chave);
                fd.append('chave', item[scope.estrutura.campo_chave]);
                fd.append('largura', scope.estrutura.anexos.largura);
                fd.append('altura', scope.estrutura.anexos.altura);
                fd.append('larguraThumb', scope.estrutura.anexos.larguraThumb);
                fd.append('alturaThumb', scope.estrutura.anexos.alturaThumb);

                var enviar = false;

                angular.forEach($rootScope.$files, function (value, key) {
                    //var fd = scope.fd != undefined ? scope.fd : new FormData();                   
                    enviar = true;
                    fd.append(key, value);
                });

                if (item.arquivosAnexosEnviarCopiarcolar != undefined && Object.keys(item.arquivosAnexosEnviarCopiarcolar).length > 0) {
                    enviar = true;
                    fd.append('arquivosAnexosEnviarCopiarColar', JSON.stringify(item.arquivosAnexosEnviarCopiarcolar));
                }

                if (enviar) {
                    $rootScope.carregando = true;
                    return $http.post(config.baseUrl + 'anexarArquivos', fd, {
                        transformRequest: angular.identity,
                        headers: {
                            'Content-Type': undefined
                        }
                    })
                        .success(function (retorno) {
               //             console.log(retorno);/*
                            //scope.df = new FormData();
                            $rS.carregando = false;
                            if (tela == 'cliente') {
                                var funcao = function () {
                                    // CORREÇÃO: Verificar se estamos em contexto modal antes de recarregar
                                    if (scope.$parent.isModal || (scope.$parent.localExibicao && scope.$parent.localExibicao === 'modal')) {
                                        console.log('🎭 [arquivosAnexos] Contexto modal detectado - evitando window.location.reload()');
                                        
                                        // Fechar o modal se estiver em contexto modal
                                        if (window.bootstrap && window.bootstrap.Modal) {
                                            // Bootstrap 5
                                            var modals = document.querySelectorAll('.modal.show');
                                            modals.forEach(function(modal) {
                                                var modalInstance = window.bootstrap.Modal.getInstance(modal);
                                                if (modalInstance) modalInstance.hide();
                                            });
                                        } else if (window.$ && window.$.fn.modal) {
                                            // Bootstrap 4/jQuery
                                            $('.modal.show, .popup-modal.show, .popup-modal.in').modal('hide');
                                        }
                                    } else {
                                        // Comportamento normal fora do modal
                                        window.location.reload();
                                    }
                                }
                                APIServ.mensagemSimples('Confirmação', 'Documento Enviado com Sucesso', funcao)
                            } else {
                                scope.buscarAnexos(item);
                            }
                            document.getElementById(form).reset();
                            scope.$parent[raizModelo]['arquivosAnexosCopiarcolar'] = [];
                            item.arquivosAnexosEnviarCopiarcolar = [];
                            scope.adicionarQuadro();
                            //*/
                        })
                        .error(function (a, b, c) {
                            console.log(a);
                            console.log(b);
                            console.log(c);
                        });
                }
                //*/
            }

            scope.buscarAnexos = function (item) {
                try {
                    $rootScope.pausarTimer();
                } catch (err) {
                    // console.log(err);
                }
                var parametros = {
                    tabela: scope.estrutura.tabela,
                    chave: item[scope.estrutura.campo_chave]
                }
                APIServ.executaFuncaoClasse('classeGeral', 'buscarAnexos', parametros).success(function (data) {
                    item.arquivosAnexados = data;
                })
            }

            if (scope.excluirAnexo == undefined) {
                scope.excluirAnexo = function (item, anexo, key) {
                    var excluir = function () {
                        APIServ.executaFuncaoClasse('classeGeral', 'excluirAnexo', anexo).success(function (data) {
                            console.log(data);
                            if (data.sucesso =! undefined) {
                                item.splice(key, 1);
                            }
                        })
                    }
                    APIServ.dialogoSimples('Confirmação', 'Excluir Anexo?', 'Sim', 'Não', excluir);
                }
            }

            if ($rootScope.pegarArquivos == undefined) {
                scope.pegarArquivos = function ($files, campo) {
                    $rootScope.$files = $files;
                };
            }

            scope.rotacionarImagem = (anexo, key) => {
                var elementoImagem = $(event.target).closest('div.arquivoAnexo').find('img');
                var copia = elementoImagem;
                var caminho = $(elementoImagem).attr('ng-src');

                APIServ.executaFuncaoClasse('classeGeral', 'rotacionarImagem', anexo.chave_anexo).success(retorno => {
                    //scope.buscarAnexos(item);
                    elementoImagem.attr('src', '');
                    elementoImagem.attr('src', caminho + '?m=' + new Date().getTime());
                })

            }

            scope.aoClicarQuadro = (event) => {
                var $this = $(event.target);

                var bi = $this.css("background-image");
                if (bi != "none") {
                    $data.text(bi.substr(4, bi.length - 6));
                }

                $(".quadroCopiarColarAtivo").removeClass("quadroCopiarColarAtivo");
                $this.addClass("quadroCopiarColarAtivo");

                $this.toggleClass("conteudoQuadroCopiarColar");

                $width.val($this.data("width"));

                $height.val($this.data("height"));
                if ($this.hasClass("conteudoQuadroCopiarColar")) {
                    $this.css({
                        width: $this.data("width"),
                        height: $this.data("height"),
                        "z-index": "10"
                    });
                } else {
                    $this.css({ width: "", height: "", "z-index": "" });
                }
                //*/
            }

            scope.adicionarQuadro = () => {
                var htmlQuadro = `<div class="col-md-4 quadroColarImagem" ng-model="${raizModelo}['arquivosAnexosCopiarcolar'][0]" style="overflow: auto"></div>`;
                //console.log(scope.$parent[raizModelo]);
                var indice = scope.$parent[raizModelo]['arquivosAnexosCopiarcolar'] != undefined ?
                    Object.keys(scope.$parent[raizModelo]['arquivosAnexosCopiarcolar']).length : 0;

                scope.$parent[raizModelo]['arquivosAnexosCopiarcolar'][indice] = [];
                scope.$parent[raizModelo]['infoArquivosCopiarColar'][indice] = {};

                if (temClassificacaoAnexosCopiarColar) {
                    scope.$parent[raizModelo]['infoArquivosCopiarColar'][indice]['classificacaoAnexo'] = scope.estrutura.anexos.padraoClassificacaoAnexo != undefined ?
                        scope.estrutura.anexos.padraoClassificacaoAnexo : '';
                }
            }
            scope.adicionarQuadro();

            element.html(html);
            $compile(element.contents())(scope);



            (function ($) {
                var defaults;
                jQuery.event.fix = (function (originalFix) {
                    return function (event) {
                        event = originalFix.apply(this, arguments);
                        if (event.type.indexOf("copy") === 0 || event.type.indexOf("paste") === 0) {
                            //console.log(event.originalEvent.clipboardData);
                            event.clipboardData = event.originalEvent.clipboardData;
                        }
                        return event;
                    };
                })($.event.fix);
                defaults = {
                    callback: $.noop,
                    matchType: /image.*/
                };
                return ($.fn.pasteImageReader = function (options) {
                    if (typeof options === "function") {
                        options = {
                            callback: options
                        };
                    }
                    options = $.extend({}, defaults, options);
                    return this.each(function () {
                        var $this, element;
                        element = this;
                        $this = $(this);
                        return $this.bind("paste", function (event) {
                            var clipboardData, found;
                            found = false;
                            clipboardData = event.clipboardData;
                            return Array.prototype.forEach.call(clipboardData.types, function (type, i) {
                                var file, reader;
                                if (found) {
                                    return;
                                }
                                if (
                                    type.match(options.matchType) ||
                                    clipboardData.items[i].type.match(options.matchType)
                                ) {
                                    file = clipboardData.items[i].getAsFile();
                                    reader = new FileReader();
                                    reader.onload = function (evt) {

                                        if (scope.tela == 'cadastro') {
                                            var indice = $(event.target).attr('indice');
                                            scope.$parent[raizModelo]['arquivosAnexosEnviarCopiarcolar'][indice] = evt.target.result;
                                            scope.$apply();
                                        } else if (tela == 'consulta') {
                                            scope.item.arquivosAnexosEnviarCopiarcolar = scope.item.arquivosAnexosEnviarCopiarcolar != undefined ? scope.item.arquivosAnexosEnviarCopiarcolar : [];
                                            scope.item.arquivosAnexosEnviarCopiarcolar.push({
                                                tipo: 'base64',
                                                arquivo: evt.target.result
                                            });
                                            scope.$apply();
                                        }

                                        return options.callback.call(element, {
                                            dataURL: evt.target.result,
                                            event: evt,
                                            file: file,
                                            name: file.name
                                        });
                                    };
                                    reader.readAsDataURL(file);
                                    //snapshoot();
                                    return (found = true);
                                }
                            });
                        });
                    });
                });
            })(jQuery);

            var dataURL, filename;
            $("html").pasteImageReader(function (results) {
                filename = results.filename, dataURL = results.dataURL;
                $data.text(dataURL);
                $size.val(results.file.size);
                $type.val(results.file.type);
                var img = document.createElement("img");
                img.src = dataURL;
                var w = img.width;
                var h = img.height;
                $width.val(w);
                $height.val(h);

                return $(".quadroCopiarColarAtivo")
                    .css({
                        backgroundImage: "url(" + dataURL + ")"
                    })
                    .data({ width: w, height: h });
            });

            var $data, $size, $type, $width, $height;
            $(function () {
                $data = $(".data");
                $size = $(".size");
                $type = $(".type");
                $width = $("#width");
                $height = $("#height");
                jQuery(".quadroColarImagem").bind("click", function () {
                    var $this = $(this);
                    var bi = $this.css("background-image");
                    if (bi != "none") {
                        $data.text(bi.substr(4, bi.length - 6));
                    }

                    $(".quadroCopiarColarAtivo").removeClass("quadroCopiarColarAtivo");
                    $this.addClass("quadroCopiarColarAtivo");

                    $this.toggleClass("conteudoQuadroCopiarColar");

                    $width.val($this.data("width"));

                    $height.val($this.data("height"));
                    if ($this.hasClass("conteudoQuadroCopiarColar")) {
                        $this.css({
                            width: $this.data("width"),
                            height: $this.data("height"),
                            "z-index": "10"
                        });
                    } else {
                        $this.css({ width: "", height: "", "z-index": "" });
                    }
                });
            });
        }
    }
}])
