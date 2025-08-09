# FreudixCraft - Voxel Sandbox Survival Game

Un jeu sandbox voxel de survie en WebGL/Three.js inspiré de Minecraft, entièrement original et modulaire.

## Installation & Lancement

```bash
# Installation des dépendances
npm install

# Lancement en mode développement
npm run dev

# Build pour production
npm run build

# Prévisualisation build
npm run preview
```

## Contrôles

- **WASD** : Déplacement
- **Souris** : Regarder autour
- **Clic gauche** : Casser un bloc
- **Clic droit** : Poser un bloc
- **Molette** : Changer de bloc
- **Espace** : Sauter
- **Shift** : Courir
- **F** : Activer/désactiver le mode vol
- **L** : Activer/désactiver wireframe (debug)

## Architecture

### Modules Core
- `VoxelEngine` - Moteur principal de gestion des voxels
- `ChunkManager` - Gestionnaire de chunks et génération procédurale  
- `BlockSystem` - Système de blocs avec propriétés et metadata
- `WorldGenerator` - Génération procédurale avec bruit de Perlin
- `MeshBuilder` - Construction optimisée des meshes de chunks
- `LightingSystem` - Éclairage soleil et blocs émissifs
- `PlayerController` - Contrôles FPS et interactions
- `RaycastSystem` - Détection de blocs pour interactions

### Roadmap

#### ✅ Milestone 1: Core Voxel Engine
- [x] Système de chunks 16x16x256
- [x] Génération procédurale
- [x] Meshing optimisé
- [x] Contrôles FPS
- [x] Raycast pour interactions
- [x] Éclairage basique

#### 🔄 Milestone 2: Survival Mechanics (Next)
- [ ] Système de vie/faim
- [ ] Inventaire et craft
- [ ] Outils et minage
- [ ] Sauvegarde/chargement

#### 📋 Milestone 3: Biomes & Structures
- [ ] Système de biomes
- [ ] Génération de structures
- [ ] Météo et cycles

#### 📋 Milestone 4: Redstone-like Logic
- [ ] Système de câblage logique
- [ ] Composants mécaniques
- [ ] Automatisation

#### 📋 Milestone 5: Multiplayer
- [ ] Client/Serveur
- [ ] Synchronisation
- [ ] Anti-triche

## Performance

- Utilise le culling par frustum et occlusion
- Meshing "greedy" pour optimiser les faces
- Pooling d'objets pour éviter GC
- Batching GPU pour les textures
- LOD adaptatif selon la distance

## Licence

MIT License - Tous les assets sont originaux et libres d'usage