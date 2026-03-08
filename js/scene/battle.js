// ===== 战斗场景 =====

// 绘制战斗区域
function drawBattleArea() {
    const ctx = game.ctx;
    
    // 绘制边界
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, game.worldWidth, game.worldHeight);
    
    // 绘制战斗区域背景
    ctx.fillStyle = COLORS.battle;
    ctx.fillRect(0, 0, game.worldWidth, game.worldHeight);
}

// 绘制战斗装饰
function drawBattleDecorations() {
    const ctx = game.ctx;
    const time = Date.now();
    
    // 飘落花瓣
    for (let i = 0; i < 15; i++) {
        const x = (time / 30 + i * 60) % game.width;
        const y = (time / 20 + i * 40) % game.height;
        ctx.fillStyle = 'rgba(255, 182, 193, 0.4)';
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}
