// ===== 仙剑肉鸽 - 战斗肉鸽UI =====

// 绘制肉鸽按钮（战斗界面右下角）
function drawBattleRogueButton() {
    const ctx = game.ctx;
    
    // 按钮位置：右下角
    const btnX = game.width - 100;
    const btnY = game.height - 60;
    const btnW = 80;
    const btnH = 35;
    
    // 按钮背景 - 根据金币是否足够改变颜色
    const canAfford = game.gold >= battleRogueState.clickCost;
    ctx.fillStyle = canAfford ? '#4a5568' : '#666';
    ctx.fillRect(btnX, btnY, btnW, btnH);
    
    // 按钮文字
    ctx.fillStyle = '#fff';
    ctx.font = '12px Microsoft YaHei';
    ctx.textAlign = 'center';
    // v2.16.0 显示点击费用
    ctx.fillText('肉鸽', btnX + btnW / 2, btnY + 15);
    ctx.font = '10px Microsoft YaHei';
    ctx.fillStyle = canAfford ? '#ffd700' : '#ff6666';
    ctx.fillText(battleRogueState.clickCost + '💰', btnX + btnW / 2, btnY + 28);
    
    // 保存按钮区域供点击检测
    game.battleRogueBtn = { x: btnX, y: btnY, w: btnW, h: btnH };
    
    // 绘制战斗肉鸽界面
    drawBattleRogue();
}

// 绘制战斗肉鸽界面
function drawBattleRogue() {
    if (!battleRogueState.active && !battleRogueState.showResult) return;
    
    const ctx = game.ctx;
    
    // v2.14.0 背景氛围 - 渐变遮罩
    const gradient = ctx.createRadialGradient(game.width/2, game.height/2, 0, game.width/2, game.height/2, game.width/2);
    gradient.addColorStop(0, 'rgba(30, 30, 60, 0.85)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, game.width, game.height);
    
    // 背景光效
    ctx.save();
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 3; i++) {
        const glowX = game.width/2 + Math.sin(Date.now()/1000 + i) * 100;
        const glowY = game.height/2 + Math.cos(Date.now()/1000 + i) * 50;
        const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, 200);
        glow.addColorStop(0, '#ffd700');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, game.width, game.height);
    }
    ctx.restore();
    
    if (battleRogueState.showResult && battleRogueState.selectedCard) {
        // 显示抽卡结果 - 大气展示
        ctx.save();
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 48px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 30;
        ctx.fillText('✨ 获得 ✨', game.width / 2, game.height / 2 - 60);
        ctx.shadowBlur = 0;
        
        ctx.font = 'bold 36px Microsoft YaHei';
        ctx.fillText(battleRogueState.selectedCard, game.width / 2, game.height / 2 + 20);
        ctx.restore();
        return;
    }
    
    // 标题 - 带光效
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px Microsoft YaHei';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 20;
    ctx.fillText('⚡ 战斗肉鸽 ⚡', game.width / 2, game.height / 2 - 160);
    ctx.shadowBlur = 0;
    
    // 当前金币
    ctx.font = '20px Microsoft YaHei';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('💰 ' + game.gold, game.width / 2, game.height / 2 - 120);
    
    // 抽卡次数
    ctx.fillStyle = '#aaa';
    ctx.fillText('已抽卡: ' + battleRogueState.drawCount + '次', game.width / 2, game.height / 2 - 90);
    
    // v2.14.0 绘制卡牌 - 增大尺寸和间距
    const cardWidth = 140;
    const cardHeight = 200;
    const cardGap = 30;
    const totalWidth = battleRogueState.availableCards.length * cardWidth + (battleRogueState.availableCards.length - 1) * cardGap;
    const startX = game.width / 2 - totalWidth / 2;
    const cardY = game.height / 2 - cardHeight / 2;
    
    for (let i = 0; i < battleRogueState.availableCards.length; i++) {
        const cardName = battleRogueState.availableCards[i];
        const cardX = startX + i * (cardWidth + cardGap);
        const cardData = CARD_DATA[cardName];
        
        // v2.14.0 卡牌阴影
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 5;
        
        // 卡牌背景 - 渐变
        const cardGradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardHeight);
        cardGradient.addColorStop(0, '#3d4a5c');
        cardGradient.addColorStop(1, '#1a202c');
        ctx.fillStyle = cardGradient;
        ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
        
        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // 卡牌边框（按稀有度）- 发光效果
        const rarityColor = CARD_RARITY_COLORS[cardData.rarity] || '#fff';
        ctx.strokeStyle = rarityColor;
        ctx.lineWidth = 3;
        ctx.shadowColor = rarityColor;
        ctx.shadowBlur = 10;
        ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
        ctx.shadowBlur = 0;
        
        // v2.14.0 卡牌光效 - 稀有度背景
        ctx.fillStyle = rarityColor;
        ctx.globalAlpha = 0.1;
        ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
        ctx.globalAlpha = 1.0;
        
        // 卡牌名称 - 增大字体
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.fillText(cardName, cardX + cardWidth / 2, cardY + 40);
        
        // 技能类型
        ctx.fillStyle = '#aaa';
        ctx.font = '14px Microsoft YaHei';
        ctx.fillText(cardData.skill || '', cardX + cardWidth / 2, cardY + 65);
        
        // 稀有度 - 增大字体
        ctx.fillStyle = rarityColor;
        ctx.font = 'bold 16px Microsoft YaHei';
        ctx.fillText('★ ' + cardData.rarity + ' ★', cardX + cardWidth / 2, cardY + 95);
        
        // 描述 - 增大字体
        ctx.fillStyle = '#ccc';
        ctx.font = '12px Microsoft YaHei';
        // 描述换行
        const desc = cardData.desc || '';
        const descLines = desc.length > 12 ? [desc.substring(0, 12), desc.substring(12)] : [desc];
        descLines.forEach((line, idx) => {
            ctx.fillText(line, cardX + cardWidth / 2, cardY + 130 + idx * 16);
        });
        
        // 装备/获取标识
        if (cardData.effect === 'equipSkill') {
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 14px Microsoft YaHei';
            ctx.fillText('[技能]', cardX + cardWidth / 2, cardY + cardHeight - 20);
        }
    }
    
    // 抽卡按钮 - 增大
    const btnWidth = 160;
    const btnHeight = 50;
    const drawBtnX = game.width / 2 - btnWidth - 20;
    const drawBtnY = game.height / 2 + cardHeight / 2 + 40;
    
    // 按钮阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = game.gold >= battleRogueState.currentCost ? '#4a5568' : '#666';
    ctx.fillRect(drawBtnX, drawBtnY, btnWidth, btnHeight);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Microsoft YaHei';
    ctx.fillText('🎴 抽卡 ' + battleRogueState.currentCost + '💰', drawBtnX + btnWidth / 2, drawBtnY + 32);
    
    // 刷新按钮
    const refreshBtnX = game.width / 2 + 20;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = game.gold >= battleRogueState.refreshCost ? '#4a5568' : '#666';
    ctx.fillRect(refreshBtnX, drawBtnY, btnWidth, btnHeight);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#fff';
    ctx.fillText('🔄 刷新 ' + battleRogueState.refreshCost + '💰', refreshBtnX + btnWidth / 2, drawBtnY + 32);
}
