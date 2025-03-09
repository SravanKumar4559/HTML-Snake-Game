class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 400;
        this.canvas.height = 400;
        this.gridSize = 20;
        this.foodTypes = [
            { emoji: '🍎', points: 10 },
            { emoji: '🍕', points: 15 },
            { emoji: '🍔', points: 20 },
            { emoji: '🌟', points: 25 }
        ];
        this.currentFood = this.foodTypes[0];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.gameInterval = null;
        this.gameSpeed = 100;
        this.isGameOver = false;
        this.isPaused = false;
        this.snake = [{ x: 10, y: 10 }];
        this.food = this.generateFood();

        this.setupEventListeners();
        this.updateHighScoreDisplay();
    }

    setupEventListeners() {
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());

        // Mobile controls
        document.getElementById('upBtn').addEventListener('click', () => this.setDirection('up'));
        document.getElementById('downBtn').addEventListener('click', () => this.setDirection('down'));
        document.getElementById('leftBtn').addEventListener('click', () => this.setDirection('left'));
        document.getElementById('rightBtn').addEventListener('click', () => this.setDirection('right'));
    }

    handleKeyPress(event) {
        if (event.code === 'Space') {
            this.togglePause();
            return;
        }

        if (this.isPaused) return;

        const keyDirections = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'w': 'up',
            's': 'down',
            'a': 'left',
            'd': 'right'
        };

        const newDirection = keyDirections[event.key];
        if (newDirection) this.setDirection(newDirection);
    }

    setDirection(newDirection) {
        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };

        if (this.snake.length === 1 || opposites[newDirection] !== this.direction) {
            this.nextDirection = newDirection;
        }
    }

    generateFood() {
        const x = Math.floor(Math.random() * (this.canvas.width / this.gridSize));
        const y = Math.floor(Math.random() * (this.canvas.height / this.gridSize));
        this.currentFood = this.foodTypes[Math.floor(Math.random() * this.foodTypes.length)];

        // Check if food spawns on snake
        if (!this.snake) return { x, y };
        if (this.snake.some(segment => segment.x === x && segment.y === y)) {
            return this.generateFood();
        }

        return { x, y };
    }

    moveSnake() {
        const head = { ...this.snake[0] };
        this.direction = this.nextDirection;

        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // Check for collisions
        if (this.checkCollision(head)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        // Check if snake ate food
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += this.currentFood.points;
            document.getElementById('score').textContent = this.score;
            this.food = this.generateFood();
            // Increase speed every 50 points
            if (this.score % 50 === 0) {
                this.gameSpeed = Math.max(50, this.gameSpeed - 10);
                clearInterval(this.gameInterval);
                this.gameInterval = setInterval(() => this.gameLoop(), this.gameSpeed);
            }
        } else {
            this.snake.pop();
        }
    }

    checkCollision(head) {
        // Wall pass-through
        if (head.x < 0) head.x = (this.canvas.width / this.gridSize) - 1;
        if (head.x >= this.canvas.width / this.gridSize) head.x = 0;
        if (head.y < 0) head.y = (this.canvas.height / this.gridSize) - 1;
        if (head.y >= this.canvas.height / this.gridSize) head.y = 0;

        // Self collision
        return this.snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            clearInterval(this.gameInterval);
            this.drawPauseScreen();
        } else {
            this.gameInterval = setInterval(() => this.gameLoop(), this.gameSpeed);
        }
    }

    drawPauseScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Press SPACE to resume', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }

    draw() {
        // Clear canvas with white background
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw snake with rounded corners
        this.snake.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? '#2E7D32' : '#388E3C';
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;
            const size = this.gridSize - 1;
            const radius = 5;

            this.ctx.beginPath();
            this.ctx.moveTo(x + radius, y);
            this.ctx.lineTo(x + size - radius, y);
            this.ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
            this.ctx.lineTo(x + size, y + size - radius);
            this.ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
            this.ctx.lineTo(x + radius, y + size);
            this.ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
            this.ctx.lineTo(x, y + radius);
            this.ctx.quadraticCurveTo(x, y, x + radius, y);
            this.ctx.fill();
            this.ctx.closePath();
        });

        // Draw food emoji
        this.ctx.font = `${this.gridSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            this.currentFood.emoji,
            (this.food.x * this.gridSize) + (this.gridSize / 2),
            (this.food.y * this.gridSize) + (this.gridSize / 2)
        );
    }

    gameLoop() {
        if (!this.isPaused) {
            this.moveSnake();
            if (!this.isGameOver) {
                this.draw();
            }
        }
    }

    startGame() {
        if (!this.gameInterval) {
            document.getElementById('startBtn').style.display = 'none';
            document.getElementById('restartBtn').style.display = 'inline-block';
            this.gameInterval = setInterval(() => this.gameLoop(), this.gameSpeed);
        }
    }

    gameOver() {
        this.isGameOver = true;
        clearInterval(this.gameInterval);
        this.gameInterval = null;

        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            this.updateHighScoreDisplay();
        }

        // Draw game over screen
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
    }

    restartGame() {
        this.snake = [{ x: 10, y: 10 }];
        this.food = this.generateFood();
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.gameSpeed = 100;
        this.isGameOver = false;
        document.getElementById('score').textContent = '0';
        this.startGame();
    }

    updateHighScoreDisplay() {
        document.getElementById('highScore').textContent = this.highScore;
    }
}

// Initialize game
const game = new SnakeGame();