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

  // ==========================================
  // MOTOR 3D: MALHA HOLOGRÁFICA (OTIMIZADO)
  // ==========================================
  const canvas = document.getElementById('aiCanvas');
  const ctx = canvas.getContext('2d');
  
  // Resolução interna do Canvas
  canvas.width = 1000;
  canvas.height = 1000;

  const points3D = [];
  const edges = [];
  
  // Resolução da Malha (Sweet spot entre FPS e Detalhamento Extremo)
  const cols = 40; 
  const rows = 55;
  const spacing = 8.5; // Espaçamento entre vértices

  // 1. GERAÇÃO MATEMÁTICA DA GEOMETRIA FACIAL (Calculado 1 vez só)
  for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
          let x = (j - cols / 2) * spacing;
          let y = (i - rows / 2) * spacing;

          // Máscara oval para cortar os cantos quadrados
          if ((x * x) / (140 * 140) + (y * y) / (200 * 200) > 1) continue;

          // Z-Depth: A Escultura do Rosto
          let z = 120 * Math.cos(x / 140) * Math.cos(y / 140); // Crânio base
          z += 65 * Math.exp(-(x * x) / 200 - Math.pow(y - 10, 2) / 2000); // Ponte do Nariz
          z += 40 * Math.exp(-(x * x) / 100 - Math.pow(y - 45, 2) / 300); // Ponta do Nariz
          z -= 55 * Math.exp(-Math.pow(Math.abs(x) - 35, 2) / 250 - Math.pow(y + 5, 2) / 200); // Cavidade Ocular
          z += 35 * Math.exp(-Math.pow(Math.abs(x) - 55, 2) / 400 - Math.pow(y - 15, 2) / 400); // Maçãs do rosto
          z += 25 * Math.exp(-(x * x) / 500 - Math.pow(y - 85, 2) / 300); // Lábios/Boca
          z += 35 * Math.exp(-(x * x) / 400 - Math.pow(y - 130, 2) / 300); // Queixo

          // Adiciona leve "ruído" orgânico
          x += (Math.random() - 0.5) * 2;
          y += (Math.random() - 0.5) * 2;

          points3D.push({ x: x, y: y, z: z, r: i, c: j });
      }
  }

  // 2. GERAÇÃO INTELIGENTE DE ARESTAS O(n) - Rápido e não trava o PC
  for (let i = 0; i < points3D.length; i++) {
      let p1 = points3D[i];
      let right = points3D.find(p => p.r === p1.r && p.c === p1.c + 1);
      let down = points3D.find(p => p.r === p1.r + 1 && p.c === p1.c);
      if (right) edges.push([i, points3D.indexOf(right)]);
      if (down) edges.push([i, points3D.indexOf(down)]);
  }

  let animTime = 0;
  let renderLoopActive = false;

  // 3. LOOP DE RENDERIZAÇÃO
  function renderFace3D() {
      if (!renderLoopActive) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      animTime += 0.02;

      let projected = [];
      let cx = canvas.width / 2;
      let cy = canvas.height / 2;

      // Transformação de Câmera
      for (let i = 0; i < points3D.length; i++) {
          let p = points3D[i];
          let x = p.x, y = p.y, z = p.z;

          // ANIMAÇÃO BIOMÉTRICA DA FALA
          if (iaIsSpeaking && y > 40 && y < 140 && Math.abs(x) < 50) {
              let mouthOpen = Math.abs(Math.sin(animTime * 20)) * 18;
              y += mouthOpen * Math.exp(-(x * x) / 300); // Desce a mandíbula
          }

          // Rotação Global do Rosto
          let rotY = Math.sin(animTime * 0.4) * 0.35; // Olha pros lados
          let rotX = Math.cos(animTime * 0.3) * 0.15; // Olha cima/baixo

          let y1 = y * Math.cos(rotX) - z * Math.sin(rotX);
          let z1 = y * Math.sin(rotX) + z * Math.cos(rotX);
          let x2 = x * Math.cos(rotY) - z1 * Math.sin(rotY);
          let z2 = x * Math.sin(rotY) + z1 * Math.cos(rotY);

          // Projeção Matemática Mapeada
          let fov = 900;
          let scale = fov / (fov - z2 + 300); 
          let zoom = 2.8; 
          
          projected.push({
              x: cx + x2 * scale * zoom,
              y: cy + y1 * scale * zoom
          });
      }

      // Desenha o Wireframe em Massa (1 stroke call = Alta Performance)
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      for (let i = 0; i < edges.length; i++) {
          let p1 = projected[edges[i][0]];
          let p2 = projected[edges[i][1]];
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();

      // Desenha Nódulos de Energia nas interseções
      ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
      for (let i = 0; i < projected.length; i++) {
          if (i % 3 === 0) { // Desenha em 1/3 dos pontos para não poluir
              ctx.beginPath();
              ctx.arc(projected[i].x, projected[i].y, 1.2, 0, Math.PI * 2);
              ctx.fill();
          }
      }

      requestAnimationFrame(renderFace3D);
  }

  // --- AUDIO E VOZ ---
  function populateVoices() { synthVoices = window.speechSynthesis.getVoices().filter(v => v.lang.includes('pt')); }
  if (window.speechSynthesis.onvoiceschanged !== undefined) window.speechSynthesis.onvoiceschanged = populateVoices;
  populateVoices();

  function initAudio() {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  function speakText(text, onStartCallback, onEndCallback) {
      if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel(); 
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'pt-BR'; utterance.pitch = 1.6; utterance.rate = 1.35; 
          if (synthVoices.length === 0) populateVoices();
          const femaleVoice = synthVoices.find(v => v.name.includes('Francisca') || v.name.includes('Luciana') || v.name.includes('Google português do Brasil') || v.name.includes('Zira') || v.name.includes('Vitoria') || v.name.includes('Helena'));
          if (femaleVoice) { utterance.voice = femaleVoice; } else if (synthVoices.length > 0) { utterance.voice = synthVoices.find(v => !v.name.includes('Daniel') && !v.name.includes('Thiago') && !v.name.includes('Felipe')) || synthVoices[0]; }
          utterance.onstart = () => { iaIsSpeaking = true; if(onStartCallback) onStartCallback(); };
          utterance.onend = () => { iaIsSpeaking = false; if(onEndCallback) onEndCallback(); };
          window.speechSynthesis.speak(utterance);
      } else {
          if (onStartCallback) onStartCallback();
          setTimeout(() => { if (onEndCallback) onEndCallback(); }, 3000);
      }
  }

  document.body.addEventListener('click', () => {
      if (!hasWelcomed) { initAudio(); speakText("Bem-vindo, policial, ao sistema intel tracker.", null, null); hasWelcomed = true; }
  }, { once: true });

  function startTypingSound() {
      if (typingInterval) return;
      typingInterval = setInterval(() => {
          if (Math.random() > 0.3) {
              if (!audioCtx || audioCtx.state === 'suspended') return;
              const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
              osc.type = 'triangle'; osc.frequency.setValueAtTime(200 + Math.random() * 150, audioCtx.currentTime);
              gain.gain.setValueAtTime(0.015, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
              osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.03);
          }
      }, 40); 
  }
  function stopTypingSound() { clearInterval(typingInterval); typingInterval = null; }

  function playSound(type) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain(); osc.connect(gain); gain.connect(audioCtx.destination); const now = audioCtx.currentTime;
    if (type === 'scan') { osc.type = 'square'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(400, now + 0.05); gain.gain.setValueAtTime(0.02, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05); osc.start(now); osc.stop(now + 0.05); } 
    else if (type === 'success') { osc.type = 'sine'; osc.frequency.setValueAtTime(1200, now); gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1); osc.start(now); osc.stop(now + 0.1); } 
    else if (type === 'error') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.3); gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3); osc.start(now); osc.stop(now + 0.3); }
  }

  function typeWriterEffect(element, finalString, speed = 30) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>"; let iterations = 0;
    const interval = setInterval(() => {
        element.innerText = finalString.split("").map((l, i) => { if(i < iterations) return finalString[i]; return chars[Math.floor(Math.random() * chars.length)]; }).join("");
        if(iterations >= finalString.length) clearInterval(interval); iterations += 1/2; 
    }, speed);
  }

  // --- HABBO LÓGICA ---
  const POLICE_REGEX = /\b(RCC|GOPH|ONU|DIC|DSP|PMHH|Ex\.Br|DPH|CSI|MB|FAB|EH|PMH|DPG|PH|PMR|DPP|CAP|GOC|UNP|FMB|POL[ÍI]CIA|MILITAR|EX[ÉI]RCITO|DEPARTAMENTO|FOR[ÇC]AS|BOPE|SWAT|FBI)\b|ÐIC/i;
  const DIC_REGEX = /(DIC|ÐIC|Departamento de Investiga[çc][ãa]o Criminal)/i;
  function isPoliceGroup(groupName) { return POLICE_REGEX.test(groupName); } function isDICGroup(groupName) { return DIC_REGEX.test(groupName); }
  const PROXIES = [ (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`, (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}` ];
  async function fetchWithProxy(targetUrl) { for (const getProxyUrl of PROXIES) { try { const res = await fetch(getProxyUrl(targetUrl)); const text = await res.text(); try { const data = JSON.parse(text); if (data && (data.uniqueId || data.error === "not-found" || data.user || Array.isArray(data.groups))) return data; } catch(e) {} } catch (e) {} } throw new Error("Proxy falhou"); }
  function formatDate(isoString) { if (!isoString) return "Desconhecido"; const date = new Date(isoString); return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  async function fetchSystemData() { const SYSTEM_API_URL = "https://script.google.com/macros/s/AKfycbyy60vUK67T3m1XBAzv-gwP34e2NfNoM9VIDVoFsQO0QPGPnTKSrT_sgO2nOKD_sc9h/exec"; try { const res = await fetch(SYSTEM_API_URL); systemLegislationData = await res.json(); } catch (e) { console.error("Falha ao sincronizar.", e); } }

  async function fetchUserData(nick, domain) {
    const targetUrl = `https://www.habbo.${domain}/api/public/users?name=${encodeURIComponent(nick)}`;
    const baseData = await fetchWithProxy(targetUrl);
    if (baseData.error === "not-found" || (baseData.name && baseData.name.toLowerCase() !== nick.toLowerCase())) return { exists: false, nick: nick };
    const uniqueId = baseData.uniqueId; let profileVisible = baseData.profileVisible; if (baseData.lastAccessTime) profileVisible = true;
    let allGroups = []; let policeGroups = []; let otherPoliceGroups = []; 
    if (profileVisible && uniqueId) { try { const profData = await fetchWithProxy(`https://www.habbo.${domain}/api/public/users/${uniqueId}/profile`); if (profData.groups && Array.isArray(profData.groups)) { allGroups = profData.groups; policeGroups = profData.groups.filter(g => isPoliceGroup(g.name)); otherPoliceGroups = policeGroups.filter(g => !isDICGroup(g.name)); } } catch(e) {} }
    return { exists: true, nick: baseData.name || nick, motto: baseData.motto || "Sem missão", profileVisible: profileVisible, isOnline: baseData.online, lastAccessTime: baseData.lastAccessTime, allGroups: allGroups, policeGroups: policeGroups, otherPoliceGroups: otherPoliceGroups, domain: domain };
  }

  function shouldRenderUser(data) {
     if (!data.exists) return !chkOffline.checked && !chkHidden.checked && !chkOtherPolice.checked;
     const isOfflineMode = !data.isOnline && !data.lastAccessTime;
     if (chkOffline.checked && !isOfflineMode) return false;
     if (chkHidden.checked && data.profileVisible) return false;
     if (chkOtherPolice.checked && data.otherPoliceGroups.length === 0) return false;
     return true;
  }

  function updateAnalyticsHUD() {
    let online = 0; let riscos = 0; let baixas = failedNicks.length;
    scannedUsersData.forEach(d => {
        if(!d.exists) { baixas++; return; }
        if(d.isOnline) online++; let hasRisk = false;
        if (!d.profileVisible || (d.profileVisible && !d.isOnline && !d.lastAccessTime) || d.otherPoliceGroups.length > 0) hasRisk = true;
        if (d.profileVisible && d.policeGroups.filter(g => isDICGroup(g.name)).length === 0) hasRisk = true;
        if (d.lastAccessTime && Math.floor((new Date() - new Date(d.lastAccessTime)) / (1000 * 60 * 60 * 24)) >= 7) hasRisk = true;
        if(hasRisk) riscos++;
    });
    statOnline.textContent = online; statRisco.textContent = riscos; statBaixas.textContent = baixas; return riscos; 
  }

  function createSuccessCard(data) {
    const card = document.createElement('div'); card.className = 'target-card';
    const visibText = data.profileVisible ? '<span class="val-green">ATIVADA (ABERTO)</span>' : '<span class="val-red">DESATIVADA (OCULTO)</span>';
    let onlineText = data.isOnline ? '<span class="val-green">🟢 ONLINE</span>' : (!data.lastAccessTime ? '<span class="val-gray">Modo Offline (Oculto)</span>' : `<span class="val-gray">Último acesso: ${formatDate(data.lastAccessTime)}</span>`);

    let statusPolicialText = '<span class="val-green"><i class="fa-solid fa-check-circle"></i> POLICIAL REGULAR</span>';
    let infracoes = []; let daysAbsent = data.lastAccessTime ? Math.floor((new Date() - new Date(data.lastAccessTime)) / (1000 * 60 * 60 * 24)) : 0;
    if (!data.profileVisible) infracoes.push("Perfil Oculto (Advertência)"); else if (!data.isOnline && !data.lastAccessTime) infracoes.push("Modo Offline (Advertência)");
    if (data.lastAccessTime && daysAbsent >= 20) infracoes.push(`Ausente ${daysAbsent} dias (Demissão)`); else if (data.lastAccessTime && daysAbsent >= 7) infracoes.push(`Ausente ${daysAbsent} dias (Advertência)`);
    if (data.otherPoliceGroups.length > 0) infracoes.push("Outras Polícias (Demissão)");
    if (data.profileVisible && data.policeGroups.filter(g => isDICGroup(g.name)).length === 0) infracoes.push("Sem grupo DIC (Demissão)");
    if (infracoes.length > 0) { playSound('error'); statusPolicialText = `<span class="val-red"><i class="fa-solid fa-triangle-exclamation"></i> TRANSGRESSÃO DETECTADA</span><br><span style="font-size: 10px; color: var(--status-warn); margin-top: 4px; display: inline-block;">- ${infracoes.join('<br> - ')}</span>`; } else playSound('success');

    const sysData = systemLegislationData[data.nick.toLowerCase()]; let historicoHtml = '<span class="val-gray">Nenhum registro aprovado.</span>';
    if (sysData && sysData.historico && sysData.historico.length > 0) {
        historicoHtml = [...sysData.historico].reverse().slice(0, 4).map(item => {
            let cor = item.acao.toUpperCase().includes("PROMO") ? "var(--status-ok)" : "var(--status-err)";
            return `<span style="color: var(--text-muted);">[${item.data}]</span> <span style="color: ${cor}; font-weight: bold; font-size: 11px;">${item.acao}</span>`;
        }).join('<br>') + (sysData.historico.length > 4 ? `<br><span style="font-size: 10px; color: var(--text-muted);">+ ${sysData.historico.length - 4} registro(s) oculto(s)...</span>` : "");
    }
    let groupsToUse = chkAllGroups.checked ? data.allGroups : (chkOtherPolice.checked ? data.otherPoliceGroups : data.policeGroups);
    let groupTitle = chkAllGroups.checked ? "TODOS OS GRUPOS" : (chkOtherPolice.checked ? "OUTRAS POLÍCIAS" : "ORG. POLICIAIS");
    let htmlContent = `<div class="card-header"><div class="avatar-box"><img src="https://www.habbo.${data.domain}/habbo-imaging/avatarimage?user=${data.nick}&direction=2&head_direction=2&action=std&gesture=std&size=m&headonly=1" alt="avatar"></div><div class="header-info"><h3 class="matrix-title"></h3><p>MISSÃO: ${data.motto}</p></div></div><div class="card-body"><div class="data-row"><div class="data-label">PERFIL:</div><div class="data-value">${visibText}</div></div><div class="data-row"><div class="data-label">STATUS:</div><div class="data-value">${onlineText}</div></div><div class="data-row"><div class="data-label" style="align-self: flex-start;">HISTÓRICO:</div><div class="data-value" style="line-height: 1.4;">${historicoHtml}</div></div><div class="data-row"><div class="data-label">AVALIAÇÃO:</div><div class="data-value">${statusPolicialText}</div></div><div class="groups-container"><div class="groups-title">${groupTitle} (${groupsToUse.length})</div>`;
    if (!data.profileVisible) htmlContent += `<div class="group-item"><span class="group-name val-red">Acesso negado: Perfil Privado.</span></div>`; else if (groupsToUse.length === 0) htmlContent += `<div class="group-item"><span class="group-name val-gray">Nenhum grupo encontrado nesta categoria.</span></div>`; else groupsToUse.forEach(g => { htmlContent += `<div class="group-item"><img src="https://www.habbo.${data.domain}/habbo-imaging/badge/${g.badgeCode}.gif" onerror="this.style.display='none'"><div class="group-details"><span class="group-name">${g.name}</span><span class="group-date">Protegida pela API</span></div></div>`; });
    htmlContent += `</div></div>`; card.innerHTML = htmlContent; resultsGrid.appendChild(card); typeWriterEffect(card.querySelector('.matrix-title'), data.nick);
  }

  function createErrorCard(nick, isConnectionFail = false) {
    playSound('error'); const card = document.createElement('div'); card.className = 'target-card error';
    card.innerHTML = `<div class="card-header"><div class="avatar-box"><i class="fa-solid fa-xmark" style="color:#ff003c; margin-top:15px;"></i></div><div class="header-info"><h3 class="matrix-title"></h3><p class="val-red">${isConnectionFail ? "FALHA DE CONEXÃO" : "USUÁRIO INEXISTENTE"}</p></div></div>`;
    resultsGrid.appendChild(card); typeWriterEffect(card.querySelector('.matrix-title'), nick);
  }

  function updateFailuresUI() { failCountUI.textContent = failedNicks.length; failuresListUI.innerHTML = ""; failedNicks.forEach(n => { const li = document.createElement('li'); li.innerHTML = `<span>${n}</span> <span><i class="fa-solid fa-triangle-exclamation"></i></span>`; failuresListUI.appendChild(li); }); }
  function addFailedNick(nick) { if(!failedNicks.includes(nick)) { failedNicks.push(nick); updateFailuresUI(); } }
  function removeFailedNick(nick) { failedNicks = failedNicks.filter(n => n !== nick); updateFailuresUI(); }

  failuresToggle.addEventListener('click', () => {
     if (failuresBody.style.display === 'none') { failuresBody.style.display = 'block'; toggleIcon.classList.replace('fa-chevron-down', 'fa-chevron-up'); if (failedNicks.length > 0 && !isRetrying) startRetryProcess(); } 
     else { failuresBody.style.display = 'none'; toggleIcon.classList.replace('fa-chevron-up', 'fa-chevron-down'); }
  });

  async function startRetryProcess() {
      isRetrying = true; let count = 3;
      const countdown = setInterval(async () => {
          retryStatus.textContent = `Forçando comunicação em ${count}s...`; count--;
          if (count < 0) {
              clearInterval(countdown); retryStatus.textContent = "Re-processando alvos..."; retryStatus.style.color = "var(--tron-cyan)";
              const nicksToRetry = [...failedNicks]; const domain = hotelSelect.value; const CHUNK_SIZE = 2; startTypingSound();
              for (let i = 0; i < nicksToRetry.length; i += CHUNK_SIZE) {
                  const chunk = nicksToRetry.slice(i, i + CHUNK_SIZE);
                  await Promise.all(chunk.map(async (nick) => {
                      try { const data = await fetchUserData(nick, domain); scannedUsersData.push(data); if (shouldRenderUser(data)) { if (data.exists) createSuccessCard(data); else createErrorCard(data.nick); resultCount.textContent = parseInt(resultCount.textContent) + 1; } removeFailedNick(nick); } catch(e) { scannedUsersData.push({ exists: false, nick: nick, realFailure: true }); if (shouldRenderUser({ exists: false })) { createErrorCard(nick, true); resultCount.textContent = parseInt(resultCount.textContent) + 1; } removeFailedNick(nick); }
                  }));
                  const cards = resultsGrid.querySelectorAll('.target-card'); if (cards.length > 0) cards[cards.length - 1].scrollIntoView({ behavior: 'smooth', block: 'end' });
                  await new Promise(r => setTimeout(r, 1200)); 
              }
              stopTypingSound(); retryStatus.textContent = "Processamento finalizado."; retryStatus.style.color = "var(--matrix-green)"; isRetrying = false; updateAnalyticsHUD();
          }
      }, 1000);
  }

  btnApplyFilters.addEventListener('click', () => { resultsGrid.innerHTML = ""; let count = 0; scannedUsersData.forEach(data => { if (shouldRenderUser(data)) { if (data.exists) createSuccessCard(data); else createErrorCard(data.nick, data.realFailure); count++; } }); resultCount.textContent = count; });
  btnClearFilters.addEventListener('click', () => { chkAllGroups.checked = false; chkOtherPolice.checked = false; chkOffline.checked = false; chkHidden.checked = false; btnApplyFilters.click(); });

  btnSearch.addEventListener('click', async () => {
    initAudio(); 
    const rawText = nickListInput.value; const domain = hotelSelect.value;
    const nicks = [...new Set(rawText.split('\n').map(n => n.trim()).filter(n => n.length > 0))];
    if (nicks.length === 0) { alert("Insira pelo menos um nick."); return; }

    resultsGrid.innerHTML = ""; scannedUsersData = []; failedNicks = []; updateFailuresUI(); resultCount.textContent = "0"; analyticsPanel.style.display = "none";
    btnSearch.disabled = true; failuresBody.style.display = 'none'; toggleIcon.classList.replace('fa-chevron-up', 'fa-chevron-down'); retryStatus.textContent = "";
    playSound('scan'); scanStatus.textContent = "Acessando banco de dados intranet..."; await fetchSystemData(); 
    
    const CHUNK_SIZE = 2; const totalChunks = Math.ceil(nicks.length / CHUNK_SIZE); startTypingSound(); 
    for (let i = 0; i < nicks.length; i += CHUNK_SIZE) {
        const chunk = nicks.slice(i, i + CHUNK_SIZE); scanStatus.textContent = `Varredura em andamento: Lote ${Math.floor(i / CHUNK_SIZE) + 1} de ${totalChunks}...`; playSound('scan');
        await Promise.all(chunk.map(async (nick) => {
            try { const data = await fetchUserData(nick, domain); scannedUsersData.push(data); if (shouldRenderUser(data)) { if (data.exists) createSuccessCard(data); else createErrorCard(data.nick); resultCount.textContent = parseInt(resultCount.textContent) + 1; } } catch(e) { failedNicks.push(nick); }
        }));
        const cards = resultsGrid.querySelectorAll('.target-card'); if (cards.length > 0) cards[cards.length - 1].scrollIntoView({ behavior: 'smooth', block: 'end' });
        await new Promise(r => setTimeout(r, 1200)); 
    }
    stopTypingSound(); scanStatus.textContent = "Varredura principal concluída."; updateFailuresUI(); const totalRiscos = updateAnalyticsHUD(); analyticsPanel.style.display = "flex"; btnSearch.disabled = false;

    // --- SEQUÊNCIA CINEMÁTICA: O DESPERTAR DA IA 3D ---
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
    if (aiOverlay) {
        setTimeout(() => {
            aiOverlay.classList.add('active'); // O Projeção 3D toma conta da tela
            renderLoopActive = true; // Inicia a renderização 3D apenas agora para poupar RAM
            
            setTimeout(() => {
                let msg = totalRiscos > 0 ? `Atenção. Varredura finalizada. Uma ameaça foi identificada. Foram encontradas ${totalRiscos} transgressões no sistema.` : "Varredura finalizada. Nenhuma transgressão foi encontrada no sistema.";
                speakText(msg, null, () => { 
                    setTimeout(() => { 
                        aiOverlay.classList.remove('active'); 
                        renderLoopActive = false; // Desliga o motor 3D ao fechar para não dar lag na página
                    }, 500); 
                });
            }, 1000); 
        }, 800); 
    }
  });

  // --- PDF EXPORT ---
  btnExportPDF.addEventListener('click', () => {
      const dataHoje = new Date().toLocaleDateString('pt-BR');
      let htmlPrint = `<html><head><title>DOSSIÊ_TÁTICO_DIC</title><style>body { font-family: 'Courier New', monospace; background: #000; color: #00ff41; padding: 40px; margin: 0; } h1 { color: #ffb000; border-bottom: 2px solid #ffb000; padding-bottom: 10px; font-size: 24px; text-transform: uppercase; } .meta-info { font-size: 12px; color: #888; margin-bottom: 30px; } .agent-card { border: 1px solid #00ff41; padding: 15px; margin-bottom: 15px; background: #050505; page-break-inside: avoid; } .agent-card.warning { border-color: #ff003c; color: #ff003c; } .agent-card h2 { margin: 0 0 5px 0; font-size: 18px; text-transform: uppercase; color: #fff; } .row { margin: 5px 0; font-size: 12px; } .label { font-weight: bold; width: 100px; display: inline-block; color: #aaa;} @media print { body { background: #fff; color: #000; } .agent-card { border: 1px solid #000; background: #fff; color: #000; } .agent-card h2 { color: #000; border-bottom: 1px solid #ccc; } .agent-card.warning { border-left: 5px solid red; color: #000; } .label { color: #555; } #printBtn { display: none !important; } }</style></head><body><button id="printBtn" onclick="window.print()" style="position:fixed; top:20px; right:20px; padding:15px; background:#ffb000; color:#000; border:none; cursor:pointer; font-weight:bold; font-size: 16px;">[ SALVAR COMO PDF ]</button><h1>RELATÓRIO TÁTICO DE TRANSGRESSÕES // DIC</h1><div class="meta-info">DATA DA VARREDURA: ${dataHoje} | CLASSIFICAÇÃO: CONFIDENCIAL</div>`;
      scannedUsersData.forEach(d => {
          if(!d.exists) return; let risco = false; let infracoes = [];
          if (!d.profileVisible) { infracoes.push("Perfil Oculto"); risco = true; } else if (!d.isOnline && !d.lastAccessTime) { infracoes.push("Modo Offline"); risco = true; }
          if (d.lastAccessTime) { const days = Math.floor((new Date() - new Date(d.lastAccessTime)) / (1000*60*60*24)); if (days >= 20) { infracoes.push(`Ausente ${days}d`); risco = true; } else if (days >= 7) { infracoes.push(`Ausente ${days}d`); risco = true; } }
          if (d.otherPoliceGroups.length > 0) { infracoes.push("Outras Polícias"); risco = true; }
          if (d.profileVisible) { const dicG = d.policeGroups.filter(g => isDICGroup(g.name)); if (dicG.length === 0) { infracoes.push("Sem grupo DIC"); risco = true; } }
          htmlPrint += `<div class="agent-card ${risco ? 'warning' : ''}"><h2>ALVO: ${d.nick} ${risco ? '[ TRANSGRESSÃO DETECTADA ]' : ''}</h2><div class="row"><span class="label">SITUAÇÃO:</span> ${d.isOnline ? "OPERACIONAL (ONLINE)" : "INATIVO/OCULTO"}</div>${risco ? `<div class="row"><span class="label">INFRAÇÕES:</span> ${infracoes.join(' | ')}</div>` : ''}</div>`;
      });
      htmlPrint += `</body></html>`; const win = window.open('', '_blank'); win.document.write(htmlPrint); win.document.close();
  });
});
