// ===== 仙剑肉鸽 - 技能系统 =====

// 技能管理器
const SkillManager = {
    // 使用技能
    useSkill(skillName, caster, targets) {
        const skill = SKILLS[skillName];
        if (!skill) return;
        
        switch (skill.type) {
            case 'attack':
            case 'aoe':
            case 'meteors':
                this.useAttackSkill(skill, caster, targets);
                break;
            case 'fan':
                this.useFanSkill(skill, caster, targets);
                break;
            case 'ground':
                this.useGroundSkill(skill, caster, targets);
                break;
            case 'knockback':
                this.useKnockbackSkill(skill, caster, targets);
                break;
            case 'heal':
                this.useHealSkill(skill, caster, targets);
                break;
            case 'shield':
                this.useShieldSkill(skill, caster, targets);
                break;
            case 'revive':
                this.useReviveSkill(skill, caster, targets);
                break;
        }
    },
    
    // 攻击技能
    useAttackSkill(skill, caster, targets) {
        // v2.20.0 获取该技能对应的卡牌效果
        const skillEffects = (caster.cardEffects && caster.cardEffects[skill.name]) || {};
        
        // 应用卡牌伤害加成
        const cardBonus = skillEffects.damageBonus || 0;
        const damage = caster.attack * skill.damagePercent * (1 + cardBonus);
        
        // v2.20.0 应用卡牌投射物数量和散射效果
        const cardProjectileCount = skillEffects.projectileCount || 0;
        const cardSpread = skillEffects.spread || 0;
        
        // v2.19.0 判断技能类型
        const isLiXiaoyao = caster.name === '李逍遥';
        const isHoming = skill.type === 'homing';  // 御剑术追踪
        const isMeteors = skill.type === 'meteors';  // v2.27.0 万剑诀
        
        // v2.20.0 应用卡牌范围加成
        const cardRange = skillEffects.range || 0;
        const range = skill.range * (1 + cardRange);
        
        // v2.20.0 应用卡牌穿透加成
        const cardPierce = skillEffects.pierce || 0;
        
        // v2.20.0 应用卡牌定身效果
        const cardStun = skillEffects.stun || 0;
        
        // v2.27.0 万剑诀：5把飞剑斜向下砸
        if (isMeteors) {
            if (!targets || targets.length === 0) return;
            
            const target = targets[0];
            const meteorCount = (skill.meteorCount || 5) + cardProjectileCount;
            const meteorRange = range;
            // 目标位置
            const targetX = target.x;
            const targetY = target.y;
            
            // v2.28.0 万剑诀必定命中：获取范围内的所有敌人
            const lockedEnemies = [];
            const aoeRange = 150;  // 范围
            game.enemies.forEach(e => {
                if (!e.alive) return;
                const dx = e.x - targetX;
                const dy = e.y - targetY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < aoeRange) {
                    lockedEnemies.push(e);
                }
            });
            
            // 生成多把飞剑，从上方砸向目标
            for (let i = 0; i < meteorCount; i++) {
                // 计算飞剑的起始位置（在目标上方随机分布）
                const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5; // 斜向下
                const startX = targetX + (Math.random() - 0.5) * meteorRange * 2;
                const startY = targetY - 200 - Math.random() * 100;
                
                // 飞剑速度（向下砸）
                const speed = 600;
                const vx = (targetX - startX) / 0.5 * 0.3;
                const vy = speed;
                
                // v2.27.0 创建陨石/飞剑效果
                // v2.28.0 万剑诀必定命中：传递锁定的敌人列表
                createMeteorProjectile(caster, startX, startY, vx, vy, damage, range, {
                    isSword: true,
                    isGold: true,
                    length: 50,
                    width: 12,
                    swordColor: '#FFD700',
                    isMeteor: true,
                    stunDuration: cardStun,
                    slowDuration: skillEffects.slow ? 3 : 0,
                    slowAmount: skillEffects.slow || 0,
                    canPassObstacle: true,  // v2.28.0 万剑诀无视障碍物
                    lockedEnemies: lockedEnemies  // v2.28.0 万剑诀必定命中
                });
            }
            return;
        }
        
        // 单体攻击或散射
        const target = targets[0];
        if (target) {
            const dx = target.x - caster.x;
            const dy = target.y - caster.y;
            const baseAngle = Math.atan2(dy, dx);
            
            // v2.24.0 分光化影：同一方向连续发射，纵向间距，依次间隔发射
            if (cardProjectileCount > 0) {
                const totalProjectiles = cardProjectileCount + 1;
                const offsetDistance = 30;  // 纵向间距30px
                
                for (let i = 0; i < totalProjectiles; i++) {
                    // 计算纵向偏移：后续飞剑在前一把后方
                    const longitOffset = i * offsetDistance;
                    
                    // 在发射方向后方的偏移
                    const startX = caster.x - Math.cos(baseAngle) * longitOffset;
                    const startY = caster.y - Math.sin(baseAngle) * longitOffset;
                    
                    // v2.24.0 连续发射，间隔0.1秒
                    setTimeout(() => {
                        createProjectileAt(caster, startX, startY, baseAngle, damage, range, {
                            isSword: isLiXiaoyao || isHoming,
                            isGold: isHoming,
                            length: 60,
                            width: 10,
                            swordColor: isHoming ? '#FFD700' : '#3182ce',
                            isHoming: isHoming,
                            pierce: cardPierce,
                            maxPierce: isHoming ? 5 : 0,  // v2.25.0 御剑术最多穿透5个目标
                            stunDuration: cardStun,
                            canPassObstacle: isHoming
                        });
                    }, i * 100);  // 100ms = 0.1秒
                }
            }
            // v2.20.0 散射效果：角度分散
            else if (cardSpread > 0) {
                const spreadCount = cardSpread + 2;
                const spreadAngle = 0.3; // 散射角度弧度
                
                for (let i = 0; i < spreadCount; i++) {
                    const angleOffset = (i - (spreadCount - 1) / 2) * spreadAngle;
                    const angle = baseAngle + angleOffset;
                    
                    createProjectile(caster, angle, damage, range, {
                        isSword: isLiXiaoyao || isHoming,
                        isGold: isHoming,
                        length: 60,
                        width: 10,
                        swordColor: isHoming ? '#FFD700' : '#3182ce',
                        isHoming: isHoming,
                        pierce: cardPierce,
                        maxPierce: isHoming ? 5 : 0,  // v2.25.0 御剑术最多穿透5个目标
                        stunDuration: cardStun,
                        canPassObstacle: isHoming
                    });
                }
            } else {
                // v2.19.0 御剑术：金色剑、追踪
                const isGoldSword = isHoming;
                
                createProjectile(caster, baseAngle, damage, range, {
                    isSword: isLiXiaoyao || isHoming,
                    isGold: isGoldSword,
                    length: 60,
                    width: 10,
                    swordColor: isGoldSword ? '#FFD700' : '#3182ce',
                    isHoming: isHoming,
                    pierce: cardPierce,
                    maxPierce: isHoming ? 5 : 0,  // v2.25.0 御剑术最多穿透5个目标
                    stunDuration: cardStun,
                    canPassObstacle: isHoming
                });
            }
        }
    },
    
    // 扇形攻击技能（风雪冰天）
    useFanSkill(skill, caster, targets) {
        // v2.20.0 获取该技能对应的卡牌效果
        const skillEffects = (caster.cardEffects && caster.cardEffects[skill.name]) || {};
        
        // 应用卡牌伤害加成
        const cardBonus = skillEffects.damageBonus || 0;
        const damage = caster.attack * skill.damagePercent * (1 + cardBonus);
        
        const fanAngle = skill.fanAngle * Math.PI / 180; // 转换为弧度
        
        // 找到目标方向
        let targetAngle = 0;
        if (targets[0]) {
            const dx = targets[0].x - caster.x;
            const dy = targets[0].y - caster.y;
            targetAngle = Math.atan2(dy, dx);
        }
        
        // 发射扇形冰锥
        for (let i = 0; i < skill.projectileCount; i++) {
            // 计算每个冰锥的角度（均匀分布在扇形区域内）
            const spread = fanAngle / (skill.projectileCount - 1);
            const angle = targetAngle - fanAngle / 2 + spread * i;
            
            createIceProjectile(caster, angle, damage, skill.range, skill.speed, skill.slowDuration, skill.slowAmount);
        }
    },
    
    // 区域降落技能（雷劫）
    useGroundSkill(skill, caster, targets) {
        const damage = caster.attack * skill.damagePercent;
        
        // 目标位置（默认目标位置，如果没有目标则使用 caster 位置）
        let targetX = caster.x;
        let targetY = caster.y;
        
        if (targets[0]) {
            targetX = targets[0].x;
            targetY = targets[0].y;
        }
        
        // 添加延迟雷电效果
        game.effects.push({
            type: 'lightning',
            x: targetX,
            y: targetY,
            radius: skill.radius,
            damage: damage,
            delay: skill.delay,
            life: skill.delay + 0.5,
            caster: caster
        });
    },
    
    // 击退技能（阴阳逆转）
    useKnockbackSkill(skill, caster, targets) {
        const damage = caster.attack * skill.damagePercent;
        
        // 对范围内所有敌人造成伤害和击退
        game.enemies.forEach(enemy => {
            if (!enemy.alive) return;
            
            const dx = enemy.x - caster.x;
            const dy = enemy.y - caster.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist <= skill.radius) {
                // 造成伤害
                enemy.hp -= damage;
                // v2.13.0 伤害飘字 - 无论敌人是否死亡都显示
                addFloatingText(enemy.x, enemy.y - 20, Math.floor(damage), '#fff', 14);
                if (enemy.hp <= 0) {
                    enemy.alive = false;
                    game.gold += enemy.exp;
                }
                
                // 击退效果
                if (dist > 0) {
                    enemy.x += (dx / dist) * skill.knockbackDist;
                    enemy.y += (dy / dist) * skill.knockbackDist;
                }
            }
        });
        
        // 添加特效
        game.effects.push({
            type: 'yinYang',
            x: caster.x,
            y: caster.y,
            radius: skill.radius,
            life: skill.duration
        });
    },
    
    // 治疗技能 - 只治疗范围内的队友
    useHealSkill(skill, caster, targets) {
        // v2.20.0 获取该技能对应的卡牌效果
        const skillEffects = (caster.cardEffects && caster.cardEffects[skill.name]) || {};
        
        // 应用卡牌治疗加成
        const healBonus = skillEffects.healBonus || 0;
        const baseHeal = caster.attack * skill.healPercent;
        const healAmount = baseHeal * (1 + healBonus);
        
        // 筛选范围内的队友
        const inRangeTargets = targets.filter(target => {
            if (!target.alive) return false;
            const dx = target.x - caster.x;
            const dy = target.y - caster.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist <= skill.range;
        });
        
        inRangeTargets.forEach(target => {
            target.heal(healAmount);
            // 添加治疗特效
            game.effects.push({
                type: 'heal',
                x: target.x,
                y: target.y,
                value: healAmount,
                life: 1
            });
        });
    },
    
    // 护盾技能 - 只给范围内的队友套护盾
    useShieldSkill(skill, caster, targets) {
        // v2.20.0 获取该技能对应的卡牌效果
        const skillEffects = (caster.cardEffects && caster.cardEffects[skill.name]) || {};
        
        // 应用卡牌护盾加成
        const shieldBonus = skillEffects.shieldBonus || 0;
        const baseShield = caster.maxHp * skill.shieldPercent;
        const shieldAmount = baseShield * (1 + shieldBonus);
        
        // 筛选范围内的队友
        const inRangeTargets = targets.filter(target => {
            if (!target.alive) return false;
            const dx = target.x - caster.x;
            const dy = target.y - caster.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist <= skill.range;
        });
        
        inRangeTargets.forEach(target => {
            target.addShield(shieldAmount);
            // 添加护盾特效
            game.effects.push({
                type: 'shield',
                x: target.x,
                y: target.y,
                value: shieldAmount,
                life: 1
            });
        });
    },
    
    // 复活技能 - 复活死亡队友
    useReviveSkill(skill, caster, targets) {
        // 复活第一个死亡队友
        const deadTarget = targets.find(t => !t.alive);
        if (deadTarget) {
            deadTarget.alive = true;
            deadTarget.hp = Math.floor(deadTarget.maxHp * 0.5);
            deadTarget.shield = 0;
            // 添加复活特效
            game.effects.push({
                type: 'revive',
                x: deadTarget.x,
                y: deadTarget.y,
                life: 1
            });
        }
    }
};

// 创建投射物
function createProjectile(caster, angle, damage, range, options = {}) {
    const speed = 400;
    const life = range / speed;
    
    // 李逍遥的技能使用剑形投射物
    const isLiXiaoyao = caster.name === '李逍遥';
    
    game.projectiles.push({
        x: caster.x,
        y: caster.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: damage,
        isCrit: Math.random() < caster.critRate,
        life: life,
        range: range,
        type: isLiXiaoyao ? 'sword' : 'normal',
        angle: angle,
        // 飞剑属性
        isSword: isLiXiaoyao || options.isSword || false,
        isGold: options.isGold || false,
        length: options.length || 30,
        width: options.width || 8,
        // v2.25.1 御剑术穿透记录
        hitEnemies: [],
        swordColor: options.swordColor || '#3182ce',  // v2.5.0 剑颜色
        // v2.20.0 卡牌效果
        pierce: options.pierce || 0,
        stunDuration: options.stunDuration || 0
    });
}

// v2.23.0 创建投射物（指定起始位置，用于分光化影效果）
function createProjectileAt(caster, startX, startY, angle, damage, range, options = {}) {
    const speed = 400;
    const life = range / speed;
    
    const isLiXiaoyao = caster.name === '李逍遥';
    
    game.projectiles.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: damage,
        isCrit: Math.random() < caster.critRate,
        life: life,
        range: range,
        type: isLiXiaoyao ? 'sword' : 'normal',
        angle: angle,
        isSword: isLiXiaoyao || options.isSword || false,
        isGold: options.isGold || false,
        length: options.length || 30,
        width: options.width || 8,
        swordColor: options.swordColor || '#3182ce',
        pierce: options.pierce || 0,
        stunDuration: options.stunDuration || 0,
        canPassObstacle: options.canPassObstacle || false,
        // v2.25.1 御剑术穿透记录
        hitEnemies: [],
    });
}

// v2.27.0 创建万剑诀陨石/飞剑投射物
function createMeteorProjectile(caster, startX, startY, vx, vy, damage, range, options = {}) {
    const speed = Math.sqrt(vx * vx + vy * vy);
    const life = range / speed;
    
    game.projectiles.push({
        x: startX,
        y: startY,
        vx: vx,
        vy: vy,
        damage: damage,
        isCrit: Math.random() < caster.critRate,
        life: life,
        range: range,
        type: 'meteor',
        angle: Math.atan2(vy, vx),
        isSword: options.isSword || false,
        isGold: options.isGold || false,
        length: options.length || 50,
        width: options.width || 12,
        swordColor: options.swordColor || '#FFD700',
        // v2.27.0 万剑诀属性
        isMeteor: true,
        stunDuration: options.stunDuration || 0,
        slowDuration: options.slowDuration || 0,
        slowAmount: options.slowAmount || 0,
        // v2.28.0 万剑诀必定命中：锁定的敌人列表
        lockedEnemies: options.lockedEnemies || [],
        hitEnemies: []
    });
}

// 创建冰锥投射物（带减速效果）
function createIceProjectile(caster, angle, damage, range, speed, slowDuration, slowAmount) {
    const life = range / speed;
    
    game.projectiles.push({
        x: caster.x,
        y: caster.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: damage,
        isCrit: Math.random() < caster.critRate,
        life: life,
        range: range,
        type: 'ice',
        slowDuration: slowDuration,
        slowAmount: slowAmount
    });
}
