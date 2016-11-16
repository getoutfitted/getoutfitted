import { Mongo } from "meteor/mongo";
import * as Schemas from "./schemas";

export const ProductReviews = new Mongo.Collection("ProductReviews");

ProductReviews.attachSchema(Schemas.ProductReviews);
