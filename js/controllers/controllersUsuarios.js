angular.module('app.controllersUsuarios', [])
    .filter('toArray', function() {
        return function(obj) {
            if (!obj || typeof obj !== 'object') return [];
            if (Array.isArray(obj)) return obj;
            
            return Object.keys(obj).map(function(key) {
                var item = obj[key];
                if (typeof item === 'object' && item !== null) {
                    return Object.defineProperty(item, '$key', {
                        __proto__: null, 
                        value: key,
                        enumerable: false,
                        writable: false
                    });
                }
                return item;
            });
        };
    })
    .controller('usuarioCtrl', function ($rootScope, $scope, APIServ, $http) {
        $scope.sair = () => {
            APIServ.apagaDadosLocais('usuario');
            APIServ.apagaDadosLocais('menuPainel');
            window.location = './?sair';
        }

        $scope.logarUsuario = function (dados) {
            $scope.usuario = {};
            var parametros = {
                'login': dados.login,
                'senha': dados.senha
            }

            APIServ.executaFuncaoClasse('usuarios', 'logarUsuario', parametros).success(function (data) {
                if (data.usuario.chave_usuario != undefined && parseInt(data.usuario.chave_usuario) >= 0) {
                    APIServ.salvaDadosLocais('usuario', data.usuario);
                    APIServ.salvaDadosLocais('menuPainel', data.menus);
                    window.location.reload();
                } else if (data.usuario.chave_usuario < 0) {
                    $scope.loginInvalido = true;
                }
            });
        };

        $scope.buscarUsuarios = function () {
            var filtro = [
                {
                    campo: 'chave_usuario',
                    operador: '>',
                    valor: '0'
                },
                // {
                //     campo: 'usuario_sistema',
                //     operador: '=',
                //     valor: 'S'
                // }

            ];

            var filtros = {
                tabela: 'usuarios',
                filtros: filtro,
                campo_chave: 'chave_usuario',
                campos: ['nome', 'administrador', 'login', 'tipo_usuario', 'chave_empresa', 'chave_perfil_padrao'],
                ordemFiltro: 'nome'
            }

            APIServ.executaFuncaoClasse('classeGeral', 'consulta', filtros).success(function (data) {
                console.log(data);

                $scope.usuarios = data.lista;
                // Inicializa a lista filtrada com todos os usuários
                $scope.inicializarListaFiltrada();
            });
        }

        // Funções para o select editável
        $scope.keyUsuario = '';
        $scope.mostrarListaUsuarios = false;
        $scope.usuariosFiltrados = [];

        $scope.limparUsuario = function () {
            $scope.keyUsuario = '';
            $scope.limparMenus();
            $scope.chave_usuario = null;
        }

        // Função para inicializar a lista filtrada
        $scope.inicializarListaFiltrada = function () {
            $scope.usuariosFiltrados = [];
            angular.forEach($scope.usuarios, function (usuario, key) {
                var usuarioComChave = angular.copy(usuario);
                usuarioComChave.chaveOriginal = key;
                $scope.usuariosFiltrados.push(usuarioComChave);
            });
        };

        // Watch para filtrar usuários quando o texto muda
        $scope.$watch('keyUsuario', function (newValue, oldValue) {
            if (newValue !== oldValue && $scope.usuarios) {
                $scope.filtrarUsuarios();
            }
        });

        $scope.filtrarUsuarios = function () {
            if (!$scope.usuarios) return;

            if (!$scope.keyUsuario || $scope.keyUsuario.length === 0) {
                // Quando não há filtro, mostra todos os usuários
                $scope.inicializarListaFiltrada();
            } else {
                $scope.usuariosFiltrados = [];
                angular.forEach($scope.usuarios, function (usuario, key) {
                    var textoCompleto = (usuario.nome + ' ' + usuario.login).toLowerCase();
                    if (textoCompleto.indexOf($scope.keyUsuario.toLowerCase()) !== -1) {
                        // Adicionar o usuário com sua chave original preservada
                        var usuarioComChave = angular.copy(usuario);
                        usuarioComChave.chaveOriginal = key;
                        $scope.usuariosFiltrados.push(usuarioComChave);
                    }
                });
            }
        };

        $scope.selecionarUsuario = function (index, usuario) {
            $scope.keyUsuario = usuario.nome + ' -- ' + usuario.login;
            // Usar a chave original se disponível, senão usar o índice
            var chaveUsuario = usuario.chaveOriginal !== undefined ? usuario.chaveOriginal : index;
            $scope.keyUsuarioIndex = chaveUsuario; // Mantém o índice numérico
            $scope.mostrarListaUsuarios = false;
            //$scope.verUsuario(index);

            var usuario = $scope.usuarios[index];
            $scope.chave_usuario = usuario.chave_usuario || usuario.chave_usuario;
            $scope.chave_perfil_padrao = usuario.chave_perfil_padrao;            
            $scope.buscarPerfilUsuario();
        };

        $scope.aoFocarCampo = function () {
            $scope.mostrarListaUsuarios = true;
            if (!$scope.keyUsuario) {
                $scope.inicializarListaFiltrada();
            }
        };

        $scope.ocultarListaUsuarios = function () {
            // Delay para permitir clique nos itens da lista
            setTimeout(function () {
                $scope.mostrarListaUsuarios = false;
                $scope.$apply();
            }, 200);
        };

        $scope.verUsuario = function (key) {
            var usuario = $scope.usuarios[key];
            $scope.chave_usuario = usuario.chave_usuario || usuario.chave_usuario;
            $scope.chave_perfil_padrao = usuario.chave_perfil_padrao;
            // if (usuario.chave_perfil_padrao > 0) {
            //     $scope.buscarPerfilPadrao();
            // }
            $scope.buscarPerfilUsuario();
        }

        $scope.mudarTelaPerfilPadaro = function () {
            $scope.cadastro = !$scope.cadastro;
            $scope.menus.novoPerfil = '';
            $scope.menus.chave_perfil_padrao = 0;
            $scope.limparMenus();
        }

        $scope.limparMenus = function () {
            angular.forEach($scope.menus, function (menu) {
                menu.selecionado = false;
                angular.forEach(menu['itens'], function (item) {
                    item.selecionado = false;
                    angular.forEach(item['acoes'], function (acao) {
                        acao.selecionado = false;
                    });
                    angular.forEach(item['campos'], function (campo) {
                        campo.selecionado = false;
                    })
                })
            })
        }

        $scope.buscarPerfisPadrao = function () {
            $scope.cadastro = false;

            var filtros = {
                tabela: 'usuarios_perfil_padrao',
                campo_chave: 'chave_usuario_padrao',
                campos: ['chave_perfil_padrao', 'nome_perfil'],
            }

            APIServ.executaFuncaoClasse('classeGeral', 'consulta', filtros).success(function (data) {
                $scope.perfisPadrao = data.lista;
            })
        }

        $scope.buscarPerfilPadrao = function (chave_perfil_padrao) {
            $scope.limparMenus();
            //$scope.buscarPerfilUsuario();

            APIServ.executaFuncaoClasse('usuarios', 'buscarPerfilPadrao', $scope.chave_perfil_padrao).success(function (retorno) {
                angular.forEach(retorno, function (perfilPadrao) {
                    $scope.perfilPadrao = retorno;
                    var pp = perfilPadrao;
                    angular.forEach($scope.menus, function (menu) {
                        if (menu.chave_menu == pp.chave_menu) {
                            menu.selecionado = true;
                            menu.padrao = true
                            angular.forEach(menu.itens, function (item) {
                                if (item.chave_item == pp.chave_item) {
                                    item.selecionado = true;
                                    item.padrao = true;
                                    angular.forEach(item.acoes, function (acao) {
                                        if (acao.chave_acao == pp.chave_acao) {
                                            acao.selecionado = true;
                                            acao.padrao = true;
                                        }
                                    })

                                    angular.forEach(item.campos, function (campo) {
                                        if (campo.chave_campo == pp.chave_campo) {
                                            campo.selecionado = true;
                                            campo.padrao = true;
                                        }
                                    })
                                }
                            })
                        }
                    })
                })
            })
        }

        $scope.salvarPerfilPadrao = function (perfil) {
            var p = perfil;
            if (p.chave_perfil_padrao == undefined && p.novoPerfil == undefined) {
                APIServ.mensagemSimples('Solicitação', 'Defina o Perfil ou o nome do Novo Perfil');
            } else {
                var fd = new FormData();
                fd.append('menus', JSON.stringify($scope.menus));

                console.log($scope.menus.novoPerfil);

                fd.append('novoPerfil', JSON.stringify($scope.menus.novoPerfil));
                fd.append('chave_perfil_padrao', $scope.chave_perfil_padrao);

                $rS.carregando = true;

                APIServ.executaFuncaoClasse('usuarios', 'salvarPerfilPadrao', fd, 'post').success(retorno => {
                    console.log(retorno);

                    $rS.carregando = false;
                })
            }
        }

        $scope.salvarPerfilUsuario = function () {
            if ($scope.chave_usuario == undefined || !$scope.chave_usuario > 0) {
                APIServ.mensagemSimples('Solicitação', 'Defina o Usuário');
            } else {
                var fd = new FormData();
                fd.append('menus', angular.toJson($scope.menus));
                fd.append('chave_usuario', $scope.usuarios[$scope.keyUsuarioIndex]['chave_usuario']);
                fd.append('chave_perfil_padrao', $scope.chave_perfil_padrao);
                $rS.carregando = true;
                APIServ.executaFuncaoClasse('usuarios', 'salvarPerfilUsuario', fd, 'post').success(function (retorno) {
                    console.log(retorno);

                    $rS.carregando = false;
                })
            }
        }

        $scope.buscarMenusConfiguracoes = function () {
            APIServ.executaFuncaoClasse('usuarios', 'buscarMenusConfiguracoes', '*').success(function (retorno) {
                $scope.menus = retorno;
                $scope.menus['novoPerfil'] = '';
                // Aguardar o próximo digest cycle para garantir que os dados estejam no DOM
                $scope.$evalAsync(function() {
                    $scope.inicializarArvoreMenus();
                });
            })
        }

        var desvincularPerfilPadrao = () => {
            return new Promise((resolve) => {
                if ($scope.chave_perfil_padrao > 0) {
                    var funcaoSim = () => {
                        $scope.chave_perfil_padrao = null;
                        resolve(true);
                    }

                    var funcaoNao = () => {
                        resolve(false);
                    }
                    APIServ.dialogoSimples('Informação!', 'Esta ação desvincula o Perfil Padrão. Continuar?', 'Sim', 'Não', funcaoSim, funcaoNao);
                }
            })
        };

        $scope.alterarPerfilTela = function (keyM, keyI, keyA) {
            if (keyA != undefined) {
                var selecionado = $scope.menus[keyM]['itens'][keyI]['acoes'][keyA]['selecionado'];
                if (selecionado) {
                    $scope.menus[keyM]['selecionado'] = true;
                    $scope.menus[keyM]['itens'][keyI]['selecionado'] = true;
                } else {
                    if ($scope.menus[keyM]['itens'][keyI]['padrao']) {
                        desvincularPerfilPadrao().then(retorno => {
                            if (!retorno) {
                                $scope.menus[keyM]['selecionado'] = true;
                                $scope.menus[keyM]['itens'][keyI]['selecionado'] = true;
                                $scope.menus[keyM]['itens'][keyI]['acoes'][keyA]['selecionado'] = true;
                                $scope.$apply();
                            }
                        });
                    }
                }
            } else if (keyI != undefined) {
                var selecionado = $scope.menus[keyM]['itens'][keyI]['selecionado'];
                if (selecionado) {
                    $scope.menus[keyM]['selecionado'] = true;
                }
                angular.forEach($scope.menus[keyM]['itens'][keyI]['acoes'], function (acao, keyAcao) {
                    acao['selecionado'] = selecionado;
                })
            } else {
                var selecionado = $scope.menus[keyM]['selecionado'];
                angular.forEach($scope.menus[keyM]['itens'], function (item, keyItem) {
                    item['selecionado'] = selecionado;
                    angular.forEach(item['acoes'], function (acao, keyAcao) {
                        acao['selecionado'] = selecionado;
                    });
                })
            }
        }

        $scope.buscarPerfilUsuario = function () {
            $scope.limparMenus();
            if ($scope.chave_usuario >= 0) {
                APIServ.executaFuncaoClasse('usuarios', 'buscarPerfilUsuario', $scope.chave_usuario).success(function (retorno) {
                    console.log(retorno);

                    angular.forEach(retorno, function (perfilPadrao) {
                        var pp = perfilPadrao;
                        angular.forEach($scope.menus, function (menu) {
                            if (menu.chave_menu == pp.chave_menu) {
                                menu.selecionado = true;
                                angular.forEach(menu.itens, function (item) {
                                    if (item.chave_item == pp.chave_item) {
                                        item.selecionado = true;

                                        angular.forEach(item.acoes, function (acao) {
                                            if (acao.chave_acao == pp.chave_acao) {
                                                acao.selecionado = true;
                                            }
                                        })

                                        angular.forEach(item.campos, function (campo) {
                                            if (campo.chave_campo == pp.chave_campo) {
                                                campo.selecionado = true;
                                                campo.padrao = true;
                                            }
                                        })
                                    }
                                })
                            }
                        })

                    })
                })
            }
        }

        $scope.montaTelaAlteracaoSenha = function () {
            $scope.usuarioAlterarSenha = APIServ.buscaDadosLocais('usuario');
        }

        $scope.alterarSenha = function () {
            var fd = new FormData();
            fd.append('dados', angular.toJson($scope.usuarioAlterarSenha));

            $rS.carregando = true;
            $http.post('api/manipulaTabela/usuarios/alterarSenha', fd, {
                transformRequest: angular.identity,
                headers: {
                    'Content-Type': undefined
                }
            }).success(function (retorno) {
                $rS.carregando = false;
                if (retorno.chave >= 0) {
                    APIServ.mensagemSimples('Confirmação', 'Senha Alterada.');
                } else {
                    APIServ.mensagemSimples('Informação', 'Erro ao Alterar Senha!')
                }
            })
        }

        // Função helper para verificar se objeto tem elementos
        $scope.temElementos = function(obj) {
            if (!obj || typeof obj !== 'object') return false;
            return Object.keys(obj).length > 0;
        };

        // Funções para a árvore de menus
        $scope.filtroArvoreMenus = '';

        $scope.inicializarArvoreMenus = function() {
            if ($scope.menus) {
                angular.forEach($scope.menus, function(menu, keyM) {
                    menu.expanded = true; // Inicia expandido
                    if (menu.itens) {
                        angular.forEach(menu.itens, function(item, keyI) {
                            item.expanded = true; // Inicia expandido
                        });
                    }
                });
            }
        };

        $scope.toggleMenu = function(keyM) {
            if ($scope.menus && $scope.menus[keyM]) {
                $scope.menus[keyM].expanded = !$scope.menus[keyM].expanded;
            }
        };

        $scope.toggleItem = function(keyM, keyI) {
            if ($scope.menus && $scope.menus[keyM] && $scope.menus[keyM].itens && $scope.menus[keyM].itens[keyI]) {
                $scope.menus[keyM].itens[keyI].expanded = !$scope.menus[keyM].itens[keyI].expanded;
            }
        };

        $scope.expandirTodos = function() {
            if ($scope.menus) {
                angular.forEach($scope.menus, function(menu, keyM) {
                    menu.expanded = true;
                    if (menu.itens) {
                        angular.forEach(menu.itens, function(item, keyI) {
                            item.expanded = true;
                        });
                    }
                });
            }
        };

        $scope.colapsarTodos = function() {
            if ($scope.menus) {
                angular.forEach($scope.menus, function(menu, keyM) {
                    menu.expanded = false;
                    if (menu.itens) {
                        angular.forEach(menu.itens, function(item, keyI) {
                            item.expanded = false;
                        });
                    }
                });
            }
        };

        $scope.filtrarArvoreMenus = function(menu) {
            if (!$scope.filtroArvoreMenus) return true;
            
            var filtro = $scope.filtroArvoreMenus.toLowerCase();
            
            // Buscar no nome do menu
            if (menu.menu && menu.menu.toLowerCase().indexOf(filtro) !== -1) {
                return true;
            }
            
            // Buscar nos itens
            if (menu.itens) {
                for (var keyI in menu.itens) {
                    var item = menu.itens[keyI];
                    if (item.item && item.item.toLowerCase().indexOf(filtro) !== -1) {
                        return true;
                    }
                    
                    // Buscar nas ações
                    if (item.acoes) {
                        for (var keyA in item.acoes) {
                            var acao = item.acoes[keyA];
                            if (acao.acao && acao.acao.toLowerCase().indexOf(filtro) !== -1) {
                                return true;
                            }
                        }
                    }
                    
                    // Buscar nos campos
                    if (item.campos) {
                        for (var keyC in item.campos) {
                            var campo = item.campos[keyC];
                            if (campo.titulo_campo && campo.titulo_campo.toLowerCase().indexOf(filtro) !== -1) {
                                return true;
                            }
                        }
                    }
                }
            }
            
            return false;
        };

        $scope.contemFiltro = function(texto) {
            if (!$scope.filtroArvoreMenus || !texto) return false;
            return texto.toLowerCase().indexOf($scope.filtroArvoreMenus.toLowerCase()) !== -1;
        };

        $scope.limparFiltroArvore = function() {
            $scope.filtroArvoreMenus = '';
        };

        // Watch para expandir automaticamente quando filtrar
        $scope.$watch('filtroArvoreMenus', function(newValue) {
            if (newValue && newValue.length > 0) {
                $scope.expandirTodos();
            }
        });
    })
