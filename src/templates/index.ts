import {
  chain,
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
} from '@angular-devkit/schematics';
import { buildComponent } from '@angular/cdk/schematics';
import { addImportsToAppModule } from '../utils/template-helper';
import path = require('path');
import { IOptions } from '../utils/interfaces';

export function templates(options: IOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const appModulePath = path.join(__dirname, 'app.module.ts.template');

    const { name: sigla } = options;
    if (sigla.length !== 3) {
      throw new SchematicsException('A sigla deve ter exatamente 3 letras.');
    }

    return chain([
      buildComponent({ ...options, skipImport: true }),
      addImportsToAppModule(appModulePath),
    ])(tree, context);
  };
}
