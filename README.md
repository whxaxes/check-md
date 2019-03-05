# check-md



[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![NPM download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/check-md.svg?style=flat-square
[npm-url]: https://npmjs.org/package/check-md
[travis-image]: https://img.shields.io/travis/{{org}}/check-md.svg?style=flat-square
[travis-url]: https://travis-ci.org/{{org}}/check-md
[codecov-image]: https://codecov.io/gh/{{org}}/check-md/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/{{org}}/check-md
[david-image]: https://img.shields.io/david/{{org}}/check-md.svg?style=flat-square
[david-url]: https://david-dm.org/{{org}}/check-md
[snyk-image]: https://snyk.io/test/npm/check-md/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/check-md
[download-image]: https://img.shields.io/npm/dm/check-md.svg?style=flat-square
[download-url]: https://npmjs.org/package/check-md

## Usage

```bash
$ npm i check-md --save
$ npx check-md
```

## Options

```
Usage: check-md [options]

Options:
  -v, --version            output the version number
  -f, --fix                Check and try to fix
  -c, --cwd [path]         Working directory of check-md, default to process.cwd()
  -r, --root [path]        Checking url root, default to ./
  -p, --preset [name]      Preset config(eg vuepress, default)
  -P, --pattern [pattern]  Glob patterns, default to **/*.md
  -i, --ignore [pattern]   Ignore patterns, will merge to pattern, default to **/node_modules
  --exit-level [level]     Process exit level, default to error, other choice is warn and none, it will not exit if setting to none
  --default-index [index]  Default index in directory, default to README.md,readme.md
  -h, --help               output usage information
```

configure in `package.json`

```json
{
  "check-md": {
    "cwd": "./",
    "defaultIndex": [ "index.md" ],
    "exitLevel": "warn",
  }
}
```
