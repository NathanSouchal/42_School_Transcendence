import * as THREE from "three";
import SimplexNoise from "https://cdn.skypack.dev/simplex-noise@3.0.0";

const SeaShader = {
  name: "SeaShader",
  uniforms: {
    time: { value: 1.0 },
    amplitude: { value: 2.0 },
    frequency: { value: 0.1 },
    lacunarity: { value: 1 },
    persistence: { value: 0.5 },
  },
  vertexShader: `
    uniform float time;
    uniform float amplitude;
    uniform float frequency;
    uniform float lacunarity;
    uniform float persistence;
    varying vec2 vUv;
    varying float vHeight;
    
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) +
              (c - a)* u.y * (1.0 - u.x) +
              (d - b) * u.x * u.y;
    }
    
    float fbm(vec2 x) {
      float v = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      
      for (int i = 0; i < 3; i++) {
        v += amplitude * noise(frequency * x + time * 0.1);
        frequency *= lacunarity;
        amplitude *= persistence;
      }
      
      return v;
    }
    
    void main() {
      vUv = uv;
      vec3 pos = position;
      float noiseHeight = fbm(pos.xy * frequency) * amplitude;
      float wave1 = sin(pos.x * 0.05 + time * 1.0) * amplitude * 0.5;
      float wave2 = cos(pos.y * 0.05 + time * 0.7) * amplitude * 0.5;
      pos.z += noiseHeight + wave1 + wave2;
      vHeight = pos.z;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform float amplitude;
    varying vec2 vUv;
    varying float vHeight;
    
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(random(i), random(i + vec2(1.0, 0.0)), u.x) +
              (random(i + vec2(0.0, 1.0)) - random(i)) * u.y * (1.0 - u.x) +
              (random(i + vec2(1.0, 1.0)) - random(i + vec2(1.0, 0.0))) * u.x * u.y;
    }
    
    void main() {
      vec3 deepColor = vec3(0.1, 0.3, 0.2);
      vec3 shallowColor = vec3(0.4, 0.7, 0.9);
      float heightFactor = vHeight / amplitude;
      vec3 baseColor = mix(deepColor, shallowColor, smoothstep(-1.0, 1.0, heightFactor));
      float surfaceNoise = noise(vUv * 20.0 + time * 0.1) * 0.1;
      vec3 finalColor = baseColor + surfaceNoise;
      
      gl_FragColor = vec4(finalColor, 0.7);
    }
  `,
};

export default SeaShader;
