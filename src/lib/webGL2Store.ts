import { readable } from "svelte/store";

export const isWebGL2Enabled = readable(false, (set) => {
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) {
    if (typeof WebGL2RenderingContext !== 'undefined') {
      console.log('your browser appears to support WebGL2 but it might be disabled. Try updating your OS and/or video card drivers');
    }
  } else {
    set(true);
  }

  return () => {};
})