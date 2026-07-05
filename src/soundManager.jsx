import { useEffect, useRef, useState } from 'react';
import arcadeRising from './assets/sounds/mixkit-arcade-rising-231.wav';
import quickLock from './assets/sounds/mixkit-quick-lock-sound-2854.wav';
import explainerAlert from './assets/sounds/mixkit-explainer-video-game-alert-sweep-236.wav';
import winningNotification from './assets/sounds/mixkit-winning-notification-2018.wav';
import extraBonus from './assets/sounds/mixkit-extra-bonus-in-a-video-game-2045.wav';
import priceOfFreedom from './assets/sounds/the_price_of_freedom-loop1.ogg';
import awake10 from './assets/sounds/awake10_megaWall.mp3';

const DEFAULT_SOUND_FILES = {
	start: arcadeRising,
	blip: quickLock,
	collision: explainerAlert,
	victory: winningNotification,
	reset: extraBonus,
	bkgrnd1: priceOfFreedom,
	bkgrnd2: awake10
};

// SoundManager Component: Handles loading and playing sounds based on game events
export default function SoundManager ({isCollision, isVictory, isBlip, isReset, isStartAppear, onStartSoundEnd, isSfxMuted, soundFiles = DEFAULT_SOUND_FILES}) {
	const [isUnlocked, setIsUnlocked] = useState(false);
	const audioElementsRef = useRef({});

	const playSound = async (nameOrSrc) => {
		if (!nameOrSrc || typeof window === 'undefined') return;
		const src = soundFiles[nameOrSrc] || nameOrSrc;
		if (!src) return;

		try {
			const audio = new Audio(src);
			audio.volume = isSfxMuted ? 0 : 0.8;
			audio.preload = 'auto';
			await audio.play();
		} catch (error) {
			console.error('Audio playback failed', error);
		}
	};

	// Play specific sounds based on game events
	useEffect(() => {
		if (isCollision) void playSound('collision');
	}, [isCollision, soundFiles, isSfxMuted]);

	useEffect(() => {
		if (isVictory) void playSound('victory');
	}, [isVictory, soundFiles, isSfxMuted]);

	useEffect(() => {
		if (isBlip) void playSound('blip');
	}, [isBlip, soundFiles, isSfxMuted]);

	useEffect(() => {
		if (isReset) void playSound('reset');
	}, [isReset, soundFiles, isSfxMuted]);

	useEffect(() => {
		if (isStartAppear) void playSound('reset');
	}, [isStartAppear, soundFiles, isSfxMuted]);

	if (!isUnlocked) {
		return (
			<div
				onClick={async () => {
					setIsUnlocked(true);
					await playSound('start');
					if (typeof onStartSoundEnd === 'function') onStartSoundEnd();
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

	return null;
};
		