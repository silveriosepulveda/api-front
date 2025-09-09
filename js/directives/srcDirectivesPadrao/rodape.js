var app = angular.module('app');
app.directive('rodape', ['$rootScope', function($rootScope) {
    return {
        restrict: 'E',
        replace: true,
        template: `
            <div class="rodape bordasuperior">
                <div class="container-fluid">
                <resumo-consulta></resumo-consulta>
                    <div class="row">
                        <div class="col-md-8">
                            <span ng-if="listaConsulta && listaConsulta.length > 0">
                                <strong>Total de registros:</strong> {{listaConsultaVisivel.length}} / {{listaConsulta.length}}
                            </span>
                            <span ng-if="!listaConsulta || listaConsulta.length === 0">
                                Nenhum registro encontrado
                            </span>
                        </div>                        
                    </div>                  
                    
                </div>
            </div>
        `,
        link: function(scope, element, attrs) {
            
            
            // Acessar listas do $rootScope
            scope.listaConsulta = $rootScope.listaConsulta;
            scope.listaConsultaVisivel = $rootScope.listaConsultaVisivel;
            scope.resumoConsulta = $rootScope.resumoConsulta;
            
            // console.log('Rodapé inicializado - Lista consulta:', scope.listaConsulta);
            // console.log('Rodapé inicializado - Lista consulta visível:', scope.listaConsultaVisivel);
            // console.log('Rodapé inicializado - Resumo consulta:', scope.resumoConsulta);
            
            // Observar mudanças na listaConsulta do $rootScope
            scope.$watch(function() {
                return $rootScope.listaConsulta;
            }, function(newValue) {
                console.log('Lista consulta atualizada:', newValue);             
                scope.listaConsulta = newValue;
            });
            
            // Observar mudanças na listaConsultaVisivel do $rootScope
            scope.$watch(function() {
                return $rootScope.listaConsultaVisivel;
            }, function(newValue) {
                console.log('Lista consulta visível atualizada:', newValue);
                scope.listaConsultaVisivel = newValue;
            });
            
            // Observar mudanças no resumoConsulta do $rootScope
            scope.$watch(function() {
                return $rootScope.resumoConsulta;
            }, function(newValue) {
                scope.resumoConsulta = newValue;
            });

            scope.$watch(function() {
                return $rootScope.estrutura;
            }, function(newValue) {
                console.log('Estrutura atualizada:', newValue);
                
                
                scope.estrutura = newValue;
            });
        }
    }
}]);