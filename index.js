const glob = require('globby');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const url = require('url');
const assert = require('assert');
const headingRE = /(?:\r?\n|^)#+ ([^\n]+)/g;
const matchUrlStr = c => `([^${c}]*)`;
const matchAnchorStr = `((?:\\!)?\\[[^\\]\\r\\n]+\\])(?:(?:\\: *${matchUrlStr('\\r\\n')})|(?:\\(${matchUrlStr('\\)')}\\)))`;
const matchAnchorRE = new RegExp(`(?:\\r?\\n|${matchAnchorStr})`);

/** @type {Map<String, CacheObj>} */
const contentCache = new Map();
const dirtyContentList = [];

exports.presetConfig = {
  vuepress: {
    root: [ './', './.vuepress/public' ],
  },
  default: {
    defaultIndex: [ 'README.md', 'readme.md' ],
    root: [ './' ],
    pattern: '**/*.md',
    cwd: process.cwd(),
  },
};

/**
 * @typedef {Object} CacheObj
 * @property {String} CacheObj.content
 * @property {Boolean} CacheObj.dirty
 * @property {String} CacheObj.fileUrl
 * @property {Array<String>} [CacheObj.headings]
 */

/**
 * @typedef {Object} CheckOption
 * @property {String} CheckOption.cwd
 * @property {Boolean} [CheckOption.fix]
 * @property {Array<String>} [CheckOption.root]
 * @property {Array<String>} [CheckOption.defaultIndex]
 * @property {String} [CheckOption.preset]
 * @property {String} [CheckOption.pattern]
 */

/**
 * @typedef {Object} ReportResult
 * @property {String} ReportResult.msg
 * @property {Array<String>} ReportResult.list
 * @property {'error' | 'info' | 'log' | 'warn'} ReportResult.type
 * @property {Boolean} ReportResult.exit
 */

/**
 * check md's heading
 * @param {String} fileUrl
 * @param {String} heading
 * @return {Boolean}
 */
function hasHeading(fileUrl, heading) {
  const cacheObj = getContent(fileUrl);
  if (!cacheObj.headings) {
    cacheObj.headings = [];
    cacheObj.content.replace(headingRE, (_, hash) => {
      cacheObj.headings.push(hash.trim().toLowerCase().replace(/ /g, '-'));
    });
  }

  heading = heading.toLowerCase();
  return cacheObj.headings.includes(heading);
}

/**
 * get content with cache
 * @param {String} fileUrl
 * @return {CacheObj}
 */
function getContent(fileUrl) {
  if (contentCache.has(fileUrl)) {
    return contentCache.get(fileUrl);
  }

  const content = fs.readFileSync(fileUrl, { encoding: 'utf-8' });
  const cacheObj = { fileUrl, content, dirty: false };
  contentCache.set(fileUrl, cacheObj);
  return cacheObj;
}

/**
 * set content with cache
 * @param {String} fileUrl
 * @param {String} content
 */
function setContent(fileUrl, content) {
  const contentResult = getContent(fileUrl);
  if (contentResult.content === content) {
    return;
  }

  contentResult.content = content;
  if (!contentResult.dirty) {
    contentResult.dirty = true;
    dirtyContentList.push(contentResult);
  }
}

// flush set content
function flushSetContent() {
  dirtyContentList.forEach(item => {
    fs.writeFileSync(item.fileUrl, item.content);
    item.dirty = false;
  });
  dirtyContentList.length = 0;
}

/**
 * @param {Object} options
 * @param {ReportResult['type']} options.type
 * @param {ReportResult['exit']} [options.exit]
 * @param {(p: ReportResult) => ReportResult['msg']} options.msgFn
 * @returns {ReportResult}
 */
function createReportResult({ type, exit, msgFn }) {
  return {
    type,
    list: [],
    exit,
    get msg() { return msgFn(this); },
  };
}

/**
 * check markdown
 * @param {CheckOption} options
 */
exports.check = async options => {
  if (options.preset && exports.presetConfig[options.preset]) {
    options = Object.assign({}, exports.presetConfig.default, exports.presetConfig[options.preset], options);
  } else {
    options = Object.assign({}, exports.presetConfig.default, options);
  }

  const { cwd, defaultIndex, root, fix, pattern } = options;
  assert(Array.isArray(root), 'options.root must be array');

  const files = await glob(pattern, { cwd });
  const result = {
    warning: createReportResult({
      msgFn(r) { return `${r.list.length} warning was found`; },
      type: 'warn',
    }),
    deadlink: createReportResult({
      msgFn(r) { return `${r.list.length} dead links was found`; },
      type: 'error',
      exit: true,
    }),
  };

  // each files
  files.forEach(file => {
    const fileUrl = path.resolve(cwd, file);
    const dirname = path.dirname(fileUrl);
    let { content } = getContent(fileUrl);
    let matches;
    let line = 1;
    let newContent = '';
    let lineIndex = 0;
    let scanIndex = 0;
    let collectContent = '';

    while ((matches = content.match(matchAnchorRE))) {
      const char = matches[0];
      const matchUrl = (matches[2] || matches[3] || '').trim();
      const isVariable = !!matches[2];
      const beforeContent = content.substring(0, matches.index);
      let newChar = char;
      collectContent += beforeContent + char;

      if (char === '\n' || char === '\r\n') {
        // new line
        line++;
        lineIndex = scanIndex + matches.index + char.length;
      } else {
        const col = collectContent.length - char.length - lineIndex + 1;
        const baseReportObj = { matchUrl, fullText: char, fileUrl, line, col };
        const urlObj = url.parse(matchUrl);
        if (urlObj.protocol) {
          // do nothing with remote url
        } else if (!matchUrl) {
          // empty url
          result.deadlink.list.push({ ...baseReportObj, errMsg: 'Url link is empty' });
        } else {
          // only handle local url
          const pathname = urlObj.pathname || '';
          let ext = path.extname(pathname);
          let matchAbUrl;
          let fileExist = null;

          if (pathname) {
            if (pathname.charAt(0) === '/') {
              // find exist file
              matchAbUrl = root.map(r => path.join(cwd, r, pathname.substring(1)))
                .find(f => fs.existsSync(f));
              fileExist = !!matchAbUrl;
            } else {
              matchAbUrl = path.resolve(dirname, pathname);
            }
          } else {
            matchAbUrl = fileUrl;
            ext = path.extname(matchAbUrl);
          }

          if (ext === '.html') {
            // convert html to md
            matchAbUrl = `${matchAbUrl.substring(0, matchAbUrl.length - 4)}md`;

            if (fix) {
              // replace .html to .md
              urlObj.pathname = `${urlObj.pathname.substring(0, urlObj.pathname.length - 4)}md`;
            } else {
              result.warning.list.push({ ...baseReportObj, errMsg: 'Should use .md instead of .html' });
            }
          } else if (!ext) {
            if (pathname.endsWith('/')) {
              // directory
              matchAbUrl = defaultIndex.map(index => `${matchAbUrl}/${index}`).find(f => fs.existsSync(f));
              fileExist = !!matchAbUrl;
            } else {
              matchAbUrl = `${matchAbUrl}.md`;
            }
          }

          if (fileExist === null) {
            fileExist = fs.existsSync(matchAbUrl);
          }

          if (!matchAbUrl || !fileExist) {
            // file is not found
            result.deadlink.list.push({ ...baseReportObj, errMsg: 'File is not found' });
          } else if (urlObj.hash && !hasHeading(matchAbUrl, decodeURIComponent(urlObj.hash.substring(1)))) {
            // hash is not found
            result.deadlink.list.push({ ...baseReportObj, errMsg: 'Hash is not found' });
          }

          if (fix) {
            const newUrl = url.format(urlObj);
            if (newUrl !== matchUrl) {
              newChar = `${matches[1]}${isVariable ? `: ${newUrl}` : `(${newUrl})`}`;
            }
          }
        }
      }

      scanIndex += matches.index + char.length;
      content = content.substring(matches.index + char.length);
      newContent += beforeContent + newChar;
    }

    newContent += content;
    if (fix) setContent(fileUrl, newContent);
  });

  flushSetContent();
  return result;
};

/**
 * check and throw
 * @param {CheckOption} options
 */
exports.checkAndThrow = async options => {
  console.info('Checking markdown...');
  const result = await exports.check(options);

  let hasErrorMsg = false; // whether has error msg
  let shouldExit = false; // whether should exit
  Object.keys(result).forEach(k => {
    const item = result[k];
    if (!item.list.length) {
      return;
    }

    hasErrorMsg = true;
    console[item.type](convertErrMsg(item));
    if (item.exit) shouldExit = true;
  });

  if (!hasErrorMsg) {
    console.info('Checking passed');
  }

  if (shouldExit) {
    process.exit(1);
  }
};

function convertErrMsg(obj) {
  return `\n${obj.msg}\n\n` +
    obj.list
      .map(item => `  ${chalk.red(item.errMsg)}: ${item.fullText} ${chalk.gray(`(${item.fileUrl}:${item.line}:${item.col})`)}`)
      .join('\n') +
    '\n';
}
