/*@preserve Copyright (C) 2018-2025 Crawford Currie http://c-dot.co.uk license MIT*/
/* eslint-env browser, jquery */

import { Entries } from "./Entries.js";
import "./jq/with-info.js";

/**
 * The inventory is stored as a set of CSV files by the remote database.
 * A master CSV index has rows of other CSV files by name and URL. Each of
 * these group sheets has a header row and a set of columns that describe
 * the piece of kit. One special column, "Count", is assumed to contain a
 * count of the number of pieces of the described kit. If it's absent it's
 * assumed to be 1.
 *
 * The inventory is loaded from CSV, but is then serialised
 * to the local database using JSON to speed up loading/saving.
 *
 * Each group sheet is given a "Class" to make it easy to
 * $.find.
 */
class Inventory extends Entries {

  /**
   * A unique id is generated for each group sheet to make it easy to
   * $.find()
   * @member {}
   */
  uid = 0;

  /**
   * Array of sheets.
   * @member {object[]}
   */
  data = undefined;

  /**
   * Get a descriptor string for a loan from the first three columns
   * of an inventory sheet
   * @private
   */
  static get_loan_descriptor(sheet, entry) {
    return `${sheet.Class} ${entry[0]}: ${entry[1]} ${entry[2]}`;
  }

	//@override
	attach_handlers() {
		$("#inventory_pick_dialog").dialog({
			title: "Select loan item",
			modal: true,
			autoOpen: false,
			width: "100vw",
			open: evt => {
				this.select_picked($(evt.target));
			}
		});
    return super.attach_handlers();
  }

  /**
   * Highlight the inventory item identified by data-picked by
   * adding the inventory_chosen class to it
   * @param {jquery} $dlg the inventory pick dialog
   * @private
   */
  select_picked($dlg) {
    const picked = $dlg.data("picked");
    if (typeof picked === "undefined" || picked == "")
      return;

    let sheet = picked.replace(/,.*$/, "");
    $dlg.find(".inventory_chosen").removeClass("inventory_chosen");

    if (!this.data)
      return;

    const si = this.data.findIndex(e => e.Class == sheet);
    if (si < 0)
      return;

    const $tabs = $dlg.children().first();
    const $tab = $(($tabs.children())[si + 1]);
    $tabs.tabs("option", "active", si);

    // Find the best match among the entries on this sheet
    sheet = this.data[si];
    const ents = sheet.entries;
    const ei = ents.findIndex(e => {
      return Inventory.get_loan_descriptor(sheet, e) == picked;
    });

    if (ei >= 0) {
      const $trs = $tab.find("tr");
      // +1 to skip header row
      const tr = $trs[ei + 1];
      $(tr).addClass("inventory_chosen");
    }
  }

  /**
   * @override
   * @return {Promise} promise that resolves to this
   */
  reload_ui() {
    return this.store.read('inventory.json')
    .then(data => {
      this.data = JSON.parse(data);
      $(".inventory_tab").each((i, el) => this.populate_tab($(el)));
      return this;
    })
    .catch(e => {
      console.error("Inventory load failed", e);
      return this;
    });
  }

  /**
   * Populate an inventory tab. This will be either the top
   * level tab or the loan item dialog tab. The top level tab
   * will have the class main-inventory which will modify the
   * way it is populated.
   * @param $it the tabs div
   * @private
   */
  populate_tab($it) {
    const inventory = this.data;
    const hide_cols = {};
    const self = this;
    
    function fill_sheet(sheet) {
      const nc = sheet.heads.length,
          showCol = {},
          colIndex = {};

      function make_row(ei) {
        // Make a copy, as we may modify Count
        const entry = [].concat(sheet.entries[ei]);
        const $tr = $("<div class='table-row'></div>");
        const desc = Inventory.get_loan_descriptor(sheet, entry);
        $tr.data("loan_desc", desc);
        const on_loan = self.app.loans.number_on_loan(desc);
        let can_pick = true;
        if (on_loan > 0) {
          if (typeof colIndex.Count === "undefined") {
            $tr.addClass("inventory_on_loan");
            can_pick = false;
          } else {
            if (on_loan >= entry[colIndex.Count]) {
              $tr.addClass("inventory_on_loan");
              can_pick = false;
            }
            entry[colIndex.Count] +=
            ` <span data-with-info='#infoNumberOnLoan'>(${on_loan})</span>`;
          }
        }
        if (can_pick)
          $tr.on("click", function () {
            const $dlg = $("#inventory_pick_dialog");
            $dlg.dialog("close");
            const handler = $dlg.data("handler");
            if (typeof handler === "function")
              handler($(this).data("loan_desc"));
          });
        for (let ci = 0; ci < nc; ci++) {
          if (showCol[ci])
            $tr.append(`<div class="table-cell">${entry[ci]}</div>`);
        }
        return $tr;
      }

      const $table = $("<div class='table inventory_table'></div>");
      const $tr = $("<div class='table-row'></div>");
      for (let ci = 0; ci < nc; ci++) {
        colIndex[sheet.heads[ci]] = ci;
        if (!hide_cols[sheet.heads[ci]]) {
          $tr.append(`<div class='table-head-cell padded'>${sheet.heads[ci]}</div>`);
          showCol[ci] = true;
        }
      }
      $table.append($tr);

      for (let ei = 0; ei < sheet.entries.length; ei++)
        $table.append(make_row(ei));

      return $table;
    }

    if ($it.children().length > 0) {
      if ($it.tabs("instance"))
        $it.tabs("destroy");
      $it.empty();
    }

    const $it_ul = $("<ul></ul>");

    if (typeof $it.data("hide-cols") !== "undefined") {
      $it.data("hide-cols").split(/,\s*/).map(function (e) {
        hide_cols[e] = true;
        return true;
      });
    }

    this.uid++;
    $it.append($it_ul);
    for (const i in inventory) {
      const sheet = inventory[i];
      const id = [
        "sheet",
        sheet.Class.replace(/\s+/, "_"), this.uid
      ].join("_");
      $it_ul.append(`<li><a href="#${id}">${sheet.Class}</a></li>`);
      const $div = $("<div class='inventory_sheet scroll_container' id='" + id + "'></div>");
      $it.append($div);
      $div.append(fill_sheet(sheet));
    }
    $it.find("span[data-with-info]").with_info();
    /*$it.find('.inventory_on_loan').with_info({
      position: "hidden",
      text: '#infoAllOnLoan'
    });*/
    $it.tabs();
  }

  /**
   * Update the inventory by reading an updated
   * version from CSV files found by URL.  The inventory index is
   * read from a known URL, and then the URLs listed therein are
   * read to get the individual sheets.
   * @param {URL} sheets_url the index URL
   * @param {function} report progress reporting function(css_class, string)
   */
  update_from_remote(sheets_url, report) {

    const sheetp = new Entries();

    return sheetp.init({
      id: "inventory sub-sheet",
      store: this.store,
      url: sheets_url,
      keys: {
        sheet: "string",
        url: "string"
      }
    })
    .then(s => s.loadFromStore())
    .then(() => {
      const promises = [];

      sheetp.each(mapping => {
        // Get the published CSV
        const sheet = new Entries();
        promises.push(
          sheet.init({
            id: "inventory mapping.url",
            store: this.store,
            url: mapping.url,
            asArrays: true,
            keys: {
              Count: "number"
            }
            // other columns are typeless, columns default to "string"
          })
          .then(s => s.loadFromStore())
          .then(() => {
            report("info", `Updated ${mapping.sheet}`);
            return {
              Class: mapping.sheet,
              heads: sheet.getHeads(),
              entries: sheet.getEntries()
            };
          }));
      });

      return Promise.all(promises);
    })
    .then(sheets => {
			this.reset();
			$(document).trigger("reload_ui");
      return this.store.write(
        'inventory.json', JSON.stringify(sheets))
      .then(() => {
        report("info", "Updated inventory.json");
      });
    })
    .catch(e => {
      report("error",
             "Error reading sheets from the web: " +
             (e.status ? e.status : e));
    });
  }
}

export { Inventory }
