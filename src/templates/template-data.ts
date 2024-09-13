import { IImport, IRouteConfig, ITemplateData } from '../utils/interfaces';

// Imports a serem adicionados no app.module.ts
const appModuleImports: IImport[] = [
  {
    classifiedName: 'NgModule',
    importPath: '@angular/core',
  },
  {
    classifiedName: 'MyModule',
    importPath: '@angular/core',
    isModuleForRoot: true,
  },
];

// const imports = `
// import { NgModule } from '@angular/core';
// import { BrowserModule } from '@angular/platform-browser';
// import { AppRoutingModule } from './app-routing.module';
// import { AppComponent } from './app.component';
// import { MyComponent } from './components/my-component.component';
// `;

// Template HTML a ser adicionado no app.component.html
const appComponentHTML = `
<my-header></my-header>
<main>
  <router-outlet></router-outlet>
</main>
<my-footer></my-footer>
`;

// Rotas a serem adicionadas no app-routing.module
const routes: IRouteConfig[] = [
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
  appModuleImports,
  routes,
};

export default templateData;
