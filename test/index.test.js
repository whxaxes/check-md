const path = require('path');
const checkMd = require('../');
const fs = require('fs');
const mm = require('egg-mock');
const assert = require('assert');

describe('test/index.test.js', () => {
  afterEach(mm.restore);

  it('should works without error', async () => {
    const result = await checkMd.check({ cwd: path.resolve(__dirname, './fixtures/docs1') });
    assert(result.deadlink.list.length === 9);
    assert(result.warning.list.length === 1);
    assert(result.deadlink.list[0].fullText.includes('[test1]'));
    assert(result.deadlink.list[0].line === 5);
    assert(result.deadlink.list[0].col === 5);
    assert(result.deadlink.list[1].fullText.includes('[test8]'));
    assert(result.deadlink.list[1].line === 19);
    assert(result.deadlink.list[1].col === 1);
    assert(result.deadlink.list[2].fullText.includes('[test9]'));
    assert(result.deadlink.list[2].line === 21);
    assert(result.deadlink.list[2].col === 13);
    assert(result.deadlink.list[3].fullText.includes('[test12]'));
    assert(result.deadlink.list[4].fullText.includes('[test16]'));
    assert(result.deadlink.list[3].errMsg.includes('slugify'));
    assert(result.deadlink.list[5].fullText.includes('[^test17]'));
    assert(result.deadlink.list[5].line === 43);
    assert(result.deadlink.list[5].col === 1);
    assert(result.deadlink.list[6].fullText.includes('![test19]'));
    assert(result.warning.list[0].fullText.includes('[test6]'));

    const resultWithIgnoreFootnotes = await checkMd.check({
      cwd: path.resolve(__dirname, './fixtures/docs1'),
      ignoreFootnotes: true,
    });
    assert(resultWithIgnoreFootnotes.deadlink.list.length === 8);
  });

  it('should fix without error', async () => {
    const setContents = {};
    mm(fs, 'writeFileSync', (fileUrl, content) => {
      setContents[fileUrl] = content;
    });
    await checkMd.check({ cwd: path.resolve(__dirname, './fixtures/docs1'), fix: true });
    const fileList = Object.keys(setContents);
    assert(fileList.length === 1);
    assert(setContents[fileList[0]].includes('[test6](./other.md#ctx-get-name)'));
    assert(setContents[fileList[0]].includes('[test12](./other.md#ctx-get-name)'));
  });
});
