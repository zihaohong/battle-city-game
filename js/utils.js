// Battle City Game Logic
const BattleCity = {
  canvas: null,
  ctx: null,
  cellSize: 20,
  cols: 26,
  rows: 20,
  player: null,
  enemies: [],
  bullets: [],
  walls: [],
  score: 0,
  lives: 3,
  gameLoop: null,
  isRunning: false,
  isGameOver: false,
  enemySpawnTimer: 0,
  maxEnemies: 4,

  init: function() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.reset();
    this.bindEvents();
    this.draw();
    this.loadHelpText();
    this.loadGames();
  },

  reset: function() {
    this.player = {
      x: 12,
      y: 18,
      direction: 'up',
      color: '#4CAF50'
    };
    this.enemies = [];
    this.bullets = [];
    this.walls = this.generateWalls();
    this.score = 0;
    this.lives = 3;
    this.isGameOver = false;
    this.enemySpawnTimer = 0;
  },

  generateWalls: function() {
    const walls = [];
    for (let i = 0; i < 30; i++) {
      const x = Math.floor(Math.random() * (this.cols - 4)) + 2;
      const y = Math.floor(Math.random() * (this.rows - 8)) + 2;
      if (y < 16 || x < 10 || x > 14) {
        walls.push({ x, y, health: 2 });
      }
    }
    return walls;
  },

  bindEvents: function() {
    document.addEventListener('keydown', (e) => {
      if (!this.isRunning) return;
      const key = e.key.toLowerCase();
      if (['arrowup', 'w'].includes(key)) {
        this.player.direction = 'up';
      } else if (['arrowdown', 's'].includes(key)) {
        this.player.direction = 'down';
      } else if (['arrowleft', 'a'].includes(key)) {
        this.player.direction = 'left';
      } else if (['arrowright', 'd'].includes(key)) {
        this.player.direction = 'right';
      } else if (key === ' ') {
        e.preventDefault();
        this.shoot();
      }
    });

    // Start/restart on canvas click or touch
    this.canvas.addEventListener('click', () => this.handleCanvasInteraction());
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleCanvasInteraction();
    }, { passive: false });

    // Touch controls for movement
    let touchStartX = 0;
    let touchStartY = 0;
    const minSwipeDistance = 30;

    this.canvas.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      if (!this.isRunning) return;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > minSwipeDistance) {
          if (deltaX > 0) {
            this.player.direction = 'right';
          } else {
            this.player.direction = 'left';
          }
        }
      } else {
        if (Math.abs(deltaY) > minSwipeDistance) {
          if (deltaY > 0) {
            this.player.direction = 'down';
          } else {
            this.player.direction = 'up';
          }
        }
      }
    }, { passive: false });

    // Double tap to shoot
    let lastTap = 0;
    this.canvas.addEventListener('touchend', (e) => {
      if (!this.isRunning) return;
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      if (tapLength < 300 && tapLength > 0) {
        this.shoot();
        e.preventDefault();
      }
      lastTap = currentTime;
    });

    // Games dropdown
    const gamesBtn = document.getElementById('gamesBtn');
    const gamesDropdown = document.getElementById('gamesDropdown');
    gamesBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      gamesDropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      gamesDropdown.classList.remove('show');
    });

    gamesDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Help dropdown
    const helpBtn = document.getElementById('helpBtn');
    const helpDropdown = document.getElementById('helpDropdown');
    helpBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      helpDropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      helpDropdown.classList.remove('show');
    });

    helpDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Locale dropdown
    document.getElementById('localeSelect').addEventListener('change', (e) => {
      this.loadHelpText(e.target.value);
    });
  },

  handleCanvasInteraction: function() {
    if (!this.isRunning) {
      this.start();
    } else if (this.isGameOver) {
      this.reset();
      this.start();
    }
  },

  shoot: function() {
    const bullet = {
      x: this.player.x,
      y: this.player.y,
      direction: this.player.direction,
      isPlayer: true
    };
    this.bullets.push(bullet);
  },

  start: function() {
    this.reset();
    this.isRunning = true;
    this.isGameOver = false;
    this.gameLoop = setInterval(() => this.update(), 100);
  },

  update: function() {
    this.moveTank(this.player);

    this.enemySpawnTimer++;
    if (this.enemySpawnTimer > 50 && this.enemies.length < this.maxEnemies) {
      this.spawnEnemy();
      this.enemySpawnTimer = 0;
    }

    this.enemies.forEach(enemy => {
      if (Math.random() < 0.1) {
        const directions = ['up', 'down', 'left', 'right'];
        enemy.direction = directions[Math.floor(Math.random() * directions.length)];
      }
      this.moveTank(enemy);
      if (Math.random() < 0.05) {
        this.bullets.push({
          x: enemy.x,
          y: enemy.y,
          direction: enemy.direction,
          isPlayer: false
        });
      }
    });

    this.bullets = this.bullets.filter(bullet => {
      switch (bullet.direction) {
        case 'up': bullet.y--; break;
        case 'down': bullet.y++; break;
        case 'left': bullet.x--; break;
        case 'right': bullet.x++; break;
      }
      if (bullet.x < 0 || bullet.x >= this.cols || bullet.y < 0 || bullet.y >= this.rows) {
        return false;
      }
      const wallIndex = this.walls.findIndex(w => w.x === bullet.x && w.y === bullet.y);
      if (wallIndex !== -1) {
        this.walls[wallIndex].health--;
        if (this.walls[wallIndex].health <= 0) {
          this.walls.splice(wallIndex, 1);
        }
        return false;
      }
      if (!bullet.isPlayer && bullet.x === this.player.x && bullet.y === this.player.y) {
        this.lives--;
        if (this.lives <= 0) {
          this.gameOver();
        }
        return false;
      }
      if (bullet.isPlayer) {
        const enemyIndex = this.enemies.findIndex(e => e.x === bullet.x && e.y === bullet.y);
        if (enemyIndex !== -1) {
          this.enemies.splice(enemyIndex, 1);
          this.score += 100;
          return false;
        }
      }
      return true;
    });

    this.draw();
  },

  moveTank: function(tank) {
    let newX = tank.x;
    let newY = tank.y;
    switch (tank.direction) {
      case 'up': newY--; break;
      case 'down': newY++; break;
      case 'left': newX--; break;
      case 'right': newX++; break;
    }
    if (newX < 0 || newX >= this.cols || newY < 0 || newY >= this.rows) {
      return;
    }
    if (this.walls.some(w => w.x === newX && w.y === newY)) {
      return;
    }
    if (tank === this.player && this.enemies.some(e => e.x === newX && e.y === newY)) {
      return;
    }
    tank.x = newX;
    tank.y = newY;
  },

  spawnEnemy: function() {
    const spawnPoints = [
      { x: 0, y: 0 },
      { x: this.cols - 1, y: 0 },
      { x: 0, y: this.rows - 1 },
      { x: this.cols - 1, y: this.rows - 1 }
    ];
    const spawn = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    this.enemies.push({
      x: spawn.x,
      y: spawn.y,
      direction: 'down',
      color: '#FF5722'
    });
  },

  draw: function() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.walls.forEach(wall => {
      this.ctx.fillStyle = wall.health > 1 ? '#8B4513' : '#A0522D';
      this.ctx.fillRect(
        wall.x * this.cellSize,
        wall.y * this.cellSize,
        this.cellSize,
        this.cellSize
      );
    });

    this.drawTank(this.player);

    this.enemies.forEach(enemy => this.drawTank(enemy));

    this.bullets.forEach(bullet => {
      this.ctx.fillStyle = bullet.isPlayer ? '#FFD700' : '#FF0000';
      this.ctx.beginPath();
      this.ctx.arc(
        bullet.x * this.cellSize + this.cellSize / 2,
        bullet.y * this.cellSize + this.cellSize / 2,
        3,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
    });

    // Draw score and lives on canvas
    this.ctx.fillStyle = 'white';
    this.ctx.font = '16px Arial';
    this.ctx.fillText(`Score: ${this.score}`, 10, 20);
    this.ctx.fillText(`Lives: ${this.lives}`, 10, 40);

    if (this.isGameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = 'white';
      this.ctx.font = 'bold 24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 20);
      this.ctx.font = '18px Arial';
      this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
      this.ctx.fillText('Tap to restart', this.canvas.width / 2, this.canvas.height / 2 + 40);
      this.ctx.textAlign = 'left';
    } else if (!this.isRunning) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = 'white';
      this.ctx.font = 'bold 24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Battle City', this.canvas.width / 2, this.canvas.height / 2 - 20);
      this.ctx.font = '18px Arial';
      this.ctx.fillText('Tap to start', this.canvas.width / 2, this.canvas.height / 2 + 10);
      this.ctx.textAlign = 'left';
    }
  },

  drawTank: function(tank) {
    const x = tank.x * this.cellSize;
    const y = tank.y * this.cellSize;
    const size = this.cellSize - 2;

    this.ctx.fillStyle = tank.color;
    this.ctx.fillRect(x + 1, y + 1, size, size);

    this.ctx.fillStyle = '#333';
    const barrelSize = 4;
    switch (tank.direction) {
      case 'up':
        this.ctx.fillRect(x + size / 2 - barrelSize / 2, y - barrelSize / 2, barrelSize, barrelSize);
        break;
      case 'down':
        this.ctx.fillRect(x + size / 2 - barrelSize / 2, y + size - barrelSize / 2, barrelSize, barrelSize);
        break;
      case 'left':
        this.ctx.fillRect(x - barrelSize / 2, y + size / 2 - barrelSize / 2, barrelSize, barrelSize);
        break;
      case 'right':
        this.ctx.fillRect(x + size - barrelSize / 2, y + size / 2 - barrelSize / 2, barrelSize, barrelSize);
        break;
    }
  },

  gameOver: function() {
    this.isRunning = false;
    this.isGameOver = true;
    clearInterval(this.gameLoop);
    this.draw();
  },

  loadHelpText: function(locale) {
    locale = locale || 'en';
    const helpTexts = {
      en: {
        title: 'How to Play',
        text: 'Use arrow keys or WASD to move your tank. Press space or double-tap to shoot. Destroy enemy tanks to earn points. Avoid enemy bullets and walls!'
      },
      zh: {
        title: '如何玩',
        text: '使用方向键或WASD移动坦克。按空格键或双击屏幕射击。摧毁敌方坦克获得分数。躲避敌方子弹和墙壁！'
      }
    };
    const help = helpTexts[locale] || helpTexts.en;
    document.getElementById('helpTitle').textContent = help.title;
    document.getElementById('helpText').textContent = help.text;
  },

  loadGames: function() {
    fetch('https://zihaohong.github.io/data/links/games.json')
      .then(response => response.json())
      .then(data => {
        const locale = document.getElementById('localeSelect').value;
        const games = data[locale]?.games || data.en.games;
        const currentPath = window.location.pathname;
        const dropdown = document.getElementById('gamesDropdown');
        dropdown.innerHTML = games.map(game => {
          const isCurrent = currentPath.includes(game.link.replace('https://zihaohong.github.io/', ''));
          return `<a href="${game.link}" class="${isCurrent ? 'current' : ''}">${game.title}</a>`;
        }).join('');
      })
      .catch(error => console.error('Error loading games:', error));
  }
};

document.addEventListener('DOMContentLoaded', () => BattleCity.init());
