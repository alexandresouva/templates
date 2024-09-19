import { SchematicsException, Tree } from '@angular-devkit/schematics';

import ts = require('typescript');
import * as fs from 'fs';

/**
 * Obtem o conteúdo de um arquivo TypeScript a partir de um caminho fornecido.
 *
 * @param path - Caminho para o arquivo TypeScript.
 * @param [tree] - (Opcional) Objeto Tree para ler o arquivo do projeto de destino. Se não fornecido,
 *                 tentará ler o arquivo diretamente do template.
 * @returns Um objeto `ts.SourceFile` representando o conteúdo do arquivo.
 * @throws SchematicsException se o conteúdo do arquivo não puder ser lido.
 */
export function getSourceFile(path: string, tree?: Tree): ts.SourceFile {
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
 * Encontra a posição onde o import statement deve ser inserido no arquivo.
 *
 * @param sourceFile - O SourceFile do arquivo de roteamento.
 * @returns A posição para a inserção do import statement.
 */
export function findImportInsertionIndex(sourceFile: ts.SourceFile): number {
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

/**
 * Obtém o prefixo do arquivo angular.json.
 *
 * @param tree - O Tree que representa a árvore de arquivos.
 * @returns O valor do prefixo encontrado no angular.json.
 */
export function getPrefixFromAngularJson(tree: Tree): string {
  const angularConfigPath = '/angular.json';

  if (!tree.exists(angularConfigPath)) {
    throw new SchematicsException(
      `Não foi possível obter a sigla da equipe. O arquivo ${angularConfigPath} não foi encontrado.`
    );
  }

  const angularConfigBuffer = tree.read(angularConfigPath);
  if (!angularConfigBuffer) {
    throw new SchematicsException(
      `Erro ao obter a sigla da equipe. Não foi possível ler o arquivo ${angularConfigPath}.`
    );
  }

  // Obtém o conteúdo do arquivo angular.json
  const angularConfigContent = angularConfigBuffer.toString('utf-8');
  const angularConfig = JSON.parse(angularConfigContent);

  // Busca o projeto default no arquivo angular.json. Caso não exista,
  // assume que o projeto padrão é o primeiro no array de projetos
  const defaultProject =
    angularConfig.defaultProject || Object.keys(angularConfig.projects)[0];
  const project = angularConfig.projects[defaultProject];

  if (!project || !project.prefix) {
    throw new SchematicsException(
      `Erro ao obter a sigla da equipe. O prefixo ("prefix") do projeto não foi encontrado no arquivo ${angularConfigPath}.`
    );
  }

  return project.prefix;
}
