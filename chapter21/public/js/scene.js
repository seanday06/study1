const initGraphics = () => {   
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer();

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    return { scene, camera, renderer };
};

const createCube = () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);

    return cube;
};

const createLine = () => {
    const geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3( -1, 0, 0) );
    geometry.vertices.push(new THREE.Vector3( 0, 1, 0) );
    geometry.vertices.push(new THREE.Vector3( 1, 0, 0) );
    const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
    const line = new THREE.Line(geometry, material);

    return line;
};
