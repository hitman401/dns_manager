module.exports = function(onStart, onProgress, onComplete) {
  var fs = require('fs');
  var path = require('path');
  var mime = require('mime');
  var ffi = require('ffi');
  var ref = require('ref');
  var ArrayType = require('ref-array');
  var IntArray = ArrayType(ref.types.int);
  var safeApi;

  var ProgressHandler = function(totalSize, callback) {
    var completed = 0;
    var alive = true;

    this.update = function(error, size) {
      if (!alive) {
        return;
      }
      if (error) {
        alive = false;
        callback ? callback(error) : function(){ /*no-op*/ };
        return;
      }
      completed += size;
      var meter = (completed * 97.5) / totalSize;
      onProgress(meter);
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
    onStart();
    try {
      var handler = new ProgressHandler(computeDirectorySize(folderPath), function(err) {
        if (err) {
          onComplete(err);
          return;
        }
        try {
          var errorCode = safeApi.register_dns($('#public_name').val(), $('#service_name').val(), path.basename(folderPath));
          if (errorCode > 0) {
            onComplete(err);
            return;
          }
          console.log('Registered Domain: safe:%s.%s with path %s', $('#service_name').val(), $('#public_name').val(), path.basename(folderPath));
          onComplete();
        } catch (e) {
          console.log(e);
          onComplete(999);
        }
      });
      handler.update(null, 0);
      uploadFiles(folderPath, handler);
    } catch(e) {
      console.error(e);
      window.showSection('failure');
    }
  };
  this.uploadFolder = uploadFolder;
  return this;
};
