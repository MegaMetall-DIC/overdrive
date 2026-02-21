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
  
    // Controle da Boca da IA
    let iaIsSpeaking = { value: 0.0 };
  
    // ==========================================
    // SISTEMA DE ÁUDIO E VOZ DA IA
    // ==========================================
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;
    let typingInterval = null;
    let synthVoices = [];
  
    function populateVoices() {
        synthVoices = window.speechSynthesis.getVoices().filter(v => v.lang.includes('pt'));
    }
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = populateVoices;
    }
    populateVoices();
  
    function initAudio() {
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }
  
    function speakText(text, onStartCallback, onEndCallback) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); 
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-BR';
            utterance.pitch = 1.6; 
            utterance.rate = 1.35; 
  
            if (synthVoices.length === 0) populateVoices();
            const femaleVoice = synthVoices.find(v => v.name.includes('Francisca') || v.name.includes('Luciana') || v.name.includes('Zira'));
            
            if (femaleVoice) utterance.voice = femaleVoice; 
            else if (synthVoices.length > 0) utterance.voice = synthVoices.find(v => !v.name.includes('Daniel') && !v.name.includes('Thiago')) || synthVoices[0];
  
            utterance.onstart = () => { 
                iaIsSpeaking.value = 1.0; // Aciona o Maxilar no Shader
                if(onStartCallback) onStartCallback(); 
            };
            utterance.onend = () => { 
                iaIsSpeaking.value = 0.0; // Desliga o Maxilar
                if(onEndCallback) onEndCallback(); 
            };
  
            window.speechSynthesis.speak(utterance);
        } else {
            if (onStartCallback) onStartCallback();
            setTimeout(() => { if (onEndCallback) onEndCallback(); }, 3000);
        }
    }
  
    document.body.addEventListener('click', () => {
        if (!hasWelcomed) { 
            initAudio(); speakText("Bem-vindo, policial, ao sistema intel tracker.", null, null); hasWelcomed = true; 
        }
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
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain(); 
        osc.connect(gain); gain.connect(audioCtx.destination); const now = audioCtx.currentTime;
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
  
    // ==========================================
    // MOTOR THREE.JS: CUSTOM SHADER PARTICLES
    // ==========================================
    let renderer, scene, camera, particleSystem;
    let uniforms = {
        uTime: { value: 0.0 },
        uSpeaking: iaIsSpeaking // Ligado à variável global de fala
    };

    function initHologram() {
        const container = document.getElementById('hologramContainer');
        if (!container || typeof THREE === 'undefined') return;

        // Limpa se já existir
        container.innerHTML = '';

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.z = 250; // Distância perfeita para engolir a tela

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        // Geometria Paramétrica (100.000 Vértices calculados instantaneamente)
        const particleCount = 100000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const randoms = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            // Distribuição Oval Uniforme
            let u = (Math.random() - 0.5) * 2.0;
            let v = (Math.random() - 0.5) * 2.0;

            let x = u * 120;
            let y = v * 150;

            // Corta fora do rosto
            if ((x * x) / (120 * 120) + (y * y) / (150 * 150) > 1.0) {
                i--; continue;
            }

            // A Topologia do Rosto (Matemática Pura de Profundidade)
            let z = 80 * Math.cos(x / 140) * Math.cos(y / 140); // Crânio Base
            z += 50 * Math.exp(-(x * x) / 200 - Math.pow(y - 10, 2) / 1500); // Nariz (Ponte)
            z += 25 * Math.exp(-(x * x) / 100 - Math.pow(y - 35, 2) / 300); // Nariz (Ponta)
            z -= 45 * Math.exp(-Math.pow(Math.abs(x) - 40, 2) / 250 - Math.pow(y - 15, 2) / 200); // Órbitas Oculares
            z += 25 * Math.exp(-Math.pow(Math.abs(x) - 55, 2) / 400 - Math.pow(y - 25, 2) / 400); // Maçãs do rosto
            z += 15 * Math.exp(-(x * x) / 500 - Math.pow(y + 40, 2) / 300); // Lábios Superiores
            z += 30 * Math.exp(-(x * x) / 400 - Math.pow(y + 80, 2) / 400); // Queixo/Maxilar

            positions[i * 3] = x;
            positions[i * 3 + 1] = -y; // Inverte Y para cima
            positions[i * 3 + 2] = z;
            randoms[i] = Math.random(); // Fator de aleatoriedade para explosão
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

        // SHADERS GLSL (Processamento direto na Placa de Vídeo)
        const material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending, // Brilho Acumulativo de Holograma
            vertexShader: `
                uniform float uTime;
                uniform float uSpeaking;
                attribute float aRandom;
                
                varying vec3 vPos;
                varying float vShatter;

                // Função de ruído rápido
                float hash(float n) { return fract(sin(n) * 1e4); }

                void main() {
                    vPos = position;
                    vec3 pos = position;

                    // 1. EFEITO DE DESINTEGRAÇÃO ASSIMÉTRICA (Lado Direito se Estilhaça)
                    float normalizedX = pos.x / 120.0;
                    // O lado direito (x positivo) ganha valor alto de shatter
                    float shatter = smoothstep(0.1, 0.9, normalizedX);
                    vShatter = shatter;

                    if (shatter > 0.0) {
                        float n = hash(aRandom * 100.0);
                        // Partículas se afastam e flutuam no tempo
                        float driftX = sin(uTime * 0.5 + aRandom * 10.0) * 150.0 * shatter * n;
                        float driftY = cos(uTime * 0.4 + aRandom * 8.0) * 150.0 * shatter * n;
                        float driftZ = sin(uTime * 0.6 + aRandom * 12.0) * 150.0 * shatter * n;

                        pos.x += driftX + (uTime * 5.0 * shatter * n);
                        pos.y += driftY;
                        pos.z += driftZ;
                    }

                    // 2. MOVIMENTO DO MAXILAR (Fala da IA)
                    // Pega a região inferior central do rosto
                    float jawInfluence = exp(-(pos.x*pos.x)/1000.0 - pow(pos.y + 60.0, 2.0)/1500.0);
                    if (jawInfluence > 0.05 && uSpeaking > 0.5) {
                        float mouthOpen = abs(sin(uTime * 15.0)) * 25.0; // Movimento rápido
                        pos.y -= mouthOpen * jawInfluence;
                        pos.z -= mouthOpen * 0.5 * jawInfluence;
                    }

                    // 3. FOCAL LIGHT POINT (Olho Esquerdo Iluminado)
                    float eyeDist = length(pos.xy - vec2(-40.0, 15.0));
                    float eyeGlow = smoothstep(30.0, 0.0, eyeDist);

                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    
                    // Tamanho Base + Brilho Extremo no Olho
                    gl_PointSize = (4.0 * aRandom + 1.0) * (300.0 / -mvPosition.z);
                    gl_PointSize += eyeGlow * 15.0 * (300.0 / -mvPosition.z); // Aumenta partícula no olho
                    
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform float uTime;
                varying vec3 vPos;
                varying float vShatter;

                void main() {
                    // GEOMETRIA DA PARTÍCULA: Forma de Diamante Rígida (Digital)
                    vec2 pt = gl_PointCoord - vec2(0.5);
                    if (abs(pt.x) + abs(pt.y) > 0.5) discard;

                    // COR BASE (Azul Profundo a Ciano)
                    vec3 baseColor = vec3(0.0, 0.6, 0.9);

                    // TRILHAS DE CIRCUITO (Flow Lines no lado sólido esquerdo)
                    float flow = 0.0;
                    if (vShatter < 0.2) {
                        float line1 = sin(vPos.y * 0.3 + uTime * 3.0);
                        float line2 = sin((vPos.x + vPos.y) * 0.2 - uTime * 2.0);
                        flow = smoothstep(0.95, 1.0, line1) + smoothstep(0.95, 1.0, line2);
                    }

                    // PONTO FOCAL DE LUZ (Olho Esquerdo Brilhante)
                    float eyeDist = length(vPos.xy - vec2(-40.0, 15.0));
                    float eyeGlow = smoothstep(25.0, 0.0, eyeDist) * 3.0;

                    // MISTURA DE LUZES
                    vec3 finalColor = baseColor;
                    
                    // Lado fragmentado fica com brilho mais elétrico e claro
                    finalColor += vec3(0.2, 0.8, 1.0) * vShatter;
                    
                    // Adiciona os circuitos de energia
                    finalColor += vec3(0.5, 1.0, 1.0) * flow;

                    // Adiciona o brilho insano do olho
                    finalColor += vec3(0.8, 1.0, 1.0) * eyeGlow;

                    // Fade out suave para partículas muito espalhadas
                    float alpha = 1.0 - (vShatter * 0.5);

                    gl_FragColor = vec4(finalColor, alpha);
                }
            `
        });

        particleSystem = new THREE.Points(geometry, material);
        
        // Inclinação sutil padrão para ficar majestoso
        particleSystem.rotation.y = -0.15;
        particleSystem.rotation.x = 0.05;

        scene.add(particleSystem);

        window.addEventListener('resize', onWindowResize, false);
        document.addEventListener('mousemove', onMouseMove, false);

        animateHologram();
    }

    let mouseX = 0; let mouseY = 0;
    function onMouseMove(event) {
        mouseX = (event.clientX - window.innerWidth / 2) * 0.0005;
        mouseY = (event.clientY - window.innerHeight / 2) * 0.0005;
    }

    function onWindowResize() {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animateHologram() {
        requestAnimationFrame(animateHologram);
        
        // Só renderiza se a tela estiver ativa para poupar GPU
        if(aiOverlay.classList.contains('active') && particleSystem) {
            uniforms.uTime.value += 0.02;
            
            // Rotação suave acompanhando o mouse (Parallax)
            particleSystem.rotation.y += (mouseX - particleSystem.rotation.y) * 0.05;
            particleSystem.rotation.x += (mouseY - particleSystem.rotation.x) * 0.05;
            
            renderer.render(scene, camera);
        }
    }

    // Tenta iniciar a Scene em Background
    initHologram();
  
    // ==========================================
    // LÓGICA DE API E BUSCA HABBO
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
            try { 
                const res = await fetch(getProxyUrl(targetUrl)); const text = await res.text(); 
                try { const data = JSON.parse(text); if (data && (data.uniqueId || data.error === "not-found" || data.user || Array.isArray(data.groups))) return data; } catch(e) {} 
            } catch (e) {} 
        } 
        throw new Error("Proxy falhou"); 
    }
    
    function formatDate(isoString) { 
        if (!isoString) return "Desconhecido"; const date = new Date(isoString); 
        return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); 
    }
    
    async function fetchSystemData() { 
        const SYSTEM_API_URL = "https://script.google.com/macros/s/AKfycbyy60vUK67T3m1XBAzv-gwP34e2NfNoM9VIDVoFsQO0QPGPnTKSrT_sgO2nOKD_sc9h/exec"; 
        try { const res = await fetch(SYSTEM_API_URL); systemLegislationData = await res.json(); } catch (e) { console.error("Falha ao sincronizar Planilha DIC.", e); } 
    }
  
    async function fetchUserData(nick, domain) {
        const targetUrl = `https://www.habbo.${domain}/api/public/users?name=${encodeURIComponent(nick)}`;
        const baseData = await fetchWithProxy(targetUrl);
        if (baseData.error === "not-found" || (baseData.name && baseData.name.toLowerCase() !== nick.toLowerCase())) return { exists: false, nick: nick };
        const uniqueId = baseData.uniqueId; let profileVisible = baseData.profileVisible; if (baseData.lastAccessTime) profileVisible = true;
        let allGroups = []; let policeGroups = []; let otherPoliceGroups = []; 
        if (profileVisible && uniqueId) { 
            try { 
                const profData = await fetchWithProxy(`https://www.habbo.${domain}/api/public/users/${uniqueId}/profile`); 
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
  
        if (infracoes.length > 0) { playSound('error'); statusPolicialText = `<span class="val-red"><i class="fa-solid fa-triangle-exclamation"></i> TRANSGRESSÃO DETECTADA</span><br><span style="font-size: 10px; color: var(--status-warn); margin-top: 4px; display: inline-block;">- ${infracoes.join('<br> - ')}</span>`; } else { playSound('success'); }
  
        const sysData = systemLegislationData[data.nick.toLowerCase()]; let historicoHtml = '<span class="val-gray">Nenhum registro aprovado.</span>';
        if (sysData && sysData.historico && sysData.historico.length > 0) {
            historicoHtml = [...sysData.historico].reverse().slice(0, 4).map(item => { let cor = item.acao.toUpperCase().includes("PROMO") ? "var(--status-ok)" : "var(--status-err)"; return `<span style="color: var(--text-muted);">[${item.data}]</span> <span style="color: ${cor}; font-weight: bold; font-size: 11px;">${item.acao}</span>`; }).join('<br>') + (sysData.historico.length > 4 ? `<br><span style="font-size: 10px; color: var(--text-muted);">+ ${sysData.historico.length - 4} registro(s) oculto(s)...</span>` : "");
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
  
    function updateFailuresUI() { failCountUI.textContent = failedNicks.length; failuresListUI.innerHTML = ""; failedNicks.forEach(nick => { const li = document.createElement('li'); li.innerHTML = `<span>${nick}</span> <span><i class="fa-solid fa-triangle-exclamation"></i></span>`; failuresListUI.appendChild(li); }); }
    function addFailedNick(nick) { if(!failedNicks.includes(nick)) { failedNicks.push(nick); updateFailuresUI(); } }
    function removeFailedNick(nick) { failedNicks = failedNicks.filter(n => n !== nick); updateFailuresUI(); }
  
    failuresToggle.addEventListener('click', () => {
       if (failuresBody.style.display === 'none') { failuresBody.style.display = 'block'; toggleIcon.classList.replace('fa-chevron-down', 'fa-chevron-up'); if (failedNicks.length > 0 && !isRetrying) { startRetryProcess(); } } 
       else { failuresBody.style.display = 'none'; toggleIcon.classList.replace('fa-chevron-up', 'fa-chevron-down'); }
    });
  
    async function startRetryProcess() {
        isRetrying = true; let count = 3;
        const countdown = setInterval(async () => {
            retryStatus.textContent = `Forçando comunicação em ${count}s...`; count--;
            if (count < 0) {
                clearInterval(countdown); retryStatus.textContent = "Re-processando alvos perdidos..."; retryStatus.style.color = "var(--accent-light)";
                const nicksToRetry = [...failedNicks]; const domain = hotelSelect.value; const CHUNK_SIZE = 5; 
                for (let i = 0; i < nicksToRetry.length; i += CHUNK_SIZE) {
                    const chunk = nicksToRetry.slice(i, i + CHUNK_SIZE);
                    await Promise.all(chunk.map(async (nick) => {
                        try { const data = await fetchUserData(nick, domain); scannedUsersData.push(data); if (shouldRenderUser(data)) { if (data.exists) createSuccessCard(data); else createErrorCard(data.nick); resultCount.textContent = parseInt(resultCount.textContent) + 1; } removeFailedNick(nick); } catch(e) { scannedUsersData.push({ exists: false, nick: nick, realFailure: true }); if (shouldRenderUser({ exists: false })) { createErrorCard(nick, true); resultCount.textContent = parseInt(resultCount.textContent) + 1; } removeFailedNick(nick); }
                    }));
                    await new Promise(r => setTimeout(r, 500));
                }
                retryStatus.textContent = "Processamento finalizado."; retryStatus.style.color = "var(--status-ok)"; isRetrying = false;
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
            const chunk = nicks.slice(i, i + CHUNK_SIZE); scanStatus.textContent = `Varredura rápida: Lote ${Math.floor(i / CHUNK_SIZE) + 1} de ${totalChunks}...`; playSound('scan');
            await Promise.all(chunk.map(async (nick) => {
                try { const data = await fetchUserData(nick, domain); scannedUsersData.push(data); if (shouldRenderUser(data)) { if (data.exists) createSuccessCard(data); else createErrorCard(data.nick); resultCount.textContent = parseInt(resultCount.textContent) + 1; } } catch(e) { failedNicks.push(nick); }
            }));
            const cards = resultsGrid.querySelectorAll('.target-card'); if (cards.length > 0) cards[cards.length - 1].scrollIntoView({ behavior: 'smooth', block: 'end' });
            await new Promise(r => setTimeout(r, 1200)); 
        }
    
        stopTypingSound(); scanStatus.textContent = "Varredura principal concluída."; const totalRiscos = updateAnalyticsHUD(); analyticsPanel.style.display = "flex"; btnSearch.disabled = false;
    
        // A MÁGICA: CHAMA A IA NO FIM DA BUSCA
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
        if (aiOverlay) {
            setTimeout(() => {
                aiOverlay.classList.add('active'); // Liga o Vidro Escuro 
                setTimeout(() => {
                    let msg = totalRiscos > 0 
                      ? `Atenção. Varredura finalizada. Uma ameaça foi identificada. Foram encontradas ${totalRiscos} transgressões no sistema.` 
                      : "Varredura finalizada. Nenhuma transgressão foi encontrada no sistema.";
                    speakText(msg, null, () => { setTimeout(() => { aiOverlay.classList.remove('active'); }, 500); });
                }, 1000); 
            }, 800); 
        }
    });

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
