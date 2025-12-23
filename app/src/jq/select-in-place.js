/*@preserve Copyright (C) 2015-2018 Crawford Currie http://c-dot.co.uk license MIT*/
/* eslint-env jquery */

/**
 * Simple in-place editing widget
 */
(function ($) {

  /**
   * Dynamically select a text value for an element from a
   * list of options.
   * @param {object?} options options
   * @param {function} options.changed function called when value is changed
   * @param {string[]} options.options list of options to select from
   */
  $.fn.select_in_place = function (options = {}) {

    /*
    const el = this;
    const $el = $(el);

    const h = options.height || $el.innerHeight() || "1em";
    const w = options.width || $el.innerWidth() || "1em";

    const changed = options.changed || (() => $el.text());

    const closed = options.closed || ( () => {});

    const $sel = $("<select id='sip'></select>");
    for (let i = 0; i < options.options.length; i++) {
      const opt = options.options[i];
      const $opt = $(`<option>${opt}</option>`);
      $sel.append($opt);
    }
    $sel
    .on("blur", () => {
      $sel.remove();
      $el.show();
      closed();
    })
    .insertBefore($el)
    .val($el.text())
    .addClass("select_in_place")
    .css("height", h - 6)
    .css("width", w - 4)
    .on("change", () => {
      $el.text($sel.val());
      changed.call(el, $sel.val());
    })
    .focus();
    */
    const $ul = $("<ul class='sip_menu_ul'></ul>");
    const $div = $("<div class='sip_div'></div>");
    const $dlg = $("<div id='sip_menu'></div>");
    $div.append($ul);
    $dlg.append($div);
    $("body").append($dlg);

    const $this = $(this);

    const text = $this.text();

    for (let i = 0; i < options.options.length; i++) {
      const opt = options.options[i];
      const $opt = $(`<li>${opt}</li>`);
      if (opt === text) {
        $opt.addClass("ui-state-disabled");
        $opt[0].scrollIntoView();
      }
      $ul.append($opt);
    }

    $ul.menu({
      select: function (event, ui) {
        const val = ui.item.text();
        if (options.changed)
          options.changed.call($this, val);
        $dlg.dialog("close");
      }
    });

    const vo = $this.offset();

    $dlg.dialog({
      modal: true,
      autoOpen: true,
      closeOnEscape: true,
      title: false,
      dialogClass: "sip_menu_dlg",
      position: {
        my: "left top",
        at: "left top",
        of: $this,
        collision: "none"
      },
      width: "auto",
      height: window.innerHeight - vo.top,
      resizable: false,
      draggable: false,
      open: function () {
        // Blur when clicking outside the menu
        $(".ui-widget-overlay").on("click", function () {
          $dlg.dialog("close");
        });
        $ul.select();
      },
      close: function () {
        $dlg.dialog("destroy");
        $dlg.remove();
      }
      });
    };
})(jQuery);
