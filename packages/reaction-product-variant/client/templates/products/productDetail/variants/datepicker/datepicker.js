import $ from "jquery";
import "bootstrap-datepicker";
import moment from "moment";
import "twix";
import "moment-timezone";


// XXX THIS IS A BIG OL HACK - please move it to an npm package or import
/* ========================================================================
 * Bootstrap: tooltip.js v3.3.6
 * http://getbootstrap.com/javascript/#tooltip
 * Inspired by the original jQuery.tipsy by Jason Frame
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */
(function ($) {
  'use strict';

  // TOOLTIP PUBLIC CLASS DEFINITION
  // ===============================

  var Tooltip = function (element, options) {
    this.type       = null
    this.options    = null
    this.enabled    = null
    this.timeout    = null
    this.hoverState = null
    this.$element   = null
    this.inState    = null

    this.init('tooltip', element, options)
  }

  Tooltip.VERSION  = '3.3.6'

  Tooltip.TRANSITION_DURATION = 150

  Tooltip.DEFAULTS = {
    animation: true,
    placement: 'top',
    selector: false,
    template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
    trigger: 'hover focus',
    title: '',
    delay: 0,
    html: false,
    container: false,
    viewport: {
      selector: 'body',
      padding: 0
    }
  }

  Tooltip.prototype.init = function (type, element, options) {
    this.enabled   = true
    this.type      = type
    this.$element  = $(element)
    this.options   = this.getOptions(options)
    this.$viewport = this.options.viewport && $($.isFunction(this.options.viewport) ? this.options.viewport.call(this, this.$element) : (this.options.viewport.selector || this.options.viewport))
    this.inState   = { click: false, hover: false, focus: false }

    if (this.$element[0] instanceof document.constructor && !this.options.selector) {
      throw new Error('`selector` option must be specified when initializing ' + this.type + ' on the window.document object!')
    }

    var triggers = this.options.trigger.split(' ')

    for (var i = triggers.length; i--;) {
      var trigger = triggers[i]

      if (trigger == 'click') {
        this.$element.on('click.' + this.type, this.options.selector, $.proxy(this.toggle, this))
      } else if (trigger != 'manual') {
        var eventIn  = trigger == 'hover' ? 'mouseenter' : 'focusin'
        var eventOut = trigger == 'hover' ? 'mouseleave' : 'focusout'

        this.$element.on(eventIn  + '.' + this.type, this.options.selector, $.proxy(this.enter, this))
        this.$element.on(eventOut + '.' + this.type, this.options.selector, $.proxy(this.leave, this))
      }
    }

    this.options.selector ?
      (this._options = $.extend({}, this.options, { trigger: 'manual', selector: '' })) :
      this.fixTitle()
  }

  Tooltip.prototype.getDefaults = function () {
    return Tooltip.DEFAULTS
  }

  Tooltip.prototype.getOptions = function (options) {
    options = $.extend({}, this.getDefaults(), this.$element.data(), options)

    if (options.delay && typeof options.delay == 'number') {
      options.delay = {
        show: options.delay,
        hide: options.delay
      }
    }

    return options
  }

  Tooltip.prototype.getDelegateOptions = function () {
    var options  = {}
    var defaults = this.getDefaults()

    this._options && $.each(this._options, function (key, value) {
      if (defaults[key] != value) options[key] = value
    })

    return options
  }

  Tooltip.prototype.enter = function (obj) {
    var self = obj instanceof this.constructor ?
      obj : $(obj.currentTarget).data('bs.' + this.type)

    if (!self) {
      self = new this.constructor(obj.currentTarget, this.getDelegateOptions())
      $(obj.currentTarget).data('bs.' + this.type, self)
    }

    if (obj instanceof $.Event) {
      self.inState[obj.type == 'focusin' ? 'focus' : 'hover'] = true
    }

    if (self.tip().hasClass('in') || self.hoverState == 'in') {
      self.hoverState = 'in'
      return
    }

    clearTimeout(self.timeout)

    self.hoverState = 'in'

    if (!self.options.delay || !self.options.delay.show) return self.show()

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'in') self.show()
    }, self.options.delay.show)
  }

  Tooltip.prototype.isInStateTrue = function () {
    for (var key in this.inState) {
      if (this.inState[key]) return true
    }

    return false
  }

  Tooltip.prototype.leave = function (obj) {
    var self = obj instanceof this.constructor ?
      obj : $(obj.currentTarget).data('bs.' + this.type)

    if (!self) {
      self = new this.constructor(obj.currentTarget, this.getDelegateOptions())
      $(obj.currentTarget).data('bs.' + this.type, self)
    }

    if (obj instanceof $.Event) {
      self.inState[obj.type == 'focusout' ? 'focus' : 'hover'] = false
    }

    if (self.isInStateTrue()) return

    clearTimeout(self.timeout)

    self.hoverState = 'out'

    if (!self.options.delay || !self.options.delay.hide) return self.hide()

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'out') self.hide()
    }, self.options.delay.hide)
  }

  Tooltip.prototype.show = function () {
    var e = $.Event('show.bs.' + this.type)

    if (this.hasContent() && this.enabled) {
      this.$element.trigger(e)

      var inDom = $.contains(this.$element[0].ownerDocument.documentElement, this.$element[0])
      if (e.isDefaultPrevented() || !inDom) return
      var that = this

      var $tip = this.tip()

      var tipId = this.getUID(this.type)

      this.setContent()
      $tip.attr('id', tipId)
      this.$element.attr('aria-describedby', tipId)

      if (this.options.animation) $tip.addClass('fade')

      var placement = typeof this.options.placement == 'function' ?
        this.options.placement.call(this, $tip[0], this.$element[0]) :
        this.options.placement

      var autoToken = /\s?auto?\s?/i
      var autoPlace = autoToken.test(placement)
      if (autoPlace) placement = placement.replace(autoToken, '') || 'top'

      $tip
        .detach()
        .css({ top: 0, left: 0, display: 'block' })
        .addClass(placement)
        .data('bs.' + this.type, this)

      this.options.container ? $tip.appendTo(this.options.container) : $tip.insertAfter(this.$element)
      this.$element.trigger('inserted.bs.' + this.type)

      var pos          = this.getPosition()
      var actualWidth  = $tip[0].offsetWidth
      var actualHeight = $tip[0].offsetHeight

      if (autoPlace) {
        var orgPlacement = placement
        var viewportDim = this.getPosition(this.$viewport)

        placement = placement == 'bottom' && pos.bottom + actualHeight > viewportDim.bottom ? 'top'    :
                    placement == 'top'    && pos.top    - actualHeight < viewportDim.top    ? 'bottom' :
                    placement == 'right'  && pos.right  + actualWidth  > viewportDim.width  ? 'left'   :
                    placement == 'left'   && pos.left   - actualWidth  < viewportDim.left   ? 'right'  :
                    placement

        $tip
          .removeClass(orgPlacement)
          .addClass(placement)
      }

      var calculatedOffset = this.getCalculatedOffset(placement, pos, actualWidth, actualHeight)

      this.applyPlacement(calculatedOffset, placement)

      var complete = function () {
        var prevHoverState = that.hoverState
        that.$element.trigger('shown.bs.' + that.type)
        that.hoverState = null

        if (prevHoverState == 'out') that.leave(that)
      }

      $.support.transition && this.$tip.hasClass('fade') ?
        $tip
          .one('bsTransitionEnd', complete)
          .emulateTransitionEnd(Tooltip.TRANSITION_DURATION) :
        complete()
    }
  }

  Tooltip.prototype.applyPlacement = function (offset, placement) {
    var $tip   = this.tip()
    var width  = $tip[0].offsetWidth
    var height = $tip[0].offsetHeight

    // manually read margins because getBoundingClientRect includes difference
    var marginTop = parseInt($tip.css('margin-top'), 10)
    var marginLeft = parseInt($tip.css('margin-left'), 10)

    // we must check for NaN for ie 8/9
    if (isNaN(marginTop))  marginTop  = 0
    if (isNaN(marginLeft)) marginLeft = 0

    offset.top  += marginTop
    offset.left += marginLeft

    // $.fn.offset doesn't round pixel values
    // so we use setOffset directly with our own function B-0
    $.offset.setOffset($tip[0], $.extend({
      using: function (props) {
        $tip.css({
          top: Math.round(props.top),
          left: Math.round(props.left)
        })
      }
    }, offset), 0)

    $tip.addClass('in')

    // check to see if placing tip in new offset caused the tip to resize itself
    var actualWidth  = $tip[0].offsetWidth
    var actualHeight = $tip[0].offsetHeight

    if (placement == 'top' && actualHeight != height) {
      offset.top = offset.top + height - actualHeight
    }

    var delta = this.getViewportAdjustedDelta(placement, offset, actualWidth, actualHeight)

    if (delta.left) offset.left += delta.left
    else offset.top += delta.top

    var isVertical          = /top|bottom/.test(placement)
    var arrowDelta          = isVertical ? delta.left * 2 - width + actualWidth : delta.top * 2 - height + actualHeight
    var arrowOffsetPosition = isVertical ? 'offsetWidth' : 'offsetHeight'

    $tip.offset(offset)
    this.replaceArrow(arrowDelta, $tip[0][arrowOffsetPosition], isVertical)
  }

  Tooltip.prototype.replaceArrow = function (delta, dimension, isVertical) {
    this.arrow()
      .css(isVertical ? 'left' : 'top', 50 * (1 - delta / dimension) + '%')
      .css(isVertical ? 'top' : 'left', '')
  }

  Tooltip.prototype.setContent = function () {
    var $tip  = this.tip()
    var title = this.getTitle()

    $tip.find('.tooltip-inner')[this.options.html ? 'html' : 'text'](title)
    $tip.removeClass('fade in top bottom left right')
  }

  Tooltip.prototype.hide = function (callback) {
    var that = this
    var $tip = $(this.$tip)
    var e    = $.Event('hide.bs.' + this.type)

    function complete() {
      if (that.hoverState != 'in') $tip.detach()
      that.$element
        .removeAttr('aria-describedby')
        .trigger('hidden.bs.' + that.type)
      callback && callback()
    }

    this.$element.trigger(e)

    if (e.isDefaultPrevented()) return

    $tip.removeClass('in')

    $.support.transition && $tip.hasClass('fade') ?
      $tip
        .one('bsTransitionEnd', complete)
        .emulateTransitionEnd(Tooltip.TRANSITION_DURATION) :
      complete()

    this.hoverState = null

    return this
  }

  Tooltip.prototype.fixTitle = function () {
    var $e = this.$element
    if ($e.attr('title') || typeof $e.attr('data-original-title') != 'string') {
      $e.attr('data-original-title', $e.attr('title') || '').attr('title', '')
    }
  }

  Tooltip.prototype.hasContent = function () {
    return this.getTitle()
  }

  Tooltip.prototype.getPosition = function ($element) {
    $element   = $element || this.$element

    var el     = $element[0]
    var isBody = el.tagName == 'BODY'

    var elRect    = el.getBoundingClientRect()
    if (elRect.width == null) {
      // width and height are missing in IE8, so compute them manually; see https://github.com/twbs/bootstrap/issues/14093
      elRect = $.extend({}, elRect, { width: elRect.right - elRect.left, height: elRect.bottom - elRect.top })
    }
    var elOffset  = isBody ? { top: 0, left: 0 } : $element.offset()
    var scroll    = { scroll: isBody ? document.documentElement.scrollTop || document.body.scrollTop : $element.scrollTop() }
    var outerDims = isBody ? { width: $(window).width(), height: $(window).height() } : null

    return $.extend({}, elRect, scroll, outerDims, elOffset)
  }

  Tooltip.prototype.getCalculatedOffset = function (placement, pos, actualWidth, actualHeight) {
    return placement == 'bottom' ? { top: pos.top + pos.height,   left: pos.left + pos.width / 2 - actualWidth / 2 } :
           placement == 'top'    ? { top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2 } :
           placement == 'left'   ? { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth } :
        /* placement == 'right' */ { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width }

  }

  Tooltip.prototype.getViewportAdjustedDelta = function (placement, pos, actualWidth, actualHeight) {
    var delta = { top: 0, left: 0 }
    if (!this.$viewport) return delta

    var viewportPadding = this.options.viewport && this.options.viewport.padding || 0
    var viewportDimensions = this.getPosition(this.$viewport)

    if (/right|left/.test(placement)) {
      var topEdgeOffset    = pos.top - viewportPadding - viewportDimensions.scroll
      var bottomEdgeOffset = pos.top + viewportPadding - viewportDimensions.scroll + actualHeight
      if (topEdgeOffset < viewportDimensions.top) { // top overflow
        delta.top = viewportDimensions.top - topEdgeOffset
      } else if (bottomEdgeOffset > viewportDimensions.top + viewportDimensions.height) { // bottom overflow
        delta.top = viewportDimensions.top + viewportDimensions.height - bottomEdgeOffset
      }
    } else {
      var leftEdgeOffset  = pos.left - viewportPadding
      var rightEdgeOffset = pos.left + viewportPadding + actualWidth
      if (leftEdgeOffset < viewportDimensions.left) { // left overflow
        delta.left = viewportDimensions.left - leftEdgeOffset
      } else if (rightEdgeOffset > viewportDimensions.right) { // right overflow
        delta.left = viewportDimensions.left + viewportDimensions.width - rightEdgeOffset
      }
    }

    return delta
  }

  Tooltip.prototype.getTitle = function () {
    var title
    var $e = this.$element
    var o  = this.options

    title = $e.attr('data-original-title')
      || (typeof o.title == 'function' ? o.title.call($e[0]) :  o.title)

    return title
  }

  Tooltip.prototype.getUID = function (prefix) {
    do prefix += ~~(Math.random() * 1000000)
    while (document.getElementById(prefix))
    return prefix
  }

  Tooltip.prototype.tip = function () {
    if (!this.$tip) {
      this.$tip = $(this.options.template)
      if (this.$tip.length != 1) {
        throw new Error(this.type + ' `template` option must consist of exactly 1 top-level element!')
      }
    }
    return this.$tip
  }

  Tooltip.prototype.arrow = function () {
    return (this.$arrow = this.$arrow || this.tip().find('.tooltip-arrow'))
  }

  Tooltip.prototype.enable = function () {
    this.enabled = true
  }

  Tooltip.prototype.disable = function () {
    this.enabled = false
  }

  Tooltip.prototype.toggleEnabled = function () {
    this.enabled = !this.enabled
  }

  Tooltip.prototype.toggle = function (e) {
    var self = this
    if (e) {
      self = $(e.currentTarget).data('bs.' + this.type)
      if (!self) {
        self = new this.constructor(e.currentTarget, this.getDelegateOptions())
        $(e.currentTarget).data('bs.' + this.type, self)
      }
    }

    if (e) {
      self.inState.click = !self.inState.click
      if (self.isInStateTrue()) self.enter(self)
      else self.leave(self)
    } else {
      self.tip().hasClass('in') ? self.leave(self) : self.enter(self)
    }
  }

  Tooltip.prototype.destroy = function () {
    var that = this
    clearTimeout(this.timeout)
    this.hide(function () {
      that.$element.off('.' + that.type).removeData('bs.' + that.type)
      if (that.$tip) {
        that.$tip.detach()
      }
      that.$tip = null
      that.$arrow = null
      that.$viewport = null
    })
  }


  // TOOLTIP PLUGIN DEFINITION
  // =========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.tooltip')
      var options = typeof option == 'object' && option

      if (!data && /destroy|hide/.test(option)) return
      if (!data) $this.data('bs.tooltip', (data = new Tooltip(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.tooltip

  $.fn.tooltip             = Plugin
  $.fn.tooltip.Constructor = Tooltip


  // TOOLTIP NO CONFLICT
  // ===================

  $.fn.tooltip.noConflict = function () {
    $.fn.tooltip = old
    return this
  }
})($);

function adjustLocalToDenverTime(time) {
  let here = moment(time);
  let denver = here.clone().tz("America/Denver");
  denver.add(here.utcOffset() - denver.utcOffset(), "minutes");
  return denver.toDate();
}

function adjustDenverToLocalTime(time) {
  let denver = moment(time).tz("America/Denver");
  let here = moment(time);
  here.add(denver.utcOffset() - here.utcOffset(), "minutes");
  return here.toDate();
}

const today = adjustLocalToDenverTime(moment().startOf("day"));

function includedWeekendDays(startDay, endDay) {
  const dayRange = moment(startDay).endOf("day").twix(moment(endDay).endOf("day"), {allDay: true});
  const days = dayRange.count("days");
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  let skipDays = 0;

  skipDays = 2 * weeks;
  if (remainingDays === 0) {
    return skipDays;
  }
  const leftovers = moment(startDay).twix(moment(startDay).add(remainingDays - 1, "days"));
  const iter = leftovers.iterate("days");
  while (iter.hasNext()) {
    let next = iter.next();
    if (next.isoWeekday() >= 6) {
      skipDays++;
    }
  }
  return skipDays;
}

// TODO: Add holiday calculations
function calcShippingDay(startDay, timeInTransit) {
  let start = moment(startDay);
  let bonusTransitDays = 0;
  if (start.isoWeekday() === 6) {
    bonusTransitDays = bonusTransitDays + 1;
  } else if (start.isoWeekday() === 7) {
    bonusTransitDays = bonusTransitDays + 2;
  }

  shippingDays = timeInTransit;
  let shippingDay = moment(start).subtract(timeInTransit + bonusTransitDays, "days");
  if (shippingDay.isoWeekday() >= 6 || shippingDay.isoWeekday() + shippingDays >= 6) {
    return shippingDay.subtract(2, "days");
  }
  return shippingDay;
}

Template.reservationDatepicker.onCreated(function () {
  Session.setDefault("selectedVariantId", ReactionProduct.selectedVariantId());
  this.autorun(() => {
    if (Session.get("selectedVariantId")) {
      this.subscribe("productReservationStatus", Session.get("selectedVariantId"));
      $("#rental-start").datepicker("update");
    }
  });
});


Template.reservationDatepicker.onRendered(function () {
  const variants = ReactionProduct.getVariants(this.data._id);
  const firstChild = variants.find(function (variant) {
    return variant.ancestors.length === 2;
  });
  let defaultReservationLength = 5;
  if (firstChild) {
    ReactionProduct.setCurrentVariant(firstChild._id);
    Session.set("selectedVariantId", firstChild._id);
    if (firstChild.rentalPriceBuckets) {
      defaultReservationLength = firstChild.rentalPriceBuckets[0].duration - 1;
    }
  }

  Session.setDefault("reservationLength", defaultReservationLength); // inclusive of return day, exclusive of arrivalDay
  Session.setDefault("nextMonthHighlight", 0);
  $("#rental-start").datepicker({
    startDate: "+4d",
    autoclose: true,
    daysOfWeekDisabled: [0, 1, 2, 3, 5, 6],
    endDate: "+540d",
    maxViewMode: 0,
    beforeShowDay: function (date) {
      let reservationLength = Session.get("reservationLength");
      let available;
      let classes = "";
      let tooltip = "";
      // if disabled day, skip this
      if (_.contains([1, 2, 3, 5, 6, 7], moment(date).isoWeekday())) {
        available = false;
        tooltip = "Please pick an available Thursday to take delivery."
      } else {
        // Change date checkers to check against Denver time
        const s = adjustLocalToDenverTime(moment(date).startOf("day"));
        const e = adjustLocalToDenverTime(moment(date).startOf("day").add(reservationLength, "days"));
        const shippingDay = TransitTimes.calculateShippingDay(s, 4); // Default of 4 shipping days until zip-calculation is done
        const returnDay = TransitTimes.calculateReturnDay(e, 4); // Default of 4 ^^
        const inventoryVariantsAvailable = RentalProducts.checkInventoryAvailability(
          Session.get("selectedVariantId"),
          {startTime: shippingDay, endTime: returnDay}
        );
        available = inventoryVariantsAvailable.length > 0;
        if (available) {
          if (+s > +today) {
            tooltip = "Available!";
          } else {
            tooltip = "Pick a date in the future";
          }
        } else {
          tooltip = "Fully Booked";
        }
      }
      let selectedDate = $("#rental-start").val();
      if (!selectedDate) {
        return {enabled: available, classes: classes, tooltip: tooltip};
      }
      selectedDate = moment(selectedDate, "MM/DD/YYYY").startOf("day");
      reservationEndDate = moment(selectedDate).startOf("day").add(reservationLength, "days");

      let compareDate = moment(date).startOf("day");
      if (+compareDate === +selectedDate) {
        inRange = true; // to highlight a range of dates
        return {enabled: available, classes: "selected selected-start", tooltip: "Woohoo, gear delivered today!"};
      } else if (+compareDate === +reservationEndDate) {
        if (inRange) inRange = false;  // to stop the highlight of dates ranges
        return {enabled: available, classes: "selected selected-end", tooltip: "Drop gear off at UPS by 3pm to be returned"};
      } else if (+compareDate > +selectedDate && +compareDate < +reservationEndDate) {
        inRange = true;
      } else if (+compareDate < +selectedDate || +compareDate > +reservationEndDate) {
        inRange = false;
      }

      if (inRange) {
        return {enabled: available, classes: "selected selected-range", tooltip: "Rental day, have fun!"}; // create a custom class in css with back color you want
      }
      return {enabled: available, classes: classes, tooltip: tooltip};
    }
  });

  $(document).on({
    mouseenter: function () {
      let $nextWeeks = $(this).parent().nextAll().find(".day");
      let $remainingDaysThisWeek = $(this).nextAll();
      let numDaysToHighlight = Session.get("reservationLength");

      if ($remainingDaysThisWeek.length >= numDaysToHighlight) {
        $remainingDaysThisWeek.slice(0, numDaysToHighlight).addClass("highlight");
        return $remainingDaysThisWeek.slice(numDaysToHighlight - 1, numDaysToHighlight).addClass("last-day");
      }
      $remainingDaysThisWeek.addClass("highlight");
      numDaysToHighlight = numDaysToHighlight - $remainingDaysThisWeek.length;
      $nextWeeks.slice(0, numDaysToHighlight).addClass("highlight");
      return $nextWeeks.slice(numDaysToHighlight - 1, numDaysToHighlight).addClass("last-day");
    },
    mouseleave: function () {
      $(".day").removeClass("highlight");
    }
  }, ".day:not(.disabled)");

  $("#rental-start").on({
    changeDate: function (event) {
      $(".tooltip").remove();
      const cart = ReactionCore.Collections.Cart.findOne();
      const reservationLength = Session.get("reservationLength");

      // Sets cart dates to Denver time - need to set as local time on display.
      const startDate = adjustLocalToDenverTime(moment(event.currentTarget.value, "MM/DD/YYYY").startOf("day"));
      const endDate = adjustLocalToDenverTime(moment(event.currentTarget.value, "MM/DD/YYYY").startOf("day").add(reservationLength, "days"));

      console.log("startDate", startDate);
      console.log("endDate", endDate);

      if (+startDate !== +cart.startTime || +endDate !== +cart.endTime) {
        Meteor.call("rentalProducts/setRentalPeriod", cart._id, startDate, endDate);
        Session.set("reservationStart", startDate);
        $("#rental-start").datepicker("update");
      }
    }
  });
});

Template.reservationDatepicker.helpers({
  startDate: function () {
    let cart = ReactionCore.Collections.Cart.findOne();
    if (cart && cart.startTime) {
      return moment(adjustDenverToLocalTime(moment(cart.startTime))).format("MM/DD/YYYY");
    }
    return "";
  },

  startDateHuman: function () {
    const cart = ReactionCore.Collections.Cart.findOne();
    const resLength = Session.get("reservationLength");
    if (cart && cart.startTime) {
      return moment(adjustDenverToLocalTime(moment(cart.startTime))).format("ddd M/DD")
        + " - " + moment(adjustDenverToLocalTime(moment(cart.startTime).add(resLength, "days"))).format("ddd M/DD");
    }
    return "";
  },
  //
  // endDate: function () {
  //   let cart = ReactionCore.Collections.Cart.findOne();
  //   if (cart && cart.endTime) {
  //     return moment(cart.endTime).format("MM/DD/YYYY");
  //   }
  //   return "";
  // },
  //
  // endDateHuman: function () {
  //   let cart = ReactionCore.Collections.Cart.findOne();
  //   if (cart && cart.endTime) {
  //     return moment(cart.endTime).format("MMM DD, YYYY");
  //   }
  //   return "";
  // },

  rentalLength: function () {
    if (Session.get("cartRentalLength")) {
      return Session.get("cartRentalLength");
    }
    let cart = ReactionCore.Collections.Cart.findOne();
    return cart.rentalDays;
  }
});

const calendarHtml = "<div class='calendar-header'>" +
                     "<h4>Please select a delivery date</h4>" +
                     "<a class='thursday-modal-link'>Read about why we deliver on Thursdays</a>" +
                     "</div>";

const calendarLegendHtml = "<div class='calendar-footer'>" +
            "<div class='arrival-day-legend'>" +
            "<div class='cal-square'></div>" +
            "<label>We'll deliver your gear<br>before 8:00pm</label>" +
            "</div>" +
            "<div class='return-day-legend'>" +
            "<div class='cal-square'></div>" +
            "<label>Return to a UPS<br>location by 5:00pm</label>" +
            "</div>" +
            "</div>";

Template.reservationDatepicker.events({
  // "changeDate #datepicker": function (event) {
  //   const cart = ReactionCore.Collections.Cart.findOne();
  //   const reservationLength = Session.get("reservationLength");
  //
  //   const startDate = moment(event.currentTarget.value, "MM/DD/YYYY").startOf("day").tz("America/Denver");
  //   const endDate = moment(startDate).add(reservationLength, "days");
  //   if (+startDate !== +cart.startTime || +endDate !== +cart.endTime) {
  //     Meteor.call("rentalProducts/setRentalPeriod", cart._id, startDate.toDate(), endDate.toDate());
  //   }
  // },

  "click .show-start": function () {
    $("#rental-start").datepicker("show");
  },
  "click #display-date": function () {
    $("#rental-start").datepicker("show");
    if ($(".datepicker-days .calendar-header").length === 0) {
      $(".datepicker-days").prepend(calendarHtml);
      $(".datepicker-days").append(calendarLegendHtml);
      $(".datepicker-days").tooltip({
        selector: ".day",
        container: "body"
      });
    }
    $(".datepicker-days .calendar-header").on("click", ".thursday-modal-link", function () {
      Modal.show("thursdayDeliveryExplanation");
    });
  }
});
