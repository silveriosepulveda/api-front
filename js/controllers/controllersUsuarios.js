angular
    .module("app.controllersUsuarios", [])
    .filter("toArray", function () {
        return function (obj) {
            if (!obj || typeof obj !== "object") return [];''
            if (Array.isArray(obj)) return obj;

            return Object.keys(obj).map(function (key) {
                var item = obj[key];
                if (typeof item === "object" && item !== null) {
                    return Object.defineProperty(item, "$key", {
                        __proto__: null,
                        value: key,
                        enumerable: false,
                        writable: false,
                    });
                }
                return item;
            });
        };
    })
    .controller("usuarioCtrl", function ($rootScope, $scope, APIServ, $http) {
        $scope.abrirAlterarSenha = (item) => {            
            item.alterarSenha = !item.alterarSenha;
        };

        $scope.buscarUsuarios = function () {        
            APIServ.executaFuncaoClasse("usuarios", "buscarUsuariosExibirPerfil", "*").success(function (data) {
                //console.log("usuario", data);

                $scope.usuarios = data;
                // Inicializa a lista filtrada com todos os usuários
                $scope.inicializarListaFiltrada();
            });
        };

        // Funções para o select editável
        $scope.keyUsuario = "";
        $scope.mostrarListaUsuarios = false;
        $scope.usuariosFiltrados = [];

        $scope.limparUsuario = function () {
            $scope.isUpdatingList = true;
            $scope.keyUsuario = "";
            $scope.limparMenus();
            $scope.chave_usuario = null;
            $scope.isUpdatingList = false;
        };

        // Função para inicializar a lista filtrada
        $scope.inicializarListaFiltrada = function () {
            $scope.usuariosFiltrados = [];

            // Verificar se $scope.usuarios é um array ou objeto
            if (Array.isArray($scope.usuarios)) {
                
                angular.forEach($scope.usuarios, function (usuario, index) {                    
                    var usuarioComChave = angular.copy(usuario);
                    usuarioComChave.chaveOriginal = index;
                    $scope.usuariosFiltrados.push(usuarioComChave);
                });
            } else if ($scope.usuarios && typeof $scope.usuarios === "object") {
                // Se for um objeto, usar as chaves como índices
                angular.forEach($scope.usuarios, function (usuario, key) {
                    var usuarioComChave = angular.copy(usuario);
                    usuarioComChave.chaveOriginal = key;
                    $scope.usuariosFiltrados.push(usuarioComChave);
                });
            }

            console.log($scope.usuariosFiltrados);
        };

        // Flag para evitar ciclos no $watch
        $scope.isUpdatingList = false;

        // Watch para filtrar usuários quando o texto muda
        $scope.$watch("keyUsuario", function (newValue, oldValue) {
            if (newValue !== oldValue && $scope.usuarios && !$scope.isUpdatingList) {
                $scope.filtrarUsuarios();
            }
        });

        $scope.filtrarUsuarios = function () {
            if (!$scope.usuarios) return;

            $scope.isUpdatingList = true;

            if (!$scope.keyUsuario || $scope.keyUsuario.length === 0) {
                // Quando não há filtro, mostra todos os usuários
                $scope.usuariosFiltrados = [];

                if (Array.isArray($scope.usuarios)) {
                    angular.forEach($scope.usuarios, function (usuario, index) {
                        var usuarioComChave = angular.copy(usuario);
                        usuarioComChave.chaveOriginal = index;
                        $scope.usuariosFiltrados.push(usuarioComChave);
                    });
                } else if ($scope.usuarios && typeof $scope.usuarios === "object") {
                    angular.forEach($scope.usuarios, function (usuario, key) {
                        var usuarioComChave = angular.copy(usuario);
                        usuarioComChave.chaveOriginal = key;
                        $scope.usuariosFiltrados.push(usuarioComChave);
                    });
                }
            } else {
                $scope.usuariosFiltrados = [];

                if (Array.isArray($scope.usuarios)) {
                    angular.forEach($scope.usuarios, function (usuario, index) {
                        var textoCompleto = (usuario.nome + " " + usuario.login).toLowerCase();
                        if (textoCompleto.indexOf($scope.keyUsuario.toLowerCase()) !== -1) {
                            // Adicionar o usuário com sua chave original preservada
                            var usuarioComChave = angular.copy(usuario);
                            usuarioComChave.chaveOriginal = index;
                            $scope.usuariosFiltrados.push(usuarioComChave);
                        }
                    });
                } else if ($scope.usuarios && typeof $scope.usuarios === "object") {
                    angular.forEach($scope.usuarios, function (usuario, key) {
                        var textoCompleto = (usuario.nome + " " + usuario.login).toLowerCase();
                        if (textoCompleto.indexOf($scope.keyUsuario.toLowerCase()) !== -1) {
                            // Adicionar o usuário com sua chave original preservada
                            var usuarioComChave = angular.copy(usuario);
                            usuarioComChave.chaveOriginal = key;
                            $scope.usuariosFiltrados.push(usuarioComChave);
                        }
                    });
                }
            }

            $scope.isUpdatingList = false;
        };

        $scope.selecionarUsuario = function (index, usuario) {
            $scope.isUpdatingList = true;
            $scope.keyUsuario = usuario.nome + " -- " + usuario.login;
            // Usar a chave original se disponível, senão usar o índice
            var chaveUsuario = usuario.chaveOriginal !== undefined ? usuario.chaveOriginal : index;
            $scope.keyUsuarioIndex = chaveUsuario; // Mantém o índice numérico
            $scope.mostrarListaUsuarios = false;
            //$scope.verUsuario(index);

            // Usar a chave original para buscar o usuário correto
            var usuarioOriginal = $scope.usuarios[chaveUsuario];
            if (usuarioOriginal) {
                $scope.chave_usuario = usuarioOriginal.chave_usuario || usuarioOriginal.chave_usuario;
                $scope.chave_perfil_padrao = usuarioOriginal.chave_perfil_padrao;
                $scope.buscarPerfilUsuario(usuario);
            }
            $scope.isUpdatingList = false;
        };

        $scope.aoFocarCampo = function () {
            $scope.mostrarListaUsuarios = true;
            if (!$scope.keyUsuario && $scope.usuarios && $scope.usuariosFiltrados.length === 0) {
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
        };

        $scope.mudarTelaPerfilPadaro = function () {
            $scope.cadastro = !$scope.cadastro;
            $scope.menus.novoPerfil = "";
            $scope.menus.chave_perfil_padrao = 0;
            $scope.limparMenus();
        };

        $scope.limparMenus = function () {
            angular.forEach($scope.menus, function (menu) {
                menu.selecionado = false;
                angular.forEach(menu["itens"], function (item) {
                    item.selecionado = false;
                    angular.forEach(item["acoes"], function (acao) {
                        acao.selecionado = false;
                    });
                    angular.forEach(item["campos"], function (campo) {
                        campo.selecionado = false;
                    });
                });
            });
        };

        $scope.buscarPerfisPadrao = function () {
            $scope.cadastro = false;

            var filtros = {
                tabela: "usuarios_perfil_padrao",
                campo_chave: "chave_usuario_padrao",
                campos: ["chave_perfil_padrao", "nome_perfil"],
            };

            APIServ.executaFuncaoClasse("classeGeral", "consulta", filtros).success(function (data) {
                console.log(data.lista);

                $scope.perfisPadrao = data.lista;
            });
        };

        $scope.buscarPerfilPadrao = function (chave_perfil_padrao) {
            $scope.limparMenus();
            //$scope.buscarPerfilUsuario();

            APIServ.executaFuncaoClasse("usuarios", "buscarPerfilPadrao", $scope.chave_perfil_padrao).success(function (retorno) {
                angular.forEach(retorno, function (perfilPadrao) {
                    $scope.perfilPadrao = retorno;
                    var pp = perfilPadrao;
                    angular.forEach($scope.menus, function (menu) {
                        if (menu.chave_menu == pp.chave_menu) {
                            menu.selecionado = true;
                            menu.padrao = true;
                            angular.forEach(menu.itens, function (item) {
                                if (item.chave_item == pp.chave_item) {
                                    item.selecionado = true;
                                    item.padrao = true;
                                    angular.forEach(item.acoes, function (acao) {
                                        if (acao.chave_acao == pp.chave_acao) {
                                            acao.selecionado = true;
                                            acao.padrao = true;
                                        }
                                    });

                                    angular.forEach(item.campos, function (campo) {
                                        if (campo.chave_campo == pp.chave_campo) {
                                            campo.selecionado = true;
                                            campo.padrao = true;
                                        }
                                    });
                                }
                            });
                        }
                    });
                });
            });
        };

        $scope.excluirPerfilPadrao = function () {
            funcaoSim = function () {
                APIServ.executaFuncaoClasse("usuarios", "excluirPerfilPadrao", $scope.chave_perfil_padrao).success(function (retorno) {
                    if (retorno.sucesso != undefined) {
                        $scope.buscarPerfisPadrao();
                        $scope.limparMenus();
                    }
                });
            };

            APIServ.dialogoSimples("Informação!", "Esta ação exclui o Perfil Padrão. Continuar?", "Sim", "Não", funcaoSim);
        };

        $scope.salvarPerfilPadrao = function (perfil) {
            var p = perfil;
            $rootScope.carregando = true;
            if (p.chave_perfil_padrao == undefined && p.novoPerfil == undefined) {
                APIServ.mensagemSimples("Solicitação", "Defina o Perfil ou o nome do Novo Perfil");
            } else {
                var fd = new FormData();
                fd.append("menus", JSON.stringify($scope.menus));

                console.log($scope.menus.novoPerfil);

                fd.append("novoPerfil", JSON.stringify($scope.menus.novoPerfil));
                fd.append("chave_perfil_padrao", $scope.chave_perfil_padrao);

                //  $rS.carregando = true;

                APIServ.executaFuncaoClasse("usuarios", "salvarPerfilPadrao", fd, "post").success((retorno) => {
                    $rootScope.carregando = false;
                    if (retorno.sucesso != undefined) {
                        //$scope.buscarPerfisPadrao();
                       // $scope.limparMenus();
                        APIServ.mensagemSimples("Confirmação", "Perfil Salvo com Sucesso!");
                    }
                });
            }
        };

        $scope.salvarPerfilUsuario = function () {
            if ($scope.chave_usuario == undefined || !$scope.chave_usuario > 0) {
                APIServ.mensagemSimples("Solicitação", "Defina o Usuário");
            } else {
                var fd = new FormData();
                console.log($scope.menus);
                fd.append("menus", angular.toJson($scope.menus));
                fd.append("chave_usuario", $scope.usuarios[$scope.keyUsuarioIndex]["chave_usuario"]);
                fd.append("chave_perfil_padrao", $scope.chave_perfil_padrao);
                if($scope.usuarios[$scope.keyUsuarioIndex]["tipo_usuario"] != undefined) 
                    fd.append("tipo_usuario", $scope.usuarios[$scope.keyUsuarioIndex]["tipo_usuario"]);
                //$rS.carregando = true;
                APIServ.executaFuncaoClasse("usuarios", "salvarPerfilUsuario", fd, "post").success(function (retorno) {
                    if (retorno.sucesso != undefined) {
                        APIServ.mensagemSimples("Confirmação", "Perfil Salvo com Sucesso!");
                    }

                    $rS.carregando = false;
                });
            }
        };

        $scope.buscarMenusConfiguracoes = function () {
            APIServ.executaFuncaoClasse("usuarios", "buscarMenusConfiguracoes", "*").success(function (retorno) {
                $scope.menus = retorno;
                $scope.menus["novoPerfil"] = "";
                // Aguardar o próximo digest cycle para garantir que os dados estejam no DOM
                $scope.$evalAsync(function () {
                    $scope.inicializarArvoreMenus();
                });
            });
        };

        var desvincularPerfilPadrao = async () => {
            return new Promise((resolve) => {
                if ($scope.chave_perfil_padrao > 0) {
                    var funcaoSim = () => {
                        $scope.chave_perfil_padrao = null;
                        resolve(true);
                    };

                    var funcaoNao = () => {
                        resolve(false);
                    };
                    APIServ.dialogoSimples("Informação!", "Esta ação desvincula o Perfil Padrão. Continuar?", "Sim", "Não", funcaoSim, funcaoNao);
                }
            });
        };

        $scope.alterarPerfilTela = async function (keyM, keyI, keyA) {
            if (keyA != undefined) {
                var selecionado = $scope.menus[keyM]["itens"][keyI]["acoes"][keyA]["selecionado"];

                if (selecionado) {
                    $scope.menus[keyM]["selecionado"] = true;
                    $scope.menus[keyM]["itens"][keyI]["selecionado"] = true;
                }
            } else if (keyI != undefined) {
                var selecionado = $scope.menus[keyM]["itens"][keyI]["selecionado"];
                if (selecionado) {
                    $scope.menus[keyM]["selecionado"] = true;
                }
                angular.forEach($scope.menus[keyM]["itens"][keyI]["acoes"], function (acao, keyAcao) {
                    acao["selecionado"] = selecionado;
                });
            } else {
                var selecionado = $scope.menus[keyM]["selecionado"];
                angular.forEach($scope.menus[keyM]["itens"], function (item, keyItem) {
                    item["selecionado"] = selecionado;
                    angular.forEach(item["acoes"], function (acao, keyAcao) {
                        acao["selecionado"] = selecionado;
                    });
                });
            }

            //*/
        };

        $scope.buscarPerfilUsuario = function (usuario) {
            $scope.limparMenus();
            if (usuario.chave_usuario >= 0) {
                const parametros = {
                    chave_usuario: usuario.chave_usuario,
                    tipo_usuario: usuario.tipo_usuario,
                }
                APIServ.executaFuncaoClasse("usuarios", "buscarPerfilUsuario", parametros).success(function (retorno) {
                    console.log(retorno);

                    angular.forEach(retorno, function (perfilPadrao) {
                        var pp = perfilPadrao;
                        angular.forEach($scope.menus, function (menu) {
                            if (menu.chave_menu == pp.chave_menu) {
                                menu.selecionado = true;
                                menu.tipo_perfil = menu.tipo_perfil != "Padrao" ? pp.tipo_perfil : menu.tipo_perfil;

                                angular.forEach(menu.itens, function (item) {
                                    if (item.chave_item == pp.chave_item) {
                                        item.selecionado = true;
                                        item.tipo_perfil = item.tipo_perfil != "Padrao" ? pp.tipo_perfil : item.tipo_perfil;

                                        angular.forEach(item.acoes, function (acao) {
                                            if (acao.chave_acao == pp.chave_acao) {
                                                acao.selecionado = true;
                                                acao.tipo_perfil = acao.tipo_perfil != "Padrao" ? pp.tipo_perfil : acao.tipo_perfil;
                                            }
                                        });

                                        angular.forEach(item.campos, function (campo) {
                                            if (campo.chave_campo == pp.chave_campo) {
                                                campo.selecionado = true;
                                                campo.padrao = true;
                                                campo.tipo_perfil = campo.tipo_perfil != "Padrao" ? pp.tipo_perfil : campo.tipo_perfil;
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    });
                });
            }
        };

        $scope.montaTelaAlteracaoSenha = function () {
            $scope.usuarioAlterarSenha = APIServ.buscaDadosLocais("usuario");
        };

        $scope.alterarSenha = function () {
            var fd = new FormData();
            $scope.usuarioAlterarSenha;            
            fd.append("dados", angular.toJson($scope.usuarioAlterarSenha));

            // $rS.carregando = true;
            APIServ.executaFuncaoClasse("usuarios", "alterarSenha", fd, "post").success(function (retorno) {
                $rS.carregando = false;
                if (retorno.chave >= 0) {
                    APIServ.mensagemSimples("Confirmação", "Senha Alterada.");
                } else {
                    APIServ.mensagemSimples("Informação", "Erro ao Alterar Senha!");
                }
            });
        };

        // Função helper para verificar se objeto tem elementos
        $scope.temElementos = function (obj) {
            if (!obj || typeof obj !== "object") return false;
            return Object.keys(obj).length > 0;
        };

        // Funções para a árvore de menus
        $scope.filtroArvoreMenus = "";

        $scope.inicializarArvoreMenus = function () {
            if ($scope.menus) {
                angular.forEach($scope.menus, function (menu, keyM) {
                    menu.expanded = true; // Inicia expandido
                    if (menu.itens) {
                        angular.forEach(menu.itens, function (item, keyI) {
                            item.expanded = true; // Inicia expandido
                        });
                    }
                });
            }
        };

       
    })
    .directive("alterarSenha", [
        "$compile",
        "APIServ",
        function ($compile, APIServ) {
            return {
                restrict: "E",
                template: "<></>",
                link: function (scope, elem) {
                    const item = scope.$parent.$parent.item;
                    const nomeForm = `formAltSenha${item.chave_cadastro}`;
                    let html = `
                    <div class="col-xs-12">
                        <form class="row" name="${nomeForm}" ng-submit="${nomeForm}.$valid && alterarSenhaLocal()" novalidate valida-Formulario>
                            <div class="col-md-6 form-group">
                                <label>Digite a Nova Senha</label>
                                <input type="password" name="senha" id="senha" ng-model="senhaLocal" class="form-control" required>
                            </div>
                            <div class="col-md-6 form-group">
                                <label>Confirme a Nova Senha</label>
                                <input type="password" name="confirmaSenha" id="confirmaSenha" ng-model="confirmaSenhaLocal" class="form-control" required igual="senha-Senha" equalTo>
                            </div>
                            <button type="submit" class="btn btn-primary col-xs-12">Alterar Senha</button>
                        </form>
                    </div>
            `;

                    scope.alterarSenhaLocal = function () {
                        if (scope.senhaLocal == scope.confirmaSenhaLocal) {
                            const temp = new FormData();
                            temp.append("dados", JSON.stringify( {
                                chave_usuario: item.chave_usuario,
                                senha: scope.senhaLocal,
                            }));

                            APIServ.executaFuncaoClasse("usuarios", "alterarSenha", temp, "post").success(function (retorno) {
                                if (retorno.sucesso && retorno.sucesso > 0) {
                                    item.alterarSenha = false;
                                    APIServ.mensagemSimples("Confirmação", "Senha Alterada.");
                                } else {
                                    APIServ.mensagemSimples("Informação", "Erro ao Alterar Senha!");
                                }
                            });
                        } else {
                            APIServ.mensagemSimples("Informação", "As senhas não conferem!");
                        }
                    };

                    elem.html(html);
                    $compile(elem.contents())(scope);
                },
            };
        },
    ]);
