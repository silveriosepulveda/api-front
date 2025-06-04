angular.module('ajudaFormatacoes', [])
    .factory('APIAjuFor', function ($rootScope) {
        // Função auxiliar para padronizar dois dígitos
        const pad2 = n => n.toString().padStart(2, '0');

        var _dateParaTimestamp = data => {
            if (!(data instanceof Date)) return '';
            var ano = data.getFullYear();
            var mes = pad2(data.getMonth() + 1);
            var dia = pad2(data.getDate());
            var hora = pad2(data.getHours());
            var minuto = pad2(data.getMinutes());
            var segundo = pad2(data.getSeconds());
            return `${ano}-${mes}-${dia} ${hora}:${minuto}:${segundo}`;
        }

        var _dataAtual = function (acao, dias) {
            var dt = new Date();
            if (acao === 'subtrair' && typeof dias === 'number') {
                dt.setDate(dt.getDate() - dias);
            } else if (acao === 'somar' && typeof dias === 'number') {
                dt.setDate(dt.getDate() + dias);
            }
            var dia = pad2(dt.getDate());
            var mes = pad2(dt.getMonth() + 1);
            var ano = dt.getFullYear();
            return dia + '/' + mes + '/' + ano;
        }

        var _primeiroDiaMes = function () {
            var dt = new Date().toISOString().slice(0, 10);
            var temp = dt.split('-');
            return '01/' + temp[1] + '/' + temp[0];
        }

        var _horaAtual = function () {
            var temp = new Date();
            var hr = pad2(temp.getHours());
            var min = pad2(temp.getMinutes());
            return hr + ':' + min;
        }

        var _adicionarMeses = function (data, qtdMeses) {
            if (!data || !qtdMeses) return '';
            var temp = data.split('/');
            if (temp.length !== 3) return '';
            var dia = temp[0];
            var mes = temp[1];
            var ano = temp[2];
            var dataTemp = new Date(`${mes}/${dia}/${ano}`);
            var somar = parseInt(qtdMeses) + parseInt(mes) - 1;
            dataTemp.setMonth(somar);
            if (isNaN(dataTemp.getTime())) return '';
            var anoR = dataTemp.getFullYear();
            var mesR = pad2(dataTemp.getMonth() + 1);
            var diaR = pad2(dataTemp.getDate());
            return diaR + '/' + mesR + '/' + anoR;
        }

        var _calcularIdade = (nascimento) => {
            if (!nascimento) return 0;
            var temp = nascimento.split('/');
            if (temp.length !== 3) return 0;
            var d = new Date(),
                ano_atual = d.getFullYear(),
                mes_atual = d.getMonth() + 1,
                dia_atual = d.getDate(),
                ano_aniversario = +temp[2],
                mes_aniversario = +temp[1],
                dia_aniversario = +temp[0],
                quantos_anos = ano_atual - ano_aniversario;
            if (mes_atual < mes_aniversario || (mes_atual == mes_aniversario && dia_atual < dia_aniversario)) {
                quantos_anos--;
            }
            return quantos_anos < 0 ? 0 : quantos_anos;
        }

        var _calcularIMC = (peso, altura) => {
            var pesoC = _textoParaFloat(peso);
            var alturaC = _textoParaFloat(altura);
            var alturaCalcular = alturaC * alturaC;
            if (!alturaCalcular || isNaN(pesoC) || isNaN(alturaCalcular) || alturaCalcular === 0) return '';
            return _numberFormat(pesoC / alturaCalcular, 2);
        }

        var _numberFormat = function (valor, casas_decimais = 2, separador_decimal = ',', separador_milhar = '.') {
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

        var _caracteresValidosDecimais = function (valorEntrada) {
            if (valorEntrada == undefined) {
                return '';
            }

            var retorno = valorEntrada.toString();
            retornoTemp = retorno.replace(/[^-?\d\,]/g, "");
            retorno = '';
            var temVirgula = false;
            for (var i = 0; i < retornoTemp.length; i++) {
                var caracter = retornoTemp.substr(i, 1);
                retorno += temVirgula && caracter == ',' ? '' : caracter;
                if (caracter == ',') {
                    temVirgula = true;
                }
            }
            return retorno;
        }

        var _decimais = function (valorEntrada, casas = 2, maximo = '0') {
            if (valorEntrada == undefined) {
                return '';
            }
            var valor = valorEntrada.split(',');
            var qtd = Object.keys(valor).length;
            var decimais = 0;

            if (qtd > 1) {
                decimais = valor[qtd - 1];
                valor.splice(qtd - 1, 1);
            }

            valor = valor.join('');
            valor = valor.length > 0 ? valor : 0;

            var qtdDecimais = decimais.toString().length;
            if (casas > qtdDecimais) {
                for (var i = qtdDecimais; i < casas; i++) {
                    decimais += '0';
                }
            } else if (qtdDecimais > casas) {
                decimais = decimais.toString().substr(0, casas);
            }

            var qtdLoop = (valor.length - 3) / 3;
            var count = 0;
            while (qtdLoop > count) {
                count++;
                valor = valor.replace(/(\d+)(\d{3}.*)/, "$1.$2");
            }

            var retorno = valor + ',' + decimais;

            var eNumero = retorno != undefined && _textoParaFloat(retorno) > 0;

            if (eNumero && _textoParaFloat(maximo) > 0) {
                var retornoFloat = _textoParaFloat(retorno);
                var valorMaximo = _textoParaFloat(maximo);
                return !maximo ? retorno : retornoFloat <= valorMaximo ? retorno : maximo;
            } else {
                return retorno;
            }
        }

        var _somarTexto = function (valor1, valor2, casasDecimais = 2) {
            var v1 = valor1 != undefined ? _textoParaFloat(valor1) : 0;
            var v2 = valor2 != undefined ? _textoParaFloat(valor2) : 0;
            //console.log(_numberFormat(v1 + v2, 2, ',', '.'));
            return _numberFormat(v1 + v2, casasDecimais, ',', '.');
        }

        var _subtrairTexto = function (valor1, valor2, casasDecimais = 2) {
            var v1 = valor1 != undefined ? _textoParaFloat(valor1) : 0;
            var v2 = valor2 != undefined ? _textoParaFloat(valor2) : 0;
            return _numberFormat(v1 - v2, casasDecimais, ',', '.');
        }

        var _multiplicarTexto = (valor1, valor2, casasDecimais = 2) => {
            var v1 = valor1 != undefined ? _textoParaFloat(valor1) : 0;
            var v2 = valor2 != undefined ? _textoParaFloat(valor2) : 0;
            return _numberFormat(v1 * v2, casasDecimais, ',', '.');
        }

        var _dividirTexto = (valor1, valor2, casasDecimais = 2) => {
            var v1 = valor1 != undefined ? _textoParaFloat(valor1) : 0;
            var v2 = valor2 != undefined ? _textoParaFloat(valor2) : 0;
            return _numberFormat(v1 / v2, casasDecimais, ',', '.');
        }

        var _textoParaFloat = function (valor) {
            var retorno = 0;
            if (valor != '' && valor != undefined) {
                var temp = valor.toString();
                temp = temp != undefined ? temp.replace('.', '') : temp;
                temp = temp != undefined ? temp.replace(',', '.') : temp;
                retorno = temp;
            }
            return parseFloat(retorno);
        };

        function _diretivaParaVariavel(str) {
            return str.replace(/(\-\w)/g, function (m) {
                return m[1].toUpperCase();
            });
        }

        function _variavelParaDiretiva(str) {
            return str.replace(/([A-Z])/g, function ($1) {
                return "-" + $1.toLowerCase();
            });
        }

        var _numeroPar = function (numero) {
            return (numero / 2) == 0;
        }

        var _montaMensagem = function (tipo, campo) {
            switch (tipo) {
                case 'igual':
                    return 'Valor Diferente de: ' + campo;
                    break;
                case 'invalido':
                    return 'Valor Invalido!'
                    break;
                default:
                    return 'Obrigatorio!';
            }
        }

        var _manipularSpan = function (elemento, elementoPai, mensagem, erro, obrigatorio) {
            if (erro) {
                //$(elemento).css('background-color', 'red');
                $(elemento).attr('placeholder', 'Campo Obrigaório');
                $(elemento).addClass('erro');

                $(elemento).attr('data-toggle', 'popover');
                if ($(elemento).attr('data-content') == undefined) {
                    $(elemento).attr('data-content', mensagem);
                }
                $(elemento).popover({
                    'placement': 'bottom'
                }).popover('show');
            } else {
                $(elemento).removeClass('erro');
                $(elemento).removeAttr('data-toggle');
                $(elemento).removeAttr('data-content');
                $(elemento).popover('hide');
            }
            elementoPai.toggleClass('erro', erro);
        }

        var _validarCampos = (nomeFormulario, campos) => {
            return new Promise((resolve, reject) => {
                var form = document.getElementById(nomeFormulario);
                var temCampoInvalido = false;

                angular.forEach(form, function (value, key) {
                    //Varrendo os itens de do formulario e vendo se sao objeto se tem ngModel se e obrigatorio e se nao e valido
                    //var elemento = typeof value === 'object' && value.hasOwnProperty('$modelValue') ? angular.element("[name='" + value.$name + "']") : undefined;
                    var elemento = $(value);
                    var elementoPai = elemento.closest('div.form-group');
                    var modelo = elemento.attr('ng-model');
                    var obrigatorio = modelo != undefined && elemento.attr('required') != undefined;

                    if (obrigatorio) {
                        var valido;
                        var valor = elemento.val();
                        var temp = modelo.split("['");
                        var temp2 = temp[Object.keys(temp).length - 1];
                        var nomeCampo = temp2.substr(0, temp2.length - 2);
                        var comparar = campos.indexOf(nomeCampo) != -1;

                        if (comparar) {
                            if (elemento.attr('minimo') != undefined && _textoParaFloat(valor) < elemento.attr('minimo')) {
                                mensagem = 'Valor Abaixo do Mínimo';
                                valido = false;
                            } else if (elemento.attr('maximo') != undefined && _textoParaFloat(valor) > elemento.attr('maximo')) {
                                mensagem = 'Valor Abaixo do Mínimo';
                                valido = false;
                            } else if (valor == undefined || valor == '') {
                                mensagem = 'Campo Obrigatório';
                                valido = false;
                            } else {
                                mensagem = '';
                                valido = true;
                            }

                            _manipularSpan(elemento, elementoPai, mensagem, !valido);
                            if (!valido) {
                                temCampoInvalido = true;
                            }
                        }
                    }
                });
                resolve(!temCampoInvalido);
            });
        }



        return {
            dateParaTimestamp: _dateParaTimestamp,
            dataAtual: _dataAtual,
            horaAtual: _horaAtual,
            primeiroDiaMes: _primeiroDiaMes,
            adicionarMeses: _adicionarMeses,
            calcularIdade: _calcularIdade,
            calcularIMC: _calcularIMC,
            numberFormat: _numberFormat,
            caracteresValidosDecimais: _caracteresValidosDecimais,
            decimais: _decimais,
            textoParaFloat: _textoParaFloat,
            somarTexto: _somarTexto,
            subtrairTexto: _subtrairTexto,
            multiplicarTexto: _multiplicarTexto,
            dividirTexto: _dividirTexto,
            diretivaParaVariavel: _diretivaParaVariavel,
            variavelParaDiretiva: _variavelParaDiretiva,
            numeroPar: _numeroPar,
            montaMensagem: _montaMensagem,
            manipularSpan: _manipularSpan,
            validarCampos: _validarCampos
        }
    })
