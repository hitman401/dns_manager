# Safe Network Uploader

An example application to demonstrate uploading file to the Safe network

##Dependency

Build the [Safe_ffi](https://github.com/ustulation/safe_ffi/tree/master/rust) rust code to generate dynamic library.
Place the library in the src folder


## Dev

```
$ npm install
$ npm rebuild
```

`npm rebuild` will rebuild the native modules with `electron-rebuild`

### Run

```
$ npm start
```

### Build

```
$ npm run build
$ npm run build-win
$ npm run build-linux
$ npm run build-osx
```

`npm run build-{platform}` will build the project for 64bit binaries

Builds the app for OS X, Linux, and Windows, using [electron-packager](https://github.com/maxogden/electron-packager).
