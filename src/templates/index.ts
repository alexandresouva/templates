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
import { IOptions, RouteConfig } from '../utils/interfaces';
import { addRoutesAndImportsToRoutingModule } from '../utils/route-helper';
import { addHTMLBaseToAppComponent } from '../utils/imports-helper';

const routes: RouteConfig[] = [
  {
    path: 'home',
    component: 'HomeComponent',
    importPath: './home/home.component',
  },
  {
    path: 'about',
    component: 'AboutComponent',
    importPath: './about/about.component',
  },
  {
    path: 'contact',
    component: 'ContactComponent',
    importPath: './contact/contact.component',
  },
];

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
      addHTMLBaseToAppComponent('<my-component></my-component>'),
      () => addRoutesAndImportsToRoutingModule(routes),
    ])(tree, context);
  };
}
