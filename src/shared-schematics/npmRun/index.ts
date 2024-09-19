import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { INPMRunParams } from '../../utils/interfaces/npm-run.interface';

const spawn = require('cross-spawn');

/**
 * Executa um script NPM especificado e exibe mensagens de log antes e depois da execução, se fornecidas.
 *
 * @param {INPMRunParams} params - Os parâmetros para a execução do script NPM, incluindo o nome do script e mensagens de log opcionais.
 * @param {string} params.script - O nome do script NPM a ser executado.
 * @param {string} [params.loggerBefore] - Mensagem opcional a ser exibida antes da execução do script NPM.
 * @param {string} [params.loggerAfter] - Mensagem opcional a ser exibida após a execução do script NPM.
 *
 * @returns {Rule} - Retorna a Rule que executa o script NPM e exibe as mensagens de log fornecidas.
 */
export function npmRun(params: INPMRunParams): Rule {
  const { script, loggerBefore, loggerAfter } = params;

  return function (tree: Tree, context: SchematicContext) {
    if (loggerBefore) {
      context.logger.info(loggerBefore);
    }

    spawn.sync('npm', ['run', script], { stdio: 'inherit' });

    if (loggerAfter) {
      context.logger.info(loggerAfter);
    }
    return tree;
  };
}
