import { KlaviyoProduct } from './schemas';
import { Products } from '/lib/collections';

Products.attachSchema(KlaviyoProduct, { selector: { type: 'simple' }});
