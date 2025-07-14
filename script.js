        let scene, camera, renderer, controls;
        let sun;
        const planets = [];
        let animationId;
        let isPaused = false;
        let globalSpeedMultiplier = 1.0; 
        const loadingScreen = document.getElementById('loading');
        const pauseBtn = document.getElementById('pause-btn');
        const themeToggleBtn = document.getElementById('theme-toggle');
        const globalSpeedSlider = document.getElementById('global-speed');
        const globalSpeedDisplay = document.getElementById('global-speed-display');
        const resetGlobalBtn = document.getElementById('reset-global');
        const resetAllBtn = document.getElementById('reset-all');
        const planetControlsContainer = document.getElementById('planet-controls');
        const infoPanel = document.getElementById('info-panel');
        const planetInfoName = infoPanel.querySelector('.planet-name');
        const planetDetailsChange = document.getElementById('planet-details');
        const planetInfoDetails = infoPanel.querySelector('div:nth-of-type(2)');
        const minimizeBtn = document.getElementById('minimize-btn');
        const controlPanelContent = document.querySelector('#control-panel .panel-content');
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
         const textureLoader = new THREE.TextureLoader();
        let intersectedObject = null; 
        function init() {
           scene = new THREE.Scene();
            starTexture = textureLoader.load(
                'textures/stars.jpg', 
                function(texture) {
                    scene.background = texture; 
                    console.log('Star background texture loaded:', texture);
                },
                undefined, 
                function(err) {
                    console.error('Error loading star background texture:', err);
                    scene.background = new THREE.Color(0x050510);
                }
            );

            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.set(0, 50, 100); 
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            document.getElementById('canvas-container').appendChild(renderer.domElement);

          
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true; 
            controls.dampingFactor = 0.05;
            controls.screenSpacePanning = false; 
            controls.maxDistance = 300; 
            controls.minDistance = 10; 
            const ambientLight = new THREE.AmbientLight(0x333333); 
            scene.add(ambientLight);

            const pointLight = new THREE.PointLight(0xffffff, 2, 0, 2); 
            pointLight.position.set(0, 0, 0);
            scene.add(pointLight);

          
            const sunGeometry = new THREE.SphereGeometry(10, 32, 32);

               const sunTexture = textureLoader.load(
                'textures/sun.jpg', 
                function(texture) {
                    console.log('Sun texture loaded:', texture);
                },
                undefined, 
                function(err) {
                    console.error('Error loading sun texture:', err);
                    sun.material = new THREE.MeshBasicMaterial({ color: 0xffa500 });
                }
            );
            const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
            sun = new THREE.Mesh(sunGeometry, sunMaterial);
            scene.add(sun);

            createPlanet(1.2, 20, 0x888888, 0.04, 0.02, 'Mercury', { diameter: '4,879 km', distance: '58 million km', day: '59 Earth days', year: '88 Earth days' },'textures/mercury.jpg');
            createPlanet(1.5, 30, 0xffd700, 0.03, 0.015, 'Venus', { diameter: '12,104 km', distance: '108 million km', day: '243 Earth days', year: '225 Earth days' },'textures/venus.jpg');
            createPlanet(1.8, 40, 0x0000ff, 0.02, 0.01, 'Earth', { diameter: '12,742 km', distance: '150 million km', day: '1 Earth day', year: '365 Earth days' },'textures/earth.jpg');
            createPlanet(1.3, 50, 0xff4500, 0.015, 0.018, 'Mars', { diameter: '6,779 km', distance: '228 million km', day: '1.03 Earth days', year: '687 Earth days' },'textures/mars.jpg');
            createPlanet(5, 70, 0xdda0dd, 0.008, 0.03, 'Jupiter', { diameter: '139,820 km', distance: '778 million km', day: '0.41 Earth days', year: '11.86 Earth years' },'textures/jupiter.jpg');
            createPlanet(4, 90, 0xf4a460, 0.006, 0.025, 'Saturn', { diameter: '116,460 km', distance: '1.4 billion km', day: '0.44 Earth days', year: '29.4 Earth years' },'textures/saturn.jpg');
            createPlanet(3, 110, 0x87ceeb, 0.004, 0.02, 'Uranus', { diameter: '50,724 km', distance: '2.9 billion km', day: '0.72 Earth days', year: '84 Earth years' },'textures/uranus.jpg');
            createPlanet(3, 130, 0x4169e1, 0.003, 0.019, 'Neptune', { diameter: '49,244 km', distance: '4.5 billion km', day: '0.67 Earth days', year: '165 Earth years' },'textures/neptune.jpg');

            loadingScreen.classList.add('hidden');
        }

        /**
         * @param {number} size 
         * @param {number} distance 
         * @param {number} color 
         * @param {number} orbitalSpeed
         * @param {number} rotationSpeed 
         * @param {string} name 
         * @param {object} details
         */
        function createPlanet(size, distance, color, orbitalSpeed, rotationSpeed, name, details,textureUrl) {
            const planetGroup = new THREE.Group();
            scene.add(planetGroup);

            const geometry = new THREE.SphereGeometry(size, 32, 32);

               const planetTexture = textureLoader.load(textureUrl, 
                function(texture) {
                    console.log('Planet texture loaded:', texture);
                },
                undefined, 
                function(err) {
                    console.error('Error loading planet texture:', err);
                }
            );
            const material = new THREE.MeshLambertMaterial({ map: planetTexture }); 
            const planetMesh = new THREE.Mesh(geometry, material);
            planetMesh.position.set(distance, 0, 0); 
            planetMesh.userData = { name: name, type: 'planet', details: details }; 

            planetGroup.add(planetMesh); 
            const orbitPath = createOrbitPath(distance);
            scene.add(orbitPath); 
            
            planets.push({
                name: name,
                mesh: planetMesh,
                group: planetGroup,
                orbitalRadius: distance,
                initialOrbitalSpeed: orbitalSpeed, 
                currentOrbitalSpeed: orbitalSpeed, 
                rotationSpeed: rotationSpeed,
                details: details
            });

            createPlanetControl(name, orbitalSpeed);
        }

        /**
         * @param {number} radius 
         * @returns {THREE.Line}
         */
        function createOrbitPath(radius) {
            const points = [];
            for (let i = 0; i <= 64; i++) {
                const angle = (i / 64) * Math.PI * 2;
                points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
            }
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.5 });
            return new THREE.Line(geometry, material);
        }

        /**
         * @param {string} planetName 
         * @param {number} initialSpeed 
         */
        function createPlanetControl(planetName, initialSpeed) {
            const planetControlGroup = document.createElement('div');
            planetControlGroup.classList.add('planet-control-group');
            planetControlGroup.innerHTML = `
                <label for="speed-${planetName}">${planetName} Orbital Speed</label>
                <div class="control-row">
                    <input type="range" id="speed-${planetName}" min="0" max="5" step="0.01" value="${initialSpeed / 0.001}">
                    <div class="speed-display" id="speed-display-${planetName}">${(initialSpeed / 0.001).toFixed(2)}x</div>
                    <button class="reset-btn" id="reset-${planetName}">Reset</button>
                </div>
            `;
            planetControlsContainer.appendChild(planetControlGroup);

            const slider = planetControlGroup.querySelector(`#speed-${planetName}`);
            const display = planetControlGroup.querySelector(`#speed-display-${planetName}`);
            const resetBtn = planetControlGroup.querySelector(`#reset-${planetName}`);

            slider.addEventListener('input', (event) => {
                const speedValue = parseFloat(event.target.value);
                display.textContent = `${speedValue.toFixed(2)}x`;
               
                const planet = planets.find(p => p.name === planetName);
                if (planet) {
                    planet.currentOrbitalSpeed = speedValue * 0.001; 
                }
            });

            resetBtn.addEventListener('click', () => {
                slider.value = (initialSpeed / 0.001).toFixed(2); 
                display.textContent = `${(initialSpeed / 0.001).toFixed(2)}x`;
                const planet = planets.find(p => p.name === planetName);
                if (planet) {
                    planet.currentOrbitalSpeed = initialSpeed; 
                }
            });
        }
        function animate() {
            animationId = requestAnimationFrame(animate); 

            if (isPaused) {
                return; 
            }

            controls.update(); //

          
            planets.forEach(planet => {
             
                planet.group.rotation.y += planet.currentOrbitalSpeed * globalSpeedMultiplier;
              
                planet.mesh.rotation.y += planet.rotationSpeed * globalSpeedMultiplier;
            });

            renderer.render(scene, camera); 
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        function setupEventListeners() {
            window.addEventListener('resize', onWindowResize);

            pauseBtn.addEventListener('click', () => {
                isPaused = !isPaused;
                pauseBtn.textContent = isPaused ? 'Play' : 'Pause';
                pauseBtn.classList.toggle('paused', isPaused);
            });

            themeToggleBtn.addEventListener('click', () => {
                document.body.classList.toggle('light-theme');
                if (document.body.classList.contains('light-theme')) {
                    scene.background.set(0xe0e0e0); 
                } else {
                    scene.background.set(0x050510); 
                }
            });

            globalSpeedSlider.addEventListener('input', (event) => {
                globalSpeedMultiplier = parseFloat(event.target.value);
                globalSpeedDisplay.textContent = `${globalSpeedMultiplier.toFixed(1)}x`;
            });

            resetGlobalBtn.addEventListener('click', () => {
                globalSpeedMultiplier = 1.0;
                globalSpeedSlider.value = 1.0;
                globalSpeedDisplay.textContent = '1.0x';
            });

            resetAllBtn.addEventListener('click', () => {
                globalSpeedMultiplier = 1.0;
                globalSpeedSlider.value = 1.0;
                globalSpeedDisplay.textContent = '1.0x';

                planets.forEach(planet => {
                    planet.currentOrbitalSpeed = planet.initialOrbitalSpeed;
                    const slider = document.getElementById(`speed-${planet.name}`);
                    const display = document.getElementById(`speed-display-${planet.name}`);
                    if (slider && display) {
                        slider.value = (planet.initialOrbitalSpeed / 0.001).toFixed(2);
                        display.textContent = `${(planet.initialOrbitalSpeed / 0.001).toFixed(2)}x`;
                    }
                });
            });

            minimizeBtn.addEventListener('click', () => {
                const isHidden = controlPanelContent.classList.toggle('hidden');
                minimizeBtn.textContent = isHidden ? '+' : '-';
            });

            window.addEventListener('mousemove', onMouseMove);
        }

        /**
        
         * @param {string} name
         * @param {object} details 
         */
        function updatePlanetInfo(name, details) {
            planetInfoName.textContent = name;
            let detailsHtml = '';
            if (details) {
                for (const key in details) {
                    detailsHtml += `<div>${key.charAt(0).toUpperCase() + key.slice(1)}: ${details[key]}</div>`;
                }
            }
            // Clear existing details and append new ones
            while (planetInfoDetails.nextSibling) {
                planetInfoDetails.nextSibling.remove();
            }
            planetInfoDetails.innerHTML = detailsHtml || '<div>Hover over planets to see details</div><div>Use mouse to rotate view</div><div>Scroll to zoom in/out</div>';

        }

        /**
        
         * @param {MouseEvent} event - The mouse event.
         */
        function onMouseMove(event) {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);

            const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));

            if (intersects.length > 0) {
                const newIntersected = intersects[0].object;
                if (intersectedObject !== newIntersected) {
                    intersectedObject = newIntersected;
                    const planetData = intersectedObject.userData;
                    if (planetData && planetData.type === 'planet') {
                        updatePlanetInfo(planetData.name, planetData.details);
                    }
                }
            } else {
                if (intersectedObject !== null) {
                    intersectedObject = null;
                    updatePlanetInfo('Solar System', null); 
                }
            }
        }

        window.onload = function () {
            init();
            setupEventListeners();
            animate();
        };