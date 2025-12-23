/*@preserve Copyright (C) 2019-2025 Crawford Currie http://c-dot.co.uk license MIT*/
/* eslint-env browser */

import { App } from "./App.js";

// Analyse URL parameters
const params = {};
const url_params = window.location.search.substring(1);
if (url_params) {
  for (const setting of url_params.split(/[;&]/)) {
    const set = setting.split("=", 2);
    if (set.length == 1)
      params[setting] = true;
    else
      params[set[0]] = set[1];
  }
}

new App(params).begin();
