// Módulo para funções de diálogo simples
angular.module("dialogoServices", ["ngMaterial", "ngMessages"]).factory("DialogoSimplesServ", function ($rootScope, $http, config, $base64, $mdDialog, APIAjuFor) {
    
    // Adicionar estilos CSS customizados para o dialog seguindo o padrão da aplicação
    var addCustomStyles = function() {
        if (!document.getElementById('dialogo-simples-styles')) {
            var style = document.createElement('style');
            style.id = 'dialogo-simples-styles';
            style.textContent = `
                /* Modal Simples - HTML Puro */
                .modal-simples {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    background: rgba(0,0,0,0.5) !important;
                    z-index: 100000 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    padding: 16px !important;
                }
                
                .modal-simples .modal-content {
                    background: white !important;
                    padding: 24px !important;
                    border-radius: 6px !important;
                    min-width: 320px !important;
                    max-width: 560px !important;
                    max-height: 90vh !important;
                    overflow-y: auto !important;
                    box-shadow: 0 7px 8px -4px rgba(0,0,0,.2), 0 11px 15px 1px rgba(0,0,0,.14), 0 4px 20px 3px rgba(0,0,0,.12) !important;
                    position: relative !important;
                }
                
                .modal-simples .modal-title {
                    margin: 0 0 16px 0 !important;
                    font-size: 20px !important;
                    font-weight: 500 !important;
                    color: rgba(0,0,0,.87) !important;
                    line-height: 1.2 !important;
                }
                
                .modal-simples .modal-text {
                    margin: 0 0 24px 0 !important;
                    line-height: 1.5 !important;
                    color: rgba(0,0,0,.87) !important;
                    font-size: 14px !important;
                }
                
                .modal-simples .modal-actions {
                    display: flex !important;
                    justify-content: flex-end !important;
                    gap: 8px !important;
                    margin-top: 24px !important;
                }
                
                .modal-simples .btn {
                    min-width: 88px !important;
                    min-height: 36px !important;
                    line-height: 36px !important;
                    padding: 0 16px !important;
                    border-radius: 3px !important;
                    font-size: 14px !important;
                    font-weight: 500 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.01em !important;
                    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
                    border: none !important;
                    outline: none !important;
                    cursor: pointer !important;
                    position: relative !important;
                    overflow: hidden !important;
                }
                
                .modal-simples .btn-secondary {
                    color: #1976d2 !important;
                    background-color: transparent !important;
                }
                
                .modal-simples .btn-secondary:hover {
                    background-color: rgba(25, 118, 210, 0.04) !important;
                }
                
                .modal-simples .btn-primary {
                    color: #fff !important;
                    background-color: #1976d2 !important;
                    box-shadow: 0 2px 5px 0 rgba(0,0,0,.26) !important;
                }
                
                .modal-simples .btn-primary:hover {
                    background-color: #1565c0 !important;
                    box-shadow: 0 4px 8px 0 rgba(0,0,0,.4) !important;
                }
                
                /* Modal de Mensagem Simples */
                .modal-mensagem {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    background: rgba(0,0,0,0.5) !important;
                    z-index: 100000 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    padding: 16px !important;
                }
                
                .modal-mensagem .modal-content {
                    background: white !important;
                    padding: 24px !important;
                    border-radius: 6px !important;
                    min-width: 320px !important;
                    max-width: 560px !important;
                    max-height: 90vh !important;
                    overflow-y: auto !important;
                    box-shadow: 0 7px 8px -4px rgba(0,0,0,.2), 0 11px 15px 1px rgba(0,0,0,.14), 0 4px 20px 3px rgba(0,0,0,.12) !important;
                    position: relative !important;
                }
                
                .modal-mensagem .modal-title {
                    margin: 0 0 16px 0 !important;
                    font-size: 20px !important;
                    font-weight: 500 !important;
                    color: rgba(0,0,0,.87) !important;
                    line-height: 1.2 !important;
                }
                
                .modal-mensagem .modal-text {
                    margin: 0 0 24px 0 !important;
                    line-height: 1.5 !important;
                    color: rgba(0,0,0,.87) !important;
                    font-size: 14px !important;
                }
                
                .modal-mensagem .modal-actions {
                    display: flex !important;
                    justify-content: center !important;
                    margin-top: 24px !important;
                }
                
                .modal-mensagem .btn {
                    min-width: 88px !important;
                    min-height: 36px !important;
                    line-height: 36px !important;
                    padding: 0 16px !important;
                    border-radius: 3px !important;
                    font-size: 14px !important;
                    font-weight: 500 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.01em !important;
                    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
                    border: none !important;
                    outline: none !important;
                    cursor: pointer !important;
                    position: relative !important;
                    overflow: hidden !important;
                    color: #fff !important;
                    background-color: #1976d2 !important;
                    box-shadow: 0 2px 5px 0 rgba(0,0,0,.26) !important;
                }
                
                .modal-mensagem .btn:hover {
                    background-color: #1565c0 !important;
                    box-shadow: 0 4px 8px 0 rgba(0,0,0,.4) !important;
                }
                
                /* Modal de Aguarde */
                .modal-aguarde {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    background: rgba(0,0,0,0.5) !important;
                    z-index: 100000 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    padding: 16px !important;
                }
                
                .modal-aguarde .modal-content {
                    background: white !important;
                    padding: 32px !important;
                    border-radius: 6px !important;
                    min-width: 200px !important;
                    max-width: 400px !important;
                    text-align: center !important;
                    box-shadow: 0 7px 8px -4px rgba(0,0,0,.2), 0 11px 15px 1px rgba(0,0,0,.14), 0 4px 20px 3px rgba(0,0,0,.12) !important;
                    position: relative !important;
                }
                
                /* Spinner CSS Puro */
                .spinner {
                    width: 48px !important;
                    height: 48px !important;
                    margin: 0 auto 16px auto !important;
                    border: 4px solid #f3f3f3 !important;
                    border-top: 4px solid #1976d2 !important;
                    border-radius: 50% !important;
                    animation: spin 1s linear infinite !important;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .modal-aguarde .texto-aguarde {
                    margin: 0 !important;
                    font-size: 16px !important;
                    color: rgba(0,0,0,.87) !important;
                    font-weight: 500 !important;
                }
                
                /* Responsividade */
                @media (max-width: 600px) {
                    .modal-simples .modal-content,
                    .modal-mensagem .modal-content,
                    .modal-aguarde .modal-content {
                        min-width: 280px !important;
                        max-width: 90vw !important;
                        padding: 16px !important;
                    }
                    
                    .modal-simples .modal-actions {
                        flex-direction: column !important;
                        gap: 8px !important;
                    }
                    
                    .modal-simples .btn {
                        width: 100% !important;
                        min-width: auto !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    };
    
    // Adicionar estilos na inicialização
    addCustomStyles();
    
    // Verificar se estamos dentro de um modal
    var _isInsideModal = function () {
        return document.querySelector(".popup-modal.show, .popup-modal.in, .modal.show, .modal.in, .modal-backdrop") !== null;
    };
    
    // Função principal de diálogo simples (HTML puro)
    var _dialogoSimples = function (titulo, texto, btnConfirmar, btnCancelar, funcaoSim, funcaoNao) {
        var modalHtml = `
            <div id="modal-simples" class="modal-simples">
                <div class="modal-content">
                    <h3 class="modal-title">${titulo}</h3>
                    <p class="modal-text">${texto}</p>
                    <div class="modal-actions">
                        <button id="btn-cancelar" class="btn btn-secondary">${btnCancelar}</button>
                        <button id="btn-confirmar" class="btn btn-primary">${btnConfirmar}</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        document.getElementById('btn-confirmar').addEventListener('click', function() {
            document.getElementById('modal-simples').remove();
            if (typeof funcaoSim === 'function') {
                funcaoSim();
            }
        });
        
        document.getElementById('btn-cancelar').addEventListener('click', function() {
            document.getElementById('modal-simples').remove();
            if (typeof funcaoNao === 'function') {
                funcaoNao();
            }
        });
        
        document.getElementById('modal-simples').addEventListener('click', function(e) {
            if (e.target === this) {
                this.remove();
                if (typeof funcaoNao === 'function') {
                    funcaoNao();
                }
            }
        });
    };
    
    // Função de mensagem simples (HTML puro)
    var _mensagemSimples = function (titulo, texto, funcao, fecharModal = false) {
        var modalHtml = `
            <div id="modal-mensagem" class="modal-mensagem">
                <div class="modal-content">
                    <h3 class="modal-title">${titulo}</h3>
                    <p class="modal-text">${texto}</p>
                    <div class="modal-actions">
                        <button id="btn-ok" class="btn">Ok</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        document.getElementById('btn-ok').addEventListener('click', function() {
            document.getElementById('modal-mensagem').remove();
            
            if (typeof funcao === 'function') {
                funcao();
            }
            
            // Fechar PopUpModal se fecharModal=true
            if (fecharModal) {
                if (window.bootstrap && window.bootstrap.Modal) {
                    // Bootstrap 5
                    var modals = document.querySelectorAll(".modal.show, .popup-modal.show");
                    modals.forEach(function (modal) {
                        var modalInstance = window.bootstrap.Modal.getInstance(modal);
                        if (modalInstance) modalInstance.hide();
                    });
                } else if (window.$ && window.$.fn.modal) {
                    // Bootstrap 4/jQuery
                    $(".modal.show, .popup-modal.show, .popup-modal.in").modal("hide");
                }
            }
        });
        
        document.getElementById('modal-mensagem').addEventListener('click', function(e) {
            if (e.target === this) {
                this.remove();
            }
        });
    };
    
    // Função de tela de aguarde (HTML puro)
    var _telaAguarde = function (acao = "") {
        if (acao == "") {
            var modalHtml = `
                <div id="modal-aguarde" class="modal-aguarde">
                    <div class="modal-content">
                        <div class="spinner"></div>
                        <p class="texto-aguarde">Aguarde...</p>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Retornar objeto com método para fechar
            return {
                close: function() {
                    var modal = document.getElementById('modal-aguarde');
                    if (modal) {
                        modal.remove();
                    }
                }
            };
        } else if (acao == "fechar") {
            var modal = document.getElementById('modal-aguarde');
            if (modal) {
                modal.remove();
            }
        }
    };

    return {
        dialogoSimples: _dialogoSimples,
        mensagemSimples: _mensagemSimples,
        telaAguarde: _telaAguarde,
        isInsideModal: _isInsideModal
    };
}); 