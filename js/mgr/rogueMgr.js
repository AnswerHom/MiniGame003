// ===== 仙剑肉鸽 - 战斗肉鸽系统 (v2.6.0) =====

// 战斗肉鸽状态
const battleRogueState = {
    active: false,           // 是否激活
    drawCount: 0,            // 已抽卡次数
    currentCost: 100,        // 当前抽卡费用
    refreshCost: 50,         // 刷新费用
    availableCards: [],      // 当前可选卡牌
    selectedCard: null,      // 选中的卡牌
    cardOptions: 3,          // 每次显示3张卡牌
    // v2.16.0 点击收费（斐波那契数列）
    clickCost: 100,          // 点击进入费用
    lastClickCost: 0,       // 上一次费用（用于斐波那契）
    // v2.28.3 防重复点击
    clickLocked: false       // 点击锁定标志
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
    // v2.16.0 点击收费初始化（斐波那契：100, 150, 250, 400...）
    battleRogueState.clickCost = 100;
    battleRogueState.lastClickCost = 50;
    // v2.28.3 重置点击锁定
    battleRogueState.clickLocked = false;
}

// 打开战斗肉鸽界面
function openBattleRogue() {
    battleRogueState.active = true;
    battleRogueState.selectedCard = null;
    // v2.28.3 重置点击锁定
    battleRogueState.clickLocked = false;
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
        
        // v2.23.1 跳过已拥有的卡牌
        if (game.playerCards && game.playerCards.includes(cardName)) {
            continue;
        }
        
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
        
        // 检查卡牌是否属于队伍中某个角色的已解锁技能
        // v2.20.0 修复：遍历队伍角色，检查其已解锁技能列表
        for (const charName of actualTeamMembers) {
            const unlocked = game.unlockedSkills[charName] || [];
            if (unlocked.includes(cardData.skill)) {
                teamCards.push(cardName);
                break;
            }
        }
    }
    
    // 优先添加技能卡（如果没有未解锁的技能卡，则添加强化卡）
    const cardPool = [...unlockedSkillCards, ...teamCards];
    
    // 如果没有可用卡牌，使用全部卡牌（排除已拥有的）
    let finalPool = cardPool.length > 0 ? cardPool : Object.keys(CARD_DATA);
    // v2.23.1 过滤掉已拥有的卡牌
    if (game.playerCards) {
        finalPool = finalPool.filter(c => !game.playerCards.includes(c));
    }
    
    // v2.23.1 生成不重复的卡牌
    const usedCards = new Set();
    for (let i = 0; i < BATTLE_ROGUE_CONFIG.cardOptions; i++) {
        if (finalPool.length === 0) break;
        
        // 随机选择一张卡牌，确保不重复
        let randomIndex;
        let randomCard;
        let attempts = 0;
        do {
            randomIndex = Math.floor(Math.random() * finalPool.length);
            randomCard = finalPool[randomIndex];
            attempts++;
        } while (usedCards.has(randomCard) && attempts < 10);
        
        usedCards.add(randomCard);
        battleRogueState.availableCards.push(randomCard);
    }
}

// 处理战斗肉鸽点击
function handleBattleRogueClick(x, y) {
    if (!battleRogueState.active) return;
    
    // v2.28.3 防重复点击：如果是锁定状态，不处理点击
    // v2.30.0 优化：选中卡牌后立即锁定，直到界面关闭
    if (battleRogueState.clickLocked) return;
    battleRogueState.clickLocked = true;
    
    // v2.14.0 卡牌尺寸增大
    const cardWidth = 140;
    const cardHeight = 200;
    const cardGap = 30;
    const totalWidth = battleRogueState.availableCards.length * cardWidth + (battleRogueState.availableCards.length - 1) * cardGap;
    const startX = game.width / 2 - totalWidth / 2;
    const cardY = game.height / 2 - cardHeight / 2;
    
    // 检查卡牌点击 - v2.14.0 使用新的间距
    for (let i = 0; i < battleRogueState.availableCards.length; i++) {
        const cardX = startX + i * (cardWidth + cardGap);
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
                
                // v2.21.0 立即应用卡牌效果到当前战斗中的玩家
                if (game.players) {
                    game.players.forEach(player => {
                        applySingleCardEffect(player, cardName);
                    });
                }
                
                battleRogueState.selectedCard = cardName;
            }
            
            battleRogueState.showResult = true;
            setTimeout(() => {
                battleRogueState.showResult = false;
                battleRogueState.active = false;
                battleRogueState.clickLocked = false;  // v2.30.0 界面关闭后解锁
            }, 1500);
            return;
        }
    }
    
    // v2.30.0 点击空白处不解锁
    battleRogueState.clickLocked = false;
}
