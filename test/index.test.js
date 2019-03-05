const path = require('path');
const { check } = require('../');
const assert = require('assert');

describe('test/index.test.js', () => {
  it('should works without error', async () => {
    const result = await check({ cwd: path.resolve(__dirname, './fixtures/docs1') });
    assert(result.deadlink.list.length === 3);
    assert(result.warning.list.length === 1);
    assert(result.deadlink.list[0].fullText.includes('[test1]'));
    assert(result.deadlink.list[1].fullText.includes('[test8]'));
    assert(result.deadlink.list[2].fullText.includes('[test9]'));
    assert(result.warning.list[0].fullText.includes('[test6]'));
  });
});
