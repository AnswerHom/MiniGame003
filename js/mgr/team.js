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
    // 初始化队伍
    init() {
        teamData.members = [];
        teamData.formation = TeamConfig.defaultFormation;
        teamData.inBattle = false;
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
        return true;
    },

    // 移除成员
    removeMember(characterName) {
        const index = teamData.members.indexOf(characterName);
        if (index > -1) {
            teamData.members.splice(index, 1);
            return true;
        }
        return false;
    },

    // 调整成员顺序
    reorderMember(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= teamData.members.length) return false;
        if (toIndex < 0 || toIndex >= teamData.members.length) return false;
        
        const member = teamData.members.splice(fromIndex, 1)[0];
        teamData.members.splice(toIndex, 0, member);
        return true;
    },

    // 切换队形
    setFormation(formation) {
        if (FORMATIONS[formation]) {
            teamData.formation = formation;
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
    updateTeamFollow(leaderPlayer) {
        if (!teamData.inBattle || teamData.members.length <= 1) return;

        const leaderPos = { x: leaderPlayer.x, y: leaderPlayer.y };
        
        // 更新非队长成员的跟随位置
        for (let i = 1; i < game.players.length; i++) {
            const targetPos = this.getTargetPosition(leaderPos.x, leaderPos.y, i);
            const member = game.players[i];
            
            // 平滑移动到目标位置
            const dx = targetPos.x - member.x;
            const dy = targetPos.y - member.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 5) {
                const moveSpeed = member.moveSpeed || 70;
                const moveX = (dx / dist) * moveSpeed * 0.1;
                const moveY = (dy / dist) * moveSpeed * 0.1;
                member.x += moveX;
                member.y += moveY;
            }
            
            // 同步转向
            member.direction = leaderPlayer.direction;
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
    }
};
