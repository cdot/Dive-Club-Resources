/*@preserve Copyright (C) 2015-2025 Crawford Currie http://c-dot.co.uk license MIT*/
/* eslint-env browser,node */

import { AbstractStore } from "./AbstractStore.js";

/**
 * A store engine using browser localStorage.
 * @extends AbstractStore
 */
class LocalStorageStore extends AbstractStore {

	/**
	 * @override
	 */
  connect() {
    console.debug(`LocalStorageStore.connect()`);
    return Promise.resolve(this);
  }

	/**
	 * @override
	 */
  read(path) {
    const str = localStorage.getItem(path);
    if (str === null)
      return Promise.reject(new Error(
        `${path} does not exist in LocalStorageStore`));
    return Promise.resolve(str);
  }

	/**
	 * @override
	 */
  write(path, str) {
    localStorage.setItem(path, str);
    return Promise.resolve();
  }
}

export { LocalStorageStore }
