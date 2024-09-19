import {
  chain,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import { buildComponent } from '@angular/cdk/schematics';
import { RunSchematicTask } from '@angular-devkit/schematics/tasks';

import { SchemaOptions, SchemaProps } from './schema';
import { appComponentHTML, conditionalImports, routes } from './template-data';
import { IGenericImport } from '../../utils/interfaces';
import {
  addHTMLToAppComponent,
  addImportsToAppModule,
  ESSENTIALS_IMPORTS,
} from '../../utils/imports-helper';
import { getPrefixFromAngularJson } from '../../utils/util';
import { addRoutesAndImportsToRoutingModule } from '../../utils/route-helper';

function getImportsBasedOnSchemaProperties(
  props: SchemaProps
): IGenericImport[] {
  const { paginationType } = props;
  let imports = [...ESSENTIALS_IMPORTS];
  if (paginationType && conditionalImports[paginationType]) {
    imports = imports.concat(conditionalImports[paginationType]);
  }
  return imports;
}

// Capture apenas arquivos da pasta 'src/app'
function captureTreeState(
  tree: Tree,
  rootPath: string = '/src/app'
): Map<string, string> {
  const fileMap = new Map<string, string>();
  tree.getDir(rootPath).visit((path) => {
    const content = tree.read(path);
    if (content) {
      fileMap.set(path, content.toString());
    }
  });
  return fileMap;
}

// Retorna se houve ou não mudanças
function hasChanges(
  originalState: Map<string, string>,
  currentState: Map<string, string>
): boolean {
  if (originalState.size !== currentState.size) {
    return true;
  }

  for (const [path, originalContent] of originalState) {
    const currentContent = currentState.get(path);
    if (originalContent !== currentContent) {
      return true;
    }
  }

  return false;
}

export function template1(options: SchemaOptions): Rule {
  const imports = getImportsBasedOnSchemaProperties(options);

  return (tree: Tree, context: SchematicContext) => {
    const originalState = captureTreeState(tree);

    const processedOptions = {
      ...options,
      name: getPrefixFromAngularJson(tree),
    };

    return chain([
      () => {
        context.logger.info(`
          ____    ___        __  _____ _____ __  __ ____  _        _  _____ _____ ____  
         / ___|  / \\ \\      / / |_   _| ____|  \\/  |  _ \\| |      / \\|_   _| ____/ ___| 
        | |  _  / _ \\ \\ /\\ / /    | | |  _| | |\\/| | |_) | |     / _ \\ | | |  _| \\___ \\ 
        | |_| |/ ___ \\ V  V /     | | | |___| |  | |  __/| |___ / ___ \\| | | |___ ___) |
         \\____/_/   \\_\\_/\\_/      |_| |_____|_|  |_|_|   |_____/_/   \\_\\_| |_____|____/  
       `);
      },
      buildComponent({ ...processedOptions, skipImport: true }),
      addImportsToAppModule(imports),
      addHTMLToAppComponent(appComponentHTML),
      () => addRoutesAndImportsToRoutingModule(routes),
      (tree: Tree, context: SchematicContext) => {
        const currentState = captureTreeState(tree);
        if (hasChanges(originalState, currentState)) {
          context.logger.info('Changes were detected.');
          // Executa o comando npm run lint:fix ao detectar mudanças
          context.addTask(
            new RunSchematicTask('npmRun', { script: 'lint:fix' })
          );
        } else {
          context.logger.info(
            'O seu projeto está atualizado! Nenhuma mudança é necessária.'
          );
          // Se não houver mudanças, interrompe a cadeia aqui
          return;
        }
      },
    ])(tree, context);
  };
}
