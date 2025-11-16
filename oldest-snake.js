const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const restartBtn = document.getElementById('restart-btn');
const pauseModal = document.getElementById('pause-modal');
const resumeBtn = document.getElementById('resume-btn');
const exitBtn = document.getElementById('exit-btn');
const speedDiv = document.getElementById('speedDisplay');
const highscoreDiv = document.getElementById('highscoreDisplay');

function resizeCanvas() {
  const size = Math.min(window.innerWidth, window.innerHeight) * 0.8;
  canvas.width = size;
  canvas.height = size;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const gridSize = 20;
let tileCount, snake, direction, apple, score, gameLoop;
let baseSpeed = 120, speed = baseSpeed, isDead, paused;

const eatSound = new Audio('eat.mp3');
const deathSound = new Audio('death.mp3');

function spawnApple() {
  let a;
  do {
    a = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
  } while (snake.some(s => s.x === a.x && s.y === a.y));
  return a;
}

function saveHighScore(score) {
  const high = Number(localStorage.getItem('neosnake-highscore') || 0);
  if (score > high) localStorage.setItem('neosnake-highscore', score);
}

function getHighScore() {
  return Number(localStorage.getItem('neosnake-highscore') || 0);
}

function initGame() {
  tileCount = Math.floor(canvas.width / gridSize);
  snake = [{ x: 10, y: 10 }];
  direction = { x: 1, y: 0 };
  apple = spawnApple();
  score = 0; speed = baseSpeed; isDead = false; paused = false;
  scoreEl.textContent = `Score: ${score}`;
  highscoreDiv.textContent = `Highscore: ${getHighScore()}`;
  pauseModal.classList.add('hidden');
  clearInterval(gameLoop);
  gameLoop = setInterval(drawGame, speed);
  updateSpeedDisplay();
}

function updateSpeedDisplay() {
  speedDiv.textContent = 'Speed: ' + (1000 / speed).toFixed(2);
}

function applySpeedScaling() {
  const multiplier = 1 + (Math.floor(score / 100) * 0.25);
  speed = baseSpeed / multiplier;
  clearInterval(gameLoop);
  gameLoop = setInterval(drawGame, speed);
  updateSpeedDisplay();
}

function drawGame() { if (isDead || paused) return; update(); draw(); }

function update() {
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount || snake.some(s => s.x === head.x && s.y === head.y)) {
    deathSound.cloneNode().play().catch(()=>{});
    saveHighScore(score);
    gameOver();
    return;
  }
  snake.unshift(head);
  if (head.x === apple.x && head.y === apple.y) {
    score += 10;
    apple = spawnApple();
    scoreEl.textContent = `Score: ${score}`;
    eatSound.cloneNode().play().catch(()=>{});
    applySpeedScaling();
    highscoreDiv.textContent = `Highscore: ${getHighScore()}`;
  } else snake.pop();
}

function draw() {
    
  if (isDead) {
    return; // ← НИЧЕГО НЕ РИСУЕМ ПОСЛЕ GAME OVER
  }
    // Новый бело-жёлтый фон
    ctx.fillStyle = '#8ba868';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  
    snake.forEach((s, i) => {
      const px = s.x * gridSize;
      const py = s.y * gridSize;
  
      // Голова зелёная, тело оливковое
      ctx.fillStyle = i === 0 ? '#2f8f2f' : '#8ba868';
      ctx.fillRect(px, py, gridSize - 1, gridSize - 1);
  
      if (i === 0) {
        const eye = gridSize / 5;
        ctx.fillStyle = '#000';
  
        // Ориентация глаз по направлению
        if (direction.x === 1) { 
          // движение вправо → глаза справа
          ctx.fillRect(px + gridSize * 0.65, py + gridSize * 0.25, eye, eye);
          ctx.fillRect(px + gridSize * 0.65, py + gridSize * 0.60, eye, eye);
          // рот
          ctx.fillRect(px + gridSize * 0.45, py + gridSize * 0.45, eye * 1.2, eye * 0.6);
  
        } else if (direction.x === -1) { 
          // движение влево → глаза слева
          ctx.fillRect(px + gridSize * 0.1, py + gridSize * 0.25, eye, eye);
          ctx.fillRect(px + gridSize * 0.1, py + gridSize * 0.60, eye, eye);
          ctx.fillRect(px + gridSize * 0.35, py + gridSize * 0.45, eye * 1.2, eye * 0.6);
  
        } else if (direction.y === -1) { 
          // движение вверх → глаза сверху
          ctx.fillRect(px + gridSize * 0.25, py + gridSize * 0.1, eye, eye);
          ctx.fillRect(px + gridSize * 0.60, py + gridSize * 0.1, eye, eye);
          ctx.fillRect(px + gridSize * 0.42, py + gridSize * 0.40, eye * 1.2, eye * 0.6);
  
        } else if (direction.y === 1) { 
          // движение вниз → глаза снизу
          ctx.fillRect(px + gridSize * 0.25, py + gridSize * 0.65, eye, eye);
          ctx.fillRect(px + gridSize * 0.60, py + gridSize * 0.65, eye, eye);
          ctx.fillRect(px + gridSize * 0.42, py + gridSize * 0.45, eye * 1.2, eye * 0.6);
        }
      }
    });
  
    // Яблоко — мягкий спокойный красный
    ctx.fillStyle = '#9c4a4a';
    ctx.beginPath();
    ctx.arc(
      apple.x * gridSize + gridSize / 2,
      apple.y * gridSize + gridSize / 2,
      gridSize / 2.6,
      0,
      2 * Math.PI
    );
    ctx.fill();
  }

  function gameOver() {
    isDead = true;
    clearInterval(gameLoop);
    ctx.fillStyle = '#f00';
    ctx.font = `${gridSize*2}px Orbitron`;
    ctx.textAlign = 'center';
    ctx.fillText('💀 Game Over 💀', canvas.width/2, canvas.height/2);
  }
  

// Управление клавишами
window.addEventListener('keydown', (e) => {
  const key = e.key;
  if(['ё','Ё','`','~'].includes(key)) { togglePause(); return; }
  if(paused || isDead) return;

  switch(key) {
    case 'ArrowUp': case 'w': case 'ц': if(direction.y===0) direction={x:0,y:-1}; break;
    case 'ArrowDown': case 's': case 'ы': if(direction.y===0) direction={x:0,y:1}; break;
    case 'ArrowLeft': case 'a': case 'ф': if(direction.x===0) direction={x:-1,y:0}; break;
    case 'ArrowRight': case 'd': case 'в': if(direction.x===0) direction={x:1,y:0}; break;
  }
});

// Свайпы для сенсорных устройств
let touchStartX=0, touchStartY=0, touchEndX=0, touchEndY=0;
if('ontouchstart' in window || navigator.maxTouchPoints>0) {
  canvas.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  });
  canvas.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].clientX;
    touchEndY = e.changedTouches[0].clientY;
    handleSwipe();
  });
}

function handleSwipe() {
  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;

  if(Math.abs(dx) > Math.abs(dy)) {
    if(dx > 30 && direction.x === 0) direction = { x:1, y:0 };
    if(dx < -30 && direction.x === 0) direction = { x:-1, y:0 };
  } else {
    if(dy > 30 && direction.y === 0) direction = { x:0, y:1 };
    if(dy < -30 && direction.y === 0) direction = { x:0, y:-1 };
  }
}

// UI кнопки
restartBtn.addEventListener('click', initGame);
resumeBtn.addEventListener('click', () => { paused=false; pauseModal.classList.add('hidden'); });
exitBtn.addEventListener('click', () => { window.location.href='snake-menu.html'; });

function togglePause() {
  if(isDead) return;
  paused = !paused;
  pauseModal.classList.toggle('hidden', !paused);
}

// Старт игры
initGame();