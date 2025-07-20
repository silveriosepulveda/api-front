module.exports = {
  env: {
    browser: true,
    es6: true,
    jquery: true,
    angular: true
  },
  extends: [
    'eslint:recommended'
  ],
  globals: {
    angular: 'readonly',
    $: 'readonly',
    jQuery: 'readonly',
    $rS: 'writable',
    $scope: 'readonly',
    $rootScope: 'readonly',
    $http: 'readonly',
    $location: 'readonly',
    $timeout: 'readonly',
    $compile: 'readonly',
    $parse: 'readonly',
    $injector: 'readonly',
    $templateCache: 'readonly',
    $base64: 'readonly',
    $mdDialog: 'readonly',
    APIServ: 'readonly',
    APIAjuFor: 'readonly',
    EGFuncoes: 'readonly',
    config: 'readonly',
    filtroPadrao: 'readonly',
    operadoresConsulta: 'readonly',
    directivesPadrao: 'readonly',
    ajudaFormatacoes: 'readonly',
    servicos: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'script'
  },
  rules: {
    'no-console': 'warn',
    'no-debugger': 'warn',
    'no-unused-vars': 'warn',
    'no-undef': 'error',
    'semi': ['error', 'always'],
    'quotes': ['error', 'single'],
    'indent': ['error', 4],
    'comma-dangle': ['error', 'never']
  }
}; 