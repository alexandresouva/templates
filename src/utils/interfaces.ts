import { Schema } from '@schematics/angular/component/schema';

export interface IOptions extends Schema {}

export interface IImport {
  classifiedName: string;
  importPath: string;
}

export interface RouteConfig {
  path: string;
  component: string;
  importPath: string;
}
