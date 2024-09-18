import { IGenericImport, IRouteImport } from '../utils/interfaces';
import { SchemaProps } from './schema';

/**
 * Mapeia todas os valores possíveis (personalizações) do template.
 */
export type TemplateVariations = SchemaProps[keyof SchemaProps];

/**
 * Imports necessários para o correto carregamento da variação de template escolhida.
 */
export const conditionalImports: Record<TemplateVariations, IGenericImport[]> =
  {
    paginacao: [
      {
        classifiedName: 'MyComponent',
        importPath: './components/my-component.component',
      },
      {
        classifiedName: 'My2Component',
        importPath: './components/my-component2.component',
      },
    ],
    'scroll-infinito': [
      {
        classifiedName: 'HeaderComponent',
        importPath: './components/header/header.component',
      },
      { classifiedName: 'MyModule', importPath: './components/my/my.module' },
    ],
  };

/**
 * Template HTML a ser adicionado no app.component.html
 */
export const appComponentHTML = `
<my-header></my-header>
<main>
  <router-outlet></router-outlet>
</main>
<my-footer></my-footer>
`;

/**
 * Rotas a serem adicionadas no app-routing.module
 */
export const routes: IRouteImport[] = [
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
