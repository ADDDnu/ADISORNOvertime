const AUTH_KEY = 'ot_manual_auth_v1';

// ดึงรหัส PIN จาก localStorage หรือใช้ค่าเริ่มต้น 000000
function getPin() {
  return localStorage.getItem('ot_pin') || '000000';
}

document.getElementById('btn-login').onclick = () => {
  const pin = document.getElementById('pin').value.trim();
  if (pin === getPin()) {
    localStorage.setItem(AUTH_KEY, 'ok');
    location.href = 'index.html?v=17.3';
  } else {
    alert('PIN ไม่ถูกต้อง');
  }
};
