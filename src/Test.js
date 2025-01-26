import gsap from 'gsap';
import * as THREE from 'three';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('canvas'),
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Create plane with shader material
const planeGeometry = new THREE.PlaneGeometry(2, 3, 32, 32);

const vertexShader = `
    varying vec2 vUv;
    uniform float uProgress;
    varying float curve;
    
    void main() {
        vUv = uv;
        vec3 pos = position;
        
        // Create curve effect from center with easing
        float easeProgress = sin(uProgress * 3.14159 * 0.5); // Sine easing
        float distanceFromCenter = length(uv - 0.5); // Calculate distance from UV center
        curve = sin(distanceFromCenter * 3.14159) * easeProgress * 10.0;
        
        // Apply curve distortion from center
        pos.z += curve * (1.0 - distanceFromCenter); // Stronger effect in center
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
`;

const fragmentShader = `
    varying vec2 vUv;
    varying float curve;
    uniform float uProgress;
    
    void main() {
        float alpha = smoothstep(0.0, 1.0, abs(curve));
        gl_FragColor = vec4(1.0, 0.0, 0.0, alpha * uProgress); // Red color with smooth transparency
    }
`;

const planeMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
    uniforms: {
        uProgress: { value: 0 }
    }
});

const plane = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(plane);

plane.position.x = -1;
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: "#app",
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    markers: true,
  },
});

tl.to(camera.position, {
  z: -4,
});

tl.to(planeMaterial.uniforms.uProgress, {
  value: 1,
});

// Add lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(2, 2, 2);
scene.add(directionalLight);

// Position camera
camera.position.z = 20;

let progress = 0;
let targetProgress = 0;
let lastTime = 0;
let scrollTimeout;

// Use Lenis for smooth scrolling
const lenis = new Lenis({
    duration: 1.2,
    smoothWheel: true
});

lenis.on('scroll', ({ scroll, limit }) => {
    // Calculate scroll progress as percentage
    targetProgress = scroll / limit;
    
    // Clear any existing timeout
    clearTimeout(scrollTimeout);
    
    // Set new timeout to reset progress
    scrollTimeout = setTimeout(() => {
        targetProgress = 0;
    }, 0);
})

// Animation loop with time-based updates
function animate(currentTime) {
    requestAnimationFrame(animate);
    
    // Calculate delta time
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // Update Lenis
    lenis.raf(currentTime);
    
    // Smooth easing with consistent speed regardless of frame rate
    const easeFactor = Math.min(1.0, 0.01 * deltaTime);
    progress += (targetProgress - progress) * easeFactor;
    
    planeMaterial.uniforms.uProgress.value = progress;
    renderer.render(scene, camera);
}

// Handle resize
window.addEventListener('resize', () => {
    // Update camera
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // Update renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Start animation with timestamp
animate(0);
