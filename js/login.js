// Keys
const PIN_KEY = 'ot_manual_pin_v1';
const AUTH_KEY = 'ot_manual_auth_v1';
const DEFAULT_PIN = '120352';

// Helpers
const getPin = () => localStorage.getItem(PIN_KEY) || DEFAULT_PIN;
const setAuthed = (v) => v ? localStorage.setItem(AUTH_KEY,'ok') : localStorage.removeItem(AUTH_KEY);

// If already authed -> go dashboard
if (localStorage.getItem(AUTH_KEY) === 'ok') {
  location.href = 'index.html';
}

window.login = function(){
  const val = (document.getElementById('pin-input').value || '').trim();
  if (val.length !== 6) { alert('กรุณาใส่ PIN 6 หลัก'); return; }
  if (val === getPin()) { setAuthed(true); location.href = 'index.html'; }
  else { alert('PIN ไม่ถูกต้อง'); }
};
