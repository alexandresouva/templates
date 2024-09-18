import {
  chain,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import { buildComponent } from '@angular/cdk/schematics';
import { addRoutesAndImportsToRoutingModule } from '../utils/route-helper';
import {
  addHTMLToAppComponent,
  addImportsToAppModule,
  ESSENTIALS_IMPORTS,
} from '../utils/imports-helper';
import { SchemaOptions, SchemaProps } from './schema';
import { IGenericImport } from '../utils/interfaces';
import { appComponentHTML, conditionalImports, routes } from './template-data';
import { getPrefixFromAngularJson } from '../utils/util';

/**
 * Obtém a lista de imports necessários com base nas opções escolhidas no momento de geração do template.
 * Esta função deve ser personalizada para cada novo template criado, caso deseje separar os imports.
 *
 * @param props - Objeto contendo as propriedades do schema para determinar quais imports incluir.
 * @returns Array de objetos IGenericImport com as importações combinadas.
 */
function getImportsBasedOnSchemaProperties(
  props: SchemaProps
): IGenericImport[] {
  const { paginationType } = props;

  // Começa com os imports essenciais para o template funcionar
  let imports = [...ESSENTIALS_IMPORTS];

  // Adiciona imports baseados nas propriedades escolhidas
  if (paginationType && conditionalImports[paginationType]) {
    imports = imports.concat(conditionalImports[paginationType]);
  }

  return imports;
}

/**
 * Função principal para o schematic que aplica as mudanças baseadas nas opções fornecidas.
 *
 * @param options - Opções fornecidas pelo usuário, que incluem propriedades do schema e outros parâmetros.
 * @returns Rule que aplica as mudanças no projeto, incluindo a adição de componentes, imports e rotas.
 */
export function templates(options: SchemaOptions): Rule {
  const imports = getImportsBasedOnSchemaProperties(options);

  return (tree: Tree, context: SchematicContext) => {
    // A sigla é obtida a partir do angular.json do projeto de destino
    // e atribuída a variável "name", que é necessária para funcionamento do schematics
    const processedOptions = {
      ...options,
      name: getPrefixFromAngularJson(tree),
    };

    return chain([
      buildComponent({ ...processedOptions, skipImport: true }),
      addImportsToAppModule(imports),
      addHTMLToAppComponent(appComponentHTML),
      () => addRoutesAndImportsToRoutingModule(routes),
    ])(tree, context);
  };
}
