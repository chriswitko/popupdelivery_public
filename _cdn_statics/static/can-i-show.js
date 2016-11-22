// showFancyLeadboxes();
// showFancyImage();
// tinyLeadShowBadge();
// tinyLeadShowCoupon();
// tinyLeadShowPopup();
// tinyLeadShowPopup('57dbb8435b8c185e9e5470b4', 'signup', '57dbb8b5fe91975eb854c42f', '', true);

console.log('test2', PopUpDelivery);

// PopUpDelivery.popup('57dbb8435b8c185e9e5470b4', 'signup', '57dbb8b5fe91975eb854c42f', '', true);
// PopUpDelivery.popup({site_id: '57dbb8435b8c185e9e5470b4', app_type: 'signup', app_id: '57dbb8b5fe91975eb854c42f', link_id: '', demo: false});
PopUpDelivery.run('show', {site_id: '57dbb8435b8c185e9e5470b4', app_type: 'signup', app_id: '57dbb8b5fe91975eb854c42f', link_id: '', demo: false});
// tinyLeadShowBadge("57dbb8435b8c185e9e5470b4", "reminder", "57dbbba59648396b1172fe90", "", true);
// PopUpDelivery.run('show', {site_id: '57dbb8435b8c185e9e5470b4', app_type: 'reminder', app_id: '57dbbba59648396b1172fe90', link_id: '', demo: false});

// PopUpDelivery.action('update', {test: 1});