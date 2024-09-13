import { IRouteConfig, ITemplateData } from '../utils/interfaces';

// Imports a serem adicionados no app.module.ts
const appModuleImports = `
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MyComponent } from './components/my-component.component';
import { MyComponent2 } from './components/my-component.component2';
import { MyModule } from './compnents/my/my.module';
import { My2Module } from './compnents/my/my.module';
import { My2Module } from './compnents/my/my.module';
`;

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
