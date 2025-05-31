angular.module('ajudaFormatacoes', [])
    .factory('APIAjuFor', function ($rootScope) {
        // Função auxiliar para padronizar dois dígitos
        const pad2 = n => n.toString().padStart(2, '0');

        let _dateParaTimestamp = data => {
            if (!(data instanceof Date)) return '';
            let ano = data.getFullYear();
            let mes = pad2(data.getMonth() + 1);
            let dia = pad2(data.getDate());
            let hora = pad2(data.getHours());
            let minuto = pad2(data.getMinutes());
            let segundo = pad2(data.getSeconds());
            return `${ano}-${mes}-${dia} ${hora}:${minuto}:${segundo}`;
        }

        let _dataAtual = function (acao, dias) {
            let dt = new Date();
            if (acao === 'subtrair' && typeof dias === 'number') {
                dt.setDate(dt.getDate() - dias);
            } else if (acao === 'somar' && typeof dias === 'number') {
                dt.setDate(dt.getDate() + dias);
            }
            let dia = pad2(dt.getDate());
            let mes = pad2(dt.getMonth() + 1);
            let ano = dt.getFullYear();
            return dia + '/' + mes + '/' + ano;
        }

        let _primeiroDiaMes = function () {
            let dt = new Date().toISOString().slice(0, 10);
            let temp = dt.split('-');
            return '01/' + temp[1] + '/' + temp[0];
        }

        let _horaAtual = function () {
            let temp = new Date();
            let hr = pad2(temp.getHours());
            let min = pad2(temp.getMinutes());
            return hr + ':' + min;
        }

        let _adicionarMeses = function (data, qtdMeses) {
            if (!data || !qtdMeses) return '';
            let temp = data.split('/');
            if (temp.length !== 3) return '';
            let dia = temp[0];
            let mes = temp[1];
            let ano = temp[2];
            let dataTemp = new Date(`${mes}/${dia}/${ano}`);
            let somar = parseInt(qtdMeses) + parseInt(mes) - 1;
            dataTemp.setMonth(somar);
            if (isNaN(dataTemp.getTime())) return '';
            let anoR = dataTemp.getFullYear();
            let mesR = pad2(dataTemp.getMonth() + 1);
            let diaR = pad2(dataTemp.getDate());
            return diaR + '/' + mesR + '/' + anoR;
        }

        let _calcularIdade = (nascimento) => {
            if (!nascimento) return 0;
            let temp = nascimento.split('/');
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

        let _calcularIMC = (peso, altura) => {
            let pesoC = _textoParaFloat(peso);
            let alturaC = _textoParaFloat(altura);
            let alturaCalcular = alturaC * alturaC;
            if (!alturaCalcular || isNaN(pesoC) || isNaN(alturaCalcular) || alturaCalcular === 0) return '';
            return _numberFormat(pesoC / alturaCalcular, 2);
        }

        let _numberFormat = function (valor, casas_decimais = 2, separador_decimal = ',', separador_milhar = '.') {
            valor = (valor + '').replace(/[^0-9+\-Ee.]/g, '');
            let n = !isFinite(+valor) ? 0 : +valor,
                prec = !isFinite(+casas_decimais) ? 0 : Math.abs(casas_decimais),
                sep = (typeof separador_milhar === 'undefined') ? ',' : separador_milhar,
                dec = (typeof separador_decimal === 'undefined') ? '.' : separador_decimal,
                s = '',
                toFixedFix = function (n, prec) {
                    let k = Math.pow(10, prec);
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

        let _caracteresValidosDecimais = function (valorEntrada) {
            if (valorEntrada == undefined) {
                return '';
            }

            let retorno = valorEntrada.toString();
            retornoTemp = retorno.replace(/[^-?\d\,]/g, "");
            retorno = '';
            let temVirgula = false;
            for (var i = 0; i < retornoTemp.length; i++) {
                let caracter = retornoTemp.substr(i, 1);
                retorno += temVirgula && caracter == ',' ? '' : caracter;
                if (caracter == ',') {
                    temVirgula = true;
                }
            }
            return retorno;
        }

        let _decimais = function (valorEntrada, casas = 2, maximo = '0') {
            if (valorEntrada == undefined) {
                return '';
            }
            let valor = valorEntrada.split(',');
            let qtd = Object.keys(valor).length;
            let decimais = 0;

            if (qtd > 1) {
                decimais = valor[qtd - 1];
                valor.splice(qtd - 1, 1);
            }

            valor = valor.join('');
            valor = valor.length > 0 ? valor : 0;

            let qtdDecimais = decimais.toString().length;
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

            let retorno = valor + ',' + decimais;

            var eNumero = retorno != undefined && _textoParaFloat(retorno) > 0;

            if (eNumero && _textoParaFloat(maximo) > 0) {
                let retornoFloat = _textoParaFloat(retorno);
                var valorMaximo = _textoParaFloat(maximo);
                return !maximo ? retorno : retornoFloat <= valorMaximo ? retorno : maximo;
            } else {
                return retorno;
            }
        }

        let _somarTexto = function (valor1, valor2, casasDecimais = 2) {
            let v1 = valor1 != undefined ? _textoParaFloat(valor1) : 0;
            let v2 = valor2 != undefined ? _textoParaFloat(valor2) : 0;
            //console.log(_numberFormat(v1 + v2, 2, ',', '.'));
            return _numberFormat(v1 + v2, casasDecimais, ',', '.');
        }

        let _subtrairTexto = function (valor1, valor2, casasDecimais = 2) {
            let v1 = valor1 != undefined ? _textoParaFloat(valor1) : 0;
            let v2 = valor2 != undefined ? _textoParaFloat(valor2) : 0;
            return _numberFormat(v1 - v2, casasDecimais, ',', '.');
        }

        let _multiplicarTexto = (valor1, valor2, casasDecimais = 2) => {
            let v1 = valor1 != undefined ? _textoParaFloat(valor1) : 0;
            let v2 = valor2 != undefined ? _textoParaFloat(valor2) : 0;
            return _numberFormat(v1 * v2, casasDecimais, ',', '.');
        }

        let _dividirTexto = (valor1, valor2, casasDecimais = 2) => {
            let v1 = valor1 != undefined ? _textoParaFloat(valor1) : 0;
            let v2 = valor2 != undefined ? _textoParaFloat(valor2) : 0;
            return _numberFormat(v1 / v2, casasDecimais, ',', '.');
        }

        let _textoParaFloat = function (valor) {
            let retorno = 0;
            if (valor != '' && valor != undefined) {
                let temp = valor.toString();
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

        let _numeroPar = function (numero) {
            return (numero / 2) == 0;
        }

        let _montaMensagem = function (tipo, campo) {
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

        let _manipularSpan = function (elemento, elementoPai, mensagem, erro, obrigatorio) {
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

        let _validarCampos = (nomeFormulario, campos) => {
            return new Promise((resolve, reject) => {
                let form = document.getElementById(nomeFormulario);
                let temCampoInvalido = false;

                angular.forEach(form, function (value, key) {
                    //Varrendo os itens de do formulario e vendo se sao objeto se tem ngModel se e obrigatorio e se nao e valido
                    //var elemento = typeof value === 'object' && value.hasOwnProperty('$modelValue') ? angular.element("[name='" + value.$name + "']") : undefined;
                    let elemento = $(value);
                    var elementoPai = elemento.closest('div.form-group');
                    let modelo = elemento.attr('ng-model');
                    var obrigatorio = modelo != undefined && elemento.attr('required') != undefined;

                    if (obrigatorio) {
                        let valido;
                        let valor = elemento.val();
                        let temp = modelo.split("['");
                        let temp2 = temp[Object.keys(temp).length - 1];
                        let nomeCampo = temp2.substr(0, temp2.length - 2);
                        let comparar = campos.indexOf(nomeCampo) != -1;

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
