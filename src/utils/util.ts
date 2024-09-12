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
