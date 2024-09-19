import { Tree } from '@angular-devkit/schematics';

/**
 * Captura o estado atual dos arquivos dentro de um diretório específico da árvore de arquivos.
 *
 * @param {Tree} tree - A árvore de arquivos do schematic.
 * @param {string} [rootPath='/src/app'] - O caminho raiz da pasta onde os arquivos serão capturados. O valor padrão é '/src/app'.
 *
 * @returns {Map<string, string>} - Um Map contendo o caminho dos arquivos como chave e o conteúdo do arquivo como valor.
 */
export function getTreeState(
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

/**
 * Verifica se houve mudanças entre o estado original e o estado atual da árvore de arquivos (Tree).
 *
 * @param {Map<string, string>} originalState - O estado original da árvore de arquivos, contendo caminhos e conteúdos dos arquivos.
 * @param {Map<string, string>} currentState - O estado atual da árvore de arquivos, contendo caminhos e conteúdos dos arquivos.
 *
 * @returns {boolean} - Retorna `true` se houver alguma mudança, como diferença no número de arquivos ou no conteúdo deles. Caso contrário, retorna `false`.
 */
export function hasTreeChanges(
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
