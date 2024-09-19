import { Schema } from '@schematics/angular/component/schema';

/**
 * Propriedades do schema que representam as variações no template. Dê preferência ao uso de type ao invés de tipos primitivos.
 *
 * Para casos primitivos, insira diretamente na interface `SchemaOptions`.
 */
export interface SchemaProps {
  paginationType: 'paginacao' | 'scroll-infinito';
}

/**
 * Junção de propriedades nativa do schema (Angular CDK) e propriedades personalizadas do template.
 */
export interface SchemaOptions extends Schema, SchemaProps {}
