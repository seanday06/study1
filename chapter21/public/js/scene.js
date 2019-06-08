const initGraphics = () => {   
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // const light = new THREE.AmbientLight(0xffffff); 
    const light = new THREE.PointLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);

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

const createSphere = () => {
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const sphere = new THREE.Mesh(geometry, material);

    return sphere;
};
