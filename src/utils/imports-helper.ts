import {
  Tree,
  SchematicContext,
  Rule,
  SchematicsException,
} from '@angular-devkit/schematics';
import {
  addDeclarationToModule,
  addImportToModule,
  addProviderToModule,
} from '@angular/cdk/schematics';

import { Change, InsertChange } from '@schematics/angular/utility/change';
import ts = require('typescript');
import { IImport } from './interfaces';
import { getSourceFile } from './util';

/**
 * Adiciona um bloco de HTML ao app.component.html caso o mesmo não esteja presente.
 *
 * @param content - Conteúdo HTML a ser adicionado.
 * @returns A regra para ser aplicada no tree do schematic.
 */
export function addHTMLToAppComponent(content: string): Rule {
  return (tree: Tree) => {
    const filePath = 'src/app/app.component.html';

    if (!tree.exists(filePath)) {
      throw new SchematicsException(
        `Não foi possível adicionar o template. O arquivo ${filePath} não existe.`
      );
    }

    const fileContent = tree.read(filePath);
    if (fileContent === null) {
      throw new SchematicsException(
        `Não foi possível ler o arquivo ${filePath}.`
      );
    }

    const contentString = fileContent.toString();

    // Verifica se o conteúdo já está presente
    if (contentString.includes(content)) {
      // Exemplo de como exibir uma mensagem no console
      // context.logger.info(`O conteúdo já está presente no ${filePath}.`);
      return tree;
    }

    const recorder = tree.beginUpdate(filePath);
    const contentToAdd = `\n<!-- Conteúdo adicionado via templates -->${content}\n`;

    // Adiciona o conteúdo ao final do arquivo
    const position = contentString.length;
    recorder.insertLeft(position, contentToAdd);

    tree.commitUpdate(recorder);
    return tree;
  };
}

/**
 * Adiciona importações ao `app.module.ts` do projeto diretamente de uma string.
 *
 * @returns Rule que aplica as mudanças no arquivo `app.module.ts` do projeto.
 */
export function addImportsToAppModule(appModuleImports: string): Rule {
  const targetAppModulePath = 'src/app/app.module.ts';

  return (tree: Tree, _context: SchematicContext) => {
    if (!tree.exists(targetAppModulePath)) {
      throw new SchematicsException(
        `O arquivo app.module.ts não existe em ${targetAppModulePath}`
      );
    }

    const sourceFile = getSourceFile(targetAppModulePath, tree);
    const importsToProcess = getImportsFromString(appModuleImports);

    const missingImports = getMissingImports(
      sourceFile,
      targetAppModulePath,
      importsToProcess
    );

    const recorder = tree.beginUpdate(targetAppModulePath);
    missingImports.forEach((importItem) => {
      if (importItem instanceof InsertChange) {
        recorder.insertLeft(importItem.pos, importItem.toAdd);
      }
    });
    tree.commitUpdate(recorder);
    return tree;
  };
}

/**
 * Extrai importações da string fornecida e remove duplicatas.
 *
 * @param importsString - String que contém os imports.
 * @returns Um array de importações únicas.
 */
function getImportsFromString(importsString: string): IImport[] {
  const sourceFile = ts.createSourceFile(
    'appModuleImports.ts',
    importsString,
    ts.ScriptTarget.Latest,
    true
  );

  const importsMap = new Map<string, IImport>();

  sourceFile.statements.forEach((node) => {
    if (ts.isImportDeclaration(node)) {
      const importClause = node.importClause;
      const moduleSpecifier = node.moduleSpecifier
        .getText()
        .replace(/['"]/g, '');

      // Interrompe o loop se não houver importClause
      if (!importClause) {
        return;
      }

      if (importClause.name) {
        importsMap.set(moduleSpecifier, {
          classifiedName: importClause.name.text,
          importPath: moduleSpecifier,
        });
      } else if (
        importClause.namedBindings &&
        ts.isNamedImports(importClause.namedBindings)
      ) {
        importClause.namedBindings.elements.forEach((element) => {
          importsMap.set(moduleSpecifier, {
            classifiedName: element.name.text,
            importPath: moduleSpecifier,
          });
        });
      }
    }
  });

  // Converte o mapa em um array
  return Array.from(importsMap.values());
}

/**
 * Obtém as mudanças necessárias para adicionar importações ao `app.module.ts`.
 *
 * @param sourceFile - O SourceFile do `app.module.ts` do projeto de destino.
 * @param modulePath - Caminho para o `app.module.ts`.
 * @param importsToProcess - Lista de importações extraídas do arquivo de template.
 * @returns Um array de mudanças necessárias para adicionar as importações.
 */
function getMissingImports(
  sourceFile: ts.SourceFile,
  modulePath: string,
  importsToProcess: IImport[]
): Change[] {
  // Mapeia os tipos de arquivos para suas respectivas funções de manipulação
  const handlers: {
    [key: string]: (
      sourceFile: ts.SourceFile,
      modulePath: string,
      classifiedName: string,
      importPath: string
    ) => Change[];
  } = {
    Component: addDeclarationToModule,
    Directive: addDeclarationToModule,
    Pipe: addDeclarationToModule,
    Service: addProviderToModule,
    Guard: addProviderToModule,
    Interceptor: addProviderToModule,
    Resolver: addProviderToModule,
    Module: (sourceFile, modulePath, classifiedName, importPath) => {
      const MODULES_REQUIRING_FOR_ROOT = ['My2Module'];

      // Verifica se o módulo precisa do forRoot()
      const moduleName = MODULES_REQUIRING_FOR_ROOT.includes(classifiedName)
        ? `${classifiedName}.forRoot()`
        : classifiedName;
      return addImportToModule(sourceFile, modulePath, moduleName, importPath);
    },
  };

  return importsToProcess
    .filter(({ classifiedName }) => classifiedName !== 'NgModule')
    .flatMap(({ classifiedName, importPath }) => {
      const handler = Object.keys(handlers).find((key) =>
        classifiedName.endsWith(key)
      );
      return handler
        ? handlers[handler](sourceFile, modulePath, classifiedName, importPath)
        : [];
    });
}
