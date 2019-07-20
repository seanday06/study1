let lastInput = {
    type: 'empty',
    value: '',
};
let inputStack = [lastInput];
const p = document.getElementById('result');

const initialize = () => {
    lastInput = {
        type: 'empty',
        value: '',
    };
    inputStack = [lastInput];
};

const display = () => {
    let output = '';

    inputStack.map((input) => {
        if (input.type === 'integer' || input.type === 'float') {
            output += input.value;
        } else if (input.type === 'operator') {
            output += input.value;
        } else if (input.type === 'equal') {
            output += input.value + eval(output);
        }
    });

    p.innerHTML = output;
};

/*
 * 연속적인 숫자 입력은 계속 허용한다.
 * '.' 입력은 1회만 허용한다. 
 *
 */

const onNumber = (value) => {
    // 계산 완료 후, 첫 숫자 입력인 경우
    // 기존 입력 내용을 모두 지우고 초기화 상태로 만든다.
    if (lastInput.type === 'equal') {
        initialize();
    }

    // '.'을 입력한 경우, 
    // 현재 숫자를 입력중이고 이미 '.'을 입력한 상태이면, 이번 입력한 '.'는 무시한다.
    if (value === '.') {
        if (lastInput.type === 'float') return;
        lastInput.type = 'float';
    } else {
        if (lastInput.type !== 'float') {
            lastInput.type = 'integer';
        }
    }

    // '0'을 입력한 경우,
    // 
    if (value === '0') {

    }


    if (lastInput.type === 'integer' || lastInput.type === 'float') {
        lastInput.value += value;
    } else {
        lastInput.value = value;
        inputStack.push(lastInput);
    }

    display();
};

const onOperation = (command) => {  
    if (lastInput.type === 'equal') {
        initialize();
    }
    
    if (command !== 'clear' && lastInput.type === 'empty') return;

    if (lastInput.type === 'operator') return;
    
    switch (command) {
        case '+':
            lastInput = {
                type: 'operator',
                value: ' + ',
            };
            inputStack.push(lastInput);
            display();
            break;

        case '-':
            lastInput = {
                type: 'operator',
                value: ' - ',
            };
            inputStack.push(lastInput);
            display();
            break;

        case '*':
            lastInput = {
                type: 'operator',
                value: ' * ',
            };
            inputStack.push(lastInput);
            display();
            break;

        case '/':
            lastInput = {
                type: 'operator',
                value: ' / ',
            };
            inputStack.push(lastInput);
            display();
            break;

        case '=':
            try {
                lastInput = {
                    type: 'equal',
                    value: ' = ',
                };
                inputStack.push(lastInput);
                display();
            } catch (ex) {
                alert('수식 오류가 있습니다. 확인 후 다시 시도하세요.');
            }
            break;

        case 'back':
            if (inputStack.length > 1) {
                if (lastInput.type === 'integer' | lastInput.type === 'float') {
                    if (lastInput.value.length > 0) {
                        lastInput.value = lastInput.value.slice(0, lastInput.value.length - 1);
                    } else {
                        inputStack.splice(-1, 1);
                        lastInput = inputStack[inputStack.length - 1];
                    }
                } else if (lastInput.type === 'operator') {
                    inputStack.splice(-1, 1);
                    lastInput = inputStack[inputStack.length - 1];
                }
            } else {
                initialize();
            }

            display();
            break;

        case 'clear':
            initialize();
            display();
            break;
    }
};

