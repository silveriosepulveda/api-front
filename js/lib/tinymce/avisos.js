// JavaScript Document
tinymce.init({
	language : 'pt_BR',
	entity_encoding : "raw",
    mode: "textareas",	
    plugins: [
         "image responsivefilemanager preview textcolor table"
   ],   
   //removed_menuitems: "newdocument undo redo cut copy paste pastetext selectall visualaid bold italic underline strikethrough superscript subscript formats removeformat",
   menubar : false,
   statusbar : false,
   toolbar1: "table | fontselect | fontsizeselect ",
   toolbar2: "bold italic underline | alignleft aligncenter alignright alignjustify ",
   toolbar3: "forecolor backcolor | image media| preview | undo redo",
   	image_advtab: true ,
    content_css: "tinymce/tinymce.css" ,
	external_filemanager_path:"tinymce/filemanager/",
   	filemanager_title:"Upload de Imagens para usar em Textos" ,
   	external_plugins: { "filemanager" : "filemanager/plugin.min.js"}
});

setTimeout(function(){
	var altura = $('#aviso').attr('altura') - 140;
	$('#aviso_ifr').css('height', altura+'px');
}, 500);