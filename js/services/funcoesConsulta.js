/**
 * Serviço de Funções Comuns para Consultas
 * Centraliza funções utilizadas tanto por listaConsulta quanto por listaConsultaTabela
 */
app.factory('FuncoesConsulta', ['APIServ', function(APIServ) {
    
    var funcoesConsulta = {};
    
    /**
     * Função para entrar em um input de consulta
     * Salva o valor original do campo para comparação posterior
     */
    funcoesConsulta.aoEntrarInputConsulta = function(item, event) {
        var campo = $(event.target).attr("campo");
        
        item.valoresOriginais = item.valoresOriginais != undefined ? item.valoresOriginais : {};
        item.valoresOriginais[campo] = 
            item.valoresOriginais != undefined && item.valoresOriginais[campo] != undefined 
                ? item.valoresOriginais[campo] 
                : item[campo];
    };
    
    /**
     * Função para detectar alterações em campos de consulta
     * Compara o valor atual com o valor original e aplica estilos visuais
     */
    funcoesConsulta.alteracaoItemConsulta = function(item, event) {
        var elemento = $(event.target);
        var campo = elemento.attr("campo");
        
        if (item.valoresOriginais[campo] != undefined && item.valoresOriginais[campo] != item[campo]) {
            $(event.target).closest(".itemConsulta").addClass("fundoVermelho");
            item.habilitarSalvar = true;
            $("#filtro_resultado").prop("disabled", "disabled");
        } else {
            $("#filtro_resultado").prop("disabled", "");
            $(event.target).closest(".itemConsulta").removeClass("fundoVermelho");
            item.habilitarSalvar = false;
        }
    };
    
    /**
     * Função para salvar alterações de um item de consulta
     * Envia os dados alterados para o servidor
     */
    funcoesConsulta.salvarAlteracoesItem = function(item, event, parametros) {
        var elemento = $(event.target);
        
        var parametrosAlteracao = {
            tabela: parametros.tabela,
            campoChave: parametros.campo_chave,
            dados: item,
        };
        
        var fd = new FormData();
        fd.append("parametros", JSON.stringify(parametrosAlteracao));
        
        APIServ.executaFuncaoClasse("classeGeral", "alterarItemConsulta", fd, "post").success(function(retorno) {
            if (retorno.camposObrigatoriosVazios != undefined) {
                APIServ.mensagemSimples("Há Campos Obrigatórios Vazios");
            } else if (retorno.sucesso != undefined) {
                $("#filtro_resultado").prop("disabled", "");
                $(event.target).closest(".itemConsulta").removeClass("fundoVermelho");
                item.habilitarSalvar = false;
            } else if (retorno.erro != undefined) {
                APIServ.mensagemSimples(retorno.erro);
            }
        });
    };
    
    /**
     * Função para cancelar alterações de um item de consulta
     * Restaura os valores originais do item
     */
    funcoesConsulta.cancelarAlteracoesItem = function(item, event) {
        console.log(item);
        for (var v in item) {
            item[v] = item.valoresOriginais != undefined && item.valoresOriginais[v] != undefined 
                ? item.valoresOriginais[v] 
                : item[v];
        }
        
        $(event.target).closest(".itemConsulta").removeClass("fundoVermelho");
        item.habilitarSalvar = false;
        $("#filtro_resultado").prop("disabled", "");
    };
    
    /**
     * Função para mesclar campos de listaConsulta com campos
     * Combina as configurações de ambos os objetos
     * IMPORTANTE: Mostra apenas os campos que estão em listaConsulta
     */
    funcoesConsulta.mesclarCampos = function(listaConsulta, campos) {
        var camposMesclados = angular.copy(listaConsulta || {});
        
        if (campos) {
            angular.forEach(camposMesclados, function(val, key) {
                if (campos.hasOwnProperty(key)) {
                    // Campo existe em ambos, verifica se o valor em listaConsulta está vazio
                    var valorListaConsulta = val;
                    if (
                        valorListaConsulta === null ||
                        valorListaConsulta === undefined ||
                        valorListaConsulta === "" ||
                        (typeof valorListaConsulta === "object" && Object.keys(valorListaConsulta).length === 0)
                    ) {
                        // Valor em listaConsulta está vazio, usa o valor de campos
                        camposMesclados[key] = campos[key];
                    } else if (typeof valorListaConsulta === "object" && typeof campos[key] === "object") {
                        // Ambos são objetos, faz merge das propriedades
                        angular.forEach(campos[key], function(campoVal, campoKey) {
                            if (!camposMesclados[key].hasOwnProperty(campoKey)) {
                                camposMesclados[key][campoKey] = campoVal;
                            }
                        });
                    }
                }
            });
            
            // NÃO adicionar campos que existem apenas em 'campos'
            // Apenas os campos que estão em listaConsulta devem ser exibidos
        }
        
        return camposMesclados;
    };
    
    /**
     * Função para gerar classes CSS baseadas na posição dos botões
     */
    funcoesConsulta.gerarClassesBotoes = function(posicaoBotoes) {
        var classeBotoes, classeLista;
        
        if (posicaoBotoes == "superior" || posicaoBotoes == "inferior") {
            classeBotoes = "col-xs-12";
            classeLista = "col-xs-12";
        } else if (posicaoBotoes == "direita") {
            classeBotoes = "col-xs-12 col-md-2";
            classeLista = "col-xs-12 col-md-10";
        } else {
            // esquerda (padrão)
            classeBotoes = "col-xs-12 col-md-2";
            classeLista = "col-xs-12 col-md-10";
        }
        
        return {
            classeBotoes: classeBotoes,
            classeLista: classeLista
        };
    };
    
    /**
     * Função para obter informações do usuário atual
     */
    funcoesConsulta.obterInformacoesUsuario = function() {
        var usuario = APIServ.buscaDadosLocais("usuario");
        var admSistema = usuario["administrador_sistema"] == "S";
        
        return {
            usuario: usuario,
            admSistema: admSistema
        };
    };
    
    /**
     * Função para obter parâmetros da URL
     */
    funcoesConsulta.obterParametrosUrl = function(acao) {
        return acao != undefined ? acao : APIServ.parametrosUrl()[1];
    };
    
    /**
     * Função para gerar HTML de botões de ação
     */
    funcoesConsulta.gerarHtmlBotoesAcao = function(item, parametros, admSistema, acao) {
        var htmlBotoes = '';
        
        if (parametros.botoesAcoesItensConsulta) {
            angular.forEach(parametros.botoesAcoesItensConsulta, function(botao, index) {
                var mostrarBotao = true;
                
                // Verificar permissões
                if (botao.permissao && !admSistema) {
                    mostrarBotao = false;
                }
                
                // Verificar condições específicas
                if (botao.condicao) {
                    try {
                        mostrarBotao = eval(botao.condicao.replace(/item\./g, 'item["').replace(/\b/g, '"]'));
                    } catch (e) {
                        console.warn('Erro ao avaliar condição do botão:', botao.condicao, e);
                        mostrarBotao = false;
                    }
                }
                
                if (mostrarBotao) {
                    var classeBotao = botao.classe || 'btn-default';
                    var icone = botao.icone ? '<i class="' + botao.icone + '"></i> ' : '';
                    var texto = botao.texto || '';
                    var titulo = botao.titulo || '';
                    
                    htmlBotoes += `<button class="btn ${classeBotao} btn-xs" 
                                           ng-click="${botao.funcao}(item, $event)" 
                                           title="${titulo}"
                                           style="margin: 1px;">
                                    ${icone}${texto}
                                  </button>`;
                }
            });
        }
        
        return htmlBotoes;
    };
    
    return funcoesConsulta;
}]);
