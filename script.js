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
    const btnApplyFilters = document.getElementById('btnApplyFilters');
    const btnClearFilters = document.getElementById('btnClearFilters');
    
    const analyticsPanel = document.getElementById('analyticsPanel');
    const statOnline = document.getElementById('statOnline');
    const statRisco = document.getElementById('statRisco');
    const statBaixas = document.getElementById('statBaixas');
  
    // Controle da IA
    const aiOverlay = document.getElementById('aiOverlay');
    let hasWelcomed = false;
    let iaIsSpeaking = false;
    let isOverlayActive = false;
  
    let failedNicks = [];
    let scannedUsersData = [];
    let isRetrying = false;
  
    // ==========================================
    // SISTEMA DE VOZ DA IA (FORTE E FEMININA)
    // ==========================================
    let synthVoices = [];
    function populateVoices() { synthVoices = window.speechSynthesis.getVoices().filter(v => v.lang.includes('pt')); }
    if (window.speechSynthesis.onvoiceschanged !== undefined) window.speechSynthesis.onvoiceschanged = populateVoices;
    populateVoices();
  
    function speakText(text, onStartCallback, onEndCallback) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); 
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-BR';
            utterance.pitch = 1.5; // Feminina robótica
            utterance.rate = 1.25; // Implacável
  
            if (synthVoices.length === 0) populateVoices();
            const femaleVoice = synthVoices.find(v => v.name.includes('Francisca') || v.name.includes('Luciana') || v.name.includes('Google português do Brasil') || v.name.includes('Zira') || v.name.includes('Vitoria') || v.name.includes('Helena'));
            if (femaleVoice) { utterance.voice = femaleVoice; } 
            else if (synthVoices.length > 0) { utterance.voice = synthVoices.find(v => !v.name.includes('Daniel') && !v.name.includes('Thiago')) || synthVoices[0]; }
  
            utterance.onstart = () => { iaIsSpeaking = true; if(onStartCallback) onStartCallback(); };
            utterance.onend = () => { iaIsSpeaking = false; if(onEndCallback) onEndCallback(); };
            window.speechSynthesis.speak(utterance);
        } else {
            if (onStartCallback) onStartCallback();
            setTimeout(() => { if (onEndCallback) onEndCallback(); }, 3000);
        }
    }
  
    document.body.addEventListener('click', () => {
        if (!hasWelcomed) { 
            speakText("Bem-vindo, policial, ao sistema intel tracker.", null, null); 
            hasWelcomed = true; 
        }
    }, { once: true });
  
    // ==========================================
    // LÓGICA DE BUSCA HABBO E RENDERIZAÇÃO
    // ==========================================
    const POLICE_REGEX = /\b(RCC|GOPH|ONU|DIC|DSP|PMHH|Ex\.Br|DPH|CSI|MB|FAB|EH|PMH|DPG|PH|PMR|DPP|CAP|GOC|UNP|FMB|POL[ÍI]CIA|MILITAR|EX[ÉI]RCITO|DEPARTAMENTO|FOR[ÇC]AS|BOPE|SWAT|FBI)\b|ÐIC/i;
    const DIC_REGEX = /(DIC|ÐIC|Departamento de Investiga[çc][ãa]o Criminal)/i;
    function isPoliceGroup(groupName) { return POLICE_REGEX.test(groupName); }
    function isDICGroup(groupName) { return DIC_REGEX.test(groupName); }
  
    const PROXIES = [
      (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
      (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
    ];
  
    async function fetchWithProxy(targetUrl) {
      for (const getProxyUrl of PROXIES) {
        try { const res = await fetch(getProxyUrl(targetUrl)); const text = await res.text();
          try { const data = JSON.parse(text); if (data && (data.uniqueId || data.error === "not-found" || data.user || Array.isArray(data.groups))) return data; } catch(e) {}
        } catch (e) {}
      } throw new Error("Proxy falhou");
    }
  
    function formatDate(isoString) { if (!isoString) return "Desconhecido"; const date = new Date(isoString); return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  
    async function fetchUserData(nick, domain) {
      const targetUrl = `https://www.habbo.${domain}/api/public/users?name=${encodeURIComponent(nick)}`;
      const baseData = await fetchWithProxy(targetUrl);
      if (baseData.error === "not-found" || (baseData.name && baseData.name.toLowerCase() !== nick.toLowerCase())) return { exists: false, nick: nick };
      const uniqueId = baseData.uniqueId; let profileVisible = baseData.profileVisible; if (baseData.lastAccessTime) profileVisible = true;
      let allGroups = []; let policeGroups = []; let otherPoliceGroups = []; 
      if (profileVisible && uniqueId) {
          try { const profData = await fetchWithProxy(`https://www.habbo.${domain}/api/public/users/${uniqueId}/profile`);
              if (profData.groups && Array.isArray(profData.groups)) { allGroups = profData.groups; policeGroups = profData.groups.filter(g => isPoliceGroup(g.name)); otherPoliceGroups = policeGroups.filter(g => !isDICGroup(g.name)); }
          } catch(e) {}
      }
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
  
    function renderAllCards() {
       resultsGrid.innerHTML = ""; let count = 0;
       scannedUsersData.forEach(data => { if (shouldRenderUser(data)) { if (data.exists) createSuccessCard(data); else createErrorCard(data.nick, data.realFailure); count++; } });
       resultCount.textContent = count;
    }
  
    function createSuccessCard(data) {
      const card = document.createElement('div'); card.className = 'target-card';
      const visibText = data.profileVisible ? '<span class="val-green">ATIVADA (ABERTO)</span>' : '<span class="val-red">DESATIVADA (OCULTO)</span>';
      let onlineText = data.isOnline ? '<span class="val-green">🟢 ONLINE</span>' : (!data.lastAccessTime ? '<span class="val-gray">Modo Offline (Oculto)</span>' : `<span class="val-gray">Último acesso: ${formatDate(data.lastAccessTime)}</span>`);
      let groupsToUse = chkAllGroups.checked ? data.allGroups : (chkOtherPolice.checked ? data.otherPoliceGroups : data.policeGroups);
      let groupTitle = chkAllGroups.checked ? "TODOS OS GRUPOS" : (chkOtherPolice.checked ? "OUTRAS POLÍCIAS" : "ORG. POLICIAIS");
      let htmlContent = `<div class="card-header"><div class="avatar-box"><img src="https://www.habbo.${data.domain}/habbo-imaging/avatarimage?user=${data.nick}&direction=2&head_direction=2&action=std&gesture=std&size=m&headonly=1" alt="avatar"></div><div class="header-info"><h3>${data.nick}</h3><p>MISSÃO: ${data.motto}</p></div></div><div class="card-body"><div class="data-row"><div class="data-label">PERFIL:</div><div class="data-value">${visibText}</div></div><div class="data-row"><div class="data-label">STATUS:</div><div class="data-value">${onlineText}</div></div><div class="groups-container"><div class="groups-title">${groupTitle} (${groupsToUse.length})</div>`;
      if (!data.profileVisible) htmlContent += `<div class="group-item"><span class="group-name val-red">Acesso negado: Perfil Privado.</span></div>`; else if (groupsToUse.length === 0) htmlContent += `<div class="group-item"><span class="group-name val-gray">Nenhum grupo encontrado nesta categoria.</span></div>`; else groupsToUse.forEach(g => { htmlContent += `<div class="group-item"><img src="https://www.habbo.${data.domain}/habbo-imaging/badge/${g.badgeCode}.gif" onerror="this.style.display='none'"><div class="group-details"><span class="group-name">${g.name}</span></div></div>`; });
      htmlContent += `</div></div>`; card.innerHTML = htmlContent; resultsGrid.appendChild(card);
    }
  
    function createErrorCard(nick, isConnectionFail = false) {
      const card = document.createElement('div'); card.className = 'target-card error';
      card.innerHTML = `<div class="card-header"><div class="avatar-box"><i class="fa-solid fa-xmark" style="color:#ff4444; margin-top:15px;"></i></div><div class="header-info"><h3>${nick}</h3><p class="val-red">${isConnectionFail ? "FALHA DE CONEXÃO" : "USUÁRIO INEXISTENTE"}</p></div></div>`;
      resultsGrid.appendChild(card);
    }
  
    function updateFailuresUI() { failCountUI.textContent = failedNicks.length; failuresListUI.innerHTML = ""; failedNicks.forEach(nick => { const li = document.createElement('li'); li.innerHTML = `<span>${nick}</span> <span><i class="fa-solid fa-triangle-exclamation"></i></span>`; failuresListUI.appendChild(li); }); }
    function addFailedNick(nick) { if(!failedNicks.includes(nick)) { failedNicks.push(nick); updateFailuresUI(); } }
    function removeFailedNick(nick) { failedNicks = failedNicks.filter(n => n !== nick); updateFailuresUI(); }
  
    btnApplyFilters.addEventListener('click', () => { renderAllCards(); });
    btnClearFilters.addEventListener('click', () => { chkAllGroups.checked = false; chkOtherPolice.checked = false; chkOffline.checked = false; chkHidden.checked = false; renderAllCards(); });
  
    btnSearch.addEventListener('click', async () => {
      const rawText = nickListInput.value; const domain = hotelSelect.value;
      const nicks = [...new Set(rawText.split('\n').map(n => n.trim()).filter(n => n.length > 0))];
      if (nicks.length === 0) { alert("Insira pelo menos um nick."); return; }
  
      resultsGrid.innerHTML = ""; scannedUsersData = []; failedNicks = []; updateFailuresUI(); resultCount.textContent = "0"; analyticsPanel.style.display = "none";
      btnSearch.disabled = true; failuresBody.style.display = 'none'; toggleIcon.classList.replace('fa-chevron-up', 'fa-chevron-down'); retryStatus.textContent = "";
      
      const CHUNK_SIZE = 10; const totalChunks = Math.ceil(nicks.length / CHUNK_SIZE);
      for (let i = 0; i < nicks.length; i += CHUNK_SIZE) {
          const chunk = nicks.slice(i, i + CHUNK_SIZE); scanStatus.textContent = `Varredura rápida: Lote ${Math.floor(i / CHUNK_SIZE) + 1} de ${totalChunks}...`;
          await Promise.all(chunk.map(async (nick) => {
              try { const data = await fetchUserData(nick, domain); scannedUsersData.push(data); if (shouldRenderUser(data)) { if (data.exists) createSuccessCard(data); else createErrorCard(data.nick); resultCount.textContent = parseInt(resultCount.textContent) + 1; } } catch(e) { addFailedNick(nick); }
          }));
          await new Promise(r => setTimeout(r, 250));
      }
  
      scanStatus.textContent = "Varredura principal concluída."; 
      const totalRiscos = updateAnalyticsHUD(); analyticsPanel.style.display = "flex"; btnSearch.disabled = false;
  
      // ===============================================
      // A MÁGICA: O ROSTO DA IA APARECE NA TELA
      // ===============================================
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      if (aiOverlay) {
          setTimeout(() => {
              aiOverlay.classList.add('active'); // O fundo fica preto
              isOverlayActive = true;
              
              setTimeout(() => {
                  let msg = totalRiscos > 0 ? `Atenção. Varredura finalizada. Uma ameaça foi identificada. Foram encontradas ${totalRiscos} transgressões no sistema.` : "Varredura finalizada. Nenhuma transgressão foi encontrada no sistema.";
                  
                  speakText(msg, null, () => { 
                      setTimeout(() => { 
                          aiOverlay.classList.remove('active'); // SOME QUANDO PARA DE FALAR
                          isOverlayActive = false;
                      }, 1000); 
                  });
              }, 1000); // 1 segundo pra admirar o rosto surgindo
          }, 800); 
      }
    });
  
  
    // =========================================================
    // O NOVO MOTOR DE HOLOGRAMA (OTIMIZADO - ZERO TRAVAMENTOS)
    // =========================================================
    const hCanvas = document.getElementById("hologramCanvas");
    const hCtx = hCanvas.getContext("2d");
  
    // Ajuste da resolução (Tamanho fixo para não pesar na placa)
    hCanvas.width = 600;
    hCanvas.height = 700;
  
    let facePoints = [];
    let faceEdges = [];
    const SPACING = 14; // Aumentar isso deixa mais leve. 14 é ideal.
  
    // Escultura Matemática do Rosto (Gera APENAS UMA VEZ)
    function buildFaceMesh() {
      facePoints = [];
      faceEdges = [];
  
      for (let y = -140; y <= 160; y += SPACING) {
        let xOffset = (Math.abs(y/SPACING) % 2 === 0) ? 0 : SPACING / 2; // Malha triangular
  
        for (let x = -100; x <= 100; x += SPACING) {
          let jx = x + xOffset;
          let jy = y;
  
          // Formato Oval do Rosto
          if (Math.pow(jx/90, 2) + Math.pow(jy/140, 2) > 1.0) continue;
  
          // Esculpindo os traços (Profundidade Z)
          let z = 90 * Math.cos(jx/120) * Math.cos(jy/140); // Crânio Base
          z += 50 * Math.exp(-(jx*jx)/200 - Math.pow(jy-10, 2)/1000); // Ponte do Nariz
          z += 30 * Math.exp(-(jx*jx)/100 - Math.pow(jy-45, 2)/300); // Ponta do Nariz
          z -= 45 * Math.exp(-Math.pow(Math.abs(jx)-35, 2)/200 - Math.pow(jy+5, 2)/200); // Órbitas Oculares (Afundado)
          z += 25 * Math.exp(-Math.pow(Math.abs(jx)-55, 2)/300 - Math.pow(jy-20, 2)/300); // Maçãs do rosto
          z += 20 * Math.exp(-(jx*jx)/400 - Math.pow(jy-85, 2)/250); // Boca
          z += 30 * Math.exp(-(jx*jx)/300 - Math.pow(jy-130, 2)/250); // Queixo
  
          // Ruído digital sutil
          jx += (Math.random() - 0.5) * 3;
          jy += (Math.random() - 0.5) * 3;
  
          facePoints.push({ x: jx, y: jy, z: z, ox: jx, oy: jy, oz: z });
        }
      }
  
      // Criação rápida e segura das conexões das linhas (Evita cálculo infinito)
      for (let i = 0; i < facePoints.length; i++) {
        for (let j = i + 1; j < facePoints.length; j++) {
          let dx = facePoints[i].ox - facePoints[j].ox;
          let dy = facePoints[i].oy - facePoints[j].oy;
          // Se estiverem próximos, liga a linha
          if (Math.sqrt(dx*dx + dy*dy) < (SPACING * 1.5)) {
            faceEdges.push([i, j]);
          }
        }
      }
    }
  
    buildFaceMesh();
    let angle = 0;
    let time = 0;
  
    // O Loop de Animação que renderiza a malha ligada
    function drawHologram() {
      requestAnimationFrame(drawHologram);
      
      // OTIMIZAÇÃO: Se a tela preta não estiver ativa, NÃO DESENHA NADA! Zero uso de CPU.
      if (!isOverlayActive) return;
  
      hCtx.clearRect(0, 0, hCanvas.width, hCanvas.height);
      angle += 0.01;
      time += 0.1;
  
      let cx = hCanvas.width / 2;
      let cy = hCanvas.height / 2;
      let projected = [];
  
      // Calcula Posição dos Pontos
      for (let i = 0; i < facePoints.length; i++) {
        let p = facePoints[i];
        let px = p.ox;
        let py = p.oy;
        let pz = p.oz;
  
        // MEXE A BOCA QUANDO A IA FALA
        if (iaIsSpeaking && py > 50 && py < 150 && Math.abs(px) < 40) {
            let mouthOpen = Math.abs(Math.sin(time * 2.5)) * 15;
            py += mouthOpen * Math.exp(-(px*px)/200); // Lábio inferior desce
        }
  
        // Rotação suave da cabeça para a esquerda e direita
        let rotY = Math.sin(angle * 0.5) * 0.25; 
        
        let rotX = px * Math.cos(rotY) - pz * Math.sin(rotY);
        let rotZ = px * Math.sin(rotY) + pz * Math.cos(rotY);
  
        let scale = 600 / (600 - rotZ + 150);
        let x2d = rotX * scale * 2.2 + cx;
        let y2d = py * scale * 2.2 + cy;
  
        projected.push({ x: x2d, y: y2d });
      }
  
      // Desenha as Linhas Digitais
      hCtx.strokeStyle = "rgba(0, 240, 255, 0.3)";
      hCtx.lineWidth = 1.2;
      hCtx.beginPath();
      for (let i = 0; i < faceEdges.length; i++) {
        let p1 = projected[faceEdges[i][0]];
        let p2 = projected[faceEdges[i][1]];
        hCtx.moveTo(p1.x, p1.y);
        hCtx.lineTo(p2.x, p2.y);
      }
      hCtx.stroke();
  
      // Desenha Nódulos de Energia
      hCtx.fillStyle = "rgba(255, 255, 255, 0.9)";
      for (let i = 0; i < projected.length; i++) {
        if(i % 2 === 0) { // Não desenha bolinha em todos para ficar mais limpo
            hCtx.beginPath();
            hCtx.arc(projected[i].x, projected[i].y, 1.2, 0, Math.PI * 2);
            hCtx.fill();
        }
      }
    }
  
    drawHologram();
  });
