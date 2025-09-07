const PIN_KEY = 'ot_pin';
const AUTH_KEY = 'ot_auth';
const DEFAULT_PIN = '120352';

function getPin() {
  return localStorage.getItem(PIN_KEY) || DEFAULT_PIN;
}
function setAuthed(v) {
  if (v) localStorage.setItem(AUTH_KEY, 'ok');
  else localStorage.removeItem(AUTH_KEY);
}

function login() {
  const input = document.getElementById('pin-input').value || '';
  if (input === getPin()) {
    setAuthed(true);
    window.location.href = 'index.html'; // ไป Dashboard
  } else {
    alert('PIN ไม่ถูกต้อง');
  }
}

// ถ้า Login อยู่แล้ว ไป Dashboard เลย
if (localStorage.getItem(AUTH_KEY) === 'ok') {
  window.location.href = 'index.html';
}
