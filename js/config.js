// ===== 仙剑肉鸽 - 全局配置 =====

// 画布配置
const CONFIG = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: window.devicePixelRatio || 1
};

// 颜色配置
const COLORS = {
    background: '#0f0f1a',
    ui: {
        primary: '#9f7aea',
        secondary: '#4a5568',
        gold: '#ffd700',
        hp: '#44ff44',
        hpLow: '#ff4444',
        exp: '#4a90d9',
        spirit: '#87ceeb'
    }
};

// 角色属性
const CHARACTERS = {
    李逍遥: {
        name: '李逍遥',
        role: '剑客',
        hp: 800,
        attack: 120,
        attackSpeed: 1.0,
        moveSpeed: 85,
        attackRange: 80,
        critRate: 0.1,
        critDamage: 1.5,
        skills: ['御剑术', '四方剑阵', '万剑护体']
    },
    赵灵儿: {
        name: '赵灵儿',
        role: '药师',
        hp: 600,
        attack: 80,
        attackSpeed: 0.8,
        moveSpeed: 70,
        attackRange: 150,
        critRate: 0.05,
        critDamage: 1.3,
        skills: ['五雷咒', '观音咒', '圣灵复活']
    }
};

// 技能配置
const SKILLS = {
    御剑术: {
        name: '御剑术',
        type: 'attack',
        damagePercent: 1.5,
        range: 200,
        cooldown: 1.5,
        description: '向前方发射一道直线剑气'
    },
    四方剑阵: {
        name: '四方剑阵',
        type: 'attack',
        damagePercent: 0.8,
        range: 120,
        cooldown: 3,
        direction: 4,
        description: '向四个方向发射四道剑气'
    },
    万剑护体: {
        name: '万剑护体',
        type: 'aoe',
        damagePercent: 0.5,
        range: 100,
        cooldown: 30,
        duration: 10,
        description: '剑环绕旋转，敌靠近受伤'
    },
    五雷咒: {
        name: '五雷咒',
        type: 'heal',
        healPercent: 0.8,
        range: 150,
        cooldown: 2,
        description: '治疗范围内队友'
    },
    观音咒: {
        name: '观音咒',
        type: 'shield',
        shieldPercent: 0.2,
        range: 100,
        cooldown: 4,
        description: '为队友套护盾'
    },
    圣灵复活: {
        name: '圣灵复活',
        type: 'revive',
        cooldown: 30,
        description: '复活死亡队友'
    }
};

// 肉鸽卡牌
const CARDS = {
    御剑术: ['锋芒毕露', '分光化影', '定身咒', '万剑齐发'],
    四方剑阵: ['剑荡八荒', '剑阵加强', '迟滞之阵', '幻剑生花'],
    万剑护体: ['剑锋凌厉', '剑域扩张', '剑鸣不绝', '剑气回天'],
    五雷咒: ['雷光普照', '群体治愈', '持续治疗', '雷劫'],
    观音咒: ['金刚护体', '护盾强化', '反射护盾', '水灵护盾'],
    圣灵复活: ['复活祝福', '群体复活', '快速复活', '复活传承']
};
