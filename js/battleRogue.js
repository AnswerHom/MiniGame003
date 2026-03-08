// ===== 仙剑肉鸽 - 战斗肉鸽系统 (v2.6.0) =====

// 战斗肉鸽状态
const battleRogueState = {
    active: false,           // 是否激活
    drawCount: 0,            // 已抽卡次数
    currentCost: 100,        // 当前抽卡费用
    refreshCost: 50,         // 刷新费用
    availableCards: [],      // 当前可选卡牌
    selectedCard: null,      // 选中的卡牌
    cardOptions: 3          // 每次显示3张卡牌
};

// 战斗肉鸽配置
const BATTLE_ROGUE_CONFIG = {
    baseCost: 100,           // 基础抽卡费用
    costGrowth: 1.5,        // 费用增长倍数
    refreshCost: 50,        // 刷新费用（固定）
    cardOptions: 3           // 可选卡牌数量
};

// 初始化战斗肉鸽
function initBattleRogue() {
    battleRogueState.active = false;
    battleRogueState.drawCount = 0;
    battleRogueState.currentCost = BATTLE_ROGUE_CONFIG.baseCost;
    battleRogueState.availableCards = [];
    battleRogueState.selectedCard = null;
}

// 打开战斗肉鸽界面
function openBattleRogue() {
    battleRogueState.active = true;
    battleRogueState.selectedCard = null;
    generateCardOptions();
}

// 关闭战斗肉鸽界面
function closeBattleRogue() {
    battleRogueState.active = false;
}

// 生成卡牌选项（v2.8.0 按队伍英雄筛选卡牌池）
function generateCardOptions() {
    battleRogueState.availableCards = [];
    
    // v2.8.0 获取队伍中所有英雄的卡牌
    const teamMembers = TeamManager.getMembers();
    const teamCards = [];
    
    // 遍历所有卡牌，筛选队伍英雄相关的卡牌
    for (const cardName in CARD_DATA) {
        const cardData = CARD_DATA[cardName];
        // 检查卡牌是否属于队伍中的英雄
        if (teamMembers.includes(cardData.skill)) {
            teamCards.push(cardName);
        }
        // 也包含通用卡牌
        if (cardData.skill === '通用' || cardData.skill === '功能') {
            teamCards.push(cardName);
        }
    }
    
    // 如果队伍没有卡牌，使用全部卡牌
    const cardPool = teamCards.length > 0 ? teamCards : Object.keys(CARD_DATA);
    
    for (let i = 0; i < BATTLE_ROGUE_CONFIG.cardOptions; i++) {
        const randomCard = cardPool[Math.floor(Math.random() * cardPool.length)];
        battleRogueState.availableCards.push(randomCard);
    }
}

// 抽卡（v2.8.0 按队伍英雄筛选卡牌池）
function battleDrawCard() {
    if (game.gold < battleRogueState.currentCost) {
        console.log('金币不足');
        return;
    }
    
    game.gold -= battleRogueState.currentCost;
    battleRogueState.drawCount++;
    
    // 费用递增：第1次100，第2次150，第3次225...
    battleRogueState.currentCost = Math.floor(
        BATTLE_ROGUE_CONFIG.baseCost * Math.pow(BATTLE_ROGUE_CONFIG.costGrowth, battleRogueState.drawCount)
    );
    
    // v2.8.0 获取队伍中所有英雄的卡牌
    const teamMembers = TeamManager.getMembers();
    const teamCards = [];
    for (const cardName in CARD_DATA) {
        const cardData = CARD_DATA[cardName];
        if (teamMembers.includes(cardData.skill)) {
            teamCards.push(cardName);
        }
        if (cardData.skill === '通用' || cardData.skill === '功能') {
            teamCards.push(cardName);
        }
    }
    const cardPool = teamCards.length > 0 ? teamCards : Object.keys(CARD_DATA);
    
    // 随机获得1张卡牌
    const drawnCard = cardPool[Math.floor(Math.random() * cardPool.length)];
    
    // 添加到玩家卡牌库（这里简化处理，实际应该加到对应角色的卡牌库）
    if (!game.playerCards) game.playerCards = [];
    if (!game.playerCards.includes(drawnCard)) {
        game.playerCards.push(drawnCard);
    }
    
    // 显示抽卡结果
    battleRogueState.selectedCard = drawnCard;
    battleRogueState.showResult = true;
    setTimeout(() => {
        battleRogueState.showResult = false;
        battleRogueState.active = false;
    }, 2000);
}

// 刷新卡牌
function battleRefreshCards() {
    if (game.gold < battleRogueState.refreshCost) {
        console.log('金币不足');
        return;
    }
    
    game.gold -= battleRogueState.refreshCost;
    generateCardOptions();
}

// 处理战斗肉鸽点击
function handleBattleRogueClick(x, y) {
    if (!battleRogueState.active) return;
    
    const cardWidth = 80;
    const cardHeight = 100;
    const startX = game.width / 2 - (BATTLE_ROGUE_CONFIG.cardOptions * cardWidth) / 2;
    const cardY = game.height / 2 - cardHeight / 2;
    
    // 检查卡牌点击
    for (let i = 0; i < battleRogueState.availableCards.length; i++) {
        const cardX = startX + i * cardWidth;
        if (x >= cardX && x <= cardX + cardWidth && y >= cardY && y <= cardY + cardHeight) {
            // 选中卡牌
            const cardName = battleRogueState.availableCards[i];
            if (!game.playerCards) game.playerCards = [];
            if (!game.playerCards.includes(cardName)) {
                game.playerCards.push(cardName);
            }
            battleRogueState.selectedCard = cardName;
            battleRogueState.showResult = true;
            setTimeout(() => {
                battleRogueState.showResult = false;
                battleRogueState.active = false;
            }, 1500);
            return;
        }
    }
    
    // 检查抽卡按钮
    const drawBtnX = game.width / 2 - 120;
    const drawBtnY = game.height / 2 + 80;
    if (x >= drawBtnX && x <= drawBtnX + 100 && y >= drawBtnY && y <= drawBtnY + 40) {
        battleDrawCard();
        return;
    }
    
    // 检查刷新按钮
    const refreshBtnX = game.width / 2 + 20;
    if (x >= refreshBtnX && x <= refreshBtnX + 100 && y >= drawBtnY && y <= drawBtnY + 40) {
        battleRefreshCards();
        return;
    }
}

// 绘制战斗肉鸽界面
function drawBattleRogue() {
    if (!battleRogueState.active && !battleRogueState.showResult) return;
    
    const ctx = game.ctx;
    
    // 半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, game.width, game.height);
    
    if (battleRogueState.showResult && battleRogueState.selectedCard) {
        // 显示抽卡结果
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 32px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.fillText('获得卡牌: ' + battleRogueState.selectedCard, game.width / 2, game.height / 2);
        return;
    }
    
    // 标题
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Microsoft YaHei';
    ctx.textAlign = 'center';
    ctx.fillText('战斗肉鸽', game.width / 2, game.height / 2 - 100);
    
    // 当前金币
    ctx.font = '16px Microsoft YaHei';
    ctx.fillText('💰 ' + game.gold, game.width / 2, game.height / 2 - 70);
    
    // 抽卡次数
    ctx.fillText('已抽卡: ' + battleRogueState.drawCount + '次', game.width / 2, game.height / 2 - 45);
    
    // 绘制卡牌
    const cardWidth = 80;
    const cardHeight = 100;
    const startX = game.width / 2 - (BATTLE_ROGUE_CONFIG.cardOptions * cardWidth) / 2;
    const cardY = game.height / 2 - cardHeight / 2;
    
    for (let i = 0; i < battleRogueState.availableCards.length; i++) {
        const cardName = battleRogueState.availableCards[i];
        const cardX = startX + i * cardWidth;
        const cardData = CARD_DATA[cardName];
        
        // 卡牌背景
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
        
        // 卡牌边框（按稀有度）
        const rarityColor = CARD_RARITY_COLORS[cardData.rarity] || '#fff';
        ctx.strokeStyle = rarityColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
        
        // 卡牌名称
        ctx.fillStyle = '#fff';
        ctx.font = '12px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.fillText(cardName.substring(0, 4), cardX + cardWidth / 2, cardY + 30);
        
        // 稀有度
        ctx.fillStyle = rarityColor;
        ctx.font = '10px Microsoft YaHei';
        ctx.fillText(cardData.rarity, cardX + cardWidth / 2, cardY + 50);
        
        // 描述
        ctx.fillStyle = '#aaa';
        ctx.font = '8px Microsoft YaHei';
        ctx.fillText(cardData.desc || '', cardX + cardWidth / 2, cardY + 80);
    }
    
    // 抽卡按钮
    const drawBtnX = game.width / 2 - 120;
    const drawBtnY = game.height / 2 + 80;
    
    ctx.fillStyle = game.gold >= battleRogueState.currentCost ? '#4a5568' : '#666';
    ctx.fillRect(drawBtnX, drawBtnY, 100, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '16px Microsoft YaHei';
    ctx.fillText('抽卡 ' + battleRogueState.currentCost + '💰', drawBtnX + 50, drawBtnY + 27);
    
    // 刷新按钮
    const refreshBtnX = game.width / 2 + 20;
    ctx.fillStyle = game.gold >= battleRogueState.refreshCost ? '#4a5568' : '#666';
    ctx.fillRect(refreshBtnX, drawBtnY, 100, 40);
    ctx.fillStyle = '#fff';
    ctx.fillText('刷新 ' + battleRogueState.refreshCost + '💰', refreshBtnX + 50, drawBtnY + 27);
}
