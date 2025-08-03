angular.module("servicos", ["ngMaterial", "ngMessages", "dialogoServices"]).factory("APIServ", function ($rootScope, $http, config, $base64, $mdDialog, APIAjuFor, DialogoSimplesServ) {
    
    // Referência ao serviço de diálogo isolado
    var _dialogoSimples = function(titulo, texto, btnConfirmar, btnCancelar, funcaoSim, funcaoNao) {
        return DialogoSimplesServ.dialogoSimples(titulo, texto, btnConfirmar, btnCancelar, funcaoSim, funcaoNao);
    };
    
    // Wrapper para mensagem simples
    var _mensagemSimples = function (titulo, texto, funcao, fecharModal = false) {
        return DialogoSimplesServ.mensagemSimples(titulo, texto, funcao, fecharModal);
    };
    
    // Wrapper para tela de aguarde
    var _telaAguarde = function (acao = "") {
        return DialogoSimplesServ.telaAguarde(acao);
    };
    
    var _enviaDadosTabela = function (tabela, chave, dados) {
        var temp = _converteParametrosparaUrl(dados);
        var parametrosEnviar = angular.isObject(temp) ? angular.toJson(temp) : temp;
        //console.log(config.baseUrl + '/manipulaTabela/' + tabela + '/' + chave + '/' + parametrosEnviar);
        return $http.get(config.baseUrl + "/manipulaTabela/" + tabela + "/" + chave + "/" + parametrosEnviar);
    };

    

    var _executaFuncaoClasse = function (classe, funcaoExecutar, parametros, tipo = 'get') {
        var sessionId = window.localStorage.getItem('sessionId');        
        
        var headers = {};
        if (sessionId) {
            headers['X-Session-Id'] = sessionId;
        }
        if (tipo == 'get') {
            var temp = _converteParametrosparaUrl(parametros);            
            
            var parametrosEnviar = angular.isObject(temp) ? angular.toJson(temp) : temp;            
            
            console.log(config.baseUrl + classe + '/' + funcaoExecutar + '/' + parametrosEnviar);            
            
            return $http.get(config.baseUrl + classe + '/' + funcaoExecutar + '/' + parametrosEnviar, { headers: headers });
        } else if (tipo == 'post') {
            return $http.post(config.baseUrl + classe + '/' + funcaoExecutar, parametros, {
                transformRequest: angular.identity,
                headers: Object.assign({'Content-Type': undefined}, headers)
            });
        }

    }

    var _parametrosUrl = function () {
        var retorno = [];
        var temp = window.location.href;
        var temp1 = temp.split("#");

        if (temp1.length > 1) {
            //Se e solicitacao GET
            //Neste caso a url esta separada pro barras /
            var te = temp1[0].split("/");
            if (temp1[1].split("/").length > 1) {
                var retornoTemp = temp1[1].split("/");

                angular.forEach(retornoTemp, function (value, key) {
                    if (value != "") {
                        retorno.push(value);
                    }
                });
            } else if (temp1[1].split("&").length > 1) {
                //Nesse caso esta separado pro & e tem os nomes pagina e acao
                var retornoTemp = temp1[1].split("&");
                angular.forEach(retornoTemp, function (value, key) {
                    retorno.push(value.split("=")[1]);
                });
            }
        } else if ((parametrosLocal = _buscaDadosLocais("parametrosUrl"))) {
            retorno[0] = parametrosLocal["pagina"];
            retorno[1] = parametrosLocal["acao"];
            retorno[2] = parametrosLocal["subAcao"];
        }

        return retorno;
    };

    var _buscaDadosLocais = function (dadosBuscar) {
        var dados = window.localStorage.getItem(dadosBuscar);
        return angular.fromJson(dados);
    };

    var _salvaDadosLocais = function (nomeArmazenamento, dadosSalvar) {
        return (window.localStorage[nomeArmazenamento] = angular.toJson(dadosSalvar));
    };

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
    };

    var _abrirPopUpArquivo = function (arquivo) {
        //console.log(arquivo);

        // Usar novo sistema PopUpModal se disponível
        if (typeof PopUpModal !== "undefined") {
            return PopUpModal.abrir({
                rota: "/visualizacao/arquivo",
                titulo: "Visualizar Arquivo",
                parametros: {
                    arquivo: arquivo,
                    modo: "visualizacao",
                },
                mostrarBotaoSalvar: false,
            });
        } else {
            // Fallback para $mdDialog
            $mdDialog.show({
                template: `<objeto-visualizacao arquivo="${arquivo}" largura="100%" altura="100%"></objeto-visualizacao>`,
            });
        }
    };

    var _converteParametrosparaUrl = function (parametros) {
        if (angular.isObject(parametros)) {
            var retorno = {};
            angular.forEach(parametros, function (value, key) {
                if (!angular.isObject(value)) {
                    retorno[key] = $base64.encode(value).replace("/", "_-_");
                } else if (angular.isObject(value)) {
                    retorno[key] = _converteParametrosparaUrl(value);
                }
            });
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
    };

    var _valorExisteEmVariavel = function (variavel, valor, chave = "", existe = false) {
        var retorno = existe;
        angular.forEach(variavel, function (val, key) {
            if (angular.isObject(val) && !retorno) {
                retorno = chave != "" && key == chave ? true : _valorExisteEmVariavel(val, valor, chave, retorno);
            } else {
                retorno = retorno
                    ? retorno
                    : chave != "" && key == chave && val == valor
                    ? true
                    : chave == "" && val == valor
                    ? true
                    : key == chave && valor == ""
                    ? true
                    : false;
            }
        });
        return retorno;
    };

    var _transporVariavel = function (variavel, retorno = {}) {
        var retorno = retorno;
        angular.forEach(variavel, function (val, key) {
            if (angular.isObject(val)) {
                retorno[key] = val;
            } else {
                retorno[key] = val;
            }
        });
        return retorno;
    };

    var _excluriKeyArray = (array, key) => {
        var nova = [];
        for (var k in array) {
            //console.log(k);
            //console.log(key);

            if (k != key) {
                nova.push(array[k]);
            }
        }
        return nova;
    };

    var _buscarValorVariavel = function (variavel, chave, valor = "") {
        if (chave == undefined) {
            //No caso de precisar apenas passar o valor do scope sem vincular a variavel ao scope
            return variavel;
        } else {
            var retorno = valor;
            for (var campo in variavel) {
                if (campo == chave) {
                    retorno = variavel[campo];
                } else if (angular.isObject(variavel[campo]) && retorno == "") {
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
    };

    var _operacoesMatematicas = function (operador, valor1, valor2) {
        switch (operador) {
            case "+":
                return valor1 + valor2;
            case "-":
                return valor1 - valor2;
            case "*":
                return valor1 * valor2;
            case "/":
                return valor1 / valor2;
            case "=":
                return valor1 == valor2;
            case "!=":
                return valor1 != valor2;
            case ">=":
                return valor1 >= valor2;
        }
    };

    _criptografa = function (texto) {
        return $base64.encode(texto);
    };
    _descriptografa = function (texto) {
        return $base64.decode(texto);
    };

    // var _abrirModal = function (template, valor, tabela, controller) {
    //     $rS.valorAlteracao = $rS.valorAlteracao != undefined ? $rS.valorAlteracao : {};
    //     $rS.valorAlteracao[tabela] = valor;
    //     $mdDialog.show({
    //         controller: controller,
    //         templateUrl: template,
    //         parent: 'body',
    //         targetEvent: template,
    //         clickOutsidetoClose: true,
    //         fullscreen: true
    //     });
    // }

    var _fecharModal = function () {
        $rS.valorAlteracao = {};
        $mdDialog.hide();
    };

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
        criptografa: _criptografa,
        descriptografa: _descriptografa,
        // abrirModal: _abrirModal,
        fecharModal: _fecharModal,
    };
});
