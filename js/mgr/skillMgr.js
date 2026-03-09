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
        const damage = caster.attack * skill.damagePercent;
        
        // v2.19.0 判断技能类型
        const isLiXiaoyao = caster.name === '李逍遥';
        const isHoming = skill.type === 'homing';  // 御剑术追踪
        
        if (skill.direction) {
            // 多方向攻击（四方剑阵）
            for (let i = 0; i < skill.direction; i++) {
                const angle = (Math.PI * 2 / skill.direction) * i;
                createProjectile(caster, angle, damage, skill.range, {
                    isSword: isLiXiaoyao,
                    isGold: false,
                    length: 60,
                    width: 10,
                    swordColor: '#3182ce'
                });
            }
        } else {
            // 单体攻击
            const target = targets[0];
            if (target) {
                const dx = target.x - caster.x;
                const dy = target.y - caster.y;
                const angle = Math.atan2(dy, dx);
                
                // v2.19.0 御剑术：金色剑、追踪
                const isGoldSword = isHoming;
                
                createProjectile(caster, angle, damage, skill.range, {
                    isSword: isLiXiaoyao || isHoming,
                    isGold: isGoldSword,
                    length: 60,
                    width: 10,
                    swordColor: isGoldSword ? '#FFD700' : '#3182ce',  // 金色
                    isHoming: isHoming  // 添加追踪标记
                });
            }
        }
    },
    
    // 扇形攻击技能（风雪冰天）
    useFanSkill(skill, caster, targets) {
        const damage = caster.attack * skill.damagePercent;
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
        const healAmount = caster.attack * skill.healPercent;
        
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
        const shieldAmount = caster.maxHp * skill.shieldPercent;
        
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
        swordColor: options.swordColor || '#3182ce'  // v2.5.0 剑颜色
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
