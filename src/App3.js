import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RapierPhysics } from 'three/examples/jsm/Addons'
import { RapierHelper } from 'three/examples/jsm/helpers/RapierHelper.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'

export class App3 {
    constructor() {
        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100)
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        this.controls = null
        this.stats = null
        this.physics = null
        this.physicsHelper = null
        this.player = null
        this.chassis = null
        this.characterController = null
        this.movement = { forward: 0, right: 0 }
    }

    init() {
        this.setupScene()
        this.setupEventListeners()
        this.setupControls()
        this.createObjects()
    }

    setupScene() {
        this.scene.background = new THREE.Color(0xbfd1e5)
        this.camera.position.set(0, 4, 10)
        const hemisphereLight = new THREE.HemisphereLight(0x555555, 0xFFFFFF)
        this.scene.add(hemisphereLight)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 4)
        directionalLight.position.set(0, 12.5, 12.5)
        directionalLight.castShadow = true
        directionalLight.shadow.radius = 3
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

        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.renderer.shadowMap.enabled = true
        document.getElementById('scene-container').appendChild(this.renderer.domElement)
        this.renderer.setAnimationLoop(this.animate.bind(this))
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.controls.target = new THREE.Vector3(0, 2, 0)
        this.controls.update()
    }

    createObjects() {
        const geometry = new THREE.BoxGeometry(100, 0.5, 100)
        const material = new THREE.MeshStandardMaterial({color: 0xffffff})
        const ground = new THREE.Mesh(geometry, material)
        ground.receiveShadow = true
        ground.position.set(0, - 0.25, 20)
        ground.userData.physics = {mass: 0}
        this.scene.add(ground)

        new THREE.TextureLoader().load('/texture/grid.png', (texture) => {
            texture.wrapS = THREE.RepeatWrapping
            texture.wrapT = THREE.RepeatWrapping
            texture.repeat.set(80, 80)
            ground.material.map = texture
            ground.material.needsUpdate = true
        })

        this.buildTransportRegion()

        this.stats = new Stats()
        document.getElementById('scene-container').appendChild(this.stats.dom)

        this.setupPhysics()

        this.onWindowResize()
    }

    async setupPhysics() {
        this.physics = await RapierPhysics()
        this.physicsHelper = new RapierHelper(this.physics.world)
        this.scene.add(this.physicsHelper)
        this.physics.addScene(this.scene)
        this.createCharacter()
    }

    createCharacter() {
        const characterGeometry = new THREE.CapsuleGeometry(0.3, 1, 8, 8)
        const characterMaterial = new THREE.MeshStandardMaterial({color: 0x0000ff})
        this.player = new THREE.Mesh(characterGeometry, characterMaterial)
        this.player.castShadow = true
        this.player.position.set(0, 0.8, 0)
        this.scene.add(this.player)

        this.characterController = this.physics.world.createCharacterController(0.01)
        this.characterController.setApplyImpulsesToDynamicBodies(true)
        this.characterController.setCharacterMass(3)
        const colliderDesc = this.physics.RAPIER.ColliderDesc.capsule(0.5, 0.3).setTranslation(0, 0.8, 0)
        this.player.userData.collider = this.physics.world.createCollider(colliderDesc)
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(window.innerWidth, window.innerHeight)
    }

    setupEventListeners() {
        window.addEventListener('keydown', event => {
            if ( event.key === 'w' || event.key === 'ArrowUp' ) this.movement.forward = 1;
            if ( event.key === 's' || event.key === 'ArrowDown' ) this.movement.forward = - 1;
            if ( event.key === 'a' || event.key === 'ArrowLeft' ) this.movement.right = - 1;
            if ( event.key === 'd' || event.key === 'ArrowRight' ) this.movement.right = 1;
        })
        window.addEventListener('keyup', event => {
            if ( event.key === 'w' || event.key === 's' || event.key === 'ArrowUp' || event.key === 'ArrowDown' ) this.movement.forward = 0;
            if ( event.key === 'a' || event.key === 'd' || event.key === 'ArrowLeft' || event.key === 'ArrowRight' ) this.movement.right = 0;
        })
        window.addEventListener( 'resize', this.onWindowResize, false );
    }

    buildTransportRegion() {
        const radius = 3
        const shape = new THREE.Shape()
        shape.absarc(0, 0, radius, 0, Math.PI * 2, false)
        const geometry = new THREE.ShapeGeometry(shape)
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.rotation.x = - Math.PI / 2
        mesh.position.set(10, 0, - 10)
        this.scene.add(mesh)
    }

    animate() {
        if (this.physicsHelper) {
            this.physicsHelper.update()
        }
        this.renderer.render(this.scene, this.camera)
        if (this.characterController && this.physics) {
            const deltaTime = 1 / 60;
            // Character movement
            const speed = 2.5 * deltaTime;
            const moveVector = new this.physics.RAPIER.Vector3( this.movement.right * speed, 0, - this.movement.forward * speed );

            this.characterController.computeColliderMovement( this.player.userData.collider, moveVector );

            // Read the result.
            const translation = this.characterController.computedMovement();
            const position = this.player.userData.collider.translation();

            position.x += translation.x;
            position.y += translation.y;
            position.z += translation.z;

            this.player.userData.collider.setTranslation( position );

            // Sync Three.js mesh with Rapier collider
            this.player.position.set( position.x, position.y, position.z );
        }
        
        this.stats.update()
    }
}

