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
  enemySpawnTimer: 0,
  maxEnemies: 4,

  init: function() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.reset();
    this.bindEvents();
    this.draw();
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
    this.enemySpawnTimer = 0;
    document.getElementById('score').textContent = this.score;
    document.getElementById('lives').textContent = this.lives;
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
    document.getElementById('startBtn').addEventListener('click', () => {
      if (!this.isRunning) { this.start(); }
    });

    let touchStartX = 0;
    let touchStartY = 0;
    const minSwipeDistance = 30;

    this.canvas.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      e.preventDefault();
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
      e.preventDefault();
    }, { passive: false });

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
    document.getElementById('startBtn').textContent = 'Playing...';
    document.getElementById('startBtn').disabled = true;
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
        document.getElementById('lives').textContent = this.lives;
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
          document.getElementById('score').textContent = this.score;
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
    clearInterval(this.gameLoop);
    document.getElementById('startBtn').textContent = 'Start Game';
    document.getElementById('startBtn').disabled = false;
    alert(`Game Over! Score: ${this.score}`);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Navbar.init();
  BattleCity.init();
});
