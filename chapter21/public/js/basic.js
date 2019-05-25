// initialize
const THREE_JS = {};
const rigidBodies = [];
let impactPoint = new THREE.Vector3();
let impactNormal = new THREE.Vector3();
let numObjectsToRemove = 0;
const textureLoader = new THREE.TextureLoader();
const convexBreaker = new THREE.ConvexObjectBreaker();

THREE_JS.initGraphics = () => {
    const element = document.getElementById('container');
    if (WEBGL.isWebGL2Available() === false) {
        element.appendChild(WEBGL.getWebGL2ErrorMessage());   
    }
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2');
    const renderer = new THREE.WebGLRenderer( { canvas, context } );
    renderer.setSize(window.innerWidth, window.innerHeight);
    element.appendChild(renderer.domElement);

    // 화면 설정
    const scene = new THREE.Scene();

    // 카메라 설정
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.2, 2000);
    camera.position.x = 35;
    camera.position.y = 10;
    camera.position.z = 35;
        
    // 화면 zoom 기능 구현
    const controls = new THREE.OrbitControls(camera);
    controls.target.set(0, 5, 0);
    controls.update();

    // create a point light
    var pointLight = new THREE.PointLight(0xffffff);
    pointLight.position.x = 50;
    pointLight.position.y = 50;
    pointLight.position.z = 0;
    scene.add(pointLight);
    
    // 브라우저 화면 크기 변경에 따라서 canvas 크기도 변하게 처리
    const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    };
    window.addEventListener('resize', onWindowResize, false);

    return { scene, camera, renderer };
};


THREE_JS.initPhysics = (gravityConstant = 9.8) => {
    const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    const broadphase = new Ammo.btDbvtBroadphase();
    const solver = new Ammo.btSequentialImpulseConstraintSolver();
    const physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, -gravityConstant, 0));

    return { physicsWorld, dispatcher };
};

        
THREE_JS.createMaterial = (color) => {
    return new THREE.MeshBasicMaterial({ color });
};

THREE_JS.createRigidBody = ({ scene, physicsWorld }, object, physicsShape, mass, pos, quat, vel, angVel) => {
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
    body.setFriction(0.5);
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

THREE_JS.createParalellepipedWithPhysics = ({ scene, physicsWorld }, sx, sy, sz, mass, pos, quat, material) => {
    const margin = 0.05;
    const ground = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz, 1, 1, 1), material);
    ground.castShadow = true;
    ground.receiveShadow = true;
    const shape = new Ammo.btBoxShape(new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5));
    shape.setMargin(margin);
    THREE_JS.createRigidBody({ scene, physicsWorld }, ground, shape, mass, pos, quat);
    textureLoader.load('../images/grid.png', (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(40, 40);
        ground.material.map = texture;
        ground.material.needsUpdate = true;
    });
    return ground;
};


THREE_JS.createConvexHullPhysicsShape = (coords) => {
    const shape = new Ammo.btConvexHullShape();
    const tempBtVec3_1 = new Ammo.btVector3(0, 0, 0);
    for (let i = 0, il = coords.length; i < il; i+= 3) {
        tempBtVec3_1.setValue(coords[ i ], coords[ i + 1 ], coords[ i + 2 ]);
        let lastOne = (i >= (il - 3));
        shape.addPoint(tempBtVec3_1, lastOne);
    }
    return shape;
};

THREE_JS.createDebrisFromBreakableObject = ({ scene, physicsWorld }, object) => {
    const margin = 0.05;
    object.castShadow = true;
    object.receiveShadow = true;
    const shape = THREE_JS.createConvexHullPhysicsShape(object.geometry.attributes.position.array);
    shape.setMargin(margin);
    const body = THREE_JS.createRigidBody(
        { scene, physicsWorld },
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

THREE_JS.createObject = ({ scene, physicsWorld }, mass, halfExtents, pos, quat, material) => {
    const object = new THREE.Mesh(
        new THREE.BoxBufferGeometry(halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2), material);
    object.position.copy(pos);
    object.quaternion.copy(quat);
    convexBreaker.prepareBreakableObject(object, mass, new THREE.Vector3(), new THREE.Vector3(), true);
    THREE_JS.createDebrisFromBreakableObject({ scene, physicsWorld }, object);
};

let transformAux1 = new Ammo.btTransform();


THREE_JS.updatePhysics = (physicsWorld, dispatcher, deltaTime) => {
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
        if ( ! contact ) {
            continue;
        }
        // Subdivision
        let fractureImpulse = 250;
        if ( breakable0 && !collided0 && maxImpulse > fractureImpulse ) {
            const debris = convexBreaker.subdivideByImpact( threeObject0, impactPoint, impactNormal , 1, 2, 1.5 );
            const numObjects = debris.length;
            for ( let j = 0; j < numObjects; j++ ) {
                THREE_JS.createDebrisFromBreakableObject(debris[j]);
            }
            objectsToRemove[ numObjectsToRemove++ ] = threeObject0;
            userData0.collided = true;
        }
        if ( breakable1 && !collided1 && maxImpulse > fractureImpulse ) {
            const debris = convexBreaker.subdivideByImpact( threeObject1, impactPoint, impactNormal , 1, 2, 1.5 );
            const numObjects = debris.length;
            for ( let j = 0; j < numObjects; j++ ) {
                THREE_JS.createDebrisFromBreakableObject(debris[j]);
            }
            objectsToRemove[ numObjectsToRemove++ ] = threeObject1;
            userData1.collided = true;
        }
    }
    for ( let i = 0; i < numObjectsToRemove; i++ ) {
        removeDebris( objectsToRemove[ i ] );
    }
    numObjectsToRemove = 0;
}
