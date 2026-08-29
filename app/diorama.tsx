"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

import { useI18n } from "@/components/i18n-provider";
import { siteAsset } from "@/lib/site-path";

type DioramaProps = {
  stage: number;
  viewpoint: "diorama" | "inside";
  active?: boolean;
  onArStop?: () => void;
};

type MotionKind = "idle" | "walk" | "talk" | "vote" | "measure" | "carry";

type RiggedActor = {
  root: THREE.Group;
  motion: MotionKind;
  phase: number;
  speed: number;
  basePosition: THREE.Vector3;
  baseRotation: number;
  bones: Record<string, THREE.Bone>;
  baseQuaternions: Record<string, THREE.Quaternion>;
};

type RigLayout = {
  x: number;
  z: number;
  angle: number;
  motion: MotionKind;
};

type SceneHandles = {
  settlers: THREE.Group;
  founders: THREE.Group;
  assembly: THREE.Group;
  surveyors: THREE.Group;
  plots: THREE.Group;
  names: THREE.Group;
  stelePivot: THREE.Group;
  boat: THREE.Group;
  smoke: THREE.Group;
  actors: THREE.Group[];
  riggedActors: THREE.Group;
  riggedPeople: RiggedActor[];
  surveyorPlaceholders: THREE.Group[];
  terrain: THREE.Mesh;
  shore: THREE.Mesh;
};

const rigEuler = new THREE.Euler();
const rigOffset = new THREE.Quaternion();

const rigBoneNames = [
  "Head",
  "spine_01",
  "spine_02",
  "upperarm_l",
  "upperarm_r",
  "lowerarm_l",
  "lowerarm_r",
  "thigh_l",
  "thigh_r",
  "calf_l",
  "calf_r",
] as const;

function createAncientHead(
  skin: THREE.Material,
  hairMaterial: THREE.Material,
  style: number,
) {
  const head = new THREE.Group();
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.064, 0.074, 0.12, 8),
    skin,
  );
  neck.position.y = 0.015;
  neck.castShadow = true;
  head.add(neck);

  const face = new THREE.Mesh(new THREE.IcosahedronGeometry(0.118, 2), skin);
  face.position.y = 0.105;
  face.scale.set(0.92, 1.08, 0.9);
  face.castShadow = true;
  head.add(face);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.055, 5), skin);
  nose.position.set(0, 0.105, 0.114);
  nose.rotation.x = Math.PI / 2;
  head.add(nose);

  const earGeometry = new THREE.SphereGeometry(0.022, 7, 5);
  [-0.112, 0.112].forEach((x) => {
    const ear = new THREE.Mesh(earGeometry, skin);
    ear.position.set(x, 0.1, 0);
    ear.scale.set(0.55, 1, 0.45);
    head.add(ear);
  });

  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x2b211c });
  [-0.042, 0.042].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 4), eyeMaterial);
    eye.position.set(x, 0.125, 0.103);
    eye.scale.y = 0.55;
    head.add(eye);
  });

  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.121, 12, 7, 0, Math.PI * 2, 0, Math.PI * 0.48),
    hairMaterial,
  );
  cap.position.set(0, 0.145, -0.006);
  cap.scale.set(0.96, 0.72, 0.92);
  cap.castShadow = true;
  head.add(cap);

  const curlGeometry = new THREE.SphereGeometry(0.027, 7, 5);
  const curlPositions =
    style % 3 === 0
      ? [[-0.095, 0.145, -0.055], [0.095, 0.145, -0.055], [-0.07, 0.195, -0.055], [0.07, 0.195, -0.055]]
      : [[-0.103, 0.12, -0.045], [0.103, 0.12, -0.045], [-0.075, 0.18, -0.07], [0, 0.205, -0.075], [0.075, 0.18, -0.07]];
  curlPositions.forEach(([x, y, z]) => {
    const curl = new THREE.Mesh(curlGeometry, hairMaterial);
    curl.position.set(x, y, z);
    curl.castShadow = true;
    head.add(curl);
  });

  if (style % 3 === 1) {
    const bun = new THREE.Mesh(new THREE.IcosahedronGeometry(0.062, 1), hairMaterial);
    bun.position.set(0, 0.135, -0.125);
    bun.scale.set(1.05, 0.9, 0.8);
    bun.castShadow = true;
    head.add(bun);
  } else if (style % 3 === 2) {
    [-0.075, 0, 0.075].forEach((x) => {
      const lock = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.018, 0.075, 3, 6),
        hairMaterial,
      );
      lock.position.set(x, 0.075, -0.105);
      lock.rotation.z = x * 0.8;
      lock.castShadow = true;
      head.add(lock);
    });
  }

  return head;
}

type ChitonProfilePoint = {
  radius: number;
  y: number;
};

function createPleatedChitonGeometry(
  profile: ChitonProfilePoint[],
  depthScale: number,
  phase: number,
) {
  const radialSegments = 18;
  const positions: number[] = [];
  const indices: number[] = [];

  profile.forEach((point, ringIndex) => {
    for (let segment = 0; segment <= radialSegments; segment += 1) {
      const angle = (segment / radialSegments) * Math.PI * 2;
      const pleat = 1 + Math.cos(angle * 9 + phase) * 0.028;
      const frontDrape = 1 + Math.max(0, Math.cos(angle)) * 0.035;
      positions.push(
        Math.sin(angle) * point.radius * pleat,
        point.y,
        Math.cos(angle) * point.radius * depthScale * pleat * frontDrape,
      );

      if (ringIndex === profile.length - 1 || segment === radialSegments) continue;
      const current = ringIndex * (radialSegments + 1) + segment;
      const next = current + radialSegments + 1;
      indices.push(current, next, current + 1, next, next + 1, current + 1);
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function attachCapsule(
  bone: THREE.Object3D | undefined,
  radius: number,
  totalLength: number,
  material: THREE.Material,
  zScale = 0.9,
) {
  if (!bone) return;
  const capsule = new THREE.Mesh(
    new THREE.CapsuleGeometry(
      radius,
      Math.max(0.02, totalLength - radius * 2),
      3,
      7,
    ),
    material,
  );
  capsule.position.y = totalLength / 2;
  capsule.scale.z = zScale;
  capsule.castShadow = true;
  bone.add(capsule);
}

function dressAsAncientGreek(
  model: THREE.Group,
  female: boolean,
  color: number,
  skin: THREE.Material,
  style: number,
) {
  const clothColor = new THREE.Color(color).lerp(new THREE.Color(0xd9c9a5), 0.18);
  const cloth = new THREE.MeshStandardMaterial({
    color: clothColor,
    roughness: 0.98,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const drape = new THREE.MeshStandardMaterial({
    color: clothColor.clone().multiplyScalar(style % 2 === 0 ? 0.72 : 1.16),
    roughness: 1,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const beltMaterial = new THREE.MeshStandardMaterial({
    color: [0x7a4632, 0x70513a, 0x8c5b39][style % 3],
    roughness: 1,
  });

  const profile: ChitonProfilePoint[] = female
    ? [
        { radius: 0.33, y: 0.12 },
        { radius: 0.35, y: 0.2 },
        { radius: 0.31, y: 0.52 },
        { radius: 0.265, y: 0.9 },
        { radius: 0.25, y: 1.12 },
        { radius: 0.29, y: 1.37 },
        { radius: 0.255, y: 1.48 },
      ]
    : [
        { radius: 0.315, y: 0.61 },
        { radius: 0.33, y: 0.68 },
        { radius: 0.285, y: 0.9 },
        { radius: 0.255, y: 1.13 },
        { radius: 0.31, y: 1.39 },
        { radius: 0.27, y: 1.49 },
      ];
  const chiton = new THREE.Mesh(
    createPleatedChitonGeometry(profile, female ? 0.61 : 0.64, style * 0.73),
    cloth,
  );
  chiton.castShadow = true;
  chiton.receiveShadow = true;
  model.add(chiton);

  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(
      female ? 0.258 : 0.265,
      female ? 0.258 : 0.265,
      0.035,
      14,
      1,
      true,
    ),
    beltMaterial,
  );
  belt.position.y = female ? 1.08 : 1.03;
  belt.scale.z = female ? 0.625 : 0.65;
  belt.castShadow = true;
  model.add(belt);

  if (style % 3 !== 1) {
    const himationShape = new THREE.Shape();
    if (style % 2 === 0) {
      himationShape.moveTo(-0.25, 1.45);
      himationShape.bezierCurveTo(-0.17, 1.47, 0.08, 1.07, 0.24, 0.86);
      himationShape.lineTo(0.17, 0.79);
      himationShape.bezierCurveTo(0.02, 0.98, -0.2, 1.32, -0.3, 1.38);
    } else {
      himationShape.moveTo(0.25, 1.45);
      himationShape.bezierCurveTo(0.17, 1.47, -0.08, 1.07, -0.24, 0.86);
      himationShape.lineTo(-0.17, 0.79);
      himationShape.bezierCurveTo(-0.02, 0.98, 0.2, 1.32, 0.3, 1.38);
    }
    himationShape.closePath();
    const himation = new THREE.Mesh(new THREE.ShapeGeometry(himationShape, 7), drape);
    himation.position.z = female ? 0.205 : 0.218;
    himation.castShadow = true;
    model.add(himation);
  }

  const pinMaterial = new THREE.MeshStandardMaterial({
    color: 0x9c7842,
    roughness: 0.72,
    metalness: 0.08,
  });
  [-0.205, 0.205].forEach((x) => {
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.023, 7, 5), pinMaterial);
    pin.position.set(x, 1.455, 0.17);
    pin.castShadow = true;
    model.add(pin);
  });

  ["upperarm_l", "upperarm_r"].forEach((name) => {
    const bone = model.getObjectByName(name);
    attachCapsule(bone, 0.053, 0.25, skin);
    if (!bone) return;
    const sleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.078, 0.064, 0.105, 8),
      cloth,
    );
    sleeve.position.y = 0.055;
    sleeve.scale.z = 0.88;
    sleeve.castShadow = true;
    bone.add(sleeve);
  });
  ["lowerarm_l", "lowerarm_r"].forEach((name) => {
    attachCapsule(model.getObjectByName(name), 0.045, 0.235, skin);
  });
  ["hand_l", "hand_r"].forEach((name) => {
    const handBone = model.getObjectByName(name);
    if (!handBone) return;
    const hand = new THREE.Mesh(new THREE.IcosahedronGeometry(0.056, 1), skin);
    hand.position.y = 0.035;
    hand.scale.set(0.82, 1.18, 0.64);
    hand.castShadow = true;
    handBone.add(hand);
  });

  if (!female) {
    ["calf_l", "calf_r"].forEach((name) => {
      attachCapsule(model.getObjectByName(name), 0.064, 0.43, skin, 0.84);
    });
  }
  ["foot_l", "foot_r"].forEach((name) => {
    const footBone = model.getObjectByName(name);
    if (!footBone) return;
    const foot = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.058, 0.12, 3, 7),
      skin,
    );
    foot.position.y = 0.085;
    foot.scale.set(0.92, 1, 0.72);
    foot.castShadow = true;
    footBone.add(foot);
  });
}

function createRiggedActor(
  template: THREE.Group,
  color: number,
  motion: MotionKind,
  scale: number,
  hairStyle: number,
  female: boolean,
) {
  const root = new THREE.Group();
  const model = cloneSkeleton(template) as THREE.Group;
  const skinTones = [0x9f6747, 0xb97952, 0xc98c63, 0x8f593d];
  const skin = new THREE.MeshStandardMaterial({
    color: skinTones[hairStyle % skinTones.length],
    roughness: 0.96,
  });
  const hair = new THREE.MeshStandardMaterial({
    color: [0x211915, 0x3a271c, 0x553520, 0x2e2019][hairStyle % 4],
    roughness: 1,
  });
  model.traverse((object) => {
    if (!(object instanceof THREE.SkinnedMesh)) return;
    object.visible = false;
  });

  root.add(model);
  root.scale.setScalar(scale);

  const bones: Record<string, THREE.Bone> = {};
  const baseQuaternions: Record<string, THREE.Quaternion> = {};
  rigBoneNames.forEach((name) => {
    const bone = model.getObjectByName(name);
    if (!(bone instanceof THREE.Bone)) return;
    bones[name] = bone;
    baseQuaternions[name] = bone.quaternion.clone();
  });
  bones.Head?.add(createAncientHead(skin, hair, hairStyle));
  dressAsAncientGreek(model, female, color, skin, hairStyle);

  return {
    root,
    motion,
    phase: Math.random() * Math.PI * 2,
    speed: 0.75 + Math.random() * 0.35,
    basePosition: new THREE.Vector3(),
    baseRotation: 0,
    bones,
    baseQuaternions,
  } satisfies RiggedActor;
}

function animateRiggedActor(actor: RiggedActor, elapsed: number) {
  const phase = elapsed * actor.speed + actor.phase;
  const step = Math.sin(phase * 4.1);
  actor.root.position.copy(actor.basePosition);
  actor.root.rotation.y = actor.baseRotation + Math.sin(phase * 0.52) * 0.025;
  actor.root.position.y += Math.abs(step) * (actor.motion === "walk" ? 0.025 : 0.007);

  Object.entries(actor.bones).forEach(([name, bone]) => {
    bone.quaternion.copy(actor.baseQuaternions[name]);
  });

  const offsetBone = (name: string, x = 0, y = 0, z = 0) => {
    const bone = actor.bones[name];
    if (!bone) return;
    rigEuler.set(x, y, z);
    rigOffset.setFromEuler(rigEuler);
    bone.quaternion.multiply(rigOffset);
  };

  offsetBone("spine_01", Math.sin(phase * 0.9) * 0.018, 0, Math.sin(phase * 0.6) * 0.012);
  offsetBone("Head", 0, Math.sin(phase * 0.7) * 0.11, 0);
  offsetBone("upperarm_l", 0, 0, -1.28);
  offsetBone("upperarm_r", 0, 0, 1.28);

  if (actor.motion === "walk") {
    offsetBone("upperarm_l", step * 0.38, 0, 0);
    offsetBone("upperarm_r", -step * 0.38, 0, 0);
    offsetBone("thigh_l", -step * 0.46, 0, 0);
    offsetBone("thigh_r", step * 0.46, 0, 0);
    offsetBone("calf_l", Math.max(0, step) * 0.42, 0, 0);
    offsetBone("calf_r", Math.max(0, -step) * 0.42, 0, 0);
    actor.root.position.z += Math.sin(phase * 0.35) * 0.2;
  } else if (actor.motion === "measure") {
    offsetBone("upperarm_l", -0.78 + Math.sin(phase) * 0.08, 0, -0.18);
    offsetBone("upperarm_r", -0.78 - Math.sin(phase) * 0.08, 0, 0.18);
    offsetBone("lowerarm_l", -0.22, 0, 0);
    offsetBone("lowerarm_r", -0.22, 0, 0);
    offsetBone("spine_02", -0.12 + Math.sin(phase * 0.8) * 0.035, 0, 0);
  } else if (actor.motion === "talk" || actor.motion === "vote") {
    offsetBone("upperarm_r", -0.62 - Math.sin(phase * 1.55) * 0.22, 0, 0.16);
    offsetBone("lowerarm_r", -0.58 + Math.sin(phase * 1.2) * 0.14, 0, 0);
    offsetBone("upperarm_l", -0.16, 0, -0.08);
  } else if (actor.motion === "carry") {
    offsetBone("upperarm_l", -0.58, 0, -0.12);
    offsetBone("upperarm_r", -0.58, 0, 0.12);
    offsetBone("lowerarm_l", -0.64, 0, 0);
    offsetBone("lowerarm_r", -0.64, 0, 0);
    offsetBone("spine_02", -0.16 + Math.sin(phase) * 0.025, 0, 0);
  } else {
    offsetBone("upperarm_l", Math.sin(phase) * 0.035, 0, 0);
    offsetBone("upperarm_r", -Math.sin(phase) * 0.035, 0, 0);
  }
}

function stoneMaterial(color: number, roughness = 0.9) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
}

function makePerson(color: number, scale = 1, motion: MotionKind = "idle") {
  const person = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xb98259, roughness: 0.95 });
  const cloth = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });

  const leftLeg = new THREE.Mesh(
    new THREE.CylinderGeometry(0.043 * scale, 0.052 * scale, 0.32 * scale, 7),
    skin,
  );
  leftLeg.position.set(-0.075 * scale, 0.16 * scale, 0);
  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.075 * scale;

  const tunic = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12 * scale, 0.2 * scale, 0.62 * scale, 8),
    cloth,
  );
  tunic.position.y = 0.46 * scale;

  const leftArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035 * scale, 0.045 * scale, 0.44 * scale, 7),
    skin,
  );
  leftArm.position.set(-0.19 * scale, 0.54 * scale, 0);
  leftArm.rotation.z = -0.12;
  const rightArm = leftArm.clone();
  rightArm.position.x = 0.19 * scale;
  rightArm.rotation.z = 0.12;

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.105 * scale, 12, 10),
    skin,
  );
  head.position.y = 0.89 * scale;

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.108 * scale, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.48),
    new THREE.MeshStandardMaterial({ color: 0x3f2b22, roughness: 1 }),
  );
  hair.position.y = 0.925 * scale;

  person.add(leftLeg, rightLeg, tunic, leftArm, rightArm, head, hair);
  person.userData.motion = motion;
  person.userData.phase = Math.random() * Math.PI * 2;
  person.userData.speed = 0.75 + Math.random() * 0.45;
  person.userData.parts = { leftArm, rightArm, leftLeg, rightLeg, head };
  return person;
}

function prepareActor(actor: THREE.Group, actors: THREE.Group[]) {
  actor.userData.basePosition = actor.position.clone();
  actor.userData.baseRotation = actor.rotation.y;
  actors.push(actor);
  return actor;
}

function createBoat() {
  const boat = new THREE.Group();
  const hullMaterial = stoneMaterial(0x6f3f2d, 0.8);
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.28, 0.48), hullMaterial);
  hull.position.y = 0.08;
  hull.rotation.y = 0.08;
  boat.add(hull);

  const bow = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.62, 4), hullMaterial);
  bow.rotation.z = Math.PI / 2;
  bow.rotation.y = Math.PI / 4;
  bow.position.set(1.05, 0.1, 0);
  boat.add(bow);

  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.035, 1.75, 8),
    stoneMaterial(0x563426),
  );
  mast.position.set(-0.1, 1, 0);
  const sail = new THREE.Mesh(
    new THREE.PlaneGeometry(0.85, 1.05),
    new THREE.MeshStandardMaterial({
      color: 0xd8c494,
      roughness: 1,
      side: THREE.DoubleSide,
    }),
  );
  sail.position.set(0.33, 1.1, 0);
  sail.rotation.y = Math.PI / 2;
  boat.add(mast, sail);
  boat.position.set(-0.9, -0.17, 4.65);
  boat.rotation.y = -0.16;
  return boat;
}

function createSmoke() {
  const smoke = new THREE.Group();
  for (let index = 0; index < 5; index += 1) {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(0.09 + index * 0.018, 8, 7),
      new THREE.MeshBasicMaterial({
        color: 0xc3bba4,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
      }),
    );
    puff.position.set(0, 0.35 + index * 0.18, 0);
    puff.userData.offset = index * 0.85;
    smoke.add(puff);
  }
  smoke.position.set(-1.02, 0.48, -0.72);
  return smoke;
}

function addWall(group: THREE.Group, x: number, z: number, width: number, rotation = 0) {
  const wallGroup = new THREE.Group();
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.38, 0.22),
    stoneMaterial(0xbca273),
  );
  wall.position.y = 0.19;
  wall.castShadow = true;
  wall.receiveShadow = true;
  wallGroup.add(wall);

  const blockMaterial = stoneMaterial(0xd0b987);
  const courses = 2;
  for (let course = 0; course < courses; course += 1) {
    const blockWidth = 0.27;
    const count = Math.floor(width / blockWidth);
    for (let index = 0; index < count; index += 1) {
      const block = new THREE.Mesh(
        new THREE.BoxGeometry(blockWidth * 0.9, 0.12, 0.045),
        blockMaterial,
      );
      block.position.set(
        -width / 2 + blockWidth / 2 + index * blockWidth + (course % 2) * 0.1,
        0.1 + course * 0.16,
        0.126,
      );
      block.rotation.z = ((index + course) % 3 - 1) * 0.012;
      block.castShadow = true;
      wallGroup.add(block);
    }
  }

  wallGroup.position.set(x, 0, z);
  wallGroup.rotation.y = rotation;
  group.add(wallGroup);
}

function createStoneHouse(
  x: number,
  z: number,
  width: number,
  depth: number,
  height: number,
  index: number,
) {
  const house = new THREE.Group();
  house.position.set(x, 0, z);
  house.rotation.y = (index % 3 - 1) * 0.025;

  const wallColors = [0xc2aa79, 0xbca06e, 0xc8b184, 0xb69a69];
  const walls = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    stoneMaterial(wallColors[index % wallColors.length]),
  );
  walls.position.y = height / 2;
  walls.castShadow = true;
  walls.receiveShadow = true;
  house.add(walls);

  const foundationMaterial = stoneMaterial(0x8f7957);
  for (let stoneIndex = 0; stoneIndex < 5; stoneIndex += 1) {
    const stone = new THREE.Mesh(
      new THREE.BoxGeometry(width / 5.3, 0.1, 0.08),
      foundationMaterial,
    );
    stone.position.set(
      -width / 2 + width / 10 + stoneIndex * (width / 5),
      0.055,
      depth / 2 + 0.035,
    );
    stone.rotation.z = ((stoneIndex + index) % 3 - 1) * 0.025;
    house.add(stone);
  }

  const roofShape = new THREE.Shape();
  roofShape.moveTo(-width / 2 - 0.08, 0);
  roofShape.lineTo(0, 0.26 + (index % 2) * 0.04);
  roofShape.lineTo(width / 2 + 0.08, 0);
  roofShape.closePath();
  const roofDepth = depth + 0.18;
  const roof = new THREE.Mesh(
    new THREE.ExtrudeGeometry(roofShape, {
      depth: roofDepth,
      bevelEnabled: false,
      steps: 1,
    }),
    stoneMaterial([0x874c35, 0x965239, 0x7e4634][index % 3], 0.98),
  );
  roof.position.set(0, height, -roofDepth / 2);
  roof.castShadow = true;
  house.add(roof);

  const tileMaterial = stoneMaterial(0x6d3d2f, 0.96);
  const ridge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, roofDepth + 0.04, 7),
    tileMaterial,
  );
  ridge.position.set(0, height + 0.27 + (index % 2) * 0.04, 0);
  ridge.rotation.x = Math.PI / 2;
  house.add(ridge);

  const doorWidth = Math.min(0.22, width * 0.28);
  const doorHeight = height * 0.62;
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(doorWidth, doorHeight),
    stoneMaterial(0x493a2b, 1),
  );
  door.position.set(-width * 0.17, doorHeight / 2 + 0.02, depth / 2 + 0.052);
  house.add(door);

  const lintel = new THREE.Mesh(
    new THREE.BoxGeometry(doorWidth + 0.1, 0.075, 0.09),
    foundationMaterial,
  );
  lintel.position.set(door.position.x, doorHeight + 0.055, depth / 2 + 0.045);
  lintel.castShadow = true;
  house.add(lintel);

  const window = new THREE.Mesh(
    new THREE.PlaneGeometry(0.1, 0.14),
    new THREE.MeshBasicMaterial({ color: 0x302d25 }),
  );
  window.position.set(width * 0.25, height * 0.58, depth / 2 + 0.053);
  house.add(window);

  return house;
}

function createOliveTree(x: number, z: number, scale: number, index: number) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.085, 0.62, 7),
    stoneMaterial(0x5c4934, 1),
  );
  trunk.position.y = 0.29;
  trunk.rotation.z = (index % 2 ? 1 : -1) * 0.045;
  trunk.castShadow = true;
  tree.add(trunk);

  const foliageMaterial = stoneMaterial([0x596745, 0x626d48, 0x4f6041][index % 3], 1);
  [[-0.16, 0.72, 0], [0.15, 0.74, 0.03], [0, 0.84, -0.08]].forEach(
    ([cx, cy, cz], crownIndex) => {
      const crown = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.28 - crownIndex * 0.015, 0),
        foliageMaterial,
      );
      crown.position.set(cx, cy, cz);
      crown.scale.set(1.25, 0.72, 0.9);
      crown.castShadow = true;
      tree.add(crown);
    },
  );
  tree.position.set(x, 0, z);
  tree.scale.setScalar(scale);
  return tree;
}

function createMediterraneanGround() {
  const environment = new THREE.Group();
  const patchColors = [0x8a784c, 0x776c43, 0x917c4d, 0x6d6841];
  [
    [-2.2, -0.4, 1.15, 0.72],
    [2.15, 0.35, 1.05, 0.65],
    [-0.4, -2.25, 1.35, 0.62],
    [1.4, 2.25, 1.1, 0.58],
  ].forEach(([x, z, sx, sz], index) => {
    const patch = new THREE.Mesh(
      new THREE.CircleGeometry(0.95, 14),
      stoneMaterial(patchColors[index % patchColors.length], 1),
    );
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(x, 0.006 + index * 0.001, z);
    patch.scale.set(sx, sz, 1);
    patch.receiveShadow = true;
    environment.add(patch);
  });

  const rockMaterial = stoneMaterial(0x8d7d60, 1);
  [
    [-3.0, 0.7, 0.16],
    [2.95, 0.65, 0.13],
    [-2.45, 2.0, 0.11],
    [2.35, -2.1, 0.15],
    [0.15, -2.95, 0.12],
  ].forEach(([x, z, size], index) => {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 0), rockMaterial);
    rock.position.set(x, size * 0.58, z);
    rock.scale.set(1.35, 0.7 + (index % 2) * 0.2, 0.9);
    rock.rotation.y = index * 0.8;
    rock.castShadow = true;
    environment.add(rock);
  });

  environment.add(
    createOliveTree(-2.75, -1.55, 0.92, 0),
    createOliveTree(2.72, -1.35, 0.84, 1),
    createOliveTree(-2.75, 1.65, 0.75, 2),
  );

  const shrubMaterial = stoneMaterial(0x6b7142, 1);
  [[-1.95, 2.65], [2.48, 1.92], [2.25, -2.38], [-1.95, -2.35]].forEach(
    ([x, z], index) => {
      const shrub = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 1), shrubMaterial);
      shrub.position.set(x, 0.11, z);
      shrub.scale.set(1.25, 0.65 + (index % 2) * 0.15, 0.9);
      shrub.castShadow = true;
      environment.add(shrub);
    },
  );
  return environment;
}

function createInscriptionTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 1184;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.textAlign = "center";
  context.textBaseline = "middle";

  const drawCarvedText = (text: string, x: number, y: number, maxWidth: number) => {
    context.fillStyle = "rgba(224, 176, 131, 0.34)";
    context.fillText(text, x + 1.2, y + 1.4, maxWidth);
    context.fillStyle = "rgba(55, 28, 22, 0.94)";
    context.fillText(text, x, y, maxWidth);
  };

  context.font = '600 25px "Arial Unicode MS", "Noto Sans", Arial, sans-serif';
  const decreeLines = [
    "ΑΓΑΘΑΙ ΤΥΧΑΙ ΕΦ ΙΕΡΟΜΝΑΜΟΝΟΣ ΠΡΑΞΙΔΑΜΟΥ",
    "ΜΑΧΑΝΕΟΣ ΣΥΝΘΗΚΑ ΟΙΚΙΣΤΑΝ ΙΣΣΑΙΩΝ",
    "ΚΑΙ ΠΥΛΛΟΥ ΚΑΙ ΤΟΥ ΥΟΥ ΔΑΖΟΥ ΤΑΔΕ",
    "ΣΥΝΕΓΡΑΨΑΝ ΟΙ ΟΙΚΙΣΤΑΙ ΚΑΙ ΕΔΟΞΕ ΤΩΙ ΔΑΜΩΙ",
    "ΛΑΒΕΙΝ ΕΞΑΙΡΕΤΟΝ ΤΟΥΣ ΠΡΩΤΟΥΣ",
    "ΚΑΤΑΛΑΒΟΝΤΑΣ ΤΑΝ ΧΩΡΑΝ ΚΑΙ ΤΕΙΧΙΞΑΝΤΑΣ",
    "ΤΑΝ ΠΟΛΙΝ ΤΑΣ ΠΟΛΙΟΣ ΟΙΚΟΠΕΔΟΝ ΕΝ ΕΚΑΣΤΟΝ",
    "ΤΑΣ ΤΕΤΕΙΧΙΣΜΕΝΑΣ ΕΞΑΙΡΕΤΟΝ ΣΥΝ ΤΩΙ ΜΕΡΕΙ",
  ];
  decreeLines.forEach((line, index) => {
    drawCarvedText(line, canvas.width / 2, 80 + index * 59, 700);
  });

  context.strokeStyle = "rgba(67, 35, 26, 0.42)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(54, 566);
  context.lineTo(canvas.width - 54, 566);
  context.stroke();

  // The lower field follows the attested three-phyle layout. At AR scale these
  // names function as carved surface detail; the readable decree remains in the
  // Chronovizor close-up. Greek forms follow PHI Brunšmid, Inschriften 2-14.
  const phyleColumns = [
    {
      heading: "ΔΥΜΑΝΕΣ",
      names: [
        "ΑΡΧΕΛΑΟΣ ΜΕΣΟΔΑΜΟΥ",
        "ΔΑΜΑΤΡΙΟΣ ΑΡΙΣΤΑΡΧΟΥ",
        "ΔΙΟΝΥΣΙΟΣ ΔΕΙΝΑΡΧΟΥ",
        "ΦΑΝΑΙΟΣ ΖΩΙΛΟΥ",
        "ΘΕΟΤΙΜΟΣ ΦΙΝΤΩΝΟΣ",
        "ΑΝΤΑΛΛΟΣ ΑΡΙΣΤΑΡΧΟΥ",
        "ΕΥΚΛΗΣ ΣΩΣΙΟΣ",
        "ΜΗΤΡΙΚΩΝ ΑΡΙΣΤΗΝΟΣ",
        "ΝΙΚΑΝΔΡΟΣ ΔΙΟΝΥΣΙΟΥ",
        "ΟΡΘΩΝ ΚΛΕΑΡΧΟΥ",
        "ΕΥΞΕΝΟΣ ΦΙΛΩΝΟΣ",
        "ΗΡΑΚΛΕΙΔΑΣ ΔΙΟΝΥΣΙΟΥ",
      ],
    },
    {
      heading: "ΥΛΛΕΙΣ",
      names: [
        "ΗΡΑΚΛΕΙΔΑΣ ΘΕΟΤΙΜΟΥ",
        "ΑΠΟΛΛΟΔΩΡΟΣ ΚΟΘΩΝΟΣ",
        "ΑΡΙΣΤΑΡΧΟΣ ΦΙΛΟΚΡΑΤΕΟΣ",
        "ΚΑΛΛΙΜΑΧΟΣ ΑΡΙΣΤΗΝΟΣ",
        "ΔΙΟΝΥΣΙΟΣ ΑΡΙΣΤΗΝΟΣ",
        "ΝΙΚΑΡΧΟΣ",
        "ΑΡΙΣΤΩΝ ΑΡΙΣΤΟΚΛΕΟΣ",
        "ΞΕΝΟΚΡΑΤΗΣ ΑΙΣΧΡΙΩΝΟΣ",
        "ΠΡΩΤΑΓΟΡΑΣ ΦΙΛΩΝΟΣ",
        "ΠΡΩΤΑΡΧΟΣ ΖΩΙΛΟΥ",
        "ΚΛΕΟΔΙΚΟΣ ΜΝΑΣΤΗΡΟΣ",
        "ΘΡΑΣΥΜΑΧΟΣ ΕΥΑΡΧΟΥ",
      ],
    },
    {
      heading: "ΠΑΜΦΥΛΟΙ",
      names: [
        "ΟΝΑΣΙΜΟΣ ΚΕΦΑΛΟΥ",
        "ΒΟΥΛΑΓΟΡΑΣ ΦΙΛΕΑ",
        "ΣΑΛΛΑΣ ΦΙΛΩΝΟΣ",
        "ΑΙΣΧΙΝΑΣ ΣΑΛΛΑ",
        "ΠΑΝΘΕΙΔΑΣ ΗΡΑΚΛΕΙΔΑ",
        "ΚΑΛΛΙΜΑΧΙΔΑΣ ΟΝΑΣΙΜΟΥ",
        "ΑΝΤΙΠΑΤΡΟΣ ΣΑΛΛΑ",
        "ΟΡΘΩΝ ΦΙΛΙΑΡΧΟΥ",
        "ΛΥΣΑΝΙΑΣ ΞΕΝΟΤΙΜΟΥ",
        "ΣΩΣΑΝΔΡΟΣ ΜΙΚΥΛΟΥ",
        "ΣΩΣΙΜΑΧΟΣ ΒΟΥΛΑΓΟΡΑ",
        "ΝΙΚΑΝΩΡ ΝΙΚΩΝΟΣ",
      ],
    },
  ] as const;

  const columnWidth = 226;
  phyleColumns.forEach((column, columnIndex) => {
    const x = 45 + columnWidth / 2 + columnIndex * columnWidth;
    context.font = '700 22px "Arial Unicode MS", "Noto Sans", Arial, sans-serif';
    drawCarvedText(column.heading, x, 610, columnWidth - 18);
    context.font = '600 14px "Arial Unicode MS", "Noto Sans", Arial, sans-serif';
    column.names.forEach((name, rowIndex) => {
      drawCarvedText(name, x, 654 + rowIndex * 42, columnWidth - 16);
    });
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function createStele() {
  const pivot = new THREE.Group();
  pivot.position.set(0.55, 0.08, 0.42);

  const stele = new THREE.Group();
  stele.userData.archaeologicalForm = "profiled-flat-head";
  const stone = stoneMaterial(0x98654e, 0.98);
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-0.36, 0.14);
  bodyShape.lineTo(-0.37, 0.47);
  bodyShape.lineTo(-0.36, 0.9);
  bodyShape.lineTo(0.36, 0.9);
  bodyShape.lineTo(0.37, 0.47);
  bodyShape.lineTo(0.36, 0.14);
  bodyShape.closePath();
  const body = new THREE.Mesh(
    new THREE.ExtrudeGeometry(bodyShape, {
      depth: 0.13,
      bevelEnabled: true,
      bevelSize: 0.009,
      bevelThickness: 0.009,
      bevelSegments: 1,
    }),
    stone,
  );
  body.position.z = -0.065;
  body.castShadow = true;
  body.receiveShadow = true;
  stele.add(body);

  const addMoulding = (
    width: number,
    height: number,
    depth: number,
    y: number,
    color: number,
  ) => {
    const moulding = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      stoneMaterial(color, 0.98),
    );
    moulding.position.set(0, y, 0);
    moulding.castShadow = true;
    moulding.receiveShadow = true;
    stele.add(moulding);
  };

  // Simple profiled cornice on a flat head: four shallow horizontal bands,
  // matching the museum reconstruction without inventing a temple pediment.
  addMoulding(0.73, 0.04, 0.15, 0.91, 0x8d5d49);
  addMoulding(0.78, 0.045, 0.17, 0.948, 0x9d6a52);
  addMoulding(0.84, 0.045, 0.19, 0.988, 0x895b48);
  addMoulding(0.88, 0.07, 0.21, 1.045, 0xa06d54);

  const inscriptionTexture = createInscriptionTexture();
  if (inscriptionTexture) {
    const inscription = new THREE.Mesh(
      new THREE.PlaneGeometry(0.66, 0.7),
      new THREE.MeshBasicMaterial({
        map: inscriptionTexture,
        transparent: true,
        depthWrite: false,
      }),
    );
    inscription.position.set(0, 0.525, 0.075);
    stele.add(inscription);
  }

  addMoulding(0.84, 0.06, 0.23, 0.03, 0x805443);
  addMoulding(0.78, 0.055, 0.2, 0.088, 0x91604a);
  addMoulding(0.72, 0.04, 0.17, 0.135, 0x9e6c52);

  pivot.add(stele);
  pivot.rotation.x = -Math.PI / 2;
  return pivot;
}

function buildDiorama(): { root: THREE.Group; handles: SceneHandles } {
  const root = new THREE.Group();
  const actors: THREE.Group[] = [];
  const riggedPeople: RiggedActor[] = [];
  const surveyorPlaceholders: THREE.Group[] = [];
  const terrain = new THREE.Mesh(
    new THREE.CylinderGeometry(3.85, 3.55, 0.34, 48),
    new THREE.MeshStandardMaterial({
      color: 0x777349,
      roughness: 1,
      transparent: true,
      opacity: 1,
    }),
  );
  terrain.position.y = -0.22;
  terrain.receiveShadow = true;
  root.add(terrain);

  const shore = new THREE.Mesh(
    new THREE.RingGeometry(3.45, 5.9, 64),
    new THREE.MeshStandardMaterial({
      color: 0x244f58,
      transparent: true,
      opacity: 0.76,
      roughness: 0.35,
    }),
  );
  shore.rotation.x = -Math.PI / 2;
  shore.position.y = -0.35;
  root.add(shore);

  root.add(createMediterraneanGround());

  const colony = new THREE.Group();
  addWall(colony, 0, -1.5, 3.7);
  addWall(colony, -1.14, 1.5, 1.42);
  addWall(colony, 1.14, 1.5, 1.42);
  addWall(colony, -1.75, 0, 3.15, Math.PI / 2);
  addWall(colony, 1.75, 0, 3.15, Math.PI / 2);

  const houseSpecs = [
    [-1.07, -0.76, 0.74, 0.62, 0.52],
    [-0.1, -0.83, 0.82, 0.66, 0.58],
    [1.0, -0.69, 0.72, 0.58, 0.5],
    [-1.1, 0.45, 0.78, 0.64, 0.54],
    [0.02, 0.38, 0.68, 0.58, 0.46],
    [1.15, 0.52, 0.68, 0.56, 0.48],
  ];
  houseSpecs.forEach(([x, z, width, depth, height], index) => {
    colony.add(createStoneHouse(x, z, width, depth, height, index));
  });

  const pathMaterial = stoneMaterial(0x9f8a63, 1);
  for (let index = 0; index < 6; index += 1) {
    const pathStone = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.17 + (index % 2) * 0.025, 0),
      pathMaterial,
    );
    pathStone.position.set((index % 2 ? 0.12 : -0.1), 0.035, 1.25 - index * 0.28);
    pathStone.scale.set(1.25, 0.18, 0.78);
    pathStone.rotation.y = index * 0.47;
    pathStone.receiveShadow = true;
    colony.add(pathStone);
  }
  root.add(colony);

  const boat = createBoat();
  root.add(boat);

  const settlers = new THREE.Group();
  const settlerPositions: Array<[number, number, number, MotionKind]> = [
    [-1.2, 2.85, 0x315c67, "carry"],
    [-0.78, 2.62, 0x8e6843, "walk"],
    [-0.35, 2.82, 0x6a5a79, "carry"],
    [0.15, 2.48, 0x315c67, "walk"],
    [0.62, 2.72, 0x8e6843, "talk"],
    [1.05, 2.42, 0x6a5a79, "talk"],
    [1.38, 2.88, 0x486d74, "walk"],
    [-1.48, 2.35, 0x7a4a35, "idle"],
  ];
  settlerPositions.forEach(([x, z, color, motion], index) => {
    const person = makePerson(color, 0.88, motion);
    person.position.set(x, 0, z);
    person.rotation.y = index % 2 === 0 ? Math.PI : Math.PI * 0.85;
    prepareActor(person, actors);
    settlers.add(person);

    if (motion === "carry") {
      const amphora = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.07, 0.13, 4, 7),
        stoneMaterial(0x9b5d3e),
      );
      amphora.position.set(0.18, 0.34, 0.05);
      person.add(amphora);
    }
  });
  root.add(settlers);

  const founders = new THREE.Group();
  [
    [-0.58, 0.12, 0x315c67],
    [-0.3, 0.08, 0x315c67],
    [0.28, 0.1, 0x7a4a35],
    [0.56, 0.04, 0x7a4a35],
  ].forEach(([x, z, color], index) => {
    const person = makePerson(color, 1, index < 2 ? "talk" : "idle");
    person.position.set(x, 0, z);
    person.rotation.y = index < 2 ? Math.PI / 2 : -Math.PI / 2;
    prepareActor(person, actors);
    founders.add(person);
  });
  founders.position.set(-0.1, 0, 0.24);
  root.add(founders);

  const assembly = new THREE.Group();
  const phyleColors = [0x486d74, 0x8e6843, 0x6a5a79];
  for (let index = 0; index < 18; index += 1) {
    const angle = (index / 18) * Math.PI * 2;
    const radius = 1.05 + (index % 2) * 0.18;
    const person = makePerson(
      phyleColors[index % 3],
      0.78,
      index % 5 === 0 ? "vote" : index % 3 === 0 ? "talk" : "idle",
    );
    person.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    person.rotation.y = -angle + Math.PI / 2;
    prepareActor(person, actors);
    assembly.add(person);
  }
  assembly.visible = false;
  root.add(assembly);

  const plots = new THREE.Group();
  const gridMaterial = new THREE.LineBasicMaterial({
    color: 0xd4b36d,
    transparent: true,
    opacity: 0.9,
  });
  const gridPoints: THREE.Vector3[] = [];
  for (let i = -3; i <= 3; i += 1) {
    gridPoints.push(new THREE.Vector3(i * 0.48, 0.015, -1.18));
    gridPoints.push(new THREE.Vector3(i * 0.48, 0.015, 1.18));
  }
  for (let i = -2; i <= 2; i += 1) {
    gridPoints.push(new THREE.Vector3(-1.45, 0.015, i * 0.58));
    gridPoints.push(new THREE.Vector3(1.45, 0.015, i * 0.58));
  }
  const grid = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(gridPoints),
    gridMaterial,
  );
  plots.add(grid);

  const soilColors = [0x6d6745, 0x746949, 0x625f42];
  for (let column = -2; column <= 2; column += 1) {
    for (let row = -1; row <= 1; row += 1) {
      const patch = new THREE.Mesh(
        new THREE.PlaneGeometry(0.42, 0.5),
        new THREE.MeshStandardMaterial({
          color: soilColors[(column + row + 6) % soilColors.length],
          roughness: 1,
        }),
      );
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(column * 0.48, 0.008, row * 0.58);
      patch.receiveShadow = true;
      plots.add(patch);
    }
  }

  plots.position.set(0, 0, 2.55);
  plots.visible = false;
  root.add(plots);

  const surveyors = new THREE.Group();
  [
    [-1.28, -0.72, 0x315c67],
    [1.28, -0.72, 0x8e6843],
    [-1.28, 0.72, 0x6a5a79],
    [1.28, 0.72, 0x486d74],
    [0, -1.02, 0x7a4a35],
    [0, 1.02, 0x315c67],
  ].forEach(([x, z, color], index) => {
    const person = makePerson(color, 0.82, index < 4 ? "measure" : "talk");
    person.position.set(x, 0, z);
    person.rotation.y = index % 2 === 0 ? Math.PI / 2 : -Math.PI / 2;
    prepareActor(person, actors);
    surveyorPlaceholders.push(person);
    surveyors.add(person);
  });
  surveyors.position.set(0, 0, 2.55);
  surveyors.visible = false;
  root.add(surveyors);

  const riggedActors = new THREE.Group();
  riggedActors.visible = false;
  root.add(riggedActors);

  const names = new THREE.Group();
  phyleColors.forEach((color, column) => {
    for (let row = 0; row < 7; row += 1) {
      const marker = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.025, 0.025),
        new THREE.MeshBasicMaterial({ color }),
      );
      marker.position.set(-0.42 + column * 0.42, 0.12 + row * 0.08, 0);
      names.add(marker);
    }
  });
  names.position.set(0.55, 0.48, 0.515);
  names.visible = false;
  root.add(names);

  const stelePivot = createStele();
  root.add(stelePivot);

  const smoke = createSmoke();
  root.add(smoke);

  return {
    root,
    handles: {
      settlers,
      founders,
      assembly,
      surveyors,
      plots,
      names,
      stelePivot,
      boat,
      smoke,
      actors,
      riggedActors,
      riggedPeople,
      surveyorPlaceholders,
      terrain,
      shore,
    },
  };
}

export function Diorama({ stage, viewpoint, active = true, onArStop }: DioramaProps) {
  const { copy } = useI18n();
  const dioramaCopy = copy.diorama;
  const mountRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef(stage);
  const viewpointRef = useRef(viewpoint);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    viewpointRef.current = viewpoint;
  }, [viewpoint]);

  useEffect(() => {
    if (!active) return;
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x17211f, 0.035);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 100);
    camera.position.set(7, 5, 8);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      mount.classList.add("webgl-unavailable");
      return () => mount.classList.remove("webgl-unavailable");
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.xr.enabled = true;
    renderer.domElement.setAttribute(
      "aria-label",
      dioramaCopy.canvasAria,
    );
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.minDistance = 2.2;
    controls.maxDistance = 15;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.target.set(0, 0.4, 0);
    controls.enableDamping = true;

    const ambient = new THREE.HemisphereLight(0xf3d6a2, 0x1f3333, 2.1);
    const sun = new THREE.DirectionalLight(0xffd59a, 3.2);
    sun.position.set(-5, 8, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(ambient, sun);

    const { root, handles } = buildDiorama();
    root.rotation.y = -0.28;
    scene.add(root);

    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.08, 0.11, 36).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xd5b878 }),
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    const controller = renderer.xr.getController(0);
    scene.add(controller);

    let hitTestSource: XRHitTestSource | null = null;
    let hitTestSourceRequested = false;
    let arActive = false;
    let placedInAR = false;
    let xrSupported = false;
    let currentSession: XRSession | null = null;
    let cameraStream: MediaStream | null = null;
    let cameraFallbackActive = false;
    let disposed = false;

    const characterLoader = new GLTFLoader();
    const loadCharacter = (url: string) =>
      new Promise<THREE.Group>((resolve, reject) => {
        characterLoader.load(url, (gltf) => resolve(gltf.scene), undefined, reject);
      });

    void Promise.all([
      loadCharacter(siteAsset("/models/lumbarda/Greek_Male_Peasant.gltf")),
      loadCharacter(siteAsset("/models/lumbarda/Greek_Female_Peasant.gltf")),
    ])
      .then(([maleTemplate, femaleTemplate]) => {
        if (disposed) return;

        const arrival: RigLayout[] = [
          { x: -1.3, z: 2.82, angle: Math.PI, motion: "carry" },
          { x: -0.88, z: 2.55, angle: 2.8, motion: "walk" },
          { x: -0.35, z: 2.86, angle: Math.PI, motion: "carry" },
          { x: 0.18, z: 2.46, angle: 2.92, motion: "walk" },
          { x: 0.65, z: 2.72, angle: 3.25, motion: "talk" },
          { x: 1.06, z: 2.4, angle: 2.9, motion: "talk" },
          { x: 1.42, z: 2.9, angle: Math.PI, motion: "walk" },
          { x: -1.52, z: 2.28, angle: 2.75, motion: "idle" },
        ];
        const agreement: RigLayout[] = [
          { x: -0.62, z: 0.22, angle: Math.PI / 2, motion: "talk" },
          { x: -0.28, z: 0.1, angle: Math.PI / 2, motion: "idle" },
          { x: 0.28, z: 0.1, angle: -Math.PI / 2, motion: "talk" },
          { x: 0.63, z: 0.2, angle: -Math.PI / 2, motion: "idle" },
        ];
        const assemblyLayout: RigLayout[] = Array.from({ length: 14 }, (_, index) => {
          const angle = (index / 14) * Math.PI * 2;
          const radius = 1.06 + (index % 2) * 0.2;
          return {
            x: Math.cos(angle) * radius,
            z: Math.sin(angle) * radius,
            angle: -angle + Math.PI / 2,
            motion: index % 5 === 0 ? "vote" : index % 3 === 0 ? "talk" : "idle",
          };
        });
        const landDivision: RigLayout[] = [
          { x: -1.38, z: 1.83, angle: Math.PI / 2, motion: "measure" },
          { x: 1.38, z: 1.83, angle: -Math.PI / 2, motion: "measure" },
          { x: -1.36, z: 3.27, angle: Math.PI / 2, motion: "measure" },
          { x: 1.36, z: 3.27, angle: -Math.PI / 2, motion: "measure" },
          { x: -0.58, z: 1.55, angle: 0.18, motion: "carry" },
          { x: 0.18, z: 1.57, angle: -0.28, motion: "talk" },
          { x: 0.84, z: 1.62, angle: -0.5, motion: "talk" },
          { x: -0.92, z: 3.55, angle: Math.PI, motion: "walk" },
          { x: 0.98, z: 3.52, angle: Math.PI, motion: "idle" },
        ];
        const dedication: RigLayout[] = [
          { x: -1.35, z: -0.48, angle: 0.65, motion: "idle" },
          { x: -0.92, z: -0.82, angle: 0.35, motion: "talk" },
          { x: -0.2, z: -0.95, angle: 0.08, motion: "idle" },
          { x: 0.58, z: -1.0, angle: -0.12, motion: "talk" },
          { x: 1.25, z: -0.68, angle: -0.48, motion: "idle" },
          { x: -1.25, z: 0.68, angle: 1.35, motion: "idle" },
          { x: 1.72, z: 0.55, angle: -1.42, motion: "idle" },
          { x: -0.35, z: 1.42, angle: 2.8, motion: "talk" },
          { x: 1.18, z: 1.35, angle: 3.35, motion: "idle" },
        ];
        const stageLayouts: RigLayout[][] = [
          arrival,
          agreement,
          assemblyLayout,
          landDivision,
          assemblyLayout,
          dedication,
        ];
        const palette = [
          0x416b70,
          0xa0784e,
          0x78627d,
          0x536a50,
          0x8b593e,
          0xc1a26c,
          0x455e69,
          0x805442,
        ];
        const femaleActors = new Set([1, 3, 6, 9, 11, 13]);

        for (let index = 0; index < 14; index += 1) {
          const female = femaleActors.has(index);
          const actor = createRiggedActor(
            female ? femaleTemplate : maleTemplate,
            palette[index % palette.length],
            "idle",
            female ? 0.535 : 0.55,
            index,
            female,
          );
          actor.root.visible = false;
          actor.root.userData.layouts = stageLayouts.map((layout) => layout[index] ?? null);
          actor.root.userData.activeStage = -1;

          handles.riggedActors.add(actor.root);
          handles.riggedPeople.push(actor);
        }

        handles.riggedActors.visible = true;
      })
      .catch((error) => {
        console.warn("Rigged character models could not load; keeping lightweight cast.", error);
      });

    controller.addEventListener("select", () => {
      if (!reticle.visible) return;
      reticle.matrix.decompose(root.position, root.quaternion, root.scale);
      root.scale.setScalar(viewpointRef.current === "diorama" ? 0.22 : 1.45);
      root.visible = true;
      placedInAR = true;
    });

    const arButton = mount.querySelector<HTMLButtonElement>("[data-ar-button]");
    const cameraFeed = mount.querySelector<HTMLVideoElement>("[data-camera-feed]");
    const guidanceTitle = mount.querySelector<HTMLElement>("[data-guidance-title]");
    const guidanceText = mount.querySelector<HTMLElement>("[data-guidance-text]");
    const arMessage = mount.querySelector<HTMLElement>("[data-ar-message]");

    const setGuidance = (title: string, text: string) => {
      if (guidanceTitle) guidanceTitle.textContent = title;
      if (guidanceText) guidanceText.textContent = text;
    };

    const hideMessage = () => {
      arMessage?.classList.remove("is-visible");
    };

    const showMessage = (text: string) => {
      if (!arMessage) return;
      arMessage.textContent = text;
      arMessage.classList.add("is-visible");
    };

    const resetSceneAfterCamera = () => {
      root.visible = true;
      root.position.set(0, 0, 0);
      root.quaternion.identity();
      root.scale.setScalar(1);
      controls.enabled = true;
    };

    const stopCameraFallback = () => {
      cameraStream?.getTracks().forEach((track) => track.stop());
      cameraStream = null;
      if (cameraFeed) {
        cameraFeed.pause();
        cameraFeed.srcObject = null;
      }
      cameraFallbackActive = false;
      document.body.classList.remove("camera-active");
      resetSceneAfterCamera();
      if (arButton) {
        arButton.disabled = false;
        arButton.textContent = dioramaCopy.startAr;
      }
      onArStop?.();
    };

    const startCameraFallback = async () => {
      if (!cameraFeed || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API is not available in this browser.");
      }

      cameraStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      if (disposed) {
        cameraStream.getTracks().forEach((track) => track.stop());
        return;
      }

      cameraFeed.srcObject = cameraStream;
      await cameraFeed.play();
      cameraFallbackActive = true;
      document.body.classList.add("camera-active");
      root.visible = true;
      controls.enabled = true;
      setGuidance(
        dioramaCopy.cameraGuidanceTitle,
        dioramaCopy.cameraGuidanceText,
      );
      if (arButton) {
        arButton.disabled = false;
        arButton.textContent = dioramaCopy.stopCamera;
      }
    };

    const startExperience = async () => {
      if (!arButton) return;
      hideMessage();

      if (currentSession) {
        await currentSession.end();
        return;
      }

      if (cameraFallbackActive) {
        stopCameraFallback();
        return;
      }

      arButton.disabled = true;
      arButton.textContent = dioramaCopy.starting;

      if (xrSupported && navigator.xr) {
        try {
          const session = await navigator.xr.requestSession("immersive-ar", {
            requiredFeatures: ["hit-test"],
            optionalFeatures: ["dom-overlay"],
            domOverlay: { root: document.body },
          });
          currentSession = session;
          renderer.xr.setReferenceSpaceType("local");
          await renderer.xr.setSession(session);
          return;
        } catch (error) {
          console.warn("WebXR session could not start; using camera fallback.", error);
          currentSession?.end();
          currentSession = null;
        }
      }

      try {
        await startCameraFallback();
      } catch (error) {
        console.warn("Camera fallback could not start.", error);
        cameraStream?.getTracks().forEach((track) => track.stop());
        cameraStream = null;
        cameraFeed?.pause();
        if (cameraFeed) cameraFeed.srcObject = null;
        arButton.disabled = false;
        arButton.textContent = dioramaCopy.retry;
        showMessage(dioramaCopy.cameraError);
      }
    };

    arButton?.addEventListener("click", startExperience);

    if (navigator.xr) {
      navigator.xr
        .isSessionSupported("immersive-ar")
        .then((supported) => {
          xrSupported = supported;
        })
        .catch((error) => {
          console.warn("WebXR support check failed; camera fallback remains available.", error);
        });
    }

    renderer.xr.addEventListener("sessionstart", () => {
      currentSession = renderer.xr.getSession();
      arActive = true;
      placedInAR = false;
      root.visible = false;
      controls.enabled = false;
      document.body.classList.add("ar-active");
      setGuidance(
        dioramaCopy.surfaceGuidanceTitle,
        dioramaCopy.surfaceGuidanceText,
      );
      if (arButton) {
        arButton.disabled = false;
        arButton.textContent = dioramaCopy.stopAr;
      }
    });

    renderer.xr.addEventListener("sessionend", () => {
      currentSession = null;
      arActive = false;
      hitTestSource = null;
      hitTestSourceRequested = false;
      root.visible = true;
      root.position.set(0, 0, 0);
      root.quaternion.identity();
      root.scale.setScalar(1);
      controls.enabled = true;
      document.body.classList.remove("ar-active");
      if (arButton) {
        arButton.disabled = false;
        arButton.textContent = dioramaCopy.startAr;
      }
      if (!disposed) onArStop?.();
    });

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const desiredCamera = new THREE.Vector3();
    const desiredTarget = new THREE.Vector3();
    const desiredScale = new THREE.Vector3();
    const desiredSteleScale = new THREE.Vector3();

    renderer.setAnimationLoop((_time, frame) => {
      const elapsed = _time * 0.001;
      const currentStage = stageRef.current;
      const riggedReady = handles.riggedPeople.length > 0;
      handles.settlers.visible = !riggedReady && currentStage === 0;
      handles.founders.visible = !riggedReady && currentStage === 1;
      handles.assembly.visible = !riggedReady && (currentStage === 2 || currentStage >= 4);
      handles.surveyors.visible = !riggedReady && currentStage === 3;
      handles.plots.visible = currentStage === 3;
      handles.riggedActors.visible = riggedReady;
      handles.names.visible = currentStage === 4;
      handles.boat.visible = currentStage === 0;
      handles.smoke.visible = currentStage >= 1;

      handles.actors.forEach((actor) => {
        if (!actor.parent?.visible) return;
        const base = actor.userData.basePosition as THREE.Vector3;
        const parts = actor.userData.parts as {
          leftArm: THREE.Mesh;
          rightArm: THREE.Mesh;
          leftLeg: THREE.Mesh;
          rightLeg: THREE.Mesh;
          head: THREE.Mesh;
        };
        const phase = elapsed * actor.userData.speed + actor.userData.phase;
        const step = Math.sin(phase * 4.2);
        const motion = actor.userData.motion as MotionKind;

        actor.position.copy(base);
        actor.rotation.y = actor.userData.baseRotation + Math.sin(phase * 0.55) * 0.035;
        actor.position.y += Math.abs(step) * (motion === "walk" ? 0.018 : 0.006);
        parts.leftArm.rotation.x = 0;
        parts.rightArm.rotation.x = 0;
        parts.leftLeg.rotation.x = 0;
        parts.rightLeg.rotation.x = 0;
        parts.head.rotation.y = Math.sin(phase * 0.72) * 0.18;

        if (motion === "walk") {
          actor.position.z += Math.sin(phase * 0.36) * 0.28;
          parts.leftArm.rotation.x = step * 0.55;
          parts.rightArm.rotation.x = -step * 0.55;
          parts.leftLeg.rotation.x = -step * 0.34;
          parts.rightLeg.rotation.x = step * 0.34;
        } else if (motion === "talk") {
          parts.rightArm.rotation.x = -0.65 - Math.sin(phase * 1.8) * 0.28;
          parts.leftArm.rotation.x = -0.18 + Math.sin(phase * 1.2) * 0.12;
        } else if (motion === "vote") {
          parts.rightArm.rotation.x = -1.75 + Math.sin(phase) * 0.08;
          parts.leftArm.rotation.x = -0.18;
        } else if (motion === "measure") {
          parts.leftArm.rotation.x = -1.05 + Math.sin(phase) * 0.12;
          parts.rightArm.rotation.x = -1.05 - Math.sin(phase) * 0.12;
        } else if (motion === "carry") {
          parts.leftArm.rotation.x = -0.72;
          parts.rightArm.rotation.x = -0.72;
          parts.leftLeg.rotation.x = -step * 0.25;
          parts.rightLeg.rotation.x = step * 0.25;
        } else {
          parts.leftArm.rotation.x = Math.sin(phase) * 0.05;
          parts.rightArm.rotation.x = -Math.sin(phase) * 0.05;
        }
      });

      handles.riggedPeople.forEach((actor) => {
        const layouts = actor.root.userData.layouts as Array<RigLayout | null>;
        const layout = layouts?.[currentStage] ?? null;
        actor.root.visible = Boolean(layout);
        if (!layout) return;
        if (actor.root.userData.activeStage !== currentStage) {
          actor.root.userData.activeStage = currentStage;
          actor.motion = layout.motion;
          actor.basePosition.set(layout.x, 0, layout.z);
          actor.baseRotation = layout.angle;
          actor.root.position.copy(actor.basePosition);
          actor.root.rotation.y = actor.baseRotation;
        }
        animateRiggedActor(actor, elapsed);
      });

      handles.boat.position.y = -0.17 + Math.sin(elapsed * 1.25) * 0.055;
      handles.boat.rotation.z = Math.sin(elapsed * 0.9) * 0.018;
      handles.smoke.children.forEach((puff, index) => {
        const cycle = (elapsed * 0.16 + puff.userData.offset) % 1;
        puff.position.y = 0.35 + index * 0.08 + cycle * 0.72;
        puff.position.x = Math.sin(elapsed * 0.7 + index) * 0.08;
        const material = (puff as THREE.Mesh).material as THREE.MeshBasicMaterial;
        material.opacity = Math.sin(cycle * Math.PI) * 0.2;
      });

      const terrainMaterial = handles.terrain.material as THREE.MeshStandardMaterial;
      const shoreMaterial = handles.shore.material as THREE.MeshStandardMaterial;
      const immersiveCamera = cameraFallbackActive && viewpointRef.current === "inside";
      const terrainOpacity = immersiveCamera ? 0 : cameraFallbackActive ? 0.62 : 1;
      const shoreOpacity = immersiveCamera ? 0 : cameraFallbackActive ? 0.22 : 0.76;
      terrainMaterial.opacity += (terrainOpacity - terrainMaterial.opacity) * 0.08;
      shoreMaterial.opacity += (shoreOpacity - shoreMaterial.opacity) * 0.08;

      const psephismaVisible = currentStage === 3 || currentStage >= 5;
      const targetRotation = psephismaVisible ? 0 : -Math.PI / 2;
      handles.stelePivot.rotation.x +=
        (targetRotation - handles.stelePivot.rotation.x) * 0.055;
      const steleTargetX = currentStage === 3 ? -1.72 : 0.55;
      const steleTargetY = psephismaVisible ? 0.08 : 0.045;
      const steleTargetZ = currentStage === 3 ? 2.12 : 0.42;
      const steleScale = currentStage === 3 ? 0.9 : 1;
      handles.stelePivot.position.x += (steleTargetX - handles.stelePivot.position.x) * 0.055;
      handles.stelePivot.position.y += (steleTargetY - handles.stelePivot.position.y) * 0.055;
      handles.stelePivot.position.z += (steleTargetZ - handles.stelePivot.position.z) * 0.055;
      desiredSteleScale.setScalar(steleScale);
      handles.stelePivot.scale.lerp(desiredSteleScale, 0.055);

      if (!arActive) {
        controls.minDistance = viewpointRef.current === "inside" ? 0.45 : 2.2;
        controls.maxDistance = viewpointRef.current === "inside" ? 6 : 15;
        controls.maxPolarAngle =
          viewpointRef.current === "inside" ? Math.PI * 0.72 : Math.PI * 0.48;
        if (viewpointRef.current === "diorama") {
          if (cameraFallbackActive) {
            desiredCamera.set(8.6, 6.25, 9.7);
          } else {
            desiredCamera.set(7, 5, 8);
          }
          desiredTarget.set(0, 0.4, 0);
        } else {
          if (currentStage === 0) {
            desiredCamera.set(0.15, 1.3, 3.8);
            desiredTarget.set(0, 0.8, 2.35);
          } else if (currentStage === 3) {
            desiredCamera.set(-0.12, 1.05, 4.68);
            desiredTarget.set(-0.35, 0.82, 2.28);
          } else if (currentStage >= 4) {
            desiredCamera.set(1.6, 1.45, 2.15);
            desiredTarget.set(0.5, 0.86, 0.42);
          } else {
            desiredCamera.set(0.25, 1.42, 2.75);
            desiredTarget.set(0.1, 0.98, 0.12);
          }
        }
        camera.position.lerp(desiredCamera, viewpointRef.current === "inside" ? 0.055 : 0.035);
        controls.target.lerp(desiredTarget, 0.06);
        controls.update();
        if (viewpointRef.current === "diorama") {
          root.rotation.y += 0.0008;
        } else {
          root.rotation.y += (-0.18 - root.rotation.y) * 0.035;
        }
      } else {
        desiredScale.setScalar(viewpointRef.current === "diorama" ? 0.22 : 1.45);
        if (placedInAR) root.scale.lerp(desiredScale, 0.05);

        if (frame) {
          const referenceSpace = renderer.xr.getReferenceSpace();
          const session = renderer.xr.getSession();
          if (!hitTestSourceRequested && session) {
            session.requestReferenceSpace("viewer").then((space) => {
              const sourcePromise = session.requestHitTestSource?.({ space });
              sourcePromise?.then((source) => {
                hitTestSource = source;
              });
            });
            session.addEventListener("end", () => {
              hitTestSourceRequested = false;
              hitTestSource = null;
            });
            hitTestSourceRequested = true;
          }

          if (hitTestSource && referenceSpace && !placedInAR) {
            const hits = frame.getHitTestResults(hitTestSource);
            if (hits.length > 0) {
              const pose = hits[0].getPose(referenceSpace);
              if (pose) {
                reticle.visible = true;
                reticle.matrix.fromArray(pose.transform.matrix);
              }
            } else {
              reticle.visible = false;
            }
          } else {
            reticle.visible = false;
          }
        }
      }

      renderer.render(scene, camera);
    });

    return () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      controls.dispose();
      hitTestSource?.cancel();
      arButton?.removeEventListener("click", startExperience);
      currentSession?.end();
      cameraStream?.getTracks().forEach((track) => track.stop());
      document.body.classList.remove("ar-active", "camera-active");
      renderer.dispose();
      renderer.domElement.remove();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, [active, dioramaCopy, onArStop]);

  return (
    <div ref={mountRef} className={active ? "diorama-mount" : "diorama-mount is-suspended"}>
      <video className="camera-feed" data-camera-feed muted playsInline />
      <div className="ar-slot" data-ar-slot>
        <button
          type="button"
          className="ar-launch-button"
          data-ar-button
          aria-label={dioramaCopy.launchAria}
        >
          {dioramaCopy.startAr}
        </button>
      </div>
      <p className="ar-message" data-ar-message role="alert" />
      <div className="ar-guidance" role="status">
        <strong data-guidance-title>{dioramaCopy.surfaceGuidanceTitle}</strong>
        <span data-guidance-text>{dioramaCopy.surfaceGuidanceText}</span>
      </div>
      <p className="canvas-instruction">{dioramaCopy.canvasInstruction}</p>
      <p className="webgl-fallback" role="status">{dioramaCopy.webglFallback}</p>
    </div>
  );
}
