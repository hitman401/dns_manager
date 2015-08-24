module.exports = function(onStart, onProgress, onComplete) {
  var fs = require('fs');
  var path = require('path');
  var mime = require('mime');

  var safeApi = require('../scripts/safe_api/api').safeAPI;

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
      console.log('SIZE : ' + size);
      completed += size;
      var meter = (completed * 97.5) / totalSize;
      onProgress(meter);
      if (completed === totalSize) {
        callback ? callback() : function(){ /*no-op*/ };
      }
    };
  };

  var createDirectoryInNetwork = function(directoryPath, callback) {
    console.log('Creating directory ' + directoryPath);
    safeApi.createDirectory(directoryPath, callback);
  };

  var writeFileToNetwork = function(localDirectory, networkDirectory, fileName, size, handler) {
    console.log("Creating file " + fileName + "  in " + networkDirectory);
    var buffer = fs.readFileSync(path.join(localDirectory, fileName));
    safeApi.createFile(networkDirectory, fileName, buffer, size, handler.update);
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
    onStart();
    try {
      var handler = new ProgressHandler(computeDirectorySize(folderPath), function(err) {
        if (err) {
          onComplete(err);
          return;
        }
        try {
          safeApi.registerDns($('#public_name').val(), $('#service_name').val(), path.basename(folderPath), function(errorCode) {
            if (errorCode !== 0) {
              onComplete(err);
            } else {
              console.log('Registered Domain: safe:%s.%s with path %s', $('#service_name').val(), $('#public_name').val(), path.basename(folderPath));
              onComplete();
            }
          });
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
