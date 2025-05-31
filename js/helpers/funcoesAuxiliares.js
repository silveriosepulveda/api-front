directivesPadrao.factory('EGFuncoes', function ($rootScope, $parse, $http, config, $base64, $mdDialog, APIAjuFor, APIServ) {
    var _quandoTemCadastro = ['padrao', 'cadastroDireto', 'cadastroUnico', 'consultaDireta', 'somenteCadastro'];
    var _quandoTemConsulta = ['padrao', 'consulta', 'consultaDireta', "somenteConsulta"];

    var _temCadastro = function (estrutura) {
        return _quandoTemCadastro.indexOf(estrutura.tipoEstrutura) >= 0; // tipoEstrutura == 'padrao' || tipoEstrutura == 'cadastroDireto' || tipoEstrutura == 'consultaDireta' || tipo;
    }
    var _temConsulta = function (estrutura) {
        return _quandoTemConsulta.indexOf(estrutura.tipoEstrutura) >= 0; // tipoEstrutura == 'padrao' || tipoEstrutura == 'consulta' || tipoEstrutura == 'consultaDireta';
    }
    var _temCadastroDireto = function (estrutura) {
        var retorno = estrutura.tipoEstrutura == 'cadastroDireto';
        if (estrutura.filtrosPorUsuario != undefined && estrutura.filtrosPorUsuario[estrutura.campo_chave] != undefined) {
            var usuario = APIServ.buscaDadosLocais('usuario');

            var filtro = estrutura.filtrosPorUsuario;
            //console.log(filtro);
            angular.forEach(filtro, function (val, key) {
                if (usuario[key] != undefined) {
                    retorno = APIServ.operacoesMatematicas(val.operador, usuario[key], val.valor);
                }
            });
        }
        return retorno;
    }

    var _montarAtributos = function (atributos) {
        var retorno = [];
        // angular.forEach(atributos, function (val, atr) {   
        //     console.log(val);
        //     let temp = val != "" ? `${atr}="${val}"` : atr; 
        //     console.log(val);
        //     console.log(temp);                                  
        //     //Comentei essa linha pois estava dando erro, mas não sei onde usava
        //     //temp = temp.replace(/"/g, `'`);                  
        //     retorno.push(temp);
        // })

        for (let key in atributos) {
            let val = atributos[key];
            let temp = val != "" ? `${key}="${val}"` : atributos;
            retorno.push(temp);
        }
        return retorno;
    }

    var _montarTamanhos = function (parametros) {
        var p = parametros;

        var retorno = [];
        //Acrecentando as classes de tamanho do elemento div

        if (p != undefined) {
            if (p.xs != undefined && p.xs >= 1) {
                retorno.push('col-xs-' + p.xs)
            } else if (p.tipo != 'button') {
                retorno.push('col-xs-12')
            };
            if (p.sm != undefined && p.sm >= 1) retorno.push('col-sm-' + p.sm);
            if (p.md != undefined && p.md >= 1) retorno.push('col-md-' + p.md);
            if (p.lg != undefined && p.lg >= 1) retorno.push('col-lg-' + p.lg);

            //if(p.porcent != undefined && p.porcent > 0) retorno.push('larg' + p.porcent + 'p !important');
        }

        return retorno;
    }

    var _eBloco = function (campo) {
        return campo.length >= 5 && campo.substr(0, 5) == 'bloco';
    }

    var _modeloParaId = function (modelo) {
        //Fiz esta subistituicao para tentar corrigir o problema do indice na troca de posicoes
        modelo = modelo.replace('[$index]', '[{{$index}}]').replace('[$parent.$index]', '[{{$parent.$index}}]');

        var caracteres = ["[", "]", '"', '.', "'"];
        var retorno = '';
        for (var i = 0; i < modelo.length; i++) {
            let caracter = modelo.substr(i, 1);
            let sequencia = modelo.substr(i + 1, 1);
            var substituir = caracteres.indexOf(caracter) >= 0;

            //Fiz essa comparacao para não alterar o $parent.$index
            if (caracter == '.' && sequencia == '$') {
                retorno += caracter;
            } else {
                retorno += substituir ? '_' : caracter;
            }
            retorno = retorno.substr(retorno.length - 2, 2) == '__' ? retorno.substr(0, retorno.length - 1) : retorno;
            //}
        }
        retorno = retorno.substr(retorno.length - 1, 1) == '_' ? retorno.substr(0, retorno.length - 1) : retorno;
        return retorno;
    }

    let _trocarCampoModelo = (event, modelo, campoAtual, campoNovo) => {
        let retorno = _indexPorNumero(event, modelo);
        retorno = retorno.replace(campoAtual, campoNovo);
        return retorno;
    }

    let _indexPorNumero = (event, modelo) => {
        let indice = $(event.target).attr('indice');
        let indiceSuperior = $(event.target).attr('indice-superior');
        let retorno = '';
        //return modelo.replace('[$index]', `[${indice}]`).replace('[$parent.$index]', `[${indiceSuperior}]`);
        if (indice == undefined || indice == '') {
            retorno = modelo;
        }

        if (indice != undefined && indice != '') {
            try {
                retorno = modelo.replace('[$index]', `[${indice}]`);
            } catch {
                retorno = modelo;
            }
        }

        if (indiceSuperior != undefined && indiceSuperior != '') {
            retorno = retorno.replace('[$parent.$index]', `[${indiceSuperior}]`);
        }
        return retorno;
    }

    var _maiorChaveArray = function (array) {
        var chave = 0;
        angular.forEach(array, function (val, key) {
            chave = key > chave ? key : chave;
        });
        return chave;
    }

    var _proximaChaveArray = function (array) {
        var chave = 0;
        angular.forEach(array, function (val, key) {
            chave = key > chave ? key : chave;
        });
        chave = chave == 0 && Object.keys(array).length == 0 ? chave : parseInt(chave) + 1;
        return chave;
    }

    var _montarCamposFiltroConsulta = function (estrutura, camposFiltroPesquisa, retornoEnt) {
        //Despois tenho que por opcoes de pesquisar por tabelas relacionadas
        var retornoMCFC = retornoEnt != undefined ? retornoEnt : [];
        angular.forEach(estrutura.campos, function (val, campo) {
            if (_eBloco(campo) && val.nome == undefined) {
                retornoMCFC = _montarCamposFiltroConsulta(val.campos, camposFiltroPesquisa, retornoMCFC);
            } else if (val.tipo != 'oculto' && val.tipo != 'area-texto' && campo.substr(0, 5) != 'botao' && !_eBloco(campo) && val.tipo != 'diretiva') {
                let cF = estrutura.camposFiltroPesquisa;
                let ocultarCampoFiltro = estrutura.camposOcultarFiltroPesquisa != undefined && APIServ.valorExisteEmVariavel(estrutura.camposOcultarFiltroPesquisa, campo);

                if (!ocultarCampoFiltro) {
                    let tempItem = {};
                    tempItem['texto'] = cF != undefined && cF[campo] != undefined && cF[campo]['texto'] != undefined ? cF[campo]['texto'] : val.texto;
                    tempItem['tipo'] = val.tipo;

                    if (val.operador != undefined) {
                        tempItem['operador'] = val.operador;
                    }

                    retornoMCFC[campo] = tempItem;
                }
            }
        });
        var filtrosPersonalizados = estrutura.camposFiltroPesquisa != undefined ? estrutura.camposFiltroPesquisa : {};
        //console.log(_montarCamposFiltroConsulta(scope.estrutura.campos));
        var retornoMCFC = Object.assign({}, filtrosPersonalizados, retornoMCFC);
        //console.log(retornoMCFC);
        return retornoMCFC;
    }

    var _novaVariavelRaizModelo = function (variavel, retorno) {
        var retorno = retorno != undefined ? retorno : {};
        angular.forEach(variavel.campos, function (valores, campo) {
            if (campo.substr(0, 5) == 'bloco') {
                if (valores.variavelSalvar != undefined) {
                    retorno[valores.variavelSalvar] = [];
                }
                if (valores.nomeBloco != undefined && valores.repeticao == undefined) {
                    retorno[valores.nomeBloco] = _novaVariavelRaizModelo(valores);
                } else if (valores.nomeBloco != undefined && valores.repeticao != undefined) {
                    retorno[valores.nomeBloco] = [];
                } else {
                    retorno = _novaVariavelRaizModelo(valores, retorno);
                }
            } else if (campo != 'botao') {
                let valor = '';
                if (valores.padrao == 'data') {
                    valor = APIAjuFor.dataAtual();
                } else if (valores.padrao == 'hora') {
                    valor = APIAjuFor.horaAtual();
                } else if (valores.padrao != '') {
                    valor = valores.padrao;
                }
                //var valor = valores.padrao != undefined && valores.padrao != 'data' ? valores.padrao : valores.padrao == 'data' ? APIAjuFor.dataAtual() : '';
                retorno[campo] = valor; // APIAjuFor.formatarValor(valor, valores.tipo);
            }
        })
        return retorno;
    }

    let _adicionarItemRepeticao = function ($scope, nomeBloco, obj, valor) {
        var obj = obj != undefined ? obj : this;
        var dadosBloco = APIServ.buscarValorVariavel($scope.estrutura.campos, nomeBloco);

        //var raizModelo = $scope.estrutura.raizModelo;
        let raizModelo = dadosBloco.raizModeloBloco != undefined ? dadosBloco.raizModeloBloco : $scope.estrutura.raizModelo;

        var variavelSalvar = dadosBloco.variavelSalvar;
        var variavelSuperior = dadosBloco.variavelSuperior;

        if (variavelSuperior != undefined) {
            //Faco essa comparacao, pois pode ser o botao de adicionar do item ou pode estar na div de comprimir e expandir
            var indiceSuperior = obj.$parent.$index != undefined ? obj.$parent.$index : obj.$index;

            if ($scope[raizModelo][dadosBloco.variavelSuperior][indiceSuperior][variavelSalvar] == undefined) {
                $scope[raizModelo][dadosBloco.variavelSuperior][indiceSuperior][variavelSalvar] = {};
            }

            var indice = _proximaChaveArray($scope[raizModelo][dadosBloco.variavelSuperior][indiceSuperior][variavelSalvar]);

            $scope[raizModelo][dadosBloco.variavelSuperior][indiceSuperior][variavelSalvar][indice] = _novaVariavelRaizModelo(dadosBloco);

            if (valor != undefined) {
                $scope[raizModelo][dadosBloco.variavelSuperior][indiceSuperior][variavelSalvar][indice] = $.extend({}, $scope[raizModelo][dadosBloco.variavelSuperior][indiceSuperior][variavelSalvar][indice], valor);
            }
        } else {
            var indice = $scope[$scope.estrutura.raizModelo][variavelSalvar] != undefined ?
                Object.keys($scope[$scope.estrutura.raizModelo][variavelSalvar]).length : 0;

            if (dadosBloco.repeticao != undefined && dadosBloco.repeticao.maximoItensBloco != undefined && indice == dadosBloco.repeticao.maximoItensBloco) {
                APIServ.mensagemSimples('Informação', 'Máximo de Ítens Atingido');
                return false;
            }

            if ($scope[$scope.estrutura.raizModelo][variavelSalvar] == undefined) {
                $scope[$scope.estrutura.raizModelo][variavelSalvar] = [];
            }


            angular.forEach($scope[$scope.estrutura.raizModelo][variavelSalvar], function (val, key) {
                indice = key >= indice ? parseInt(key) + 1 : indice;
            })
            indice = parseInt(indice);
            $scope[$scope.estrutura.raizModelo][variavelSalvar][indice] = _novaVariavelRaizModelo(dadosBloco);
        }
        if ($scope.aoAdicionarItemRepeticao != undefined) {
            $scope.aoAdicionarItemRepeticao();
        }
    }

    // Função auxiliar para acessar valores dinâmicos de forma segura
    function getScopeValue($scope, expr) {
        try {
            return $parse(expr)($scope);
        } catch (e) {
            return undefined;
        }
    }
    // Função auxiliar para atribuir valores dinâmicos de forma segura
    function setScopeValue($scope, expr, value) {
        try {
            $parse(expr).assign($scope, value);
        } catch (e) {}
    }
    // Refatoração: substituição de eval por $parse, validação de parâmetros, comentários explicativos
    _removerItemRepeticao = function ($scope, nomeBloco) {
        if (!$scope || !nomeBloco) return;
        var botao = event.target;
        var indice = angular.element(botao).attr('indice');
        var dadosBloco = APIServ.buscarValorVariavel($scope.estrutura.campos, nomeBloco);
        var aoExcluir = dadosBloco.aoExcluir != undefined ? dadosBloco.aoExcluir : 'A';
        var tipo = nomeBloco.split('_').length == 2 ? 'principal' : 'subBloco';
        var variavelRepeticao, nomeVariavelRepeticao;
        if (tipo == 'principal') {
            nomeVariavelRepeticao = $scope.estrutura.raizModelo + '.' + dadosBloco.variavelSalvar;
            variavelRepeticao = getScopeValue($scope, nomeVariavelRepeticao);
        } else if (tipo == 'subBloco') {
            var indiceParent = angular.element(botao).attr('indice-parent');
            if (dadosBloco.raizModeloBloco != undefined) {
                nomeVariavelRepeticao = dadosBloco.raizModeloBloco + '.' + dadosBloco.variavelSuperior + '[' + indiceParent + ']["' + dadosBloco.variavelSalvar + '"]';
            } else {
                nomeVariavelRepeticao = $scope.estrutura.raizModelo + '.' + dadosBloco.variavelSuperior + '[' + indiceParent + ']["' + dadosBloco.variavelSalvar + '"]';
            }
            variavelRepeticao = getScopeValue($scope, nomeVariavelRepeticao);
        }
        // Função local para remover item do array/objeto
        var _funcaoRemoverLocal = function () {
            var novoItem = {};
            var cont = 0;
            angular.forEach(variavelRepeticao, function (item, key) {
                if (key != indice) {
                    novoItem[cont] = item;
                    cont++;
                }
            });
            variavelRepeticao = novoItem;
            setScopeValue($scope, nomeVariavelRepeticao, novoItem);
            if (dadosBloco.aoRemoverItem != undefined) {
                var funcao = dadosBloco.aoRemoverItem.replace('()', '');
                if (typeof $scope[funcao] === 'function') $scope[funcao]();
            }
            if ($scope.aposRemoverItemRepeticao != undefined) {
                $scope.aposRemoverItemRepeticao(indice);
            }
        }
        // Função para remoção remota (backend)
        var _funcaoRemoverRemoto = function () {
            let parametros = {
                campo_chave: dadosBloco.campoChave,
                tabela: dadosBloco.tabela,
                chave: variavelRepeticao[indice][dadosBloco.campoChave],
                aoExcluir: aoExcluir
            }
            var funcao = function () {
                APIServ.executaFuncaoClasse('classeGeral', 'excluir', parametros).success(function (retorno) {
                    if ((aoExcluir == 'A' && retorno.chave > 0) || (aoExcluir == 'E' && retorno.chave == 0)) {
                        _funcaoRemoverLocal();
                        APIServ.mensagemSimples('Confirmação', 'Excluído com Sucesso');
                    }
                })
            }
            var mensagem = dadosBloco.mensagemExcluir != undefined ? dadosBloco.mensagemExcluir : 'Excluir Ítem';
            APIServ.dialogoSimples('Confirmação', mensagem, 'Sim', 'Não', funcao);
        }
        // Validação de mínimo de itens
        if (dadosBloco.repeticao && dadosBloco.repeticao.minimoItensBloco != undefined && Object.keys(variavelRepeticao).length == dadosBloco.repeticao.minimoItensBloco) {
            APIServ.mensagemSimples('Informação', 'Número Mínimo de Itens Tem que ser Respeitado');
        } else if (!variavelRepeticao[indice] || variavelRepeticao[indice][dadosBloco.campoChave] == undefined || variavelRepeticao[indice][dadosBloco.campoChave] == 0) {
            _funcaoRemoverLocal();
        } else {
            _funcaoRemoverRemoto();
        }
    }

    return {
        temCadastro: _temCadastro,
        temConsulta: _temConsulta,
        temCadastroDireto: _temCadastroDireto,
        montarAtributos: _montarAtributos,
        montarTamanhos: _montarTamanhos,
        eBloco: _eBloco,
        modeloParaId: _modeloParaId,
        trocarCampoModelo: _trocarCampoModelo,
        indexPorNumero: _indexPorNumero,
        maiorChaveArray: _maiorChaveArray,
        proximaChaveArray: _proximaChaveArray,
        montarCamposFiltroConsulta: _montarCamposFiltroConsulta,
        novaVariavelRaizModelo: _novaVariavelRaizModelo,
        adicionarItemRepeticao: _adicionarItemRepeticao,
        removerItemRepeticao: _removerItemRepeticao
    };
})
