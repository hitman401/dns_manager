/**
 * Created by Krishna on 04-08-2015.
 */

var grunt = require('grunt');

grunt.loadNpmTasks('grunt-nw-builder');

grunt.initConfig({
  nwjs: {
    options: {
      platforms: ['win','osx', 'linux'],
      buildDir: './dist', // Where the build version of my NW.js app is saved
    },
    src: ['./app/**'] // Your NW.js app
  }
});