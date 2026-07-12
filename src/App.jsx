import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import renderBoard from './gameBoard';
import { makeWallKey, WALLS_EASY, WALLS_HARD, WALLS_ELITE, PERMANENT_ROGUES, TEMP_PROTECTED, NEIGHBOR_TILES, rogueState } from './hexTile';
import TouchControls from './touchControls';
import SoundManager from './soundManager';
import collisionSound from './assets/sounds/mixkit-explainer-video-game-alert-sweep-236.wav';
import victorySound from './assets/sounds/mixkit-winning-notification-2018.wav';
import blipSound from './assets/sounds/mixkit-quick-lock-sound-2854.wav';
import startSound from './assets/sounds/mixkit-arcade-rising-231.wav';
import resetSound from './assets/sounds/mixkit-extra-bonus-in-a-video-game-2045.wav';
import bgMusicOne from './assets/sounds/the_price_of_freedom-loop1.ogg';
import bgMusicTwo from './assets/sounds/awake10_megaWall.mp3';

// Use a separate CSS module for clean styling
import './App.css'; 

const HEX_SIZE = 38;
const BASE_RADIUS = 4;

const START_POS = { q: 0, r: 0 };
const GOAL_POS = { q: 4, r: -4 };

const TRANSITION_VECTORS = {
    1: { x: 100, y: 0 },   // Slide right vector parameters
    2: { x: -100, y: 0 },  // Slide left vector parameters
    3: { x: 0, y: 100 },   // Slide down vector parameters
    4: { x: 0, y: -100 }   // Slide up vector parameters
};

// If you have a difficulty mapping array or logic system, include it here:
const getDifficultyForLevel = function(level) {
    if (level <= 3) return { label: 'NORMAL', speed: 1000 };
    return { label: 'ELITE', speed: 500 };
};


// Sound files for different events
const SOUND_FILES = {
collision: collisionSound,
victory: victorySound,
blip: blipSound,
start: startSound,
reset: resetSound,
bkgrnd1: bgMusicOne,
bkgrnd2: bgMusicTwo
};

// Directions for neighboring tiles in axial coordinates (q, r)
// Shared definitions are imported from hexTile.jsx


export default function App() {
            const [viewportSize, setViewportSize] = useState(() => ({
                width: typeof window !== 'undefined' ? window.innerWidth : 1280,
                height: typeof window !== 'undefined' ? window.innerHeight : 720
            }));

            useEffect(() => {
                const updateViewport = () => {
                    const width = window.visualViewport?.width ?? window.innerWidth;
                    const height = window.visualViewport?.height ?? window.innerHeight;
                    setViewportSize({ width, height });
                };

                updateViewport();
                window.addEventListener('resize', updateViewport);
                window.addEventListener('orientationchange', updateViewport);
                window.visualViewport?.addEventListener('resize', updateViewport);

                return () => {
                    window.removeEventListener('resize', updateViewport);
                    window.removeEventListener('orientationchange', updateViewport);
                    window.visualViewport?.removeEventListener('resize', updateViewport);
                };
            }, []);

            // Define difficulty levels with their respective spawn rates and hazard durations
            const DIFFICULTY_LEVELS = {
            EASY: { label: "EASY", spawnRate: 1, duration: 1.5 },
            HARD: { label: "HARD", spawnRate: 0.5, duration: 0.8 },
            ELITE: { label: "ELITE", spawnRate: 0.2, duration: 0.3 }
            };

            const EXTRA_ELITE_BLOCKERS = [
                { q: 1, r: -1 },
                { q: -1, r: 2 }
            ];

            const getDifficultyForLevel = (level) => {
                if (level === 1) return DIFFICULTY_LEVELS.EASY;
                if (level === 2) return DIFFICULTY_LEVELS.HARD;
                return DIFFICULTY_LEVELS.ELITE;
            };

            const addEliteBlockers = () => {
                EXTRA_ELITE_BLOCKERS.forEach(({ q, r }) => PERMANENT_ROGUES.add(`${q},${r}`));
            };

            const TRANSITION_VECTORS = [
                { x: 0, y: -110 },
                { x: 110, y: -55 },
                { x: 110, y: 55 },
                { x: 0, y: 110 },
                { x: -110, y: 55 },
                { x: -110, y: -55 }
            ];

            const getRandomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

            

            // State variables for game logic, including difficulty, player position, hazards, 
            // timer, collisions, and high scores
            const [diff, setDiff] = useState(getDifficultyForLevel(1));            
            const [level, setLevel] = useState(1);
            const currentRadius = level >= 8 ? BASE_RADIUS + 2 : BASE_RADIUS;
            const responsiveHexSize = useMemo(() => {
                const radius = Math.max(currentRadius, 3);
                const widthBudget = Math.max(240, viewportSize.width - 48);
                const heightBudget = Math.max(240, viewportSize.height - 220);
                const widthBased = widthBudget / ((radius * 2 + 1) * 1.5);
                const heightBased = heightBudget / ((radius * 2 + 1) * 1.8);
                return Math.max(18, Math.min(38, Math.min(widthBased, heightBased)));
            }, [currentRadius, viewportSize.width, viewportSize.height]);
            const uiScale = useMemo(() => {
                const maxScale = Math.min(viewportSize.width / 390, viewportSize.height / 800, 1.15);
                return Math.max(0.75, maxScale);
            }, [viewportSize.width, viewportSize.height]);
            const START_POS = { q: 0, r: currentRadius };
            const GOAL_POS = { q: 0, r: -currentRadius };
            const getGoalTransitionSide = ({ q, r }) => {
                const R = currentRadius;
                if (q === 0 && r === -R) return getRandomFrom([5, 0]);
                if (q === R && r === -R) return getRandomFrom([0, 1]);
                if (q === R && r === 0) return getRandomFrom([1, 2]);
                if (q === 0 && r === R) return getRandomFrom([2, 3]);
                if (q === -R && r === R) return getRandomFrom([3, 4]);
                if (q === -R && r === 0) return getRandomFrom([4, 5]);
                if (r === -R) return 0;
                if (q === R) return 1;
                if (q + r === R) return 2;
                if (r === R) return 3;
                if (q === -R) return 4;
                if (q + r === -R) return 5;
                return 0;
            };
            const [selected, setSelected] = useState({ q: 0, r: currentRadius });
            const selectedRef = useRef({ q: 0, r: currentRadius });
            const [goal, setGoal] = useState(GOAL_POS);
            const goalRef = useRef(GOAL_POS);
            const [flashMap, setFlashMap] = useState({});

            const [timer, setTimer] = useState(0);
            const [collisions, setCollisions] = useState(0);
            const [isCollision, setIsCollision] = useState(false);
            const [isVictory, setIsVictory] = useState(false);
            const [isReset, setIsReset] = useState(false);
            const [isBlip, setIsBlip] = useState(false);
            const [status, setStatus] = useState("idle");
            // Checkbox states for toggling sound
            const [isChill, setIsChill] = useState(false);
            const [isMuted, setIsMuted] = useState(false);
            const [isSfxMuted, setIsSfxMuted] = useState(false);
            // track player moves since level start; required to delay goal movement on level 3+
            const [playerMoves, setPlayerMoves] = useState(0);
            const [isTransitioning, setIsTransitioning] = useState(false);
            const [pendingLevel, setPendingLevel] = useState(null);
            const [pendingDiff, setPendingDiff] = useState(null);
            const [pendingBoardActive, setPendingBoardActive] = useState(false);
            const [pendingSide, setPendingSide] = useState(null);
            const [showContinuePrompt, setShowContinuePrompt] = useState(false);
            const [collisionJolt, setCollisionJolt] = useState({ x: 0, y: 0 });
            const collisionTimeouts = useRef([]);
            const [redFlash, setRedFlash] = useState(false);
            // Player spawn / start animation state
            const [playerActive, setPlayerActive] = useState(false);
            const [startSpawnActive, setStartSpawnActive] = useState(false);
            const [startSpawnProgress, setStartSpawnProgress] = useState(0);
            const spawnRaf = useRef(null);
            // Play reset-like sound partway through spawn
            const [playResetOnSpawn, setPlayResetOnSpawn] = useState(false);
            const spawnTimeoutRef = useRef([]);
            const statusRef = useRef("idle");
            const levelRef = useRef(1);
            const playerMovesRef = useRef(0);
            const perimeterTilesRef = useRef([]);
            // Background music state
            const bgMusicRef = useRef(null);

            // High Score State (Fastest Time / Least Collisions)
            const [bestTime, setBestTime] = useState(() => localStorage.getItem('hex_best_time') || '--');
            const [bestCollisions, setBestCollisions] = useState(() => localStorage.getItem('hex_best_hits') || '--');

            // Draggable D-Pad State for Mobile Controls: Position and dragging state for the on-screen controls.
            const [dpadPos, setDpadPos] = useState({ bottom: 40, right: 40 });
            const [isDragging, setIsDragging] = useState(false);
            const dragStart = useRef({ x: 0, y: 0 });
            const currentPos = useRef({ bottom: 40, right: 40 });

            // Tracks which direction key is currently held down ('ArrowUp', 'ArrowDown', etc.)
            const [activeDir, setActiveDir] = useState(null);

            const handleTouchStart = (dir) => {
                setActiveDir(dir);
                const event = new KeyboardEvent('keydown', { key: dir });
                window.dispatchEvent(event);
            };

            const handleTouchEnd = () => {
                setActiveDir(null);
            };       

            const handleDragStart = (e) => {
                const touch = e.touches[0];
                dragStart.current = { x: touch.clientX, y: touch.clientY };
                setIsDragging(true);
            };

            const handleDragMove = (e) => {
                if (!isDragging) return;
                const touch = e.touches[0];
                const deltaX = dragStart.current.x - touch.clientX;
                const deltaY = dragStart.current.y - touch.clientY;
                
                setDpadPos({
                    bottom: Math.max(10, currentPos.current.bottom + deltaY),
                    right: Math.max(10, currentPos.current.right + deltaX)
                });
            };

            const handleDragEnd = () => {
                setIsDragging(false);
                currentPos.current = { ...dpadPos };
            };

            // Toggle sound effects mute state
            const toggleSfxMute = () => {
                setIsSfxMuted(!isSfxMuted);
            };

            const handleFlashChange = useCallback((q, r, active) => {
                setFlashMap(prev => ({ ...prev, [`${q},${r}`]: active }));
            }, []);

            const handleTileSelect = useCallback((q, r) => {
                if (status === "playing" && !flashMap[`${q},${r}`]) {
                    setSelected({ q, r });
                }
            }, [status, flashMap]);

            // Function to clear high scores from localStorage and reset the displayed values
            const clearHighScores = () => {
                localStorage.removeItem('hex_best_time');
                localStorage.removeItem('hex_best_hits');
                setBestTime('--');
                setBestCollisions('--');
                setIsBlip(true);
                setTimeout(() => setIsBlip(false), 300);
             };

            // Helper to switch audio files seamlessly on an existing player node
            const switchAudioTrack = (newSrc) => {
                if (!bgMusicRef.current) return;
                
                const wasPlaying = !bgMusicRef.current.paused;
                bgMusicRef.current.pause();
                bgMusicRef.current.src = newSrc; // Swap the file source path instantly
                bgMusicRef.current.load();
                bgMusicRef.current.loop = true;
                bgMusicRef.current.volume = isMuted ? 0 : 0.15;
                
                if (wasPlaying && !isMuted) {
                    bgMusicRef.current.play().catch(e => console.log("Playback error:", e));
                }
            };

            // Reset the game state to its initial values, including player position, goal position, 
            // timer, collisions, and difficulty level.
            const onReset = () => {
                // Reset music to start
                if (bgMusicRef.current) {
                    bgMusicRef.current.pause();
                    bgMusicRef.current.currentTime = 0;
                }
                const targetSrc = isChill ? SOUND_FILES.bkgrnd1 : SOUND_FILES.bkgrnd2;
                if (!bgMusicRef.current.src.endsWith(targetSrc)) {
                    bgMusicRef.current.src = targetSrc;
                }
                bgMusicRef.current.loop = true;
                bgMusicRef.current.currentTime = 0;
                bgMusicRef.current.volume = isMuted ? 0 : 0.15;
                if (!isMuted) {
                    bgMusicRef.current.play().catch(err => {
                        console.log("Browser autoplay policy prevented audio execution on reset:", err);
                    });
                }

                const resetRadius = BASE_RADIUS;
                setSelected({ q: 0, r: resetRadius });
                selectedRef.current = { q: 0, r: resetRadius };
                setGoal({ q: 0, r: -resetRadius });
                setIsReset(true);
                setTimer(0);
                setCollisions(0);
                setStatus("idle");
                setLevel(1);
                setPlayerMoves(0);
                setIsTransitioning(false);
                setPendingLevel(null);
                setPendingDiff(null);
                setPendingBoardActive(false);
                setPendingSide(null);
                setShowContinuePrompt(false);
                setCollisionJolt({ x: 0, y: 0 });
                setDiff(getDifficultyForLevel(1));
                PERMANENT_ROGUES.clear();
                TEMP_PROTECTED.clear();
                goalRef.current = { q: 0, r: -resetRadius };
                statusRef.current = "idle";
                levelRef.current = 1;
                playerMovesRef.current = 0;
                rogueState.value = 0;
            };

            const handleContinuePrompt = (shouldContinue) => {
                setShowContinuePrompt(false);
                if (shouldContinue) {
                    startNextLevel(4);
                    return;
                }

                onReset();
            };
 
            const startNextLevel = (nextLevel) => {
                const newRadius = nextLevel >= 8 ? BASE_RADIUS + 2 : BASE_RADIUS;
                setLevel(nextLevel);
                setDiff(getDifficultyForLevel(nextLevel));
                setSelected({ q: 0, r: newRadius });
                selectedRef.current = { q: 0, r: newRadius };
                setGoal({ q: 0, r: -newRadius });
                setPlayerMoves(0);
                setTimer(0);
                setCollisions(0);
                setStatus("playing");
                setIsVictory(false);
                setIsTransitioning(false);
                setPendingBoardActive(false);
                setPendingLevel(null);
                setPendingDiff(null);
                setPendingSide(null);
                setShowContinuePrompt(false);
                setCollisionJolt({ x: 0, y: 0 });
                PERMANENT_ROGUES.clear();
                TEMP_PROTECTED.clear();
                goalRef.current = { q: 0, r: -newRadius };
                statusRef.current = "playing";
                levelRef.current = nextLevel;
                playerMovesRef.current = 0;
                if (nextLevel >= 3) addEliteBlockers();
                rogueState.value = 0;
            };

            useEffect(() => {
                setDiff(getDifficultyForLevel(level));
            }, [level]);

            // Ensure a permanent rogue exists at the board center (0,0) on level 1 only
            useEffect(() => {
                if (level === 1) {
                    PERMANENT_ROGUES.add(`0,0`);
                } else {
                    PERMANENT_ROGUES.delete(`0,0`);
                }
            }, [level]);
 
             // Function to generate the list of perimeter tiles at the maximum radius, 
             // which are valid locations for the goal to move to
            const getPerimeterTiles = () => {
                const tiles = [];
                let q = 0, r = -currentRadius;
                for (let i = 0; i < 6; i++) {
                    for (let j = 0; j < currentRadius; j++) {
                        tiles.push({ q, r });
                        q += NEIGHBOR_TILES[i][0];
                        r += NEIGHBOR_TILES[i][1];
                    }
                }
                return tiles;
            };

            // On component unmount, stop any playing background music.
            useEffect(() => {
                return () => {
                    // Cleanup background music on unmount
                    if (bgMusicRef.current) {
                        bgMusicRef.current.pause();
                        bgMusicRef.current = null;
                    }
                };
            }, []);

            // Memoize the tiles so the reference stays the same across renders
            const perimeterTiles = useMemo(() => getPerimeterTiles(), [currentRadius]); 

            // Keep a ref to the latest selected tile so the goal interval does not restart on every move
             useEffect(() => {
                 selectedRef.current = selected;
             }, [selected]);
 
             useEffect(() => {
                 goalRef.current = goal;
             }, [goal]);
 
             useEffect(() => {
                 statusRef.current = status;
             }, [status]);
 
             useEffect(() => {
                 levelRef.current = level;
             }, [level]);
 
             useEffect(() => {
                 playerMovesRef.current = playerMoves;
             }, [playerMoves]);
 
             useEffect(() => {
                 perimeterTilesRef.current = perimeterTiles;
             }, [perimeterTiles]);
 
             // Effect to move the goal periodically once the player has moved.
             // Timer does not start until the first player move, and it uses a
             // longer interval when the board is larger than the base radius.
            useEffect(() => {
                const interval = setInterval(() => {
                    if (status === "idle" || status === "won") return;
                     // Only move goal in ELITE mode
                    //if (diff.label === "HARD" || diff.label === "EASY") return;
                    // If less than level 3, skip
                    if (levelRef.current < 3) return;

                    // If player has not moved at least 3 hexes, skip
                    if (playerMovesRef.current < 3) return;

                    // Ensure tiles exist before picking one
                    if (perimeterTiles.length === 0) return;

                    // Filter perimeter tiles 4 tiles away from the goal's current position
                    const allowedTiles = perimeterTiles.filter(tile => {
                        const distanceX = Math.abs(tile.q - goal.q);
                        const distanceY = Math.abs(tile.r - goal.r);
                        return distanceX <= 4 && distanceY <= 4;
                    });

                    // Pick a random tile from the allowed tiles to move the goal to
                    let nextTileIndex;
                    if (allowedTiles.length > 0) {
                        nextTileIndex = allowedTiles[Math.floor(Math.random() * allowedTiles.length)];
                    } else {
                        nextTileIndex = perimeterTiles[Math.floor(Math.random() * perimeterTiles.length)];
                    }

                    // If the new goal position is the same as the player's current position, skip this move
                    if (nextTileIndex.q === selected.q && nextTileIndex.r === selected.r) {
                        return;
                    }
                    // If the new goal position is the same as the start position, skip this move
                    if (nextTileIndex.q === START_POS.q && nextTileIndex.r === START_POS.r) {
                        return;
                    }
                    // If the new goal position is a permanent rogue tile, skip this move
                    if (PERMANENT_ROGUES.has(`${nextTileIndex.q},${nextTileIndex.r}`)) {
                        return;
                    }

                    // Set the next goal move location
                    const [nextQ, nextR] = [nextTileIndex.q, nextTileIndex.r];

                    setGoal({ q: nextQ, r: nextR });

                    console.log('Moved goal to:', { q: nextQ, r: nextR });
                }, 3000);

                return () => clearInterval(interval);
            }, [perimeterTiles, status]);


            // Timer Effect: Increment the timer every second while the game is in the "playing" state,
            // and clear the timer when not playing.
            useEffect(() => {
                let interval;
                if (status === "playing") interval = setInterval(() => setTimer(t => t + 1), 1000);
                return () => clearInterval(interval);
            }, [status]);

            // Function to update high scores in localStorage if the current time or collisions are 
            // better than the stored values
            const updateHighScores = useCallback(() => {
                const currentBestTime = localStorage.getItem('hex_best_time');
                const currentBestHits = localStorage.getItem('hex_best_hits');
                console.log('Updating high scores:', { timer, collisions, currentBestTime, currentBestHits });
                if (!currentBestTime || timer < parseInt(currentBestTime)) {
                    console.log('New best time:', timer);
                    localStorage.setItem('hex_best_time', timer);
                    setBestTime(timer);
                }
                if (!currentBestHits || collisions < parseInt(currentBestHits)) {
                    localStorage.setItem('hex_best_hits', collisions);
                    setBestCollisions(collisions);
                }
            }, [timer, collisions]);

            // Effect to check for victory condition whenever the selected tile or game status changes, 
            // and update high scores if the player has won
            useEffect(() => {
                if (selected.q == goal.q && selected.r == goal.r && status === "won") {
                    setIsVictory(true);
                    updateHighScores();
                }
            }, [selected, status, updateHighScores]);

            useEffect(() => {
                if (status !== "won") return;
                if (level === 3) {
                    setShowContinuePrompt(true);
                    setIsTransitioning(false);
                    setPendingBoardActive(false);
                    return;
                }
                const nextLevel = level + 1;
                setPendingLevel(nextLevel);
                setPendingDiff(getDifficultyForLevel(nextLevel));
                setPendingSide(getGoalTransitionSide(goal));
                setPendingBoardActive(true);
                setIsTransitioning(true);
                const transitionTimer = setTimeout(() => startNextLevel(nextLevel), 900);
                return () => clearTimeout(transitionTimer);
            }, [status, level, goal]);

            // Cleanup any scheduled collision timeouts on unmount
            useEffect(() => {
                return () => {
                    collisionTimeouts.current.forEach(id => clearTimeout(id));
                    collisionTimeouts.current = [];
                };
            }, []);

            // Clean up any spawn RAF and timeouts on unmount
            useEffect(() => {
                return () => {
                    if (spawnRaf.current) cancelAnimationFrame(spawnRaf.current);
                    spawnTimeoutRef.current.forEach(id => clearTimeout(id));
                    spawnTimeoutRef.current = [];
                };
            }, []);

            // Start the 2s spawn animation: quick blue/yellow flashes, then enable player
            const startSpawnAnimation = () => {
                const duration = 2000; // ms
                const startTime = performance.now();
                setStartSpawnActive(true);
                setStartSpawnProgress(0);
                // schedule reset sound to play before the transition completes (e.g. at 1.2s)
                spawnTimeoutRef.current.forEach(id => clearTimeout(id));
                spawnTimeoutRef.current = [];
                const resetDelay = 1200;
                const t1 = setTimeout(() => {
                    setPlayResetOnSpawn(true);
                    const t2 = setTimeout(() => setPlayResetOnSpawn(false), 300);
                    spawnTimeoutRef.current.push(t2);
                }, resetDelay);
                spawnTimeoutRef.current.push(t1);
                const step = (now) => {
                    const t = Math.max(0, Math.min(1, (now - startTime) / duration));
                    setStartSpawnProgress(t);
                    if (t >= 1) {
                        setStartSpawnActive(false);
                        setPlayerActive(true);
                        // clear any pending spawn timeouts
                        spawnTimeoutRef.current.forEach(id => clearTimeout(id));
                        spawnTimeoutRef.current = [];
                        spawnRaf.current = null;
                        return;
                    }
                    spawnRaf.current = requestAnimationFrame(step);
                };
                spawnRaf.current = requestAnimationFrame(step);

                // Set up background music to play after a short delay, and loop indefinitely
                if (!bgMusicRef.current) {
                    const bgAudio = new Audio(SOUND_FILES.bkgrnd2);
                    const initialSrc = isChill ? SOUND_FILES.bkgrnd1 : SOUND_FILES.bkgrnd2;
                    bgAudio.src = initialSrc;
                    bgAudio.loop = true;
                    bgAudio.volume = isMuted ? 0 : 0.15;
                    bgMusicRef.current = bgAudio;
                }
                setTimeout(() => {
                    if (bgMusicRef.current && !isMuted) {
                        bgMusicRef.current.play().catch(err => console.error("Error playing background music", err));
                    }
                }, 1500);
            };

            // Handle the Chill mode toggle on the fly
            const toggleChill = () => {
                const nextChillState = !isChill;
                setIsChill(nextChillState);
                switchAudioTrack(nextChillState ? SOUND_FILES.bkgrnd1 : SOUND_FILES.bkgrnd2);
            };

            const toggleMute = () => {
                const nextMuteState = !isMuted;
                setIsMuted(nextMuteState);
    
                if (bgMusicRef.current) {
                    // Smoothly drop volume to 0 or restore to your 15% soft setting
                    bgMusicRef.current.volume = nextMuteState ? 0 : 0.15;
                }
            };

            // Schedule multiple shakes and an optional red flash on collision
            const triggerCollisionEffects = () => {
                // clear previous scheduled timers
                collisionTimeouts.current.forEach(id => clearTimeout(id));
                collisionTimeouts.current = [];

                // number of shakes: level 5 -> 1, level6 ->2, ... capped at 4
                const shakes = level >= 5 ? Math.min(4, level - 4) : 0;
                if (shakes === 0) return;

                for (let i = 0; i < shakes; i++) {
                    const delay = i * 140;
                    const tSet = setTimeout(() => {
                        setCollisionJolt({ x: Math.random() * 18 - 9, y: Math.random() * 18 - 9 });
                    }, delay);
                    const tClear = setTimeout(() => setCollisionJolt({ x: 0, y: 0 }), delay + 100);
                    collisionTimeouts.current.push(tSet, tClear);
                }

                // level 8+ red flash overlay
                if (level >= 8) {
                    const tFlash = setTimeout(() => setRedFlash(true), 0);
                    const tFlashClear = setTimeout(() => setRedFlash(false), shakes * 140 + 180);
                    collisionTimeouts.current.push(tFlash, tFlashClear);
                }
            };

            // Function to handle player movement based on arrow key inputs, checking for collisions 
            // with walls and hazards,
            const move = useCallback((dq, dr) => {
                if (status === "won" || status === "stopped" || showContinuePrompt) { return; }
                if (status === "idle") { setStatus("playing"); }
                const nQ = selected.q + dq, nR = selected.r + dr;
                const coordKey = `${nQ},${nR}`;
                const inBounds = Math.abs(nQ) <= currentRadius && Math.abs(nR) <= currentRadius && Math.abs(-nQ-nR) <= currentRadius;
                const wallsInUse = diff.label === "ELITE" ? WALLS_ELITE : diff.label === "HARD" ? WALLS_HARD : WALLS_EASY;
                // 1. Check if the new position is within bounds before proceeding with collision checks
                if (!inBounds) return;
                // Handle reset state.
                // We don't want to return from here.  The reset is a new game state that we want to move into 
                // immediately on the next key press.
                if (isReset) {
                    setIsReset(false);
                }

                // 2. Check if moving through a wall
                if (wallsInUse.has(makeWallKey(selected.q, selected.r, nQ, nR)) ||
                    PERMANENT_ROGUES.has(coordKey)) {
                    setCollisions(h => h + 1);
                    setIsCollision(true);
                    triggerCollisionEffects();
                    return;
                }
                // If there was a collision but the player has now moved to a different tile, reset the collision state
                else if (isCollision) {
                    setIsCollision(false); return;
                }

                // 3. Check boundaries
                if (Math.max(Math.abs(nQ), Math.abs(nR), Math.abs(-nQ-nR)) > currentRadius) return;

                // 4. Check color hazards
                if (flashMap[`${nQ},${nR}`]) {
                    setCollisions(h => h + 1);
                    setIsCollision(true);
                    triggerCollisionEffects();
                    return;
                }
                else if (isCollision) {
                    setIsCollision(false); return;
                }

                // If all checks passed, update the selected position
                setSelected({ q: nQ, r: nR });
                setPlayerMoves(m => m + 1);
                if (nQ === goal.q && nR === goal.r) {
                    setIsVictory(true);
                    setStatus("won");
                    setTimeout(() => setIsVictory(false), 1000);
                }
            }, [selected, flashMap, status, showContinuePrompt, diff, isReset, isCollision, level]);

            // Keyboard event listener for arrow keys to move the player, and cleanup on component unmount
            useEffect(() => {
                const keys = { ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0] };
                const listener = (e) => keys[e.key] && move(...keys[e.key]);
                window.addEventListener('keydown', listener);
                return () => window.removeEventListener('keydown', listener);
            }, [move]);

            // Touch input handler to convert swipe directions into arrow key events for movement on mobile devices
            const handleTouchDirection = (direction) => {
                const event = new KeyboardEvent('keydown', { key: direction });
                window.dispatchEvent(event);
            };

            // Generate the list of hex tiles to render based on the defined radius limit, 
            // using axial coordinates (q, r)
            const tiles = useMemo(() => {
                const arr = [];
                for (let q = -currentRadius; q <= currentRadius; q++) {
                    for (let r = Math.max(-currentRadius, -q-currentRadius); r <= Math.min(currentRadius, -q+currentRadius); r++) arr.push({ q, r });
                }
                return arr;
            }, [currentRadius]);

  
  return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            
            {/* The Main Center-Aligned HUD Panel */}
            <div className="ui" style={{  
                position: 'absolute',
                top: viewportSize.width < 768 ? '6px' : '10px',
                left: viewportSize.width < 768 ? '6px' : '12px',
                right: viewportSize.width < 768 ? '6px' : '12px',
                width: viewportSize.width < 768 ? 'calc(100% - 12px)' : 'min(94vw, 1200px)',
                maxWidth: '1200px',
                margin: '0 auto',
                padding: viewportSize.width < 768 ? '8px 8px 8px' : '10px 10px 10px',
                pointerEvents: 'auto',
                background: 'rgba(0, 0, 0, 0.92)', 
                border: viewportSize.width < 768 ? '2px solid #0f0' : '3px solid #0f0', 
                boxShadow: '0 0 16px rgba(0, 255, 0, 0.3)', 
                zIndex: 40,                     
                borderRadius: '4px'
            }}>
                <div className="ui-inner" style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    justifyContent: 'center', 
                    gap: '6px',
                    width: '100%'
                }}>
                    {status === "won" && (
                        <div className="victory" style={{ 
                            color: '#0f0', 
                            fontWeight: 'bold', 
                            fontSize: viewportSize.width < 768 ? '18px' : '22px',
                            letterSpacing: '2px',
                            textShadow: '0 0 8px #0f0',
                            marginBottom: '2px',
                            textAlign: 'center' 
                        }}>
                            SYSTEM SECURED!
                        </div>
                    )}
                    
                    <div style={{ 
                        display: 'flex', 
                        gap: viewportSize.width < 768 ? '8px' : '12px', 
                        flexWrap: 'wrap',
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        fontSize: viewportSize.width < 768 ? '13px' : '14px', 
                        color: '#0f0', 
                        fontFamily: 'monospace', 
                        fontWeight: 'bold'
                    }}>
                        <div style={{ display: 'flex', gap: viewportSize.width < 768 ? '8px' : '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div className="stat"><span style={{ color: '#888' }}>LVL:</span> <span>{level}</span></div>
                            <div className="stat"><span style={{ color: '#888' }}>TIME:</span> <span>{timer}s</span></div>
                            <div className="stat"><span style={{ color: '#888' }}>HITS:</span> <span>{collisions}</span></div>
                            <div className="stat"><span style={{ color: '#888' }}>MODE:</span> <span style={{ color: '#ffaa00' }}>{diff.label}</span></div>
                        </div>
                        <div style={{ display: 'flex', gap: viewportSize.width < 768 ? '8px' : '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div className="stat"><span style={{ color: '#888' }}>FAST:</span> <span>{bestTime}{bestTime !== '--' && 's'}</span></div>
                            <div className="stat"><span style={{ color: '#888' }}>LOW:</span> <span>{bestCollisions}</span></div>
                        </div>
                    </div>

                    <div style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        width: '100%'
                    }}>
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: viewportSize.width < 768 ? '6px' : '8px'
                        }}>
                            <label style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                color: isChill ? '#ff00ff' : '#0f0', 
                                fontFamily: 'monospace', 
                                fontSize: viewportSize.width < 768 ? '12px' : '13px', 
                                fontWeight: 'bold', 
                                cursor: 'pointer',
                                userSelect: 'none'
                            }}>
                                <input 
                                    type="checkbox" 
                                    checked={isChill}
                                    onChange={toggleChill}
                                    style={{
                                        accentColor: '#0f0', 
                                        width: '14px', 
                                        height: '14px',
                                        cursor: 'pointer'
                                    }} />
                                <span>CHILL</span>
                            </label>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: isMuted ? '#444' : '#0f0', 
                                fontFamily: 'monospace',
                                fontSize: viewportSize.width < 768 ? '12px' : '13px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                userSelect: 'none'
                            }}>
                                <input 
                                    type="checkbox"
                                    checked={isMuted}
                                    onChange={toggleMute}
                                    style={{
                                        accentColor: '#0f0', 
                                        width: '14px',
                                        height: '14px',
                                        cursor: 'pointer'
                                    }}/>
                                <span>SILENT MUSIC</span>
                            </label>
                            <label style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                color: isSfxMuted ? '#444' : '#0f0', 
                                fontFamily: 'monospace', 
                                fontSize: viewportSize.width < 768 ? '12px' : '13px', 
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                userSelect: 'none'
                            }}>
                                <input type="checkbox" 
                                    checked={isSfxMuted}
                                    onChange={toggleSfxMute}
                                    style={{ 
                                        accentColor: '#0f0', 
                                        width: '14px', 
                                        height: '14px',
                                        cursor: 'pointer'
                                    }} />
                                <span>SILENT SFX</span>
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: viewportSize.width < 768 ? '6px' : '8px', flexWrap: 'wrap', justifyContent: 'flex-start', alignItems: 'center', paddingLeft: '2px' }}>
                            <button 
                                onClick={() => { onReset() }} 
                                style={{ 
                                    padding: viewportSize.width < 768 ? '7px 10px' : '8px 12px', 
                                    background: '#0f0', 
                                    color: '#000', 
                                    border: 'none', 
                                    fontWeight: 'bold', 
                                    cursor: 'pointer',
                                    fontSize: viewportSize.width < 768 ? '12px' : '13px'
                                }}>
                                RESET
                            </button>
                            <button 
                                onClick={clearHighScores} 
                                style={{ 
                                    padding: viewportSize.width < 768 ? '7px 10px' : '8px 12px', 
                                    backgroundColor: '#330000', 
                                    color: '#ff4444', 
                                    border: '2px solid #ff4444', 
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontSize: viewportSize.width < 768 ? '11px' : '13px'
                                }}>
                                CLEAR
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* HIGH-DENSITY SCALING WRAPPER FRAME */}
            <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                overflow: 'hidden',
                backgroundColor: '#0c0d12'
            }}>
				{/* Render Board Engine Call Container */}
				<div style={{ position: 'absolute', inset: 0 }}>
					{renderBoard({ 
                        HEX_SIZE: responsiveHexSize,
                        viewportSize,
                        tiles: tiles,
                        startPos: START_POS,
                        boardSelected: playerActive ? selected : { q: 9999, r: 9999 },
                        boardGoal: goal,
                        boardDiff: diff,
                        showHazards: true,
                        boardKey: 'current',
                        startSpawnProgress: startSpawnProgress,
                        startSpawnActive: startSpawnActive,
                        onFlashChange: handleFlashChange,
                        onSelect: handleTileSelect,
                        style: (() => {
                            const side = pendingSide !== null ? pendingSide : 1;
                            const vec = TRANSITION_VECTORS[side];
                            const joltX = collisionJolt.x || 0;
                            const joltY = collisionJolt.y || 0;
                            return {
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                transform: `${isTransitioning ? `translate(${-vec.x}vw, ${-vec.y}vh)` : 'translate(0, 0)'} translate(${joltX}px, ${joltY}px)`,
                                transition: isTransitioning ? 'transform 0.8s ease' : 'none',
                                overflow: 'visible'
                            };
                        })()
					})}
                    {pendingBoardActive && renderBoard({
                        HEX_SIZE: responsiveHexSize,
                        viewportSize,
                        tiles: tiles,
                        startPos: START_POS,
                        boardSelected: START_POS,
                        boardGoal: GOAL_POS,
                        boardDiff: pendingDiff || getDifficultyForLevel(level + 1),
                        showHazards: false,
                        boardKey: 'pending',
                        startSpawnProgress: startSpawnProgress,
                        startSpawnActive: startSpawnActive,
                        onFlashChange: handleFlashChange,
                        onSelect: handleTileSelect,
                        style: (() => {
                            const side = pendingSide !== null ? pendingSide : 1;
                            const vec = TRANSITION_VECTORS[side];
                            return {
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                transform: isTransitioning ? 'translate(0, 0)' : `translate(${vec.x}vw, ${vec.y}vh)`,
                                transition: 'transform 0.8s ease',
                                visibility: isTransitioning ? 'visible' : 'hidden',
                                overflow: 'visible'
                            };
                        })()
                    })}
				</div>
			</div>
			
            {redFlash && <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,0,0,0.5)', zIndex: 25, pointerEvents: 'none' }} />}

            {showContinuePrompt && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0, 0, 0, 0.72)',
                    pointerEvents: 'auto'
                }}>
                    <div style={{
                        background: 'rgba(0, 10, 0, 0.95)',
                        border: '3px solid #0f0',
                        boxShadow: '0 0 24px rgba(0, 255, 0, 0.35)',
                        padding: '28px 32px',
                        borderRadius: '10px',
                        textAlign: 'center',
                        color: '#0f0',
                        fontFamily: 'monospace',
                        maxWidth: '420px',
                        width: '90vw'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
                            LEVEL 3 COMPLETE
                        </div>
                        <div style={{ fontSize: '18px', marginBottom: '20px', lineHeight: 1.5 }}>
                            Continue to Level 4? The system is still unstable.
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => handleContinuePrompt(true)}
                                style={{
                                    padding: '12px 20px',
                                    background: '#0f0',
                                    color: '#000',
                                    border: 'none',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    minWidth: '110px'
                                }}
                            >
                                YES
                            </button>
                            <button
                                onClick={() => handleContinuePrompt(false)}
                                style={{
                                    padding: '12px 20px',
                                    background: '#330000',
                                    color: '#ff4444',
                                    border: '2px solid #ff4444',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    minWidth: '110px'
                                }}
                            >
                                NO
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Footnote Label */}
            <label style={{ 
                position: 'absolute', 
                bottom: '10px',      
                left: '20px',        
                right: '20px',       
                textAlign: 'left',   
                color: '#555', 
                fontSize: `${Math.max(12, Math.round(16 * uiScale))}px`, 
                zIndex: 25, 
                pointerEvents: 'none',
                fontFamily: 'monospace'
            }}>
                Hexel 2026 (v.2.5.1) — Navigate to the GOAL using the arrow keys while avoiding hazards and walls!
            </label>

            {/* Mount isolated modular structures globally available on window scope */}
            <TouchControls viewportSize={viewportSize} dpadPos={dpadPos} isDragging={isDragging} activeDir={activeDir} handleTouchStart={handleTouchStart} handleTouchEnd={handleTouchEnd} handleDragStart={handleDragStart} handleDragMove={handleDragMove} handleDragEnd={handleDragEnd} />
            
            <SoundManager isCollision={isCollision} isVictory={isVictory} 
				isBlip={isBlip} isReset={isReset} isStartAppear={playResetOnSpawn} 
				onStartSoundEnd={() => { startSpawnAnimation(); }} 
				isSfxMuted={isSfxMuted}
				soundFiles={SOUND_FILES}
			/>
        </div>
  );
}
