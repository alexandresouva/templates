import { Schema } from '@schematics/angular/component/schema';

export interface IImport {
  classifiedName: string;
  importPath: string;
}

export interface IOptions extends Schema {}
