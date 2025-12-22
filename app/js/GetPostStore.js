/*@preserve Copyright (C) 2025 Crawford Currie http://c-dot.co.uk license MIT*/
/* eslint-env browser,jquery */
/* global URL */

import { AbstractStore } from "./AbstractStore.js";

/**
 * Store on a server that uses GET and POST to retrieve and save text files.
 * Access controls are not supported.
 */
class GetPostStore extends AbstractStore {

  /**
   * URL for data store
   * @member {URL}
   */
  base = undefined;

  /**
   * Authenticated user
   * @member {string}
   */
  user = undefined;

  /**
   * Authenticated pass
   * @member {string}
   */
  pass = undefined;

  // @override
  setCredentials(user, pass) {
    this.user = user;
    this.pass = pass;
  }

  // @override
  connect(params) {
    console.debug(`GetPostStore.connect(${params.url})`);
    // Clean up path so we have a suitable base
    this.base = new URL(`${params.url.origin}${params.url.pathname}/`);
    return Promise.resolve(this);
  }

  // @override
  disconnect() {
    this.root = undefined;
    return Promise.resolve();
  }

  // @override
  read(path) {
    const url = new URL(this.base + path);
    console.debug(`GetPostStore.read ${url}`);
    return $.get(url, null, null, "text");
  }

  // @override
  write(path, data) {
    const url = new URL(this.base + path);
    return $.post(url, data, null, "text");
  }
}

export { GetPostStore }
