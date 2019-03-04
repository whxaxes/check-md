#! /usr/bin/env node

const { Command } = require('commander');
const { checkAndThrow, presetConfig } = require('./');
const packInfo = require('./package.json');
const program = new Command()
  .version(packInfo.version, '-v, --version')
  .usage('[options]')
  .option('-f, --fix', 'Check and try to fix')
  .option('-c, --cwd [path]', 'Working directory of check-md, default to process.cwd()')
  .option('-r, --root [path]', `Checking url root, default to ${presetConfig.default.root.join(',')}`)
  .option('-p, --preset [name]', `Preset config(eg ${Object.keys(presetConfig).join(', ')})`)
  .option('-P, --pattern [pattern]', `Glob patterns, default to ${presetConfig.default.pattern}`)
  .option('--default-index [index]', `Default index in directory, default to ${presetConfig.default.defaultIndex.join(',')}`);

program.parse(process.argv);

const options = {
  fix: !!program.fix,
  cwd: program.cwd,
  preset: program.preset,
  pattern: program.pattern ? program.pattern.split(',') : undefined,
  defaultIndex: program.defaultIndex ? program.defaultIndex.split(',') : undefined,
};

Object.keys(options).forEach(k => {
  if (options[k] === undefined) delete options[k];
});

checkAndThrow(options);
