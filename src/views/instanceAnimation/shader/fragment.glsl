uniform sampler2D ustate1;
uniform sampler2D ustate2;
uniform float uProgress;
varying vec2 vUv;

void main() {
  vec4 color1 = texture2D(ustate1,vUv);
  vec4 color2 = texture2D(ustate2,vec2(vUv.x,1.-vUv.y));

  float dist = distance(vUv,vec2(0.5));
  float outerProgress = clamp(1.1*uProgress,0.,1.);
  float innerProgress = clamp(1.1*uProgress - 0.05,0.,1.);

  float radius = 1.41;
  float innerCircle = 1.- smoothstep((innerProgress-0.1)*radius ,innerProgress*radius,dist);
  float outerCircle = 1.- smoothstep((outerProgress-0.1)*radius ,outerProgress*radius,dist);

  float displacement = outerCircle-innerCircle;
  float scale = mix(color1.r,color2.r,innerCircle);

  gl_FragColor = mix(color1,color2,uProgress);
  gl_FragColor = vec4(vec3(displacement,scale,0.),1.);

}
