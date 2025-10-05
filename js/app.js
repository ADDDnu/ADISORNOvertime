const AUTH_KEY='ot_manual_auth_v1';
if(localStorage.getItem(AUTH_KEY)!=='ok')location.href='login.html?v=17';

const KEY='ot_manual_v1';
const db={
  load(){try{return JSON.parse(localStorage.getItem(KEY))||{entries:{},defRate:0}}catch{return{entries:{},defRate:0}}},
  save(d){localStorage.setItem(KEY,JSON.stringify(d));},
  upsert(date,entry){const d=db.load();d.entries[date]=entry;db.save(d);},
  remove(date){const d=db.load();delete d.entries[date];db.save(d);}
};

const $=s=>document.querySelector(s);
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>[d.getFullYear(),pad(d.getMonth()+1),pad(d.getDate())].join('-');
const thb=n=>'฿'+(n||0).toFixed(2);
const fmtMonth=(y,m)=>new Date(y,m-1,1).toLocaleDateString('th-TH',{year:'numeric',month:'long'});

let state={year:new Date().getFullYear(),month:new Date().getMonth()+1,view:'dashboard'};

// --- Render Dashboard ---
function renderDashboard(){
  const {entries}=db.load();
  const rows=Object.entries(entries)
    .filter(([d])=>d.startsWith(`${state.year}-${pad(state.month)}`))
    .map(([date,v])=>{
      const rate=+v.rate||+db.load().defRate||0;
      const h1=+v.h1||0,h15=+v.h15||0,h2=+v.h2||0,h3=+v.h3||0;
      const hours=h1+h15+h2+h3;
      const money=(h1*rate)+(h15*rate*1.5)+(h2*rate*2)+(h3*rate*3);
      return{date,hours,money,h1,h15,h2,h3};
    });
  const sumHours=rows.reduce((s,r)=>s+r.hours,0);
  const sumMoney=rows.reduce((s,r)=>s+r.money,0);
  $('#label-month').textContent=fmtMonth(state.year,state.month);
  $('#sum-month-hours').textContent=sumHours.toFixed(2)+' ชม.';
  $('#sum-month-money').textContent=thb(sumMoney);
  const list=$('#quick-list');list.innerHTML='';
  rows.forEach(r=>{
    const el=document.createElement('div');
    el.className='item';
    el.innerHTML=`<div><b>${r.date}</b><div class="muted">1×:${r.h1} 1.5×:${r.h15} 2×:${r.h2} 3×:${r.h3}</div></div>
      <div><span class="pill">${r.hours.toFixed(2)} ชม.</span><span class="pill money">${thb(r.money)}</span></div>`;
    list.appendChild(el);
  });
  initYearDropdown();
}

// --- Year Summary ---
function renderYearSummary(selectedYear){
  const {entries}=db.load();
  let totalHours=0,totalMoney=0;
  for(const [date,v] of Object.entries(entries)){
    const [y]=date.split('-').map(Number);
    if(y===selectedYear){
      const rate=+v.rate||+db.load().defRate||0;
      const h1=+v.h1||0,h15=+v.h15||0,h2=+v.h2||0,h3=+v.h3||0;
      totalHours+=h1+h15+h2+h3;
      totalMoney+=(h1*rate)+(h15*rate*1.5)+(h2*rate*2)+(h3*rate*3);
    }
  }
  $('#sum-year-hours').textContent=totalHours.toFixed(2)+' ชม.';
  $('#sum-year-money').textContent=thb(totalMoney);
}
function initYearDropdown(){
  const {entries}=db.load();
  const years=new Set(Object.keys(entries).map(d=>parseInt(d.split('-')[0])));
  const currentYear=new Date().getFullYear();
  if(!years.has(currentYear))years.add(currentYear);
  const select=$('#year-select');if(!select)return;
  select.innerHTML='';
  [...years].sort().forEach(y=>{
    const opt=document.createElement('option');
    opt.value=y;opt.textContent=y;select.appendChild(opt);
  });
  select.value=currentYear;
  select.onchange=()=>renderYearSummary(parseInt(select.value));
  renderYearSummary(currentYear);
}

// --- Save OT ---
$('#btn-save')?.addEventListener('click',()=>{
  const date=$('#in-date').value||ymd(new Date());
  const rate=parseFloat($('#in-rate').value||'0')||0;
  const h1=parseFloat($('#h1').value||'0')||0;
  const h15=parseFloat($('#h15').value||'0')||0;
  const h2=parseFloat($('#h2').value||'0')||0;
  const h3=parseFloat($('#h3').value||'0')||0;
  const msg=`ยืนยันบันทึก OT วันที่ ${date}\n1×:${h1} 1.5×:${h15} 2×:${h2} 3×:${h3}`;
  if(!confirm(msg))return;
  db.upsert(date,{rate,h1,h15,h2,h3});
  alert('บันทึกสำเร็จ!');renderDashboard();
});
$('#btn-delete')?.addEventListener('click',()=>{
  const date=$('#in-date').value;
  if(!date){alert('เลือกวันที่ก่อนลบ');return;}
  if(confirm('ต้องการลบข้อมูลวันที่ '+date+' ?')){db.remove(date);renderDashboard();}
});

// --- Save default rate ---
$('#btn-save-rate')?.addEventListener('click',()=>{
  const r=parseFloat($('#default-rate').value||'0');
  const d=db.load();d.defRate=r;db.save(d);
  alert('บันทึกค่าเริ่มต้นเรียบร้อย');
});

// --- Month Nav ---
$('#btn-month-prev')?.addEventListener('click',()=>{state.month--;if(state.month<1){state.month=12;state.year--;}renderDashboard();});
$('#btn-month-next')?.addEventListener('click',()=>{state.month++;if(state.month>12){state.month=1;state.year++;}renderDashboard();});

// --- Tabs ---
document.querySelectorAll('.tab').forEach(t=>{
  t.onclick=()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    document.querySelectorAll('section').forEach(s=>s.classList.remove('active'));
    $('#view-'+t.dataset.view).classList.add('active');
    if(t.dataset.view==='dashboard')renderDashboard();
    if(t.dataset.view==='report')initYearDropdown();
  };
});

// --- Logout ---
$('#btn-logout')?.addEventListener('click',()=>{
  if(confirm('ออกจากระบบหรือไม่?')){localStorage.removeItem(AUTH_KEY);location.href='login.html?v=17';}
});

// --- Init ---
renderDashboard();
