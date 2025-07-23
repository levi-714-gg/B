let registrations = [];
let coaches = [];
let lastData = null;
let currentDisplayedData = [];
let editIndex = -1;
let editRowIndex = -1;
let currentFontSize = 14;
let lastSavedFields = {
  phone: "",
  timing: "",
  time: "",
  start: "",
  end: ""
};
let currentUser = null;

const yearSelect = document.getElementById("reportYear");
const currentYear = new Date().getFullYear();
for (let year = currentYear - 5; year <= currentYear + 5; year++) {
  yearSelect.innerHTML += `<option value="${year}">${year}</option>`;
}

function showSuccessMessage(message) {
  const toast = document.getElementById("saveToast");
  toast.innerText = message;
  toast.style.display = "block";
  setTimeout(() => { toast.style.display = "none"; }, 2000);
}

function showLoginModal() {
  document.getElementById("loginModal").style.display = "flex";
  document.getElementById("topNav").style.display = "none";
  document.querySelectorAll(".page-section").forEach(el => el.classList.add("hidden"));
}

function hideLoginModal() {
  document.getElementById("loginModal").style.display = "none";
  document.getElementById("topNav").style.display = "flex";
}

function updateNavigation() {
  const adminOnlyButtons = document.querySelectorAll(".admin-only");
  const adminOrAyaButtons = document.querySelectorAll(".admin-or-aya");
  if (currentUser) {
    if (currentUser.role === "employee") {
      adminOnlyButtons.forEach(btn => btn.style.display = "none");
      adminOrAyaButtons.forEach(btn => btn.style.display = "none");
    } else if (currentUser.role === "aya") {
      adminOnlyButtons.forEach(btn => btn.style.display = "none");
      adminOrAyaButtons.forEach(btn => btn.style.display = "inline-block");
    } else if (currentUser.role === "admin") {
      adminOnlyButtons.forEach(btn => btn.style.display = "inline-block");
      adminOrAyaButtons.forEach(btn => btn.style.display = "inline-block");
    }
  } else {
    adminOnlyButtons.forEach(btn => btn.style.display = "none");
    adminOrAyaButtons.forEach(btn => btn.style.display = "none");
  }
}

async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const result = await response.json();
    if (response.ok) {
      currentUser = result;
      hideLoginModal();
      updateNavigation();
      showPage("register");
      showSuccessMessage("✔️ تم تسجيل الدخول بنجاح");
      await fetchRegistrations();
      await fetchCoaches();
    } else {
      alert(result.error || "اسم المستخدم أو كلمة المرور غير صحيحة");
    }
  } catch (error) {
    console.error(`Error in login: ${error.message}`);
    alert("حدث خطأ أثناء تسجيل الدخول.");
  }
}

function logout() {
  currentUser = null;
  showLoginModal();
  showSuccessMessage("✔️ تم تسجيل الخروج بنجاح");
}

function showPage(pageId) {
  if (!currentUser) {
    showLoginModal();
    return;
  }
  if (currentUser.role === "employee" && ["members", "childrenSwimming", "monthlyReport"].includes(pageId)) {
    alert("غير مصرح لك بمشاهدة هذه الصفحة");
    showPage("register");
    return;
  }
  if (currentUser.role === "aya" && ["childrenSwimming", "monthlyReport"].includes(pageId)) {
    alert("غير مصرح لك بمشاهدة هذه الصفحة");
    showPage("register");
    return;
  }
  document.querySelectorAll(".page-section").forEach(el => el.classList.add("hidden"));
  document.getElementById(pageId).classList.remove("hidden");
  if (pageId === 'members') applyFilters();
  else if (pageId === 'childrenSwimming') applyChildrenFilters();
  else if (pageId === 'monthlyReport') generateMonthlyReport();
}

function resetForm() {
  document.getElementById("registerForm").reset();
  document.querySelector("[name='phone']").value = lastSavedFields.phone || "";
  document.querySelector("[name='timing']").value = lastSavedFields.timing || "";
  document.querySelector("[name='time']").value = lastSavedFields.time || "";
  document.querySelector("[name='start']").value = lastSavedFields.start || "";
  document.querySelector("[name='end']").value = lastSavedFields.end || "";
  editIndex = -1;
  showSuccessMessage("✔️ تم إعادة تعيين النموذج");
}

function openSearchModal() {
  if (!currentUser) {
    showLoginModal();
    return;
  }
  const searchModal = document.getElementById("searchModal");
  const searchInput = document.getElementById("searchModalInput");
  const searchTable = document.getElementById("searchModalTable");
  searchModal.style.display = "flex";
  searchInput.value = "";
  searchTable.innerHTML = "<p style='text-align:center;'>أدخل اسم أو رقم جوال للبحث</p>";
}

function closeSearchModal() {
  document.getElementById("searchModal").style.display = "none";
}

async function fetchRegistrations() {
  try {
    const response = await fetch('/api/registrations');
    registrations = await response.json();
  } catch (error) {
    console.error(`Error fetching registrations: ${error.message}`);
    alert("حدث خطأ أثناء جلب التسجيلات.");
  }
}

async function fetchCoaches() {
  try {
    const response = await fetch('/api/coaches');
    coaches = await response.json();
    populateCoachFilter();
  } catch (error) {
    console.error(`Error fetching coaches: ${error.message}`);
    alert("حدث خطأ أثناء جلب المدربين.");
  }
}

async function searchForRenewal() {
  const term = normalizeArabic(document.getElementById("searchModalInput").value.trim());
  const container = document.getElementById("searchModalTable");
  if (!term) {
    container.innerHTML = "<p style='text-align:center;'>أدخل اسم أو رقم جوال للبحث</p>";
    return;
  }
  let data = registrations.filter(record => {
    const normalizedName = normalizeArabic(record.name || "");
    const normalizedPhone = normalizeArabic(record.phone || "");
    return normalizedName.includes(term) || normalizedPhone.includes(term);
  });
  if (data.length === 0) {
    container.innerHTML = "<p style='text-align:center;'>لا توجد نتائج</p>";
    return;
  }
  let html = `
    <table border="1" cellpadding="8" cellspacing="0">
      <thead><tr style="background:#0077cc; color:white;"><th>الاسم الثلاثي</th><th>رقم الجوال</th><th>النشاط</th><th>نهاية الاشتراك</th></tr></thead>
      <tbody>
  `;
  data.forEach(record => {
    html += `<tr onclick="selectMemberForRenewal(${record.id})"><td>${record.name || "-"}</td><td>${record.phone || "-"}</td><td>${record.activity || "-"}</td><td>${record.end || "-"}</td></tr>`;
  });
  html += "</tbody></table>";
  container.innerHTML = html;
  const table = container.querySelector("table");
  if (table) table.style.fontSize = currentFontSize + "px";
}

async function selectMemberForRenewal(id) {
  const record = registrations.find(r => r.id === id);
  document.querySelector("[name='name']").value = record.name || "";
  document.querySelector("[name='age']").value = record.age || "";
  document.querySelector("[name='phone']").value = record.phone || "";
  document.querySelector("[name='notes']").value = record.notes || "";
  document.querySelector("[name='timing']").value = record.timing || "";
  document.querySelectorAll("[name='days']").forEach(cb => cb.checked = record.days ? record.days.split(" - ").includes(cb.value) : false);
  document.querySelectorAll("[name='activity']").forEach(cb => cb.checked = record.activity ? record.activity.split(" - ").includes(cb.value) : false);
  document.querySelectorAll("[name='uniform']").forEach(cb => cb.checked = false);
  document.querySelector("[name='time']").value = "";
  document.querySelector("[name='start']").value = "";
  document.querySelector("[name='end']").value = "";
  editIndex = id;
  closeSearchModal();
  showPage('register');
  showSuccessMessage("✔️ تم تحميل بيانات المشترك للتجديد");
}

document.getElementById("registerForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  const form = new FormData(this);
  let days = form.getAll("days").join(" - ");
  let activities = form.getAll("activity").join(" - ");
  let uniforms = form.getAll("uniform").join(" - ");
  const data = {
    name: form.get("name") || "", age: parseInt(form.get("age")) || 0, phone: form.get("phone") || "",
    activity: activities, days: days, timing: form.get("timing") || "", time: form.get("time") || "",
    start: form.get("start") || "", end: form.get("end") || "", cash: parseFloat(form.get("cash")) || 0,
    network: parseFloat(form.get("network")) || 0, remaining: parseFloat(form.get("remaining")) || 0,
    uniform: uniforms, notes: form.get("notes") || "", level: activities.includes("سباحة أطفال") ? 1 : undefined,
    coach: ""
  };
  if (!data.name || !data.phone || !data.age || !data.activity || !data.days || !data.timing) {
    alert("يرجى إدخال جميع الحقول المطلوبة");
    return;
  }
  if (data.start && data.end && data.start >= data.end) {
    alert("يجب أن تكون بداية الاشتراك قبل نهاية الاشتراك");
    return;
  }
  if (isNaN(data.cash) || isNaN(data.network) || isNaN(data.remaining)) {
    alert("يرجى إدخال قيم صحيحة للرسوم");
    return;
  }
  try {
    if (editIndex === -1) {
      const response = await fetch('/api/registrations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (response.ok) {
        lastData = data;
        lastSavedFields = { phone: data.phone, timing: data.timing, time: data.time, start: data.start, end: data.end };
        await fetchRegistrations();
        document.getElementById("registerForm").reset();
        document.querySelector("[name='phone']").value = lastSavedFields.phone || "";
        document.querySelector("[name='timing']").value = lastSavedFields.timing || "";
        document.querySelector("[name='time']").value = lastSavedFields.time || "";
        document.querySelector("[name='start']").value = lastSavedFields.start || "";
        document.querySelector("[name='end']").value = lastSavedFields.end || "";
        showSuccessMessage("✔️ تم حفظ البيانات بنجاح");
      } else alert("حدث خطأ أثناء حفظ البيانات.");
    } else {
      const response = await fetch(`/api/registrations/${editIndex}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (response.ok) {
        editIndex = -1;
        lastData = data;
        lastSavedFields = { phone: data.phone, timing: data.timing, time: data.time, start: data.start, end: data.end };
        await fetchRegistrations();
        document.getElementById("registerForm").reset();
        document.querySelector("[name='phone']").value = lastSavedFields.phone || "";
        document.querySelector("[name='timing']").value = lastSavedFields.timing || "";
        document.querySelector("[name='time']").value = lastSavedFields.time || "";
        document.querySelector("[name='start']").value = lastSavedFields.start || "";
        document.querySelector("[name='end']").value = lastSavedFields.end || "";
        showSuccessMessage("✔️ تم تعديل البيانات بنجاح");
      } else alert("حدث خطأ أثناء تعديل البيانات.");
    }
  } catch (error) {
    console.error(`Error in form submission: ${error.message}`);
    alert("حدث خطأ أثناء حفظ البيانات.");
  }
});

function editLastEntry() {
  if (!lastData) { alert("لا توجد بيانات لتعديلها."); return; }
  document.querySelector("[name='name']").value = lastData.name || "";
  document.querySelector("[name='age']").value = lastData.age || "";
  document.querySelector("[name='phone']").value = lastData.phone || "";
  document.querySelector("[name='notes']").value = lastData.notes || "";
  document.querySelector("[name='time']").value = lastData.time || "";
  document.querySelector("[name='start']").value = lastData.start || "";
  document.querySelector("[name='end']").value = lastData.end || "";
  document.querySelector("[name='cash']").value = lastData.cash || "";
  document.querySelector("[name='network']").value = lastData.network || "";
  document.querySelector("[name='remaining']").value = lastData.remaining || "";
  document.querySelectorAll("[name='days']").forEach(cb => cb.checked = lastData.days ? lastData.days.split(" - ").includes(cb.value) : false);
  document.querySelectorAll("[name='activity']").forEach(cb => cb.checked = lastData.activity ? lastData.activity.split(" - ").includes(cb.value) : false);
  document.querySelectorAll("[name='uniform']").forEach(cb => cb.checked = lastData.uniform ? lastData.uniform.split(" - ").includes(cb.value) : false);
  document.querySelector("[name='timing']").value = lastData.timing || "";
  editIndex = registrations.findIndex(r => r.phone === lastData.phone);
  showPage('register');
  showSuccessMessage("✔️ يمكنك الآن تعديل البيانات وحفظها");
}

function displayRegistrations(data) {
  const container = document.getElementById("registrationsTable");
  if (!container) return;
  if (data.length === 0) { container.innerHTML = "<p style='text-align:center;'>لا توجد بيانات للعرض</p>"; return; }
  let html = `
    <table border="1" cellpadding="10" cellspacing="0" style="width:100%; border-collapse:collapse;">
      <thead><tr style="background:#0077cc; color:white;"><th>#</th><th>الاسم الثلاثي</th><th>العمر</th><th>رقم الجوال</th><th>النشاط</th><th>أيام الاشتراك</th><th>التوقيت</th><th>تاريخ الاشتراك</th><th>بداية الاشتراك</th><th>نهاية الاشتراك</th><th>كاش</th><th>شبكة</th><th>المتبقي</th><th>الزي</th><th>ملاحظات</th><th>الإجراءات</th></tr></thead>
      <tbody>
  `;
  data.forEach((record, index) => {
    html += `
      <tr><td>${index + 1}</td><td class="full-name-cell">${record.name || "-"}</td><td>${record.age || "-"}</td><td>${record.phone || "-"}</td><td>${record.activity || "-"}</td><td>${record.days || "-"}</td><td>${record.timing || "-"}</td><td>${record.time || "-"}</td><td>${record.start || "-"}</td><td>${record.end || "-"}</td><td>${(record.cash || 0).toFixed(2)}</td><td>${(record.network || 0).toFixed(2)}</td><td>${(record.remaining || 0).toFixed(2)}</td><td>${record.uniform || "-"}</td><td>${record.notes || "-"}</td><td class="action-buttons"><button class="edit-btn action-btn" onclick="editMember(${record.id})">تعديل</button><button class="renew-btn action-btn" onclick="prepareRenew(${record.id})">تجديد</button><button class="delete-btn action-btn" onclick="deleteMember(${record.id})">حذف</button></td></tr>
    `;
  });
  html += "</tbody></table>";
  container.innerHTML = html;
  const table = container.querySelector("table");
  if (table) table.style.fontSize = currentFontSize + "px";
}

async function editMember(id) {
  const record = registrations.find(r => r.id === id);
  lastData = record;
  editIndex = id;
  document.querySelector("[name='name']").value = record.name || "";
  document.querySelector("[name='age']").value = record.age || "";
  document.querySelector("[name='phone']").value = record.phone || "";
  document.querySelector("[name='notes']").value = record.notes || "";
  document.querySelector("[name='time']").value = record.time || "";
  document.querySelector("[name='start']").value = record.start || "";
  document.querySelector("[name='end']").value = record.end || "";
  document.querySelector("[name='cash']").value = record.cash || "";
  document.querySelector("[name='network']").value = record.network || "";
  document.querySelector("[name='remaining']").value = record.remaining || "";
  document.querySelectorAll("[name='days']").forEach(cb => cb.checked = record.days ? record.days.split(" - ").includes(cb.value) : false);
  document.querySelectorAll("[name='activity']").forEach(cb => cb.checked = record.activity ? record.activity.split(" - ").includes(cb.value) : false);
  document.querySelectorAll("[name='uniform']").forEach(cb => cb.checked = record.uniform ? record.uniform.split(" - ").includes(cb.value) : false);
  document.querySelector("[name='timing']").value = record.timing || "";
  showPage('register');
  showSuccessMessage("✔️ يمكنك الآن تعديل البيانات وحفظها");
}

async function prepareRenew(id) {
  const record = registrations.find(r => r.id === id);
  document.querySelector("[name='name']").value = record.name || "";
  document.querySelector("[name='age']").value = record.age || "";
  document.querySelector("[name='phone']").value = record.phone || "";
  document.querySelector("[name='notes']").value = record.notes || "";
  document.querySelector("[name='timing']").value = record.timing || "";
  document.querySelector("[name='cash']").value = "";
  document.querySelector("[name='network']").value = "";
  document.querySelector("[name='remaining']").value = "";
  document.querySelectorAll("[name='days']").forEach(cb => cb.checked = record.days ? record.days.split(" - ").includes(cb.value) : false);
  document.querySelectorAll("[name='activity']").forEach(cb => cb.checked = record.activity ? record.activity.split(" - ").includes(cb.value) : false);
  document.querySelectorAll("[name='uniform']").forEach(cb => cb.checked = false);
  document.querySelector("[name='time']").value = "";
  document.querySelector("[name='start']").value = "";
  document.querySelector("[name='end']").value = "";
  editIndex = -1;
  showPage('register');
  showSuccessMessage("✔️ قم بتحديث تواريخ الاشتراك واحفظها");
}

async function deleteMember(id) {
  if (!confirm("هل أنت متأكد من حذف هذا السجل؟")) return;
  try {
    const response = await fetch(`/api/registrations/${id}`, { method: 'DELETE' });
    if (response.ok) {
      await fetchRegistrations();
      applyFilters();
      showSuccessMessage("✔️ تم حذف السجل بنجاح");
    } else alert("حدث خطأ أثناء حذف السجل.");
  } catch (error) {
    console.error(`Error in deleteMember: ${error.message}`);
    alert("حدث خطأ أثناء حذف السجل.");
  }
}

function copyData() {
  const table = document.querySelector("#members table");
  if (!table || table.rows.length <= 1) { alert("لا توجد بيانات لنسخها"); return; }
  let textToCopy = "";
  const headers = [];
  for (let cell of table.rows[0].cells) if (cell.textContent !== "الإجراءات") headers.push(cell.textContent);
  textToCopy += headers.join("\t") + "\n";
  for (let i = 1; i < table.rows.length; i++) {
    let rowData = []; for (let j = 0; j < table.rows[i].cells.length - 1; j++) rowData.push(table.rows[i].cells[j].textContent.trim());
    textToCopy += rowData.join("\t") + "\n";
  }
  const temp = document.createElement("textarea"); temp.value = textToCopy; document.body.appendChild(temp); temp.select(); document.execCommand("copy"); document.body.removeChild(temp);
  showSuccessMessage("✔️ تم نسخ البيانات");
}

function exportToCSV() {
  const data = currentDisplayedData;
  if (data.length === 0) { alert("لا توجد بيانات للتصدير"); return; }
  let csv = "\uFEFF#,الاسم الثلاثي,العمر,رقم الجوال,النشاط,أيام الاشتراك,التوقيت,تاريخ الاشتراك,بداية الاشتراك,نهاية الاشتراك,كاش,شبكة,المتبقي,الزي,ملاحظات\n";
  data.forEach((r, idx) => csv += [idx + 1, `"${r.name || ""}"`, `"${r.age || ""}"`, `"${r.phone || ""}"`, `"${r.activity || ""}"`, `"${r.days || ""}"`, `"${r.timing || ""}"`, `"${r.time || ""}"`, `"${r.start || ""}"`, `"${r.end || ""}"`, `"${(r.cash || 0).toFixed(2)}"`, `"${(r.network || 0).toFixed(2)}"`, `"${(r.remaining || 0).toFixed(2)}"`, `"${r.uniform || ""}"`, `"${r.notes || ""}"`].join(",") + "\n");
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "نتائج_البحث.csv"; a.click(); URL.revokeObjectURL(url);
  showSuccessMessage("✔️ تم تصدير البيانات بنجاح");
}

function changeFontSize(step) {
  currentFontSize += step; if (currentFontSize < 12) currentFontSize = 12; if (currentFontSize > 20) currentFontSize = 20;
  const tables = document.querySelectorAll("#members table, #childrenSwimming table, #monthlyReport table, #searchModal table");
  tables.forEach(table => { table.style.fontSize = currentFontSize + "px"; table.querySelectorAll("td, th").forEach(cell => cell.style.fontSize = currentFontSize + "px"); });
}

async function addCoach() {
  const coachName = document.getElementById("coachName").value.trim();
  if (!coachName) { alert("يرجى إدخال اسم المدرب"); return; }
  try {
    const response = await fetch('/api/coaches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: coachName }) });
    if (response.ok) {
      document.getElementById("coachName").value = "";
      await fetchCoaches();
      showSuccessMessage("✔️ تم إضافة المدرب بنجاح");
    } else alert("المدرب موجود بالفعل");
  } catch (error) {
    console.error(`Error in addCoach: ${error.message}`);
    alert("حدث خطأ أثناء إضافة المدرب.");
  }
}

async function deleteCoach() {
  const coachSelect = document.getElementById("filterCoach");
  const selectedCoach = coachSelect.value;
  if (!selectedCoach) { alert("يرجى اختيار مدرب لحذفه"); return; }
  if (!confirm(`هل أنت متأكد من حذف المدرب ${selectedCoach}؟`)) return;
  try {
    const response = await fetch(`/api/coaches/${selectedCoach}`, { method: 'DELETE' });
    if (response.ok) {
      await fetchCoaches();
      await fetchRegistrations();
      applyChildrenFilters();
      showSuccessMessage("✔️ تم حذف المدرب بنجاح");
    } else alert("حدث خطأ أثناء حذف المدرب.");
  } catch (error) {
    console.error(`Error in deleteCoach: ${error.message}`);
    alert("حدث خطأ أثناء حذف المدرب.");
  }
}

function populateCoachFilter() {
  const coachSelect = document.getElementById("filterCoach");
  coachSelect.innerHTML = '<option value="">كل المدربين</option>';
  coaches.forEach(coach => coachSelect.innerHTML += `<option value="${coach}">${coach}</option>`);
}

function normalizeArabic(text) {
  return text ? text.replace(/[إأآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[\u0617-\u061A\u064B-\u065F]/g, "").replace(/\s+/g, " ").toLowerCase().trim() : "";
}

function applyFilters() {
  let data = [...registrations];
  const term = normalizeArabic(document.getElementById("searchInput").value);
  const activityFilter = document.getElementById("filterActivity").value.trim();
  const timingFilter = document.getElementById("filterTiming").value.trim();
  const subscriptionFilter = document.getElementById("filterSubscription").value.trim();
  if (term) data = data.filter(record => normalizeArabic(record.name || "").includes(term));
  if (activityFilter) data = data.filter(record => record.activity && record.activity.includes(activityFilter));
  if (timingFilter) data = data.filter(record => record.timing && record.timing === timingFilter);
  const today = new Date().toISOString().split('T')[0];
  if (subscriptionFilter === "expired") data = data.filter(record => record.end && record.end < today);
  else if (subscriptionFilter === "active") data = data.filter(record => record.end && record.end >= today);
  else if (subscriptionFilter === "expiring_today") data = data.filter(record => record.end && record.end === today);
  currentDisplayedData = data;
  displayRegistrations(data);
}

function applyChildrenFilters() {
  let data = registrations.filter(record => record.activity && record.activity.includes("سباحة أطفال"));
  const term = normalizeArabic(document.getElementById("searchChildrenInput").value);
  const timingFilter = document.getElementById("filterChildrenTiming").value.trim();
  const coachFilter = document.getElementById("filterCoach").value.trim();
  if (term) data = data.filter(record => normalizeArabic(record.name || "").includes(term));
  if (timingFilter) data = data.filter(record => record.timing && record.timing === timingFilter);
  if (coachFilter) data = data.filter(record => record.coach && record.coach === coachFilter);
  currentDisplayedData = data;
  displayChildrenSwimming(data);
}

function displayChildrenSwimming(data) {
  const container = document.getElementById("childrenSwimmingTable");
  if (!container) return;
  if (data.length === 0) { container.innerHTML = "<p style='text-align:center;'>لا توجد بيانات للعرض</p>"; return; }
  let html = `
    <table border="1" cellpadding="10" cellspacing="0" style="width:100%; border-collapse:collapse;">
      <thead><tr style="background:#0077cc; color:white;"><th>#</th><th>الاسم</th><th>العمر</th><th>المستوى</th><th>نهاية الاشتراك</th><th>الأيام</th><th>التوقيت</th><th>المدرب</th><th>ملاحظات</th><th>الإجراءات</th></tr></thead>
      <tbody>
  `;
  data.forEach((record, index) => {
    const isEditing = editRowIndex === index;
    html += `
      <tr><td>${index + 1}</td><td class="full-name-cell">${record.name || "-"}</td><td>${record.age || "-"}</td><td>${isEditing ? `<select onchange="updateLevel(${record.id}, this.value)">${[1,2,3,4,5,6,7,8,9,10].map(level => `<option value="${level}" ${record.level === level ? "selected" : ""}>${level}</option>`).join("")}</select>` : record.level || "-"}</td><td>${record.end || "-"}</td><td>${record.days || "-"}</td><td>${isEditing ? `<select onchange="updateTiming(${record.id}, this.value)"><option value="">اختر توقيت</option>${["٤ مساءً","٥ مساءً","٦ مساءً","٧ مساءً","٨ مساءً","٩ مساءً"].map(timing => `<option value="${timing}" ${record.timing === timing ? "selected" : ""}>${timing}</option>`).join("")}</select>` : record.timing || "-"}</td><td>${isEditing ? `<select onchange="updateCoach(${record.id}, this.value)"><option value="">اختر مدرب</option>${coaches.map(coach => `<option value="${coach}" ${record.coach === coach ? "selected" : ""}>${coach}</option>`).join("")}</select>` : record.coach || "-"}</td><td>${record.notes || "-"}</td><td class="action-buttons"><button class="edit-btn action-btn" onclick="${isEditing ? `saveEdit(${index})` : `editChildrenRow(${index})`}">${isEditing ? "حفظ" : "تعديل"}</button><button class="delete-btn action-btn" onclick="deleteChildrenMember(${record.id})">حذف</button></td></tr>
    `;
  });
  html += "</tbody></table>";
  container.innerHTML = html;
  const table = container.querySelector("table");
  if (table) table.style.fontSize = currentFontSize + "px";
}

function editChildrenRow(index) { editRowIndex = index; applyChildrenFilters(); }
async function saveEdit(index) { editRowIndex = -1; applyChildrenFilters(); showSuccessMessage("✔️ تم حفظ التعديلات بنجاح"); }
async function updateLevel(id, value) { const record = registrations.find(r => r.id === id); const data = { ...record, level: parseInt(value) }; const response = await fetch(`/api/registrations/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (response.ok) await fetchRegistrations(); else alert("حدث خطأ أثناء تحديث المستوى."); }
async function updateTiming(id, value) { const record = registrations.find(r => r.id === id); const data = { ...record, timing: value }; const response = await fetch(`/api/registrations/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (response.ok) await fetchRegistrations(); else alert("حدث خطأ أثناء تحديث التوقيت."); }
async function updateCoach(id, value) { const record = registrations.find(r => r.id === id); const data = { ...record, coach: value }; const response = await fetch(`/api/registrations/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (response.ok) await fetchRegistrations(); else alert("حدث خطأ أثناء تحديث المدرب."); }
async function deleteChildrenMember(id) { if (!confirm("هل أنت متأكد من حذف هذا السجل؟")) return; const response = await fetch(`/api/registrations/${id}`, { method: 'DELETE' }); if (response.ok) { await fetchRegistrations(); applyChildrenFilters(); showSuccessMessage("✔️ تم حذف السجل بنجاح"); } else alert("حدث خطأ أثناء حذف السجل."); }
function copyChildrenData() { const table = document.querySelector("#childrenSwimming table"); if (!table || table.rows.length <= 1) { alert("لا توجد بيانات لنسخها"); return; } let textToCopy = ""; const headers = []; for (let cell of table.rows[0].cells) if (cell.textContent !== "الإجراءات") headers.push(cell.textContent); textToCopy += headers.join("\t") + "\n"; for (let i = 1; i < table.rows.length; i++) { let rowData = []; for (let j = 0; j < table.rows[i].cells.length - 1; j++) rowData.push(table.rows[i].cells[j].textContent.trim()); textToCopy += rowData.join("\t") + "\n"; } const temp = document.createElement("textarea"); temp.value = textToCopy; document.body.appendChild(temp); temp.select(); document.execCommand("copy"); document.body.removeChild(temp); showSuccessMessage("✔️ تم نسخ البيانات"); }
function exportChildrenToCSV() { const data = currentDisplayedData; if (data.length === 0) { alert("لا توجد بيانات للتصدير"); return; } let csv = "\uFEFF#,الاسم,العمر,المستوى,نهاية الاشتراك,الأيام,التوقيت,المدرب,ملاحظات\n"; data.forEach((r, idx) => csv += [idx + 1, `"${r.name || ""}"`, `"${r.age || ""}"`, `"${r.level || ""}"`, `"${r.end || ""}"`, `"${r.days || ""}"`, `"${r.timing || ""}"`, `"${r.coach || ""}"`, `"${r.notes || ""}"`].join(",") + "\n"); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "سباحة_الأطفال.csv"; a.click(); URL.revokeObjectURL(url); showSuccessMessage("✔️ تم تصدير البيانات بنجاح"); }
function generateMonthlyReport() { const month = document.getElementById("reportMonth").value; const year = document.getElementById("reportYear").value; const activityFilter = document.getElementById("filterReportActivity").value.trim(); const container = document.getElementById("reportTable"); const miniReportContainer = document.getElementById("miniReport"); if (!month || !year) { container.innerHTML = "<p style='text-align:center;'>يرجى اختيار الشهر والسنة</p>"; miniReportContainer.innerHTML = ""; return; } let data = registrations.filter(record => record.time && record.time.split("-")[1] === month && record.time.split("-")[0] === year); if (activityFilter) data = data.filter(record => record.activity && record.activity.includes(activityFilter)); let html = `<h3>تقرير المشتركين</h3><table border="1" cellpadding="10" cellspacing="0" style="width:100%; border-collapse:collapse;"><thead><tr style="background:#0077cc; color:white;"><th>#</th><th>الاسم الثلاثي</th><th>العمر</th><th>رقم الجوال</th><th>النشاط</th><th>أيام الاشتراك</th><th>التوقيت</th><th>تاريخ الاشتراك</th><th>كاش</th><th>شبكة</th><th>المتبقي</th><th>الزي</th><th>ملاحظات</th></tr></thead><tbody>`; let totalCash = 0, totalNetwork = 0, totalRemaining = 0; data.forEach((record, index) => { totalCash += record.cash || 0; totalNetwork += record.network || 0; totalRemaining += record.remaining || 0; html += `<tr><td>${index + 1}</td><td class="full-name-cell">${record.name || "-"}</td><td>${record.age || "-"}</td><td>${record.phone || "-"}</td><td>${record.activity || "-"}</td><td>${record.days || "-"}</td><td>${record.timing || "-"}</td><td>${record.time || "-"}</td><td>${(record.cash || 0).toFixed(2)}</td><td>${(record.network || 0).toFixed(2)}</td><td>${(record.remaining || 0).toFixed(2)}</td><td>${record.uniform || "-"}</td><td>${record.notes || "-"}</td></tr>`; }); html += `<tr style="font-weight:bold;"><td colspan="8">الإجمالي</td><td>${totalCash.toFixed(2)}</td><td>${totalNetwork.toFixed(2)}</td><td>${totalRemaining.toFixed(2)}</td><td colspan="2"></td></tr></tbody></table>`; container.innerHTML = data.length === 0 ? "<p style='text-align:center;'>لا توجد بيانات للعرض</p>" : html; const activityCount = { "سباحة أطفال": 0, "كورة": 0, "كاراتيه": 0, "جمباز": 0, "سباحة سيدات": 0, "كرة سلة": 0, "قدم بنات": 0 }; const activityCash = { ...activityCount }; const activityNetwork = { ...activityCount }; const activityRemaining = { ...activityCount }; const uniformCount = { "زي كرة القدم": 0, "زي الكاراتيه": 0 }; data.forEach(record => { if (record.activity) { record.activity.split(" - ").forEach(activity => { if (activityCount[activity] !== undefined) { activityCount[activity]++; activityCash[activity] += record.cash || 0; activityNetwork[activity] += record.network || 0; activityRemaining[activity] += record.remaining || 0; } }); } if (record.uniform) record.uniform.split(" - ").forEach(uniform => uniformCount[uniform] && uniformCount[uniform]++); }); let miniHtml = `<div class="mini-report"><h3>إجمالي الاشتراكات لكل نشاط</h3><table border="1" cellpadding="10" cellspacing="0"><thead><tr style="background:#0077cc; color:white;"><th>النشاط</th><th>عدد المشتركين</th><th>إجمالي كاش</th><th>إجمالي شبكة</th><th>إجمالي المتبقي</th></tr></thead><tbody>`; for (const [activity, count] of Object.entries(activityCount)) if (count > 0 || !activityFilter) miniHtml += `<tr><td>${activity}</td><td>${count}</td><td>${activityCash[activity].toFixed(2)}</td><td>${activityNetwork[activity].toFixed(2)}</td><td>${activityRemaining[activity].toFixed(2)}</td></tr>`; miniHtml += `</tbody></table><h3>تقرير الزي</h3><table border="1" cellpadding="10" cellspacing="0"><thead><tr style="background:#0077cc; color:white;"><th>نوع الزي</th><th>العدد</th></tr></thead><tbody>`; for (const [uniform, count] of Object.entries(uniformCount)) if (count > 0) miniHtml += `<tr><td>${uniform}</td><td>${count}</td></tr>`; miniHtml += `</tbody></table></div>`; miniReportContainer.innerHTML = data.length === 0 ? "" : miniHtml; }
function copyReportData() { const table = document.querySelector("#reportTable table"); const miniReport = document.querySelector("#miniReport"); if (!table || table.rows.length <= 1) { alert("لا توجد بيانات لنسخها"); return; } let textToCopy = "تقرير المشتركين\n"; const headers = []; for (let cell of table.rows[0].cells) headers.push(cell.textContent); textToCopy += headers.join("\t") + "\n"; for (let i = 1; i < table.rows.length; i++) { let rowData = []; for (let j = 0; j < table.rows[i].cells.length; j++) rowData.push(table.rows[i].cells[j].textContent.trim()); textToCopy += rowData.join("\t") + "\n"; } textToCopy += "\nإجمالي الاشتراكات لكل نشاط\n"; const activityTable = miniReport.querySelector("table:nth-child(2)"); if (activityTable) { const activityHeaders = []; for (let cell of activityTable.rows[0].cells) activityHeaders.push(cell.textContent); textToCopy += activityHeaders.join("\t") + "\n"; for (let i = 1; i < activityTable.rows.length; i++) { let rowData = []; for (let j = 0; j < activityTable.rows[i].cells.length; j++) rowData.push(activityTable.rows[i].cells[j].textContent.trim()); textToCopy += rowData.join("\t") + "\n"; } } textToCopy += "\nتقرير الزي\n"; const uniformTable = miniReport.querySelector("table:nth-child(4)"); if (uniformTable) { const uniformHeaders = []; for (let cell of uniformTable.rows[0].cells) uniformHeaders.push(cell.textContent); textToCopy += uniformHeaders.join("\t") + "\n"; for (let i = 1; i < uniformTable.rows.length; i++) { let rowData = []; for (let j = 0; j < uniformTable.rows[i].cells.length; j++) rowData.push(uniformTable.rows[i].cells[j].textContent.trim()); textToCopy += rowData.join("\t") + "\n"; } } const temp = document.createElement("textarea"); temp.value = textToCopy; document.body.appendChild(temp); temp.select(); document.execCommand("copy"); document.body.removeChild(temp); showSuccessMessage("✔️ تم نسخ التقرير"); }
function exportReportToCSV() { const month = document.getElementById("reportMonth").value; const year = document.getElementById("reportYear").value; const activityFilter = document.getElementById("filterReportActivity").value.trim(); let data = registrations.filter(record => record.time && record.time.split("-")[1] === month && record.time.split("-")[0] === year); if (activityFilter) data = data.filter(record => record.activity && record.activity.includes(activityFilter)); if (data.length === 0) { alert("لا توجد بيانات للتصدير"); return; } let csv = "\uFEFFتقرير المشتركين\n#,الاسم الثلاثي,العمر,رقم الجوال,النشاط,أيام الاشتراك,التوقيت,تاريخ الاشتراك,كاش,شبكة,المتبقي,الزي,ملاحظات\n"; let totalCash = 0, totalNetwork = 0, totalRemaining = 0; data.forEach((r, idx) => { totalCash += r.cash || 0; totalNetwork += r.network || 0; totalRemaining += r.remaining || 0; csv += [idx + 1, `"${r.name || ""}"`, `"${r.age || ""}"`, `"${r.phone || ""}"`, `"${r.activity || ""}"`, `"${r.days || ""}"`, `"${r.timing || ""}"`, `"${r.time || ""}"`, `"${(r.cash || 0).toFixed(2)}"`, `"${(r.network || 0).toFixed(2)}"`, `"${(r.remaining || 0).toFixed(2)}"`, `"${r.uniform || ""}"`, `"${r.notes || ""}"`].join(",") + "\n"; }); csv += `,,الإجمالي,,,,,,${totalCash.toFixed(2)},${totalNetwork.toFixed(2)},${totalRemaining.toFixed(2)},,\n\nإجمالي الاشتراكات لكل نشاط\nالنشاط,عدد المشتركين,إجمالي كاش,إجمالي شبكة,إجمالي المتبقي\n`; const activityCount = { "سباحة أطفال": 0, "كورة": 0, "كاراتيه": 0, "جمباز": 0, "سباحة سيدات": 0, "كرة سلة": 0, "قدم بنات": 0 }; const activityCash = { ...activityCount }; const activityNetwork = { ...activityCount }; const activityRemaining = { ...activityCount }; data.forEach(record => { if (record.activity) record.activity.split(" - ").forEach(activity => { if (activityCount[activity]) { activityCount[activity]++; activityCash[activity] += record.cash || 0; activityNetwork[activity] += record.network || 0; activityRemaining[activity] += record.remaining || 0; } }); }); for (const [activity, count] of Object.entries(activityCount)) if (count > 0 || !activityFilter) csv += `"${activity}",${count},${activityCash[activity].toFixed(2)},${activityNetwork[activity].toFixed(2)},${activityRemaining[activity].toFixed(2)}\n`; csv += "\nتقرير الزي\nنوع الزي,العدد\n"; const uniformCount = { "زي كرة القدم": 0, "زي الكاراتيه": 0 }; data.forEach(record => { if (record.uniform) record.uniform.split(" - ").forEach(uniform => uniformCount[uniform] && uniformCount[uniform]++); }); for (const [uniform, count] of Object.entries(uniformCount)) if (count > 0) csv += `"${uniform}",${count}\n`; const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `تقرير_شهر_${month}_${year}.csv`; a.click(); URL.revokeObjectURL(url); showSuccessMessage("✔️ تم تصدير التقرير بنجاح"); }

initializeButtons();
function initializeButtons() {
  const buttons = [
    { id: "newRegisterBtn", handler: resetForm },
    { id: "renewRegisterBtn", handler: openSearchModal },
    { id: "saveBtn", handler: () => document.getElementById("registerForm").dispatchEvent(new Event("submit")) },
    { id: "editLastBtn", handler: editLastEntry },
    { id: "showMembersBtn", handler: () => showPage('members') },
    { id: "copyDataBtn", handler: copyData },
    { id: "exportCSVBtn", handler: exportToCSV },
    { id: "addCoachBtn", handler: addCoach },
    { id: "deleteCoachBtn", handler: deleteCoach },
    { id: "copyChildrenDataBtn", handler: copyChildrenData },
    { id: "exportChildrenCSVBtn", handler: exportChildrenToCSV },
    { id: "copyReportBtn", handler: copyReportData },
    { id: "exportReportBtn", handler: exportReportToCSV }
  ];
  buttons.forEach(btn => document.getElementById(btn.id)?.addEventListener("click", btn.handler));
}
