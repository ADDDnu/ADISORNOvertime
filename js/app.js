// ===== ตั้งค่า =====

// 1. คำนวณอัตราค่าชม.จากเงินเดือน
$('#btn-salary-calc')?.addEventListener('click',()=>{
  const s=parseFloat($('#salary').value||'0');
  if(!s){alert('กรุณากรอกเงินเดือน');return;}
  const rate=(s/210).toFixed(2);
  $('#salary-result').textContent='อัตราต่อชั่วโมง = '+rate+' บาท/ชม.';
  $('#default-rate').value=rate;
});

// 2. เปลี่ยนรหัส PIN
function getPin(){ return localStorage.getItem('ot_pin') || '120352'; }
function setPin(nw){ localStorage.setItem('ot_pin',nw); }

$('#btn-change-pin')?.addEventListener('click',()=>{
  const oldp=$('#old-pin').value.trim();
  const newp=$('#new-pin').value.trim();
  const cur=getPin();
  if(oldp!==cur){ alert('PIN ปัจจุบันไม่ถูกต้อง'); return; }
  if(newp.length!==6){ alert('PIN ใหม่ต้องมี 6 หลัก'); return; }
  setPin(newp);
  alert('เปลี่ยนรหัสเรียบร้อย');
  $('#old-pin').value=''; $('#new-pin').value='';
});

// 3. สำรองข้อมูล
$('#btn-export')?.addEventListener('click',()=>{
  const data=db.load();
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='EGAT_OT_Backup.json';
  a.click();
});

// 4. กู้คืนข้อมูล
$('#btn-import')?.addEventListener('click',()=>{
  const file=$('#import-file').files[0];
  if(!file){alert('กรุณาเลือกไฟล์ก่อน');return;}
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const data=JSON.parse(e.target.result);
      db.save(data);
      alert('นำเข้าข้อมูลเรียบร้อย');
      renderDashboard();
    }catch(err){alert('ไฟล์ไม่ถูกต้อง');}
  };
  reader.readAsText(file);
});

// 5. อัปเดต / ล้าง Cache
$('#btn-update-app')?.addEventListener('click',()=>{
  if(confirm('ต้องการล้าง Cache และโหลดแอปใหม่หรือไม่?')){
    caches.keys().then(keys=>keys.forEach(k=>caches.delete(k)));
    location.reload(true);
  }
});
