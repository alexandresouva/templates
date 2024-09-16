import {
  IGenericImport,
  IRouteImport,
  ITemplateData,
} from '../utils/interfaces';

const appModuleImports: IGenericImport[] = [
  // Componentes
  {
    classifiedName: 'MyComponent',
    importPath: './components/my-component.component',
  },
  {
    classifiedName: 'My2Component',
    importPath: './components/my-component2.component',
  },
  {
    classifiedName: 'HeaderComponent',
    importPath: './components/header/header.component',
  },

  // Módulos
  { classifiedName: 'MyModule', importPath: './components/my/my.module' },
  {
    classifiedName: 'My2Module',
    importPath: './components/my2/my2.module',
    isModuleForRoot: true,
  },

  // Pipes
  {
    classifiedName: 'CustomPipe',
    importPath: './pipes/custom.pipe',
  },
  {
    classifiedName: 'DateFormatPipe',
    importPath: './pipes/date-format.pipe',
  },

  // Diretivas
  {
    classifiedName: 'HighlightDirective',
    importPath: './directives/highlight.directive',
  },
  {
    classifiedName: 'VisibilityDirective',
    importPath: './directives/visibility.directive',
  },

  // Serviços
  {
    classifiedName: 'AuthService',
    importPath: './services/auth.service',
  },
  {
    classifiedName: 'LoggingService',
    importPath: './services/logging.service',
  },

  // Guards
  {
    classifiedName: 'AuthGuard',
    importPath: './guards/auth.guard',
  },

  // Interceptors
  {
    classifiedName: 'AuthInterceptor',
    importPath: './interceptors/auth.interceptor',
  },

  // Resolvers
  {
    classifiedName: 'UserResolver',
    importPath: './resolvers/user.resolver',
  },
];

// Template HTML a ser adicionado no app.component.html
const appComponentHTML = `
<my-header></my-header>
<main>
  <router-outlet></router-outlet>
</main>
<my-footer></my-footer>
`;

// Rotas a serem adicionadas no app-routing.module
const routes: IRouteImport[] = [
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

const templateData: ITemplateData = {
  appComponentHTML,
  appModuleImports: appModuleImports,
  routes,
};

export default templateData;
