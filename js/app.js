const AUTH_KEY='ot_manual_auth_v1';
if (localStorage.getItem(AUTH_KEY) !== 'ok') { location.href='login.html?v=14'; }

document.getElementById('btn-logout').onclick=()=>{
  localStorage.removeItem(AUTH_KEY);
  location.href='login.html?v=14';
};

// Local Storage
const KEY='ot_manual_v1';
const db={
  load(){ return JSON.parse(localStorage.getItem(KEY)||'{"entries":{}}'); },
  save(d){ localStorage.setItem(KEY, JSON.stringify(d)); },
  upsert(date, entry){ const d=db.load(); d.entries[date]=entry; db.save(d); }
};

// Helper
const $=s=>document.querySelector(s);
const ymd=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');

// Save with popup
const btnSave=$('#btn-save');
if(btnSave) btnSave.onclick=()=>{
  const date=$('#in-date').value || ymd(new Date());
  const entry={
    rate: parseFloat($('#in-rate').value || '0') || null,
    h1: parseFloat($('#h1').value || '0') || 0,
    h15: parseFloat($('#h15').value || '0') || 0,
    h2: parseFloat($('#h2').value || '0') || 0,
    h3: parseFloat($('#h3').value || '0') || 0,
    note: $('#in-note').value || ''
  };
  db.upsert(date, entry);
  alert('บันทึกเวลาสำเร็จ!\\nวันที่: ' + date); // popup ยืนยัน
};
