import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
// import Lenis from '@studio-freight/lenis';

// Register ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Images array - replace with your image paths
const images = [
    'https://images.unsplash.com/photo-1736457908762-d6ae9e5fb593?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1737453642091-804a18d5deaa?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1734879349998-3a675a016db9?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    "https://images.unsplash.com/photo-1514227973936-5bebfc160b59?q=80&w=1936&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    'https://images.unsplash.com/photo-1622798023168-76a8f3b1f24e?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1528758054211-22aa4c5300db?q=80&w=1854&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1734879349998-3a675a016db9?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1735999925427-d04865a57628?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
];

const imageDetails = [
    { title: 'EUPHORIA', description: 'A blissful state of pure joy and exhilaration, where reality melts into dreams' },
    { title: 'OCEAN', description: 'Endless waves dance beneath the horizon, carrying ancient secrets in their depths' },
    { title: 'MOON', description: 'Silent guardian of the night sky, casting silver light on sleeping dreams' },
    { title: 'SUN', description: 'Radiant life-giver painting the world in golden hues of warmth and possibility' },
    { title: 'STARS', description: 'Countless diamond points piercing the velvet darkness of infinite space' },
    { title: 'FOREST', description: 'Ancient trees whisper stories of time immemorial through rustling leaves' },
    { title: 'LAKE', description: 'Mirror-still waters reflect the sky, hiding mysteries in crystalline depths' },
    { title: 'MOUNTAIN', description: 'Majestic peaks touch the clouds, standing eternal against wind and time' },
];

// Smooth scroll setup
const lenis = new Lenis({
    duration: 1.2,
    smoothWheel: true
});

let scrollVelocity = 0;
let prevScroll = 0;

lenis.on('scroll', ({ scroll }) => {
    scrollVelocity = scroll - prevScroll;
    prevScroll = scroll;
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

// Scene setup
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x4444ff, 0, 10);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('canvas'),
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0xffffff, 1);

// Add these variables at the top level
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let currentIntersect = null;

// Custom shader material
const planeMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTexture: { value: null },
        uVelocity: { value: 0 },
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uHover: { value: 0.0 }
    },
    vertexShader: `
        uniform float uVelocity;
        varying vec2 vUv;
        
        void main() {
            vUv = uv;
            vec3 pos = position;
            
            float distance = length(position.xy);
            float bendStrength = 5.0;
            float bendFactor = distance * uVelocity * bendStrength;
            
            pos.z -= bendFactor;
            
            float wave = sin(distance * 3.0 + uVelocity * 2.0) * 0.1 * abs(uVelocity);
            pos.z -= wave;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D uTexture;
        uniform vec2 uMouse;
        uniform float uTime;
        uniform float uHover;
        varying vec2 vUv;

        //	Classic Perlin 2D Noise by Stefan Gustavson
        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
        vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

        float cnoise(vec2 P){
            vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
            vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
            Pi = mod(Pi, 289.0);
            vec4 ix = Pi.xzxz;
            vec4 iy = Pi.yyww;
            vec4 fx = Pf.xzxz;
            vec4 fy = Pf.yyww;
            vec4 i = permute(permute(ix) + iy);
            vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0;
            vec4 gy = abs(gx) - 0.5;
            vec4 tx = floor(gx + 0.5);
            gx = gx - tx;
            vec2 g00 = vec2(gx.x,gy.x);
            vec2 g10 = vec2(gx.y,gy.y);
            vec2 g01 = vec2(gx.z,gy.z);
            vec2 g11 = vec2(gx.w,gy.w);
            vec4 norm = 1.79284291400159 - 0.85373472095314 * vec4(dot(g00,g00), dot(g01,g01), dot(g10,g10), dot(g11,g11));
            g00 *= norm.x;
            g01 *= norm.y;
            g10 *= norm.z;
            g11 *= norm.w;
            float n00 = dot(g00, vec2(fx.x, fy.x));
            float n10 = dot(g10, vec2(fx.y, fy.y));
            float n01 = dot(g01, vec2(fx.z, fy.z));
            float n11 = dot(g11, vec2(fx.w, fy.w));
            vec2 fade_xy = fade(Pf.xy);
            vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
            float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
            return 2.3 * n_xy;
        }

        void main() {
            vec2 uv = vUv;
            
            // Calculate distance from mouse
            float dist = length(uv - uMouse);
            float maxDist = 0.4; // Radius of effect
            float strength = smoothstep(maxDist, 0.0, dist);
            
            // Create liquid-like distortion
            float noise = cnoise(uv * 10.0 + uTime * 1.5) * 0.5;
            float distortionStrength = strength * uHover;
            
            // Apply distortion
            vec2 distortedUV = uv;
            distortedUV += noise * distortionStrength;
            
            // Add ripple effect
            float ripple = sin(dist * 20.0 - uTime * 2.0) * 0.005;
            distortedUV += ripple * strength * uHover;
            
            vec4 texture = texture2D(uTexture, distortedUV);
            gl_FragColor = texture;
        }
    `
});

// Create image planes
const planes = [];
const textureLoader = new THREE.TextureLoader();
const planeGeometry = new THREE.PlaneGeometry(2, 2, 32, 32); // Increased segments for better bending
const spacing = 10;

function createHTMLContent(index) {
    const div = document.createElement('div');
    div.className = 'image-content';
    div.classList.add('image-content');
    div.innerHTML = `
        <h2>${imageDetails[index].title}</h2>
        <p>${imageDetails[index].description}</p>
    `;
    div.style.opacity = index === 0 ? 1 : 0;
    document.body.appendChild(div);
}

let distance = 3;

if (window.innerWidth <= 768) {
    distance = 0;
}

images.forEach((img, index) => {
    // Create an image element to get natural dimensions
    const imageElement = new Image();
    imageElement.src = img;
    
    const texture = textureLoader.load(img);
    const material = planeMaterial.clone();
    material.uniforms.uTexture.value = texture;

    const plane = new THREE.Mesh(planeGeometry, material);
    
    // Position alternately on left and right
    plane.position.z = -spacing * index;
    plane.position.x = index % 2 === 0 ? -distance : distance;
    
    // Wait for image to load to get correct dimensions
    imageElement.onload = () => {
        const width = imageElement.naturalWidth;
        const height = imageElement.naturalHeight;
        
        // Scale the plane while maintaining aspect ratio and reasonable size
        const scale = 2; // Adjust this value to control overall size
        const aspectRatio = width / height;
        plane.scale.set(aspectRatio * scale, scale, 1);
    };

    planes.push(plane);
    scene.add(plane);
    
    // Create HTML content
    createHTMLContent(index);
});

camera.position.z = 5;

// Create HTML content function


// Setup GSAP animation
const totalDistance = (images.length - 1) * spacing;


const tl = gsap.timeline({
    scrollTrigger: {
        trigger: "#app",
        start: "top 0",
        end: "bottom bottom",
        scrub: 1,
        markers: true,
        onUpdate: (self) => {
            // Calculate current index based on camera position
            const currentIndex = Math.floor(Math.abs(camera.position.z - 5) / spacing);
            
            // Update text visibility
            document.querySelectorAll('.image-content').forEach((div, index) => {
                // Fade in current index, fade out others
                gsap.to(div, {
                    opacity: index === currentIndex ? 1 : 0,
                    // scale: index === currentIndex ? 1 : 0,
                    rotationX: index === currentIndex ? 0 : 90,
                    duration: 1
                });
            });
        }
    }
});

tl.to(camera.position, {
    z: -totalDistance + 5, // Update this to match your total distance
    ease: "none"
});

// Add mouse move event listener
window.addEventListener('mousemove', (event) => {
    // Convert mouse position to normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Update the animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update raycaster
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planes);
    
    // Reset all planes' hover state
    planes.forEach(plane => {
        gsap.to(plane.material.uniforms.uHover, {
            value: 0,
            duration: 0.5
        });
    });
    
    // Handle hover effect
    if (intersects.length > 0) {
        const intersectedPlane = intersects[0].object;
        gsap.to(intersectedPlane.material.uniforms.uHover, {
            value: 1,
            duration: 0.5
        });
        
        // Convert mouse position to UV coordinates for the intersected plane
        const intersectPoint = intersects[0].point;
        const planePosition = intersectedPlane.position;
        const planeScale = intersectedPlane.scale;
        
        // Calculate local UV coordinates
        const localX = (intersectPoint.x - planePosition.x) / planeScale.x + 0.5;
        const localY = (intersectPoint.y - planePosition.y) / planeScale.y + 0.5;
        
        intersectedPlane.material.uniforms.uMouse.value.set(localX, localY);
    }
    
    // Update shader uniforms
    planes.forEach(plane => {
        plane.material.uniforms.uVelocity.value = scrollVelocity * 0.003;
        plane.material.uniforms.uTime.value += 0.01;
    });
    
    renderer.render(scene, camera);
}
// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

animate();

