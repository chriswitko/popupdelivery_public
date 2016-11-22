var i18n = {}

i18n.en = {
  'n_email_html': 'Email',
  'n_email_placeholder': 'Enter your email address',
  'n_fullname_html': 'First & Last Name',
  'n_fullname_placeholder': 'Enter your first & last Name',
  'n_gender_html': 'Gender',
  'n_gender_male_html': 'Male',
  'n_gender_female_html': 'Female'
}

i18n.pl = {
  'n_email_html': 'E-mail',
  'n_email_placeholder': 'Wpisz swój adres email',
  'n_fullname_html': 'Imię i Nazwisko',
  'n_fullname_placeholder': 'Wpisz swoje imię i nazwisko',
  'n_gender_html': 'Płeć',
  'n_gender_male_html': 'Mężczyzna',
  'n_gender_female_html': 'Kobieta'
}

var lang = window.navigator.languages ? window.navigator.languages[0] : null
lang = lang || window.navigator.language || window.navigator.browserLanguage || window.navigator.userLanguage

if (lang.indexOf('-') !== -1) {
  lang = lang.split('-')[0]
}

if (lang.indexOf('_') !== -1) {
  lang = lang.split('_')[0]
}

lang = tinyLeadGetParameterByName('language') || lang
lang = i18n[lang] ? lang : 'en'

$('[i18n]').each(function (i, el) {
  if ($(el).attr('i18n').indexOf('_html') > -1) {
    $(el).html(i18n[lang][$(el).attr('i18n')])
  }
  if ($(el).attr('i18n').indexOf('_placeholder') > -1) {
    $(el).attr('placeholder', i18n[lang][$(el).attr('i18n')])
  }
})

var contentElement = document.getElementById('tinylead-content-wrapper')

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

function tinyLeadGetSize (callback) {
  var body = window.document.body
  var doc = window.document.documentElement
  var documentWidth = Math.max(body.scrollWidth, doc.scrollWidth, body.offsetWidth, doc.offsetWidth, doc.clientWidth)
  var documentHeight = Math.max(body.scrollHeight, doc.scrollHeight, body.offsetHeight, doc.offsetHeight, doc.clientHeight)
  var viewportWidth = window.innerWidth || doc.clientWidth || body.clientWidth
  var viewportHeight = window.innerHeight || doc.clientWidth || body.clientWidth

  var workaround = window.setTimeout(function () {
    workaround = null
    window.clearTimeout(workaround)
    callback(documentWidth, documentHeight, viewportWidth, viewportHeight)
  }, 100)
}

function sendMessage (action) {
  tinyLeadGetSize(function (documentWidth, documentHeight, viewportWidth, viewportHeight) {
    try {
      window.parent.postMessage({type: action, value: {app_id: '{{app._id}}', app_type: '{{app.app_type}}', modal_width: '{{#if app.design.width}}{{app.design.width}}px{{else}}600px{{/if}}', width: contentElement.clientWidth, height: documentHeight, action: action, has_hero: $('.lead-img').length}}, '*')
    } catch (e) {
      window.parent.postMessage({type: action, value: {app_id: '{{app._id}}', app_type: '{{app.app_type}}', modal_width: '{{#if app.design.width}}{{app.design.width}}px{{else}}600px{{/if}}', width: contentElement.clientWidth, height: documentHeight, action: action, has_hero: $('.lead-img').length}}, '*')
    }
  })
}

function refreshView (action) {
  sendMessage(action)
}

var onMessageHandler = function (event) {
  switch (event.data.type) {
    case 'reload':
      location.reload(false)
      break
    default:
      return
  }
}

// setup window handlers
addEvent(window, 'message', onMessageHandler)

var close = document.getElementsByClassName('close-button')

var closeThisApp = function () {
  try {
    if (window.parent) {
      window.parent.postMessage({type: 'hide', value: {app_id: '{{app._id}}'}}, '*')
    }
  } catch (e) {
    if (window.parent) {
      window.parent.postMessage({type: 'hide', value: {app_id: '{{app._id}}'}}, '*')
    }
  }
  return false
};

[].forEach.call(close, function (el) {
  el.onclick = function () {
    closeThisApp()
  }
})

function tinyLeadGetParameterByName (name, url) {
  if (!url) {
    url = location.href
  }
  name = name.replace(/[\[\]]/g, "\\$&")
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)")
  var results = regex.exec(url)
  if (!results) {
    return null
  }
  if (!results[2]) {
    return ''
  }
  return decodeURIComponent(results[2].replace(/\+/g, " "))
}

function sendData () {
  var f = {
    cookie_id: tinyLeadGetParameterByName('cookie_id'),
    app_id: '{{app._id}}',
    user_id: '{{app.user}}',
    site_id: tinyLeadGetParameterByName('site_id')
  }

  if ($('#email').val()) {
    f.email = $('#email').val()
  }
  if ($('#name').val()) {
    f.fullname = $('#name').val()
  }
  if ($('input:radio[name=gender]:checked').val()) {
    f.gender = $('input:radio[name=gender]:checked').val()
  }

  $.ajax({
    type: 'POST',
    url: 'https://api.popupdelivery.com/api/customers',
    data: f,
    success: function () {
      if (!tinyLeadGetParameterByName('demo')) {
        sendInsights('save')
        sendMessage('submited')
        closeThisApp()
      }
    }
  })
}

function sendInsights (action) {
  if (!action) {
    return
  }

  var f = {
    cookie_id: tinyLeadGetParameterByName('cookie_id'),
    app_id: '{{app._id}}',
    user_id: '{{app.user}}'
  }

  f.action = action

  $.ajax({
    type: 'POST',
    url: 'https://api.popupdelivery.com/api/insights',
    data: f
  })
}

function load () {
  refreshView('loaded')
}

$(window).load(function () {
  load()
  if (!tinyLeadGetParameterByName('demo')) {
    sendInsights('view')
  }
})
