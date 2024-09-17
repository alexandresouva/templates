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
import { IGenericImport } from './interfaces';
import { getSourceFile } from './util';

/**
 * Imports essenciais que serão usados em todos os templates.
 */
export const ESSENTIALS_IMPORTS: IGenericImport[] = [];

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
        `Não foi possível gerar o template. O arquivo ${filePath} não existe.`
      );
    }

    const fileContent = tree.read(filePath);
    if (fileContent === null) {
      throw new SchematicsException(
        `Não foi possível gerar o template. Ocorreu um erro ao ler o arquivo ${filePath}.`
      );
    }

    const contentString = fileContent.toString();

    // Interrompe o fluxo se o conteúdo HTML já estiver no arquivo
    if (contentString.includes(content)) {
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
 * Adiciona importações ao app.module.ts a partir de um array de IImport.
 *
 * @param appModuleImports - Array de objetos IImport com as informações de importação.
 * @returns Rule que aplica as mudanças no arquivo app.module.ts do projeto.
 */
export function addImportsToAppModule(
  appModuleImports: IGenericImport[]
): Rule {
  const targetAppModulePath = 'src/app/app.module.ts';

  return (tree: Tree, _context: SchematicContext) => {
    if (!tree.exists(targetAppModulePath)) {
      throw new SchematicsException(
        `Não foi possível adicionar as importações. O arquivo "app.module.ts" não existe em ${targetAppModulePath}`
      );
    }

    const sourceFile = getSourceFile(targetAppModulePath, tree);

    // Obtem os imports que faltam no app.module.ts
    const missingImports = getMissingImports(
      sourceFile,
      targetAppModulePath,
      appModuleImports
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

function getMissingImports(
  sourceFile: ts.SourceFile,
  modulePath: string,
  importsToProcess: IGenericImport[]
): Change[] {
  // Mapeia os tipos de arquivos para suas respectivas funções de tratamento
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
