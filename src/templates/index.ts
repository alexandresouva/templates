import {
  chain,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import { buildComponent } from '@angular/cdk/schematics';
import { Schema } from '@schematics/angular/component/schema';
import { addImportsToAppModule } from '../utils/template-helper';
import path = require('path');

export function templates(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const appModulePath = path.join(__dirname, 'app.module.ts.template');

    return chain([
      buildComponent({ ...options, skipImport: true }),
      addImportsToAppModule(appModulePath),
    ])(tree, context);
  };
}
