import {
  chain,
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
} from '@angular-devkit/schematics';
import { buildComponent } from '@angular/cdk/schematics';
import { IOptions } from '../utils/interfaces';
import { addRoutesAndImportsToRoutingModule } from '../utils/route-helper';
import {
  addHTMLToAppComponent,
  addImportsToAppModule,
} from '../utils/imports-helper';
import templateData from './template-data';

export function templates(options: IOptions): Rule {
  const { appComponentHTML, appModuleImports, routes } = templateData;

  return (tree: Tree, context: SchematicContext) => {
    const { name: sigla } = options;
    if (sigla.length !== 3) {
      throw new SchematicsException('A sigla deve ter exatamente 3 letras.');
    }

    return chain([
      buildComponent({ ...options, skipImport: true }),
      addImportsToAppModule(appModuleImports),
      addHTMLToAppComponent(appComponentHTML),
      () => addRoutesAndImportsToRoutingModule(routes),
    ])(tree, context);
  };
}
