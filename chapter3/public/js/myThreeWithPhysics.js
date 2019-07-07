const MY_THREE = {
    objects: [],
    rigidBodies: [],
    textureLoader: new THREE.TextureLoader(),
    clock: new THREE.Clock(),
    time: 0,
    objectsToRemove: [],
};
let impactPoint = new THREE.Vector3();
let impactNormal = new THREE.Vector3();
for (let i = 0; i < 500; i++) {
    MY_THREE.objectsToRemove[i] = null;
}
let numObjectsToRemove = 0;

if (THREE.ConvexObjectBreaker) {
    MY_THREE.convexBreaker = new THREE.ConvexObjectBreaker();
}

//const quat = new THREE.Quaternion();

MY_THREE.initGraphics = (config = {}) => {
    const { cameraPos, bullet } = config;

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
        1, // intensity
      );

    // Create a directional light
    const light = new THREE.DirectionalLight(0xffffff, 2.0);

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

    if (bullet && bullet.show) {
        const { mass, radius, segments } = bullet;
        MY_THREE.rayPos = new THREE.Vector3();

        const onMouseDown = (e) => {
            MY_THREE.rayPos.set(
                (e.offsetX / container.clientWidth) * 2 - 1,
                -(e.offsetY / container.clientHeight) * 2 + 1
            );

            raycaster.setFromCamera(MY_THREE.rayPos, camera);
            
            pos.copy(raycaster.ray.direction);
            pos.add(raycaster.ray.origin);
            quat.set(0, 0, 0, 1);

            const body = MY_THREE.createRigidSphere({
                mass,
                size: { radius, segments },
                pos,
                quat,
            }, new THREE.MeshStandardMaterial({ color: 0x000000 }));

            pos.copy(raycaster.ray.direction);
            pos.multiplyScalar(50);
            body.setLinearVelocity(new Ammo.btVector3(pos.x, pos.y, pos.z));
        }
        window.addEventListener('mousedown', onMouseDown, false);
    } 
};

MY_THREE.addToScene = (object, update) => {
    MY_THREE.objects.push({
        object,
        update,
    });

    MY_THREE.scene.add(object);
};

MY_THREE.render = () => {
    const { raycaster, mouse, camera, rigidBodies, scene, renderer } = MY_THREE;
    let { hovered, hoveredColor } = MY_THREE;

    raycaster.setFromCamera(mouse, camera);

    // calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(rigidBodies);

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

    let deltaTime = MY_THREE.clock.getDelta();
    MY_THREE.updatePhysics(deltaTime);
    
    renderer.render(scene, camera);
    MY_THREE.time += deltaTime;
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

MY_THREE.initPhysics = (config = { gravity: 9.8 }) => {
    const { gravity } = config;

    const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    const broadphase = new Ammo.btDbvtBroadphase();
    const solver = new Ammo.btSequentialImpulseConstraintSolver();
    const physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, -gravity, 0));

    MY_THREE.physicsWorld = physicsWorld;
    MY_THREE.dispatcher = dispatcher;
};

MY_THREE.createRigidBody = (object, physicsShape, mass, pos, quat, vel, angVel, friction = 0.5) => {
    const { scene, physicsWorld, rigidBodies } = MY_THREE;

    if (pos) {
        object.position.copy(pos);
    } else {
        pos = object.position;
    }
    
    if (quat) {
        object.quaternion.copy(quat);
    } else {
        quat = object.quaternion;
    }
    
    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));    
    const motionState = new Ammo.btDefaultMotionState(transform);

    const localInertia = new Ammo.btVector3(0, 0, 0);
    physicsShape.calculateLocalInertia(mass, localInertia);

    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, physicsShape, localInertia);
    const body = new Ammo.btRigidBody(rbInfo);

    body.setFriction(friction);

    if (vel) {
        body.setLinearVelocity(new Ammo.btVector3(vel.x, vel.y, vel.z));
    }
    if (angVel) {
        body.setAngularVelocity(new Ammo.btVector3(angVel.x, angVel.y, angVel.z));
    }

    object.userData.physicsBody = body;
    object.userData.collided = false;
    scene.add(object);

    if (mass > 0) {
        rigidBodies.push(object);
        // Disable deactivation
        body.setActivationState(4);
    }

    physicsWorld.addRigidBody(body);
    return body;
};

MY_THREE.createRigidBox = ({ pos, size, mass, quat, velocity, friction }, material) => {
    const { createRigidBody } = MY_THREE;

    const box = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), material);
    box.castShadow = true;
    box.receiveShadow = true;
    const shape = new Ammo.btBoxShape(new Ammo.btVector3(size.x * 0.5, size.y * 0.5, size.z * 0.5));
    const margin = 0.05;
    shape.setMargin(margin);
    return createRigidBody(box, shape, mass, pos, quat, velocity);
};

MY_THREE.createRigidSphere = ({ size, pos, mass, quat, velocity, friction }, material) => {
    const { createRigidBody } = MY_THREE;

    const sphere = new THREE.Mesh(new THREE.SphereGeometry(size.radius, size.segments, size.segments), material);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    const shape = new Ammo.btSphereShape(size.radius);
    const margin = 0.05;
    shape.setMargin(margin);
    return createRigidBody(sphere, shape, mass, pos, quat, velocity);
};

MY_THREE.createBreakableRigidBox = ({ pos, size, mass, quat, friction }, material) => {
    const {
        scene,
        convexBreaker,
        createDebrisFromBreakableObject,
    } = MY_THREE;

    const geometry = new THREE.BoxBufferGeometry(size.x * 0.5, size.y * 0.5, size.z * 0.5);
    const object = new THREE.Mesh(geometry, material);

    object.position.copy(pos);
    object.quaternion.copy(quat);
    convexBreaker.prepareBreakableObject(object, mass, new THREE.Vector3(), new THREE.Vector3(), true);
    createDebrisFromBreakableObject(object);
    scene.add(object);
};

MY_THREE.createConvexHullPhysicsShape = (coords) => {
    const shape = new Ammo.btConvexHullShape();
    const tempBtVec3_1 = new Ammo.btVector3(0, 0, 0);
    for (let i = 0, il = coords.length; i < il; i+= 3) {
        tempBtVec3_1.setValue(coords[i], coords[i + 1], coords[i + 2]);
        let lastOne = (i >= (il - 3));
        shape.addPoint(tempBtVec3_1, lastOne);
    }
    return shape;
};

MY_THREE.createDebrisFromBreakableObject = (object) => {
    const { createRigidBody, createConvexHullPhysicsShape } = MY_THREE;

    const margin = 0.05;
    object.castShadow = true;
    object.receiveShadow = true;
    const shape = createConvexHullPhysicsShape(object.geometry.attributes.position.array);
    shape.setMargin(margin);
    const body = createRigidBody(
        object,
        shape,
        object.userData.mass,
        null,
        null,
        object.userData.velocity,
        object.userData.angularVelocity
    );
    // Set pointer back to the three object only in the debris objects
    const btVecUserData = new Ammo.btVector3( 0, 0, 0 );
    btVecUserData.threeObject = object;
    body.setUserPointer(btVecUserData);
};

MY_THREE.removeDebris = (object) => {
    const { scene, physicsWorld } = MY_THREE;

    scene.remove(object);
    physicsWorld.removeRigidBody(object.userData.physicsBody);
}

let transformAux1 = new Ammo.btTransform();

MY_THREE.updatePhysics = (deltaTime) => {
    const { physicsWorld, dispatcher, rigidBodies } = MY_THREE;

    // Step world
    physicsWorld.stepSimulation(deltaTime, 10);

    // Update rigid bodies
    for (let i = 0, il = rigidBodies.length; i < il; i++) {
        const objThree = rigidBodies[i];
        const objPhys = objThree.userData.physicsBody;
        const ms = objPhys.getMotionState();
        if (ms) {
            ms.getWorldTransform(transformAux1);
            let p = transformAux1.getOrigin();
            let q = transformAux1.getRotation();
            objThree.position.set(p.x(), p.y(), p.z());
            objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
            objThree.userData.collided = false;
        }
    }

    for (let i = 0, il = dispatcher.getNumManifolds(); i < il; i ++) {
        const contactManifold = dispatcher.getManifoldByIndexInternal( i );
        const rb0 = contactManifold.getBody0();
        const rb1 = contactManifold.getBody1();
        const threeObject0 = Ammo.castObject( rb0.getUserPointer(), Ammo.btVector3 ).threeObject;
        const threeObject1 = Ammo.castObject( rb1.getUserPointer(), Ammo.btVector3 ).threeObject;
        if ( ! threeObject0 && ! threeObject1 ) {
            continue;
        }
        const userData0 = threeObject0 ? threeObject0.userData : null;
        const userData1 = threeObject1 ? threeObject1.userData : null;
        const breakable0 = userData0 ? userData0.breakable : false;
        const breakable1 = userData1 ? userData1.breakable : false;
        const collided0 = userData0 ? userData0.collided : false;
        const collided1 = userData1 ? userData1.collided : false;
        if ( ( ! breakable0 && ! breakable1 ) || ( collided0 && collided1 ) ) {
            continue;
        }
        let contact = false;
        let maxImpulse = 0;
        for ( let j = 0, jl = contactManifold.getNumContacts(); j < jl; j ++ ) {
            const contactPoint = contactManifold.getContactPoint( j );
            if ( contactPoint.getDistance() < 0 ) {
                contact = true;
                const impulse = contactPoint.getAppliedImpulse();
                if ( impulse > maxImpulse ) {
                    maxImpulse = impulse;
                    const pos = contactPoint.get_m_positionWorldOnB();
                    const normal = contactPoint.get_m_normalWorldOnB();
                    impactPoint.set( pos.x(), pos.y(), pos.z() );
                    impactNormal.set( normal.x(), normal.y(), normal.z() );
                }
                break;
            }
        }
        // If no point has contact, abort
        if (!contact) {
            continue;
        }
        
        // Subdivision
        let fractureImpulse = 250;
        if ( breakable0 && !collided0 && maxImpulse > fractureImpulse ) {
            const debris = MY_THREE.convexBreaker.subdivideByImpact( threeObject0, impactPoint, impactNormal , 1, 2, 1.5 );
            const numObjects = debris.length;
            for ( let j = 0; j < numObjects; j++ ) {
                MY_THREE.createDebrisFromBreakableObject(debris[j]);
            }
            MY_THREE.objectsToRemove[ numObjectsToRemove++ ] = threeObject0;
            userData0.collided = true;
        }
        if ( breakable1 && !collided1 && maxImpulse > fractureImpulse ) {
            const debris = MY_THREE.convexBreaker.subdivideByImpact( threeObject1, impactPoint, impactNormal , 1, 2, 1.5 );
            const numObjects = debris.length;
            for ( let j = 0; j < numObjects; j++ ) {
                MY_THREE.createDebrisFromBreakableObject(debris[j]);
            }
            MY_THREE.objectsToRemove[ numObjectsToRemove++ ] = threeObject1;
            userData1.collided = true;
        }
        
    }
    
    for ( let i = 0; i < numObjectsToRemove; i++ ) {
        MY_THREE.removeDebris(MY_THREE.objectsToRemove[ i ] );
    }
    
    numObjectsToRemove = 0;
};

