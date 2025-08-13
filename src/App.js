import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

export class App {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.controls = null;
    this.clock = new THREE.Clock();
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.player = null;
    this.regions = [];
    this.currentScene = 'main';
    this.backBtn = null;
    this.highlightedRegion = null;
    this.exitZone = null;
    this.labelElements = [];
    this.instructions = null;
  }

  init() {
    this.setupScene();
    this.setupControls();
    this.setupEventListeners();
    this.createMainScene();
    this.animate();
  }

  setupScene() {
    // 设置渲染器
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.setClearColor(0xf0f0f0);
    document.getElementById('scene-container').appendChild(this.renderer.domElement);

    // 设置相机位置
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    // 光照设置
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    // this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(0, 10, 0);
    directionalLight.castShadow = true;
    // this.scene.add(directionalLight);

    // 获取UI元素
    this.backBtn = document.getElementById('back-btn');
    this.instructions = document.getElementById('instructions');
  }

  setupControls() {
    this.controls = new PointerLockControls(this.camera, this.renderer.domElement);
    
    // 点击锁定指针控制
    const blocker = document.getElementById('scene-container');
    blocker.addEventListener('click', () => {
      this.controls.lock();
      if (this.instructions) this.instructions.style.display = 'none';
    });
  }

  setupEventListeners() {
    // 键盘控制
    document.addEventListener('keydown', (event) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.moveForward = true;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          this.moveLeft = true;
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.moveBackward = true;
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.moveRight = true;
          break;
        case 'Enter':
          if (this.highlightedRegion) {
            this.enterRegionScene(this.highlightedRegion.userData.name);
          }
          break;
      }
    });

    document.addEventListener('keyup', (event) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.moveForward = false;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          this.moveLeft = false;
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.moveBackward = false;
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.moveRight = false;
          break;
      }
    });

    // 窗口大小调整
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // 返回按钮事件
    this.backBtn.addEventListener('click', () => {
      this.returnToMainScene();
    });
  }

  createMainScene() {
    // 清除现有场景
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
    
    // 清除标签
    this.labelElements.forEach(el => el.remove());
    this.labelElements = [];
    
    this.currentScene = 'main';
    this.backBtn.style.display = 'none';
    this.highlightedRegion = null;

    // 创建浅灰色地板
    const planeGeometry = new THREE.PlaneGeometry(20, 10);
    const planeMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x12ee3f, // 浅灰色
      // side: THREE.DoubleSide,
      // roughness: 0.8
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    this.scene.add(plane);

    // 添加网格辅助线
    const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0xaaaaaa);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);

    // 创建小型圆柱体玩家 (一个格子大小)
    const playerGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 32);
    const playerMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff6600,
      // roughness: 0.3,
      // metalness: 0.8
    });
    this.player = new THREE.Mesh(playerGeometry, playerMaterial);
    this.player.position.set(0, 0.3, 0);
    this.player.castShadow = true;
    this.scene.add(this.player);
    
    // 设置控制器位置
    this.controls.getObject().position.set(0, 1.6, 5);
    this.controls.getObject().lookAt(0, 0, 0);

    // 创建三个区域
    this.createRegion('square', '区域A', 0xdd6666, -6, 0, 3, 3);
    this.createRegion('triangle', '区域B', 0xffff66, 0, 0, 3, 3);
  // The color hex code for 区域B is: rgba(219, 255, 102, 1)
    this.createRegion('circle', '区域C', 0x1166ff, 6, 0, 3, 3);
  }

  createRegion(type, name, color, x, z, width, height) {
    let shape, geometry;
    
    switch (type) {
      case 'square':
        shape = new THREE.Shape()
          .moveTo(-width/2, -height/2)
          .lineTo(width/2, -height/2)
          .lineTo(width/2, height/2)
          .lineTo(-width/2, height/2)
          .lineTo(-width/2, -height/2);
        break;
        
      case 'triangle':
        shape = new THREE.Shape()
          .moveTo(0, -height/2)
          .lineTo(width/2, height/2)
          .lineTo(-width/2, height/2)
          .lineTo(0, -height/2);
        break;
        
      case 'circle':
        const radius = width/2;
        shape = new THREE.Shape();
        shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
        break;
    }
    
    geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      // side: THREE.DoubleSide,
      // transparent: true,
      // opacity: 0.7,
      // roughness: 0.2
    });
    
    const region = new THREE.Mesh(geometry, material);
    region.rotation.x = -Math.PI / 2;
    region.position.set(x, 0.02, z);
    region.userData = { 
      name: name, 
      type: type,
      originalColor: color,
      highlighted: false
    };
    region.receiveShadow = true;
    this.scene.add(region);
    this.regions.push(region);
    
    // 添加区域边框
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x000000, 
      linewidth: 2 
    });
    const border = new THREE.LineSegments(edges, lineMaterial);
    border.rotation.x = -Math.PI / 2;
    border.position.set(x, 0.03, z);
    this.scene.add(border);
    
    // 创建标签
    const label = document.createElement('div');
    label.className = 'region-label';
    label.textContent = name;
    document.body.appendChild(label);
    this.labelElements.push(label);
  }

  highlightRegion(region) {
    if (this.highlightedRegion) {
      this.highlightedRegion.material.color.setHex(this.highlightedRegion.userData.originalColor);
      this.highlightedRegion.userData.highlighted = false;
    }
    
    if (region) {
      region.material.color.setHex(0xffffff);
      region.userData.highlighted = true;
      this.highlightedRegion = region;
    } else {
      this.highlightedRegion = null;
    }
  }

  enterRegionScene(regionName) {
    this.currentScene = regionName;
    this.backBtn.style.display = 'block';
    
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
    
    this.labelElements.forEach(el => el.style.display = 'none');

    const sceneColor = {
      '区域A': 0xffdddd,
      '区域B': 0xddffdd,
      '区域C': 0xddddff
    }[regionName];
    
    const planeGeometry = new THREE.PlaneGeometry(20, 20);
    const planeMaterial = new THREE.MeshBasicMaterial({ 
      color: sceneColor,
      // side: THREE.DoubleSide
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    this.scene.add(plane);

    // 退出区域
    const exitGeometry = new THREE.PlaneGeometry(3, 3);
    const exitMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff0000,
      // side: THREE.DoubleSide,
      // transparent: true,
      // opacity: 0.7
    });
    this.exitZone = new THREE.Mesh(exitGeometry, exitMaterial);
    this.exitZone.rotation.x = -Math.PI / 2;
    this.exitZone.position.set(7, 0.02, 7);
    this.exitZone.userData = { name: 'Exit' };
    this.scene.add(this.exitZone);
    
    const exitLabel = document.createElement('div');
    exitLabel.className = 'region-label';
    exitLabel.textContent = 'Exit';
    exitLabel.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
    document.body.appendChild(exitLabel);
    this.labelElements.push(exitLabel);
    
    const textGeometry = new THREE.TextGeometry(regionName, {
      size: 1.5,
      height: 0.2,
    });
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(-3, 0.1, 0);
    this.scene.add(textMesh);
    
    this.player.position.set(0, 0.3, 0);
    this.controls.getObject().position.set(0, 1.6, 5);
    this.controls.getObject().lookAt(0, 0, 0);
  }

  checkPlayerInRegion() {
    if (this.currentScene === 'main') {
      const playerPos = this.player.position.clone();
      playerPos.y = 0;
      
      for (const region of this.regions) {
        const regionPos = region.position.clone();
        const distance = playerPos.distanceTo(regionPos);
        
        if (distance < 1.8) {
          this.highlightRegion(region);
          return;
        }
      }
      
      this.highlightRegion(null);
    } else {
      const playerPos = this.player.position.clone();
      playerPos.y = 0;
      const exitPos = this.exitZone.position.clone();
      const distance = playerPos.distanceTo(exitPos);
      
      if (distance < 1.5) {
        this.returnToMainScene();
      }
    }
  }

  returnToMainScene() {
    this.createMainScene();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    if (this.controls.isLocked) {
      this.velocity.x -= this.velocity.x * 10.0 * delta;
      this.velocity.z -= this.velocity.z * 10.0 * delta;

      this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
      this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
      this.direction.normalize();

      if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * 5.0 * delta;
      if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * 5.0 * delta;

      this.controls.moveRight(-this.velocity.x * delta);
      this.controls.moveForward(-this.velocity.z * delta);
      
      this.player.position.copy(this.controls.getObject().position);
      this.player.position.y = 0.3;
      
      this.checkPlayerInRegion();
    }

    this.regions.forEach((region, index) => {
      if (this.labelElements[index]) {
        const vector = region.position.clone();
        vector.y += 1;
        vector.project(this.camera);
        
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;
        
        this.labelElements[index].style.left = `${x}px`;
        this.labelElements[index].style.top = `${y}px`;
      }
    });

    this.renderer.render(this.scene, this.camera);
  }
}