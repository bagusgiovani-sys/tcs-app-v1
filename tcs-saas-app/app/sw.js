"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var worker_1 = require("@serwist/next/worker");
var serwist_1 = require("serwist");
var serwist = new serwist_1.Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: worker_1.defaultCache,
});
serwist.addEventListeners();
