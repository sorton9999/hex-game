import { useEffect, useRef, useState } from 'react';
const base = import.meta.env.BASE_URL;
const DEFAULT_SOUND_FILES = {
	start: `${base}sounds/mixkit-arcade-rising-231.wav`,
	blip: `${base}sounds/mixkit-quick-lock-sound-2854.wav`,
	collision: `${base}sounds/mixkit-explainer-video-game-alert-sweep-236.wav`,
	victory: `${base}sounds/mixkit-winning-notification-2018.wav`,
	reset: `${base}sounds/mixkit-extra-bonus-in-a-video-game-2045.wav`,
    bkgrnd1: `${base}sounds/the_price_of_freedom-loop1.ogg`,
    bkgrnd2: `${base}sounds/awake10_megaWall.mp3`
};

// SoundManager Component: Handles loading and playing sounds based on game events
export default function SoundManager ({isCollision, isVictory, isBlip, isReset, isStartAppear, onStartSoundEnd, isSfxMuted, soundFiles = DEFAULT_SOUND_FILES}) {
	const audioContext = useRef(null);
	const sourceNode = useRef(null);
	const gainNode = useRef(null);
	const soundBuffers = useRef({}); // Cache for multiple sound files
	const [isPlaying, setIsPlaying] = useState(false);
	const [isUnlocked, setIsUnlocked] = useState(false);

	// Function to load a sound file and decode it into an AudioBuffer
	const loadSound = (soundFile) => {
		if (!soundFile || typeof window === 'undefined') return;
		if (!audioContext.current) {
			audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
			gainNode.current = audioContext.current.createGain();
			gainNode.current.connect(audioContext.current.destination);
			gainNode.current.gain.value = 0.8;
		}
		fetch(soundFile)
			.then(response => response.arrayBuffer())
			.then(arrayBuffer => audioContext.current.decodeAudioData(arrayBuffer))
			.then(decodedBuffer => {
				soundBuffers.current[soundFile] = decodedBuffer;
			})
			.catch(err => console.error("Error loading audio", err));
	};

	// Function to play a sound by name, returning a Promise that resolves when it ends
	const playSound = (name) => {
		return new Promise((resolve) => {
			const buffer = soundBuffers.current[name];
			if (!buffer || isPlaying || !audioContext.current || !gainNode.current) return resolve();
			sourceNode.current = audioContext.current.createBufferSource();
			sourceNode.current.buffer = buffer;
			sourceNode.current.connect(gainNode.current);
			sourceNode.current.start(0);
			setIsPlaying(true);
			sourceNode.current.onended = () => {
				sourceNode.current = null;
				setIsPlaying(false);
				resolve();
			};
		});
	};

	// Function to stop the currently playing sound
	const stopSound = () => {
		if (sourceNode.current) {
			sourceNode.current.stop();
			sourceNode.current = null;
			setIsPlaying(false);
		}
	};

	// Load all necessary sounds on component mount
	useEffect(() => {
		loadSound(soundFiles.start);
		loadSound(soundFiles.blip);
		loadSound(soundFiles.collision);
		loadSound(soundFiles.victory);
		loadSound(soundFiles.reset);
	}, [soundFiles]);

	// Play specific sounds based on game events

	// Collision sound
   useEffect(() => {
		if (isCollision) playSound(soundFiles.collision);
	}, [isCollision, soundFiles]);
	// Victory sound
	useEffect(() => {
		if (isVictory) playSound(soundFiles.victory);
	}, [isVictory, soundFiles]);
	// Blip sound for UI interactions
	useEffect(() => {
		if (isBlip) playSound(soundFiles.blip);
	}, [isBlip, soundFiles]);
	// Reset sound when the game is reset
	useEffect(() => {
		if (isReset) playSound(soundFiles.reset);
	}, [isReset, soundFiles]);

	// Play reset-like sound when player spawn is appearing
	useEffect(() => {
		if (isStartAppear) playSound(soundFiles.reset);
	}, [isStartAppear, soundFiles]);
	// Mute or unmute sound effects based on isSfxMuted state
	useEffect(() => {
		if (gainNode.current) {
			gainNode.current.gain.value = isSfxMuted ? 0 : 0.8;
		}
	}, [isSfxMuted]);

	// Unlock audio on first user interaction
	// Many browsers require a user interaction to unlock audio playback, 
	// so we display a start button until the user clicks to enable sound
	if (!isUnlocked) {
		return (
			<div 
				onClick={() => {
					if (!audioContext.current) {
						audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
						gainNode.current = audioContext.current.createGain();
						gainNode.current.connect(audioContext.current.destination);
						gainNode.current.gain.value = 0.8;
					}
					audioContext.current.resume().then(async () => {
						setIsUnlocked(true);
						await playSound(soundFiles.start);
						if (typeof onStartSoundEnd === 'function') onStartSoundEnd();
					});
				}} 
				style={{ position: 'absolute', top: '50%', left: '50%', 
				transform: 'translate(-50%, -50%)', padding: '20px 40px', 
				backgroundColor: '#00ff00', color: '#000', borderRadius: '8px', 
				fontWeight: 'bold', fontSize: '20px',
				cursor: 'pointer', zIndex: 20 }}>
				CLICK TO START SIMULATION
				<div style={{ color: '#ff0000', fontWeight: 'bold', fontSize: '12px', marginTop: '10px' }}>
					WARNING: Contains flashing game area after level 3
				</div>
			</div>
		);
	}
	// This component does not render anything visible once audio is unlocked, 
	// it just manages sound effects in the background
	return null;
};
		