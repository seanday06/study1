
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const audio = new Audio('resources/beep.mp3');
const eventAudio = new Audio('resources/ring.mp3');

class Ball {
    constructor(gameLevel) {
        this.radius = 7.5;
        this.speed = 4 + 0.3 * gameLevel;
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

    init(paddle) {
        if (paddle) {
            this.x = paddle.x + (paddle.width / 2);
            this.y = canvas.height = this.radius;
        } else {
            this.x = this.radius;
            this.y = canvas.height = this.radius;
        }
    }

    checkCollision(paddle, onMissed) {
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
            onMissed(this);
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
        this.width = 100;
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
        // set cheat key alt+S+M
        if (e.keyCode === 18) {
            this.altKeyDown = true;

        }
        if (this.altKeyDown && e.keyCode === 83) {
            this.altKeyDownAndS = true;
        }
        if (this.altKeyDownAndS && e.keyCode === 77) {
            this.cheatKey = 'pass';
        }

        if (e.keyCode === 39) {
            this.rightKeyPressed = true;
        } else if (e.keyCode === 37) {
            this.leftKeyPressed = true;
        }
    };
    
    keyUpHandler(e) {
        // reset cheat key alt+S+M
        if (e.keyCode === 18) {
            this.altKeyDown = false;
            this.altKeyDownAndS = false;
            this.cheatKey = '';
        }
        if (e.keyCode === 83) {
            this.altKeyDownAndS = false;
            this.cheatKey = '';
        }
        if (e.keyCode === 77) {
            this.cheatKey = '';
        }

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

    init() {
        this.width = 100;
        this.x = (canvas.width - this.width) / 2;
    }

    incWidth(inc) {
        if (inc) {
            const width = Math.min(this.width + 10, 150); 
            if (width !== this.width) {
                eventAudio.play();
            }
            this.width = width;
        } else {
            this.width = 100;
        }
    }

    checkKeyPressed() {
        if (this.rightKeyPressed && this.x < canvas.width-this.width) {
            this.x += this.deltaX;
        } else if (this.leftKeyPressed && this.x > 0) {
            this.x -= this.deltaX;
        }    
    }

    calcBounceAngle(ball) {
        const angle = 1;
        const offsetRatio = (ball.x - this.x) / this.width;

        if (offsetRatio < 0.25) {
            // left quarter 
            if (ball.dx > 0) {
                const oldDx = ball.dx;
                ball.dx = -ball.accel * Math.abs(ball.dy);
                ball.dy = -ball.accel * Math.abs(oldDx);
                return;
            }
        } else if (offsetRatio >= 0.25 && offsetRatio < 0.75) {
            // center half
            ball.dx = ball.accel * ball.dx;
            ball.dy = -ball.accel * ball.dy; 
            return;
        } else {
            // right quarter
            if (ball.dx < 0) {
                const oldDx = ball.dx;
                ball.dx = ball.accel * Math.abs(ball.dy);
                ball.dy = -ball.accel * Math.abs(oldDx);
                return;
            }
        }    

        // center half
        ball.dx = ball.accel * ball.dx;
        ball.dy = -ball.accel * ball.dy; 
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
        this.event = Math.random();
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
        this.brickWidth = 45;
        this.brickHeight = 15;
        this.brickPadding = 5;
        this.brickOffsetTop = 75;
        this.brickOffsetLeft = 15;
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

    // 한 줄을 새로 추가
    incRow() {
        const r = this.rowCount;
        for (let c = 0; c < this.columnCount; c++) {
            let brickX = (c*(this.brickWidth+this.brickPadding))+this.brickOffsetLeft;
            let brickY = (r*(this.brickHeight+this.brickPadding))+this.brickOffsetTop;
            this.bricks[c][r] = new Brick(brickX, brickY, this.brickWidth, this.brickHeight, this.brickColors[r], point);
        }
        
        this.rowCount++;
        for (let c = 0; c < this.columnCount; c++) {
            for (let r = 0; r < this.rowCount; r++) {
                let point = 2 * (this.rowCount - r) - 1;
                this.bricks[c][r].point = point;
            }
        }

        this.bricksCount = this.rowCount * this.columnCount;
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

/**
 * 게임 상태:
 * - READY: 대기
 * - RUN: 실행
 * - STOP: 정지
 * - LOSE: 볼 놓침
 * - PASS: 레벨 통과
 * - OVER: 종료
 * - WIN: 승리 (전체 레벨 통과)
 * 
 * 게임 액션
 * - init(): 게임을 초기화한다.
 * - ready(): 게임 시작 전 상태를 만든다.
 * - start(): 게임을 시작한다.
 * - stop(): 게임을 중지시킨다.
 * - pass(): 게임 레벨을 통과한 결과를 처리한다.
 * - lose(): 게임중에 볼을 놓친 결과를 처리한다.
 * - win(): 게임 승리를 처리한다.
 * - over(): 게임 종료를 처리한다.
 */
class Game {
    constructor() {
        this.level = 1;
        this.point = 0;
        this.status = 'READY';
        this.ballCount = 3;
        this.bricksRow = 1;
        this.bricksColumn = 9;

        this.ball = new Ball(this.level);
        this.paddle = new Paddle();
        this.bricks = new Bricks(this.bricksRow, this.bricksColumn);

        this.setStatus = this.setStatus.bind(this);
        this.draw = this.draw.bind(this);
        this.init = this.init.bind(this);
        this.ready = this.ready.bind(this);
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.pass = this.pass.bind(this);       
        this.lose = this.lose.bind(this);       
        this.win = this.win.bind(this);       
        this.over = this.over.bind(this);       
    }

    setStatus(status) {
        this.status = status;
    }

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // move paddle to right or left
        this.paddle.checkKeyPressed();
    
        if (this.paddle.cheatKey === 'pass') {
            this.pass();
            this.paddle.cheatKey = '';
        }

        // bounce ball on side wall, ceiling and paddle
        this.ball.checkCollision(this.paddle, this.lose);
    
        // check collision of the ball to the bricks
        this.bricks.checkCollision(this.ball, (brick) => {
            this.point += brick.point;
            document.getElementById('point').innerHTML = `POINT ${this.point}`;

            if (brick.event > 0.7) {
                this.paddle.incWidth(true);
            }

            if (this.bricks.bricksCount === 0) {
                this.pass();
            }
        });

        // next position of the ball
        this.ball.calcPosition();        
    
        // draw objects
        this.bricks.draw();
        this.paddle.draw();
        this.ball.draw();
    
        // animate
        if (this.status === 'RUN') {
            requestAnimationFrame(this.draw);
        }    
    }

    // 레벨을 1로 조정하고, 남은 공의 갯수도 최대치로 조정하며, 벽돌도 초기화하고, 점수도 초기화한다.
    init() {
        this.level = 1;
        this.point = 0;
        this.ballCount = 3;
        this.bricks.reset();

        document.getElementById('level').innerHTML = `LEVEL ${this.level}`;
        document.getElementById('point').innerHTML = `POINT ${this.point}`;
    
        let ballElement;
        for (let i = 1; i < this.ballCount; i++) {
            ballElement = document.createElement('div');
            ballElement.className = 'ball';
            document.getElementById('ball-count').appendChild(ballElement);
        }    

        document.getElementById('message').innerHTML = `게임 시작`;
        
        this.ready();
    }

    // 볼의 위치, Paddle의 크기를 초기화한다.
    ready() {
        this.paddle.init();
        this.ball.x = this.paddle.x + (this.paddle.width / 2);
        this.ball.y = canvas.height - this.paddle.height - this.ball.radius;
        this.ball.dy = - Math.abs(this.ball.dy);

        this.paddle.incWidth(false);
    }

    // 볼을 움직이게 한다.
    start() {
        this.setStatus('RUN');
        const angle = (Math.random() * 2 + 1) * Math.PI / 8;
        this.ball.dx = this.ball.speed * Math.sin(angle);
        this.ball.dy = -this.ball.speed * Math.cos(angle);
    
        this.handle = setTimeout(this.draw, 10);
        document.getElementById('start').disabled = true;
    }

    // 볼을 정지시킨다.
    stop() {
        this.setStatus('STOP');
        if (this.handle) {
            clearTimeout(this.handle);
            this.handle = null;
        }
        document.getElementById('start').disabled = false;
    }

    //  레벨을 1개 증가시킨다. 벽돌들을 초기화시킨다.
    pass() {
        this.stop();
        
        this.level++;
        this.bricks.incRow();
        this.bricks.reset();

        // 모든 레벨을 통과했으면 게임 승리!
        if (this.level > 10) {
            this.win();
            return;
        }

        document.getElementById('message').innerHTML = '레벨 통과';
        document.getElementById('level').innerHTML = `LEVEL ${this.level}`;

        this.ready();
    }

    // 남은 볼의 갯수를 1개 줄인다.
    lose() {
        this.stop();

        this.ballCount--;

        if (this.ballCount > 0) {
            const balls = document.getElementById('ball-count');
            if (balls) {
                balls.removeChild(balls.lastChild);    
            }

            this.ready();
        } else {
            this.over();
        }
    }

    // 모든 레벨을 통과했다. 게임 초기화만 가능하다.
    win() {
        this.setStatus('WIN');

        document.getElementById('message').innerHTML = '게임 승리';
        document.getElementById('level').innerHTML = '';
    }

    // 모든 공을 잃었다. 게임 초기화만 가능하다.
    over() {
        this.setStatus('OVER');

        document.getElementById('message').innerHTML = '게임 오버';
    }
}

const game = new Game();
game.init();
game.draw();

const gameStart = () => {
    if (game.status === 'OVER' || game.status === 'WIN') {
        game.init();
    }

    game.start();
}