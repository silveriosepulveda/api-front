app.directive('cabecalhoConsulta', ['$compile', 'APIServ', 'EGFuncoes', 'APIAjuFor', function ($compile, APIServ, EGFuncoes, APIAjuFor) {
    return {
        restrict: 'E',
        replace: true,
        template: '',
        link: function (scope, elem) {
            var parametros = scope.estrutura;
            let raizModelo = scope.estrutura.raizModelo;
            let campoChave = scope.estrutura.raizModelo + '.' + scope.estrutura.campo_chave;
            const usuario = APIServ.buscaDadosLocais('usuario');
            const admSistema = usuario['administrador_sistema'] == 'S';

            let nomeFormConsulta = 'formCon' + parametros.raizModelo;
            let tipoConsulta = parametros.tipoConsulta != undefined ? parametros.tipoConsulta : 'camposDinamicos';
            //Vou por o acoes inicio consulta, quando houver
            let acoesInicioConsulta = '';
            let mostrarAcoesInicioConsultaSemResultado = false;
            if (parametros.acoesInicioConsulta != undefined) {
                angular.forEach(parametros.acoesInicioConsulta, function (val, key) {
                    mostrarAcoesInicioConsultaSemResultado = val.mostrarSemResultados != undefined && val.mostrarSemResultados ? true :
                        mostrarAcoesInicioConsultaSemResultado;
                    if (val == 'diretiva' || (val.tipo != undefined && val.tipo == 'diretiva')) {
                        let nomeDiretivaIC = APIAjuFor.variavelParaDiretiva(key);
                        acoesInicioConsulta += `<${nomeDiretivaIC}></${nomeDiretivaIC}>`;
                    } else {
                        acoesInicioConsulta += `<input-botao parametros="${key}" ng-if="tela=='consulta'"></input-botao>`; // ' EGFuncoes.montarBotao(val);
                    }
                })
            }

            var acao = scope.estrutura.acao != undefined ? scope.estrutura.acao : APIServ.parametrosUrl()[1];
            $rS[acao] = $rS[acao] == undefined ? $rS[acao] = {} : $rS[acao];
            if ($rS[acao]['acoes'] == undefined) {
                $rS[acao]['acoes'] = {
                    Cadastrar: scope.estrutura.acoes != undefined && scope.estrutura.acoes.Cadastrar != undefined ? scope.estrutura.acoes.Cadastrar : false,
                    Alterar: scope.estrutura.acoes != undefined && scope.estrutura.acoes.Alterar != undefined ? scope.estrutura.acoes.Alterar : false,
                    Excluir: scope.estrutura.acoes != undefined && scope.estrutura.acoes.Excluir != undefined ? scope.estrutura.acoes.Excluir : false
                }
            }

            angular.element('.navbar-brand').html(parametros.textoPagina);


            htmlFiltroResultado = `
                <div class="col-xs-12 col-md-3 form-group" ng-class="{'baixarbotao': !dispositivoMovel}">
                    <input type="text" ng-change="alterarFiltroResultado(filtroResultadoTela)" ng-model="filtroResultadoTela" class="form-control" placeholder="Buscar nos Ítens da Tela">
                </div>`;
            let html =
                `<div class="row">
                    <h2 class="col-xs-12 col-md-8" ng-if="!dispositivoMovel && tela == 'consulta'">${parametros.textoPagina} - Consulta</h2>
                    <h2 class="col-xs-12 col-md-8" ng-if="!dispositivoMovel && tela == 'cadastro' && (${campoChave} == 0 || ${campoChave} == undefined)">${parametros.textoPagina} - Inclusão</h2>
                    <h2 class="col-xs-12 col-md-8" ng-if="!dispositivoMovel && tela == 'cadastro' && ${campoChave} > 0">${parametros.textoPagina} - Alteração</h2>`;

            if (EGFuncoes.temCadastro(parametros) && ($rS[acao]['acoes']['Cadastrar'] || admSistema)) {
                html += `<button class="col-xs-12 col-md-4 btn btn-success" ng-class="{'top10': !dispositivoMovel}" ng-if="tela != 'cadastro'" ng-click="mudaTela('cadastro')">${parametros.textoNovo}</button>`;
            }

            if (!scope.popUp) {
                html += `<button id="botaoIrConsulta" class="col-xs-12 col-md-4 btn btn-primary" ng-class="{'top10': !dispositivoMovel}" ng-if="tela == 'cadastro'" ng-click="mudaTela('consulta')">Ir Para Consulta</button>`;
            }

            html += `
            </div>`;


            if (scope.estrutura.filtroPersonalzadoDiretiva != undefined) {
                var temp = '<' + APIAjuFor.variavelParaDiretiva(scope.estrutura.filtroPersonalzadoDiretiva) + ' ng-if="tela != \'cadastro\'"></' + APIAjuFor.variavelParaDiretiva(scope.estrutura.filtroPersonalzadoDiretiva) + '>';
                html += temp;
            } else {
                html += '<form-cabecalho-consulta-padrao></form-cabecalho-consulta-padrao>';
            }

            let ngIfAcoesInicioConsulta = !mostrarAcoesInicioConsultaSemResultado ? 'ng-if="listaConsulta.length > 0"' : '';
            html += `
            <div class="col-xs-12 acoesInicioConsulta teste" ${ngIfAcoesInicioConsulta}>
                <div class="row">
                    ${acoesInicioConsulta}
                </div>
            </div>
            <hr>

            <div class="col-xs-12 resumoConsulta"  ng-if="resumoConsulta != undefined">
                <div class="row">
                    <div class="col-xs-12 col-md-4 divitemLista div6 itemResumoConsulta" ng-repeat="(key, val) in resumoConsulta">
                        <span>{{estrutura.resumoConsulta[key]['texto']}}: <label>{{val}}</label></span>
                    </div>
                </div>
            </div>`;

            // html += scope.estrutura.naoFiltrarAoIniciar == undefined || scope.estrutura.naoFiltrarAoIniciar == false ?
            //     `<div ng-init="filtrar(0)" ng-if="estrutura.tipoEstrutura == 'consultaDireta' && tela != 'cadastro'""></div>` : '';
            elem.html(html);
            elem.addClass('row-fluid cabecalhoConsulta')
            $compile(elem.contents())(scope);
        }
    }
}])