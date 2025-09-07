// ===== Auth guard =====
const AUTH_KEY='ot_manual_auth_v1';
if (localStorage.getItem(AUTH_KEY) !== 'ok') { location.href='login.html?v=15'; }

// ===== PIN helpers =====
const PIN_KEY='ot_manual_pin_v1'; const DEFAULT_PIN='120352';
const getPin = ()=> localStorage.getItem(PIN_KEY) || DEFAULT_PIN;
const setPin = (p)=> localStorage.setItem(PIN_KEY, p);
document.getElementById('btn-logout').onclick=()=>{ localStorage.removeItem(AUTH_KEY); location.href='login.html?v=15'; };

// ===== Storage =====
const KEY='ot_manual_v1';
const db={
  load(){ try{return JSON.parse(localStorage.getItem(KEY))||{entries:{},defRate:0}}catch{return {entries:{},defRate:0}}},
  save(d){ localStorage.setItem(KEY, JSON.stringify(d)); },
  upsert(date, entry){ const d=db.load(); d.entries[date]=entry; db.save(d); },
  remove(date){ const d=db.load(); delete d.entries[date]; db.save(d); },
  setDefRate(v){ const d=db.load(); d.defRate=v; db.save(d); },
  clear(){ localStorage.removeItem(KEY); }
};

// ===== Utils =====
const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>[d.getFullYear(),pad(d.getMonth()+1),pad(d.getDate())].join('-');
const fmtMonth=(y,m)=> new Date(y,m-1,1).toLocaleDateString('th-TH',{year:'numeric',month:'long'});
const thb=n=>'฿'+(n||0).toFixed(2);
function calcTotals(rate,h1,h15,h2,h3){ const hours=(h1+h15+h2+h3); const money=h1*rate + h15*rate*1.5 + h2*rate*2 + h3*rate*3; return {hours,money}; }
function monthDays(y,m){ return new Date(y,m,0).getDate(); }
function entriesOfMonth(y,m){ const {entries} = db.load(); const list=[]; for(const [date,v] of Object.entries(entries)){ const [yy,mm]=date.split('-').map(Number); if(yy===y && mm===m){ const rate=+v.rate||+db.load().defRate||0; const h1=+v.h1||0, h15=+v.h15||0, h2=+v.h2||0, h3=+v.h3||0; const {hours,money}=calcTotals(rate,h1,h15,h2,h3); list.push({date,rate,h1,h15,h2,h3,hours,money,note:v.note||''}); } } list.sort((a,b)=>a.date<b.date?-1:1); return list; }
function sum(arr,f){ return arr.reduce((s,x)=>s+f(x),0); }

// ===== Tabs =====
let state={year:new Date().getFullYear(), month:new Date().getMonth()+1, view:'dashboard'};
$$('.tab').forEach(t=>t.onclick=()=>{ $$('.tab').forEach(x=>x.classList.remove('active')); t.classList.add('active'); state.view=t.dataset.view; $$('#view-dashboard,#view-daily,#view-reports,#view-settings').forEach(s=>s.style.display='none'); $('#view-'+state.view).style.display='block'; renderAll(); });

// ===== Charts =====
function drawBarChart(canvas, values){
  const ctx=canvas.getContext('2d'); const W=canvas.width=canvas.clientWidth*devicePixelRatio; const H=canvas.height=180*devicePixelRatio;
  ctx.clearRect(0,0,W,H); const pad=16*devicePixelRatio; const maxV=Math.max(1,...values); const step=(W-pad*2)/Math.max(1,values.length); const bw=step*0.7;
  values.forEach((v,i)=>{ const h=(H-pad*2)*(v/maxV); const x=pad+i*step+(step-bw)/2; const y=H-pad-h; ctx.fillStyle='#2b56d6'; ctx.fillRect(x,y,bw,h); });
  ctx.strokeStyle='#2a3561'; ctx.beginPath(); ctx.moveTo(pad,H-pad); ctx.lineTo(W-pad,H-pad); ctx.stroke();
}
function drawLineChart(canvas, values){
  const ctx=canvas.getContext('2d'); const W=canvas.width=canvas.clientWidth*devicePixelRatio; const H=canvas.height=180*devicePixelRatio;
  ctx.clearRect(0,0,W,H); const pad=16*devicePixelRatio; const maxV=Math.max(1,...values); const step=(W-pad*2)/Math.max(1, values.length-1);
  ctx.strokeStyle='#1e2746'; for(let i=1;i<=4;i++){ const y=pad+i*(H-pad*2)/5; ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(W-pad,y); ctx.stroke(); }
  ctx.strokeStyle='#ffd200'; ctx.lineWidth=3; ctx.beginPath();
  values.forEach((v,i)=>{ const x=pad+i*step; const y=H-pad-(H-pad*2)*(v/maxV); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke();
}

// ===== Renderers =====
function renderDashboard(){
  $('#label-month').textContent=fmtMonth(state.year,state.month);
  $('#label-year').textContent=state.year;
  const rows=entriesOfMonth(state.year,state.month);
  const sumH=+sum(rows,r=>r.hours).toFixed(2);
  const sumM=+sum(rows,r=>r.money).toFixed(2);
  $('#sum-month-hours').textContent=sumH+' ชม.';
  $('#sum-month-money').textContent=thb(sumM);

  const daysIn=monthDays(state.year,state.month);
  const dayVals=Array.from({length:daysIn},(_,i)=>{
    const d=i+1; const dateStr = `${state.year}-${pad(state.month)}-${pad(d)}`;
    const v=db.load().entries[dateStr];
    if(!v) return 0; const rate=+v.rate||+db.load().defRate||0;
    const {hours}=calcTotals(rate,+v.h1||0,+v.h15||0,+v.h2||0,+v.h3||0);
    return hours;
  });
  drawBarChart($('#chart-days'), dayVals);

  const monthMoney=Array.from({length:12},(_,i)=>{ const m=i+1; const rowsM=entriesOfMonth(state.year,m); return +rowsM.reduce((s,r)=>s+r.money,0).toFixed(2); });
  drawLineChart($('#chart-months'), monthMoney);

  const list=$('#quick-list'); list.innerHTML='';
  rows.forEach(r=>{
    const el=document.createElement('div'); el.className='item';
    el.innerHTML=`<div><strong>${r.date}</strong><div class="muted">1×:${r.h1||0} 1.5×:${r.h15||0} 2×:${r.h2||0} 3×:${r.h3||0}</div></div><div style="display:flex;gap:6px;align-items:center"><span class="pill">${r.hours.toFixed(2)} ชม.</span><span class="pill money">${thb(r.money)}</span></div>`;
    list.appendChild(el);
  });
}

function showBreakdown(rate,h1,h15,h2,h3){
  const wrap=$('#calc-breakdown'); wrap.innerHTML='';
  const head=document.createElement('div'); head.className='item';
  head.innerHTML=`<div><strong>ฐานต่อชั่วโมง</strong></div><div class="pill money">฿${(+rate||0).toFixed(2)}</div>`;
  wrap.appendChild(head);
  const rows=[{label:'1×',h:h1,mult:1},{label:'1.5×',h:h15,mult:1.5},{label:'2×',h:h2,mult:2},{label:'3×',h:h3,mult:3}];
  rows.forEach(r=>{
    const el=document.createElement('div'); el.className='item';
    el.innerHTML=`<div>${r.label} · ${(+r.h||0).toFixed(2)} ชม. × ${r.mult.toFixed(1)}×</div><div class="pill money">฿${((+r.h||0)*r.mult*(+rate||0)).toFixed(2)}</div>`;
    wrap.appendChild(el);
  });
  const tot=calcTotals(+rate||0,+h1||0,+h15||0,+h2||0,+h3||0);
  const sum=document.createElement('div'); sum.className='item';
  sum.innerHTML=`<div><strong>รวม</strong> (${tot.hours.toFixed(2)} ชม.)</div><div class="pill money">฿${tot.money.toFixed(2)}</div>`;
  wrap.appendChild(sum);
}

function renderDaily(){
  if(!$('#in-date').value) $('#in-date').value = ymd(new Date());
  const cur = db.load().entries[$('#in-date').value];
  $('#in-rate').value = cur ? (cur.rate ?? '') : '';
  $('#h1').value = cur ? (cur.h1 ?? '') : '';
  $('#h15').value = cur ? (cur.h15 ?? '') : '';
  $('#h2').value = cur ? (cur.h2 ?? '') : '';
  $('#h3').value = cur ? (cur.h3 ?? '') : '';
  $('#in-note').value = cur ? (cur.note ?? '') : '';

  const rate = +(cur ? (cur.rate || db.load().defRate) : db.load().defRate)||0;
  const h1=+(cur?.h1||0)||0, h15=+(cur?.h15||0)||0, h2=+(cur?.h2||0)||0, h3=+(cur?.h3||0)||0;
  showBreakdown(rate,h1,h15,h2,h3);

  const [y,m] = $('#in-date').value.split('-').map(Number);
  const rows=entriesOfMonth(y,m);
  const list=$('#daily-list'); list.innerHTML='';
  rows.forEach(r=>{
    const el=document.createElement('div'); el.className='item';
    el.innerHTML=`<div><strong>${r.date}</strong><div class="muted">${r.note||'-'}</div></div><div style="display:flex;gap:6px;align-items:center"><span class="pill">${r.hours.toFixed(2)} ชม.</span><span class="pill money">${thb(r.money)}</span></div>`;
    list.appendChild(el);
  });
}

function renderReports(){
  const y=+$('#rep-year').value, m=+$('#rep-month').value;
  const rows=entriesOfMonth(y,m);
  const list=$('#rep-list'); list.innerHTML='';
  rows.forEach(r=>{
    const el=document.createElement('div'); el.className='item';
    el.innerHTML=`<div><strong>${r.date}</strong><div class="muted">1×:${r.h1||0} 1.5×:${r.h15||0} 2×:${r.h2||0} 3×:${r.h3||0}</div></div><div style="display:flex;gap:6px;align-items:center"><span class="pill">${r.hours.toFixed(2)} ชม.</span><span class="pill money">${thb(r.money)}</span></div>`;
    list.appendChild(el);
  });
  const sumH=+rows.reduce((a,r)=>a+r.hours,0).toFixed(2);
  const sumM=+rows.reduce((a,r)=>a+r.money,0).toFixed(2);
  const el=document.createElement('div'); el.className='item';
  el.innerHTML=`<div><strong>รวมเดือน ${fmtMonth(y,m)}</strong></div><div style="display:flex;gap:6px;align-items:center"><span class="pill">${sumH.toFixed(2)} ชม.</span><span class="pill money">${thb(sumM)}</span></div>`;
  list.appendChild(el);
}

function renderSettings(){
  $('#def-rate').value = db.load().defRate || '';
  $('#defrate-note').textContent = db.load().defRate ? ('ค่าดีฟอลต์ปัจจุบัน: ฿'+(+db.load().defRate).toFixed(2)+'/ชม.') : '* ถ้าไม่กรอกฐาน/ชม. ในรายวัน ระบบจะใช้ค่าดีฟอลต์นี้';
}

// ===== Event Handlers =====
document.getElementById('btn-save').onclick = () => {
  const date = $('#in-date').value || ymd(new Date());
  const entry = {
    rate: parseFloat($('#in-rate').value || '0') || null,
    h1: parseFloat($('#h1').value || '0') || 0,
    h15: parseFloat($('#h15').value || '0') || 0,
    h2: parseFloat($('#h2').value || '0') || 0,
    h3: parseFloat($('#h3').value || '0') || 0,
    note: $('#in-note').value || ''
  };

  // Popup Confirm ก่อนบันทึก
  const msg = `
ยืนยันการบันทึกเวลา
วันที่: ${date}
1×: ${entry.h1} ชม.
1.5×: ${entry.h15} ชม.
2×: ${entry.h2} ชม.
3×: ${entry.h3} ชม.
  `;
  if (confirm(msg)) {
    db.upsert(date, entry);   // บันทึกเมื่อกดยืนยัน
    renderAll();
    alert('บันทึกเวลาสำเร็จ!');
  } else {
    alert('ยกเลิกการบันทึก');
  }
};

document.getElementById('btn-delete').onclick=()=>{
  const date=$('#in-date').value; if(!date) return;
  if(confirm('ลบรายการของ '+date+' ?')){ db.remove(date); renderAll(); }
};

['in-rate','h1','h15','h2','h3','in-date'].forEach(id=>{
  document.getElementById(id).addEventListener('input',()=>{
    const rate=+($('#in-rate').value || db.load().defRate || 0)||0;
    const h1=+($('#h1').value || 0)||0, h15=+($('#h15').value || 0)||0, h2=+($('#h2').value || 0)||0, h3=+($('#h3').value || 0)||0;
    showBreakdown(rate,h1,h15,h2,h3);
  });
});

function download(name, text, mime='text/plain'){ const blob=new Blob([text],{type:mime}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1500); }
document.getElementById('btn-export-csv').onclick=()=>{
  const y=+$('#rep-year').value, m=+$('#rep-month').value;
  const rows=entriesOfMonth(y,m);
  const header='date,rate,h1,h1_5,h2,h3,total_hours,total_money,note';
  const csv=[header, ...rows.map(r=>[r.date,r.rate,r.h1||0,r.h15||0,r.h2||0,r.h3||0,r.hours.toFixed(2),r.money.toFixed(2),`"${(r.note||'').replace(/"/g,'""')}"`].join(','))].join('\n');
  download(`ot_${y}-${pad(m)}.csv`, csv, 'text/csv');
};
document.getElementById('btn-export-json').onclick=()=> download('ot_backup.json', JSON.stringify(db.load(),null,2), 'application/json');
document.getElementById('btn-download-backup').onclick=()=>document.getElementById('btn-export-json').click();
document.getElementById('file-restore').onchange=async (e)=>{ const f=e.target.files[0]; if(!f) return; try{ const text=await f.text(); const data=JSON.parse(text); if(!data.entries) throw 0; db.save(data); alert('กู้คืนสำเร็จ'); renderAll(); }catch{ alert('ไฟล์ไม่ถูกต้อง'); } };

document.getElementById('btn-save-defrate').onclick=()=>{
  const v=parseFloat($('#def-rate').value||'0');
  const rate=v>0?v:0; db.setDefRate(rate);
  alert('บันทึกค่าดีฟอลต์แล้ว');
  renderSettings();
};
document.getElementById('btn-salary-convert').onclick=()=>{
  const s=parseFloat($('#monthly-salary').value||'0')||0;
  const rate = s>0 ? (s/210) : 0;
  db.setDefRate(rate);
  $('#def-rate').value = rate ? rate.toFixed(2) : '';
  $('#defrate-note').textContent='คำนวณจากเงินเดือน '+s.toFixed(2)+' ÷ 210 = ฿'+rate.toFixed(2)+'/ชม. (ตั้งเป็นดีฟอลต์แล้ว)';
  alert('อัปเดตฐาน/ชม. จากเงินเดือนสำเร็จ');
};
document.getElementById('btn-change-pin').onclick=()=>{
  const cur=$('#pin-current').value||'';
  const nw=$('#pin-new').value||'';
  if(cur!==getPin()) { alert('PIN ปัจจุบันไม่ถูกต้อง'); return; }
  if(!/^[0-9]{6}$/.test(nw)){ alert('PIN ใหม่ต้องมี 6 หลัก'); return; }
  setPin(nw); alert('เปลี่ยน PIN สำเร็จ'); $('#pin-current').value=''; $('#pin-new').value='';
};

document.getElementById('btn-update-app').onclick=async ()=>{
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
    alert('ล้างแคชเรียบร้อย กำลังรีโหลด...');
    location.href = location.pathname + '?v=' + Date.now();
  } catch (e) {
    alert('ไม่สำเร็จ ลองปิดแอปแล้วเปิดใหม่');
  }
};

// Reports pickers
(function initPickers(){
  const months=Array.from({length:12},(_,i)=>i+1);
  const yNow=new Date().getFullYear();
  const years=[yNow-1,yNow,yNow+1];
  const fill=(sel,list)=>{ sel.innerHTML=''; list.forEach(v=>{ const o=document.createElement('option'); o.value=v; o.textContent=v; sel.appendChild(o); }); };
  fill(document.getElementById('rep-month'), months);
  fill(document.getElementById('rep-year'), years);
  document.getElementById('rep-month').value = (new Date().getMonth()+1);
  document.getElementById('rep-year').value = (new Date().getFullYear());
  document.getElementById('rep-month').onchange=renderReports;
  document.getElementById('rep-year').onchange=renderReports;
})();

function renderAll(){
  if(state.view==='dashboard') renderDashboard();
  if(state.view==='daily') renderDaily();
  if(state.view==='reports') renderReports();
  if(state.view==='settings') renderSettings();
}
// Init default view
renderAll();

// Month nav via keyboard (optional)
// window.addEventListener('keydown', (e)=>{ if(state.view!=='dashboard') return; if(e.key==='ArrowLeft'){ state.month--; if(state.month<1){state.month=12; state.year--; } renderAll(); } if(e.key==='ArrowRight'){ state.month++; if(state.month>12){state.month=1; state.year++; } renderAll(); } });
