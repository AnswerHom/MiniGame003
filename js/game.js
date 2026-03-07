// ===== 仙剑肉鸽 - 游戏主逻辑 =====

// 游戏状态
const game = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    state: 'menu', // menu, lobby, gacha, playing, gameover
    wave: 1,
    gold: 0,
    diamond: 200, // 钻石
    time: 0,
    lastTime: 0,
    players: [],
    team: [], // 队伍配置
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
    waveState: 'waiting', // waiting, spawning, countdown, playing, complete
    waveTimer: 0,
    waveCountdown: 3,
    waveEnemiesRemaining: 0,
    waveEnemiesSpawned: 0,
    waveSpawnTimer: 0,
    enemiesToSpawn: 0,
    // 虚拟摇杆
    joystick: {
        active: false,
        originX: 0,
        originY: 0,
        currentX: 0,
        currentY: 0,
        touchId: null
    }
};

// 初始化游戏
function initGame() {
    game.canvas = document.getElementById('gameCanvas');
    game.ctx = game.canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 启动游戏循环
    game.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
    
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
        // 点击开始进入大厅
        game.state = 'lobby';
    } else if (game.state === 'lobby') {
        // 大厅交互
        selectCharacter(x, y);
    } else if (game.state === 'playing') {
        // 移动玩家
        movePlayer(x, y);
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
// 绘制主菜单（点击开始）
function drawMenu() {
    const ctx = game.ctx;
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, game.width, game.height);
    
    // 标题
    ctx.fillStyle = COLORS.ui.gold;
    ctx.font = 'bold 64px Microsoft YaHei';
    ctx.textAlign = 'center';
    ctx.fillText('仙剑肉鸽', game.width / 2, game.height / 2 - 50);
    
    // 点击开始提示
    ctx.fillStyle = '#fff';
    ctx.font = '24px Microsoft YaHei';
    ctx.fillText('点击屏幕开始游戏', game.width / 2, game.height / 2 + 30);
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
    
    // 抽卡结果展示
    if (game.gachaState.drawnCards.length > 0) {
        drawGachaResults();
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
    // 根据游戏状态渲染不同界面
    if (game.state === 'menu') {
        drawMenu();
    } else if (game.state === 'lobby') {
        drawLobby();
    } else if (game.state === 'playing') {
        const deltaTime = (timestamp - game.lastTime) / 1000;
        game.lastTime = timestamp;
        game.time += deltaTime;
        
        update(deltaTime);
        render();
    }
    
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
    }
}

// 开始波次
function startWave() {
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
    
    // 进入下一波
    game.wave++;
    game.waveState = 'countdown';
    game.waveCountdown = 3;
    game.waveTimer = 15;
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

// 页面加载完成后初始化
window.onload = initGame;
