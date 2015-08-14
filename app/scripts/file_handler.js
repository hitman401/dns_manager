var safeApi;

var UploadHelper = function(id) {
  var fs = require('fs');
  var path = require('path');
  var mime = require('mime');
  //
  var ffi = require('ffi');
  var ref = require('ref');
  var ArrayType = require('ref-array');
  var IntArray = ArrayType(ref.types.int);
  var holder;
  var ProgressStatus = {
    totalSize: 0,
    completed: 0,
    reset: function() {
      this.totalSize = 0;
      this.completed = 0;
    }
  };

  //TODO verify files names on OSX and Linux
  var getLibraryFileName = function() {
    var fileName;
    if (/^win/.test(process.platform)) { // Windows
      fileName = 'safe_ffi.dll';
    } else if (/^darwin/.test(process.platform)) { // OSX
      fileName = 'safe_ffi.dylib';
    } else{ // LINUX
      fileName = 'libsafe_ffi.so';
    }
    return fileName;
  };

  var initSafeApi = function() {
    safeApi = ffi.Library(getLibraryFileName(), {
      'create_sub_directory': ['int', ['string', 'bool']],
      'create_file': ['int', ['string', IntArray, 'int']],
      'register_dns': ['int', ['string', 'string', 'string']]
    });
  };

  var updateProgressBar = function() {
    setTimeout(function() {
      $('.indicator div.meter').css('width', (ProgressStatus.completed * 97.5) / ProgressStatus.totalSize + '%');
    }, 10);

  };

  var createDirectoryInNetwork = function(directoryPath) {
    console.log('Creating directory ' + directoryPath);
    var errorCode = safeApi.create_sub_directory(directoryPath, false);
    if (errorCode > 0) {
      throw 'Failed to create Directory ' + directoryPath + 'with error code :' + errorCode;
    }
  };

  var writeFileToNetwork = function(localDirectory, networkDirectory, fileName, size) {
    console.log("Creating file %s in %s", fileName, networkDirectory);
    var buffer = fs.readFileSync(path.join(localDirectory, fileName));
    var errorCode = safeApi.create_file(networkDirectory + '/' + fileName, buffer, size);
    if (errorCode > 0) {
      throw 'Failed to create file ' + directoryPath + '/' + fileName + 'with error code :' + errorCode;
    }
    ProgressStatus.completed += size;
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
  };

  var uploadFolder = function(folderPath) {
    var stats = fs.statSync(folderPath);
    if (!stats.isDirectory()) {
      alert('Drag and drop a directory!');
      return;
    }
    if (!safeApi) {
      initSafeApi();
    }
    window.showSection('step-3');
    ProgressStatus.reset();
    ProgressStatus.totalSize = computeDirectorySize(folderPath);
    updateProgressBar(); // Reset progress to 0
    setTimeout(function() {
      try {
        uploadFiles(folderPath);
        var errorCode = safeApi.register_dns($('#public_name').val(), $('#service_name').val(), path.basename(folderPath));
        if (errorCode > 0) {
          throw "DNS Registration failed";
        }
        console.log('Registered Domain: safe:%s.%s with path %s', $('#service_name').val(), $('#public_name').val(), path.basename(folderPath));
        window.showSection('success');
      } catch(e) {
        console.error(e);
        window.showSection('failure');
      }
    }, 100);
  };

  var dropHandler = function (e) {
    e.preventDefault();
    if (e.dataTransfer.files.length === 0) {
      return false;
    }
    uploadFolder(e.dataTransfer.files[0].path);
    return false;
  };

  if (id) {
    holder = document.getElementById(id);
    holder.ondragover = function () { this.className = 'hover'; return false; };
    holder.ondragleave = function () { this.className = ''; return false; };
    holder.ondrop = dropHandler;
  }
  this.uploadFolder = uploadFolder;

  return this;
};

UploadHelper('drag_drop');
