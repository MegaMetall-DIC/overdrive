document.addEventListener('DOMContentLoaded', () => {

  const btnSearch = document.getElementById('btnSearch');
  const nickListInput = document.getElementById('nickList');
  const hotelSelect = document.getElementById('hotelSelect');
  const resultsGrid = document.getElementById('resultsGrid');
  const scanStatus = document.getElementById('scanStatus');
  const resultCount = document.getElementById('resultCount');
  const failuresToggle = document.getElementById('failuresToggle');
  const failuresBody = document.getElementById('failuresBody');
  const toggleIcon = document.getElementById('toggleIcon');
  const failuresListUI = document.getElementById('failuresList');
  const failCountUI = document.getElementById('failCount');
  const retryStatus = document.getElementById('retryStatus');
  const chkAllGroups = document.getElementById('chkAllGroups');
  const chkOtherPolice = document.getElementById('chkOtherPolice');
  const chkOffline = document.getElementById('chkOffline');
  const chkHidden = document.getElementById('chkHidden');
  const analyticsPanel = document.getElementById('analyticsPanel');
  const statOnline = document.getElementById('statOnline');
  const statRisco = document.getElementById('statRisco');
  const statBaixas = document.getElementById('statBaixas');
  const btnExportPDF = document.getElementById('btnExportPDF');
  const aiOverlay = document.getElementById('aiOverlay');

  let failedNicks = [];
  let scannedUsersData = [];
  let isRetrying = false;
  let systemLegislationData = {};
  let hasWelcomed = false;
  let iaIsSpeaking = false;

  // ==========================================================
  // 🔥 NOVO MOTOR 3D ULTRA DENSO – ROSTO HOLOGRÁFICO INSANO
  // ==========================================================

  const canvas = document.getElementById('aiCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 1200;
  canvas.height = 1200;

  const points3D = [];
  const edges = [];

  const cols = 75;   // MAIS DENSO
  const rows = 95;   // MAIS DENSO
  const spacing = 6.2;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {

      let x = (j - cols / 2) * spacing;
      let y = (i - rows / 2) * spacing;

      if ((x * x) / (160 * 160) + (y * y) / (230 * 230) > 1) continue;

      let z = 150 * Math.cos(x / 160) * Math.cos(y / 160);
      z += 80 * Math.exp(-(x * x) / 250 - Math.pow(y - 5, 2) / 1800);
      z += 55 * Math.exp(-(x * x) / 120 - Math.pow(y - 50, 2) / 250);
      z -= 70 * Math.exp(-Math.pow(Math.abs(x) - 45, 2) / 300 - Math.pow(y + 5, 2) / 220);
      z += 45 * Math.exp(-Math.pow(Math.abs(x) - 70, 2) / 500 - Math.pow(y - 15, 2) / 400);
      z += 35 * Math.exp(-(x * x) / 600 - Math.pow(y - 95, 2) / 350);
      z += 45 * Math.exp(-(x * x) / 500 - Math.pow(y - 145, 2) / 350);

      points3D.push({ x, y, z, r: i, c: j });
    }
  }

  const pointMap = new Map();
  points3D.forEach((p, index) => {
    pointMap.set(`${p.r}_${p.c}`, index);
  });

  points3D.forEach((p, index) => {
    const right = pointMap.get(`${p.r}_${p.c + 1}`);
    const down = pointMap.get(`${p.r + 1}_${p.c}`);
    const diag = pointMap.get(`${p.r + 1}_${p.c + 1}`);

    if (right !== undefined) edges.push([index, right]);
    if (down !== undefined) edges.push([index, down]);
    if (diag !== undefined) edges.push([index, diag]); // triangulação
  });

  let animTime = 0;
  let renderLoopActive = false;

  function renderFace3D() {
    if (!renderLoopActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    animTime += 0.016;

    const projected = [];
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    for (let i = 0; i < points3D.length; i++) {
      let { x, y, z } = points3D[i];

      if (iaIsSpeaking && y > 40 && y < 140 && Math.abs(x) < 55) {
        let mouthOpen = Math.abs(Math.sin(animTime * 18)) * 22;
        y += mouthOpen * Math.exp(-(x * x) / 350);
      }

      const rotY = Math.sin(animTime * 0.35) * 0.5;
      const rotX = Math.cos(animTime * 0.25) * 0.2;

      let y1 = y * Math.cos(rotX) - z * Math.sin(rotX);
      let z1 = y * Math.sin(rotX) + z * Math.cos(rotX);
      let x2 = x * Math.cos(rotY) - z1 * Math.sin(rotY);
      let z2 = x * Math.sin(rotY) + z1 * Math.cos(rotY);

      const fov = 1000;
      const scale = fov / (fov - z2 + 350);
      const zoom = 3.2;

      projected.push({
        x: cx + x2 * scale * zoom,
        y: cy + y1 * scale * zoom
      });
    }

    ctx.strokeStyle = 'rgba(0,255,255,0.55)';
    ctx.lineWidth = 0.8;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    for (let i = 0; i < edges.length; i++) {
      const p1 = projected[edges[i][0]];
      const p2 = projected[edges[i][1]];
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }
    ctx.stroke();

    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(0,255,255,0.9)';
    for (let i = 0; i < projected.length; i++) {
      if (i % 2 === 0) {
        ctx.beginPath();
        ctx.arc(projected[i].x, projected[i].y, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    requestAnimationFrame(renderFace3D);
  }

  // ==========================================================
  // 🔊 VOZ + RESTANTE DO SISTEMA (INALTERADO)
  // ==========================================================

  let audioCtx;
  let typingInterval;
  let synthVoices = [];

  function populateVoices() {
    synthVoices = window.speechSynthesis.getVoices().filter(v => v.lang.includes('pt'));
  }
  if (window.speechSynthesis.onvoiceschanged !== undefined)
    window.speechSynthesis.onvoiceschanged = populateVoices;
  populateVoices();

  function initAudio() {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  function speakText(text, onStart, onEnd) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'pt-BR';
      utter.pitch = 1.5;
      utter.rate = 1.3;
      if (synthVoices.length > 0) utter.voice = synthVoices[0];
      utter.onstart = () => { iaIsSpeaking = true; if (onStart) onStart(); };
      utter.onend = () => { iaIsSpeaking = false; if (onEnd) onEnd(); };
      window.speechSynthesis.speak(utter);
    }
  }

  document.body.addEventListener('click', () => {
    if (!hasWelcomed) {
      initAudio();
      speakText("Sistema Intel Tracker online.");
      hasWelcomed = true;
    }
  }, { once: true });

  // ==========================================================
  // 🎬 SEQUÊNCIA CINEMÁTICA FINAL
  // ==========================================================

  btnSearch.addEventListener('click', () => {

    setTimeout(() => {
      aiOverlay.classList.add('active');
      renderLoopActive = true;
      renderFace3D();

      setTimeout(() => {
        speakText("Varredura concluída.", null, () => {
          setTimeout(() => {
            aiOverlay.classList.remove('active');
            renderLoopActive = false;
          }, 800);
        });
      }, 1200);

    }, 800);
  });

});
