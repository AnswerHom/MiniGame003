// ===== 大厅UI =====

// 绘制大厅界面
function drawLobby() {
    const ctx = game.ctx;
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, game.width, game.height);
    
    // 标题
    ctx.fillStyle = COLORS.ui.gold;
    ctx.font = 'bold 48px Microsoft YaHei';
    ctx.textAlign = 'center';
    ctx.fillText('游戏大厅', game.width / 2, 80);
    
    // 顶部资源显示
    ctx.fillStyle = '#87ceeb';
    ctx.font = '20px Microsoft YaHei';
    ctx.textAlign = 'right';
    ctx.fillText('💎 ' + game.diamond, game.width - 20, 40);
    
    ctx.fillStyle = COLORS.ui.gold;
    ctx.fillText('💰 ' + game.gold, game.width - 150, 40);
    
    ctx.textAlign = 'center';
    
    // 队伍显示
    ctx.fillStyle = '#fff';
    ctx.font = '18px Microsoft YaHei';
    ctx.fillText('当前队伍 (' + game.team.length + '/5)', game.width / 2, 140);
    
    // 绘制已拥有角色（可点击选择）
    const charList = CHARACTER_LIST;
    const teamStartX = game.width / 2 - 120;
    
    charList.forEach((char, i) => {
        const x = teamStartX + i * 120;
        const y = 200;
        const owned = game.gachaState.ownedCharacters.includes(char);
        const inTeam = game.team.includes(char);
        
        // 角色框
        ctx.fillStyle = owned ? getCharacterColor(char) : '#333';
        ctx.fillRect(x - 40, y - 30, 80, 80);
        
        // 如果在队伍中，显示选中边框
        if (inTeam) {
            ctx.strokeStyle = COLORS.ui.gold;
            ctx.lineWidth = 3;
            ctx.strokeRect(x - 43, y - 33, 86, 86);
        }
        
        if (owned) {
            ctx.fillStyle = '#fff';
            ctx.font = '14px Microsoft YaHei';
            ctx.fillText(char, x, y + 65);
            
            // 选中标记
            if (inTeam) {
                ctx.fillStyle = '#44ff44';
                ctx.beginPath();
                ctx.arc(x + 35, y - 20, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = '12px Microsoft YaHei';
                ctx.fillText('✓', x + 35, y - 16);
            }
        } else {
            ctx.fillStyle = '#666';
            ctx.font = '12px Microsoft YaHei';
            ctx.fillText('未获得', x, y + 65);
        }
    });
    
    // 抽卡按钮
    ctx.fillStyle = game.diamond >= 180 ? '#4a5568' : '#333';
    ctx.fillRect(game.width / 2 - 80, game.height - 160, 160, 50);
    ctx.fillStyle = '#fff';
    ctx.font = '20px Microsoft YaHei';
    ctx.fillText('抽卡', game.width / 2, game.height - 125);
    
    // 开始战斗按钮
    if (game.team.length > 0) {
        ctx.fillStyle = COLORS.ui.gold;
        ctx.fillRect(game.width / 2 - 80, game.height - 80, 160, 50);
        ctx.fillStyle = '#000';
        ctx.font = '24px Microsoft YaHei';
        ctx.fillText('开始战斗', game.width / 2, game.height - 47);
    }
    
    // 大地图按钮
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(game.width - 120, game.height - 60, 100, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '18px Microsoft YaHei';
    ctx.fillText('大地图', game.width - 70, game.height - 33);
}

// 获取角色颜色
function getCharacterColor(char) {
    switch (char) {
        case '李逍遥': return '#4169E1';
        case '赵灵儿': return '#FF69B4';
        case '阿奴': return '#9370DB';
        default: return '#666';
    }
}
