directivesPadrao.directive('imagensAnexas', ['$compile', '$http', '$rootScope', 'APIServ', function ($compile, $http, $rootScope, APIServ) {
    return {
        restrict: "E",
        replace: true,
        templateUrl: 'src/front/js/directives/imagensAnexas.html',
        link: function (scope, element) {
            scope.idChaveAnexos = scope.estrutura.campo_chave;
            scope.chaveTabela = scope.item[scope.estrutura.campo_chave];
            scope.idFormAnexos = 'formAnexos_' + scope.chaveTabela;
            
            
         //var html = '<h1>Teste</h1>';


            //element.html(html);
            //$compile(element.contents())(scope);
        }
    }
}])
