import {
  Tree,
  SchematicContext,
  SchematicsException,
  Rule,
} from '@angular-devkit/schematics';
import { addRouteDeclarationToModule } from '@angular/cdk/schematics';

import { Change, InsertChange } from '@schematics/angular/utility/change';
import ts = require('typescript');
import { IImport, IRouteConfig } from './interfaces';
import { findImportInsertionIndex, getSourceFile } from './util';

/**
 * Adiciona rotas e importações ao módulo de roteamento.
 *
 * @param routesToBeAdded - Array de rotas a serem adicionadas. Cada rota deve conter o caminho e o componente associado.
 * @returns Uma regra do schematic que adiciona as rotas e importações ao módulo de roteamento.
 */
export function addRoutesAndImportsToRoutingModule(
  routesToBeAdded: IRouteConfig[]
): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const routingModulePath = 'src/app/app-routing.module.ts';

    // Lança um erro caso o arquivo de módulo de roteamento não exista
    if (!tree.exists(routingModulePath)) {
      throw new SchematicsException(
        `Não foi possível adicionar as rotas do projeto. O arquivo "${routingModulePath}" não foi encontrado.`
      );
    }

    // Obtém o SourceFile (representação do arquivo) do módulo de roteamento
    const sourceFile = getSourceFile(routingModulePath, tree);

    // Obtém as rotas existentes no arquivo de módulo de roteamento
    const existingRoutes =
      sourceFile.getFullText().match(/path: '([^']*)', component: (\w+)/g) ||
      [];
    const isExistingRoutesEmpty = existingRoutes.length === 0;

    // Cria um recorder para aplicar as mudanças no arquivo
    const recorder = tree.beginUpdate(routingModulePath);

    // Adiciona as rotas ao módulo de roteamento
    routesToBeAdded.forEach(({ path, component }, index) => {
      const isRouteAlreadyPresent = existingRoutes.some((route) =>
        route.includes(`path: '${path}'`)
      );

      // Ignora a rota se já estiver presente
      if (isRouteAlreadyPresent) {
        return;
      }

      // Cria a string de rota a ser adicionada
      const route = `{ path: '${path}', component: ${component} }`;
      if (isExistingRoutesEmpty) {
        // Se o array estiver vazio, é necessário tratar a rota antes de adicioná-la
        const isLastRoute = index === routesToBeAdded.length - 1;
        const routeChange = addRouteDeclarationToModule(
          sourceFile,
          routingModulePath,
          `\n ${route}${isLastRoute ? ' \n' : ','}`
        );
        if (routeChange instanceof InsertChange) {
          recorder.insertLeft(routeChange.pos, routeChange.toAdd);
        }
      } else {
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

    // Filtra e remove as rotas duplicadas
    const importsToAdd = routesToBeAdded
      .map((route) => ({
        classifiedName: route.component,
        importPath: route.importPath,
      }))
      .filter(
        (value, index, self) =>
          index ===
          self.findIndex(
            (t) =>
              t.classifiedName === value.classifiedName &&
              t.importPath === value.importPath
          )
      );

    // Prepara os imports e as mudanças a serem adicionadas
    const importChanges = getImportChanges(
      sourceFile,
      routingModulePath,
      importsToAdd
    );

    // Aplica as mudanças
    importChanges.forEach((change) => {
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
 * @param importsToProcess - Lista de importações a serem adicionadas. Cada importação deve conter o nome classificado e o caminho do módulo.
 * @returns Um array de mudanças necessárias para adicionar as importações ao arquivo de roteamento.
 */
function getImportChanges(
  sourceFile: ts.SourceFile,
  modulePath: string,
  importsToProcess: IImport[]
): Change[] {
  const changes: Change[] = [];

  importsToProcess.forEach(({ classifiedName, importPath }) => {
    // Cria a string de importação
    const importStatement = `import { ${classifiedName} } from '${importPath}';\n`;

    // Verifica se a importação já existe no arquivo
    const existingImport = sourceFile.statements.find(
      (statement) =>
        ts.isImportDeclaration(statement) &&
        statement.getText().includes(`from '${importPath}'`)
    );

    if (!existingImport) {
      // Encontra a posição de inserção do import statement
      const importIndex = findImportInsertionIndex(sourceFile);
      // Adiciona a importação
      changes.push(new InsertChange(modulePath, importIndex, importStatement));
    }
  });

  return changes;
}
