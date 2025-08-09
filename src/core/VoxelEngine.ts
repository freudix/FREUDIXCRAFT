import * as THREE from 'three';
import { ChunkManager } from './world/ChunkManager';
import { PlayerController } from './player/PlayerController';
import { RaycastSystem } from './systems/RaycastSystem';
import { LightingSystem } from './systems/LightingSystem';
import { BlockType } from './blocks/BlockTypes';
import { HUD } from './ui/HUD';

export class VoxelEngine {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private chunkManager: ChunkManager;
  private playerController: PlayerController;
  private raycastSystem: RaycastSystem;
  private lightingSystem: LightingSystem;
  private hud: HUD;
  
  private isRunning = false;
  private lastTime = 0;
  private frameCount = 0;
  private fpsTime = 0;
  
  // Debug
  private wireframe = false;
  private stats = { fps: 0, chunks: 0, triangles: 0 };

  constructor(canvas: HTMLCanvasElement) {
    this.initRenderer(canvas);
    this.initScene();
    this.initSystems();
    this.initEventListeners();
    this.start();
  }

  private initRenderer(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: false,
      powerPreference: 'high-performance'
    });
    
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x87CEEB, 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Configure depth and culling
    this.renderer.sortObjects = true;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  }

  private initScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x87CEEB, 20, 60); // Much closer fog
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(8, 100, 8);
  }

  private initSystems() {
    this.lightingSystem = new LightingSystem(this.scene);
    this.chunkManager = new ChunkManager(this.scene, this.lightingSystem);
    this.playerController = new PlayerController(this.camera, this.chunkManager);
    this.raycastSystem = new RaycastSystem(this.camera, this.chunkManager);
    this.hud = new HUD();
    
    // Setup player raycast interactions
    this.raycastSystem.onBlockBreak = (x, y, z) => {
      this.chunkManager.setBlock(x, y, z, BlockType.AIR);
    };
    
    this.raycastSystem.onBlockPlace = (x, y, z) => {
      const blockType = this.hud.getSelectedBlock();
      this.chunkManager.setBlock(x, y, z, blockType);
    };
  }

  private initEventListeners() {
    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyF') {
        this.playerController.toggleFly();
      } else if (e.code === 'KeyL') {
        this.toggleWireframe();
      } else if (e.code === 'Equal' || e.code === 'NumpadAdd') {
        // Increase render distance
        const current = this.chunkManager.getRenderDistance();
        this.chunkManager.setRenderDistance(current + 1);
      } else if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
        // Decrease render distance
        const current = this.chunkManager.getRenderDistance();
        this.chunkManager.setRenderDistance(current - 1);
      }
    });

    // HUD events
    document.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.hud.scrollBlocks(e.deltaY > 0 ? 1 : -1);
    });
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private toggleWireframe() {
    this.wireframe = !this.wireframe;
    this.chunkManager.setWireframe(this.wireframe);
  }

  private updateStats(deltaTime: number) {
    this.frameCount++;
    this.fpsTime += deltaTime;
    
    if (this.fpsTime >= 1000) {
      this.stats = {
        fps: Math.round(this.frameCount * 1000 / this.fpsTime),
        chunks: this.chunkManager.getLoadedChunksCount(),
        triangles: this.renderer.info.render.triangles
      };
      
      this.hud.updateStats(this.stats);
      
      this.frameCount = 0;
      this.fpsTime = 0;
    }
  }

  private update(deltaTime: number) {
    this.playerController.update(deltaTime);
    this.chunkManager.update(this.camera.position);
    this.raycastSystem.update();
    this.lightingSystem.update(deltaTime);
    this.updateStats(deltaTime);
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  private gameLoop = (currentTime: number) => {
    if (!this.isRunning) return;
    
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    this.update(deltaTime);
    this.render();
    
    requestAnimationFrame(this.gameLoop);
  };

  public start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
    
    console.log('🌍 FreudixCraft Engine Started');
  }

  public stop() {
    this.isRunning = false;
    console.log('⏹️ FreudixCraft Engine Stopped');
  }

  public destroy() {
    this.stop();
    this.renderer.dispose();
    this.chunkManager.destroy();
    this.hud.destroy();
  }
}