var remote = require('remote');
var Menu = remote.require('menu');
var UploadHelper = require('../scripts/file_handler');

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


var registerDragRegion = function(id) {
  var helper = new UploadHelper(function() { // onstarted
    showSection('step-3');
  },function(meter) { // Progress Update
    $('.indicator div.meter').css('width', meter + '%');
  }, function(err) { // done
    showSection(err ? 'failure': 'success');
  });
  var holder = document.getElementById(id);
  holder.ondragover = function () { this.className = 'hover'; return false; };
  holder.ondragleave = function () { this.className = ''; return false; };
  holder.ondrop = function (e) {
    e.preventDefault();
    if (e.dataTransfer.files.length === 0) {
      return false;
    }
    helper.uploadFolder(e.dataTransfer.files[0].path);
    return false;
  };
};

var publishTemplate = function() {
  var path = require('path');
  var temp = require('temp').track();
  var title = $('#template_title_input').val();
  var content = $('#template_content_input').val();
  var fs = require('fs');
  var util = require('util');
  var serviceName = $('#service_name').val();
  var publicName = $('#public_name').val();
  try {
    var root = (__dirname.indexOf('asar') === -1) ? path.resolve('src') : path.resolve(__dirname, '../../src/');
    var templateString = fs.readFileSync(path.resolve(root, 'views/template.html')).toString();
    var tempDirPath = temp.mkdirSync('safe_uploader_template');

    fs.writeFileSync(path.resolve(tempDirPath, 'index.html'),
        util.format(templateString.replace(/SAFE_SERVICE/g, serviceName).replace(/SAFE_PUBLIC/g, publicName), title, content));
    var buff = fs.readFileSync(path.resolve(root, 'imgs/phone_purple.jpg'));
    fs.writeFileSync(path.resolve(tempDirPath, 'bg.jpg'), buff);
    buff = fs.readFileSync(path.resolve(root, 'bower_components/bower-foundation5/css/normalize.css'));
    fs.writeFileSync(path.resolve(tempDirPath, 'normalize.css'), buff);
    buff = fs.readFileSync(path.resolve(root, 'bower_components/bower-foundation5/css/foundation.css'));
    fs.writeFileSync(path.resolve(tempDirPath, 'foundation.css'), buff);
    resetTemplate();
    showSection('step-3');
    new UploadHelper(function() { // onstarted
      showSection('step-3');
    },function(meter) { // Progress Update
      $('.indicator div.meter').css('width', meter + '%');
    }, function(err) { // done
      showSection(err ? 'failure': 'success');
    }).uploadFolder(tempDirPath);
  } catch(e) {
    console.log(e.message);
    showSection('failure');
  }
};

registerDragRegion('drag_drop');