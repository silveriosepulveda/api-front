app.controller('eventoCtrl', function () {
    
 })
    .directive('comparacaoValores', function () {
        return {
            restrict: 'E',
            templateUrl: 'api/templates/eventosSistema/eventosSistemaDiferencas.html',
            link: function (scope, elem, attr) {
                let exibir = [];
                let dados = scope.item.detalhes;

                let variavelPercorrer = [];
                let variavelComparar = {};
                if (dados.acao == 'Inclusão') {
                    variavelPercorrer = dados.valor_novo;
                } else if (dados.acao = "Alteração") {
                    variavelPercorrer = dados.valor_novo;
                    variavelComparar = dados.valor_anterior;
                }
                console.log(variavelComparar);

                for (let i in variavelPercorrer) {
                    //console.log(dados.valor_novo[i] + ' -- ' + dados.valor_anterior[i]);

                    if (Object.keys(variavelComparar).length == 0 || (variavelPercorrer[i] != variavelComparar[i])) {
                        exibir.push({
                            campo: i,
                            anterior: Object.keys(variavelComparar).length > 0 ? variavelComparar[i] : '',
                            novo: variavelPercorrer[i]
                        });
                    }
                }
                scope.item.detalhes['alteracoesExibir'] = exibir;
            }
        }
    })