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
import * as fs from 'fs';
import { IImport } from './interfaces';

/**
 * Adiciona importações do template para o `app.module.ts` do projeto.
 *
 * @param appModulePathInTemplate - Caminho para o arquivo `app.module.ts` do template.
 * @returns Rule que aplica as mudanças no arquivo `app.module.ts` do projeto.
 */
export function addImportsToAppModule(appModulePathInTemplate: string): Rule {
  const targetAppModulePath = 'src/app/app.module.ts';

  return (tree: Tree, _context: SchematicContext) => {
    // Caso o arquivo app.module.ts no projeto de destino não exista, lança um erro
    if (!tree.exists(targetAppModulePath)) {
      throw new SchematicsException(
        `Não foi possível adicionar as importações. O arquivo app.module não existe em ${targetAppModulePath}`
      );
    }

    // Lista de imports que serão adicionados no app.module.ts (destino)
    const missingImports = getMissingImports(
      getSourceFile(targetAppModulePath, tree),
      targetAppModulePath,
      getImportsFromAppModuleInTemplate(appModulePathInTemplate)
    );

    // Aplica as mudanças no app.module.ts do arquivo de destino
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
 * Obtém a lista de importações do arquivo de template do módulo.
 *
 * @param appModulePath - Caminho para o arquivo de template do módulo.
 * @returns Um array de importações extraídas do arquivo de template.
 * @throws SchematicsException se o arquivo de template não puder ser lido.
 */
function getImportsFromAppModuleInTemplate(appModulePath: string): IImport[] {
  if (fs.existsSync(appModulePath)) {
    const templateAppModuleSource = getSourceFile(appModulePath);
    const imports: IImport[] = [];

    templateAppModuleSource.statements.forEach((node) => {
      // Verifica se a declaração atual é uma declaração de importação
      if (ts.isImportDeclaration(node)) {
        const importClause = node.importClause; // Obtém a cláusula de importação (o que está sendo importado)
        const moduleSpecifier = node.moduleSpecifier
          .getText()
          .replace(/['"]/g, ''); // Obtém o caminho do módulo importado

        if (importClause) {
          if (importClause.name) {
            // Se a importação for do tipo default (ex: import x from 'module')
            imports.push({
              classifiedName: importClause.name.text,
              importPath: moduleSpecifier,
            });
          } else if (
            // Se a importação for do tipo nomeada (ex: import { x, y } from 'module')
            importClause.namedBindings &&
            ts.isNamedImports(importClause.namedBindings)
          ) {
            importClause.namedBindings.elements.forEach((element) => {
              // Adiciona cada elemento importado ao array de imports
              imports.push({
                classifiedName: element.name.text,
                importPath: moduleSpecifier,
              });
            });
          }
        }
      }
    });

    return imports;
  } else {
    throw new SchematicsException(
      `Não foi possível ler o arquivo app.module em ${appModulePath}.`
    );
  }
}

/**
 * Obtem o conteúdo de um arquivo TypeScript a partir de um caminho fornecido.
 *
 * @param path - Caminho para o arquivo TypeScript.
 * @param [tree] - (Opcional) Objeto Tree para ler o arquivo do projeto de destino. Se não fornecido,
 *                 tentará ler o arquivo diretamente do template.
 * @returns Um objeto `ts.SourceFile` representando o conteúdo do arquivo.
 * @throws SchematicsException se o conteúdo do arquivo não puder ser lido.
 */
function getSourceFile(path: string, tree?: Tree): ts.SourceFile {
  const fileContent = tree ? tree.read(path) : fs.readFileSync(path);

  if (!fileContent) {
    throw new SchematicsException(
      `Não foi possível ler o conteúdo de ${path}. Verifique se o caminho está correto e se o arquivo existe.`
    );
  }

  return ts.createSourceFile(
    path,
    fileContent.toString('utf-8'),
    ts.ScriptTarget.Latest,
    true
  );
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
    Module: addImportToModule,
  };

  return (
    importsToProcess
      // Filtra para excluir o NgModule das declarações
      .filter(({ classifiedName }) => classifiedName !== 'NgModule')
      // Processa cada importação usando o handler apropriado
      .flatMap(({ classifiedName, importPath }) => {
        const handler = Object.keys(handlers).find((key) =>
          classifiedName.endsWith(key)
        );
        return handler
          ? handlers[handler](
              sourceFile,
              modulePath,
              classifiedName,
              importPath
            )
          : [];
      })
  );
}
