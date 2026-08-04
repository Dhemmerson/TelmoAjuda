<script>
        const SENHA_GERAL = 'senha@321';
        const SENHA_DIRETORIA = '7';

        const body = document.body;
        const widgetLeft = document.getElementById('widgetLeft');
        const widgetRight = document.getElementById('widgetRight');
        const searchForm = document.getElementById('searchForm');

        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        window.addEventListener('load', () => {
            window.scrollTo(0, 0);
            startClock();
            fetchWeather();
        });
        window.addEventListener('pageshow', () => window.scrollTo(0, 0));

        if (localStorage.getItem('theme') === 'dark') {
            body.classList.add('dark-mode');
        }

        function toggleTheme() {
            body.classList.toggle('dark-mode');
            localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
        }

        function togglePasswordVisibility(inputId, btnElement) {
            const input = document.getElementById(inputId);
            if (input.type === 'password') {
                input.type = 'text';
                btnElement.textContent = '⌣';
            } else {
                input.type = 'password';
                btnElement.textContent = '️👁';
            }
        }

        function showError(boxId, errorId, message) {
            const box = document.getElementById(boxId);
            const errorDiv = document.getElementById(errorId);
            errorDiv.textContent = message;
            errorDiv.classList.add('show');
            box.classList.remove('shake');
            void box.offsetWidth; 
            box.classList.add('shake');
            setTimeout(() => { errorDiv.classList.remove('show'); }, 4000);
        }

        function checkPassword() {
            const passwordInput = document.getElementById('password').value;
            if (passwordInput === SENHA_GERAL) {
                document.getElementById('loginOverlay').style.display = 'none';
                document.body.style.overflow = 'auto'; 
                widgetLeft.style.display = 'flex';   
                widgetRight.style.display = 'flex';   
                startClock();                         
                fetchWeather();  
                setInterval(fetchWeather, 600000);				
                iniciarLembreteAgua();
            } else {
                showError('boxGeral', 'errorGeral', 'Código de acesso incorreto!');
            }
        }

        function startClock() {
            const clockText = document.getElementById('clockText');
            const greetingText = document.getElementById('greetingText');

            function updateTime() {
                const now = new Date();
                const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
                const secStr = `:${String(now.getSeconds()).padStart(2,'0')}`;
                
                if(document.getElementById('clockHours')) {
                    document.getElementById('clockHours').textContent = timeStr;
                    document.getElementById('clockSeconds').textContent = secStr;
                }

                const h = now.getHours();
                const greetMsg = h >= 5 && h < 12 ? "Bom dia, Equipe Wick! ☀️" : h >= 12 && h < 18 ? "Boa tarde, Equipe Wick! 🌤️" : "Boa noite, Equipe Wick! 🌙";
                
                if(greetingText) greetingText.textContent = greetMsg;
            }
            updateTime(); setInterval(updateTime, 1000);
        }

        function getWeatherAssets(code) {
            if (code === 0) return { desc: "Céu Limpo", icon: "☀️" };
            if ([1, 2, 3].includes(code)) return { desc: "Parcialmente Nublado", icon: "⛅" };
            if ([45, 48].includes(code)) return { desc: "Névoa", icon: "🌫️" };
            if ([51, 53, 55, 61, 63, 65].includes(code)) return { desc: "Chuva Leve", icon: "🌧️" };
            if ([80, 81, 82].includes(code)) return { desc: "Pancadas de Chuva", icon: "🌦️" };
            if ([95, 96, 99].includes(code)) return { desc: "Tempestade", icon: "⛈️" };
            return { desc: "Limpo", icon: "☀️" };
        }

        function getAirQualityLabel(aqi) {
            if (aqi <= 50) return 'Boa';
            if (aqi <= 100) return 'Moderada';
            if (aqi <= 150) return 'Ruim para sensíveis';
            if (aqi <= 200) return 'Ruim';
            if (aqi <= 300) return 'Muito ruim';
            return 'Perigosa';
        }

        async function fetchWeather() {
            const url = "https://api.open-meteo.com/v1/forecast?latitude=-16.6786&longitude=-49.2537&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation_probability&timezone=America%2FSao_Paulo";
            const airQualityUrl = "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=-16.6786&longitude=-49.2537&current=us_aqi&timezone=America%2FSao_Paulo";
            try {
                const response = await fetch(url);
                const data = await response.json();
                if (data && data.current) {
                    const cur = data.current;
                    const assets = getWeatherAssets(cur.weather_code);
                    const tempText = `${Math.round(cur.temperature_2m)}°C - Goiânia`;
                    
                    document.getElementById('weatherTemp').textContent = tempText;
                    document.getElementById('weatherDesc').textContent = assets.desc;
                    document.getElementById('weatherIcon').textContent = assets.icon;

                    document.getElementById('modalHumidity').textContent = `${cur.relative_humidity_2m}%`;
                    const rainChance = data.hourly.precipitation_probability[0];
                    document.getElementById('modalRain').textContent = `${rainChance}%`;

                    try {
                        const airResponse = await fetch(airQualityUrl);
                        const airData = await airResponse.json();
                        const aqi = airData?.current?.us_aqi;
                        document.getElementById('modalAirQuality').textContent = Number.isFinite(aqi)
                            ? `${getAirQualityLabel(aqi)} (${Math.round(aqi)})`
                            : 'Indisponível';
                    } catch (error) {
                        document.getElementById('modalAirQuality').textContent = 'Indisponível';
                    }

                    const now = new Date();
                    const currentHour = now.getHours();
                    const container = document.getElementById('hourlyContainer');
                    container.innerHTML = '';

                    for (let i = 0; i < 6; i++) {
                        const index = (currentHour + i) % 24;
                        const targetHour = index;
                        const tempHourly = Math.round(data.hourly.temperature_2m[index]);
                        const codeHourly = data.hourly.weather_code[index];
                        const hourlyAssets = getWeatherAssets(codeHourly);
                        const rainHourly = data.hourly.precipitation_probability[index];

                        const item = document.createElement('div');
                        item.className = 'hourly-item';
                        item.innerHTML = `
                            <span class="hour">${String(targetHour).padStart(2,'0')}:00</span>
                            <span class="icon">${hourlyAssets.icon}</span>
                            <span class="temp">${tempHourly}°C</span>
                            <span class="rain">🌧️ ${rainHourly}%</span>
                        `;
                        container.appendChild(item);
                    }
                }
            } catch (error) {
                document.getElementById('weatherTemp').textContent = "Goiânia";
                document.getElementById('weatherDesc').textContent = "Clima indisponível";
            }
        }

        function openWeatherModal() {
            document.getElementById('weatherModal').classList.add('active');
        }

        function closeWeatherModal(e) {
            if (e.target === document.getElementById('weatherModal')) {
                document.getElementById('weatherModal').classList.remove('active');
            }
        }

        searchForm.addEventListener('submit', function(event) {
            event.preventDefault(); 
            const input = document.getElementById('systemSearch').value;
            if (typeof filterSystems === 'function') {
                filterSystems();
            }
            if (input.trim() !== "") {
                const baseUrl = "https://telmogrupowick.com.br/kb/search";
                window.open(`${baseUrl}?q=${encodeURIComponent(input)}`, '_blank');
            }
        });

        function startVoiceRecognition() {
            const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.lang = 'pt-BR';
            recognition.onresult = function(event) {
                const transcript = event.results[0][0].transcript;
                const inputField = document.getElementById('systemSearch');
                inputField.value = transcript;
                if (typeof filterSystems === 'function') {
                    filterSystems();
                }
            };
            recognition.start();
        }
		
        const INTERVALO_AGUA_MINUTOS = 30;
        let lembreteAguaIniciado = false;

        function chaveAguaHoje() {
            const hoje = new Date();
            const data = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
            return `hidratacao-${data}`;
        }

        function totalAguaHoje() {
            return Number(localStorage.getItem(chaveAguaHoje())) || 0;
        }

        function atualizarWidgetAgua() {
            const total = totalAguaHoje();
            document.getElementById('waterNext').textContent = total > 0
                ? `${total} ml hoje`
                : 'Clique para registrar água';
        }

        function registrarAgua(event) {
            event.stopPropagation();
            const resposta = window.prompt('Quantos ml de água você tomou?', '250');
            if (resposta === null) return;

            const quantidade = Number(resposta.replace(',', '.'));
            if (!Number.isFinite(quantidade) || quantidade <= 0) {
                alert('Informe uma quantidade válida em ml.');
                return;
            }

            const novoTotal = totalAguaHoje() + Math.round(quantidade);
            localStorage.setItem(chaveAguaHoje(), novoTotal);
            atualizarWidgetAgua();

            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }

        function iniciarLembreteAgua(){
            if (lembreteAguaIniciado) return;
            lembreteAguaIniciado = true;
            atualizarWidgetAgua();

            function lembrar(){
                document.getElementById('waterNext').textContent = 'Hora de beber água 💧';
                new Audio('https://actions.google.com/sounds/v1/water/drip.ogg').play().catch(() => {});

                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('💧 Hora de beber água!', {
                        body: 'Levante e tome um copo de água.'
                    });
                } else {
                    alert('💧 Hora de beber água!');
                }
            }

            setInterval(lembrar, INTERVALO_AGUA_MINUTOS * 60 * 1000);
        }

        function switchTab(tabId, element) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            element.classList.add('active');
            const targetContent = document.getElementById(tabId);
            if (targetContent) {
                targetContent.classList.add('active');
                requestAnimationFrame(() => {
                    const margemSuperior = 110;
                    const destino = targetContent.getBoundingClientRect().top + window.scrollY - margemSuperior;
                    window.scrollTo({ top: Math.max(0, destino), behavior: 'smooth' });
                });
            }
        }

        function tryOpenDiretoria(element) {
            const overlay = document.createElement("div"); 
            overlay.className = "overlay-screen";
            const popup = document.createElement("div"); 
            popup.className = "login-box"; 
            popup.id = "boxDiretoria";
            popup.innerHTML = `
                <h3 style="color:var(--text-main); margin-bottom:15px;">ÁREA RESTRITA! ⚠️</h3>
                <div class="password-container" style="width:100%;">
                    <input type="password" id="senhaDiretoria" placeholder="Digite a senha da Diretoria">
                    <button type="button" class="toggle-password" onclick="togglePasswordVisibility('senhaDiretoria', this)" title="Mostrar/Ocultar senha">👁️</button>
                </div>
                <div class="error-message" id="errorDiretoria"></div>
                <button id="confirmarSenha" class="btn-entrar">Entrar</button>
            `;
            overlay.appendChild(popup); 
            document.body.appendChild(overlay);
            
            const inputSenha = document.getElementById("senhaDiretoria"); 
            inputSenha.focus();

            const validarDiretoria = () => {
                if (inputSenha.value === SENHA_DIRETORIA) {
                    document.body.removeChild(overlay);
                    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                    element.classList.add('active'); 
                    document.getElementById('tab6').classList.add('active');
                } else { 
                    showError('boxDiretoria', 'errorDiretoria', 'Senha incorreta!'); 
                }
            };

            document.getElementById("confirmarSenha").onclick = validarDiretoria;
            inputSenha.onkeydown = (ev) => { if(ev.key === 'Enter') validarDiretoria(); };
            overlay.onclick = (ev) => { if (ev.target === overlay) document.body.removeChild(overlay); };
        }
        
        const bannerImages = [
            { url:"https://i.postimg.cc/Pr0qyTNY/temas-23.png", startDate:new Date("2026-05-01T00:03:00"), endDate:new Date("2026-05-31T23:59:00"), link:"https://telmogrupowick.com.br/kb/pt-br/article/551427/regulamento-interno-grupo-wick" },
            { url:"https://i.postimg.cc/3wQJRFqH/temas-(69).png", startDate:new Date("2026-06-30T17:55:00"), endDate:new Date("2026-08-31T23:59:00"), link:null },
            { url:"https://i.postimg.cc/Gp4dXqVh/temas-(68).png", startDate:new Date("2026-06-30T00:01:00"), endDate:new Date("2026-08-31T12:59:00"), link:null },
            { url:"https://i.postimg.cc/RFBqctQb/temas-(71).png", startDate:new Date("2026-07-02T00:01:00"), endDate:new Date("2026-08-31T23:59:00"), link:null },
            { url:"https://i.postimg.cc/5y31Hp6P/temas-(63).png", startDate:new Date("2026-06-01T00:00:01"), endDate:new Date("2026-06-30T17:55:00"), link:null },
            { url:"https://i.postimg.cc/HLGcR3LN/temas-(58).png", startDate:new Date("2026-04-30T07:00:01"), endDate:new Date("2026-05-31T23:59:00"), link:null },
            { url:"https://i.postimg.cc/m2cSyyHf/temas-(72).png", startDate:new Date("2025-07-07T00:00:01"), endDate:new Date("2026-08-31T23:59:00"), link:"https://telmogrupowick.com.br/kb/pt-br/article/594717/atualizacao-omie" }
        ];

        let bannerAtivo = [];
        let bannerAtual = 0;
        let bannerTrack = null;
        let bannerDots = null;
        let bannerTimer = null;

        function bannersValidos(){
            const agora = new Date();
            return bannerImages.filter(item => agora >= item.startDate && agora < item.endDate);
        }

        function iniciarBanner() {
            bannerTrack = document.getElementById("bannerTrack");
            bannerDots = document.getElementById("bannerDots");
            if (!bannerTrack) return;
            bannerTrack.innerHTML = "";
            bannerDots.innerHTML = "";
            bannerAtivo = bannersValidos();
            if (bannerAtivo.length === 0) {
                document.getElementById("bannerContainer").style.display = "none";
                return;
            }
            bannerAtivo.forEach((item, index) => {
                const slide = document.createElement("div");
                slide.className = "banner-slide";
                slide.style.backgroundImage = `url('${item.url}')`;
                bannerTrack.appendChild(slide);
                const dot = document.createElement("span");
                dot.className = "banner-dot";
                if (index === 0) dot.classList.add("active");
                bannerDots.appendChild(dot);
            });
            const clone = bannerTrack.children[0].cloneNode(true);
            bannerTrack.appendChild(clone);
        }

        function atualizarDots(){
            document.querySelectorAll("#bannerDots .banner-dot").forEach((dot,index) => {
                dot.classList.toggle("active",index === bannerAtual);
            });
        }

        function mostrarBanner(indice) {
            if (bannerAtivo.length === 0) return;
            bannerTrack.style.transition = "transform .6s cubic-bezier(.25,1,.5,1)";
            bannerAtual = indice;
            if (bannerAtual > bannerAtivo.length) {
                bannerAtual = 0;
                bannerTrack.style.transition = "none";
                bannerTrack.style.transform = `translateX(0)`;
                setTimeout(() => {
                    bannerTrack.style.transition = "transform .6s cubic-bezier(.25,1,.5,1)";
                    bannerAtual = 1;
                    bannerTrack.style.transform = `translateX(-${bannerAtual * 100}%)`;
                    atualizarDots();
                }, 50);
                return;
            }
            if (bannerAtual === bannerAtivo.length) {
                bannerTrack.style.transform = `translateX(-${bannerAtivo.length * 100}%)`;
            } else {
                bannerTrack.style.transform = `translateX(-${bannerAtual * 100}%)`;
            }
            if (bannerAtual < 0) {
                bannerAtual = bannerAtivo.length - 1;
                bannerTrack.style.transform = `translateX(-${bannerAtual * 100}%)`;
            }
            atualizarDots();
        }

        function proximoBanner(){ mostrarBanner(bannerAtual+1); }
        function bannerAnterior(){ mostrarBanner(bannerAtual-1); }
        function iniciarAutoBanner(){
            if(bannerTimer) clearInterval(bannerTimer);
            bannerTimer = setInterval(proximoBanner, 10000);
        }
        function reiniciarAutoBanner(){ clearInterval(bannerTimer); iniciarAutoBanner(); }

        document.addEventListener("DOMContentLoaded", function(){
            iniciarBanner();
            if(bannerAtivo.length === 0) return;
            mostrarBanner(0);
            iniciarAutoBanner();
            document.getElementById("nextBanner").addEventListener("click", function(){ proximoBanner(); reiniciarAutoBanner(); });
            document.getElementById("prevBanner").addEventListener("click", function(){ bannerAnterior(); reiniciarAutoBanner(); });
            document.getElementById("bannerTrack").addEventListener("dblclick", function(){
                const banner = bannerAtivo[bannerAtual];
                if(banner && banner.link) window.open(banner.link,"_blank");
            });
        });
    </script>
