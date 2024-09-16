import { Schema } from '@schematics/angular/component/schema';

export interface IOptions extends Schema {}

export interface IGenericImport {
  classifiedName: string;
  importPath: string;
  isModuleForRoot?: boolean;
}

export interface IRouteImport {
  path: string;
  component: string;
  importPath: string;
}

export interface ITemplateData {
  appComponentHTML: string;
  appModuleImports: IGenericImport[];
  routes: IRouteImport[];
}
