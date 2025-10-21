/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./radmin-customizers/src/ts/customizers.ts":
/*!**************************************************!*\
  !*** ./radmin-customizers/src/ts/customizers.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   customizers: () => (/* binding */ customizers)\n/* harmony export */ });\n/* harmony import */ var _src_ts_custom_customizers_customize_access_codes__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../src/ts/custom/customizers/customize-access-codes */ \"./src/ts/custom/customizers/customize-access-codes.ts\");\n\n// Export only constructors (not instances)\nvar customizers = [\n    _src_ts_custom_customizers_customize_access_codes__WEBPACK_IMPORTED_MODULE_0__.CustomizeAccessCodesTable,\n    // add more customizer constructors here as needed\n];\nconsole.log(\"radmin customizers version 0.3.2\");\n\n\n//# sourceURL=webpack://2sxc-extension-radmin/./radmin-customizers/src/ts/customizers.ts?");

/***/ }),

/***/ "./src/ts/custom/customizers/customize-access-codes.ts":
/*!*************************************************************!*\
  !*** ./src/ts/custom/customizers/customize-access-codes.ts ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   CustomizeAccessCodesTable: () => (/* binding */ CustomizeAccessCodesTable)\n/* harmony export */ });\nvar CustomizeAccessCodesTable = /** @class */ (function () {\n    function CustomizeAccessCodesTable() {\n        // Store the targeted GUID\n        this.targetGuid = \"fd65bdbb-cc93-4b01-976e-4bc906eb8d9a\";\n    }\n    CustomizeAccessCodesTable.prototype.shouldApply = function (config) {\n        console.log(\"Checking table:\", config.title, config.dataContentType, config.guid);\n        // return config.guid === this.targetGuid;\n        return true;\n    };\n    CustomizeAccessCodesTable.prototype.customizeConfig = function (config) {\n        return config;\n    };\n    CustomizeAccessCodesTable.prototype.customizeTabulator = function (options) {\n        // Modify column formatters\n        if (options.columns) {\n            var urlCol = options.columns.find(function (c) { var _a; return ((_a = c.title) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === \"url\"; });\n            if (urlCol) {\n                urlCol.formatter = function (cell) {\n                    var _a;\n                    var row = cell.getRow().getData() || {};\n                    var code = String((_a = row.code) !== null && _a !== void 0 ? _a : \"\");\n                    /*\n                      Build a link:\n                      - If `code` already includes an http/https scheme, use it unchanged.\n                      - Otherwise, if it starts with \"/\", treat it as a path.\n                      - Otherwise, treat it as a query string `?accesscode=...`.\n                      - If the result is not absolute (no scheme), prefix it with window.location.origin.\n                    */\n                    if (!code)\n                        return \"\";\n                    var hasScheme = /^https?:\\/\\//i.test(code);\n                    var path = hasScheme\n                        ? code\n                        : code.startsWith(\"/\")\n                            ? code\n                            : \"?accesscode=\".concat(code);\n                    var url = /^https?:\\/\\//i.test(path)\n                        ? path\n                        : \"\".concat(window.location.origin).concat(path);\n                    return \"<a href=\\\"\".concat(url, \"\\\">\").concat(url, \"</a>\");\n                };\n            }\n        }\n        // Make table fit data width\n        options.layout = \"fitColumns\";\n        return options;\n    };\n    return CustomizeAccessCodesTable;\n}());\n\n\n\n//# sourceURL=webpack://2sxc-extension-radmin/./src/ts/custom/customizers/customize-access-codes.ts?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./radmin-customizers/src/ts/customizers.ts");
/******/ 	
/******/ })()
;