// Biblioteca de materiais PBR
import * as THREE from 'three';
import * as T from './textures.js';

const std = (o) => new THREE.MeshStandardMaterial(o);
const phys = (o) => new THREE.MeshPhysicalMaterial(o);

export function createMaterials() {
  const tex = {
    oak: T.woodPlanks({ base: [186, 142, 100], plankW: 0.2, meters: 2.4 }),
    oakLight: T.woodPlanks({ base: [204, 170, 128], plankW: 0.22, meters: 2.4 }),
    deck: T.woodPlanks({ base: [140, 82, 48], plankW: 0.14, meters: 2.1, vary: 0.25 }),
    porcelain: T.porcelain({ base: [230, 220, 204], tile: 0.9, tiles: 2 }),
    porcelainOut: T.porcelain({ base: [200, 194, 184], tile: 0.6, tiles: 4, veins: 0.05, grout: [150, 145, 138] }),
    marble: T.marble({}),
    marbleDark: T.marble({ base: [52, 50, 50], vein: [190, 186, 180], strength: 0.8 }),
    concrete: T.concrete({ base: [112, 112, 110] }),
    concreteDark: T.concrete({ base: [88, 88, 88], amount: 0.1 }),
    plaster: T.concrete({ base: [222, 218, 211], amount: 0.03, pores: false, meters: 3 }),
    plasterOut: T.concrete({ base: [214, 211, 204], amount: 0.06, pores: false, meters: 3 }),
    grass: T.grass({}),
    pool: T.poolTiles({}),
    pavers: T.pavers({}),
    paversDark: T.pavers({ base: [120, 118, 114], tileW: 0.9, tileH: 0.45, meters: 2.7, joint: [70, 70, 68] }),
    concregrama: T.concregrama({}),
    walnut: T.woodGrain({ base: [120, 78, 48] }),
    freijo: T.woodGrain({ base: [168, 116, 72] }),
    ripado: T.woodGrain({ base: [176, 112, 62], meters: 2 }),
    wallTile: T.wallTile({}),
    wallTileDark: T.wallTile({ base: [96, 94, 92] }),
    linen: T.fabric({ base: [222, 216, 204] }),
    sofaFab: T.fabric({ base: [196, 186, 170] }),
    sofaDark: T.fabric({ base: [96, 98, 96] }),
    bedFab: T.fabric({ base: [236, 233, 226] }),
    throwFab: T.fabric({ base: [166, 118, 82] }),
    blueFab: T.fabric({ base: [118, 140, 158] }),
    rug: T.rug({}),
    rugDark: T.rug({ base: [120, 116, 110], accent: [90, 86, 80] }),
    asphalt: T.asphalt({}),
    waterN: T.waterNormal({}),
  };

  const m = {
    tex,
    // pisos
    floorOak: std({ map: tex.oak, roughness: 0.55, bumpMap: tex.oak, bumpScale: 0.6 }),
    floorOakLight: std({ map: tex.oakLight, roughness: 0.6, bumpMap: tex.oakLight, bumpScale: 0.5 }),
    floorPorcelain: std({ map: tex.porcelain, roughness: 0.18, metalness: 0.0 }),
    floorOut: std({ map: tex.porcelainOut, roughness: 0.7 }),
    deck: std({ map: tex.deck, roughness: 0.75, bumpMap: tex.deck, bumpScale: 1.2 }),
    pavers: std({ map: tex.pavers, roughness: 0.85, bumpMap: tex.pavers, bumpScale: 0.8 }),
    paversDark: std({ map: tex.paversDark, roughness: 0.85 }),
    concregrama: std({ map: tex.concregrama, roughness: 0.95, bumpMap: tex.concregrama, bumpScale: 1.5 }),
    grass: std({ map: tex.grass, roughness: 1, bumpMap: tex.grass, bumpScale: 1.5 }),
    asphalt: std({ map: tex.asphalt, roughness: 0.92 }),
    bathFloor: std({ map: tex.wallTileDark, roughness: 0.4 }),
    // paredes
    plaster: std({ map: tex.plaster, roughness: 0.92 }),
    plasterOut: std({ map: tex.plasterOut, roughness: 0.9 }),
    concrete: std({ map: tex.concrete, roughness: 0.88, bumpMap: tex.concrete, bumpScale: 0.6 }),
    concreteDark: std({ map: tex.concreteDark, roughness: 0.9 }),
    wallTile: std({ map: tex.wallTile, roughness: 0.25 }),
    stoneWall: std({ map: tex.paversDark, roughness: 0.85, bumpMap: tex.paversDark, bumpScale: 2 }),
    ceiling: std({ color: 0xe6e3dc, roughness: 0.95 }),
    // madeiras
    walnut: std({ map: tex.walnut, roughness: 0.5 }),
    freijo: std({ map: tex.freijo, roughness: 0.55 }),
    ripado: std({ map: tex.ripado, roughness: 0.6 }),
    oakFurn: std({ map: tex.oakLight, roughness: 0.5 }),
    // pedras
    marble: std({ map: tex.marble, roughness: 0.12 }),
    marbleDark: std({ map: tex.marbleDark, roughness: 0.15 }),
    // metais
    blackMetal: std({ color: 0x1b1b1d, roughness: 0.45, metalness: 0.6 }),
    frame: std({ color: 0x18181a, roughness: 0.4, metalness: 0.5 }),
    steel: std({ color: 0xc9cbcd, roughness: 0.22, metalness: 1 }),
    brass: std({ color: 0xc8a165, roughness: 0.3, metalness: 1 }),
    chrome: std({ color: 0xeeeeee, roughness: 0.05, metalness: 1 }),
    // tecidos
    linen: std({ map: tex.linen, roughness: 1 }),
    sofa: std({ map: tex.sofaFab, roughness: 1 }),
    sofaDark: std({ map: tex.sofaDark, roughness: 1 }),
    bed: std({ map: tex.bedFab, roughness: 1 }),
    throw: std({ map: tex.throwFab, roughness: 1 }),
    blueFab: std({ map: tex.blueFab, roughness: 1 }),
    leather: std({ color: 0x6b4630, roughness: 0.55 }),
    rug: std({ map: tex.rug, roughness: 1 }),
    rugDark: std({ map: tex.rugDark, roughness: 1 }),
    // lacas e outros
    whiteLacquer: std({ color: 0xe4e1da, roughness: 0.35 }),
    greyLacquer: std({ color: 0x7d7f80, roughness: 0.4 }),
    greenLacquer: std({ color: 0x55624f, roughness: 0.45 }),
    blackMatte: std({ color: 0x151515, roughness: 0.7 }),
    porcelainWhite: std({ color: 0xffffff, roughness: 0.08 }),
    plasticWhite: std({ color: 0xeeeeee, roughness: 0.4 }),
    ceramicPot: std({ color: 0x8a6f5a, roughness: 0.8 }),
    potDark: std({ color: 0x2f2f2f, roughness: 0.7 }),
    terracotta: std({ color: 0xb06a45, roughness: 0.85 }),
    leaf: std({ color: 0x24501f, roughness: 0.65, side: THREE.DoubleSide }),
    leafCard: std({ map: T.leafTexture({}), alphaTest: 0.5, roughness: 0.55, side: THREE.DoubleSide }),
    leafCardLight: std({ map: T.leafTexture({ base: [74, 124, 50] }), alphaTest: 0.5, roughness: 0.55, side: THREE.DoubleSide }),
    frond: std({ map: T.frondTexture({}), alphaTest: 0.45, roughness: 0.7, side: THREE.DoubleSide }),
    foliage: std({ map: T.foliageTexture({}), alphaTest: 0.5, roughness: 0.8, side: THREE.DoubleSide }),
    foliageLight: std({ map: T.foliageTexture({ base: [86, 128, 56] }), alphaTest: 0.5, roughness: 0.8, side: THREE.DoubleSide }),
    foliageDark: std({ map: T.foliageTexture({ base: [40, 74, 34] }), alphaTest: 0.5, roughness: 0.8, side: THREE.DoubleSide }),
    bark: std({ color: 0x6d5c4b, roughness: 0.95 }),
    leafLight: std({ color: 0x3c6b2b, roughness: 0.65, side: THREE.DoubleSide }),
    trunk: std({ color: 0x7a6a55, roughness: 0.95 }),
    soil: std({ color: 0x3a2a1e, roughness: 1 }),
    book: [0x8b3a2f, 0x2f4f6f, 0xc9b27c, 0x3d5a40, 0xdedad0, 0x222222].map((c) => std({ color: c, roughness: 0.8 })),
    // vidros
    glass: phys({ color: 0xffffff, roughness: 0.02, metalness: 0, transparent: true, opacity: 0.16, envMapIntensity: 1.6, depthWrite: false, side: THREE.DoubleSide }),
    glassShower: phys({ color: 0xeaf4f2, roughness: 0.05, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide }),
    glassFrosted: phys({ color: 0xffffff, roughness: 0.5, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }),
    mirror: std({ color: 0xdfe6ea, roughness: 0.02, metalness: 1 }),
    screen: std({ color: 0x050505, roughness: 0.15, metalness: 0.4 }),
    water: phys({
      color: 0x56d0df, emissive: 0x0b5d6b, emissiveIntensity: 0.55, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.5,
      normalMap: tex.waterN, normalScale: new THREE.Vector2(0.25, 0.25), envMapIntensity: 0.7, depthWrite: false,
    }),
    // luzes (emissivos)
    ledWarm: std({ color: 0xffffff, emissive: 0xffc27a, emissiveIntensity: 0.0, roughness: 0.5 }),
    bulb: std({ color: 0xfff4dd, emissive: 0xffd9a0, emissiveIntensity: 0.4, roughness: 0.4 }),
    poolLight: std({ color: 0xffffff, emissive: 0x9fe8ff, emissiveIntensity: 0.0 }),
    carWhite: phys({ color: 0xf2f2f2, roughness: 0.25, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05 }),
    carBlack: phys({ color: 0x111214, roughness: 0.3, metalness: 0.5, clearcoat: 1, clearcoatRoughness: 0.05 }),
    carGlass: std({ color: 0x0b0e12, roughness: 0.05, metalness: 0.9 }),
    tire: std({ color: 0x151515, roughness: 0.9 }),
    rim: std({ color: 0xb8bcc0, roughness: 0.25, metalness: 1 }),
    tailLight: std({ color: 0x550000, emissive: 0xff1a1a, emissiveIntensity: 0.3 }),
    headLight: std({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.2 }),
  };
  m.water.userData.isWater = true;
  m.nightGlow = [m.ledWarm, m.poolLight];
  return m;
}
