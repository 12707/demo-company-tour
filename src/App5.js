import * as THREE from 'three'

export class App {
    constructor() {
        // THREE.Cache.enabled = false; // Disable texture caching
        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1100)
        this.renderer = new THREE.WebGLRenderer()
        this.geometry = null
        this.sphere = null
        this.raycaster = null
        this.isUserInteracting = false
        this.lontitude = 0
        this.latitude = 0
        this.onPointerDownLon = 0
        this.onPointerDownLat = 0
        this.onPointerDownMouseX = 0
        this.onPointerDownMouseY = 0
        this.phi = 0
        this.theta = 0
        this.fnPointerMove = null
        this.fnPointerUp = null
        // this.panoramaName = 'panorama_demo_8.jpg'  // panorama_demo_2.jpeg, chalet_panorama.jpg, panorama_demo_6.jpg
        this.panoramaNames = ['panorama_demo_8.jpg', 'panorama_demo_7.jpg', 'panorama_demo_6.jpg']
        this.frameNames = ['frame_apngframe1.png', 'frame_apngframe2.png', 'frame_apngframe3.png']
        this.frameTextures = []
        this.currentFrameIndex = 0
        this.objects = []
        this.mouse = new THREE.Vector2()
        this.panoramaIndex = 0
        this.textures = []
    }

    init() {
        this.loadTextures()
        this.setupScene()
        this.addEventListeners()
        // this.addHotpoints()
        this.addAccessory(50, -100, -80) // Add frames for animation
        this.jumpToNextPanorama(1) // Add click event to jump to the next panorama
    }

    setupScene() {
        const container = document.getElementById('scene-container')
        if (!container) {
            console.error('Scene container not found')
            return
        }
        // this.scene = new THREE.Scene()
        // this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1100)
        this.geometry = new THREE.SphereGeometry(500, 60, 40)
        this.geometry.scale(-1, 1, 1) // Invert the geometry to make it inside-out

        // const texture = new THREE.TextureLoader().load(`/textures/${this.panoramaName}`)
        // texture.colorSpace = THREE.SRGBColorSpace
        const texture = this.getTexture(this.panoramaIndex)
        if (!texture) {
            console.error('Texture not found for index:', this.panoramaIndex)
            return
        }

        const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
        const sphere = new THREE.Mesh(this.geometry, material)
        this.sphere = sphere
        this.scene.add(sphere)

        // this.renderer = new THREE.WebGLRenderer()
        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.renderer.setAnimationLoop(this.animate.bind(this))
        container.appendChild(this.renderer.domElement)

        container.style.touchAction = 'none' // Disable touch actions to prevent scrolling
        container.addEventListener('pointerdown', this.onPointerDown.bind(this))
    }

    addEventListeners() {
        document.addEventListener('wheel', this.onDocumentMouseWheel.bind(this))
        window.addEventListener('resize', this.resize.bind(this))
    }

    onDocumentMouseWheel(event) {
        const fov = this.camera.fov + event.deltaY * 0.05;
        this.camera.fov = THREE.MathUtils.clamp(fov, 10, 75); // Clamp the FOV to prevent extreme zoom
        this.camera.updateProjectionMatrix();
    }

    onPointerDown(event) {
        if (!event.isPrimary) return; // Ignore secondary pointers
        this.isUserInteracting = true;
        this.onPointerDownMouseX = event.clientX;
        this.onPointerDownMouseY = event.clientY;
        this.onPointerDownLon = this.lontitude;
        this.onPointerDownLat = this.latitude; 

        if (!this.fnPointerMove) {
            this.fnPointerMove = this.onPointerMove.bind(this);
        }
        if (!this.fnPointerUp) {
            this.fnPointerUp = this.onPointerUp.bind(this);
        }
        
        document.addEventListener('pointermove', this.fnPointerMove);
        document.addEventListener('pointerup', this.fnPointerUp);
    }

    onPointerMove(event) {
        if (!event.isPrimary) return; // Ignore secondary pointers

        this.lontitude = (this.onPointerDownMouseX - event.clientX) * 0.1 + this.onPointerDownLon;
        this.latitude =  (event.clientY - this.onPointerDownMouseY) * 0.1 + this.onPointerDownLat;
    }

    onPointerUp(event) {
        if (!event.isPrimary) return;
        this.isUserInteracting = false;
        document.removeEventListener('pointermove', this.fnPointerMove);
        document.removeEventListener('pointerup', this.fnPointerUp);
        
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        if (this.isUserInteracting === false) {
            // this.lontitude += 0.1; // Rotate the panorama 
        }
        this.latitude = Math.max(-85, Math.min(85, this.latitude)); // Clamp latitude
        this.phi = THREE.MathUtils.degToRad(90 - this.latitude);
        this.theta = THREE.MathUtils.degToRad(this.lontitude);
        const x = 500 * Math.sin(this.phi) * Math.cos(this.theta);
        const y = 500 * Math.cos(this.phi);
        const z = 500 * Math.sin(this.phi) * Math.sin(this.theta);
        this.camera.lookAt(x, y, z);
        this.renderer.render(this.scene, this.camera); 
    }

    loadTextures() {
        this.panoramaNames.forEach(name => {
            const texture = new THREE.TextureLoader().load(`/textures/${name}?t=${Date.now()}`)
            texture.colorSpace = THREE.SRGBColorSpace
            this.textures.push(texture)
        })
    }

    getTexture(index = 0) {
        return this.textures[index]
    }

    clearScene() {
        if (this.scene) {
            while (this.scene.children.length > 0) {
                const child = this.scene.children[0];
                if (child.geometry) child.geometry.dispose();  
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose()); 
                    } else {            
                        child.material.dispose();
                    }       
                }
                this.scene.remove(child);
            }
            this.objects = [];
            this.mouse = new THREE.Vector2()
        }           
    }

    animateFrame(sprite) {
        requestAnimationFrame(this.animateFrame.bind(this, sprite));
        if (this.renderer.info.render.frame % 30 === 0) {
            this.currentFrameIndex = (this.currentFrameIndex + 1) % this.frameTextures.length; // Loop through frames
            const currentTexture = this.frameTextures[this.currentFrameIndex];
            sprite.material.map = currentTexture; // Update sprite material with the current frame
            sprite.material.needsUpdate = true; // Ensure the material updates
        }
        // this.updateFramePosition(sprite); // Update the sprite position
    } 
    
    updateFramePosition(sprite) {
        const targetPosition = new THREE.Vector3(50, -150, -80); // Target position for the frame
        this.sphere.updateMatrixWorld(); // Ensure the sphere's world matrix is updated
        const wolrdLocation = targetPosition.applyMatrix4(this.sphere.matrixWorld); // Apply the geometry's world matrix to the target position
        sprite.position.copy(wolrdLocation); // Update the sprite's position to the world location
        // sprite.position.copy(targetPosition); // Update the sprite's position
        // sprite.lookAt(new THREE.Vector3(sprite.position.x, sprite.position.y, sprite.position.z - 1)); // Make the sprite face the center of the sphere
    }

    addAccessory(x, y, z) {
        const TextureLoader = new THREE.TextureLoader();
        this.frameNames.forEach(name => {
            const texture = TextureLoader.load(`/textures/${name}?t=${Date.now()}`);
            texture.colorSpace = THREE.SRGBColorSpace;
            this.frameTextures.push(texture);
        });

        const spriteMaterial = new THREE.SpriteMaterial({ map: this.frameTextures[0], side: THREE.DoubleSide, transparent: true, color: 0xffffff });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(30, 30, 1); // Scale the sprite
        sprite.position.set(x, y, z);
        sprite.lookAt(this.camera.position); // Make the sprite face the camera
        this.scene.add(sprite);
        this.objects.push(sprite); // Add sprite to objects for raycasting
        this.animateFrame(sprite); // Start the animation loop for the sprite frames
    }

    jumpToNextPanorama(panoramaIndex) {
        this.raycaster = new THREE.Raycaster();
        const container = document.getElementById('scene-container')
        container.addEventListener('click', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
            this.mouse.y = (event.clientY / window.innerHeight) * 2 - 1
            this.raycaster.setFromCamera(this.mouse, this.camera)
            this.raycaster.params.Sprite.threshold = 2.0; // Set threshold for raycasting
            const intersects = this.raycaster.intersectObjects(this.objects, true)
            if (intersects.length > 0) {
                const intersectedObject = intersects[0].object;
                console.log(`You clicked on: ${intersectedObject.position.x}, ${intersectedObject.position.y}, ${intersectedObject.position.z}`);
                this.clearScene(); // Clear the scene after interaction
                this.panoramaIndex = panoramaIndex; // Change to the next panorama
                this.setupScene()
                this.addEventListeners()
                this.addAccessory(100, -100, -80) // Add frames for animation
                this.jumpToNextPanorama((this.panoramaNames.length - 1) == panoramaIndex ? 0 : 2); // Set up the next panorama jump
            }
        })
    }

    addHotpoints() {
        this.raycaster = new THREE.Raycaster();
        const PlaneGeometry = new THREE.PlaneGeometry(25, 25);
        const PlaneMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
        const plane = new THREE.Mesh(PlaneGeometry, PlaneMaterial);
        plane.position.set(50, 10, -80);
        // plane.lookAt(0, 0, 0); // Look at the center of the sphere
        plane.lookAt(this.camera.position); // Look at the camera position
        this.objects.push(plane);
        this.scene.add(plane);
        const container = document.getElementById('scene-container')
        container.addEventListener('click', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
            this.mouse.y = (event.clientY / window.innerHeight) * 2 - 1
            this.raycaster.setFromCamera(this.mouse, this.camera)
            const intersects = this.raycaster.intersectObjects(this.objects, true)
            if (intersects.length > 0) {
                const intersectedObject = intersects[0].object;
                console.log(`You clicked on: ${intersectedObject.position.x}, ${intersectedObject.position.y}, ${intersectedObject.position.z}`);
                this.clearScene(); // Clear the scene after interaction
                this.panoramaIndex = 1; // Change to the next panorama
                this.setupScene()
                this.addEventListeners()
            }
        })
    }
}