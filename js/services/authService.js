// Serviço de autenticação SPA
// Compatível com aplicação que cria variável 'app' em apiLocal/js/app.js

// Verifica se a variável 'app' já existe (aplicação principal)
if (typeof app !== 'undefined') {
    // Usa a variável 'app' existente da aplicação principal
    app.factory('AuthService', function ($http, $window, $rootScope, APIServ) {
        return {
            login: function (user, pass) {
                return new Promise(function (resolve) {
                    // Chame o endpoint de login do backend (exemplo: /api/login.php)
                    // O backend deve retornar { token: '...', usuario: {...} } em caso de sucesso

                    var parametros = {
                        'login': user,
                        'senha': pass
                    }

                    APIServ.executaFuncaoClasse('usuarios', 'logarUsuario', parametros).success(function (data) {
                        if (data.usuario.token) {
                            //$window.localStorage.setItem('token', data.usuario.token);
                            $window.localStorage.setItem('usuario', JSON.stringify(data.usuario));
                            $window.localStorage.setItem('menuPainel', JSON.stringify(data.menus));
                            
                            // Notificar outros controllers sobre o login bem-sucedido
                            $rootScope.$broadcast('usuarioLogado', data.usuario);
                            
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    }).error(function() {
                        resolve(false);
                    });
                });
            },
            isAuthenticated: function () {
                return !!$window.localStorage.getItem('usuario');
            },
            logout: function () {
                $window.localStorage.removeItem('menuPainel');
                $window.localStorage.removeItem('token');
                $window.localStorage.removeItem('usuario');
            },
            getUsuario: function () {
                try {
                    const usuario = $window.localStorage.getItem('usuario');
                    return usuario ? JSON.parse(usuario) : null;
                } catch (e) {
                    console.error('Erro ao parsear dados do usuário:', e);
                    return null;
                }
            }
        };
    });
} else {
    // Cria um módulo independente se a variável 'app' não existir
    angular.module('authService', [])
        .factory('AuthService', function ($http, $window, $rootScope, APIServ) {
            return {
                login: function (user, pass) {
                    return new Promise(function (resolve) {
                        // Chame o endpoint de login do backend (exemplo: /api/login.php)
                        // O backend deve retornar { token: '...', usuario: {...} } em caso de sucesso

                        var parametros = {
                            'login': user,
                            'senha': pass
                        }

                        APIServ.executaFuncaoClasse('usuarios', 'logarUsuario', parametros).success(function (data) {
                            if (data.usuario.token) {
                                //$window.localStorage.setItem('token', data.usuario.token);
                                $window.localStorage.setItem('usuario', JSON.stringify(data.usuario));
                                $window.localStorage.setItem('menuPainel', JSON.stringify(data.menus));
                                
                                // Notificar outros controllers sobre o login bem-sucedido
                                $rootScope.$broadcast('usuarioLogado', data.usuario);
                                
                                resolve(true);
                            } else {
                                resolve(false);
                            }
                        }).error(function() {
                            resolve(false);
                        });
                    });
                },
                isAuthenticated: function () {
                    return !!$window.localStorage.getItem('usuario');
                },
                logout: function () {
                    $window.localStorage.removeItem('menuPainel');
                    $window.localStorage.removeItem('token');
                    $window.localStorage.removeItem('usuario');
                },
                getUsuario: function () {
                    try {
                        const usuario = $window.localStorage.getItem('usuario');
                        return usuario ? JSON.parse(usuario) : null;
                    } catch (e) {
                        console.error('Erro ao parsear dados do usuário:', e);
                        return null;
                    }
                }
            };
        });
}