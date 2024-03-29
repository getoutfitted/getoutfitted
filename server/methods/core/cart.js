import _ from "lodash";
import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";
import * as Collections from "/lib/collections";
import * as Schemas from "/lib/collections/schemas";
import { Logger, Reaction } from "/server/api";

/**
 * quantityProcessing
 * @summary perform calculations admissibility of adding product to cart
 * @param {Object} product - product to add to Cart
 * @param {Object} variant - product variant
 * @param {Number} itemQty - qty to add to cart, defaults to 1, deducts
 *  from inventory
 * @since 1.10.1
 * @return {Number} quantity - revised quantity to be added to cart
 */
function quantityProcessing(product, variant, itemQty = 1) {
  let quantity = itemQty;
  const MIN = variant.minOrderQuantity || 1;
  const MAX = variant.inventoryQuantity || Infinity;

  if (MIN > MAX) {
    Logger.info(`productId: ${product._id}, variantId ${variant._id
      }: inventoryQuantity lower then minimum order`);
    throw new Meteor.Error(`productId: ${product._id}, variantId ${variant._id
      }: inventoryQuantity lower then minimum order`);
  }

  // TODO: think about #152 implementation here
  switch (product.type) {
    case "not-in-stock":
      break;
    default: // type: `simple` // todo: maybe it should be "variant"
      if (quantity < MIN) {
        quantity = MIN;
      } else if (quantity > MAX) {
        quantity = MAX;
      }
  }

  return quantity;
}

/**
 * getSessionCarts
 * @summary get Cart cursor with all session carts
 * @param {String} userId - current user _id
 * @param {String} sessionId - current user session id
 * @param {String} shopId - shop id
 * @since 0.10.2
 * @return {Mongo.Cursor} with array of session carts
 */
function getSessionCarts(userId, sessionId, shopId) {
  const carts = Collections.Cart.find({
    $and: [{
      userId: {
        $ne: userId
      }
    }, {
      sessionId: {
        $eq: sessionId
      }
    }, {
      shopId: {
        $eq: shopId
      }
    }]
  });

  // we can't use Array.map here, because we need to reduce the number of array
  // elements if element belongs to registered user, we should throw it.
  const allowedCarts = [];

  // only anonymous user carts allowed
  carts.forEach(cart => {
    if (Roles.userIsInRole(cart.userId, "anonymous", shopId)) {
      allowedCarts.push(cart);
    }
  });

  return allowedCarts;
}

/**
 * Reaction Cart Methods
 */


Meteor.methods({
  /**
   * cart/mergeCart
   * @summary merge matching sessionId cart into specified userId cart
   *
   * There should be one cart for each independent, non logged in user session
   * When a user logs in that cart now belongs to that user and we use the a
   * single user cart.
   * If they are logged in on more than one devices, regardless of session,the
   * user cart will be used
   * If they had more than one cart, on more than one device,logged in at
   * separate times then merge the carts
   *
   * @param {String} cartId - cartId of the cart to merge matching session
   * carts into.
   * @param {String} [currentSessionId] - current client session id
   * @todo I think this method should be moved out from methods to a Function
   * Declaration to keep it more secure
   * @return {Object|Boolean} cartId - cartId on success or false
   */
  "cart/mergeCart": function (cartId, currentSessionId) {
    check(cartId, String);
    check(currentSessionId, Match.Optional(String));

    // we don't process current cart, but merge into it.
    const currentCart = Collections.Cart.findOne(cartId);
    if (!currentCart) {
      throw new Meteor.Error("access-denied", "Access Denied");
    }
    // just used to filter out the current cart
    // we do additional check of cart exists here and if it not exist, next
    // check supposed to throw 403 error
    const userId = currentCart && currentCart.userId;
    // user should have an access to operate with only one - his - cart
    if (this.userId !== null && userId !== this.userId) {
      throw new Meteor.Error(403, "Access Denied");
    }
    // persistent sessions, see: publications/sessions.js
    // this is the last place where we still need `Reaction.sessionId`.
    // The use case is: on user log in. I don't know how pass `sessionId` down
    // at that moment.
    const sessionId = currentSessionId || Reaction.sessionId;
    const shopId = Reaction.getShopId();

    // no need to merge anonymous carts
    if (Roles.userIsInRole(userId, "anonymous", shopId)) {
      return false;
    }
    Logger.debug("merge cart: matching sessionId");
    Logger.debug("current userId:", userId);
    Logger.debug("sessionId:", sessionId);
    // get session carts without current user cart cursor
    const sessionCarts = getSessionCarts(userId, sessionId, shopId);

    Logger.debug(
      `merge cart: begin merge processing of session ${
      sessionId} into: ${currentCart._id}`
    );
    // loop through session carts and merge into user cart
    sessionCarts.forEach(sessionCart => {
      Logger.debug(
        `merge cart: merge user userId: ${userId}, sessionCart.userId: ${
          sessionCart.userId}, sessionCart id: ${sessionCart._id}`
      );
      // really if we have no items, there's nothing to merge
      if (sessionCart.items) {
        // if currentCart already have a cartWorkflow, we don't need to clean it
        // up completely, just to `coreCheckoutShipping` stage. Also, we will
        // need to recalculate shipping rates
        if (typeof currentCart.workflow === "object" &&
        typeof currentCart.workflow.workflow === "object") {
          if (currentCart.workflow.workflow.length > 2) {
            // XXX: GETOUTFITTED MOD -Don't do these next two things
            // Meteor.call("workflow/revertCartWorkflow", "coreCheckoutShipping");
            // refresh shipping quotes
            // Meteor.call("shipping/updateShipmentQuotes", cartId);
          }
        } else {
          // XXX: GETOUTFITTED MOD -Don't revert cartWorkflow
          // if user logged in he doesn't need to show `checkoutLogin` step
          // Meteor.call("workflow/revertCartWorkflow", "checkoutAddressBook");
        }

        // We got an additional db call because of `workflow/revertCartWorkflow`
        // call, but we also got things more cleaner in my opinion.
        // merge session cart into current cart
        Collections.Cart.update(currentCart._id, {
          $addToSet: {
            items: {
              $each: sessionCart.items
            }
          }
        });
      }

      // cleanup session Carts after merge.
      if (sessionCart.userId !== this.userId) {
        // clear the cart that was used for a session
        // and we're also going to do some garbage Collection
        Collections.Cart.remove(sessionCart._id);
        // cleanup user/accounts
        Collections.Accounts.remove({
          userId: sessionCart.userId
        });
        Meteor.users.remove(sessionCart.userId);
        Logger.debug(
          `merge cart: delete cart ${
          sessionCart._id} and user: ${sessionCart.userId}`
        );
      }
      Logger.debug(
        `merge cart: processed merge for cartId ${sessionCart._id}`
      );
    });

    // `checkoutLogin` should be used for anonymous only. Registered users
    // no need see this.
    if (currentCart.workflow.status === "new") {
      // to call `workflow/pushCartWorkflow` two times is the only way to move
      // from status "new" to "checkoutAddressBook" which I found without
      // refactoring of `workflow/pushCartWorkflow`
      // We send `cartId` as arguments because this method could be called from
      // publication method and in half cases it could be so, that
      // Meteor.userId() will be null.

      // XXX: GETOUTFITTED MOD - use our cart workflow
      Meteor.call("workflow/pushCartWorkflow", "goCartWorkflow",
        "goCheckoutShippingAddress", cartId);
      // Meteor.call("workflow/pushCartWorkflow", "coreCartWorkflow",
      //   "checkoutLogin", cartId);
      // Meteor.call("workflow/pushCartWorkflow", "coreCartWorkflow",
      //   "checkoutAddressBook", cartId);
    }

    return currentCart._id;
  },

  /**
   * cart/createCart
   * @description create new cart for user, but all checks for current cart's
   * existence should go before this method will be called, to keep it clean
   * @summary create and return new cart for user
   * @param {String} userId - userId to create cart for
   * @param {String} sessionId - current client session id
   * @todo I think this method should be moved out from methods to a Function
   * Declaration to keep it more secure
   * @returns {String} cartId - users cartId
   */
  "cart/createCart": function (userId, sessionId) {
    check(userId, String);
    check(sessionId, String);

    const shopId = Reaction.getShopId();
    // check if user has `anonymous` role.( this is a visitor)
    const anonymousUser = Roles.userIsInRole(userId, "anonymous", shopId);
    const sessionCartCount = getSessionCarts(userId, sessionId, shopId).length;

    Logger.info("create cart: shopId", shopId);
    Logger.debug("create cart: userId", userId);
    Logger.debug("create cart: sessionId", sessionId);
    Logger.debug("create cart: sessionCarts.count", sessionCartCount);
    Logger.debug("create cart: anonymousUser", anonymousUser);

    // we need to create a user cart for the new authenticated user or
    // anonymous.
    const currentCartId = Collections.Cart.insert({
      sessionId: sessionId,
      userId: userId
    });
    Logger.debug("create cart: into new user cart. created: " +  currentCartId +
      " for user " + userId);

    // merge session carts into the current cart
    if (sessionCartCount > 0 && !anonymousUser) {
      Logger.debug("create cart: found existing cart. merge into " + currentCartId
        + " for user " + userId);
      Meteor.call("cart/mergeCart", currentCartId, sessionId);
    }

    // we should check for an default billing/shipping address in user account.
    // this needed after submitting order, when user receives new cart
    const account = Collections.Accounts.findOne(userId);
    if (account && account.profile && account.profile.addressBook) {
      account.profile.addressBook.forEach(address => {
        if (address.isBillingDefault) {
          Meteor.call("cart/setPaymentAddress", currentCartId, address);
        }
        if (address.isShippingDefault) {
          Meteor.call("cart/setShipmentAddress", currentCartId, address);
        }
      });
    }

    return currentCartId;
  },

  /**
   *  cart/addToCart
   *  @summary add items to a user cart
   *  when we add an item to the cart, we want to break all relationships
   *  with the existing item. We want to fix price, qty, etc into history
   *  however, we could check reactively for price /qty etc, adjustments on
   *  the original and notify them
   *  @param {String} productId - productId to add to Cart
   *  @param {String} variantId - product variant _id
   *  @param {Number} [itemQty] - qty to add to cart
   *  @param {[String]} [selectedBundleOptions] - ids of bundle options selected
   *  @return {Number|Object} Mongo insert response
   */
  "cart/addToCart": function (productId, variantId, itemQty, selectedBundleOptions) {
    check(productId, String);
    check(variantId, String);
    check(itemQty, Match.Optional(Number));
    // XXX: GETOUTFITTED MOD: add selectedBundleOptions to addToCart function.
    check(selectedBundleOptions, Match.Maybe([String]));

    const cart = Collections.Cart.findOne({ userId: this.userId });
    if (!cart) {
      Logger.error(`Cart not found for user: ${ this.userId }`);
      throw new Meteor.Error(404, "Cart not found",
        "Cart not found for user with such id");
    }
    // With the flattened model we no longer need to work directly with the
    // products. But product still could be necessary for a `quantityProcessing`
    // TODO: need to understand: do we really need product inside
    // `quantityProcessing`?
    let product;
    let variant;
    Collections.Products.find({ _id: { $in: [
      productId,
      variantId
    ]}}).forEach(doc => {
      if (doc.type === "simple") {
        product = doc;
      } else {
        variant = doc;
      }
    });
    // TODO: this lines still needed. We could uncomment them in future if
    // decide to not completely remove product data from this method
    // const product = Collections.Products.findOne(productId);
    // const variant = Collections.Products.findOne(variantId);
    if (!product) {
      Logger.warn(`Product: ${ productId } was not found in database`);
      throw new Meteor.Error(404, "Product not found",
        "Product with such id was not found!");
    }
    if (!variant) {
      Logger.warn(`Product variant: ${ variantId } was not found in database`);
      throw new Meteor.Error(404, "ProductVariant not found",
        "ProductVariant with such id was not found!");
    }
    // performs calculations admissibility of adding product to cart
    const quantity = quantityProcessing(product, variant, itemQty);
    // performs search of variant inside cart
    const cartVariantExists = cart.items && cart.items
      .some(item => item.variants._id === variantId);

    // XXX: GETOUTFITTED MOD: check to ensure that all options are selected if bundle product.
    const bundleVariants = [];
    if (selectedBundleOptions) {
      if (variant.bundleProducts.length !== selectedBundleOptions.length) {
        throw new Meteor.Error(500, `Not all options were selected for item ${variant._id} in Cart ${cart._id}`);
      }
      let existingCartQuantity;
      if (cart.items) {
        const specificCartItem = cart.items.find(item => item.variants._id === variantId);
        if (specificCartItem) {
          existingCartQuantity = specificCartItem.quantity || 0;
        } else {
          existingCartQuantity = 0;
        }
      }

      // XXX: GETOUTFITTED MOD - determine what bundle products were selected.
      variant.bundleProducts.forEach(function (bundleProduct, index) {
        const selectedVariant = bundleProduct.variantIds.find(vid => vid.variantId === selectedBundleOptions[index]);
        const selectedOptions = {
          selectionForQtyNumber: existingCartQuantity + 1 || 1,
          productId: bundleProduct.productId,
          // Assumes that internal `bundleProducts` index align with selectedBundleOptions
          variantId: selectedVariant.variantId,
          cartLabel: ((bundleProduct.label || "") + " " + (selectedVariant.label || "")).trim()
        };
        if (selectedOptions.cartLabel === "") {
          selectedOptions.cartLabel = `${selectedVariant.color} ${selectedVariant.size}`;
        }
        bundleVariants.push(selectedOptions);
      });
    }

    // if variant exists, $inc instead of adding
    if (cartVariantExists) {
      return Collections.Cart.update({
        "_id": cart._id,
        "items.variants._id": variantId
      }, {
        // XXX: GETOUTFITTED MOD: add selected Bundle Options to set
        $addToSet: {
          "items.$.variants.selectedBundleOptions": {
            $each: bundleVariants
          }
        },
        $inc: {
          "items.$.quantity": quantity
        }
      }, function (error, result) {
        if (error) {
          Logger.warn("error adding to cart",
            Collections.Cart.simpleSchema().namedContext().invalidKeys());
          return error;
        }

        // XXX: GETOUTFITTED MOD -
        // Don't updateShipmentQuotes because we are binary shipping
        // refresh shipping quotes
        // Meteor.call("shipping/updateShipmentQuotes", cart._id);

        // XXX: GETOUTFITTED MOD -
        // don't revert cart workflow
        // revert workflow to checkout shipping step.
        // Meteor.call("workflow/revertCartWorkflow", "coreCheckoutShipping");

        // XXX: GETOUTFITTED MOD -
        // don't reset selected shipment
        // reset selected shipment method
        // Meteor.call("cart/resetShipmentMethod", cart._id);

        Logger.info(`cart: increment variant ${variantId} quantity by ${
          quantity}`);

        return result;
      });
    }

    // XXX: GETOUTFITTED MOD - add bundleVariants to variant before adding to cart
    if (selectedBundleOptions) {
      variant.selectedBundleOptions = bundleVariants;
      Logger.info(`cart: adding item with bundleVariants: ${bundleVariants.map(bv => bv.variantId)} to cart`);
    }

    // cart variant doesn't exist
    return Collections.Cart.update({
      _id: cart._id
    }, {
      $addToSet: {
        items: {
          _id: Random.id(),
          shopId: product.shopId,
          productId: productId,
          quantity: quantity,
          variants: variant,
          title: product.title,
          type: product.type
        }
      }
    }, function (error, result) {
      if (error) {
        Logger.error(error);
        Logger.error(Collections.Cart.simpleSchema().namedContext().invalidKeys(),
          "Invalid keys. Error adding to cart.");
        return error;
      }

      // XXX: GETOUTFITTED MOD - Commented out these next three meteor calls
      // refresh shipping quotes
      // Meteor.call("shipping/updateShipmentQuotes", cart._id);
      // revert workflow to checkout shipping step.
      // Meteor.call("workflow/revertCartWorkflow", "coreCheckoutShipping");
      // reset selected shipment method
      // Meteor.call("cart/resetShipmentMethod", cart._id);

      Logger.info(`cart: add variant ${variantId} to cartId ${cart._id}`);
      // XXX: GETOUTFITTED MOD - Additional logging
      Logger.info(`cart: cartId ${cart._id} result - `, result);

      return result;
    });
  },

  /**
   * cart/removeFromCart
   * @summary removes or adjust quantity of a variant from the cart
   * @param {String} itemId - cart item _id
   * @param {Number} [quantity] - if provided will adjust increment by quantity
   * @returns {Number} returns Mongo update result
   */
  "cart/removeFromCart": function (itemId, quantity) {
    check(itemId, String);
    check(quantity, Match.Optional(Number));

    const userId = Meteor.userId();
    const cart = Collections.Cart.findOne({
      userId: userId
    });
    if (!cart) {
      Logger.error(`Cart not found for user: ${this.userId}`);
      throw new Meteor.Error("cart-not-found", "Cart not found for user with such id");
    }

    let cartItem;

    if (cart.items) {
      cartItem = _.find(cart.items, (item) => item._id === itemId);
    }

    // extra check of item exists
    if (typeof cartItem !== "object") {
      Logger.error(`Unable to find an item: ${itemId} within the cart: ${cart._id}`);
      throw new Meteor.Error("cart-item-not-found", "Unable to find an item with such id in cart.");
    }

    // XXX: GETOUTFITTED MOD - Don't reset cart workflow
    // refresh shipping quotes
    // Meteor.call("shipping/updateShipmentQuotes", cart._id);
    // revert workflow to checkout shipping step.
    // Meteor.call("workflow/revertCartWorkflow", "coreCheckoutShipping");
    // reset selected shipment method
    // Meteor.call("cart/resetShipmentMethod", cart._id);

    if (!quantity || quantity >= cartItem.quantity) {
      return Collections.Cart.update({
        _id: cart._id
      }, {
        $pull: {
          items: {
            _id: itemId
          }
        }
      }, (error, result) => {
        if (error) {
          Logger.error(error);
          Logger.error(Collections.Cart.simpleSchema().namedContext().invalidKeys(),
            "error removing from cart");
          return error;
        }
        Logger.info(`cart: deleted cart item variant id ${cartItem.variants._id}`);
        return result;
      });
    }

    // if quantity lets convert to negative and increment
    const removeQuantity = Math.abs(quantity) * -1;
    return Collections.Cart.update({
      "_id": cart._id,
      "items._id": cartItem._id
    }, {
      $inc: {
        "items.$.quantity": removeQuantity
      }
    }, (error, result) => {
      if (error) {
        Logger.error(error);
        Logger.error(Collections.Cart.simpleSchema().namedContext().invalidKeys(),
          "error removing from cart");
        return error;
      }
      Logger.info(`cart: removed variant ${cartItem._id} quantity of ${quantity}`);
      return result;
    });
  },


  /**
   * XXX: GETOUTFITTED MOD - Bulk remove from cart
   * cart/removeFromCartBulk
   * @summary removes or adjust quantity of a variant from the cart
   * @param {[String]} itemIds - array of item ids to remove from cart
   * @returns {Number} returns Mongo update result
   */
  "cart/removeFromCartBulk": function (itemIds) {
    check(itemIds, [String]);

    const userId = Meteor.userId();
    const cart = Collections.Cart.findOne({
      userId: userId
    });
    if (!cart) {
      Logger.error(`Cart not found for user: ${this.userId}`);
      throw new Meteor.Error("cart-not-found", "Cart not found for user with such id");
    }

    let cartItems;

    if (cart.items) {
      cartItems = cart.items.filter(item => itemIds.indexOf(item._id) !== -1);
    }

    // extra check of item exists
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      Logger.error(`Unable to find an item that matches any of ${cartItems} within the cart: ${cart._id}`);
      throw new Meteor.Error("cart-item-not-found", "Unable to find an item with such id in cart.");
    }

    return Collections.Cart.update({
      _id: cart._id
    }, {
      $pull: {
        items: {
          _id: {$in: itemIds}
        }
      }
    }, (error, result) => {
      if (error) {
        Logger.error(error);
        Logger.error(Collections.Cart.simpleSchema().namedContext().invalidKeys(),
          "error removing from cart");
        return error;
      }
      Logger.info(`cart: deleted cart items that match ids ${cartItems}`);
      return result;
    });
  },

  /**
   * cart/copyCartToOrder
   * @summary transform cart to order when a payment is processed we want to
   * copy the cart over to an order object, and give the user a new empty
   * cart. reusing the cart schema makes sense, but integrity of the order, we
   * don't want to just make another cart item
   * @todo:  Partial order processing, shopId processing
   * @todo:  Review Security on this method
   * @param {String} cartId - cartId to transform to order
   * @return {String} returns orderId
   */
  "cart/copyCartToOrder": function (cartId) {
    check(cartId, String);
    const cart = Collections.Cart.findOne(cartId);
    // security check
    if (cart.userId !== this.userId) {
      throw new Meteor.Error(403, "Access Denied");
    }
    const order = Object.assign({}, cart);
    const sessionId = cart.sessionId;

    Logger.info("cart/copyCartToOrder", cartId);
    // reassign the id, we'll get a new orderId
    order.cartId = cart._id;

    // a helper for guest login, we let guest add email afterwords
    // for ease, we'll also add automatically for logged in users
    if (order.userId && !order.email) {
      const user = Collections.Accounts.findOne(order.userId);
      // we could have a use case here when email is not defined by some reason,
      // we could throw an error, but it's not pretty clever, so let it go w/o
      // email
      if (typeof user === "object" && user.emails) {
        for (const email of user.emails) {
          // alternate order email address
          if (email.provides === "orders") {
            order.email = email.address;
          } else if (email.provides === "default") {
            order.email = email.address;
          }
        }
      }
    }

    // schema should provide order defaults
    // so we'll delete the cart autovalues
    delete order.createdAt; // autovalues
    delete order.updatedAt;
    delete order.cartCount;
    delete order.cartShipping;
    delete order.cartSubTotal;
    delete order.cartTaxes;
    delete order.cartDiscounts;
    delete order.cartTotal;
    delete order._id;

    // `order.shipping` is array ?
    if (Array.isArray(order.shipping)) {
      if (order.shipping.length > 0) {
        order.shipping[0].paymentId = order.billing[0]._id;

        if (!Array.isArray(order.shipping[0].items)) {
          order.shipping[0].items = [];
        }
      }
    } else { // if not - create it
      order.shipping = [];
    }

    const expandedItems = [];

    // init item level workflow
    _.each(order.items, function (item) {
      // Split items based on their quantity
      for (let i = 0; i < item.quantity; i++) {
        // Clone Item
        const itemClone = _.clone(item);

        // Remove the quantity since we'll be expanding each item as
        // it's own record
        itemClone.quantity = 1;

        itemClone._id = Random.id();
        itemClone.cartItemId = item._id; // used for transitioning inventry
        itemClone.workflow = {
          status: "new"
        };

        expandedItems.push(itemClone);

        // Add each item clone to the first shipment
        if (order.shipping[0].items) {
          order.shipping[0].items.push({
            _id: itemClone._id,
            productId: itemClone.productId,
            shopId: itemClone.shopId,
            variantId: itemClone.variants._id
          });
        }
      }
    });

    // Replace the items with the expanded array of items
    order.items = expandedItems;

    if (!order.items || order.items.length === 0) {
      const msg = "An error occurred saving the order. Missing cart items.";
      Logger.error(msg);
      throw new Meteor.Error("no-cart-items", msg);
    }

    // set new workflow status
    order.workflow.status = "new";
    order.workflow.workflow = ["coreOrderWorkflow/created"];

    // insert new reaction order
    const orderId = Collections.Orders.insert(order);
    Logger.info("Created orderId", orderId);

    if (orderId) {
      // TODO: check for successful orders/inventoryAdjust
      // Meteor.call("orders/inventoryAdjust", orderId);

      // XXX: GETOUTFITTED MOD: adjust rental inventory
      const hasRentalProduct = _.find(order.items, function (item) {
        return item.variants.functionalType !== "variant";
      });
      if (hasRentalProduct) {
        Meteor.call("rentalProducts/inventoryAdjust", orderId);
      }

      Collections.Cart.remove({
        _id: order.cartId
      });
      // create a new cart for the user
      // even though this should be caught by
      // subscription handler, it's not always working
      const newCartExists = Collections.Cart.find({ userId: order.userId });
      if (newCartExists.count() === 0) {
        Meteor.call("cart/createCart", this.userId, sessionId);
        // after recreate new cart we need to make it looks like previous by
        // updating `cart/workflow/status` to "coreCheckoutShipping"
        // by calling `workflow/pushCartWorkflow` three times. This is the only
        // way to do that without refactoring of `workflow/pushCartWorkflow`
        // XXX: GETOUTFITTED MOD - when resetting cart, update cart workflow to new GetOutfitted cart workflow
        Meteor.call("workflow/pushCartWorkflow", "coreCartWorkflow", "goCheckoutShippingAddress");
        Meteor.call("workflow/pushCartWorkflow", "coreCartWorkflow", "goCheckoutBillingAddress");
        Meteor.call("workflow/pushCartWorkflow", "coreCartWorkflow", "goCheckoutTermsOfService");
        Meteor.call("workflow/pushCartWorkflow", "coreCartWorkflow", "goCheckoutPayment");
      }

      Logger.info("Transitioned cart " + cartId + " to order " + orderId);
      // catch send notification, we don't want
      // to block because of notification errors
      if (!order.email) {
        if (Array.isArray(order.shipping) &&
            order.shipping[0] &&
            order.shipping[0].address &&
            order.shipping[0].address.email) {
          Meteor.call("orders/addOrderEmail", order.cartId, order.shipping[0].address.email);
        }
      }

      Meteor.call("orders/sendNotification", Collections.Orders.findOne(orderId), (err) => {
        if (err) {
          Logger.error(err, `Error in orders/sendNotification for order ${orderId}`);
        }
      });

      // order success
      return orderId;
    }
    // we should not have made it here, throw error
    throw new Meteor.Error(400, "cart/copyCartToOrder: Invalid request");
  },

  /**
   * cart/setShipmentMethod
   * @summary saves method as order default
   * @param {String} cartId - cartId to apply shipmentMethod
   * @param {Object} method - shipmentMethod object
   * @return {Number} return Mongo update result
   */
  "cart/setShipmentMethod": function (cartId, method) {
    check(cartId, String);
    check(method, Object);

    // get current cart
    const cart = Collections.Cart.findOne({
      _id: cartId,
      userId: Meteor.userId()
    });
    if (!cart) {
      Logger.error(`Cart not found for user: ${ this.userId }`);
      throw new Meteor.Error(404, "Cart not found",
        "Cart not found for user with such id");
    }

    // temp hack until we build out multiple shipping handlers
    let selector;
    let update;
    // temp hack until we build out multiple shipment handlers
    // if we have an existing item update it, otherwise add to set.
    if (cart.shipping) {
      selector = {
        "_id": cartId,
        "shipping._id": cart.shipping[0]._id
      };
      update = {
        $set: {
          "shipping.$.shipmentMethod": method
        }
      };
    } else {
      selector = {
        _id: cartId
      };
      update = {
        $addToSet: {
          shipping: {
            shipmentMethod: method
          }
        }
      };
    }

    // update or insert method
    try {
      Collections.Cart.update(selector, update);
    } catch (e) {
      Logger.error(e, `Error adding rates to cart ${cartId}`);
      throw new Meteor.Error("An error occurred saving the order", e);
    }

    // this will transition to review
    // XXX: GETOUTFITTED MOD - don't transition workflow to core
    // return Meteor.call("workflow/pushCartWorkflow", "coreCartWorkflow", "coreCheckoutShipping");
    return Meteor.call("workflow/pushCartWorkflow", "goCartWorkflow", "goCheckoutShippingAddress");
  },

  /**
   * cart/resetShipmentMethod
   * @summary removes `shipmentMethod` object from cart
   * @param {String} cartId - cart _id
   * @return {Number} update result
   */
  "cart/resetShipmentMethod": function (cartId) {
    check(cartId, String);

    const cart = Collections.Cart.findOne({
      _id: cartId,
      userId: this.userId
    });
    if (!cart) {
      Logger.error(`Cart not found for user: ${this.userId}`);
      throw new Meteor.Error(404, "Cart not found",
        `Cart: ${cartId} not found for user: ${this.userId}`);
    }

    return Collections.Cart.update({ _id: cartId }, {
      $unset: { "shipping.0.shipmentMethod": "" }
    });
  },

  /**
   * cart/setShipmentAddress
   * @summary adds address book to cart shipping
   * @param {String} cartId - cartId to apply shipmentMethod
   * @param {Object} address - addressBook object
   * @return {Number} update result
   */
  "cart/setShipmentAddress": function (cartId, address) {
    check(cartId, String);
    check(address, Schemas.Address);

    const cart = Collections.Cart.findOne({
      _id: cartId,
      userId: this.userId
    });
    if (!cart) {
      Logger.error(`Cart not found for user: ${ this.userId }`);
      throw new Meteor.Error(404, "Cart not found",
        "Cart not found for user with such id");
    }

    let selector;
    let update;
    // temp hack until we build out multiple shipment handlers
    // if we have an existing item update it, otherwise add to set.
    if (Array.isArray(cart.shipping) && cart.shipping.length > 0) {
      selector = {
        "_id": cartId,
        "shipping._id": cart.shipping[0]._id
      };
      update = {
        $set: {
          "shipping.$.address": address
        }
      };
    } else {
      selector = {
        _id: cartId
      };
      update = {
        $addToSet: {
          shipping: {
            address: address
          }
        }
      };
    }

    // add / or set the shipping address
    try {
      Collections.Cart.update(selector, update);
    } catch (e) {
      Logger.error(e);
      throw new Meteor.Error("An error occurred adding the address");
    }

    // refresh shipping quotes
    // XXX: GETOUTFITTED MOD - Don't do this
    // Meteor.call("shipping/updateShipmentQuotes", cartId);

    if (typeof cart.workflow !== "object") {
      throw new Meteor.Error(500, "Internal Server Error",
        "Cart workflow object not detected.");
    }

    // ~~it's ok for this to be called multiple times~~
    // call it only once when we at the `checkoutAddressBook` step
    if (typeof cart.workflow.workflow === "object" &&
      cart.workflow.workflow.length < 2) {
      Meteor.call("workflow/pushCartWorkflow", "goCartWorkflow",
        "goCheckoutBillingAddress");
    }

    // if we change default address during further steps, we need to revert
    // workflow back to `coreCheckoutShipping` step
    if (typeof cart.workflow.workflow === "object" &&
      cart.workflow.workflow.length > 2) { // "2" index of
      // `coreCheckoutShipping`
      // XXX: GETOUTFITTED MOD - Don't do this
      // Meteor.call("workflow/revertCartWorkflow", "coreCheckoutShipping");
    }

    return true;
  },

  /**
   * cart/setPaymentAddress
   * @summary adds addressbook to cart payments
   * @param {String} cartId - cartId to apply payment address
   * @param {Object} address - addressBook object
   * @todo maybe we need to rename this method to `cart/setBillingAddress`?
   * @return {Number} return Mongo update result
   */
  "cart/setPaymentAddress": function (cartId, address) {
    check(cartId, String);
    check(address, Schemas.Address);

    const cart = Collections.Cart.findOne({
      _id: cartId,
      userId: this.userId
    });

    if (!cart) {
      Logger.error(`Cart not found for user: ${ this.userId }`);
      throw new Meteor.Error(404, "Cart not found",
        "Cart not found for user with such id");
    }

    let selector;
    let update;
    // temp hack until we build out multiple billing handlers
    // if we have an existing item update it, otherwise add to set.
    if (Array.isArray(cart.billing) && cart.billing.length > 0) {
      selector = {
        "_id": cartId,
        "billing._id": cart.billing[0]._id
      };
      update = {
        $set: {
          "billing.$.address": address
        }
      };
    } else {
      selector = {
        _id: cartId
      };
      update = {
        $addToSet: {
          billing: {
            address: address
          }
        }
      };
    }

    if (typeof cart.workflow.workflow === "object" &&
      cart.workflow.workflow.length < 3) {
      Meteor.call("workflow/pushCartWorkflow", "goCartWorkflow",
        "goCheckoutTermsOfService");
    }

    return Collections.Cart.update(selector, update);
  },

  /**
   * cart/unsetAddresses
   * @description removes address from cart.
   * @param {String} addressId - address._id
   * @param {String} userId - cart owner _id
   * @param {String} [type] - billing default or shipping default
   * @since 0.10.1
   * @todo check if no more address in cart as shipping, we should reset
   * `cartWorkflow` to second step
   * @return {Number|Object|Boolean} The number of removed documents or error
   * object or `false` if we don't need to update cart
   */
  "cart/unsetAddresses": function (addressId, userId, type) {
    check(addressId, String);
    check(userId, String);
    check(type, Match.Optional(String));

    // do we actually need to change anything?
    let needToUpdate = false;
    // we need to revert the workflow after a "shipping" address was removed
    let isShippingDeleting = false;
    const cart = Collections.Cart.findOne({
      userId: userId
    });
    const selector = {
      _id: cart._id
    };
    const update = { $unset: {}};
    // user could turn off the checkbox in address to not to be default, then we
    // receive `type` arg
    if (typeof type === "string") {
      // we assume that the billing/shipping arrays can hold only one element [0]
      if (cart[type] && typeof cart[type][0].address === "object" &&
        cart[type][0].address._id === addressId) {
        update.$unset[`${type}.0.address`] = "";
        needToUpdate = true;
        isShippingDeleting = type === "shipping";
      }
    } else { // or if we remove address itself, when we run this part we assume
      // that the billing/shipping arrays can hold only one element [0]
      if (cart.billing && typeof cart.billing[0].address === "object" &&
        cart.billing[0].address._id === addressId) {
        update.$unset["billing.0.address"] = "";
        needToUpdate = true;
      }
      if (cart.shipping && typeof cart.shipping[0].address === "object" &&
        cart.shipping[0].address._id === addressId) {
        update.$unset["shipping.0.address"] = "";
        needToUpdate = true;
        isShippingDeleting = true;
      }
    }

    if (needToUpdate) {
      try {
        Collections.Cart.update(selector, update);
      } catch (e) {
        Logger.error(e);
        throw new Meteor.Error("Error updating cart");
      }

      if (isShippingDeleting) {
        // if we remove shipping address from cart, we need to revert
        // `cartWorkflow` to the `checkoutAddressBook` step.
        // XXX: GETOUTFITTED MOD - Don't do this
        // Meteor.call("workflow/revertCartWorkflow", "checkoutAddressBook");
      }
    }
    return true;
  },

  /**
   * cart/submitPayment
   * @summary saves a submitted payment to cart, triggers workflow
   * and adds "paymentSubmitted" to cart workflow
   * Note: this method also has a client stub, that forwards to cartCompleted
   * @param {Object} paymentMethod - paymentMethod object
   * directly within this method, just throw down though hooks
   * @return {String} returns update result
   */
  "cart/submitPayment": function (paymentMethod) {
    check(paymentMethod, Schemas.PaymentMethod);

    const checkoutCart = Collections.Cart.findOne({
      userId: Meteor.userId()
    });

    const cart = _.clone(checkoutCart);
    const cartId = cart._id;
    const invoice = {
      shipping: cart.cartShipping(),
      subtotal: cart.cartSubTotal(),
      taxes: cart.cartTaxes(),
      discounts: cart.cartDiscounts(),
      total: cart.cartTotal()
    };

    // we won't actually close the order at this stage.
    // we'll just update the workflow and billing data where
    // method-hooks can process the workflow update.

    let selector;
    let update;
    // temp hack until we build out multiple billing handlers
    // if we have an existing item update it, otherwise add to set.
    if (cart.billing) {
      selector = {
        "_id": cartId,
        "billing._id": cart.billing[0]._id
      };
      update = {
        $set: {
          "billing.$.paymentMethod": paymentMethod,
          "billing.$.invoice": invoice
        }
      };
    } else {
      selector = {
        _id: cartId
      };
      update = {
        $addToSet: {
          "billing.paymentMethod": paymentMethod,
          "billing.invoice": invoice
        }
      };
    }

    try {
      Collections.Cart.update(selector, update);
    } catch (e) {
      Logger.error(e);
      throw new Meteor.Error("An error occurred saving the order");
    }

    return Collections.Cart.findOne(selector);
  }
});
