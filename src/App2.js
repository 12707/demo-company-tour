import * as THREE from 'three'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'

export class App2 {
    constructor() {
        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        this.objects = []
        this.vertex = new THREE.Vector3()
        this.velocity = new THREE.Vector3()
        this.direction = new THREE.Vector3()
        this.color = new THREE.Color()
        this.moveForward = false
        this.moveBackward = false
        this.moveRight = false
        this.moveLeft = false
        this.canJump = false
        this.prevTime = performance.now()
        this.pointerLockControls = null
        this.prevTime = 0
        this.raycaster = null
    }

    init() {
        this.setupControls()
        this.setupScene()
        this.createMainScene()
        this.setupEventListeners()
        this.animate()
        console.log(`window.innerWidth: ${window.innerWidth}，window.innerHeight: ${window.innerHeight}`)
    }

    setupScene() {
        
        //渲染器
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.renderer.setAnimationLoop(this.animate.bind(this))
        document.getElementById('scene-container').appendChild(this.renderer.domElement)
        //相机
        this.camera.position.set(5, 15, 25)
        this.camera.lookAt(0, 0, 0)
        //光源
        const ambientLight = new THREE.AmbientLight(0X404040)
        this.scene.add(ambientLight)
        const directionalLight = new THREE.DirectionalLight(0xffffff)
        directionalLight.position.set(5, 5, 5)
        this.scene.add(directionalLight)
    }

    setupControls() {
        // this.raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );
        this.pointerLockControls = new PointerLockControls(this.camera, this.renderer.domElement)
        const blocker = document.getElementById('scene-container')
        const ui = document.getElementById('ui')
        blocker.addEventListener('click', () => {
            this.pointerLockControls.lock();
            ui.style.display = 'none';
        });
        this.pointerLockControls.addEventListener('lock', () => {
            ui.style.display = 'none'
        })
        this.pointerLockControls.addEventListener('unlock', () => {
            ui.style.display = 'block'
        })
    }

    createMainScene() {
        let planeGeometry = new THREE.PlaneGeometry(1000, 1000, 50, 50)
        planeGeometry.rotateX(- Math.PI / 2)
        let position = planeGeometry.attributes.position
        for( let i = 0, l = position.count; i < l; i ++) {
            this.vertex.fromBufferAttribute(position, i)
            this.vertex.x += Math.random() * 20 - 10
            this.vertex.y += Math.random() * 2
            this.vertex.z += Math.random() * 20 - 10
            position.setXYZ(i, this.vertex.x, this.vertex.y, this.vertex.z)
        }
        planeGeometry = planeGeometry.toNonIndexed()
        position = planeGeometry.attributes.position
        const colorsFloor = []
        for( let i = 0, l = position.count; i < l; i ++) {
            this.color.setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75, THREE.SRGBColorSpace)
            colorsFloor.push(this.color.r, this.color.g, this.color.b)
        }
        planeGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colorsFloor,3))

        const planeMaterial = new THREE.MeshBasicMaterial({
            vertexColors: true
        })
        const plane = new THREE.Mesh(planeGeometry, planeMaterial)
        this.scene.add(plane)

        // objects
        this.raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10)
        const boxGeometry = new THREE.BoxGeometry(20, 20, 20).toNonIndexed();
        position = boxGeometry.attributes.position
        const colorBox = []
        for (let i = 0, l = position.count; i < l; i ++) {
            this.color.setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75, THREE.SRGBColorSpace)
            colorBox.push(this.color.r, this.color.g, this.color.b)
        }
        boxGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colorBox, 3))

        for(let i = 0; i < 3; i++) {
            const boxMaterial = new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: true})
            boxMaterial.color.setHSL(Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75, THREE.SRGBColorSpace)
            const box = new THREE.Mesh(boxGeometry, boxMaterial)
            box.position.x = Math.floor(Math.random() * 20 - 10) * 20
            // box.position.y = Math.floor(Math.random() * 20) * 20 + 10
            box.position.y += 10
            box.position.z = Math.floor(Math.random() * 20 - 10) * 20
            this.scene.add(box)
            this.objects.push(box)
        }
    }

    setupEventListeners() {
        document.addEventListener('mouseover', event => {
            console.log(`event.clientX: ${event.clientX}，event.clientY: ${event.clientY}`)
        })

        document.addEventListener('keydown', event => {
            switch(event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = true;
                    break

                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = true;
                    break

                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = true;
                    break

                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = true;
                    break

                case 'Space':
                    if (this.canJump) {
                        this.velocity.y += 350
                    }
                    this.canJump = false;
                    break
            }
        })

        document.addEventListener('keyup', event => {
            switch(event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = false;
                    break

                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = false;
                    break

                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = false;
                    break

                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = false;
                    break
            }
        })
    }

    animate() {
        const time = performance.now()
        if (this.pointerLockControls.isLocked) {
            this.raycaster.ray.origin.copy(this.pointerLockControls.getObject().position)
            this.raycaster.ray.origin.y -= 10
            const intersections = this.raycaster.intersectObjects(this.objects, false)
            const onObject = intersections.length > 0

            const delta = (time - this.prevTime) / 1000
            this.velocity.x -= this.velocity.x * 10.0 * delta
            this.velocity.z -= this.velocity.z * 10.0 * delta
            this.velocity.y -= 9.8 * 100 * delta

            this.direction.z = Number(this.moveForward) - Number(this.moveBackward)
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft)
            this.direction.normalize()

            if (this.moveForward || this.moveBackward) {
                this.velocity.z -= this.direction.z * 400.0 * delta
            }

            if (this.moveLeft || this.moveRight) {
                this.velocity.x -= this.direction.x * 400.0 * delta
            }

            if (onObject) {
                this.velocity.y = Math.max(0, this.velocity.y)
                this.canJump = true
            }

            this.pointerLockControls.moveRight(- this.velocity.x * delta)
            this.pointerLockControls.moveForward( - this.velocity.z * delta)
            this.pointerLockControls.getObject().position.y += (this.velocity.y * delta)

            if (this.pointerLockControls.getObject().position.y < 10) {
                this.velocity.y = 0
                this.pointerLockControls.getObject().position.y = 10
                this.canJump = true
            }
        }
        this.prevTime = time
        this.renderer.render(this.scene, this.camera)
    }
}