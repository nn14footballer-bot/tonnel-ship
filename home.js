// INITIALIZE TELEGRAM
const tg = window.Telegram?.WebApp || null;

if (tg) {
    tg.ready();
}

// DOM ELEMENTS
const gameArea = document.getElementById('gameArea');
const balanceText = document.getElementById('balance');
const toggleBtn = document.getElementById('toggleBtn');
const instructions = document.getElementById('instructions');
const rankText = document.getElementById('rank');
const pphText = document.getElementById('pphi');
const progressFill = document.getElementById('rankProgressFill');
const nextRankLabel = document.getElementById('nextRankText');

// GAME STATE
let balance = parseFloat(localStorage.getItem('niro_bal')) || 0;
let pph = 100; // Starting PPH
let isMining = false;
let coinInterval, crateInterval;


// SOUNDS
const slashSound = new Audio('slash.mp3');
const explodeSound = new Audio('explode.mp3');

// 1. TELEGRAM & ID GENERATION
// ==========================================
// 2. USER INITIALIZATION LOGIC
// ==========================================
function initUser() {
    const u = tg?.initDataUnsafe?.user;

    if (!u) {
        tg.showAlert("Telegram user data could not be loaded.");
        return;
    }

    const UserName = document.getElementById("userName");
    UserName.innerText = u.username ? @${u.username} : u.first_name;

    const UID = document.getElementById("userId");
    UID.innerText = ID: ${u.id};

    const UserPHoto = document.getElementById("userPhoto");
    UserPHoto.src =
        u.photo_url ||
        "https://media.istockphoto.com/id/1300845620/vector/user-icon-flat-isolated-on-white-background-user-symbol-vector-illustration.jpg";
}
// 2. OFFLINE EARNINGS (3 Hour Limit)
function checkOffline() {
    const lastTime = localStorage.getItem('last_active');
    const now = Date.now();
    if (lastTime) {
        const diff = (now - lastTime) / 1000;
        const maxSecs = 3 * 60 * 60; // 3 hours
        const earned = (pph / 3600) * Math.min(diff, maxSecs);
        if (earned > 1) {
            balance += earned;
            tg.showAlert(`Mining continues! You claimed ${Math.floor(earned)} Niro.`);
        }
    }
    localStorage.setItem('last_active', now);
}

// 3. RANK SYSTEM (Hamster Kombat Progression)
const tiers = [
    { name: 'Coal', min: 0 },
    { name: 'Bronze', min: 100000 },
    { name: 'Silver', min: 500000 },
    { name: 'Gold', min: 1000000 },
    { name: 'Emerald', min: 50000000 },
    { name: 'Ruby', min: 250000000 },
    { name: 'Gem', min: 500000000 },
    { name: 'Diamond', min: 1000000000 }
];

function updateUI() {
    balanceText.innerText = Math.floor(balance).toLocaleString();
    pphText.innerText = pph;
    
    let current = tiers[0], next = tiers[1];
    for (let i = 0; i < tiers.length; i++) {
        if (balance >= tiers[i].min) {
            current = tiers[i];
            next = tiers[i+1] || null;
        }
    }

    rankText.innerText = current.name;
    if (next) {
        const progress = ((balance - current.min) / (next.min - current.min)) * 100;
        progressFill.style.width = Math.min(progress, 100) + '%';
        nextRankLabel.innerText = `Next: ${next.name}`;
    } else {
        nextRankLabel.innerText = `Max Rank Reached`;
    }
    
    localStorage.setItem('niro_bal', balance);
    localStorage.setItem('last_active', Date.now());
}

// 4. EFFECTS (Dust & Cracks)
function createDust(x, y) {
    for (let i = 0; i < 8; i++) {
        const d = document.createElement('div');
        d.className = 'dust';
        d.style.left = x + 'px';
        d.style.top = y + 'px';
        d.style.setProperty('--tx', (Math.random() - 0.5) * 100 + 'px');
        d.style.setProperty('--ty', (Math.random() - 0.5) * 100 + 'px');
        gameArea.appendChild(d);
        setTimeout(() => d.remove(), 600);
    }
}

// 5. MINING TOGGLE
toggleBtn.onclick = () => {
    isMining = !isMining;
    if (isMining) {
        toggleBtn.innerText = "Stop Mining";
        toggleBtn.classList.add('stop');
        instructions.style.display = 'none';
        coinInterval = setInterval(spawnCoin, 800);
        crateInterval = setInterval(spawnCrate, 10000);
    } else {
        toggleBtn.innerText = "Start Mining";
        toggleBtn.classList.remove('stop');
        instructions.style.display = 'block';
        clearInterval(coinInterval);
        clearInterval(crateInterval);
    }
};

function spawnCoin() {
    const c = document.createElement('img');
    c.src = 'logo.png';
    c.className = 'coin';
    c.style.left = Math.random() * 80 + '%';
    gameArea.appendChild(c);

    const onSlash = () => {
        balance += 1;
        slashSound.currentTime = 0;
        slashSound.play();
        createDust(c.offsetLeft + 30, c.offsetTop + 30);
        c.remove();
        updateUI();
    };

    c.onmouseenter = onSlash;
    c.ontouchmove = (e) => { onSlash(); e.preventDefault(); };
    setTimeout(() => { if(c.parentNode) c.remove(); }, 3000);
}

function spawnCrate() {
    // Changed from a 'div' to an 'img' element
    const cr = document.createElement('img');
    cr.src = 'crate.jpg';
    cr.className = 'crate';
    cr.style.left = Math.random() * 70 + '%';
    gameArea.appendChild(cr);

    let hits = 0;
    const onHit = () => {
        hits++;
        slashSound.currentTime = 0;
        slashSound.play();
        if (hits === 1) cr.classList.add('crack-1');
        if (hits === 2) cr.classList.add('crack-2');
        if (hits >= 3) {
            balance += 10;
            explodeSound.play();
            createDust(cr.offsetLeft + 40, cr.offsetTop + 40);
            cr.remove();
            updateUI();
        }
    };

    cr.onmouseenter = onHit;
    cr.ontouchmove = (e) => { onHit(); e.preventDefault(); };
}
// 6. CONSTANT PASSIVE INCOME
setInterval(() => {
    balance += (pph / 3600);
    updateUI();
}, 1000);

// START UP
initUser();
checkOffline();
updateUI();
