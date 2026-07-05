// Isolate your massive draggable 90-degree arc-wheel thumb pad
export default function TouchControls({ dpadPos, isDragging, activeDir, handleTouchStart, handleTouchEnd, handleDragStart, handleDragMove, handleDragEnd }) {
    if (window.innerWidth >= 1024) return null; // Hide on desktops
    
    return (
        <div style={{ position: 'absolute', bottom: `${dpadPos.bottom}px`, right: `${dpadPos.right}px`, width: '260px', height: '305px', display: 'flex', flexDirection: 'column', zIndex: 45, touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none' }} onContextMenu={(e) => e.preventDefault()}>
			{/* Drage Handle Area */}
			<div 
				onTouchStart={handleDragStart}
				onTouchMove={handleDragMove}
				onTouchEnd={handleDragEnd}
				style={{ 
					height: '40px', 
					marginBottom: '8px', 
					background: isDragging ? '#0f0' : '#111',
					color: isDragging ? '#000' : '#0f0',
					border: '2px solid #0f0',
					borderBottom: 'none', 
					borderRadius: '8px 8px 0 0', 
					display: 'flex', 
					alignItems: 'center', 
					justifyContent: 'center',
					fontSize: '11px',
					fontWeight: 'bold',
					letterSpacing: '1px',
					cursor: 'move'//,
					//userSelect: 'none'
				}}>
				::: DRAG TO REPOSITION :::
			</div>
			{/* The Arc Steering Wheel Wrapper */}
			<div style={{
				position: 'relative',
				width: '260px',
				height: '260px',
				background: 'rgba(0,0,0,0.95)',
				border: '3px solid #0f0',
				borderTop: 'none',
				borderRadius: '0 0 130px 130px', // Perfect semi-circle shell base
				boxShadow: '0 0 25px rgba(0, 255, 0, 0.25)',
				overflow: 'hidden'
			}}>
				{/* Core Center Anchor Circle - Keeps your thumb grounded */}
				<div style={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					width: '60px',
					height: '60px',
					background: '#111',
					border: '2px solid #0f0',
					borderRadius: '50%',
					zIndex: 48,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					pointerEvents: 'none'
				}}>
					<div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#0f0', boxShadow: '0 0 8px #0f0' }} />
				</div>

				{/* ================= UP ARC (45° to 135°) ================= */}
				<div 
					onTouchStart={() => handleTouchStart('ArrowUp')}
					onTouchEnd={() => {handleTouchEnd()}}
					style={{
						position: 'absolute',
						inset: '5px',
						borderRadius: '50%',
						// Dynamically changes background to solid neon green when active
						background: activeDir === 'ArrowUp' 
							? 'conic-gradient(from 46deg, #0f0 88deg, transparent 88deg)' 
							: 'conic-gradient(from 46deg, #000 88deg, transparent 88deg)',
						clipPath: 'polygon(50% 50%, 0 0, 100% 0)',
						cursor: 'pointer',
						display: 'flex',
						justifyContent: 'center',
						paddingTop: '25px',
						color: activeDir === 'ArrowUp' ? '#000' : '#0f0',
						fontSize: '28px',
						fontWeight: 'bold',
						zIndex: 46
					}}>
					▲
				</div>

				{/* ================= RIGHT ARC (135° to 225°) ================= */}
				<div 
					onTouchStart={() => handleTouchStart('ArrowRight')}
					onTouchEnd={() => {handleTouchEnd()}}
					style={{
						position: 'absolute',
						inset: '5px',
						borderRadius: '50%',
						// Dynamically changes background to solid neon green when active
						background: activeDir === 'ArrowRight' 
							? 'conic-gradient(from 136deg, #0f0 88deg, transparent 88deg)' 
							: 'conic-gradient(from 136deg, #000 88deg, transparent 88deg)',
						clipPath: 'polygon(50% 50%, 100% 0, 100% 100%)',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'flex-end',
						paddingRight: '25px',
						color: activeDir === 'ArrowRight' ? '#000' : '#0f0',
						fontSize: '28px',
						fontWeight: 'bold',
						zIndex: 46
					}}>
					▶
				</div>

				{/* ================= DOWN ARC (225° to 315°) ================= */}
				<div 
					onTouchStart={() => handleTouchStart('ArrowDown')}
					onTouchEnd={() => {handleTouchEnd()}}
					style={{
						position: 'absolute',
						inset: '5px',
						borderRadius: '50%',
						// Dynamically changes background to solid neon green when active
						background: activeDir === 'ArrowDown' 
							? 'conic-gradient(from 226deg, #0f0 88deg, transparent 88deg)' 
							: 'conic-gradient(from 226deg, #000 88deg, transparent 88deg)',
						clipPath: 'polygon(50% 50%, 100% 100%, 0 100%)',
						cursor: 'pointer',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'flex-end',
						paddingBottom: '25px',
						color: activeDir === 'ArrowDown' ? '#000' : '#0f0',
						fontSize: '28px',
						fontWeight: 'bold',
						zIndex: 46
					}}>
					▼
				</div>

				{/* ================= LEFT ARC (315° to 45°) ================= */}
				<div 
					onTouchStart={() => handleTouchStart('ArrowLeft')}
					onTouchEnd={() => {handleTouchEnd()}}
					style={{
						position: 'absolute',
						inset: '5px',
						borderRadius: '50%',
						// Dynamically changes background to solid neon green when active
						background: activeDir === 'ArrowLeft' 
							? 'conic-gradient(from 316deg, #0f0 88deg, transparent 88deg)' 
							: 'conic-gradient(from 316deg, #000 88deg, transparent 88deg)',
						clipPath: 'polygon(50% 50%, 0 100%, 0 0)',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						paddingLeft: '25px',
						color: activeDir === 'ArrowLeft' ? '#000' : '#0f0',
						fontSize: '28px',
						fontWeight: 'bold',
						zIndex: 46
					}}>
					◀
				</div>
			</div>
        </div>
    );
};
