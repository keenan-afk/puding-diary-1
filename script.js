/**
 * PUDING DIARY — CREATIVE JAVASCRIPT & THREE.JS ENGINE
 * Features:
 * 1. Interactive 3D Chocolate Pudding with Procedural Flowers (Three.js)
 * 2. Hero 3D Mini Pudding Preview
 * 3. Raycasting Flower Placement with Scale-in Animation, Undo, and Clear
 * 4. Accessible WhatsApp Registration Modal with Strict Indonesian Validation
 */

(function () {
  'use strict';

  // State Management
  const state = {
    selectedFlowerType: 'rose',
    selectedColor: '#FAF7F5',
    flowerScale: 1.0,
    placedFlowers: [],
    animatingFlowers: []
  };

  // Pinned WhatsApp Destination
  const WA_PHONE_NUMBER = '6281326422626';

  // Set Current Year in Footer
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* ==========================================================================
     1. THREE.JS UTILITY: PROCEDURAL PUDDING & FLOWER GEOMETRIES
     ========================================================================== */

  /**
   * Generates a completely solid, fluted chocolate pudding mesh with a continuous smooth chocolate crown.
   * Eliminates any sunken hole or culling artifacts so the entire top is 100% rich chocolate pudding.
   */
  function createPuddingGeometry() {
    const stacks = 52;
    const slices = 64;
    const flutes = 16;
    const fluteAmp = 0.085;

    const vertices = [];
    const indices = [];
    const uvs = [];

    // Construct continuous grid from base (v=0) to top center dome (v=1)
    for (let i = 0; i <= stacks; i++) {
      const v = i / stacks;

      let r, y, fluteFade;

      if (v <= 0.65) {
        // Main fluted side wall sloping gracefully inward
        const t = v / 0.65;
        y = t * 1.85;
        r = 2.40 - 0.65 * Math.pow(t, 0.88); // 2.40 tapering to 1.75
        fluteFade = 0.25 + 0.75 * Math.sin(t * Math.PI * 0.95);
      } else {
        // Continuous, smooth solid chocolate crown & dome all the way to center peak
        const t = (v - 0.65) / 0.35; // 0 to 1
        const angle = t * (Math.PI * 0.5); // 0 to PI/2
        r = 1.75 * Math.cos(angle); // 1.75 down to exactly 0 at apex
        y = 1.85 + 0.40 * Math.sin(angle); // 1.85 up to 2.25 at peak
        fluteFade = Math.pow(Math.cos(angle), 2.2); // Flutes smoothly dissolve into silky chocolate top
      }

      for (let j = 0; j <= slices; j++) {
        const u = j / slices;
        const theta = u * Math.PI * 2;

        const fluteOffset = 1 + fluteAmp * fluteFade * Math.cos(flutes * theta);
        const curR = r * fluteOffset;

        const x = curR * Math.cos(theta);
        const z = curR * Math.sin(theta);

        vertices.push(x, y, z);
        uvs.push(u, v);
      }
    }

    // Connect faces with consistent outward-pointing normals
    for (let i = 0; i < stacks; i++) {
      if (i === stacks - 1) {
        // Top converging apex row (single triangle fan per slice, no degenerate quads)
        for (let j = 0; j < slices; j++) {
          const first = i * (slices + 1) + j;
          const apex = first + slices + 1;
          indices.push(first, apex, first + 1);
        }
      } else {
        for (let j = 0; j < slices; j++) {
          const first = i * (slices + 1) + j;
          const second = first + slices + 1;

          indices.push(first, second, first + 1);
          indices.push(second, second + 1, first + 1);
        }
      }
    }

    // Add flat bottom base cap (seals underside against plate)
    const baseCenterIndex = vertices.length / 3;
    vertices.push(0, 0, 0);
    uvs.push(0.5, 0.5);
    for (let j = 0; j < slices; j++) {
      indices.push(baseCenterIndex, j + 1, j);
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }

  /**
   * Generates a beautifully smooth, organic, curved petal geometry with realistic cupping.
   * @param {number} width - Maximum half-width of the petal
   * @param {number} length - Total length from base to tip
   * @param {number} cupFactor - Transverse curvature (spoon-like concavity)
   * @param {number} curlFactor - Longitudinal arching (curl backward)
   * @param {boolean} isNotched - If true, gives a subtle heart-notch at the tip (for Sakura)
   */
  function createPetalGeometry(width, length, cupFactor, curlFactor, isNotched = false) {
    const segU = 14; // across petal width
    const segV = 16; // along petal length
    const vertices = [];
    const indices = [];
    const uvs = [];

    for (let i = 0; i <= segV; i++) {
      const v = i / segV; // 0 (base) to 1 (tip)

      // Natural botanical width profile: starts at 0, widens into rounded belly, tapers smoothly
      let profile;
      if (isNotched) {
        // Sakura petal: broad spade shape with heart-notched tip
        profile = Math.sin(Math.pow(v, 0.72) * Math.PI);
        if (v > 0.8) {
          profile *= 1.06;
        }
      } else {
        // Rose / Daisy / Leaf petal: smooth teardrop / oval
        profile = Math.sin(v * Math.PI) * (1 + 0.35 * Math.sin(v * Math.PI * 0.5));
      }

      const curWidth = width * Math.max(0, profile);

      for (let j = 0; j <= segU; j++) {
        const u = j / segU;
        const uNorm = (u - 0.5) * 2; // -1 to +1

        let x = uNorm * curWidth;
        let y = v * length;

        // Sakura heart notch at the tip
        if (isNotched && v > 0.75) {
          const notchDepth = 0.16 * length * Math.pow((v - 0.75) / 0.25, 2);
          const notchShape = Math.exp(-Math.pow(uNorm * 3.2, 2));
          y -= notchDepth * notchShape;
        }

        // 1. Transverse cupping (spoon curvature across the petal)
        const cup = (1 - uNorm * uNorm) * cupFactor * Math.sin(v * Math.PI);

        // 2. Longitudinal arching (curving outward along petal length)
        const arch = -curlFactor * Math.pow(v, 1.85);

        // 3. Subtle edge lip curl for soft realistic petal feel
        const lipCurl = 0.08 * curlFactor * Math.pow(v, 2.5) * (uNorm * uNorm);

        const z = cup + arch + lipCurl;

        vertices.push(x, y, z);
        uvs.push(u, v);
      }
    }

    // Connect faces
    for (let i = 0; i < segV; i++) {
      for (let j = 0; j < segU; j++) {
        const a = i * (segU + 1) + j;
        const b = a + segU + 1;
        indices.push(a, b, a + 1);
        indices.push(b, b + 1, a + 1);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }

  /**
   * PROCEDURAL FLOWER BUILDERS (REALISTIC, SMOOTH, BOTANICAL ART)
   */

  /**
   * Builds an exquisite, full-blooming layered Rose with natural spiral whorls and calyx base.
   */
  function buildRose(colorHex) {
    const group = new THREE.Group();
    const petalColor = new THREE.Color(colorHex);
    // Deeper inner tone for natural petal depth & translucency
    const innerColor = petalColor.clone().offsetHSL(0, 0.06, -0.10);

    const outerMat = new THREE.MeshPhysicalMaterial({
      color: petalColor,
      roughness: 0.28,
      clearcoat: 0.65,
      clearcoatRoughness: 0.12,
      side: THREE.DoubleSide
    });

    const innerMat = outerMat.clone();
    innerMat.color = innerColor;

    // Green calyx base so the rose sits naturally against the pudding
    const calyxMat = new THREE.MeshStandardMaterial({ color: 0x385E28, roughness: 0.45 });
    const calyxGeom = new THREE.CylinderGeometry(0.18, 0.08, 0.08, 12);
    const calyx = new THREE.Mesh(calyxGeom, calyxMat);
    calyx.position.y = 0.02;
    group.add(calyx);

    // 5 small green sepals peaking under the flower
    const sepalGeom = createPetalGeometry(0.10, 0.35, 0.06, 0.12);
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      const sepal = new THREE.Mesh(sepalGeom, calyxMat);
      sepal.rotation.y = angle;
      sepal.rotation.x = Math.PI * 0.48; // flat against pudding surface
      sepal.position.set(Math.cos(angle) * 0.12, 0.03, Math.sin(angle) * 0.12);
      group.add(sepal);
    }

    // Central rounded bud core
    const budGeom = new THREE.SphereGeometry(0.12, 16, 12);
    const bud = new THREE.Mesh(budGeom, innerMat);
    bud.scale.set(0.9, 1.2, 0.9);
    bud.position.y = 0.12;
    group.add(bud);

    // Layer 1: Tight spiral inner bud petals (3 petals wrapping around bud)
    const innerPetalGeom = createPetalGeometry(0.24, 0.45, 0.20, 0.06);
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const petal = new THREE.Mesh(innerPetalGeom, innerMat);
      petal.rotation.y = angle + 0.2;
      petal.rotation.x = 0.22; // upright, hugging the bud
      petal.position.set(Math.cos(angle) * 0.05, 0.06, Math.sin(angle) * 0.05);
      group.add(petal);
    }

    // Layer 2: Middle whorl (5 cupped petals, interleaving)
    const midPetalGeom = createPetalGeometry(0.35, 0.60, 0.24, 0.16);
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 + 0.35;
      const petal = new THREE.Mesh(midPetalGeom, outerMat);
      petal.rotation.y = angle;
      petal.rotation.x = 0.52; // opening outward at ~30 deg
      petal.position.set(Math.cos(angle) * 0.12, 0.05, Math.sin(angle) * 0.12);
      group.add(petal);
    }

    // Layer 3: Outer blooming petals (7 lush petals spreading open)
    const outerPetalGeom = createPetalGeometry(0.48, 0.76, 0.22, 0.30);
    for (let i = 0; i < 7; i++) {
      const angle = (i * Math.PI * 2) / 7 + 0.65;
      const petal = new THREE.Mesh(outerPetalGeom, outerMat);
      petal.rotation.y = angle;
      petal.rotation.x = 0.88; // opening outward at ~50 deg
      petal.position.set(Math.cos(angle) * 0.22, 0.04, Math.sin(angle) * 0.22);
      group.add(petal);
    }

    group.scale.set(0.68, 0.68, 0.68);
    return group;
  }

  /**
   * Builds an authentic Sakura cherry blossom with 5 heart-notched petals and golden stamens.
   */
  function buildSakura(colorHex) {
    const group = new THREE.Group();
    const petalColor = new THREE.Color(colorHex);

    const petalMat = new THREE.MeshPhysicalMaterial({
      color: petalColor,
      roughness: 0.26,
      clearcoat: 0.60,
      clearcoatRoughness: 0.10,
      side: THREE.DoubleSide
    });

    // 5 notched Sakura petals radiating outward
    const petalGeom = createPetalGeometry(0.34, 0.68, 0.14, 0.18, true);
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      const petal = new THREE.Mesh(petalGeom, petalMat);
      petal.rotation.y = angle;
      petal.rotation.x = 1.38; // gently spread open, cupped upward
      petal.position.set(Math.cos(angle) * 0.08, 0.03, Math.sin(angle) * 0.08);
      group.add(petal);
    }

    // Warm golden-honey center button
    const centerGeom = new THREE.SphereGeometry(0.09, 16, 12);
    const centerMat = new THREE.MeshStandardMaterial({ color: 0xF59E0B, roughness: 0.35 });
    const center = new THREE.Mesh(centerGeom, centerMat);
    center.scale.set(1.1, 0.6, 1.1);
    center.position.y = 0.05;
    group.add(center);

    // 10 fine stamen filaments with golden pearl tips
    const stamenTipMat = new THREE.MeshStandardMaterial({ color: 0xD97706, roughness: 0.3, metalness: 0.2 });
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI * 2) / 10;
      const filamentGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.12, 5);
      const filament = new THREE.Mesh(filamentGeom, centerMat);
      filament.position.set(Math.cos(angle) * 0.08, 0.09, Math.sin(angle) * 0.08);
      filament.rotation.z = Math.cos(angle) * -0.3;
      filament.rotation.x = Math.sin(angle) * 0.3;
      group.add(filament);

      const tipGeom = new THREE.SphereGeometry(0.022, 8, 8);
      const tip = new THREE.Mesh(tipGeom, stamenTipMat);
      tip.position.set(Math.cos(angle) * 0.11, 0.15, Math.sin(angle) * 0.11);
      group.add(tip);
    }

    group.scale.set(0.75, 0.75, 0.75);
    return group;
  }

  /**
   * Builds a radiant Daisy with a golden-honey cushion floret and 24 radiating smooth petals.
   */
  function buildDaisy(colorHex) {
    const group = new THREE.Group();
    const petalColor = new THREE.Color(colorHex);

    const petalMat = new THREE.MeshPhysicalMaterial({
      color: petalColor,
      roughness: 0.30,
      clearcoat: 0.45,
      side: THREE.DoubleSide
    });

    // Central rounded honey-amber floret cushion
    const diskGeom = new THREE.SphereGeometry(0.24, 24, 16);
    const diskMat = new THREE.MeshStandardMaterial({
      color: 0xF59E0B,
      roughness: 0.55,
      metalness: 0.05
    });
    const disk = new THREE.Mesh(diskGeom, diskMat);
    disk.scale.set(1.0, 0.35, 1.0);
    disk.position.y = 0.06;
    group.add(disk);

    // Two interleaved tiers of smooth slender petals
    const petalGeom = createPetalGeometry(0.12, 0.72, 0.08, 0.14);
    const tier1Count = 12;
    for (let i = 0; i < tier1Count; i++) {
      const angle = (i * Math.PI * 2) / tier1Count;
      const petal = new THREE.Mesh(petalGeom, petalMat);
      petal.rotation.y = angle;
      petal.rotation.x = 1.35; // radiating outward
      petal.position.set(Math.cos(angle) * 0.18, 0.03, Math.sin(angle) * 0.18);
      group.add(petal);
    }

    const tier2Count = 12;
    for (let i = 0; i < tier2Count; i++) {
      const angle = (i * Math.PI * 2) / tier2Count + (Math.PI / tier2Count);
      const petal = new THREE.Mesh(petalGeom, petalMat);
      petal.rotation.y = angle;
      petal.rotation.x = 1.42; // slightly lower tier
      petal.position.set(Math.cos(angle) * 0.20, 0.02, Math.sin(angle) * 0.20);
      group.add(petal);
    }

    group.scale.set(0.72, 0.72, 0.72);
    return group;
  }

  /**
   * Builds an airy Baby's Breath spray with delicate branching stems and puffy pearl florets.
   */
  function buildBabyBreath() {
    const group = new THREE.Group();

    // Stem material
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x5C8045, roughness: 0.5 });

    // Pearly white floret material
    const floretMat = new THREE.MeshPhysicalMaterial({
      color: 0xFFFDFB,
      roughness: 0.25,
      clearcoat: 0.6,
      clearcoatRoughness: 0.1
    });

    const branchOffsets = [
      [0.00, 0.36, 0.00],
      [0.15, 0.30, 0.08],
      [-0.14, 0.28, -0.06],
      [0.08, 0.32, -0.14],
      [-0.08, 0.29, 0.14],
      [0.18, 0.22, -0.08],
      [-0.18, 0.21, 0.07],
      [0.05, 0.24, 0.16]
    ];

    branchOffsets.forEach(([bx, by, bz]) => {
      // Sub-stem
      const len = Math.hypot(bx, by, bz);
      const subStem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, len, 6), stemMat);
      subStem.position.set(bx * 0.5, by * 0.5, bz * 0.5);
      subStem.lookAt(bx, by, bz);
      subStem.rotateX(Math.PI / 2);
      group.add(subStem);

      // Cute spherical floret with subtle mini-petal cluster
      const floretGroup = new THREE.Group();
      floretGroup.position.set(bx, by, bz);

      const centerBerry = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), floretMat);
      floretGroup.add(centerBerry);

      // 4 tiny rounded micro-petals
      const microGeom = new THREE.SphereGeometry(0.025, 8, 6);
      for (let p = 0; p < 4; p++) {
        const pAng = (p * Math.PI) / 2;
        const micro = new THREE.Mesh(microGeom, floretMat);
        micro.position.set(Math.cos(pAng) * 0.035, 0, Math.sin(pAng) * 0.035);
        floretGroup.add(micro);
      }

      group.add(floretGroup);
    });

    group.scale.set(0.85, 0.85, 0.85);
    return group;
  }

  /**
   * Builds a fresh botanical leaf sprig with smooth curved contours and natural arching.
   */
  function buildLeaf() {
    const group = new THREE.Group();
    const leafMat = new THREE.MeshPhysicalMaterial({
      color: 0x3E6B2C,
      roughness: 0.30,
      clearcoat: 0.65,
      clearcoatRoughness: 0.12,
      side: THREE.DoubleSide
    });

    // Two lush botanical leaves radiating gracefully
    const leafGeom1 = createPetalGeometry(0.26, 0.85, 0.18, 0.25);
    const leaf1 = new THREE.Mesh(leafGeom1, leafMat);
    leaf1.rotation.set(1.25, 0.35, -0.2);
    leaf1.position.set(0.06, 0.02, 0);
    group.add(leaf1);

    const leafGeom2 = createPetalGeometry(0.22, 0.72, 0.16, 0.22);
    const leaf2 = new THREE.Mesh(leafGeom2, leafMat);
    leaf2.rotation.set(1.30, -0.55, 0.25);
    leaf2.position.set(-0.06, 0.02, 0.04);
    group.add(leaf2);

    group.scale.set(0.85, 0.85, 0.85);
    return group;
  }

  /**
   * Factory function to instantiate a flower by type & color.
   */
  function createFlowerInstance(type, colorHex) {
    switch (type) {
      case 'rose':
        return buildRose(colorHex);
      case 'sakura':
        return buildSakura(colorHex);
      case 'daisy':
        return buildDaisy(colorHex);
      case 'babybreath':
        return buildBabyBreath();
      case 'leaf':
        return buildLeaf();
      default:
        return buildRose(colorHex);
    }
  }

  /* ==========================================================================
     2. MAIN 3D PUDDING WORKSPACE (SECTION "HIAS PUDINGMU")
     ========================================================================== */

  function initMain3DStudio() {
    const container = document.getElementById('pudding-canvas-container');
    const loader = document.getElementById('canvas-loader');
    const fallback = document.getElementById('webgl-fallback');
    const undoBtn = document.getElementById('undo-btn');
    const clearBtn = document.getElementById('clear-btn');
    const countNum = document.getElementById('flower-count-num');

    if (!container) return;

    // WebGL Check
    const hasWebGL = (function () {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch (e) {
        return false;
      }
    })();

    if (!hasWebGL || typeof THREE === 'undefined') {
      if (loader) loader.style.display = 'none';
      if (fallback) fallback.style.display = 'flex';
      return;
    }

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF6E2E6); // Matches --color-surface-sunken

    const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 4.8, 6.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    // 2. Studio Lighting
    const hemiLight = new THREE.HemisphereLight(0xFFEFF2, 0x3E2218, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xFFF3E6, 1.35);
    keyLight.position.set(5, 8, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xF8D7E0, 0.65);
    rimLight.position.set(-6, 5, -5);
    scene.add(rimLight);

    // 3. Pudding Mesh
    const puddingGeom = createPuddingGeometry();
    const puddingMat = new THREE.MeshPhysicalMaterial({
      color: 0x35170E, // Decadent dark chocolate glaze
      roughness: 0.18,
      metalness: 0.02,
      clearcoat: 0.95,
      clearcoatRoughness: 0.06
    });
    const puddingMesh = new THREE.Mesh(puddingGeom, puddingMat);
    puddingMesh.castShadow = true;
    puddingMesh.receiveShadow = true;
    scene.add(puddingMesh);

    // 4. Porcelain Plate
    const plateGeom = new THREE.CylinderGeometry(3.5, 3.1, 0.2, 64);
    const plateMat = new THREE.MeshPhysicalMaterial({
      color: 0xFDFBF7,
      roughness: 0.25,
      clearcoat: 0.6
    });
    const plate = new THREE.Mesh(plateGeom, plateMat);
    plate.position.y = -0.1;
    plate.receiveShadow = true;
    scene.add(plate);

    // Subtle terracotta-gold rim on plate
    const rimGeom = new THREE.TorusGeometry(3.48, 0.035, 16, 64);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xC69562, roughness: 0.35, metalness: 0.75 });
    const plateRim = new THREE.Mesh(rimGeom, rimMat);
    plateRim.rotation.x = Math.PI / 2;
    plateRim.position.y = 0.01;
    scene.add(plateRim);

    // Group for placed flowers
    const flowerGroup = new THREE.Group();
    scene.add(flowerGroup);

    // Pre-place 3 delicate starter flowers on the solid chocolate crown
    const starterRose = createFlowerInstance('rose', '#FAF7F5');
    starterRose.position.set(0.12, 2.24, 0.18);
    starterRose.rotation.set(-0.15, 0.45, 0.08);
    starterRose.scale.set(0.7, 0.7, 0.7);
    flowerGroup.add(starterRose);

    const starterSakura = createFlowerInstance('sakura', '#F4A7B9');
    starterSakura.position.set(0.72, 2.12, 0.62);
    starterSakura.rotation.set(-0.35, 1.15, 0.25);
    starterSakura.scale.set(0.65, 0.65, 0.65);
    flowerGroup.add(starterSakura);

    const starterLeaf = createFlowerInstance('leaf', '#507C3B');
    starterLeaf.position.set(-0.45, 2.18, -0.15);
    starterLeaf.rotation.set(0.28, -1.05, -0.18);
    starterLeaf.scale.set(0.65, 0.65, 0.65);
    flowerGroup.add(starterLeaf);

    state.placedFlowers.push(starterRose, starterSakura, starterLeaf);
    updateHUD();

    // Hide loader
    if (loader) {
      setTimeout(() => loader.classList.add('loaded'), 300);
    }

    // 5. CAMERA ORBIT CONTROLS & TOUCH DRAG
    let isDragging = false;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let hasMoved = false;

    // Spherical coordinates
    let targetAzimuth = 0.4;
    let targetPolar = 0.78;
    let targetRadius = 6.8;

    let curAzimuth = targetAzimuth;
    let curPolar = targetPolar;
    let curRadius = targetRadius;

    const minPolar = 0.35; // Don't look straight down
    const maxPolar = 1.35; // Don't look under the plate
    const minRadius = 4.8;
    const maxRadius = 8.5;

    function updateCameraPosition() {
      // Smooth lerp
      curAzimuth += (targetAzimuth - curAzimuth) * 0.1;
      curPolar += (targetPolar - curPolar) * 0.1;
      curRadius += (targetRadius - curRadius) * 0.1;

      camera.position.x = curRadius * Math.sin(curPolar) * Math.sin(curAzimuth);
      camera.position.y = curRadius * Math.cos(curPolar) + 0.6;
      camera.position.z = curRadius * Math.sin(curPolar) * Math.cos(curAzimuth);
      camera.lookAt(0, 1.1, 0);
    }

    // Pointer events on canvas
    const domEl = renderer.domElement;

    domEl.addEventListener('pointerdown', (e) => {
      isDragging = true;
      hasMoved = false;
      pointerStartX = e.clientX;
      pointerStartY = e.clientY;
      domEl.setPointerCapture(e.pointerId);
    });

    domEl.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - pointerStartX;
      const dy = e.clientY - pointerStartY;

      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        hasMoved = true;
      }

      targetAzimuth -= dx * 0.007;
      targetPolar = Math.max(minPolar, Math.min(maxPolar, targetPolar - dy * 0.007));

      pointerStartX = e.clientX;
      pointerStartY = e.clientY;
    });

    domEl.addEventListener('pointerup', (e) => {
      isDragging = false;
      try {
        domEl.releasePointerCapture(e.pointerId);
      } catch (err) {}

      // If user tapped without dragging, place flower!
      if (!hasMoved) {
        handleCanvasTap(e);
      }
    });

    // Mouse wheel zoom
    domEl.addEventListener('wheel', (e) => {
      e.preventDefault();
      targetRadius = Math.max(minRadius, Math.min(maxRadius, targetRadius + e.deltaY * 0.005));
    }, { passive: false });

    // Touch pinch-to-zoom
    let initialPinchDist = null;
    domEl.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        initialPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    });

    domEl.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && initialPinchDist !== null) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const diff = initialPinchDist - dist;
        targetRadius = Math.max(minRadius, Math.min(maxRadius, targetRadius + diff * 0.015));
        initialPinchDist = dist;
      }
    });

    domEl.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        initialPinchDist = null;
      }
    });

    // 6. RAYCASTING FLOWER PLACEMENT
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function handleCanvasTap(e) {
      const rect = domEl.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObject(puddingMesh);

      if (intersects.length > 0) {
        const hit = intersects[0];
        placeFlowerAt(hit.point, hit.face.normal);
      }
    }

    function placeFlowerAt(point, normal) {
      const flower = createFlowerInstance(state.selectedFlowerType, state.selectedColor);

      // Lift slightly along surface normal to prevent clipping
      const offsetPos = point.clone().add(normal.clone().multiplyScalar(0.04));
      flower.position.copy(offsetPos);

      // Align flower's Y axis with surface normal
      const up = new THREE.Vector3(0, 1, 0);
      flower.quaternion.setFromUnitVectors(up, normal);

      // Add slight organic random yaw rotation around the normal
      const randomYaw = new THREE.Quaternion().setFromAxisAngle(up, Math.random() * Math.PI * 2);
      flower.quaternion.multiply(randomYaw);

      // Scale-in animation state
      const targetScaleVal = state.flowerScale;
      flower.scale.set(0.01, 0.01, 0.01);
      flowerGroup.add(flower);

      state.placedFlowers.push(flower);
      state.animatingFlowers.push({
        mesh: flower,
        currentProgress: 0,
        targetScale: targetScaleVal
      });

      updateHUD();
    }

    // 7. HUD & BUTTON ACTIONS
    function updateHUD() {
      const count = state.placedFlowers.length;
      if (countNum) countNum.textContent = count;
      if (undoBtn) undoBtn.disabled = count === 0;
      if (clearBtn) clearBtn.disabled = count === 0;
    }

    if (undoBtn) {
      undoBtn.addEventListener('click', () => {
        if (state.placedFlowers.length === 0) return;
        const last = state.placedFlowers.pop();
        flowerGroup.remove(last);
        updateHUD();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (state.placedFlowers.length === 0) return;
        state.placedFlowers.forEach((flower) => flowerGroup.remove(flower));
        state.placedFlowers = [];
        updateHUD();
      });
    }

    // 8. RENDER LOOP
    let animationFrameId;
    function animate() {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth camera position
      updateCameraPosition();

      // Process scale-in animations
      for (let i = state.animatingFlowers.length - 1; i >= 0; i--) {
        const anim = state.animatingFlowers[i];
        anim.currentProgress += 0.08;
        // Ease out back
        const t = Math.min(1, anim.currentProgress);
        const scaleProgress = 1 + 1.2 * Math.pow(t - 1, 3) + 0.4 * Math.pow(t - 1, 2);
        const currentS = anim.targetScale * scaleProgress;
        anim.mesh.scale.set(currentS, currentS, currentS);

        if (anim.currentProgress >= 1) {
          anim.mesh.scale.set(anim.targetScale, anim.targetScale, anim.targetScale);
          state.animatingFlowers.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    }
    animate();

    // Resize Handler
    window.addEventListener('resize', () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
  }

  /* ==========================================================================
     3. HERO 3D MINI PUDDING PREVIEW
     ========================================================================== */

  function initHeroMiniPreview() {
    const miniContainer = document.getElementById('hero-mini-canvas-container');
    if (!miniContainer || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF6E2E6);

    const camera = new THREE.PerspectiveCamera(40, miniContainer.clientWidth / miniContainer.clientHeight, 0.1, 50);
    camera.position.set(0, 3.8, 5.2);
    camera.lookAt(0, 1.0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
    renderer.setSize(miniContainer.clientWidth, miniContainer.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    miniContainer.appendChild(renderer.domElement);

    // Light
    const hemiLight = new THREE.HemisphereLight(0xFFEFF2, 0x3E2218, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xFFF3E6, 1.3);
    keyLight.position.set(4, 7, 5);
    scene.add(keyLight);

    // Mini Pudding
    const puddingGeom = createPuddingGeometry();
    const puddingMat = new THREE.MeshPhysicalMaterial({
      color: 0x35170E,
      roughness: 0.18,
      metalness: 0.02,
      clearcoat: 0.95,
      clearcoatRoughness: 0.06
    });
    const miniPudding = new THREE.Mesh(puddingGeom, puddingMat);
    scene.add(miniPudding);

    // Mini Plate
    const plateGeom = new THREE.CylinderGeometry(3.3, 2.9, 0.18, 48);
    const plateMat = new THREE.MeshPhysicalMaterial({ color: 0xFDFBF7, roughness: 0.25, clearcoat: 0.5 });
    const miniPlate = new THREE.Mesh(plateGeom, plateMat);
    miniPlate.position.y = -0.09;
    scene.add(miniPlate);

    // Decorative Rose & Sakura on top
    const rose = buildRose('#FAF7F5');
    rose.position.set(0.08, 2.24, 0.15);
    rose.scale.set(0.65, 0.65, 0.65);
    scene.add(rose);

    const sakura = buildSakura('#F4A7B9');
    sakura.position.set(0.68, 2.12, 0.52);
    sakura.scale.set(0.6, 0.6, 0.6);
    scene.add(sakura);

    // Gentle Auto Rotation
    function animateMini() {
      requestAnimationFrame(animateMini);
      miniPudding.rotation.y += 0.007;
      rose.rotation.y += 0.007;
      sakura.rotation.y += 0.007;
      renderer.render(scene, camera);
    }
    animateMini();

    window.addEventListener('resize', () => {
      if (!miniContainer || !renderer || !camera) return;
      camera.aspect = miniContainer.clientWidth / miniContainer.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(miniContainer.clientWidth, miniContainer.clientHeight);
    });
  }

  /* ==========================================================================
     4. STUDIO CONTROLS: FLOWER SELECTOR, COLOR, AND SIZE
     ========================================================================== */

  function initStudioControls() {
    // Flower type buttons
    const flowerBtns = document.querySelectorAll('.flower-choice-btn');
    flowerBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        flowerBtns.forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');
        state.selectedFlowerType = btn.dataset.flowerType;
      });
    });

    // Color Swatches
    const colorBtns = document.querySelectorAll('.color-swatch-btn');
    colorBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        colorBtns.forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');
        state.selectedColor = btn.dataset.color;
      });
    });

    // Size Slider
    const sizeSlider = document.getElementById('flower-size-slider');
    const sizeDisplay = document.getElementById('slider-val-display');

    if (sizeSlider && sizeDisplay) {
      sizeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        state.flowerScale = val;
        if (val < 0.85) {
          sizeDisplay.textContent = 'Kecil';
        } else if (val > 1.2) {
          sizeDisplay.textContent = 'Besar';
        } else {
          sizeDisplay.textContent = 'Sedang';
        }
      });
    }
  }

  /* ==========================================================================
     5. ACCESSIBLE REGISTRATION MODAL & WHATSAPP REDIRECTION
     ========================================================================== */

  function initRegistrationModal() {
    const modal = document.getElementById('registration-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const openBtns = document.querySelectorAll('.open-modal-btn');
    const form = document.getElementById('registration-form');

    const inputNama = document.getElementById('field-nama');
    const inputKota = document.getElementById('field-kota');
    const inputTelepon = document.getElementById('field-telepon');

    const errorNama = document.getElementById('error-nama');
    const errorKota = document.getElementById('error-kota');
    const errorTelepon = document.getElementById('error-telepon');

    let previousActiveElement = null;

    if (!modal) return;

    function openModal(triggerElement) {
      previousActiveElement = triggerElement || document.activeElement;
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      // Focus first input
      setTimeout(() => {
        if (inputNama) inputNama.focus();
      }, 100);
    }

    function closeModal() {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      // Return focus to trigger button
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus();
      }
    }

    // Open button triggers
    openBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(btn);
      });
    });

    // Close on button click
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', closeModal);
    }

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Accessible Focus Trap & Escape Key
    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('active')) return;

      if (e.key === 'Escape') {
        closeModal();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    });

    // Form Validation Helpers
    function setFieldError(input, errorEl, message) {
      input.closest('.form-group').classList.add('has-error');
      if (errorEl) errorEl.textContent = message;
    }

    function clearFieldError(input, errorEl) {
      input.closest('.form-group').classList.remove('has-error');
      if (errorEl) errorEl.textContent = '';
    }

    [inputNama, inputKota, inputTelepon].forEach((input) => {
      if (!input) return;
      input.addEventListener('input', () => {
        const group = input.closest('.form-group');
        const err = group.querySelector('.form-error-msg');
        clearFieldError(input, err);
      });
    });

    // Form Submission
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const nama = inputNama ? inputNama.value.trim() : '';
        const kota = inputKota ? inputKota.value.trim() : '';
        let telepon = inputTelepon ? inputTelepon.value.trim() : '';

        let isValid = true;

        // 1. Validasi Nama
        if (!nama || nama.length < 2) {
          setFieldError(inputNama, errorNama, 'Mohon isi nama lengkap Bunda ya.');
          isValid = false;
        } else {
          clearFieldError(inputNama, errorNama);
        }

        // 2. Validasi Kota
        if (!kota || kota.length < 2) {
          setFieldError(inputKota, errorKota, 'Mohon cantumkan kota domisili Bunda.');
          isValid = false;
        } else {
          clearFieldError(inputKota, errorKota);
        }

        // 3. Validasi Nomor Telepon Indonesia
        // Normalize: remove dashes, spaces, and leading plus
        const cleanPhone = telepon.replace(/[\s\-\(\)]/g, '');
        // Must contain only digits, starting with 08, 628, or +628, length between 10 and 15
        const phoneRegex = /^(\+?62|0)8[1-9][0-9]{7,11}$/;

        if (!cleanPhone) {
          setFieldError(inputTelepon, errorTelepon, 'Nomor WhatsApp wajib diisi.');
          isValid = false;
        } else if (!phoneRegex.test(cleanPhone)) {
          setFieldError(inputTelepon, errorTelepon, 'Nomor WhatsApp kurang tepat. Contoh yang benar: 081234567890');
          isValid = false;
        } else {
          clearFieldError(inputTelepon, errorTelepon);
        }

        if (!isValid) return;

        // Build WhatsApp Message (exact requested template)
        const messageText = 
`Halo Puding Diary, saya ingin daftar kelas puding.
Nama: ${nama}
Kota: ${kota}
No. Telepon: ${telepon}`;

        const waUrl = `https://wa.me/${WA_PHONE_NUMBER}?text=${encodeURIComponent(messageText)}`;

        // Open WhatsApp in new tab
        window.open(waUrl, '_blank', 'noopener,noreferrer');

        // Reset and close
        form.reset();
        closeModal();
      });
    }
  }

  /* ==========================================================================
     5B. TESTIMONIAL LIGHTBOX MODAL
     ========================================================================== */

  function initTestimonialLightbox() {
    const lightbox = document.getElementById('testi-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeBtn = document.getElementById('lightbox-close-btn');
    const prevBtn = document.getElementById('lightbox-prev-btn');
    const nextBtn = document.getElementById('lightbox-next-btn');

    if (!lightbox || !lightboxImg || !lightboxCaption) return;

    // Collect all cards and zoom buttons
    const cards = Array.from(document.querySelectorAll('.testi-card'));
    if (cards.length === 0) return;

    const items = cards.map((card) => {
      const zoomBtn = card.querySelector('.testi-zoom-btn');
      const img = card.querySelector('.testi-img');
      const fullSrc = zoomBtn ? zoomBtn.dataset.full : (img ? img.src : '');
      const caption = zoomBtn ? zoomBtn.dataset.caption : (img ? img.alt : '');
      return { fullSrc, caption, triggerBtn: zoomBtn || card };
    });

    let currentIndex = 0;
    let lastActiveElement = null;

    function openLightbox(index) {
      if (index < 0 || index >= items.length) return;
      lastActiveElement = document.activeElement;
      currentIndex = index;
      updateLightboxContent();

      lightbox.classList.add('active');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      if (closeBtn) closeBtn.focus();
    }

    function updateLightboxContent() {
      const item = items[currentIndex];
      lightboxImg.src = item.fullSrc;
      lightboxImg.alt = item.caption;
      lightboxCaption.textContent = item.caption;

      if (prevBtn) prevBtn.setAttribute('aria-label', `Foto sebelumnya (${currentIndex + 1} dari ${items.length})`);
      if (nextBtn) nextBtn.setAttribute('aria-label', `Foto berikutnya (${currentIndex + 1} dari ${items.length})`);
    }

    function closeLightbox() {
      lightbox.classList.remove('active');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      lightboxImg.src = '';

      if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
        lastActiveElement.focus();
      }
    }

    function showPrev() {
      currentIndex = (currentIndex - 1 + items.length) % items.length;
      updateLightboxContent();
    }

    function showNext() {
      currentIndex = (currentIndex + 1) % items.length;
      updateLightboxContent();
    }

    // Attach click events on cards & zoom buttons
    cards.forEach((card, idx) => {
      const zoomBtn = card.querySelector('.testi-zoom-btn');
      const mediaWrap = card.querySelector('.testi-media-wrap');

      if (zoomBtn) {
        zoomBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openLightbox(idx);
        });
      }

      if (mediaWrap) {
        mediaWrap.addEventListener('click', () => {
          openLightbox(idx);
        });
      }
    });

    // Close button
    if (closeBtn) {
      closeBtn.addEventListener('click', closeLightbox);
    }

    // Navigation buttons
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showPrev();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showNext();
      });
    }

    // Backdrop click
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });

    // Keyboard support: Escape, ArrowLeft, ArrowRight
    window.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        showPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        showNext();
      }
    });
  }

  /* ==========================================================================
     6. INITIALIZATION RUNNER
     ========================================================================== */

  document.addEventListener('DOMContentLoaded', () => {
    initMain3DStudio();
    initHeroMiniPreview();
    initStudioControls();
    initRegistrationModal();
    initTestimonialLightbox();
  });

})();
