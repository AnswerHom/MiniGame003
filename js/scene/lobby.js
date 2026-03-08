// ===== 大厅场景 =====

// 绘制菜单
function drawMenu() {
    const ctx = game.ctx;
    
    // 背景
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, game.width, game.height);
    
    // 标题
    ctx.fillStyle = COLORS.ui.gold;
    ctx.font = 'bold 48px Microsoft YaHei';
    ctx.textAlign = 'center';
    ctx.fillText('仙剑肉鸽', game.width / 2, game.height / 2 - 50);
    
    // 提示
    ctx.fillStyle = '#fff';
    ctx.font = '20px Microsoft YaHei';
    ctx.fillText('点击开始', game.width / 2, game.height / 2 + 20);
}

// 绘制大厅
function drawLobby() {
    const ctx = game.ctx;
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, game.width, game.height);
    
    // 标题
    ctx.fillStyle = COLORS.ui.gold;
    ctx.font = 'bold 48px Microsoft YaHei';
    ctx.textAlign = 'center';
    ctx.fillText('仙剑肉鸽', game.width / 2, 80);
    
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
    ctx.fillText('当前队伍 (' + game.players.length + '/5)', game.width / 2, 130);
    
    // 绘制已拥有角色
    const charList = CHARACTER_LIST;
    const teamStartX = game.width / 2 - 120;
    
    charList.forEach((char, i) => {
        const x = teamStartX + i * 120;
        const y = 200;
        const owned = game.gachaState.ownedCharacters.includes(char);
        const inTeam = game.players.some(p => p.name === char);
        
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
            const selected = inTeam;
            
            ctx.fillStyle = '#fff';
            ctx.font = '14px Microsoft YaHei';
            ctx.fillText(char, x, y + 65);
            
            // 选中标记
            if (selected) {
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
    
    // 抽卡区域标题
    ctx.fillStyle = '#fff';
    ctx.font = '20px Microsoft YaHei';
    ctx.fillText('抽卡区域', game.width / 2, 330);
    
    // 绘制抽卡按钮
    // 单抽按钮
    ctx.fillStyle = game.diamond >= 20 ? '#4a5568' : '#333';
    ctx.fillRect(game.width / 2 - 200, game.height - 160, 160, 50);
    ctx.fillStyle = '#fff';
    ctx.font = '18px Microsoft YaHei';
    ctx.fillText('单抽 20💎', game.width / 2 - 120, game.height - 125);
    
    // 十连抽按钮
    ctx.fillStyle = game.diamond >= 180 ? '#4a5568' : '#333';
    ctx.fillRect(game.width / 2 + 40, game.height - 160, 160, 50);
    ctx.fillStyle = '#fff';
    ctx.fillText('十连 180💎', game.width / 2 + 120, game.height - 125);
    
    // 金币兑换钻石按钮
    ctx.fillStyle = game.gold >= 100 ? '#4a5568' : '#333';
    ctx.fillRect(game.width / 2 - 80, game.height - 100, 160, 35);
    ctx.fillStyle = '#fff';
    ctx.font = '14px Microsoft YaHei';
    ctx.fillText('100💰 → 10💎', game.width / 2, game.height - 75);
    
    // 开始游戏按钮
    if (game.players.length > 0) {
        ctx.fillStyle = COLORS.ui.gold;
        ctx.fillRect(game.width / 2 - 80, game.height - 50, 160, 35);
        ctx.fillStyle = '#000';
        ctx.font = '16px Microsoft YaHei';
        ctx.fillText('开始游戏', game.width / 2, game.height - 27);
    }
    
    // 抽卡结果展示
    if (game.gachaState.drawnCards.length > 0) {
        drawGachaResults();
    }
}

// 绘制抽卡结果
function drawGachaResults() {
    const ctx = game.ctx;
    const cards = game.gachaState.drawnCards;
    
    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, game.width, game.height);
    
    // 标题
    ctx.fillStyle = COLORS.ui.gold;
    ctx.font = 'bold 36px Microsoft YaHei';
    ctx.textAlign = 'center';
    ctx.fillText('抽卡结果', game.width / 2, 100);
    
    // 绘制抽到的角色
    const startX = game.width / 2 - (cards.length * 80 + (cards.length - 1) * 20) / 2;
    
    cards.forEach((char, i) => {
        const x = startX + i * 100;
        const y = game.height / 2;
        
        // 角色框
        ctx.fillStyle = getCharacterColor(char);
        ctx.fillRect(x - 35, y - 50, 70, 90);
        
        // 角色名
        ctx.fillStyle = '#fff';
        ctx.font = '16px Microsoft YaHei';
        ctx.fillText(char, x, y + 60);
    });
    
    // 获得的卡牌
    if (game.gachaState.drawnCardsList && game.gachaState.drawnCardsList.length > 0) {
        ctx.fillStyle = '#fff';
        ctx.font = '18px Microsoft YaHei';
        ctx.fillText('获得卡牌:', game.width / 2, y + 120);
        
        const cardList = game.gachaState.drawnCardsList;
        const cardStartX = game.width / 2 - (cardList.length * 60 + (cardList.length - 1) * 10) / 2;
        
        cardList.forEach((card, i) => {
            const x = cardStartX + i * 70;
            const cardY = y + 140;
            
            ctx.fillStyle = getCardColor(card.rarity);
            ctx.fillRect(x - 25, cardY - 15, 50, 30);
            
            ctx.fillStyle = '#fff';
            ctx.font = '12px Microsoft YaHei';
            ctx.fillText(card.name.substring(0, 4), x, cardY + 5);
        });
    }
}

// 绘制大地图
function drawMap() {
    const ctx = game.ctx;
    const region = game.regions[game.currentRegion];
    
    // 背景
    ctx.fillStyle = region.background;
    ctx.fillRect(0, 0, game.width, game.height);
    
    // 装饰效果
    if (region.decoration === 'flowers') {
        for (let i = 0; i < 20; i++) {
            const x = (Date.now() / 50 + i * 50) % game.width;
            const y = (Date.now() / 30 + i * 40) % game.height;
            ctx.fillStyle = 'rgba(255, 182, 193, 0.5)';
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (region.decoration === 'fire') {
        for (let i = 0; i < 15; i++) {
            const x = Math.sin(Date.now() / 1000 + i) * 100 + game.width / 2;
            const y = Math.cos(Date.now() / 800 + i * 2) * 50 + game.height / 2 + 100;
            ctx.fillStyle = 'rgba(255, 200, 100, 0.8)';
            ctx.beginPath();
            ctx.arc(x, y, 2 + Math.sin(Date.now() / 200 + i) * 1, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (region.decoration === 'fireflies') {
        for (let i = 0; i < 25; i++) {
            const x = (Math.sin(Date.now() / 800 + i * 0.5) * 200 + game.width / 2);
            const y = (Math.cos(Date.now() / 600 + i * 0.7) * 150 + game.height / 2);
            ctx.fillStyle = `rgba(100, 255, 100, ${0.3 + Math.sin(Date.now() / 300 + i) * 0.3})`;
            ctx.beginPath();
            ctx.arc(x, y, 2 + Math.sin(Date.now() / 200 + i) * 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 标题
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px Microsoft YaHei';
    ctx.textAlign = 'center';
    ctx.fillText('选择区域', game.width / 2, 60);
    
    // 绘制区域卡片
    const regions = Object.keys(game.regions);
    const cardWidth = 200;
    const cardHeight = 250;
    const startX = game.width / 2 - (regions.length * cardWidth + (regions.length - 1) * 30) / 2;
    const cardY = game.height / 2 - cardHeight / 2;
    
    regions.forEach((regionName, i) => {
        const x = startX + i * (cardWidth + 30);
        const r = game.regions[regionName];
        
        // 卡片背景
        ctx.fillStyle = r.unlocked ? '#3d3d5c' : '#2d2d3c';
        ctx.fillRect(x, cardY, cardWidth, cardHeight);
        
        // 边框
        ctx.strokeStyle = r.unlocked ? '#ffd700' : '#555';
        ctx.lineWidth = game.currentRegion === regionName ? 4 : 2;
        ctx.strokeRect(x, cardY, cardWidth, cardHeight);
        
        // 区域名
        ctx.fillStyle = r.unlocked ? '#ffd700' : '#888';
        ctx.font = 'bold 24px Microsoft YaHei';
        ctx.fillText(r.name, x + cardWidth / 2, cardY + 40);
        
        // 波次范围
        ctx.fillStyle = '#aaa';
        ctx.font = '16px Microsoft YaHei';
        ctx.fillText(r.startWave + '-' + r.endWave + '波', x + cardWidth / 2, cardY + 80);
        
        // 状态
        if (r.completed) {
            ctx.fillStyle = '#44ff44';
            ctx.font = '18px Microsoft YaHei';
            ctx.fillText('✓ 已通关', x + cardWidth / 2, cardY + 120);
        } else if (!r.unlocked) {
            ctx.fillStyle = '#888';
            ctx.font = '18px Microsoft YaHei';
            ctx.fillText('🔒 未解锁', x + cardWidth / 2, cardY + 120);
        } else {
            ctx.fillStyle = '#4a90d9';
            ctx.font = '18px Microsoft YaHei';
            ctx.fillText('进行中', x + cardWidth / 2, cardY + 120);
        }
        
        // 难度星星
        let stars = '';
        if (r.endWave <= 10) stars = '⭐';
        else if (r.endWave <= 20) stars = '⭐⭐';
        else stars = '⭐⭐⭐';
        ctx.fillStyle = '#ffd700';
        ctx.font = '20px Microsoft YaHei';
        ctx.fillText(stars, x + cardWidth / 2, cardY + 160);
        
        // 进入按钮
        if (r.unlocked) {
            ctx.fillStyle = r.completed ? '#44aa44' : '#4a90d9';
            ctx.fillRect(x + 30, cardY + 180, cardWidth - 60, 40);
            ctx.fillStyle = '#fff';
            ctx.font = '18px Microsoft YaHei';
            ctx.fillText(r.completed ? '重复挑战' : '进入', x + cardWidth / 2, cardY + 207);
        }
        
        // 存储位置
        r.uiX = x;
        r.uiY = cardY;
        r.uiW = cardWidth;
        r.uiH = cardHeight;
    });
    
    // 小地图（右上角）
    drawMiniMap();
    
    // 肉鸽按钮
    drawBattleRogueButton();
}

// 大厅交互
function handleLobbyClick(x, y) {
    selectCharacter(x, y);
}

// 地图交互
function handleMapClick(x, y) {
    selectRegion(x, y);
}
