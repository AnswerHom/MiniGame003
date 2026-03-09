// ===== 仙剑肉鸽 - 游戏主逻辑 =====

// 角色列表常量
const CHARACTER_LIST = ['李逍遥', '赵灵儿', '阿奴'];

// 地图区域数据
const MAP_REGIONS = {
    仙剑岛: {
        name: '仙剑岛',
        startWave: 1,
        endWave: 10,
        background: '#2d5a3d',
        decoration: 'flowers',
        unlocked: true,
        completed: false
    },
    锁妖塔: {
        name: '锁妖塔',
        startWave: 11,
        endWave: 20,
        background: '#2a2a3a',
        decoration: 'fire',
        unlocked: false,
        completed: false
    },
    神木林: {
        name: '神木林',
        startWave: 21,
        endWave: 30,
        background: '#1a4a3a',
        decoration: 'fireflies',
        unlocked: false,
        completed: false
    }
};

// 游戏状态
const game = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    // 世界地图尺寸（比屏幕大50%）
    worldWidth: 0,
    worldHeight: 0,
    // 摄像机系统
    camera: {
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        delay: 0.3, // 秒
        smoothing: 0.1,
        lastUpdate: 0
    },
    // 障碍物
    obstacles: [],
    state: 'menu', // menu, lobby, gacha, playing, gameover, victory, map
    wave: 1,
    gold: 0,
    diamond: 200, // 钻石
    time: 0,
    lastTime: 0,
    players: [],
    team: ['李逍遥'], // 队伍配置
    enemies: [],
    projectiles: [],
    effects: [],
    // v2.13.0 飘字系统
    floatingTexts: [],
    // 地图系统
    currentRegion: '仙剑岛',
    regions: JSON.parse(JSON.stringify(MAP_REGIONS)),
    // 抽卡系统
    gachaState: {
        ownedCharacters: ['李逍遥'], // 初始角色
        lastDrawTime: 0,
        drawCount: 0,
        isDrawing: false,
        drawnCards: [],
        drawnCardsList: [], // 抽卡时获得的卡牌展示
        selectedCard: null,
        // 卡牌系统
        cardInventory: {}, // 卡牌库存 {卡牌名: 数量}
        equippedCards: {},  // 已装备卡牌 {角色名: [卡牌1, 卡牌2, 卡牌3]}
    },
    // v2.12.0 技能抽取 - 已解锁技能
    unlockedSkills: {
        '李逍遥': ['御剑术'],  // 初始只有普通技能1
        '赵灵儿': ['五雷咒'],
        '阿奴': ['风雪冰天']
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
        visible: false,
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
    
    // 初始化世界地图尺寸（比屏幕大50%）
    game.worldWidth = game.width * 1.5;
    game.worldHeight = game.height * 1.5;
    
    // 初始化摄像机（设置为世界中心）
    game.camera.x = game.worldWidth / 2;
    game.camera.y = game.worldHeight / 2;
    game.camera.targetX = game.camera.x;
    game.camera.targetY = game.camera.y;
    game.camera.lastUpdate = performance.now();
    
    // v2.6.0 初始化战斗肉鸽系统
    initBattleRogue();
    
    // 生成障碍物
    generateObstacles();
    
    // 初始化队伍系统（v2.3.1）
    TeamManager.init();  // 先初始化
    TeamManager.load();  // 再加载保存的数据
    
    // v2.8.0 修复：清理异常队伍数据（超过5人或为空时重置）
    let teamMembers = TeamManager.getMembers();
    if (teamMembers.length > 5 || teamMembers.length === 0) {
        localStorage.removeItem('paladin_team');
        TeamManager.init();
        TeamManager.addMember('李逍遥');
        TeamManager.save();
        teamMembers = ['李逍遥'];
    }
    
    // 修复：队伍只能包含已拥有的角色
    const ownedChars = game.gachaState.ownedCharacters;
    teamMembers = teamMembers.filter(c => ownedChars.includes(c));
    
    // 如果过滤后队伍为空，只添加第一个拥有的角色
    if (teamMembers.length === 0 && ownedChars.length > 0) {
        teamMembers = [ownedChars[0]];
    }
    
    // 同步到TeamManager
    TeamManager.init();
    teamMembers.forEach(c => TeamManager.addMember(c));
    TeamManager.save();
    
    game.team = TeamManager.getMembers();
    
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
        // 重置队伍：只保留已拥有的角色
        const ownedChars = game.gachaState.ownedCharacters;
        game.team = game.team.filter(c => ownedChars.includes(c));
        if (game.team.length === 0 && ownedChars.length > 0) {
            game.team = [ownedChars[0]];
        }
        // 同步到TeamManager
        TeamManager.init();
        game.team.forEach(c => TeamManager.addMember(c));
        TeamManager.save();
        // 清空大厅显示的玩家
        game.players = [];
    } else if (game.state === 'lobby') {
        // 大厅交互
        selectCharacter(x, y);
    } else if (game.state === 'gacha') {
        // 点击返回大厅
        game.state = 'lobby';
    } else if (game.state === 'map') {
        // 地图交互
        handleMapClick(x, y);
    } else if (game.state === 'gameover') {
        // 检查返回大厅按钮
        if (x >= game.width / 2 - 80 && x <= game.width / 2 + 80 &&
            y >= game.height / 2 + 100 && y <= game.height / 2 + 150) {
            game.state = 'lobby';
        }
    } else if (game.state === 'victory') {
        // 检查返回大厅按钮
        if (x >= game.width / 2 - 80 && x <= game.width / 2 + 80 &&
            y >= game.height / 2 + 100 && y <= game.height / 2 + 150) {
            game.state = 'lobby';
        }
    } else if (game.state === 'playing') {
        // v2.6.0 战斗肉鸽界面点击
        if (battleRogueState.active) {
            handleBattleRogueClick(x, y);
            return;
        }
        
        // 检查战斗肉鸽按钮点击
        if (game.battleRogueBtn) {
            const btn = game.battleRogueBtn;
            if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
                openBattleRogue();
                return;
            }
        }
        
        // 移动玩家
        movePlayer(x, y);
    }
}

// 地图点击处理
function handleMapClick(x, y) {
    // 检查区域点击
    Object.keys(game.regions).forEach(regionName => {
        const r = game.regions[regionName];
        if (r.uiX && r.unlocked) {
            if (x >= r.uiX && x <= r.uiX + r.uiW && 
                y >= r.uiY && y <= r.uiY + r.uiH) {
                // 切换区域
                game.currentRegion = regionName;
                // 从区域起始波次开始
                game.wave = game.regions[regionName].startWave;
                // 重置敌人
                game.enemies = [];
                game.projectiles = [];
                game.effects = [];
                game.state = 'playing';
            }
        }
    });
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

// 处理触摸开始 - 虚拟摇杆（v2.10.0 任意位置显示）
function handleTouchStart(e) {
    if (game.state !== 'playing') return;
    
    e.preventDefault();
    
    const touch = e.changedTouches[0];
    const rect = game.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // 任意位置激活摇杆
    game.joystick.active = true;
    game.joystick.visible = true;
    game.joystick.originX = x;
    game.joystick.originY = y;
    game.joystick.currentX = x;
    game.joystick.currentY = y;
    game.joystick.touchId = touch.identifier;
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
            game.joystick.visible = false;
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
    
    // v2.13.0 技能名字飘字
    addFloatingText(player.x, player.y - 30, skillName, '#fff', 18);
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

// 绘制小地图
// 绘制障碍物
function drawObstacles() {
    const ctx = game.ctx;
    
    game.obstacles.forEach(obs => {
        if (obs.type === 'rock') {
            // 岩石 - 灰色不规则形状
            ctx.fillStyle = '#4a4a4a';
            ctx.beginPath();
            ctx.arc(obs.x, obs.y, obs.size, 0, Math.PI * 2);
            ctx.fill();
            // 阴影
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(obs.x + 3, obs.y + 3, obs.size * 0.8, 0, Math.PI * 2);
            ctx.fill();
        } else if (obs.type === 'tree') {
            // 树木 - 棕色树干 + 绿色树冠
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(obs.x - 5, obs.y, 10, obs.size);
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.arc(obs.x, obs.y - obs.size * 0.3, obs.size * 0.8, 0, Math.PI * 2);
            ctx.fill();
        } else if (obs.type === 'flower') {
            // 花丛 - 装饰物
            ctx.fillStyle = 'rgba(255, 182, 193, 0.5)';
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 / 5) * i;
                const x = obs.x + Math.cos(angle) * obs.size * 0.5;
                const y = obs.y + Math.sin(angle) * obs.size * 0.5;
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    });
}

function drawMiniMap() {
    const ctx = game.ctx;
    const mapSize = 80;
    const mapX = game.width - mapSize - 20;
    const mapY = 60;
    
    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize);
    
    // 区域颜色
    const region = game.regions[game.currentRegion];
    ctx.fillStyle = region.background;
    ctx.fillRect(mapX + 5, mapY + 5, mapSize - 10, mapSize - 10);
    
    // 当前区域标记
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(mapX + mapSize / 2, mapY + mapSize / 2, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // 区域名
    ctx.fillStyle = '#fff';
    ctx.font = '10px Microsoft YaHei';
    ctx.textAlign = 'center';
    ctx.fillText(region.name, mapX + mapSize / 2, mapY + mapSize + 12);
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
            const selected = inTeam;
            
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

// 大厅交互
function selectCharacter(x, y) {
    // 检查角色点击（选择队伍）
    const charList = CHARACTER_LIST;
    const teamStartX = game.width / 2 - 120;
    const charY = 200;
    
    // 检查是否点击了角色头像（选择/取消角色）
    let teamChanged = false;
    charList.forEach((char, i) => {
        const charX = teamStartX + i * 120;
        // 检查是否点击了角色框
        if (x >= charX - 40 && x <= charX + 40 &&
            y >= charY - 30 && y <= charY + 50) {
            // 检查是否已拥有该角色
            if (game.gachaState.ownedCharacters.includes(char)) {
                if (game.team.includes(char)) {
                    // 已在队伍中，移除
                    const idx = game.team.indexOf(char);
                    if (idx > -1) {
                        game.team.splice(idx, 1);
                        TeamManager.removeMember(char);
                        teamChanged = true;
                    }
                } else {
                    // 未在队伍中，添加（最多5人）
                    if (game.team.length < 5) {
                        game.team.push(char);
                        TeamManager.addMember(char);
                        teamChanged = true;
                    }
                }
            }
        }
    });
    
    // 如果队伍变化，保存并同步
    if (teamChanged) {
        TeamManager.save();
    }
    
    // 检查单抽按钮
    if (x >= game.width / 2 - 200 && x <= game.width / 2 - 40 &&
        y >= game.height - 160 && y <= game.height - 110) {
        if (game.diamond >= 20) {
            drawGacha(1);
        }
        return;
    }
    
    // 检查抽卡按钮
    if (x >= game.width / 2 - 80 && x <= game.width / 2 + 80 &&
        y >= game.height - 160 && y <= game.height - 110) {
        if (game.diamond >= 180) {
            game.state = 'gacha';
            drawGacha(10);
        }
        return;
    }
    
    // 检查开始战斗按钮
    if (game.team.length > 0 &&
        x >= game.width / 2 - 80 && x <= game.width / 2 + 80 &&
        y >= game.height - 80 && y <= game.height - 30) {
        startGame();
    }
    
    // 检查大地图按钮
    if (x >= game.width - 120 && x <= game.width - 20 &&
        y >= game.height - 60 && y <= game.height - 20) {
        game.state = 'map';
    }
}

// 开始战斗
function startGame() {
    // 初始化世界地图尺寸（比屏幕大50%）
    game.worldWidth = game.width * 1.5;
    game.worldHeight = game.height * 1.5;
    
    // 根据队伍创建玩家（v2.3.1 确保使用最新队伍数据）
    game.players = [];
    const currentTeam = TeamManager.getMembers();
    currentTeam.forEach(charName => {
        game.players.push(createPlayer(charName));
    });
    
    // 同时更新 game.team 保持一致
    game.team = currentTeam;
    
    // 重置摄像机到世界中心
    game.camera.x = game.worldWidth / 2;
    game.camera.y = game.worldHeight / 2;
    game.camera.targetX = game.camera.x;
    game.camera.targetY = game.camera.y;
    
    game.state = 'playing';
    game.wave = 1;
    game.time = 0;
    game.enemies = [];
    game.projectiles = [];
    game.effects = [];
    game.gold = 0;
    
    // v2.3.1 队伍系统 - 设置战斗状态
    TeamManager.setInBattle(true);
    
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
}

// v2.13.0 飘字系统
// 添加飘字
function addFloatingText(x, y, text, color, size = 16, isCrit = false) {
    game.floatingTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        size: size,
        life: isCrit ? 0.8 : 1.0,  // 伤害飘字0.8秒，技能名1秒
        maxLife: isCrit ? 0.8 : 1.0,
        isCrit: isCrit,
        vy: -30  // 上升速度
    });
}

// 更新飘字
function updateFloatingTexts(dt) {
    game.floatingTexts = game.floatingTexts.filter(ft => {
        ft.life -= dt;
        ft.y += ft.vy * dt;
        return ft.life > 0;
    });
}

// 绘制飘字
function drawFloatingTexts() {
    const ctx = game.ctx;
    
    game.floatingTexts.forEach(ft => {
        const alpha = ft.life / ft.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = ft.color;
        ctx.font = `bold ${ft.size}px Microsoft YaHei`;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x - game.camera.x + game.width / 2, ft.y - game.camera.y + game.height / 2);
    });
    
    ctx.globalAlpha = 1.0;
}

// 抽卡函数
function drawGacha(count) {
    const cost = count === 1 ? 20 : 180;
    if (game.diamond < cost) return;
    
    game.diamond -= cost;
    game.gachaState.drawCount += count;
    game.gachaState.drawnCards = [];
    game.gachaState.drawnCardsList = []; // 抽到的卡牌
    
    const charList = CHARACTER_LIST;
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
            
            // 不再自动上阵，需要玩家在大厅手动选择
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

// 角色颜色配置（v2.5.0）
const PLAYER_COLORS = {
    '李逍遥': '#3182ce',  // 蓝色
    '赵灵儿': '#d53f8c',  // 粉色
    '阿奴': '#38b2ac'      // 青色
};

// 创建玩家
function createPlayer(characterName) {
    const char = CHARACTERS[characterName];
    // v2.5.0 角色颜色
    const playerColor = PLAYER_COLORS[characterName] || '#3182ce';
    // v2.5.0 显示姓氏
    const surname = characterName.charAt(0);
    
    const player = {
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
        x: game.worldWidth / 2,
        y: game.worldHeight / 2,
        targetX: game.worldWidth / 2,
        targetY: game.worldHeight / 2,
        size: 20,
        color: playerColor,  // v2.5.0 角色颜色
        displayText: surname,  // v2.5.0 显示姓氏
        skills: char.skills,
        skillCooldowns: {},
        lastAttack: 0,
        alive: true,
        shield: 0,
        // 受伤方法
        takeDamage: function(damage) {
            let actualDamage = damage;
            // 护盾吸收
            if (this.shield > 0) {
                if (this.shield >= actualDamage) {
                    this.shield -= actualDamage;
                    actualDamage = 0;
                } else {
                    actualDamage -= this.shield;
                    this.shield = 0;
                }
            }
            // 扣血
            this.hp -= actualDamage;
            if (this.hp <= 0) {
                this.hp = 0;
                this.alive = false;
            }
        }
    };
    return player;
}

// 移动玩家
function movePlayer(x, y) {
    if (game.players.length > 0 && game.players[0].alive) {
        // 转换屏幕坐标到世界坐标
        const worldX = x + game.camera.x - game.width / 2;
        const worldY = y + game.camera.y - game.height / 2;
        game.players[0].targetX = worldX;
        game.players[0].targetY = worldY;
    }
}

// 游戏主循环
function gameLoop(timestamp) {
    // 根据游戏状态渲染不同界面
    if (game.state === 'menu') {
        drawMenu();
    } else if (game.state === 'lobby') {
        drawLobby();
    } else if (game.state === 'gacha') {
        drawGachaResults();
    } else if (game.state === 'map') {
        drawMap();
    } else if (game.state === 'gameover') {
        render();
        drawGameOver();
    } else if (game.state === 'victory') {
        render();
        drawVictory();
    } else if (game.state === 'playing') {
        const deltaTime = (timestamp - game.lastTime) / 1000;
        game.lastTime = timestamp;
        game.time += deltaTime;
        
        update(deltaTime);
        render();
        drawGameUI();
    }
    
    requestAnimationFrame(gameLoop);
}

// 更新游戏状态
// 更新摄像机跟随
function updateCamera(dt) {
    // 找到主导角色（第一个存活的玩家）
    const leader = game.players.find(p => p.alive);
    if (!leader) return;
    
    // 延迟更新目标位置
    game.camera.targetX = leader.x;
    game.camera.targetY = leader.y;
    
    // 平滑跟随
    game.camera.x += (game.camera.targetX - game.camera.x) * game.camera.smoothing;
    game.camera.y += (game.camera.targetY - game.camera.y) * game.camera.smoothing;
    
    // 边界处理
    game.camera.x = Math.max(game.width / 2, Math.min(game.worldWidth - game.width / 2, game.camera.x));
    game.camera.y = Math.max(game.height / 2, Math.min(game.worldHeight - game.height / 2, game.camera.y));
}

function update(dt) {
    // 更新飘字
    updateFloatingTexts(dt);
    
    // 更新摄像机跟随
    updateCamera(dt);
    
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
        
        // v2.11.0 技能自动释放 - 基于攻速、按顺序、大招独立
        if (player.skills && player.skills.length > 0) {
            // 初始化技能索引和上次释放时间
            if (!player.skillIndex) player.skillIndex = 0;
            if (!player.lastSkillTime) player.lastSkillTime = 0;
            
            // 计算普通技能释放间隔（基于攻速，攻速1.0=1秒，攻速2.0=0.5秒）
            const skillInterval = 1 / player.attackSpeed;
            
            // 区分普通技能和大招（冷却时间>=10秒视为大招）
            const normalSkills = [];
            const ultimateSkills = [];
            player.skills.forEach(skillName => {
                const skill = SKILLS[skillName];
                if (!skill) return;
                if (skill.cooldown >= 10) {
                    ultimateSkills.push(skillName);
                } else {
                    normalSkills.push(skillName);
                }
            });
            
            // 1. 大招单独判断 - 冷却完毕就释放
            ultimateSkills.forEach(skillName => {
                const cooldown = player.skillCooldowns && player.skillCooldowns[skillName];
                if (cooldown === undefined || cooldown <= 0) {
                    const target = findNearestEnemy(player);
                    if (target) {
                        usePlayerSkill(player, skillName);
                    }
                }
            });
            
            // 2. 普通技能按顺序循环释放，基于攻速
            if (normalSkills.length > 0) {
                const timeSinceLastSkill = game.time - player.lastSkillTime;
                
                if (timeSinceLastSkill >= skillInterval) {
                    const target = findNearestEnemy(player);
                    if (target) {
                        let released = false;
                        const skillCount = normalSkills.length;
                        
                        for (let i = 0; i < skillCount; i++) {
                            const checkIndex = (player.skillIndex + i) % skillCount;
                            const skillName = normalSkills[checkIndex];
                            const skill = SKILLS[skillName];
                            if (!skill) continue;
                            
                            const cooldown = player.skillCooldowns && player.skillCooldowns[skillName];
                            if (cooldown === undefined || cooldown <= 0) {
                                usePlayerSkill(player, skillName);
                                player.skillIndex = (checkIndex + 1) % skillCount;
                                player.lastSkillTime = game.time;
                                released = true;
                                break;
                            }
                        }
                    }
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
                        // v2.13.0 伤害飘字
                        if (enemy.hp > 0) {
                            addFloatingText(enemy.x, enemy.y - 20, Math.floor(damage), '#fff', 14);
                        }
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
        
        // 障碍物碰撞
        const obs = checkObstacleCollision(player.x, player.y, player.size);
        if (obs) {
            resolveObstacleCollision(player, obs);
        }
        
        // 世界边界限制
        player.x = Math.max(player.size, Math.min(game.worldWidth - player.size, player.x));
        player.y = Math.max(player.size, Math.min(game.worldHeight - player.size, player.y));
        
        // v2.9.0 取消普攻 - 普通攻击已移除，只保留技能释放
    });
    
    // v2.3.1 队伍系统 - 队伍跟随更新
    if (game.players.length > 1 && game.state === 'playing') {
        const leader = game.players.find(p => p.alive);
        if (leader) {
            TeamManager.updateTeamFollow(leader);
        }
    }
    
    // 检查游戏结束（全部玩家阵亡）
    const alivePlayers = game.players.filter(p => p.alive);
    if (alivePlayers.length === 0 && game.state === 'playing') {
        // v2.3.1 队伍系统 - 离开战斗状态
        TeamManager.setInBattle(false);
        game.state = 'gameover';
    }
    
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
                
                // 障碍物碰撞
                const obs = checkObstacleCollision(enemy.x, enemy.y, enemy.size);
                if (obs) {
                    resolveObstacleCollision(enemy, obs);
                }
            } else {
                // 攻击
                enemy.lastAttack += dt;
                if (enemy.lastAttack >= enemy.attackInterval) {
                    enemyAttack(enemy, target);
                    enemy.lastAttack = 0;
                }
            }
        }
        
        // 世界边界限制
        enemy.x = Math.max(enemy.size, Math.min(game.worldWidth - enemy.size, enemy.x));
        enemy.y = Math.max(enemy.size, Math.min(game.worldHeight - enemy.size, enemy.y));
    });
    
    // 更新投射物
    game.projectiles = game.projectiles.filter(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        
        // v2.7.0 子弹可被障碍物阻挡
        const hitObstacle = checkObstacleCollision(p.x, p.y, 5);
        if (hitObstacle) {
            p.life = 0;
            return false;
        }
        
        // 碰撞检测
        game.enemies.forEach(enemy => {
            if (!enemy.alive) return;
            const dx = enemy.x - p.x;
            const dy = enemy.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < enemy.size) {
                enemy.hp -= p.damage;
                // v2.13.0 伤害飘字
                if (enemy.hp > 0) {
                    const color = p.isCrit ? '#ffd700' : '#fff';
                    const size = p.isCrit ? 18 : 14;
                    addFloatingText(enemy.x, enemy.y - 20, Math.floor(p.damage), color, size, p.isCrit);
                }
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

// 开始波次（v2.3.2 & v2.3.3 更新）
function startWave() {
    // v2.3.3: 12波/BOSS战，第12波为BOSS战
    if (game.wave === 12) {
        game.effects.push({
            type: 'waveStart',
            wave: game.wave,
            life: 3,
            isBoss: true
        });
    }
    
    // 使用EnemySpawner生成波次
    EnemySpawner.spawnWave(game.wave);
    
    game.enemiesToSpawn = game.enemies.length;
    game.waveEnemiesSpawned = game.enemies.length;
    game.waveEnemiesRemaining = game.enemies.length;
    game.waveSpawnTimer = 0;
    game.waveState = 'playing';
    
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
    
    // 生成位置：世界地图边缘
    const side = Math.floor(Math.random() * 4);
    let x, y;
    const buffer = 100;
    
    switch (side) {
        case 0: // 上
            x = Math.random() * game.worldWidth;
            y = -buffer;
            break;
        case 1: // 下
            x = Math.random() * game.worldWidth;
            y = game.worldHeight + buffer;
            break;
        case 2: // 左
            x = -buffer;
            y = Math.random() * game.worldHeight;
            break;
        case 3: // 右
            x = game.worldWidth + buffer;
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

// 完成波次（v2.3.3 更新：12波/BOSS战）
function completeWave() {
    // v2.3.3: 第12波为BOSS战，完成第12波意味着通关
    if (game.wave >= 12) {
        // 通关！
        game.state = 'victory';
        TeamManager.setInBattle(false);
        return;
    }
    
    // 发放金币奖励
    game.gold += 100;
    
    // 波次提示
    game.effects.push({
        type: 'waveComplete',
        wave: game.wave,
        life: 2
    });
    
    // 检查是否完成当前区域
    const region = game.regions[game.currentRegion];
    if (game.wave >= region.endWave) {
        region.completed = true;
        
        // 解锁下一个区域
        const regionNames = Object.keys(game.regions);
        const currentIndex = regionNames.indexOf(game.currentRegion);
        if (currentIndex < regionNames.length - 1) {
            const nextRegion = regionNames[currentIndex + 1];
            game.regions[nextRegion].unlocked = true;
        }
    }
    
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
// 绘制地面纹理
function drawGroundTexture() {
    const ctx = game.ctx;
    
    // 简化的纹理效果
    for (let i = 0; i < 50; i++) {
        const x = (i * 73) % game.width;
        const y = (i * 47) % game.height;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.beginPath();
        ctx.arc(x, y, 20 + (i % 10), 0, Math.PI * 2);
        ctx.fill();
    }
}

// 绘制边界
function drawBoundaries() {
    const ctx = game.ctx;
    const edgeWidth = 60;
    
    // 边界渐变效果（仙雾）
    const gradient = ctx.createLinearGradient(0, 0, edgeWidth, 0);
    gradient.addColorStop(0, 'rgba(200, 200, 200, 0.8)');
    gradient.addColorStop(1, 'rgba(200, 200, 200, 0)');
    
    // 左侧边界
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, edgeWidth, game.height);
    
    // 右侧边界
    const gradient2 = ctx.createLinearGradient(game.width - edgeWidth, 0, game.width, 0);
    gradient2.addColorStop(0, 'rgba(200, 200, 200, 0)');
    gradient2.addColorStop(1, 'rgba(200, 200, 200, 0.8)');
    ctx.fillStyle = gradient2;
    ctx.fillRect(game.width - edgeWidth, 0, edgeWidth, game.height);
    
    // 顶部边界
    const gradient3 = ctx.createLinearGradient(0, 0, 0, edgeWidth);
    gradient3.addColorStop(0, 'rgba(200, 200, 200, 0.8)');
    gradient3.addColorStop(1, 'rgba(200, 200, 200, 0)');
    ctx.fillStyle = gradient3;
    ctx.fillRect(0, 0, game.width, edgeWidth);
    
    // 底部边界
    const gradient4 = ctx.createLinearGradient(0, game.height - edgeWidth, 0, game.height);
    gradient4.addColorStop(0, 'rgba(200, 200, 200, 0)');
    gradient4.addColorStop(1, 'rgba(200, 200, 200, 0.8)');
    ctx.fillStyle = gradient4;
    ctx.fillRect(0, game.height - edgeWidth, game.width, edgeWidth);
}

// 绘制战斗区域边框
function drawBattleArea() {
    const ctx = game.ctx;
    
    // 战斗区域（圆形）
    const centerX = game.width / 2;
    const centerY = game.height / 2;
    const radius = Math.min(game.width, game.height) * 0.4;
    
    // 外圈淡金色边框
    ctx.strokeStyle = 'rgba(218, 165, 32, 0.3)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // 内圈边框
    ctx.strokeStyle = 'rgba(218, 165, 32, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 10, 0, Math.PI * 2);
    ctx.stroke();
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
                                // v2.13.0 伤害飘字
                                if (enemy.hp > 0) {
                                    addFloatingText(enemy.x, enemy.y - 20, Math.floor(effect.damage), '#fff', 14);
                                }
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
                ctx.fillStyle = effect.isBoss ? `rgba(255, 0, 0, ${effect.life})` : `rgba(255, 68, 68, ${effect.life})`;
                ctx.font = 'bold 32px Microsoft YaHei';
                ctx.textAlign = 'center';
                const startWaveText = effect.wave === 12 ? '⚠️ BOSS战 ⚠️' : ('第 ' + effect.wave + ' 波 开始！');
                ctx.fillText(startWaveText, game.width / 2, game.height / 2);
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
// 生成障碍物
function generateObstacles() {
    game.obstacles = [];
    const count = 30; // 障碍物数量
    
    for (let i = 0; i < count; i++) {
        const type = Math.random() < 0.4 ? 'rock' : (Math.random() < 0.6 ? 'tree' : 'flower');
        const size = type === 'rock' ? 30 + Math.random() * 20 : 
                     (type === 'tree' ? 25 + Math.random() * 15 : 20);
        
        game.obstacles.push({
            x: size + Math.random() * (game.worldWidth - size * 2),
            y: size + Math.random() * (game.worldHeight - size * 2),
            size: size,
            type: type
        });
    }
}

// 检查障碍物碰撞
function checkObstacleCollision(x, y, radius) {
    for (const obs of game.obstacles) {
        if (obs.type === 'flower') continue; // 花丛可穿过
        
        const dx = x - obs.x;
        const dy = y - obs.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < obs.size + radius) {
            return obs;
        }
    }
    return null;
}

// 处理障碍物碰撞（推开）
function resolveObstacleCollision(entity, obstacle) {
    const dx = entity.x - obstacle.x;
    const dy = entity.y - obstacle.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist === 0) return;
    
    // 推开到障碍物边缘
    const pushDist = obstacle.size + entity.size - dist;
    entity.x += (dx / dist) * pushDist;
    entity.y += (dy / dist) * pushDist;
}

function render() {
    const ctx = game.ctx;
    
    // 应用摄像机偏移
    const cameraOffsetX = game.width / 2 - game.camera.x;
    const cameraOffsetY = game.height / 2 - game.camera.y;
    ctx.save();
    ctx.translate(cameraOffsetX, cameraOffsetY);
    
    // 根据区域绘制背景
    const region = game.regions[game.currentRegion];
    
    // 基础背景色
    ctx.fillStyle = region.background;
    ctx.fillRect(0, 0, game.worldWidth, game.worldHeight);
    
    // 绘制地面纹理（简化版）
    drawGroundTexture();
    
    // 绘制边界
    drawBoundaries();
    
    // 绘制战斗区域边框
    drawBattleArea();
    
    // 绘制障碍物
    drawObstacles();
    
    // 绘制装饰
    drawBattleDecorations();
    
    // 绘制敌人（v2.4.0 怪物美术与体型设计）
    game.enemies.forEach(enemy => {
        // v2.4.0 BOSS光效环绕
        if (enemy.isBoss && enemy.hasAura) {
            ctx.save();
            ctx.translate(enemy.x, enemy.y);
            ctx.rotate(game.time * 2); // 旋转光环
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.arc(0, 0, enemy.size + 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        
        // 精英怪光环效果
        if (enemy.isElite) {
            ctx.strokeStyle = 'rgba(148, 0, 211, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.auraRange || 50, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 敌人本体
        ctx.fillStyle = enemy.color || '#e53e3e';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        ctx.fill();
        
        // v2.4.0 怪物显示文字
        if (enemy.displayText) {
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.max(10, enemy.size * 0.8)}px Microsoft YaHei`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(enemy.displayText, enemy.x, enemy.y);
        }
        
        // 血条
        const hpPercent = enemy.hp / enemy.maxHp;
        const barWidth = enemy.size * 2;
        ctx.fillStyle = '#333';
        ctx.fillRect(enemy.x - enemy.size, enemy.y - enemy.size - 8, barWidth, 4);
        ctx.fillStyle = COLORS.ui.hp;
        ctx.fillRect(enemy.x - enemy.size, enemy.y - enemy.size - 8, barWidth * hpPercent, 4);
    });
    
    // 绘制玩家（v2.5.0 主角形象）
    game.players.forEach(player => {
        if (!player.alive) return;
        
        const hpPercent = player.hp / player.maxHp;
        // v2.5.0 角色颜色
        const playerColor = player.color || '#3182ce';
        
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
        
        // 玩家圆形（头像）- v2.5.0 使用角色颜色
        ctx.fillStyle = playerColor;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // v2.5.0 显示姓氏
        if (player.displayText) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Microsoft YaHei';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(player.displayText, player.x, player.y);
        }
        
        // 玩家名称
        ctx.fillStyle = '#fff';
        ctx.font = '12px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
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
        
        // 根据投射物类型绘制不同外观
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
        } else if (p.isSword || p.type === 'sword') {
            // 飞剑 - 李逍遥技能（v2.5.0 剑形发射物）
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(Math.atan2(p.vy, p.vx) + Math.PI / 2);
            
            // v2.5.0 淡蓝色拖尾
            const swordColor = p.swordColor || '#3182ce';
            ctx.fillStyle = swordColor + '40'; // 40% opacity
            ctx.beginPath();
            ctx.moveTo(0, -p.length / 2 - 15);
            ctx.lineTo(p.width / 2 + 2, -p.length / 2);
            ctx.lineTo(0, -p.length / 2 + 8);
            ctx.lineTo(-p.width / 2 - 2, -p.length / 2);
            ctx.closePath();
            ctx.fill();
            
            // 剑身 - v2.5.0 蓝色
            ctx.fillStyle = swordColor;
            ctx.beginPath();
            // 尖头长方形
            ctx.moveTo(0, -p.length / 2);
            ctx.lineTo(p.width / 2, -p.length / 4);
            ctx.lineTo(p.width / 2, p.length / 4);
            ctx.lineTo(0, p.length / 2);
            ctx.lineTo(-p.width / 2, p.length / 4);
            ctx.lineTo(-p.width / 2, -p.length / 4);
            ctx.closePath();
            ctx.fill();
            
            // 剑柄
            ctx.fillStyle = '#1a365d';
            ctx.fillRect(-p.width / 4, p.length / 4, p.width / 2, p.length / 4);
            
            ctx.restore();
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
    
    // 绘制飘字（随摄像机移动）
    drawFloatingTexts();
    
    // 恢复摄像机偏移（UI不随摄像机移动）
    ctx.restore();
    
    // UI信息
    drawGameUI();
}

// 绘制万剑护体环绕剑阵
function drawSwordOrbit(player) {
    const ctx = game.ctx;
    const orbitRadius = 50;
    const swordCount = 6;
    const time = Date.now() / 1000;
    
    for (let i = 0; i < swordCount; i++) {
        const angle = (Math.PI * 2 / swordCount) * i + time * 2;
        const swordX = player.x + Math.cos(angle) * orbitRadius;
        const swordY = player.y + Math.sin(angle) * orbitRadius;
        
        // 剑光效果
        ctx.fillStyle = 'rgba(135, 206, 235, 0.6)';
        ctx.beginPath();
        ctx.arc(swordX, swordY, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // 剑身
        ctx.fillStyle = '#87CEEB';
        ctx.beginPath();
        ctx.arc(swordX, swordY, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 绘制游戏UI
window.onload = initGame;
