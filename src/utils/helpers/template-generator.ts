import {
  chain,
  noop,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import { RunSchematicTask } from '@angular-devkit/schematics/tasks';
import { buildComponent } from '@angular/cdk/schematics';

import { IGenericImport, IRouteImport } from '../interfaces/imports.interface';
import { getTreeState, hasTreeChanges } from './tree-helper';
import { DLS_MIN_VERSION, LOG_PHASES } from '../contants';
import { addImportsToAppModule } from './imports-helper';
import { addHTMLToAppComponent } from './html-helper';
import { addRoutesAndImportsToRoutingModule } from './route-helper';
import { INPMRunParams } from '../interfaces/npm-run.interface';
import {
  getDependencyFromPackageJSON,
  getPrefixFromAngularJson,
} from './utils';

import inquirer from 'inquirer';
const semver = require('semver');

/**
 * Regra de geração de template que valida a versão do DLS e, se necessário, solicita confirmação do usuário para prosseguir com a geração, caso a versão esteja abaixo da mínima recomendada.
 *
 * @param {any} options - SchemaOptions para personalizar o template, varia de acordo para o template.
 * @param {string} appComponentHTML - Conteúdo HTML a ser adicionado ao `app.component.html`.
 * @param {IGenericImport[]} imports - Lista de imports a serem adicionados ao módulo.
 * @param {IRouteImport[]} routes - Lista de rotas a serem adicionadas ao módulo de roteamento.
 *
 * @returns {Rule} - Regra para aplicar as mudanças no projeto de destino.
 */
export function getTemplateRule(
  options: any,
  appComponentHTML: string,
  imports: IGenericImport[],
  routes: IRouteImport[]
): Rule {
  return async (tree: Tree, context: SchematicContext): Promise<Rule> => {
    const dlsCurrentVersion = getDependencyFromPackageJSON(
      tree,
      '@angular/core'
    );

    // Se a versão do dls for inferior à versão mínima, exige uma confirmação antes de gerar o template
    if (!semver.gte(dlsCurrentVersion, DLS_MIN_VERSION)) {
      const answers = await inquirer.prompt([
        {
          name: 'dlsVersion',
          message: `Você está usando uma versão da biblioteca "dls-angular" anterior à versão ${DLS_MIN_VERSION}, que foi a base para a construção deste template. Isto pode gerar resultados inesperados. Deseja continuar?`,
          type: 'confirm',
        },
      ]);

      if (!answers.dlsVersion) {
        context.logger.info(`Ok... cancelando a geração do template!`);
        return noop();
      }
    }

    // Continua o fluxo normal se a versão for compatível
    return chain([
      createTemplateRule(options, appComponentHTML, imports, routes),
    ]);
  };
}

/**
 * Cria uma regra de template aplicando várias operações no projeto.
 *
 * @param {any} options - SchemaOptions para personalizar o template, varia de acordo para o template.
 * @param {string} appComponentHTML - Conteúdo HTML a ser adicionado ao `app.component.html`.
 * @param {IGenericImport[]} imports - Lista de imports a serem adicionados ao módulo.
 * @param {IRouteImport[]} routes - Lista de rotas a serem adicionadas ao módulo de roteamento.
 *
 * @returns {Rule} - Regra para aplicar as mudanças no projeto.
 */
export function createTemplateRule(
  options: any,
  appComponentHTML: string,
  imports: IGenericImport[],
  routes: IRouteImport[]
): Rule {
  return (tree: Tree, context: SchematicContext) => {
    // Obtém o estado da árvore antes das mudanças
    const originalState = getTreeState(tree);

    // Obtém a sigla pelo prefixo e atribui a propriedade name
    options.name = getPrefixFromAngularJson(tree);

    // Exibe a mensagem de inicialização `GAW TEMPLATES`.
    context.logger.info(LOG_PHASES.start);

    return chain([
      // Prepara as mudanças na árvore de arquivos
      buildComponent({ ...options, skipImport: true }),
      addImportsToAppModule(imports),
      addHTMLToAppComponent(appComponentHTML),
      () => addRoutesAndImportsToRoutingModule(routes),

      // Verifica se houve mudanças e controla o fluxo de execução
      (tree: Tree, context: SchematicContext) => {
        const currentTreeState = getTreeState(tree);

        if (hasTreeChanges(originalState, currentTreeState)) {
          // Exibe a mensagem de atualização do projeto
          context.logger.info(LOG_PHASES.updating);

          // Executa o Schematic de Lint
          const lintParams: INPMRunParams = {
            script: 'lint:fix',
            loggerBefore: LOG_PHASES.linting,
            loggerAfter: LOG_PHASES.success,
          };
          context.addTask(new RunSchematicTask('npmRun', lintParams));
        } else {
          // Exibe a mensagem de que o projeto não foi atualizado
          context.logger.info(LOG_PHASES.noChanges);
        }
      },
    ])(tree, context);
  };
}
