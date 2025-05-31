angular.module('app.controllersBasicos', [])    
    .controller('listaCtrl', function ($rootScope, $scope, APIServ) {
        $scope.descricaoAnterior = '';

        $scope.setarDescricaoAnterior = function (lista) {
            $scope.descricaoAnterior = {
                chave_lista: lista.chave_lista,
                descricao: lista.descricao
            }
        }

        $scope.buscarNomesListas = function () {
            APIServ.executaFuncaoClasse('listas', 'nomesListas', '*').success(function (retorno) {
                console.log(retorno);
                $scope.nomesListas = retorno;
            })
        }

        $scope.buscarLista = function (nomeLista) {
            APIServ.executaFuncaoClasse('listas', 'buscarLista', nomeLista).success(function (retorno) {
                $scope.listaSelecionada = retorno;
            })
        }

        $scope.excluirLista = function (key, lista) {
            APIServ.executaFuncaoClasse('listas', 'excluirLista', lista.chave_lista).success(function (retorno) {
                let funcaoExcluir = () => {
                    if (retorno.chave != undefined && retorno.chave == 0) {
                        APIServ.mensagemSimples('Confirmação', 'Lista Excluída');
                        $scope.listaSelecionada.splice(key, 1);
                    } else {
                        $scope.listaSelecionada[key]['listaSubstituicao'] = [];
                        angular.forEach($scope.listaSelecionada, function (val, keyI) {
                            if (key != keyI) {
                                $scope.listaSelecionada[key]['listaSubstituicao'].push(val);
                            }
                        })
                    }
                }

                APIServ.dialogoSimples('Confirmação', 'Excluir Lista?', 'Sim', 'Não', funcaoExcluir);
            })
        }

        $scope.alterarLista = function (lista) {
            if (lista.descricao != $scope.descricaoAnterior.descricao) {
                var funcao = function () {
                    let fd = new FormData();
                    fd.append('dados', JSON.stringify(lista));
                    APIServ.executaFuncaoClasse('listas', 'alterarLista', fd, 'post').success(function (retorno) {
                        console.log(retorno);

                        if (retorno.chave > 0) {
                            APIServ.mensagemSimples('Confirmação', 'Lista Alterada');
                        }
                    });
                }
                APIServ.dialogoSimples('Confirmação', 'Alterar Lista?', 'Sim', 'Não', funcao);
            }
        }

        $scope.substituirLista = function (key, lista) {
            let substituir = function () {
                let parametros = {
                    chave_lista: lista.chave_lista,
                    chave_substituir: lista.selecionadaSubstituir,
                    nome_lista: $scope.nomeListaSelecionado
                }

                APIServ.executaFuncaoClasse('listas', 'substituirLista', parametros).success(function (retorno) {
                    if (retorno.chave == 0) {
                        APIServ.mensagemSimples('Confirmação', 'Lista Substituída');
                        $scope.listaSelecionada.splice(key, 1);
                    }
                })
            }

            APIServ.dialogoSimples('Confirmação', 'Substituir Lista?', 'Sim', 'Não', substituir);
        }
    })
    .controller('configuracaoMenuCtrl', function ($rootScope, $scope, APIServ) {
        $rS['configuracaoMenus'] = {
            'acoes': {
                'Cadastrar': {},
                'Alterar': {},
                "Excluir": {},
                "botaoAcoesPadrao": {}
            }
        };

        $scope.adicionarAcoesPadrao = function () {
            var acoes = {
                'Cadastrar': {
                    acao: 'Cadastrar'
                },
                'Alterar': {
                    acao: 'Alterar'
                },
                'Excluir': {
                    acao: 'Excluir'
                }
            };
            var obj = this;
            angular.forEach(acoes, function (acao, keyA) {
                $scope.adicionarItemRepeticao('bloco_1_0', obj, acao);
            });
        }
    })
    .controller('backupCtrl', function ($scope, APIServ) {
        $scope.fazerBackupBase = function () {
            window.open('./api/backup/fazerBackupBase/*', '_blank');
        }
    })
