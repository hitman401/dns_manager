var UploadHelper = function(id) {
  var fs = require('fs');
  var path = require('path');
  var mime = require('mime');
  //
  //var ffi = require('ffi');
  //
  //var safeApi = ffi.Library(path.join(__dirname, 'safe_ffi'), {
  //  'create_sub_directory': ['int', ['string', 'bool']],
  //  'create_file': ['int', ['string', 'string']],
  //  'register_dns': ['int', ['string', 'string', 'string']]
  //});

  var holder;
  var ProgressStatus = {
    totalSize: 0,
    completed: 0
  };

  var updateProgressBar = function() {
    $('.indicator div.meter').css('width', (ProgressStatus.completed * 97.5) / ProgressStatus.totalSize + '%');
  };

  var createDirectoryInNetwork = function(directoryPath) {
    console.log('Creating directory ' + directoryPath);
    //var errorCode = safeApi.create_sub_directory(directoryPath);
    //if (errorCode > 0) {
    //  throw 'Failed to create Directory ' + directoryPath + 'with error code :' + errorCode;
    //}
  };

  var writeFileToNetwork = function(localDirectory, networkDirectory, fileName, size) {
    var fd = fs.openSync(path.join(localDirectory, fileName), 'r');
    var buffer = new Buffer(size);
    var read = fs.readSync(fd, buffer, 0, size, 0);
    //var errorCode = safeApi.create_file(networkDirectory + '/' + fileName, buffer.toString());
    //if (errorCode > 0) {
    //  throw 'Failed to create file ' + directoryPath + '/' + fileName + 'with error code :' + errorCode;
    //}
    ProgressStatus.completed += read;
    updateProgressBar();
  };

  var computeDirectorySize = function(folderPath) {
    var stats;
    var tmpPath;
    var size = 0;
    var dirContents = fs.readdirSync(folderPath);
    for (var index in dirContents) {
      tmpPath = path.join(folderPath, dirContents[index]);
      stats = fs.statSync(tmpPath);
      if (stats.isDirectory()) {
        size += computeDirectorySize(tmpPath);
      } else {
        size += stats.size;
      }
    }
    return size;
  };

  var uploadFiles = function(folderPath, networkDirectoryPath) {
    var stats;
    var size = 0;
    if(!networkDirectoryPath) {
      networkDirectoryPath = path.basename(folderPath);
      createDirectoryInNetwork(networkDirectoryPath);
    }
    var dirContents = fs.readdirSync(folderPath);
    for (var index in dirContents) {
      stats = fs.statSync(path.join(folderPath, dirContents[index]));
      if (stats.isDirectory()) {
        var networkPath = networkDirectoryPath + '/' + dirContents[index];
        createDirectoryInNetwork(networkPath);
        uploadFiles(path.join(folderPath, dirContents[index]), networkPath);
      } else {
        writeFileToNetwork(folderPath, networkDirectoryPath, dirContents[index], stats.size);
      }
    }
    return size;
  };

  var uploadFolder = function(folderPath) {
    var stats = fs.statSync(folderPath);
    if (!stats.isDirectory()) {
      alert('Drag and drop a directory!');
      return;
    }
    window.showSection('step-3');
    ProgressStatus.totalSize = computeDirectorySize(folderPath);
    try {
      uploadFiles(folderPath);
    } catch(e) {
      console.error(e);
    }
  };

  var dropHandler = function (e) {
    e.preventDefault();
    if (e.dataTransfer.files.length === 0) {
      return false;
    }
    uploadFolder(e.dataTransfer.files[0].path);
    return false;
  };

  holder = document.getElementById(id);
  holder.ondragover = function () { this.className = 'hover'; return false; };
  holder.ondragleave = function () { this.className = ''; return false; };
  holder.ondrop = dropHandler;
  return this;
};

UploadHelper('drag_drop');
