import { Schema } from '@schematics/angular/component/schema';

/**
 * Propriedades do schema para o template. Dê preferência ao uso de type ao invés de tipos primitivos.
 */
export interface SchemaProps {
  paginationType: 'paginacao' | 'scroll-infinito';
}

/**
 * Junção de propriedades nativa do schema (Angular CDK) e propriedades personalizadas do template.
 */
export interface SchemaOptions extends Schema, SchemaProps {}
