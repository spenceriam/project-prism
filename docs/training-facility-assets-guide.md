# Training Facility Assets Guide

This document provides guidance on acquiring and organizing assets for the Training Facility environment in Project Prism Protocol.

## Asset Sources

All assets used in the Training Facility are from free sources with appropriate licenses for commercial use:

1. **Textures**: [ambientCG](https://ambientcg.com/) (CC0 License)
2. **3D Models**: [Kenney.nl](https://kenney.nl/) (CC0 License)
3. **Skybox**: [Poly Haven](https://polyhaven.com/) (CC0 License)

## Texture Assets

### Wall Textures (`src/assets/textures/training/walls/`)

| Filename | Source | Description |
|----------|--------|-------------|
| `wall_main_diffuse.jpg` | [Concrete016](https://ambientcg.com/view?id=Concrete016) | Main wall color/albedo texture |
| `wall_main_normal.jpg` | [Concrete016](https://ambientcg.com/view?id=Concrete016) | Main wall normal map |
| `wall_main_ao.jpg` | [Concrete016](https://ambientcg.com/view?id=Concrete016) | Main wall ambient occlusion map |
| `wall_trim_diffuse.jpg` | [MetalPlates006](https://ambientcg.com/view?id=MetalPlates006) | Wall trim color/albedo texture |
| `wall_trim_normal.jpg` | [MetalPlates006](https://ambientcg.com/view?id=MetalPlates006) | Wall trim normal map |
| `wall_trim_metallic.jpg` | [MetalPlates006](https://ambientcg.com/view?id=MetalPlates006) | Wall trim metallic map |
| `wall_range_diffuse.jpg` | [Concrete034](https://ambientcg.com/view?id=Concrete034) | Shooting range wall color/albedo texture |
| `wall_range_normal.jpg` | [Concrete034](https://ambientcg.com/view?id=Concrete034) | Shooting range wall normal map |

### Floor Textures (`src/assets/textures/training/floors/`)

| Filename | Source | Description |
|----------|--------|-------------|
| `floor_main_diffuse.jpg` | [Tiles074](https://ambientcg.com/view?id=Tiles074) | Main floor color/albedo texture |
| `floor_main_normal.jpg` | [Tiles074](https://ambientcg.com/view?id=Tiles074) | Main floor normal map |
| `floor_main_ao.jpg` | [Tiles074](https://ambientcg.com/view?id=Tiles074) | Main floor ambient occlusion map |
| `floor_range_diffuse.jpg` | [Concrete033](https://ambientcg.com/view?id=Concrete033) | Shooting range floor color/albedo texture |
| `floor_range_normal.jpg` | [Concrete033](https://ambientcg.com/view?id=Concrete033) | Shooting range floor normal map |
| `floor_course_diffuse.jpg` | [Asphalt012](https://ambientcg.com/view?id=Asphalt012) | Movement course floor color/albedo texture |
| `floor_course_normal.jpg` | [Asphalt012](https://ambientcg.com/view?id=Asphalt012) | Movement course floor normal map |

### Prop Textures (`src/assets/textures/training/props/`)

| Filename | Source | Description |
|----------|--------|-------------|
| `metal_diffuse.jpg` | [Metal032](https://ambientcg.com/view?id=Metal032) | Metal prop color/albedo texture |
| `metal_normal.jpg` | [Metal032](https://ambientcg.com/view?id=Metal032) | Metal prop normal map |
| `metal_metallic.jpg` | [Metal032](https://ambientcg.com/view?id=Metal032) | Metal prop metallic map |
| `metal_roughness.jpg` | [Metal032](https://ambientcg.com/view?id=Metal032) | Metal prop roughness map |
| `wood_diffuse.jpg` | [Wood062](https://ambientcg.com/view?id=Wood062) | Wood prop color/albedo texture |
| `wood_normal.jpg` | [Wood062](https://ambientcg.com/view?id=Wood062) | Wood prop normal map |
| `wood_ao.jpg` | [Wood062](https://ambientcg.com/view?id=Wood062) | Wood prop ambient occlusion map |
| `plastic_diffuse.jpg` | [Plastic010](https://ambientcg.com/view?id=Plastic010) | Plastic prop color/albedo texture |
| `plastic_normal.jpg` | [Plastic010](https://ambientcg.com/view?id=Plastic010) | Plastic prop normal map |

### Target Textures (`src/assets/textures/training/targets/`)

| Filename | Source | Description |
|----------|--------|-------------|
| `target_standard_diffuse.jpg` | Custom | Standard target color/albedo texture |
| `target_standard_emissive.jpg` | Custom | Standard target emissive map |
| `target_moving_diffuse.jpg` | Custom | Moving target color/albedo texture |
| `target_moving_emissive.jpg` | Custom | Moving target emissive map |

### Skybox Textures (`src/assets/textures/skybox/training/`)

| Filename | Source | Description |
|----------|--------|-------------|
| `px.jpg`, `nx.jpg` | [Empty Warehouse](https://polyhaven.com/a/empty_warehouse_01) | Positive/negative X skybox faces |
| `py.jpg`, `ny.jpg` | [Empty Warehouse](https://polyhaven.com/a/empty_warehouse_01) | Positive/negative Y skybox faces |
| `pz.jpg`, `nz.jpg` | [Empty Warehouse](https://polyhaven.com/a/empty_warehouse_01) | Positive/negative Z skybox faces |

## 3D Model Assets

### Environment Models (`src/assets/models/training/environment/`)

| Filename | Source | Description |
|----------|--------|-------------|
| `walls.glb` | [Kenney Tower Defense Kit](https://kenney.nl/assets/tower-defense-kit) | Modular wall sections |
| `floor.glb` | [Kenney Tower Defense Kit](https://kenney.nl/assets/tower-defense-kit) | Modular floor sections |
| `ceiling.glb` | [Kenney Tower Defense Kit](https://kenney.nl/assets/tower-defense-kit) | Modular ceiling sections |

### Prop Models (`src/assets/models/training/props/`)

| Filename | Source | Description |
|----------|--------|-------------|
| `table.glb` | [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit) | Table models |
| `rack.glb` | [Kenney Prop Pack](https://kenney.nl/assets/prop-pack) | Weapon rack models |
| `barrier.glb` | [Kenney Tower Defense Kit](https://kenney.nl/assets/tower-defense-kit) | Barrier models |
| `chair.glb` | [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit) | Chair models |
| `locker.glb` | [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit) | Locker models |
| `computer.glb` | [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit) | Computer workstation models |

### Target Models (`src/assets/models/training/targets/`)

| Filename | Source | Description |
|----------|--------|-------------|
| `standard.glb` | [Kenney Shooting Gallery](https://kenney.nl/assets/shooting-gallery) | Standard target models |
| `moving.glb` | [Kenney Shooting Gallery](https://kenney.nl/assets/shooting-gallery) | Moving target models |

### Weapon Models (`src/assets/models/training/weapons/`)

| Filename | Source | Description |
|----------|--------|-------------|
| `pistol_rack.glb` | [Kenney Weapon Pack](https://kenney.nl/assets/weapon-pack) | Pistol display rack |
| `rifle_rack.glb` | [Kenney Weapon Pack](https://kenney.nl/assets/weapon-pack) | Rifle display rack |

## Asset Acquisition Process

1. **Download Textures**:
   - Visit the ambientCG links provided above
   - Download the 1K JPG version of each texture
   - Rename the files according to the filenames in this guide
   - Place in the appropriate directories

2. **Download 3D Models**:
   - Visit the Kenney.nl links provided above
   - Download the asset packs
   - Extract the relevant models
   - Convert to glTF format if necessary (using Blender)
   - Place in the appropriate directories

3. **Download Skybox**:
   - Visit the Poly Haven link provided above
   - Download the HDRI
   - Convert to cubemap format (using a tool like [HDRItoEnvMap](https://matheowis.github.io/HDRI-to-CubeMap/))
   - Place in the skybox directory

## Optimization Guidelines

1. **Texture Optimization**:
   - Use 1K resolution (1024×1024) for most textures
   - Use JPG format for diffuse/albedo textures
   - Use compressed formats when possible (e.g., .basis)
   - Consider creating texture atlases for similar materials

2. **Model Optimization**:
   - Keep polygon count low (under 10K triangles per model)
   - Use instancing for repeated objects
   - Implement LOD (Level of Detail) for complex models
   - Ensure proper UV mapping for textures

3. **Asset Loading**:
   - Use progressive loading for larger assets
   - Implement asset streaming based on player position
   - Preload essential assets during level initialization

## Custom Asset Creation

For custom assets like target textures, use the following guidelines:

1. **Target Textures**:
   - Create simple, high-contrast designs
   - Use bright colors for better visibility
   - Include bullseye patterns for shooting targets
   - Add emissive areas for visual feedback

## License Compliance

All assets used in this project are under CC0 (Creative Commons Zero) licenses, which means:
- You can use them for any purpose, including commercial use
- No attribution is required (but is appreciated)
- You can modify and redistribute them freely

Always verify the license of any additional assets you incorporate into the project.
