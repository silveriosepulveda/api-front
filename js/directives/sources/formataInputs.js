app
    .directive('limiteCaracteres', function () {
        return {
            require: 'ngModel',
            restrict: 'A',
            link: (scope, elem, attr, ctrl) => {
                elem.bind('keyup', () => {
                    let qtdCaracteres = elem.attr('limite-caracteres');                    
                    let elementoPai = elem.closest('div.form-group');
                    let mensagem = 'Limite de Caracteres: ' + qtdCaracteres;

                    if (ctrl.$viewValue.length > qtdCaracteres) {
                        elementoPai.attr('data-toggle', 'popover').attr('data-content', mensagem).popover({
                            'placement': 'bottom'
                        }).popover('show');
                        ctrl.$setViewValue(ctrl.$viewValue.substring(0, qtdCaracteres));
                        ctrl.$render();

                        setTimeout(() => {
                            elementoPai.popover('hide');
                        }, 3000);
                    }
                })
            }
        }
    })
    .directive("uiData", function ($filter) {
        return {
            require: "ngModel",
            link: function (scope, element, attr, ctrl) {
                let obrigatorio = attr.required != undefined && attr.required;
                var _formatDate = function (date) {

                    date = date != undefined ? date.replace(/[^0-9]+/g, "") : '';
                    if (date.length > 2) {
                        date = date.substring(0, 2) + "/" + date.substring(2);
                    }
                    if (date.length > 5) {
                        date = date.substring(0, 5) + "/" + date.substring(5, 9);
                    }
                    return date;
                };

                element.bind("keyup", function () {
                    if (ctrl.$viewValue != undefined) {
                        ctrl.$setViewValue(_formatDate(ctrl.$viewValue));
                        ctrl.$render();
                    }
                });

                ctrl.$parsers.push(function (value) {
                    if (value.length === 10 || !obrigatorio) {
                        return value;
                    }
                });

                ctrl.$formatters.push(function (value) {
                    return $filter("date")(value, "dd/MM/yyyy");
                });
            }
        };
    })
    .directive("uiHora", function ($filter) {
        return {
            require: "ngModel",
            link: function (scope, element, attr, ctrl) {
                var _formatHora = function (hora) {
                    hora = hora != undefined ? hora.replace(/[^0-9]+/g, "") : '';
                    if (hora.length > 2) {
                        hora = hora.substring(0, 2) + ":" + hora.substring(2, 4);
                    }
                    return hora;
                };

                element.bind("keyup", function () {
                    if (ctrl.$viewValue != undefined) {
                        ctrl.$setViewValue(_formatHora(ctrl.$viewValue));
                        ctrl.$render();
                    }
                });

                ctrl.$parsers.push(function (value) {
                    if (value.length >= 5) {
                        return value;
                    }
                });
            }
        };
    })
    .directive("uiHoraCompleta", function ($filter) {
        return {
            require: "ngModel",
            link: function (scope, element, attr, ctrl) {
                element.addClass('text-right');
                let modelo = attr.modeloHora;


                if (modelo == 'aoDigitar') {
                    var _formatHoraCompleta = function (horaEntrada) {
                        let horaTemp = horaEntrada != undefined ? horaEntrada.replace(/[^0-9]+/g, "") : '';
                        let hora = horaTemp;

                        for (let i = 0; i <= 6 - horaTemp.length; i++) {
                            hora = '0' + hora;
                        }

                        hora = hora.substring(1, 7);
                        hora = hora.substring(0, 2) + ':' + hora.substring(2, 4) + '.' + hora.substring(4, 6);
                        return hora;
                    };

                    element.bind("keyup", function () {
                        if (ctrl.$viewValue != undefined) {
                            ctrl.$setViewValue(_formatHoraCompleta(ctrl.$viewValue));
                            ctrl.$render();
                        }
                    });
                } else {
                    var _formatHoraCompleta = function (horaEntrada) {
                        let horaTemp = horaEntrada != undefined ? horaEntrada.replace(/[^0-9]+/g, "") : '';
                        let hora = horaTemp;

                        for (let i = 0; i <= 6 - horaTemp.length; i++) {
                            hora = '0' + hora;
                        }

                        hora = hora.substring(1, 7);
                        hora = hora.substring(0, 2) + ':' + hora.substring(2, 4) + '.' + hora.substring(4, 6);
                        return hora;
                    };

                    element.bind('keyup', function () {
                        ctrl.$setViewValue(ctrl.$viewValue.replace(/[^0-9]+/g, ""));
                        ctrl.$render();
                    })
                        .bind('blur', function () {
                            let v = ctrl.$viewValue;

                            for (let i = 0; i < 6 - ctrl.$viewValue.length; i++) {
                                v = v + '0';
                            }

                            let inicioMili = v.length - 2;
                            let fimMili = v.length;
                            let inicioSeg = v.length - 4;
                            let fimSeg = v.length - 2;
                            let inicioMin = v.length - 6;
                            let fimMin = v.length - 4;

                            let valorRetorno = v.substring(inicioMin, fimMin) + ':' + v.substring(inicioSeg, fimSeg) + '.' + v.substring(inicioMili, fimMili);


                            ctrl.$setViewValue(valorRetorno);
                            ctrl.$render();
                        })
                }




            }
        };
    })
    .directive("uiCep", function ($filter) {
        return {
            require: "ngModel",
            link: function (scope, element, attr, ctrl) {
                let obrigatorio = attr.required != undefined && attr.required;
                var _formatDate = function (cep) {
                    cep = cep != undefined ? cep.replace(/[^0-9]+/g, "") : '';
                    if (cep.length > 5) {
                        cep = cep.substring(0, 5) + "-" + cep.substring(5, 8);
                    }
                    return cep;
                };

                element.bind("keyup", function () {
                    if (ctrl.$viewValue != undefined) {
                        ctrl.$setViewValue(_formatDate(ctrl.$viewValue));
                        ctrl.$render();
                    }
                });

                ctrl.$parsers.push(function (value) {
                    if (value.length >= 9 || !obrigatorio) {
                        return value;
                    }
                });
            }
        };
    })
    .directive('uiTelefone', function () {
        return {
            require: 'ngModel',
            link: function (scope, element, attr, ctrl) {
                let obrigatorio = attr.required != undefined && attr.required;
                var _formatTelefone = function (telefone) {
                    //(99)9999-9999 - 13dig
                    //(99)99999-9999 - 14dig
                    telefone = telefone.replace(/[^0-9]+/g, "");
                    if (telefone.length > 0) {
                        telefone = telefone.substring(-1, 0) + "(" + telefone.substring(0);
                    }
                    if (telefone.length > 3) {
                        telefone = telefone.substring(0, 3) + ")" + telefone.substring(3);
                    }
                    if (telefone.length == 12) {
                        telefone = telefone.substring(0, 8) + "-" + telefone.substring(8);
                    } else if (telefone.length >= 13) {
                        telefone = telefone.substring(0, 9) + "-" + telefone.substring(9, 13);
                    }
                    return telefone;
                }
                element.bind('keyup', function () {
                    if (ctrl.$viewValue != undefined) {
                        ctrl.$setViewValue(_formatTelefone(ctrl.$viewValue));
                        ctrl.$render();
                    }

                });

                ctrl.$parsers.push(function (value) {
                    if (value.length >= 12 || !obrigatorio) {
                        return value;
                    }
                });

            }
        };

    })
    .directive('uiCpfCnpj', ['$parse', function ($parse) {
        return {
            require: 'ngModel',
            link: function (scope, element, attr, ctrl) {
                var _formataCPF = function (cpf) {
                    cpf = cpf.replace(/[^0-9]+/g, "");
                    let qtdCaracteres = cpf.length;

                    if (cpf.length <= 12) {
                        if (cpf.length > 3) {
                            cpf = cpf.substring(0, 3) + "." + cpf.substring(3);
                        }
                        if (cpf.length > 7) {
                            cpf = cpf.substring(0, 7) + "." + cpf.substring(7);
                        }
                        if (cpf.length > 11) {
                            cpf = cpf.substring(0, 11) + "-" + cpf.substring(11);
                        }
                    } else if (cpf.length > 12) {
                        cpf = cpf.substring(0, 2) + '.' + cpf.substring(2, 5) + '.' + cpf.substring(5, 8) + '/' + cpf.substring(8);

                        if (cpf.length > 12) {
                            cpf = cpf.substring(0, 15) + '-' + cpf.substring(15);
                        }
                        if (cpf.length > 13) {
                            cpf = cpf.substring(0, 16) + cpf.substring(16, 18);
                        }
                    }

                    return cpf;
                }
                element.bind('keyup', function () {
                    if (ctrl.$viewValue != undefined) {
                        var valor = _formataCPF(ctrl.$viewValue);
                        ctrl.$setViewValue(valor);
                        ctrl.$render();
                    }
                });
                ctrl.$parsers.push(function (value) {
                    if (value.length === 14 || value.length == 18 || value.length == 19) {
                        return value;
                    }
                });
            }
        };

    }])
    .directive('uiInteiro', function () {
        return {
            require: 'ngModel',
            link: function (scope, element, attrs, ctrl) {
                if (!ctrl) return;

                element.addClass('text-right');

                var _inteiro = function (viewValue) {
                    if (viewValue != undefined) {
                        var value = viewValue;
                        value = value.replace(/\D/g, "");
                    }

                    var maximo = element.attr('maximo') != undefined ? parseInt(element.attr('maximo')) : false;

                    var eNumero = Number.isInteger(Number(value));

                    let retorno = value;
                    if (eNumero) {
                        if (!maximo || (maximo && maximo != 0)) {
                            retorno = value;
                        } else if (value <= maximo) {
                            retorno = value;
                        } else {
                            retorno = maximo;
                        }
                        //retorno = (!maximo && maximo != 0) ? value : value <= maximo ? value : maximo;
                    } else {
                        retorno = value;
                    }
                    return retorno;
                }
                element.bind('keyup', function () {
                    ctrl.$setViewValue(_inteiro(ctrl.$viewValue));
                    ctrl.$render();
                });
            }
        }
    })
    .directive('uiDecimal1', function (APIAjuFor) {
        return {
            require: 'ngModel',
            link: function (scope, element, attrs, ctrl) {
                if (!ctrl) return;

                element.addClass('text-right');

                element.bind('keyup', function () {
                    ctrl.$setViewValue(APIAjuFor.caracteresValidosDecimais(ctrl.$viewValue));
                    ctrl.$render();
                })
                    .bind('blur', function () {
                        let maximo = element.attr('maximo') != undefined ? element.attr('maximo') : 0;
                        ctrl.$setViewValue(APIAjuFor.decimais(ctrl.$viewValue, 1, maximo));
                        ctrl.$render();
                    })
            }
        };
    })
    .directive('uiDecimal2', function (APIAjuFor) {
        return {
            require: 'ngModel',
            link: function (scope, element, attrs, ctrl) {
                if (!ctrl) return;

                element.addClass('text-right');

                let modelo = attrs.modeloDecimal;
                if (modelo == 'aoDigitar') {
                    var _decimal2 = function (viewValue) {
                        //console.log(viewValue.length);
                        if (viewValue != undefined && viewValue.length <= 3 || viewValue == undefined) {
                            viewValue = '000' + viewValue;
                        }
                        var value = viewValue;
                        value = value.replace(/\D/g, "");
                        value = value.replace(/(\d{2})$/, ",$1");
                        value = value.replace(/(\d+)(\d{3},\d{2})$/g, "$1.$2");
                        var qtdLoop = (value.length - 3) / 3;
                        var count = 0;
                        while (qtdLoop > count) {
                            count++;
                            value = value.replace(/(\d+)(\d{3}.*)/, "$1.$2");
                        }

                        var plainNumber = value.replace(/^(0)(\d)/g, "$2");

                        var maximo = element.attr('maximo') != undefined ? element.attr('maximo') : false;
                        var eNumero = plainNumber != undefined && APIAjuFor.textoParaFloat(plainNumber) > 0;

                        if (eNumero) {
                            var valor = APIAjuFor.textoParaFloat(plainNumber);
                            var valorMaximo = APIAjuFor.textoParaFloat(maximo);
                            return !maximo ? plainNumber : valor <= valorMaximo ? plainNumber : maximo;
                        } else {
                            return plainNumber;
                        }


                    }
                    element.bind('keyup', function () {
                        ctrl.$setViewValue(_decimal2(ctrl.$viewValue));
                        ctrl.$render();
                    });
                } else {
                    element.bind('keyup', function () {
                        ctrl.$setViewValue(APIAjuFor.caracteresValidosDecimais(ctrl.$viewValue));
                        ctrl.$render();
                    })
                        .bind('blur', function () {
                            let maximo = element.attr('maximo') != undefined ? element.attr('maximo') : 0;
                            let valorRetorno = APIAjuFor.decimais(ctrl.$viewValue, 2, maximo);

                            ctrl.$setViewValue(valorRetorno);
                            ctrl.$render();
                        })
                }
            }
        };
    })
    .directive('uiDecimal3', function (APIAjuFor) {
        return {
            require: 'ngModel',
            link: function (scope, element, attrs, ctrl) {
                if (!ctrl) return;
                element.addClass('text-right');

                element.bind('keyup', function () {
                    ctrl.$setViewValue(APIAjuFor.caracteresValidosDecimais(ctrl.$viewValue));
                    ctrl.$render();
                })
                    .bind('blur', function () {
                        let maximo = element.attr('maximo') != undefined ? element.attr('maximo') : 0;
                        ctrl.$setViewValue(APIAjuFor.decimais(ctrl.$viewValue, 3, maximo));
                        ctrl.$render();
                    })
            }
        };
    })
    .directive('uiDecimal4', function (APIAjuFor) {
        return {
            require: 'ngModel',
            link: function (scope, element, attrs, ctrl) {
                if (!ctrl) return;
                element.addClass('text-right');

                element.bind('keyup', function () {
                    ctrl.$setViewValue(APIAjuFor.caracteresValidosDecimais(ctrl.$viewValue));
                    ctrl.$render();
                })
                    .bind('blur', function () {
                        let maximo = element.attr('maximo') != undefined ? element.attr('maximo') : 0;
                        ctrl.$setViewValue(APIAjuFor.decimais(ctrl.$viewValue, 4, maximo));
                        ctrl.$render();
                    })
            }
        };
    })
    .directive('uiPlaca', function () {
        return {
            require: "ngModel",
            link: function (scope, element, attr, ctrl) {
                if (!ctrl) return;
                var _formataPlaca = function (placa) {
                    letras = placa.substring(0, 3).replace(/[^a-zA-Z]+/g, "").toUpperCase();
                    numeros = placa.substring(3, 5).replace(/[^0-9]+/g, "");
                    numeros = numeros + placa.substring(5, 6).replace(/[^a-zA-Z0-9]+/g, "").toUpperCase();
                    numeros = numeros + placa.substring(6, 8).replace(/[^0-9]+/g, "").toUpperCase();
                    //console.log(placa + ' --- ' + letras + '-' + numeros);
                    if (placa.length > 3) {
                        placa = letras + '-' + numeros;
                    }

                    return placa;
                }
                element.bind('keyup', function () {
                    if (ctrl.$viewValue != undefined) {
                        ctrl.$setViewValue(_formataPlaca(ctrl.$viewValue));
                        ctrl.$render();
                    }
                });

                ctrl.$parsers.push(function (value) {
                    if (value.length === 8) {
                        return value;
                    } else if (!element.attr('required')) {
                        return value;
                    }
                });
            }
        }
    })
    .directive('uiMaiusculo', function () {
        return {
            restrict: "A",
            require: "ngModel",
            link: function (scope, elem, attr, ctrl) {
                if (!ctrl) return;
                elem.bind('blur', function () {
                    if (elem[0].tagName != 'SELECT' && ctrl.$viewValue != undefined) {
                        ctrl.$setViewValue(ctrl.$viewValue.toUpperCase());
                        ctrl.$render();
                    }
                });
            }
        }
    })