// ===== 仙剑肉鸽 - 角色系统 =====

// 角色类
class Character {
    constructor(config) {
        this.name = config.name;
        this.role = config.role;
        this.hp = config.hp;
        this.maxHp = config.hp;
        this.attack = config.attack;
        this.attackSpeed = config.attackSpeed;
        this.moveSpeed = config.moveSpeed;
        this.attackRange = config.attackRange;
        this.critRate = config.critRate;
        this.critDamage = config.critDamage;
        this.skills = config.skills || [];
        this.x = 0;
        this.y = 0;
        this.alive = true;
        this.shield = 0;
    }
    
    // 受到伤害
    takeDamage(damage) {
        let finalDamage = damage;
        
        // 护盾吸收
        if (this.shield > 0) {
            if (this.shield >= finalDamage) {
                this.shield -= finalDamage;
                finalDamage = 0;
            } else {
                finalDamage -= this.shield;
                this.shield = 0;
            }
        }
        
        this.hp -= finalDamage;
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
        
        return finalDamage;
    }
    
    // 治疗
    heal(amount) {
        this.hp = Math.min(this.hp + amount, this.maxHp);
    }
    
    // 加护盾
    addShield(amount) {
        this.shield += amount;
    }
}

// 创建角色
function createCharacter(characterName) {
    const config = CHARACTERS[characterName];
    if (!config) return null;
    return new Character(config);
}
