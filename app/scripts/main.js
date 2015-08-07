var gui = require('nw.gui');
var win = gui.Window.get();
var package_config = require('../package.json');

// Info related to the UI can be added to the windowState
var windowState = {
    isMaximised: true
};

var maximise = function() {
  windowState.isMaximised = !windowState.isMaximised;
  windowState.isMaximised ? win.unmaximize() : win.maximize();
};

var minimise = function() {
  win.minimize();
};

var closeApp = function() {
  win.close();
};

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
  toggleViews();
};

var toggleViews = function() {
  var step_1 = $('#step-1');
  var step_2 = $('#step-2');
  if (step_1.hasClass('hide')) {
    step_2.addClass('hide');
    step_1.removeClass('hide');
  } else {
    step_1.addClass('hide');
    step_2.removeClass('hide');
  }
};

if (package_config.window.frame) {
  $('header').remove();
  $('body').css('border-width', '0px');
}

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

