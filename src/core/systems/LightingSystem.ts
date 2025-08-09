import * as THREE from 'three';
import type { Chunk } from '../world/Chunk';

export class LightingSystem {
  private scene: THREE.Scene;
  private sun: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  
  private timeOfDay = 0.25; // Start at sunrise
  private readonly DAY_LENGTH = 120; // seconds for a full day cycle
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initLighting();
  }

  private initLighting() {
    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(this.ambientLight);
    
    // Directional light (sun)
    this.sun = new THREE.DirectionalLight(0xffffff, 0.8);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.width = 2048;
    this.sun.shadow.mapSize.height = 2048;
    this.sun.shadow.camera.near = 0.5;
    this.sun.shadow.camera.far = 500;
    this.sun.shadow.camera.left = -100;
    this.sun.shadow.camera.right = 100;
    this.sun.shadow.camera.top = 100;
    this.sun.shadow.camera.bottom = -100;
    
    this.scene.add(this.sun);
    
    this.updateSunPosition();
  }

  public update(deltaTime: number) {
    // Update day/night cycle
    this.timeOfDay += deltaTime / (this.DAY_LENGTH * 1000);
    if (this.timeOfDay > 1) this.timeOfDay -= 1;
    
    this.updateSunPosition();
    this.updateSkyColor();
  }

  private updateSunPosition() {
    // Calculate sun position based on time of day
    const angle = this.timeOfDay * Math.PI * 2 - Math.PI / 2;
    const sunHeight = Math.sin(angle);
    const sunDistance = 200;
    
    this.sun.position.set(
      Math.cos(angle) * sunDistance,
      sunHeight * sunDistance,
      0
    );
    
    // Update sun intensity based on height
    const intensity = Math.max(0, sunHeight);
    this.sun.intensity = intensity * 0.6 + 0.4;
    
    // Update sun color
    if (sunHeight < 0.1 && sunHeight > -0.1) {
      // Sunrise/sunset
      this.sun.color.setRGB(1, 0.7, 0.4);
    } else {
      this.sun.color.setRGB(1, 1, 0.9);
    }
  }

  private updateSkyColor() {
    const angle = this.timeOfDay * Math.PI * 2 - Math.PI / 2;
    const sunHeight = Math.sin(angle);
    
    let skyColor: THREE.Color;
    
    if (sunHeight > 0.3) {
      // Day time
      skyColor = new THREE.Color(0x87CEEB);
    } else if (sunHeight > -0.3) {
      // Sunrise/sunset
      const t = (sunHeight + 0.3) / 0.6;
      skyColor = new THREE.Color().lerpColors(
        new THREE.Color(0x191970), // Night blue
        new THREE.Color(0xFF6347), // Sunset orange
        t
      );
    } else {
      // Night time
      skyColor = new THREE.Color(0x191970);
    }
    
    // Update renderer clear color and fog
    const renderer = this.scene.children[0] as any; // Hack to get renderer
    if (this.scene.fog) {
      (this.scene.fog as THREE.Fog).color = skyColor;
    }
  }

  public calculateChunkLighting(chunk: Chunk) {
    const CHUNK_SIZE = 16;
    const CHUNK_HEIGHT = 256;
    
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        let lightLevel = 15;
        
        // Propagate sunlight downward
        for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
          const blockType = chunk.getBlock(x, y, z);
          
          if (blockType === 0) { // Air
            chunk.setLightLevel(x, y, z, lightLevel);
          } else {
            // Solid block - set light level and reduce for below
            chunk.setLightLevel(x, y, z, Math.max(8, lightLevel));
            lightLevel = Math.max(2, lightLevel - 8);
          }
        }
      }
    }
  }

  public getTimeOfDay(): number {
    return this.timeOfDay;
  }

  public setTimeOfDay(time: number) {
    this.timeOfDay = Math.max(0, Math.min(1, time));
    this.updateSunPosition();
    this.updateSkyColor();
  }
}