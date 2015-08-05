var UploadHelper = function(id) {
  var fs = require('fs');
  var path = require('path');
  var mime = require('mime');

  var holder;
  var ProgressStatus = {
    totalSize: 0,
    completed: 0
  };

  var showProgressBar = function() {
    $('#progress_bar').removeClass('hide');
    $('#drag_drop').addClass('hide');
  };

  var updateProgressBar = function() {
    $('.indicator div.meter').css('width', ((ProgressStatus.completed * 100) / ProgressStatus.totalSize) + '%');
  };

  var createDirectoryInNetwork = function(directoryName) {
    // TODO create container if it is not present in the root
    // Return a container object
    console.log("Directory Created: " + directoryName);
  };

  var writeFileToNetwork = function(parentDirectory, fileName, size) {
    console.log("Creating file: " + mime.lookup(fileName) + " in " + parentDirectory);
    var fd = fs.openSync(path.join(parentDirectory, fileName), 'r');
    var buffer;
    var totalRead = 0;
    var read;
    while (totalRead < size) {
      buffer = new Buffer(5000);
      read = fs.readSync(fd, buffer, 0, 5000, read);
      totalRead += read;
      // TODO use the data in buffer and safe the File in network
      ProgressStatus.completed += read;
      updateProgressBar();
    }
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

  var uploadFiles = function(folderPath) {
    var stats;
    var size = 0;
    createDirectoryInNetwork(path.basename(folderPath));
    var dirContents = fs.readdirSync(folderPath);
    for (var index in dirContents) {
      stats = fs.statSync(path.join(folderPath, dirContents[index]));
      if (stats.isDirectory()) {
        createDirectoryInNetwork(path.join(folderPath, dirContents[index]));
        uploadFiles(path.join(folderPath, dirContents[index]));
      } else {
        writeFileToNetwork(folderPath, dirContents[index], stats.size);
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
    showProgressBar();
    ProgressStatus.totalSize = computeDirectorySize(folderPath);
    uploadFiles(folderPath);
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

UploadHelper("drag_drop");
