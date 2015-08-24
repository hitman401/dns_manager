var SafeApi = function() {
  var path = require('path');
  var fs = require('fs');

  var childProcess = require("child_process").fork(((__dirname.indexOf('asar') === -1) ? './src/scripts/safe_api' : __dirname) + '/safe_io');

  var CallbackStore = {
    get: function(key) {
      return this[key]
    },
    delete: function(key) {
      delete this[key];
    },
    put: function(key, callback) {
      this[key] = callback;
    }
  };

  var getLibraryFileName = function() {
    var fileName;
    var root = (__dirname.indexOf('asar') === -1) ? './src/scripts/safe_api/' : path.resolve(__dirname, '../../../../app.asar.unpacked/src/scripts/safe_api/');
    if (/^win/.test(process.platform)) { // Windows
      fileName = 'safe_ffi.dll';
    } else if (/^darwin/.test(process.platform)) { // OSX
      fileName = 'libsafe_ffi.dylib';
    } else { // LINUX
      fileName = 'libsafe_ffi.so';
    }
    return path.resolve(root, fileName);
  };

  childProcess.on('exit', function() {
    console.log('Child Process Aborted');
  });

  childProcess.on('message', function(msg) {
    if (!msg.postback) {
      console.log(msg);
      return;
    }
    if (msg.error === 999) {
      console.log(999 + ' : ' + msg.msg);
    }
    CallbackStore.get(msg.postback)(msg.error, msg.data);
    CallbackStore.delete(msg.postback);
  });

  this.createDirectory = function(directoryPath, callback) {
     CallbackStore.put(directoryPath, callback);
     childProcess.send({
       method: 'create_directory',
       directoryPath: directoryPath,
       postback: directoryPath
     });
  };

  this.createFile = function(directoryPath, fileName, localFilePath, callback) {
    CallbackStore.put(directoryPath + fileName, callback);
    childProcess.send({
      method: 'create_file',
      directoryPath: directoryPath,
      fileName: fileName,
      localFilePath: localFilePath,
      postback: directoryPath + fileName
    });
  };

  this.registerDns = function(publicName, serviceName, directoryPath, callback) {
    CallbackStore.put(serviceName + publicName, callback);
    childProcess.send({
      method: 'register_dns',
      publicName: publicName,
      serviceName: serviceName,
      directoryPath: directoryPath,
      postback: serviceName + publicName
    });
  };

  childProcess.send({
    method: 'init',
    libPath: getLibraryFileName()
  });

  return this;
};

exports.safeAPI = new SafeApi();
