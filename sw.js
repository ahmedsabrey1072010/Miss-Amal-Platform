// استقبال الإشعارات في الخلفية وعرضها على جهاز المستخدم حتى لو الموقع مغلق
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'إشعار جديد من منصة الأستاذة أمل شفيق';
  const options = {
    body: data.body || 'يوجد تحديث أو إشعار جديد بانتظارك على المنصة.',
    icon: 'watermarked_img_7360017269884422966.jpg', // أيقونة المنصة
    badge: 'watermarked_img_7360017269884422966.jpg'
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
