/**
 * 게임 상태:
 * - 대기
 * - 실행
 * - 볼 놓침
 * - 레벨 통과
 * - 종료
 * - 승리 (전체 레벨 통과)
 */

const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

class Ball {
    constructor(gameLevel) {
        this.radius = 10;
        this.speed = 2 + 0.2 * gameLevel;
        this.accel = 1;
        this.x = this.radius;
        this.y = canvas.height - this.radius;
        this.dx = this.speed;
        this.dy = -this.speed;
        this.colors = [
            "#720000",
            "#960000",
            "#a70000",
            "#ce0000",
            "#ff0000",
        ];
        this.colorIndex = 0;
        this.color = this.colors[this.colorIndex];

        this.checkCollision = this.checkCollision.bind(this);
        this.draw = this.draw.bind(this);
    }

    checkCollision(paddle, gameStop, gameOver) {
        // side walls
        if (this.x + this.dx < this.radius || this.x + this.dx > canvas.width - this.radius) {
            this.dx = -this.accel * this.dx;
            this.dy = this.accel * this.dy;
            this.colorIndex++;
            this.colorIndex %= this.colors.length;
            this.color = this.colors[this.colorIndex];
        }    

        // ceiling
        if (this.y + this.dy < this.radius) {
            this.dx = this.accel * this.dx;
            this.dy = -this.accel * this.dy;
            this.colorIndex++;
            this.colorIndex %= this.colors.length;
            this.color = this.colors[this.colorIndex];
        }

        // bounce ball on paddle
        if (this.y + this.dy > canvas.height - this.radius - paddle.height && 
            this.x > paddle.x && this.x < paddle.x + paddle.width) {        
            paddle.calcBounceAngle(this);
        }

        // check missed and game over
        if (this.y + this.dy > canvas.height + this.radius) {
            ballCount--;
            if (ballCount > 0) {
                gameStop();
            } else {
                gameOver(false);
            }
        }
    }

    calcPosition() {
        this.x += this.dx;
        this.y += this.dy;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();    
    }
}

class Paddle {
    constructor() {
        this.width = 120;
        this.height = 10;
        this.x = (canvas.width - this.width) / 2;
        this.deltaX = 7;
        this.color = '#0095dd';
        this.leftKeyPressed = false;
        this.rightKeyPressed = false;

        this.keyDownHandler = this.keyDownHandler.bind(this);
        this.keyUpHandler = this.keyUpHandler.bind(this);
        this.mouseWheelHandler = this.mouseWheelHandler.bind(this);
        this.touchHandler = this.touchHandler.bind(this);
        this.checkKeyPressed = this.checkKeyPressed.bind(this);
        this.calcBounceAngle = this.calcBounceAngle.bind(this);
        this.draw = this.draw.bind(this);

        document.addEventListener('keydown', this.keyDownHandler, false);
        document.addEventListener('keyup', this.keyUpHandler, false);
        document.addEventListener('wheel', this.mouseWheelHandler, { passive: true });
        canvas.addEventListener('touchmove', this.touchHandler, false);
    }

    keyDownHandler(e) {
        if (e.keyCode === 39) {
            this.rightKeyPressed = true;
        } else if (e.keyCode === 37) {
            this.leftKeyPressed = true;
        }
    };

    keyUpHandler(e) {
        if (e.keyCode === 39) {
            this.rightKeyPressed = false;
        } else if (e.keyCode === 37) {
            this.leftKeyPressed = false;
        }
    };

    mouseWheelHandler(e) {
        this.x = Math.min(canvas.width - this.width, Math.max(0, this.x - e.deltaX));
    };

    touchHandler(e) {
        this.x = Math.min(canvas.width - this.width, Math.max(0, this.x - e.deltaX));
    };

    checkKeyPressed() {
        if (this.rightKeyPressed && this.x < canvas.width-this.width) {
            this.x += this.deltaX;
        } else if (this.leftKeyPressed && this.x > 0) {
            this.x -= this.deltaX;
        }    
    }

    calcBounceAngle(ball) {
        const angle = 1;
        if ((ball.x - this.x) / this.width < 0.5) {
            // left half 
            if (ball.dx > 0) {
                const oldDx = ball.dx;
                ball.dx = -ball.accel * Math.abs(ball.dy);
                ball.dy = -ball.accel * Math.abs(oldDx);
                console.log('left half', ball.dx);
                return;
            }
        } else {
            // right half
            if (ball.dx < 0) {
                const oldDx = ball.dx;
                ball.dx = ball.accel * Math.abs(ball.dy);
                ball.dy = -ball.accel * Math.abs(oldDx);
                console.log('right half', ball.dx);
                return;
            }
        }
    
        ball.dx = ball.accel * ball.dx;
        ball.dy = -ball.accel * ball.dy;
        console.log('normal', ball.dx);    
    }

    draw() {
        ctx.beginPath();
        ctx.rect(this.x, canvas.height - this.height, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();    
    }
}

class Brick {
    constructor(x, y, width, height, color, point) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.point = point;
        this.removed = false;
    }

    checkCollision(ball) {
        if (this.removed) return false;
        if (ball.x > this.x && ball.x < this.x + this.width &&
            ball.y > this.y && ball.y < this.y + this.height) {
            return true;
        }

        return false;
    }

    remove() {
        this.removed = true;
    }

    draw() {
        if (this.removed) return;

        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

class Bricks {
    constructor(rowCount, columnCount) {
        this.columnCount = columnCount;
        this.rowCount = rowCount;
        this.brickWidth = 75;
        this.brickHeight = 20;
        this.brickPadding = 10;
        this.brickOffsetTop = 30;
        this.brickOffsetLeft = 30;
        this.brickColors = [
            '#d26013',
            '#e28033',
            '#f2a053',
        ];
        
        this.bricks = [];
        for (let c = 0; c < this.columnCount; c++) {
            this.bricks[c] = [];
            for (let r = 0; r < this.rowCount; r++) {
                let brickX = (c*(this.brickWidth+this.brickPadding))+this.brickOffsetLeft;
                let brickY = (r*(this.brickHeight+this.brickPadding))+this.brickOffsetTop;
                let point = 2 * (this.rowCount - r) - 1;
                this.bricks[c][r] = new Brick(brickX, brickY, this.brickWidth, this.brickHeight, this.brickColors[r], point);
            }
        }
        this.bricksCount = rowCount * columnCount;

        this.getBricksCount = this.getBricksCount.bind(this);
        this.getBrick = this.getBrick.bind(this);
        this.checkCollision = this.checkCollision.bind(this);
        this.reset = this.reset.bind(this);
        this.draw = this.draw.bind(this);
    }

    getBricksCount() {
        return this.rowCount * this.columnCount;
    }

    getBrick(r, c) {
        return this.bricks[c][r];
    }

    checkCollision(ball, onCollide) {
        for (let c = 0; c < this.columnCount; c++) {
            for (let r = 0; r < this.rowCount; r++) {
                let b = this.getBrick(r, c);
                
                if (b.checkCollision(ball)) {
                    audio.play();
                    ball.dy = -ball.dy;
                    b.remove();
                    this.bricksCount--;
    
                    if (onCollide(b)) {
                        break;
                    }
                }
            }
        }    
    }

    reset() {
        for (let c = 0; c < this.columnCount; c++) {
            for (let r = 0; r < this.rowCount; r++) {
                this.getBrick(r, c).removed = false;
            }
        }
        this.bricksCount = this.rowCount * this.columnCount;
    }

    draw() {
        for (let c = 0; c < this.columnCount; c++) {
            for (let r = 0; r < this.rowCount; r++) {
                this.getBrick(r, c).draw();
            }
        }    
    }
}

class Game {
    constructor() {
        this.level = 1;
        this.point = 0;
        this.status = 'ready';
        this.ballCount = 3;
        this.bricksRow = 3;
        this.bricksColumn = 5;

        this.ball = new Ball(this.level);
        this.paddle = new Paddle();
        this.bricks = new Bricks(this.bricksRow, this.bricksColumn);

        this.draw = this.draw.bind(this);
        this.ready = this.ready.bind(this);
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.over = this.over.bind(this);        
    }

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // move paddle to right or left
        this.paddle.checkKeyPressed();
    
        // bounce ball on side wall, ceiling and paddle
        this.ball.checkCollision(this.paddle, this.stop, this.over);
    
        // next position of the ball
        this.ball.calcPosition();
        
        // check collision of the ball to the bricks
        this.bricks.checkCollision(this.ball, (brick) => {
            this.point += brick.point;
            document.getElementById('point').innerHTML = `POINT ${this.point}`;
            if (this.bricks.bricksCount === 0) {
                this.over(true);
            }
        });
    
        // draw objects
        this.bricks.draw();
        this.paddle.draw();
        this.ball.draw();
    
        // animate
        if (this.status === 'on') {
            requestAnimationFrame(this.draw);
        }    
    }

    ready() {
        this.level = 1;
        this.point = 0;
        this.ballCount = 3;
    
        this.bricks.reset();
    
        document.getElementById('message').innerHTML = `게임 준비`;
        document.getElementById('level').innerHTML = `LEVEL ${this.level}`;
        document.getElementById('point').innerHTML = `POINT ${this.point}`;
    
        let ballElement;
        for (let i = 0; i < ballCount; i++) {
            ballElement = document.createElement('div');
            ballElement.className = 'ball';
            document.getElementById('ball-count').appendChild(ballElement);
        }    
    }

    start() {
        if (this.status === 'over') {
            this.ready();
        }
        
        this.status = 'on';
        this.ball.x = this.ball.radius;
        this.ball.y = canvas.height - this.ball.radius;
        const angle = (Math.random() * 2 + 1) * Math.PI / 8;
        this.ball.dx = this.ball.speed * Math.sin(angle);
        this.ball.dy = -this.ball.speed * Math.cos(angle);
    
        if (this.bricks.bricksCount === 0) {
            this.bricks.reset();
        }
    
        this.handle = setTimeout(this.draw, 10);
        document.getElementById('start').disabled = true;
        document.getElementById('message').innerHTML = `게임 시작`;
        document.getElementById('level').innerHTML = `LEVEL ${this.level}`;
        document.getElementById('point').innerHTML = `POINT ${this.point}`;
        const balls = document.getElementById('ball-count');
        if (balls) {
            balls.removeChild(balls.lastChild);    
        }
    }

    stop() {
        this.status = 'stop';
        if (this.handle) {
            clearTimeout(this.handle);
            this.handle = null;
        }
        document.getElementById('start').disabled = false;
        document.getElementById('message').innerHTML = `게임 대기`;    
    }

    over(win) {
        this.status = 'over';
        if (this.handle) {
            clearTimeout(this.handle);
            this.handle = null;
        }
    
        if (win) {
            this.level++;
            if (this.level > 10) {
                document.getElementById('message').innerHTML = '게임 승리';
                document.getElementById('level').innerHTML = '';
            } else {            
                document.getElementById('message').innerHTML = '레벨 통과';
                document.getElementById('level').innerHTML = `LEVEL ${this.level}`;
            }
        } else {
            document.getElementById('message').innerHTML = '게임 오버';
        }
        document.getElementById('start').disabled = false;    
    }
}

let ballCount = 3;
const brickRowCount = 3;
const brickColumnCount = 5;
const audio = new Audio('resources/beep.mp3');

// gameReady();
const game = new Game();
game.ready();

const gameStart = () => {
    game.draw();
    game.start();
}