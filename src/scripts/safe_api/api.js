var SafeApi = function() {
  var childProcess = require("child_process").fork("./src/scripts/safe_api/safe_io");
  var path = require('path');

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

  childProcess.on('exit', function() {
    console.log('Child Process Aborted');
  });

  childProcess.on('message', function(msg) {
    if (!msg.postback) {
      console.log(msg);
      return;
    }
    var callback = CallbackStore.get(msg.postback);
    msg.error === 0 ? callback(null, msg.data) : callback(msg.error);
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

  this.createFile = function(directoryPath, fileName, contents, size, callback) {
    CallbackStore.put(directoryPath + fileName, callback);
    childProcess.send({
      method: 'create_file',
      directoryPath: directoryPath,
      filename: fileName,
      contents: contents,
      size: size,
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
