directivesPadrao.directive('listaConsulta', ['$compile', 'APIServ', 'EGFuncoes', 'APIAjuFor', function ($compile, APIServ, EGFuncoes, APIAjuFor) {
    return {
        restrict: 'E',
        replace: true,
        template: '',
        link: function (scope, elem) {
            var acao = scope.acao != undefined ? scope.acao : APIServ.parametrosUrl()[1];
            var parametros = scope.estrutura;

            var posicaoBotoes = scope.estrutura.botoesAcoesItensConsultaPosicao != undefined ? scope.estrutura.botoesAcoesItensConsultaPosicao : 'esquerda';
            var classeBotoes = posicaoBotoes == 'superior' || posicaoBotoes == 'inferior' ? 'col-xs-12' : 'col-xs-12 col-md-2';
            var classeLista = posicaoBotoes == 'superior' || posicaoBotoes == 'inferior' ? 'col-xs-12' : 'col-xs-12 col-md-10';
            var habilitarSalvar = false;

            scope.aoEntrarInputConsulta = (item, event) => {
                var campo = $(event.target).attr('campo');

                item.valoresOriginais = item.valoresOriginais != undefined ? item.valoresOriginais : {};
                item.valoresOriginais[campo] = item.valoresOriginais != undefined && item.valoresOriginais[campo] != undefined ? item.valoresOriginais[campo] : item[campo];
            }

            scope.alteracaoItemConsulta = (item, event) => {
                var elemento = $(event.target);
                var campo = elemento.attr('campo');

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
                var elemento = $(event.target);

                var parametrosAlteracao = {
                    tabela: parametros.tabela,
                    campoChave: parametros.campo_chave,
                    dados: item
                }

                var fd = new FormData();
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
                for (var v in item) {
                    item[v] = item.valoresOriginais != undefined && item.valoresOriginais[v] != undefined ? item.valoresOriginais[v] : item[v];
                }

                $(event.target).closest('.itemConsulta').removeClass('fundoVermelho');
                item.habilitarSalvar = false;
                $("#filtro_resultado").prop('disabled', '');
            }


            /************************ CRIANDO OS CAMPOS DA LISTA **********************/
            var htmlCamposLista = `
            <div class="${classeLista}">
                <div class="row">`;


            //Aqui, ao inves de usar o repeat do angular, crio todos os elementos pois as informacoes sobre o campo estao no template js
            angular.forEach(parametros.listaConsulta, function (val, key) {

                var classesDivItemConsulta = val.classesDiv ? val.classesDiv : '';
                habilitarSalvar = val.habilitarEdicao || habilitarSalvar;

                val = val != 'diretiva' ? $.extend({}, APIServ.buscarValorVariavel(parametros.campos, key), val) : val;

                val.tipo = val.tipo != undefined ? val.tipo : '';
                val.texto = val.texto != undefined ? val.texto : '';

                //Testando por ng-model nos itens da lista
                var modelo = val.usarModelo != undefined ? 'ng-model="item.' + key + '"' : '';
                //Fazendo esta comparação somente para o ng-class, posteriormente incluir rotina para qualquer atributo
                var ngClasses = val.atributosDiv != undefined && val.atributosDiv['ng-class'] ? `ng-class="${val.atributosDiv['ng-class']}"` : ""

                var tamanho = EGFuncoes.montarTamanhos(val);

                var atributosDivCampoConsulta = val.atributos_div != undefined ? EGFuncoes.montarAtributos(val.atributos_div) : [];

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
                        var nomeDiretiva = APIAjuFor.variavelParaDiretiva(key);
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
            var htmlBotoes = `
                <div class="${classeBotoes}"> `

            if ((parametros.funcaoDetalhar == undefined || parametros.funcaoDetalhar != 'desativada') && (parametros.ocultarDetalhes == undefined || !parametros.ocultarDetalhes)) {
                var funcaoDet = parametros.funcaoDetalhar != undefined ? parametros.funcaoDetalhar : 'detalhar';
                htmlBotoes += `<button type="button" name="button" class="btn btn-modern btn-outline-secondary glyphicon"
                ng-class="{'glyphicon-plus' : !item.exibirDetalhes, 'glyphicon-minus':item.exibirDetalhes}" title="Ver Detalhes"  ng-click=${funcaoDet}(item)></button>`;
            }

            if ((parametros.funcaoAlterar == undefined || parametros.funcaoAlterar != 'desativada') && ($rS[acao] != undefined && $rS[acao]['acoes']['Alterar'])) {
                var funcaoAlt = parametros.funcaoAlterar != undefined ? parametros.funcaoAlterar : 'alterar';
                var textoBotaoAlterar = parametros.textoBotaoAlterar != undefined ? parametros.textoBotaoAlterar : '';
                var iconeBotaoAlterar = parametros.ocultarIconeBotaoAlterar == undefined || !parametros.ocultarIconeBotaoAlterar ? 'glyphicon-pencil glyphicon' : '';
                var classesBotaoAlterar = parametros.classesBotaoAlterar == undefined || !parametros.classesBotaoAlterar ? 'btn-modern btn-outline-primary' : parametros.classesBotaoAlterar;
                var ocultarAlterar = parametros.ocultarAlterar != undefined ? `ng-if="${parametros.ocultarAlterar}"` : '';
                htmlBotoes += `<button type="button" class="btn ${classesBotaoAlterar} ${iconeBotaoAlterar}" title="Alterar ${parametros.nomeUsual}" ng-click="${funcaoAlt}(item)"
                    ${ocultarAlterar}>${textoBotaoAlterar}</button>`;
                //htmlBotoes += `<button type="button" class="btn ${classesBotaoAlterar} ${iconeBotaoAlterar}" title="Alterar ${parametros.nomeUsual}" ng-click="${funcaoAlt}(item)">${textoBotaoAlterar}</button>`;

            }
            if ((parametros.funcaoExcluir == undefined || parametros.funcaoExcluir != 'desativada') && ($rS[acao] != undefined && $rS[acao]['acoes']['Excluir'])) {
                var funcaoExc = parametros.funcaoExcluir != undefined ? parametros.funcaoExcluir : 'excluir';
                var ocultarExcluir = parametros.ocultarExcluir != undefined ? `ng-if="${parametros.ocultarExcluir}"`  : '';
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
                        var nomeDiretiva = val.nomeDiretiva != undefined ? val.nomeDiretiva : key;
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



            var filtro = '';
            if (scope.estrutura.camposFiltroPersonalizado != undefined && Object.keys(scope.estrutura.camposFiltroPersonalizado).length > 0) {
                filtro = '{';
                var cont = 1;
                for (var i in scope.estrutura.camposFiltroPersonalizado) {
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

            var html = `            
            <div ng-if="tela == 'consulta'">            
                <div class="itemConsulta col-xs-12 bg-danger text-center" ng-if="listaConsulta.length == 0 && tela != 'cadastro'">
                    <h3>Nenhum Ítem Encontrado</h3>
                </div>
                <div class="conteudoBusca col-xs-12" lazy-load-container>                        
                    <div class="row itemConsulta" ng-repeat="item in listaConsultaVisivel track by $index"
                     ng-if="tela != 'cadastro'" indice="{{$index}}" id="divItemConsulta_{{$index}}"> `;

            if (posicaoBotoes == 'superior') {
                html += htmlBotoes + htmlCamposLista;
            } else if (posicaoBotoes == 'inferior') {
                html += htmlCamposLista + htmlBotoes;
            } else if (posicaoBotoes == 'esquerda') {
                html += htmlCamposLista + htmlBotoes;
            }
            
            var textoDetalhes = parametros.textoDetalhesConsulta != undefined ? parametros.textoDetalhesConsulta : 'Mais Informações';
            html += `
                <div class="col-xs-12 fundoDetalheConsulta" ng-if="item.exibirDetalhes">
                    <div class="row">
                        <h4 class="campoItemConsulta text-center fundobranco">${textoDetalhes}</h4>`;

            //html += `<ng-bind-html class="col-xs-12 div2" ng-bind-html="item.htmlDetalhe"></ng-bind-html>`;
            //html +=  `<detalhes-item-consulta></detalhes-item-consulta>`;
            var diretivaDetalhes = parametros.diretivaDetalhesConsulta != undefined ? parametros.diretivaDetalhesConsulta : 'detalhes-item-consulta';
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
            html += `
                <!-- Indicador de carregamento -->
                <div class="lazy-loading-indicator text-center" ng-show="carregandoMaisItens" style="padding: 20px;">
                    <i class="fa fa-spinner fa-spin"></i> Carregando mais itens...
                </div>
                <!-- Botão para carregar mais (fallback) -->
                <!-- div class="text-center" ng-if="temMaisItens && !carregandoMaisItens" style="padding: 20px;">
                    <button class="btn btn-default" ng-click="carregarMaisItens()">
                        <i class="fa fa-plus"></i> Carregar mais itens
                    </button>
                </div -->
                </div>
            </div>`;

            elem.html(html);
            $(elem).css('margin-top', '400px !important')
            
            // Implementação do Lazy Loading
            scope.listaConsultaVisivel = [];
            scope.carregandoMaisItens = false;
            scope.temMaisItens = true;
            scope.itensPorCarregamento = 20; // Número de itens carregados por vez
            scope.ultimaPaginaCarregada = 0;
            
            // Variáveis para controle do filtro de resultado
            scope.listaConsultaCompleta = []; // Lista completa original (fonte de dados)
            scope.listaConsultaFiltrada = []; // Lista filtrada (resultado do filtro)
            scope.filtroResultadoAtivo = '';
            
            // Variável para controle de debounce do filtro
            var filtroTimeout = null;
            
            // Inicializar lista visível quando listaConsulta mudar
            var watchingUpdate = false; // Flag para evitar loops
            
            scope.$watch('listaConsulta', function(novaLista, listaAnterior) {
                // Evitar processamento durante updates internos
                if (watchingUpdate) return;
                
                if (novaLista && novaLista.length > 0 && novaLista !== listaAnterior) {
                    // Verificar se a mudança veio de uma fonte externa (não do filtro)
                    var mudancaExterna = !scope.filtroResultadoAtivo || 
                                       (scope.listaConsultaCompleta.length === 0) ||
                                       (novaLista.length > scope.listaConsultaCompleta.length);
                    
                    if (mudancaExterna) {
                        // Salvar como lista completa apenas se for mudança externa
                        scope.listaConsultaCompleta = angular.copy(novaLista);
                        
                        // Se não há filtro ativo, inicializar carregamento
                        if (!scope.filtroResultadoAtivo) {
                            scope.listaConsultaVisivel = [];
                            scope.ultimaPaginaCarregada = 0;
                            scope.temMaisItens = true;
                            setTimeout(function() {
                                scope.carregarMaisItens();
                            }, 100);
                        }
                    }
                }
            });
            
            // Função para filtrar itens da lista baseado no filtroResultado
            scope.aplicarFiltroResultado = function() {
                if (!scope.listaConsultaCompleta || scope.listaConsultaCompleta.length === 0) {
                    scope.listaConsultaFiltrada = [];
                    // Evitar trigger do watch durante atualização interna
                    watchingUpdate = true;
                    scope.listaConsulta = [];
                    setTimeout(function() { watchingUpdate = false; }, 0);
                    return;
                }

                var filtro = scope.filtroResultadoAtivo;
                if (!filtro || filtro === '') {
                    // Se não há filtro, usar lista completa
                    scope.listaConsultaFiltrada = angular.copy(scope.listaConsultaCompleta);
                } else {
                    // Aplicar filtro na lista completa
                    scope.listaConsultaFiltrada = scope.listaConsultaCompleta.filter(function(item) {
                        return scope.itemPassaNoFiltro(item, filtro);
                    });
                }
                
                // Atualizar listaConsulta com o resultado filtrado (evitar trigger do watch)
                watchingUpdate = true;
                scope.listaConsulta = angular.copy(scope.listaConsultaFiltrada);
                setTimeout(function() { watchingUpdate = false; }, 0);
                
                // Resetar lista visível para mostrar itens filtrados
                scope.listaConsultaVisivel = [];
                scope.ultimaPaginaCarregada = 0;
                scope.temMaisItens = scope.listaConsultaFiltrada.length > 0;
                
                // Carregar primeiros itens imediatamente se há dados
                if (scope.listaConsultaFiltrada.length > 0) {
                    scope.ultimaPaginaCarregada = 1;
                    scope.$evalAsync(function() {
                        scope.carregarDaListaAtual();
                    });
                }
            };
            
            // Função para verificar se um item passa no filtro
            scope.itemPassaNoFiltro = function(item, filtro) {
                if (!filtro || filtro === '') return true;
                
                var filtroLower = filtro.toLowerCase();
                
                // Buscar em todas as propriedades do item
                for (var prop in item) {
                    if (item.hasOwnProperty(prop) && item[prop] !== null && item[prop] !== undefined) {
                        var valor = item[prop].toString().toLowerCase();
                        if (valor.indexOf(filtroLower) !== -1) {
                            return true;
                        }
                    }
                }
                return false;
            };
            
            // Função para aplicar filtro de forma imediata (sem debounce)
            scope.aplicarFiltroImediato = function(filtro) {
                scope.filtroResultadoAtivo = filtro || '';
                
                // Cancelar timeout pendente
                if (filtroTimeout) {
                    clearTimeout(filtroTimeout);
                    filtroTimeout = null;
                }
                
                scope.aplicarFiltroResultado();
            };
            
            // Função para limpar o filtro
            scope.limparFiltroResultado = function() {
                // Cancelar timeout pendente
                if (filtroTimeout) {
                    clearTimeout(filtroTimeout);
                    filtroTimeout = null;
                }
                
                // Limpar o campo visual diretamente
                $('#filtro_resultado').val('');
                
                // Limpar as variáveis do scope
                scope.filtroResultado = '';
                scope.filtroResultadoAtivo = '';
                
                // Aplicar a limpeza do filtro
                scope.aplicarFiltroResultado();
                
                // Forçar atualização do Angular se necessário
                if (!scope.$$phase && !scope.$root.$$phase) {
                    scope.$apply();
                }
            };
            
            // Watch para alterações no filtroResultado com debounce
            scope.$watch('filtroResultado', function(novoFiltro, filtroAnterior) {
                // Cancelar timeout anterior se existir
                if (filtroTimeout) {
                    clearTimeout(filtroTimeout);
                }
                
                // Aplicar filtro com debounce para evitar execuções desnecessárias
                filtroTimeout = setTimeout(function() {
                    scope.$apply(function() {
                        scope.filtroResultadoAtivo = novoFiltro || '';
                        scope.aplicarFiltroResultado();
                    });
                    filtroTimeout = null;
                }, 300); // 300ms de debounce
            });
            
            // Watch adicional sem debounce para detectar mudanças muito rápidas
            var ultimoFiltroAplicado = '';
            scope.$watch('filtroResultado', function(novoFiltro) {
                // Se o filtro mudou muito rápido e ainda não foi aplicado
                if (novoFiltro !== ultimoFiltroAplicado && filtroTimeout) {
                    ultimoFiltroAplicado = novoFiltro;
                    
                    // Para strings muito curtas ou vazias, aplicar imediatamente
                    if (!novoFiltro || novoFiltro.length <= 2) {
                        clearTimeout(filtroTimeout);
                        scope.aplicarFiltroImediato(novoFiltro);
                        filtroTimeout = null;
                    }
                }
            });
            
            // Função para carregar mais itens
            scope.carregarMaisItens = function() {
                if (scope.carregandoMaisItens || !scope.temMaisItens) {
                    return;
                }
                
                scope.carregandoMaisItens = true;
                scope.ultimaPaginaCarregada++;
                
                // Simular delay de carregamento (pode ser removido em produção)
                setTimeout(function() {
                    // Solicitar novos dados do backend
                    scope.carregarDadosLazyLoad();
                }, 300);
            };
            
            // Função para carregar dados do backend
            scope.carregarDadosLazyLoad = function() {
                if (scope.$parent && scope.$parent.filtrar) {
                    // Usar a função filtrar existente mas com parâmetros de lazy loading
                    var parametrosLazyLoad = {
                        pagina: scope.ultimaPaginaCarregada,
                        itensPagina: scope.itensPorCarregamento,
                        lazyLoad: true // Flag para indicar que é carregamento lazy
                    };
                    
                    // Chamar função filtrar do escopo pai
                    scope.$parent.filtrar(scope.ultimaPaginaCarregada, 'lazyLoad');
                } else {
                    // Fallback: carregar da lista atual
                    scope.carregarDaListaAtual();
                }
            };
            
            // Fallback: carregar da lista atual em memória
            scope.carregarDaListaAtual = function() {
                var inicio = (scope.ultimaPaginaCarregada - 1) * scope.itensPorCarregamento;
                var fim = inicio + scope.itensPorCarregamento;
                
                // Usar sempre listaConsulta (que já está filtrada)
                var listaParaUsar = scope.listaConsulta || [];
                
                if (listaParaUsar && listaParaUsar.length > 0) {
                    var novosItens = listaParaUsar.slice(inicio, fim);
                    
                    if (novosItens.length > 0) {
                        // Se é o primeiro carregamento após filtro, resetar lista visível
                        if (scope.ultimaPaginaCarregada === 1) {
                            scope.listaConsultaVisivel = [];
                        }
                        scope.listaConsultaVisivel = scope.listaConsultaVisivel.concat(novosItens);
                        scope.temMaisItens = fim < listaParaUsar.length;
                    } else {
                        scope.temMaisItens = false;
                    }
                } else {
                    scope.listaConsultaVisivel = [];
                    scope.temMaisItens = false;
                }
                
                scope.carregandoMaisItens = false;
                
                // Aplicar escopo apenas se não estamos dentro de um digest
                if (!scope.$$phase && !scope.$root.$$phase) {
                    scope.$apply();
                }
            };
            
            // Configurar scroll infinito
            setTimeout(function() {
                var container = elem.find('[lazy-load-container]');
                if (container.length > 0) {
                    container.on('scroll', function() {
                        var element = this;
                        if (element.scrollTop + element.clientHeight >= element.scrollHeight - 100) {
                            scope.$apply(function() {
                                scope.carregarMaisItens();
                            });
                        }
                    });
                }
                
                // Fallback: usar scroll da window
                $(window).on('scroll', function() {
                    if ($(window).scrollTop() + $(window).height() >= $(document).height() - 200) {
                        scope.$apply(function() {
                            scope.carregarMaisItens();
                        });
                    }
                });
            }, 500);

            $compile(elem.contents())(scope);
        }
    }
}])
    .directive('contadorFiltro', ($compile) => {
        return {
            restrict: 'E',
            link: (scope, elem, attr) => {
                var atualizarContador = function() {
                    var html = '';
                    var totalCompleto = scope.listaConsultaCompleta ? scope.listaConsultaCompleta.length : 0;
                    var totalFiltrado = scope.listaConsulta ? scope.listaConsulta.length : 0;
                    var visiveis = scope.listaConsultaVisivel ? scope.listaConsultaVisivel.length : 0;
                    
                    if (scope.filtroResultado && scope.filtroResultado.length > 0) {
                        html = `Exibindo: <span id="qtdconsulta">${visiveis}</span> de ${totalFiltrado} filtrados (${totalCompleto} total)`;
                    } else {
                        html = `Itens na Consulta: <span id="qtdconsulta">${visiveis}</span> de ${totalCompleto} total`;
                    }
                    elem.html(html);
                };
                
                // Atualizar contador quando as listas mudarem
                scope.$watchGroup(['listaConsultaCompleta.length', 'listaConsulta.length', 'listaConsultaVisivel.length', 'filtroResultado'], atualizarContador);
                
                // Atualização inicial
                atualizarContador();
            }
        }
    })