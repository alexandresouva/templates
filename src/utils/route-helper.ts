import {
  Tree,
  SchematicContext,
  SchematicsException,
  Rule,
} from '@angular-devkit/schematics';
import {
  addRouteDeclarationToModule,
  getRouterModuleDeclaration,
} from '@angular/cdk/schematics';

import { Change, InsertChange } from '@schematics/angular/utility/change';
import ts = require('typescript');
import { IImport, RouteConfig } from './interfaces';
import { getSourceFile } from './util';

/**
 * Adiciona um array de rotas ao módulo de roteamento.
 *
 * @param tree - Árvore de arquivos do projeto.
 * @param context - Contexto do schematic.
 * @param routesToBeAdded - Array de rotas a serem adicionadas.
 */
export function addRoutesToRoutingModule(
  tree: Tree,
  context: SchematicContext,
  routesToBeAdded: RouteConfig[]
): void {
  const modulePath = 'src/app/app-routing.module.ts';

  if (!tree.exists(modulePath)) {
    throw new SchematicsException(
      `O módulo de roteamento em ${modulePath} não foi encontrado.`
    );
  }

  const sourceFile = getSourceFile(modulePath, tree);
  const routerModuleDeclaration = getRouterModuleDeclaration(sourceFile);

  if (!routerModuleDeclaration) {
    throw new SchematicsException(
      `O módulo de roteamento não foi encontrado em ${modulePath}.`
    );
  }

  const recorder = tree.beginUpdate(modulePath);

  routesToBeAdded.forEach(({ path, component }, index) => {
    const isLastRoute = index === routesToBeAdded.length - 1;

    const routeLiteral = isLastRoute
      ? `{ path: '${path}', component: ${component} } \n`
      : `{ path: '${path}', component: ${component} },`;
    const routeChange = addRouteDeclarationToModule(
      sourceFile,
      modulePath,
      `\n ${routeLiteral}`
    );

    if (routeChange instanceof InsertChange) {
      recorder.insertLeft(routeChange.pos, routeChange.toAdd);
    }

    context.logger.info(
      `Rota ${path} -> ${component} adicionada em ${modulePath}`
    );
  });

  tree.commitUpdate(recorder);
}

export function addImportsToRoutingModule(
  routingModulePath: string,
  routes: RouteConfig[]
): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    if (!tree.exists(routingModulePath)) {
      throw new SchematicsException(
        `Não foi possível adicionar as importações. O arquivo ${routingModulePath} não existe.`
      );
    }

    const sourceFile = getSourceFile(routingModulePath, tree);
    const importsToAdd = routes.map((route) => ({
      classifiedName: route.component,
      importPath: route.importPath,
    }));
    const changes = getImportChanges(
      sourceFile,
      routingModulePath,
      importsToAdd
    );

    const recorder = tree.beginUpdate(routingModulePath);
    changes.forEach((change) => {
      if (change instanceof InsertChange) {
        recorder.insertLeft(change.pos, change.toAdd);
      }
    });
    tree.commitUpdate(recorder);
    return tree;
  };
}

/**
 * Obtém as mudanças necessárias para adicionar importações ao arquivo de roteamento.
 *
 * @param sourceFile - O SourceFile do app-routing.module.ts do projeto.
 * @param modulePath - Caminho para o app-routing.module.ts.
 * @param importsToProcess - Lista de importações a serem adicionadas.
 * @returns Um array de mudanças necessárias para adicionar as importações.
 */
function getImportChanges(
  sourceFile: ts.SourceFile,
  modulePath: string,
  importsToProcess: IImport[]
): Change[] {
  const changes: Change[] = [];

  importsToProcess.forEach(({ classifiedName, importPath }) => {
    const importStatement = `import { ${classifiedName} } from '${importPath}';\n`;

    // Encontrar a posição de inserção do import statement
    const importIndex = findImportInsertionIndex(sourceFile);

    changes.push(new InsertChange(modulePath, importIndex, importStatement));
  });

  return changes;
}

/**
 * Encontra a posição onde o import statement deve ser inserido no arquivo.
 *
 * @param sourceFile - O SourceFile do arquivo de roteamento.
 * @returns A posição para a inserção do import statement.
 */
function findImportInsertionIndex(sourceFile: ts.SourceFile): number {
  let importIndex = 0;
  const importStatements = sourceFile.statements.filter((statement) =>
    ts.isImportDeclaration(statement)
  );

  if (importStatements.length > 0) {
    const lastImport = importStatements[importStatements.length - 1];
    importIndex = lastImport.getEnd();
  }

  return importIndex;
}
