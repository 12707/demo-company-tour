import * as THREE from 'three'

export class App {
    constructor() {
        this.container = document.getElementById('scene-container');
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
        this.moveTarget = null
        this.moveForward = false
        this.moveBackward = false
        this.moveLeft = false
        this.moveRight = false
    }

    init() {
        this.setupScene()
        this.render()
        this.setupEventListeners()
        this.animate()
    }

    setupScene() {
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.container.appendChild(this.renderer.domElement)
        this.camera.position.set(0, 0, 95)
        this.camera.lookAt(new THREE.Vector3(0, 0, 0))
    }

    setupEventListeners() {
        document.addEventListener('keydown', (event) => {
            if ( event.key === 'w' || event.key === 'ArrowUp' ) {
                this.moveForward = true
            } else if ( event.key === 's' || event.key === 'ArrowDown' ) {
                this.moveBackward = true
            } else if ( event.key === 'a' || event.key === 'ArrowLeft' ) {
                this.moveLeft = true
            } else if ( event.key === 'd' || event.key === 'ArrowRight' ) {
                this.moveRight = true
            } else if (event.code === 'ShiftLeft') {
                this.walkSpeed = 0.8
            }
            // const newPosition = this.playerMesh.position.clone()
            // if ( event.key === 'w' || event.key === 'ArrowUp' ) {
            //     newPosition.y += 1
            // }
            // if ( event.key === 's' || event.key === 'ArrowDown' ) {
            //     newPosition.y -= 1
            // }
            // if ( event.key === 'a' || event.key === 'ArrowLeft' ) {
            //     newPosition.x -= 1
            // }
            // if ( event.key === 'd' || event.key === 'ArrowRight' ) {
            //     newPosition.x += 1
            // }
            // this.moveTarget = newPosition
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
            } else if (event.code === 'ShiftLeft') {
                this.walkSpeed = 0.4
            }
            
        })

        document.addEventListener('click', (event) => {
            // this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
            // this.mouse.y = -((event.clientY / window.innerHeight) * 2 - 1)
            // this.raycaster.setFromCamera(this.mouse, this.camera)
            this.mouse = this.calcMouse(event)
            this.setupRaycaster(this.mouse)
            const intersects = this.raycaster.intersectObject(this.mapMesh)
            if (intersects.length > 0) {
                this.moveTarget = intersects[0].point
            }
        })

        document.addEventListener('mouseover', event => {
            this.mouse = this.calcMouse(event)
            this.setupRaycaster(this.mouse)
            const intersects = this.raycaster.intersectObject(this.highlightMesh)
            if (intersects.length > 0) {
                this.lineMaterial.color.set(0xffff00)
                this.lineMaterial.opacity = 100
                document.body.style.cursor = 'pointer'
            } else {
                this.lineMaterial.color.set(0xffffff)
                this.lineMaterial.opacity = 0
                document.body.style.cursor = 'default'
            }
        })

        document.addEventListener('click', event => {
            this.mouse = this.calcMouse(event)
            this.setupRaycaster(this.mouse)
            const intersects = this.raycaster.intersectObject(this.highlightMesh)
            if (intersects.length > 0) {
                console.log('The highlight region is clicked!')
            }
        })
    }

    render() {
        this.addMap()
        this.addHighlightRegion()
        this.addPlayer()
    }

    animate() {
        requestAnimationFrame(() => this.animate())

        const direction = this.getDirectionVector()
        if (direction.length() > 0) {
            this.playerMesh.position.add(direction.multiplyScalar(this.walkSpeed))
        }

        // if (this.moveTarget) {
        //     // const lerpSpeed = 0.3
        //     // this.playerMesh.position.lerp(this.moveTarget, lerpSpeed)
        //     // if (this.playerMesh.position.distanceTo(this.moveTarget) < lerpSpeed) {
        //     //     this.moveTarget = null
        //     //     this.playerMesh.position.copy(this.moveTarget)
        //     // }
        //     const delta = new THREE.Vector3(
        //         this.moveTarget.x - this.playerMesh.position.x,
        //         this.moveTarget.y - this.playerMesh.position.y,
        //         0
        //     )
        //     if (delta.length() < 0.1) {
        //         if (this.playerMesh) {
        //             this.playerMesh.position.copy(this.moveTarget)
        //         }
        //         this.moveTarget = null
        //     } else {
        //         delta.normalize()
        //         const step = Math.min(delta.length(), this.walkSpeed)
        //         this.playerMesh.position.add(delta.multiplyScalar(step))
        //     }
        // }

        this.renderer.render(this.scene, this.camera)
    }

    addMap() {
        const textureLoader = new THREE.TextureLoader()
        const mapTexture = textureLoader.load('/textures/hub.jpg')
        mapTexture.colorSpace = THREE.SRGBColorSpace
        const mapGeometry = new THREE.PlaneGeometry(300, 200)
        const mapMaterial = new THREE.MeshBasicMaterial({map: mapTexture})
        this.mapMesh = new THREE.Mesh(mapGeometry, mapMaterial)
        this.scene.add(this.mapMesh)
    }

    addHighlightRegion() {
        const textureLoader = new THREE.TextureLoader()
        const highlightTexture = textureLoader.load('/textures/hub3.png')
        highlightTexture.colorSpace = THREE.SRGBColorSpace
        const highlightGeometry = new THREE.PlaneGeometry(48, 38)
        const highlightMaterial = new THREE.MeshBasicMaterial({map: highlightTexture, transparent: true, opacity: 0})
        this.highlightMesh = new THREE.Mesh(highlightGeometry, highlightMaterial)
        this.highlightMesh.position.set(46, -22.5, 0)
        this.scene.add(this.highlightMesh)
        const edges = new THREE.EdgesGeometry(highlightGeometry);
        this.lineMaterial = new THREE.LineBasicMaterial({transparent: true, opacity: 0})
        const border = new THREE.LineSegments(edges, this.lineMaterial)
        border.position.copy(this.highlightMesh.position)

        this.scene.add(border)
    }

    addPlayer() {
        const textureLoader = new THREE.TextureLoader()
        const playerTexture = textureLoader.load('/textures/male0.png')
        playerTexture.colorSpace = THREE.SRGBColorSpace
        const playerGeometry = new THREE.PlaneGeometry(6, 12)
        const palyerMaterial = new THREE.MeshBasicMaterial({map: playerTexture, transparent: true})
        this.playerMesh = new THREE.Mesh(playerGeometry, palyerMaterial)
        this.playerMesh.position.set(0, 0, 1)
        this.scene.add(this.playerMesh)
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
        if (this.moveForward) direction.y += 1
        if (this.moveBackward) direction.y -= 1
        if (this.moveLeft) direction.x -= 1
        if (this.moveRight) direction.x += 1

        if (direction.length() > 0) {
            direction.normalize()
        }

        return direction
    }
}