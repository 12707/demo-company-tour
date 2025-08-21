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
        this.moveableAreas = [
            // entrance main path
            { type: 'rectangle', x1: -11.60, y1: 1.6, x2: 14.82, y2: -45.62 }, 
            { type: 'rectangle', x1: -14.35, y1: -45.62, x2: -3.69, y2: -65.94 }, 
            { type: 'rectangle', x1: 4.00, y1: -45.62, x2: 14.35, y2: -65.15 }, 
            { type: 'rectangle', x1: 14.35, y1: -59.19, x2: 23.00, y2: -65.15 }, 
            { type: 'rectangle', x1: -22.31, y1: -59.10, x2: -14.35, y2: -65.15 }, 
            // center circle path
            { type: 'rectangle', x1: -11.60, y1: 15.6, x2: 14.82, y2: -45.62 }, 
            // { type: 'circle', x: 0, y: 38.40, radius: 23.6 },
            { type: 'ellipsRing', x: -0.4, y: 32.80, innerLongRadius: 32.6, outerLongRadius: 46, innerShortRadius: 18, outerShortRadius: 24 },
            
        ]
    }

    init() {
        this.setupScene()
        this.render()
        this.setupEventListeners()
        this.animate()
    }

    init2() {
        this.setupScene2()
        this.redner2()
        this.setupEventListeners2()
        this.animate()
    }

    setupScene() {
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.container.appendChild(this.renderer.domElement)
        this.camera.position.set(0, 0, 95)
        this.camera.lookAt(new THREE.Vector3(0, 0, 0))
    }

    setupScene2() {
        this.camera.position.set(0, -10, 100)
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
                this.init2()
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

    render() {
        this.addMap()
        this.addHighlightRegion()
        this.addPlayer()
    }

    redner2() {
        this.addMap2()
        this.addExitSign()
        this.addBlock()
        this.addPlayer()
    }

    animate() {
        requestAnimationFrame(() => this.animate())
        const direction = this.getDirectionVector()
        if (direction.length() > 0) {
            console.log(`current player's position: ${this.playerMesh.position.x}, ${this.playerMesh.position.y}, ${this.playerMesh.position.z}`)
            const tempPosition = this.playerMesh.position.clone().add(direction.multiplyScalar(this.walkSpeed))
            const isMoveable = this.isMoveableArea(tempPosition.x, tempPosition.y)
            if (isMoveable) {
            // if (true) {
                this.playerMesh.position.copy(tempPosition)
            } else {
                console.log('Blocked by a non-moveable area')
            }
            // this.playerMesh.position.add(direction.multiplyScalar(this.walkSpeed))
        }

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

    addMap2() {
        const textureLoader = new THREE.TextureLoader()
        const mapTexture = textureLoader.load('/textures/room.jpg')
        mapTexture.colorSpace = THREE.SRGBColorSpace
        const mapGeometry = new THREE.PlaneGeometry(300, 180)
        const mapMaterial = new THREE.MeshBasicMaterial({map: mapTexture})
        this.mapMesh = new THREE.Mesh(mapGeometry, mapMaterial)
        this.scene.add(this.mapMesh)
    }

    addExitSign() {
        const textureLoader = new THREE.TextureLoader()
        const exitArrowTexture = textureLoader.load('/textures/arrowdown.png')
        exitArrowTexture.colorSpace = THREE.SRGBColorSpace
        const exitArrowGeometry = new THREE.PlaneGeometry(4, 8)
        const exitArrowMaterial = new THREE.MeshBasicMaterial({map: exitArrowTexture, transparent: true})
        this.roomExitArrowMesh = new THREE.Mesh(exitArrowGeometry, exitArrowMaterial)
        this.roomExitArrowMesh.position.set(-38, -50, 0)
        this.scene.add(this.roomExitArrowMesh)
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
        const playerGeometry = new THREE.PlaneGeometry(10, 18)
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
            }
            // Additional area types can be added here
        }
        return false
    }
}