// 全局变量
let players = [];
let teams = [];
let laneAssignments = {};
let selectedHeroes = {};
let heroConfig = {};

// DOM元素
const playerList = document.getElementById('playerList');
const totalPlayersSpan = document.getElementById('totalPlayers');
const maleCountSpan = document.getElementById('maleCount');
const femaleCountSpan = document.getElementById('femaleCount');

const assignTeamsBtn = document.getElementById('assignTeamsBtn');
const teamGrid = document.getElementById('teamGrid');

const assignLanesBtn = document.getElementById('assignLanesBtn');
const laneGrid = document.getElementById('laneGrid');

const selectHeroesBtn = document.getElementById('selectHeroesBtn');
const heroGrid = document.getElementById('heroGrid');

const resetBtn = document.getElementById('resetBtn');
const resultsGrid = document.getElementById('resultsGrid');

const loading = document.getElementById('loading');
const error = document.getElementById('error');
const success = document.getElementById('success');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

const host = ''; // 'http://localhost:3000'; // 本地调试

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    loadHeroConfig();
    loadPlayers();
    updatePlayerStats();
    setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
    assignTeamsBtn.addEventListener('click', assignTeams);
    assignLanesBtn.addEventListener('click', assignLanes);
    selectHeroesBtn.addEventListener('click', startHeroSelection);
    resetBtn.addEventListener('click', resetAll);
}

// 加载英雄配置
async function loadHeroConfig() {
    try {
        showLoading();
        const response = await fetch(`${host}/api/admin/hero-config`);
        if (response.ok) {
            heroConfig = await response.json();
        } else {
            // 如果配置不存在，使用默认配置
            heroConfig = getDefaultHeroConfig();
        }
    } catch (err) {
        console.error('加载英雄配置失败:', err);
        heroConfig = getDefaultHeroConfig();
    } finally {
        hideLoading();
    }
}

// 加载玩家数据
async function loadPlayers() {
    try {
        const response = await fetch(`${host}/api/players`);
        if (response.ok) {
            players = await response.json();
            updatePlayerList();
            updatePlayerStats();
        }
    } catch (err) {
        console.error('加载玩家数据失败:', err);
    }
}

// 获取默认英雄配置
function getDefaultHeroConfig() {
    return {
        top: ['亚瑟', '吕布', '关羽', '张飞', '典韦', '程咬金', '钟馗', '李信', '花木兰', '铠'],
        jungle: ['李白', '韩信', '赵云', '兰陵王', '娜可露露', '阿轲', '百里玄策', '云中君', '镜', '澜'],
        mid: ['妲己', '安琪拉', '王昭君', '貂蝉', '小乔', '甄姬', '杨玉环', '上官婉儿', '西施', '嫦娥'],
        bot: ['后羿', '鲁班七号', '孙尚香', '虞姬', '黄忠', '马可波罗', '公孙离', '伽罗', '蒙犽', '艾琳'],
        support: ['蔡文姬', '大乔', '小乔', '孙膑', '庄周', '张飞', '牛魔', '鬼谷子', '太乙真人', '鲁班大师']
    };
}



// 更新玩家列表
function updatePlayerList() {
    playerList.innerHTML = '';
    
    players.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        playerCard.innerHTML = `
            <div class="player-header">
                <div class="player-info">
                    <div class="player-name">${player.name}</div>
                    <div class="player-gender ${player.gender}">${player.gender === 'male' ? '男' : '女'}</div>
                </div>
            </div>
            ${player.lane ? `<div class="player-lane">${getLaneDisplayName(player.lane)}</div>` : ''}
        `;
        playerList.appendChild(playerCard);
    });
}

// 更新玩家统计
function updatePlayerStats() {
    totalPlayersSpan.textContent = players.length;
    maleCountSpan.textContent = players.filter(p => p.gender === 'male').length;
    femaleCountSpan.textContent = players.filter(p => p.gender === 'female').length;
}



// 分配团队
async function assignTeams() {
    if (players.length !== 10) {
        showError('需要10名玩家才能分配团队');
        return;
    }
    
    try {
        showLoading();
        const response = await fetch(`${host}/api/teams/assign`, {
            method: 'POST'
        });
        
        if (response.ok) {
            teams = await response.json();
            displayTeams();
            showSuccess('团队分配成功');
        } else {
            const error = await response.json();
            console.error('团队分配失败:', error);
            showError(error.message || '团队分配失败');
        }
    } catch (err) {
        console.error('团队分配失败:', err);
        showError('网络错误，请重试');
    } finally {
        hideLoading();
    }
}

// 显示团队
function displayTeams() {
    teamGrid.style.display = 'grid';
    teamGrid.innerHTML = '';
    
    teams.forEach((team, index) => {
        const teamCard = document.createElement('div');
        teamCard.className = 'team-card';
        
        const maleCount = team.players.filter(p => p.gender === 'male').length;
        const femaleCount = team.players.filter(p => p.gender === 'female').length;
        
        teamCard.innerHTML = `
            <div class="team-header">
                <div class="team-name">${index === 0 ? '蓝队' : '红队'} (${team.players.length}人)</div>
                <div class="team-stats">
                    <span>男: ${maleCount}</span>
                    <span>女: ${femaleCount}</span>
                </div>
            </div>
            <div class="team-members">
                ${team.players.map(player => `
                    <div class="team-member">
                        <div class="member-info">
                            <div class="member-name">${player.name}</div>
                            <div class="member-gender">${player.gender === 'male' ? '男' : '女'}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        teamGrid.appendChild(teamCard);
    });
}

// 分配分路
async function assignLanes() {
    if (players.length !== 10) {
        showError('需要10名玩家才能分配分路');
        return;
    }
    
    try {
        showLoading();
        const response = await fetch(`${host}/api/lanes/assign`);
        
        if (response.ok) {
            laneAssignments = await response.json();
            displayLanes();
            showSuccess('分路分配成功');
        } else {
            const error = await response.json();
            console.error('分路分配失败:', error);
            showError(error.message || '分路分配失败');
        }
    } catch (err) {
        console.error('分路分配失败:', err);
        showError('网络错误，请重试');
    } finally {
        hideLoading();
    }
}

// 显示分路
function displayLanes() {
    laneGrid.style.display = 'grid';
    laneGrid.innerHTML = '';
    
    const lanes = ['top', 'jungle', 'mid', 'bot', 'support'];
    const laneNames = ['上路', '打野', '中路', '下路', '辅助'];
    
    lanes.forEach((lane, index) => {
        const player = players.find(p => laneAssignments[p.id] === lane);
        if (player) {
            const laneCard = document.createElement('div');
            laneCard.className = 'player-card';
            laneCard.innerHTML = `
                <div class="player-header">
                    <div class="player-info">
                        <div class="player-name">${player.name}</div>
                        <div class="player-gender ${player.gender}">${player.gender === 'male' ? '男' : '女'}</div>
                    </div>
                </div>
                <div class="player-lane">${laneNames[index]}</div>
            `;
            laneGrid.appendChild(laneCard);
        }
    });
}

// 开始英雄选择
function startHeroSelection() {
    if (Object.keys(laneAssignments).length === 0) {
        showError('请先分配分路');
        return;
    }
    
    displayHeroSelection();
}

// 显示英雄选择
function displayHeroSelection() {
    heroGrid.style.display = 'grid';
    heroGrid.innerHTML = '';
    
    players.forEach(player => {
        const lane = laneAssignments[player.id];
        const laneHeroes = heroConfig[lane] || [];
        
        const playerSection = document.createElement('div');
        playerSection.className = 'player-card';
        playerSection.innerHTML = `
            <div class="player-header">
                <div class="player-info">
                    <div class="player-name">${player.name}</div>
                    <div class="player-lane">${getLaneDisplayName(lane)}</div>
                </div>
            </div>
            <div class="hero-grid" style="grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));">
                ${laneHeroes.map(hero => `
                    <div class="hero-card" onclick="selectHero('${player.id}', '${hero}')">
                        <div class="hero-avatar">${hero.charAt(0)}</div>
                        <div class="hero-name">${hero}</div>
                        <div class="hero-type">${getLaneDisplayName(lane)}</div>
                    </div>
                `).join('')}
            </div>
        `;
        heroGrid.appendChild(playerSection);
    });
}

// 选择英雄
async function selectHero(playerId, heroName) {
    try {
        showLoading();
        const response = await fetch(`${host}/api/heroes/select`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ playerId, heroName })
        });
        
        if (response.ok) {
            selectedHeroes[playerId] = heroName;
            displayResults();
            showSuccess('英雄选择成功');
        } else {
            const error = await response.json();
            showError(error.message || '英雄选择失败');
        }
    } catch (err) {
        console.error('英雄选择失败:', err);
        showError('网络错误，请重试');
    } finally {
        hideLoading();
    }
}

// 显示结果
function displayResults() {
    resultsGrid.style.display = 'grid';
    resultsGrid.innerHTML = '';
    
    players.forEach(player => {
        const lane = laneAssignments[player.id];
        const hero = selectedHeroes[player.id];
        
        if (lane && hero) {
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            resultCard.innerHTML = `
                <div class="result-header">
                    <div class="result-player">${player.name}</div>
                    <div class="result-lane">${getLaneDisplayName(lane)}</div>
                </div>
                <div class="result-hero">
                    <div class="result-hero-avatar">${hero.charAt(0)}</div>
                    <div class="result-hero-info">
                        <div class="result-hero-name">${hero}</div>
                        <div class="result-hero-type">${getLaneDisplayName(lane)}</div>
                    </div>
                </div>
            `;
            resultsGrid.appendChild(resultCard);
        }
    });
}

// 重新开始
async function resetAll() {
    try {
        showLoading();
        const response = await fetch(`${host}/api/reset`, {
            method: 'POST'
        });
        
        if (response.ok) {
            teams = [];
            laneAssignments = {};
            selectedHeroes = {};
            
            teamGrid.style.display = 'none';
            laneGrid.style.display = 'none';
            heroGrid.style.display = 'none';
            resultsGrid.style.display = 'none';
            
            showSuccess('已重置比赛数据');
        } else {
            const error = await response.json();
            showError(error.message || '重置失败');
        }
    } catch (err) {
        console.error('重置失败:', err);
        showError('网络错误，请重试');
    } finally {
        hideLoading();
    }
}

// 获取分路显示名称
function getLaneDisplayName(lane) {
    const laneNames = {
        'top': '上路',
        'jungle': '打野',
        'mid': '中路',
        'bot': '下路',
        'support': '辅助'
    };
    return laneNames[lane] || lane;
}

// 显示加载
function showLoading() {
    loading.style.display = 'flex';
}

// 隐藏加载
function hideLoading() {
    loading.style.display = 'none';
}

// 显示错误
function showError(message) {
    errorMessage.textContent = message;
    error.style.display = 'block';
    setTimeout(() => {
        error.style.display = 'none';
    }, 3000);
}

// 显示成功
function showSuccess(message) {
    successMessage.textContent = message;
    success.style.display = 'block';
    setTimeout(() => {
        success.style.display = 'none';
    }, 3000);
} 