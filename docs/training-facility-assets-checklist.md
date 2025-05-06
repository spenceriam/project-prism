# Training Facility Assets Checklist

Use this checklist to track progress on acquiring and implementing assets for the Training Facility environment.

## Texture Assets

### Wall Textures
- [ ] Download [Concrete016](https://ambientcg.com/view?id=Concrete016) from ambientCG
  - [ ] Replace placeholder for `wall_main_diffuse.jpg`
  - [ ] Replace placeholder for `wall_main_normal.jpg`
  - [ ] Replace placeholder for `wall_main_ao.jpg`
- [ ] Download [MetalPlates006](https://ambientcg.com/view?id=MetalPlates006) from ambientCG
  - [ ] Replace placeholder for `wall_trim_diffuse.jpg`
  - [ ] Replace placeholder for `wall_trim_normal.jpg`
  - [ ] Replace placeholder for `wall_trim_metallic.jpg`
- [ ] Download [Concrete034](https://ambientcg.com/view?id=Concrete034) from ambientCG
  - [ ] Replace placeholder for `wall_range_diffuse.jpg`
  - [ ] Replace placeholder for `wall_range_normal.jpg`

### Floor Textures
- [ ] Download [Tiles074](https://ambientcg.com/view?id=Tiles074) from ambientCG
  - [ ] Replace placeholder for `floor_main_diffuse.jpg`
  - [ ] Replace placeholder for `floor_main_normal.jpg`
  - [ ] Replace placeholder for `floor_main_ao.jpg`
- [ ] Download [Concrete033](https://ambientcg.com/view?id=Concrete033) from ambientCG
  - [ ] Replace placeholder for `floor_range_diffuse.jpg`
  - [ ] Replace placeholder for `floor_range_normal.jpg`
- [ ] Download [Asphalt012](https://ambientcg.com/view?id=Asphalt012) from ambientCG
  - [ ] Replace placeholder for `floor_course_diffuse.jpg`
  - [ ] Replace placeholder for `floor_course_normal.jpg`

### Prop Textures
- [ ] Download [Metal032](https://ambientcg.com/view?id=Metal032) from ambientCG
  - [ ] Replace placeholder for `metal_diffuse.jpg`
  - [ ] Replace placeholder for `metal_normal.jpg`
  - [ ] Replace placeholder for `metal_metallic.jpg`
  - [ ] Replace placeholder for `metal_roughness.jpg`
- [ ] Download [Wood062](https://ambientcg.com/view?id=Wood062) from ambientCG
  - [ ] Replace placeholder for `wood_diffuse.jpg`
  - [ ] Replace placeholder for `wood_normal.jpg`
  - [ ] Replace placeholder for `wood_ao.jpg`
- [ ] Download [Plastic010](https://ambientcg.com/view?id=Plastic010) from ambientCG
  - [ ] Replace placeholder for `plastic_diffuse.jpg`
  - [ ] Replace placeholder for `plastic_normal.jpg`

### Target Textures
- [ ] Create custom target textures
  - [ ] Create `target_standard_diffuse.jpg`
  - [ ] Create `target_standard_emissive.jpg`
  - [ ] Create `target_moving_diffuse.jpg`
  - [ ] Create `target_moving_emissive.jpg`

### Skybox Textures
- [ ] Download [Empty Warehouse HDRI](https://polyhaven.com/a/empty_warehouse_01) from Poly Haven
  - [ ] Convert to cubemap format
  - [ ] Process `px.jpg`, `nx.jpg` (X-axis faces)
  - [ ] Process `py.jpg`, `ny.jpg` (Y-axis faces)
  - [ ] Process `pz.jpg`, `nz.jpg` (Z-axis faces)

## 3D Model Assets (GoldenEye 64 Style)

### Environment Models
- [ ] Download [Classic64 Lowpoly Asset Library](https://craigsnedeker.itch.io/classic64-asset-library) (N64-style environment assets)
  - [ ] Extract environment models for walls, floors, and ceilings
  - [ ] Convert to `.glb` format if needed

### Prop Models
- [ ] Download [PSX Tools Pack](https://amos-makes.itch.io/psx-tools-pack) (everyday objects with PSX/N64 styling)
  - [ ] Convert models to `.glb` format
- [ ] Download [Retro FPS Asset Pack](https://altrix-studios.itch.io/retro-fps-asset-pack) (environment props)
  - [ ] Extract furniture and barrier models
  - [ ] Convert to `.glb` format if needed

### Target Models
- [ ] Download [Classic64 Lowpoly Asset Library](https://craigsnedeker.itch.io/classic64-asset-library) (for target models)
  - [ ] Extract target-appropriate models
  - [ ] Convert to `.glb` format if needed

### Weapon Models
- [ ] Download [PSX Pistol Pack](https://doctor-sci3nce.itch.io/psx-pistol-pack) (authentic low-poly pistols)
  - [ ] Convert models to `.glb` format
- [ ] Download [PSX MP5](https://doctor-sci3nce.itch.io/psx-mp5) (low-poly submachine gun)
  - [ ] Convert models to `.glb` format
- [ ] Download [PSX Misc. Gun Pack](https://doctor-sci3nce.itch.io/psx-misc-gun-pack) (additional weapons)
  - [ ] Convert models to `.glb` format
- [ ] Download [PSX Ammo Boxes](https://doctor-sci3nce.itch.io/psx-ammo-boxes) (ammunition pickups)
  - [ ] Convert models to `.glb` format

## Asset Processing Steps

### Texture Processing
- [ ] Download textures from ambientCG manually:
  - [ ] [Concrete016](https://ambientcg.com/view?id=Concrete016) - Main wall textures
  - [ ] [MetalPlates006](https://ambientcg.com/view?id=MetalPlates006) - Wall trim textures
  - [ ] [Concrete034](https://ambientcg.com/view?id=Concrete034) - Shooting range wall textures
  - [ ] [Tiles074](https://ambientcg.com/view?id=Tiles074) - Main floor textures
  - [ ] [Concrete033](https://ambientcg.com/view?id=Concrete033) - Shooting range floor textures
  - [ ] [Asphalt012](https://ambientcg.com/view?id=Asphalt012) - Movement course floor textures
  - [ ] [Metal032](https://ambientcg.com/view?id=Metal032) - Metal prop textures
  - [ ] [Wood062](https://ambientcg.com/view?id=Wood062) - Wood prop textures
  - [ ] [Plastic010](https://ambientcg.com/view?id=Plastic010) - Plastic prop textures
- [ ] Process textures for N64/GoldenEye style:
  - [ ] Downscale to lower resolutions (64×64 or 128×128)
  - [ ] Apply color quantization to reduce color palette
  - [ ] Add slight pixelation effect

### Model Processing
- [ ] Process downloaded models for GoldenEye 64 style:
  - [ ] Keep polygon counts extremely low (300-1000 polygons per model)
  - [ ] Use simple, flat-shaded materials
  - [ ] Implement characteristic "affine texture mapping" look
  - [ ] Convert all models to glTF format
- [ ] Organize models in the `src/assets/models/training/retro` directory

### Implementation
- [ ] Update asset paths in `enhancedTraining.ts`
- [ ] Implement instancing for repeated objects
- [ ] Set up LOD (Level of Detail) for complex models
- [ ] Configure progressive loading for larger assets
- [ ] Test performance in browser environment
- [ ] Verify all assets are properly displayed in-game

## Optimization Checklist

- [ ] Texture atlases created for similar materials
- [ ] Models optimized for low polygon count
- [ ] Instancing implemented for repeated objects
- [ ] LOD implemented for complex models
- [ ] Asset streaming based on player position configured
- [ ] Preloading of essential assets implemented
- [ ] Performance tested in target browsers
