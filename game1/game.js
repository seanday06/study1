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

const paddleWidth = 120;
const paddleHeight = 10;
let paddleX = (canvas.width - paddleWidth) / 2;
let rightPressed = false;
let leftPressed = false;
const DELTA_X = 7;

const brickRowCount = 3;
const brickColumnCount = 5;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;
const bricks = [];
let bricksCount = 0;
const audio = new Audio('beep.mp3');
const brickColors = [
    '#d26013',
    '#e28033',
    '#f2a053',
];

const drawBall = () => {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = ballColors[colorIndex];
    ctx.fill();
    ctx.closePath();
};

const drawPaddle = () => {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height-paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
};

const drawBricks = () => {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (!bricks[c][r].removed) {
                let brickX = (c*(brickWidth+brickPadding))+brickOffsetLeft;
                let brickY = (r*(brickHeight+brickPadding))+brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = brickColors[r];
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

const collisionDetection = () => {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            // calculations
            if (!b.removed) {
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    audio.play();
                    dy = -dy;
                    b.removed = true;
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
}

const keyDownHandler = (e) => {
    if (e.keyCode === 39) {
        rightPressed = true;
    } else if (e.keyCode === 37) {
        leftPressed = true;
    }
};

const keyUpHandler = (e) => {
    if (e.keyCode === 39) {
        rightPressed = false;
    } else if (e.keyCode === 37) {
        leftPressed = false;
    }
};

const mouseWheelHandler = (e) => {
    paddleX = Math.min(canvas.width - paddleWidth, Math.max(0, paddleX - e.deltaX));
};

const touchHandler = (e) => {
    paddleX = Math.min(canvas.width - paddleWidth, Math.max(0, paddleX - e.deltaX));
};

document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);
document.addEventListener('wheel', mouseWheelHandler, { passive: true });
canvas.addEventListener('touchmove', touchHandler, false);

document.getElementById('level').innerHTML = `LEVEL ${gameLevel}`;
document.getElementById('point').innerHTML = `POINT ${gamePoint}`;

const calcPaddleBounceAngle = () => {
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
        calcPaddleBounceAngle();
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
    
    collisionDetection();
    drawBricks();
    drawPaddle();
    drawBall();

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
