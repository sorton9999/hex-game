import { useState, useEffect } from 'react';

// Helper to generate a unique key for a wall between two hexes
export const makeWallKey = (q1, r1, q2, r2) => [ `${q1},${r1}`, `${q2},${r2}` ].sort().join('|');

export const NEIGHBOR_TILES = [[1,0], [0,1], [-1,1], [-1,0], [0,-1], [1,-1]];
export const PERMANENT_ROGUES = new Set();
export const TEMP_PROTECTED = new Set();
export const rogueState = { value: 0 };

// Define specific edges as walls (Pairing two adjacent hex coordinates)
export const WALLS_EASY = new Set([
	makeWallKey(0, 0, 1, 0),
	makeWallKey(1, -1, 1, -2),
	makeWallKey(1, -2, 2, -2),
	makeWallKey(-1, 1, 0, 1),
	makeWallKey(-2, 2, -1, 2)
]);
export const WALLS_HARD = new Set([
	makeWallKey(0, 0, 0, -1),
	makeWallKey(0, 0, 1, 0),
	makeWallKey(0, 0, -1, 0),
	makeWallKey(1, -1, 1, -2),
	makeWallKey(1, -2, 2, -2),
	makeWallKey(-1, 1, 0, 1),
	makeWallKey(-2, 2, -1, 2)
]);
export const WALLS_ELITE = new Set([
	makeWallKey(0, 0, 0, -1),
	makeWallKey(0, 0, 1, 0),
	makeWallKey(0, 0, -1, 0),
	makeWallKey(0, -2, 1, -2),
	makeWallKey(1, -1, 1, -2),
	makeWallKey(1, -2, 2, -2),
	makeWallKey(-1, 1, 0, 1),
	makeWallKey(-1, 1, -2, 1),
	makeWallKey(-2, 2, -1, 2),
	makeWallKey(3, -3, 3, -2),
	makeWallKey(0, -3, 0, -2),
	makeWallKey(-3, 0, -2, 0)
]);

export default function HexTile({ HEX_SIZE, q, r, isSelected, diff, isGoal, onFlashChange = () => {}, onSelect = () => {}, isPreview = false, startPos, spawnActive = false, spawnProgress = 0 }) {

	const [flashColor, setFlashColor] = useState("rgba(255,255,255,0.03)");
	const [isRogue, setRogue] = useState(false);
	const x = HEX_SIZE * (3/2 * q) + window.innerWidth / 2;
	const y = HEX_SIZE * (Math.sqrt(3) * (r + q/2)) + window.innerHeight / 2;
	const isStart = startPos && q === startPos.q && r === startPos.r;
	const wallsInUse = diff.label === "ELITE" ? WALLS_ELITE : diff.label === "HARD" ? WALLS_HARD : WALLS_EASY;

	// Handle flashing behavior for hazard tiles
	useEffect(() => {
		if (isGoal || isPreview || TEMP_PROTECTED.has(`${q},${r}`)) return;
		const trigger = () => {
			setFlashColor(`hsla(${Math.random() * 360}, 90%, 50%, 0.8)`);
			if (!TEMP_PROTECTED.has(`${q},${r}`)) onFlashChange(q, r, true);
			// Use diff.duration for faster disappearance
			setTimeout(() => { 
			  setFlashColor("rgba(255,255,255,0.03)"); 
			  if (!TEMP_PROTECTED.has(`${q},${r}`)) onFlashChange(q, r, false); 
			}, diff.duration * 1000);
		};
		// Use diff.spawnRate for faster reappearance
		// Add a random-ness to the interval to make it less predictable
		const timer = setInterval(trigger, (4000 * diff.spawnRate) + Math.random() * 6000);
		return () => clearInterval(timer);
	}, [q, r, isGoal, isPreview, diff.spawnRate, diff.duration]);

	// Handle rogue tile behavior for ELITE difficulty, where certain tiles can become 
	// permanently hazardous
	useEffect(() => {
		if (isGoal || isSelected || isPreview || TEMP_PROTECTED.has(`${q},${r}`)) return;
		const rogue = () => Math.floor(Math.random() * 5) + 1 === 1 
			&& !PERMANENT_ROGUES.has(`${q},${r}`) && PERMANENT_ROGUES.size < 5
			&& !(startPos && startPos.q === q && startPos.r === r)
			&& rogueState.value % 10 === 0 && diff.label === "ELITE";
		if (rogue()) { setRogue(true); PERMANENT_ROGUES.add(`${q},${r}`); }
		setTimeout(() => { setRogue(false); rogueState.value += 1; }, 1000);
	}, [q, r, isGoal, isSelected, isPreview, diff.label]);

	// Calculate the vertices of the hexagon based on its center (x, y)
	const points = Array.from({length: 6}, (_, i) => {
		const a = (Math.PI / 180) * (60 * i);
		return { x: x + HEX_SIZE * Math.cos(a), y: y + HEX_SIZE * Math.sin(a) };
	});
	// Determine fill color based on tile state: selected, goal, flashing hazard, or spawn animation
	let fill = isSelected ? "yellow" : flashColor;
	if (isGoal && !isSelected) fill = "#004411";
	// If spawn animation is active for the start tile, override fill to show quick blue/yellow flashes
	if (spawnActive && isStart) {
		const t = Math.max(0, Math.min(1, spawnProgress));
		const flashes = 8; // number of quick color changes over the duration
		const phase = Math.floor(t * flashes);
		const isBlue = phase % 2 === 0;
		const blue = [0, 120, 255];
		const yellow = [255, 215, 0];
		const flashColorRgb = isBlue ? blue : yellow;
		// Blend the flash color toward yellow over time so final color is solid yellow at t=1
		const mix = t; // 0..1
		const target = yellow;
		const blended = [
			Math.round(flashColorRgb[0] + (target[0] - flashColorRgb[0]) * mix),
			Math.round(flashColorRgb[1] + (target[1] - flashColorRgb[1]) * mix),
			Math.round(flashColorRgb[2] + (target[2] - flashColorRgb[2]) * mix)
		];
		const opacity = Math.max(0.05, t);
		fill = `rgba(${blended[0]},${blended[1]},${blended[2]},${opacity})`;
	}
	// Draw Wall Lines: Only draw if the wall exists between this tile and a neighbor
	const wallElements = [];
	NEIGHBOR_TILES.forEach(([dq, dr], i) => {
		if (wallsInUse.has(makeWallKey(q, r, q + dq, r + dr))) {
			// Each hex side corresponds to corners (i, i+1)
			const p1 = points[i];
			const p2 = points[(i + 1) % 6];
			wallElements.push(
				<line key={`wall-${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} 
					  stroke="#ff0000" strokeWidth="6" strokeLinecap="round" />
			);
		}
	});
	// Convert points to a string format for the polygon SVG element
	const pointsStr = points.map(p => `${p.x},${p.y}`).join(" ");
	// Check if this tile is a permanent rogue tile, which should be rendered 
	// with a darker fill and a red glow
	const hasRogue = !isPreview && PERMANENT_ROGUES.has(`${q},${r}`);

	// Render the hexagon tile with appropriate fill and wall lines, and handle click events for selection
	// The render is a base polygon with a text label for start/goal, and an additional glowing polygon 
	// if it's the move tile or a goal
  return (
		<g>
			<polygon 
				points={pointsStr} 
				fill={fill} 
				stroke="#222" 
				onClick={() => !isPreview && onSelect(q, r)} 
			/>
			<text x={x} y={y} className="tile-label">
				{isStart ? "START" : isGoal ? "GOAL" : ""}
			</text>
			{(isGoal || isSelected || hasRogue) && <polygon 
				points={pointsStr} 
				fill="none" 
				stroke={isGoal ? "#00ff00" : hasRogue ? "red" : "lightblue"} 
				strokeWidth="4" 
				filter="url(#wall-glow-filter)" 
				className="glowing-wall-animation"/>
			}
			{wallElements}
		</g>
  );
}
