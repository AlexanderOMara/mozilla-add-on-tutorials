'use strict';

const _ = require('sdk/l10n').get;

// A view class to handle the user interface.
function PanelView(model, window) {
	this._model = model;
	this._window = window;
	this.buttonHandler = this.buttonHandler.bind(this);
	// A simple localization engine.
	Array.prototype.forEach.call(
		this.document.querySelectorAll('[data-l10n]'),
		function(el) {
			let l10n = el.getAttribute('data-l10n').match(/([^=]+)=(.+)/);
			if (l10n && l10n.length === 3) {
				el.setAttribute(l10n[1], _(l10n[2]));
			}
		}
	);
	this.panelButton = this.document.querySelector('#panel-button');
	this.panelResponse = this.document.querySelector('#panel-response');
	this.panelButton.addEventListener('click', this.buttonHandler);
}
exports.PanelView = PanelView;
PanelView.prototype = {
	constructor: PanelView,
	dispose: function() {
		this.panelButton.removeEventListener('click', this.buttonHandler);
		this._model.dispose();
		this._model = null;
		this._window = null;
		this.buttonHandler = null;
		this.panelButton = null;
		this.panelResponse = null;
	},
	get model() {
		return this._model;
	},
	get window() {
		return this._window;
	},
	get document() {
		return this._window.document;
	},
	buttonHandler: function() {
		this.panelResponse.setAttribute('value', '...');
		let urls = [];
		this.model.listTabs().then((data) => {
			data.tabs.forEach((tab) => {
				urls.push(tab.url);
			});
			this.panelResponse.setAttribute('value', urls.join(', '));
		});
	}
};
