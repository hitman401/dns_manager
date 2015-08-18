var safeApi;

var UploadHelper = function(id) {
  var fs = require('fs');
  var path = require('path');
  var mime = require('mime');
  var ffi = require('ffi');
  var ref = require('ref');
  var ArrayType = require('ref-array');
  var IntArray = ArrayType(ref.types.int);
  var holder;

  var ProgressHandler = function(totalSize, callback) {
    var completed = 0;

    this.update = function(error, size) {
      if (error) {
        callback ? callback(error) : function(){ /*no-op*/ };
        return;
      }
      completed += size;
      var meter = (completed * 97.5) / totalSize;
      $('.indicator div.meter').css('width', meter + '%');
      if (completed === totalSize) {
        callback ? callback() : function(){ /*no-op*/ };
      }
    };

  };

  var getLibraryFileName = function() {
    var fileName;
    var root = (__dirname.indexOf('asar') === -1) ? './src/' : path.resolve(__dirname, '../../../app.asar.unpacked/src/');
    if (/^win/.test(process.platform)) { // Windows
      fileName = 'safe_ffi.dll';
    } else if (/^darwin/.test(process.platform)) { // OSX
      fileName = 'libsafe_ffi.dylib';
    } else { // LINUX
      fileName = 'libsafe_ffi.so';
    }
    return path.resolve(root, fileName);
  };

  var initSafeApi = function() {
    safeApi = ffi.Library(getLibraryFileName(), {
      'create_sub_directory': ['int', ['string', 'bool']],
      'create_file': ['int', ['string', IntArray, 'int']],
      'register_dns': ['int', ['string', 'string', 'string']]
    });
  };

  var createDirectoryInNetwork = function(directoryPath, callback) {
    setTimeout(function() {
      console.log('Creating directory ' + directoryPath);
      var errorCode = safeApi.create_sub_directory(directoryPath, false);
      if (errorCode > 0) {
        callback(errorCode);
      } else {
        callback(null, errorCode);
      }
    }, 0);
  };

  var writeFileToNetwork = function(localDirectory, networkDirectory, fileName, size, handler) {
    setTimeout(function() {
      console.log("Creating file %s in %s", fileName, networkDirectory);
      var buffer = fs.readFileSync(path.join(localDirectory, fileName));
      var errorCode = safeApi.create_file(networkDirectory + '/' + fileName, buffer, size);
      if (errorCode > 0) {
        handler.update(errorCode);
      } else {
        handler.update(null, size);
      }
    }, 0);
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

  var uploadFiles = function(folderPath, handler, networkDirectoryPath) {
    var stats;
    if(!networkDirectoryPath) {
      networkDirectoryPath = path.basename(folderPath);
      createDirectoryInNetwork(networkDirectoryPath, function(error) {
        if(error || error > 0) {
          throw 'Failed to create directory : ' + networkDirectoryPath;
        }
        uploadFiles(folderPath, handler, networkDirectoryPath);
      });
      return;
    }
    var dirContents = fs.readdirSync(folderPath);
    for (var index in dirContents) {
      stats = fs.statSync(path.join(folderPath, dirContents[index]));
      if (stats.isDirectory()) {
        var networkPath = networkDirectoryPath + '/' + dirContents[index];
        createDirectoryInNetwork(networkPath, function(error) {
          if(error || error > 0) {
            throw 'Failed to create directory : ' + networkDirectoryPath;
          }
          uploadFiles(path.join(folderPath, dirContents[index]), handler, networkPath);
        });
      } else {
        writeFileToNetwork(folderPath, networkDirectoryPath, dirContents[index], stats.size, handler);
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
    try {
      var handler = new ProgressHandler(computeDirectorySize(folderPath), function(err) {
        if (err) {
          showSection('failure');
        }
        setTimeout(function() {
          var errorCode = safeApi.register_dns($('#public_name').val(), $('#service_name').val(), path.basename(folderPath));
          if (errorCode > 0) {
            showSection('failure');
          }
          console.log('Registered Domain: safe:%s.%s with path %s', $('#service_name').val(), $('#public_name').val(), path.basename(folderPath));
          showSection('success');
        }, 0);
      });
      handler.update(null, 0);
      uploadFiles(folderPath, handler);
    } catch(e) {
      console.error(e);
      window.showSection('failure');
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