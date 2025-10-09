app.directive("cabecalhoConsulta", [
    "$compile",
    "APIServ",
    "EGFuncoes",
    "APIAjuFor",
    "FuncoesConsulta",
    function ($compile, APIServ, EGFuncoes, APIAjuFor, FuncoesConsulta) {
        return {
            restrict: "E",
            replace: true,
            template: "",
            link: function (scope, elem) {
                var parametros = scope.estrutura;
                //let raizModelo = scope.estrutura.raizModelo;
                let campoChave = scope.estrutura.raizModelo + "." + scope.estrutura.campo_chave;
                const usuario = APIServ.buscaDadosLocais("usuario");
                const admSistema = usuario["administrador_sistema"] == "S";

                // let nomeFormConsulta = 'formCon' + parametros.raizModelo;
                //let tipoConsulta = parametros.tipoConsulta != undefined ? parametros.tipoConsulta : 'camposDinamicos';
                //Vou por o acoes inicio consulta, quando houver
                let acoesInicioConsulta = "";
                let mostrarAcoesInicioConsultaSemResultado = false;
                if (parametros.acoesInicioConsulta != undefined) {
                    
                    angular.forEach(parametros.acoesInicioConsulta, function (val, key) {
                        console.log('Acoes inicio consulta', val, key);
                        mostrarAcoesInicioConsultaSemResultado =
                            val.mostrarSemResultados != undefined && val.mostrarSemResultados ? true : mostrarAcoesInicioConsultaSemResultado;
                        if (val == "diretiva" || (val.tipo != undefined && val.tipo == "diretiva")) {
                            let nomeDiretivaIC = APIAjuFor.variavelParaDiretiva(key);
                            acoesInicioConsulta += `<${nomeDiretivaIC}></${nomeDiretivaIC}>`;
                        } else {
                            acoesInicioConsulta += `<input-botao parametros="${key}" ng-if="tela=='consulta'"></input-botao>`; // ' EGFuncoes.montarBotao(val);
                        }
                    });
                }

                var acao = scope.estrutura.acao != undefined ? scope.estrutura.acao : APIServ.parametrosUrl()[1];
                $rS[acao] = $rS[acao] == undefined ? ($rS[acao] = {}) : $rS[acao];
                //console.log($rS[acao]);
                
                if ($rS[acao]["acoes"] == undefined) {
                    $rS[acao]["acoes"] = {
                        Cadastrar: scope.estrutura.acoes != undefined && scope.estrutura.acoes.Cadastrar != undefined ? scope.estrutura.acoes.Cadastrar : false,
                        Alterar: scope.estrutura.acoes != undefined && scope.estrutura.acoes.Alterar != undefined ? scope.estrutura.acoes.Alterar : false,
                        Excluir: scope.estrutura.acoes != undefined && scope.estrutura.acoes.Excluir != undefined ? scope.estrutura.acoes.Excluir : false,
                    };
                }               

                angular.element(".navbar-brand").html(parametros.textoPagina);

                // htmlFiltroResultado = `
                //     <div class="col-xs-12 col-md-3 form-group" ng-class="{'baixarbotao': !dispositivoMovel}">
                //         <input type="text" ng-change="alterarFiltroResultado(filtroResultadoTela)" ng-model="filtroResultadoTela" class="form-control" placeholder="Buscar nos Ítens da Tela">
                //     </div>`;
                let html = `<div class="row">                
                    <h2 class="col-xs-12 col-md-8" ng-if="!dispositivoMovel && tela == 'consulta'">${parametros.textoPagina} - Consulta</h2>
                    <h2 class="col-xs-12 col-md-8" ng-if="!dispositivoMovel && tela == 'cadastro' && (${campoChave} == 0 || ${campoChave} == undefined)">${parametros.textoPagina} - Inclusão</h2>
                    <h2 class="col-xs-12 col-md-8" ng-if="!dispositivoMovel && tela == 'cadastro' && ${campoChave} > 0">${parametros.textoPagina} - Alteração</h2>`;
                
                    const temAcaoCadastrar = $rS[acao]["acoes"]["Cadastrar"] != undefined;
                    const temCadastroParam = EGFuncoes.temCadastro(parametros);
                   // console.log(temAcaoCadastrar, temCadastroParam);
                    
                if ((temCadastroParam && temAcaoCadastrar) ) {
                    html += `<button class="col-xs-12 col-md-4 btn btn-success" ng-class="{'top10': !dispositivoMovel}" ng-if="tela != 'cadastro'" ng-click="mudaTela('cadastro')">${parametros.textoNovo}</button>`;
                }

                if (!scope.popUp) {
                    html += `<button id="botaoIrConsulta" class="col-xs-12 col-md-4 btn btn-primary" ng-class="{'top10': !dispositivoMovel}" ng-if="tela == 'cadastro'" ng-click="mudaTela('consulta')">Ir Para Consulta</button>`;
                }

                html += `
            </div>`;

                if (scope.estrutura.filtroPersonalzadoDiretiva != undefined) {
                    var temp =
                        "<" +
                        APIAjuFor.variavelParaDiretiva(scope.estrutura.filtroPersonalzadoDiretiva) +
                        " ng-if=\"tela != 'cadastro'\"></" +
                        APIAjuFor.variavelParaDiretiva(scope.estrutura.filtroPersonalzadoDiretiva) +
                        ">";
                    html += temp;
                } else {
                    html += "<form-cabecalho-consulta-padrao></form-cabecalho-consulta-padrao>";
                }

                let ngIfAcoesInicioConsulta = !mostrarAcoesInicioConsultaSemResultado ? 'ng-if="listaConsulta.length > 0"' : "";
                html += `
            <div class="col-xs-12 acoesInicioConsulta" ${ngIfAcoesInicioConsulta}>
                <div class="row">
                    ${acoesInicioConsulta}
                </div>
            </div>
            <hr>

            <resumo-consulta ng-if="estrutura.tipoListaConsulta == 'lista'"></resumo-consulta>
           `;

                if (scope.estrutura.tipoListaConsulta == "tabela") {
                    html += "<cabecalho-lista-consulta-tabela></cabecalho-lista-consulta-tabela>";
                }

                // html += scope.estrutura.naoFiltrarAoIniciar == undefined || scope.estrutura.naoFiltrarAoIniciar == false ?
                //     `<div ng-init="filtrar(0)" ng-if="estrutura.tipoEstrutura == 'consultaDireta' && tela != 'cadastro'""></div>` : '';

                // Cabeçalho da tabela movido para diretiva separada cabecalhoListaConsultaTabela

                elem.html(html);
                elem.addClass("row-fluid cabecalhoConsulta");
                $compile(elem.contents())(scope);
            },
        };
    },
])
.directive("linhaFiltroListaConsulta", function () {
    return {
        restrict: "E",
        replace: true,
        template: `
        <div class="col-xs-12" ng-if="tela == 'consulta' && tipoListaConsulta == 'lista'">
                <div class="row">
                    <div class="col-xs-12 col-md-6 div4 bordaQuadrada">
                        <div class="row">
                            <div class="col-xs-1">
                                <input type="checkbox" ng-if="opcaoSelecionarTodosItensConsulta" name="todosItensSelecionados" id="todosItensSelecionados"
                                    ng-click="selecionarTodosItensConsulta()" ng-model="todosItensSelecionados">
                            </div>
                            <div class="col-xs-6">
                                <contador-filtro></contador-filtro>
                            </div>


                            <div class="col-xs-4" ng-if="estrutura.camposFiltroPersonalizado">
                                <div class="row-fluid">
                                    <div class="col-xs-6 alteraExibicaoConsulta" ng-if="estrutura.tipoEstrutura != 'consultaDireta'">
                                        <button type="button" class="btn btn-default glyphicon" title="Ocultar / Mostrar Campos da Consulta"
                                            ng-class="{'glyphicon-zoom-out' : exibirConsulta, 'glyphicon-zoom-in': !exibirConsulta}"
                                            ng-click="alterarExibicaoConsulta()"></button>
                                    </div>
                                    <div class="col-xs-6 refreshConsulta" ng-if="!exibirConsulta">
                                        <button class="btn btn-primary glyphicon glyphicon-refresh"></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div ng-if="estrutura.camposFiltroPersonalizado == undefined">
                        <div class="col-xs-8 col-sm-4 form-group superFiltro">
                            <div class="input-group">
                                <input type="text" ng-change="alterarFiltroResultado(filtroResultado)" ng-model="filtroResultado" class="form-control top05"
                                    placeholder="Buscar nos Ítens da Tela" id="filtro_resultado">
                                <span class="input-group-btn glyphicon glyphicon-erase btn btn-default" ng-click="limparFiltroResultado(filtroResultado)"></span>
                            </div>
                        </div>
                        <div class="col-xs-3 col-md-1 alteraExibicaoConsulta" ng-if="estrutura.tipoEstrutura != 'consultaDireta'">
                            <button type="button" class="btn btn-default glyphicon "
                                ng-class="{'glyphicon-menu-up' : exibirConsulta, 'glyphicon-menu-down': !exibirConsulta}"
                                ng-click="alterarExibicaoConsulta()">Busca</button>
                        </div>
                        <div class="col-xs-1 col-md-1 refreshConsulta" ng-if="!exibirConsulta">
                            <button class="btn btn-primary glyphicon glyphicon-refresh"></button>
                        </div>
                    </div>
                    <!-- <div class="col-xs-3 col-md-1">
                            <input type="checkbox" checked="true" class="input-lg" ng-click="desfixarCabecalho()"> -->
                </div>
                <timer-consulta intervalo="{{estrutura.usarTimerConsulta.intervalo}}" ng-if="estrutura.usarTimerConsulta"></timer-consulta>
            </div>
        
        `,
    };
});
