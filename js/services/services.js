angular.module('servicos', ['ngMaterial', 'ngMessages'])
    .factory('APIServ', function ($rootScope, $http, config, $base64, $mdDialog, APIAjuFor) {
        var _enviaDadosTabela = function (tabela, chave, dados) {
            var temp = _converteParametrosparaUrl(dados);
            var parametrosEnviar = angular.isObject(temp) ? angular.toJson(temp) : temp;
            //console.log(config.baseUrl + '/manipulaTabela/' + tabela + '/' + chave + '/' + parametrosEnviar);
            return $http.get(config.baseUrl + '/manipulaTabela/' + tabela + '/' + chave + '/' + parametrosEnviar);
        }

        var _executaFuncaoClasse = function (classe, funcaoExecutar, parametros, tipo = 'get') {              
            if (tipo == 'get') {                
                var temp = _converteParametrosparaUrl(parametros);
                var parametrosEnviar = angular.isObject(temp) ? angular.toJson(temp) : temp;
                //console.log(config.baseUrl + classe + '/' + funcaoExecutar + '/' + parametrosEnviar);
                return $http.get(config.baseUrl + classe + '/' + funcaoExecutar + '/' + parametrosEnviar);
            } else if (tipo == 'post') {
                return $http.post(config.baseUrl + classe + '/' + funcaoExecutar, parametros, {
                    transformRequest: angular.identity,
                    headers: {
                        'Content-Type': undefined
                    }
                });
            }

        }

        var _parametrosUrl = function () {
            var retorno = [];
            var temp = window.location.href;
            var temp1 = temp.split('#');

            if (temp1.length > 1) { //Se e solicitacao GET
                //Neste caso a url esta separada pro barras /
                let te = temp1[0].split('/');
                if (temp1[1].split('/').length > 1) {
                    var retornoTemp = temp1[1].split('/');

                    angular.forEach(retornoTemp, function (value, key) {
                        if (value != '') {
                            retorno.push(value);
                        }
                    });
                } else if (temp1[1].split('&').length > 1) {
                    //Nesse caso esta separado pro & e tem os nomes pagina e acao
                    let retornoTemp = temp1[1].split('&');
                    angular.forEach(retornoTemp, function (value, key) {
                        retorno.push(value.split('=')[1]);
                    })
                }
            } else if (parametrosLocal = _buscaDadosLocais('parametrosUrl')) {
                retorno[0] = parametrosLocal['pagina'];
                retorno[1] = parametrosLocal['acao'];
                retorno[2] = parametrosLocal['subAcao']
            }

            return retorno;
        };

        var _buscaDadosLocais = function (dadosBuscar) {
            var dados = window.localStorage.getItem(dadosBuscar);
            return angular.fromJson(dados);
        }

        var _salvaDadosLocais = function (nomeArmazenamento, dadosSalvar) {
            return window.localStorage[nomeArmazenamento] = angular.toJson(dadosSalvar);
        }

        var _apagaDadosLocais = function (nomeApagar, id) {
            if (!id) {
                return window.localStorage.removeItem(nomeApagar);
            } else {
                var novo = {};
                var dados = _buscaDadosLocais(nomeApagar);
                angular.forEach(dados, function (val, key) {
                    if (key != id) {
                        novo[key] = val;
                    }
                });
                return _salvaDadosLocais(nomeApagar, novo);
            }
        }

        var _mensagemSimples = function (titulo, texto, funcao) {
            var confirm = $mdDialog.confirm()
                .title(titulo)
                .textContent(texto)
                .ok('Ok');

            $mdDialog.show(confirm).then(function () {
                if (funcao != undefined) {
                    funcao();
                }
            }, function () {

            });
        }

        var _dialogoSimples = function (titulo, texto, btnConfirmar, btnCancelar, funcaoSim, funcaoNao) {
            var confirm = $mdDialog.confirm()
                .title(titulo)
                .textContent(texto)
                .ariaLabel('Lucky day')
                .targetEvent()
                .ok(btnConfirmar)
                .cancel(btnCancelar);
            $mdDialog.show(confirm).then(function () {
                funcaoSim();
            }, function () {
                if(funcaoNao != undefined)                    {
                    funcaoNao();
                }
            });
        };

        var _telaAguarde = function (acao = '') {
            if (acao == '') {
                var aguarde = $mdDialog.show({
                    template: '<img ng-src="api/front/imagens/aguarde.gif" class="img-responsive imgAguarde">'
                })
                $mdDialog.show(aguarde);
            } else if (acao == 'fechar') {
                //angular.element.triggerHandler({type:"keydown", which:27});
                $mdDialog.hide();
                $mdDialog.hide();
            }
        }

        var _abrirPopUpArquivo = function (arquivo){
            //console.log(arquivo);
            
            $mdDialog.show({
                template: `<objeto-visualizacao arquivo="${arquivo}" largura="100%" altura="100%"></objeto-visualizacao>`
            })
        }

        var _converteParametrosparaUrl = function (parametros) {
            if (angular.isObject(parametros)) {
                var retorno = {};
                angular.forEach(parametros, function (value, key) {
                    if (!angular.isObject(value)) {
                        retorno[key] = $base64.encode(value).replace('/', '_-_');
                    } else if (angular.isObject(value)) {
                        retorno[key] = _converteParametrosparaUrl(value);
                    }
                })
            } else {
                var retorno = parametros;
            }
            return retorno;
        };

        var _chaveExisteEmVariavel = function (variavel, chave, existe = false) {
            var retorno = existe;
            angular.forEach(variavel, function (val, key) {
                if (angular.isObject(val) && !retorno) {
                    retorno = key == chave ? true : _chaveExisteEmVariavel(val, chave, retorno);
                } else {
                    retorno = retorno ? retorno : key == chave ? true : false;
                }
            });
            return retorno;
        }

        var _valorExisteEmVariavel = function (variavel, valor, chave = '', existe = false) {
            var retorno = existe;
            angular.forEach(variavel, function (val, key) {
                if (angular.isObject(val) && !retorno) {
                    retorno = chave != '' && key == chave ? true : _valorExisteEmVariavel(val, valor, chave, retorno);
                } else {
                    retorno = retorno ? retorno :
                        chave != '' && key == chave && val == valor ? true :
                            chave == '' && val == valor ? true :
                                key == chave && valor == '' ? true : false;
                }
            });
            return retorno;
        }

        var _transporVariavel = function (variavel, retorno = {}) {
            var retorno = retorno;
            angular.forEach(variavel, function (val, key) {
                if (angular.isObject(val)) {
                    retorno[key] = val;
                } else {
                    retorno[key] = val;
                }
            })
            return retorno;
        }

        let _excluriKeyArray = (array, key) => {
            let nova = [];
            for(let k in array){                //console.log(k);
                //console.log(key);
                
                
                if (k != key) {
                    nova.push(array[k])
                }
            }
            return nova;
        }

        var _buscarValorVariavel = function (variavel, chave, valor = '') {
            if (chave == undefined) { //No caso de precisar apenas passar o valor do scope sem vincular a variavel ao scope
                return variavel
            } else {
                var retorno = valor;
                for (let campo in variavel) {
                    if (campo == chave) {
                        retorno = variavel[campo];
                    } else if (angular.isObject(variavel[campo]) && retorno == '') {
                        retorno = _buscarValorVariavel(variavel[campo], chave);
                    }

                }
                /*
                angular.forEach(variavel, function(val, key) {
                    if (key == chave) {
                        retorno = variavel[key];
                    } else if (angular.isObject(variavel[key]) && retorno == '') {
                        retorno = _buscarValorVariavel(variavel[key], chave);
                    }
                });
                */
                return retorno;
            }
        }

        var _operacoesMatematicas = function (operador, valor1, valor2) {
            switch (operador) {
                case '+':
                    return valor1 + valor2;
                case '-':
                    return valor1 - valor2;
                case '*':
                    return valor1 * valor2;
                case '/':
                    return valor1 / valor2;
                case '=':
                    return valor1 == valor2;
                case '!=':
                    return valor1 != valor2;
                case '>=':
                    return valor1 >= valor2;
            }
        }

        var _manipulaCarrinho = function (produto, acao, valor) {
            var verQtdCarrinho = function (carrinho, chave) {
                let retorno = 0;
                angular.forEach(carrinho.produtos, function (value, key) {
                    if (value.chave == chave) {
                        retorno = value.quantidade;
                    }
                })
                return retorno;
            }

            //console.log(produto + ' - ' + acao + ' - ' + valor);
            var carTemp = _buscaDadosLocais('carrinho');

            if (produto != '' && produto != undefined) {
                var p = produto;
                var chave_sabor = p.chave_sabor != undefined ? p.chave_sabor : 0;
                var chave = p.chave;

                var posicao = 0;
                var itens = 0;
                var total = 0;
                var avista = 0;
            }
            var carrinhoVazio = {
                itens: 0,
                total: 0,
                avista: 0,
                formaPagamento: '',
                enderecoEntrega: 'vazio',
                produtos: {}
            };

            if (!carTemp) {
                var carrinho = carrinhoVazio;
            } else {
                var carrinho = carTemp;
            }

            if (acao == 'formaPagamento') {
                carrinho.formaPagamento = valor;
            } else if (acao == 'enderecoEntrega') {
                carrinho.enderecoEntrega = valor;
            } else if (acao == 'vazio') {
                carrinho = carrinhoVazio;
            } else if (acao == 'adicionar') {

                var configuracoes = _buscaDadosLocais('configuracoes');

                produto.noCarrinho = true;
                var prodAdd = {
                    chave: p.chave,
                    chave_produto: p.chave_produto,
                    chave_tamanho: p.chave_tamanho,
                    chave_sabor: chave_sabor,
                    preco_de: p.preco_de,
                    preco_por: p.preco_por,
                    valor_avista: p.valor_avista,
                    produto: p.produto,
                    tamanho: p.tamanho,
                    sabor: p.sabor,
                    imagem_capa: p.imagem_capa,
                    quantidade: 1
                }
                //Varrendo para pegar a proxima posicao ou a posicao que ja tenha este produto para aumentar a quantidade
                var situacao = 'insert';
                angular.forEach(carrinho['produtos'], function (val, key) {
                    if (val.chave == chave) {
                        situacao = 'edit';
                        carrinho['produtos'][key]['quantidade']++;
                        var totalProduto = APIAjuFor.textoParaFloat(val.preco_por) * carrinho['produtos'][key]['quantidade'];
                        carrinho['produtos'][key]['totalProduto'] = APIAjuFor.numberFormat(totalProduto, 2, ',', '.');

                        var totalProdutoAvista = APIAjuFor.textoParaFloat(val.valor_avista) * carrinho['produtos'][key]['quantidade'];
                        carrinho['produtos'][key]['totalProdutoAvista'] = APIAjuFor.numberFormat(totalProdutoAvista, 2, ',', '.');

                        //console.log(carrinho['produtos'][key]['totalProduto']);
                    }
                    itens += carrinho['produtos'][key]['quantidade'];
                    posicao = val.chave == chave ? key : posicao + 1;
                });

                if (situacao == 'insert') {
                    itens++;
                    total += prodAdd.preco_de;
                    carrinho['produtos'][posicao] = prodAdd;
                    carrinho['produtos'][posicao]['totalProduto'] = prodAdd.preco_por;
                    carrinho['produtos'][posicao]['totalProdutoAvista'] = prodAdd.valor_avista;
                }
                //Informando no Produto a quantidade que tem no carrinho para mostrar nos detalhes do produto
                //produto.qtdCarrinho = produto.qtdCarrinho != undefined ? produto.qtdCarrinho + 1 : 1;
                produto.qtdCarrinho = verQtdCarrinho(carrinho, chave);
                /**/

                carrinho['itens'] = itens > 0 ? itens : 1;

                carrinho['total'] += APIAjuFor.textoParaFloat(prodAdd.preco_por);

                carrinho['avista'] += APIAjuFor.textoParaFloat(prodAdd.valor_avista);
            } else if (acao == 'removerUnidade') {
                angular.forEach(carrinho['produtos'], function (val, key) {
                    //Excluindo o item
                    if (p.chave == val.chave) {
                        if (val.quantidade > 1) {
                            carrinho['produtos'][key]['quantidade'] = val.quantidade - 1;
                            var totalProduto = APIAjuFor.textoParaFloat(val.preco_por) * carrinho['produtos'][key]['quantidade'];
                            carrinho['produtos'][key]['totalProduto'] = APIAjuFor.numberFormat(totalProduto, 2, ',', '.');

                            var totalProdutoAvista = APIAjuFor.textoParaFloat(val.valor_avista) * carrinho['produtos'][key]['quantidade'];
                            carrinho['produtos'][key]['totalProdutoAvista'] = APIAjuFor.numberFormat(totalProdutoAvista, 2, ',', '.');

                            //console.log(carrinho['produtos'][key]['totalProduto']);
                            //Informando no Produto a quantidade que tem no carrinho para mostrar nos detalhes do produto
                            //produto.qtdCarrinho = produto.qtdCarrinho != undefined ? produto.qtdCarrinho - 1 : 0;
                            produto.qtdCarrinho = verQtdCarrinho(carrinho, chave);
                        } else if (val.quantidade == 1) {
                            delete carrinho['produtos'][key];
                            produto.qtdCarrinho = verQtdCarrinho(carrinho, chave);
                            produto.noCarrinho = false;
                        }
                        carrinho['total'] = carrinho['total'] - APIAjuFor.textoParaFloat(val.preco_por);
                        carrinho['avista'] = carrinho['avista'] - APIAjuFor.textoParaFloat(val.valor_avista);
                        carrinho['itens']--;
                    }
                });
            } else if (acao == 'removerItem') {
                produto.noCarrinho = false;
                var novaKey = -1;
                angular.forEach(carrinho['produtos'], function (val, key) {
                    //Excluindo o item
                    if (p.chave == val.chave) {
                        delete carrinho['produtos'][key];
                        produto.qtdCarrinho = verQtdCarrinho(carrinho, chave);
                        produto.noCarrinho = false;
                    } else { //Criando o novo Carrinho
                        novaKey++;
                        carrinhoVazio.itens += val.quantidade;
                        carrinhoVazio.total += APIAjuFor.textoParaFloat(val.preco_por) * val.quantidade;
                        //let avista =
                        carrinhoVazio.avista += APIAjuFor.textoParaFloat(val.valor_avista) * val.quantidade;
                        carrinhoVazio['produtos'][novaKey] = val;
                    }
                });
                carrinho = carrinhoVazio;
            }
            _salvaDadosLocais('carrinho', carrinho);
            return carrinho;
        }

        var _precoFrete = function (produto, cepDestino, origem) {
            //_telaAguarde();
            //console.log(produto);
            var produtos = [];

            addProduto = function (item) {
                produtos.push({
                    chave_tamanho: item.chave_tamanho,
                    preco_por: item.preco_por,
                    valor_avista: item.valor_avista,
                    quantidade: item.quantidade != undefined ? item.quantidade : 1
                });
            }

            if (origem == 'produto') {
                addProduto(produto);
            } else if (origem == 'carrinho' || origem == 'finalizaVenda') {
                let retorno = 0;
                angular.forEach(produto.produtos, function (valor, key) {
                    addProduto(valor);
                    //console.log(valor);
                })
            }

            var parametros = {
                'produtos': produtos,
                'cepdestino': cepDestino,
                'modalidade': 9,
            }

            if (origem == 'produto' || origem == 'carrinho') {
                _executaFuncaoClasse('jadLog', 'precoFrete', parametros).success(function (data) {
                    $rS.freteAvista = data.freteAvista;
                    $rS.freteAprazo = data.freteAprazo;
                })
            } else if (origem == 'finalizaVenda') {
                return _executaFuncaoClasse('jadLog', 'precoFrete', parametros);
            }
            //}
        }

        _criptografa = function (texto) {
            return $base64.encode(texto);
        }
        _descriptografa = function (texto) {
            return $base64.decode(texto);
        }

        let _abrirModal = function (template, valor, tabela, controller) {
            $rS.valorAlteracao = $rS.valorAlteracao != undefined ? $rS.valorAlteracao : {};
            $rS.valorAlteracao[tabela] = valor;
            $mdDialog.show({
                controller: controller,
                templateUrl: template,
                parent: 'body',
                targetEvent: template,
                clickOutsidetoClose: true,
                fullscreen: true
            });
        }

        let _fecharModal = function () {
            $rS.valorAlteracao = {};
            $mdDialog.hide();
        }

        return {
            enviaDadosTabela: _enviaDadosTabela,
            executaFuncaoClasse: _executaFuncaoClasse,
            parametrosUrl: _parametrosUrl,
            buscaDadosLocais: _buscaDadosLocais,
            salvaDadosLocais: _salvaDadosLocais,
            apagaDadosLocais: _apagaDadosLocais,
            mensagemSimples: _mensagemSimples,
            dialogoSimples: _dialogoSimples,
            abrirPopUpArquivo: _abrirPopUpArquivo,
            telaAguarde: _telaAguarde,
            converteParametrosparaUrl: _converteParametrosparaUrl,
            chaveExisteEmVariavel: _chaveExisteEmVariavel,
            valorExisteEmVariavel: _valorExisteEmVariavel,
            transporVariavel: _transporVariavel,
            excluriKeyArray: _excluriKeyArray,
            buscarValorVariavel: _buscarValorVariavel,
            operacoesMatematicas: _operacoesMatematicas,
            manipulaCarrinho: _manipulaCarrinho,
            precoFrete: _precoFrete,
            criptografa: _criptografa,
            descriptografa: _descriptografa,
            abrirModal: _abrirModal,
            fecharModal: _fecharModal
        };
    });
