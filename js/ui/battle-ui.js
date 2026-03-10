// ===== 战斗UI =====

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
    
    // v2.11.0 移除技能快捷栏（改为自动释放）
    // drawSkillBar();
    
    // 绘制小地图
    drawMiniMap();
    
    // 肉鸽按钮
    drawBattleRogueButton();
    
    // 绘制战斗肉鸽界面
    drawBattleRogue();
}

// 绘制虚拟摇杆（v2.10.0 任意位置显示，默认隐藏）
function drawJoystick() {
    const ctx = game.ctx;
    
    // 默认隐藏，拖动时显示
    if (!game.joystick.visible) return;
    
    // 摇杆位置为触摸位置
    const baseX = game.joystick.originX;
    const baseY = game.joystick.originY;
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
        const dx = game.joystick.currentX - baseX;
        const dy = game.joystick.currentY - baseY;
        const dist = Math.min(Math.sqrt(dx * dx + dy * dy), baseRadius - 20);
        const angle = Math.atan2(dy, dx);
        
        knobX = baseX + Math.cos(angle) * dist;
        knobY = baseY + Math.sin(angle) * dist;
        
        // 根据摇杆方向更新玩家目标位置
        const player = game.players[0];
        if (player && player.alive) {
            const moveX = game.joystick.currentX - game.joystick.originX;
            const moveY = game.joystick.currentY - game.joystick.originY;
            const moveDist = Math.sqrt(moveX * moveX + moveY * moveY);
            
            if (moveDist > 5) {
                player.targetX = player.x + moveX * 2;
                player.targetY = player.y + moveY * 2;
            }
        }
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
