// ========================================
// NOOVA ADVENTURE - Jeu 3D avec Three.js
// ========================================

console.log('Script loading...');

// Configuration globale
const CONFIG = {
    PLAYER_SPEED: 0.15,
    PLAYER_JUMP_FORCE: 0.35,
    GRAVITY: 0.015,
    CAMERA_OFFSET: { x: 0, y: 12, z: 18 },
    CAMERA_SMOOTHING: 0.08,
    CRYSTAL_COUNT: 5,
    WORLD_SIZE: 80
};

// Variables globales du jeu
let scene, camera, renderer;
let player, playerVelocity = { x: 0, y: 0, z: 0 };
let crystals = [];
let keys = {};
let isJumping = false;
let score = 0;
let gameRunning = false;
let animationId;
let audioContext, jumpSound, backgroundMusic;

// Éléments DOM
const menuScreen = document.getElementById('menu-screen');
const gameScreen = document.getElementById('game-screen');
const winScreen = document.getElementById('win-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const scoreValue = document.getElementById('score-value');
const totalCrystals = document.getElementById('total-crystals');
const messageDisplay = document.getElementById('message-display');
const loadingScreen = document.getElementById('loading');

// ========================================
// INITIALISATION DU JEU
// ========================================

function init() {
    console.log('Init called, THREE:', typeof THREE);
    
    try {
        // Scène Three.js
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a0a2e);

        // Caméra
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, CONFIG.CAMERA_OFFSET.y, CONFIG.CAMERA_OFFSET.z);

        // Renderer
        renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('game-canvas'),
            antialias: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        console.log('Basic setup done');

        // Éclairage
        setupLighting();

        // Créer le monde
        createWorld();

        // Créer le personnage
        createPlayer();

        // Créer les cristaux à collecter
        createCrystals();

        // Initialiser l'audio
        initAudio();

        // Événements
        setupEventListeners();

        // Mettre à jour l'interface
        totalCrystals.textContent = CONFIG.CRYSTAL_COUNT;

        // Masquer le chargement
        setTimeout(function() {
            loadingScreen.classList.add('hidden');
        }, 500);

        // Lancer la boucle de rendu
        animate();
        console.log('Game started');
    } catch(e) {
        console.error('Error in init:', e);
        document.getElementById('loading').innerHTML = '<p style="color:red">Erreur: ' + e.message + '</p>';
    }
}

// ========================================
// ÉCLAIRAGE
// ========================================

function setupLighting() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    var mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(20, 30, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 100;
    mainLight.shadow.camera.left = -40;
    mainLight.shadow.camera.right = 40;
    mainLight.shadow.camera.top = 40;
    mainLight.shadow.camera.bottom = -40;
    scene.add(mainLight);

    var purpleLight = new THREE.PointLight(0xff00c8, 1.0, 80);
    purpleLight.position.set(-15, 10, -15);
    scene.add(purpleLight);

    var cyanLight = new THREE.PointLight(0x00d4ff, 1.0, 80);
    cyanLight.position.set(15, 10, 15);
    scene.add(cyanLight);
}

// ========================================
// CRÉATION DU MONDE
// ========================================

function createWorld() {
    var groundGeometry = new THREE.PlaneGeometry(CONFIG.WORLD_SIZE, CONFIG.WORLD_SIZE, 20, 20);
    var groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x3a2a5a,
        roughness: 0.9,
        metalness: 0.1
    });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    var gridHelper = new THREE.GridHelper(CONFIG.WORLD_SIZE, 40, 0x8a4a9a, 0x5a2a7a);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    createDecorations();
}

function createDecorations() {
    var decorations = [
        { x: -20, z: -20 },
        { x: 20, z: -20 },
        { x: -20, z: 20 },
        { x: 20, z: 20 },
        { x: 0, z: -25 },
        { x: 0, z: 25 },
        { x: -25, z: 0 },
        { x: 25, z: 0 },
    ];

    for (var i = 0; i < decorations.length; i++) {
        createColumn(decorations[i].x, decorations[i].z);
    }

    for (var j = 0; j < 15; j++) {
        var x = (Math.random() - 0.5) * CONFIG.WORLD_SIZE * 0.8;
        var z = (Math.random() - 0.5) * CONFIG.WORLD_SIZE * 0.8;
        createRock(x, z);
    }
}

function createColumn(x, z) {
    var group = new THREE.Group();

    var baseGeometry = new THREE.CylinderGeometry(1.2, 1.5, 1, 8);
    var baseMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x6a4a8a,
        roughness: 0.5,
        metalness: 0.3
    });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.5;
    base.castShadow = true;
    group.add(base);

    var columnGeometry = new THREE.CylinderGeometry(0.8, 0.8, 6, 8);
    var column = new THREE.Mesh(columnGeometry, baseMaterial);
    column.position.y = 4;
    column.castShadow = true;
    group.add(column);

    var topGeometry = new THREE.CylinderGeometry(1.3, 0.8, 1, 8);
    var top = new THREE.Mesh(topGeometry, baseMaterial);
    top.position.y = 7.5;
    top.castShadow = true;
    group.add(top);

    var orbGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    var orbMaterial = new THREE.MeshStandardMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.8
    });
    var orb = new THREE.Mesh(orbGeometry, orbMaterial);
    orb.position.y = 9;
    group.add(orb);

    group.position.set(x, 0, z);
    scene.add(group);
}

function createRock(x, z) {
    var geometry = new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.5, 0);
    var material = new THREE.MeshStandardMaterial({
        color: 0x4a3a5a,
        roughness: 0.9,
        metalness: 0.1
    });
    var rock = new THREE.Mesh(geometry, material);
    rock.position.set(x, 0.3, z);
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    rock.castShadow = true;
    scene.add(rock);
}

// ========================================
// CRÉATION DU PERSONNAGE
// ========================================

function createPlayer() {
    player = new THREE.Group();

    var bodyGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 16);
    var bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a1a4a,
        roughness: 0.5,
        metalness: 0.3
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    body.castShadow = true;
    player.add(body);

    var headGeometry = new THREE.SphereGeometry(0.35, 16, 16);
    var headMaterial = new THREE.MeshStandardMaterial({
        color: 0xffdbac,
        roughness: 0.8
    });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2.2;
    head.castShadow = true;
    player.add(head);

    var hairGeometry = new THREE.ConeGeometry(0.4, 0.8, 8);
    var hairMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a0a2a,
        roughness: 0.6
    });
    var hair = new THREE.Mesh(hairGeometry, hairMaterial);
    hair.position.y = 2.6;
    hair.rotation.x = Math.PI;
    player.add(hair);

    var hairColors = [0xff00c8, 0x00d4ff, 0xaa00ff, 0x00ff88];
    for (var i = 0; i < 5; i++) {
        var strandGeometry = new THREE.ConeGeometry(0.08, 0.6, 4);
        var strandMaterial = new THREE.MeshStandardMaterial({
            color: hairColors[i % hairColors.length]
        });
        var strand = new THREE.Mesh(strandGeometry, strandMaterial);
        var angle = (i / 5) * Math.PI * 2;
        strand.position.set(
            Math.cos(angle) * 0.25,
            2.4,
            Math.sin(angle) * 0.25
        );
        strand.rotation.z = angle + Math.PI / 2;
        player.add(strand);
    }

    var eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    var eyeMaterial = new THREE.MeshStandardMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.5
    });

    var leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.12, 2.25, 0.28);
    player.add(leftEye);

    var rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.12, 2.25, 0.28);
    player.add(rightEye);

    var capeGeometry = new THREE.PlaneGeometry(0.8, 1.2);
    var capeMaterial = new THREE.MeshStandardMaterial({
        color: 0xff00c8,
        side: THREE.DoubleSide,
        emissive: 0xff00c8,
        emissiveIntensity: 0.2
    });
    var cape = new THREE.Mesh(capeGeometry, capeMaterial);
    cape.position.set(0, 1.1, -0.4);
    cape.rotation.x = 0.2;
    player.add(cape);

    var swordGroup = new THREE.Group();
    
    var bladeGeometry = new THREE.BoxGeometry(0.08, 1.2, 0.02);
    var bladeMaterial = new THREE.MeshStandardMaterial({
        color: 0x00d4ff,
        emissive: 0x00d4ff,
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.2
    });
    var blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade.position.y = 0.6;
    swordGroup.add(blade);

    var handleGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8);
    var handleMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a3020
    });
    var handle = new THREE.Mesh(handleGeometry, handleMaterial);
    swordGroup.add(handle);

    swordGroup.position.set(0.5, 1, 0);
    swordGroup.rotation.z = -0.3;
    player.add(swordGroup);

    player.position.set(0, 0, 0);
    scene.add(player);
}

// ========================================
// CRÉATION DES CRISTAUX
// ========================================

function createCrystals() {
    var crystalPositions = [
        { x: 15, z: 0 },
        { x: -15, z: 0 },
        { x: 0, z: 15 },
        { x: 0, z: -15 },
        { x: 12, z: 12 }
    ];

    for (var i = 0; i < crystalPositions.length; i++) {
        var crystal = createCrystal();
        crystal.position.set(crystalPositions[i].x, 1.5, crystalPositions[i].z);
        crystal.userData = { 
            collected: false, 
            originalY: 1.5,
            index: i 
        };
        crystals.push(crystal);
        scene.add(crystal);
    }
}

function createCrystal() {
    var group = new THREE.Group();

    var geometry = new THREE.OctahedronGeometry(0.7, 0);
    var material = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        emissive: 0x00ff88,
        emissiveIntensity: 1,
        metalness: 0.5,
        roughness: 0.2,
        transparent: true,
        opacity: 0.9
    });
    var crystal = new THREE.Mesh(geometry, material);
    group.add(crystal);

    var particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
    var particleMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 1
    });

    for (var i = 0; i < 6; i++) {
        var particle = new THREE.Mesh(particleGeometry, particleMaterial);
        var angle = (i / 6) * Math.PI * 2;
        particle.position.set(Math.cos(angle) * 0.8, 0, Math.sin(angle) * 0.8);
        particle.userData.angle = angle;
        group.add(particle);
    }

    var light = new THREE.PointLight(0x00ff88, 2, 8);
    group.add(light);

    return group;
}

// ========================================
// SYSTÈME AUDIO
// ========================================

function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        createJumpSound();
        createBackgroundMusic();
    } catch(e) {
        console.log('Audio not supported');
    }
}

function createJumpSound() {
    if (!audioContext) return;
    
    jumpSound = function() {
        var oscillator = audioContext.createOscillator();
        var gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.type = 'sine';
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    };
}

function createBackgroundMusic() {
    if (!audioContext) return;
    
    backgroundMusic = {
        playing: false,
        
        start: function() {
            if (this.playing) return;
            this.playing = true;
            
            var notes = [261.63, 329.63, 392.00, 523.25];
            var noteIndex = 0;
            
            var self = this;
            
            var playNote = function() {
                if (!self.playing) return;
                
                var oscillator = audioContext.createOscillator();
                var gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(notes[noteIndex], audioContext.currentTime);
                
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                
                oscillator.type = 'sine';
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
                
                noteIndex = (noteIndex + 1) % notes.length;
                
                setTimeout(playNote, 500);
            };
            
            playNote();
        },
        
        stop: function() {
            this.playing = false;
        }
    };
}

function playCollectSound() {
    if (!audioContext) return;
    
    var oscillator = audioContext.createOscillator();
    var gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1046.5, audioContext.currentTime + 0.1);
    oscillator.frequency.exponentialRampToValueAtTime(1568.98, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.type = 'square';
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

// ========================================
// GESTION DES ENTRÉES
// ========================================

function setupEventListeners() {
    window.addEventListener('keydown', function(e) {
        keys[e.code] = true;
        
        if (e.code === 'Space' && !isJumping && gameRunning) {
            playerVelocity.y = CONFIG.PLAYER_JUMP_FORCE;
            isJumping = true;
            
            if (jumpSound) jumpSound();
        }
    });

    window.addEventListener('keyup', function(e) {
        keys[e.code] = false;
    });

    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', restartGame);

    window.addEventListener('resize', function() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
    });
}

// ========================================
// LOGIQUE DU JEU
// ========================================

function startGame() {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    if (backgroundMusic) {
        backgroundMusic.start();
    }
    
    menuScreen.classList.remove('active');
    gameScreen.classList.add('active');
    gameRunning = true;
    
    showMessage('Trouve les cristaux!');
}

function restartGame() {
    score = 0;
    scoreValue.textContent = '0';
    
    player.position.set(0, 0, 0);
    playerVelocity = { x: 0, y: 0, z: 0 };
    isJumping = false;
    
    for (var i = 0; i < crystals.length; i++) {
        crystals[i].userData.collected = false;
        crystals[i].visible = true;
    }
    
    if (backgroundMusic) {
        backgroundMusic.stop();
        backgroundMusic.start();
    }
    
    winScreen.classList.remove('active');
    gameScreen.classList.add('active');
    gameRunning = true;
}

function updatePlayer() {
    if (!gameRunning) return;
    
    var speed = CONFIG.PLAYER_SPEED;
    
    if (keys['KeyW'] || keys['ArrowUp']) {
        playerVelocity.z = -speed;
    } else if (keys['KeyS'] || keys['ArrowDown']) {
        playerVelocity.z = speed;
    } else {
        playerVelocity.z *= 0.8;
    }
    
    if (keys['KeyA'] || keys['ArrowLeft']) {
        playerVelocity.x = -speed;
    } else if (keys['KeyD'] || keys['ArrowRight']) {
        playerVelocity.x = speed;
    } else {
        playerVelocity.x *= 0.8;
    }
    
    playerVelocity.y -= CONFIG.GRAVITY;
    
    player.position.x += playerVelocity.x;
    player.position.y += playerVelocity.y;
    player.position.z += playerVelocity.z;
    
    if (player.position.y <= 0) {
        player.position.y = 0;
        playerVelocity.y = 0;
        isJumping = false;
    }
    
    var limit = CONFIG.WORLD_SIZE / 2 - 2;
    player.position.x = Math.max(-limit, Math.min(limit, player.position.x));
    player.position.z = Math.max(-limit, Math.min(limit, player.position.z));
    
    animatePlayer();
}

function animatePlayer() {
    if (Math.abs(playerVelocity.x) > 0.01 || Math.abs(playerVelocity.z) > 0.01) {
        var targetRotation = Math.atan2(playerVelocity.x, playerVelocity.z);
        player.rotation.y = targetRotation;
        
        var walkSpeed = 10;
        var walkAmount = 0.1;
        player.position.y += Math.sin(Date.now() * 0.01 * walkSpeed) * walkAmount * Math.abs(playerVelocity.x + playerVelocity.z);
    }
    
    if (isJumping) {
        player.rotation.x = -0.2;
    } else {
        player.rotation.x = 0;
    }
}

function updateCamera() {
    var targetX = player.position.x + CONFIG.CAMERA_OFFSET.x;
    var targetY = player.position.y + CONFIG.CAMERA_OFFSET.y;
    var targetZ = player.position.z + CONFIG.CAMERA_OFFSET.z;
    
    camera.position.x += (targetX - camera.position.x) * CONFIG.CAMERA_SMOOTHING;
    camera.position.y += (targetY - camera.position.y) * CONFIG.CAMERA_SMOOTHING;
    camera.position.z += (targetZ - camera.position.z) * CONFIG.CAMERA_SMOOTHING;
    
    camera.lookAt(player.position.x, player.position.y + 1.5, player.position.z);
}

function updateCrystals() {
    if (!gameRunning) return;
    
    for (var i = 0; i < crystals.length; i++) {
        var crystal = crystals[i];
        if (crystal.userData.collected) continue;
        
        crystal.position.y = crystal.userData.originalY + Math.sin(Date.now() * 0.003 + crystal.userData.index) * 0.3;
        crystal.rotation.y += 0.02;
        
        for (var j = 0; j < crystal.children.length; j++) {
            var child = crystal.children[j];
            if (child.userData.angle !== undefined) {
                var angle = child.userData.angle + Date.now() * 0.002;
                child.position.x = Math.cos(angle) * 0.8;
                child.position.z = Math.sin(angle) * 0.8;
            }
        }
        
        var dx = player.position.x - crystal.position.x;
        var dy = player.position.y - crystal.position.y;
        var dz = player.position.z - crystal.position.z;
        var distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance < 1.5) {
            collectCrystal(crystal);
        }
    }
}

function collectCrystal(crystal) {
    crystal.userData.collected = true;
    crystal.visible = false;
    
    score++;
    scoreValue.textContent = score;
    
    playCollectSound();
    
    var messages = [
        'Cristal collecte!',
        'Super!',
        'Encore un!',
        'Tu y quasi!',
        'Plus que ' + (CONFIG.CRYSTAL_COUNT - score) + '!'
    ];
    
    if (score < CONFIG.CRYSTAL_COUNT) {
        showMessage(messages[Math.floor(Math.random() * messages.length)]);
    } else {
        setTimeout(winGame, 500);
    }
}

function showMessage(text) {
    messageDisplay.textContent = text;
    messageDisplay.classList.add('show');
    
    setTimeout(function() {
        messageDisplay.classList.remove('show');
    }, 2000);
}

function winGame() {
    gameRunning = false;
    
    if (backgroundMusic) {
        backgroundMusic.stop();
    }
    
    gameScreen.classList.remove('active');
    winScreen.classList.add('active');
    
    createWinEffect();
}

function createWinEffect() {
    for (var i = 0; i < 50; i++) {
        setTimeout(function() {
            var geometry = new THREE.SphereGeometry(0.1, 4, 4);
            var colors = [0xff00c8, 0x00d4ff, 0x00ff88, 0xffd700];
            var colorIndex = Math.floor(Math.random() * colors.length);
            var material = new THREE.MeshStandardMaterial({
                color: colors[colorIndex],
                emissive: colors[colorIndex],
                emissiveIntensity: 0.8
            });
            var particle = new THREE.Mesh(geometry, material);
            
            particle.position.set(
                player.position.x + (Math.random() - 0.5) * 10,
                Math.random() * 5 + 2,
                player.position.z + (Math.random() - 0.5) * 10
            );
            
            scene.add(particle);
            
            (function(p) {
                var anim = function() {
                    p.position.y += 0.05;
                    if (p.material.opacity > 0) {
                        p.material.opacity -= 0.01;
                        requestAnimationFrame(anim);
                    } else {
                        scene.remove(p);
                    }
                };
                anim();
            })(particle);
        }, i * 50);
    }
}

// ========================================
// BOUCLE DE JEU
// ========================================

function animate() {
    animationId = requestAnimationFrame(animate);
    
    if (gameRunning) {
        updatePlayer();
        updateCamera();
        updateCrystals();
    }
    
    renderer.render(scene, camera);
}

// ========================================
// DÉMARRAGE
// ========================================

window.addEventListener('load', function() {
    console.log('Page loaded');
    init();
});
