(function () {define ('src/settings',[], function () {
	

	return {
		storage: 'LocalStorage',
		authServiceUrl: window.document.location.protocol + '//' + window.document.domain + '/login/v1/methods/',
		renewDefaultCardTimeout: 2*60*60, //2 hours in secs
		temporaryExpireCardTime: 1*60 //1min in seconds
	};

});

define('src/orderedStringify',[], function () {
	

	//http://stamat.wordpress.com/2013/07/03/javascript-object-ordered-property-stringify/
//SORT WITH STRINGIFICATION

	var orderedStringify = function(o, fn) {
		var props = [];
		var res = '{';
		for(var i in o) {
			props.push(i);
		}
		props = props.sort(fn);

		for(var i = 0; i < props.length; i++) {
			var val = o[props[i]];
			var type = types[whatis(val)];
			if(type === 3) {
				val = orderedStringify(val, fn);
			} else if(type === 2) {
				val = arrayStringify(val, fn);
			} else if(type === 1) {
				val = '"'+val+'"';
			}

			if(type !== 4)
				res += '"'+props[i]+'":'+ val+',';
		}

		return res.substring(res, res.lastIndexOf(','))+'}';
	};

//orderedStringify for array containing objects
	var arrayStringify = function(a, fn) {
		var res = '[';
		for(var i = 0; i < a.length; i++) {
			var val = a[i];
			var type = types[whatis(val)];
			if(type === 3) {
				val = orderedStringify(val, fn);
			} else if(type === 2) {
				val = arrayStringify(val);
			} else if(type === 1) {
				val = '"'+val+'"';
			}

			if(type !== 4)
				res += ''+ val+',';
		}
		if(res[res.length-1] == ',') {
			res = res.substr(0, res.length-1);
		}
		return res +']';
	}

//SORT WITHOUT STRINGIFICATION

	var sortProperties = function(o, fn) {
		var props = [];
		var res = {};
		for(var i in o) {
			props.push(i);
		}
		props = props.sort(fn);

		for(var i = 0; i < props.length; i++) {
			var val = o[props[i]];
			var type = types[whatis(val)];

			if(type === 3) {
				val = sortProperties(val, fn);
			} else if(type === 2) {
				val = sortProperiesInArray(val, fn);
			}
			res[props[i]] = val;
		}

		return res;
	};

//sortProperties for array containing objects
	var sortProperiesInArray = function(a, fn) {
		for(var i = 0; i < a.length; i++) {
			var val = a[i];
			var type = types[whatis(val)];
			if(type === 3) {
				val = sortProperties(val, fn);
			} else if(type === 2) {
				val = sortProperiesInArray(val, fn);
			}
			a[i] = val;
		}

		return a;
	}

//HELPER FUNCTIONS

	var types = {
		'integer': 0,
		'float': 0,
		'string': 1,
		'array': 2,
		'object': 3,
		'function': 4,
		'regexp': 5,
		'date': 6,
		'null': 7,
		'undefined': 8,
		'boolean': 9
	}

	var getClass = function(val) {
		return Object.prototype.toString.call(val)
			.match(/^\[object\s(.*)\]$/)[1];
	};

	var whatis = function(val) {

		if (val === undefined)
			return 'undefined';
		if (val === null)
			return 'null';

		var type = typeof val;

		if (type === 'object')
			type = getClass(val).toLowerCase();

		if (type === 'number') {
			if (val.toString().indexOf('.') > 0)
				return 'float';
			else
				return 'integer';
		}

		return type;
	};

	return orderedStringify;
});

define('src/storage/localStorageProvider',['src/orderedStringify'], function (stringify) {
	

	var LocalStorageProvider = function () {

	};

	LocalStorageProvider.prototype.get = function (key) {
		var res = localStorage.getItem(key);
		try {
			res = JSON.parse(res);
		} catch (err) {
			// not a JSON
		}
		return res;
	};

	LocalStorageProvider.prototype.getRaw = function (key) {
		var res = localStorage.getItem(key);
		return res;
	};

	LocalStorageProvider.prototype.set = function (key, val) {
		if (typeof val === 'object') {
			val = stringify(val);
		}
		localStorage.setItem(key, val);
	};

	LocalStorageProvider.prototype.removeItem = function (key) {
		localStorage.removeItem(key);
	};

	return LocalStorageProvider;

});

define('src/storage/sessionStorageProvider',['src/orderedStringify'], function (stringify) {
	

	var SessionStorageProvider = function () {

	};

	SessionStorageProvider.prototype.get = function (key) {
		var res = sessionStorage.getItem(key);
		try {
			res = JSON.parse(res);
		} catch (err) {
			// not a JSON
		}
		return res;
	};

	SessionStorageProvider.prototype.getRaw = function (key) {
		var res = sessionStorage.getItem(key);
		return res;
	};

	SessionStorageProvider.prototype.set = function (key, val) {
		if (typeof val === 'object') {
			val = stringify(val);
		}
		sessionStorage.setItem(key, val);
	};

	SessionStorageProvider.prototype.removeItem = function (key) {
		sessionStorage.removeItem(key);
	};

	return SessionStorageProvider;

});

define('src/storage/storageFactory',['src/storage/localStorageProvider', 'src/storage/sessionStorageProvider'], function (LocalStorageProvider, SessionStorageProvider) {
	
	var storageFactory = {
		getInstance: function (type) {
			switch (type) {
				case 'LocalStorage':
					return new LocalStorageProvider();
					break;
				case 'SessionStorage':
					return new SessionStorageProvider();
					break;
				default:
					throw new Error('Unknown storage provider: ' + type);
					break;
			}
		}
	};

	return storageFactory;

});
define('src/storage/urlCredentials',[], function () {
    

    var UrlCredentials = function (hash) {
        this.hash = hash || document.location.hash;
    };

    UrlCredentials.prototype.get = function (key) {
        return this._getParameterByName(key);
    };

    UrlCredentials.prototype.clear = function () {
        document.location.hash = '';
        this.hash = '';
    };

    UrlCredentials.prototype.hasCredentials = function() {
        if(this._getParameterByName('card') && this._getParameterByName('signature')) {
            return true;
        }
        return false;
    }

    UrlCredentials.prototype._getParameterByName = function (name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\#&]" + name + "=([^&]*)"),
            results = regex.exec(this.hash);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    };

    return UrlCredentials;
});
define('src/credentials/credentialsManager',[
		'src/settings',
		'src/storage/storageFactory',
		'src/storage/urlCredentials'
	],
	function (settings, StorageFactory, UrlCredentials) {
		

		var CredentialsManager= function(storageProvider, urlCredentials) {
			this.storageProvider = storageProvider || StorageFactory.getInstance(settings.storage);
			this.urlCredentials = urlCredentials || new UrlCredentials();
		};

		CredentialsManager.prototype.getCredentials = function () {

			if(this.urlCredentials.hasCredentials()) {
				this.storageProvider.set('card', this.urlCredentials.get('card'));
				this.storageProvider.set('signature', this.urlCredentials.get('signature'));
				this.urlCredentials.clear();
			}
			var card = this.storageProvider.get('card');
			var signature = this.storageProvider.get('signature');

			if(card && signature) {
				return {
					card: card,
					signature: signature
				};
			}
		};

		CredentialsManager.prototype.getRawCredentials = function() {
			var card = this.storageProvider.getRaw('card');
			var minicard = this.storageProvider.getRaw('minicard');
			var signature = this.storageProvider.getRaw('signature');
			var minisignature = this.storageProvider.getRaw('minisignature');

			if(card && signature) {
				return {
					card: card,
					signature: signature,
					minicard: minicard,
					minisignature: minisignature
				};
			}
		};

		CredentialsManager.prototype.getUsername = function () {
			var card = this.storageProvider.get('card');
			if (!card || !card.username) {
				return false;
			}

			return card.username;
		};

		CredentialsManager.prototype.setCredentials = function (credentials) {
			if(!credentials){
				throw new TypeError('Undefined credentials');
			}
			if(!credentials.card || !credentials.signature) {
				throw new TypeError("Can't set invalid Credentials");
			}

			this.storageProvider.set('card', credentials.card);
			this.storageProvider.set('signature', credentials.signature);
			this.storageProvider.set('minicard', credentials.minicard);
			this.storageProvider.set('minisignature', credentials.minisignature);
		};


		CredentialsManager.prototype.getRenewCardTime = function () {
			return this.storageProvider.get('card').renewCardAt * 1000;
		};

		CredentialsManager.prototype.removeRenewCardTime = function () {
			this.storageProvider.removeItem('renewCardTime');
		};

		CredentialsManager.prototype.removeCredentials = function () {
			this.storageProvider.removeItem('card');
			this.storageProvider.removeItem('minicard');
			this.storageProvider.removeItem('signature');
			this.storageProvider.removeItem('minisignature');
			this.storageProvider.removeItem('renewCardTime');
		};

		return CredentialsManager;

	});

define('src/credentials/renewCardAsyncHandler',[
	],
	function () {
		

		var RenewCardAsyncHandler = function (CardRenewer, CredentialsManager) {
			this.cardRenewer = CardRenewer || new CardRenewer();
			this.credentialsManager = CredentialsManager || new CredentialsManager();
		};

		RenewCardAsyncHandler.prototype.success = function (credentials) {
			credentials = JSON.parse(credentials);
			this.credentialsManager.setCredentials(credentials);
			postal.publish({
				"topic" : "cardRenewed",
				"data": credentials
			});
			this.cardRenewer.scheduleRenew();
		};

		RenewCardAsyncHandler.prototype.error = function (credentials) {
			//Empty
		};

		return RenewCardAsyncHandler;

	});

define('src/credentials/cardRenewer',[
		'src/settings',
		'src/credentials/credentialsManager',
		'src/credentials/renewCardAsyncHandler'
	],
	function (settings, CredentialsManager, RenewCardAsyncHandler) {
		

		var CardRenewer = function (authService, credentialsManager, renewCardAsyncHandler) {
			this.authService = authService;
			this.credentialsManager = credentialsManager || new CredentialsManager();
			this.renewCardAsyncHandler = renewCardAsyncHandler || new RenewCardAsyncHandler(this, this.credentialsManager);
			this.timeout = null;
		};

		CardRenewer.prototype.scheduleRenew = function () {
			var self = this;

			var renewTime = this.credentialsManager.getRenewCardTime();
			var renewDelay = renewTime - Date.now();

			clearTimeout(this.timeout);
			this.timeout = setTimeout(function () {
				self.doRenew()
			}, renewDelay);
		};

		CardRenewer.prototype.doRenew = function () {
			var credentials = this.credentialsManager.getCredentials();
			this.authService.renewCard(credentials, this.renewCardAsyncHandler);
		};

		return CardRenewer;

	});

define ('src/headersManager',[

], function () {
	

	var HeadersManager = function() {
	};

	HeadersManager.prototype.prepareForAjax = function (headers) {
		for(var header in headers) {
			if (typeof headers[header] === 'object') {
				headers[header] = JSON.stringify(headers[header]);
			}
		}
		return headers;
	};

	return HeadersManager;

});
define ('src/authService',[
	'src/settings',
	'src/credentials/cardRenewer',
	'src/headersManager'
], function (settings, CardRenewer, HeadersManager) {
	

	var AuthService= function(cardRenewer, headersManager, jquery) {
		this.cardRenewer = cardRenewer || new CardRenewer(this);
		this.headersManager = headersManager || new HeadersManager();
		this.$ = jquery || $;
	};

	AuthService.prototype.checkCard = function (cred, callback, errCallback) {
		cred = this.headersManager.prepareForAjax(cred);

		this.$.ajax({
			type: "POST",
			url: settings.authServiceUrl + 'checkCard/',
			headers: cred,
			contentType: "application/json",
			success: this._scheduleRenewGenerator(callback),
			error: errCallback
		});
	};

	AuthService.prototype.renewCard = function (cred, renewCardAsyncHandler) {
		cred = this.headersManager.prepareForAjax(cred);

		this.$.ajax({
			type: "POST",
			url: settings.authServiceUrl + 'renewCard/',
			headers: cred,
			contentType: "application/json",
			success: renewCardAsyncHandler.success.bind(renewCardAsyncHandler),
			error: renewCardAsyncHandler.error
		});
	};

	AuthService.prototype.doRenew = function(){
		this.cardRenewer.doRenew();
	};

	AuthService.prototype._scheduleRenewGenerator = function (callback) {
		var self = this;
		return function (data) {
			self.cardRenewer.scheduleRenew();
			callback(data);
		}
	};

	return AuthService;

});

define('src/eyeosAuthClient',[
		'src/credentials/credentialsManager',
		'src/authService'
	],
	function (CredentialsManager, AuthService) {
		

		var EyeosAuthClient = function (credentialsManager, authService) {
			this.credentialsManager = credentialsManager || new CredentialsManager();
			this.authService = authService || new AuthService();
		};

		EyeosAuthClient.prototype.getHeaders = function () {
			return this.credentialsManager.getCredentials();
		};

		EyeosAuthClient.prototype.getRawCredentials = function () {
			return this.credentialsManager.getRawCredentials();
		};

		EyeosAuthClient.prototype.getUsername = function () {
			return this.credentialsManager.getUsername();
		};

		EyeosAuthClient.prototype.checkCard = function (callback, errCallback) {
			var cred = this.credentialsManager.getCredentials();
			if(cred) {
				this.authService.checkCard(cred, callback, errCallback);
			} else {
				errCallback();
			}
		};

		EyeosAuthClient.prototype.removeCard = function () {
			this.credentialsManager.removeCredentials();
		};

		EyeosAuthClient.prototype.setToken = function (credentials) {
			this.credentialsManager.removeRenewCardTime();
			this.credentialsManager.setCredentials(credentials);
		};

		EyeosAuthClient.prototype.doRenew = function(){
			this.authService.doRenew();
		};

		return EyeosAuthClient;

	});

define(['src/eyeosAuthClient'], function(EyeosAuthClient) {

	window.eyeosAuthClient = new EyeosAuthClient();
	return window.eyeosAuthClient;
});

}());