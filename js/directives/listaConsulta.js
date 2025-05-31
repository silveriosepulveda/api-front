directivesPadrao.directive('listaConsulta', ['$compile', 'APIServ', 'EGFuncoes', 'APIAjuFor', function ($compile, APIServ, EGFuncoes, APIAjuFor) {
    return {
        restrict: 'E',
        replace: true,
        template: '',
        link: function (scope, elem) {
            var acao = scope.acao != undefined ? scope.acao : APIServ.parametrosUrl()[1];
            var parametros = scope.estrutura;

            let posicaoBotoes = scope.estrutura.botoesAcoesItensConsultaPosicao != undefined ? scope.estrutura.botoesAcoesItensConsultaPosicao : 'esquerda';
            let classeBotoes = posicaoBotoes == 'superior' || posicaoBotoes == 'inferior' ? 'col-xs-12' : 'col-xs-12 col-md-2';
            let classeLista = posicaoBotoes == 'superior' || posicaoBotoes == 'inferior' ? 'col-xs-12' : 'col-xs-12 col-md-10';
            let habilitarSalvar = false;

            scope.aoEntrarInputConsulta = (item, event) => {
                let campo = $(event.target).attr('campo');

                item.valoresOriginais = item.valoresOriginais != undefined ? item.valoresOriginais : {};
                item.valoresOriginais[campo] = item.valoresOriginais != undefined && item.valoresOriginais[campo] != undefined ? item.valoresOriginais[campo] : item[campo];
            }

            scope.alteracaoItemConsulta = (item, event) => {
                let elemento = $(event.target);
                let campo = elemento.attr('campo');

                if (item.valoresOriginais[campo] != undefined && item.valoresOriginais[campo] != item[campo]) {
                    $(event.target).closest('.itemConsulta').addClass('fundoVermelho');
                    item.habilitarSalvar = true;
                    $("#filtro_resultado").prop('disabled', 'disabled');
                } else {
                    $("#filtro_resultado").prop('disabled', '');
                    $(event.target).closest('.itemConsulta').removeClass('fundoVermelho');
                    item.habilitarSalvar = false;
                }
            }

            scope.salvarAlteracoesItem = (item, event) => {
                let elemento = $(event.target);

                let parametrosAlteracao = {
                    tabela: parametros.tabela,
                    campoChave: parametros.campo_chave,
                    dados: item
                }

                let fd = new FormData();
                fd.append('parametros', JSON.stringify(parametrosAlteracao));

                APIServ.executaFuncaoClasse('classeGeral', 'alterarItemConsulta', fd, 'post').success(retorno => {
                    if (retorno.camposObrigatoriosVazios != undefined) {
                        APIServ.mensagemSimples('Há Campos Obrigatórios Vazios');
                    } else if (retorno.sucesso != undefined) {
                        $("#filtro_resultado").prop('disabled', '');
                        $(event.target).closest('.itemConsulta').removeClass('fundoVermelho');
                        item.habilitarSalvar = false;
                    } else if (retorno.erro != undefined) {
                        APIServ.mensagemSimples(retorno.erro);
                    }
                })


            }

            scope.cancelarAlteracoesItem = (item, event) => {
                console.log(item);
                for (let v in item) {
                    item[v] = item.valoresOriginais != undefined && item.valoresOriginais[v] != undefined ? item.valoresOriginais[v] : item[v];
                }

                $(event.target).closest('.itemConsulta').removeClass('fundoVermelho');
                item.habilitarSalvar = false;
                $("#filtro_resultado").prop('disabled', '');
            }


            /************************ CRIANDO OS CAMPOS DA LISTA **********************/
            let htmlCamposLista = `
            <div class="${classeLista}">
                <div class="row">`;


            //Aqui, ao inves de usar o repeat do angular, crio todos os elementos pois as informacoes sobre o campo estao no template js
            angular.forEach(parametros.listaConsulta, function (val, key) {

                let classesDivItemConsulta = val.classesDiv ? val.classesDiv : '';
                habilitarSalvar = val.habilitarEdicao || habilitarSalvar;

                val = val != 'diretiva' ? $.extend({}, APIServ.buscarValorVariavel(parametros.campos, key), val) : val;

                val.tipo = val.tipo != undefined ? val.tipo : '';
                val.texto = val.texto != undefined ? val.texto : '';

                //Testando por ng-model nos itens da lista
                let modelo = val.usarModelo != undefined ? 'ng-model="item.' + key + '"' : '';
                //Fazendo esta comparação somente para o ng-class, posteriormente incluir rotina para qualquer atributo
                let ngClasses = val.atributosDiv != undefined && val.atributosDiv['ng-class'] ? `ng-class="${val.atributosDiv['ng-class']}"` : ""

                var tamanho = EGFuncoes.montarTamanhos(val);

                let atributosDivCampoConsulta = val.atributos_div != undefined ? EGFuncoes.montarAtributos(val.atributos_div) : [];

                if (val.tipo != "oculto") {
                    if (val.tipo == 'caixaSelecao') {
                        val['raizModelo'] = 'item';
                        val['padrao'] = 'true';

                        htmlCamposLista += `<monta-html campo="selecionado"></monta-html>`;// EGFuncoesmontaHtml(parametros, key, val);
                    } else if (val.tipo == 'imagem') {
                        var tamanho = EGFuncoes.montarTamanhos(val);
                        htmlCamposLista += `<div class="col-xs-12 ${classesDivItemConsulta} campoItemConsulta ${tamanho.join(' ')}">`;
                        htmlCamposLista += val.texto != '' ? `<label class="col-md-2">${val.texto}: </label>` : '';
                        htmlCamposLista += `<img ng-src="{{item.${key}}}" class="img-responsive" style="max-height:120px !important" imagem-dinamica></div>`;
                    } else if (val == 'diretiva') {
                        //console.log('diretiva');
                        let nomeDiretiva = APIAjuFor.variavelParaDiretiva(key);
                        htmlCamposLista += `<${nomeDiretiva}></${nomeDiretiva}>`;
                    } else if (val.tipo == 'select') {
                        htmlCamposLista += `<monta-html campo="${key}"></monta-html>`;// '{{item.ordem}}';
                    } else if (val.tipo == 'ordenacaoConsulta') {
                        htmlCamposLista += `<ordenacao-consulta campo="${key}"></ordenacao-consulta>`;
                    } else if (val.habilitarEdicao != undefined && val.habilitarEdicao) {
                        htmlCamposLista += `<div class="col-xs-12 form-group form-group-modern ${classesDivItemConsulta} ${tamanho.join(' ')}" ${ngClasses} ${atributosDivCampoConsulta.join(' ')}>
            <div class="input-group">
                <span class="input-group-addon input-group-text">${val.texto}:</span>
                <input class="form-control input-xs" type="text" ${modelo} campo="${key}" ng-focus="aoEntrarInputConsulta(item, $event)" 
                    ng-keyup="alteracaoItemConsulta(item, $event)">
            </div>
        </div>`;
                    } else {
                        htmlCamposLista += `<div class="col-xs-12 campoItemConsulta ${classesDivItemConsulta} ${tamanho.join(' ')}" ${ngClasses}  
            ${atributosDivCampoConsulta.join(' ')}>`;
                        var texto = val.texto != '' ? val.texto + ':' : '';
                        htmlCamposLista += `<label >${texto} &nbsp<span ${modelo}>{{item.${key}}}</span></label></div>`;
                    }
                }
            })
            htmlCamposLista += ` </div>
</div>`;

            /***************************** FIM DOS CAMPOS DA LISTA  **********************************/


            /******************CRIANDO OS BOTOES DAS FUNCOES *******************************************/
            let htmlBotoes = `
                <div class="${classeBotoes}"> `

            if ((parametros.funcaoDetalhar == undefined || parametros.funcaoDetalhar != 'desativada') && (parametros.ocultarDetalhes == undefined || !parametros.ocultarDetalhes)) {
                let funcaoDet = parametros.funcaoDetalhar != undefined ? parametros.funcaoDetalhar : 'detalhar';
                htmlBotoes += `<button type="button" name="button" class="btn btn-modern btn-outline-secondary glyphicon"
                ng-class="{'glyphicon-plus' : !item.exibirDetalhes, 'glyphicon-minus':item.exibirDetalhes}" title="Ver Detalhes"  ng-click=${funcaoDet}(item)></button>`;
            }

            if ((parametros.funcaoAlterar == undefined || parametros.funcaoAlterar != 'desativada') && ($rS[acao] != undefined && $rS[acao]['acoes']['Alterar'])) {
                let funcaoAlt = parametros.funcaoAlterar != undefined ? parametros.funcaoAlterar : 'alterar';
                let textoBotaoAlterar = parametros.textoBotaoAlterar != undefined ? parametros.textoBotaoAlterar : '';
                let iconeBotaoAlterar = parametros.ocultarIconeBotaoAlterar == undefined || !parametros.ocultarIconeBotaoAlterar ? 'glyphicon-pencil glyphicon' : '';
                let classesBotaoAlterar = parametros.classesBotaoAlterar == undefined || !parametros.classesBotaoAlterar ? 'btn-modern btn-outline-primary' : parametros.classesBotaoAlterar;
                let ocultarAlterar = parametros.ocultarAlterar != undefined ? `ng-if="${parametros.ocultarAlterar}"` : '';
                htmlBotoes += `<button type="button" class="btn ${classesBotaoAlterar} ${iconeBotaoAlterar}" title="Alterar ${parametros.nomeUsual}" ng-click="${funcaoAlt}(item)"
                    ${ocultarAlterar}>${textoBotaoAlterar}</button>`;
                //htmlBotoes += `<button type="button" class="btn ${classesBotaoAlterar} ${iconeBotaoAlterar}" title="Alterar ${parametros.nomeUsual}" ng-click="${funcaoAlt}(item)">${textoBotaoAlterar}</button>`;

            }
            if ((parametros.funcaoExcluir == undefined || parametros.funcaoExcluir != 'desativada') && ($rS[acao] != undefined && $rS[acao]['acoes']['Excluir'])) {
                let funcaoExc = parametros.funcaoExcluir != undefined ? parametros.funcaoExcluir : 'excluir';
                let ocultarExcluir = parametros.ocultarExcluir != undefined ? `ng-if="${parametros.ocultarExcluir}"`  : '';
                htmlBotoes += `<button type="button" class="btn btn-modern btn-outline-danger glyphicon glyphicon-trash" title="Excluir ${parametros.nomeUsual}" ng-click="${funcaoExc}(item)"
                    ${ocultarExcluir}></button>`;
                //htmlBotoes += `<button type="button" class="btn btn-default glyphicon glyphicon-trash" title="Excluir ${parametros.nomeUsual}" ng-click="${funcaoExc}(item)"></button>`;
            }


            if (habilitarSalvar) {
                htmlBotoes += `
                    <button type="button" class="btn btn-modern btn-success glyphicon glyphicon-ok" ng-click="salvarAlteracoesItem(item, $event)" ng-if="item.habilitarSalvar">
                    <button type="button" class="btn btn-modern btn-danger glyphicon glyphicon-remove-circle" ng-click="cancelarAlteracoesItem(item, $event)" ng-if="item.habilitarSalvar">
                `;
            }


            if (parametros.acoesItensConsulta != undefined) {
                angular.forEach(parametros.acoesItensConsulta, function (val, key) {
                    if (val == 'anexos') {
                        htmlBotoes += `<input-botao parametros="${val}"></input-botao>`; // EGFuncoes.montarBotao(parametros.anexos);
                    } else if (val == 'diretiva' || (val.tipo != undefined && val.tipo == 'diretiva')) {
                        let nomeDiretiva = val.nomeDiretiva != undefined ? val.nomeDiretiva : key;
                        nomeDiretiva = APIAjuFor.variavelParaDiretiva(nomeDiretiva);
                        htmlBotoes += `<${nomeDiretiva} campo="${key}"></${nomeDiretiva}>`;
                    } else if (val.tipo == 'caixaSelecao') {
                        htmlBotoes += `<span class="form-inline"><input type="checkbox" ng-model="item.${key}" ng-click="selecionarItemConsulta(key, item)"></span>`;
                    } else {
                        val['tipo'] = 'button';
                        htmlBotoes += `<input-botao parametros="${key}"></input-botao>`; // EGFuncoes.montarBotao(val);
                    }
                })
            }

            htmlBotoes += `
            </div>
            <br>`;
            if (parametros.acoesItensConsulta != undefined) {
                angular.forEach(parametros.acoesItensConsulta, function (valAcaoItemConsulta, acaoItemConsulta) {
                    //Incluido ao clicar no botao de arquivos anexos nos itens da consulta
                    if (acaoItemConsulta == 'anexos') {
                        if (parametros.anexos.tipo != undefined && parametros.anexos.tipo == 'imagens') {
                            htmlBotoes += `<imagens-anexas ng-if="item.exibirAnexos" tela ='consulta'"></imagens-anexas>`;
                        } else {
                            htmlBotoes += `<arquivos-anexos ng-if="item.exibirAnexos" tela ='consulta'"></arquivos-anexos>`;
                        }

                    } else if (valAcaoItemConsulta.telaRelacionada != undefined && valAcaoItemConsulta.telaRelacionada) {
                        //Tem que ter uma diretiva com o mesmo nome da acao para montar os campos
                        var nomeDiretiva = APIAjuFor.variavelParaDiretiva(acaoItemConsulta);
                        htmlBotoes += `<${nomeDiretiva} ng-if="item.${acaoItemConsulta}"></${nomeDiretiva}>`;
                    }
                })
            }
            /*********************** FIM DOS BOTOES ******************************/



            let filtro = '';
            if (scope.estrutura.camposFiltroPersonalizado != undefined && Object.keys(scope.estrutura.camposFiltroPersonalizado).length > 0) {
                filtro = '{';
                let cont = 1;
                for (let i in scope.estrutura.camposFiltroPersonalizado) {
                    filtro += i + ':' + scope.estrutura.raizModelo + '.' + i;

                    filtro += cont < Object.keys(scope.estrutura.camposFiltroPersonalizado).length ? ',' : '';
                    cont++;
                }
                filtro += '}';
                scope.filtroResultado = filtro;
            } else {
                filtro = 'filtroResultado';
                scope.filtroResultado = '';
            }
            console.log(filtro);

// if(scope.filtroResultado != undefined){
//     console.log('tem');
// }

            // scope.filtroResultado = item => {
            //     console.log(item);
            // }

            let html = `            
            <div ng-if="tela == 'consulta'">            
                <div class="itemConsulta col-xs-12 bg-danger text-center" ng-if="listaConsulta.length == 0 && tela != 'cadastro'">
                    <h3>Nenhum Ítem Encontrado</h3>
                </div>
                <estrutura-paginacao></estrutura-paginacao>                
                <div class="conteudoBusca col-xs-12">                        
                    <div class="row itemConsulta" dir-paginate="(key, item) in listaConsulta | filter:${filtro} | itemsPerPage:itensPagina"
                     ng-if="tela != 'cadastro'" indice="{{key}}" id="divItemConsulta_{{key}}"> `;

            if (posicaoBotoes == 'superior') {
                html += htmlBotoes + htmlCamposLista;
            } else if (posicaoBotoes == 'inferior') {
                html += htmlCamposLista + htmlBotoes;
            } else if (posicaoBotoes == 'esquerda') {
                html += htmlCamposLista + htmlBotoes;
            }
            
            let textoDetalhes = parametros.textoDetalhesConsulta != undefined ? parametros.textoDetalhesConsulta : 'Mais Informações';
            html += `
                <div class="col-xs-12 fundoDetalheConsulta" ng-if="item.exibirDetalhes">
                    <div class="row">
                        <h4 class="campoItemConsulta text-center fundobranco">${textoDetalhes}</h4>`;

            //html += `<ng-bind-html class="col-xs-12 div2" ng-bind-html="item.htmlDetalhe"></ng-bind-html>`;
            //html +=  `<detalhes-item-consulta></detalhes-item-consulta>`;
            let diretivaDetalhes = parametros.diretivaDetalhesConsulta != undefined ? parametros.diretivaDetalhesConsulta : 'detalhes-item-consulta';
            html += `<${diretivaDetalhes}></${diretivaDetalhes}>`;

            if (parametros.anexos != undefined) {
                html += `<arquivos-anexos tela="detalhes" chave-array="key"></arquivos-anexos>`;
            }

            html += `
                        </div>
                    </div>
            </div>`;

            if (parametros.acoesRodapeConsulta != undefined) {
                html += `<div class="col-xs-12><div class="row">`;
                angular.forEach(parametros.acoesRodapeConsulta, function (val, key) {
                    html += `<input-botao parametros="${key}" ng-if="tela=='consulta'"></input-botao>`;// montarBotao(val);
                })
                html += `</div></div>`;
                html += "<hr>"
            }
            html += '</div>';
            html += `<estrutura-paginacao></estrutura-paginacao>
                </div>`;

            elem.html(html);
            $(elem).css('margin-top', '400px !important')
            $compile(elem.contents())(scope);
        }
    }
}])
    .directive('contadorFiltro', ($compile) => {
        return {
            restrict: 'E',
            link: (scope, elem, attr) => {
                let html = '';
                if (scope.filtroResultado.length > 0) {
                    html = `Itens na Consulta: <span id="qtdconsulta">{{(listaConsulta|filter:${scope.filtroResultado}).length}}</span>`;
                } else {
                    html = `Itens na Consulta: <span id="qtdconsulta">{{(listaConsulta|filter:filtroResultado).length}}</span>`;
                }
                elem.html(html);
                $compile(elem.contents())(scope);
            }
        }
    })