'use strict';

// A model class to handle communication with the debuggee.
function PanelModel(debuggee) {
	this._debuggee = debuggee;
	this._debuggee.start();
}
exports.PanelModel = PanelModel;
PanelModel.prototype = {
	constructor: PanelModel,
	dispose: function() {
		this._debuggee = null;
	},
	listTabs: function() {
		// An example debuggee message and response.
		return new Promise((resolve) => {
			// Not pretty, but it gets the job done.
			this._debuggee.onmessage = (e) => {
				this._debuggee.onmessage = null;
				resolve(e.data);
			};
			this._debuggee.postMessage({
				'to': 'root',
				'type': 'listTabs'
			});
		});
	}
};
