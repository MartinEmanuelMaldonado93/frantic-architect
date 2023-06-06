import { useEffect } from 'react';
import { GUI } from 'dat.gui';
import * as THREE from 'three';
import CannonDebugger from 'cannon-es-debugger';
import SceneInit from './lib/SceneInit';
import FranticArchitect from './lib/FranticArchitect';

//@ts-check

function App() {
  useEffect(() => {}, []);

  return (
    <div>
      <canvas id="canvas" />
    </div>
  );
}

export default App;
