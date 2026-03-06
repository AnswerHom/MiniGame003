// ===== 仙剑肉鸽 - 游戏主逻辑 =====

// 游戏状态
const game = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    state: 'menu', // menu, playing, gameover
    wave: 1,
    gold: 0,
    time: 0,
    lastTime: 0,
    players: [],
    enemies: [],
    projectiles: [],
    effects: [],
    ui: {
        selectedCharacter: null,
        showCardSelect: false,
        cards: []
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
        // 选择角色开始游戏
        selectCharacter(x, y);
    } else if (game.state === 'playing') {
        // 移动玩家
        movePlayer(x, y);
    }
}

// 绘制主菜单
function drawMenu() {
    const ctx = game.ctx;
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, game.width, game.height);
    
    // 标题
    ctx.fillStyle = COLORS.ui.gold;
    ctx.font = 'bold 48px Microsoft YaHei';
    ctx.textAlign = 'center';
    ctx.fillText('仙剑肉鸽', game.width / 2, game.height / 3);
    
    // 角色选择提示
    ctx.fillStyle = '#fff';
    ctx.font = '24px Microsoft YaHei';
    ctx.fillText('点击选择角色开始游戏', game.width / 2, game.height / 2);
    
    // 绘制角色选项
    const chars = ['李逍遥', '赵灵儿'];
    const startX = game.width / 2 - 150;
    const y = game.height / 2 + 80;
    
    chars.forEach((char, i) => {
        const x = startX + i * 300;
        
        // 角色框
        ctx.fillStyle = COLORS.ui.primary;
        ctx.fillRect(x - 80, y - 40, 160, 120);
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(x - 75, y - 35, 150, 110);
        
        // 角色名
        ctx.fillStyle = '#fff';
        ctx.font = '20px Microsoft YaHei';
        ctx.fillText(char, x, y + 10);
        
        // 职业
        ctx.fillStyle = COLORS.ui.gold;
        ctx.font = '14px Microsoft YaHei';
        ctx.fillText(CHARACTERS[char].role, x, y + 35);
    });
}

// 选择角色
function selectCharacter(x, y) {
    const chars = ['李逍遥', '赵灵儿'];
    const startX = game.width / 2 - 150;
    const charY = game.height / 2 + 80;
    
    chars.forEach((char, i) => {
        const charX = startX + i * 300;
        if (x >= charX - 80 && x <= charX + 80 && y >= charY - 40 && y <= charY + 80) {
            startGame(char);
        }
    });
}

// 开始游戏
function startGame(characterName) {
    game.state = 'playing';
    game.players = [createPlayer(characterName)];
    game.enemies = [];
    game.projectiles = [];
    game.effects = [];
    game.wave = 1;
    game.gold = 0;
    game.time = 0;
    
    // 开始游戏循环
    game.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
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
        
        // 寻找最近玩家
        const target = findNearestPlayer(enemy);
        if (target) {
            const dx = target.x - enemy.x;
            const dy = target.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > enemy.attackRange) {
                enemy.x += (dx / dist) * enemy.moveSpeed * dt;
                enemy.y += (dy / dist) * enemy.moveSpeed * dt;
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
                p.life = 0;
            }
        });
        
        return p.life > 0;
    });
    
    // 清理死亡单位
    game.enemies = game.enemies.filter(e => e.alive);
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
    target.hp -= enemy.attack;
    if (target.hp <= 0) {
        target.alive = false;
    }
}

// 渲染
function render() {
    const ctx = game.ctx;
    
    // 背景
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, game.width, game.height);
    
    // 绘制敌人
    game.enemies.forEach(enemy => {
        ctx.fillStyle = '#e53e3e';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 血条
        const hpPercent = enemy.hp / enemy.maxHp;
        ctx.fillStyle = '#333';
        ctx.fillRect(enemy.x - 15, enemy.y - enemy.size - 10, 30, 4);
        ctx.fillStyle = COLORS.ui.hp;
        ctx.fillRect(enemy.x - 15, enemy.y - enemy.size - 10, 30 * hpPercent, 4);
    });
    
    // 绘制玩家
    game.players.forEach(player => {
        if (!player.alive) return;
        
        // 玩家圆形
        ctx.fillStyle = COLORS.ui.primary;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // 玩家名称
        ctx.fillStyle = '#fff';
        ctx.font = '12px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.fillText(player.name, player.x, player.y - 30);
        
        // 血条
        const hpPercent = player.hp / player.maxHp;
        ctx.fillStyle = '#333';
        ctx.fillRect(player.x - 20, player.y - 25, 40, 5);
        ctx.fillStyle = COLORS.ui.hp;
        ctx.fillRect(player.x - 20, player.y - 25, 40 * hpPercent, 5);
    });
    
    // 绘制投射物
    game.projectiles.forEach(p => {
        ctx.fillStyle = p.isCrit ? COLORS.ui.gold : '#fff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });
    
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
    ctx.fillText('波次: ' + game.wave, 20, 30);
    
    // 金币
    ctx.fillStyle = COLORS.ui.gold;
    ctx.fillText('💰 ' + game.gold, 20, 55);
}

// 页面加载完成后初始化
window.onload = initGame;
