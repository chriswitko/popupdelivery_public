var closeCookies = function () {
	Cookies.set('pud_cookie', '1');
	$('#cookie_alert').hide()
}

var initCookie = function() {
	if(Cookies.get('pud_cookie') !== '1') {
		$('#cookie_alert').show()
	}
}

var initLanguage = function() {
	$(document).languageDetection({
			domain        :  '/',
			languages     :  [
					{
							code : 'en',
							path : 'en',
							defaultLanguage : true
					},
					{
							code : 'uk',
							path : 'uk',
					},
					{
							code : 'pl',
							path : 'pl'
					}
			],
			expires       :  10 
	});
}

$(document).ready(function() {
	initCookie()
})