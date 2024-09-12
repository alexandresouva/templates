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
import { findImportInsertionIndex, getSourceFile } from './util';

/**
 * Adiciona um array de rotas ao módulo de roteamento.
 *
 * @param tree - Árvore de arquivos do projeto.
 * @param context - Contexto do schematic.
 * @param routesToBeAdded - Array de rotas a serem adicionadas.
 */
export function addRoutesToRoutingModule(
  tree: Tree,
  routesToBeAdded: RouteConfig[]
): void {
  // Lanca um erro se o arquivo de roteamento não existir
  const routingModulePath = 'src/app/app-routing.module.ts';
  if (!tree.exists(routingModulePath)) {
    throw new SchematicsException(
      `O arquivo "app-routing.module.ts" não foi encontrado em ${routingModulePath}.`
    );
  }

  // Lança um erro se o módulo de roteamento não for encontrado
  const sourceFile = getSourceFile(routingModulePath, tree);
  const routerModuleDeclaration = getRouterModuleDeclaration(sourceFile);
  if (!routerModuleDeclaration) {
    throw new SchematicsException(
      `O módulo de roteamento (RouterModule) não foi encontrado em ${routingModulePath}.`
    );
  }

  // Obtem todas as rotas existentes no projeto de destino
  const existingRoutes =
    sourceFile.getFullText().match(/path: '([^']*)', component: (\w+)/g) || [];
  const isExistingRoutesEmpty = existingRoutes.length === 0;

  // Prepara a Tree para receber as mudanças
  const recorder = tree.beginUpdate(routingModulePath);

  routesToBeAdded.forEach(({ path, component }, index) => {
    const isRouteAlreadyPresent = existingRoutes.some((route) =>
      route.includes(`path: '${path}'`)
    );

    // Interrompe a importação se a rota já estiver presente
    if (isRouteAlreadyPresent) {
      return;
    }

    // Se o array de rotas existente estiver vazio, é preciso tratar a string de rota
    if (isExistingRoutesEmpty) {
      const isLastRoute = index === routesToBeAdded.length - 1;
      const route = isLastRoute
        ? `{ path: '${path}', component: ${component} } \n`
        : `{ path: '${path}', component: ${component} },`;
      const routeChange = addRouteDeclarationToModule(
        sourceFile,
        routingModulePath,
        `\n ${route}`
      );

      if (routeChange instanceof InsertChange) {
        recorder.insertLeft(routeChange.pos, routeChange.toAdd);
      }
    } else {
      // Se já estiver algum elemento, o Angular CDK faz o tratamento automaticamente
      const route = `{ path: '${path}', component: ${component} }`;

      const routeChange = addRouteDeclarationToModule(
        sourceFile,
        routingModulePath,
        route
      );

      if (routeChange instanceof InsertChange) {
        recorder.insertLeft(routeChange.pos, routeChange.toAdd);
      }
    }
  });

  // Efetua as mudanças no arquivo de roteamento
  tree.commitUpdate(recorder);
}

export function addImportsToRoutingModule(routes: RouteConfig[]): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    // Verifica se o arquivo de roteamento existe
    const routingModulePath = 'src/app/app-routing.module.ts';
    if (!tree.exists(routingModulePath)) {
      throw new SchematicsException(
        `Não foi possível adicionar as importações. O arquivo ${routingModulePath} não existe.`
      );
    }

    // Prepara os imports
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

    // Aplica as mudanças
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

    // Verifica se o import já existe
    const existingImport = sourceFile.statements.find(
      (statement) =>
        ts.isImportDeclaration(statement) &&
        statement.getText().includes(`from '${importPath}'`)
    );

    if (!existingImport) {
      // Encontra a posição de inserção do import statement
      const importIndex = findImportInsertionIndex(sourceFile);
      // Adiciona o import
      changes.push(new InsertChange(modulePath, importIndex, importStatement));
    }
  });

  return changes;
}
