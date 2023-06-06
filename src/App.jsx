import { useEffect } from 'react';
import CannonDebugger from 'cannon-es-debugger';
import SceneInit from './lib/SceneInit';
import FranticArchitect from './lib/FranticArchitect';

//@ts-check
function App() {
  useEffect(() => {
    const Scene = new SceneInit('canvas');
    Scene.initialize();

    const franticArchitect = new FranticArchitect();
    Scene.scene.add(franticArchitect.threeGroup);

    // const cannonDebugger = new CannonDebugger(
    //   test.scene,
    //   franticArchitect.world
    // );

    // const gui = new GUI();
    // gui
    //   .add(test, 'cameraRotationDepth', 5, 100)
    //   .name('Camera Distance')
    //   .onChange((value) => {
    //     // TODO: Change camera position every 10 units.
    //     // const newY = Math.round((value / 10) % 5) + 5;
    //     // if (test.camera.position.y !== newY) {
    //     //   test.camera.lookAt(new THREE.Vector3(0, newY, 0));
    //     //   test.camera.position.y = newY;
    //     // }
    //   });

    (function animate() {
      const delta = Scene.clock.getDelta();

      Scene.render();
      //   test.stats.update();
      //   cannonDebugger.update();
      franticArchitect.update(delta);
      franticArchitect.animatePhantomGroup();
      franticArchitect.animateCompoundShapeGroup();

      // NOTE: Don't allow user to control camera.
      // test.controls.update();
      Scene.udpateCameraPosition();

      requestAnimationFrame(animate);
    })();

    window.addEventListener('click', onClick);
    window.addEventListener('keydown', onKeyDown);

    function onClick(event) {
      franticArchitect.acceptPhantomBlock();
    }

    function onKeyDown(event) {
      if (event.code === 'Space') {
        franticArchitect.acceptPhantomBlock();
      }
    }

    return () => {
      window.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div>
      <canvas id="canvas" />
    </div>
  );
}

export default App;
