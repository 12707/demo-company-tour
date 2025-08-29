import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RapierPhysics } from 'three/examples/jsm/Addons'
import { RapierHelper } from 'three/examples/jsm/helpers/RapierHelper.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class App {
    constructor() {
        this.loader = new GLTFLoader()
        this.container = document.getElementById('scene-container');
        this.orbitControls = null
        this.physics = null
        this.physicsHelper = null
        this.playerController = null
        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100)
        this.renderer = new THREE.WebGLRenderer()
        this.mapMesh = null
        this.playerMesh = null
        this.walkSpeed = 0.4
        this.raycaster = new THREE.Raycaster()
        this.mouse = new THREE.Vector2()
        this.highlightMesh = null
        this.lineMaterial = null
        this.roomExitArrowMesh = null
        this.moveTarget = null
        this.moveForward = false
        this.moveBackward = false
        this.moveLeft = false
        this.moveRight = false
        this.fnMapClickHook = null
        this.fnHighlightMouseOverHook = null
        this.fnHighlightClickHook = null
        this.fnRoomExitClickHook = null
        this.moveableAreas = null
        this.gateMesh = null
        this.borderMaterial = null
        this.border = null
        this.slbMesh = null
        this.fnSLBClickHook = null
        this.roomLogoBorder = null
    }

    init() {
        this.setupScene()
        this.render()
        this.setupPhysics()
        this.setupEventListeners()
        // this.animate()
    }

    init2() {
        this.setupScene2()
        this.redner2()
        this.setupEventListeners2()
        this.setupClickableSLB()
        // this.animate()
    }

    init3() {
        this.setupScene3()
        this.setupControls()
        this.createLights3()
        this.render3()
    }

    setupScene() {
        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.renderer.shadowMap.enabled = true
        this.container.appendChild(this.renderer.domElement)
        this.camera.position.set(0, 0, 95)
        this.camera.lookAt(new THREE.Vector3(0, 0, 0))
        this.renderer.setAnimationLoop(() => this.animateForPhysicsWorld())
    }

    setupScene2() {
        this.camera.position.set(0, -10, 100)
    }

    setupScene3() {
        this.camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 1, 100)
        this.camera.position.set(18, 6, -12)
        this.renderer.setAnimationLoop(() => this.animateForPhysicsWorld3())
    }

    setupControls3() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.controls.target = new THREE.Vector3(0, 5, 0)
        this.controls.update()
    }

    createLights3() {
        const hemisphereLight = new THREE.HemisphereLight(0x555555, 0xFFFFFF)
        this.scene.add(hemisphereLight)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 4)
        directionalLight.position.set(0, 5, -10)
        directionalLight.castShadow = true
        directionalLight.shadow.radius =10
        directionalLight.shadow.blurSamples = 8
        directionalLight.shadow.mapSize.width = 2048
        directionalLight.shadow.mapSize.height = 2048

        const size = 40
        directionalLight.shadow.camera.left = - size
        directionalLight.shadow.camera.bottom = - size
        directionalLight.shadow.camera.right = size
        directionalLight.shadow.camera.top = size
        directionalLight.shadow.camera.near = 1
        directionalLight.shadow.camera.far = 50
        
        this.scene.add(directionalLight)
    }

    setupClickableSLB() {
        this.fnSLBClickHook = (event) => {
            this.mouse = this.calcMouse(event);
            this.setupRaycaster(this.mouse);

            const intersects = this.raycaster.intersectObject(this.slbMesh);
            if (intersects.length > 0) {
                this.showSLBPopup();
            }
        }
        document.addEventListener('click', this.fnSLBClickHook);
    }

    setupEventListeners() {
        document.addEventListener('keydown', (event) => {
            if ( event.key === 'w' || event.key === 'W' || event.key === 'ArrowUp' ) {
                this.moveForward = true
            } else if ( event.key === 's' || event.key === 'S' || event.key === 'ArrowDown' ) {
                this.moveBackward = true
            } else if ( event.key === 'a' || event.key === 'A' || event.key === 'ArrowLeft' ) {
                this.moveLeft = true
            } else if ( event.key === 'd' || event.key === 'D' || event.key === 'ArrowRight' ) {
                this.moveRight = true
            } 

            if (event.code === 'ShiftLeft') {
                this.walkSpeed = 0.8
            }
        })

        document.addEventListener('keyup', (event) => {
            if ( event.key === 'w' || event.key === 'ArrowUp' ) {
                this.moveForward = false
            } else if ( event.key === 's' || event.key === 'ArrowDown' ) {
                this.moveBackward = false
            } else if ( event.key === 'a' || event.key === 'ArrowLeft' ) {
                this.moveLeft = false
            } else if ( event.key === 'd' || event.key === 'ArrowRight' ) {
                this.moveRight = false
            } 
            
            if (event.code === 'ShiftLeft') {
                this.walkSpeed = 0.4
            }
            
        })

        this.fnMapClickHook = (event) => {
            this.mouse = this.calcMouse(event)
            this.setupRaycaster(this.mouse)
            const intersects = this.raycaster.intersectObject(this.mapMesh)
            if (intersects.length > 0) {
                this.moveTarget = intersects[0].point
            }
        }
        document.addEventListener('click', this.fnMapClickHook)

        this.fnHighlightMouseOverHook = (event) => {
            this.mouse = this.calcMouse(event)
            this.setupRaycaster(this.mouse)
            const intersects = this.raycaster.intersectObject(this.highlightMesh)
            if (intersects.length > 0) {
                this.lineMaterial.color.set(0xffff00)
                this.lineMaterial.opacity = 100
                // document.body.style.cursor = 'pointer'
            } else {
                this.lineMaterial.color.set(0xffffff)
                this.lineMaterial.opacity = 0
                // document.body.style.cursor = 'default'
            }
        }
        document.addEventListener('mouseover', this.fnHighlightMouseOverHook)

        this.fnHighlightClickHook = (event) => {
            this.mouse = this.calcMouse(event)
            this.setupRaycaster(this.mouse)
            const intersects = this.raycaster.intersectObject(this.highlightMesh)
            if (intersects.length > 0) {
                console.log('The highlight region is clicked!')
                this.clearScene()
                this.removeEventListeners()
                this.init3()
            }
        }
        document.addEventListener('click', this.fnHighlightClickHook)
    }

    setupEventListeners2() {
        this.fnRoomExitClickHook = (event) => {
            this.mouse = this.calcMouse(event)
            this.setupRaycaster(this.mouse)
            const intersects = this.raycaster.intersectObject(this.roomExitArrowMesh)
            if (intersects.length > 0) {
                console.log('The exit arrow is clicked!')
                this.clearScene()
                this.removeEventListeners2()
                this.init()
            }
        }
        document.addEventListener('click', this.fnRoomExitClickHook)
    }

    removeEventListeners() {
        document.removeEventListener('click', this.fnMapClickHook)
        document.removeEventListener('mouseover', this.fnHighlightMouseOverHook)
        document.removeEventListener('click', this.fnHighlightClickHook)
    }

    removeEventListeners2() {
        document.removeEventListener('click', this.fnRoomExitClickHook)
    }

    setupControls() {
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement)
        this.orbitControls.target = new THREE.Vector3(0, 2, 0)
        this.orbitControls.update()
    }

    async setupPhysics() {
        this.physics = await RapierPhysics()
        this.physicsHelper = new RapierHelper(this.physics.world)
        this.scene.add(this.physicsHelper)
        this.physics.addScene(this.scene)
        this.addCharacterController()
    }

    addCharacterController() {
        this.playerController = this.physics.world.createCharacterController(0.01)
        this.playerController.setApplyImpulsesToDynamicBodies(true)
        this.playerController.setCharacterMass(3)
        const colliderDesc = this.physics.RAPIER.ColliderDesc.cylinder(5, 5).setTranslation(10, 8, 1)
        // const colliderDesc = this.physics.RAPIER.ColliderDesc.cylinder(6, 4)
        this.playerMesh.userData.collider = this.physics.world.createCollider(colliderDesc)
    }

    async setupPhysics3() {
        this.physics = await RapierPhysics()
        this.physicsHelper = new RapierHelper(this.physics.world)
        this.scene.add(this.physicsHelper)
        this.physics.addScene(this.scene)
        this.playerController = this.physics.world.createCharacterController(0.01)
        this.playerController.setApplyImpulsesToDynamicBodies(true)
        this.playerController.setCharacterMass(3)
        const colliderDesc = this.physics.RAPIER.ColliderDesc.cylinder(1, 0.8).setTranslation(0, 0, -1)
        this.addFox(colliderDesc)
    }

    render() {
        this.addMap()
        // this.addBoxMap()
        this.addBuilding()
        this.addMoveableAreas()
        this.addHighlightRegion()
        this.addPlayer(-8.87, -15.66)
    }

    redner2() {
        this.addMap2()
        this.addMoveableAreas2()
        this.addExitSign()
        // this.addBlock()
        this.addClickableSLB()
        this.addPlayer(0, 0)
        this.addGate()
        this.addRoomLogo()
    }

    render3() {
        this.addGLB()
        this.setupPhysics3()
    }

    animate() {
        requestAnimationFrame(() => this.animate())
        
        const direction = this.getDirectionVector()
        if (direction.length() > 0) {
            console.log(`current player's position: ${this.playerMesh.position.x}, ${this.playerMesh.position.y}, ${this.playerMesh.position.z}`)
            const tempPosition = this.playerMesh.position.clone().add(direction.multiplyScalar(this.walkSpeed))
            const isMoveable = this.isMoveableArea(tempPosition.x, tempPosition.y)
            // if (isMoveable) {
            if (true) {
                this.playerMesh.position.copy(tempPosition)
            } else {
                console.log('Blocked by a non-moveable area')
            }
            // this.playerMesh.position.add(direction.multiplyScalar(this.walkSpeed))
        }

        this.renderer.render(this.scene, this.camera)
    }

    animateForPhysicsWorld() {
        if (this.physicsHelper) {
            this.physicsHelper.update()
        }

        this.renderer.render(this.scene, this.camera)

        if (this.playerController && this.physics) {
            const delta = 1 / 15
            const speed = 10 * delta
            const direction = this.getDirectionVector()
            const moveVector = new this.physics.RAPIER.Vector3(direction.x * speed, direction.y * speed, 0)
            this.playerController.computeColliderMovement(this.playerMesh.userData.collider, moveVector)
            const translation = this.playerController.computedMovement()
            const position = this.playerMesh.userData.collider.translation()
            position.x += translation.x;
            position.y += translation.y;
            position.z += translation.z;
            this.playerMesh.userData.collider.setTranslation(position)
            this.playerMesh.position.set(position.x, position.y, position.z)
        }
    }

    animateForPhysicsWorld3() {
        if (this.physicsHelper) {
            this.physicsHelper.update()
        }

        this.renderer.render(this.scene, this.camera)

        if (this.playerController && this.physics) {
            const delta = 1 / 60
            const speed = 10 * delta
            const direction = this.getDirectionVector3()
            const moveVector = new this.physics.RAPIER.Vector3(direction.x * speed, direction.y * speed, direction.z * speed)
            this.playerController.computeColliderMovement(this.playerMesh.userData.collider, moveVector)
            const translation = this.playerController.computedMovement()
            const position = this.playerMesh.userData.collider.translation()
            position.x += translation.x;
            position.y += translation.y;
            position.z += translation.z;
            this.playerMesh.userData.collider.setTranslation(position)
            this.playerMesh.position.set(position.x, position.y, position.z)
        }
    }

    addMap() {
        const textureLoader = new THREE.TextureLoader()
        // const mapTexture = textureLoader.load('/textures/hub.jpg')
        // const mapTexture = textureLoader.load('/textures/hub5.png')
        const mapTexture = textureLoader.load('/textures/hub6.png')
        mapTexture.colorSpace = THREE.SRGBColorSpace
        const mapGeometry = new THREE.PlaneGeometry(300, 150)
        const mapMaterial = new THREE.MeshBasicMaterial({ map: mapTexture })
        this.mapMesh = new THREE.Mesh(mapGeometry, mapMaterial)
        this.mapMesh.receiveShadow = true
        this.mapMesh.userData.physics = { mass: 0 }
        this.scene.add(this.mapMesh)
    }

    addBoxMap() {
        const textureLoader = new THREE.TextureLoader()
        const mapTexture = textureLoader.load('/textures/hub6.png')
        mapTexture.colorSpace = THREE.SRGBColorSpace
        const geometry = new THREE.BoxGeometry(100, 0.5, 100)
        const material = new THREE.MeshBasicMaterial({map: mapTexture, color: 0xffffff})
        this.mapMesh = new THREE.Mesh(geometry, material)
        this.mapMesh.receiveShadow = true
        this.mapMesh.position.set(0, 25, 0)
        this.mapMesh.userData.physics = { mass: 0 }
        this.scene.add(this.mapMesh)

        new THREE.TextureLoader().load('/texture/grid.png', (texture) => {
            texture.wrapS = THREE.RepeatWrapping
            texture.wrapT = THREE.RepeatWrapping
            texture.repeat.set(80, 80)
            this.mapMesh.material.map = texture
            this.mapMesh.material.needsUpdate = true
        })
    }

    addBuilding() {
        const geogetry = new THREE.BoxGeometry(5, 5, 5) 
        // const geogetry = new THREE.PlaneGeometry(5, 5)
        const material = new THREE.MeshBasicMaterial({ color: 0x11ee00, transparent:true })
        const mesh = new THREE.Mesh(geogetry, material)
        mesh.position.set(20, -30, 1)
        mesh.userData.physics = { mass: 0, restitution: 0}
        this.scene.add(mesh)
    }

    addMap2() {
        const textureLoader = new THREE.TextureLoader()
        // const mapTexture = textureLoader.load('/textures/room.jpg')
        const mapTexture = textureLoader.load('/textures/roomslb.png')
        mapTexture.colorSpace = THREE.SRGBColorSpace
        const mapGeometry = new THREE.PlaneGeometry(300, 180)
        const mapMaterial = new THREE.MeshBasicMaterial({map: mapTexture})
        this.mapMesh = new THREE.Mesh(mapGeometry, mapMaterial)
        this.scene.add(this.mapMesh)
    }

    addGLB() {
        this.loader.load('/textures/slb_internal 2.glb', (gltf) => {
            this.mapMesh = gltf.scene
            this.mapMesh.position.set(0, 0, 0)
            this.scene.add(gltf.scene)
        }, undefined, (error) => {
            console.error(error)
        })
    }

    addExitSign() {
        const textureLoader = new THREE.TextureLoader()
        const exitArrowTexture = textureLoader.load('/textures/arrowdown.png')
        exitArrowTexture.colorSpace = THREE.SRGBColorSpace
        const exitArrowGeometry = new THREE.PlaneGeometry(4, 8)
        const exitArrowMaterial = new THREE.MeshBasicMaterial({map: exitArrowTexture, transparent: true})
        this.roomExitArrowMesh = new THREE.Mesh(exitArrowGeometry, exitArrowMaterial)
        // this.roomExitArrowMesh.position.set(-38, -50, 0)
        this.roomExitArrowMesh.position.set(-30, -50, 0)
        this.scene.add(this.roomExitArrowMesh)
    }
    addGate() {
        const textureLoader = new THREE.TextureLoader();

        // Load the transparent gate texture
        const gateTexture = textureLoader.load('/textures/gate1.png');

        const planeGeometry = new THREE.PlaneGeometry(300, 180);

        // Create a material for the gate
        const gateMaterial = new THREE.MeshBasicMaterial({
            map: gateTexture,
            transparent: true,             // Enable transparency
            depthTest: true,               // Enable depth test to respect the z-buffer
            depthWrite: true,              // Write opaque parts to the depth buffer
        });

        // Create a gate mesh
        const gateMesh = new THREE.Mesh(planeGeometry, gateMaterial);

        gateMesh.position.set(0, 0, 2);
        this.scene.add(gateMesh);

        // Store reference for future interactions
        this.gateMesh = gateMesh;
    }
    addClickableSLB() {
        const topWidth = 20;  // Width of the top edge
        const bottomWidth = 20; // Width of the bottom edge
        const height = 16;  // Height of the trapezoid

        const trapezoidShape = new THREE.Shape();

        // Define the trapezoid shape by plotting the vertices
        trapezoidShape.moveTo(-bottomWidth / 2, 0);               // Bottom-left corner
        trapezoidShape.lineTo(-topWidth / 2, height);             // Top-left corner
        trapezoidShape.lineTo(topWidth / 2, height - 9);          // Top-right corner
        trapezoidShape.lineTo(bottomWidth / 2, -9);               // Bottom-right corner
        trapezoidShape.lineTo(-bottomWidth / 2, 0);               // Close shape (back to bottom-left)

        // Create geometry from the shape
        const trapezoidGeometry = new THREE.ShapeGeometry(trapezoidShape);

        // Create the trapezoid material (fully transparent as per original)
        const trapezoidMaterial = new THREE.MeshBasicMaterial({
            color: 0x4caf50,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });

        // Create the trapezoid mesh
        this.slbMesh = new THREE.Mesh(trapezoidGeometry, trapezoidMaterial);
        this.slbMesh.position.set(70, 2, 1); // Adjust position
        this.scene.add(this.slbMesh);

        // Add the edges (border)
        const edges = new THREE.EdgesGeometry(trapezoidGeometry);
        this.borderMaterial = new THREE.LineBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0,
        })
        this.border = new THREE.LineSegments(edges, this.borderMaterial);
        this.border.position.copy(this.slbMesh.position); // Match border position with the trapezoid
        this.scene.add(this.border);
        // Set up mouse hover detection
        this.setupHoverDetection();
    }

    setupHoverDetection() {
        const boardraycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
            // const domElement = this.renderer.domElement;

        // Event listener for mouse move
        document.addEventListener('mousemove', (event) => {
            // Convert mouse position to normalized device coordinates
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

            // Update the raycaster with the mouse position
            boardraycaster.setFromCamera(mouse, this.camera);

            // Detect objects intersected by the raycaster
            const intersects = boardraycaster.intersectObject(this.slbMesh);
            if (intersects.length > 0) {
                // If hovering over the trapezoid, make the border visible
                this.borderMaterial.opacity = 1; // Fully visible
            } else {
                // If not hovering, make the border invisible
                this.borderMaterial.opacity = 0; // Fully transparent
            }
        });
    }

    showSLBPopup() {
        // Create a popup element if it doesn't already exist
        let popup = document.getElementById('slb-popup');
        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'slb-popup';
            popup.style.position = 'fixed';
            popup.style.left = '50%';
            popup.style.top = '50%';
            popup.style.transform = 'translate(-50%, -50%)';
            popup.style.background = 'rgba(0, 0, 0, 0.7)'; // Transparent black background
            popup.style.color = 'black';
            popup.style.padding = '0';
            popup.style.border = 'none';
            popup.style.zIndex = 1000;
            popup.style.borderRadius = '12px';
            popup.style.boxShadow = '0px 4px 10px rgba(0, 0, 0, 0.3)';
            popup.style.fontFamily = 'Arial, sans-serif';
            popup.style.textAlign = 'left'; // Align content to the left for cleaner design
            popup.style.width = '90%';       // Responsive width
            popup.style.height = 'auto';
            popup.style.display = 'flex';    // Flexbox for side-by-side layout
            // popup.style.position = 'relative'; // Required for positioning the close icon

            // Video list array
            const videos = [
                { src: '/videos/getstart.mp4', title: 'Get to Know the Role of a Digital Operations Engineer' },
                { src: '/videos/Decarbonizing Industries_ How Energy Works _ SLB.mp4', title: 'How Energy Works' },
                { src: '/videos/getstart.mp4', title: 'Final Thoughts' },
            ];

            // Populate video list navigation
            popup.innerHTML = `
          <div style="width: 100%; display: flex; position: relative;">
    <div style="width: 70%; padding: 0;">
      <video id="slb-video" width="100%" controls autoplay style="border-radius: 12px 0 0 12px;">
        <source id="video-source" src="/videos/getstart.mp4" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    </div>
    <div id="video-nav" style="width: 30%; background: white; padding: 20px; text-align: left; border-radius: 0 12px 12px 0;">
    <h3 style="margin-top: 0; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Video List</h3>
      <ul id="video-list" style="list-style: none; padding: 0; margin: 0;"></ul>
    </div>
    <span id="close-icon" style="position: absolute; top: 10px; right: 15px; font-size: 24px; cursor: pointer; color: #222;">&times;</span>
    </div>
            `;

            document.body.appendChild(popup);


            // Populate video list navigation
            const videoListElem = document.getElementById('video-list');
            videos.forEach((video, index) => {
                const listItem = document.createElement('li');
                listItem.style.marginBottom = '10px';
                listItem.style.cursor = 'pointer';
                listItem.style.border = '1px solid #eee';
                listItem.style.borderRadius = '8px';
                listItem.style.padding = '10px';
                listItem.style.backgroundColor = index === 0 ? '#007BFF' : '#f9f9f9'; // Highlight first video
                listItem.style.color = index === 0 ? 'white' : 'black';
                listItem.style.transition = 'background-color 0.3s ease, color 0.3s ease'
                listItem.innerHTML = `
                <div style="text-decoration: none; display: block; cursor: pointer; font-size: 14px;"
                   data-src="${video.src}">
                    ${video.title}
                </div>
            `;

                // Add click event to load the video
                listItem.addEventListener('click', () => {
                    const videoElem = document.getElementById('slb-video');
                    const videoSource = document.getElementById('video-source');
                    videoSource.src = video.src;
                    videoElem.load();  // Load the new video
                    videoElem.play();  // Autoplay the new video

                    // Highlight the selected video
                    [...videoListElem.children].forEach(child => {
                        child.style.backgroundColor = '#f9f9f9';
                        child.style.color = '#000000';
                    });
                    listItem.style.backgroundColor = '#007BFF';
                    listItem.style.color = 'white';
                });

                videoListElem.appendChild(listItem);
            });

            // Add close icon functionality
            const closeIcon = document.getElementById('close-icon');
            closeIcon.addEventListener('click', () => {
                const video = document.getElementById('slb-video');
                if (video) video.pause(); // Stop the video when the popup closes
                document.body.removeChild(popup);
            });

            // Automatically play the first video (in case autoplay fails)
            const video = document.getElementById('slb-video');
            if (video) {
                video.play().catch(err => {
                    console.log('Autoplay failed due to browser restrictions:', err);
                });
            }
        }
    }

    addRoomLogo() {
    const textureLoader = new THREE.TextureLoader();

    // Load Picture A and Picture B
    const roomLogoDefault = textureLoader.load('/textures/room_logo_white.png');
    const roomLogoHighlight = textureLoader.load('/textures/room_logo_blue.png');

    // Create geometry for the hoverable area
    const planeGeometry = new THREE.PlaneGeometry(300, 180);

        // Create a material for the gate
        const pictureMaterial = new THREE.MeshBasicMaterial({
            map: roomLogoDefault,
            transparent: true,             // Enable transparency
        });
    const logoMesh = new THREE.Mesh(planeGeometry, pictureMaterial);
    logoMesh.position.set(0, 0, 0)
    this.scene.add(logoMesh);
    this.setupLogoArea()
    const hoverMesh = this.roomLogoBorderMesh
    this.roomLogoBorderMesh.position.set(48, 2, 1)
    this.scene.add(this.roomLogoBorderMesh)
    

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    document.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, this.camera);

        // Check for intersections
        const intersects = raycaster.intersectObject(hoverMesh);

        if (intersects.length > 0) {
            pictureMaterial.map = roomLogoHighlight
            pictureMaterial.needsUpdate = true
        } else {
            pictureMaterial.map = roomLogoDefault
            pictureMaterial.needsUpdate = true
        }
    })
}

    setupLogoArea() {
        const topWidth = 22;  // Width of the top edge
        const bottomWidth = 22; // Width of the bottom edge
        const height = 15;  // Height of the trapezoid

        const squireShape = new THREE.Shape();

        // Define the trapezoid shape by plotting the vertices
        squireShape.moveTo(-bottomWidth / 2, 0);               // Bottom-left corner
        squireShape.lineTo(-topWidth / 2, height);             // Top-left corner
        squireShape.lineTo(topWidth / 2, height - 9);          // Top-right corner
        squireShape.lineTo(bottomWidth / 2, -9);               // Bottom-right corner
        squireShape.lineTo(-bottomWidth / 2, 0);               // Close shape (back to bottom-left)

        // Create geometry from the shape
        const squireGeometry = new THREE.ShapeGeometry(squireShape);

        // Create the trapezoid material (fully transparent as per original)
        const squireMaterial = new THREE.MeshBasicMaterial({
            color: 0x4caf50,
            transparent: true,
            opacity: 0,
        })
         this.roomLogoBorderMesh = new THREE.Mesh(squireGeometry, squireMaterial);

    }


    addHighlightRegion() {
        const textureLoader = new THREE.TextureLoader()
        const highlightTexture = textureLoader.load('/textures/hub3.png')
        highlightTexture.colorSpace = THREE.SRGBColorSpace
        // const highlightGeometry = new THREE.PlaneGeometry(48, 38)
        const highlightGeometry = new THREE.PlaneGeometry(38, 28)
        const highlightMaterial = new THREE.MeshBasicMaterial({map: highlightTexture, transparent: true, opacity: 0})
        this.highlightMesh = new THREE.Mesh(highlightGeometry, highlightMaterial)
        // this.highlightMesh.position.set(46, -22.5, 0)
        this.highlightMesh.position.set(55, 5.5, 1)
        this.scene.add(this.highlightMesh)
        const edges = new THREE.EdgesGeometry(highlightGeometry);
        this.lineMaterial = new THREE.LineBasicMaterial({transparent: true, opacity: 0})
        const border = new THREE.LineSegments(edges, this.lineMaterial)
        border.position.copy(this.highlightMesh.position)

        this.scene.add(border)
    }

    addPlayer(x, y) {
        const textureLoader = new THREE.TextureLoader()
        const playerTexture = textureLoader.load('/textures/male1.png')
        playerTexture.colorSpace = THREE.SRGBColorSpace
        const playerGeometry = new THREE.PlaneGeometry(10, 18)
        const palyerMaterial = new THREE.MeshBasicMaterial({map: playerTexture, transparent: true})
        this.playerMesh = new THREE.Mesh(playerGeometry, palyerMaterial)
        // this.playerMesh.position.set(0, 0, 1)
        this.playerMesh.position.set(1, 8, 1)
        this.scene.add(this.playerMesh)
    }

    addFox(colliderDesc) {
        this.loader.load('/textures/fox.glb', (gltf) => {
            this.playerMesh = gltf.scene
            this.playerMesh.position.set(0, 1, 0)
            this.playerMesh.userData.collider = this.physics.world.createCollider(colliderDesc)
            this.scene.add(this.playerMesh)
        }, undefined, (error) => {
            console.error(error)
        })
    }

    addMoveableAreas() {
        // this.moveableAreas = [
        //     // entrance main path
        //     { type: 'rectangle', x1: -11.60, y1: 1.6, x2: 14.82, y2: -45.62 }, 
        //     { type: 'rectangle', x1: -14.35, y1: -45.62, x2: -3.69, y2: -65.94 }, 
        //     { type: 'rectangle', x1: 4.00, y1: -45.62, x2: 14.35, y2: -65.15 }, 
        //     { type: 'rectangle', x1: 14.35, y1: -59.19, x2: 23.00, y2: -65.15 }, 
        //     { type: 'rectangle', x1: -22.31, y1: -59.10, x2: -14.35, y2: -65.15 }, 
        //     // center circle path
        //     { type: 'rectangle', x1: -11.60, y1: 15.6, x2: 14.82, y2: -45.62 },
        //     // { type: 'circle', x: 0, y: 38.40, radius: 23.6 },
        //     { type: 'ellipsRing', x: -0.4, y: 32.80, innerLongRadius: 32.6, outerLongRadius: 46, innerShortRadius: 20, outerShortRadius: 24 },
        // ]
        this.moveableAreas = [
            { type: 'line', x1: -29.07, y1: -1.62, x2: 72.30, y2: -64.03 },
            { type: 'line', x1: -29.07, y1: -1.62, x2: -1.42, y2: 16.20 },
            { type: 'line', x1: -1.42, y1: 16.20, x2: -67.02, y2: 54.60 },
            { type: 'line', x1: -8.87, y1: -15.66, x2: -57.22, y2: -45.67 },
            { type: 'line', x1: 12.34, y1: -27.96, x2: 68.54, y2: 6.15 },
            { type: 'line', x1: 41.05, y1: -10.46, x2: 74.8, y2: -31.82 },
            { type: 'line', x1: 49.31, y1: 56.02, x2: 27.24, y2: 41.65 },
            { type: 'line', x1: -55.05, y1: 48.65, x2: -10.14, y2: 22.14 },
            { type: 'line', x1: -55.98, y1: 47.05, x2: -39.7, y2: 58.37 },
            { type: 'ellipsRing', x: 1.13, y: 5.81, innerLongRadius: 95.8, outerLongRadius: 96.6, innerShortRadius: 62.2, outerShortRadius: 65.4 },
        ]
    }

    addMoveableAreas2() {
        this.moveableAreas = [
            { type: 'line', x1: 0, y1: 0, x2: 0, y2: -62.80 },
            { type: 'line', x1: 0, y1: 0, x2: -25.20, y2: 0 },
            { type: 'line', x1: -25.20, y1: 0, x2: -25.60, y2: -52.40 },
            { type: 'line', x1: -28.41, y1: -35.19, x2: -58.46, y2: -17.14 },
            { type: 'rectangle', x1: -14.80, y1: -27.2, x2: 51.52, y2: -46.32 }, 
            { type: 'rectangle', x1: -15.28, y1: -46.72, x2: 31.12, y2: -57.12 }, 
            { type: 'rectangle', x1: -15.28, y1: -46.72, x2: 15.92, y2: -64.32 }, 
            { type: 'rectangle', x1: -0.57, y1: -11.83, x2: 21.12, y2: -59.92 }, 
            { type: 'rectangle', x1: -14.60, y1: -41.82, x2: 30.99, y2: -56.22 }, 
            { type: 'rectangle', x1: 26.38, y1: -44.78, x2: 37.17, y2: -53.17 }, 
            { type: 'rectangle', x1: 32.00, y1: -30.80, x2: 61.20, y2: -42.40 }, 
            { type: 'rectangle', x1: 4.61, y1: -17.13, x2: 32.35, y2: -33.21 }, 
            { type: 'rectangle', x1: -30.0, y1: -2.4, x2: 8.8, y2: -12.4 }, 
            { type: 'rectangle', x1: -33.2, y1: -3.2, x2: -24.31, y2: -42.49 }, 
            { type: 'rectangle', x1: -31.77, y1: -27.37, x2: 8.63, y2: -53.37 },             
            { type: 'rectangle', x1: 0.40, y1: -57.12, x2: 22.8, y2: -27.20 }, 
            { type: 'rectangle', x1: 27.2, y1: -26., x2: 53.18, y2: -47.11 }, 
        ]
    }

    calcMouse(event) {
        const mouse = new THREE.Vector2()
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1
        mouse.y = -((event.clientY / window.innerHeight) * 2 - 1)
        return mouse
    }

    setupRaycaster(mouse) {
        this.raycaster.setFromCamera(mouse, this.camera)
    }

    getDirectionVector() {
        const direction = new THREE.Vector3(0, 0, 0)
        if (this.moveForward) {
            direction.y += 1
        }

        if (this.moveBackward) {
            direction.y -= 1
        } 

        if (this.moveLeft) {
            direction.x -= 1
        } 

        if (this.moveRight) {
            direction.x += 1
        } 

        if (direction.length() > 0) {
            direction.normalize()
        }

        // console.log(`Direction Vector: x=${direction.x}, y=${direction.y}`)
        return direction
    }

    getDirectionVector3() {
        const direction = new THREE.Vector3(0, 0, 0)
        if (this.moveForward) {
            direction.z += 1
        }

        if (this.moveBackward) {
            direction.z -= 1
        } 

        if (this.moveLeft) {
            direction.x += 1
        } 

        if (this.moveRight) {
            direction.x -= 1
        } 

        if (direction.length() > 0) {
            direction.normalize()
        }

        // console.log(`Direction Vector: x=${direction.x}, y=${direction.y}`)
        return direction
    }

    clearScene() {
        if (this.scene) {
            while (this.scene.children.length > 0) {
                const child = this.scene.children[0];
                if (child.geometry) child.geometry.dispose();  
                if (child.material.map) {
                    child.material.map.dispose()
                }
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose()); 
                    } else {            
                        child.material.dispose();
                    }       
                }
                this.scene.remove(child);
            }
            this.mouse = new THREE.Vector2()
        } 
    }

    createShape() {
        const shape = new THREE.Shape()
        shape.absarc(0, 0, 10, 0, Math.PI * 2, false)
        return shape
    }

    addBlock() {
        const shape = this.createShape()
        const shapeGeometry = new THREE.ShapeGeometry(shape)
        const shapeMaterial = new THREE.MeshBasicMaterial({ color: 'gray' })
        const block = new THREE.Mesh(shapeGeometry, shapeMaterial)
        block.position.set(-18, -20, 2)
        this.scene.add(block)
    }

    isMoveableArea(x, y) {
        for (const area of this.moveableAreas) {
            if (area.type === 'rectangle') {
                if (x >= area.x1 && x <= area.x2 && y <= area.y1 && y >= area.y2) {
                    return true
                }
            } else if (area.type === 'circle') {
                const radius = area.radius
                const centerX = area.x
                const centerY = area.y
                if (Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2) <= Math.pow(radius, 2)) {
                    return true
                }
            } else if (area.type === 'ellipsRing') {
                const innerLongRadius = area.innerLongRadius
                const outerLongRadius = area.outerLongRadius
                const innerShortRadius = area.innerShortRadius
                const outerShortRadius = area.outerShortRadius
                const centerX = area.x
                const centerY = area.y
                // const innerThreshold = ((innerLongRadius / outerLongRadius) * (innerShortRadius / outerShortRadius))
                const innerThreshold = Math.pow(innerShortRadius / outerShortRadius, 2)
                const outerThreshold = 1
                const normalizedValue = Math.sqrt(Math.pow(x - centerX, 2) / Math.pow(outerLongRadius, 2) + Math.pow(y - centerY, 2) / Math.pow(outerShortRadius, 2))
                if (normalizedValue >= innerThreshold && normalizedValue <= outerThreshold) {
                    return true
                }
            }  else if (area.type === 'line') {
                const epsilon = 2.5
                const x1 = area.x1
                const y1 = area.y1
                const x2 = area.x2
                const y2 = area.y2
                // console.log(`(y2 - y1) * (x - x1): ${(y2 - y1) * (x - x1)}`)
                // console.log(`(x2 - x1) * (y - y1): ${(x2 - x1) * (y - y1)}`)
                const numberator = Math.abs((y2 - y1) * x - (x2 - x1) * y + (x2 * y1 - y2 * x1))
                const denominator = Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2)
                const distanceToLine = numberator / denominator
                if (distanceToLine > epsilon) {
                    continue
                }

                if (Math.min(x1, x2) <= x && Math.max(x1, x2) >= x && Math.min(y1, y2) <= y && Math.max(y1, y2) >= y) {
                    return true
                }
            }
            // Additional area types can be added here
        }
        return false
    }
}