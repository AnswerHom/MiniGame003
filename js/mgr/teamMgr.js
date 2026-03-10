// ===== 仙剑肉鸽 - 队伍系统 =====

// 队伍配置
const TeamConfig = {
    maxMembers: 5,
    minMembers: 1,
    followDistance: 30,  // 相邻角色间距
    defaultFormation: 'column'  // 默认队形：纵列
};

// 队形类型
const FORMATIONS = {
    // 横排：角色一字排开
    row: {
        name: '横排',
        getPositions: (leaderX, leaderY, count) => {
            const positions = [];
            const spacing = TeamConfig.followDistance;
            for (let i = 0; i < count; i++) {
                positions.push({
                    x: leaderX,
                    y: leaderY + (i - (count - 1) / 2) * spacing
                });
            }
            return positions;
        }
    },
    // 纵列：角色排队跟随
    column: {
        name: '纵列',
        getPositions: (leaderX, leaderY, count) => {
            const positions = [];
            const spacing = TeamConfig.followDistance;
            for (let i = 0; i < count; i++) {
                positions.push({
                    x: leaderX + i * spacing,
                    y: leaderY
                });
            }
            return positions;
        }
    }
};

// 队伍数据
let teamData = {
    members: [],           // 队伍成员（角色名）
    formation: 'column',   // 当前队形
    inBattle: false        // 是否在战斗中
};

// 队伍管理器
const TeamManager = {
    // 初始化队伍（入口函数，初始化并加载数据）
    init() {
        teamData.members = [];
        teamData.formation = TeamConfig.defaultFormation;
        teamData.inBattle = false;
        this.load();  // 加载保存的数据
    },

    // 验证并修复队伍成员（只保留已拥有的角色）
    validateMembers(ownedChars) {
        // 过滤掉未拥有的角色
        teamData.members = teamData.members.filter(c => ownedChars.includes(c));
        
        // 如果过滤后队伍为空，添加第一个拥有的角色
        if (teamData.members.length === 0 && ownedChars.length > 0) {
            teamData.members = [ownedChars[0]];
        }
        
        // 队伍人数限制
        if (teamData.members.length > TeamConfig.maxMembers) {
            teamData.members = teamData.members.slice(0, TeamConfig.maxMembers);
        }
        
        this.save();
    },

    // 设置队伍成员列表
    setMembers(members) {
        teamData.members = [...members];
        this.save();
    },

    // 添加成员
    addMember(characterName) {
        if (teamData.members.length >= TeamConfig.maxMembers) {
            console.log('队伍已满');
            return false;
        }
        if (teamData.members.includes(characterName)) {
            console.log('角色已在队伍中');
            return false;
        }
        teamData.members.push(characterName);
        this.save();
        return true;
    },

    // 移除成员
    removeMember(characterName) {
        const index = teamData.members.indexOf(characterName);
        if (index > -1) {
            teamData.members.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    },

    // 切换成员（如果在队伍中则移除，否则添加）
    toggleMember(characterName) {
        if (teamData.members.includes(characterName)) {
            return this.removeMember(characterName);
        } else {
            return this.addMember(characterName);
        }
    },

    // 检查成员是否在队伍中
    hasMember(characterName) {
        return teamData.members.includes(characterName);
    },

    // 调整成员顺序
    reorderMember(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= teamData.members.length) return false;
        if (toIndex < 0 || toIndex >= teamData.members.length) return false;
        
        const member = teamData.members.splice(fromIndex, 1)[0];
        teamData.members.splice(toIndex, 0, member);
        this.save();
        return true;
    },

    // 切换队形
    setFormation(formation) {
        if (FORMATIONS[formation]) {
            teamData.formation = formation;
            this.save();
            return true;
        }
        return false;
    },

    // 获取队伍成员列表
    getMembers() {
        return [...teamData.members];
    },

    // 获取当前队形
    getFormation() {
        return teamData.formation;
    },

    // 获取队伍人数
    getMemberCount() {
        return teamData.members.length;
    },

    // 设置战斗状态
    setInBattle(inBattle) {
        teamData.inBattle = inBattle;
    },

    // 是否在战斗中
    isInBattle() {
        return teamData.inBattle;
    },

    // 获取目标位置（根据队形）
    getTargetPosition(leaderX, leaderY, memberIndex) {
        const positions = FORMATIONS[teamData.formation].getPositions(
            leaderX, leaderY, teamData.members.length
        );
        return positions[memberIndex] || { x: leaderX, y: leaderY };
    },

    // 队伍跟随移动（战斗中的队伍行为）
    // v2.22.0 优化：每个角色跟随前一个角色，形成纵列队形
    updateTeamFollow(leaderPlayer) {
        if (!teamData.inBattle || teamData.members.length <= 1) return;
        
        // v2.22.0 平滑跟随系数
        const followSmoothing = 0.1;
        
        // 第1个角色（队长）由玩家控制，不需要跟随
        // 从第2个角色开始，每个角色跟随前一个角色
        for (let i = 1; i < game.players.length; i++) {
            const leader = game.players[i - 1];  // 前一个角色
            const member = game.players[i];      // 当前角色
            
            if (!leader || !member) continue;
            if (!leader.alive || !member.alive) continue;
            
            // 计算目标位置：在前一个角色后方30px
            const dx = leader.x - member.x;
            const dy = leader.y - member.y;
            const angle = Math.atan2(dy, dx);
            
            const targetX = leader.x - Math.cos(angle) * TeamConfig.followDistance;
            const targetY = leader.y - Math.sin(angle) * TeamConfig.followDistance;
            
            // 平滑移动到目标位置（使用smoothing系数）
            const moveDx = targetX - member.x;
            const moveDy = targetY - member.y;
            const moveDist = Math.sqrt(moveDx * moveDx + moveDy * moveDy);
            
            if (moveDist > 5) {
                member.x += moveDx * followSmoothing;
                member.y += moveDy * followSmoothing;
            }
            
            // 同步转向
            member.direction = leader.direction;
        }
    },

    // 保存队伍数据到本地存储
    save() {
        localStorage.setItem('paladin_team', JSON.stringify(teamData));
    },

    // 从本地存储加载队伍数据
    load() {
        const saved = localStorage.getItem('paladin_team');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                teamData.members = data.members || [];
                teamData.formation = data.formation || 'column';
            } catch (e) {
                console.error('加载队伍数据失败:', e);
            }
        }
    },

    // 重置队伍（进入大厅时调用）
    reset(ownedChars) {
        this.validateMembers(ownedChars);
    },

    // 进入战斗前准备
    prepareForBattle() {
        // 复制队伍数据到 game.team
        game.team = this.getMembers();
    }
};
