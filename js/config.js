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
    },
    阿奴: {
        name: '阿奴',
        role: '巫师',
        hp: 600,
        attack: 150,
        attackSpeed: 0.8,
        moveSpeed: 75,
        attackRange: 120,
        critRate: 0.15,
        critDamage: 1.6,
        skills: ['风雪冰天', '雷劫', '阴阳逆转']
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
    },
    风雪冰天: {
        name: '风雪冰天',
        type: 'fan',
        damagePercent: 1.2,
        range: 150,
        fanAngle: 60,
        projectileCount: 5,
        speed: 300,
        cooldown: 2,
        slowDuration: 1,
        slowAmount: 0.3,
        description: '扇形冰锥攻击'
    },
    雷劫: {
        name: '雷劫',
        type: 'ground',
        damagePercent: 1.8,
        radius: 60,
        delay: 0.3,
        cooldown: 3,
        description: '指定区域降下雷电'
    },
    阴阳逆转: {
        name: '阴阳逆转',
        type: 'knockback',
        damagePercent: 1.0,
        radius: 150,
        knockbackDist: 100,
        duration: 0.5,
        cooldown: 25,
        description: '弹开范围内敌人'
    }
};

// 肉鸽卡牌数据
const CARD_DATA = {
    // 李逍遥 - 御剑术卡牌
    '锋芒毕露': { skill: '御剑术', effect: 'damage', value: 0.2, rarity: '普通', desc: '御剑术伤害+20%' },
    '分光化影': { skill: '御剑术', effect: 'projectileCount', value: 1, rarity: '稀有', desc: '御剑术发射数量+1' },
    '定身咒': { skill: '御剑术', effect: 'stun', value: 1, rarity: '稀有', desc: '御剑术命中目标定身1秒' },
    '万剑齐发': { skill: '御剑术', effect: 'spread', value: 3, rarity: '史诗', desc: '御剑术变成散射3道' },
    
    // 李逍遥 - 四方剑阵卡牌
    '剑荡八荒': { skill: '四方剑阵', effect: 'damage', value: 0.3, rarity: '普通', desc: '四方剑阵伤害+30%' },
    '剑阵加强': { skill: '四方剑阵', effect: 'direction', value: 2, rarity: '稀有', desc: '四方剑阵剑数+2' },
    '迟滞之阵': { skill: '四方剑阵', effect: 'slow', value: 0.3, rarity: '稀有', desc: '四方剑阵命中减速30%' },
    '幻剑生花': { skill: '四方剑阵', effect: 'extraDirection', value: 4, rarity: '史诗', desc: '额外向斜45°发射4道' },
    
    // 李逍遥 - 万剑护体卡牌
    '剑锋凌厉': { skill: '万剑护体', effect: 'damage', value: 0.3, rarity: '普通', desc: '万剑护体伤害+30%' },
    '剑域扩张': { skill: '万剑护体', effect: 'range', value: 30, rarity: '稀有', desc: '万剑护体半径+30px' },
    '剑鸣不绝': { skill: '万剑护体', effect: 'duration', value: 5, rarity: '史诗', desc: '持续时间+5秒' },
    '剑气回天': { skill: '万剑护体', effect: 'regen', value: 0.01, rarity: '传说', desc: '期间每秒回复1%生命' },
    
    // 赵灵儿 - 五雷咒卡牌
    '雷光普照': { skill: '五雷咒', effect: 'heal', value: 0.3, rarity: '普通', desc: '治疗量+30%' },
    '群体治愈': { skill: '五雷咒', effect: 'range', value: 0.3, rarity: '稀有', desc: '治疗范围+30%' },
    '持续治疗': { skill: '五雷咒', effect: 'hot', value: 0.3, rarity: '稀有', desc: '额外产生持续恢复' },
    '雷劫': { skill: '五雷咒', effect: 'attack', value: 0.5, rarity: '史诗', desc: '可攻击敌人' },
    
    // 赵灵儿 - 观音咒卡牌
    '金刚护体': { skill: '观音咒', effect: 'shield', value: 0.3, rarity: '普通', desc: '护盾量+30%' },
    '护盾强化': { skill: '观音咒', effect: 'shieldDuration', value: 3, rarity: '普通', desc: '护盾持续时间+3秒' },
    '反射护盾': { skill: '观音咒', effect: 'reflect', value: 0.1, rarity: '稀有', desc: '受到攻击时反弹10%' },
    '水灵护盾': { skill: '观音咒', effect: 'slowOnBreak', value: 0.3, rarity: '稀有', desc: '护盾破碎时减速敌人' },
    
    // 赵灵儿 - 圣灵复活卡牌
    '复活祝福': { skill: '圣灵复活', effect: 'attackSpeed', value: 0.2, rarity: '普通', desc: '复活后攻速+20%' },
    '群体复活': { skill: '圣灵复活', effect: 'reviveCount', value: 1, rarity: '史诗', desc: '可复活2人' },
    '快速复活': { skill: '圣灵复活', effect: 'cooldown', value: -10, rarity: '稀有', desc: '冷却-10秒' },
    '复活传承': { skill: '圣灵复活', effect: 'reviveHp', value: 0.5, rarity: '稀有', desc: '复活时恢复50%生命' },
    
    // 阿奴 - 风雪冰天卡牌
    '寒冰之心': { skill: '风雪冰天', effect: 'damage', value: 0.2, rarity: '普通', desc: '伤害+20%' },
    '冰封千里': { skill: '风雪冰天', effect: 'range', value: 0.3, rarity: '稀有', desc: '扇形范围+30%' },
    '冰晶绽放': { skill: '风雪冰天', effect: 'projectileCount', value: 3, rarity: '史诗', desc: '冰锥数量+3' },
    '绝对零度': { skill: '风雪冰天', effect: 'slow', value: 0.5, rarity: '传说', desc: '减速效果+50%' },
    
    // 阿奴 - 雷劫卡牌
    '天雷罚世': { skill: '雷劫', effect: 'damage', value: 0.3, rarity: '普通', desc: '伤害+30%' },
    '雷云密布': { skill: '雷劫', effect: 'radius', value: 30, rarity: '稀有', desc: '雷电半径+30px' },
    '连锁闪电': { skill: '雷劫', effect: 'chain', value: 2, rarity: '史诗', desc: '闪电连锁2个目标' },
    '雷神降世': { skill: '雷劫', effect: 'double', value: 1, rarity: '传说', desc: '双重雷电' },
    
    // 阿奴 - 阴阳逆转卡牌
    '太极生两仪': { skill: '阴阳逆转', effect: 'damage', value: 0.3, rarity: '普通', desc: '伤害+30%' },
    '阴阳交错': { skill: '阴阳逆转', effect: 'range', value: 50, rarity: '稀有', desc: '范围+50px' },
    '混沌初开': { skill: '阴阳逆转', effect: 'knockback', value: 50, rarity: '史诗', desc: '击退距离+50px' },
    '逆转乾坤': { skill: '阴阳逆转', effect: 'stun', value: 1, rarity: '传说', desc: '击退时眩晕1秒' },
    
    // 通用卡牌
    '身轻如燕': { skill: '通用', effect: 'moveSpeed', value: 10, rarity: '普通', desc: '移动速度+10' },
    '铜筋铁骨': { skill: '通用', effect: 'damageReduction', value: 0.1, rarity: '稀有', desc: '受到的伤害-10%' },
    '暴击强化': { skill: '通用', effect: 'critRate', value: 0.05, rarity: '稀有', desc: '暴击率+5%' },
    '致命一击': { skill: '通用', effect: 'critDamage', value: 0.2, rarity: '史诗', desc: '暴击伤害+20%' },
    
    // 赵灵儿功能类卡牌
    '冰心玉壶': { skill: '功能', effect: 'healAll', value: 0.15, rarity: '稀有', desc: '全队治疗效果+15%' },
    '观音护体': { skill: '功能', effect: 'shieldAll', value: 0.2, rarity: '稀有', desc: '护盾值+20%' },
    '起死回生': { skill: '功能', effect: 'reviveHpAll', value: 0.3, rarity: '史诗', desc: '复活后生命+30%' },
    '灵泉涌现': { skill: '功能', effect: 'healRange', value: 30, rarity: '稀有', desc: '五雷咒范围+30px' }
};

// 卡牌稀有度颜色
const CARD_RARITY_COLORS = {
    '普通': '#44ff44',
    '稀有': '#4a90d9',
    '史诗': '#9400D3',
    '传说': '#ffd700'
};

// 肉鸽卡牌列表（抽卡池）
const CARDS = {
    御剑术: ['锋芒毕露', '分光化影', '定身咒', '万剑齐发'],
    四方剑阵: ['剑荡八荒', '剑阵加强', '迟滞之阵', '幻剑生花'],
    万剑护体: ['剑锋凌厉', '剑域扩张', '剑鸣不绝', '剑气回天'],
    五雷咒: ['雷光普照', '群体治愈', '持续治疗', '雷劫'],
    观音咒: ['金刚护体', '护盾强化', '反射护盾', '水灵护盾'],
    圣灵复活: ['复活祝福', '群体复活', '快速复活', '复活传承'],
    风雪冰天: ['寒冰之心', '冰封千里', '冰晶绽放', '绝对零度'],
    雷劫: ['天雷罚世', '雷云密布', '连锁闪电', '雷神降世'],
    阴阳逆转: ['太极生两仪', '阴阳交错', '混沌初开', '逆转乾坤'],
    通用: ['身轻如燕', '铜筋铁骨', '暴击强化', '致命一击'],
    功能: ['冰心玉壶', '观音护体', '起死回生', '灵泉涌现']
};

// 随机事件数据
const EVENT_DATA = {
    // 增益类事件
    '仙灵祝福': { type: 'buff', effect: 'attack', value: 0.15, duration: 'wave', weight: 8, desc: '全队攻击力+15%', icon: '⚔️' },
    '体力充沛': { type: 'buff', effect: 'moveSpeed', value: 10, duration: 'wave', weight: 8, desc: '全队移动速度+10%', icon: '👟' },
    '铜墙铁壁': { type: 'buff', effect: 'damageReduction', value: 0.15, duration: 'wave', weight: 8, desc: '全队受到的伤害-15%', icon: '🛡️' },
    '鸿运当头': { type: 'buff', effect: 'critRate', value: 0.1, duration: 'wave', weight: 8, desc: '暴击率+10%', icon: '⭐' },
    '灵泉涌现': { type: 'buff', effect: 'regen', value: 0.01, duration: 'wave', weight: 8, desc: '全队每秒回复1%生命', icon: '💚' },
    
    // 资源类事件
    '宝箱奖励': { type: 'resource', effect: 'diamond', value: 50, weight: 10, desc: '获得50钻石', icon: '📦' },
    '金币大礼包': { type: 'resource', effect: 'gold', value: 200, weight: 10, desc: '获得200金币', icon: '💰' },
    '神秘商人': { type: 'resource', effect: 'shop', value: 100, weight: 5, desc: '消耗100金币抽取1张随机卡牌', icon: '🧙' },
    
    // 挑战类事件
    '精英怪突袭': { type: 'challenge', effect: 'eliteSpawn', value: 1, weight: 7, desc: '击杀精英怪获得100金币', icon: '👹' },
    '限时挑战': { type: 'challenge', effect: 'timeChallenge', value: 30, weight: 7, desc: '30秒内击杀10只怪奖励100钻石', icon: '⏱️' },
    '生命考验': { type: 'challenge', effect: 'hpTest', value: 0.2, weight: 6, desc: '扣除20%生命获得50钻石', icon: '💉' },
    
    // 特殊类事件
    '角色召唤': { type: 'special', effect: 'summon', value: 1, weight: 5, desc: '随机召唤1个已有角色', icon: '🎭' },
    '技能强化': { type: 'special', effect: 'skillBuff', value: 0.2, weight: 5, desc: '随机技能冷却-20%', icon: '✨' },
    '休息整顿': { type: 'special', effect: 'fullHeal', value: 1, weight: 5, desc: '清除负面状态，全队回满血', icon: '🏥' }
};

// 事件类型权重
const EVENT_WEIGHTS = {
    buff: 40,
    resource: 25,
    challenge: 20,
    special: 15
};

// 商店数据
const SHOP_DATA = {
    // 钻石商店
    diamondShop: [
        { id: 'd1', name: '钻石礼包1', price: 6, diamonds: 60, icon: '💎' },
        { id: 'd2', name: '钻石礼包2', price: 30, diamonds: 328, icon: '💎' },
        { id: 'd3', name: '钻石礼包3', price: 98, diamonds: 1088, icon: '💎' },
        { id: 'd4', name: '钻石礼包4', price: 198, diamonds: 2288, icon: '💎' },
        { id: 'd5', name: '钻石礼包5', price: 328, diamonds: 3888, icon: '💎' }
    ],
    // 金币商店
    goldShop: [
        { id: 'g1', name: '小金币袋', price: 50, gold: 100, icon: '💰' },
        { id: 'g2', name: '中金币袋', price: 200, gold: 500, icon: '💰' },
        { id: 'g3', name: '大金币袋', price: 500, gold: 1500, icon: '💰' },
        { id: 'g4', name: '金币宝箱', price: 1000, gold: 3000, icon: '📦' }
    ],
    // 道具商店
    itemShop: [
        { id: 'i1', name: '生命药水', price: 50, type: 'heal', value: 0.3, icon: '🧪', desc: '恢复30%生命' },
        { id: 'i2', name: '复活十字', price: 100, type: 'revive', value: 1, icon: '✝️', desc: '复活1个角色' },
        { id: 'i3', name: '经验药水', price: 80, type: 'exp', value: 0.5, icon: '📚', desc: '经验+50%' }
    ]
};

// 商店状态
const shopState = {
    isOpen: false,
    activeTab: 'diamond', // diamond, gold, card, item
    cardRefreshTime: 0,
    cardShop: [],
    purchasedCards: [] // 已购买的卡牌ID
};

// 成就数据
const ACHIEVEMENTS = {
    // 战斗成就
    battle: [
        { id: 'b1', name: '初战告捷', desc: '通关第1波', target: 1, current: 0, reward: 50, icon: '⚔️', type: 'battle', completed: false, claimed: false },
        { id: 'b2', name: '势如破竹', desc: '通关第5波', target: 5, current: 0, reward: 100, icon: '🏹', type: 'battle', completed: false, claimed: false },
        { id: 'b3', name: '无人能挡', desc: '通关第10波', target: 10, current: 0, reward: 200, icon: '🗡️', type: 'battle', completed: false, claimed: false },
        { id: 'b4', name: '坚持不懈', desc: '通关第20波', target: 20, current: 0, reward: 500, icon: '🛡️', type: 'battle', completed: false, claimed: false },
        { id: 'b5', name: '存活大师', desc: '单次战斗存活30分钟', target: 1800, current: 0, reward: 300, icon: '⏰', type: 'battle', completed: false, claimed: false }
    ],
    // 收集成就
    collect: [
        { id: 'c1', name: '初次抽卡', desc: '首次进行抽卡', target: 1, current: 0, reward: 20, icon: '🎴', type: 'collect', completed: false, claimed: false },
        { id: 'c2', name: '角色收集者', desc: '拥有全部3个角色', target: 3, current: 0, reward: 300, icon: '👥', type: 'collect', completed: false, claimed: false },
        { id: 'c3', name: '卡牌大师', desc: '拥有20张不同卡牌', target: 20, current: 0, reward: 200, icon: '🃏', type: 'collect', completed: false, claimed: false },
        { id: 'c4', name: '欧皇附体', desc: '抽到传说卡牌', target: 1, current: 0, reward: 100, icon: '🌟', type: 'collect', completed: false, claimed: false }
    ],
    // 战斗技巧成就
    skill: [
        { id: 's1', name: '击杀之王', desc: '单波击杀30只怪物', target: 30, current: 0, reward: 100, icon: '💀', type: 'skill', completed: false, claimed: false },
        { id: 's2', name: '无伤通关', desc: '通关时全部满血', target: 1, current: 0, reward: 150, icon: '💖', type: 'skill', completed: false, claimed: false },
        { id: 's3', name: '暴击达人', desc: '单次战斗暴击50次', target: 50, current: 0, reward: 80, icon: '💥', type: 'skill', completed: false, claimed: false },
        { id: 's4', name: '技能大师', desc: '单次战斗使用技能100次', target: 100, current: 0, reward: 100, icon: '✨', type: 'skill', completed: false, claimed: false }
    ],
    // 资源成就
    resource: [
        { id: 'r1', name: '小康之家', desc: '累计拥有500钻石', target: 500, current: 0, reward: 50, icon: '💰', type: 'resource', completed: false, claimed: false },
        { id: 'r2', name: '富甲一方', desc: '累计拥有5000钻石', target: 5000, current: 0, reward: 200, icon: '🏦', type: 'resource', completed: false, claimed: false },
        { id: 'r3', name: '钻石王老五', desc: '累计拥有20000钻石', target: 20000, current: 0, reward: 500, icon: '👑', type: 'resource', completed: false, claimed: false }
    ]
};

// 成就状态
const achievementState = {
    isOpen: false,
    activeTab: 'all',
    achievements: JSON.parse(JSON.stringify(ACHIEVEMENTS)), // 深拷贝
    stats: {
        totalDiamondEarned: 0,
        totalKills: 0,
        totalCrits: 0,
        totalSkillsUsed: 0,
        maxWave: 0,
        survivedTime: 0,
        waveKills: 0
    }
};

// BOSS数据
const BOSS_DATA = {
    毒娘子: {
        name: '毒娘子',
        hp: 5000,
        attack: 80,
        moveSpeed: 30,
        attackRange: 200,
        attackInterval: 1.5,
        size: 40,
        color: '#32CD32',
        // 技能
        skill1: {
            name: '毒液喷射',
            type: 'fan',
            damage: 60,
            range: 180,
            fanAngle: 60,
            cooldown: 5
        },
        // 特殊能力
        summonInterval: 10,
        summonCount: 3,
        enragedThreshold: 0.3,
        enragedMultiplier: 1.5,
        // 弱点
        weakPoint: '头部',
        weakPointBonus: 0.3
    },
    赤鬼王: {
        name: '赤鬼王',
        hp: 8000,
        attack: 120,
        moveSpeed: 25,
        attackRange: 150,
        attackInterval: 2,
        size: 50,
        color: '#FF4500',
        // 技能
        skill1: {
            name: '地面冲击',
            type: 'circle',
            damage: 80,
            radius: 100,
            cooldown: 4
        },
        skill2: {
            name: '岩石投掷',
            type: 'projectile',
            damage: 100,
            speed: 200,
            cooldown: 3
        },
        // 特殊能力
        earthquakeInterval: 15,
        earthquakeDamage: 50,
        immuneFromFront: true,
        // 弱点
        weakPoint: '背部',
        weakPointBonus: 0.5
    },
    拜月教主: {
        name: '拜月教主',
        hp: 15000,
        attack: 150,
        moveSpeed: 20,
        attackRange: 250,
        attackInterval: 1,
        size: 60,
        color: '#8B008B',
        // 技能
        skill1: {
            name: '魔法弹',
            type: 'multiProjectile',
            damage: 80,
            count: 5,
            speed: 150,
            cooldown: 3
        },
        skill2: {
            name: '暗黑漩涡',
            type: 'suction',
            damage: 30,
            radius: 150,
            duration: 5,
            cooldown: 8
        },
        skill3: {
            name: '召唤雷电',
            type: 'lightning',
            damage: 120,
            radius: 50,
            cooldown: 4
        },
        // 特殊能力
        invincibleInterval: 20,
        invincibleDuration: 3,
        summonInterval: 12,
        // 弱点
        weakPoint: '胸口水晶',
        weakPointBonus: 0.3
    }
};
