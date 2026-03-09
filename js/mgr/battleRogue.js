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

// 生成卡牌选项（v2.8.0 按队伍英雄筛选卡牌池，v2.12.0 按已解锁技能筛选）
function generateCardOptions() {
    battleRogueState.availableCards = [];
    
    // v2.12.0 使用 game.players 获取当前战斗中的角色
    const teamMembers = game.players.map(p => p.name);
    
    // 如果没有战斗中的玩家，使用 TeamManager
    const actualTeamMembers = teamMembers.length > 0 ? teamMembers : TeamManager.getMembers();
    
    const teamCards = [];
    const unlockedSkillCards = [];  // 技能卡（进阶技能）
    
    // 遍历所有卡牌，筛选队伍英雄相关的卡牌
    for (const cardName in CARD_DATA) {
        const cardData = CARD_DATA[cardName];
        
        // v2.12.0 技能抽取 - 技能卡处理
        if (cardData.effect === 'equipSkill') {
            // 检查角色是否在队伍中且技能未解锁
            if (actualTeamMembers.includes(cardData.char)) {
                const unlocked = game.unlockedSkills[cardData.char] || [];
                if (!unlocked.includes(cardData.skill)) {
                    // 技能未解锁，添加到技能卡池
                    unlockedSkillCards.push(cardName);
                }
            }
            continue;
        }
        
        // 检查卡牌是否属于队伍中的英雄
        if (actualTeamMembers.includes(cardData.skill)) {
            // v2.12.0 检查强化卡的技能是否已解锁
            const unlocked = game.unlockedSkills[cardData.skill] || [];
            if (unlocked.includes(cardData.skill)) {
                teamCards.push(cardName);
            }
        }
        // v2.12.0 修复：功能卡只对赵灵师可见，通用卡对所有角色可见
        if (cardData.skill === '通用') {
            teamCards.push(cardName);
        }
        if (cardData.skill === '功能' && actualTeamMembers.includes('赵灵垚')) {
            teamCards.push(cardName);
        }
    }
    
    // 优先添加技能卡（如果没有未解锁的技能卡，则添加强化卡）
    const cardPool = [...unlockedSkillCards, ...teamCards];
    
    // 如果没有可用卡牌，使用全部卡牌
    const finalPool = cardPool.length > 0 ? cardPool : Object.keys(CARD_DATA);
    
    for (let i = 0; i < BATTLE_ROGUE_CONFIG.cardOptions; i++) {
        const randomCard = finalPool[Math.floor(Math.random() * finalPool.length)];
        battleRogueState.availableCards.push(randomCard);
    }
}

// 抽卡（v2.8.0 按队伍英雄筛选卡牌池，v2.12.0 添加技能卡处理）
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
    
    // v2.12.0 获取队伍中所有英雄的卡牌（包括技能卡和强化卡）
    // 使用 game.players 获取当前战斗中的角色
    const teamMembers = game.players.map(p => p.name);
    const actualTeamMembers = teamMembers.length > 0 ? teamMembers : TeamManager.getMembers();
    
    const teamCards = [];
    const unlockedSkillCards = [];
    
    for (const cardName in CARD_DATA) {
        const cardData = CARD_DATA[cardName];
        
        // v2.12.0 技能卡处理
        if (cardData.effect === 'equipSkill') {
            if (actualTeamMembers.includes(cardData.char)) {
                const unlocked = game.unlockedSkills[cardData.char] || [];
                if (!unlocked.includes(cardData.skill)) {
                    unlockedSkillCards.push(cardName);
                }
            }
            continue;
        }
        
        // 强化卡处理
        if (actualTeamMembers.includes(cardData.skill)) {
            const unlocked = game.unlockedSkills[cardData.skill] || [];
            if (unlocked.includes(cardData.skill)) {
                teamCards.push(cardName);
            }
        }
        // v2.12.0 修复：功能卡只对赵灵师可见，通用卡对所有角色可见
        if (cardData.skill === '通用') {
            teamCards.push(cardName);
        }
        if (cardData.skill === '功能' && actualTeamMembers.includes('赵灵儿')) {
            teamCards.push(cardName);
        }
    }
    
    // 优先从技能卡池抽取
    const cardPool = unlockedSkillCards.length > 0 ? unlockedSkillCards : teamCards;
    const finalPool = cardPool.length > 0 ? cardPool : Object.keys(CARD_DATA);
    
    // 随机获得1张卡牌
    const drawnCard = finalPool[Math.floor(Math.random() * finalPool.length)];
    const cardData = CARD_DATA[drawnCard];
    
    // v2.12.0 技能抽取 - 检查是否抽到技能卡
    if (cardData.effect === 'equipSkill') {
        const charName = cardData.char;
        const skillName = cardData.skill;
        
        // 解锁技能
        if (!game.unlockedSkills[charName]) {
            game.unlockedSkills[charName] = [];
        }
        if (!game.unlockedSkills[charName].includes(skillName)) {
            game.unlockedSkills[charName].push(skillName);
        }
        
        // 将技能装备到队伍中对应角色的技能栏
        game.players.forEach(player => {
            if (player.name === charName && player.skills) {
                if (!player.skills.includes(skillName)) {
                    player.skills.push(skillName);
                }
            }
        });
        
        // 显示抽卡结果
        battleRogueState.selectedCard = '获得技能: ' + skillName;
    } else {
        // 添加到玩家卡牌库
        if (!game.playerCards) game.playerCards = [];
        if (!game.playerCards.includes(drawnCard)) {
            game.playerCards.push(drawnCard);
        }
        
        // 显示抽卡结果
        battleRogueState.selectedCard = drawnCard;
    }
    
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
            const cardData = CARD_DATA[cardName];
            
            // v2.12.0 技能抽取 - 检查是否抽到技能卡
            if (cardData.effect === 'equipSkill') {
                const charName = cardData.char;
                const skillName = cardData.skill;
                
                // 解锁技能
                if (!game.unlockedSkills[charName]) {
                    game.unlockedSkills[charName] = [];
                }
                if (!game.unlockedSkills[charName].includes(skillName)) {
                    game.unlockedSkills[charName].push(skillName);
                }
                
                // 将技能装备到队伍中对应角色的技能栏
                game.players.forEach(player => {
                    if (player.name === charName && player.skills) {
                        if (!player.skills.includes(skillName)) {
                            player.skills.push(skillName);
                        }
                    }
                });
                
                battleRogueState.selectedCard = '获得技能: ' + skillName;
            } else {
                // 普通卡牌
                if (!game.playerCards) game.playerCards = [];
                if (!game.playerCards.includes(cardName)) {
                    game.playerCards.push(cardName);
                }
                battleRogueState.selectedCard = cardName;
            }
            
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
