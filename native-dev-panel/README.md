# Native Dev Panel

A Firefox Developer Tools add-on developer panel with a native look and feel.


## Overview

Now that Firefox has built-in developer tools, it makes sense for developer add-ons integrate with them. MDN has some examples on creating a developer tools panel, but the examples do not look anything like the built-in tools, and do not offer any information on how to do so.

The examples use HTML/CSS/JavaScript to create the panel, however the built-in tools actually use XUL/CSS/JavaScript. Additionally the built-in tools depend on privileged JavaScript files to handle things like theme switching, such as `theme-switching.js`.

In order to make an add-on look just like the built-in tools, these are the technologies we will have to use.

The following is a tutorial for how to create this example add-on. Also, as a bonus for JSHint users, I've also included an example `.jshintrc` file you can use with Firefox add-ons.


## Prerequisites

To follow along with this tutorial, you will need the following to be installed and ready to go.

- Firefox 44+
- [jpm](https://developer.mozilla.org/en-US/Add-ons/SDK/Tools/jpm)

As of this writing, Firefox 44 is an upcoming release version, but is available in pre-release and developer versions, so go get yourself a copy of [Firefox Developer Edition](https://www.mozilla.org/en-US/firefox/developer/).

Don't worry, the final add-on will be compatible with older versions of Firefox, at least to version 42.

## Tutorial

### Initialize the add-on.

Create a folder named `native-dev-panel`, and open a terminal to that folder, and run the following command to initialize the project.

```bash
jpm init
```

Enter the following as prompted, the defaults are fine for the other prompts.

```
title: Native Dev Panel
entry point: lib/main.js
engines: firefox
```


### Initial setup.

We aren't going to be using the example code and tests, so go ahead and delete the `test` folder and `index.js` file.

Then create the following folders.

```
chrome
data
lib
locale
```


### Create the main entry point.

Create the following file, which will be our main entry point for our script. The `lib` folder will contain all of our JavaScript code for the add-on.

`lib/main.js`
```js
'use strict';

exports.main = function() {
	// Add-on startup.
};

exports.onUnload = function() {
	// Add-on shutdown.
};
```

As you may notice, this file doesn't actually do anything. Don't worry, we will be revisiting this file shortly.


### Test running our add-on.

To make sure everything is running properly, we will do a test run.

The following is the command to run the add-on with the default version Firefox.

```bash
jpm run
```

However, to run it with a specific version of Firefox, such as Firefox Developer Edition, you are going to need to specify the binary with the `-b` switch.

On OS X, the command would look like the following.

```bash
jpm run -b /Applications/FirefoxDeveloperEdition.app/Contents/MacOS/firefox
```

Our add-on does not do anything yet, but we can go to `about:addons` in the URL box, and find our add-on listed under Extensions.

To debug the add-on, you can also add the `--debug` argument.


### Create the localization file.

Nobody likes their text content in their code. The add-on SDK allows us to easily put all of our text content in localization files with specially named property files. I have filled in all the text strings we are going to use in this tutorial.

`locale/en-US.properties`
```
tool.name=Native Panel
tool.label=Native Panel
tool.tooltip=Example Native Panel
panel.instructions=Click the button to get a list of open tab locations.
panel.button=List Tabs
```


### Create the panel icon.

Our developer tools panel is going to need an icon. For scalability, we can use an SVG for this purpose. The built-in icons are 16x16 SVG files with shapes mostly colored `#edf0f1`. For this tutorial, I have created the following very-simple circle icon.

`data/panel-icon.svg`
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
	<circle cx="8" cy="8" r="4" fill="#edf0f1"/>
</svg>
```

### Create the XUL panel.

The built-in tools use XUL, and so does this tutorial. This tutorial isn't going to go into depth on XUL, but mainly we want to include the same base stylesheets and scripts the built-in tools use. The following is the XUL we are going to use in this tutorial.

`chrome/panel.xul`
```xml
<?xml version="1.0" encoding="utf-8"?>

<?xml-stylesheet type="text/css" href="chrome://browser/skin/"?>
<?xml-stylesheet type="text/css" href="chrome://devtools/content/shared/widgets/widgets.css"?>
<?xml-stylesheet type="text/css" href="chrome://devtools/skin/themes/common.css"?>
<?xml-stylesheet type="text/css" href="chrome://devtools/skin/themes/widgets.css"?>

<?xml-stylesheet type="text/css" href="panel.css"?>

<?xul-overlay href="chrome://global/content/editMenuOverlay.xul"?>

<window xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul">
	<script type="application/javascript;version=1.8" src="chrome://devtools/content/shared/theme-switching.js"/>
	<script type="text/javascript" src="chrome://global/content/globalOverlay.js"/>

	<commandset id="editMenuCommands"/>

	<box flex="1" class="devtools-responsive-container theme-body">
		<vbox flex="1" class="devtools-main-content">
			<hbox align="center">
				<label value="" data-l10n="value=panel.instructions"></label>
			</hbox>
			<hbox align="center">
				<button
					id="panel-button"
					class="devtools-toolbarbutton"
					standalone="true"
					label="" data-l10n="label=panel.button"
				></button>
			</hbox>
			<hbox align="center">
				<label id="panel-response" value=""></label>
			</hbox>
		</vbox>
	</box>

</window>
```

The XUL file also specifies a custom CSS file, so create this file also.

`chrome/panel.css`
```css
#panel-response {
	font-family: monospace;
}
```


### Create the chrome manifest file.

In order to use our XUL file in our add-on, we are going to have to register the file so it is available over the `chrome://` protocol. The `resource://` protocol will not do as XUL is not permitted to run there. Create the following file at the root of the package.

`chrome.manifest`
```
content native-dev-panel chrome/
```


### Registering the Panel.

It's time to register our panel using the SDK provided API. To keep everything clean, we will do it in a separate module. There are a couple of things going on here, but the highlights are the creation of a panel class, and creating a new tool from it. The `_` functions are pulling our localized strings from out `properties` files. The SVG icon is created using the SDK API for creating a URL to the add-on directory URL, but the actual panel URL is using the `chrome://` URL we registered. There are also some helpful getter properties for accessing the wrapper frame, and the window of the panel content itself.

`lib/panel.js`
```js
'use strict';

const self = require('sdk/self');
const _ = require('sdk/l10n').get;
const { Class } = require('sdk/core/heritage');
const { Panel } = require('dev/panel');
const { Tool } = require('dev/toolbox');
const { viewFor } = require('sdk/view/core');

// The controller class for the whole panel.
const devPanel = new Class({
	extends: Panel,
	label: _('tool.label'),
	tooltip: _('tool.tooltip'),
	icon: self.data.url('panel-icon.svg'),
	invertIconForLightTheme: true,
	url: 'chrome://native-dev-panel/content/panel.xul',
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
		// TODO: Setup the panel.
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
```

To load this module, we are going to have to `require` it inside our entry script. The API handles add-on startup and shutdown, so need to anything fancy, just `require` it in the head. Edit `main.js` to the following.

```js
'use strict';

require('./panel');

exports.main = function() {
	// Add-on startup.
};

exports.onUnload = function() {
	// Add-on shutdown.
};
```

Now if you run the add-on, you should have a new panel registered. The contents are blank, but we will get to that in a moment.


### Setting up the panel view and model.

You might have noticed the TODO comment above. We will take care of that now, by creating the model and view modules.

First create the model, which will receive the `debuggee` object, and handle communication with it.

`lib/panel-model.js`
```js
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
```

Next create the view, which will receive the model object and the `window` for the panel, and handle all the interface elements and interaction. It will also setup all the localized text strings defined in the XUL.

```js
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
```

Now we need to edit `panel.js` to add the following require statements to the head.

```js
const { PanelView } = require('./panel-view');
const { PanelModel } = require('./panel-model');
```

And replace the TODO comment with the following.

```js
let model = new PanelModel(this.debuggee);
this.panelView = new PanelView(model, this.window);
```

Now `panel.js` should look like the following.

```js
'use strict';

const self = require('sdk/self');
const _ = require('sdk/l10n').get;
const { Class } = require('sdk/core/heritage');
const { Panel } = require('dev/panel');
const { Tool } = require('dev/toolbox');
const { viewFor } = require('sdk/view/core');

const { PanelView } = require('./panel-view');
const { PanelModel } = require('./panel-model');

// The controller class for the whole panel.
const devPanel = new Class({
	extends: Panel,
	label: _('tool.label'),
	tooltip: _('tool.tooltip'),
	icon: self.data.url('panel-icon.svg'),
	invertIconForLightTheme: true,
	url: 'chrome://native-dev-panel/content/panel.xul',
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
```

Now if you were to run the add-on, you should have a new panel with a button you can click to list the URL is every open tab. You can also switch themes, and watch as the panel updates accordingly.

### Making it Firefox < 44 compatible.

If you don't need to support Firefox versions older than 44, you're done. However if you do, read on.

In Firefox 44, the CSS and JavaScript files for the developer tools panels were reorganized ([912121](https://bugzilla.mozilla.org/show_bug.cgi?id=912121)), so the URL's must be adjusted accordingly. This means that we will need 2 different XUL files, one for modern Firefox, and one for legacy Firefox. Fortunately we can take advantage of the XUL overlay feature, to avoid duplicating the content entirely. We will do this by creating two XUL files which load the appropriate CSS and JavaScript, and overlay the common content code.

`chrome/panel-modern.xul`
```xml
<?xml version="1.0" encoding="utf-8"?>

<?xml-stylesheet type="text/css" href="chrome://browser/skin/"?>
<?xml-stylesheet type="text/css" href="chrome://devtools/content/shared/widgets/widgets.css"?>
<?xml-stylesheet type="text/css" href="chrome://devtools/skin/themes/common.css"?>
<?xml-stylesheet type="text/css" href="chrome://devtools/skin/themes/widgets.css"?>

<?xul-overlay href="chrome://global/content/editMenuOverlay.xul"?>
<?xul-overlay href="panel-overlay.xul"?>

<window xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul">
	<script type="application/javascript;version=1.8" src="chrome://devtools/content/shared/theme-switching.js"/>
	<script type="text/javascript" src="chrome://global/content/globalOverlay.js"/>
</window>
```

`chrome/panel-legacy.xul`
```xml
<?xml version="1.0" encoding="utf-8"?>

<?xml-stylesheet type="text/css" href="chrome://browser/skin/"?>
<?xml-stylesheet type="text/css" href="chrome://browser/content/devtools/widgets.css"?>
<?xml-stylesheet type="text/css" href="chrome://browser/skin/devtools/common.css"?>
<?xml-stylesheet type="text/css" href="chrome://browser/skin/devtools/widgets.css"?>

<?xul-overlay href="chrome://global/content/editMenuOverlay.xul"?>
<?xul-overlay href="panel-overlay.xul"?>

<window xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul">
	<script type="application/javascript;version=1.8" src="chrome://browser/content/devtools/theme-switching.js"/>
	<script type="text/javascript" src="chrome://global/content/globalOverlay.js"/>
</window>
```

See the `<?xul-overlay href="panel-overlay.xul"?>` line, this will overlay the common content, which we will create now.

`chrome/panel-overlay.xul`
```xml
<?xml version="1.0" encoding="utf-8"?>

<?xml-stylesheet type="text/css" href="panel.css"?>

<overlay xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul">

	<commandset id="editMenuCommands"/>

	<box flex="1" class="devtools-responsive-container theme-body">
		<vbox flex="1" class="devtools-main-content">
			<hbox align="center">
				<label value="todo label" data-l10n="value=panel.instructions"></label>
			</hbox>
			<hbox align="center">
				<button
					id="panel-button"
					class="devtools-toolbarbutton"
					standalone="true"
					label="todo button" data-l10n="label=panel.button"
				></button>
			</hbox>
			<hbox align="center">
				<label id="panel-response" value=""></label>
			</hbox>
		</vbox>
	</box>

</overlay>
```

Now we need to add some version detection code to our `lib/panel.js` file.

Add the following require to the head of the file.

```js
const system = require('sdk/system');
```

And make the following replacement.

```js
url: 'chrome://native-dev-panel/content/panel.xul',
```
```js
// url: 'chrome://native-dev-panel/content/panel.xul', // Firefox 44+.
// Load the legacy template for older version of the API.
url: 'chrome://native-dev-panel/content/' + (
	parseInt(system.platformVersion) < 44 ?
	'panel-legacy.xul' :
	'panel-modern.xul'
),
```

Now the add-on should run and look the same in both Firefox 44+, and Firefox 43-.

### Fixing the icon color inversion issue for Firefox < 43.

There is one other minor issue, and that is that `invertIconForLightTheme` is only available to the SDK API starting in Firefox 43, even though the underlying API is available ([1201718](https://bugzilla.mozilla.org/show_bug.cgi?id=1201718)). It is possible to monkey-patch this feature in, so I created [a pollyfill for this purpose](https://gist.github.com/AlexanderOMara/5e83d11cad11f3968428). Just save the polyfill under the following location.

`lib/compat/inverticon-patch.js`

Now edit `panel.js` to add the following version detection and require code to the head, before the panel class creation code.

```js
// Polyfill invertIconForLightTheme for Firefox < 43.
if (parseInt(system.platformVersion) < 43) {
	require('./compat/inverticon-patch');
}
```

You should now have an add-on that functions just as well in Firefox 44+ as it does in Firefox 42, and perhaps even older.

Now go forth and make awesome developer extensions!
