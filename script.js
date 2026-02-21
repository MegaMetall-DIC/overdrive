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

  let failedNicks = [];
  let scannedUsersData = [];
  let isRetrying = false;

  const POLICE_REGEX = /\b(RCC|GOPH|ONU|DIC|DSP|PMHH|Ex\.Br|DPH|CSI|MB|FAB|EH|PMH|DPG|PH|PMR|DPP|CAP|GOC|UNP|FMB|POL[ÍI]CIA|MILITAR|EX[ÉI]RCITO|DEPARTAMENTO|FOR[ÇC]AS|BOPE|SWAT|FBI)\b|ÐIC/i;
  const DIC_REGEX = /(DIC|ÐIC|Departamento de Investiga[çc][ãa]o Criminal)/i;

  function isPoliceGroup(groupName) {
      return POLICE_REGEX.test(groupName);
  }

  function isDICGroup(groupName) {
      return DIC_REGEX.test(groupName);
  }

  const PROXIES = [
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
  ];

  async function fetchWithProxy(targetUrl) {
    for (const getProxyUrl of PROXIES) {
      try {
        const res = await fetch(getProxyUrl(targetUrl));
        const text = await res.text();
        try {
           const data = JSON.parse(text);
           // CORREÇÃO: Aceita tanto a resposta básica (uniqueId) quanto a resposta do perfil (groups)
           if (data && (data.uniqueId || data.error === "not-found" || data.user || Array.isArray(data.groups))) {
               return data;
           }
        } catch(e) {}
      } catch (e) {}
    }
    throw new Error("Proxy falhou");
  }

  function formatDate(isoString) {
    if (!isoString) return "Desconhecido";
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  async function fetchUserData(nick, domain) {
    const targetUrl = `https://www.habbo.${domain}/api/public/users?name=${encodeURIComponent(nick)}`;
    const baseData = await fetchWithProxy(targetUrl);
    
    if (baseData.error === "not-found" || (baseData.name && baseData.name.toLowerCase() !== nick.toLowerCase())) {
        return { exists: false, nick: nick };
    }
    
    const uniqueId = baseData.uniqueId;
    
    let profileVisible = baseData.profileVisible;
    if (baseData.lastAccessTime) {
        profileVisible = true;
    }

    let allGroups = [];
    let policeGroups = [];
    let otherPoliceGroups = []; 

    if (profileVisible && uniqueId) {
        const profileUrl = `https://www.habbo.${domain}/api/public/users/${uniqueId}/profile`;
        try {
            const profData = await fetchWithProxy(profileUrl);
            if (profData.groups && Array.isArray(profData.groups)) {
                allGroups = profData.groups;
                policeGroups = profData.groups.filter(g => isPoliceGroup(g.name));
                otherPoliceGroups = policeGroups.filter(g => !isDICGroup(g.name));
            }
        } catch(e) {}
    }

    return {
      exists: true,
      nick: baseData.name || nick,
      motto: baseData.motto || "Sem missão",
      profileVisible: profileVisible,
      isOnline: baseData.online,
      lastAccessTime: baseData.lastAccessTime,
      allGroups: allGroups,
      policeGroups: policeGroups,
      otherPoliceGroups: otherPoliceGroups, 
      domain: domain
    };
  }

  function shouldRenderUser(data) {
     if (!data.exists) {
        if (chkOffline.checked || chkHidden.checked || chkOtherPolice.checked) return false;
        return true;
     }

     const filterOffline = chkOffline.checked;
     const filterHidden = chkHidden.checked;
     const filterOtherPolice = chkOtherPolice.checked;

     const isOfflineMode = !data.isOnline && !data.lastAccessTime;
     
     if (filterOffline && !isOfflineMode) return false;
     if (filterHidden && data.profileVisible) return false;
     if (filterOtherPolice && data.otherPoliceGroups.length === 0) return false;
     
     return true;
  }

  function renderAllCards() {
     resultsGrid.innerHTML = "";
     let count = 0;

     scannedUsersData.forEach(data => {
        if (shouldRenderUser(data)) {
            if (data.exists) {
                createSuccessCard(data);
            } else {
                createErrorCard(data.nick, data.realFailure);
            }
            count++;
        }
     });

     resultCount.textContent = count;
  }

  function createSuccessCard(data) {
    const card = document.createElement('div');
    card.className = 'target-card';
    
    const visibText = data.profileVisible ? '<span class="val-green">ATIVADA (ABERTO)</span>' : '<span class="val-red">DESATIVADA (OCULTO)</span>';
    
    let onlineText = "";
    if (data.isOnline) {
        onlineText = '<span class="val-green">🟢 ONLINE</span>';
    } else {
        onlineText = !data.lastAccessTime ? '<span class="val-gray">Modo Offline (Oculto)</span>' : `<span class="val-gray">Último acesso: ${formatDate(data.lastAccessTime)}</span>`;
    }

    let groupsToUse = data.policeGroups;
    let groupTitle = "ORGANIZAÇÕES MILITARES/POLICIAIS";

    if (chkAllGroups.checked) {
        groupsToUse = data.allGroups;
        groupTitle = "TODOS OS GRUPOS";
    } else if (chkOtherPolice.checked) {
        groupsToUse = data.otherPoliceGroups;
        groupTitle = "OUTRAS POLÍCIAS (EXCETO DIC)";
    }

    let htmlContent = `
      <div class="card-header">
        <div class="avatar-box">
          <img src="https://www.habbo.${data.domain}/habbo-imaging/avatarimage?user=${data.nick}&direction=2&head_direction=2&action=std&gesture=std&size=m&headonly=1" alt="avatar">
        </div>
        <div class="header-info">
          <h3>${data.nick}</h3>
          <p>MISSÃO: ${data.motto}</p>
        </div>
      </div>
      <div class="card-body">
        <div class="data-row"><div class="data-label">PERFIL:</div><div class="data-value">${visibText}</div></div>
        <div class="data-row"><div class="data-label">STATUS:</div><div class="data-value">${onlineText}</div></div>
        
        <div class="groups-container">
          <div class="groups-title">${groupTitle} (${groupsToUse.length})</div>
    `;

    if (!data.profileVisible) {
        htmlContent += `<div class="group-item"><span class="group-name val-red">Acesso negado: Perfil Privado.</span></div>`;
    } else if (groupsToUse.length === 0) {
        htmlContent += `<div class="group-item"><span class="group-name val-gray">Nenhum grupo encontrado nesta categoria.</span></div>`;
    } else {
        groupsToUse.forEach(g => {
            const badgeUrl = `https://www.habbo.${data.domain}/habbo-imaging/badge/${g.badgeCode}.gif`;
            htmlContent += `
              <div class="group-item">
                <img src="${badgeUrl}" alt="badge" onerror="this.style.display='none'">
                <div class="group-details">
                  <span class="group-name">${g.name}</span>
                  <span class="group-date">Data de entrada: Protegida pela API</span>
                </div>
              </div>
            `;
        });
    }

    htmlContent += `</div></div>`;
    card.innerHTML = htmlContent;
    resultsGrid.appendChild(card);
  }

  function createErrorCard(nick, isConnectionFail = false) {
    const card = document.createElement('div');
    card.className = 'target-card error';
    const msg = isConnectionFail ? "FALHA DE CONEXÃO COM A API" : "USUÁRIO INEXISTENTE NO HABBO";
    card.innerHTML = `
      <div class="card-header">
        <div class="avatar-box"><i class="fa-solid fa-xmark" style="color:#ff4444; margin-top:15px;"></i></div>
        <div class="header-info">
          <h3>${nick}</h3>
          <p class="val-red">${msg}</p>
        </div>
      </div>
    `;
    resultsGrid.appendChild(card);
  }

  function updateFailuresUI() {
    failCountUI.textContent = failedNicks.length;
    failuresListUI.innerHTML = "";
    failedNicks.forEach(nick => {
       const li = document.createElement('li');
       li.innerHTML = `<span>${nick}</span> <span><i class="fa-solid fa-triangle-exclamation"></i></span>`;
       failuresListUI.appendChild(li);
    });
  }

  function addFailedNick(nick) {
     if(!failedNicks.includes(nick)) {
         failedNicks.push(nick);
         updateFailuresUI();
     }
  }

  function removeFailedNick(nick) {
     failedNicks = failedNicks.filter(n => n !== nick);
     updateFailuresUI();
  }

  failuresToggle.addEventListener('click', () => {
     if (failuresBody.style.display === 'none') {
         failuresBody.style.display = 'block';
         toggleIcon.classList.replace('fa-chevron-down', 'fa-chevron-up');
         
         if (failedNicks.length > 0 && !isRetrying) {
             startRetryProcess();
         }
     } else {
         failuresBody.style.display = 'none';
         toggleIcon.classList.replace('fa-chevron-up', 'fa-chevron-down');
     }
  });

  async function startRetryProcess() {
      isRetrying = true;
      let count = 3;
      
      const countdown = setInterval(async () => {
          retryStatus.textContent = `Forçando comunicação em ${count}s...`;
          count--;
          
          if (count < 0) {
              clearInterval(countdown);
              retryStatus.textContent = "Re-processando alvos perdidos...";
              retryStatus.style.color = "var(--accent-light)";
              
              const nicksToRetry = [...failedNicks];
              const domain = hotelSelect.value;
              
              const CHUNK_SIZE = 5; 
              for (let i = 0; i < nicksToRetry.length; i += CHUNK_SIZE) {
                  const chunk = nicksToRetry.slice(i, i + CHUNK_SIZE);
                  
                  await Promise.all(chunk.map(async (nick) => {
                      try {
                          const data = await fetchUserData(nick, domain);
                          scannedUsersData.push(data); 
                          if (shouldRenderUser(data)) {
                              if (data.exists) createSuccessCard(data);
                              else createErrorCard(data.nick);
                              resultCount.textContent = parseInt(resultCount.textContent) + 1;
                          }
                          removeFailedNick(nick);
                      } catch(e) {
                          scannedUsersData.push({ exists: false, nick: nick, realFailure: true });
                          if (shouldRenderUser({ exists: false })) {
                              createErrorCard(nick, true);
                              resultCount.textContent = parseInt(resultCount.textContent) + 1;
                          }
                          removeFailedNick(nick);
                      }
                  }));
                  await new Promise(r => setTimeout(r, 500));
              }
              
              retryStatus.textContent = "Processamento finalizado.";
              retryStatus.style.color = "var(--status-ok)";
              isRetrying = false;
          }
      }, 1000);
  }

  btnApplyFilters.addEventListener('click', () => {
      renderAllCards();
  });

  btnClearFilters.addEventListener('click', () => {
      chkAllGroups.checked = false;
      chkOtherPolice.checked = false;
      chkOffline.checked = false;
      chkHidden.checked = false;
      renderAllCards();
  });

  btnSearch.addEventListener('click', async () => {
    const rawText = nickListInput.value;
    const domain = hotelSelect.value;
    
    const nicks = [...new Set(rawText.split('\n').map(n => n.trim()).filter(n => n.length > 0))];

    if (nicks.length === 0) { alert("Insira pelo menos um nick."); return; }

    resultsGrid.innerHTML = "";
    scannedUsersData = [];
    failedNicks = [];
    updateFailuresUI();
    resultCount.textContent = "0";
    
    btnSearch.disabled = true;
    failuresBody.style.display = 'none';
    toggleIcon.classList.replace('fa-chevron-up', 'fa-chevron-down');
    retryStatus.textContent = "";
    
    const CHUNK_SIZE = 10;
    const totalChunks = Math.ceil(nicks.length / CHUNK_SIZE);

    for (let i = 0; i < nicks.length; i += CHUNK_SIZE) {
        const chunk = nicks.slice(i, i + CHUNK_SIZE);
        const currentChunk = Math.floor(i / CHUNK_SIZE) + 1;
        scanStatus.textContent = `Varredura rápida: Lote ${currentChunk} de ${totalChunks}...`;
        
        await Promise.all(chunk.map(async (nick) => {
            try {
                const data = await fetchUserData(nick, domain);
                scannedUsersData.push(data);
                
                if (shouldRenderUser(data)) {
                    if (data.exists) createSuccessCard(data);
                    else createErrorCard(data.nick);
                    resultCount.textContent = parseInt(resultCount.textContent) + 1;
                }
            } catch(e) {
                addFailedNick(nick);
            }
        }));

        await new Promise(r => setTimeout(r, 250));
    }

    scanStatus.textContent = "Varredura principal concluída.";
    if (failedNicks.length > 0) {
        scanStatus.textContent += " Verifique as falhas no menu lateral.";
        failuresToggle.style.animation = "pulse 1.5s infinite alternate";
    }
    
    btnSearch.disabled = false;
  });

});

// ===== HOLOGRAMA 3D INSANO =====

const canvas = document.getElementById("hologramCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

let points = [];
const POINT_COUNT = 2200;
const radius = 220;

function createFacePoints() {
  points = [];
  
  for (let i = 0; i < POINT_COUNT; i++) {
    let theta = Math.random() * Math.PI;
    let phi = Math.random() * Math.PI * 2;

    let x = radius * Math.sin(theta) * Math.cos(phi);
    let y = radius * Math.sin(theta) * Math.sin(phi);
    let z = radius * Math.cos(theta);

    // Achatando levemente para parecer rosto
    z *= 1.2;
    y *= 1.1;

    points.push({ x, y, z });
  }
}

createFacePoints();

let angle = 0;

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  angle += 0.002;

  for (let p of points) {
    let rotatedX = p.x * Math.cos(angle) - p.z * Math.sin(angle);
    let rotatedZ = p.x * Math.sin(angle) + p.z * Math.cos(angle);

    let scale = 600 / (600 + rotatedZ);
    let x2d = rotatedX * scale + canvas.width / 2;
    let y2d = p.y * scale + canvas.height / 2;

    ctx.beginPath();
    ctx.arc(x2d, y2d, 0.7, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,255,255,0.9)";
    ctx.fill();
  }

  // Conexões próximas (malha detalhada)
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      let dx = points[i].x - points[j].x;
      let dy = points[i].y - points[j].y;
      let dz = points[i].z - points[j].z;
      let dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < 35) {
        let p1 = points[i];
        let p2 = points[j];

        let r1x = p1.x * Math.cos(angle) - p1.z * Math.sin(angle);
        let r1z = p1.x * Math.sin(angle) + p1.z * Math.cos(angle);
        let s1 = 600 / (600 + r1z);

        let r2x = p2.x * Math.cos(angle) - p2.z * Math.sin(angle);
        let r2z = p2.x * Math.sin(angle) + p2.z * Math.cos(angle);
        let s2 = 600 / (600 + r2z);

        ctx.beginPath();
        ctx.moveTo(r1x * s1 + canvas.width / 2, p1.y * s1 + canvas.height / 2);
        ctx.lineTo(r2x * s2 + canvas.width / 2, p2.y * s2 + canvas.height / 2);
        ctx.strokeStyle = "rgba(0,255,255,0.08)";
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(draw);
}

draw();
