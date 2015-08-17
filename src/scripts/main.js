var remote = require('remote');
var Menu = remote.require('menu');
// TODO fetch from bower components itself
window.$ = window.jQuery = require('../scripts/jquery.js');


// Disable Menu bar
Menu.setApplicationMenu(null);

var showError = function(id, msg) {
  var pos = $('#' + id).offset();
  var errorElement = $('.error');
  errorElement.css('top', pos.top + 40 + 'px');
  errorElement.css('left', pos.left + 'px');
  errorElement.css('display', 'block');
  $('.error-msg').html(msg);
  setTimeout(function() {
    $('.error').css('display', 'none');
  }, 3000);
};

var validate = function() {
  var serviceName = document.getElementById('service_name').checkValidity();
  var publicName = document.getElementById('public_name').checkValidity();
  if (serviceName && publicName) {
    return true;
  } else if(!serviceName) {
    showError('service_name', 'Service Name should be filled');
  } else if(!publicName) {
    showError('public_name', 'Public Name should be filled');
  }
  return false;
};

var register = function() {
  if(!validate()) {
    return;
  }
  showSection('step-2');
};

var showSection = function(id) {
  var tmp;
  var hideClass = 'hide';
  var sections = [];
  $('section').map(function(i, e) {
    sections.push(e.getAttribute('id'));
  });
  for (var i in sections) {
    if (sections[i] === id) {
      $('#' + sections[i]).removeClass(hideClass);
      continue;
    }
    tmp = $('#' + sections[i]);
    if (!tmp.hasClass(hideClass)) {
      tmp.addClass(hideClass);
    }
  }
};

//if (package_config.window.frame) {
  $('header').remove();
  $('body').css('border-width', '0px');
//}

/**
 *  Dragover and drop is disabled on document.
 *  Read > https://github.com/nwjs/nw.js/issues/219
 */
document.addEventListener('dragover', function(e){
  e.preventDefault();
  e.stopPropagation();
}, false);

document.addEventListener('drop', function(e){
  e.preventDefault();
  e.stopPropagation();
}, false);


// TODO use jquery hide and show methods instead of adding classes
$('#template_title_input').focusout(function() {
  $('#edit_template_title').addClass('hide');
  $('#template_title').removeClass('hide');
});

var editTemplateTitle = function() {
  $('#template_title').addClass('hide');
  $('#edit_template_title').removeClass('hide');
  $('#template_title_input').focus();
};

var updateTemplateTitle = function(value) {
  $('#template_title').html(value);
};

$('#template_content_input').focusout(function() {
  $('#edit_template_content').addClass('hide');
  $('#template_content').removeClass('hide');
});

var editTemplateContent = function() {
  $('#template_content').addClass('hide');
  $('#edit_template_content').removeClass('hide');
  $('#template_content_input').focus();
};

var updateTemplateContent = function(value) {
  $('#template_content').html(value);
};

var resetTemplate = function() {
  $('#template_title').html("My Page");
  $('#template_title_input').val("My Page");
  $('#template_content').html("This page is created and published on the SAFE Network using the SAFE Uploader");
  $('#template_content_input').val("This page is created and published on the SAFE Network using the SAFE Uploader");
};


var publishTemplate = function() {
  var title = $('#template_title_input').val();
  var content = $('#template_content_input').val();
  var fs = require('fs');
  var util = require('util');

  var templateString = fs.readFileSync("./src/views/template.html").toString();

  if (!fs.existsSync('./template')) {
    fs.mkdirSync('./template');
  }
  fs.writeFileSync('./template/index.html', util.format(templateString, title, content));

  var buff = fs.readFileSync('./src/imgs/phone_purple.jpg');
  fs.writeFileSync('./template/bg.jpg', buff);
  var buff = fs.readFileSync('./src/bower_components/bower-foundation5/css/normalize.css');
  fs.writeFileSync('./template/normalize.css', buff);
  var buff = fs.readFileSync('./src/bower_components/bower-foundation5/css/foundation.css');
  fs.writeFileSync('./template/foundation.css', buff);
  resetTemplate();
  showSection('step-3');
  UploadHelper().uploadFolder('template');
};