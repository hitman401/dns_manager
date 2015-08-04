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
