// ===== 仙剑肉鸽 - 敌人系统 =====

// 敌人配置
const ENEMY_TYPES = {
    阴魂: {
        name: '阴魂',
        hp: 50,
        attack: 10,
        attackSpeed: 1.0,
        moveSpeed: 30,
        attackRange: 30,
        exp: 5,
        size: 15,
        color: '#a0aec0'
    },
    蝙蝠: {
        name: '蝙蝠',
        hp: 40,
        attack: 15,
        attackSpeed: 1.2,
        moveSpeed: 50,
        attackRange: 25,
        exp: 8,
        size: 12,
        color: '#1a202c'
    },
    毒蛇: {
        name: '毒蛇',
        hp: 60,
        attack: 20,
        attackSpeed: 0.8,
        moveSpeed: 40,
        attackRange: 25,
        exp: 10,
        size: 18,
        color: '#38a169'
    }
};

// 敌人生成器
const EnemySpawner = {
    // 生成敌人
    spawn(type, x, y) {
        const config = ENEMY_TYPES[type];
        if (!config) return null;
        
        return {
            name: config.name,
            hp: config.hp,
            maxHp: config.hp,
            attack: config.attack,
            attackSpeed: config.attackSpeed,
            moveSpeed: config.moveSpeed,
            attackRange: config.attackRange,
            exp: config.exp,
            size: config.size,
            color: config.color,
            x: x,
            y: y,
            alive: true,
            lastAttack: 0,
            attackInterval: 1 / config.attackSpeed
        };
    },
    
    // 生成波次敌人
    spawnWave(wave) {
        const enemyCount = 3 + wave * 2;
        const types = Object.keys(ENEMY_TYPES);
        
        for (let i = 0; i < enemyCount; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            
            // 随机生成在屏幕边缘
            let x, y;
            if (Math.random() < 0.5) {
                x = Math.random() < 0.5 ? -50 : game.width + 50;
                y = Math.random() * game.height;
            } else {
                x = Math.random() * game.width;
                y = Math.random() < 0.5 ? -50 : game.height + 50;
            }
            
            const enemy = this.spawn(type, x, y);
            if (enemy) {
                game.enemies.push(enemy);
            }
        }
    }
};
