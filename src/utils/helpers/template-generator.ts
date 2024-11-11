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
import { LOG_PHASES, REQUIRED_DEPENDENCIES } from '../contants';
import { addImportsToAppModule } from './imports-helper';
import { addHTMLToAppComponent } from './html-helper';
import { addRoutesAndImportsToRoutingModule } from './route-helper';
import { INPMRunParams } from '../interfaces/npm-run.interface';
import {
  getAllProjectDependencies,
  getPrefixFromAngularJson,
  hasGitChanges,
} from './utils';

// import inquirer from 'inquirer';
const semver = require('semver');

/**
 * Controla a geração de template a partir da validação das versões de dependências do projeto.
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
  return async (_tree: Tree, context: SchematicContext): Promise<Rule> => {
    const dependencies = getAllProjectDependencies();
    const missingRequiredDependencies: string[] = [];

    // Cancela a geração do template se não houver dependências (erro npm list)
    if (!dependencies) {
      return noop();
    }

    // Monta o array de dependências mínimas ausentes, caso exista
    for (const [name] of Object.entries(REQUIRED_DEPENDENCIES)) {
      if (!dependencies[name]) {
        missingRequiredDependencies.push(name);
      }
    }

    // Exibe uma mensagem de erro caso haja dependências requeridas
    if (missingRequiredDependencies.length > 0) {
      const dependenciesText = getMissingDependenciesText(
        missingRequiredDependencies
      );
      context.logger.error(dependenciesText);
      context.logger.info(
        `Sem ela(s), não é possível garantir a correta estilização e funcionamento do template gerado. Para resolver o problema, você pode: \n\n 1) Gerar o projeto utilizando o gaw-cli (https://example.com.br). \n 2) Atualizar o projeto atual executando o seguinte comando:\n\nnpm install ${missingRequiredDependencies.join(
          ' '
        )}\n\nEm seguida, tente novamente.`
      );
      return noop();
    }

    // Verifica se cada dependência requerida instalada está na versão esperada
    for (const [name, expectedVersion] of Object.entries(
      REQUIRED_DEPENDENCIES
    )) {
      const currentVersion = dependencies[name];
      const isValidVersion = semver.satisfies(currentVersion, expectedVersion);

      if (!isValidVersion) {
        context.logger.error('\nDependência desatualizada!\n');
        context.logger.info(
          `A versão da dependência ${name} instalada (${currentVersion}) não satisfaz a versão esperada para o template (${expectedVersion}). Por favor, instale uma versão compatível.\n`
        );
        return noop();
      }
    }

    // Se a versão do dls for inferior à versão mínima, exige uma confirmação antes de gerar o template
    // const dlsMinVersion = REQUIRED_DEPENDENCIES['dls-angular'];
    // if (!semver.gte(dlsCurrentVersion, dlsMinVersion)) {
    //   const answers = await inquirer.prompt([
    //     {
    //       name: 'dlsVersion',
    //       message: `Você está usando uma versão da biblioteca "dls-angular" anterior à versão ${dlsMinVersion}, que foi a base para a construção deste template. Isto pode gerar resultados inesperados. Deseja continuar?`,
    //       type: 'confirm',
    //     },
    //   ]);

    //   if (!answers.dlsVersion) {
    //     context.logger.info(`Ok... cancelando a geração do template!`);
    //     return noop();
    //   }
    // }

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

    // Verifica se há alterações no Git
    if (hasGitChanges()) {
      context.logger.error('\nExistem arquivos modificados ou em staging.\n');
      const orientations: string[] = [
        'Por favor, faca o commit ou guarde as alterações antes de executar este comando. Sugestões:',
        '\n\n  \x1b[32mgit stash\x1b[0m --> guardar alterações em staging.',
        '\n  \x1b[32mgit add && git commit\x1b[0m --> faz o commit das mudanças.',
        '\n\nEm seguida, tente gerar o template novamente.',
      ];
      context.logger.info(orientations.join(''));
      return tree;
    }

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

/**
 * Formata uma mensagem sobre as dependências ausentes em um projeto.
 *
 * @param {string[]} dependencies - Um array de nomes de dependências que estão faltando.
 *
 * @returns {string} Uma mensagem formatada indicando as dependências que estão faltando.
 */
function getMissingDependenciesText(dependencies: string[]): string {
  const baseMessage = `O projeto atual não possui`;
  if (dependencies.length === 1) {
    return `${baseMessage} a dependência: ${dependencies[0]}.`;
  } else {
    const lastDependency = dependencies.pop();
    return `${baseMessage} as dependências ${dependencies.join(
      ', '
    )} e ${lastDependency}.`;
  }
}
