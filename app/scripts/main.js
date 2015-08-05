var gui = require('nw.gui');
var win = gui.Window.get();

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
