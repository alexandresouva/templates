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
