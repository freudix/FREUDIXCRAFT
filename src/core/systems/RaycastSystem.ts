import * as THREE from 'three';
import { BlockType } from '../blocks/BlockTypes';
import type { ChunkManager } from '../world/ChunkManager';

export class RaycastSystem {
  private camera: THREE.PerspectiveCamera;
  private chunkManager: ChunkManager;
  private raycaster = new THREE.Raycaster();
  
  // Interaction settings
  private readonly MAX_REACH = 8;
  private selectedBlock: { x: number; y: number; z: number; normal: THREE.Vector3 } | null = null;
  
  // Events
  public onBlockBreak?: (x: number, y: number, z: number) => void;
  public onBlockPlace?: (x: number, y: number, z: number) => void;
  
  // Outline mesh for selected block
  private outlineMesh?: THREE.LineSegments;

  constructor(camera: THREE.PerspectiveCamera, chunkManager: ChunkManager) {
    this.camera = camera;
    this.chunkManager = chunkManager;
    
    this.initEventListeners();
    this.createOutlineMesh();
  }

  private initEventListeners() {
    document.addEventListener('mousedown', (e) => {
      if (document.pointerLockElement !== document.body) return;
      
      if (e.button === 0) { // Left click - break block
        this.breakBlock();
      } else if (e.button === 2) { // Right click - place block
        this.placeBlock();
      }
    });
    
    // Prevent context menu
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  private createOutlineMesh() {
    // Create wireframe box geometry
    const geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02));
    const material = new THREE.LineBasicMaterial({ 
      color: 0x000000, 
      linewidth: 2,
      transparent: true,
      opacity: 0.8
    });
    
    this.outlineMesh = new THREE.LineSegments(geometry, material);
    this.outlineMesh.visible = false;
  }

  public update() {
    this.updateRaycast();
  }

  private updateRaycast() {
    // Cast ray from camera
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    
    this.raycaster.set(this.camera.position, direction);
    this.raycaster.far = this.MAX_REACH;
    
    // Perform voxel raycast
    const hit = this.voxelRaycast();
    
    if (hit) {
      this.selectedBlock = hit;
      this.showOutline(hit.x, hit.y, hit.z);
    } else {
      this.selectedBlock = null;
      this.hideOutline();
    }
  }

  private voxelRaycast(): { x: number; y: number; z: number; normal: THREE.Vector3 } | null {
    const origin = this.camera.position.clone();
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    
    const step = 0.1;
    const maxDistance = this.MAX_REACH;
    
    for (let distance = 0; distance < maxDistance; distance += step) {
      const testPos = origin.clone().add(direction.clone().multiplyScalar(distance));
      const blockPos = {
        x: Math.floor(testPos.x),
        y: Math.floor(testPos.y),
        z: Math.floor(testPos.z)
      };
      
      const blockType = this.chunkManager.getBlock(blockPos.x, blockPos.y, blockPos.z);
      
      if (blockType !== BlockType.AIR && blockType !== BlockType.WATER) {
        // Calculate face normal
        const blockCenter = new THREE.Vector3(blockPos.x + 0.5, blockPos.y + 0.5, blockPos.z + 0.5);
        const hitPoint = testPos.clone();
        const localHit = hitPoint.sub(blockCenter);
        
        // Determine which face was hit
        const absX = Math.abs(localHit.x);
        const absY = Math.abs(localHit.y);
        const absZ = Math.abs(localHit.z);
        
        let normal: THREE.Vector3;
        if (absX > absY && absX > absZ) {
          normal = new THREE.Vector3(localHit.x > 0 ? 1 : -1, 0, 0);
        } else if (absY > absZ) {
          normal = new THREE.Vector3(0, localHit.y > 0 ? 1 : -1, 0);
        } else {
          normal = new THREE.Vector3(0, 0, localHit.z > 0 ? 1 : -1);
        }
        
        return {
          x: blockPos.x,
          y: blockPos.y,
          z: blockPos.z,
          normal: normal
        };
      }
    }
    
    return null;
  }

  private showOutline(x: number, y: number, z: number) {
    if (!this.outlineMesh) return;
    
    if (!this.outlineMesh.parent) {
      this.camera.parent?.add(this.outlineMesh);
    }
    
    this.outlineMesh.position.set(x + 0.5, y + 0.5, z + 0.5);
    this.outlineMesh.visible = true;
  }

  private hideOutline() {
    if (this.outlineMesh) {
      this.outlineMesh.visible = false;
    }
  }

  private breakBlock() {
    if (!this.selectedBlock) return;
    
    const { x, y, z } = this.selectedBlock;
    const blockType = this.chunkManager.getBlock(x, y, z);
    
    if (blockType !== BlockType.AIR) {
      console.log(`🔨 Breaking ${BlockType[blockType]} at (${x}, ${y}, ${z})`);
      this.onBlockBreak?.(x, y, z);
    }
  }

  private placeBlock() {
    if (!this.selectedBlock) return;
    
    const { x, y, z, normal } = this.selectedBlock;
    const placePos = {
      x: x + normal.x,
      y: y + normal.y,
      z: z + normal.z
    };
    
    // Check if position is not occupied
    const existingBlock = this.chunkManager.getBlock(placePos.x, placePos.y, placePos.z);
    if (existingBlock === BlockType.AIR) {
      console.log(`🧱 Placing block at (${placePos.x}, ${placePos.y}, ${placePos.z})`);
      this.onBlockPlace?.(placePos.x, placePos.y, placePos.z);
    }
  }
}