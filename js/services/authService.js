// Serviço de autenticação SPA
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

                const fd = new FormData();
                fd.append('parametros', JSON.stringify(parametros));

                APIServ.executaFuncaoClasse('usuarios', 'logarUsuario', parametros).success(function (data) {
                    console.log(data);
                    $window.localStorage.setItem('sessionId', data.sessionId);
                    
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