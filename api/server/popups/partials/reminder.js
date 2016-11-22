var i18n = {}
i18n.en = {
  'reminder_title_html': 'Your recently viewed items and featured recommendations',
  'reminder_clear_all_html': 'Remove history',
  'reminder_missing_html': 'Find all your recently viewed products below.',
  'reminder_badge_html': 'Recently viewed',
  'reminder_prev_html': 'prev',
  'reminder_next_html': 'next',
  'reminder_tooltip_general_html': 'Click here to open',
  'reminder_demo_only_html': 'This is a demo only.'
}

i18n.pl = {
  'reminder_title_html': 'Twoje ostatnio przeglądane produkty i rekomendacje',
  'reminder_clear_all_html': 'Usuń historię',
  'reminder_missing_html': 'Tutaj znajdziesz ostatnio przeglądane produkty. Rozpocznij przeglądanie produktów naszym sklepie teraz.',
  'reminder_badge_html': 'Ostatnio przeglądane',
  'reminder_prev_html': 'poprzednie',
  'reminder_next_html': 'następne',
  'reminder_tooltip_general_html': 'Kliknij tutaj aby otworzyć',
  'reminder_demo_only_html': 'To jest podgląd testowy.'
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

var popper = null
var opened = false
var owl = $('#owl-demo')
var content = ''
var contentTotal = 0
var loaded = false
var itemWidth = 130
var contentElement = document.getElementById('tinylead-content-wrapper')
var reminderContent = document.getElementById('reminder_content')
var closeButton = document.getElementById('close-button')

$(document).ready(function () {
  $.fn.extend({
    animateCss: function (animationName) {
      var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend'
      $(this).addClass('animated ' + animationName).one(animationEnd, function () {
        $(this).removeClass('animated ' + animationName)

        if (tinyLeadGetParameterByName('demo_open')) {
          if (popper) {
            return
          }
          popper = new Popper(document.querySelector('.reminder-button-area'), {content: i18n[lang]['reminder_tooltip_general_html']}, {
            placement: 'top-start',
            boundariesElement: document.querySelector('.tinylead-content-wrapper')
          })
        }
      })
    }
  })

  owl.on('initialize.owl.carousel initialized.owl.carousel ' +
    'initialize.owl.carousel initialize.owl.carousel ' +
    'resize.owl.carousel resized.owl.carousel ' +
    'refresh.owl.carousel refreshed.owl.carousel ' +
    'update.owl.carousel updated.owl.carousel ' +
    'drag.owl.carousel dragged.owl.carousel ' +
    'translate.owl.carousel translated.owl.carousel ' +
    'to.owl.carousel changed.owl.carousel', function (e) {
    if (e.type === 'initialized' || e.type === 'resized') {
      refreshView('loaded')
    }
  })

  loadAllData()
})

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
  return decodeURIComponent(results[2].replace(/\+/g, ' '))
}

function loadAllData (cb) {
  var jsonUrl = ''
  if (tinyLeadGetParameterByName('demo')) {
    jsonUrl = tinyLeadGetParameterByName('env') === 'dev' ? 'http://localhost:3000/api/products/demo?user_id={{app.user}}' : 'https://api.popupdelivery.com/api/products/demo?user_id={{app.user}}'
  } else {
    jsonUrl = tinyLeadGetParameterByName('env') === 'dev' ? 'http://localhost:3000/api/products/demo?user_id={{app.user}}' : 'https://s3.amazonaws.com/popupdelivery/history/{{app.user}}_' + tinyLeadGetParameterByName('cookie_id') + '.json?ts=' + new Date().valueOf()
  }
  $.ajax({
    url: jsonUrl,
    dataType: 'json',
    success: function (data) {
      content = ''
      if (data && data.items) {
        for (var i in data.items) {
          content += '<a target="_top" href="' + data.items[i].link + '"><div class="item"><div class="item-img" style="width:100%;background:url(' + data.items[i].image + ') no-repeat 50% 50%;background-size:contain"></div><div class="col-xs-12"><p class="item-body"><span">' + data.items[i].title.substr(0, 25) + (data.items[i].title.length > 25 ? '...' : '') + '</span><br/><span class="price">' + data.items[i].price + '</span></p></div></div></a>'
        }

        contentTotal = data.items.length
      }

      if (contentTotal) {
        $('#counter').html('(' + contentTotal + ')')
        $('#counter').show()
      } else {
        $('#counter').hide()
      }

      if (contentTotal) {
        $('#with_products').show()
        $('#no_products').hide()
        owl.show()
      } else {
        $('#counter').html('')
        $('#with_products').hide()
        $('#no_products').show()
        owl.hide()
      }

      tinyLeadGetSize(function (dW, dH, w, h) {
        if (!loaded) {
          $('#owl-demo').html(content)
          owl.owlCarousel({
            animateOut: 'fadeOut',
            navText: [i18n[lang]['reminder_reminder_prev'], i18n[lang]['reminder_reminder_next']],
            margin: 0,
            nav: true,
            loop: true,
            lazyLoad: true,
            itemsScaleUp: true,
            items: Math.floor(w / itemWidth),
            responsive: {
              0: {
                items: Math.floor(300 / itemWidth)
              },
              300: {
                items: Math.floor(300 / itemWidth)
              },
              400: {
                items: Math.floor(400 / itemWidth)
              },
              500: {
                items: Math.floor(500 / itemWidth)
              },
              600: {
                items: Math.floor(600 / itemWidth)
              },
              700: {
                items: Math.floor(700 / itemWidth)
              },
              800: {
                items: Math.floor(800 / itemWidth)
              },
              900: {
                items: Math.floor(900 / itemWidth)
              },
              1000: {
                items: Math.floor(1000 / itemWidth)
              },
              1100: {
                items: Math.floor(1100 / itemWidth)
              },
              1200: {
                items: Math.floor(1200 / itemWidth)
              },
              1300: {
                items: Math.floor(1300 / itemWidth)
              },
              1400: {
                items: Math.floor(1400 / itemWidth)
              }
            }
          })
          loaded = true
        } else {
          if (content) {
            owl.trigger('replace.owl.carousel', content)
          }
          owl.trigger('refresh.owl.carousel')
        }
        $('.title').animateCss('slideInUp')
        if (cb) {
          cb()
        }
      })
    },
    error: function () {
      owl.owlCarousel({})
      $('.title').animateCss('slideInUp')
      $('#no_products').show()
      if (cb) {
        cb()
      }
    }
  })
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

function clearAll () {
  if (!tinyLeadGetParameterByName('demo')) {
    sendInsights('clear_all')
  }
  $.ajax({
    type: 'GET',
    url: 'https://api.popupdelivery.com/api/reset_feed?cookie_id=' + tinyLeadGetParameterByName('cookie_id') + '&user_id={{app.user}}',
    success: function () {
      $('#counter').html('')
      toggleReminder()
    }
  })
}

function sendMessage (action) {
  tinyLeadGetSize(function (documentWidth, documentHeight, viewportWidth, viewportHeight) {
    try {
      window.parent.postMessage({type: action, value: {app_id: '{{app._id}}', app_type: 'reminder', width: contentElement.clientWidth, height: documentHeight, action: action, has_hero: $('.lead-img').length}}, '*')
    } catch (e) {
      window.parent.postMessage({type: action, value: {app_id: '{{app._id}}', app_type: 'reminder', width: contentElement.clientWidth, height: documentHeight, action: action, has_hero: $('.lead-img').length}}, '*')
    }
  })
}

function refreshView (action) {
  sendMessage(action)
}

function toggleReminder () {
  return opened ? closeReminder() : openReminder()
}

function openReminder () {
  if (!tinyLeadGetParameterByName('demo')) {
    sendInsights('open')
  }
  opened = true
  reminderContent.style.display = 'block'
  closeButton.style.display = 'block'
  loadAllData(function () {
    refreshView('loaded')
    if (popper) {
      $(popper._popper).hide()
    }
  })
}

function closeReminder () {
  opened = false
  reminderContent.style.display = 'none'
  closeButton.style.display = 'none'
  try {
    if (window.parent) window.parent.postMessage({type: 'close_reminder', value: {width: contentElement.clientWidth, height: contentElement.clientHeight}}, '*')
  } catch (e) {
    if (window.parent) window.parent.postMessage({type: 'close_reminder', value: {width: contentElement.clientWidth, height: contentElement.clientHeight}}, '*')
  }
}

var onMessageHandler = function (event) {
  switch (event.data.type) {
    case 'open_reminder':
      openReminder()
      break
    case 'close_reminder':
      closeReminder()
      break
    case 'reload':
      closeReminder()
      location.reload(false)
      break
    default:
      return
  }
}

// setup window handlers
addEvent(window, 'message', onMessageHandler)

if (!tinyLeadGetParameterByName('demo')) {
  sendInsights('view')
}
