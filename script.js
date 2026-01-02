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
    score: 0,
    gold: 0, // Başlangıçta 0, localStorage'dan yüklenecek
    level: 1,
    speed: 2,
    soundEnabled: true,
    lives: 3,
    totalGold: 0 // Toplam birikmiş altın
};

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
    localStorage.setItem('racerOwnedCars', JSON.stringify(ownedCars));
    localStorage.setItem('racerSelectedCar', settings.carType);
}

function loadGameData() {
    const savedGold = localStorage.getItem('racerGold');
    if (savedGold) {
        gameState.totalGold = parseInt(savedGold) || 0;
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
    const roadX = (canvas.width - roadWidth) / 2;
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
    gameState.score = 0;
    gameState.gold = 0; // Oyun içi altın (sadece bu oyun için)
    gameState.level = 1;
    gameState.speed = 2;
    gameState.lives = 3;
    enemyCars = [];
    coins = [];
    roadOffset = 0;
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
    saveGameData();
    
    document.getElementById('finalGoldDisplay').textContent = gameState.gold;
    document.getElementById('finalScoreDisplay').textContent = gameState.score;
    document.getElementById('gameOverMenu').classList.remove('hidden');
}

// Düşman Araba Oluşturma
function createEnemyCar() {
    if (!canvas) return;
    const roadWidth = canvas.width * roadConfigs[settings.roadType].width;
    const roadX = (canvas.width - roadWidth) / 2;
    const lanes = roadConfigs[settings.roadType].lanes;
    const laneWidth = roadWidth / lanes;
    
    const lane = Math.floor(Math.random() * lanes);
    const x = roadX + (lane + 0.5) * laneWidth;
    
    // Rastgele araba tipi seç
    const carType = enemyCarTypes[Math.floor(Math.random() * enemyCarTypes.length)];
    const color = carType.colors[Math.floor(Math.random() * carType.colors.length)];
    
    enemyCars.push({
        x: x,
        y: -150, // Daha yukarıdan başlasın
        width: carType.width,
        height: carType.height,
        speed: gameState.speed + Math.random() * 2,
        color: color,
        carType: carType.type,
        z: 0 // Perspektif için z değeri
    });
}

// Altın Oluşturma
function createCoin() {
    if (!canvas) return;
    const roadWidth = canvas.width * roadConfigs[settings.roadType].width;
    const roadX = (canvas.width - roadWidth) / 2;
    
    coins.push({
        x: roadX + Math.random() * roadWidth,
        y: -30,
        radius: 15,
        speed: gameState.speed + 1,
        collected: false
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

// Altın Toplama Tespiti
function checkCoinCollection(coin, player) {
    const dx = coin.x - player.x;
    const dy = coin.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < coin.radius + player.width / 2;
}

// Oyun Güncelleme
function updateGame() {
    if (!gameState.isPlaying || gameState.isPaused || !canvas || !player) return;
    
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
    
    // Altın oluşturma
    if (Math.random() < 0.01) {
        createCoin();
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
    
    // Düşman arabaları güncelle
    for (let i = enemyCars.length - 1; i >= 0; i--) {
        const car = enemyCars[i];
        // Perspektif efekti: arabalar yaklaştıkça daha hızlı hareket ediyor gibi
        const perspectiveSpeed = gameState.speed + (canvas.height - car.y) / canvas.height * 3;
        car.y += perspectiveSpeed;
        car.z = (car.y / canvas.height) * 100; // Z değeri perspektif için
        
        // Çarpışma kontrolü
        if (checkCollision(player, car)) {
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
        
        // Araba geçme kontrolü (düşman araba player'ın arkasına geçtiğinde)
        if (!car.passed && car.y > player.y + player.height) {
            car.passed = true;
            gameState.score += 10;
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
        
        // Altın toplama kontrolü
        if (checkCoinCollection(coin, player)) {
            gameState.gold += 1;
            coin.collected = true;
            coins.splice(i, 1);
            updateUI();
        }
        
        // Ekrandan çıkan altınları kaldır
        if (coin.y > canvas.height) {
            coins.splice(i, 1);
        }
    }
    
    // Bölüm kontrolü
    const newLevel = Math.floor(gameState.score / 1000) + 1;
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
    const roadX = (canvas.width - roadWidth) / 2;
    const lanes = roadConfigs[settings.roadType].lanes;
    
    // Gökyüzü
    ctx.fillStyle = colors.sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Çimen
    ctx.fillStyle = colors.grass;
    ctx.fillRect(0, 0, roadX, canvas.height);
    ctx.fillRect(roadX + roadWidth, 0, canvas.width - (roadX + roadWidth), canvas.height);
    
    // Perspektifli yol çizimi
    drawRoadWithPerspective(roadX, roadWidth, lanes, colors, roadOffset);
    
    // Düşman arabalar (z değerine göre sırala - uzaktakiler önce çizilsin)
    const sortedCars = [...enemyCars].sort((a, b) => b.z - a.z);
    sortedCars.forEach(car => {
        const scale = 0.5 + (car.y / canvas.height) * 0.5; // Perspektif ölçekleme
        drawAdvancedCar(car.x, car.y, car.width * scale, car.height * scale, car.color, car.carType, scale);
    });
    
    // Altınlar
    coins.forEach(coin => {
        if (!coin.collected) {
            const scale = 0.5 + (coin.y / canvas.height) * 0.5;
            drawCoin(coin.x, coin.y, coin.radius * scale);
        }
    });
    
    // Oyuncu arabası (invulnerable ise yanıp sönsün)
    if (!player.invulnerable || Math.floor(player.invulnerableTime / 5) % 2 === 0) {
        drawAdvancedCar(player.x, player.y, player.width, player.height, player.color, player.carType, 1);
    }
}

// Perspektifli yol çizimi
function drawRoadWithPerspective(roadX, roadWidth, lanes, colors, offset) {
    // Yol
    ctx.fillStyle = colors.road;
    ctx.fillRect(roadX, 0, roadWidth, canvas.height);
    
    // Perspektif çizgileri
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 20]);
    
    for (let i = 1; i < lanes; i++) {
        const lineX = roadX + (roadWidth / lanes) * i;
        
        // Perspektif efekti için çizgileri eğ
        for (let y = 0; y < canvas.height; y += 40) {
            const perspective = 1 + (y / canvas.height) * 0.3;
            const startX = lineX - (roadWidth / lanes) * 0.15 * perspective;
            const endX = lineX + (roadWidth / lanes) * 0.15 * perspective;
            
        ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y + 40);
        ctx.stroke();
        }
    }
    ctx.setLineDash([]);
    
    // Orta çizgi (perspektifli)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    const centerX = roadX + roadWidth / 2;
    const topWidth = roadWidth * 0.3;
    const bottomWidth = roadWidth * 0.7;
    
    ctx.moveTo(centerX - topWidth/2, 0);
    ctx.lineTo(centerX - bottomWidth/2, canvas.height);
    ctx.moveTo(centerX + topWidth/2, 0);
    ctx.lineTo(centerX + bottomWidth/2, canvas.height);
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

// Altın Çizimi
function drawCoin(x, y, radius) {
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
    ctx.font = `${radius}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', x, y);
}

// UI Güncelleme
function updateUI() {
    document.getElementById('scoreDisplay').textContent = gameState.score;
    document.getElementById('goldDisplay').textContent = gameState.gold;
    document.getElementById('levelDisplay').textContent = gameState.level;
    document.getElementById('livesDisplay').textContent = gameState.lives;
    document.getElementById('mainGoldDisplay').textContent = gameState.totalGold;
    document.getElementById('galleryGoldDisplay').textContent = gameState.totalGold;
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
        showScreen('gameScreen');
        startGame();
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