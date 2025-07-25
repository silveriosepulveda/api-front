angular.module("servicos", ["ngMaterial", "ngMessages"]).factory("APIServ", function ($rootScope, $http, config, $base64, $mdDialog, APIAjuFor) {
    var _enviaDadosTabela = function (tabela, chave, dados) {
        var temp = _converteParametrosparaUrl(dados);
        var parametrosEnviar = angular.isObject(temp) ? angular.toJson(temp) : temp;
        //console.log(config.baseUrl + '/manipulaTabela/' + tabela + '/' + chave + '/' + parametrosEnviar);
        return $http.get(config.baseUrl + "/manipulaTabela/" + tabela + "/" + chave + "/" + parametrosEnviar);
    };

    

    var _executaFuncaoClasse = function (classe, funcaoExecutar, parametros, tipo = 'get') {
        var sessionId = window.localStorage.getItem('sessionId');
        console.log(sessionId);
        
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
    }; // Helper function to detect if we're inside a PopUpModal
    var _isInsideModal = function () {
        // Verifica múltiplas variações de classes de modal do Bootstrap
        return (
            document.querySelector(".popup-modal.show") !== null ||
            document.querySelector(".popup-modal.in") !== null ||
            document.querySelector(".popup-modal:not(.fade)") !== null ||
            document.querySelector(".modal.show") !== null ||
            document.querySelector(".modal.in") !== null ||
            document.querySelector(".modal:not(.fade)") !== null ||
            // Verifica backdrop do modal Bootstrap
            document.querySelector(".modal-backdrop") !== null ||
            // Verifica se algum elemento tem classe popup-modal visível
            (function () {
                var modals = document.querySelectorAll(".popup-modal");
                for (var i = 0; i < modals.length; i++) {
                    var style = window.getComputedStyle(modals[i]);
                    if (style.display !== "none" && style.visibility !== "hidden") {
                        return true;
                    }
                }
                return false;
            })()
        );
    }; // SOLUÇÃO ROBUSTA E EFICAZ: Força z-index de forma mais direta e agressiva
    var _forceDialogAboveModal = function (isLoading) {
        // HIERARQUIA CORRIGIDA: Container deve ter z-index MAIS ALTO que o dialog para botões funcionarem
        var dialogZIndex = isLoading ? 100001 : 100000; // Dialog base
        var containerZIndex = isLoading ? 100005 : 100002; // Container SEMPRE mais alto
        var buttonZIndex = isLoading ? 100006 : 100003; // Botões mais altos ainda            // Função para aplicar z-index de forma agressiva
        var applyZIndex = function () {
            try {
                // ESTRATÉGIA 1: Força TODOS os md-dialog
                var dialogs = document.querySelectorAll("md-dialog");
                for (var i = 0; i < dialogs.length; i++) {
                    var dialog = dialogs[i];
                    dialog.style.setProperty("z-index", dialogZIndex.toString(), "important");
                    dialog.style.setProperty("position", "fixed", "important");
                    dialog.classList.add("popup-modal-dialog-overlay");
                    if (isLoading) dialog.classList.add("popup-modal-loading");

                    // CORREÇÃO: Container pai deve ter z-index MAIS ALTO
                    if (dialog.parentElement) {
                        dialog.parentElement.style.setProperty("z-index", containerZIndex.toString(), "important");
                        dialog.parentElement.style.setProperty("position", "fixed", "important");
                    }
                }

                // ESTRATÉGIA 2: Força TODOS os containers - PRIORIDADE MÁXIMA
                var containers = document.querySelectorAll('._md-dialog-container, .md-dialog-container, [role="dialog"]');
                for (var i = 0; i < containers.length; i++) {
                    var container = containers[i];
                    // CORREÇÃO: Container deve ter z-index MAIS ALTO para botões funcionarem
                    container.style.setProperty("z-index", containerZIndex.toString(), "important");
                    container.style.setProperty("position", "fixed", "important");
                    container.classList.add("popup-modal-dialog-overlay");

                    // Garantir que buttons/actions dentro do container funcionem
                    var buttons = container.querySelectorAll("button, .md-button, [ng-click], .btn");
                    for (var j = 0; j < buttons.length; j++) {
                        buttons[j].style.setProperty("z-index", buttonZIndex.toString(), "important");
                        buttons[j].style.setProperty("position", "relative", "important");
                        buttons[j].style.setProperty("pointer-events", "auto", "important");
                    }
                } // ESTRATÉGIA 3: Força backdrops ABAIXO dos dialogs
                var backdrops = document.querySelectorAll(".md-dialog-backdrop, .md-backdrop, .cdk-overlay-backdrop");
                for (var i = 0; i < backdrops.length; i++) {
                    // CORREÇÃO: Backdrop deve ficar ABAIXO dos dialogs, não acima
                    backdrops[i].style.setProperty("z-index", "99998", "important");
                    backdrops[i].style.setProperty("opacity", "0.5", "important");
                    backdrops[i].style.setProperty("pointer-events", "none", "important");
                }

                // ESTRATÉGIA 3.1: Desabilitar backdrops problemáticos em contexto modal
                if (_isInsideModal()) {
                    var problematicBackdrops = document.querySelectorAll(".md-dialog-backdrop");
                    for (var i = 0; i < problematicBackdrops.length; i++) {
                        // Ocultar backdrop problemático em contexto modal
                        problematicBackdrops[i].style.setProperty("display", "none", "important");
                    }
                } // ESTRATÉGIA 4: Força todos os elementos do Angular Material Dialog
                var allDialogElements = document.querySelectorAll('[aria-describedby*="dialog"], [aria-labelledby*="dialog"], .md-dialog-container > *');
                for (var i = 0; i < allDialogElements.length; i++) {
                    allDialogElements[i].style.setProperty("z-index", dialogZIndex.toString(), "important");
                }
            } catch (error) {
                console.warn("Erro ao aplicar z-index forçado:", error);
            }
        };

        // Execute imediatamente
        applyZIndex();

        // Execute múltiplas vezes para garantir que funcione (dialogs criados dinamicamente)
        for (var retry = 1; retry <= 5; retry++) {
            setTimeout(applyZIndex, retry * 50);
        }

        // Execute uma vez mais após um delay maior
        setTimeout(applyZIndex, 500);
    };
    // Enhanced message system with proper z-index for modals

    var _mensagemSimples = function (titulo, texto, funcao, fecharModal = false) {
        var dialogOptions = {
            title: titulo,
            textContent: texto,
            ok: "Ok",
        };

        // If we're inside a modal, apply high z-index class
        if (_isInsideModal()) {
            dialogOptions.parent = angular.element(document.body);
            dialogOptions.clickOutsideToClose = true;
            dialogOptions.escapeToClose = true;
            dialogOptions.targetEvent = null;
            dialogOptions.hasBackdrop = true;
            dialogOptions.skipHide = false;
            dialogOptions.multiple = true; // Allow multiple dialogs
        }

        var confirm = $mdDialog.confirm(dialogOptions);
        var showPromise = $mdDialog.show(confirm);

        // Apply z-index fix IMMEDIATELY if we're inside a modal
        if (_isInsideModal()) {
            _forceDialogAboveModal(false);

            // Also apply after dialog is fully rendered
            showPromise.then(null, null).finally(function () {
                setTimeout(function () {
                    _forceDialogAboveModal(false);
                }, 50);
            });
        }
        showPromise.then(
            function () {
                if (funcao != undefined) {
                    funcao();
                }

                // Fechar PopUpModal se fecharModal=true
                if (fecharModal) {
                    // Detectar e fechar modal ativo
                    if (window.bootstrap && window.bootstrap.Modal) {
                        // Bootstrap 5
                        var modals = document.querySelectorAll(".modal.show, .popup-modal.show");
                        modals.forEach(function (modal) {
                            var modalInstance = window.bootstrap.Modal.getInstance(modal);
                            if (modalInstance) modalInstance.hide();
                        });
                    } else if (window.$ && window.$.fn.modal) {
                        // Bootstrap 4/jQuery
                        $(".modal.show, .popup-modal.show, .popup-modal.in").modal("hide");
                    }
                }
            },
            function () {
                // Dialog cancelled
            }
        );
    };

    var _dialogoSimples = function (titulo, texto, btnConfirmar, btnCancelar, funcaoSim, funcaoNao) {
        var dialogOptions = {
            title: titulo,
            textContent: texto,
            ariaLabel: "Confirmation Dialog",
            ok: btnConfirmar,
            cancel: btnCancelar,
        };

        // If we're inside a modal, configure for proper z-index handling
        if (_isInsideModal()) {
            dialogOptions.parent = angular.element(document.body);
            dialogOptions.clickOutsideToClose = true;
            dialogOptions.escapeToClose = true;
            dialogOptions.targetEvent = null;
            dialogOptions.hasBackdrop = true;
            dialogOptions.skipHide = false;
            dialogOptions.multiple = true; // Allow multiple dialogs
        } else {
            dialogOptions.targetEvent = arguments[6] || null; // Allow targetEvent from outside modal
        }

        var confirm = $mdDialog.confirm(dialogOptions);
        var showPromise = $mdDialog.show(confirm);

        // Apply z-index fix IMMEDIATELY if we're inside a modal
        if (_isInsideModal()) {
            _forceDialogAboveModal(false);

            // Also apply after dialog is fully rendered
            showPromise.then(null, null).finally(function () {
                setTimeout(function () {
                    _forceDialogAboveModal(false);
                }, 50);
            });
        }

        showPromise.then(
            function () {
                funcaoSim();
            },
            function () {
                if (funcaoNao != undefined) {
                    funcaoNao();
                }
            }
        );
    };

    var _telaAguarde = function (acao = "") {
        if (acao == "") {
            var dialogOptions = {
                template: '<div class="text-center"><img ng-src="src/api-front/imagens/aguarde.gif" class="img-responsive imgAguarde"><p>Aguarde...</p></div>',
                hasBackdrop: true,
                clickOutsideToClose: false,
                escapeToClose: false,
            };

            // If we're inside a modal, configure for proper z-index handling
            if (_isInsideModal()) {
                dialogOptions.parent = angular.element(document.body);
                dialogOptions.multiple = true;
                dialogOptions.skipHide = false;
            }

            var showPromise = $mdDialog.show(dialogOptions);

            // Apply z-index fix IMMEDIATELY if we're inside a modal
            if (_isInsideModal()) {
                _forceDialogAboveModal(true); // true = loading dialog gets highest priority

                // Also apply after dialog is fully rendered
                showPromise.then(null, null).finally(function () {
                    setTimeout(function () {
                        _forceDialogAboveModal(true);
                    }, 50);
                });
            }

            return showPromise;
        } else if (acao == "fechar") {
            $mdDialog.hide();
            // Remove duplicate hide call
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
        // Modal context utility function
        isInsideModal: _isInsideModal,
    };
});
