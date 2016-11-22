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

(function(context) {

  var Patches = {
    String: {
      reverse: function() {
        return this.split("")
          .reverse()
          .join("");
      }
    },
    Array: {
      indexOf: function(obj, start) {
        for (var i = start || 0; i < this.length; i++)
          if (this[i] === obj)
            return i;
        return -1;
      }
    }
  };

  for (var key in Patches)(function() {
    var patch = Patches[key];
    var target = context[key];
    if (patch && target) {
      for (var method in patch) {
        if (!(method in target)) {
          target.prototype[method] = patch[method];
        }
      }
    }
  })();

})(this);

var safetyCheck = false;

// This will be replace with auto fire method
function showFancyLeadboxes() {
  safetyCheck = true;
  console.log('We can safely display timed/exit leadboxes.');
	window.LEADBOX.show('plugins/signup_default/preview');
};

// This will be replace with auto fire method
function showFancyImage() {
  safetyCheck = true;
  console.log('We can safely display timed/exit leadboxes.');
	window.LEADBOX.show('plugins/signup_default/banner');
};

function showFancyReminderBadge() {
  safetyCheck = true;
  console.log('We can safely display timed/exit leadboxes.');
  // alert('reminder badge')
	window.LEADBOX.badge('plugins/badge/index');
};

(function() {

  if (window.LEADBOX) return;
  else window.LEADBOX = {};

  LEADBOX.debugging = window.location && String(window.location.hash) === '#debugging';

  // Utilities //

  function getSize(callback) {
    var body = window.document.body,
      doc = window.document.documentElement,
      documentWidth = Math.max(body.scrollWidth, doc.scrollWidth,
        body.offsetWidth, doc.offsetWidth,
        doc.clientWidth),
      documentHeight = Math.max(body.scrollHeight, doc.scrollHeight,
        body.offsetHeight, doc.offsetHeight,
        doc.clientHeight),
      viewportWidth = window.innerWidth || doc.clientWidth ||
      body.clientWidth,
      viewportHeight = window.innerHeight || doc.clientWidth ||
      body.clientWidth;

    // FB.Canvas may be defined because the host page is using the FB
    // JS API, but it will never trigger the callback because the page
    // is not hosted inside Facebook. As such, we give it 100ms to
    // trigger the callback, and if it doesn't, we'll just use the
    // default (non-facebook) values
    var workaround = window.setTimeout(function() {
      workaround = null;
        window.clearTimeout(workaround);
      callback(documentWidth, documentHeight, viewportWidth,
        viewportHeight);
    }, 100);
    if (typeof FB != "undefined" && FB.Canvas) {
      FB.Canvas.getPageInfo(function(info) {
        if (workaround == null)
          return; // too late
        window.clearTimeout(workaround);
        workaround = null;

        if (info.clientWidth - info.offsetLeft < viewportWidth)
          viewportWidth = info.clientWidth - info.offsetLeft;
        if (info.clientHeight - info.offsetTop < viewportHeight)
          viewportHeight = info.clientHeight - info.offsetTop;
        callback(documentWidth, documentHeight, viewportWidth,
          viewportHeight);
      });
    }
  }

  function getScroll(callback) {
    var doc = document.documentElement,
      body = document.body,
      left = doc && doc.scrollLeft || body && body.scrollLeft || 0,
      top = doc && doc.scrollTop || body && body.scrollTop || 0;

    // FB.Canvas may be defined because the host page is using the FB
    // JS API, but it will never trigger the callback because the page
    // is not hosted inside Facebook. As such, we give it 100ms to
    // trigger the callback, and if it doesn't, we'll just use the
    // default (non-facebook) values
    var workaround = window.setTimeout(function() {
      workaround = null;
      callback(left, top, 0, 0);
    }, 100);

    if (typeof FB != "undefined" && FB.Canvas) {
      FB.Canvas.getPageInfo(function(info) {
        if (workaround == null)
          return; // too late
        window.clearTimeout(workaround);
        workaround = null;

        callback(left, top, info.scrollLeft, info.scrollTop);
      });
    }
  }

  function setScroll(left, top, fb_left, fb_top) {
    window.scrollTo(left, top);
    if (typeof FB != "undefined" && FB.Canvas) {
      FB.Canvas.scrollTo(fb_left, fb_top);
    }
  }

  function forEach(array, block, scope) {
    var set = array.slice(0);
    for (var i = 0, n = array.length; i < n; i++) {
      if (false === block.call(scope, set[i], i)) return false;
    }
    return true;
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

  function addInterval(block, delay) {
    var interval = {
      id: null,
      loop: null,
      delay: delay,
      block: block
    };
    interval.loop = function() {
      interval.block();
      interval.id = setTimeout(interval.loop, interval.delay);
      return interval;
    };
    return interval.loop();
  }

  function getIntersection(aStart, aEnd, bStart, bEnd) {

    var i = {};

    var aDelta = {
      x: aEnd.x - aStart.x,
      y: aEnd.y - aStart.y
    };

    var bDelta = {
      x: bEnd.x - bStart.x,
      y: bEnd.y - bStart.y
    };

    var s = (-aDelta.y * (aStart.x - bStart.x) + aDelta.x * (aStart.y - bStart.y)) / (-bDelta.x * aDelta.y + aDelta.x * bDelta.y);
    var t = (bDelta.x * (aStart.y - bStart.y) - bDelta.y * (aStart.x - bStart.x)) / (-bDelta.x * aDelta.y + aDelta.x * bDelta.y);


    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
      i.x = aStart.x + (t * aDelta.x);
      i.y = aStart.y + (t * aDelta.y);
      return i;
    }

    return null;
  }

  var LeadBoxes = function() {

    var leadboxes = {};
    var background = document.createElement("div");

    background.style.position = "absolute";
    background.style.top = background.style.bottom = 
    background.style.left = background.style.right = "0";
    // background.style.bottom = background.style.bottom = 
    // background.style.right = background.style.right = "20";
    background.style.zIndex = "2147483646";
    background.style.background = "black";
    background.style.width = "100%";
    // background.style.width = "100px";
    // background.style.height = "100px";
    background.style.opacity = "0.5";
    background.style.display = "none";
    // document.body.appendChild(background);

    function init(id, url, stats) {
      console.log('init', id, url);
      var config = {};

      if (leadboxes[id]) return; // leadbox already initialized

      // We need to use this to track whether or not the LeadBox
      // was actually loaded through JS execution or not. This
      // is so we can prevent it from double tracking the view
      // event.
      if (url[url.length - 1] !== "&") {
        url += "&";
      }

      url += "__fromjs=1";

      if (typeof window.postMessage == "undefined" ||
        /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        // mobile device or IE7-; redirect to form
        leadboxes[id] = [url, stats, config];
      } else {
        // desktop; open iframe in popup window
				console.log('url', url);
        leadboxes[id] = [document.createElement("iframe"), stats, config];
        leadboxes[id][0].src = url.replace("lp-in-iframe=0",
          "lp-in-iframe=1");
        leadboxes[id][0].style.position = "absolute";
        leadboxes[id][0].style.left = "0";
        leadboxes[id][0].style.top = "0";
        // leadboxes[id][0].style.width = "auto";
        leadboxes[id][0].style.display = "none";
        leadboxes[id][0].style.border = "none";
        leadboxes[id][0].style.zIndex = "2147483647";

        leadboxes[id][0].onload = function() {
          if (window.LEADBOX.debugging) {
            if (window.console && console.log) console.log('resetting leadbox', id);
            leadboxes[id][0].contentWindow.postMessage({
              handler: 'reset',
              data: {
                id: id
              }
            }, '*');
          }
          var msg = JSON.stringify({
            handler: 'visit',
            visit: {
              id: id
            }
          })
          leadboxes[id][0].contentWindow.postMessage(msg, '*');
          leadboxes[id][0].onload = null;
        };

        document.body.appendChild(leadboxes[id][0]);

        getSize(function(documentWidth, documentHeight, width, height) {
          console.log('getSize.height', height);
          console.log('getSize.width', width);
          // leadboxes[id][0].style.height = height + "px";
          // leadboxes[id][0].style.width = 100 + "px";
        });
      }
    }

    function initBadge(id, url, stats) {
      console.log('init', id, url);
      var config = {};

      if (leadboxes[id]) return; // leadbox already initialized

      // We need to use this to track whether or not the LeadBox
      // was actually loaded through JS execution or not. This
      // is so we can prevent it from double tracking the view
      // event.
      if (url[url.length - 1] !== "&") {
        url += "&";
      }

      url += "__fromjs=1";

      if (typeof window.postMessage == "undefined" ||
        /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        // mobile device or IE7-; redirect to form
        leadboxes[id] = [url, stats, config];
      } else {
        // desktop; open iframe in popup window
				console.log('url', url);
        leadboxes[id] = [document.createElement("iframe"), stats, config];
        leadboxes[id][0].src = url.replace("lp-in-iframe=0",
          "lp-in-iframe=1");
        leadboxes[id][0].style.position = "fixed";
        leadboxes[id][0].style.right = "0";
        leadboxes[id][0].style.bottom = "0";
        leadboxes[id][0].style.width = "60px";
        leadboxes[id][0].style.height = "60px";
        leadboxes[id][0].style.display = "none";
        leadboxes[id][0].style.border = "none";
        leadboxes[id][0].style.zIndex = "2147483647";

        leadboxes[id][0].onload = function() {
          if (window.LEADBOX.debugging) {
            if (window.console && console.log) console.log('resetting leadbox', id);
            leadboxes[id][0].contentWindow.postMessage({
              handler: 'reset',
              data: {
                id: id
              }
            }, '*');
          }
          var msg = JSON.stringify({
            handler: 'visit',
            visit: {
              id: id
            }
          })
          leadboxes[id][0].contentWindow.postMessage(msg, '*');
          leadboxes[id][0].onload = null;
        };

        document.body.appendChild(leadboxes[id][0]);

        getSize(function(documentWidth, documentHeight, width, height) {
          console.log('getSize.height', height);
          console.log('getSize.width', width);
          // leadboxes[id][0].style.height = height + "px";
          // leadboxes[id][0].style.height = 100 + "px";
        });
      }
    }

    var active = null,
      overflow = null;

    // hides the most recently shown leadbox
    function hide() {
      if (!active) return;

      // hide frame
      leadboxes[active][0].style.display = "none";
      background.style.display = "none";
      active = null;

      // restore scroll position and scrolling settings
      document.body.style.overflow = overflow;
      overflow = null;
    }
    background.onclick = hide;

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
    function show(id, cb) {
      console.log('preparing id', id);
      console.log("XXX RSKdebug: leadbox.js show(), notifying analytics");
      //XXX RSKdebug: This seems like the place we should be calling window.center('send', 'open', 'leadbox')
      //XXX RSKdebug: This code does NOT appear to be used for ordinary popup forms on a Leadpage...?  Is this used ANYWHERE?  form.js definitely is...
      if (window.center) {
        console.log("XXX RSKdebug: leadbox.js calling window.center('send', 'open', 'leadbox')");
        window.center('send', 'open', 'leadbox');
      } else {
        console.warn("window.center is undefined in leadbox.js, isn't leadpage.js loaded?");
      }

      // call analytics
      var util = new CookieUtil();
      var pixel_name = 'tinylead_pixel';

      var uid = uuid();
      console.log('TEST1', leadboxes, id);
      var url = leadboxes[id][1] + "?";
      var data = {
        "id": id,
        "uuid": uid,
        "type": "view",
        "served_by": "leadboxes"
      };


      if(!util.get(pixel_name)) {
        util.set('tinylead_pixel', uid, {
          path: '/',
          expires: 10
          // domain: 'tinylead-api.ngrok.io'
        });
      }

      console.log('data', data);

      for (var key in data) {
        if (data[key] !== undefined) {
          url += encodeURIComponent(key) + "=" +
            encodeURIComponent(data[key]) + "&";
        }
      }

      var image = document.createElement("img");
      if (typeof leadboxes[id][0] == "string") {
        // Replace fromjs=1 with fromjs=0 in order to force
        // view event tracking to happen on the backend in
        // cases where we open the leadbox in a new tab. This
        // is so that we track subsequent views as well should
        // the user re-visit the page later.
        var lbURL = leadboxes[id][0].replace("__fromjs=1", "__fromjs=0");
				console.log('lbURL', lbURL);

        // Open this LeadBox in a new tab. This is the
        // expected behavior on mobile devices.
        window.open(lbURL, "_blank");
      } else {
        getScroll(function(left, top, fbLeft, fbTop) {
          // hide previous leadbox, if any
          hide();
					console.log('scrolling');

          // get scroll position and body overflow settings
          overflow = document.body.style.overflow;

          setScroll(left, top, fbLeft, fbTop);
          document.body.style.overflow = "hidden";

          // show leadbox and update active leadbox reference
          leadboxes[id][0].style.top = (top + fbTop) + "px";
          // leadboxes[id][0].style.left = (left + fbLeft) + "px";
          leadboxes[id][0].style.left = leadboxes[id][0].style.width + "px";
          leadboxes[id][0].style.display = "block";
          background.style.display = "block";
          active = id;
          if (cb) cb();

          // call analytics handler
          image.src = url;
        });
      }
    }

    function badge(id, cb) {
      console.log('preparing id', id);
      console.log("XXX RSKdebug: leadbox.js show(), notifying analytics");
      //XXX RSKdebug: This seems like the place we should be calling window.center('send', 'open', 'leadbox')
      //XXX RSKdebug: This code does NOT appear to be used for ordinary popup forms on a Leadpage...?  Is this used ANYWHERE?  form.js definitely is...
      if (window.center) {
        console.log("XXX RSKdebug: leadbox.js calling window.center('send', 'open', 'leadbox')");
        window.center('send', 'open', 'leadbox');
      } else {
        console.warn("window.center is undefined in leadbox.js, isn't leadpage.js loaded?");
      }

      // call analytics
      var util = new CookieUtil();
      var pixel_name = 'tinylead_pixel';

      var uid = uuid();
      var url = leadboxes[id][1] + "?";
      var data = {
        "id": id,
        "uuid": uid,
        "type": "view",
        "served_by": "leadboxes"
      };


      if(!util.get(pixel_name)) {
        util.set('tinylead_pixel', uid, {
          path: '/',
          expires: 10
          // domain: 'tinylead-api.ngrok.io'
        });
      }

      console.log('data', data);

      for (var key in data) {
        if (data[key] !== undefined) {
          url += encodeURIComponent(key) + "=" +
            encodeURIComponent(data[key]) + "&";
        }
      }

      var image = document.createElement("img");
      if (typeof leadboxes[id][0] == "string") {
        // Replace fromjs=1 with fromjs=0 in order to force
        // view event tracking to happen on the backend in
        // cases where we open the leadbox in a new tab. This
        // is so that we track subsequent views as well should
        // the user re-visit the page later.
        var lbURL = leadboxes[id][0].replace("__fromjs=1", "__fromjs=0");
				console.log('lbURL', lbURL);

        // Open this LeadBox in a new tab. This is the
        // expected behavior on mobile devices.
        window.open(lbURL, "_blank");
      } else {
        getScroll(function(left, top, fbLeft, fbTop) {
          // hide previous leadbox, if any
          hide();
					console.log('scrolling badge');

          // get scroll position and body overflow settings
          overflow = document.body.style.overflow;

          setScroll(left, top, fbLeft, fbTop);
          // document.body.style.overflow = "hidden";

          // show leadbox and update active leadbox reference
          leadboxes[id][0].style.bottom = 20 + "px";
          leadboxes[id][0].style.right = 20 + "px";
          leadboxes[id][0].style.display = "block";
          background.style.display = "block";
          active = id;
          if (cb) cb();

          // call analytics handler
          image.src = url;
        });
      }
    }    

    // called when the leadbox should be resized
    this.resize = function() {
      getSize(function(documentWidth, documentHeight, width, height) {
        background.style.height = documentHeight + "px";
        for (var id in leadboxes) {
          if (typeof(leadboxes[id][0]) == "string")
            continue;
          // leadboxes[id][0].style.height = height + "px";
          // leadboxes[id][0].style.height = 100 + "px";
        }
      });
    };

    var onMessageHandler = function(event) {
      if (event && event.data && event.data.handler) switch (event.data.handler) {
        case 'visited':
          // console.log('visited', event.data);
          var id = event.data.visit.id;
          var config = leadboxes[id][2] || {};
          var visit = event.data.visit;

          // console.log('visited ->', config, event.data.visit)

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
                window.LEADBOX.show(id);
              }
            }, timeout);
          }
          if (config.exit) {
            var exit = config.exit;
            show = true;
            if (exit.days) show = show && exit.days < day;
            if (show) exitor = id;
            // console.log('exit', config.exit, new Date(visit['display-date']));
          }
          break;
        case 'displayed':
          break;
      }
      if (event.data == "close") hide();
      if (event.data && event.data.type == "resize") {
        console.log('HELLO RESIZED', event.data);
        // background.style.width = event.data.value.width + "px";
        // for (var id in leadboxes) {
        //   if (typeof(leadboxes[id][0]) == "string")
        //     continue;
          leadboxes['plugins/signup_default/banner'][0].style.width = event.data.value.width + 30 + "px";
          leadboxes['plugins/signup_default/banner'][0].style.height = event.data.value.height + 30 + "px";
          getSize(function(dW, dH, vW, vH) {
            console.log('dW', dW);
            leadboxes['plugins/signup_default/banner'][0].style.left = ((dW - parseInt(leadboxes['plugins/signup_default/banner'][0].style.width))/2)  + "px";
            console.log('new left', leadboxes['plugins/signup_default/banner'][0].style.left );
          });
        // }
        // alert('resize');
      }
      if(event.data && event.data.type === 'hellobadge') {
        console.log('BADGE CLICKED', event.data);
        // showFancyImage();
        // window.parent.show('plugins/signup_default/banner');
            var timeout = (1 * 1000) || 0;
        // setTimeout(function() {
          // if (safetyCheck) {
            console.log('window', window.LEADBOX);
            // window.showFancyLeadboxes()
            var background = document.createElement("div");

            background.style.position = "absolute";
            background.style.top = background.style.bottom = 
            background.style.left = background.style.right = "0";
            // background.style.bottom = background.style.bottom = 
            // background.style.right = background.style.right = "20";
            background.style.zIndex = "2147483646";
            background.style.background = "black";
            background.style.width = "100%";
            // background.style.width = "100px";
            // background.style.height = "100px";
            background.style.opacity = "0.5";
            background.style.display = "block";
            document.body.appendChild(background);

            init('plugins/signup_default/banner', '/static/leadbox/tests/plugins/signup_default/banner.html?', null);
            window.LEADBOX.show('plugins/signup_default/banner');
            // window.LEADBOX.show('plugins/signup_default/banner');
          // }
        // }, timeout)        
      }
    };

    // setup leadbox close handlers
    window.formFrameClosed = hide;

    // setup leadbox window handlers
    addEvent(window, 'message', onMessageHandler);

    // public controller
    window.LEADBOX.reset = function(id) {
      var key;
      for (key in leadboxes) {};
      if (leadboxes && leadboxes[key]) {
        leadboxes[key][0].contentWindow.postMessage({
          'handler': 'reset',
          'data': {
            id: id
          }
        }, '*');
      }
    };
    window.LEADBOX.badge = function(id) {
      console.log('show?', id)

      // id = match[2] = decodeURIComponent(match[2]);
      var url = '/static/leadbox/tests/' + id + '.html';
      initBadge(id, // form-id
        url + // iframe url
        ((url.indexOf("?") == -1) ? "?" : "&") + // query separator
        "lp-in-iframe=0&" + // position fix
        window.location.search.replace(/^\?/, ""), // prepopulation
        "/static/forms/pixel/global/index.html"); // analytics url --- CHANGE TO '/'
      
      console.log('all leadboxes', leadboxes);
      console.log('post')
      leadboxes[id][0].contentWindow.postMessage({
        handler: 'display',
        display: {
          id: id
        }
      }, '*');
      badge(id, function() {
        activating = null;
        // console.log('shown.', id);
      });
    };
    window.LEADBOX.hide = function() {
      hide();
    };

    window.LEADBOX.show = function(id, cb) {
      show(id, cb);
    };

    if (window.LEADBOX && window.LEADBOX.debugging) {
      if (window.console && console.log) console.log('debugging detected, resetting active leadboxes');
      // window.location.hash = 'debugged';
    }

  };

  var load = function() {
    if (!window.ae417310535411e38f960800200c9a66)
      window.ae417310535411e38f960800200c9a66 = new LeadBoxes();
    // window.ae417310535411e38f960800200c9a66.resize();
  };

  // bind to 'load' and 'resize' (standards)
  if (window.addEventListener) {
    window.addEventListener("load", load);
    window.addEventListener("resize", load);
    // speed-up load where possible
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
  var debugblock = window.location && String(window.location.hash) === '#debugblock';
  if (debugblock) {
    safetyCheck = false;
    return;
  }

  var safetyUrl = '/static/can-i-show.js'; ////my.leadpages.net/static/all/js/can-i-show.js
  var getSegment = function(url) {
    var segments = url.split('/');
		console.log('segments', segments);
    if (!~segments[0].indexOf('http')) {
      safetyUrl = '' + segments[0] + '/static/can-i-show.js';
    } else {
      safetyUrl = '//' + segments[2] + '/static/can-i-show.js';
    }
		console.log('safetyUrl', safetyUrl);
    return safetyUrl;
  };
  if (document.currentScript) {
    safetyUrl = getSegment(document.currentScript.src);
    var site_id = document.currentScript.getAttribute('data-site-id');
		console.log('safetyUrl2', safetyUrl);
		console.log('site_id', site_id);
    var is_mobile = navigator.userAgent.match(/(iPhone)|(iPad)|(android)|(webOS)/i);
    safetyUrl += '?site_id=' + site_id + '&referer=' + encodeURIComponent(document.referrer) + '&is_mobile=' + (is_mobile ? 1 : 0);
  }

  // var img = document.createElement('img');
  // img.src = '//tinylead-api.ngrok.io/v1/pixel';
  // document.getElementsByTagName('body')[0].appendChild(img);
  
  var script = document.createElement('script');
  script.src = safetyUrl;
  document.getElementsByTagName('head')[0].appendChild(script);
})();