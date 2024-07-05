uniform sampler2D ustate1;
uniform sampler2D ustate2;
uniform float uProgress;
varying vec2 vUv;

void main() {
  vec4 color1 = texture2D(ustate1,vUv);
  vec4 color2 = texture2D(ustate2,vUv);

  gl_FragColor = mix(color1,color2,uProgress);
  // gl_FragColor = color2;

}
