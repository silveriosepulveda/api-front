const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: {
      // Módulos principais do sistema - mantém compatibilidade com nomes atuais
      ajudaFormatacoes: './js/helpers/ajudaFormatacoes.js',
      servicos: './js/services/services.js',
      directivesPadrao: './js/directives/directivesPadrao.js',
      
      // Controllers
      controllersBasicos: './js/controllers/controllersBasicos.js',
      controllersUsuarios: './js/controllers/controllersUsuarios.js',
      
      // Serviços adicionais
      authService: './js/services/authService.js',
      mascarasValidacoesService: './js/services/mascarasValidacoesService.js',
      
      // Diretivas adicionais
      autoCompleta: './js/directives/autoCompleta.js',
      listaConsulta: './js/directives/listaConsulta.js',
      formularioCadastro: './js/directives/formularioCadastro.js',
      arquivosAnexos: './js/directives/arquivosAnexos.js',
      estruturaBlocos: './js/directives/estruturaBlocos.js',
      
      // Helpers
      funcoesAuxiliares: './js/helpers/funcoesAuxiliares.js',
      
      // Sources das diretivas
      montaHtml: './js/directives/sources/montaHtml.js',
      formataInputs: './js/directives/sources/formataInputs.js',
      
      // Diretivas específicas
      estruturaGerencia: './js/directives/srcDirectivesPadrao/estruturaGerencia.js',
      popUpModal: './js/directives/srcDirectivesPadrao/PopUpModal.js',
      selectFiltrosPesquisa: './js/directives/srcDirectivesPadrao/selectFiltrosPesquisa.js',
      
      // Menu painel
      menuPainel: './js/directives/menuPainel/menuPainel.directive.js',
      menuPainelJs: './js/menuPainel.js',
      
      // Funções gerais
      funcoes: './js/funcoes.js'
    },
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 'js/[name].[contenthash].js' : 'js/[name].js',
      clean: true,
      // Mantém compatibilidade com carregamento via script tags
      library: ['SegMed', '[name]'],
      libraryTarget: 'umd',
      globalObject: 'this'
    },
    
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: {
                    browsers: ['> 1%', 'last 2 versions', 'not dead', 'ie >= 11']
                  },
                  useBuiltIns: 'usage',
                  corejs: 3
                }]
              ],
              plugins: ['@babel/plugin-transform-runtime']
            }
          }
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader'
          ]
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/,
          type: 'asset/resource',
          generator: {
            filename: 'images/[name].[hash][ext]'
          }
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name].[hash][ext]'
          }
        }
      ]
    },
    
    plugins: [
      // Copia arquivos estáticos
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'css',
            to: 'css'
          },
          {
            from: 'js/lib',
            to: 'js/lib'
          },
          {
            from: 'imagens',
            to: 'imagens'
          },
          {
            from: 'js/directives/templates',
            to: 'js/directives/templates'
          },
          {
            from: 'js/directives/srcDirectivesPadrao',
            to: 'js/directives/srcDirectivesPadrao'
          },
          {
            from: 'js/directives/menuPainel',
            to: 'js/directives/menuPainel'
          }
        ]
      }),
      
      // Extrai CSS em produção
      ...(isProduction ? [new MiniCssExtractPlugin({
        filename: 'css/[name].[contenthash].css'
      })] : [])
    ],
    
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: false,
            },
            compress: {
              drop_console: isProduction,
            },
          },
          extractComments: false,
        }),
      ],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // Agrupa bibliotecas externas
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          // Agrupa módulos do AngularJS
          angular: {
            test: /[\\/]node_modules[\\/]angular/,
            name: 'angular',
            chunks: 'all',
          },
          // Agrupa módulos principais do sistema
          core: {
            test: /[\\/]js[\\/](helpers|services|directives)[\\/]/,
            name: 'core',
            chunks: 'all',
          }
        }
      }
    },
    
    resolve: {
      extensions: ['.js', '.json'],
      alias: {
        // Aliases para facilitar imports
        '@js': path.resolve(__dirname, 'js'),
        '@css': path.resolve(__dirname, 'css'),
        '@images': path.resolve(__dirname, 'imagens'),
        '@templates': path.resolve(__dirname, 'js/directives/templates')
      }
    },
    
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      compress: true,
      port: 8080,
      hot: true,
      open: true,
      historyApiFallback: true,
      // Proxy para API backend
      proxy: {
        '/api/back': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false
        }
      }
    },
    
    // Mantém compatibilidade com source maps
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    
    // Configurações para compatibilidade com AngularJS
    externals: {
      // Permite que AngularJS seja carregado externamente se necessário
      angular: 'angular'
    }
  };
}; 