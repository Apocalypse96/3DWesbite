let scene, camera, renderer, clock;
let buildings = [], vehicles = [], drones = [];
let rainParticles, lightning;
let isRaining = false, isNight = false;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    clock = new THREE.Clock();

    createCity();
    createVehicles();
    createLighting();
    createSkybox();

    camera.position.set(0, 50, 100);
    camera.lookAt(0, 0, 0);

    document.getElementById('loading').style.display = 'none';
    animate();
    setupEventListeners();
}

function createCity() {
    const citySize = 200;
    const buildingCount = 100;

    for (let i = 0; i < buildingCount; i++) {
        const height = Math.random() * 50 + 10;
        const geometry = new THREE.BoxGeometry(10, height, 10);
        const material = new THREE.MeshPhongMaterial({
            color: 0x808080,
            emissive: 0x000000,
            specular: 0xffffff,
            shininess: 50
        });
        const building = new THREE.Mesh(geometry, material);
        building.position.set(
            Math.random() * citySize - citySize / 2,
            height / 2,
            Math.random() * citySize - citySize / 2
        );
        buildings.push(building);
        scene.add(building);

        // Add neon signs
        if (Math.random() > 0.7) {
            const signGeometry = new THREE.PlaneGeometry(8, 4);
            const signMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color(Math.random(), Math.random(), Math.random()),
                side: THREE.DoubleSide
            });
            const sign = new THREE.Mesh(signGeometry, signMaterial);
            sign.position.y = height;
            sign.rotation.y = Math.random() * Math.PI * 2;
            building.add(sign);
        }
    }
}

function createVehicles() {
    for (let i = 0; i < 20; i++) {
        const geometry = new THREE.ConeGeometry(2, 8, 4);
        const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        const vehicle = new THREE.Mesh(geometry, material);
        vehicle.rotation.x = Math.PI / 2;
        vehicle.position.set(
            Math.random() * 200 - 100,
            Math.random() * 50 + 10,
            Math.random() * 200 - 100
        );
        vehicles.push(vehicle);
        scene.add(vehicle);
    }
}

function createLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Street lights
    for (let i = 0; i < 50; i++) {
        const light = new THREE.PointLight(0xffaa00, 1, 50);
        light.position.set(
            Math.random() * 200 - 100,
            10,
            Math.random() * 200 - 100
        );
        scene.add(light);
    }
}

function createSkybox() {
    const skyGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
    const skyMaterial = new THREE.MeshBasicMaterial({ color: 0x000022, side: THREE.BackSide });
    const skybox = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(skybox);
}

function createRain() {
    const rainCount = 15000;
    const rainGeometry = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount * 3; i += 3) {
        rainPositions[i] = Math.random() * 400 - 200;
        rainPositions[i + 1] = Math.random() * 500;
        rainPositions[i + 2] = Math.random() * 400 - 200;
    }

    rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMaterial = new THREE.PointsMaterial({
        color: 0xaaaaaa,
        size: 0.1,
        transparent: true
    });

    rainParticles = new THREE.Points(rainGeometry, rainMaterial);
    scene.add(rainParticles);
}

function animateRain() {
    const positions = rainParticles.geometry.attributes.position.array;
    for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= 2;
        if (positions[i] < 0) {
            positions[i] = 500;
        }
    }
    rainParticles.geometry.attributes.position.needsUpdate = true;
}

function createLightning() {
    lightning = new THREE.PointLight(0x4444ff, 30, 500, 1.7);
    lightning.position.set(100, 300, 100);
    scene.add(lightning);
}

function animateLightning() {
    if (Math.random() > 0.93 || lightning.power > 100) {
        if (lightning.power < 100) {
            lightning.position.set(
                Math.random() * 400 - 200,
                300 + Math.random() * 200,
                Math.random() * 400 - 200
            );
        }
        lightning.power = 50 + Math.random() * 500;
    }
}

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    // Animate buildings
    buildings.forEach(building => {
        building.scale.y = 1 + Math.sin(Date.now() * 0.001 + building.position.x) * 0.1;
    });

    // Animate vehicles
    vehicles.forEach(vehicle => {
        vehicle.position.x += Math.sin(Date.now() * 0.001 + vehicle.position.z) * 0.5;
        vehicle.position.z += Math.cos(Date.now() * 0.001 + vehicle.position.x) * 0.5;
    });

    // Animate drones
    drones.forEach(drone => {
        drone.position.y += Math.sin(Date.now() * 0.002 + drone.position.x) * 0.1;
        drone.rotation.y += 0.01;
    });

    if (isRaining) {
        animateRain();
        animateLightning();
    }

    renderer.render(scene, camera);
}

function setupEventListeners() {
    document.getElementById('toggle-rain').addEventListener('click', () => {
        isRaining = !isRaining;
        if (isRaining) {
            createRain();
            createLightning();
        } else {
            scene.remove(rainParticles);
            scene.remove(lightning);
        }
    });

    document.getElementById('change-time').addEventListener('click', () => {
        isNight = !isNight;
        if (isNight) {
            scene.background = new THREE.Color(0x000022);
            scene.fog = new THREE.FogExp2(0x000022, 0.0015);
        } else {
            scene.background = new THREE.Color(0x87CEEB);
            scene.fog = new THREE.FogExp2(0x87CEEB, 0.0015);
        }
    });

    document.getElementById('launch-drones').addEventListener('click', () => {
        for (let i = 0; i < 5; i++) {
            const geometry = new THREE.SphereGeometry(1, 32, 32);
            const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
            const drone = new THREE.Mesh(geometry, material);
            drone.position.set(
                Math.random() * 200 - 100,
                Math.random() * 50 + 50,
                Math.random() * 200 - 100
            );
            drones.push(drone);
            scene.add(drone);
        }
    });
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();