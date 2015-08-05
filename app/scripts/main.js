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

var UploadListener = function() {
  var holder;

  var handler = function (e) {
    e.preventDefault();
    var file;
    var filesLog = "";
    for (var i = 0; i < e.dataTransfer.files.length; ++i) {
      file = e.dataTransfer.files[i];
      filesLog += (file.name + " : type - " + file.type + "\n");
    }
    alert(filesLog);
    return false;
  };

  this.init = function(id) {
    holder = document.getElementById(id);
    holder.ondragover = function () { this.className = 'hover'; return false; };
    holder.ondragleave = function () { this.className = ''; return false; };
    holder.ondrop = handler;
  };

  return this;
};

UploadListener().init("drag_drop");
