// Configuração de rotas SPA com ocLazyLoad
app.config(function ($routeProvider) {

    $routeProvider
        .when('/login', {
            templateUrl: 'api/front/templates/login.html',
            controller: 'LoginCtrl'
        })
        .when('/inicio', {
            templateUrl: 'inicio.html',
            controller: 'inicioCtrl',
            resolve: {
                auth: ['AuthService', '$location', function (AuthService, $location) {
                    if (!AuthService.isAuthenticated()) {
                        $location.path('/login');
                    }
                }],
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    // Caminho relativo e serie: true para garantir ordem
                    return $ocLazyLoad.load({
                        files: ['js/inicio.js'],
                        serie: true
                    });
                }]
            }
        })
        .when('/usuarios/usuarios', {
            templateUrl: 'api/front/templates/usuarios.html',
            controller: 'usuarioCtrl',
        })
        .when('/usuarios/usuariosPerfil', {
            templateUrl: 'api/front/templates/usuariosPerfil.html',
            controller: 'usuarioCtrl',
        })
        .when('/listas/listas', {   
            templateUrl: 'api/front/templates/listas.html',
            controller: 'listaCtrl',            
        })
        .when('/sistema-empresas/empresasValoresExamesComp', {
            templateUrl: 'sistema/empresas/empresasValoresExamesComp.html',
            controller: 'empresaValoresExamesCompCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/empresas/empresasValoresExamesComp.js'
                    ]);
                }]
            }
        })
        .when('/sistema-empresas/funcoes', {
            templateUrl: 'sistema/empresas/funcoes.html',
            controller: 'funcaoCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/empresas/funcoes.js'
                    ]);
                }]
            }
        })
        .when('/sistema-empresas/setores', {
            templateUrl: 'sistema/empresas/setores.html',
            controller: 'setorCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/empresas/setores.js'
                    ]);
                }]
            }
        })
        .when('/sistema-empresas/configuracoesPCMSO', {
            templateUrl: 'sistema/empresas/configuracoesPCMSO.html',
            controller: 'configuracaoPCMSOCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'api/front/js/directives/estruturaBlocos.js',
                        'sistema/empresas/configuracoesPCMSO.js',                        
                        'sistema/empresas/css/pcmso.css'
                    ]);
                }]
            }
        })
        .when('/sistema-empresas/condicoesEspeciais', {
            templateUrl: 'sistema/empresas/condicoesEspeciais.html',
            controller: 'condicaoEspecialCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/empresas/condicoesEspeciais.js'
                    ]);
                }]
            }
        })
        .when('/sistema-empresas/configuracoesPadrao', {
            templateUrl: 'sistema/empresas/configuracoesPadrao.html',
            controller: 'configuracaoPadraoCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/empresas/configuracoesPadrao.js',
                        'api/front/js/directives/estruturaBlocos.js'
                    ]);
                }]
            }
        })
        .when('/sistema-empresas/empresasSetores', {
            templateUrl: 'sistema/empresas/empresasSetores.html',
            controller: 'empresaCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/empresas/empresas.js'
                    ]);
                }]
            }
        })
        .when('/sistema-empresas-bateriasExamesComp/bateriasExamesComp', {
            templateUrl: 'sistema/empresas/bateriasExamesComp/bateriasExamesComp.html',
            controller: 'bateriaExameCompCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/empresas/bateriasExamesComp/bateriasExamesComp.js',
                        'api/front/js/directives/estruturaBlocos.js'
                    ]);
                }]
            }
        })
        .when('/sistema-empresas/aptidoesEspeciais', {
            templateUrl: 'sistema/empresas/aptidoesEspeciais/aptidoesEspeciais.html',
            controller: 'aptidaoEspecialCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/empresas/aptidoesEspeciais/aptidoesEspeciais.js'
                    ]);
                }]
            }
        })
        .when('/sistema-empresas-grupos/empresasGrupos', {
            templateUrl: 'sistema/empresas/grupos/empresasGrupos.html',
            controller: 'empresaGrupoCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/empresas/grupos/empresasGrupos.js',
                        'api/front/js/directives/estruturaBlocos.js',
                        'api/front/js/directives/arquivosAnexos.js'
                    ]);
                }]
            }
        })
        .when('/sistema-empresas/secoesSetor', {
            templateUrl: 'sistema/empresas/secoesSetor.html',
            controller: 'secaoSetorCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/empresas/secoesSetor.js'
                    ]);
                }]
            }
        })
        .when('/sistema-empresas/empresas', {
            templateUrl: 'sistema/empresas/empresas.html',
            controller: 'empresaCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/empresas/empresas.js',
                        'sistema/empresas/empresas.css',
                        'api/front/js/directives/arquivosAnexos.js',
                        'api/front/js/directives/estruturaBlocos.js'
                    ]);
                }]
            }
        })
        .when('/sistema-empresas/cadastroAvulso', {
            templateUrl: 'sistema/empresas/cadastroAvulso.html',
            controller: 'colaboradoresCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/empresas/colaboradores/colaboradores.js'
                    ]);
                }]
            }
        })
        .when('/sistema-empresas-colaboradores/colaboradores', {
            templateUrl: 'sistema/empresas/colaboradores/colaboradores.html',
            controller: 'colaboradoresCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/empresas/colaboradores/colaboradores.js',
                        'api/front/js/directives/estruturaBlocos.js'
                    ]);
                }]
            }
        })
        .when('/sistema-empresas-servicos/servicosEmpresas', {
            templateUrl: 'sistema/empresas/servicos/servicosEmpresas.html',
            controller: 'empresaServicoCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/empresas/servicos/servicosEmpresas.js'
                    ]);
                }]
            }
        })
        .when('/sistema-exames/examesComp', {
            templateUrl: 'sistema/exames/examesComp.html',
            controller: 'exameCompCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'api/front/js/directives/estruturaBlocos.js',
                        'sistema/exames/examesComp.js'
                    ]);
                }]
            }
        })
        .when('/sistema-exames/examesCompTipo', {
            templateUrl: 'sistema/exames/examesCompTipo.html',
            controller: 'exameCompTipoCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/exames/examesCompTipo.js'
                    ]);
                }]
            }
        })
        .when('/sistema-exames/riscosOcup', {
            templateUrl: 'sistema/exames/riscosOcup.html',
            controller: 'riscoOcupCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/exames/riscosOcup.js'
                    ]);
                }]
            }
        })
        .when('/sistema-exames/riscosOcupTipo', {
            templateUrl: 'sistema/exames/riscosOcupTipo.html',
            controller: 'riscoOcupTipoCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/exames/riscosOcupTipo.js'
                    ]);
                }]
            }
        })
        .when('/sistema-exames/examesClasse', {
            templateUrl: 'sistema/exames/examesClasse.html',
            controller: 'exameClasseCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/exames/examesClasse.js'
                    ]);
                }]
            }
        })
        .when('/sistema-fornecedores/fornecedores', {
            templateUrl: 'sistema/fornecedores/fornecedores.html',
            controller: 'fornecedorCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/fornecedores/fornecedores.js',
                        'api/front/js/directives/estruturaBlocos.js'
                    ]);
                }]
            }
        })
        .when('/sistema-fornecedores/fornecedoresCategorias', {
            templateUrl: 'sistema/fornecedores/fornecedoresCategorias.html',
            controller: 'fornecedorCategoriaCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/fornecedores/fornecedoresCategorias.js'
                    ]);
                }]
            }
        })
        .when('/sistema-financeiro-contasPagar/contasPagar', {
            templateUrl: 'sistema/financeiro/contasPagar/contasPagar.html',
            controller: 'contaPagarCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/financeiro/contasPagar/contasPagar.js',
                        'api/front/js/directives/estruturaBlocos.js',
                        'api/front/js/directives/arquivosAnexos.js',
                        'sistema/financeiro/contasPagar/contasPagar.css'
                    ]);
                }]
            }
        })
        .when('/sistema-financeiro/faturamentoEmpresas', {
            templateUrl: 'sistema/financeiro/faturamentoEmpresas.html',
            controller: 'faturamentoEmpresaCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/financeiro/faturamentoEmpresas.js',
                        'api/front/js/directives/arquivosAnexos.js',
                        'api/front/js/directives/estruturaBlocos.js'
                    ]);
                }]
            }
        })
        .when('/sistema-servicos/servicos', {
            templateUrl: 'sistema/servicos/servicos.html',
            controller: 'servicoCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/servicos/servicos.js'
                    ]);
                }]
            }
        })
        .when('/sistema-eSocial/s2240', {
            templateUrl: 'sistema/eSocial/s2240.html',
            controller: 's2240Ctrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'api/front/js/directives/estruturaBlocos.js',
                        'sistema/eSocial/s2240.js'
                    ]);
                }]
            }
        })
        .when('/sistema-eSocial/s2220', {
            templateUrl: 'sistema/eSocial/s2220.html',
            controller: 's2220Ctrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/eSocial/s2220.js',
                        'sistema/eSocial/s2220.css'
                    ]);
                }]
            }
        })
        .when('/sistema-eSocial/consultaEventos', {
            templateUrl: 'sistema/eSocial/consultaEventos.html',
            controller: 'consultaEventosCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/eSocial/consultaEventos.js'
                    ]);
                }]
            }
        })
        .when('/sistema-encaminhamento/asosImpressao', {
            templateUrl: 'sistema/encaminhamento/asosImpressao.html',
            controller: 'asosImpressaoCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/encaminhamento/asosImpressao.js',
                        'sistema/encaminhamento/asosImpressao.css'
                    ]);
                }]
            }
        })
        .when('/sistema-encaminhamento/asosRealizarExames', {
            templateUrl: 'sistema/encaminhamento/asosRealizarExames.html',
            controller: 'asosRealizarExamesCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'api/front/js/directives/arquivosAnexos.js',
                        'sistema/encaminhamento/asosRealizarExames.js'
                    ]);
                }]
            }
        })
        .when('/sistema-encaminhamento-agendamento/agendamento', {
            templateUrl: 'sistema/encaminhamento/agendamento/agendamento.html',
            controller: 'agendamentoCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/encaminhamento/agendamento/agendamento.css',
                        'sistema/encaminhamento/agendamento/envioAnexosAgendamento.js',
                        'sistema/encaminhamento/agendamento/agendamento.js'
                    ]);
                }]
            }
        })
        .when('/sistema-encaminhamento-agendamento/agendamento-com-matricula', {
            templateUrl: 'sistema/encaminhamento/agendamento/agendamento.com.matricula.html',
            controller: 'agendamentoCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/encaminhamento/agendamento/agendamento.css',
                        'sistema/encaminhamento/agendamento/envioAnexosAgendamento.js',
                        'sistema/encaminhamento/agendamento/agendamento.com.matricula.js'
                    ]);
                }]
            }
        })
        .when('/sistema-encaminhamento/encaminhamentoAvulso', {
            templateUrl: 'sistema/encaminhamento/encaminhamentoAvulso.html',
            controller: 'encaminhamentoAvulsoCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'api/front/js/directives/estruturaBlocos.js',
                        'sistema/encaminhamento/encaminhamentoAvulso.js'
                    ]);
                }]
            }
        })
        .when('/sistema-encaminhamento/asosConsulta', {
            templateUrl: 'sistema/encaminhamento/asosConsulta.html',
            controller: 'asoConsultaCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/encaminhamento/asosConsulta.js'
                    ]);
                }]
            }
        })
        .when('/sistema-encaminhamento/asosConfirmarExames', {
            templateUrl: 'sistema/encaminhamento/asosConfirmarExames.html',
            controller: 'asosConfirmarExamesCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/encaminhamento/asosConfirmarExames.js'
                    ]);
                }]
            }
        })
        .when('/sistema-encaminhamento/asosBaixarExames', {
            templateUrl: 'sistema/encaminhamento/asosBaixarExames.html',
            controller: 'asosBaixarExamesCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/encaminhamento/asosBaixarExames.js'
                    ]);
                }]
            }
        })
        .when('/sistema-encaminhamento-coletivo/encaminhamentoColetivo', {
            templateUrl: 'sistema/encaminhamento/coletivo/encaminhamentoColetivo.html',
            controller: 'coletivoCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/encaminhamento/coletivo/encaminhamentoColetivo.js',
                        'api/front/js/directives/estruturaBlocos.js'
                    ]);
                }]
            }
        })
        .when('/sistema-encaminhamento/relatorioResultados', {
            templateUrl: 'sistema/encaminhamento/relatorioResultados.html',
            controller: 'relatorioResultadosCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/encaminhamento/relatorioResultados.js'
                    ]);
                }]
            }
        })
        .when('/sistema-encaminhamento-anexos/asosAnexarLaudos', {
            templateUrl: 'sistema/encaminhamento/anexos/asosAnexarLaudos.html',
            controller: 'asoAnexarLaudoCtrl',
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        'sistema/encaminhamento/anexos/formArquivosProcedimentosMedicos.js',
                        'sistema/encaminhamento/anexos/asosAnexarLaudos.js'
                    ]);
                }]
            }
        })        
        // .otherwise({
        //     redirectTo: function() {
        //         // Redirecionamento seguro para evitar erro de função
        //         var injector = angular.element(document.body).injector();
        //         var AuthService = injector.get('AuthService');
        //         return AuthService && AuthService.isAuthenticated() ? '/inicio' : '/login';
        //     }
        // });
});