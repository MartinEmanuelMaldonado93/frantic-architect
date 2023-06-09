import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export default class FranticArchitect {
  constructor() {
    // cube coordinates
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.phantomX = 0;
    this.phantomY = 0;
    this.phantomZ = 0;

    // ground coordinates
    this.groundX = 0;
    this.groundY = -1;
    this.groundZ = 0;

    // compound body settings
    this.size = 1;
    this.mass = 10;
    this.existingBlocks = [];
    this.phantomBlockAccepted = false;

    // game loop settings
    this.gameLoopLength = 0.5;
    this.currentLoopLength = 0;

    this.phantomShape = undefined;
    this.cannonWorld = new CANNON.World({
      gravity: new CANNON.Vec3(0, -10, 0),
    });
    this._addGround();
    this._addCompoundBody();

    this.threeGroup = new THREE.Group();
    this._initGame();
    this._renderInitialBlock();
    this._renderPhantomBlock();
  }

  update(delta) {
    this.cannonWorld.fixedStep();
    this.currentLoopLength += delta;
    if (this.currentLoopLength > this.gameLoopLength) {
      this.currentLoopLength = 0;
      this._displayPhantomBlock();
    }
  }

  _updateCenterOfMass() {
    // first calculate the center of mass
    const compound = new CANNON.Vec3();
    // console.log(com);
    // debugger;
    this.compoundBody.shapeOffsets.forEach(function (offset) {
      compound.vadd(offset, compound);
    });
    // console.log(com);
    compound.scale(1 / this.compoundBody.shapes.length, compound);
    // console.log(com);
    // move the shapes so the body origin is at the COM
    this.compoundBody.shapeOffsets.forEach(function (offset) {
      // console.log(offset);
      offset.vsub(compound, offset);
    });
    // now move the body so the shapes' net displacement is 0
    const worldCOM = new CANNON.Vec3();
    this.compoundBody.vectorToWorldFrame(compound, worldCOM);
    this.compoundBody.position.vadd(worldCOM, this.compoundBody.position);
  }

  _randomizePhantomXYZ() {
    this._updatePhantomXYZ();

    const randomBlocks = () => {
      const axis = Math.floor(Math.random() * 3);
      const direction = Math.floor(Math.random() * 2);
      const delta = direction === 0 ? 1 : -1;

      if (axis === 0) {
        this.phantomX += delta;
        return;
      }

      if (axis === 1) {
        if (this.y <= 0.1) {
          this.phantomY = 1;
          return;
        }
        // else {
        this.phantomY += delta;
        // }
        return;
      }
      //   else {
      this.phantomZ += delta;
      //   }
    };
    randomBlocks();

    const blockAlreadyExists = () => {
      return this.existingBlocks.some(
        (block) =>
          block.x === this.phantomX &&
          block.y === this.phantomY &&
          block.z === this.phantomZ
      );
    };

    while (blockAlreadyExists()) {
      this._updatePhantomXYZ();
      randomBlocks();
    }
  }

  addBlockToScene(x, y, z) {
    const geometery = new THREE.BoxBufferGeometry(1, 1, 1);
    // const material = new THREE.MeshPhongMaterial();
    const material = new THREE.MeshStandardMaterial();
    // const material = new THREE.MeshLambertMaterial();
    const mesh = new THREE.Mesh(geometery, material);
    mesh.position.x = x;
    mesh.position.y = y;
    mesh.position.z = z;
    this.compoundShapeGroup.add(mesh);
  }
  /**Transparent block */
  _addPhantomBlock(x, y, z) {
    const geometery = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({
      color: 0x61dbfb,
      transparent: true,
      opacity: 0.5,
    });
    this.phantomMesh = new THREE.Mesh(geometery, material);
    const xOffset = this.compoundBody.shapeOffsets[0].x;
    const yOffset = this.compoundBody.shapeOffsets[0].y;
    const zOffset = this.compoundBody.shapeOffsets[0].z;
    this.phantomMesh.position.x = x + xOffset;
    this.phantomMesh.position.y = y + yOffset;
    this.phantomMesh.position.z = z + zOffset;
    this.phantomGroup.add(this.phantomMesh);
  }
  /**Random position phantom block */
  _displayPhantomBlock() {
    this._randomizePhantomXYZ();

    if (this.phantomBlockAccepted) {
      this.phantomBlockAccepted = false;
      this.addBlockToScene(this.x, this.y, this.z);
    } else {
      // NOTE: This fails with a warning on the first run.
      this.compoundBody.removeShape(this.phantomShape);
    }

    this.phantomShape = new CANNON.Box(
      new CANNON.Vec3(this.size * 0.5, this.size * 0.5, this.size * 0.5)
    );

    // NOTE: When we update the center of mass of the compound body,
    // the shape offset of each child object changes. All of them have the
    // same offset, so when we create the phantom block, we add this offset
    // to the block as well.
    const xOffset = this.compoundBody.shapeOffsets[0].x;
    const yOffset = this.compoundBody.shapeOffsets[0].y;
    const zOffset = this.compoundBody.shapeOffsets[0].z;

    this.compoundBody.addShape(
      this.phantomShape,
      new CANNON.Vec3(
        this.phantomX * this.size + xOffset,
        this.phantomY * this.size + yOffset,
        this.phantomZ * this.size + zOffset
      )
    );
    this.phantomGroup.remove(this.phantomMesh);
    this._addPhantomBlock(this.phantomX, this.phantomY, this.phantomZ);
  }

  _updatePhantomXYZ() {
    this.phantomX = this.x;
    this.phantomY = this.y;
    this.phantomZ = this.z;
  }

  _updateXYZ() {
    this.x = this.phantomX;
    this.y = this.phantomY;
    this.z = this.phantomZ;
  }

  acceptPhantomBlock() {
    this._updateXYZ();
    this._addExistingBlock();
    this._updateCenterOfMass();
    this.phantomBlockAccepted = true;
    this.currentLoopLength = this.gameLoopLength + 1;
  }

  _addExistingBlock() {
    this.existingBlocks.push({ x: this.x, y: this.y, z: this.z });
  }

  _renderPhantomBlock() {
    this.phantomGroup = new THREE.Group();
    this.threeGroup.add(this.phantomGroup);
  }

  _renderInitialBlock() {
    this.compoundShapeGroup = new THREE.Group();
    const initialBlockGeometry = new THREE.BoxGeometry(1, 1, 1);
    const initialBlockMaterial = new THREE.MeshPhongMaterial();
    const initialBlockMesh = new THREE.Mesh(
      initialBlockGeometry,
      initialBlockMaterial
    );
    this.compoundShapeGroup.add(initialBlockMesh);
    this.threeGroup.add(this.compoundShapeGroup);
  }

  animatePhantomGroup() {
    this.phantomGroup.position.copy(this.compoundBody.position);
    this.phantomGroup.quaternion.copy(this.compoundBody.quaternion);
    // this.phantomGroup.children.forEach((mesh, i) => {
    //   const offset = this.compoundBody.shapeOffsets[i];
    //   const orientation = this.compoundBody.shapeOrientations[i];
    //   console.log(offset, orientation);
    //   mesh.position.copy(offset);
    //   mesh.quaternion.copy(orientation);
    // });
  }

  animateCompoundShapeGroup() {
    this.compoundShapeGroup.position.copy(this.compoundBody.position);
    this.compoundShapeGroup.quaternion.copy(this.compoundBody.quaternion);

    // NOTE: https://github.dev/pmndrs/cannon-es/blob/master/examples/compound.html
    this.compoundShapeGroup.children.forEach((mesh, i) => {
      const offset = this.compoundBody.shapeOffsets[i];
      const orientation = this.compoundBody.shapeOrientations[i];
      mesh.position.copy(offset);
      mesh.quaternion.copy(orientation);
    });
  }

  _addCompoundBody() {
    const shape = new CANNON.Box(
      new CANNON.Vec3(this.size * 0.5, this.size * 0.5, this.size * 0.5)
    );
    const slipperyMaterial = new CANNON.Material('slippery');
    slipperyMaterial.friction = 0.01;

    this.compoundBody = new CANNON.Body({
      mass: this.mass,
      material: slipperyMaterial,
    });
    this.compoundBody.position.set(0, 0, 0);
    this.compoundBody.quaternion.setFromEuler(0, 0, 0);

    this.compoundBody.addShape(shape, new CANNON.Vec3(this.x, this.y, this.z));
    this._addExistingBlock();
    // this.compoundBody.addShape(shape, new CANNON.Vec3(-size, 0, 0));
    // this.compoundBody.addShape(shape, new CANNON.Vec3(0, 0, -size));
    // this.compoundBody.addShape(shape, new CANNON.Vec3(0, 0, -2 * size));
    // this.compoundBody.addShape(shape, new CANNON.Vec3(0, 0, -3 * size));
    // this.compoundBody.addShape(shape, new CANNON.Vec3(0, 0, -4 * size));

    this.cannonWorld.addBody(this.compoundBody);
  }

  _addGround() {
    const groundMaterial = new CANNON.Material('ground');
    groundMaterial.friction = 0.5;
    const groundShape = new CANNON.Box(new CANNON.Vec3(1.5, 0.5, 1.5));
    const groundBody = new CANNON.Body({ mass: 0, material: groundMaterial });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromEuler(0, 0, 0);
    groundBody.position.set(this.groundX, this.groundY, this.groundZ);
    this.cannonWorld.addBody(groundBody);
  }

  _initGame() {
    const boxGeometry = new THREE.BoxGeometry(3, 1, 3);
    const boxMaterial = new THREE.MeshPhongMaterial({ color: 0x218200 });
    const boxBase = new THREE.Mesh(boxGeometry, boxMaterial);
    boxBase.position.y = -1;
    this.threeGroup.add(boxBase);
  }
}
