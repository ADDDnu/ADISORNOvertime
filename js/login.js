const AUTH_KEY = 'ot_manual_auth_v1';
document.getElementById('btn-login').onclick = () => {
  const pin = document.getElementById('pin').value.trim();
  if(pin === '120352'){
    localStorage.setItem(AUTH_KEY,'ok');
    location.href = 'index.html?v=17';
  }else{
    alert('PIN ไม่ถูกต้อง');
  }
};
