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
		var c, name, value, result, i, l;
		for (i=0,l=cs.length; i<l ; i++) {
			c = cs[i].replace(/ /g, '').split('=');
			name = c[0];
			value = c[1];
			holder[name] = value;
		}
		switch (true) {
			case key instanceof RegExp:
				result = {};
				for (i in holder) {
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
		if (!key || value === undefined) {
			if (this.debug) {
				alert('1st (key) & 2nd (value) arguments are required.');
			}
			return;
		}
		var expires;
    opt = opt || {};
		if (typeof opt.expires === 'number') {
			var days = opt.expires;
			var time = new Date();
			time.setDate(time.getDate() + days);
			expires = time.toUTCString();
		}
		value = value.toString();
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
		opt = opt || {};
		opt.expires = -1;
		return this.set(key, '', opt);
	}
};

})(this, this.document);


var popupdelivery_api = 'https://api.popupdelivery.com';

var current_location = top.location.href;
if(current_location.indexOf('http://localhost:') === 0) {
  var arr = current_location.split('/');
  popupdelivery_api = arr[0] + '//' + arr[2];
}

function tinyLeadGetPosition(e, cb) {
  var posx = 0;
  var posy = 0;

  if (!e) var e = window.event;

  if (e.pageX || e.pageY) {
    posx = e.pageX;
    posy = e.pageY - document.body.scrollTop - document.documentElement.scrollTop;
  } else if (e.clientX || e.clientY) {
    posx = e.clientX + document.body.scrollLeft
      + document.documentElement.scrollLeft;
    posy = e.clientY + document.body.scrollTop
      + document.documentElement.scrollTop;
  }

  if(posy < 100) {
    return cb();
  }

  return {
    x: posx,
    y: posy
  }
}

// This will be replace with auto fire method
function tinyLeadShowPopup(site_id, app_type, app_id, link_id, demo) {
  // setTimeout(function() {
    if(window.LEADBOX) {
    	window.LEADBOX.popup(site_id, app_type, app_id, link_id, demo);
    }
  // }, 1000);
}

function tinyLeadShowBadge(site_id, app_type, app_id, link_id, demo) {
  // setTimeout(function() {
    if(window.LEADBOX) {
    	window.LEADBOX.badge(site_id, app_type, app_id, link_id, demo);
    }
  // }, 1000);
}

function tinyLeadGetSize(callback) {
  var body = window.document.body, doc = window.document.documentElement, documentWidth = Math.max(body.scrollWidth, doc.scrollWidth, body.offsetWidth, doc.offsetWidth, doc.clientWidth),
      documentHeight = Math.max(body.scrollHeight, doc.scrollHeight, body.offsetHeight, doc.offsetHeight, doc.clientHeight),
      viewportWidth = window.innerWidth || doc.clientWidth || body.clientWidth,
      viewportHeight = window.innerHeight || doc.clientWidth || body.clientWidth;

  var workaround = window.setTimeout(function() {
    workaround = null;
    window.clearTimeout(workaround);
    callback(documentWidth, documentHeight, viewportWidth, viewportHeight);
  }, 100);
}

function addEvent(object, type, handler) {
  var method;
  if (object && type && handler) {
    method = object.addEventListener ? 'addEventListener' : object.attachEvent ? 'attachEvent' : '';
    type = method == 'addEventListener' ? type : 'on' + type;
    if (method) {
      object[method](type, function(event) {
        event = event ? event : window.event;
        handler.apply(object, [event]);
      });
      return true;
    }
  }
  return false;
}

(function() {

  if (window.LEADBOX) return;
  else window.LEADBOX = {};

  window.LEADBOX.debugging = window.location && String(window.location.hash) === '#debugging';

  // Utilities //

  var LeadBoxes = function() {

    var leadboxes = {};
    var background = null;
    var active, overflow, safetyCheck, exitor, activating;

    function showBackground() {
      background = document.createElement("div");
      // background.className = 'Aligner';
      background.style.position = "fixed";
      background.style.top = background.style.bottom = 
      background.style.left = background.style.right = "0";
      background.style.zIndex = "2147483646";
      background.style.background = "black";
      background.style.width = "100%";
      background.style.opacity = "0.5";
      background.style.display = "block";

      background.onclick = hide;

      document.body.appendChild(background);
    }

    var hide = function () {
      // if (!active) return;

      // hide frame
      if(leadboxes.popup) {
        leadboxes.popup.style.display = "none";
      }

      if(background) {
        background.style.display = "none";
      }

      active = null;

      // restore scroll position and scrolling settings
      // document.body.style.overflow = overflow;
      overflow = null;
    };

    function initBadge(id, url, stats) {
      id = 'badge';

      if (leadboxes[id]) {
        showBackground();
        leadboxes[id].src = url + '?ts=' + new Date().valueOf();
        leadboxes[id].onload = function() {
          leadboxes[id].style.display = 'block';
        };
        return; // leadbox already initialized
      }

      leadboxes[id] = document.createElement("iframe");
      leadboxes[id].src = url + '&ts=' + new Date().valueOf();
      leadboxes[id].scrolling = 'no';
      leadboxes[id].style.position = "fixed";
      leadboxes[id].style.overflow = "hidden";
      leadboxes[id].style.width = "100%";
      leadboxes[id].style.height = "0";
      leadboxes[id].style.left = "0";
      leadboxes[id].style.right = "0";
      leadboxes[id].style.bottom = "0";
      leadboxes[id].style.display = "block";
      leadboxes[id].style.border = "none";
      leadboxes[id].style.zIndex = "2147483647";

      leadboxes[id].onload = function() {
        var msg = JSON.stringify({
          handler: 'visit',
          visit: {
            id: id
          }
        });
        leadboxes[id].contentWindow.postMessage(msg, '*');
        leadboxes[id].onload = null;
      };

      document.body.appendChild(leadboxes[id]);
    }

    function initPopup(id, url, stats) {
      id = 'popup';

      if (leadboxes[id]) {
        // showBackground();
        leadboxes[id].src = url + '?ts=' + new Date().valueOf();
        leadboxes[id].onload = function() {
          leadboxes[id].style.display = 'block';
        };
        return; // leadbox already initialized
      }

      leadboxes[id] = document.createElement("iframe");
      leadboxes[id].src = url + '&ts=' + new Date().valueOf();
      leadboxes[id].style.position = "fixed";
      leadboxes[id].style.overflow = "hidden";
      leadboxes[id].style.left = "50%";
      leadboxes[id].style.top = "50%";
      leadboxes[id].style.width = "100%";
      leadboxes[id].style.display = "none";
      leadboxes[id].style.border = "none";
      leadboxes[id].style.zIndex = "2147483647";
      leadboxes[id].scrolling = "no";

      leadboxes[id].onload = function() {
        var msg = JSON.stringify({
          handler: 'visit',
          visit: {
            id: id
          }
        });
        leadboxes[id].contentWindow.postMessage(msg, '*');
        leadboxes[id].onload = null;
        showBackground();
      };

      document.body.appendChild(leadboxes[id]);
    
    }
    // generates a v4 uuid
    function uuid() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        var r = ((new Date())
          .getTime() + Math.random() * 16) % 16 | 0;
        return (c == "x" ? r : (r & 0x7 | 0x8))
          .toString(16);
      });
    }

    // shows a leadbox by id; if another leadbox is currently shown, it is
    // hidden before proceeding

    function setupPixel() {
      // call analytics
      var util = new window.CookieUtil();
      var pixel_name = 'pd_pixel';

      var uid = uuid();

      if(!util.get(pixel_name)) {
        util.set('pd_pixel', uid, {
          path: '/',
          expires: 730
        });
      }
    }

    function badge(id, cb) {
      var util = new window.CookieUtil();
      util.set('popupSession', '1', {expires: 1});

      setupPixel();
      active = 'badge';
      if (cb) cb();
    }    


    function popup(id, cb) {
      setupPixel();
      active = 'popup';
      if (cb) cb();
    }  

    // called when the leadbox should be resized
    this.resize = function() {
      tinyLeadGetSize(function(documentWidth, documentHeight, width, height) {
        if(leadboxes.popup) {
          leadboxes.popup.style.left = '50%';
          leadboxes.popup.style.top = '50%';
          if(documentWidth < parseInt(leadboxes.popup.style.origWidth)) {
            leadboxes.popup.style.minWidth = (documentWidth - 50) + 'px';
            leadboxes.popup.style.width = leadboxes.popup.style.minWidth;
          } else {
            leadboxes.popup.style.width = parseInt(leadboxes.popup.style.width);//'600px';
            leadboxes.popup.style.minWidth = leadboxes.popup.style.width;
          }
          leadboxes.popup.style.marginLeft = -((parseInt(leadboxes.popup.style.width)) / 2) + "px";
          leadboxes.popup.style.marginTop = -((parseInt(leadboxes.popup.style.height)) / 2) + "px";
        }

        if(leadboxes.badge) {
          leadboxes.badge.style.width = width + "px";
        }
      });
    };

    var onMessageHandler = function(event) {
      if (event && event.data && event.data.handler) switch (event.data.handler) {
        case 'visited':
          var id = event.data.visit.id;
          var config = leadboxes[id][2] || {};
          var visit = event.data.visit;

          var show = true;
          var day = 1000 * 60 * 60 * 24;
          var last = Number(new Date(visit['display-date'] || 0));
          var now = Number(new Date());

          var visits = visit['visit-count'] || 0;

          last = last ? last / day : 0;
          now = now / day;

          day = now - last;

          if (config.time) {
            var time = config.time;
            var timeout = (time.seconds * 1000) || 0;

            show = true;

            if (time.views) show = show && !(visits % (time.views + 1));
            if (time.days) show = show && time.days < day;
            if (show) setTimeout(function() {
              if (safetyCheck) {
                // window.LEADBOX.show(id);
              }
            }, timeout);
          }
          if (config.exit) {
            var exit = config.exit;
            show = true;
            if (exit.days) show = show && exit.days < day;
            if (show) exitor = id;
            // .log('exit', config.exit, new Date(visit['display-date']));
          }
          break;
        case 'displayed':
          break;
      }
      if (event.data == "close") hide();
      if (event.data && event.data.type == "open_reminder") {
        tinyLeadGetSize(function(dW, dH, vW, vH) {
          leadboxes.badge.style.width = vW + 'px';
          leadboxes.badge.style.height = event.data.value.height + 'px';
          leadboxes.badge.style.right = "0px";
        });
      }
      if (event.data && event.data.type == "close_reminder") {
        leadboxes.badge.style.width = '100%';
        leadboxes.badge.style.height = event.data.value.height + 'px';
        leadboxes.badge.style.right = "0px";
      }
      if (event.data && event.data.type == "resize_popup") {
        tinyLeadGetSize(function(documentWidth, documentHeight, width, height) {
          if(documentWidth < parseInt(leadboxes.popup.style.origWidth)) {
            leadboxes.popup.style.width = event.data.value.width + "px";
            leadboxes.popup.style.minWidth = event.data.value.width + "px";
          } else {
            leadboxes.popup.style.width = event.data.value.modal_width;
            leadboxes.popup.style.minWidth = event.data.value.modal_width;
          }
          leadboxes.popup.style.height = event.data.value.height + "px";
          leadboxes.popup.style.origWidth = event.data.value.modal_width;
          leadboxes.popup.origWidth = event.data.value.modal_width;
          leadboxes.popup.style.minHeight = event.data.value.height + "px";
          leadboxes.popup.style.left = '50%';
          leadboxes.popup.style.top = '50%';
          leadboxes.popup.style.marginLeft = -((parseInt(leadboxes.popup.style.width)) / 2) + "px";
          leadboxes.popup.style.marginTop = -((parseInt(leadboxes.popup.style.height)) / 2) + "px";
          leadboxes.popup.style.display = 'block';
        });
      }
      if (event.data && event.data.type == "resize") {
        leadboxes.badge.style.width = event.data.value.width + "px";
        leadboxes.badge.style.height = event.data.value.height + "px";
        tinyLeadGetSize(function(dW, dH, vW, vH) {
          leadboxes.badge.style.bottom = 0;
          leadboxes.badge.style.right = 0;
        });
      }
      if(event.data && event.data.type === 'hellobadge') {
        tinyLeadShowPopup();
      }
    };

    // setup leadbox close handlers
    window.formFrameClosed = this.hide;

    // setup leadbox window handlers
    addEvent(window, 'message', onMessageHandler);

    // public controller
    window.LEADBOX.reset = function(id) {
      var key;
      for (key in leadboxes) {}
      if (leadboxes && leadboxes[key]) {
        leadboxes[key][0].contentWindow.postMessage({
          'handler': 'reset',
          'data': {
            id: id
          }
        }, '*');
      }
    };

    window.LEADBOX.badge = function(site_id, app_type, app_id, link_id, demo, cb) {
      var util = new window.CookieUtil();
      var url = 'https://s3.amazonaws.com/popupdelivery/apps/' + app_id + '.html?cookie_id=' + util.get('pd_pixel') + (util.get('popupSession') ? '&popup_session=1' : '');
      initBadge(app_id, // form-id
        url + // iframe url
        ((url.indexOf("?") == -1) ? "?" : "&") + // query separator
        "lp-in-iframe=0&" + (url.indexOf('app_id') < 0 ? window.location.search.replace(/^\?/, "") : ''), 
        popupdelivery_api + '/static/forms/pixel/global/index.html'); 
      leadboxes.badge.contentWindow.postMessage({
        handler: 'display',
        display: {
          id: 'badge'
        }
      }, '*');
      badge('badge', function() {
        activating = null;
      });
    };

    window.LEADBOX.hide = function() {
      hide();
    };

    window.LEADBOX.popup = function(site_id, app_type, app_id, link_id, demo, cb) {
      var util = new window.CookieUtil();

      var url = 'https://s3.amazonaws.com/popupdelivery/apps/' + app_id + '.html?cookie_id=' + util.get('pd_pixel');
      initPopup('popup', // form-id
        url + // iframe url
        ((url.indexOf("?") == -1) ? "?" : "&") + // query separator
        "lp-in-iframe=0&" + // position fix
        window.location.search.replace(/^\?/, ""), // prepopulation
        popupdelivery_api + '/static/forms/pixel/global/index.html'); // analytics url --- CHANGE TO '/'
      
      leadboxes.popup.contentWindow.postMessage({
        handler: 'display',
        display: {
          id: 'popup'
        }
      }, '*');
      popup('popup', function() {
        activating = null;
      });
    };

    if (window.LEADBOX && window.LEADBOX.debugging) {
      if (window.console && console.log) console.log('debugging detected, resetting active leadboxes');
    }

  };

  var load = function() {
    if (!window.ae417310535411e38f960800200c9a66)
      window.ae417310535411e38f960800200c9a66 = new LeadBoxes();
    window.ae417310535411e38f960800200c9a66.resize();
  };

  if (window.addEventListener) {
    window.addEventListener("load", load);
    window.addEventListener("resize", load);
    document.addEventListener("DOMContentLoaded", load);
  }
  // tender love & care for internet explorer
  else if (window.attachEvent) {
    window.attachEvent("onload", load);
    window.attachEvent("onresize", load);
    // speed up load event
    document.attachEvent("onreadystatechange", function() {
      if (document.readyState === "complete")
        load();
    });
  } else {
    var oldLoad = window.onload,
      oldResize = window.onresize;
    window.onload = function() {
      load();
      if (typeof oldLoad == "function")
        oldLoad();
    };
    window.onresize = function(e) {
      load();
      if (typeof oldResize == "function")
        oldResize(e);
    };
  }
})();

(function() {
  var util = new window.CookieUtil();

  function uuid_fs() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      var r = ((new Date())
        .getTime() + Math.random() * 16) % 16 | 0;
      return (c == "x" ? r : (r & 0x7 | 0x8))
        .toString(16);
    });
  }

  if(!util.get('pd_pixel')) {
    util.set('pd_pixel', uuid_fs(), {
      path: '/',
      expires: 730
    });
  }

  var safetyUrl = popupdelivery_api + '/api/can-i-show'; 
  var getSegment = function(url) {
    var segments = url.split('/');
    if (!~segments[0].indexOf('http')) {
      safetyUrl = popupdelivery_api + '/api/can-i-show';
    } else {
      safetyUrl = popupdelivery_api + '/api/can-i-show';
    }
    return safetyUrl;
  };
  if (document.currentScript) {
    safetyUrl = getSegment(document.currentScript.src);
    var site_id = document.currentScript.getAttribute('data-site-id');
    var is_mobile = navigator.userAgent.match(/(iPhone)|(iPad)|(android)|(webOS)/i);
    safetyUrl += '?cookie_id=' + util.get('pd_pixel') + '&site_id=' + site_id + '&referer=' + encodeURIComponent(document.referrer) + '&is_mobile=' + (is_mobile ? 1 : 0);
  }
  
  var script = document.createElement('script');
  script.src = safetyUrl;
  document.getElementsByTagName('head')[0].appendChild(script);
})();