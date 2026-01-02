// Oyun Değişkenleri
let canvas;
let ctx;

// Canvas boyutlandırma
function resizeCanvas() {
    if (!canvas) return;
    const oldWidth = canvas.width;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Oyuncu pozisyonunu orantılı olarak güncelle
    if (oldWidth > 0 && player) {
        player.x = (player.x / oldWidth) * canvas.width;
        player.y = canvas.height - 100;
    } else if (player) {
        player.x = canvas.width / 2;
        player.y = canvas.height - 100;
    }
}

// Oyun Durumu
let gameState = {
    screen: 'mainMenu',
    isPlaying: false,
    isPaused: false,
    distance: 0, // Metre cinsinden mesafe
    gold: 0, // Oyun içi altın
    silver: 0, // Oyun içi gümüş
    level: 1,
    speed: 2,
    soundEnabled: true,
    lives: 3,
    totalGold: 0, // Toplam birikmiş altın
    totalSilver: 0 // Toplam birikmiş gümüş
};

// Yol Sistemi - Virajlar ve Kavşaklar
let roadCurve = 0; // Yolun eğriliği (-1 ile 1 arası)
let roadCurveTarget = 0; // Hedef eğrilik
let roadCurveSpeed = 0.001; // Eğrilik değişim hızı
let roadSegments = []; // Yol segmentleri
let barriers = []; // Dubalar
let lastBarrierY = -100;

// Ses Sistemi
let crashSound = null;

// Oyun Ayarları
let settings = {
    season: 'spring',
    roadType: 'highway',
    carType: 'sedan_red'
};

// Araba Tipleri ve Fiyatları
const carTypes = {
    sedan_red: { name: 'Kırmızı Sedan', type: 'sedan', color: '#e53e3e', price: 0, width: 50, height: 90 },
    sedan_blue: { name: 'Mavi Sedan', type: 'sedan', color: '#3182ce', price: 50, width: 50, height: 90 },
    sedan_green: { name: 'Yeşil Sedan', type: 'sedan', color: '#38a169', price: 50, width: 50, height: 90 },
    suv_red: { name: 'Kırmızı SUV', type: 'suv', color: '#c53030', price: 100, width: 55, height: 100 },
    suv_black: { name: 'Siyah SUV', type: 'suv', color: '#1a202c', price: 150, width: 55, height: 100 },
    sports_red: { name: 'Kırmızı Spor', type: 'sports', color: '#e53e3e', price: 200, width: 45, height: 80 },
    sports_yellow: { name: 'Sarı Spor', type: 'sports', color: '#d69e2e', price: 250, width: 45, height: 80 },
    truck_blue: { name: 'Mavi Kamyon', type: 'truck', color: '#2c5282', price: 300, width: 60, height: 120 },
    truck_green: { name: 'Yeşil Kamyon', type: 'truck', color: '#2f855a', price: 350, width: 60, height: 120 },
    limo_black: { name: 'Siyah Limuzin', type: 'limo', color: '#1a202c', price: 500, width: 50, height: 140 }
};

// Sahip olunan arabalar (localStorage'dan yüklenecek)
let ownedCars = ['sedan_red']; // Başlangıçta sadece kırmızı sedan

// Düşman araba tipleri
const enemyCarTypes = [
    { type: 'sedan', width: 50, height: 90, colors: ['#e53e3e', '#3182ce', '#38a169', '#d69e2e'] },
    { type: 'suv', width: 55, height: 100, colors: ['#c53030', '#1a202c', '#2d3748'] },
    { type: 'sports', width: 45, height: 80, colors: ['#e53e3e', '#d69e2e', '#805ad5'] },
    { type: 'truck', width: 60, height: 120, colors: ['#2c5282', '#2f855a', '#744210'] },
    { type: 'limo', width: 50, height: 140, colors: ['#1a202c', '#2d3748'] }
];

// Mevsim Renkleri
const seasonColors = {
    spring: { road: '#4a5568', grass: '#48bb78', sky: '#90cdf4', trees: '#68d391' },
    summer: { road: '#2d3748', grass: '#38a169', sky: '#63b3ed', trees: '#48bb78' },
    autumn: { road: '#4a5568', grass: '#d69e2e', sky: '#f6ad55', trees: '#f56565' },
    winter: { road: '#718096', grass: '#e2e8f0', sky: '#cbd5e0', trees: '#a0aec0' }
};

// Yol Yapıları (daraltıldı ve mobile uyumlu)
const roadConfigs = {
    highway: { lanes: 4, width: 0.65 },
    city: { lanes: 3, width: 0.55 },
    country: { lanes: 2, width: 0.45 }
};

// Oyuncu Arabası
let player = {
    x: 0,
    y: 0,
    width: 50,
    height: 90,
    speed: 5,
    color: '#e53e3e',
    carType: 'sedan_red',
    invulnerable: false,
    invulnerableTime: 0
};

// Düşman Arabalar
let enemyCars = [];
let roadOffset = 0; // Perspektif efekti için

// Altınlar
let coins = [];

// Kontrol Değişkenleri
const keys = {};
let touchLeft = false;
let touchRight = false;

// Menü Yönetimi - Event listener'lar DOMContentLoaded içinde başlatılacak

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    gameState.screen = screenId;
}

function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    document.getElementById('pauseMenu').classList.toggle('hidden');
}

// LocalStorage Yönetimi
function saveGameData() {
    localStorage.setItem('racerGold', gameState.totalGold.toString());
    localStorage.setItem('racerSilver', gameState.totalSilver.toString());
    localStorage.setItem('racerOwnedCars', JSON.stringify(ownedCars));
    localStorage.setItem('racerSelectedCar', settings.carType);
}

function loadGameData() {
    const savedGold = localStorage.getItem('racerGold');
    if (savedGold) {
        gameState.totalGold = parseInt(savedGold) || 0;
    }
    
    const savedSilver = localStorage.getItem('racerSilver');
    if (savedSilver) {
        gameState.totalSilver = parseInt(savedSilver) || 0;
    }
    
    const savedCars = localStorage.getItem('racerOwnedCars');
    if (savedCars) {
        ownedCars = JSON.parse(savedCars);
    }
    
    const savedCar = localStorage.getItem('racerSelectedCar');
    if (savedCar && ownedCars.includes(savedCar)) {
        settings.carType = savedCar;
    }
    
    updatePlayerCar();
}

// Çarpışma Sesi Oluştur
function createCrashSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 150;
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
}

function playCrashSound() {
    if (gameState.soundEnabled) {
        try {
            createCrashSound();
        } catch (e) {
            console.log('Ses çalınamadı:', e);
        }
    }
}

// Oyuncu Araba Güncelleme
function updatePlayerCar() {
    const carInfo = carTypes[settings.carType];
    if (carInfo) {
        player.width = carInfo.width;
        player.height = carInfo.height;
        player.color = carInfo.color;
        player.carType = settings.carType;
    }
}

// Event listener'lar ve touch kontrolleri DOMContentLoaded içinde başlatılacak

// Oyuncu Hareketi
function movePlayer(direction) {
    if (!canvas || !player) return;
    const roadWidth = canvas.width * roadConfigs[settings.roadType].width;
    const baseRoadX = (canvas.width - roadWidth) / 2;
    const curveOffset = roadCurve * (canvas.width * 0.1);
    const roadX = baseRoadX + curveOffset;
    const minX = roadX + player.width / 2;
    const maxX = roadX + roadWidth - player.width / 2;
    
    player.x += player.speed * direction;
    player.x = Math.max(minX, Math.min(maxX, player.x));
}

// Oyun Başlatma
function startGame() {
    if (!canvas || !player) {
        console.error('Oyun başlatılamadı: Canvas veya player hazır değil!');
        return;
    }
    gameState.isPlaying = true;
    gameState.isPaused = false;
    gameState.distance = 0;
    gameState.gold = 0; // Oyun içi altın
    gameState.silver = 0; // Oyun içi gümüş
    gameState.level = 1;
    gameState.speed = 2;
    gameState.lives = 3;
    enemyCars = [];
    coins = [];
    barriers = [];
    roadOffset = 0;
    roadCurve = 0;
    roadCurveTarget = 0;
    lastBarrierY = -100;
    player.x = canvas.width / 2;
    player.y = canvas.height - 100;
    player.invulnerable = false;
    player.invulnerableTime = 0;
    
    updateUI();
    gameLoop();
}

// Oyun Bitirme
function endGame() {
    gameState.isPlaying = false;
    gameState.totalGold += gameState.gold; // Toplanan altınları ekle
    gameState.totalSilver += gameState.silver; // Toplanan gümüşleri ekle
    saveGameData();
    
    document.getElementById('finalGoldDisplay').textContent = gameState.gold;
    document.getElementById('finalSilverDisplay').textContent = gameState.silver;
    const distanceText = gameState.distance >= 1000 
        ? `${(gameState.distance / 1000).toFixed(2)} km`
        : `${Math.floor(gameState.distance)} m`;
    document.getElementById('finalKmDisplay').textContent = distanceText;
    document.getElementById('gameOverMenu').classList.remove('hidden');
}

// Viraj Sistemi
function updateRoadCurve() {
    // Rastgele viraj hedefi belirle
    if (Math.random() < 0.005) {
        roadCurveTarget = (Math.random() - 0.5) * 2; // -1 ile 1 arası
    }
    
    // Viraja doğru yavaşça dön
    if (roadCurve < roadCurveTarget) {
        roadCurve = Math.min(roadCurve + roadCurveSpeed, roadCurveTarget);
    } else if (roadCurve > roadCurveTarget) {
        roadCurve = Math.max(roadCurve - roadCurveSpeed, roadCurveTarget);
    }
    
    // Viraj hedefine ulaşıldıysa yeni hedef belirle
    if (Math.abs(roadCurve - roadCurveTarget) < 0.01) {
        roadCurveTarget = (Math.random() - 0.5) * 0.5; // Daha yumuşak geçişler
    }
}

// Duba Oluşturma
function createBarrier(y) {
    if (!canvas) return;
    const roadWidth = canvas.width * roadConfigs[settings.roadType].width;
    const baseRoadX = (canvas.width - roadWidth) / 2;
    const curveOffset = roadCurve * (canvas.width * 0.1);
    const roadX = baseRoadX + curveOffset;
    
    // Sol ve sağ tarafta dubalar
    barriers.push({
        x: roadX - 15,
        y: y,
        width: 20,
        height: 30,
        side: 'left',
        baseX: baseRoadX - 15 // Viraj için referans noktası
    });
    
    barriers.push({
        x: roadX + roadWidth - 5,
        y: y,
        width: 20,
        height: 30,
        side: 'right',
        baseX: baseRoadX + roadWidth - 5 // Viraj için referans noktası
    });
}

// Düşman Araba Oluşturma (Çarpışma kontrolü ile)
function createEnemyCar() {
    if (!canvas) return;
    const roadWidth = canvas.width * roadConfigs[settings.roadType].width;
    const roadX = (canvas.width - roadWidth) / 2;
    const lanes = roadConfigs[settings.roadType].lanes;
    const laneWidth = roadWidth / lanes;
    
    // Viraj etkisi
    const curveOffset = roadCurve * (canvas.width * 0.1);
    const adjustedRoadX = roadX + curveOffset;
    
    const lane = Math.floor(Math.random() * lanes);
    let x = adjustedRoadX + (lane + 0.5) * laneWidth;
    
    // Diğer arabalarla çarpışma kontrolü
    let attempts = 0;
    let canPlace = false;
    while (!canPlace && attempts < 10) {
        canPlace = true;
        const newCar = {
            x: x,
            y: -150,
            width: 0,
            height: 0,
            speed: 0,
            color: '',
            carType: '',
            z: 0
        };
        
        // Rastgele araba tipi seç
        const carType = enemyCarTypes[Math.floor(Math.random() * enemyCarTypes.length)];
        const color = carType.colors[Math.floor(Math.random() * carType.colors.length)];
        
        newCar.width = carType.width;
        newCar.height = carType.height;
        newCar.speed = gameState.speed + Math.random() * 2;
        newCar.color = color;
        newCar.carType = carType.type;
        
        // Mevcut arabalarla çarpışma kontrolü
        for (let i = 0; i < enemyCars.length; i++) {
            const existingCar = enemyCars[i];
            // Aynı yükseklikte veya yakın yükseklikte olan arabaları kontrol et
            if (Math.abs(existingCar.y - newCar.y) < newCar.height + existingCar.height) {
                const distance = Math.abs(existingCar.x - newCar.x);
                const minDistance = (newCar.width + existingCar.width) / 2 + 10; // 10px boşluk
                if (distance < minDistance) {
                    canPlace = false;
                    // Farklı bir şerit dene
                    const newLane = Math.floor(Math.random() * lanes);
                    x = adjustedRoadX + (newLane + 0.5) * laneWidth;
                    break;
                }
            }
        }
        
        if (canPlace) {
            enemyCars.push(newCar);
            break;
        }
        
        attempts++;
    }
}

// Altın ve Gümüş Oluşturma
function createCoin() {
    if (!canvas) return;
    const roadWidth = canvas.width * roadConfigs[settings.roadType].width;
    const roadX = (canvas.width - roadWidth) / 2;
    const curveOffset = roadCurve * (canvas.width * 0.1);
    const adjustedRoadX = roadX + curveOffset;
    
    // %70 altın, %30 gümüş
    const isGold = Math.random() < 0.7;
    
    coins.push({
        x: adjustedRoadX + Math.random() * roadWidth,
        y: -30,
        radius: 15,
        speed: gameState.speed + 1,
        collected: false,
        type: isGold ? 'gold' : 'silver'
    });
}

// Çarpışma Tespiti
function checkCollision(playerObj, carObj) {
    if (playerObj.invulnerable) return false;
    
    const pLeft = playerObj.x - playerObj.width / 2;
    const pRight = playerObj.x + playerObj.width / 2;
    const pTop = playerObj.y;
    const pBottom = playerObj.y + playerObj.height;
    
    const cLeft = carObj.x - carObj.width / 2;
    const cRight = carObj.x + carObj.width / 2;
    const cTop = carObj.y;
    const cBottom = carObj.y + carObj.height;
    
    return pLeft < cRight && pRight > cLeft && pTop < cBottom && pBottom > cTop;
}

// Para Toplama Tespiti
function checkCoinCollection(coin, player) {
    const dx = coin.x - player.x;
    const dy = coin.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < coin.radius + player.width / 2;
}

// Oyun Güncelleme
function updateGame() {
    if (!gameState.isPlaying || gameState.isPaused || !canvas || !player) return;
    
    // Mesafe güncelle (KM sistemi)
    gameState.distance += gameState.speed * 0.1; // Her frame'de mesafe artışı
    
    // Viraj güncelle
    updateRoadCurve();
    
    // Kontroller
    if (keys['ArrowLeft'] || keys['a'] || keys['A'] || touchLeft) {
        movePlayer(-1);
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D'] || touchRight) {
        movePlayer(1);
    }
    
    // Düşman araba oluşturma
    if (Math.random() < 0.02) {
        createEnemyCar();
    }
    
    // Para oluşturma (altın ve gümüş)
    if (Math.random() < 0.01) {
        createCoin();
    }
    
    // Duba oluşturma
    if (lastBarrierY > 50 || lastBarrierY < -50) {
        createBarrier(-50);
        lastBarrierY = -50;
    }
    
    // Invulnerability kontrolü
    if (player.invulnerable) {
        player.invulnerableTime--;
        if (player.invulnerableTime <= 0) {
            player.invulnerable = false;
        }
    }
    
    // Perspektif efekti için road offset güncelle
    roadOffset += gameState.speed * 0.5;
    if (roadOffset > 100) roadOffset = 0;
    
    // Dubaları güncelle
    for (let i = barriers.length - 1; i >= 0; i--) {
        const barrier = barriers[i];
        barrier.y += gameState.speed + 2;
        lastBarrierY = barrier.y;
        
        // Viraj etkisi
        const curveOffset = roadCurve * (canvas.width * 0.1) * (barrier.y / canvas.height);
        if (barrier.baseX !== undefined) {
            barrier.x = barrier.baseX + curveOffset;
        }
        
        if (barrier.y > canvas.height + 50) {
            barriers.splice(i, 1);
        }
    }
    
    // Düşman arabaları güncelle
    for (let i = enemyCars.length - 1; i >= 0; i--) {
        const car = enemyCars[i];
        // Perspektif efekti: arabalar yaklaştıkça daha hızlı hareket ediyor gibi
        const perspectiveSpeed = gameState.speed + (canvas.height - car.y) / canvas.height * 3;
        car.y += perspectiveSpeed;
        car.z = (car.y / canvas.height) * 100; // Z değeri perspektif için
        
        // Viraj etkisi - arabalar viraja göre yatay hareket eder
        const curveEffect = roadCurve * (canvas.width * 0.1) * (car.y / canvas.height);
        const baseRoadX = (canvas.width - canvas.width * roadConfigs[settings.roadType].width) / 2;
        const roadWidth = canvas.width * roadConfigs[settings.roadType].width;
        const adjustedRoadX = baseRoadX + curveEffect;
        
        // Arabanın yol içinde kalmasını sağla
        const minX = adjustedRoadX + car.width / 2;
        const maxX = adjustedRoadX + roadWidth - car.width / 2;
        car.x = Math.max(minX, Math.min(maxX, car.x));
        
        // Çarpışma kontrolü
        if (checkCollision(player, car)) {
            playCrashSound();
            gameState.lives--;
            player.invulnerable = true;
            player.invulnerableTime = 60; // 1 saniye invulnerability (60 frame)
            
            if (gameState.lives <= 0) {
                endGame();
                return;
            }
            
            enemyCars.splice(i, 1);
            updateUI();
            continue;
        }
        
        // Araba geçme kontrolü (düşman araba player'ın arkasına geçtiğinde) - 10m ekle
        if (!car.passed && car.y > player.y + player.height) {
            car.passed = true;
            gameState.distance += 10; // 10 metre ekle
            updateUI();
        }
        
        // Ekrandan çıkan arabaları kaldır
        if (car.y > canvas.height + 50) {
            enemyCars.splice(i, 1);
        }
    }
    
    // Altınları güncelle
    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        if (coin.collected) {
            coins.splice(i, 1);
            continue;
        }
        
        coin.y += coin.speed;
        
        // Para toplama kontrolü
        if (checkCoinCollection(coin, player)) {
            if (coin.type === 'gold') {
            gameState.gold += 1;
            } else {
                gameState.silver += 1;
            }
            coin.collected = true;
            coins.splice(i, 1);
            updateUI();
        }
        
        // Ekrandan çıkan altınları kaldır
        if (coin.y > canvas.height) {
            coins.splice(i, 1);
        }
    }
    
    // Bölüm kontrolü (her 1000m'de bir seviye artışı)
    const newLevel = Math.floor(gameState.distance / 1000) + 1;
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        gameState.speed += 0.5;
        updateUI();
    }
}

// Oyun Çizimi
function drawGame() {
    if (!canvas || !ctx || !player) return;
    const colors = seasonColors[settings.season];
    const roadWidth = canvas.width * roadConfigs[settings.roadType].width;
    const baseRoadX = (canvas.width - roadWidth) / 2;
    const lanes = roadConfigs[settings.roadType].lanes;
    
    // Viraj etkisi
    const curveOffset = roadCurve * (canvas.width * 0.1);
    const roadX = baseRoadX + curveOffset;
    
    // Gökyüzü (gradient)
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, colors.sky);
    skyGradient.addColorStop(1, colors.sky + 'dd');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Çimen (virajla birlikte)
    ctx.fillStyle = colors.grass;
    ctx.fillRect(0, 0, roadX, canvas.height);
    ctx.fillRect(roadX + roadWidth, 0, canvas.width - (roadX + roadWidth), canvas.height);
    
    // Perspektifli yol çizimi (virajlı)
    drawRoadWithPerspective(roadX, roadWidth, lanes, colors, roadOffset, roadCurve);
    
    // Dubalar
    barriers.forEach(barrier => {
        drawBarrier(barrier.x, barrier.y, barrier.width, barrier.height, barrier.side);
    });
    
    // Düşman arabalar (z değerine göre sırala - uzaktakiler önce çizilsin)
    const sortedCars = [...enemyCars].sort((a, b) => b.z - a.z);
    sortedCars.forEach(car => {
        const scale = 0.5 + (car.y / canvas.height) * 0.5; // Perspektif ölçekleme
        drawAdvancedCar(car.x, car.y, car.width * scale, car.height * scale, car.color, car.carType, scale);
    });
    
    // Paralar (altın ve gümüş)
    coins.forEach(coin => {
        if (!coin.collected) {
            const scale = 0.5 + (coin.y / canvas.height) * 0.5;
            drawCoin(coin.x, coin.y, coin.radius * scale, coin.type);
        }
    });
    
    // Oyuncu arabası (invulnerable ise yanıp sönsün)
    if (!player.invulnerable || Math.floor(player.invulnerableTime / 5) % 2 === 0) {
        drawAdvancedCar(player.x, player.y, player.width, player.height, player.color, player.carType, 1);
    }
}

// Perspektifli yol çizimi (virajlı)
function drawRoadWithPerspective(roadX, roadWidth, lanes, colors, offset, curve) {
    // Yol gövdesi (gradient ile daha güzel)
    const roadGradient = ctx.createLinearGradient(roadX, 0, roadX + roadWidth, 0);
    roadGradient.addColorStop(0, colors.road);
    roadGradient.addColorStop(0.5, colors.road + 'aa');
    roadGradient.addColorStop(1, colors.road);
    ctx.fillStyle = roadGradient;
    ctx.fillRect(roadX, 0, roadWidth, canvas.height);
    
    // Yol kenarları (daha belirgin)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(roadX, 0);
    ctx.lineTo(roadX, canvas.height);
    ctx.moveTo(roadX + roadWidth, 0);
    ctx.lineTo(roadX + roadWidth, canvas.height);
    ctx.stroke();
    
    // Şerit çizgileri (perspektifli ve virajlı)
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.setLineDash([30, 20]);
    
    for (let i = 1; i < lanes; i++) {
        const baseLineX = roadX + (roadWidth / lanes) * i;
        
        // Perspektif ve viraj efekti
        ctx.beginPath();
        for (let y = 0; y <= canvas.height; y += 5) {
            const perspective = 1 + (y / canvas.height) * 0.4;
            const curveEffect = curve * (canvas.width * 0.05) * (y / canvas.height);
            const lineX = baseLineX + curveEffect;
            
            if (y === 0) {
                ctx.moveTo(lineX, y);
            } else {
                ctx.lineTo(lineX, y);
            }
        }
        ctx.stroke();
    }
    ctx.setLineDash([]);
    
    // Orta çizgi (kesikli, perspektifli ve virajlı)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.setLineDash([40, 20]);
    ctx.beginPath();
    const centerX = roadX + roadWidth / 2;
    for (let y = 0; y <= canvas.height; y += 5) {
        const curveEffect = curve * (canvas.width * 0.05) * (y / canvas.height);
        const lineX = centerX + curveEffect;
        
        if (y === 0) {
            ctx.moveTo(lineX, y);
        } else {
            ctx.lineTo(lineX, y);
        }
    }
    ctx.stroke();
    ctx.setLineDash([]);
}

// Duba Çizimi
function drawBarrier(x, y, width, height, side) {
    // Duba gövdesi (turuncu-kırmızı)
    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    gradient.addColorStop(0, '#ff6b35');
    gradient.addColorStop(0.5, '#f7931e');
    gradient.addColorStop(1, '#ff6b35');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
    
    // Duba kenarları
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    // Duba içi çizgiler
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + width/2, y);
    ctx.lineTo(x + width/2, y + height);
    ctx.stroke();
}

// Gelişmiş Araba Çizimi
function drawAdvancedCar(x, y, width, height, color, carType, scale) {
    ctx.save();
    
    // Araba tipine göre çiz
    switch(carType) {
        case 'sedan':
            drawSedan(x, y, width, height, color);
            break;
        case 'suv':
            drawSUV(x, y, width, height, color);
            break;
        case 'sports':
            drawSportsCar(x, y, width, height, color);
            break;
        case 'truck':
            drawTruck(x, y, width, height, color);
            break;
        case 'limo':
            drawLimo(x, y, width, height, color);
            break;
        default:
            drawSedan(x, y, width, height, color);
    }
    
    ctx.restore();
}

function drawSedan(x, y, width, height, color) {
    // Gövde
    ctx.fillStyle = color;
    ctx.fillRect(x - width/2, y, width, height);
    
    // Üst kısım (cam alanı)
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x - width/2 + 3, y + 5, width - 6, height * 0.25);
    
    // Cam
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(x - width/2 + 5, y + 8, width - 10, height * 0.2);
    
    // Tekerlekler
    drawWheels(x, y, width, height, 0.3, 0.7);
    
    // Detaylar
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - width/2, y, width, height);
}

function drawSUV(x, y, width, height, color) {
    // Gövde (daha yüksek)
    ctx.fillStyle = color;
    ctx.fillRect(x - width/2, y, width, height);
    
    // Üst kısım
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x - width/2 + 2, y + 3, width - 4, height * 0.3);
    
    // Cam (daha büyük)
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(x - width/2 + 4, y + 5, width - 8, height * 0.25);
    
    // Tekerlekler (daha büyük)
    drawWheels(x, y, width, height, 0.25, 0.75);
    
    // Detaylar
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - width/2, y, width, height);
}

function drawSportsCar(x, y, width, height, color) {
    // Alçak gövde
    ctx.fillStyle = color;
    ctx.fillRect(x - width/2, y + height * 0.1, width, height * 0.9);
    
    // Üst kısım (daha küçük)
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x - width/2 + 2, y + height * 0.15, width - 4, height * 0.2);
    
    // Cam
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(x - width/2 + 3, y + height * 0.18, width - 6, height * 0.15);
    
    // Tekerlekler
    drawWheels(x, y + height * 0.1, width, height * 0.9, 0.3, 0.7);
    
    // Spor detaylar
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - width/2, y + height * 0.1, width, height * 0.9);
}

function drawTruck(x, y, width, height, color) {
    // Kamyon kabini
    ctx.fillStyle = color;
    ctx.fillRect(x - width/2, y, width * 0.4, height * 0.4);
    
    // Kamyon kasası
    ctx.fillStyle = color;
    ctx.fillRect(x - width/2 + width * 0.4, y, width * 0.6, height);
    
    // Cam
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(x - width/2 + 3, y + 5, width * 0.35, height * 0.25);
    
    // Tekerlekler (daha büyük)
    drawWheels(x, y, width, height, 0.2, 0.8);
    
    // Detaylar
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - width/2, y, width, height);
}

function drawLimo(x, y, width, height, color) {
    // Uzun gövde
    ctx.fillStyle = color;
    ctx.fillRect(x - width/2, y, width, height);
    
    // Üst kısım
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x - width/2 + 2, y + 3, width - 4, height * 0.2);
    
    // Camlar (çoklu)
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(x - width/2 + 4, y + 5, width * 0.25, height * 0.15);
    ctx.fillRect(x - width/2 + width * 0.35, y + 5, width * 0.25, height * 0.15);
    ctx.fillRect(x - width/2 + width * 0.65, y + 5, width * 0.25, height * 0.15);
    
    // Tekerlekler
    drawWheels(x, y, width, height, 0.15, 0.85);
    
    // Lüks detaylar
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - width/2, y, width, height);
}

function drawWheels(x, y, width, height, frontPos, backPos) {
    ctx.fillStyle = '#1a1a1a';
    const wheelWidth = width * 0.25;
    const wheelHeight = Math.max(12, height * 0.12);
    
    // Ön tekerlekler
    ctx.fillRect(x - width/2 - 2, y + height * frontPos, wheelWidth, wheelHeight);
    ctx.fillRect(x + width/2 - wheelWidth + 2, y + height * frontPos, wheelWidth, wheelHeight);
    
    // Arka tekerlekler
    ctx.fillRect(x - width/2 - 2, y + height * backPos, wheelWidth, wheelHeight);
    ctx.fillRect(x + width/2 - wheelWidth + 2, y + height * backPos, wheelWidth, wheelHeight);
    
    // Tekerlek jantları
    ctx.fillStyle = '#4a5568';
    const rimSize = wheelWidth * 0.6;
    ctx.fillRect(x - width/2 + wheelWidth * 0.2 - 2, y + height * frontPos + wheelHeight * 0.2, rimSize, rimSize);
    ctx.fillRect(x + width/2 - wheelWidth * 0.8 + 2, y + height * frontPos + wheelHeight * 0.2, rimSize, rimSize);
    ctx.fillRect(x - width/2 + wheelWidth * 0.2 - 2, y + height * backPos + wheelHeight * 0.2, rimSize, rimSize);
    ctx.fillRect(x + width/2 - wheelWidth * 0.8 + 2, y + height * backPos + wheelHeight * 0.2, rimSize, rimSize);
}

// Preview için araba çizimi (farklı context ile)
function drawCarPreview(previewCtx, x, y, width, height, color, carType) {
    const oldCtx = ctx;
    ctx = previewCtx;
    
    switch(carType) {
        case 'sedan':
            drawSedan(x, y, width, height, color);
            break;
        case 'suv':
            drawSUV(x, y, width, height, color);
            break;
        case 'sports':
            drawSportsCar(x, y, width, height, color);
            break;
        case 'truck':
            drawTruck(x, y, width, height, color);
            break;
        case 'limo':
            drawLimo(x, y, width, height, color);
            break;
        default:
            drawSedan(x, y, width, height, color);
    }
    
    ctx = oldCtx;
}

// Para Çizimi (Altın veya Gümüş)
function drawCoin(x, y, radius, type = 'gold') {
    if (type === 'gold') {
        // Altın
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Altın içi detay
    ctx.fillStyle = '#ffed4e';
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
    ctx.fill();
    
    // $ işareti
    ctx.fillStyle = '#ffaa00';
        ctx.font = `${radius * 0.8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', x, y);
    } else {
        // Gümüş
        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#808080';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Gümüş içi detay
        ctx.fillStyle = '#e8e8e8';
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        // S işareti (silver)
        ctx.fillStyle = '#808080';
        ctx.font = `${radius * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('S', x, y);
    }
}

// UI Güncelleme
function updateUI() {
    // Mesafe gösterimi (km veya m)
    const distanceText = gameState.distance >= 1000 
        ? `${(gameState.distance / 1000).toFixed(2)} km`
        : `${Math.floor(gameState.distance)} m`;
    document.getElementById('kmDisplay').textContent = distanceText;
    
    document.getElementById('goldDisplay').textContent = gameState.gold;
    document.getElementById('silverDisplay').textContent = gameState.silver;
    document.getElementById('levelDisplay').textContent = gameState.level;
    document.getElementById('livesDisplay').textContent = gameState.lives;
    document.getElementById('mainGoldDisplay').textContent = gameState.totalGold;
    document.getElementById('mainSilverDisplay').textContent = gameState.totalSilver;
    document.getElementById('galleryGoldDisplay').textContent = gameState.totalGold;
    document.getElementById('gallerySilverDisplay').textContent = gameState.totalSilver;
}

// Oyun Başlangıç Ekranı Güncelleme
function updateGameStartScreen() {
    const carInfo = carTypes[settings.carType];
    const seasonNames = {
        spring: 'İlkbahar 🌸',
        summer: 'Yaz ☀️',
        autumn: 'Sonbahar 🍂',
        winter: 'Kış ❄️'
    };
    const roadNames = {
        highway: 'Otoyol',
        city: 'Şehir Yolu',
        country: 'Köy Yolu'
    };
    
    document.getElementById('startCarName').textContent = carInfo ? carInfo.name : '-';
    document.getElementById('startLives').textContent = gameState.lives;
    document.getElementById('startSpeed').textContent = Math.floor(gameState.speed * 20); // km/h yaklaşık
    document.getElementById('startSeason').textContent = seasonNames[settings.season] || '-';
    document.getElementById('startRoadType').textContent = roadNames[settings.roadType] || '-';
}

// Oyun Döngüsü
function gameLoop() {
    if (!gameState.isPlaying) return;
    
    updateGame();
    drawGame();
    
    requestAnimationFrame(gameLoop);
}

// Galeri Fonksiyonları
function renderGallery() {
    const gallery = document.getElementById('carGallery');
    if (!gallery) return;
    
    gallery.innerHTML = '';
    
    Object.keys(carTypes).forEach(carId => {
        const car = carTypes[carId];
        const isOwned = ownedCars.includes(carId);
        const isSelected = settings.carType === carId;
        
        const carItem = document.createElement('div');
        carItem.className = `car-item ${isOwned ? 'owned' : 'locked'} ${isSelected ? 'selected' : ''}`;
        
        carItem.innerHTML = `
            <div class="car-name">${car.name}</div>
            <canvas class="car-preview" width="120" height="80"></canvas>
            ${!isOwned ? `<div class="car-price">💰 ${car.price}</div>` : ''}
            ${!isOwned ? `<button class="car-buy-btn" data-car="${carId}">SATIN AL</button>` : ''}
            ${isOwned && !isSelected ? `<button class="car-select-btn" data-car="${carId}">SEÇ</button>` : ''}
            ${isSelected ? `<div style="color: #ffd700; font-weight: bold; margin-top: 5px;">SEÇİLİ</div>` : ''}
        `;
        
        // Preview canvas'ı çiz
        const previewCanvas = carItem.querySelector('.car-preview');
        if (previewCanvas) {
            const pc = previewCanvas.getContext('2d');
            // Arka plan
            pc.fillStyle = '#2c3e50';
            pc.fillRect(0, 0, 120, 80);
            
            // Araba çiz (preview için özel fonksiyon)
            drawCarPreview(pc, 60, 60, car.width * 0.7, car.height * 0.7, car.color, car.type);
        }
        
        gallery.appendChild(carItem);
    });
    
    // Event listener'ları ekle
    document.querySelectorAll('.car-buy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const carId = e.target.dataset.car;
            buyCar(carId);
        });
    });
    
    document.querySelectorAll('.car-select-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const carId = e.target.dataset.car;
            selectCar(carId);
        });
    });
}

function buyCar(carId) {
    const car = carTypes[carId];
    if (!car) return;
    
    if (ownedCars.includes(carId)) {
        alert('Bu arabaya zaten sahipsiniz!');
        return;
    }
    
    if (gameState.totalGold < car.price) {
        alert(`Yeterli altın yok! Gerekli: ${car.price}, Mevcut: ${gameState.totalGold}`);
        return;
    }
    
    gameState.totalGold -= car.price;
    ownedCars.push(carId);
    saveGameData();
    updateUI();
    renderGallery();
    alert(`${car.name} satın alındı!`);
}

function selectCar(carId) {
    if (!ownedCars.includes(carId)) {
        alert('Bu arabaya sahip değilsiniz!');
        return;
    }
    
    settings.carType = carId;
    updatePlayerCar();
    saveGameData();
    renderGallery();
}

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    // Canvas'ı başlat
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas bulunamadı!');
        return;
    }
    ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Canvas context alınamadı!');
        return;
    }
    
    // Canvas boyutlandır
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Oyun verilerini yükle
    loadGameData();
    
    // Oyuncu arabasını güncelle
    updatePlayerCar();
    
    // Menü Event Listener'ları
    document.getElementById('startBtn').addEventListener('click', () => {
        updateGameStartScreen();
        showScreen('gameStartScreen');
    });

    document.getElementById('startGameBtn').addEventListener('click', () => {
        showScreen('gameScreen');
        startGame();
    });

    document.getElementById('backFromStartBtn').addEventListener('click', () => {
        showScreen('mainMenu');
    });

    document.getElementById('settingsBtn').addEventListener('click', () => {
        showScreen('settingsMenu');
    });

    document.getElementById('galleryBtn').addEventListener('click', () => {
        renderGallery();
        showScreen('galleryScreen');
    });

    document.getElementById('backFromGalleryBtn').addEventListener('click', () => {
        showScreen('mainMenu');
    });

    document.getElementById('backToMenuBtn').addEventListener('click', () => {
        showScreen('mainMenu');
    });

    document.getElementById('exitBtn').addEventListener('click', () => {
        if (confirm('Oyundan çıkmak istediğinize emin misiniz?')) {
            window.close();
        }
    });

    document.getElementById('pauseBtn').addEventListener('click', () => {
        togglePause();
    });

    document.getElementById('menuFromGameBtn').addEventListener('click', () => {
        if (confirm('Ana menüye dönmek istediğinize emin misiniz? İlerleme kaydedilmeyecek.')) {
            showScreen('mainMenu');
            gameState.isPlaying = false;
        }
    });

    document.getElementById('resumeBtn').addEventListener('click', () => {
        togglePause();
    });

    document.getElementById('menuFromPauseBtn').addEventListener('click', () => {
        showScreen('mainMenu');
        gameState.isPlaying = false;
    });

    document.getElementById('restartBtn').addEventListener('click', () => {
        document.getElementById('gameOverMenu').classList.add('hidden');
        showScreen('gameScreen');
        startGame();
    });

    document.getElementById('menuFromGameOverBtn').addEventListener('click', () => {
        document.getElementById('gameOverMenu').classList.add('hidden');
        showScreen('mainMenu');
        gameState.isPlaying = false;
    });

    // Ayarlar Event Listener'ları
    document.getElementById('seasonSelect').addEventListener('change', (e) => {
        settings.season = e.target.value;
    });

    document.getElementById('roadSelect').addEventListener('change', (e) => {
        settings.roadType = e.target.value;
    });

    // Eski araba seçimi kaldırıldı - artık galeriden seçiliyor

    document.getElementById('soundToggle').addEventListener('change', (e) => {
        gameState.soundEnabled = e.target.checked;
    });
    
    // Klavye Kontrolleri
    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            e.preventDefault();
            movePlayer(-1);
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            e.preventDefault();
            movePlayer(1);
        }
    });

    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });

    // Touch Kontrolleri
    const gameScreen = document.getElementById('gameScreen');
    if (gameScreen) {
        let touchControls = document.createElement('div');
        touchControls.className = 'touch-controls';
        touchControls.innerHTML = `
            <button class="touch-btn" id="leftBtn">◀</button>
            <button class="touch-btn" id="rightBtn">▶</button>
        `;
        gameScreen.appendChild(touchControls);

        // Touch ve Mouse kontrolleri
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');

        if (leftBtn && rightBtn) {
            [leftBtn, rightBtn].forEach((btn, index) => {
                const isLeft = index === 0;
                
                // Touch events
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    if (isLeft) touchLeft = true;
                    else touchRight = true;
                });
                
                btn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    if (isLeft) touchLeft = false;
                    else touchRight = false;
                });
                
                // Mouse events (mobil için de çalışır)
                btn.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    if (isLeft) touchLeft = true;
                    else touchRight = true;
                });
                
                btn.addEventListener('mouseup', (e) => {
                    e.preventDefault();
                    if (isLeft) touchLeft = false;
                    else touchRight = false;
                });
                
                btn.addEventListener('mouseleave', () => {
                    if (isLeft) touchLeft = false;
                    else touchRight = false;
                });
            });
        }
}

// İlk ekran
showScreen('mainMenu');
    updateUI();
});