/**
 * 🎭 SERVIÇO DE MÁSCARAS E VALIDAÇÕES CENTRALIZADAS
 * Proposta de refatoração para centralizar máscaras e validações
 * atualmente espalhadas entre formataInputs.js, montaHtml.js e helpers
 * 
 * Baseado na análise de _VerificacaoErrosFrontIA.md
 * Data: 4 de junho de 2025
 */

angular.module('mascarasValidacoes', [])

.service('MascarasValidacoesService', ['$filter', function($filter) {
    'use strict';
    
    var service = {
        // === MÁSCARAS DISPONÍVEIS ===
        mascaras: {
            cpf: '000.000.000-00',
            cnpj: '00.000.000/0000-00',
            telefone: '(00) 0000-0000',
            celular: '(00) 00000-0000',
            cep: '00000-000',
            data: 'dd/mm/aaaa',
            hora: 'hh:mm',
            horaCompleta: 'hh:mm:ss',
            decimal1: '0,0',
            decimal2: '0,00',
            decimal3: '0,000',
            inteiro: '0',
            peso: '000,0',
            altura: '0,00',
            rg: '00.000.000-0'
        },
        
        // === VALIDAÇÕES DISPONÍVEIS ===
        validacoes: {
            obrigatorio: function(valor) {
                return valor !== undefined && valor !== null && valor !== '';
            },
            
            cpfValido: function(cpf) {
                if (!cpf) return false;
                cpf = cpf.replace(/[^\d]/g, '');
                if (cpf.length !== 11) return false;
                // Algoritmo de validação de CPF
                var soma = 0;
                for (var i = 0; i < 9; i++) {
                    soma += parseInt(cpf.charAt(i)) * (10 - i);
                }
                var resto = 11 - (soma % 11);
                var digito1 = (resto < 2) ? 0 : resto;
                
                soma = 0;
                for (var j = 0; j < 10; j++) {
                    soma += parseInt(cpf.charAt(j)) * (11 - j);
                }
                resto = 11 - (soma % 11);
                var digito2 = (resto < 2) ? 0 : resto;
                
                return digito1 === parseInt(cpf.charAt(9)) && digito2 === parseInt(cpf.charAt(10));
            },
            
            cnpjValido: function(cnpj) {
                if (!cnpj) return false;
                cnpj = cnpj.replace(/[^\d]/g, '');
                if (cnpj.length !== 14) return false;
                // Algoritmo simplificado de validação de CNPJ
                return true; // Implementar algoritmo completo
            },
            
            emailValido: function(email) {
                if (!email) return false;
                var regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return regex.test(email);
            },
            
            dataValida: function(data) {
                if (!data) return false;
                var regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
                var match = data.match(regex);
                if (!match) return false;
                
                var dia = parseInt(match[1], 10);
                var mes = parseInt(match[2], 10);
                var ano = parseInt(match[3], 10);
                
                var dataObj = new Date(ano, mes - 1, dia);
                return dataObj.getDate() === dia && 
                       dataObj.getMonth() === mes - 1 && 
                       dataObj.getFullYear() === ano;
            },
            
            horaValida: function(hora) {
                if (!hora) return false;
                var regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
                return regex.test(hora);
            },
            
            tamanhoMinimo: function(valor, minimo) {
                if (!valor) return false;
                return valor.toString().length >= minimo;
            },
            
            tamanhoMaximo: function(valor, maximo) {
                if (!valor) return true; // Campo vazio é válido para tamanho máximo
                return valor.toString().length <= maximo;
            },
            
            numerico: function(valor) {
                if (!valor) return true; // Campo vazio é válido
                return !isNaN(parseFloat(valor)) && isFinite(valor);
            },
            
            inteiro: function(valor) {
                if (!valor) return true; // Campo vazio é válido
                return Number.isInteger(parseFloat(valor));
            },
            
            positivo: function(valor) {
                if (!valor) return true; // Campo vazio é válido
                return parseFloat(valor) > 0;
            },
            
            intervaloNumerico: function(valor, min, max) {
                if (!valor) return true; // Campo vazio é válido
                var num = parseFloat(valor);
                return num >= min && num <= max;
            }
        },
        
        // === MÉTODOS PÚBLICOS ===
        
        /**
         * Aplica máscara a um valor
         * @param {string} tipo - Tipo da máscara (cpf, cnpj, telefone, etc.)
         * @param {string} valor - Valor a ser formatado
         * @returns {string} Valor formatado
         */
        aplicarMascara: function(tipo, valor) {
            if (!valor || !this.mascaras[tipo]) {
                return valor;
            }
            
            // Remove caracteres não numéricos
            var apenasNumeros = valor.replace(/[^\d]/g, '');
            var mascara = this.mascaras[tipo];
            var resultado = '';
            var posicaoNumero = 0;
            
            for (var i = 0; i < mascara.length && posicaoNumero < apenasNumeros.length; i++) {
                if (mascara[i] === '0' || mascara[i] === '9') {
                    resultado += apenasNumeros[posicaoNumero];
                    posicaoNumero++;
                } else {
                    resultado += mascara[i];
                }
            }
            
            return resultado;
        },
        
        /**
         * Remove máscara de um valor
         * @param {string} valor - Valor formatado
         * @returns {string} Valor sem formatação
         */
        removerMascara: function(valor) {
            if (!valor) return valor;
            return valor.replace(/[^\d]/g, '');
        },
        
        /**
         * Valida um campo baseado em suas regras
         * @param {string} tipo - Tipo do campo (cpf, email, obrigatorio, etc.)
         * @param {any} valor - Valor a ser validado
         * @param {object} opcoes - Opções adicionais (min, max, etc.)
         * @returns {object} { valido: boolean, mensagem: string }
         */
        validarCampo: function(tipo, valor, opcoes) {
            opcoes = opcoes || {};
            
            var resultado = {
                valido: true,
                mensagem: ''
            };
            
            // Se campo é obrigatório, verificar primeiro
            if (opcoes.obrigatorio && !this.validacoes.obrigatorio(valor)) {
                resultado.valido = false;
                resultado.mensagem = 'Campo obrigatório';
                return resultado;
            }
            
            // Se campo está vazio e não é obrigatório, é válido
            if (!valor && !opcoes.obrigatorio) {
                return resultado;
            }
            
            // Aplicar validação específica do tipo
            switch (tipo) {
                case 'cpf':
                    if (!this.validacoes.cpfValido(valor)) {
                        resultado.valido = false;
                        resultado.mensagem = 'CPF inválido';
                    }
                    break;
                    
                case 'cnpj':
                    if (!this.validacoes.cnpjValido(valor)) {
                        resultado.valido = false;
                        resultado.mensagem = 'CNPJ inválido';
                    }
                    break;
                    
                case 'email':
                    if (!this.validacoes.emailValido(valor)) {
                        resultado.valido = false;
                        resultado.mensagem = 'E-mail inválido';
                    }
                    break;
                    
                case 'data':
                    if (!this.validacoes.dataValida(valor)) {
                        resultado.valido = false;
                        resultado.mensagem = 'Data inválida';
                    }
                    break;
                    
                case 'hora':
                    if (!this.validacoes.horaValida(valor)) {
                        resultado.valido = false;
                        resultado.mensagem = 'Hora inválida';
                    }
                    break;
                    
                case 'numerico':
                    if (!this.validacoes.numerico(valor)) {
                        resultado.valido = false;
                        resultado.mensagem = 'Deve ser um número válido';
                    }
                    break;
                    
                case 'inteiro':
                    if (!this.validacoes.inteiro(valor)) {
                        resultado.valido = false;
                        resultado.mensagem = 'Deve ser um número inteiro';
                    }
                    break;
            }
            
            // Validações de tamanho
            if (resultado.valido && opcoes.tamanhoMinimo) {
                if (!this.validacoes.tamanhoMinimo(valor, opcoes.tamanhoMinimo)) {
                    resultado.valido = false;
                    resultado.mensagem = 'Mínimo de ' + opcoes.tamanhoMinimo + ' caracteres';
                }
            }
            
            if (resultado.valido && opcoes.tamanhoMaximo) {
                if (!this.validacoes.tamanhoMaximo(valor, opcoes.tamanhoMaximo)) {
                    resultado.valido = false;
                    resultado.mensagem = 'Máximo de ' + opcoes.tamanhoMaximo + ' caracteres';
                }
            }
            
            // Validações numéricas
            if (resultado.valido && opcoes.valorMinimo !== undefined) {
                if (parseFloat(valor) < opcoes.valorMinimo) {
                    resultado.valido = false;
                    resultado.mensagem = 'Valor mínimo: ' + opcoes.valorMinimo;
                }
            }
            
            if (resultado.valido && opcoes.valorMaximo !== undefined) {
                if (parseFloat(valor) > opcoes.valorMaximo) {
                    resultado.valido = false;
                    resultado.mensagem = 'Valor máximo: ' + opcoes.valorMaximo;
                }
            }
            
            return resultado;
        },
        
        /**
         * Obtém configuração de máscara para um tipo de campo
         * @param {string} tipoCampo - Tipo do campo
         * @returns {object} Configuração de máscara e validação
         */
        obterConfiguracaoCampo: function(tipoCampo) {
            var configuracoes = {
                cpf: {
                    mascara: this.mascaras.cpf,
                    validacao: 'cpf',
                    placeholder: '000.000.000-00'
                },
                cnpj: {
                    mascara: this.mascaras.cnpj,
                    validacao: 'cnpj',
                    placeholder: '00.000.000/0000-00'
                },
                telefone: {
                    mascara: this.mascaras.telefone,
                    validacao: null,
                    placeholder: '(00) 0000-0000'
                },
                celular: {
                    mascara: this.mascaras.celular,
                    validacao: null,
                    placeholder: '(00) 00000-0000'
                },
                cep: {
                    mascara: this.mascaras.cep,
                    validacao: null,
                    placeholder: '00000-000'
                },
                data: {
                    mascara: this.mascaras.data,
                    validacao: 'data',
                    placeholder: 'dd/mm/aaaa'
                },
                hora: {
                    mascara: this.mascaras.hora,
                    validacao: 'hora',
                    placeholder: 'hh:mm'
                },
                email: {
                    mascara: null,
                    validacao: 'email',
                    placeholder: 'exemplo@dominio.com'
                },
                numero: {
                    mascara: null,
                    validacao: 'numerico',
                    placeholder: '0'
                },
                inteiro: {
                    mascara: null,
                    validacao: 'inteiro',
                    placeholder: '0'
                },
                decimal: {
                    mascara: this.mascaras.decimal2,
                    validacao: 'numerico',
                    placeholder: '0,00'
                },
                peso: {
                    mascara: this.mascaras.peso,
                    validacao: 'numerico',
                    placeholder: '000,0'
                },
                altura: {
                    mascara: this.mascaras.altura,
                    validacao: 'numerico',
                    placeholder: '0,00'
                }
            };
            
            return configuracoes[tipoCampo] || {
                mascara: null,
                validacao: null,
                placeholder: ''
            };
        }
    };
    
    return service;
}])

/**
 * 🎯 DIRETIVA PARA APLICAÇÃO AUTOMÁTICA DE MÁSCARAS
 * Substitui as múltiplas diretivas de formataInputs.js
 */
.directive('mascaraAutomatica', ['MascarasValidacoesService', function(MascarasValidacoesService) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel) {
            var tipo = attrs.mascaraAutomatica;
            var config = MascarasValidacoesService.obterConfiguracaoCampo(tipo);
            
            // Aplicar placeholder se configurado
            if (config.placeholder) {
                element.attr('placeholder', config.placeholder);
            }
            
            // Aplicar máscara em tempo real
            element.on('input', function() {
                var valor = element.val();
                if (config.mascara) {
                    var valorFormatado = MascarasValidacoesService.aplicarMascara(tipo, valor);
                    if (valorFormatado !== valor) {
                        element.val(valorFormatado);
                        ngModel.$setViewValue(valorFormatado);
                    }
                }
            });
            
            // Validação automática
            if (config.validacao) {
                ngModel.$validators[tipo] = function(modelValue, viewValue) {
                    var valor = modelValue || viewValue;
                    var resultado = MascarasValidacoesService.validarCampo(config.validacao, valor);
                    return resultado.valido;
                };
            }
        }
    };
}])

/**
 * 🎯 DIRETIVA PARA VALIDAÇÃO CUSTOMIZADA
 * Permite aplicar múltiplas validações em um campo
 */
.directive('validacaoCustomizada', ['MascarasValidacoesService', function(MascarasValidacoesService) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel) {
            var validacoes = scope.$eval(attrs.validacaoCustomizada) || {};
            
            // Adicionar validador customizado
            ngModel.$validators.customizado = function(modelValue, viewValue) {
                var valor = modelValue || viewValue;
                
                // Se campo está vazio e não é obrigatório, é válido
                if (!valor && !validacoes.obrigatorio) {
                    return true;
                }
                
                // Aplicar todas as validações configuradas
                for (var tipo in validacoes) {
                    if (validacoes.hasOwnProperty(tipo) && tipo !== 'obrigatorio') {
                        var opcoes = {};
                        opcoes[tipo] = validacoes[tipo];
                        opcoes.obrigatorio = validacoes.obrigatorio;
                        
                        var resultado = MascarasValidacoesService.validarCampo(tipo, valor, opcoes);
                        if (!resultado.valido) {
                            // Salvar mensagem de erro no scope para exibição
                            scope.mensagemErro = resultado.mensagem;
                            return false;
                        }
                    }
                }
                
                // Limpar mensagem de erro se tudo está válido
                scope.mensagemErro = '';
                return true;
            };
        }
    };
}]);

/**
 * 📝 EXEMPLO DE USO:
 * 
 * No HTML:
 * <input type="text" ng-model="usuario.cpf" mascara-automatica="cpf" required>
 * <input type="email" ng-model="usuario.email" mascara-automatica="email">
 * <input type="text" ng-model="usuario.nome" 
 *        validacao-customizada="{obrigatorio: true, tamanhoMinimo: 3, tamanhoMaximo: 50}">
 * <span ng-show="mensagemErro" class="error">{{mensagemErro}}</span>
 * 
 * No Controller:
 * // Validação programática
 * var resultado = MascarasValidacoesService.validarCampo('cpf', '123.456.789-00');
 * if (!resultado.valido) {
 *     alert(resultado.mensagem);
 * }
 * 
 * // Aplicação de máscara programática
 * $scope.usuario.telefone = MascarasValidacoesService.aplicarMascara('telefone', '11999999999');
 */
