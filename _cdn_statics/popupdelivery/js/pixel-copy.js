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


  function forEach(array, block, scope) {
  	var set = array.slice(0);
  	for (var i = 0, n = array.length; i < n; i++) {
  		if (false === block.call(scope, set[i], i)) return false;
  	}
  	return true;
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

  var MouseTracker = (function(debugging) {

  	// get a handle on our environment

  	var left = navigator.platform.match(/(Mac|iPhone|iPod|iPad)/i) ? 1 : 0;

  	// define the button area location

  	var buttonWidth = 350;
  	var buttonHeight = 50;
  	var chromeHeight = 0;

  	// how far ahead to anticipate mouse movement
  	var seconds = 1 / 4;

  	// how sure to be they're going for the button
  	var sureness = 1; // (0+)

  	// account for user aim
  	var userVariance = 150;

  	var size = this.size = {
  		x: null,
  		y: null
  	};
  	var history = this.history = {
  		x: null,
  		y: null
  	};
  	var position = this.position = {
  		x: null,
  		y: null
  	};
  	var prediction = this.prediction = {
  		x: null,
  		y: null
  	};
  	var velocity = this.velocity = {
  		x: 0,
  		y: 0
  	};

  	var axis = {
  		'x': 'y',
  		'y': 'x'
  	};
  	var count = 0;
  	var delay = 100;
  	var sure = 0;
  	var ready = false;
  	var past = [];
  	var back = 3;

  	var canvas = document && document.documentElement ? document.documentElement : document.body;

  	if (debugging) {
  		document.documentElement.style.cursor = 'none';
  		document.body.style.cursor = 'none';
  	}

  	function updateSize(event) {
  		getSize(function(dw, dh, width, height) {
  			size.x = width;
  			size.y = height;
  		});
  	}

  	function clearPosition(event) {
  		position.x = null;
  		position.y = null;
  	}

  	function updatePosition(event) {
  		if (event) {
  			position.x = event.clientX;
  			position.y = event.clientY;
  		}

  		if (debugging) {
  			var markers = document.getElementsByTagName('i');
  			var marker = markers && markers[0] ? markers[0] : document.createElement('i');

  			document.body.appendChild(marker);
  			// if (!next.x && !next.y) document.body.removeChild(marker);

  			marker.style.display = 'block';
  			marker.style.position = 'fixed';
  			marker.style.background = '#000';
  			marker.style.width = '6px';
  			marker.style.height = '6px';
  			marker.style.marginLeft = '-3px';
  			marker.style.marginTop = '-3px';
  			marker.style.left = '' + position.x + 'px';
  			marker.style.top = '' + position.y + 'px';
  			marker.style.cursor = 'none';
  			marker.style.zIndex = 101;
  		}

  	}

  	function updateVector() {

  		var anticipation = seconds * (1000 / delay);
  		var projection = {
  			x: position.x,
  			y: position.y
  		};

  		for (var a in axis) {
  			if (position[a] !== null) {
  				velocity[a] = history[a] !== null ? position[a] - history[a] : 0;
  				prediction[a] = position[a] + (velocity[a] * anticipation);
  				history[a] = position[a];
  			} else {
  				history[a] = position[a] = prediction[a] = null;
  			}
  		}

  		past = [{
  			x: velocity.x,
  			y: velocity.y
  		}].concat(past.slice(0, back));

  		var i = 0;
  		var average = {
  			x: 0,
  			y: 0
  		};
  		forEach(past, function(value, key) {
  			if (key < back) {
  				average.x = average.x + value.x;
  				average.y = average.y + value.y;
  				i++;
  			}
  		});
  		average.x = Math.round(average.x / i) * anticipation;
  		average.y = Math.round(average.y / i) * anticipation;
  		var next = {
  			x: position.x + average.x,
  			y: position.y + average.y
  		};

  		// show the predicted placement on the page

  		//if (debugging) {
  		var markers = document.getElementsByTagName('var');
  		var marker = markers && markers[0] ? markers[0] : document.createElement('var');

  		document.body.appendChild(marker);
  		if (!next.x && !next.y) document.body.removeChild(marker);
      if(next.y < 5) {
        console.log('pos', next.x, next.y);
      }

  		marker.style.display = 'block';
  		marker.style.position = 'fixed';
  		marker.style.background = '#AAA';
  		marker.style.width = '6px';
  		marker.style.height = '6px';
  		marker.style.marginLeft = '-3px';
  		marker.style.marginTop = '-3px';
  		marker.style.left = '' + next.x + 'px';
  		marker.style.top = '' + next.y + 'px';
  		marker.style.zIndex = 100;

  		//}

  		// estimate if we are going for the close buttons

  		getSize(function(dw, dh, vw, vh) {

  			// left = false; // for debugging

  			var closeStart = {
  				x: left ? 0 - userVariance : vw - buttonWidth - userVariance,
  				y: -1
  			};
  			var closeEnd = {
  				x: left ? 0 + buttonWidth + userVariance : vw + userVariance,
  				y: -1
  			};

  			var intersect = getIntersection(position, next, closeStart, closeEnd);

  			if (intersect) {
  				sure++;
  				// console.log(sure, new Date)
  				if (sure > sureness && !velocity.x && !velocity.y) {
  					// if (window.LEADBOX.debugging && window.console && console.log) console.log('exit detected');
  					if (exitor && safetyCheck) {
  						window.LEADBOX.show(exitor);
  						exitor = null;
  					}
  				}
  			} else {
  				sure = 0;
  			}
  		});

  	};

  	canvas.style.minHeight = '100%';

  	addEvent(canvas, 'mouseout', clearPosition); clearPosition();
  	addEvent(window, 'mouseout', clearPosition); clearPosition();
  	addEvent(canvas, 'mousemove', updatePosition);
  	updatePosition();
  	addEvent(window, 'resize', updateSize);
  	updateSize();

  	addInterval(updateVector, 100);
  });

  setTimeout(function() {
  	new MouseTracker()
  });