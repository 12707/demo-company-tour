import * as THREE from 'three'
import { RapierPhysics } from 'three/examples/jsm/Addons'
import { RapierHelper } from 'three/examples/jsm/helpers/RapierHelper.js'

export class App {
    constructor() {
        this.container = null;
        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100)
        this.renderer = new THREE.WebGLRenderer()
        this.map = null
        this.player = null
        this.pizza = null
        this.lineMaterial = null
        this.control = null
        this.characterController = null
        this.clock = new THREE.Clock();
        this.movement = { forward: 0, right: 0 }
        this.physics = null
        this.physicsHelper = null
        this.raycaster = null
        this.mouse = new THREE.Vector2()
    }

    init() {
        this.render()
        this.addMap()
        this.addEventListeners()
        this.setupPhysics()
    }

    render() {
        this.container = document.getElementById('scene-container')
        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.container.appendChild(this.renderer.domElement)
        this.camera.position.set(0, 0, 61.5)
        this.camera.lookAt(0, 0, 0)
        // this.scene.background = new THREE.Color()
        // this.control = new PointerLockControls(this.camera, this.renderer.domElement);
        // this.control.object.position.set(0, 0.3, 61.5);
        // this.control.object.lookAt(0, 0, 0);
        this.renderer.setAnimationLoop(this.animate.bind(this))
        this.raycaster = new THREE.Raycaster()
    }

    addMap() {
        const texture = new THREE.TextureLoader().load('/textures/hub.jpg')
        texture.colorSpace = THREE.SRGBColorSpace
        const geometry = new THREE.PlaneGeometry(63, 50)
        
        // geometry.position.set(0, 20, 0)
        // geometry.rotateX(Math.PI / 2)
        // const material = new THREE.MeshStandardMaterial({ map: texture, depthWrite: false, color: 0x404040, roughness: 0.85 })
        const material = new THREE.MeshBasicMaterial({map: texture, transparent: true})
        this.map = new THREE.Mesh(geometry, material)
        this.map.userData.physics = {mass: 0}
        // this.map.receiveShadow = true
        this.scene.add(this.map)

        const texture2 = new THREE.TextureLoader().load('/textures/hub3.png')
        texture2.colorSpace = THREE.SRGBColorSpace
        const geometry2 = new THREE.PlaneGeometry(10, 10)
        const material2 = new THREE.MeshBasicMaterial({map: texture2, transparent: true})
        const pizza = new THREE.Mesh(geometry2, material2)
        pizza.position.set(9.6, - 5.6, 0)
        pizza.lookAt(this.camera.position)
        this.pizza = pizza
        this.scene.add(pizza)
        const edges = new THREE.EdgesGeometry(geometry2);
        const lineMaterial = new THREE.LineBasicMaterial({color: 0x000000})
        this.lineMaterial = lineMaterial
        const border = new THREE.LineSegments(edges, lineMaterial)
        border.position.copy(pizza.position)
        this.scene.add(border)

        const arrowHelper = new THREE.ArrowHelper(
            this.raycaster.ray.direction.clone().normalize(),
            this.raycaster.ray.origin,
            20,
            0xff0000
        )
        console.log("ArrowHelper origin:", this.raycaster.ray.origin);
        console.log("ArrowHelper direction:", this.raycaster.ray.direction);
        this.scene.add(arrowHelper)
    }

    addPlayer() {
        const texture = new THREE.TextureLoader().load('/textures/male0.png')
        texture.colorSpace = THREE.SRGBColorSpace
        const geometry = new THREE.PlaneGeometry(3, 6)
        const material = new THREE.MeshBasicMaterial({map: texture, transparent:true})
        this.player = new THREE.Mesh(geometry, material)
        this.scene.add(this.player)

        this.characterController = this.physics.world.createCharacterController(0.01)
        this.characterController.setApplyImpulsesToDynamicBodies(true)
        this.characterController.setCharacterMass(3)
        const colliderDesc = this.physics.RAPIER.ColliderDesc.capsule(0.5, 0.3).setTranslation(0, 0.8, 12)
        this.player.userData.collider = this.physics.world.createCollider(colliderDesc)
    }

    addEventListeners() {
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

        document.addEventListener('mouseover', event => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
            this.mouse.y = -((event.clientY / window.innerHeight) * 2 - 1)
            console.log("Mouse NDC:", this.mouse.x, this.mouse.y);
            this.raycaster.setFromCamera(this.mouse, this.camera)
            const dir = this.raycaster.ray.direction
            console.log("Ray direction:", dir);
            // const tempY = dir.y
            // dir.y = dir.z
            // dir.z = tempY
            const intersects = this.raycaster.intersectObject(this.pizza)
            if (intersects.length > 0) {
                this.lineMaterial.color.set(0xffff00)
                document.body.style.cursor = 'pointer'
            } else {
                this.lineMaterial.color.set(0xffff00)
                document.body.style.cursor = 'default'
            }
        })
    }

    async setupPhysics() {
        this.physics = await RapierPhysics()
        this.physicsHelper = new RapierHelper(this.physics.world)
        this.scene.add(this.physicsHelper)
        this.physics.addScene(this.scene)
        this.addPlayer()
    }

    animate() {
        if (this.physicsHelper) {
            this.physicsHelper.update()
        }

        this.renderer.render(this.scene, this.camera)

        if (this.characterController && this.physics) {
            const deltaTime = 1 / 60;
            // Character movement
            const speed = 9.5 * deltaTime;
            const moveVector = new this.physics.RAPIER.Vector3( this.movement.right * speed, 0, - this.movement.forward * speed );

            this.characterController.computeColliderMovement( this.player.userData.collider, moveVector );

            // Read the result.
            const translation = this.characterController.computedMovement();
            const position = this.player.userData.collider.translation();

            position.x += translation.x;
            position.y += -translation.z;
            position.z += translation.y;

            this.player.userData.collider.setTranslation( position );

            // Sync Three.js mesh with Rapier collider
            this.player.position.set( position.x, position.y, position.z );
        }
    }
}