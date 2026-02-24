directivesPadrao.directive("formularioCadastro", [
    "$rootScope",
    "$compile",
    "APIServ",
    "APIAjuFor",
    "EGFuncoes",
    function ($rootScope, $compile, APIServ, APIAjuFor, EGFuncoes) {
        return {
            restrict: "E",
            replace: true,
            template: "",
            link: function (escopo, elem) {                
                const classe = elem.closest('estrutura-gerencia').attr('classe') ;
                var escopo = $rootScope['estruturas'][classe];           
                               
                
                var parametros = escopo.estrutura;
                var nomeForm = "formCad" + parametros.raizModelo;
                var funcaoSalvar = parametros.funcaoSalvar != undefined ? parametros.funcaoSalvar : "salvar";
                var textoSalvar = parametros.textoBotaoSalvar != undefined ? parametros.textoBotaoSalvar : "Salvar";
                var classesSalvar =
                    parametros.classesBotaoSalvar != undefined ? parametros.classesBotaoSalvar : "btn-success input-lg col-xs-12 col-md-6 col-md-offset-2";
                var tiposAnexos = parametros.anexos != undefined && parametros.anexos.tipoAnexos != undefined ? parametros.anexos.tipoAnexos : "padrao";

                var varVerSub = parametros.variavelValidarAoSubmeter != undefined ? parametros.variavelValidarAoSubmeter : undefined;
                varVerSub = varVerSub != undefined ? ` && ${varVerSub} != undefined && ${varVerSub} ` : "";

                var html = `<form name="${nomeForm}" id="${nomeForm}" ng-submit="${nomeForm}.$valid ${varVerSub} && ${funcaoSalvar}(${parametros.raizModelo}, ${nomeForm})" 
                        ng-if="tela == 'cadastro'" valida-Formulario novalidate enctype="multipart/form-data" autocomplete="off">                        
                        <input type="search" autocomplete="off" name="hidden" type="text" style="display:none;">                        
                    <div class="col-xs-12 well" id="formCadastro">               
                    
                        <!--h1 class="text-center" ng-if="${parametros.raizModelo}.${parametros.campo_chave} == 0">${parametros.textoFormCadastro}</h1>
                        <h1 class="text-center" ng-if="${parametros.raizModelo}.${parametros.campo_chave} > 0">${parametros.textoFormAlteracao}</h1-->`;

                if (parametros.ocultarBotoesSuperiores == undefined || parametros.ocultarBotoesSuperiores == false) {
                    html += `<div class="col-xs-12">
                            <input type="submit" value="${textoSalvar}" class="btn   ${classesSalvar} " ng-disabled="desabilitarSalvar" >
                            <input type="button" value="Cancelar" class="cancelaCadastro btn btn-danger col-xs-12 col-md-3 col-md-offset-1" ng-click="mudaTela('consulta')"
                                ng-if="estrutura.tipoEstrutura != 'cadastroDireto' && estrutura.tipoEstrutura != 'somenteCadastro'">
                        </div> `;
                }

                html += `   <div class="row bg-danger" ng-if="${nomeForm}.$submitted && ${nomeForm}.$invalid">
                            <h2 class="text-center">Há Campos Obrigatórios não Preenchidos</h2>
                        </div>`;

                //MONTANDO OS CAMPOS DO FORMULARIO

                var parametrosLocal = APIServ.buscaDadosLocais("parametrosUrl");

                //Vendo se tem tabelas relacionadas, para criar os campos na estrutura, e criar os campos hidden na tela
                if (parametrosLocal != undefined && parametrosLocal.tabelasRelacionadas != undefined) {
                    //escopo[parametros.raizModelo]['tabelasRelacionadas'] = APIServ.criptografa(angular.toJson(parametrosLocal.tabelasRelacionadas));
                    escopo.estrutura["tabelasRelacionadas"] = Object.assign({}, escopo.estrutura.tabelasRelacionadas, parametrosLocal.tabelasRelacionadas);

                    Object.keys(parametrosLocal.tabelasRelacionadas).map((key) => {
                        var pL = parametrosLocal;
                        var tR = pL.tabelasRelacionadas[key];

                        var campo_relacionamento = tR["campo_relacionamento"];
                        var valorChaveRelacionamento = tR["valor_chave_relacionamento"];
                        parametros.campos[campo_relacionamento] = {
                            padrao: valorChaveRelacionamento,
                            tipo: "oculto",
                        };
                        escopo[parametros.raizModelo][campo_relacionamento] = valorChaveRelacionamento;

                        if (tR.tabelasSubRelacionadas != undefined) {
                            Object.keys(tR.tabelasSubRelacionadas).map((keySR) => {
                                var tSR = tR.tabelasSubRelacionadas[keySR];
                                var campo_subRelacinamento = tSR["campo_relacionamento"];
                                var valorChaveSubRelacionada = tSR["valor_chave_relacionamento"];

                                parametros.campos[campo_subRelacinamento] = {
                                    padrao: valorChaveSubRelacionada,
                                    tipo: "oculto",
                                };
                                escopo[parametros.raizModelo][campo_subRelacinamento] = valorChaveSubRelacionada;
                            });
                        }
                    });
                }

                //APIServ.apagaDadosLocais('parametrosUrl');
                var foco = false;

                angular.forEach(parametros.campos, function (propriedades, campo) {
                    if (campo.substr(0, 5) == "botao") {
                        html += `<input-botao parametros="${campo}"></input-botao>`;
                    } else if (propriedades.tipo == "diretiva" || propriedades == "diretiva") {
                        var atributos = propriedades.atributos_diretiva != undefined ? EGFuncoes.montarAtributos(propriedades.atributos_diretiva) : [];

                        var nomeDiretiva =
                            propriedades.nomeDiretiva != undefined
                                ? APIAjuFor.variavelParaDiretiva(propriedades.nomeDiretiva)
                                : APIAjuFor.variavelParaDiretiva(campo);
                        html += `<${nomeDiretiva} ${atributos.join(" ")}></${nomeDiretiva}>`;
                    } else if (campo.substr(0, 5) != "bloco") {
                        var incluirFoco = "";
                        if (propriedades.tipo != "oculto") {
                            incluirFoco = !foco ? "foco" : "";
                            foco = true;
                        }

                        if (escopo.parametrosRecebidos != undefined && escopo.parametrosRecebidos[campo] != undefined) {
                            escopo[parametros.raizModelo][campo] = escopo.parametrosRecebidos[campo]["valor"];
                        }

                        html += `<monta-html campo="${campo}" ${incluirFoco}></monta-html>`;
                    } else if (campo.substr(0, 5) == "bloco") {
                        propriedades.modeloBloco = campo;
                        html += `<monta-bloco-html nome-bloco="${campo}"></monta-bloco-html>`;
                    }
                });

                if (parametros.anexos != undefined) {
                    html += `<arquivos-anexos tela="cadastro" tipo="${tiposAnexos}"></arquivos-anexos>`;
                }
                // else if (parametros.anexos.tipoAnexos != undefined && parametros.anexos.tipoAnexos == 'copiarColar') {
                //     html += `<arquivos-anexos-copiar-colar tela="cadastro"></arquivos-anexos-copiar-colar>`;
                // }

                //FIM FORMULARIO
                html += `
                        <div class="col-xs-12 bg-danger" ng-if="${nomeForm}.$submitted && ${nomeForm}.$invalid">
                            <h2 class="text-center">Há Campos Obrigatórios não Preenchidos</h2>
                        </div>`;
                if (parametros.ocultarBotoesInferiores == undefined || parametros.ocultarBotoesInferiores == false) {
                    html += `
                        <div class="col-xs-12">
                            <input type="submit" value="${textoSalvar}" class="btn ${classesSalvar}"  ng-disabled="desabilitarSalvar">
                            <input type="button" value="Cancelar" class="cancelaCadastro btn btn-danger col-xs-12 col-md-3 col-md-offset-1" ng-click="mudaTela('consulta')"
                                ng-if="estrutura.tipoEstrutura != 'cadastroDireto' && estrutura.tipoEstrutura != 'somenteCadastro'">
                        </div>`;
                }

                html += `
                    </div>
                </form>`;

                elem.html(html);
                $compile(elem.contents())($rootScope['estruturas'][classe]);
            },
        };
    },
]);
