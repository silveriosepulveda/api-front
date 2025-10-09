// JavaScript Document
tinymce.init({
	language : 'pt_BR',
    mode: "textareas",	
    
    force_br_newlines : true,
    force_p_newlines : false,
    force_root_block : '',
    paste_auto_cleanup_on_paste : true,
    
    remove_script_host : false,
    relative_urls : false,
    
    plugins: [
         "autolink link image lists charmap preview hr anchor pagebreak",
         "searchreplace wordcount visualblocks visualchars insertdatetime media nonbreaking",
         "table contextmenu directionality emoticons paste textcolor responsivefilemanager"
   ],   
   toolbar1: "undo redo | styleselect | fontselect | fontsizeselect | forecolor backcolor | bold italic underline",
   toolbar2: "| alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | responsivefilemanager | link unlink anchor | image media | print preview code ",
   statusbar : false,
   	image_advtab: true ,
    content_css: "BaseArcabouco/tinymce/tinymce.css" ,
	external_filemanager_path:"BaseArcabouco/tinymce/filemanager/",
   	filemanager_title:"Upload de Imagens para usar em Textos" ,
   	external_plugins: { "filemanager" : "filemanager/plugin.min.js"}
});

setTimeout(function(){
	var altura = $('#descricao').attr('altura') - 140;
	$('#descricao_ifr').css('height', altura+'px');
}, 500);