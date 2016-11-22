(function () {
  var PopUpDelivery = function () {
    var options = {}
    var leadboxes = {}
    var background = null

    function addEvent (object, type, handler) {
      var method
      if (object && type && handler) {
        method = object.addEventListener ? 'addEventListener' : object.attachEvent ? 'attachEvent' : ''
        type = method === 'addEventListener' ? type : 'on' + type
        if (method) {
          object[method](type, function (event) {
            event = event || window.event
            handler.apply(object, [event])
          })
          return true
        }
      }
      return false
    }

    function hide (id) {
      id = id || (getToolByType('signup') || getToolByType('coupon'))
      if (options.demo) {
        id = getToolByType('reminder') || id
      }
      if (!id) return

      // hide frame
      if (leadboxes[id]) {
        leadboxes[id].style.display = 'none'
        delete leadboxes[id]
      }

      if (background) {
        background.style.display = 'none'
      }

      if (options.events && options.events.onClose) {
        options.events.onClose()
      }
    }

    function showBackground () {
      background = document.createElement('div')
      if (options.anchor) {
        background.style.position = 'absolute'
      } else {
        background.style.position = 'fixed'
      }
      background.style.top = background.style.bottom = background.style.left = background.style.right = '0'
      background.style.zIndex = '2147483646'
      background.style.background = 'black'
      background.style.width = '100%'
      background.style.opacity = '0.5'
      background.style.display = 'block'

      background.onclick = function () {
        hide()
      }

      if (options.anchor) {
        document.getElementById(options.anchor).appendChild(background)
      } else {
        document.body.appendChild(background)
      }
    }

    function initTool (params) {
      var id = params.app_id

      if (leadboxes[id]) {
        return
      }

      var url = 'https://s3.amazonaws.com/popupdelivery/apps/' + params.app_id + '.html?cookie_id=' + getCookie('pd_pixel') + '&site_id=' + params.site_id + '&ts=' + new Date().valueOf()
      if (options.demo && options.app_id) {
        url = (options.env === 'dev' ? 'http://localhost:3000' : 'https://api.popupdelivery.com') + '/api/preview?app_id=' + options.app_id + '&demo=1' + (options.demo_open ? '&demo_open=' + options.demo_open : '') + (options.language ? '&language=' + options.language : '') + (options.env === 'dev' ? '&env=dev' : '')
      }

      leadboxes[id] = document.createElement('iframe')
      leadboxes[id].app_id = params.app_id
      leadboxes[id].app_type = params.app_type
      leadboxes[id].src = url
      leadboxes[id].style.display = 'block'

      if (params.app_type === 'reminder') {
        leadboxes[id].scrolling = 'no'
        if (options.anchor) {
          leadboxes[id].style.position = 'absolute'
        } else {
          leadboxes[id].style.position = 'fixed'
        }
        leadboxes[id].style.overflow = 'hidden'
        leadboxes[id].style.width = '100%'
        leadboxes[id].style.height = '0'
        leadboxes[id].style.left = '0'
        leadboxes[id].style.right = '0'
        leadboxes[id].style.bottom = '0'
        leadboxes[id].style.display = 'block'
        leadboxes[id].style.border = 'none'
        leadboxes[id].style.zIndex = '2147483647'

        leadboxes[id].onload = function () {
          leadboxes[id].onload = null
          if (options.bg) {
            showBackground()
          }
          if (options.events && options.events.onLoad) {
            options.events.onLoad()
          }
        }
      } else {
        if (options.anchor) {
          leadboxes[id].style.position = 'absolute'
        } else {
          leadboxes[id].style.position = 'fixed'
        }
        leadboxes[id].style.overflow = 'hidden'
        leadboxes[id].style.left = '-99999px'
        leadboxes[id].style.top = '50%'
        leadboxes[id].style.width = params.width + 'px'
        leadboxes[id].style.origWidth = params.width + 'px'
        leadboxes[id].style.border = 'none'
        leadboxes[id].style.zIndex = '2147483647'
        leadboxes[id].scrolling = 'no'

        leadboxes[id].onload = function () {
          leadboxes[id].onload = null
          showBackground()
          if (options.events) {
            if (options.events.onLoad) {
              options.events.onLoad()
            }
            if (options.events.onOpen) {
              options.events.onOpen()
            }
          }
        }
      }

      if (options.anchor) {
        document.getElementById(options.anchor).appendChild(leadboxes[id])
      } else {
        document.body.appendChild(leadboxes[id])
      }
    }

    // generates a v4 uuid
    function uuid () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = ((new Date())
          .getTime() + Math.random() * 16) % 16 | 0
        return (c === 'x' ? r : (r & 0x7 | 0x8))
          .toString(16)
      })
    }

    function tinyLeadGetSize (callback) {
      var body = options.anchor ? document.getElementById(options.anchor) : window.document.body
      var doc = window.document.documentElement
      var documentWidth = Math.max(body.scrollWidth, doc.scrollWidth, body.offsetWidth, doc.offsetWidth, doc.clientWidth)
      var documentHeight = Math.max(body.scrollHeight, doc.scrollHeight, body.offsetHeight, doc.offsetHeight, doc.clientHeight)
      var viewportWidth = window.innerWidth || doc.clientWidth || body.clientWidth
      var viewportHeight = window.innerHeight || doc.clientWidth || body.clientWidth
      if (options.anchor) {
        viewportWidth = body.clientWidth
      }

      var workaround = window.setTimeout(function () {
        workaround = null
        window.clearTimeout(workaround)
        callback(documentWidth, documentHeight, viewportWidth, viewportHeight)
      }, 100)
    }

    function setupPixel () {
      // call analytics
      var pixelName = 'pd_pixel'
      var uid = uuid()

      if (!getCookie(pixelName)) {
        setCookie(pixelName, uid, {
          path: '/',
          expires: 730
        })
      }
    }

    function getCookie (key) {
      if (!key) {
        return
      }
      var cs = document.cookie.split(';')
      var holder = {}
      var c, name, value, result, i, l
      for (i = 0, l = cs.length; i < l; i++) {
        c = cs[i].replace(/ /g, '').split('=')
        name = c[0]
        value = c[1]
        holder[name] = value
      }
      switch (true) {
        case key instanceof RegExp:
          result = {}
          for (i in holder) {
            if (holder.hasOwnProperty(i) && key.test(i)) {
              result[i] = holder[i]
            }
          }
          break
        case typeof key === 'string':
          result = holder[key]
          break
        default:
          result = null
      }
      return result
    }

    function setCookie (key, value, opt) {
      if (!key || value === undefined) {
        return
      }
      var expires
      opt = opt || {}
      if (typeof opt.expires === 'number') {
        var days = opt.expires
        var time = new Date()
        time.setDate(time.getDate() + days)
        expires = time.toUTCString()
      }
      value = value.toString()
      return (document.cookie = [
        encodeURIComponent(key), '=', encodeURIComponent(value),
        expires ? '; expires=' + expires : '',
        opt.path ? '; path=' + opt.path : '',
        opt.domain ? '; domain=' + opt.domain : '',
        opt.secure ? '; secure' : ''
      ].join(''))
    }

    function uuidFs () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = ((new Date())
          .getTime() + Math.random() * 16) % 16 | 0
        return (c === 'x' ? r : (r & 0x7 | 0x8))
          .toString(16)
      })
    }

    function setUpCookie () {
      if (!getCookie('pd_pixel')) {
        setCookie('pd_pixel', uuidFs(), {
          path: '/',
          expires: 730
        })
      }
    }

    function serialize (obj) {
      var str = []
      obj = obj || {}
      for (var p in obj) {
        if (obj.hasOwnProperty(p) && (obj[p] || '').toString() !== '') {
          str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]))
        }
      }
      return str.join('&')
    }

    function apiCall () {
      var safetyUrl = (options.env === 'dev' ? 'http://localhost:3000' : 'https://api.popupdelivery.com') + '/api/delivery'

      var isMobile = navigator.userAgent.match(/(iPhone)|(iPad)|(android)|(webOS)/i)
      var lang = window.navigator.languages ? window.navigator.languages[0] : null
      lang = lang || window.navigator.language || window.navigator.browserLanguage || window.navigator.userLanguage

      if (lang.indexOf('-') !== -1) {
        lang = lang.split('-')[0]
      }

      if (lang.indexOf('_') !== -1) {
        lang = lang.split('_')[0]
      }

      var attrs = {
        cookie_id: getCookie('pd_pixel'),
        site_id: options.site_id,
        referer: document.referrer,
        is_mobile: options.isMobile || isMobile ? 1 : 0,
        language: options.language || lang,
        email: options.email || ''
      }

      var skip = ['events']

      for (var i in options) {
        if (skip.indexOf(i) < 0 && !attrs.hasOwnProperty(i)) {
          attrs[i] = options[i]
        }
      }

      if (attrs.demo && !attrs.app_id) {
        return
      }

      safetyUrl += '?' + serialize(attrs)

      var script = document.createElement('script')
      script.src = safetyUrl
      document.getElementsByTagName('head')[0].appendChild(script)
    }

    function extendOptions (o) {
      for (var i in o) {
        options[i] = o[i]
      }
    }

    function show (o) {
      setupPixel()
      initTool(o)
    }

    function sendMessage (action, o) {
      try {
        if (leadboxes[o.app_id]) {
          leadboxes[o.app_id].contentWindow.postMessage({type: action, value: o}, '*')
        }
      } catch (e) {
        if (leadboxes[o.app_id]) {
          leadboxes[o.app_id].contentWindow.postMessage({type: action, value: o}, '*')
        }
      }
    }

    this.getVisitorId = function () {
      return getCookie('pd_pixel')
    }

    this.run = function (action, o) {
      extendOptions(o)
      options.action = action
      switch (action) {
        case 'reload':
          sendMessage(action, o)
          break
        case 'close_reminder':
          sendMessage(action, o)
          if (options.events && options.events.onClose) {
            options.events.onClose()
          }
          break
        case 'open_reminder':
          sendMessage(action, o)
          if (options.events && options.events.onOpen) {
            options.events.onOpen()
          }
          break
        case 'hide':
          hide(o.app_id)
          break
        case 'show':
          show(o)
          break
        case 'update':
          apiCall()
          break
        case 'boot':
          apiCall()
          break
        default:
          return
      }
    }

    this.tinyLeadGetPosition = function (e, cb) {
      var posx = 0
      var posy = 0

      e = e || window.event

      if (e.pageX || e.pageY) {
        posx = e.pageX
        posy = e.pageY - document.body.scrollTop - document.documentElement.scrollTop
      } else if (e.clientX || e.clientY) {
        posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft
        posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop
      }

      if (posy < 100) {
        return cb()
      }

      return {
        x: posx,
        y: posy
      }
    }

    this.resize = function () {
      tinyLeadGetSize(function (documentWidth, documentHeight, width, height) {
        for (var o in leadboxes) {
          resizeTool(leadboxes[o])
        }
      })
    }

    this.hide = hide

    this.boot = function () {
      setUpCookie()

      this.run('boot', window.popupDeliverySettings || {})
    }

    function getToolByType (appType) {
      for (var o in leadboxes) {
        if (leadboxes[o].app_type === appType) {
          return o
        }
      }
      return
    }

    function openReminder (o) {
      tinyLeadGetSize(function (documentWidth, documentHeight, width, height) {
        var id = o.app_id || getToolByType('reminder')
        leadboxes[id].style.width = width + 'px'
        leadboxes[id].style.height = o.height + 'px'
        leadboxes[id].style.right = '0'
      })
    }

    function closeReminder (o) {
      var id = o.app_id || getToolByType('reminder')
      leadboxes[id].style.width = '100%'
      leadboxes[id].style.height = o.height + 'px'
      leadboxes[id].style.right = '0'
    }

    function resizeTool (o) {
      var id
      tinyLeadGetSize(function (documentWidth, documentHeight, width, height) {
        if (o.app_type === 'reminder') {
          id = o.app_id || getToolByType('reminder')
          if (id) {
            leadboxes[id].style.width = width + 'px'
            leadboxes[id].style.height = o.height + 'px'
            leadboxes[id].style.bottom = 0
            leadboxes[id].style.right = 0
          }
        } else {
          id = o.app_id || (getToolByType('signup') || getToolByType('coupon'))
          if (id) {
            if (width < parseInt(leadboxes[id].style.origWidth)) {
              leadboxes[id].style.width = width + 'px'
              leadboxes[id].style.minWidth = width + 'px'
            } else {
              leadboxes[id].style.width = leadboxes[id].style.origWidth
              leadboxes[id].style.minWidth = leadboxes[id].style.origWidth
            }
            leadboxes[id].style.top = '50%'
            leadboxes[id].style.height = (o.style ? parseInt(o.style.height) : o.height) + 'px'
            leadboxes[id].style.marginTop = -((parseInt(leadboxes[id].style.height)) / 2) + 'px'
            leadboxes[id].style.left = '50%'
            leadboxes[id].style.marginLeft = -((parseInt(leadboxes[id].style.width)) / 2) + 'px'
            leadboxes[id].style.display = 'block'
          }
        }
      })
    }

    var onMessageHandler = function (event) {
      if (event.data && event.data.type === 'open_reminder') {
        openReminder(event.data.value)
      }
      if (event.data && event.data.type === 'close_reminder') {
        closeReminder(event.data.value)
      }
      if (event.data && event.data.type === 'loaded') {
        resizeTool(event.data.value)
      }
      if (event.data && event.data.type === 'hide') {
        hide(event.data.value.app_id)
      }
      if (event.data && event.data.type === 'submited') {
        if (options.events && options.events.onSubmit) {
          options.events.onSubmit()
        }
      }
    }

    // setup window handlers
    addEvent(window, 'message', onMessageHandler)
  }

  function resized () {
    if (window.PopUpDelivery) {
      window.PopUpDelivery.resize()
    }
  }

  if (window.addEventListener) {
    window.addEventListener('resize', resized)
  } else if (window.attachEvent) {
    // tender love & care for internet explorer
    window.attachEvent('onresize', resized)
  } else {
    var oldResize = window.onresize

    window.onresize = function (e) {
      resized()
      if (typeof oldResize === 'function') {
        oldResize(e)
      }
    }
  }

  if (!window.PopUpDelivery) {
    window.PopUpDelivery = new PopUpDelivery()
    window.PopUpDelivery.boot()
  }
})()
