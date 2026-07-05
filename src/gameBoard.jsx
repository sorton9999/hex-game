
import HexTile from './hexTile';

export default function renderBoard({ HEX_SIZE, tiles, startPos, boardSelected, boardGoal, boardDiff, showHazards, onFlashChange, onSelect, style, boardKey, startSpawnActive, startSpawnProgress }) {
  return (
	<svg viewBox={`0 -30 ${window.innerWidth} ${window.innerHeight}`} style={style} key={boardKey}>
		<defs>
			<filter id="wall-glow-filter" x="-50%" y="-50%" width="200%" height="200%">
				<feGaussianBlur stdDeviation="3" result="blur" />
				<feComposite in="SourceGraphic" in2="blur" operator="over" />
			</filter>
		</defs>
		{tiles.map(t => (
			<HexTile 
                HEX_SIZE={HEX_SIZE}
				key={`${boardKey}-${t.q},${t.r}`} q={t.q} r={t.r} 
				isGoal={t.q === boardGoal.q && t.r === boardGoal.r}
				diff={boardDiff}
				isSelected={boardSelected.q === t.q && boardSelected.r === t.r}
				onFlashChange={showHazards ? onFlashChange : () => {}}
				onSelect={showHazards ? onSelect : () => {}}
				isPreview={!showHazards}
				startPos={startPos}
				spawnActive={startSpawnActive}
				spawnProgress={startSpawnProgress}
			/>
		))}
	</svg>
  );
}

