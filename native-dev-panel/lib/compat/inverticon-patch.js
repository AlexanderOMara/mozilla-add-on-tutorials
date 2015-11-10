/**
 * Polyfill for invertIconForLightTheme option missing in Firefox < 43 Add-on SDK.
 *
 * @copyright Alexander O'Mara
 * @license MPL-2.0
 *
 * Conditionally load this polyfill with the following version detection:
 *
 * const system = require('sdk/system');
 * if (parseInt(system.platformVersion) < 43) {
 *     require('./inverticon-patch');
 * }
 */

'use strict';

const { Tool } = require('dev/toolbox');
const { Cu } = require('chrome');
const { gDevTools } = Cu.import('resource:///modules/devtools/gDevTools.jsm', {});

// A lookup object for patching invertIconForLightTheme.
const patchMap = {};

// If the class requests invertIconForLightTheme, remember the ID for later.
const toolSetup = Tool.prototype.setup;
Tool.prototype.setup = function(o) {
	if (
		o && (o = o.panels) && (o = o.panel) && (o = o.prototype) &&
		o.invertIconForLightTheme && o.id
	) {
		patchMap[o.id] = true;
	}
	toolSetup.apply(this, arguments);
};

// If this ID requested invertIconForLightTheme, patch it in.
const gDevToolsRegisterTool = gDevTools.registerTool;
gDevTools.registerTool = function(o) {
	if (patchMap[o.id]) {
		o.invertIconForLightTheme = true;
	}
	gDevToolsRegisterTool.apply(this, arguments);
};
