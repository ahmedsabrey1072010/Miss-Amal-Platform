const SUPABASE_URL = 'https://hoddrxekayofbyqmoyyz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Z6u7TuaH-WhcweAyb2hsJg_X5pWJ6HS';
const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// مفتاح الـ VAPID العام الخاص بك لتفعيل الإشعارات
const PUBLIC_VAPID_KEY = 'e250e6671f1528857ad88e0d4e08a84c058fbd40e00ebba0b42a2c4681f656b0';

let users = [], notifications = [], honorStudents = [], books = [], videos = [], platforms = [], exams = [], chatMessages = [], auditLogs = [];
let currentUser = JSON.parse(localStorage.getItem('platform_current_user')) || null;
let savedTheme = localStorage.getItem('platform_theme') || 'light';
let isAdminLoggedIn = sessionStorage.getItem('admin_logged_in') === 'true';
let authModal, adminAuthModal, imageLightboxModal;

document.body.setAttribute('data-theme', savedTheme);
if (savedTheme === 'dark') document.getElementById('themeIcon').className = 'fa-solid fa-sun text-warning';

window.addEventListener('DOMContentLoaded', () => {
  authModal = new bootstrap.Modal(document.getElementById('authModal'));
  adminAuthModal = new bootstrap.Modal(document.getElementById('adminAuthModal'));
  imageLightboxModal = new bootstrap.Modal(document.getElementById('imageLightboxModal'));
  loadAvatarsFromStorage();
  fetchSupabaseData();
});

function showLoadingOverlay(text) {
  document.getElementById('globalLoadingText').innerText = text;
  document.getElementById('globalLoadingOverlay').classList.add('show');
}
function hideLoadingOverlay() {
  document.getElementById('globalLoadingOverlay').classList.remove('show');
}

function showWelcomeToast(userName) {
  const toast = document.getElementById('welcomeToast');
  document.getElementById('welcomeToastName').innerText = `أهلاً بك يا ${userName}`;
  toast.classList.add('show');
  setTimeout(() => { toast.classList.remove('show'); }, 4000);
}

function hasPlatformAccess() {
  return (currentUser && currentUser.status === 'approved') || isAdminLoggedIn;
}

async function fetchSupabaseData() {
  const { data: p } = await _supabase.from('profiles').select('*');
  if (p) users = p;
  
  const { data: n } = await _supabase.from('notifications').select('*').order('id', { ascending: false });
  if (n) {
    notifications = n.map(item => ({ id: item.id, title: item.title, content: item.content, date: new Date(item.created_at || Date.now()).toLocaleDateString('ar-EG') }));
    renderDropdownNotifications();
  }
  
  const { data: h } = await _supabase.from('honor_students').select('*');
  if (h) honorStudents = h;
  
  const { data: b } = await _supabase.from('books').select('*');
  if (b) books = b;
  
  const { data: v } = await _supabase.from('educational_videos').select('*');
  if (v) videos = v;

  const { data: pl } = await _supabase.from('platforms').select('*');
  if (pl) platforms = pl;

  const { data: ex } = await _supabase.from('exams').select('*');
  if (ex) exams = ex;
  
  const { data: l } = await _supabase.from('audit_logs').select('*').order('id', { ascending: false });
  if (l) auditLogs = l;
  
  const { data: m } = await _supabase.from('chat_messages').select('*').order('id', { ascending: true });
  if (m) {
    chatMessages = m.map(item => ({ 
      id: item.id,
      sender: item.sender || 'زائر', 
      text: item.content || '', 
      img: item.image_url || null 
    }));
  }

  updateUI();
}

async function logAction(actionDesc) {
  try {
    await _supabase.from('audit_logs').insert([{ action: actionDesc, created_at: new Date() }]);
  } catch(err) { console.error(err); }
}

function updateUI() {
  const isLoggedIn = hasPlatformAccess();

  document.getElementById('heroStartBtn').style.display = isLoggedIn ? 'none' : 'inline-block';
  document.getElementById('guestFeaturesSection').style.display = isLoggedIn ? 'none' : 'block';

  if (currentUser && currentUser.status === 'approved') {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('loggedInUserPill').style.display = 'flex';
    document.getElementById('headerUserName').innerText = currentUser.name.split(' ')[0];
    document.getElementById('profileNavItem').style.display = 'flex';
    document.getElementById('profName').value = currentUser.name;
    document.getElementById('profUsername').value = currentUser.username || '';
    document.getElementById('profPhone').value = currentUser.phone;
    document.getElementById('profParentPhone').value = currentUser.parent_phone || '';
    loadAvatarsFromStorage();
  } else if (isAdminLoggedIn) {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('loggedInUserPill').style.display = 'flex';
    document.getElementById('headerUserName').innerText = sessionStorage.getItem('admin_name') || 'المشرف';
    document.getElementById('profileNavItem').style.display = 'none';
    loadAvatarsFromStorage();
  } else {
    document.getElementById('authContainer').style.display = 'block';
    document.getElementById('loggedInUserPill').style.display = 'none';
    document.getElementById('profileNavItem').style.display = 'none';
  }

  renderHomeNotifications();
  renderHomeHonor();
  renderBooks(books);
  renderVideos(videos);
  renderPlatforms();
  renderExams();
  renderChat();
}

function handleProfileAvatarChange(e) {
  const file = e.target.files[0];
  if (!file || !currentUser) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    localStorage.setItem(`avatar_user_${currentUser.phone}`, event.target.result);
    loadAvatarsFromStorage();
  };
  reader.readAsDataURL(file);
}

function handleAdminAvatarChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    localStorage.setItem('avatar_admin_local', event.target.result);
    loadAvatarsFromStorage();
  };
  reader.readAsDataURL(file);
}

function loadAvatarsFromStorage() {
  if (currentUser) {
    const savedUserAvatar = localStorage.getItem(`avatar_user_${currentUser.phone}`);
    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=4f46e5&color=fff`;
    document.getElementById('profileAvatarPreview').src = savedUserAvatar || fallback;
    document.getElementById('headerUserAvatar').src = savedUserAvatar || fallback;
  }
  const savedAdminAvatar = localStorage.getItem('avatar_admin_local');
  const adminFallback = `https://ui-avatars.com/api/?name=Admin&background=f59e0b&color=fff`;
  document.getElementById('adminAvatarPreview').src = savedAdminAvatar || adminFallback;
  if (isAdminLoggedIn && !currentUser) {
    document.getElementById('headerUserAvatar').src = savedAdminAvatar || adminFallback;
  }
}

function toggleNotificationDropdown() {
  const dropdown = document.getElementById('notificationDropdown');
  dropdown.classList.toggle('show');
  if (dropdown.classList.contains('show')) {
    document.getElementById('notificationBadge').style.display = 'none';
  }
}

function renderDropdownNotifications() {
  const listContainer = document.getElementById('dropdownNotificationsList');
  const badge = document.getElementById('notificationBadge');
  if (!notifications.length) {
    listContainer.innerHTML = `<p class="small text-center m-0 py-2">لا توجد إشعارات جديدة</p>`;
    badge.style.display = 'none';
    return;
  }
  badge.innerText = notifications.length;
  badge.style.display = 'inline-block';
  listContainer.innerHTML = notifications.map(n => `
    <div class="liquid-item-card p-2 mb-2">
      <h6 class="fw-bold text-primary m-0" style="font-size: 0.82rem;">${n.title}</h6>
      <p class="m-0 small mt-1" style="font-size: 0.78rem;">${n.content}</p>
    </div>
  `).join('');
}

function showSection(sectionId, element) {
  const protectedSections = ['forumSection', 'pythonEditorSection', 'jsEditorSection', 'htmlEditorSection', 'booksSection', 'videosSection', 'platformsSection', 'examsSection'];
  if (protectedSections.includes(sectionId) && !hasPlatformAccess()) {
    alert("عذراً، هذا القسم متاح فقط لطلاب المنصة المفعلين بعد تسجيل الدخول.");
    showAuthModal('login');
    return;
  }
  if (sectionId === 'adminSection' && !isAdminLoggedIn) {
    openAdminAccess();
    return;
  }
  document.querySelectorAll('.main-container > section').forEach(sec => sec.style.display = 'none');
  document.getElementById(sectionId).style.display = 'block';
  document.querySelectorAll('#sidebar .nav-link').forEach(link => link.classList.remove('active'));
  if (element) element.classList.add('active');
  if (window.innerWidth <= 991 && document.getElementById('sidebar').classList.contains('mobile-open')) {
    toggleSidebar();
  }
  if (sectionId === 'adminSection') loadAdminData();
}

function toggleTheme() {
  const body = document.body;
  const themeIcon = document.getElementById('themeIcon');
  if (body.getAttribute('data-theme') === 'light') {
    body.setAttribute('data-theme', 'dark');
    themeIcon.className = 'fa-solid fa-sun text-warning';
    localStorage.setItem('platform_theme', 'dark');
  } else {
    body.setAttribute('data-theme', 'light');
    themeIcon.className = 'fa-solid fa-moon';
    localStorage.setItem('platform_theme', 'light');
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (window.innerWidth <= 991) {
    sidebar.classList.toggle('mobile-open');
    backdrop.classList.toggle('show');
  } else {
    sidebar.classList.toggle('collapsed');
    document.getElementById('content').classList.toggle('expanded');
  }
}

function openAdminAccess() {
  if (isAdminLoggedIn) {
    showSection('adminSection', null);
  } else {
    adminAuthModal.show();
  }
}

async function checkAdminAuth(e) {
  if (e) e.preventDefault();
  const phoneInput = document.getElementById('adminPhoneInput').value.trim();
  const passInput = document.getElementById('adminPassInput').value;

  showLoadingOverlay("جاري التحقق من البيانات...");

  try {
    const { data: adminData, error } = await _supabase
      .from('admins')
      .select('*')
      .eq('phone', phoneInput)
      .eq('password', passInput)
      .single();

    hideLoadingOverlay();

    if (error || !adminData) {
      alert("رقم الهاتف أو كلمة المرور للمشرف غير صحيحة!");
      document.getElementById('adminPassInput').value = '';
    } else {
      isAdminLoggedIn = true;
      sessionStorage.setItem('admin_logged_in', 'true');
      sessionStorage.setItem('admin_name', adminData.name);
      document.getElementById('adminWelcomeLabel').innerText = `مرحباً ${adminData.name}`;
      adminAuthModal.hide();
      updateUI();
      showWelcomeToast(adminData.name);
      showSection('adminSection', null);
      logAction(`تسجيل دخول الأدمن: ${adminData.name}`);
    }
  } catch (err) {
    hideLoadingOverlay();
    alert("حدث خطأ في الاتصال بالخدمة.");
  }
}

function adminLogout() {
  isAdminLoggedIn = false;
  sessionStorage.removeItem('admin_logged_in');
  sessionStorage.removeItem('admin_name');
  updateUI();
  showSection('homeSection', document.querySelector('#sidebar .nav-link'));
}

function showAuthModal(type) {
  if (type === 'login') {
    document.getElementById('authModalTitle').innerText = 'تسجيل الدخول';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
  } else {
    document.getElementById('authModalTitle').innerText = 'إنشاء حساب جديد';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
  }
  authModal.show();
}

function toggleGradeSelect() {
  const role = document.getElementById('regRole').value;
  document.getElementById('gradeGroup').style.display = role === 'student' ? 'block' : 'none';
  document.getElementById('parentPhoneGroup').style.display = role === 'student' ? 'block' : 'none';
}

async function handleLogin(e) {
  e.preventDefault();
  const phone = document.getElementById('loginPhone').value.trim();
  const pass = document.getElementById('loginPass').value;
  showLoadingOverlay("جاري تسجيل الدخول...");
  await fetchSupabaseData();
  const user = users.find(u => u.phone === phone && u.pass === pass);
  hideLoadingOverlay();
  if (!user) {
    alert("رقم الهاتف أو كلمة المرور غير صحيحة!");
    return;
  }
  if (user.status === 'pending') {
    alert("حسابك ما زال تحت المراجعة وبانتظار موافقة الأدمن.");
    return;
  }
  currentUser = user;
  localStorage.setItem('platform_current_user', JSON.stringify(currentUser));
  authModal.hide();
  updateUI();
  showWelcomeToast(currentUser.name);
  logAction(`تسجيل دخول الطالب: ${currentUser.name}`);
  
  // تفعيل الإشعارات تلقائياً عند تسجيل الدخول الناجح
  registerServiceWorkerAndPush();
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const username = document.getElementById('regUsername').value.trim();
  const role = document.getElementById('regRole').value;
  const grade = role === 'student' ? document.getElementById('regGrade').value : 'معلم';
  const phone = document.getElementById('regPhone').value.trim();
  const parentPhone = document.getElementById('regParentPhone').value.trim();
  const pass = document.getElementById('regPass').value;
  const passConfirm = document.getElementById('regPassConfirm').value;

  if (pass !== passConfirm) {
    alert("كلمتا المرور غير متطابقتين!");
    return;
  }

  showLoadingOverlay("جاري التحقق من البيانات...");

  // التحقق من وجود رقم الهاتف في قاعدة البيانات مسبقاً
  const { data: existingUser, error: checkError } = await _supabase
    .from('profiles')
    .select('status')
    .eq('phone', phone)
    .maybeSingle();

  if (checkError) {
    hideLoadingOverlay();
    alert("حدث خطأ أثناء التحقق من البيانات: " + checkError.message);
    return;
  }

  // إذا كان الرقم مسجلاً، نمنع الإضافة ونبلغ الطالب بحالة الحساب
  if (existingUser) {
    hideLoadingOverlay();
    if (existingUser.status === 'pending') {
      alert("هذا الرقم مسجل بالفعل وطلبك ما زال في انتظار موافقة الأدمن.");
    } else if (existingUser.status === 'approved') {
      alert("هذا الرقم مسجل ومفعل بالفعل على المنصة! يمكنك تسجيل الدخول مباشرة.");
    } else {
      alert("هذا الرقم مسجل بالفعل على المنصة.");
    }
    return;
  }

  showLoadingOverlay("جاري إنشاء الحساب...");
  
  const { error } = await _supabase.from('profiles').insert([{
    name, username, role, grade, phone, parent_phone: parentPhone, pass, status: 'pending'
  }]);

  hideLoadingOverlay();

  if (error) {
    alert("خطأ أثناء إنشاء الحساب: " + error.message);
  } else {
    alert("تم إرسال طلبك بنجاح! بانتظار موافقة الأدمن والتفعيل.");
    document.getElementById('registerForm').reset();
    authModal.hide();
    logAction(`طلب انضمام جديد: ${name}`);
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem('platform_current_user');
  updateUI();
  showSection('homeSection', document.querySelector('#sidebar .nav-link'));
}

async function updateProfile(e) {
  e.preventDefault();
  if (!currentUser) return;
  showLoadingOverlay("جاري التحديث...");
  currentUser.name = document.getElementById('profName').value;
  currentUser.username = document.getElementById('profUsername').value;
  currentUser.phone = document.getElementById('profPhone').value;
  currentUser.parent_phone = document.getElementById('profParentPhone').value;
  const newPass = document.getElementById('profPass').value;
  if (newPass) currentUser.pass = newPass;

  const { error } = await _supabase.from('profiles').update({
    name: currentUser.name, username: currentUser.username, phone: currentUser.phone, parent_phone: currentUser.parent_phone, pass: currentUser.pass
  }).eq('id', currentUser.id);

  hideLoadingOverlay();
  if (error) alert("خطأ في التحديث: " + error.message);
  else {
    localStorage.setItem('platform_current_user', JSON.stringify(currentUser));
    alert("تم التحديث بنجاح!");
    updateUI();
    logAction(`تحديث الملف الشخصي: ${currentUser.name}`);
  }
}

async function loadAdminData() {
  await fetchSupabaseData();
  document.getElementById('pendingCount').innerText = users.filter(u => u.status === 'pending').length;
  document.getElementById('studentsCount').innerText = users.filter(u => u.status === 'approved').length;
  document.getElementById('logsCount').innerText = auditLogs.length;

  document.getElementById('pendingTableBody').innerHTML = users.filter(u => u.status === 'pending').map(u => `
    <tr>
      <td><strong>${u.name}</strong></td>
      <td>${u.grade}</td>
      <td>${u.phone}</td>
      <td>
        <button class="btn btn-success btn-sm me-1" onclick="approveUser(${u.id}, '${u.name}')">قبول</button>
        <button class="btn btn-danger btn-sm" onclick="rejectUser(${u.id})">رفض</button>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="4" class="text-center">لا توجد طلبات معلقة</td></tr>`;

  document.getElementById('studentsTableBody').innerHTML = users.filter(u => u.status === 'approved').map(u => `
    <tr>
      <td><strong>${u.name}</strong></td>
      <td>${u.grade}</td>
      <td><button class="btn btn-outline-danger btn-sm" onclick="deleteStudent(${u.id})"><i class="fa-solid fa-trash"></i></button></td>
    </tr>
  `).join('') || `<tr><td colspan="3" class="text-center">لا توجد طلاب مفعلين</td></tr>`;

  document.getElementById('logsTableBody').innerHTML = auditLogs.map(l => `
    <tr>
      <td>${l.action}</td>
      <td><small class="text-muted">${new Date(l.created_at || Date.now()).toLocaleString('ar-EG')}</small></td>
    </tr>
  `).join('') || `<tr><td colspan="2" class="text-center">لا توجد سجلات مسجلة</td></tr>`;

  document.getElementById('adminNotificationsList').innerHTML = notifications.map(n => `
    <div class="liquid-item-card d-flex justify-content-between align-items-center mb-2">
      <div>
        <h6 class="fw-bold text-primary m-0">${n.title}</h6>
        <p class="small m-0 mt-1">${n.content}</p>
      </div>
      <button class="btn btn-outline-danger btn-sm" onclick="deleteItem('notifications', ${n.id})"><i class="fa-solid fa-trash"></i></button>
    </div>
  `).join('') || `<p class="small">لا توجد إشعارات</p>`;

  document.getElementById('adminBooksList').innerHTML = books.map(b => `
    <div class="liquid-item-card d-flex justify-content-between align-items-center mb-2">
      <div>
        <h6 class="fw-bold m-0">${b.title}</h6>
        <span class="badge bg-danger-subtle text-danger">${b.grade}</span>
      </div>
      <button class="btn btn-outline-danger btn-sm" onclick="deleteItem('books', ${b.id})"><i class="fa-solid fa-trash"></i></button>
    </div>
  `).join('') || `<p class="small">لا توجد كتب مسجلة</p>`;

  document.getElementById('adminVideosList').innerHTML = videos.map(v => `
    <div class="liquid-item-card d-flex justify-content-between align-items-center mb-2">
      <div>
        <h6 class="fw-bold m-0">${v.title}</h6>
      </div>
      <button class="btn btn-outline-danger btn-sm" onclick="deleteItem('educational_videos', ${v.id})"><i class="fa-solid fa-trash"></i></button>
    </div>
  `).join('') || `<p class="small">لا توجد فيديوهات مسجلة</p>`;

  document.getElementById('adminPlatformsList').innerHTML = platforms.map(pl => `
    <div class="liquid-item-card d-flex justify-content-between align-items-center mb-2">
      <div>
        <h6 class="fw-bold m-0">${pl.title}</h6>
        <a href="${pl.url}" target="_blank" class="small text-primary">${pl.url}</a>
      </div>
      <button class="btn btn-outline-danger btn-sm" onclick="deleteItem('platforms', ${pl.id})"><i class="fa-solid fa-trash"></i></button>
    </div>
  `).join('') || `<p class="small">لا توجد منصات مسجلة</p>`;

  document.getElementById('adminExamsList').innerHTML = exams.map(ex => `
    <div class="liquid-item-card d-flex justify-content-between align-items-center mb-2">
      <div>
        <h6 class="fw-bold m-0">${ex.title}</h6>
        <a href="${ex.url}" target="_blank" class="small text-success">${ex.url}</a>
      </div>
      <button class="btn btn-outline-danger btn-sm" onclick="deleteItem('exams', ${ex.id})"><i class="fa-solid fa-trash"></i></button>
    </div>
  `).join('') || ``;
}

async function deleteItem(table, id) {
  if (confirm("هل أنت متأكد من الحذف؟")) {
    await _supabase.from(table).delete().eq('id', id);
    loadAdminData();
    logAction(`تم حذف عنصر من جدول ${table}`);
  }
}

async function approveUser(id, name) {
  await _supabase.from('profiles').update({ status: 'approved' }).eq('id', id);
  loadAdminData();
  logAction(`تم تفعيل حساب الطالب: ${name}`);
}
async function rejectUser(id) {
  await _supabase.from('profiles').delete().eq('id', id);
  loadAdminData();
  logAction(`تم رفض وحذف حساب معلق`);
}
async function deleteStudent(id) {
  if (confirm("هل أنت متأكد من الحذف؟")) {
    await _supabase.from('profiles').delete().eq('id', id);
    loadAdminData();
    logAction(`تم حذف طالب مفعل`);
  }
}

function switchAdminTab(tabId, element) {
  document.querySelectorAll('.admin-tab-pane').forEach(pane => pane.style.display = 'none');
  document.getElementById(tabId).style.display = 'block';
  document.querySelectorAll('.admin-sidebar .admin-nav-link').forEach(link => link.classList.remove('active'));
  element.classList.add('active');
}

function renderHomeNotifications() {
  const container = document.getElementById('homeNotificationsContainer');
  if (!notifications.length) { container.innerHTML = `<p class="m-0">لا توجد إشعارات حالياً.</p>`; return; }
  container.innerHTML = notifications.map(n => `
    <div class="liquid-item-card">
      <div class="d-flex justify-content-between align-items-center mb-1">
        <h6 class="text-primary fw-bold m-0" style="font-size:0.9rem;"><i class="fa-solid fa-circle-info me-1"></i> ${n.title}</h6>
        <small class="badge bg-primary-subtle text-primary rounded-pill">${n.date}</small>
      </div>
      <p class="m-0 mt-2 small">${n.content}</p>
    </div>
  `).join('');
}

function renderHomeHonor() {
  const container = document.getElementById('homeHonorContainer');
  if (!honorStudents.length) { container.innerHTML = `<p class="text-center col-12">لا توجد سجلات.</p>`; return; }
  container.innerHTML = honorStudents.map(h => `<div class="col-md-4"><div class="honor-card"><img src="${h.image_url}" class="honor-avatar"><h6 class="fw-bold">${h.name}</h6><small class="text-warning fw-semibold">${h.achievement}</small></div></div>`).join('');
}

function renderBooks(list = books) {
  const container = document.getElementById('booksContainer');
  if (!list || !list.length) { container.innerHTML = `<p class="text-center col-12">لا توجد مذكرات أو كتب متاحة.</p>`; return; }
  container.innerHTML = list.map(b => `
    <div class="col-md-4">
      <div class="liquid-item-card h-100 d-flex flex-column">
        <div class="d-flex align-items-center gap-3 mb-3">
          <div class="brand-logo" style="background: linear-gradient(135deg, #ef4444, #dc2626);"><i class="fa-solid fa-file-pdf"></i></div>
          <div>
            <h6 class="fw-bold m-0" style="font-size:0.9rem;">${b.title}</h6>
            <span class="badge bg-danger-subtle text-danger mt-1">${b.grade}</span>
          </div>
        </div>
        <a href="${b.url}" target="_blank" class="btn btn-outline-danger btn-sm mt-auto fw-bold py-2 rounded-pill"><i class="fa-solid fa-cloud-arrow-down me-1"></i> تحميل أو فتح</a>
      </div>
    </div>
  `).join('');
}

function filterBooks() {
  const query = document.getElementById('bookSearch').value.toLowerCase();
  renderBooks(books.filter(b => b.title.toLowerCase().includes(query) || b.grade.toLowerCase().includes(query)));
}

function renderVideos(list = videos) {
  const container = document.getElementById('videosContainer');
  if (!list || !list.length) { container.innerHTML = `<p class="text-center col-12">لا توجد فيديوهات منشورة.</p>`; return; }
  container.innerHTML = list.map(v => `
    <div class="col-md-6">
      <div class="liquid-item-card h-100 d-flex flex-column justify-content-between">
        <div class="d-flex align-items-center gap-3 mb-3">
          <div class="brand-logo" style="background: linear-gradient(135deg, #06b6d4, #3b82f6);"><i class="fa-solid fa-play"></i></div>
          <h6 class="fw-bold m-0" style="font-size:0.9rem;">${v.title}</h6>
        </div>
        <a href="${v.url}" target="_blank" class="btn btn-custom-primary btn-sm fw-bold py-2 mt-auto rounded-pill"><i class="fa-solid fa-external-link-alt me-1"></i> مشاهدة الدرس الآن</a>
      </div>
    </div>
  `).join('');
}

function renderPlatforms() {
  const container = document.getElementById('platformsContainer');
  if (!platforms.length) { container.innerHTML = `<p class="text-center col-12">لا توجد منصات تعليمية مضافة حالياً.</p>`; return; }
  container.innerHTML = platforms.map(pl => `
    <div class="col-md-4">
      <div class="liquid-item-card h-100 d-flex flex-column justify-content-between">
        <div class="d-flex align-items-center gap-3 mb-3">
          <div class="brand-logo" style="background: linear-gradient(135deg, #f59e0b, #d97706);"><i class="fa-solid fa-globe"></i></div>
          <h6 class="fw-bold m-0" style="font-size:0.95rem;">${pl.title}</h6>
        </div>
        <a href="${pl.url}" target="_blank" class="btn btn-warning text-dark fw-bold btn-sm py-2 mt-auto rounded-pill"><i class="fa-solid fa-arrow-up-right-from-square me-1"></i> زيارة المنصة</a>
      </div>
    </div>
  `).join('');
}

function renderExams() {
  const container = document.getElementById('examsContainer');
  if (!exams.length) { container.innerHTML = `<p class="text-center col-12">لا توجد امتحانات أو اختبارات متاحة حالياً.</p>`; return; }
  container.innerHTML = exams.map(ex => `
    <div class="col-md-6">
      <div class="liquid-item-card h-100 d-flex flex-column justify-content-between">
        <div class="d-flex align-items-center gap-3 mb-3">
          <div class="brand-logo" style="background: linear-gradient(135deg, #10b981, #059669);"><i class="fa-solid fa-file-pen"></i></div>
          <h6 class="fw-bold m-0" style="font-size:0.95rem;">${ex.title}</h6>
        </div>
        <a href="${ex.url}" target="_blank" class="btn btn-success btn-sm fw-bold py-2 mt-auto rounded-pill"><i class="fa-solid fa-pen-to-square me-1"></i> بدء الاختبار الآن</a>
      </div>
    </div>
  `).join('');
}

function renderChat() {
  const container = document.getElementById('chatContainer');
  if (!container) return;
  const myName = currentUser ? currentUser.name : (isAdminLoggedIn ? (sessionStorage.getItem('admin_name') || 'المشرف') : '');

  container.innerHTML = chatMessages.map(m => {
    const isMine = myName && m.sender === myName;
    const canManage = isMine || isAdminLoggedIn;

    return `
      <div class="chat-message ${isMine ? 'sent' : 'received'}">
        <div class="chat-msg-header">
          <small class="fw-bold" style="font-size: 0.75rem;">${isMine ? 'أنت' : m.sender}</small>
          ${canManage && m.id ? `
            <div class="chat-msg-actions">
              ${isMine && m.text && m.text !== '[صورة]' ? `<button onclick="editChatMessage(${m.id}, '${m.text.replace(/'/g, "\\'")}')" title="تعديل"><i class="fa-solid fa-pen"></i></button>` : ''}
              <button onclick="deleteChatMessage(${m.id})" title="حذف"><i class="fa-solid fa-trash"></i></button>
            </div>
          ` : ''}
        </div>
        ${m.text && m.text !== '[صورة]' ? `<p class="m-0">${m.text}</p>` : ''}
        ${m.img ? `<img src="${m.img}" class="img-fluid chat-img-preview" onclick="openLightbox('${m.img}')" title="اضغط لتكبير الصورة">` : ''}
      </div>
    `;
  }).join('') || `<p class="text-center my-auto">لا توجد رسائل سابقة. ابدأ النقاش الآن!</p>`;
  container.scrollTop = container.scrollHeight;
}

function openLightbox(imgSrc) {
  document.getElementById('lightboxImageTarget').src = imgSrc;
  imageLightboxModal.show();
}

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  if (!input.value.trim()) return;
  const senderDisplay = currentUser ? currentUser.name : (isAdminLoggedIn ? (sessionStorage.getItem('admin_name') || 'المشرف') : 'زائر');
  await _supabase.from('chat_messages').insert([{ sender: senderDisplay, content: input.value.trim() }]);
  input.value = '';
  fetchSupabaseData();
}

async function editChatMessage(id, oldText) {
  const newText = prompt("تعديل الرسالة:", oldText);
  if (newText !== null && newText.trim() !== "" && newText !== oldText) {
    await _supabase.from('chat_messages').update({ content: newText.trim() }).eq('id', id);
    fetchSupabaseData();
  }
}

async function deleteChatMessage(id) {
  if (confirm("هل تريد حذف هذه الرسالة؟")) {
    await _supabase.from('chat_messages').delete().eq('id', id);
    fetchSupabaseData();
  }
}

async function handleImageUpload(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = async function(event) {
      const senderDisplay = currentUser ? currentUser.name : (isAdminLoggedIn ? (sessionStorage.getItem('admin_name') || 'المشرف') : 'زائر');
      await _supabase.from('chat_messages').insert([{ sender: senderDisplay, content: '[صورة]', image_url: event.target.result }]);
      fetchSupabaseData();
    };
    reader.readAsDataURL(file);
  }
}

function runJsCode() {
  const code = document.getElementById('jsCodeInput').value;
  const output = document.getElementById('jsOutput');
  try {
    let logs = [];
    const customConsole = { log: (...args) => logs.push(args.join(' ')) };
    const runFn = new Function('console', code);
    runFn(customConsole);
    output.innerText = logs.join('\n') || 'تم التنفيذ بنجاح.';
  } catch (err) {
    output.innerText = 'خطأ: ' + err.message;
  }
}

function runPythonCode() {
  const code = document.getElementById('pythonCodeInput').value.trim();
  if (!code) {
    document.getElementById('pythonOutput').innerText = "يرجى كتابة كود Python أولاً.";
    return;
  }
  const match = code.match(/print\s*\(\s*['"](.*?)['"]\s*\)/);
  document.getElementById('pythonOutput').innerText = match ? match[1] : "مخرجات Python: تم تنفيذ الكود بنجاح.";
}

function saveStudentSiteCode() {
  const code = document.getElementById('studentSiteCode').value;
  document.getElementById('sitePreview').srcdoc = code;
}

async function addNotification(e) {
  e.preventDefault();
  await _supabase.from('notifications').insert([{ title: document.getElementById('notifTitle').value, content: document.getElementById('notifContent').value }]);
  e.target.reset();
  fetchSupabaseData();
  alert("تم نشر الإشعار بنجاح!");
  logAction("تم إضافة إشعار جديد");
}
async function addHonorStudent(e) {
  e.preventDefault();
  const file = document.getElementById('honorImgFile').files[0];
  const reader = new FileReader();
  reader.onload = async function(event) {
    await _supabase.from('honor_students').insert([{ name: document.getElementById('honorName').value, achievement: document.getElementById('honorTitle').value, image_url: event.target.result }]);
    e.target.reset();
    fetchSupabaseData();
    alert("تمت الإضافة للوحة الشرف!");
    logAction("تم إضافة طالب للوحة الشرف");
  };
  reader.readAsDataURL(file);
}
async function addBook(e) {
  e.preventDefault();
  await _supabase.from('books').insert([{ title: document.getElementById('bookTitle').value, grade: document.getElementById('bookGrade').value, url: document.getElementById('bookUrl').value }]);
  e.target.reset();
  fetchSupabaseData();
  alert("تم نشر الكتاب بنجاح!");
  logAction("تم إضافة كتاب جديد للمكتبة");
}
async function addVideo(e) {
  e.preventDefault();
  await _supabase.from('educational_videos').insert([{ title: document.getElementById('videoTitle').value, url: document.getElementById('videoUrl').value }]);
  e.target.reset();
  fetchSupabaseData();
  alert("تم نشر الفيديو بنجاح!");
  logAction("تم إضافة فيديو تعليمي جديد");
}
async function addPlatform(e) {
  e.preventDefault();
  await _supabase.from('platforms').insert([{ title: document.getElementById('platTitle').value, url: document.getElementById('platUrl').value }]);
  e.target.reset();
  fetchSupabaseData();
  alert("تم إضافة المنصة التعليمية بنجاح!");
  logAction("تم إضافة منصة تعليمية جديدة");
}
async function addExam(e) {
  e.preventDefault();
  await _supabase.from('exams').insert([{ title: document.getElementById('examTitle').value, url: document.getElementById('examUrl').value }]);
  e.target.reset();
  fetchSupabaseData();
  alert("تم إضافة الاختبار بنجاح!");
  logAction("تم إضافة امتحان/اختبار جديد");
}

// ==========================================
// دوال تفعيل وإدارة الـ Push Notifications
// ==========================================

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function registerServiceWorkerAndPush() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      // 1. تسجيل ملف الـ Service Worker
      const registration = await navigator.serviceWorker.register('sw.js');
      console.log('Service Worker registered successfully:', registration);

      // 2. طلب الاشتراك من المتصفح باستخدام المفتاح العام VAPID
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      });

      console.log('Push Subscription obtained successfully:', JSON.stringify(subscription));
      return subscription;

    } catch (error) {
      console.error('Error during push subscription setup:', error);
    }
  } else {
    console.warn('Push messaging is not supported in this browser.');
  }
}
