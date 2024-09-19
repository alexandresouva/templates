import { Rule, SchematicsException, Tree } from '@angular-devkit/schematics';

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

    // Interrompe o fluxo se o conteúdo HTML a ser adicionado já estiver no arquivo
    if (contentString.includes(content)) {
      return tree;
    }

    const recorder = tree.beginUpdate(filePath);
    const contentToAdd = `\n<!-- Conteúdo adicionado via templates -->${content}`;

    // Adiciona o conteúdo ao final do arquivo
    const position = contentString.length;
    recorder.insertLeft(position, contentToAdd);

    tree.commitUpdate(recorder);
    return tree;
  };
}
