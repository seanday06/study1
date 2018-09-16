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
let gameLevel = 1;
let gamePoint = 0;
let gameStatus = 'ready';
let gameHandle;

let ballCount = 3;
const ballRadius = 10;
const BALL_SPEED = 2 + 0.2 * gameLevel;
let x = ballRadius;
let y = ballRadius;
let dx = BALL_SPEED;
let dy = BALL_SPEED;
let accel = 1;
const ballColors = [
    "#720000",
    "#960000",
    "#a70000",
    "#ce0000",
    "#ff0000",
];
let colorIndex = 0;

class Ball {
    constructor() {
        this.radius = 10;
        this.color = ballColors[colorIndex];
    }

    calcPosition() {

    }

    draw(bx, by) {
        ctx.beginPath();
        ctx.arc(bx, by, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();    
    }
}

const paddleWidth = 120;
const paddleHeight = 10;
let paddleX = (canvas.width - paddleWidth) / 2;
let rightPressed = false;
let leftPressed = false;
const DELTA_X = 7;

class Paddle {
    constructor() {
        this.width = 120;
        this.height = 10;
        this.color = '#0095dd';
    
        document.addEventListener('keydown', this.keyDownHandler, false);
        document.addEventListener('keyup', this.keyUpHandler, false);
        document.addEventListener('wheel', this.mouseWheelHandler, { passive: true });
        canvas.addEventListener('touchmove', this.touchHandler, false);
    }

    keyDownHandler(e) {
        if (e.keyCode === 39) {
            rightPressed = true;
        } else if (e.keyCode === 37) {
            leftPressed = true;
        }
    };

    keyUpHandler(e) {
        if (e.keyCode === 39) {
            rightPressed = false;
        } else if (e.keyCode === 37) {
            leftPressed = false;
        }
    };

    mouseWheelHandler(e) {
        paddleX = Math.min(canvas.width - paddleWidth, Math.max(0, paddleX - e.deltaX));
    };

    touchHandler(e) {
        paddleX = Math.min(canvas.width - paddleWidth, Math.max(0, paddleX - e.deltaX));
    };

    calcBounceAngle() {
        const angle = 1;
        if ((x - paddleX) / paddleWidth < 0.5) {
            // left half 
            if (dx > 0) {
                const oldDx = dx;
                dx = -accel * Math.abs(dy);
                dy = -accel * Math.abs(oldDx);
                console.log('left half', dx);
                return;
            }
        } else {
            // right half
            if (dx < 0) {
                const oldDx = dx;
                dx = accel * Math.abs(dy);
                dy = -accel * Math.abs(oldDx);
                console.log('right half', dx);
                return;
            }
        }
    
        dx = accel * dx;
        dy = -accel * dy;
        console.log('normal', dx);    
    }

    draw(px) {
        ctx.beginPath();
        ctx.rect(px, canvas.height-this.height, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();    
    }
}

const brickRowCount = 3;
const brickColumnCount = 5;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;
const bricks = [];
let bricksCount = 0;
const audio = new Audio('resources/beep.mp3');
const brickColors = [
    '#d26013',
    '#e28033',
    '#f2a053',
];

class Brick {
    constructor(bx, by, color, point) {
        this.x = bx;
        this.y = by;
        this.width = 75;
        this.height = 20;
        this.color = color;
        this.point = point;
        this.removed = false;
    }

    checkCollision(x, y) {
        if (this.removed) return false;
        if (x > this.x && x < this.x + this.width && y > this.y && y < this.y + this.height) {
            gamePoint += this.point;
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

const myBall = new Ball();
const myPaddle = new Paddle();
const myBricks = [];
for (let c = 0; c < brickColumnCount; c++) {
    myBricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
        let brickX = (c*(brickWidth+brickPadding))+brickOffsetLeft;
        let brickY = (r*(brickHeight+brickPadding))+brickOffsetTop;
        let point = 2 * (brickRowCount - r) - 1;
        myBricks[c][r] = new Brick(brickX, brickY, brickColors[r], point);
    }
}

const collisionDetection = () => {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            let b = myBricks[c][r];
            // calculations
            if (b.checkCollision(x, y)) {
                audio.play();
                dy = -dy;
                b.remove();
                bricksCount--;
                gamePoint += b.point;
                document.getElementById('point').innerHTML = `POINT ${gamePoint}`;

                if (bricksCount === 0) {
                    gameOver(true);
                    break;
                }
            }
        }
    }
}

document.getElementById('level').innerHTML = `LEVEL ${gameLevel}`;
document.getElementById('point').innerHTML = `POINT ${gamePoint}`;


const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // move paddle to right or left
    if (rightPressed && paddleX < canvas.width-paddleWidth) {
        paddleX += DELTA_X;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= DELTA_X;
    }

    // bounce ball on side wall
    if (x + dx < ballRadius || x + dx > canvas.width - ballRadius) {
        dx = -accel * dx;
        dy = accel * dy;
        colorIndex++;
        colorIndex %= ballColors.length;
    }

    // bounce ball on ceiling
    if (y + dy < ballRadius) {
        dx = accel * dx;
        dy = -accel * dy;
        colorIndex++;
        colorIndex %= ballColors.length;
    }

    // bounce ball on paddle
    if (y + dy > canvas.height - ballRadius - paddleHeight && 
        x > paddleX && x < paddleX + paddleWidth) {        
        myPaddle.calcBounceAngle();
    }

    // game over if missed
    if (y + dy > canvas.height + ballRadius) {
        ballCount--;
        if (ballCount > 0) {
            gameStop();
        } else {
            gameOver(false);
        }
    }

    // next position of the ball
    x = x + dx;
    y = y + dy;
    
    // next position of the paddle
    collisionDetection();

    // draw objects
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            myBricks[c][r].draw();
        }
    }
    myPaddle.draw(paddleX);
    myBall.draw(x, y);

    // animate
    if (gameStatus === 'on') {
        requestAnimationFrame(draw);
    }
};

const gameReady = () => {
    gameLevel = 1;
    gamePoint = 0;
    ballCount = 3;

    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r] = {
                x: 0, 
                y: 0, 
                removed: false, 
                point: 2 * (brickRowCount - r) - 1,
                colorIndex: r, 
            };
        }
    }
    bricksCount = brickColumnCount * brickRowCount;

    document.getElementById('message').innerHTML = `게임 준비`;
    document.getElementById('level').innerHTML = `LEVEL ${gameLevel}`;
    document.getElementById('point').innerHTML = `POINT ${gamePoint}`;

    let ballElement;
    for (let i = 0; i < ballCount; i++) {
        ballElement = document.createElement('div');
        ballElement.className = 'ball';
        document.getElementById('ball-count').appendChild(ballElement);
    }
};

const gameStop = () => {
    gameStatus = 'stop';
    if (gameHandle) {
        clearTimeout(gameHandle);
        gameHandle = null;
    }
    document.getElementById('start').disabled = false;
    document.getElementById('message').innerHTML = `게임 대기`;
};

const gameStart = () => {
    if (gameStatus === 'over') {
        gameReady();
    }
    
    gameStatus = 'on';
    x = ballRadius;
    y = canvas.height - ballRadius;
    const angle = (Math.random() * 2 + 1) * Math.PI / 8;
    dx = BALL_SPEED * Math.sin(angle);
    dy = -BALL_SPEED * Math.cos(angle);

    if (bricksCount === 0) {
        for (let c = 0; c < brickColumnCount; c++) {
            bricks[c] = [];
            for (let r = 0; r < brickRowCount; r++) {
                bricks[c][r] = {
                    x: 0, 
                    y: 0, 
                    removed: false, 
                    point: 2 * (brickRowCount - r) - 1,
                    colorIndex: r, 
                };
            }
        }
        bricksCount = brickColumnCount * brickRowCount;
    }

    gameHandle = setTimeout(draw, 10);
    document.getElementById('start').disabled = true;
    document.getElementById('message').innerHTML = `게임 시작`;
    const balls = document.getElementById('ball-count');
    balls.removeChild(balls.lastChild);
};

const gameOver = (win) => {
    gameStatus = 'over';
    if (gameHandle) {
        clearTimeout(gameHandle);
        gameHandle = null;
    }

    if (win) {
        gameLevel++;
        if (gameLevel > 10) {
            document.getElementById('message').innerHTML = '게임 승리';
            document.getElementById('level').innerHTML = '';
        } else {            
            document.getElementById('message').innerHTML = '레벨 통과';
            document.getElementById('level').innerHTML = `LEVEL ${gameLevel}`;
        }
    } else {
        document.getElementById('message').innerHTML = '게임 오버';
    }
    document.getElementById('start').disabled = false;
};

gameReady();
