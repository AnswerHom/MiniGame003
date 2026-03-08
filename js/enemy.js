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
        color: '#a0aec0',
        type: 'ghost',
        displayText: '阴'  // v2.4.0 显示文字
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
        color: '#1a202c',
        type: 'agile',
        displayText: '蝠'
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
        color: '#38a169',
        type: 'warrior',
        displayText: '蛇'
    },
    // v2.3.2 新增怪物
    蛤蟆: {
        name: '蛤蟆',
        hp: 150,
        attack: 15,
        attackSpeed: 0.5,
        moveSpeed: 25,
        attackRange: 30,
        exp: 12,
        size: 18,  // v2.4.0 调整体型
        color: '#2d5016',
        type: 'tank',
        displayText: '蛤',
        specialEffect: 'slow',
        slowAmount: 0.3,
        slowDuration: 2
    },
    毒蜂: {
        name: '毒蜂',
        hp: 30,
        attack: 25,
        attackSpeed: 1.5,
        moveSpeed: 60,
        attackRange: 20,
        exp: 10,
        size: 10,
        color: '#d69e2e',
        type: 'agile',
        displayText: '蜂'
    },
    骷髅: {
        name: '骷髅',
        hp: 80,
        attack: 30,
        attackSpeed: 1.0,
        moveSpeed: 35,
        attackRange: 40,
        exp: 15,
        size: 18,
        color: '#e2e8f0',
        type: 'warrior',
        displayText: '骨',
        specialEffect: 'resistKnockback',
        knockbackReduction: 0.5
    },
    僵尸: {
        name: '僵尸',
        hp: 200,
        attack: 20,
        attackSpeed: 0.4,
        moveSpeed: 20,
        attackRange: 30,
        exp: 18,
        size: 18,  // v2.4.0 调整体型
        color: '#276749',
        type: 'tank',
        displayText: '僵',
        specialEffect: 'slow',
        slowAmount: 0.2,
        slowDuration: 1.5
    },
    狐狸: {
        name: '狐狸',
        hp: 50,
        attack: 40,
        attackSpeed: 0.8,
        moveSpeed: 40,
        attackRange: 100,
        exp: 20,
        size: 15,
        color: '#ed8936',
        type: 'mage',
        displayText: '狐',
        specialEffect: 'aoe',
        aoeRadius: 50
    }
};

// 波次怪物组合（v2.3.2）
const WAVE_MONSTER_COMBINATIONS = {
    early: ['阴魂', '蝙蝠', '毒蛇'],
    mid: ['阴魂', '蝙蝠', '毒蛇', '蛤蟆', '毒蜂'],
    late: ['阴魂', '蝙蝠', '毒蛇', '蛤蟆', '毒蜂', '骷髅', '僵尸'],
    final: Object.keys(ENEMY_TYPES)
};

// 敌人生成器
const EnemySpawner = {
    // v2.3.3 波次配置
    waveConfig: {
        totalWaves: 12,
        // 每波怪物数量（割草爽感）
        getEnemyCount: (wave) => {
            if (wave <= 3) return 15 + Math.floor(Math.random() * 6);  // 15-20
            if (wave <= 6) return 25 + Math.floor(Math.random() * 6);  // 25-30
            if (wave <= 9) return 35 + Math.floor(Math.random() * 11); // 35-45
            if (wave <= 11) return 50 + Math.floor(Math.random() * 11); // 50-60
            return 40 + Math.floor(Math.random() * 11); // 40-50 (boss wave)
        },
        // 数值成长（每波）
        hpGrowth: 1.08,     // 每波+8%
        attackGrowth: 1.06, // 每波+6%
        speedGrowth: 1.01,  // 每波+1%
        maxSpeedBonus: 0.30 // 上限+30%
    },

    // 生成敌人
    spawn(type, x, y, wave = 1, isElite = false) {
        const config = ENEMY_TYPES[type];
        if (!config) return null;

        // 计算数值成长
        const hpGrowth = Math.pow(EnemySpawner.waveConfig.hpGrowth, wave - 1);
        const attackGrowth = Math.pow(EnemySpawner.waveConfig.attackGrowth, wave - 1);
        const speedGrowth = Math.min(
            Math.pow(EnemySpawner.waveConfig.speedGrowth, wave - 1),
            1 + EnemySpawner.waveConfig.maxSpeedBonus
        );

        // 精英怪加成
        const eliteHpMult = isElite ? 3 : 1;
        const eliteAttackMult = isElite ? 2 : 1;
        const eliteSpeedMult = isElite ? 1.2 : 1;
        const eliteExpMult = isElite ? 5 : 1;
        
        // v2.4.0 体型倍数
        const sizeMultiplier = isElite ? 1.3 : 1;

        return {
            name: config.name,
            hp: Math.floor(config.hp * hpGrowth * eliteHpMult),
            maxHp: Math.floor(config.hp * hpGrowth * eliteHpMult),
            attack: Math.floor(config.attack * attackGrowth * eliteAttackMult),
            attackSpeed: config.attackSpeed,
            moveSpeed: Math.floor(config.moveSpeed * speedGrowth * eliteSpeedMult),
            attackRange: config.attackRange,
            exp: config.exp * eliteExpMult,
            size: config.size * sizeMultiplier,  // v2.4.0 体型调整
            baseSize: config.size,
            color: isElite ? '#ff4444' : config.color, // 精英怪红色
            x: x,
            y: y,
            alive: true,
            lastAttack: 0,
            attackInterval: 1 / config.attackSpeed,
            // v2.4.0 显示文字
            displayText: config.displayText || config.name.charAt(0),
            // 特殊效果
            specialEffect: config.specialEffect,
            slowAmount: config.slowAmount,
            slowDuration: config.slowDuration,
            knockbackReduction: config.knockbackReduction,
            aoeRadius: config.aoeRadius,
            // 精英怪标记
            isElite: isElite
        };
    },

    // 获取波次的怪物类型列表
    getWaveMonsterTypes(wave) {
        if (wave <= 3) return WAVE_MONSTER_COMBINATIONS.early;
        if (wave <= 6) return WAVE_MONSTER_COMBINATIONS.mid;
        if (wave <= 10) return WAVE_MONSTER_COMBINATIONS.late;
        return WAVE_MONSTER_COMBINATIONS.final;
    },

    // 生成波次敌人
    spawnWave(wave) {
        // v2.3.3: 12波/BOSS战
        if (wave === 12) {
            // BOSS战 - 生成BOSS
            this.spawnBoss();
            // 同时生成一些小怪
            const minionCount = 10 + Math.floor(Math.random() * 10);
            const types = this.getWaveMonsterTypes(wave);
            for (let i = 0; i < minionCount; i++) {
                const type = types[Math.floor(Math.random() * types.length)];
                const pos = this.getRandomSpawnPosition();
                const enemy = this.spawn(type, pos.x, pos.y, wave, false);
                if (enemy) {
                    game.enemies.push(enemy);
                }
            }
            return;
        }

        const enemyCount = EnemySpawner.waveConfig.getEnemyCount(wave);
        const types = this.getWaveMonsterTypes(wave);

        // v2.3.3: 精英怪（每5波）
        const isEliteWave = wave % 5 === 0;
        const eliteCount = isEliteWave ? Math.floor(enemyCount / 10) : 0;

        for (let i = 0; i < enemyCount; i++) {
            const isElite = i < eliteCount;
            const type = types[Math.floor(Math.random() * types.length)];
            const pos = this.getRandomSpawnPosition();
            const enemy = this.spawn(type, pos.x, pos.y, wave, isElite);
            if (enemy) {
                game.enemies.push(enemy);
            }
        }
    },

    // 获取随机生成位置（屏幕边缘）
    getRandomSpawnPosition() {
        let x, y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? -50 : game.width + 50;
            y = Math.random() * game.height;
        } else {
            x = Math.random() * game.width;
            y = Math.random() < 0.5 ? -50 : game.height + 50;
        }
        return { x, y };
    },

    // 生成BOSS（v2.3.3 第12波, v2.4.0 体型1.5倍）
    spawnBoss() {
        const bossConfig = {
            name: 'BOSS',
            hp: 5000,
            attack: 80,
            attackSpeed: 0.5,
            moveSpeed: 40,
            attackRange: 60,
            exp: 500,
            baseSize: 20,  // v2.4.0 基础体型
            size: 30,      // v2.4.0 1.5倍 = 20*1.5
            color: '#ff0000'
        };

        const pos = this.getRandomSpawnPosition();
        game.enemies.push({
            name: bossConfig.name,
            hp: bossConfig.hp,
            maxHp: bossConfig.hp,
            attack: bossConfig.attack,
            attackSpeed: bossConfig.attackSpeed,
            moveSpeed: bossConfig.moveSpeed,
            attackRange: bossConfig.attackRange,
            exp: bossConfig.exp,
            baseSize: bossConfig.baseSize,
            size: bossConfig.size,
            color: bossConfig.color,
            x: pos.x,
            y: pos.y,
            alive: true,
            lastAttack: 0,
            attackInterval: 1 / bossConfig.attackSpeed,
            // v2.4.0
            displayText: 'BOSS',
            isBoss: true,
            hasAura: true  // v2.4.0 BOSS光效环绕
        });
    }
};
