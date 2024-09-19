import {
  chain,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import { IGenericImport, IRouteImport } from '../interfaces/imports.interface';
import { getTreeState, hasTreeChanges } from './tree-helper';
import { LOG_PHASES } from '../contants';
import { buildComponent } from '@angular/cdk/schematics';
import { addImportsToAppModule } from './imports-helper';
import { addHTMLToAppComponent } from './html-helper';
import { addRoutesAndImportsToRoutingModule } from './route-helper';
import { INPMRunParams } from '../interfaces/npm-run.interface';
import { RunSchematicTask } from '@angular-devkit/schematics/tasks';
import { getPrefixFromAngularJson } from './utils';

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
          // Se não houver mudanças, exibe a mensagem e interompe o fluxo
          context.logger.info(LOG_PHASES.noChanges);
          return;
        }
      },
    ])(tree, context);
  };
}
