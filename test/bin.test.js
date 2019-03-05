const path = require('path');
const coffee = require('coffee');

describe('test/bin.test.js', () => {
  const binPath = path.resolve(__dirname, '../bin.js');
  it('should works', async () => {
    await coffee.fork(binPath, [ '-c', path.resolve(__dirname, './fixtures/docs1') ])
      .expect('stderr', /Checking failed/)
      .expect('stderr', /\d+ dead links was found/)
      .expect('stderr', /\d+ warning was found/)
      .expect('code', 1)
      // .debug()
      .end();
  });

  it('should works with preset', async () => {
    await coffee.fork(binPath, [ '-p', 'vuepress' ], { cwd: path.resolve(__dirname, './fixtures/vuepress') })
      .expect('stderr', /Checking failed/)
      .expect('stderr', /vuepress\/docs\/readme\.md/)
      .notExpect('stderr', /vuepress\/other\.md/)
      .notExpect('stderr', /\!\[avatar\]\(\/5856440\.jpg\)/)
      .expect('code', 1)
      // .debug()
      .end();
  });
});
