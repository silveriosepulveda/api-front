

// JavaScript Document
tinymce.init({
    language: 'pt_BR',
    mode: "textareas",
    plugins: [
        "save searchreplace wordcount visualblocks visualchars insertdatetime media nonbreaking",
        "table contextmenu directionality paste textcolor code"
    ],
    menu : [],
    toolbar1: "copy paste | fontselect | fontsizeselect | forecolor backcolor | bold italic underline | save",
    save_enablewhendirty: true,
    statusbar: false,
    image_advtab: true,
    subfolder: "",
    content_css: "BaseArcabouco/tinymce/tinymce.css"
});

setTimeout(function () {
    var idtext = $('textarea').attr('id');
    var altura = $('#' + idtext).attr('altura') - 140;
    $('#' + idtext + '_ifr').css('height', '100%');
}, 500);