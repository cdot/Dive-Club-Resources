/*@preserve Copyright (C) 2018-2025 Crawford Currie http://c-dot.co.uk license MIT*/
/* eslint-env browser,jquery */
/* global URL */

import { AbstractStore } from "./AbstractStore.js";
import { DAVClient } from "./DAVClient.js";

/**
 * Store on a remote webdav server
 */
class WebDAVStore extends AbstractStore {

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

  /**
   * DAV client
   * @member {DAVClient}
   */
  DAV = undefined;

  // @override
  setCredentials(user, pass) {
    this.user = user;
    this.pass = pass;
  }

  // @private
  handle_error(res) {
    if (typeof res.body === "string" && res.body.length > 0) {
      res.html = res.body
      .replace(/\n/g, " ") // Firefox doesn't support dotAll
      .replace(/^.*<body>/i, "")
      .replace(/<\/body>.*$/i, "");
    }
    return res;
  }

  // @override
  connect(params) {
    console.debug(`WebDAVStore: connecting to ${params.url}`);
    const opts = {
      baseUrl: params.url
    };
    if (this.user) {
      opts.userName = this.user;
      opts.password = this.pass;
    }
    this.DAV = new DAVClient(opts);
    // Read the root to force an error if connection failed
    return this.read("/")
    .then(() => this);
  }

  // @override
  disconnect() {
    this.DAV = null;
    return Promise.resolve();
  }

  // @override
  read(path) {
    const self = this;
		path = path.replace(/^\/+/, "");
    console.debug("\tWebDAVStore: Reading", path);
    if (!this.DAV)
      return Promise.reject(new Error("WebDAVStore not connected"));
    return this.DAV
    .request('GET', path, {
      "Cache-Control": "no-cache"
    })
    .then(res => {
      if (200 <= res.status && res.status < 300)
        return Promise.resolve(res.body);
      return Promise.reject(self.handle_error(res));
    });
  }

  /**
   * Return a Promise to make the folder given by a path array.
   * @private
   */
  mkpath(path) {

    if (path.length === 0)
      return Promise.resolve(); // at the root, always exists

    const self = this;

    return this.DAV
    .request('PROPFIND', path.join('/'), {
      Depth: 1
    })
    .then(
      res => {
        if (200 <= res.status && res.status < 300) {
          return Promise.resolve();
        } else if (res.status === 404) {
          const p = path.slice();
          p.pop();
          return self.mkpath(p).then(() => {
            return self.DAV.request('MKCOL', path.join('/'));
          });
        }
        return Promise.reject(self.handle__error(res));
      });
  }

  // @override
  write(path, data) {
    "use strict";

    const self = this;

    console.debug("WebDAVStore: Writing " + path);

    path = path.replace(/^\/+/, "").split('/');
    const folder = path.slice();
    folder.pop();

    if (!this.DAV)
      return Promise.reject(self.handle_error(new Error("WebDAVStore not connected")));

    return self.mkpath(folder)
    .then(() => {
      return self.DAV.request('PUT', path.join('/'), {}, data)
      .then(res => {
        if (200 <= res.status && res.status < 300)
          return Promise.resolve(res.body);
        return Promise.reject(self.handle_error(res));
      });
    });
  }
}

export { WebDAVStore }
