// JavaScript Document
/*
 jQuery(document)
 .ajaxStart(function() {
 $('#divaguarde').fadeIn('fast');
 }).ajaxStop(function(){
 $('#divaguarde').fadeOut('fast');
 })
 */

$(document)
        .on('click', 'img.ocultarexpandirdiv', function () {
            var divmanipular = $(this).attr('divmanipular');
            if (divmanipular == 'irmas') {
                if ($(this).siblings('div').is(':visible')) {
                    $(this).siblings('div').fadeOut('fast');
                    $(this).attr('src', 'imagens/painel/mais.png');
                } else if (!$(this).siblings('div').is(':visible')) {
                    $(this).siblings('div').fadeIn('fast');
                    $(this).attr('src', 'imagens/painel/menos.png');
                }
            }
        });

/*
 *
 * @param {type} id_item nome do select que foi alterado
 * @param {type} classe_item classe igual nos selects de posicao
 * @param {type} classe_paiitem div que o select esta contido
 * @param {type} id_pai id da div que contem as divs pais do item
 * @param {type} caminho_classe caminho para o arquivo de classe que sera chamado
 * @param {type} funcao funcao que alterara a posicao dos itens
 * @returns {undefined}
 */
jQuery.alterarposicao = function (id_item, classe_item, classe_paiitem, id_pai, caminho_classe, funcao) {
    var id_item = '#' + id_item;
    var id_pai = '#' + id_pai;

    var campo_ctp = $(id_item).attr('campo_ctp');
    var valor_ctp = $(id_item).attr('valor_ctp');

    var pos_atual = parseInt($(id_item).attr('posicao'));
    var nova_pos = parseInt($(id_item).val());
    var qtd_alterar = nova_pos - pos_atual < 0 ? (nova_pos - pos_atual) * -1 : nova_pos - pos_atual;

    var chave_primaria = id_item.split('_')[1];

    funcao = funcao == undefined ? 'alteraposicao' : funcao;

    if (nova_pos < pos_atual) {
        var inicio = nova_pos;
        var fim = pos_atual - 1;
        var acrescentar = 1;
    } else if (nova_pos > pos_atual) {
        var inicio = pos_atual + 1;
        var fim = nova_pos;
        var acrescentar = -1;
    }

    $.ajax({
        url: caminho_classe,
        type: 'POST',
        async: false,
        data: {
            funcao_executar: funcao,
            parametros: {
                campo_ctp: campo_ctp,
                valor_ctp: valor_ctp,
                pos_atual: pos_atual,
                nova_pos: nova_pos,
                chave_primaria: chave_primaria,
                acrescentar: acrescentar,
                qtd_alterar: qtd_alterar
            }
        },
        success: function (retorno) {
            console.log(retorno);
            //alert(retorno);
        }
    });


    for (i = inicio; i <= fim; i++) {
        var temp = parseInt(i) + acrescentar;
        var id = '#' + $('select.' + classe_item + '[posicao=' + i + '][valor_ctp="' + valor_ctp + '"]').attr('id');
        $(id).val(temp);
    }

    $('select.' + classe_item).each(function (index, element) {
        $(this).attr('posicao', this.value);
    });
    pos_atual = nova_pos;

    var div = $(id_item).parents('.' + classe_paiitem);
    var html = $(id_item).parents('.' + classe_paiitem).clone();
    $(div).fadeOut('fast').remove();
    var indice = nova_pos - 1 >= 0 ? nova_pos - 1 : 0;

    var final = false;
    var qtd_divs = $('.' + classe_paiitem).length;
    if (indice == qtd_divs) {
        var final = true;
    }

    if (final) {
        $(html).appendTo(id_pai);
    } else {
        var qtd_select = $('select.' + classe_item + '[valor_ctp="' + valor_ctp + '"]').length;
        var cont = qtd_select == indice ? 1 : 0;

        $('.' + classe_paiitem).each(function (index, element) {
            if ($(this).find('select.' + classe_item).attr("valor_ctp") === valor_ctp) {
                if (cont == indice) {
                    if (qtd_select == indice) {
                        $(html).insertAfter(this);
                    } else {
                        $(html).insertBefore(this);
                    }
                }
                cont++;
            }
        });
    }

    $(id_item).val(nova_pos);
    $(id_pai).ajustarcoresdivs();
}

//Funcao para atualizar as posiçoes dos Itens
/*
 *
 * @param {type} div div que contem as outras divs com os selects
 * @param {type} posicao
 * @param {type} acao
 * @returns {undefined}
 */
jQuery.atualizarposicoes = function (div, posicao, acao) {
    //O parametro div é a div onde estao listados os elementos a serem organizados
    //A posiçao é para caso esteja excluindo, indica a posiçao que foi excluida
    var obj = '#' + div + ' select.posicao:visible';

    if (acao == 'retirar') {
        //Caso tenha sido apagado eu atualizao o atributo posicao para depois atualizar
        //o valor dos selects
        if (posicao && posicao > 0) {
            $(obj).each(function () {
                var posicao_elemento = $(this).attr('posicao');
                if(posicao_elemento == posicao){
                    $(this).attr('posicao', 0).fadeOut();
                }
                if (posicao_elemento > posicao) {
                    $(this).attr('posicao', $(this).attr('posicao') - 1);
                }
            });
        }
    }


    //Fazendo rotina para preencher as posiçoes e a posiçao atual do MENU
    //Pegando a maior posiçao
    if (posicao) {
        //Neste caso está tirando ou pondo posiçao
        var total_posicoes = acao == 'retirar' ? $(obj).length : posicao;
    } else {
        //Neste caso atualizando as posiçoes na consulta
        var total_posicoes = $(obj).length;
    }

    //Pondo valores nos selects
    $(obj).each(function () {
        $(this).empty();
        for (var c = 1; c <= total_posicoes; c++) {
            $(this).append(new Option(c, c));
        }
        $(this).val($(this).attr('posicao'));
    });
};



/*Funçao utilizada quando o texto está convertido para html
 devido a funçao json_encode do PHP*/
jQuery.htmlDecode = function (valor) {
    if (valor) {
        return $('<div />').html(valor).text();
    } else {
        return '';
    }
}


jQuery.primeiramaiusculo = function (texto) {
    var primeira = texto.substr(0, 1);
    var restante = $.minusculo(texto.substr(1, texto.length - 1));
    primeira = $.maiusculo(primeira);
    return primeira + restante;
}


jQuery.maiusculo = function (texto) {
    return texto != undefined ? texto.toUpperCase() : '';
}

jQuery.minusculo = function (texto) {
    return texto != undefined ? texto.toLowerCase() : '';
}

jQuery.fn.limparacentos = function (maimin, espaco) {
    this.blur(function () {
        var text = $(this).val();

        text = text.replace(new RegExp('[ÁÀÂÃÄ]', 'g'), 'A');
        text = text.replace(new RegExp('[áàâãä]', 'g'), 'a');
        text = text.replace(new RegExp('[ÉÈÊË]', 'g'), 'E');
        text = text.replace(new RegExp('[éèêë]', 'g'), 'e');
        text = text.replace(new RegExp('[ÍÌÎÏ]', 'g'), 'I');
        text = text.replace(new RegExp('[íìîï]', 'g'), 'i');
        text = text.replace(new RegExp('[ÓÒÔÕÖ]', 'g'), 'O');
        text = text.replace(new RegExp('[óòôõö]', 'g'), 'o');
        text = text.replace(new RegExp('[ÚÙÛÜ]', 'g'), 'U');
        text = text.replace(new RegExp('[úùûü]', 'g'), 'u');
        text = text.replace(new RegExp('[Ç]', 'g'), 'C');
        text = text.replace(new RegExp('[ç]', 'g'), 'c');
        if (espaco == 'nao')
            text = text.replace(new RegExp('[ ]', 'g'), '');
        text = text.replace(new RegExp('[´`~^¨]', 'g'), '');
        //text = text.replace(new RegExp('[\/:*?"<>|]', 'g'), '');

        if (maimin == 'min')
        {
            $(this).val(text.toLowerCase());
        } else if (maimin == 'mai') {
            $(this).val(text.toUpperCase());
        } else {
            $(this).val(text);
        }
    });
}

jQuery.limpaacentos = function (texto, casetemp) {
    var text = texto;
    text = text.replace(new RegExp('[ÁÀÂÃÄ]', 'g'), 'A');
    text = text.replace(new RegExp('[áàâãä]', 'g'), 'a');
    text = text.replace(new RegExp('[ÉÈÊË]', 'g'), 'E');
    text = text.replace(new RegExp('[éèêë]', 'g'), 'e');
    text = text.replace(new RegExp('[ÍÌÎÏ]', 'g'), 'I');
    text = text.replace(new RegExp('[íìîï]', 'g'), 'i');
    text = text.replace(new RegExp('[ÓÒÔÕÖ]', 'g'), 'O');
    text = text.replace(new RegExp('[óòôõö]', 'g'), 'o');
    text = text.replace(new RegExp('[ÚÙÛÜ]', 'g'), 'U');
    text = text.replace(new RegExp('[úùûü]', 'g'), 'u');
    text = text.replace(new RegExp('[Ç]', 'g'), 'C');
    text = text.replace(new RegExp('[ç]', 'g'), 'c');
    text = text.replace(new RegExp('[´`~^¨]', 'g'), '');
    //text = text.replace(new RegExp('[\/:*?"<>|]', 'g'), '');
    if (casetemp == 'M') {
        return text.toUpperCase();
    } else if (casetemp == 'm') {
        return text.toLowerCase();
    } else {
        return text;
    }
}

jQuery.textoparafloat = function (valor) {

    if (valor == '') {
        return 0;
    } else {
        var temp = valor;
        temp = temp.replace('.', '');
        temp = temp.replace(',', '.');
        return temp;
    }
}

jQuery.number_format = function (valor, casas_decimais, separador_decimal, separador_milhar) {
    valor = (valor + '').replace(/[^0-9+\-Ee.]/g, '');
    var n = !isFinite(+valor) ? 0 : +valor,
            prec = !isFinite(+casas_decimais) ? 0 : Math.abs(casas_decimais),
            sep = (typeof separador_milhar === 'undefined') ? ',' : separador_milhar,
            dec = (typeof separador_decimal === 'undefined') ? '.' : separador_decimal,
            s = '',
            toFixedFix = function (n, prec) {
                var k = Math.pow(10, prec);
                return '' + Math.round(n * k) / k;
            };
    // Fix for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
    if (s[0].length > 3) {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
    }
    if ((s[1] || '').length < prec) {
        s[1] = s[1] || '';
        s[1] += new Array(prec - s[1].length + 1).join('0');
    }
    return s.join(dec);
}

jQuery.fn.ajustarcoresdivs = function (div_pai, classdivfilha) {

    $(this).children('div').removeClass('div1 div2');

    $(this).children('div:even').addClass('div1');

    $(this).children('div:odd').addClass('div2');

}



jQuery.fn.ajustarcoresdivs2 = function (div_pai) {

    $(this).children('div').removeClass('div3 div4');

    $(this).children('div:even').addClass('div3');

    $(this).children('div:odd').addClass('div4');

}

jQuery.fn.ajustarcoresdivs3 = function (div_pai) {

    $(this).children('div').removeClass('div5 div6');

    $(this).children('div:even').addClass('div5');

    $(this).children('div:odd').addClass('div6');

}



jQuery.fn.ajustarcoresspans = function (div_pai, classdivfilha) {

    $(this).children('span').removeClass('div1 div2');

    $(this).children('div:even').addClass('div1');

    $(this).children('div:odd').addClass('div2');

}
/*
 setInterval(function () {
 if ($('.divrodape').length) {
 var tamanho_tela = parseInt($(window).height());
 var tamanho_site = parseInt($('.divsite').height());
 var tamanho_centrorodape = $('.divconteudorodape').height();

 if (tamanho_site > tamanho_tela) {
 tamanho_site = tamanho_site;
 var top = tamanho_site + tamanho_centrorodape;
 $('.divrodape').css('margin-top', top + 'px');
 } else {
 var top = tamanho_tela;
 $('.divrodape').css('margin-top', top + 'px');
 }
 }
 }, 200);
 */

// JavaScript Document
