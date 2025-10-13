// ===== กราฟรายวัน (เวอร์ชันใหม่ ปรับสัดส่วนอัตโนมัติ) =====
let dailyChart;
function renderDailyChart(year, month) {
  const { entries } = db.load();
  const days = new Date(year, month, 0).getDate();
  const data = Array(days).fill(0);

  // รวมยอดเงินแต่ละวัน
  for (const [date, v] of Object.entries(entries)) {
    const [y, m, d] = date.split('-').map(Number);
    if (y === year && m === month) {
      const rate = +v.rate || +db.load().defRate || 0;
      const money = (+v.h1 || 0) * rate + (+v.h15 || 0) * rate * 1.5 + (+v.h2 || 0) * rate * 2 + (+v.h3 || 0) * rate * 3;
      data[d - 1] += money;
    }
  }

  const maxValue = Math.max(...data);
  const ctx = document.getElementById('dailyChart').getContext('2d');
  if (dailyChart) dailyChart.destroy();

  dailyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map((_, i) => (i + 1).toString()),
      datasets: [{
        label: 'ยอดเงินรายวัน (บาท)',
        data: data,
        backgroundColor: data.map(v =>
          v === maxValue ? 'rgba(255,215,0,0.9)' : 'rgba(68,91,212,0.8)'
        ),
        borderColor: 'rgba(255,255,255,0.9)',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#fff' } },
        tooltip: {
          backgroundColor: 'rgba(30,30,30,0.8)',
          titleFont: { size: 13 },
          bodyFont: { size: 13 },
          callbacks: {
            label: ctx => `ยอดเงิน: ฿${Number(ctx.raw).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`
          }
        }
      },
      scales: {
        x: {
          display: true,
          ticks: {
            color: '#fff',
            font: { size: 10 }
          },
          grid: { color: 'rgba(255,255,255,0.05)' }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#fff',
            callback: v => '฿' + v.toLocaleString(),
            stepSize: Math.ceil(maxValue / 5) || 500
          },
          grid: { color: 'rgba(255,255,255,0.1)' },
          suggestedMax: maxValue > 0 ? maxValue * 1.2 : 1000
        }
      },
      animation: {
        duration: 600,
        easing: 'easeOutQuart'
      }
    }
  });
}
