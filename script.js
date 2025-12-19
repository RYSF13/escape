
document.addEventListener('DOMContentLoaded', () => {
    
    // --- CONFIGURATION ---
    const CONFIG = {
        totalDuration: 162000, // 2m42s
        fftSize: 2048,
        colors: {
            primary: '#39ff14',
            bg: '#101012'
        }
    };

    // --- DOM ELEMENTS ---
    const els = {
        startWindow: document.getElementById('window-init'),
        terminalWindow: document.getElementById('window-terminal'),
        finalWindow: document.getElementById('window-final'),
        fButton: document.getElementById('f-trigger'),
        terminalOutput: document.getElementById('terminal-output'),
        progressBar: document.getElementById('progress-bar'),
        progressPercent: document.getElementById('progress-percent'),
        audio: document.getElementById('bg-music'),
        canvas: document.getElementById('oscilloscope')
    };

    // --- STATE ---
    let state = {
        started: false,
        startTime: 0,
        audioContext: null,
        analyser: null,
        dataArray: null
    };

    // --- AUDIO & VISUALIZER ---
    
    /**
     * Initializes Audio Context and Canvas Visualizer
     * Note: Must be called after user interaction.
     */
    function initAudioVisualizer() {
        // Create Context
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        state.audioContext = new AudioContext();
        
        // Connect Source
        const track = state.audioContext.createMediaElementSource(els.audio);
        state.analyser = state.audioContext.createAnalyser();
        
        state.analyser.fftSize = CONFIG.fftSize;
        track.connect(state.analyser);
        state.analyser.connect(state.audioContext.destination);
        
        // Prepare Data Buffer
        const bufferLength = state.analyser.frequencyBinCount;
        state.dataArray = new Uint8Array(bufferLength);
        
        // Canvas Setup
        const canvasCtx = els.canvas.getContext('2d');
        
        function resizeCanvas() {
            els.canvas.width = window.innerWidth;
            els.canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // Render Loop
        function draw() {
            requestAnimationFrame(draw);

            state.analyser.getByteTimeDomainData(state.dataArray);

            // Clear with semi-transparent black for trail effect? 
            // Theme requires clean solid bg, but let's just clearRect for performance
            canvasCtx.fillStyle = CONFIG.colors.bg;
            canvasCtx.fillRect(0, 0, els.canvas.width, els.canvas.height);

            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = CONFIG.colors.primary;
            canvasCtx.beginPath();

            const sliceWidth = els.canvas.width * 1.0 / bufferLength;
            let x = 0;

            for(let i = 0; i < bufferLength; i++) {
                const v = state.dataArray[i] / 128.0; // Normalize 0-2
                const y = v * els.canvas.height / 2;

                if(i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            canvasCtx.lineTo(els.canvas.width, els.canvas.height / 2);
            canvasCtx.stroke();
        }

        draw();
        
        // Play Audio
        els.audio.play().catch(e => console.error("Audio play failed:", e));
    }

    // --- TERMINAL LOGIC ---

    /**
     * Writes text character by character
     */
    function typeWriter(text, callback) {
        const line = document.createElement('div');
        line.className = 'log-line typing-cursor';
        els.terminalOutput.appendChild(line);
        
        let i = 0;
        const speed = 50; // typing speed ms

        function type() {
            if (i < text.length) {
                line.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else {
                line.classList.remove('typing-cursor'); // Remove cursor
                if (callback) callback();
            }
        }
        type();
    }

    /**
     * Appends a log line immediately
     */
    function appendLog(text) {
        const line = document.createElement('div');
        line.className = 'log-line';
        line.textContent = text;
        els.terminalOutput.appendChild(line);
        // Keep scroll at bottom
        els.terminalOutput.scrollTop = els.terminalOutput.scrollHeight;
    }

    /**
     * Main Uninstall Sequence
     */
    function startSequence() {
        if(state.started) return;
        state.started = true;

        // 1. UI Switch
        els.startWindow.classList.add('hidden');
        els.terminalWindow.classList.remove('hidden');

        // 2. Audio & Vis
        initAudioVisualizer();

        // 3. Terminal Flow
        // Step A: Type the command
        typeWriter('> uninstall earth_online', () => {
            
            // Step B: Initialize Progress and Scheduled Logs
            state.startTime = Date.now();
            requestAnimationFrame(updateProgress);
            
            // Define timestamps for specific messages (relative to start of progress)
            // Total time approx 163s.
            const schedule = [
                { time: 1000, msg: "Preparing uninstalling program..." },
                { time: 15000, msg: ">> Uninstalling physics simulation module..." },
                { time: 45000, msg: ">> Uninstalling rendering engine (global_illumination)..." },
                { time: 80000, msg: ">> Purging memory containers (hippocampus_link)..." },
                { time: 120000, msg: ">> Logging out user..." },
                { time: 150000, msg: ">> Removing log files and temp data..." },
                { time: 162000, msg: "'earth_online' uninstalled successfully." }
            ];

            let nextEventIndex = 0;

            function updateProgress() {
                const now = Date.now();
                const elapsed = now - state.startTime;
                const progress = Math.min(elapsed / CONFIG.totalDuration, 1);

                // Update Bar
                const percent = (progress * 100).toFixed(1);
                els.progressBar.style.width = `${percent}%`;
                els.progressPercent.textContent = `${Math.floor(percent)}%`;

                // Check Schedule
                if (nextEventIndex < schedule.length) {
                    if (elapsed >= schedule[nextEventIndex].time) {
                        appendLog(schedule[nextEventIndex].msg);
                        nextEventIndex++;
                    }
                }

                if (progress < 1) {
                    requestAnimationFrame(updateProgress);
                } else {
                    finishSequence();
                }
            }
        });
    }

    function finishSequence() {
        setTimeout(() => {
            els.terminalWindow.classList.add('hidden');
            els.finalWindow.classList.remove('hidden');
        }, 1500); // Slight pause after success
    }

    // --- EVENT LISTENERS ---

    function handleTrigger() {
        startSequence();
        // Remove listeners to ensure single trigger
        document.removeEventListener('keydown', handleKey);
        els.fButton.removeEventListener('click', handleTrigger);
    }

    function handleKey(e) {
        if (e.key.toLowerCase() === 'f') {
            handleTrigger();
        }
    }

    document.addEventListener('keydown', handleKey);
    els.fButton.addEventListener('click', handleTrigger);

});