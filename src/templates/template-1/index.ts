// Angular e Schematics
import { Rule } from '@angular-devkit/schematics';

// Configurações específicas do template
import { SchemaOptions, SchemaProps } from './schema';
import { appComponentHTML, conditionalImports, routes } from './template-data';

// Helpers
import { ESSENTIALS_IMPORTS } from '../../utils/helpers/imports-helper';
import { IGenericImport } from '../../utils/interfaces/imports.interface';
import { getTemplateRule } from '../../utils/helpers/template-generator';

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
  let imports = [...ESSENTIALS_IMPORTS];
  if (paginationType && conditionalImports[paginationType]) {
    imports = imports.concat(conditionalImports[paginationType]);
  }
  return imports;
}

/**
 * Cria uma regra de template com base nas opções fornecidas.
 *
 * @param {SchemaOptions} options - Opções que definem os imports e configurações do template.
 * @returns {Rule} - Regra para aplicar o template ao projeto.
 */
export function template1(options: SchemaOptions): Rule {
  const imports = getImportsBasedOnSchemaProperties(options);

  return getTemplateRule(options, appComponentHTML, imports, routes);
}
