// JavaScript Document
tinymce.init({
    language: 'pt_BR',
    mode: "textareas",
    plugins: [
        "autolink link image lists charmap preview hr anchor pagebreak",
        "searchreplace wordcount visualblocks visualchars insertdatetime media nonbreaking",
        "table contextmenu directionality emoticons paste textcolor responsivefilemanager pagebreak"
    ],
    toolbar1: "undo redo | styleselect | fontselect | fontsizeselect | forecolor backcolor | bold italic underline",
    toolbar2: "| alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | responsivefilemanager | link unlink anchor | image media | print preview code ",
    statusbar: false,
    image_advtab: true,
    content_css: "api-front/js/lib/tinymce/tinymce.css",
    external_filemanager_path: "api-front/js/lib/tinymce/filemanager/",
    filemanager_title: "Upload de Imagens para usar em Textos",
    external_plugins: { "filemanager": "filemanager/plugin.min.js" }
});

setTimeout(function () {
    console.log('carregando');
    
    // var altura = $('#descricao').attr('altura') - 140;
    // $('#descricao_ifr').css('height', '824px');
}, 500);