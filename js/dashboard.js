const AUTH_KEY = 'ot_auth';

// ถ้ายังไม่ Login กลับไปหน้า login.html
if (localStorage.getItem(AUTH_KEY) !== 'ok') {
  window.location.href = 'login.html';
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = 'login.html';
}

function saveOT() {
  const rate = parseFloat(document.getElementById('ot-rate').value) || 0;
  const h1 = parseFloat(document.getElementById('h1').value) || 0;
  const h15 = parseFloat(document.getElementById('h15').value) || 0;
  const h2 = parseFloat(document.getElementById('h2').value) || 0;
  const h3 = parseFloat(document.getElementById('h3').value) || 0;

  const totalHours = h1 + h15 + h2 + h3;
  const totalMoney = (h1 * rate) + (h15 * rate * 1.5) + (h2 * rate * 2) + (h3 * rate * 3);

  document.getElementById('summary').innerHTML = `
    <p>รวมชั่วโมง: ${totalHours.toFixed(2)} ชม.</p>
    <p>รวมเงิน: ฿${totalMoney.toFixed(2)}</p>
  `;
}
