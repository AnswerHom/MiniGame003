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
        
        if (skill.direction) {
            // 多方向攻击
            for (let i = 0; i < skill.direction; i++) {
                const angle = (Math.PI * 2 / skill.direction) * i;
                createProjectile(caster, angle, damage, skill.range);
            }
        } else {
            // 单体攻击
            const target = targets[0];
            if (target) {
                const dx = target.x - caster.x;
                const dy = target.y - caster.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);
                createProjectile(caster, angle, damage, skill.range);
            }
        }
    },
    
    // 治疗技能
    useHealSkill(skill, caster, targets) {
        const healAmount = caster.attack * skill.healPercent;
        
        targets.forEach(target => {
            if (target.alive) {
                target.heal(healAmount);
            }
        });
    },
    
    // 护盾技能
    useShieldSkill(skill, caster, targets) {
        const shieldAmount = caster.maxHp * skill.shieldPercent;
        
        targets.forEach(target => {
            if (target.alive) {
                target.addShield(shieldAmount);
            }
        });
    },
    
    // 复活技能
    useReviveSkill(skill, caster, targets) {
        // 复活第一个死亡队友
        const deadTarget = targets.find(t => !t.alive);
        if (deadTarget) {
            deadTarget.alive = true;
            deadTarget.hp = Math.floor(deadTarget.maxHp * 0.5);
        }
    }
};

// 创建投射物
function createProjectile(caster, angle, damage, range) {
    const speed = 400;
    const life = range / speed;
    
    game.projectiles.push({
        x: caster.x,
        y: caster.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: damage,
        isCrit: Math.random() < caster.critRate,
        life: life,
        range: range
    });
}
