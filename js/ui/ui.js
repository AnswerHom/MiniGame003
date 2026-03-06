// ===== 仙剑肉鸽 - UI系统 =====

// 绘制UI
function drawGameUI() {
    const ctx = game.ctx;
    
    if (game.state === 'menu') {
        drawMenu();
    } else if (game.state === 'playing') {
        drawPlayingUI();
    } else if (game.state === 'gameover') {
        drawGameOver();
    }
}

// 绘制游戏中UI
function drawPlayingUI() {
    const ctx = game.ctx;
    
    // 顶部信息栏
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, game.width, 60);
    
    // 波次
    ctx.fillStyle = '#fff';
    ctx.font = '18px Microsoft YaHei';
    ctx.textAlign = 'left';
    ctx.fillText('波次 ' + game.wave, 20, 35);
    
    // 金币
    ctx.fillStyle = COLORS.ui.gold;
    ctx.fillText('💰 ' + game.gold, 120, 35);
    
    // 玩家列表（底部）
    drawPlayerList();
}

// 绘制玩家列表
function drawPlayerList() {
    const ctx = game.ctx;
    const padding = 20;
    const slotWidth = 80;
    const y = game.height - 100;
    
    game.players.forEach((player, i) => {
        const x = padding + i * (slotWidth + 10);
        
        // 玩家槽位
        ctx.fillStyle = player.alive ? 'rgba(159,122,234,0.3)' : 'rgba(0,0,0,0.5)';
        ctx.fillRect(x, y, slotWidth, 80);
        
        // 边框
        ctx.strokeStyle = player.alive ? COLORS.ui.primary : '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, slotWidth, 80);
        
        // 玩家名
        ctx.fillStyle = '#fff';
        ctx.font = '14px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.fillText(player.name, x + slotWidth / 2, y + 20);
        
        // 血条
        const hpPercent = player.hp / player.maxHp;
        ctx.fillStyle = '#333';
        ctx.fillRect(x + 5, y + 30, slotWidth - 10, 8);
        ctx.fillStyle = hpPercent > 0.3 ? COLORS.ui.hp : COLORS.ui.hpLow;
        ctx.fillRect(x + 5, y + 30, (slotWidth - 10) * hpPercent, 8);
        
        // 护盾
        if (player.shield > 0) {
            ctx.fillStyle = COLORS.ui.spirit;
            ctx.fillText('🛡️ ' + Math.floor(player.shield), x + slotWidth / 2, y + 55);
        }
    });
}

// 绘制游戏结束
function drawGameOver() {
    const ctx = game.ctx;
    
    // 遮罩
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, game.width, game.height);
    
    // 游戏结束文字
    ctx.fillStyle = '#e53e3e';
    ctx.font = 'bold 48px Microsoft YaHei';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', game.width / 2, game.height / 3);
    
    // 存活波次
    ctx.fillStyle = '#fff';
    ctx.font = '24px Microsoft YaHei';
    ctx.fillText('存活波次: ' + game.wave, game.width / 2, game.height / 2);
    
    // 获得金币
    ctx.fillStyle = COLORS.ui.gold;
    ctx.fillText('获得金币: ' + game.gold, game.width / 2, game.height / 2 + 40);
    
    // 重新开始提示
    ctx.fillStyle = '#fff';
    ctx.font = '18px Microsoft YaHei';
    ctx.fillText('点击屏幕重新开始', game.width / 2, game.height * 2 / 3);
}
