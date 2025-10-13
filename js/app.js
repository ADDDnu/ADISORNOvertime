// ===== ตรวจสอบสิทธิ์ Login =====
const AUTH_KEY = 'ot_manual_auth_v1';
if (localStorage.getItem(AUTH_KEY) !== 'ok')
  location.href = 'login.html?v=17.9.2';

// ===== Database =====
const KEY = 'ot_manual_v1';
const db = {
  load() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || { entries: {}, defRate: 0 };
    } catch {
      return { entries: {}, defRate: 0 };
    }
  },
  save(d) {
    localStorage.setItem(KEY, JSON.stringify(d));
  },
  upsert(date, entry) {
    const d = db.load();
    d.entries[date] = entry;
    db.save(d);
  },
  remove(date) {
    const d = db.load();
    delete d.entries[date];
    db.save(d);
  }
};

// ===== Utility =====
const $ = s => document.querySelector(s);
const pad = n => String(n).padStart(2, '0');
const ymd = d => [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join('-');
const thb = n => '฿' + (n || 0).toFixed(2);
const fmtMonth = (y, m) =>
  new Date(y, m - 1, 1).toLocaleDateString('th-TH', { year: 'numeric', month: 'long' });

// ===== Global State =====
let state = { year: new Date().getFullYear(), month: new Date().getMonth() + 1, view: 'dashboard' };

// ===== Dashboard =====
function renderDashboard() {
  const { entries } = db.load();
  const rows = Object.entries(entries)
    .filter(([d]) => d.startsWith(`${state.year}-${pad(state.month)}`))
    .map(([date, v]) => {
      const rate = +v.rate || +db.load().defRate || 0;
      const h1 = +v.h1 || 0,
        h15 = +v.h15 || 0,
        h2 = +v.h2 || 0,
        h3 = +v.h3 || 0;
      const hours = h1 + h15 + h2 + h3;
      const money = h1 * rate + h15 * rate * 1.5 + h2 * rate * 2 + h3 * rate * 3;
      return { date, h1, h15, h2, h3, hours, money };
    });

  const sumHours = rows.reduce((s, r) => s + r.hours, 0);
  const sumMoney = rows.reduce((s, r) => s + r.money, 0);
  $('#label-month').textContent = fmtMonth(state.year, state.month);
  $('#sum-month-hours').textContent = sumHours.toFixed(2) + ' ชม.';
  $('#sum-month-money').textContent = thb(sumMoney);

  const list = $('#quick-list');
  list.innerHTML = '';
  rows.forEach(r => {
    const el = document.createElement('div');
    el.className = 'item';
    el.innerHTML = `<div><b>${r.date}</b><div class="muted">1×:${r.h1} 1.5×:${r.h15} 2×:${r.h2} 3×:${r.h3}</div></div>
      <div><span class="pill">${r.hours.toFixed(2)} ชม.</span><span class="pill money">${thb(
      r.money
    )}</span></div>`;
    list.appendChild(el);
  });

  renderDailyChart(state.year, state.month);
  renderCalendarSummary(state.year, state.month);
}

// ===== กราฟรายวัน =====
let dailyChart;
function renderDailyChart(year, month) {
  const { entries } = db.load();
  const daysInMonth = new Date(year, month, 0).getDate();
  const daily = Array(daysInMonth).fill(0);
  for (const [date, v] of Object.entries(entries)) {
    const [y, m, d] = date.split('-').map(Number);
    if (y === year && m === month) {
      const rate = +v.rate || +db.load().defRate || 0;
      const h1 = +v.h1 || 0,
        h15 = +v.h15 || 0,
        h2 = +v.h2 || 0,
        h3 = +v.h3 || 0;
      const money = h1 * rate + h15 * rate * 1.5 + h2 * rate * 2 + h3 * rate * 3;
      daily[d - 1] += money;
    }
  }
  const ctx = document.getElementById('dailyChart').getContext('2d');
  if (dailyChart) dailyChart.destroy();
  dailyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: daily.map((_, i) => (i + 1).toString()),
      datasets: [
        {
          label: 'ยอดเงินรายวัน (บาท)',
          data: daily,
          backgroundColor: 'rgba(68,91,212,.7)',
          borderColor: 'rgba(255,255,255,.8)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#fff' } },
        tooltip: { callbacks: { label: c => '฿' + c.formattedValue } }
      },
      scales: {
        x: { ticks: { color: '#fff' }, grid: { color: '#444' } },
        y: { ticks: { color: '#fff' }, grid: { color: '#333' } }
      }
    }
  });
}

// ===== ตารางการทำงานรายวัน (เริ่มวันอาทิตย์) =====
function renderCalendarSummary(year, month) {
  const { entries } = db.load();
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0 = Sunday
  const dailyHours = Array(daysInMonth).fill(0);

  for (const [date, v] of Object.entries(entries)) {
    const [y, m, d] = date.split('-').map(Number);
    if (y === year && m === month) {
      dailyHours[d - 1] =
        (+v.h1 || 0) + (+v.h15 || 0) + (+v.h2 || 0) + (+v.h3 || 0);
    }
  }

  const wrap = document.getElementById('calendar-summary');
  wrap.innerHTML = '';

  // 🟢 เว้นช่องก่อนวันแรกของเดือน
  for (let i = 0; i < firstDay; i++) {
    const e = document.createElement('div');
    e.className = 'day-cell off';
    wrap.appendChild(e);
  }

  // 🟢 เติมวันจริง
  dailyHours.forEach((h, i) => {
    let cls = 'none';
    if (h > 0 && h <= 2) cls = 'low';
    else if (h > 2 && h <= 4) cls = 'mid';
    else if (h > 4) cls = 'high';
    const el = document.createElement('div');
    el.className = `day-cell ${cls}`;
    el.innerHTML = `<strong>${i + 1}</strong>${h > 0 ? h.toFixed(1) + ' ชม.' : '-'}`;
    wrap.appendChild(el);
  });
}

// ===== รายงานรายปี =====
let monthlyChart;
function renderYearSummary(selectedYear) {
  const { entries } = db.load();
  let totalHours = 0,
    totalMoney = 0;
  for (const [date, v] of Object.entries(entries)) {
    const [y] = date.split('-').map(Number);
    if (y === selectedYear) {
      const rate = +v.rate || +db.load().defRate || 0;
      const h1 = +v.h1 || 0,
        h15 = +v.h15 || 0,
        h2 = +v.h2 || 0,
        h3 = +v.h3 || 0;
      totalHours += h1 + h15 + h2 + h3;
      totalMoney += h1 * rate + h15 * rate * 1.5 + h2 * rate * 2 + h3 * rate * 3;
    }
  }
  $('#sum-year-hours').textContent = totalHours.toFixed(2) + ' ชม.';
  $('#sum-year-money').textContent = thb(totalMoney);
}
function renderMonthlyChart(selectedYear) {
  const { entries } = db.load();
  const monthly = Array(12).fill(0);
  for (const [date, v] of Object.entries(entries)) {
    const [y, m] = date.split('-').map(Number);
    if (y === selectedYear) {
      const rate = +v.rate || +db.load().defRate || 0;
      const h1 = +v.h1 || 0,
        h15 = +v.h15 || 0,
        h2 = +v.h2 || 0,
        h3 = +v.h3 || 0;
      const money = h1 * rate + h15 * rate * 1.5 + h2 * rate * 2 + h3 * rate * 3;
      monthly[m - 1] += money;
    }
  }
  const ctx = document.getElementById('monthlyChart').getContext('2d');
  if (monthlyChart) monthlyChart.destroy();
  monthlyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'],
      datasets: [{
        label: 'ยอดรวมรายเดือน (บาท)',
        data: monthly,
        backgroundColor: 'rgba(255,206,86,.7)',
        borderColor: 'rgba(255,255,255,.8)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#fff' } },
        tooltip: { callbacks: { label: c => '฿' + c.formattedValue } }
      },
      scales: {
        x: { ticks: { color: '#fff' }, grid: { color: '#444' } },
        y: { ticks: { color: '#fff' }, grid: { color: '#333' } }
      }
    }
  });
}
function initYearDropdown() {
  const { entries } = db.load();
  const years = new Set(Object.keys(entries).map(d => parseInt(d.split('-')[0])));
  const cur = new Date().getFullYear();
  if (!years.has(cur)) years.add(cur);
  const select = $('#year-select');
  if (!select) return;
  select.innerHTML = '';
  [...years].sort().forEach(y => {
    const o = document.createElement('option');
    o.value = y;
    o.textContent = y;
    select.appendChild(o);
  });
  select.value = cur;
  const refresh = () => {
    const y = parseInt(select.value);
    renderYearSummary(y);
    renderMonthlyChart(y);
  };
  select.onchange = refresh;
  refresh();
}

// ===== Record (save/delete) =====
$('#btn-save')?.addEventListener('click', () => {
  const date = $('#in-date').value || ymd(new Date());
  const rate = parseFloat($('#in-rate').value || '0') || 0;
  const h1 = parseFloat($('#h1').value || '0') || 0;
  const h15 = parseFloat($('#h15').value || '0') || 0;
  const h2 = parseFloat($('#h2').value || '0') || 0;
  const h3 = parseFloat($('#h3').value || '0') || 0;
  const msg = `ยืนยันบันทึก OT วันที่ ${date}\n1×:${h1}  1.5×:${h15}  2×:${h2}  3×:${h3}`;
  if (!confirm(msg)) return;
  db.upsert(date, { rate, h1, h15, h2, h3 });
  alert('บันทึกสำเร็จ!');
  $('#in-rate').value = '';
  $('#h1').value = 0;
  $('#h15').value = 0;
  $('#h2').value = 0;
  $('#h3').value = 0;
  $('#in-date').value = '';
  renderDashboard();
});
$('#btn-delete')?.addEventListener('click', () => {
  const date = $('#in-date').value;
  if (!date) {
    alert('เลือกวันที่ก่อนลบ');
    return;
  }
  if (confirm('ต้องการลบข้อมูลวันที่ ' + date + ' ?')) {
    db.remove(date);
    renderDashboard();
  }
});

// ===== Settings =====
$('#btn-salary-calc')?.addEventListener('click', () => {
  const s = parseFloat($('#salary').value || '0');
  if (!s) {
    alert('กรุณากรอกเงินเดือน');
    return;
  }
  const rate = (s / 210).toFixed(2);
  $('#salary-result').textContent = 'อัตราต่อชั่วโมง = ' + rate + ' บาท/ชม.';
  $('#default-rate').value = rate;
});
$('#btn-save-rate')?.addEventListener('click', () => {
  const r = parseFloat($('#default-rate').value || '0');
  const d = db.load();
  d.defRate = r;
  db.save(d);
  alert('บันทึกค่าเริ่มต้นเรียบร้อย');
});
function getPin() {
  return localStorage.getItem('ot_pin') || '000000';
}
function setPin(nw) {
  localStorage.setItem('ot_pin', nw);
}
$('#btn-change-pin')?.addEventListener('click', () => {
  const oldp = $('#old-pin').value.trim(),
    newp = $('#new-pin').value.trim();
  if (oldp !== getPin()) {
    alert('PIN ปัจจุบันไม่ถูกต้อง');
    return;
  }
  if (newp.length !== 6) {
    alert('PIN ใหม่ต้องมี 6 หลัก');
    return;
  }
  setPin(newp);
  alert('เปลี่ยนรหัสเรียบร้อย');
  $('#old-pin').value = '';
  $('#new-pin').value = '';
});
$('#btn-reset-pin')?.addEventListener('click', () => {
  if (confirm('รีเซ็ต PIN เป็น 000000 ?')) {
    setPin('000000');
    alert('รีเซ็ตเรียบร้อย');
  }
});
$('#btn-export')?.addEventListener('click', () => {
  const data = db.load();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'EGAT_OT_Backup.json';
  a.click();
});
$('#btn-import')?.addEventListener('click', () => {
  const file = $('#import-file').files[0];
  if (!file) {
    alert('กรุณาเลือกไฟล์');
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      db.save(data);
      alert('กู้คืนแล้ว');
      renderDashboard();
    } catch {
      alert('ไฟล์ไม่ถูกต้อง');
    }
  };
  reader.readAsText(file);
});
$('#btn-update-app')?.addEventListener('click', () => {
  if (confirm('ล้าง Cache และโหลดใหม่?')) {
    caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
    location.reload(true);
  }
});

// ===== Tabs Navigation =====
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab').forEach(t => {
    t.onclick = () => {
      document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
      const target = document.getElementById('view-' + t.dataset.view);
      if (target) target.classList.add('active');
      if (t.dataset.view === 'dashboard') renderDashboard();
      if (t.dataset.view === 'report') initYearDropdown();
    };
  });
  renderDashboard();
});

// ===== Month Navigation =====
$('#btn-month-prev')?.addEventListener('click', () => {
  state.month--;
  if (state.month < 1) {
    state.month = 12;
    state.year--;
  }
  renderDashboard();
});
$('#btn-month-next')?.addEventListener('click', () => {
  state.month++;
  if (state.month > 12) {
    state.month = 1;
    state.year++;
  }
  renderDashboard();
});

// ===== Logout =====
$('#btn-logout')?.addEventListener('click', () => {
  if (confirm('ออกจากระบบหรือไม่?')) {
    localStorage.removeItem(AUTH_KEY);
    location.href = 'login.html?v=17.9.2';
  }
});
