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
    }

    init() {
        this.setupScene()
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

        this.stats = new Stats()
        document.getElementById('scene-container').appendChild(this.stats.dom)
    }

    async setupPhysics() {
        this.physics = await RapierPhysics()
        this.physicsHelper = new RapierHelper(this.physics.world)
        this.scene.add(this.physicsHelper)
        this.physics.addScene(this.scene)

    }

    animate() {
        if (this.controls) {
            this.controls.update()
        }
        this.renderer.render(this.scene, this.camera)
        this.stats.update()
    }
}

