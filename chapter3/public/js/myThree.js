const MY_THREE = {
    objects: [],
    rigidBodies: [],
    textureLoader: new THREE.TextureLoader(),
    clock: new THREE.Clock(),
    time: 0,
};
let impactPoint = new THREE.Vector3();
let impactNormal = new THREE.Vector3();
let numObjectsToRemove = 0;

if (THREE.ConvexObjectBreaker) {
    MY_THREE.convexBreaker = new THREE.ConvexObjectBreaker();
}

MY_THREE.initGraphics = (config = {}) => {
    const { cameraPos } = config;

    // get scene container element
    const container = document.querySelector('#scene-container');

    // enable WebGL2
    if (WEBGL.isWebGL2Available() === false) {
        container.appendChild(WEBGL.getWebGL2ErrorMessage());
    }

    // create a Scene
    const scene = new THREE.Scene();
    MY_THREE.scene = scene;

    // Set the background color
    scene.background = new THREE.Color('skyblue');

    // Create a Camera
    const fov = 35; // AKA Field of View
    const aspect = container.clientWidth / container.clientHeight;
    const near = 0.1; // the near clipping plane
    const far = 1000; // the far clipping plane

    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    MY_THREE.camera = camera;

    // every object is initially created at ( 0, 0, 0 )
    // we'll move the camera back a bit so that we can view the scene
    camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);

    new THREE.OrbitControls(camera, container);

    const ambientLight = new THREE.HemisphereLight(
        0xddeeff, // bright sky color
        0x202020, // dim ground color
        3, // intensity
      );

    // Create a directional light
    const light = new THREE.DirectionalLight(0xffffff, 5.0);

    // move the light back and up a bit
    light.position.set(10, 10, 10);

    // remember to add the light to the scene
    // scene.add(ambientLight, light);
    scene.add(ambientLight, light);

    // create the renderer
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2');
    const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true });
    MY_THREE.renderer = renderer;

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // add the automatically created <canvas> element to the page
    container.appendChild(renderer.domElement);

    const onWindowResize = () => {
        // set the aspect ratio to match the new browser window aspect ratio
        camera.aspect = container.clientWidth / container.clientHeight;

        // update the camera's frustum
        camera.updateProjectionMatrix();

        // update the size of the renderer AND the canvas
        renderer.setSize(container.clientWidth, container.clientHeight);
    }

    window.addEventListener('resize', onWindowResize, false);

    const raycaster = new THREE.Raycaster();
    MY_THREE.raycaster = raycaster;
    MY_THREE.mouse = new THREE.Vector2();

    const onMouseMove = (e) => {
        e.preventDefault();
        MY_THREE.mouse.x = (e.offsetX / container.clientWidth) * 2 - 1;
        MY_THREE.mouse.y = -(e.offsetY / container.clientHeight) * 2 + 1;
    }

    window.addEventListener('mousemove', onMouseMove, false);
};

MY_THREE.addToScene = (object, update) => {
    MY_THREE.objects.push({
        object,
        update,
    });

    MY_THREE.scene.add(object);
};

MY_THREE.render = () => {
    const { raycaster, mouse, camera, scene, renderer } = MY_THREE;
    let { hovered, hoveredColor } = MY_THREE;

    raycaster.setFromCamera(mouse, camera);

    // calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length === 1) {
        if (MY_THREE.intersect != intersects[0].object) {
            if (MY_THREE.intersect) {
                MY_THREE.intersect.material.emissive.setHex(MY_THREE.intersect.currentHex);
            }

            MY_THREE.intersect = intersects[0].object;
            MY_THREE.intersect.currentHex = MY_THREE.intersect.material.emissive.getHex();
            MY_THREE.intersect.material.emissive.setHex(0xff0000);
        }
    } else {
        if (MY_THREE.intersect) {
            MY_THREE.intersect.material.emissive.setHex(MY_THREE.intersect.currentHex);
        }

        MY_THREE.intersect = null;
    }

    renderer.render(scene, camera);
};

MY_THREE.animate = () => {
    requestAnimationFrame(MY_THREE.animate);

    MY_THREE.objects.forEach((myObject) => {
        if (myObject.update) {
            myObject.update(myObject.object);
        }
    });

    MY_THREE.render();
};
