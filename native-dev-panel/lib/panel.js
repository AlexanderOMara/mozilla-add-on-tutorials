'use strict';

const self = require('sdk/self');
const system = require('sdk/system');
const _ = require('sdk/l10n').get;
const { Class } = require('sdk/core/heritage');
const { Panel } = require('dev/panel');
const { Tool } = require('dev/toolbox');
const { viewFor } = require('sdk/view/core');

const { PanelView } = require('./panel-view');
const { PanelModel } = require('./panel-model');

// Polyfill invertIconForLightTheme for Firefox < 43.
if (parseInt(system.platformVersion) < 43) {
	require('./compat/inverticon-patch');
}

// The controller class for the whole panel.
const devPanel = new Class({
	extends: Panel,
	label: _('tool.label'),
	tooltip: _('tool.tooltip'),
	icon: self.data.url('panel-icon.svg'),
	invertIconForLightTheme: true, // Firefox 43+.
	// url: 'chrome://native-dev-panel/content/panel.xul', // Firefox 44+.
	// Load the legacy template for older version of the API.
	url: 'chrome://native-dev-panel/content/' + (
		parseInt(system.platformVersion) < 44 ?
		'panel-legacy.xul' :
		'panel-modern.xul'
	),
	setup: function(options) {
		this.debuggee = options.debuggee;
	},
	dispose: function() {
		this.debuggee = null;
		if (this.panelView) {
			this.panelView.dispose();
		}
		this.panelView = null;
	},
	onReady: function() {
		let model = new PanelModel(this.debuggee);
		this.panelView = new PanelView(model, this.window);
	},
	get frame() {
		return viewFor(this);
	},
	get window() {
		return this.frame.contentWindow;
	}
});
exports.devPanel = devPanel;

const devTool = new Tool({
	name: _('tool.name'),
	panels: {
		panel: devPanel
	}
});
exports.devTool = devTool;
