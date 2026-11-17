// استقبال الإشعارات في الخلفية وعرضها على جهاز المستخدم حتى لو الموقع مغلق
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'إشعار جديد من منصة الأستاذة أمل شفيق';
  const options = {
    body: data.body || 'يوجد تحديث أو إشعار جديد بانتظارك على المنصة.',
    icon: 'أيقونة منصة الترجمة والذكاء الاصطناعي – 16 Nov 2026, 6.25 pm_20261116_182526_٠٠٠٠.png',
    badge: 'أيقونة منصة الترجمة والذكاء الاصطناعي – 16 Nov 2026, 6.25 pm_20261116_182526_٠٠٠٠.png'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// التعامل مع النقر على الإشعار لفتح الموقع مباشرة
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
