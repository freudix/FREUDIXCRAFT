import * as THREE from 'three';
import { BlockType } from '../blocks/BlockTypes';
import type { ChunkManager } from '../world/ChunkManager';

export class PlayerController {
  private camera: THREE.PerspectiveCamera;
  private chunkManager: ChunkManager;
  
  private velocity = new THREE.Vector3();
  private direction = new THREE.Vector3();
  private rotation = new THREE.Euler(0, 0, 0, 'YXZ');
  
  private keys = new Map<string, boolean>();
  private mouseX = 0;
  private mouseY = 0;
  private isPointerLocked = false;
  
  // Movement settings
  private readonly WALK_SPEED = 5;
  private readonly RUN_SPEED = 10;
  private readonly JUMP_VELOCITY = 8;
  private readonly GRAVITY = 20;
  private readonly FRICTION = 10;
  
  // Flight settings
  private isFlying = false;
  private readonly FLY_SPEED = 15;
  
  // Physics
  private onGround = false;
  private inWater = false;

  constructor(camera: THREE.PerspectiveCamera, chunkManager: ChunkManager) {
    this.camera = camera;
    this.chunkManager = chunkManager;
    
    this.initEventListeners();
    this.requestPointerLock();
  }

  private initEventListeners() {
    // Keyboard events
    document.addEventListener('keydown', (e) => {
      this.keys.set(e.code, true);
      
      if (e.code === 'Space') {
        e.preventDefault();
      }
    });
    
    document.addEventListener('keyup', (e) => {
      this.keys.set(e.code, false);
    });
    
    // Mouse events
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('click', this.requestPointerLock.bind(this));
    
    // Pointer lock events
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === document.body;
    });
  }

  private requestPointerLock() {
    if (!this.isPointerLocked) {
      document.body.requestPointerLock();
    }
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.isPointerLocked) return;
    
    const sensitivity = 0.002;
    
    this.mouseX -= event.movementX * sensitivity;
    this.mouseY -= event.movementY * sensitivity;
    
    // Clamp vertical rotation
    this.mouseY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.mouseY));
    
    this.rotation.set(this.mouseY, this.mouseX, 0);
    this.camera.rotation.copy(this.rotation);
  }

  public update(deltaTime: number) {
    const dt = Math.min(deltaTime / 1000, 1/30); // Cap delta time
    
    this.handleInput();
    this.updatePhysics(dt);
    this.checkCollisions();
  }

  private handleInput() {
    if (!this.isPointerLocked) return;
    
    const forward = this.keys.get('KeyW') || false;
    const backward = this.keys.get('KeyS') || false;
    const left = this.keys.get('KeyA') || false;
    const right = this.keys.get('KeyD') || false;
    const jump = this.keys.get('Space') || false;
    const run = this.keys.get('ShiftLeft') || false;
    
    // Calculate movement direction
    this.direction.set(0, 0, 0);
    
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);
    
    const right_vec = new THREE.Vector3();
    right_vec.crossVectors(cameraDirection, this.camera.up).normalize();
    
    if (forward) this.direction.add(cameraDirection);
    if (backward) this.direction.sub(cameraDirection);
    if (left) this.direction.sub(right_vec);
    if (right) this.direction.add(right_vec);
    
    // Normalize for diagonal movement
    if (this.direction.length() > 0) {
      this.direction.normalize();
      
      const speed = this.isFlying ? this.FLY_SPEED : (run ? this.RUN_SPEED : this.WALK_SPEED);
      this.direction.multiplyScalar(speed);
    }
    
    // Handle jumping/flying
    if (jump) {
      if (this.isFlying) {
        this.velocity.y = this.FLY_SPEED;
      } else if (this.onGround) {
        this.velocity.y = this.JUMP_VELOCITY;
        this.onGround = false;
      }
    } else if (this.isFlying && this.keys.get('ShiftLeft')) {
      this.velocity.y = -this.FLY_SPEED;
    }
  }

  private updatePhysics(deltaTime: number) {
    // Apply horizontal movement
    if (!this.isFlying) {
      // Ground/water movement
      const friction = this.inWater ? this.FRICTION * 0.5 : this.FRICTION;
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, this.direction.x, deltaTime * friction);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, this.direction.z, deltaTime * friction);
      
      // Apply gravity
      this.velocity.y -= this.GRAVITY * deltaTime;
      
      // Water physics
      if (this.inWater) {
        this.velocity.y *= 0.98; // Water resistance
      }
    } else {
      // Flying movement
      this.velocity.x = this.direction.x;
      this.velocity.z = this.direction.z;
      
      if (!this.keys.get('Space') && !this.keys.get('ShiftLeft')) {
        this.velocity.y *= 0.9; // Slow vertical movement when not actively flying up/down
      }
    }
    
    // Apply velocity to position
    const movement = this.velocity.clone().multiplyScalar(deltaTime);
    this.camera.position.add(movement);
  }

  private checkCollisions() {
    const position = this.camera.position.clone();
    const playerHeight = 1.8;
    const playerRadius = 0.3;
    
    // Check ground collision
    const groundY = this.getGroundHeight(position.x, position.z);
    
    if (position.y - playerHeight / 2 <= groundY) {
      this.camera.position.y = groundY + playerHeight / 2;
      if (this.velocity.y < 0) {
        this.velocity.y = 0;
        this.onGround = true;
      }
    } else {
      this.onGround = false;
    }
    
    // Check for water
    this.inWater = this.isInWater(position.x, position.y, position.z);
    
    // Horizontal collision detection (simplified)
    const testPositions = [
      { x: position.x + playerRadius, z: position.z },
      { x: position.x - playerRadius, z: position.z },
      { x: position.x, z: position.z + playerRadius },
      { x: position.x, z: position.z - playerRadius }
    ];
    
    for (const testPos of testPositions) {
      const blockY = Math.floor(position.y - playerHeight / 2) + 1;
      const blockType = this.chunkManager.getBlock(
        Math.floor(testPos.x),
        blockY,
        Math.floor(testPos.z)
      );
      
      if (blockType !== BlockType.AIR && blockType !== BlockType.WATER) {
        // Simple push-back collision
        const pushDirection = new THREE.Vector3(
          position.x - testPos.x,
          0,
          position.z - testPos.z
        ).normalize().multiplyScalar(0.1);
        
        this.camera.position.add(pushDirection);
      }
    }
  }

  private getGroundHeight(x: number, z: number): number {
    // Find the highest solid block at this position
    for (let y = 200; y >= 0; y--) {
      const blockType = this.chunkManager.getBlock(Math.floor(x), y, Math.floor(z));
      if (blockType !== BlockType.AIR && blockType !== BlockType.WATER) {
        return y + 1;
      }
    }
    return 0;
  }

  private isInWater(x: number, y: number, z: number): boolean {
    const blockType = this.chunkManager.getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
    return blockType === BlockType.WATER;
  }

  public toggleFly() {
    this.isFlying = !this.isFlying;
    console.log(this.isFlying ? '🚁 Flying enabled' : '🚶 Flying disabled');
  }
}