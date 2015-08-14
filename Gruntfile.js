var grunt = require('grunt');

// TODO Load grunt modules automatically
grunt.loadNpmTasks('grunt-nw-builder');
grunt.loadNpmTasks('grunt-exec');

grunt.initConfig({
  nwjs: {
    options: {
      platforms: ['win'],//,'osx', 'linux'],
      buildDir: './dist', // Where the build version of my NW.js app is saved
    },
    src: ['./app/**'] // Your NW.js app
  },
  exec: {
    install_build_dependencies: {
      command: 'npm install'
    },
    install_app_dependencies: {
      command: 'bower install && cd app && npm install'
    },
    // TODO package commands can take path as argument
    package_windows_64: {
      command: 'cd dist/dns_manager/win64 &&\
                enigmavirtualbox gen app.evp dns_manager_boxed.exe dns_manager.exe d3dcompiler_47.dll ffmpegsumo.dll \
                icudtl.dat libEGL.dll libGLESv2.dll nw.pak pdf.dll &&\
                enigmavirtualbox cli app.evp'
    },
    package_windows_32: {
      command: 'cd dist/dns_manager/win32 &&\
                enigmavirtualbox gen app.evp dns_manager_boxed.exe dns_manager.exe d3dcompiler_47.dll ffmpegsumo.dll \
                icudtl.dat libEGL.dll libGLESv2.dll nw.pak pdf.dll &&\
                enigmavirtualbox cli app.evp'
    }
  }
});

grunt.registerTask("install", ["exec:install_build_dependencies", "exec:install_app_dependencies"]);

grunt.registerTask("build", ["nwjs"]);//, "exec:package_windows_32", "exec:package_windows_64"]);