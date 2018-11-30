const print = (value) => {
    let output = document.getElementById('output');
    if (!output) {
        output = document.createElement('div');
        output.id = 'output';
        document.body.append(output);
    }
    const p = document.createElement('p');
    p.innerHTML = value;
    output.append(p);
};
