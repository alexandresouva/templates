import {
  chain,
  Rule,
  SchematicContext,
  SchematicsException,
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

/**
 * Obtém a lista de imports necessários com base nas opções escolhidas no momento de geração do template.
 *
 * @param props - Objeto contendo as propriedades do schema para determinar quais imports incluir.
 * @returns Array de objetos IGenericImport com as importações combinadas.
 */
function getImportsBasedOnSchemaProperties(
  props: SchemaProps
): IGenericImport[] {
  const { paginationType } = props;

  // Começa com os imports essenciais
  let imports = [...ESSENTIALS_IMPORTS];

  // Adiciona imports baseados nas propriedades
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

  // Lança um erro caso a sigla não tenha 3 letras
  return (tree: Tree, context: SchematicContext) => {
    const { name: sigla } = options;
    if (sigla.length !== 3) {
      throw new SchematicsException(
        `A sigla informada deve ter exatamente 3 letras.`
      );
    }

    return chain([
      buildComponent({ ...options, skipImport: true }),
      addImportsToAppModule(imports),
      addHTMLToAppComponent(appComponentHTML),
      () => addRoutesAndImportsToRoutingModule(routes),
    ])(tree, context);
  };
}
