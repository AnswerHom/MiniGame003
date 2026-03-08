// ===== 战斗场景 =====

// 绘制战斗UI
function drawGameUI() {
    const ctx = game.ctx;
    
    // 波次（v2.3.3 BOSS战显示）
    ctx.fillStyle = game.wave === 12 ? '#ff4444' : '#fff';
    ctx.font = '16px Microsoft YaHei';
    ctx.textAlign = 'left';
    const waveText = game.wave === 12 ? 'BOSS战' : ('第 ' + game.wave + ' 波');
    ctx.fillText(waveText, 20, 30);
    
    // 敌人数量
    const enemyCount = game.enemies.filter(e => e.alive).length;
    ctx.fillStyle = '#fff';
    ctx.font = '14px Microsoft YaHei';
    ctx.fillText('敌人: ' + enemyCount, 20, 50);
    
    // 金币
    ctx.fillStyle = COLORS.ui.gold;
    ctx.font = '16px Microsoft YaHei';
    ctx.fillText('💰 ' + game.gold, 20, 75);
    
    // 波次状态提示
    if (game.waveState === 'countdown') {
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 24px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.fillText('下一波即将来袭！', game.width / 2, 60);
        ctx.font = '20px Microsoft YaHei';
        ctx.fillText('倒计时: ' + Math.ceil(game.waveCountdown) + '秒', game.width / 2, 90);
    }
    
    // 绘制虚拟摇杆
    drawJoystick();
    
    // 绘制技能栏
    drawSkillBar();
    
    // 绘制小地图
    drawMiniMap();
    
    // 肉鸽按钮
    drawBattleRogueButton();
}

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

// 绘制虚拟摇杆
function drawJoystick() {
    const ctx = game.ctx;
    
    // 摇杆区域（左下角）
    const baseX = 80;
    const baseY = game.height - 80;
    const baseRadius = 50;
    
    // 摇杆底座
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(baseX, baseY, baseRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // 摇杆圆点
    let knobX = baseX;
    let knobY = baseY;
    
    if (game.joystick.active) {
        const dx = game.joystick.x - baseX;
        const dy = game.joystick.y - baseY;
        const dist = Math.min(Math.sqrt(dx * dx + dy * dy), baseRadius - 20);
        const angle = Math.atan2(dy, dx);
        
        knobX = baseX + Math.cos(angle) * dist;
        knobY = baseY + Math.sin(angle) * dist;
    }
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(knobX, knobY, 20, 0, Math.PI * 2);
    ctx.fill();
}

// 绘制技能栏
function drawSkillBar() {
    const ctx = game.ctx;
    const player = game.players[0];
    if (!player) return;
    
    // 技能栏位置
    const barX = game.width / 2 - 150;
    const barY = game.height - 40;
    const slotSize = 50;
    const gap = 10;
    
    // 绘制3个技能槽
    player.skills.forEach((skillName, i) => {
        const x = barX + i * (slotSize + gap);
        const skill = SKILLS[skillName];
        const cooldown = player.skillCooldowns[skillName] || 0;
        
        // 槽位背景
        ctx.fillStyle = cooldown > 0 ? 'rgba(100, 100, 100, 0.5)' : 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x, barY - slotSize, slotSize, slotSize);
        
        // 冷却遮罩
        if (cooldown > 0) {
            const cooldownHeight = (cooldown / skill.cooldown) * slotSize;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(x, barY - slotSize, slotSize, cooldownHeight);
        }
        
        // 技能图标
        ctx.fillStyle = '#fff';
        ctx.font = '24px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.fillText((i + 1), x + slotSize / 2, barY - 15);
        
        // 技能名
        ctx.font = '10px Microsoft YaHei';
        ctx.fillText(skillName.substring(0, 3), x + slotSize / 2, barY - 5);
    });
}

// 绘制小地图
function drawMiniMap() {
    const ctx = game.ctx;
    
    // 小地图位置（右上角）
    const mapSize = 120;
    const mapX = game.width - mapSize - 10;
    const mapY = 10;
    
    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize);
    
    // 边界
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX, mapY, mapSize, mapSize);
    
    // 比例尺
    const scaleX = mapSize / game.worldWidth;
    const scaleY = mapSize / game.worldHeight;
    
    // 绘制玩家
    game.players.forEach(player => {
        if (player.alive) {
            ctx.fillStyle = '#44ff44';
            ctx.beginPath();
            ctx.arc(mapX + player.x * scaleX, mapY + player.y * scaleY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    // 绘制敌人
    game.enemies.forEach(enemy => {
        if (enemy.alive) {
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(mapX + enemy.x * scaleX, mapY + enemy.y * scaleY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    // 摄像机视野
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
        mapX + (game.camera.x - game.width / 2) * scaleX,
        mapY + (game.camera.y - game.height / 2) * scaleY,
        game.width * scaleX,
        game.height * scaleY
    );
}

// 绘制肉鸽按钮
function drawBattleRogueButton() {
    const ctx = game.ctx;
    
    // 按钮位置：右下角
    const btnX = game.width - 100;
    const btnY = game.height - 60;
    const btnW = 80;
    const btnH = 35;
    
    // 按钮背景
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(btnX, btnY, btnW, btnH);
    
    // 按钮文字
    ctx.fillStyle = '#fff';
    ctx.font = '14px Microsoft YaHei';
    ctx.textAlign = 'center';
    ctx.fillText('肉鸽', btnX + btnW / 2, btnY + 23);
    
    // 保存按钮区域供点击检测
    game.battleRogueBtn = { x: btnX, y: btnY, w: btnW, h: btnH };
    
    // 绘制战斗肉鸽界面
    drawBattleRogue();
}
