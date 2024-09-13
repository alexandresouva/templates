import { Schema } from '@schematics/angular/component/schema';

export interface IOptions extends Schema {}

export interface IImport {
  classifiedName: string;
  importPath: string;
  isModuleForRoot?: boolean;
}

export interface IRouteConfig {
  path: string;
  component: string;
  importPath: string;
}

export interface ITemplateData {
  appComponentHTML: string;
  appModuleImports: IImport[];
  routes: IRouteConfig[];
}
