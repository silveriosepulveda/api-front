// JavaScript Document
tinymce.init({
    language: 'pt_BR',
    mode: "textareas",
    selector: "#descricao",
    plugins: [
        "autoresize autolink link image lists charmap preview hr anchor pagebreak",
        "searchreplace wordcount visualblocks visualchars insertdatetime media nonbreaking",
        "table contextmenu directionality emoticons paste textcolor responsivefilemanager code paste"
    ],
    toolbar1: "undo redo | styleselect | fontselect | fontsizeselect | forecolor backcolor | bold italic underline",
    toolbar2: "| alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | responsivefilemanager | link unlink anchor | image media | print preview code",
    statusbar: false,
    image_advtab: true,
    content_css: "BaseArcabouco/tinymce/tinymce.css",
    external_filemanager_path: "BaseArcabouco/tinymce/filemanager/",
    filemanager_title: "Upload de Imagens para usar em Textos",
    external_plugins: {"filemanager": "filemanager/plugin.min.js"},
    //object_resizing : ":not(table)",
    //paste_word_valid_elements: "b,strong,i,em,h1,h2,h3,h4,h5,h6,table,tr,td,label"
});

setTimeout(function () {
    var altura = $('#descricao').attr('altura') - 140;
    $('#descricao_ifr').css('height', altura + 'px');
    $(document).on('focus', '#descricao_ifr', function () {
        var altura = $('#descricao').attr('altura') - 140;
        $('#descricao_ifr').css('height', altura + 'px');
    });

}, 1000);