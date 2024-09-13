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
import { getSourceFile } from './util';

/**
 * Adiciona um bloco de HTML ao app.component.html
 *
 * @param tree - Árvore de arquivos do projeto.
 * @param context - Contexto do schematic.
 * @param content - Conteúdo HTML a ser adicionado.
 */
/**
 * Adiciona um bloco de HTML ao app.component.html se não estiver presente.
 *
 * @param content - Conteúdo HTML a ser adicionado.
 * @returns A regra para ser aplicada no tree do schematic.
 */
export function addHTMLToAppComponent(content: string): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const filePath = 'src/app/app.component.html';

    if (!tree.exists(filePath)) {
      context.logger.error(`O arquivo ${filePath} não existe.`);
      return tree;
    }

    const fileContent = tree.read(filePath);
    if (fileContent === null) {
      context.logger.error(`Não foi possível ler o arquivo ${filePath}.`);
      return tree;
    }

    const contentString = fileContent.toString();

    // Verifica se o conteúdo já está presente
    if (contentString.includes(content)) {
      // Exemplo de como exibir uma mensagem no console
      // context.logger.info(`O conteúdo já está presente no ${filePath}.`);
      return tree;
    }

    const recorder = tree.beginUpdate(filePath);
    const contentToAdd = `\n\n<!-- Conteúdo adicionado via templates -->\n${content}\n`;

    // Adiciona o conteúdo ao final do arquivo
    const position = contentString.length;
    recorder.insertLeft(position, contentToAdd);

    tree.commitUpdate(recorder);
    return tree;
  };
}

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
