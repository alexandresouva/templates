import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

const spawn = require('cross-spawn');

export function npmRun(options: any): Rule {
  return function (tree: Tree, _context: SchematicContext) {
    spawn.sync('npm', ['run', options.script], { stdio: 'inherit' });
    return tree;
  };
}
