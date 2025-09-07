const PIN_KEY = 'ot_pin';
const AUTH_KEY = 'ot_auth';
const DEFAULT_PIN = '120352';

function getPin() {
  return localStorage.getItem(PIN_KEY) || DEFAULT_PIN;
}
function setPin(pin) {
  localStorage.setItem(PIN_KEY, pin);
}
function isAuthed() {
  return localStorage.getItem(AUTH_KEY) === 'ok';
}
function setAuthed(v) {
  if (v) localStorage.setItem(AUTH_KEY, 'ok');
  else localStorage.removeItem(AUTH_KEY);
}

function showLogin(show) {
  document.getElementById('login-wrap').style.display = show ? 'flex' : 'none';
}

function addDigit(d) {
  const el = document.getElementById('pin-input');
  el.value = (el.value || '') + d;
}
function clearPin() {
  document.getElementById('pin-input').value = '';
}
function tryLogin() {
  const input = document.getElementById('pin-input').value || '';
  if (input === getPin()) {
    setAuthed(true);
    showLogin(false);
  } else {
    document.getElementById('pin-msg').innerText = 'PIN ไม่ถูกต้อง';
  }
}

function logout() {
  setAuthed(false);
  showLogin(true);
}

document.getElementById('btn-logout-top').onclick = logout;
document.getElementById('avatar').onclick = () => {
  document.getElementById('profile-wrap').style.display = 'flex';
};
function closeProfile() {
  document.getElementById('profile-wrap').style.display = 'none';
}

// Salary to hourly rate
document.getElementById('btn-salary-convert').onclick = () => {
  const salary = parseFloat(document.getElementById('monthly-salary').value || '0');
  const hourly = salary / 210;
  alert(`ฐานต่อชั่วโมง = ${hourly.toFixed(2)} บาท`);
};

// Init
(function init() {
  if (!isAuthed()) showLogin(true);
})();
