// ===== 仙剑肉鸽 - 游戏主逻辑 =====

// 游戏状态
const game = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    state: 'menu', // menu, gacha, playing, gameover
    wave: 1,
    gold: 0,
    diamond: 200, // 钻石
    time: 0,
    lastTime: 0,
    players: [],
    enemies: [],
    projectiles: [],
    effects: [],
    // 抽卡系统
    gachaState: {
        ownedCharacters: [], // 已拥有的角色
        lastDrawTime: 0,
        drawCount: 0,
        isDrawing: false,
        drawnCards: [],
        drawnCardsList: [], // 抽卡时获得的卡牌展示
        selectedCard: null,
        // 卡牌系统
        cardInventory: {}, // 卡牌库存 {卡牌名: 数量}
        equippedCards: {}  // 已装备卡牌 {角色名: [卡牌1, 卡牌2, 卡牌3]}
    },
    // 波次系统
    waveState: 'waiting', // waiting, spawning, countdown, playing, complete, event
    waveTimer: 0,
    waveCountdown: 3,
    waveEnemiesRemaining: 0,
    waveEnemiesSpawned: 0,
    waveSpawnTimer: 0,
    enemiesToSpawn: 0,
    // 随机事件系统
    eventState: {
        active: false,
        events: [],
        selectedEvent: null,
        timer: 5,
        isPaused: false,
        // 当前波次增益
        buffs: {
            attack: 0,
            moveSpeed: 0,
            damageReduction: 0,
            critRate: 0,
            regen: 0
        }
    },
    // 虚拟摇杆
    joystick: {
        active: false,
        originX: 0,
        originY: 0,
        currentX: 0,
        currentY: 0,
        touchId: null
    },
    // 商店系统
    shopState: {
        isOpen: false,
        activeTab: 'diamond',
        cardRefreshTime: 0,
        cardShop: [],
        purchasedCards: [],
        confirmPurchase: null
    },
    // 成就系统
    achievementState: {
        isOpen: false,
        activeTab: 'all',
        stats: {
            totalDiamondEarned: 0,
            totalKills: 0,
            totalCrits: 0,
            totalSkillsUsed: 0,
            maxWave: 0,
            survivedTime: 0,
            waveKills: 0
        }
    },
    // BOSS系统
    bossState: {
        active: false,
        currentBoss: null,
        boss: null,
        totalDamage: 0,
        phase: 1,
        isInvincible: false,
        isEnraged: false,
        lastSkillTime: 0,
        summonTimer: 0,
        firstKillReward: {} // 记录首杀奖励
    },
    // 装备系统
    equipmentState: {
        isOpen: false,
        inventory: [], // 拥有的装备
        equipped: {
            武器: null,
            防具: null,
            饰品: null
        },
        selectedEquipment: null,
        confirmAction: null
    },
    // 天赋系统
    talentState: {
        isOpen: false,
        unlocked: false, // 通关第5波后解锁
        talentPoints: 0,
        usedPoints: 0,
        talents: {
            attack: [],
            defense: [],
            support: []
        }
    }
};

// 初始化游戏
function initGame() {
    game.canvas = document.getElementById('gameCanvas');
    game.ctx = game.canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 初始界面
    drawMenu();
    
    // 点击开始游戏
    game.canvas.addEventListener('click', handleClick);
    
    // 键盘事件
    window.addEventListener('keydown', handleKeyDown);
    
    // 触摸事件 - 虚拟摇杆
    game.canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    game.canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    game.canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
}

// 调整画布大小
function resizeCanvas() {
    game.width = window.innerWidth;
    game.height = window.innerHeight;
    game.canvas.width = game.width;
    game.canvas.height = game.height;
}

// 处理点击
function handleClick(e) {
    const rect = game.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (game.state === 'menu') {
        // 成就UI点击处理
        if (game.achievementState.isOpen) {
            handleAchievementClick(x, y);
            return;
        }
        
        // 商店UI点击处理
        if (game.shopState.isOpen) {
            handleShopClick(x, y);
            return;
        }
        
        // 装备UI点击处理
        if (game.equipmentState.isOpen) {
            handleEquipmentClick(x, y);
            return;
        }
        
        // 天赋UI点击处理
        if (game.talentState.isOpen) {
            handleTalentClick(x, y);
            return;
        }
        
        // 选择角色开始游戏
        selectCharacter(x, y);
    } else if (game.state === 'playing') {
        // 检查是否在事件状态
        if (game.waveState === 'event' && game.eventState.active) {
            // 检查是否点击事件卡片
            handleEventClick(x, y);
        } else {
            // 移动玩家
            movePlayer(x, y);
        }
    }
}

// 处理事件卡片点击
function handleEventClick(x, y) {
    const events = game.eventState.events;
    
    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        if (event.x && event.y) {
            if (x >= event.x && x <= event.x + event.width &&
                y >= event.y && y <= event.y + event.height) {
                // 应用事件
                applyEvent(event.name);
                
                // 进入下一波
                game.wave++;
                game.waveState = 'countdown';
                game.waveCountdown = 3;
                game.waveTimer = 15;
                game.eventState.active = false;
                game.eventState.selectedEvent = event.name;
                break;
            }
        }
    }
}

// 处理键盘
function handleKeyDown(e) {
    if (game.state !== 'playing') return;
    
    const player = game.players[0];
    if (!player || !player.alive) return;
    
    // 技能快捷键 1, 2, 3
    if (e.key === '1' || e.key === '2' || e.key === '3') {
        const skillIndex = parseInt(e.key) - 1;
        if (player.skills[skillIndex]) {
            usePlayerSkill(player, player.skills[skillIndex]);
        }
    }
}

// 处理触摸开始 - 虚拟摇杆
function handleTouchStart(e) {
    if (game.state !== 'playing') return;
    
    e.preventDefault();
    
    const touch = e.changedTouches[0];
    const rect = game.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // 只在左侧区域激活摇杆
    if (x < game.width * 0.4) {
        game.joystick.active = true;
        game.joystick.originX = x;
        game.joystick.originY = y;
        game.joystick.currentX = x;
        game.joystick.currentY = y;
        game.joystick.touchId = touch.identifier;
    }
}

// 处理触摸移动 - 虚拟摇杆
function handleTouchMove(e) {
    if (!game.joystick.active) return;
    
    e.preventDefault();
    
    for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === game.joystick.touchId) {
            const rect = game.canvas.getBoundingClientRect();
            let x = touch.clientX - rect.left;
            let y = touch.clientY - rect.top;
            
            // 限制摇杆范围
            const maxDist = 50;
            const dx = x - game.joystick.originX;
            const dy = y - game.joystick.originY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > maxDist) {
                x = game.joystick.originX + (dx / dist) * maxDist;
                y = game.joystick.originY + (dy / dist) * maxDist;
            }
            
            game.joystick.currentX = x;
            game.joystick.currentY = y;
            
            // 移动玩家
            const player = game.players[0];
            if (player && player.alive) {
                player.targetX = player.x + (x - game.joystick.originX) * 3;
                player.targetY = player.y + (y - game.joystick.originY) * 3;
            }
            break;
        }
    }
}

// 处理触摸结束 - 虚拟摇杆
function handleTouchEnd(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === game.joystick.touchId) {
            game.joystick.active = false;
            game.joystick.touchId = null;
            break;
        }
    }
}

// 使用玩家技能
function usePlayerSkill(player, skillName) {
    const skill = SKILLS[skillName];
    if (!skill) return;
    
    // 检查冷却
    if (player.skillCooldowns && player.skillCooldowns[skillName] > 0) {
        return;
    }
    
    // 初始化冷却
    if (!player.skillCooldowns) {
        player.skillCooldowns = {};
    }
    player.skillCooldowns[skillName] = skill.cooldown;
    
    switch (skill.type) {
        case 'heal':
            // 治疗范围内队友
            SkillManager.useHealSkill(skill, player, game.players);
            break;
        case 'shield':
            // 为范围内队友套护盾
            SkillManager.useShieldSkill(skill, player, game.players);
            break;
        case 'revive':
            // 复活死亡队友
            SkillManager.useReviveSkill(skill, player, game.players);
            break;
        case 'fan':
            // 风雪冰天 - 扇形攻击
            const fanTarget = findNearestEnemy(player);
            SkillManager.useFanSkill(skill, player, fanTarget ? [fanTarget] : []);
            break;
        case 'ground':
            // 雷劫 - 区域雷电
            const groundTarget = findNearestEnemy(player);
            SkillManager.useGroundSkill(skill, player, groundTarget ? [groundTarget] : []);
            break;
        case 'knockback':
            // 阴阳逆转 - 击退
            SkillManager.useKnockbackSkill(skill, player, game.enemies);
            break;
        case 'aoe':
            // 万剑护体 - 环绕剑阵
            if (skillName === '万剑护体') {
                activateSwordOrbit(player, skill);
            } else {
                const target = findNearestEnemy(player);
                if (target) {
                    SkillManager.useAttackSkill(skill, player, [target]);
                }
            }
            break;
        case 'attack':
        default:
            const defaultTarget = findNearestEnemy(player);
            if (defaultTarget) {
                SkillManager.useAttackSkill(skill, player, [defaultTarget]);
            }
            break;
    }
}

// 激活万剑护体
function activateSwordOrbit(player, skill) {
    // 激活环绕效果
    player.swordOrbit = true;
    player.swordOrbitEndTime = game.time + skill.duration;
    
    // 添加特效
    game.effects.push({
        type: 'swordOrbit',
        x: player.x,
        y: player.y,
        life: skill.duration
    });
}

// 绘制主菜单/抽卡界面
function drawMenu() {
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
    const charList = ['李逍遥', '赵灵儿', '阿奴'];
    const teamStartX = game.width / 2 - 120;
    
    charList.forEach((char, i) => {
        const x = teamStartX + i * 120;
        const y = 170;
        const owned = game.gachaState.ownedCharacters.includes(char);
        
        // 角色框
        ctx.fillStyle = owned ? getCharacterColor(char) : '#333';
        ctx.fillRect(x - 40, y - 30, 80, 80);
        
        if (owned) {
            ctx.fillStyle = '#fff';
            ctx.font = '14px Microsoft YaHei';
            ctx.fillText(char, x, y + 65);
        } else {
            ctx.fillStyle = '#666';
            ctx.font = '12px Microsoft YaHei';
            ctx.fillText('未获得', x, y + 65);
        }
    });
    
    // 抽卡区域标题
    ctx.fillStyle = '#fff';
    ctx.font = '20px Microsoft YaHei';
    ctx.fillText('抽卡区域', game.width / 2, 300);
    
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
    
    // 商店按钮
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(game.width - 100, game.height - 50, 80, 35);
    ctx.fillStyle = '#fff';
    ctx.font = '14px Microsoft YaHei';
    ctx.fillText('商店', game.width - 60, game.height - 27);
    
    // 成就按钮
    const unclaimedCount = getUnclaimedAchievements();
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(game.width - 180, game.height - 50, 70, 35);
    ctx.fillStyle = '#fff';
    ctx.fillText('成就', game.width - 145, game.height - 27);
    // 角标
    if (unclaimedCount > 0) {
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(game.width - 115, game.height - 55, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '10px Microsoft YaHei';
        ctx.fillText(unclaimedCount > 9 ? '9+' : unclaimedCount, game.width - 115, game.height - 51);
    }
    
    // 装备按钮
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(game.width - 270, game.height - 50, 80, 35);
    ctx.fillStyle = '#fff';
    ctx.fillText('装备', game.width - 230, game.height - 27);
    
    // 天赋按钮
    const talentUnlocked = game.talentState.unlocked;
    ctx.fillStyle = talentUnlocked ? '#4a5568' : '#333';
    ctx.fillRect(game.width - 360, game.height - 50, 80, 35);
    ctx.fillStyle = talentUnlocked ? '#fff' : '#666';
    ctx.font = '14px Microsoft YaHei';
    ctx.fillText('天赋', game.width - 320, game.height - 27);
    
    // 抽卡结果展示
    if (game.gachaState.drawnCards.length > 0) {
        drawGachaResults();
    }
    
    // 绘制商店UI
    if (game.shopState.isOpen) {
        drawShopUI();
    }
    
    // 绘制成就UI
    if (game.achievementState.isOpen) {
        drawAchievementUI();
    }
    
    // 绘制装备UI
    if (game.equipmentState.isOpen) {
        drawEquipmentUI();
    }
    
    // 绘制天赋UI
    if (game.talentState.isOpen) {
        drawTalentUI();
    }
}

// 获取角色颜色
function getCharacterColor(char) {
    switch (char) {
        case '李逍遥': return '#4169E1'; // 蓝色
        case '赵灵儿': return '#FF69B4'; // 粉色
        case '阿奴': return '#9370DB'; // 紫色
        default: return '#666';
    }
}

// 绘制抽卡结果
function drawGachaResults() {
    const ctx = game.ctx;
    const cards = game.gachaState.drawnCards;
    const startX = game.width / 2 - 160;
    const y = 340;
    
    cards.forEach((card, i) => {
        const x = startX + i * 80;
        
        // 卡牌背景
        ctx.fillStyle = getCharacterColor(card);
        ctx.fillRect(x - 35, y - 45, 70, 90);
        
        // 头像
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // 角色名
        ctx.fillStyle = '#fff';
        ctx.font = '12px Microsoft YaHei';
        ctx.fillText(card, x, y + 55);
    });
    
    // 绘制获得的卡牌
    if (game.gachaState.drawnCardsList && game.gachaState.drawnCardsList.length > 0) {
        ctx.fillStyle = '#fff';
        ctx.font = '16px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.fillText('获得卡牌:', game.width / 2, y + 100);
        
        const cardList = game.gachaState.drawnCardsList;
        const cardStartX = game.width / 2 - (cardList.length * 50) / 2;
        
        cardList.forEach((cardName, i) => {
            const cx = cardStartX + i * 50;
            const cy = y + 130;
            const cardData = CARD_DATA[cardName];
            
            // 卡牌背景
            ctx.fillStyle = CARD_RARITY_COLORS[cardData.rarity];
            ctx.fillRect(cx - 20, cy - 25, 40, 50);
            
            // 卡牌名
            ctx.fillStyle = '#fff';
            ctx.font = '8px Microsoft YaHei';
            ctx.fillText(cardName.substring(0, 4), cx, cy + 5);
        });
    }
    
    // 显示新获得提示
    const newChars = cards.filter(c => !game.gachaState.ownedCharacters.includes(c));
    if (newChars.length > 0) {
        ctx.fillStyle = COLORS.ui.gold;
        ctx.font = '20px Microsoft YaHei';
        ctx.fillText('新角色: ' + newChars.join(', '), game.width / 2, y + 120);
    }
}

// 绘制商店UI
function drawShopUI() {
    const ctx = game.ctx;
    
    // 半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, game.width, game.height);
    
    // 商店标题
    ctx.fillStyle = COLORS.ui.gold;
    ctx.font = 'bold 32px Microsoft YaHei';
    ctx.textAlign = 'center';
    ctx.fillText('商店', game.width / 2, 60);
    
    // 关闭按钮
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(game.width - 60, 20, 40, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '24px Microsoft YaHei';
    ctx.fillText('×', game.width - 40, 50);
    
    // 标签切换
    const tabs = ['diamond', 'gold', 'card', 'item'];
    const tabNames = ['钻石商店', '金币商店', '卡牌商店', '道具商店'];
    const tabWidth = 80;
    const startX = game.width / 2 - (tabs.length * tabWidth) / 2;
    
    tabs.forEach((tab, i) => {
        const x = startX + i * tabWidth;
        ctx.fillStyle = game.shopState.activeTab === tab ? COLORS.ui.gold : '#4a5568';
        ctx.fillRect(x, 80, tabWidth - 5, 40);
        ctx.fillStyle = '#fff';
        ctx.font = '14px Microsoft YaHei';
        ctx.fillText(tabNames[i], x + tabWidth / 2 - 2, 107);
    });
    
    // 绘制商品
    let products = [];
    switch (game.shopState.activeTab) {
        case 'diamond':
            products = SHOP_DATA.diamondShop;
            break;
        case 'gold':
            products = SHOP_DATA.goldShop;
            break;
        case 'card':
            products = game.shopState.cardShop;
            break;
        case 'item':
            products = SHOP_DATA.itemShop;
            break;
    }
    
    // 绘制商品卡片
    const cardWidth = 150;
    const cardHeight = 120;
    const cols = 3;
    const startY = 150;
    
    products.forEach((product, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = game.width / 2 - (cols * cardWidth + (cols - 1) * 20) / 2 + col * (cardWidth + 20);
        const y = startY + row * (cardHeight + 20);
        
        // 卡片背景
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(x, y, cardWidth, cardHeight);
        
        // 商品图标
        ctx.fillStyle = '#fff';
        ctx.font = '32px Microsoft YaHei';
        ctx.fillText(product.icon || '📦', x + cardWidth / 2, y + 40);
        
        // 商品名称
        ctx.fillStyle = '#fff';
        ctx.font = '14px Microsoft YaHei';
        ctx.fillText(product.name, x + cardWidth / 2, y + 65);
        
        // 商品描述
        if (product.desc) {
            ctx.fillStyle = '#aaa';
            ctx.font = '10px Microsoft YaHei';
            ctx.fillText(product.desc, x + cardWidth / 2, y + 80);
        }
        
        // 价格/购买按钮
        let price = product.price;
        let priceText = '';
        
        if (game.shopState.activeTab === 'diamond') {
            priceText = price + '元';
        } else if (game.shopState.activeTab === 'card') {
            priceText = price + '钻';
        } else {
            priceText = price + (game.shopState.activeTab === 'gold' ? '金币' : '钻');
        }
        
        // 检查是否可以购买
        let canBuy = false;
        if (game.shopState.activeTab === 'diamond') {
            canBuy = true; // 钻石商店直接购买
        } else if (game.shopState.activeTab === 'gold') {
            canBuy = game.gold >= price;
        } else if (game.shopState.activeTab === 'card') {
            canBuy = game.diamond >= price && !game.shopState.purchasedCards.includes(product.id);
        } else {
            canBuy = game.diamond >= price;
        }
        
        ctx.fillStyle = canBuy ? '#44ff44' : '#555';
        ctx.fillRect(x + 10, y + cardHeight - 35, cardWidth - 20, 30);
        ctx.fillStyle = '#fff';
        ctx.font = '14px Microsoft YaHei';
        ctx.fillText(priceText, x + cardWidth / 2, y + cardHeight - 14);
        
        // 存储商品位置
        product.x = x;
        product.y = y;
        product.width = cardWidth;
        product.height = cardHeight;
    });
    
    // 卡牌商店刷新按钮
    if (game.shopState.activeTab === 'card') {
        const refreshCost = 10;
        const canRefresh = game.diamond >= refreshCost;
        
        ctx.fillStyle = canRefresh ? '#4a90d9' : '#555';
        ctx.fillRect(game.width / 2 - 60, game.height - 80, 120, 40);
        ctx.fillStyle = '#fff';
        ctx.font = '14px Microsoft YaHei';
        ctx.fillText('刷新 ' + refreshCost + '💎', game.width / 2, game.height - 53);
    }
    
    // 购买确认弹窗
    if (game.shopState.confirmPurchase) {
        const item = game.shopState.confirmPurchase;
        
        // 弹窗背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(game.width / 2 - 150, game.height / 2 - 100, 300, 200);
        
        // 标题
        ctx.fillStyle = COLORS.ui.gold;
        ctx.font = '20px Microsoft YaHei';
        ctx.fillText('确认购买', game.width / 2, game.height / 2 - 60);
        
        // 商品信息
        ctx.fillStyle = '#fff';
        ctx.font = '16px Microsoft YaHei';
        ctx.fillText(item.name, game.width / 2, game.height / 2 - 20);
        
        // 价格
        ctx.font = '14px Microsoft YaHei';
        const priceText = game.shopState.activeTab === 'diamond' ? item.price + '元' : item.price + '钻';
        ctx.fillText('价格: ' + priceText, game.width / 2, game.height / 2 + 10);
        
        // 确认按钮
        ctx.fillStyle = '#44ff44';
        ctx.fillRect(game.width / 2 - 100, game.height / 2 + 30, 80, 35);
        ctx.fillStyle = '#fff';
        ctx.font = '14px Microsoft YaHei';
        ctx.fillText('确认', game.width / 2 - 60, game.height / 2 + 54);
        
        // 取消按钮
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(game.width / 2 + 20, game.height / 2 + 30, 80, 35);
        ctx.fillText('取消', game.width / 2 + 60, game.height / 2 + 54);
    }
}

// 选择角色/抽卡
function selectCharacter(x, y) {
    const ctx = game.ctx;
    
    // 检查单抽按钮
    if (x >= game.width / 2 - 200 && x <= game.width / 2 - 40 &&
        y >= game.height - 160 && y <= game.height - 110) {
        if (game.diamond >= 20) {
            drawGacha(1);
        }
        return;
    }
    
    // 检查十连抽按钮
    if (x >= game.width / 2 + 40 && x <= game.width / 2 + 200 &&
        y >= game.height - 160 && y <= game.height - 110) {
        if (game.diamond >= 180) {
            drawGacha(10);
        }
        return;
    }
    
    // 检查金币兑换按钮
    if (x >= game.width / 2 - 80 && x <= game.width / 2 + 80 &&
        y >= game.height - 100 && y <= game.height - 65) {
        if (game.gold >= 100) {
            game.gold -= 100;
            game.diamond += 10;
        }
        return;
    }
    
    // 检查开始游戏按钮
    if (game.players.length > 0 &&
        x >= game.width / 2 - 80 && x <= game.width / 2 + 80 &&
        y >= game.height - 50 && y <= game.height - 15) {
        game.state = 'playing';
        game.wave = 1;
        game.time = 0;
        
        // 初始化波次系统
        game.waveState = 'countdown';
        game.waveTimer = 15;
        game.waveCountdown = 3;
        game.waveEnemiesRemaining = 0;
        game.waveEnemiesSpawned = 0;
        game.waveSpawnTimer = 0;
        game.enemiesToSpawn = 0;
        
        // 开始游戏循环
        game.lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }
    
    // 检查商店按钮
    if (x >= game.width - 100 && x <= game.width - 20 &&
        y >= game.height - 50 && y <= game.height - 15) {
        openShop();
    }
    
    // 检查成就按钮
    if (x >= game.width - 180 && x <= game.width - 110 &&
        y >= game.height - 50 && y <= game.height - 15) {
        openAchievements();
    }
    
    // 检查装备按钮
    if (x >= game.width - 270 && x <= game.width - 190 &&
        y >= game.height - 50 && y <= game.height - 15) {
        openEquipment();
    }
    
    // 检查天赋按钮
    if (x >= game.width - 360 && x <= game.width - 280 &&
        y >= game.height - 50 && y <= game.height - 15) {
        if (game.talentState.unlocked) {
            openTalents();
        }
    }
}

// 打开天赋界面
function openTalents() {
    game.talentState.isOpen = true;
}

// 绘制天赋UI
function drawTalentUI() {
    const ctx = game.ctx;
    
    // 半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, game.width, game.height);
    
    // 天赋标题
    ctx.fillStyle = COLORS.ui.gold;
    ctx.font = 'bold 32px Microsoft YaHei';
    ctx.textAlign = 'center';
    ctx.fillText('天赋', game.width / 2, 50);
    
    // 关闭按钮
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(game.width - 60, 15, 40, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '24px Microsoft YaHei';
    ctx.fillText('×', game.width - 40, 45);
    
    // 天赋点数显示
    const availablePoints = game.talentState.talentPoints - game.talentState.usedPoints;
    ctx.fillStyle = '#fff';
    ctx.font = '20px Microsoft YaHei';
    ctx.fillText('可用点数: ' + availablePoints, game.width / 2, 90);
    ctx.fillText('已用点数: ' + game.talentState.usedPoints + '/30', game.width / 2, 120);
    
    // 三列天赋树
    const trees = ['attack', 'defense', 'support'];
    const treeNames = ['攻击系', '防御系', '辅助系'];
    const treeColors = ['#ff4444', '#44aa44', '#4a90d9'];
    const colWidth = game.width / 3;
    
    trees.forEach((tree, colIndex) => {
        const x = colIndex * colWidth + colWidth / 2;
        
        // 天赋树标题
        ctx.fillStyle = treeColors[colIndex];
        ctx.font = 'bold 20px Microsoft YaHei';
        ctx.fillText(treeNames[colIndex], x, 160);
        
        // 绘制天赋节点
        const talents = Object.keys(TALENTS[tree]);
        const startY = 190;
        
        talents.forEach((talentName, i) => {
            const talent = TALENTS[tree][talentName];
            const y = startY + i * 70;
            const learned = game.talentState.talents[tree].includes(talentName);
            const canLearn = canLearnTalent(tree, talentName);
            
            // 绘制连线
            if (talent.requires) {
                const requiresIdx = talents.indexOf(talent.requires);
                const requiresY = startY + requiresIdx * 70;
                const requiresLearned = game.talentState.talents[tree].includes(talent.requires);
                
                ctx.strokeStyle = requiresLearned ? treeColors[colIndex] : '#333';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x, requiresY + 15);
                ctx.lineTo(x, y - 15);
                ctx.stroke();
            }
            
            // 节点背景
            ctx.fillStyle = learned ? treeColors[colIndex] : (canLearn ? '#666' : '#333');
            ctx.beginPath();
            ctx.arc(x, y, 20, 0, Math.PI * 2);
            ctx.fill();
            
            // 节点图标
            ctx.fillStyle = '#fff';
            ctx.font = '16px Microsoft YaHei';
            ctx.fillText(talent.icon, x, y + 5);
            
            // 节点名称
            ctx.fillStyle = learned ? '#fff' : '#888';
            ctx.font = '12px Microsoft YaHei';
            ctx.fillText(talentName, x, y + 35);
            
            // 节点效果
            ctx.fillStyle = '#aaa';
            ctx.font = '10px Microsoft YaHei';
            ctx.fillText(talent.desc, x, y + 48);
            
            // 存储节点位置
            talent.uiX = x;
            talent.uiY = y;
            talent.uiR = 20;
            talent.uiTree = tree;
        });
    });
    
    // 重置按钮
    const resetCost = 50;
    ctx.fillStyle = game.diamond >= resetCost ? '#ff6b6b' : '#555';
    ctx.fillRect(game.width / 2 - 60, game.height - 80, 120, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '16px Microsoft YaHei';
    ctx.fillText('重置 ' + resetCost + '💎', game.width / 2, game.height - 52);
}

// 检查是否可以学习天赋
function canLearnTalent(tree, talentName) {
    const talent = TALENTS[tree][talentName];
    const availablePoints = game.talentState.talentPoints - game.talentState.usedPoints;
    
    // 检查点数是否足够
    if (availablePoints < talent.cost) return false;
    
    // 检查是否已学习
    if (game.talentState.talents[tree].includes(talentName)) return false;
    
    // 检查前置天赋
    if (talent.requires) {
        if (!game.talentState.talents[tree].includes(talent.requires)) return false;
    }
    
    return true;
}

// 学习天赋
function learnTalent(tree, talentName) {
    const talent = TALENTS[tree][talentName];
    
    if (!canLearnTalent(tree, talentName)) return false;
    
    game.talentState.talents[tree].push(talentName);
    game.talentState.usedPoints += talent.cost;
    return true;
}

// 重置天赋
function resetTalents() {
    const resetCost = 50;
    if (game.diamond < resetCost) return false;
    
    game.diamond -= resetCost;
    game.talentState.usedPoints = 0;
    game.talentState.talents = {
        attack: [],
        defense: [],
        support: []
    };
    return true;
}

// 获取天赋加成
function getTalentBonus(effect) {
    let bonus = 0;
    
    // 攻击系
    game.talentState.talents.attack.forEach(talentName => {
        const talent = TALENTS.attack[talentName];
        if (talent.effect === effect) bonus += talent.value;
    });
    
    // 防御系
    game.talentState.talents.defense.forEach(talentName => {
        const talent = TALENTS.defense[talentName];
        if (talent.effect === effect) bonus += talent.value;
    });
    
    // 辅助系
    game.talentState.talents.support.forEach(talentName => {
        const talent = TALENTS.support[talentName];
        if (talent.effect === effect) bonus += talent.value;
    });
    
    return bonus;
}

// 处理天赋点击
function handleTalentClick(x, y) {
    // 关闭按钮
    if (x >= game.width - 60 && x <= game.width - 20 && y >= 15 && y <= 55) {
        game.talentState.isOpen = false;
        return;
    }
    
    // 重置按钮
    if (x >= game.width / 2 - 60 && x <= game.width / 2 + 60 &&
        y >= game.height - 80 && y <= game.height - 40) {
        resetTalents();
        return;
    }
    
    // 检查天赋节点点击
    const trees = ['attack', 'defense', 'support'];
    trees.forEach(tree => {
        Object.keys(TALENTS[tree]).forEach(talentName => {
            const talent = TALENTS[tree][talentName];
            if (talent.uiX && talent.uiY) {
                const dx = x - talent.uiX;
                const dy = y - talent.uiY;
                if (Math.sqrt(dx*dx + dy*dy) <= talent.uiR) {
                    learnTalent(tree, talentName);
                }
            }
        });
    });
}

// 打开装备界面
function openEquipment() {
    game.equipmentState.isOpen = true;
    game.equipmentState.selectedEquipment = null;
    game.equipmentState.confirmAction = null;
}

// 绘制装备UI
function drawEquipmentUI() {
    const ctx = game.ctx;
    
    // 半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, game.width, game.height);
    
    // 装备标题
    ctx.fillStyle = COLORS.ui.gold;
    ctx.font = 'bold 32px Microsoft YaHei';
    ctx.textAlign = 'center';
    ctx.fillText('装备', game.width / 2, 50);
    
    // 关闭按钮
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(game.width - 60, 15, 40, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '24px Microsoft YaHei';
    ctx.fillText('×', game.width - 40, 45);
    
    // 当前穿戴装备显示
    ctx.fillStyle = '#fff';
    ctx.font = '18px Microsoft YaHei';
    ctx.fillText('已穿戴', 100, 80);
    
    const slots = ['武器', '防具', '饰品'];
    const slotX = [80, 200, 320];
    slots.forEach((slot, i) => {
        const eq = game.equipmentState.equipped[slot];
        const x = slotX[i];
        
        ctx.fillStyle = eq ? EQUIPMENT_QUALITY_COLORS[eq.quality] : '#333';
        ctx.fillRect(x, 90, 80, 100);
        
        if (eq) {
            ctx.fillStyle = '#fff';
            ctx.font = '24px Microsoft YaHei';
            ctx.fillText(eq.icon, x + 40, 145);
            ctx.font = '12px Microsoft YaHei';
            ctx.fillText(eq.name, x + 40, 175);
        } else {
            ctx.fillStyle = '#666';
            ctx.font = '12px Microsoft YaHei';
            ctx.fillText('空', x + 40, 145);
        }
    });
    
    // 背包装备列表
    ctx.fillStyle = '#fff';
    ctx.font = '18px Microsoft YaHei';
    ctx.fillText('背包 (' + game.equipmentState.inventory.length + ')', 100, 230);
    
    // 绘制背包装备
    const itemWidth = 70;
    const itemHeight = 90;
    const cols = 6;
    const startX = 50;
    const startY = 250;
    
    game.equipmentState.inventory.forEach((eq, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * (itemWidth + 10);
        const y = startY + row * (itemHeight + 10);
        
        // 选中状态
        if (game.equipmentState.selectedEquipment === eq) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.strokeRect(x - 3, y - 3, itemWidth + 6, itemHeight + 6);
        }
        
        ctx.fillStyle = EQUIPMENT_QUALITY_COLORS[eq.quality];
        ctx.fillRect(x, y, itemWidth, itemHeight);
        
        ctx.fillStyle = '#fff';
        ctx.font = '20px Microsoft YaHei';
        ctx.fillText(eq.icon, x + itemWidth / 2, y + 40);
        
        ctx.font = '10px Microsoft YaHei';
        ctx.fillText(eq.name, x + itemWidth / 2, y + 65);
        
        // 强化等级
        if (eq.enhanceLevel > 0) {
            ctx.fillStyle = '#ffd700';
            ctx.fillText('+' + eq.enhanceLevel, x + itemWidth / 2, y + 82);
        }
        
        // 存储位置
        eq.uiX = x;
        eq.uiY = y;
        eq.uiW = itemWidth;
        eq.uiH = itemHeight;
    });
    
    // 选中装备详情
    if (game.equipmentState.selectedEquipment) {
        const eq = game.equipmentState.selectedEquipment;
        const stats = getEquipmentStats(eq);
        
        const detailX = game.width - 300;
        const detailY = 220;
        
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(detailX, detailY, 280, 300);
        
        ctx.fillStyle = EQUIPMENT_QUALITY_COLORS[eq.quality];
        ctx.font = '20px Microsoft YaHei';
        ctx.textAlign = 'left';
        ctx.fillText(eq.icon + ' ' + eq.name, detailX + 20, detailY + 30);
        
        ctx.fillStyle = '#fff';
        ctx.font = '14px Microsoft YaHei';
        ctx.fillText('品质: ' + eq.quality, detailX + 20, detailY + 60);
        ctx.fillText('强化: +' + eq.enhanceLevel, detailX + 150, detailY + 60);
        ctx.fillText('精炼: +' + eq.refineLevel, detailX + 20, detailY + 85);
        
        ctx.fillText('攻击力: ' + Math.floor(stats.attack), detailX + 20, detailY + 120);
        ctx.fillText('生命值: ' + Math.floor(stats.hp), detailX + 20, detailY + 150);
        ctx.fillText('暴击率: ' + (stats.critRate * 100).toFixed(1) + '%', detailX + 20, detailY + 180);
        
        // 强化按钮
        const enhanceCost = eq.enhanceLevel < 10 ? ENHANCE_CONFIG.costs[eq.enhanceLevel] : 0;
        const canEnhance = game.gold >= enhanceCost && eq.enhanceLevel < 10;
        
        ctx.fillStyle = canEnhance ? '#44aa44' : '#555';
        ctx.fillRect(detailX + 20, detailY + 210, 110, 35);
        ctx.fillStyle = '#fff';
        ctx.font = '14px Microsoft YaHei';
        ctx.fillText('强化 ' + enhanceCost + '💰', detailX + 75, detailY + 233);
        
        // 精炼按钮
        const canRefine = game.gold >= REFINERY_CONFIG.cost && eq.refineLevel < 5;
        
        ctx.fillStyle = canRefine ? '#4169E1' : '#555';
        ctx.fillRect(detailX + 150, detailY + 210, 110, 35);
        ctx.fillStyle = '#fff';
        ctx.fillText('精炼 ' + REFINERY_CONFIG.cost + '💰', detailX + 205, detailY + 233);
        
        // 穿戴/卸下按钮
        const slot = eq.type;
        const isEquipped = game.equipmentState.equipped[slot] === eq;
        
        ctx.fillStyle = isEquipped ? '#ff6b6b' : '#4a90d9';
        ctx.fillRect(detailX + 20, detailY + 260, 240, 35);
        ctx.fillStyle = '#fff';
        ctx.fillText(isEquipped ? '卸下' : '穿戴', detailX + 140, detailY + 283);
        
        ctx.textAlign = 'center';
    }
}

// 处理装备点击
function handleEquipmentClick(x, y) {
    // 关闭按钮
    if (x >= game.width - 60 && x <= game.width - 20 && y >= 15 && y <= 55) {
        game.equipmentState.isOpen = false;
        return;
    }
    
    // 检查背包装备点击
    game.equipmentState.inventory.forEach(eq => {
        if (eq.uiX && eq.uiY) {
            if (x >= eq.uiX && x <= eq.uiX + eq.uiW && y >= eq.uiY && y <= eq.uiY + eq.uiH) {
                game.equipmentState.selectedEquipment = eq;
            }
        }
    });
    
    // 如果选中了装备，检查详情页按钮
    if (game.equipmentState.selectedEquipment) {
        const eq = game.equipmentState.selectedEquipment;
        const detailX = game.width - 300;
        const detailY = 220;
        
        // 强化按钮
        if (x >= detailX + 20 && x <= detailX + 130 && y >= detailY + 210 && y <= detailY + 245) {
            const enhanceCost = eq.enhanceLevel < 10 ? ENHANCE_CONFIG.costs[eq.enhanceLevel] : 0;
            if (game.gold >= enhanceCost && eq.enhanceLevel < 10) {
                const success = enhanceEquipment(eq);
                if (success) {
                    game.effects.push({ type: 'enhanceSuccess', life: 1 });
                } else {
                    game.effects.push({ type: 'enhanceFail', life: 1 });
                }
            }
            return;
        }
        
        // 精炼按钮
        if (x >= detailX + 150 && x <= detailX + 260 && y >= detailY + 210 && y <= detailY + 245) {
            if (game.gold >= REFINERY_CONFIG.cost && eq.refineLevel < 5) {
                refineEquipment(eq);
            }
            return;
        }
        
        // 穿戴/卸下按钮
        if (x >= detailX + 20 && x <= detailX + 260 && y >= detailY + 260 && y <= detailY + 295) {
            const slot = eq.type;
            if (game.equipmentState.equipped[slot] === eq) {
                unequipItem(slot);
            } else {
                equipItem(eq, slot);
            }
            return;
        }
    }
}

// 打开成就界面
function openAchievements() {
    game.achievementState.isOpen = true;
    game.achievementState.activeTab = 'all';
}

// 打开商店
function openShop() {
    game.shopState.isOpen = true;
    game.shopState.activeTab = 'diamond';
    game.shopState.confirmPurchase = null;
    
    // 初始化卡牌商店
    if (game.shopState.cardShop.length === 0) {
        refreshCardShop();
    }
    
    // 刷新菜单显示
    drawMenu();
}

// 刷新卡牌商店
function refreshCardShop() {
    game.shopState.cardShop = [];
    game.shopState.purchasedCards = [];
    
    // 随机抽取6张卡牌
    const allCards = [];
    for (let skill in CARDS) {
        CARDS[skill].forEach(cardName => {
            allCards.push({ id: cardName, name: cardName, price: 20, icon: '🃏' });
        });
    }
    
    for (let i = 0; i < 6; i++) {
        if (allCards.length > 0) {
            const idx = Math.floor(Math.random() * allCards.length);
            game.shopState.cardShop.push(allCards[idx]);
            allCards.splice(idx, 1);
        }
    }
}

// 处理商店点击
function handleShopClick(x, y) {
    // 检查关闭按钮
    if (x >= game.width - 60 && x <= game.width - 20 && y >= 20 && y <= 60) {
        game.shopState.isOpen = false;
        game.shopState.confirmPurchase = null;
        return;
    }
    
    // 检查购买确认弹窗
    if (game.shopState.confirmPurchase) {
        const confirmX = game.width / 2;
        const confirmY = game.height / 2;
        
        // 确认按钮
        if (x >= game.width / 2 - 100 && x <= game.width / 2 - 20 &&
            y >= confirmY + 30 && y <= confirmY + 65) {
            purchaseItem(game.shopState.confirmPurchase);
            game.shopState.confirmPurchase = null;
            return;
        }
        
        // 取消按钮
        if (x >= game.width / 2 + 20 && x <= game.width / 2 + 100 &&
            y >= confirmY + 30 && y <= confirmY + 65) {
            game.shopState.confirmPurchase = null;
            return;
        }
    }
    
    // 检查标签切换
    const tabs = ['diamond', 'gold', 'card', 'item'];
    const tabNames = ['钻石商店', '金币商店', '卡牌商店', '道具商店'];
    const tabWidth = 80;
    const tabStartX = game.width / 2 - (tabs.length * tabWidth) / 2;
    
    tabs.forEach((tab, i) => {
        const tx = tabStartX + i * tabWidth;
        if (y >= 80 && y <= 120 && x >= tx && x <= tx + tabWidth - 5) {
            game.shopState.activeTab = tab;
            game.shopState.confirmPurchase = null;
        }
    });
    
    // 检查商品点击
    let products = [];
    switch (game.shopState.activeTab) {
        case 'diamond': products = SHOP_DATA.diamondShop; break;
        case 'gold': products = SHOP_DATA.goldShop; break;
        case 'card': products = game.shopState.cardShop; break;
        case 'item': products = SHOP_DATA.itemShop; break;
    }
    
    products.forEach(product => {
        if (product.x && product.y) {
            if (x >= product.x && x <= product.x + product.width &&
                y >= product.y && y <= product.y + product.height) {
                // 打开购买确认
                game.shopState.confirmPurchase = product;
            }
        }
    });
    
    // 卡牌商店刷新按钮
    if (game.shopState.activeTab === 'card') {
        if (x >= game.width / 2 - 60 && x <= game.width / 2 + 60 &&
            y >= game.height - 80 && y <= game.height - 40) {
            if (game.diamond >= 10) {
                game.diamond -= 10;
                refreshCardShop();
            }
        }
    }
}

// 购买商品
function purchaseItem(item) {
    const tab = game.shopState.activeTab;
    
    if (tab === 'diamond') {
        // 钻石商店 - 直接获得钻石（模拟）
        game.diamond += item.diamonds;
    } else if (tab === 'gold') {
        if (game.gold >= item.price) {
            game.gold -= item.price;
            game.gold += item.gold;
        }
    } else if (tab === 'card') {
        if (game.diamond >= item.price && !game.shopState.purchasedCards.includes(item.id)) {
            game.diamond -= item.price;
            game.shopState.purchasedCards.push(item.id);
            addCardToInventory(item.name);
        }
    } else if (tab === 'item') {
        if (game.diamond >= item.price) {
            game.diamond -= item.price;
            
            // 使用道具
            if (item.type === 'heal') {
                // 生命药水
                game.players.forEach(player => {
                    if (player.alive) {
                        player.hp = Math.min(player.hp + player.maxHp * item.value, player.maxHp);
                    }
                });
            } else if (item.type === 'revive') {
                // 复活十字
                const deadPlayer = game.players.find(p => !p.alive);
                if (deadPlayer) {
                    deadPlayer.alive = true;
                    deadPlayer.hp = Math.floor(deadPlayer.maxHp * 0.5);
                }
            } else if (item.type === 'exp') {
                // 经验药水 - 暂时只是显示效果
                game.effects.push({
                    type: 'expBoost',
                    value: item.value,
                    life: 2
                });
            }
        }
    }
}

// 抽卡函数
function drawGacha(count) {
    const cost = count === 1 ? 20 : 180;
    if (game.diamond < cost) return;
    
    game.diamond -= cost;
    game.gachaState.drawCount += count;
    game.gachaState.drawnCards = [];
    game.gachaState.drawnCardsList = []; // 抽到的卡牌
    
    const charList = ['李逍遥', '赵灵儿', '阿奴'];
    const newChars = [];
    
    for (let i = 0; i < count; i++) {
        let drawnChar;
        
        // 保底机制：每10抽必出未拥有的角色
        if (game.gachaState.drawCount % 10 === 0) {
            const unowned = charList.filter(c => !game.gachaState.ownedCharacters.includes(c));
            if (unowned.length > 0) {
                drawnChar = unowned[Math.floor(Math.random() * unowned.length)];
            } else {
                drawnChar = charList[Math.floor(Math.random() * charList.length)];
            }
        } else {
            drawnChar = charList[Math.floor(Math.random() * charList.length)];
        }
        
        game.gachaState.drawnCards.push(drawnChar);
        
        // 检查是否新角色
        if (!game.gachaState.ownedCharacters.includes(drawnChar)) {
            newChars.push(drawnChar);
            game.gachaState.ownedCharacters.push(drawnChar);
            
            // 如果队伍未满5人，自动上阵
            if (game.players.length < 5) {
                game.players.push(createPlayer(drawnChar));
            }
            // 初始化装备卡牌槽位
            if (!game.gachaState.equippedCards[drawnChar]) {
                game.gachaState.equippedCards[drawnChar] = [];
            }
        } else {
            // 重复角色补偿钻石+3张随机卡牌
            game.diamond += 50;
            for (let j = 0; j < 3; j++) {
                const card = getRandomCard();
                addCardToInventory(card);
            }
        }
        
        // 抽角色附带1张卡牌
        const card = getRandomCard();
        addCardToInventory(card);
        game.gachaState.drawnCardsList.push(card);
    }
    
    // 3秒后清除抽卡结果
    setTimeout(() => {
        game.gachaState.drawnCards = [];
        game.gachaState.drawnCardsList = [];
    }, 3000);
}

// 获取随机卡牌
function getRandomCard() {
    const allCards = [];
    // 收集所有卡牌
    for (let skill in CARDS) {
        CARDS[skill].forEach(cardName => {
            allCards.push(cardName);
        });
    }
    // 随机抽取
    return allCards[Math.floor(Math.random() * allCards.length)];
}

// 添加卡牌到库存
function addCardToInventory(cardName) {
    if (!game.gachaState.cardInventory[cardName]) {
        game.gachaState.cardInventory[cardName] = 0;
    }
    game.gachaState.cardInventory[cardName]++;
}

// 创建玩家
function createPlayer(characterName) {
    const char = CHARACTERS[characterName];
    return {
        name: char.name,
        role: char.role,
        hp: char.hp,
        maxHp: char.hp,
        attack: char.attack,
        attackSpeed: char.attackSpeed,
        moveSpeed: char.moveSpeed,
        attackRange: char.attackRange,
        critRate: char.critRate,
        critDamage: char.critDamage,
        x: game.width / 2,
        y: game.height / 2,
        targetX: game.width / 2,
        targetY: game.height / 2,
        skills: char.skills,
        skillCooldowns: {},
        lastAttack: 0,
        alive: true,
        shield: 0
    };
}

// 移动玩家
function movePlayer(x, y) {
    if (game.players.length > 0 && game.players[0].alive) {
        game.players[0].targetX = x;
        game.players[0].targetY = y;
    }
}

// 游戏主循环
function gameLoop(timestamp) {
    if (game.state !== 'playing') return;
    
    const deltaTime = (timestamp - game.lastTime) / 1000;
    game.lastTime = timestamp;
    game.time += deltaTime;
    
    update(deltaTime);
    render();
    
    requestAnimationFrame(gameLoop);
}

// 更新游戏状态
function update(dt) {
    // 更新玩家
    game.players.forEach(player => {
        if (!player.alive) return;
        
        // 更新技能冷却
        if (player.skillCooldowns) {
            for (let skillName in player.skillCooldowns) {
                if (player.skillCooldowns[skillName] > 0) {
                    player.skillCooldowns[skillName] -= dt;
                }
            }
        }
        
        // 万剑护体持续伤害
        if (player.swordOrbit) {
            // 检查是否到期
            if (game.time >= player.swordOrbitEndTime) {
                player.swordOrbit = false;
            } else {
                // 对范围内敌人造成伤害
                const orbitRadius = 100;
                game.enemies.forEach(enemy => {
                    if (!enemy.alive) return;
                    const dx = enemy.x - player.x;
                    const dy = enemy.y - player.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < orbitRadius + enemy.size) {
                        // 50%攻击力/秒的伤害
                        const damage = player.attack * 0.5 * dt;
                        enemy.hp -= damage;
                        if (enemy.hp <= 0) {
                            enemy.alive = false;
                            game.gold += enemy.exp;
                        }
                    }
                });
            }
        }
        
        // 移动
        const dx = player.targetX - player.x;
        const dy = player.targetY - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 5) {
            player.x += (dx / dist) * player.moveSpeed * dt;
            player.y += (dy / dist) * player.moveSpeed * dt;
        }
        
        // 自动攻击
        player.lastAttack += dt;
        const attackInterval = 1 / player.attackSpeed;
        
        if (player.lastAttack >= attackInterval) {
            const target = findNearestEnemy(player);
            if (target) {
                playerAttack(player, target);
                player.lastAttack = 0;
            }
        }
    });
    
    // 更新敌人
    game.enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        // 计算移动速度（考虑减速效果和精英怪光环）
        let currentSpeed = enemy.moveSpeed;
        if (enemy.slowTimer > 0) {
            currentSpeed *= (1 - (enemy.slowAmount || 0.3));
        }
        
        // 检查精英怪光环 - 周围小怪移动速度+20%
        if (!enemy.isElite) {
            game.enemies.forEach(ally => {
                if (ally.isElite && ally.alive) {
                    const dx = enemy.x - ally.x;
                    const dy = enemy.y - ally.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < ally.auraRange) {
                        currentSpeed *= (1 + ally.auraSpeedBonus);
                    }
                }
            });
        }
        
        // 寻找最近玩家
        const target = findNearestPlayer(enemy);
        if (target) {
            const dx = target.x - enemy.x;
            const dy = target.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > enemy.attackRange) {
                enemy.x += (dx / dist) * currentSpeed * dt;
                enemy.y += (dy / dist) * currentSpeed * dt;
            } else {
                // 攻击
                enemy.lastAttack += dt;
                if (enemy.lastAttack >= enemy.attackInterval) {
                    enemyAttack(enemy, target);
                    enemy.lastAttack = 0;
                }
            }
        }
    });
    
    // 更新投射物
    game.projectiles = game.projectiles.filter(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        
        // 碰撞检测
        game.enemies.forEach(enemy => {
            if (!enemy.alive) return;
            const dx = enemy.x - p.x;
            const dy = enemy.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < enemy.size) {
                enemy.hp -= p.damage;
                if (enemy.hp <= 0) {
                    enemy.alive = false;
                    game.gold += enemy.exp;
                }
                
                // 冰锥减速效果
                if (p.type === 'ice' && p.slowDuration > 0) {
                    enemy.slowTimer = p.slowDuration;
                    enemy.slowAmount = p.slowAmount;
                }
                
                p.life = 0;
            }
        });
        
        // BOSS伤害检测（玩家攻击BOSS）
        if (p.isCrit === undefined && game.bossState.active && game.bossState.boss && game.bossState.boss.alive) {
            const boss = game.bossState.boss;
            const dx = boss.x - p.x;
            const dy = boss.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < boss.size) {
                // 计算伤害
                let damage = p.damage;
                
                // 检查弱点攻击（简单处理：随机30%几率触发弱点加成）
                if (Math.random() < 0.3) {
                    damage *= (1 + boss.weakPointBonus);
                }
                
                // 无敌状态
                if (!boss.isInvincible) {
                    boss.hp -= damage;
                    game.bossState.totalDamage += damage;
                    
                    // 检查BOSS死亡
                    if (boss.hp <= 0) {
                        boss.alive = false;
                        defeatBoss();
                    }
                }
                
                p.life = 0;
            }
        }
        
        return p.life > 0;
    });
    
    // 更新敌人状态（减速效果）
    game.enemies.forEach(enemy => {
        if (enemy.slowTimer > 0) {
            enemy.slowTimer -= dt;
        }
    });
    
    // 清理死亡单位
    game.enemies = game.enemies.filter(e => e.alive);
    
    // 更新特效
    game.effects = game.effects.filter(e => {
        e.life -= dt;
        return e.life > 0;
    });
    
    // 更新波次系统
    updateWaveSystem(dt);
}

// 波次系统更新
function updateWaveSystem(dt) {
    if (game.state !== 'playing') return;
    
    switch (game.waveState) {
        case 'countdown':
            // 倒计时阶段
            game.waveCountdown -= dt;
            if (game.waveCountdown <= 0) {
                startWave();
            }
            break;
            
        case 'spawning':
            // 刷怪阶段
            game.waveSpawnTimer += dt;
            if (game.waveSpawnTimer >= 0.5 && game.waveEnemiesSpawned < game.enemiesToSpawn) {
                spawnWaveEnemy();
                game.waveSpawnTimer = 0;
            }
            
            // 检查是否完成刷怪
            if (game.waveEnemiesSpawned >= game.enemiesToSpawn) {
                game.waveState = 'playing';
            }
            break;
            
        case 'playing':
            // 战斗阶段 - 检查是否击杀所有敌人
            game.waveEnemiesRemaining = game.enemies.filter(e => e.alive).length;
            
            if (game.waveEnemiesRemaining === 0 && game.waveEnemiesSpawned >= game.enemiesToSpawn) {
                // 波次完成
                completeWave();
            }
            break;
            
        case 'event':
            // 事件阶段 - 更新倒计时
            if (!game.eventState.selectedEvent) {
                game.eventState.timer -= dt;
                if (game.eventState.timer <= 0) {
                    // 超时未选择，跳过事件
                    game.wave++;
                    game.waveState = 'countdown';
                    game.waveCountdown = 3;
                    game.waveTimer = 15;
                    game.eventState.active = false;
                }
            }
            break;
            
        case 'boss':
            // BOSS战阶段
            if (game.bossState.active && game.bossState.boss && game.bossState.boss.alive) {
                updateBoss(dt);
            }
            break;
    }
}

// 开始波次
function startWave() {
    // 检查是否是BOSS波次（每5波）
    if (game.wave % 5 === 0 && game.wave > 0) {
        // 触发BOSS战
        startBossWave();
        return;
    }
    
    // 计算本波怪物数量和属性
    const baseCount = 5;
    const enemyCount = baseCount + game.wave - 1;
    const attributeMultiplier = 1 + (game.wave - 1) * 0.1;
    
    game.enemiesToSpawn = enemyCount;
    game.waveEnemiesSpawned = 0;
    game.waveSpawnTimer = 0;
    game.waveState = 'spawning';
    
    // 添加波次开始特效
    game.effects.push({
        type: 'waveStart',
        wave: game.wave,
        life: 3
    });
}

// 开始BOSS波次
function startBossWave() {
    // 确定BOSS类型
    let bossName;
    if (game.wave === 5) {
        bossName = '毒娘子';
    } else if (game.wave === 10) {
        bossName = '赤鬼王';
    } else if (game.wave === 15 || game.wave >= 20) {
        bossName = '拜月教主';
    } else {
        // 默认使用毒娘子
        bossName = '毒娘子';
    }
    
    const bossData = BOSS_DATA[bossName];
    
    // 创建BOSS
    game.bossState.active = true;
    game.bossState.currentBoss = bossName;
    game.bossState.boss = {
        name: bossData.name,
        hp: bossData.hp,
        maxHp: bossData.hp,
        attack: bossData.attack,
        moveSpeed: bossData.moveSpeed,
        attackRange: bossData.attackRange,
        attackInterval: bossData.attackInterval,
        lastAttack: 0,
        size: bossData.size,
        color: bossData.color,
        alive: true,
        x: game.width / 2,
        y: -100,
        targetX: game.width / 2,
        targetY: game.height / 3,
        data: bossData,
        phase: 1,
        isInvincible: false,
        isEnraged: false,
        weakPoint: bossData.weakPoint,
        weakPointBonus: bossData.weakPointBonus
    };
    game.bossState.totalDamage = 0;
    game.bossState.phase = 1;
    game.bossState.lastSkillTime = 0;
    game.bossState.summonTimer = 0;
    
    // BOSS提示
    game.effects.push({
        type: 'bossStart',
        bossName: bossName,
        life: 3
    });
    
    // BOSS战状态
    game.waveState = 'boss';
    game.enemiesToSpawn = 0;
    game.waveEnemiesSpawned = 0;
}

// 更新BOSS
function updateBoss(dt) {
    const boss = game.bossState.boss;
    if (!boss || !boss.alive) return;
    
    // BOSS移动（缓慢向玩家移动）
    const target = findNearestPlayerForBoss();
    if (target) {
        const dx = target.x - boss.x;
        const dy = target.y - boss.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > boss.attackRange) {
            boss.x += (dx / dist) * boss.moveSpeed * dt;
            boss.y += (dy / dist) * boss.moveSpeed * dt;
        }
    }
    
    // BOSS攻击
    boss.lastAttack += dt;
    if (boss.lastAttack >= boss.attackInterval && !boss.isInvincible) {
        bossAttack(boss);
        boss.lastAttack = 0;
    }
    
    // 检查狂暴状态
    const hpPercent = boss.hp / boss.maxHp;
    if (hpPercent <= boss.data.enragedThreshold && !boss.isEnraged) {
        boss.isEnraged = true;
        boss.attackInterval /= boss.data.enragedMultiplier;
        game.effects.push({
            type: 'bossEnrage',
            life: 2
        });
    }
    
    // 召唤小怪
    if (boss.data.summonInterval) {
        game.bossState.summonTimer += dt;
        if (game.bossState.summonTimer >= boss.data.summonInterval) {
            spawnBossMinions(boss.data.summonCount || 3);
            game.bossState.summonTimer = 0;
        }
    }
    
    // 无敌时间（拜月教主）
    if (boss.data.invincibleInterval) {
        game.bossState.lastSkillTime += dt;
        if (game.bossState.lastSkillTime >= boss.data.invincibleInterval) {
            boss.isInvincible = true;
            setTimeout(() => {
                if (boss) boss.isInvincible = false;
            }, boss.data.invincibleDuration * 1000);
            game.bossState.lastSkillTime = 0;
        }
    }
}

// BOSS攻击
function bossAttack(boss) {
    const bossData = boss.data;
    
    if (bossData.skill1) {
        const skill = bossData.skill1;
        
        if (skill.type === 'fan') {
            const target = findNearestPlayerForBoss();
            if (target) {
                const angle = Math.atan2(target.y - boss.y, target.x - boss.x);
                for (let i = -2; i <= 2; i++) {
                    const spreadAngle = angle + i * (skill.fanAngle / 4) * Math.PI / 180;
                    game.projectiles.push({
                        x: boss.x,
                        y: boss.y,
                        vx: Math.cos(spreadAngle) * 200,
                        vy: Math.sin(spreadAngle) * 200,
                        damage: skill.damage,
                        isBossProjectile: true,
                        life: 3
                    });
                }
            }
        } else if (skill.type === 'circle') {
            game.enemies.push({
                x: boss.x,
                y: boss.y,
                isBossAOEDamage: true,
                damage: skill.damage,
                radius: skill.radius,
                life: 1
            });
        } else if (skill.type === 'projectile') {
            const target = findNearestPlayerForBoss();
            if (target) {
                const dx = target.x - boss.x;
                const dy = target.y - boss.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                game.projectiles.push({
                    x: boss.x,
                    y: boss.y,
                    vx: (dx / dist) * skill.speed,
                    vy: (dy / dist) * skill.speed,
                    damage: skill.damage,
                    isBossProjectile: true,
                    life: 5
                });
            }
        }
    }
}

// 查找最近的玩家（用于BOSS）
function findNearestPlayerForBoss() {
    let nearest = null;
    let minDist = Infinity;
    
    game.players.forEach(player => {
        if (!player.alive) return;
        const dx = player.x - game.bossState.boss.x;
        const dy = player.y - game.bossState.boss.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < minDist) {
            minDist = dist;
            nearest = player;
        }
    });
    
    return nearest;
}

// 生成BOSS小怪
function spawnBossMinions(count) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i;
        const dist = 150;
        
        game.enemies.push({
            x: game.bossState.boss.x + Math.cos(angle) * dist,
            y: game.bossState.boss.y + Math.sin(angle) * dist,
            hp: 50,
            maxHp: 50,
            attack: 15,
            moveSpeed: 60,
            attackRange: 30,
            attackInterval: 1.5,
            lastAttack: 0,
            size: 8,
            color: '#666',
            alive: true,
            exp: 5
        });
    }
}

// 击败BOSS
function defeatBoss() {
    const bossName = game.bossState.currentBoss;
    
    // 检查是否是首杀
    const isFirstKill = !game.bossState.firstKillReward[bossName];
    
    // 发放奖励
    if (isFirstKill) {
        game.diamond += 500;
        game.bossState.firstKillReward[bossName] = true;
    }
    
    // 常规掉落
    const goldDrop = 200 + Math.floor(Math.random() * 300);
    game.gold += goldDrop;
    
    // 随机卡牌
    const cardCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < cardCount; i++) {
        const card = getRandomCard();
        addCardToInventory(card);
    }
    
    // 装备掉落（30%概率）
    if (Math.random() < 0.3) {
        const equipment = generateEquipment();
        addEquipment(equipment);
    }
    
    // BOSS击败特效
    game.effects.push({
        type: 'bossDefeat',
        bossName: bossName,
        life: 3
    });
    
    // 显示掉落
    game.effects.push({
        type: 'bossDrop',
        gold: goldDrop,
        cardCount: cardCount,
        firstKill: isFirstKill,
        life: 4
    });
    
    // 清除BOSS状态
    game.bossState.active = false;
    game.bossState.boss = null;
    
    // 进入下一波
    game.wave++;
    game.waveState = 'countdown';
    game.waveCountdown = 3;
    game.waveTimer = 15;
}

// 生成随机装备
function generateEquipment() {
    const types = ['武器', '防具', '饰品'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const items = Object.keys(EQUIPMENT_DATA[type]);
    const itemName = items[Math.floor(Math.random() * items.length)];
    const itemData = EQUIPMENT_DATA[type][itemName];
    
    // 随机品质
    const qualities = ['普通', '普通', '普通', '优秀', '优秀', '精良', '精良', '史诗', '传说'];
    const quality = qualities[Math.floor(Math.random() * qualities.length)];
    
    // 创建装备
    return {
        id: 'eq_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        type: type,
        name: itemName,
        quality: quality,
        icon: itemData.icon,
        baseAttack: itemData.baseAttack || 0,
        baseHp: itemData.baseHp || 0,
        baseCritRate: itemData.baseCritRate || 0,
        enhanceLevel: 0,
        refineLevel: 0
    };
}

// 添加装备到背包
function addEquipment(equipment) {
    game.equipmentState.inventory.push(equipment);
}

// 获取装备属性
function getEquipmentStats(equipment) {
    if (!equipment) return { attack: 0, hp: 0, critRate: 0 };
    
    const qualityBonus = EQUIPMENT_QUALITY_BONUS[equipment.quality];
    const enhanceBonus = 1 + equipment.enhanceLevel * ENHANCE_CONFIG.bonusPerLevel;
    const refineBonus = 1 + equipment.refineLevel * REFINERY_CONFIG.bonusPerLevel;
    const totalBonus = qualityBonus * enhanceBonus * refineBonus;
    
    let attack = equipment.baseAttack * totalBonus;
    let hp = equipment.baseHp * totalBonus;
    let critRate = equipment.baseCritRate * totalBonus;
    
    return { attack, hp, critRate };
}

// 装备强化
function enhanceEquipment(equipment) {
    if (!equipment || equipment.enhanceLevel >= 10) return false;
    
    const cost = ENHANCE_CONFIG.costs[equipment.enhanceLevel];
    if (game.gold < cost) return false;
    
    game.gold -= cost;
    
    // 成功率
    const successRate = ENHANCE_CONFIG.successRates[equipment.enhanceLevel];
    if (Math.random() < successRate) {
        equipment.enhanceLevel++;
        return true;
    } else {
        // 失败惩罚：降级
        if (equipment.enhanceLevel > 0) {
            equipment.enhanceLevel--;
        }
        return false;
    }
}

// 装备精炼
function refineEquipment(equipment) {
    if (!equipment || equipment.refineLevel >= 5) return false;
    if (game.gold < REFINERY_CONFIG.cost) return false;
    
    game.gold -= REFINERY_CONFIG.cost;
    equipment.refineLevel++;
    return true;
}

// 穿戴装备
function equipItem(equipment, slot) {
    // 卸下当前装备
    const current = game.equipmentState.equipped[slot];
    if (current) {
        game.equipmentState.inventory.push(current);
    }
    
    // 装备新装备
    const idx = game.equipmentState.inventory.indexOf(equipment);
    if (idx > -1) {
        game.equipmentState.inventory.splice(idx, 1);
    }
    game.equipmentState.equipped[slot] = equipment;
}

// 卸下装备
function unequipItem(slot) {
    const equipment = game.equipmentState.equipped[slot];
    if (equipment) {
        game.equipmentState.inventory.push(equipment);
        game.equipmentState.equipped[slot] = null;
    }
}

// 生成波次敌人
function spawnWaveEnemy() {
    const baseHp = 100;
    const baseAttack = 20;
    const baseSpeed = 50;
    const attributeMultiplier = 1 + (game.wave - 1) * 0.1;
    
    // 精英怪：从第3波开始，每3波出现1只
    const isElite = (game.wave >= 3) && ((game.wave - 3) % 3 === 0) && 
                    (game.waveEnemiesSpawned === 0);
    
    // 生成位置：屏幕边缘
    const side = Math.floor(Math.random() * 4);
    let x, y;
    const buffer = 100;
    
    switch (side) {
        case 0: // 上
            x = Math.random() * game.width;
            y = -buffer;
            break;
        case 1: // 下
            x = Math.random() * game.width;
            y = game.height + buffer;
            break;
        case 2: // 左
            x = -buffer;
            y = Math.random() * game.height;
            break;
        case 3: // 右
            x = game.width + buffer;
            y = Math.random() * game.height;
            break;
    }
    
    if (isElite) {
        // 精英怪
        game.enemies.push({
            x: x,
            y: y,
            hp: Math.floor(baseHp * 3 * attributeMultiplier),
            maxHp: Math.floor(baseHp * 3 * attributeMultiplier),
            attack: Math.floor(baseAttack * 2 * attributeMultiplier),
            moveSpeed: baseSpeed * 0.8 * attributeMultiplier,
            attackRange: 30,
            attackInterval: 1.5,
            lastAttack: 0,
            size: 15,
            color: '#9400D3',
            alive: true,
            exp: 20,
            isElite: true,
            auraRange: 100,
            auraSpeedBonus: 0.2
        });
    } else {
        // 普通小怪
        game.enemies.push({
            x: x,
            y: y,
            hp: Math.floor(baseHp * attributeMultiplier),
            maxHp: Math.floor(baseHp * attributeMultiplier),
            attack: Math.floor(baseAttack * attributeMultiplier),
            moveSpeed: baseSpeed * attributeMultiplier,
            attackRange: 30,
            attackInterval: 1.5,
            lastAttack: 0,
            size: 10,
            color: '#888',
            alive: true,
            exp: 10,
            isElite: false
        });
    }
    
    game.waveEnemiesSpawned++;
}

// 完成波次
function completeWave() {
    // 发放金币奖励
    game.gold += 100;
    
    // 波次提示
    game.effects.push({
        type: 'waveComplete',
        wave: game.wave,
        life: 2
    });
    
    // 清除上一波的增益
    game.eventState.buffs = {
        attack: 0,
        moveSpeed: 0,
        damageReduction: 0,
        critRate: 0,
        regen: 0
    };
    
    // 解锁天赋系统（通关第5波）
    if (game.wave >= 5 && !game.talentState.unlocked) {
        game.talentState.unlocked = true;
        game.effects.push({
            type: 'talentUnlocked',
            life: 3
        });
    }
    
    // 给予天赋点数（每波1点，上限30点）
    if (game.talentState.unlocked && game.talentState.talentPoints < 30) {
        game.talentState.talentPoints++;
    }
    
    // 60%概率触发随机事件
    if (Math.random() < 0.6) {
        // 进入事件状态
        game.waveState = 'event';
        game.eventState.active = true;
        game.eventState.timer = 5;
        game.eventState.events = generateRandomEvents(3);
        game.eventState.selectedEvent = null;
    } else {
        // 直接进入下一波
        game.wave++;
        game.waveState = 'countdown';
        game.waveCountdown = 3;
        game.waveTimer = 15;
    }
}

// 生成随机事件
function generateRandomEvents(count) {
    const events = [];
    const eventNames = Object.keys(EVENT_DATA);
    
    // 按权重选择事件类型
    const types = ['buff', 'resource', 'challenge', 'special'];
    const typeWeights = [EVENT_WEIGHTS.buff, EVENT_WEIGHTS.resource, EVENT_WEIGHTS.challenge, EVENT_WEIGHTS.special];
    
    for (let i = 0; i < count; i++) {
        // 随机选择事件类型
        let rand = Math.random() * 100;
        let selectedType = types[0];
        let accumulated = 0;
        
        for (let j = 0; j < types.length; j++) {
            accumulated += typeWeights[j];
            if (rand < accumulated) {
                selectedType = types[j];
                break;
            }
        }
        
        // 从该类型中选择随机事件
        const typeEvents = eventNames.filter(name => EVENT_DATA[name].type === selectedType);
        if (typeEvents.length > 0) {
            const eventName = typeEvents[Math.floor(Math.random() * typeEvents.length)];
            events.push(eventName);
        } else {
            // 如果没有对应类型，随机选一个
            events.push(eventNames[Math.floor(Math.random() * eventNames.length)]);
        }
    }
    
    return events;
}

// 应用事件效果
function applyEvent(eventName) {
    const event = EVENT_DATA[eventName];
    if (!event) return;
    
    switch (event.effect) {
        case 'diamond':
            game.diamond += event.value;
            break;
        case 'gold':
            game.gold += event.value;
            break;
        case 'shop':
            if (game.gold >= event.value) {
                game.gold -= event.value;
                const card = getRandomCard();
                addCardToInventory(card);
            }
            break;
        case 'attack':
            game.eventState.buffs.attack += event.value;
            break;
        case 'moveSpeed':
            game.eventState.buffs.moveSpeed += event.value;
            break;
        case 'damageReduction':
            game.eventState.buffs.damageReduction += event.value;
            break;
        case 'critRate':
            game.eventState.buffs.critRate += event.value;
            break;
        case 'regen':
            game.eventState.buffs.regen += event.value;
            break;
        case 'eliteSpawn':
            // 生成精英怪
            spawnEliteEnemy();
            break;
        case 'timeChallenge':
            // 限时挑战 - 记录开始时间
            game.eventState.timeChallengeStart = game.time;
            game.eventState.timeChallengeTarget = 10;
            game.eventState.timeChallengeCount = 0;
            break;
        case 'hpTest':
            // 扣除生命获得钻石
            game.players.forEach(player => {
                if (player.alive) {
                    player.hp = Math.floor(player.hp * (1 - event.value));
                }
            });
            game.diamond += 50;
            break;
        case 'summon':
            // 召唤已有角色
            const ownedChars = game.gachaState.ownedCharacters;
            if (ownedChars.length > 0 && game.players.length < 5) {
                const randomChar = ownedChars[Math.floor(Math.random() * ownedChars.length)];
                game.players.push(createPlayer(randomChar));
            }
            break;
        case 'skillBuff':
            // 随机技能冷却减少
            if (game.players.length > 0) {
                const player = game.players[0];
                if (player.skills && player.skillCooldowns) {
                    const skillName = player.skills[Math.floor(Math.random() * player.skills.length)];
                    if (player.skillCooldowns[skillName]) {
                        player.skillCooldowns[skillName] *= (1 - event.value);
                    }
                }
            }
            break;
        case 'fullHeal':
            // 全队回满血
            game.players.forEach(player => {
                if (player.alive) {
                    player.hp = player.maxHp;
                    player.shield = 0;
                }
            });
            break;
    }
    
    // 显示事件完成特效
    game.effects.push({
        type: 'eventComplete',
        eventName: eventName,
        life: 2
    });
}

// 生成精英怪
function spawnEliteEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    const buffer = 100;
    
    switch (side) {
        case 0: x = Math.random() * game.width; y = -buffer; break;
        case 1: x = Math.random() * game.width; y = game.height + buffer; break;
        case 2: x = -buffer; y = Math.random() * game.height; break;
        case 3: x = game.width + buffer; y = Math.random() * game.height; break;
    }
    
    game.enemies.push({
        x: x,
        y: y,
        hp: 300,
        maxHp: 300,
        attack: 40,
        moveSpeed: 40,
        attackRange: 30,
        attackInterval: 1.5,
        lastAttack: 0,
        size: 15,
        color: '#9400D3',
        alive: true,
        exp: 20,
        isElite: true,
        auraRange: 100,
        auraSpeedBonus: 0.2
    });
}

// 查找最近敌人
function findNearestEnemy(player) {
    let nearest = null;
    let minDist = Infinity;
    
    game.enemies.forEach(enemy => {
        if (!enemy.alive) return;
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < minDist) {
            minDist = dist;
            nearest = enemy;
        }
    });
    
    return nearest;
}

// 查找最近玩家
function findNearestPlayer(enemy) {
    let nearest = null;
    let minDist = Infinity;
    
    game.players.forEach(player => {
        if (!player.alive) return;
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < minDist) {
            minDist = dist;
            nearest = player;
        }
    });
    
    return nearest;
}

// 玩家攻击
function playerAttack(player, target) {
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // 暴击
    let damage = player.attack;
    let isCrit = Math.random() < player.critRate;
    if (isCrit) {
        damage *= player.critDamage;
    }
    
    // 发射投射物
    const speed = 400;
    game.projectiles.push({
        x: player.x,
        y: player.y,
        vx: (dx / dist) * speed,
        vy: (dy / dist) * speed,
        damage: damage,
        isCrit: isCrit,
        life: 3
    });
}

// 敌人攻击
function enemyAttack(enemy, target) {
    // 使用角色的受伤方法（处理护盾）
    target.takeDamage(enemy.attack);
}

// 渲染特效
function renderEffects() {
    const ctx = game.ctx;
    
    game.effects.forEach(effect => {
        switch (effect.type) {
            case 'heal':
                ctx.fillStyle = `rgba(68, 255, 68, ${effect.life})`;
                ctx.font = '16px Microsoft YaHei';
                ctx.textAlign = 'center';
                ctx.fillText('+' + Math.floor(effect.value), effect.x, effect.y - 30);
                break;
            case 'shield':
                ctx.strokeStyle = `rgba(135, 206, 235, ${effect.life})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, 25, 0, Math.PI * 2);
                ctx.stroke();
                break;
            case 'revive':
                ctx.fillStyle = `rgba(255, 215, 0, ${effect.life})`;
                ctx.font = '20px Microsoft YaHei';
                ctx.textAlign = 'center';
                ctx.fillText('复活!', effect.x, effect.y - 30);
                break;
            case 'lightning':
                // 雷电效果 - 延迟后显示
                if (effect.delay > 0) {
                    effect.delay -= 0.016; // 假设60fps
                    if (effect.delay <= 0) {
                        // 雷电降落，造成伤害
                        game.enemies.forEach(enemy => {
                            if (!enemy.alive) return;
                            const dx = enemy.x - effect.x;
                            const dy = enemy.y - effect.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            if (dist < effect.radius) {
                                enemy.hp -= effect.damage;
                                if (enemy.hp <= 0) {
                                    enemy.alive = false;
                                    game.gold += enemy.exp;
                                }
                            }
                        });
                    }
                }
                // 绘制雷电
                if (effect.delay <= 0.3) {
                    ctx.fillStyle = `rgba(255, 255, 0, ${effect.life * 2})`;
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                    ctx.fill();
                    // 雷电中心
                    ctx.fillStyle = `rgba(255, 255, 255, ${effect.life})`;
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, effect.radius * 0.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            case 'yinYang':
                // 阴阳逆转效果 - 黑白气流旋转扩散
                const progress = 1 - effect.life / 0.5;
                const currentRadius = effect.radius * progress;
                
                // 绘制阴阳气流
                ctx.save();
                ctx.translate(effect.x, effect.y);
                ctx.rotate(progress * Math.PI * 2);
                
                // 白色半圆
                ctx.fillStyle = `rgba(255, 255, 255, ${effect.life * 2})`;
                ctx.beginPath();
                ctx.arc(0, 0, currentRadius, 0, Math.PI);
                ctx.fill();
                
                // 黑色半圆
                ctx.fillStyle = `rgba(0, 0, 0, ${effect.life * 2})`;
                ctx.beginPath();
                ctx.arc(0, 0, currentRadius, Math.PI, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
                break;
            case 'waveStart':
                ctx.fillStyle = `rgba(255, 68, 68, ${effect.life})`;
                ctx.font = 'bold 32px Microsoft YaHei';
                ctx.textAlign = 'center';
                ctx.fillText('第 ' + effect.wave + ' 波 开始！', game.width / 2, game.height / 2);
                break;
            case 'waveComplete':
                ctx.fillStyle = `rgba(255, 215, 0, ${effect.life})`;
                ctx.font = 'bold 28px Microsoft YaHei';
                ctx.textAlign = 'center';
                ctx.fillText('第 ' + effect.wave + ' 波 完成！', game.width / 2, game.height / 2);
                ctx.font = '20px Microsoft YaHei';
                ctx.fillText('+100 金币', game.width / 2, game.height / 2 + 35);
                break;
            case 'eventComplete':
                ctx.fillStyle = `rgba(0, 255, 255, ${effect.life})`;
                ctx.font = 'bold 24px Microsoft YaHei';
                ctx.textAlign = 'center';
                ctx.fillText(effect.eventName + ' 已触发！', game.width / 2, game.height / 2 - 30);
                break;
            case 'bossStart':
                ctx.fillStyle = `rgba(255, 0, 0, ${effect.life})`;
                ctx.font = 'bold 36px Microsoft YaHei';
                ctx.textAlign = 'center';
                ctx.fillText('⚠️ ' + effect.bossName + ' 出现！ ⚠️', game.width / 2, game.height / 2);
                break;
            case 'bossDefeat':
                ctx.fillStyle = `rgba(255, 215, 0, ${effect.life})`;
                ctx.font = 'bold 32px Microsoft YaHei';
                ctx.textAlign = 'center';
                ctx.fillText(effect.bossName + ' 被击败！', game.width / 2, game.height / 2 - 40);
                break;
            case 'bossDrop':
                ctx.fillStyle = `rgba(255, 255, 255, ${effect.life})`;
                ctx.font = '20px Microsoft YaHei';
                ctx.textAlign = 'center';
                ctx.fillText('获得: ' + effect.gold + '金币', game.width / 2, game.height / 2 + 10);
                ctx.fillText('+' + effect.cardCount + '张卡牌', game.width / 2, game.height / 2 + 40);
                if (effect.firstKill) {
                    ctx.fillStyle = `rgba(255, 215, 0, ${effect.life})`;
                    ctx.fillText('首杀奖励 +500💎', game.width / 2, game.height / 2 + 70);
                }
                break;
            case 'bossEnrage':
                ctx.fillStyle = `rgba(255, 0, 0, ${effect.life})`;
                ctx.font = 'bold 28px Microsoft YaHei';
                ctx.textAlign = 'center';
                ctx.fillText('⚠️ BOSS狂暴！ ⚠️', game.width / 2, game.height / 2 - 60);
                break;
        }
    });
}

// 渲染
function render() {
    const ctx = game.ctx;
    
    // 背景
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, game.width, game.height);
    
    // 绘制敌人
    game.enemies.forEach(enemy => {
        // 精英怪光环效果
        if (enemy.isElite) {
            ctx.strokeStyle = 'rgba(148, 0, 211, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.auraRange, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 敌人本体
        ctx.fillStyle = enemy.color || '#e53e3e';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 血条
        const hpPercent = enemy.hp / enemy.maxHp;
        const barWidth = enemy.size * 2;
        ctx.fillStyle = '#333';
        ctx.fillRect(enemy.x - enemy.size, enemy.y - enemy.size - 8, barWidth, 4);
        ctx.fillStyle = COLORS.ui.hp;
        ctx.fillRect(enemy.x - enemy.size, enemy.y - enemy.size - 8, barWidth * hpPercent, 4);
    });
    
    // 绘制BOSS
    if (game.bossState.active && game.bossState.boss && game.bossState.boss.alive) {
        const boss = game.bossState.boss;
        
        // BOSS无敌特效
        if (boss.isInvincible) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(Date.now() / 100) * 0.3})`;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(boss.x, boss.y, boss.size + 10, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // BOSS狂暴特效
        if (boss.isEnraged) {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(boss.x, boss.y, boss.size + 20, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // BOSS本体
        ctx.fillStyle = boss.color;
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, boss.size, 0, Math.PI * 2);
        ctx.fill();
        
        // BOSS名称
        ctx.fillStyle = COLORS.ui.gold;
        ctx.font = '16px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.fillText(boss.name, boss.x, boss.y - boss.size - 20);
        
        // BOSS血条
        const hpPercent = boss.hp / boss.maxHp;
        ctx.fillStyle = '#333';
        ctx.fillRect(boss.x - 60, boss.y - boss.size - 10, 120, 10);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(boss.x - 60, boss.y - boss.size - 10, 120 * hpPercent, 10);
        
        // 弱点提示
        ctx.fillStyle = '#aaa';
        ctx.font = '12px Microsoft YaHei';
        ctx.fillText('弱点: ' + boss.weakPoint, boss.x, boss.y + boss.size + 20);
    }
    
    // 绘制玩家
    game.players.forEach(player => {
        if (!player.alive) return;
        
        const hpPercent = player.hp / player.maxHp;
        
        // 血量环 - 根据血量百分比显示不同颜色
        let hpColor;
        if (hpPercent > 0.5) {
            hpColor = '#00FF00'; // 绿色
        } else if (hpPercent > 0.2) {
            hpColor = '#FFFF00'; // 黄色
        } else {
            hpColor = '#FF0000'; // 红色
        }
        
        // 血量环背景
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 23, 0, Math.PI * 2);
        ctx.stroke();
        
        // 血量环进度
        ctx.strokeStyle = hpColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 23, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * hpPercent);
        ctx.stroke();
        
        // 玩家圆形（头像）
        ctx.fillStyle = COLORS.ui.primary;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // 玩家名称
        ctx.fillStyle = '#fff';
        ctx.font = '12px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.fillText(player.name, player.x, player.y - 35);
        
        // 护盾显示
        if (player.shield > 0) {
            ctx.strokeStyle = COLORS.ui.spirit;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(player.x, player.y, 28, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.fillStyle = COLORS.ui.spirit;
            ctx.font = '10px Microsoft YaHei';
            ctx.fillText('盾:' + Math.floor(player.shield), player.x, player.y + 40);
        }
        
        // 万剑护体效果
        if (player.swordOrbit) {
            drawSwordOrbit(player);
        }
    });
    
    // 绘制投射物
    game.projectiles.forEach(p => {
        // 暴击特效
        if (p.isCrit) {
            const critColor = p.type === 'ice' ? 'rgba(138, 43, 226, 0.3)' : 'rgba(255, 215, 0, 0.3)';
            ctx.fillStyle = critColor;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 根据投射物类型设置颜色
        if (p.type === 'ice') {
            // 冰锥 - 蓝色
            ctx.fillStyle = p.isCrit ? '#9400D3' : '#00BFFF';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
            ctx.fill();
            // 冰晶光晕
            ctx.fillStyle = 'rgba(0, 191, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // 普通投射物
            ctx.fillStyle = p.isCrit ? COLORS.ui.gold : '#fff';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    // 绘制特效
    renderEffects();
    
    // UI信息
    drawGameUI();
}

// 绘制游戏UI
function drawGameUI() {
    const ctx = game.ctx;
    
    // BOSS战UI
    if (game.waveState === 'boss' && game.bossState.active && game.bossState.boss) {
        const boss = game.bossState.boss;
        
        // BOSS血条（屏幕顶部）
        ctx.fillStyle = '#333';
        ctx.fillRect(game.width / 2 - 200, 20, 400, 25);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(game.width / 2 - 200, 20, 400 * (boss.hp / boss.maxHp), 25);
        
        // BOSS名称
        ctx.fillStyle = COLORS.ui.gold;
        ctx.font = 'bold 18px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.fillText(boss.name, game.width / 2, 18);
        
        // 伤害统计（右上角）
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = '14px Microsoft YaHei';
        ctx.fillText('总伤害: ' + Math.floor(game.bossState.totalDamage), game.width - 20, 30);
        
        // 狂暴/无敌状态提示
        if (boss.isEnraged) {
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 16px Microsoft YaHei';
            ctx.textAlign = 'center';
            ctx.fillText('⚠️ 狂暴状态 ⚠️', game.width / 2, 60);
        }
        if (boss.isInvincible) {
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 16px Microsoft YaHei';
            ctx.textAlign = 'center';
            ctx.fillText('🛡️ 无敌中 🛡️', game.width / 2, 85);
        }
        
        // BOSS提示
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 24px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.fillText('BOSS战！', game.width / 2, 120);
    }
    
    // 波次
    ctx.fillStyle = '#fff';
    ctx.font = '16px Microsoft YaHei';
    ctx.textAlign = 'left';
    ctx.fillText('第 ' + game.wave + ' 波', 20, 30);
    
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
    
    // 绘制随机事件UI
    if (game.waveState === 'event' && game.eventState.active) {
        drawEventUI();
    }
}

// 绘制随机事件UI
function drawEventUI() {
    const ctx = game.ctx;
    
    // 半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, game.width, game.height);
    
    // 事件标题
    ctx.fillStyle = COLORS.ui.gold;
    ctx.font = 'bold 32px Microsoft YaHei';
    ctx.textAlign = 'center';
    ctx.fillText('随机事件', game.width / 2, 80);
    
    // 倒计时
    ctx.fillStyle = '#fff';
    ctx.font = '20px Microsoft YaHei';
    ctx.fillText('选择事件: ' + Math.ceil(game.eventState.timer) + '秒', game.width / 2, 120);
    
    // 绘制事件卡片
    const events = game.eventState.events;
    const cardWidth = 180;
    const cardHeight = 150;
    const startX = game.width / 2 - (events.length * cardWidth + (events.length - 1) * 20) / 2;
    const cardY = game.height / 2 - cardHeight / 2;
    
    events.forEach((eventName, i) => {
        const x = startX + i * (cardWidth + 20);
        const event = EVENT_DATA[eventName];
        
        // 卡片背景
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(x, cardY, cardWidth, cardHeight);
        
        // 卡片边框
        ctx.strokeStyle = CARD_RARITY_COLORS[event.type === 'buff' ? '普通' : event.type === 'resource' ? '稀有' : event.type === 'challenge' ? '史诗' : '传说'];
        ctx.lineWidth = 3;
        ctx.strokeRect(x, cardY, cardWidth, cardHeight);
        
        // 事件图标
        ctx.fillStyle = '#fff';
        ctx.font = '40px Microsoft YaHei';
        ctx.fillText(event.icon, x + cardWidth / 2, cardY + 50);
        
        // 事件名称
        ctx.fillStyle = COLORS.ui.gold;
        ctx.font = '18px Microsoft YaHei';
        ctx.fillText(eventName, x + cardWidth / 2, cardY + 85);
        
        // 事件描述
        ctx.fillStyle = '#ccc';
        ctx.font = '14px Microsoft YaHei';
        ctx.fillText(event.desc, x + cardWidth / 2, cardY + 120);
        
        // 存储卡片位置供点击检测
        game.eventState.events[i] = { name: eventName, x: x, y: cardY, width: cardWidth, height: cardHeight };
    });
    
    // 跳过提示
    ctx.fillStyle = '#888';
    ctx.font = '14px Microsoft YaHei';
    ctx.fillText('点击卡片选择事件，不选择将在5秒后跳过', game.width / 2, game.height / 2 + 120);
}

// 绘制虚拟摇杆
function drawJoystick() {
    const ctx = game.ctx;
    
    if (!game.joystick.active) return;
    
    // 摇杆底座
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(game.joystick.originX, game.joystick.originY, 50, 0, Math.PI * 2);
    ctx.fill();
    
    // 摇杆中心
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(game.joystick.currentX, game.joystick.currentY, 25, 0, Math.PI * 2);
    ctx.fill();
}

// 绘制万剑护体效果
function drawSwordOrbit(player) {
    const ctx = game.ctx;
    const swordCount = 8;
    const radius = 100;
    const rotationSpeed = (60 * Math.PI / 180); // 60度/秒
    
    // 更新旋转角度
    if (!player.swordOrbitAngle) {
        player.swordOrbitAngle = 0;
    }
    player.swordOrbitAngle += rotationSpeed * 0.016; // 假设60fps
    
    for (let i = 0; i < swordCount; i++) {
        const angle = player.swordOrbitAngle + (Math.PI * 2 / swordCount) * i;
        const x = player.x + Math.cos(angle) * radius;
        const y = player.y + Math.sin(angle) * radius;
        
        // 绘制剑
        ctx.fillStyle = '#87ceeb';
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle + Math.PI / 2);
        ctx.fillRect(-3, -10, 6, 20);
        ctx.restore();
    }
}

// 绘制技能栏
function drawSkillBar() {
    const ctx = game.ctx;
    const player = game.players[0];
    if (!player || !player.alive) return;
    
    const skillBarX = game.width / 2 - 120;
    const skillBarY = game.height - 80;
    
    player.skills.forEach((skillName, index) => {
        const x = skillBarX + index * 80;
        const skill = SKILLS[skillName];
        const cooldown = player.skillCooldowns ? (player.skillCooldowns[skillName] || 0) : 0;
        
        // 技能框
        ctx.fillStyle = cooldown > 0 ? '#555' : '#4a5568';
        ctx.fillRect(x, skillBarY, 70, 50);
        
        // 技能名称
        ctx.fillStyle = '#fff';
        ctx.font = '12px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.fillText(skillName, x + 35, skillBarY + 20);
        
        // 冷却显示
        if (cooldown > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(x, skillBarY, 70, 50 * (cooldown / skill.cooldown));
            ctx.fillStyle = '#fff';
            ctx.font = '14px Microsoft YaHei';
            ctx.fillText(cooldown.toFixed(1), x + 35, skillBarY + 35);
        }
        
        // 快捷键提示
        ctx.fillStyle = COLORS.ui.gold;
        ctx.font = '10px Microsoft YaHei';
        ctx.fillText('[' + (index + 1) + ']', x + 35, skillBarY + 45);
    });
}

// 获取未领取成就数量
function getUnclaimedAchievements() {
    let count = 0;
    const tabs = ['battle', 'collect', 'skill', 'resource'];
    tabs.forEach(tab => {
        if (ACHIEVEMENTS[tab]) {
            ACHIEVEMENTS[tab].forEach(ach => {
                if (ach.completed && !ach.claimed) count++;
            });
        }
    });
    return count;
}

// 绘制成就UI
function drawAchievementUI() {
    const ctx = game.ctx;
    
    // 半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, game.width, game.height);
    
    // 成就标题
    ctx.fillStyle = COLORS.ui.gold;
    ctx.font = 'bold 32px Microsoft YaHei';
    ctx.textAlign = 'center';
    ctx.fillText('成就', game.width / 2, 60);
    
    // 关闭按钮
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(game.width - 60, 20, 40, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '24px Microsoft YaHei';
    ctx.fillText('×', game.width - 40, 50);
    
    // 标签切换
    const tabs = ['all', 'battle', 'collect', 'skill', 'resource'];
    const tabNames = ['全部', '战斗', '收集', '技巧', '资源'];
    const tabWidth = 60;
    const startX = game.width / 2 - (tabs.length * tabWidth) / 2;
    
    tabs.forEach((tab, i) => {
        const x = startX + i * tabWidth;
        ctx.fillStyle = game.achievementState.activeTab === tab ? COLORS.ui.gold : '#4a5568';
        ctx.fillRect(x, 80, tabWidth - 3, 35);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Microsoft YaHei';
        ctx.fillText(tabNames[i], x + tabWidth / 2 - 1, 104);
    });
    
    // 获取当前标签的成就
    let achievements = [];
    if (game.achievementState.activeTab === 'all') {
        achievements = [...ACHIEVEMENTS.battle, ...ACHIEVEMENTS.collect, ...ACHIEVEMENTS.skill, ...ACHIEVEMENTS.resource];
    } else {
        achievements = ACHIEVEMENTS[game.achievementState.activeTab] || [];
    }
    
    // 绘制成就列表
    const itemHeight = 70;
    const startY = 130;
    achievements.forEach((ach, i) => {
        const y = startY + i * (itemHeight + 10);
        
        // 成就背景
        ctx.fillStyle = ach.completed ? '#1a3a1a' : '#2d3748';
        ctx.fillRect(20, y, game.width - 40, itemHeight);
        
        // 成就图标
        ctx.fillStyle = '#fff';
        ctx.font = '28px Microsoft YaHei';
        ctx.fillText(ach.icon, 50, y + 45);
        
        // 成就名称
        ctx.fillStyle = ach.completed ? '#44ff44' : '#fff';
        ctx.font = '16px Microsoft YaHei';
        ctx.textAlign = 'left';
        ctx.fillText(ach.name, 90, y + 25);
        
        // 成就描述
        ctx.fillStyle = '#aaa';
        ctx.font = '12px Microsoft YaHei';
        ctx.fillText(ach.desc, 90, y + 45);
        
        // 进度
        const progress = Math.min(ach.current / ach.target, 1);
        ctx.fillStyle = '#333';
        ctx.fillRect(200, y + 35, 150, 10);
        ctx.fillStyle = ach.completed ? '#44ff44' : COLORS.ui.gold;
        ctx.fillRect(200, y + 35, 150 * progress, 10);
        
        // 进度文字
        ctx.fillStyle = '#fff';
        ctx.font = '10px Microsoft YaHei';
        ctx.fillText(ach.current + '/' + ach.target, 280, y + 43);
        
        // 奖励
        ctx.textAlign = 'right';
        ctx.fillStyle = COLORS.ui.gold;
        ctx.font = '14px Microsoft YaHei';
        ctx.fillText('+' + ach.reward + '💎', game.width - 100, y + 40);
        
        // 领取按钮
        if (ach.completed && !ach.claimed) {
            ctx.fillStyle = '#44ff44';
            ctx.fillRect(game.width - 130, y + 20, 80, 30);
            ctx.fillStyle = '#fff';
            ctx.font = '14px Microsoft YaHei';
            ctx.fillText('领取', game.width - 90, y + 40);
            ach.claimX = game.width - 130;
            ach.claimY = y + 20;
            ach.claimW = 80;
            ach.claimH = 30;
        } else if (ach.claimed) {
            ctx.fillStyle = '#666';
            ctx.font = '14px Microsoft YaHei';
            ctx.fillText('已领取', game.width - 90, y + 40);
        }
    });
    
    // 一键领取按钮
    const unclaimedCount = getUnclaimedAchievements();
    if (unclaimedCount > 0) {
        ctx.fillStyle = COLORS.ui.gold;
        ctx.fillRect(game.width / 2 - 80, game.height - 60, 160, 40);
        ctx.fillStyle = '#000';
        ctx.font = '16px Microsoft YaHei';
        ctx.fillText('一键领取 (' + unclaimedCount + ')', game.width / 2, game.height - 33);
    }
    
    ctx.textAlign = 'left';
}

// 处理成就点击
function handleAchievementClick(x, y) {
    // 检查关闭按钮
    if (x >= game.width - 60 && x <= game.width - 20 && y >= 20 && y <= 60) {
        game.achievementState.isOpen = false;
        return;
    }
    
    // 检查标签切换
    const tabs = ['all', 'battle', 'collect', 'skill', 'resource'];
    const tabWidth = 60;
    const tabStartX = game.width / 2 - (tabs.length * tabWidth) / 2;
    
    tabs.forEach((tab, i) => {
        const tx = tabStartX + i * tabWidth;
        if (y >= 80 && y <= 115 && x >= tx && x <= tx + tabWidth - 3) {
            game.achievementState.activeTab = tab;
        }
    });
    
    // 检查领取按钮
    let achievements = [];
    if (game.achievementState.activeTab === 'all') {
        achievements = [...ACHIEVEMENTS.battle, ...ACHIEVEMENTS.collect, ...ACHIEVEMENTS.skill, ...ACHIEVEMENTS.resource];
    } else {
        achievements = ACHIEVEMENTS[game.achievementState.activeTab] || [];
    }
    
    const itemHeight = 70;
    const startY = 130;
    
    achievements.forEach((ach, i) => {
        if (ach.completed && !ach.claimed && ach.claimX) {
            if (x >= ach.claimX && x <= ach.claimX + ach.claimW &&
                y >= ach.claimY && y <= ach.claimY + ach.claimH) {
                // 领取奖励
                game.diamond += ach.reward;
                ach.claimed = true;
            }
        }
    });
    
    // 一键领取
    const unclaimedCount = getUnclaimedAchievements();
    if (unclaimedCount > 0 &&
        x >= game.width / 2 - 80 && x <= game.width / 2 + 80 &&
        y >= game.height - 60 && y <= game.height - 20) {
        // 一键领取所有
        ['battle', 'collect', 'skill', 'resource'].forEach(tab => {
            ACHIEVEMENTS[tab].forEach(ach => {
                if (ach.completed && !ach.claimed) {
                    game.diamond += ach.reward;
                    ach.claimed = true;
                }
            });
        });
    }
}

// 更新成就进度
function updateAchievement(type, value) {
    ['battle', 'collect', 'skill', 'resource'].forEach(tab => {
        ACHIEVEMENTS[tab].forEach(ach => {
            if (ach.type === type && !ach.completed) {
                ach.current += value;
                if (ach.current >= ach.target) {
                    ach.current = ach.target;
                    ach.completed = true;
                }
            }
        });
    });
}

// 页面加载完成后初始化
window.onload = initGame;
