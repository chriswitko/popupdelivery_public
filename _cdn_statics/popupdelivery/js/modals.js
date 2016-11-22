;(function(window, document, undefined) {

window.CookieUtil = function () {
	this.debug = false;
};

window.CookieUtil.prototype = {
	get: function (key) {
		if (!key) {
			if (this.debug) {
				alert('1st argument (key) is required.');
			}
			return;
		}
		var cs = document.cookie.split(';');
		var holder = {};
		var c, name, value, result;
		for (var i=0,l=cs.length; i<l ; i++) {
			c = cs[i].replace(/ /g, '').split('=');
			name = c[0];
			value = c[1];
			holder[name] = value;
		}
		switch (true) {
			case key instanceof RegExp:
				result = {};
				for (var i in holder) {
					if (holder.hasOwnProperty(i) && key.test(i)) {
						result[i] = holder[i];
					}
				}
				break;
			case typeof key === 'string':
				result = holder[key];
				break;
			default:
				result = null;
		}
		return result;
	},
	set: function (key, value, opt) {
    console.log('setting cookie');
		if (!key || value === undefined) {
			if (this.debug) {
				alert('1st (key) & 2nd (value) arguments are required.');
			}
			return;
		}
		var expires, opt = opt || {};
    console.log('opt', opt);
    console.log('typeof opt.expires', typeof opt.expires);
		if (typeof opt.expires === 'number') {
			var days = opt.expires;
			var time = new Date();
			time.setDate(time.getDate() + days);
			expires = time.toUTCString();
      console.log('expires', expires);
		}
		value = value.toString();
		//  alert('done');
    console.log('output', [
			encodeURIComponent(key), '=', encodeURIComponent(value),
			expires ? '; expires=' + expires : '',
			opt.path ? '; path=' + opt.path : '',
			opt.domain ? '; domain=' + opt.domain : '',
			opt.secure ? '; secure' : '',
		 ]);
		return (document.cookie = [
			encodeURIComponent(key), '=', encodeURIComponent(value),
			expires ? '; expires=' + expires : '',
			opt.path ? '; path=' + opt.path : '',
			opt.domain ? '; domain=' + opt.domain : '',
			opt.secure ? '; secure' : '',
		 ].join(''));
	},
	del: function (key, opt) {
		if (!key) {
			if (this.debug) {
				alert('1st argument (key) is required.');
			}
			return;
		}
		// set時にpathを指定した場合、remove時にも同じ指定をしないと削除されないので注意
		var opt = opt || {};
		opt.expires = -1;
		return this.set(key, '', opt);
	}
};

})(this, this.document);

var content_element = document.getElementById('tinylead-content-wrapper');

var imgs = document.images,
    len = imgs.length,
    counter = 0;

function refreshPopup() {
  try {
    window.parent.postMessage({type: modal_type, value: {width: content_element.clientWidth, height: content_element.clientHeight}},"*");
  } catch(e) {
    window.parent.postMessage({type: modal_type, value: {width: content_element.clientWidth, height: content_element.clientHeight}},"*");
  }
}

var close = document.getElementsByClassName("close-button");

[].forEach.call(close, function(el) {
  el.onclick = function() {
    if (window.self == window.top) {
      if (this.href)
        return true;
      else
        window.history.back();
    } else {
      try {
        window.parent.formFrameClosed();
        if (window.parent) {
          window.parent.postMessage("close", "*");
        }
      } catch (e) {
        if (window.parent) {
          window.parent.postMessage("close", "*");
        }
      }
      return false;
    }
  };
});

refreshPopup();
