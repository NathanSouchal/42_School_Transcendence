import * as THREE from "three";
import SimplexNoise from "https://cdn.skypack.dev/simplex-noise@3.0.0";

const SeaShader = {
  name: "SeaShader",
  uniforms: {
    time: { value: 1.0 },
    amplitude_1: { value: 1.1 },
    wavelength_1: { value: 0.8 },
    steepness_1: { value: 0.6 },
    speed_1: { value: 1.0 },
    dir_1: { value: new THREE.Vector2(1.0, 0.0) },

    amplitude_2: { value: 1.0 },
    wavelength_2: { value: 0.8 },
    steepness_2: { value: 0.8 },
    speed_2: { value: 0.5 },
    dir_2: { value: new THREE.Vector2(1.0, 1.0) },

    amplitude_3: { value: 0.4 },
    wavelength_3: { value: 0.5 },
    steepness_3: { value: 1.0 },
    speed_3: { value: 3.0 },
    dir_3: { value: new THREE.Vector2(0.0, 1.0) },

    amplitude_4: { value: 0.2 },
    wavelength_4: { value: 0.5 },
    steepness_4: { value: 0.5 },
    speed_4: { value: 8.0 },
    dir_4: { value: new THREE.Vector2(-1.0, -1.0) },

    amplitude_5: { value: 0.6 },
    wavelength_5: { value: 0.7 },
    steepness_5: { value: 0.7 },
    speed_5: { value: 0.5 },
    dir_5: { value: new THREE.Vector2(-0.4, -0.8) },

    lightPosition: { value: new THREE.Vector3(-50, 50, 50) },
    cameraPosition: { value: new THREE.Vector3(-50, 50, 50) },
  },
  vertexShader: `
    uniform float time;

    uniform float amplitude_1;
    uniform float wavelength_1;
    uniform float steepness_1;
    uniform float speed_1;
    uniform vec2 dir_1;

    uniform float amplitude_2;
    uniform float wavelength_2;
    uniform float steepness_2;
    uniform float speed_2;
    uniform vec2 dir_2;

    uniform float amplitude_3;
    uniform float wavelength_3;
    uniform float steepness_3;
    uniform float speed_3;
    uniform vec2 dir_3;

    uniform float amplitude_4;
    uniform float wavelength_4;
    uniform float steepness_4;
    uniform float speed_4;
    uniform vec2 dir_4;

    uniform float amplitude_5;
    uniform float wavelength_5;
    uniform float steepness_5;
    uniform float speed_5;
    uniform vec2 dir_5;

    varying float vHeight;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;


    vec3 gerstner(vec3 vertex, vec2 direction, float time, float speed, float steepness, float amplitude, float wavelength){
      float displaced_x = vertex.x + (steepness/wavelength) * direction.x * cos(wavelength * dot(direction, vertex.xy) + speed * time);
      float displaced_y = vertex.y + (steepness/wavelength) * direction.y * cos(wavelength * dot(direction, vertex.xy) + speed * time);
      float displaced_z = vertex.z + amplitude * sin(wavelength * dot(direction, vertex.xy) + speed * time);
      return vec3(displaced_x, displaced_y, displaced_z);
    }

    vec3 gerstner_normal(vec3 vertex, vec2 direction, float time, float speed, float steepness, float amplitude, float wavelength) {
      float cosfactor = cos(wavelength * dot(direction, vertex.xy + speed * time));
      float sinfactor = sin(wavelength * dot(direction, vertex.xy + speed * time));
      float x_normal = -direction.x * wavelength * amplitude * cosfactor;
      float y_normal = -direction.y * wavelength * amplitude * cosfactor;
      float z_normal = 1.0 - (steepness/wavelength) * wavelength * amplitude * sinfactor;
      return vec3(x_normal, y_normal, z_normal);
    }

    void main() {
      vUv = uv;
      vPosition = position;

      vec3 wave1 = gerstner(position, dir_1, time, speed_1, steepness_1, amplitude_1, wavelength_1);
      vec3 normal1 = gerstner_normal(position, dir_1, time, speed_1, steepness_1, amplitude_1, wavelength_1);

      vec3 wave2 = gerstner(position, dir_2, time, speed_2, steepness_2, amplitude_2, wavelength_2);
      vec3 normal2 = gerstner_normal(position, dir_2, time, speed_2, steepness_2, amplitude_2, wavelength_2);

      vec3 wave3 = gerstner(position, dir_3, time, speed_3, steepness_3, amplitude_3, wavelength_3);
      vec3 normal3 = gerstner_normal(position, dir_3, time, speed_3, steepness_3, amplitude_3, wavelength_3);

      vec3 wave4 = gerstner(position, dir_4, time, speed_4, steepness_4, amplitude_4, wavelength_4);
      vec3 normal4 = gerstner_normal(position, dir_4, time, speed_4, steepness_4, amplitude_4, wavelength_4);

      vec3 wave5 = gerstner(position, dir_5, time, speed_5, steepness_5, amplitude_5, wavelength_5);
      vec3 normal5 = gerstner_normal(position, dir_5, time, speed_5, steepness_5, amplitude_5, wavelength_5);

      vec3 combinedWave = wave1 + wave2 + wave3 + wave4 + wave5;
      vec3 combinedNormal = normalize(normal1 + normal2 + normal3 + normal4 + normal5);

      vHeight = combinedWave.z;
      vNormal = normalMatrix * combinedNormal;

      vec4 modelViewPosition = modelViewMatrix * vec4(combinedWave, 1.0);
      gl_Position = projectionMatrix * modelViewPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 lightPosition; 
    uniform float time;

    varying vec2 vUv;
    varying float vHeight;
    varying vec3 vNormal;
    varying vec3 vPosition;

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

      vec3 deepColor = vec3(0.14, 0.3, 0.2);
      vec3 shallowColor = vec3(0.129, 0.443, 0.459);
      vec3 mossColor = vec3(0.659, 0.710, 0.749); 
      
      float heightFactor = vHeight / 10.0;
      vec3 finalColor = mix(deepColor, shallowColor, smoothstep(-1.0, 1.0, heightFactor));
      float movementGradient = length(fwidth(vHeight)) * 80.0;
      float movementFactor = smoothstep(0.8, 2.5, movementGradient);
      finalColor = mix(finalColor, deepColor, movementFactor);
      
      float highPointThreshold = 0.1;
      float highPointFactor = smoothstep(highPointThreshold, 1.0, heightFactor);
      finalColor = mix(finalColor, mossColor, highPointFactor);
      
      // Light calculations
      vec3 lightDir = normalize(lightPosition - vPosition);
      float diff = max(dot(vNormal, lightDir), 0.0);
      float ambientStrength = 0.9;
      vec3 ambient = ambientStrength * vec3(1.0, 1.0, 1.0);
      
      vec3 diffuse = diff * vec3(0.8, 0.8, 0.8);
      vec3 viewDir = normalize(cameraPosition - vPosition);
      vec3 reflectDir = reflect(-lightDir, vNormal);
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), 43.0);
      vec3 specular = spec * vec3(0.8, 0.8, 0.8);
      
      finalColor = finalColor * (ambient + diffuse);
      
      gl_FragColor = vec4(finalColor, 0.8);
    }
  `,
};

export default SeaShader;
