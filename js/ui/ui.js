// ===== 仙剑肉鸽 - UI系统 =====

// 绘制UI

// 绘制游戏中UI

// 绘制玩家列表

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
