import * as Schemas from './schemas';
import { Products } from '/lib/collections';

Products.attachSchema(Schemas.ProductBundler, { selector: { type: 'variant' } });
