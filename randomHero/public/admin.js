// 管理端全局变量
let players = [];
let heroData = {};
let laneConfig = {
    '上路': [],
    '中路': [],
    '下路': [],
    '打野': [],
    '辅助': []
};
let selectedBannedHeroes = [];
let allHeroes = [];
let laneHeroPools = {};

// DOM 元素
const adminPlayerName = document.getElementById('adminPlayerName');
const adminPlayerGender = document.getElementById('adminPlayerGender');
const bannedHeroesList = document.getElementById('bannedHeroesList');
const selectBannedHeroesBtn = document.getElementById('selectBannedHeroesBtn');
const adminAddPlayerBtn = document.getElementById('adminAddPlayerBtn');
const adminTotalPlayers = document.getElementById('adminTotalPlayers');
const adminMaleCount = document.getElementById('adminMaleCount');
const adminFemaleCount = document.getElementById('adminFemaleCount');
const adminPlayerList = document.getElementById('adminPlayerList');
const generateDefaultConfigBtn = document.getElementById('generateDefaultConfigBtn');
const saveConfigBtn = document.getElementById('saveConfigBtn');
const loadConfigBtn = document.getElementById('loadConfigBtn');
const laneConfigGrid = document.getElementById('laneConfigGrid');
const laneHeroPoolsContainer = document.getElementById('laneHeroPools');
const serverStatus = document.getElementById('serverStatus');
const heroDataStatus = document.getElementById('heroDataStatus');
const configStatus = document.getElementById('configStatus');
const heroSelectModal = document.getElementById('heroSelectModal');
const closeHeroModal = document.getElementById('closeHeroModal');
const heroSearchInput = document.getElementById('heroSearchInput');
const heroSelectGrid = document.getElementById('heroSelectGrid');
const cancelHeroSelect = document.getElementById('cancelHeroSelect');
const confirmHeroSelect = document.getElementById('confirmHeroSelect');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');

const host = ''; // 'http://localhost:3000'; // 本地调试

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
});

// 初始化管理端
async function initializeAdmin() {
    showLoading();
    
    try {
        // 等待服务器启动
        await waitForServer();
        
        // 绑定事件监听器
        bindAdminEventListeners();
        
        // 加载数据
        await loadAdminData();
        
        // 检查系统状态
        await checkSystemStatus();
        
        hideLoading();
    } catch (err) {
        showError('初始化失败: ' + err.message);
        hideLoading();
    }
}

// 等待服务器启动
async function waitForServer() {
    const maxAttempts = 30;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        try {
            const response = await fetch(`${host}/api/lanes`);
            if (response.ok) {
                return;
            }
        } catch (err) {
            // 继续尝试
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('服务器启动超时');
}

// 绑定管理端事件监听器
function bindAdminEventListeners() {
    // 添加玩家
    adminAddPlayerBtn.addEventListener('click', addPlayerAdmin);
    
    // 回车键添加玩家
    adminPlayerName.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addPlayerAdmin();
        }
    });
    
    // 选择禁用英雄
    selectBannedHeroesBtn.addEventListener('click', showHeroSelectModal);
    
    // 模态框事件
    closeHeroModal.addEventListener('click', hideHeroSelectModal);
    cancelHeroSelect.addEventListener('click', hideHeroSelectModal);
    confirmHeroSelect.addEventListener('click', confirmBannedHeroes);
    
    // 英雄搜索
    heroSearchInput.addEventListener('input', filterHeroes);
    
    // 配置操作
    generateDefaultConfigBtn.addEventListener('click', generateDefaultConfig);
    saveConfigBtn.addEventListener('click', saveConfig);
    loadConfigBtn.addEventListener('click', loadConfig);
}

// 加载管理端数据
async function loadAdminData() {
    try {
        // 加载玩家数据
        const playersResponse = await fetch(`${host}/api/admin/players`);
        if (playersResponse.ok) {
            players = await playersResponse.json();
            updateAdminPlayerDisplay();
        }
        
        // 加载英雄数据
        const heroesResponse = await fetch(`${host}/api/admin/all-heroes`);
        if (heroesResponse.ok) {
            allHeroes = await heroesResponse.json();
        }
        
        // 加载配置数据
        const configResponse = await fetch(`${host}/api/admin/config`);
        if (configResponse.ok) {
            const data = await configResponse.json();
            laneConfig = data.laneConfig || laneConfig;
            updateLaneConfigDisplay();
        }
        
        // 加载分路英雄池数据
        const laneHeroesResponse = await fetch(`${host}/api/admin/lane-heroes`);
        if (laneHeroesResponse.ok) {
            laneHeroPools = await laneHeroesResponse.json();
            updateLaneHeroPoolsDisplay();
        }
    } catch (err) {
        console.error('加载管理端数据失败:', err);
    }
}

// 检查系统状态
async function checkSystemStatus() {
    try {
        // 检查服务器状态
        const response = await fetch(`${host}/api/status`);
        if (response.ok) {
            serverStatus.textContent = '在线';
            serverStatus.className = 'status-value online';
        } else {
            serverStatus.textContent = '离线';
            serverStatus.className = 'status-value offline';
        }
        
        // 检查英雄数据状态
        if (allHeroes.length > 0) {
            heroDataStatus.textContent = `已加载 (${allHeroes.length})`;
            heroDataStatus.className = 'status-value online';
        } else {
            heroDataStatus.textContent = '未加载';
            heroDataStatus.className = 'status-value offline';
        }
        
        // 检查配置状态
        const hasConfig = Object.values(laneConfig).some(heroes => heroes.length > 0);
        if (hasConfig) {
            configStatus.textContent = '已配置';
            configStatus.className = 'status-value online';
        } else {
            configStatus.textContent = '未配置';
            configStatus.className = 'status-value offline';
        }
    } catch (err) {
        console.error('检查系统状态失败:', err);
    }
}

// 添加玩家（管理端）
async function addPlayerAdmin() {
    const name = adminPlayerName.value.trim();
    const gender = adminPlayerGender.value;
    
    if (!name) {
        showError('请输入玩家姓名');
        return;
    }
    
    if (!gender) {
        showError('请选择性别');
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`${host}/api/admin/players`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                name, 
                gender, 
                bannedHeroes: selectedBannedHeroes 
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || '添加玩家失败');
        }
        
        // 清空输入框
        adminPlayerName.value = '';
        adminPlayerGender.value = '';
        selectedBannedHeroes = [];
        updateBannedHeroesDisplay();
        
        // 重新加载玩家数据
        await loadAdminData();
        
        showSuccess('玩家添加成功');
        
        hideLoading();
    } catch (err) {
        showError('添加玩家失败: ' + err.message);
        hideLoading();
    }
}

// 更新管理端玩家显示
function updateAdminPlayerDisplay() {
    // 更新统计信息
    adminTotalPlayers.textContent = players.length;
    const maleCount = players.filter(p => p.gender === 'male').length;
    const femaleCount = players.filter(p => p.gender === 'female').length;
    adminMaleCount.textContent = maleCount;
    adminFemaleCount.textContent = femaleCount;
    
    // 更新玩家列表
    adminPlayerList.innerHTML = '';
    
    if (players.length === 0) {
        adminPlayerList.innerHTML = `
            <div class="empty-state">
                <p>还没有添加任何玩家</p>
            </div>
        `;
    } else {
        players.forEach(player => {
            const playerCard = createAdminPlayerCard(player);
            adminPlayerList.appendChild(playerCard);
        });
    }
}

// 创建管理端玩家卡片
function createAdminPlayerCard(player) {
    const card = document.createElement('div');
    card.className = 'admin-player-card';
    card.innerHTML = `
        <div class="admin-player-header">
            <div class="admin-player-info">
                <div class="admin-player-name">${player.name}</div>
                <div class="admin-player-gender ${player.gender}">${player.gender === 'male' ? '男' : '女'}</div>
            </div>
        </div>
        <div class="admin-player-banned">
            <h4>禁用英雄 (${player.bannedHeroes ? player.bannedHeroes.length : 0})</h4>
            <div class="admin-player-banned-list">
                ${player.bannedHeroes ? player.bannedHeroes.map(hero => 
                    `<span class="banned-hero-tag">${hero.name}</span>`
                ).join('') : '<span style="color: #b8c5d6;">无</span>'}
            </div>
        </div>
        <div class="admin-player-actions">
            <button class="admin-edit-btn" onclick="editPlayer('${player.id}')">编辑</button>
            <button class="admin-delete-btn" onclick="deletePlayerAdmin('${player.id}')">删除</button>
        </div>
    `;
    return card;
}

// 删除玩家（管理端）
async function deletePlayerAdmin(playerId) {
    if (!confirm('确定要删除这个玩家吗？')) {
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`${host}/api/admin/players/${playerId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || '删除玩家失败');
        }
        
        // 重新加载玩家数据
        await loadAdminData();
        
        showSuccess('玩家删除成功');
        
        hideLoading();
    } catch (err) {
        showError('删除玩家失败: ' + err.message);
        hideLoading();
    }
}

// 编辑玩家
function editPlayer(playerId) {
    const player = players.find(p => p.id == playerId);
    if (!player) return;
    
    // 填充表单
    adminPlayerName.value = player.name;
    adminPlayerGender.value = player.gender;
    selectedBannedHeroes = player.bannedHeroes || [];
    updateBannedHeroesDisplay();
    
    // 滚动到表单
    adminPlayerName.scrollIntoView({ behavior: 'smooth' });
}

// 更新禁用英雄显示
function updateBannedHeroesDisplay() {
    bannedHeroesList.innerHTML = '';
    
    if (selectedBannedHeroes.length === 0) {
        bannedHeroesList.innerHTML = '<span style="color: #b8c5d6;">未选择禁用英雄</span>';
    } else {
        selectedBannedHeroes.forEach(hero => {
            const tag = document.createElement('span');
            tag.className = 'banned-hero-tag';
            tag.innerHTML = `
                ${hero.name}
                <button class="remove-btn" onclick="removeBannedHero('${hero.id}')">&times;</button>
            `;
            bannedHeroesList.appendChild(tag);
        });
    }
}

// 移除禁用英雄
function removeBannedHero(heroId) {
    selectedBannedHeroes = selectedBannedHeroes.filter(hero => hero.id !== heroId);
    updateBannedHeroesDisplay();
}

// 显示英雄选择模态框
function showHeroSelectModal() {
    heroSelectModal.style.display = 'flex';
    loadHeroSelectGrid();
}

// 隐藏英雄选择模态框
function hideHeroSelectModal() {
    heroSelectModal.style.display = 'none';
    heroSearchInput.value = '';
}

// 加载英雄选择网格
function loadHeroSelectGrid() {
    heroSelectGrid.innerHTML = '';
    
    allHeroes.forEach(hero => {
        const isSelected = selectedBannedHeroes.some(h => h.id === hero.id);
        const item = document.createElement('div');
        item.className = `hero-select-item ${isSelected ? 'selected' : ''}`;
        item.dataset.heroId = hero.id;
        item.innerHTML = `
            <div class="hero-select-avatar">${hero.name.charAt(0)}</div>
            <div class="hero-select-name">${hero.name}</div>
            <div class="hero-select-type">${hero.type}</div>
        `;
        
        item.addEventListener('click', () => toggleHeroSelection(hero));
        heroSelectGrid.appendChild(item);
    });
}

// 切换英雄选择
function toggleHeroSelection(hero) {
    const index = selectedBannedHeroes.findIndex(h => h.id === hero.id);
    const item = document.querySelector(`[data-hero-id="${hero.id}"]`);
    
    if (index === -1) {
        selectedBannedHeroes.push(hero);
        item.classList.add('selected');
    } else {
        selectedBannedHeroes.splice(index, 1);
        item.classList.remove('selected');
    }
}

// 确认禁用英雄选择
function confirmBannedHeroes() {
    updateBannedHeroesDisplay();
    hideHeroSelectModal();
}

// 过滤英雄
function filterHeroes() {
    const searchTerm = heroSearchInput.value.toLowerCase();
    const items = heroSelectGrid.querySelectorAll('.hero-select-item');
    
    items.forEach(item => {
        const heroName = item.querySelector('.hero-select-name').textContent.toLowerCase();
        if (heroName.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// 生成默认配置
async function generateDefaultConfig() {
    try {
        showLoading();
        
        const response = await fetch(`${host}/api/admin/generate-config`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '生成配置失败');
        }
        
        laneConfig = data.laneConfig;
        updateLaneConfigDisplay();
        await checkSystemStatus();
        
        showSuccess('默认配置生成成功');
        
        hideLoading();
    } catch (err) {
        showError('生成配置失败: ' + err.message);
        hideLoading();
    }
}

// 保存配置
async function saveConfig() {
    try {
        showLoading();
        
        const response = await fetch(`${host}/api/admin/save-config`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ laneConfig })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '保存配置失败');
        }
        
        showSuccess('配置保存成功');
        
        hideLoading();
    } catch (err) {
        showError('保存配置失败: ' + err.message);
        hideLoading();
    }
}

// 加载配置
async function loadConfig() {
    try {
        showLoading();
        
        const response = await fetch(`${host}/api/admin/load-config`);
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '加载配置失败');
        }
        
        laneConfig = data.laneConfig;
        updateLaneConfigDisplay();
        await checkSystemStatus();
        
        showSuccess('配置加载成功');
        
        hideLoading();
    } catch (err) {
        showError('加载配置失败: ' + err.message);
        hideLoading();
    }
}

// 更新分路配置显示
function updateLaneConfigDisplay() {
    laneConfigGrid.innerHTML = '';
    
    Object.entries(laneConfig).forEach(([lane, heroes]) => {
        const card = document.createElement('div');
        card.className = 'lane-config-card';
        card.innerHTML = `
            <div class="lane-config-header">
                <div class="lane-config-title">${lane}</div>
                <div class="lane-config-actions">
                    <button class="btn btn-secondary" onclick="addHeroToLane('${lane}')">添加英雄</button>
                </div>
            </div>
            <div class="lane-hero-list">
                ${heroes.length === 0 ? '<p style="color: #b8c5d6; text-align: center;">暂无英雄</p>' : 
                    heroes.map(hero => `
                        <div class="lane-hero-item">
                            <div>
                                <div class="lane-hero-name">${hero.name}</div>
                                <div class="lane-hero-type">${hero.type}</div>
                            </div>
                            <button class="lane-hero-remove" onclick="removeHeroFromLane('${lane}', '${hero.id}')">删除</button>
                        </div>
                    `).join('')
                }
            </div>
        `;
        laneConfigGrid.appendChild(card);
    });
}

// 获取分路显示名称
function getLaneDisplayName(lane) {
    const laneNames = {
        '上路': '上路',
        '中路': '中路',
        '下路': '下路',
        '打野': '打野',
        '辅助': '辅助'
    };
    return laneNames[lane] || lane;
}

// 添加英雄到分路
function addHeroToLane(lane) {
    // 这里可以实现添加英雄到分路的功能
    // 可以打开一个模态框让用户选择英雄
    alert(`添加英雄到${lane}的功能待实现`);
}

// 从分路移除英雄
function removeHeroFromLane(lane, heroId) {
    laneConfig[lane] = laneConfig[lane].filter(hero => hero.id !== heroId);
    updateLaneConfigDisplay();
}

// 更新分路英雄池显示
function updateLaneHeroPoolsDisplay() {
    
    laneHeroPoolsContainer.innerHTML = '';
    
    const lanes = ['top', 'jungle', 'mid', 'bot', 'support'];
    const laneNames = ['上路', '打野', '中路', '下路', '辅助'];
    
    lanes.forEach((lane, index) => {
        const heroes = laneHeroPools[lane] || [];
        
        const card = document.createElement('div');
        card.className = 'lane-hero-pools-card';
        card.innerHTML = `
            <div class="lane-hero-pools-header">
                <div class="lane-hero-pools-title">${laneNames[index]} 英雄池 (${heroes.length})</div>
                <div class="lane-hero-pools-actions">
                    <button class="btn btn-secondary" onclick="showAddHeroModal('${lane}')">添加英雄</button>
                </div>
            </div>
            <div class="lane-hero-pools-list">
                ${heroes.length === 0 ? '<p style="color: #b8c5d6; text-align: center;">暂无英雄</p>' : 
                    heroes.map(heroName => {
                        // 从全英雄列表中查找英雄信息
                        const heroInfo = allHeroes.find(hero => hero.name === heroName);
                        return `
                            <div class="lane-hero-pools-item">
                                <div class="lane-hero-pools-hero-info">
                                    <div class="lane-hero-pools-name">${heroName}</div>
                                    <div class="lane-hero-pools-type">${heroInfo ? heroInfo.type : '未知类型'}</div>
                                </div>
                                <button class="lane-hero-pools-remove" onclick="removeHeroFromLanePool('${lane}', '${heroName}')">删除</button>
                            </div>
                        `;
                    }).join('')
                }
            </div>
        `;
        laneHeroPoolsContainer.appendChild(card);
    });
}

// 显示添加英雄模态框
function showAddHeroModal(lane) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>添加英雄到${getLaneDisplayName(lane)}英雄池</h3>
                <button class="modal-close" onclick="closeAddHeroModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="hero-search">
                    <input type="text" id="addHeroSearchInput" placeholder="搜索英雄..." oninput="filterAddHeroes()">
                </div>
                <div class="hero-grid" id="addHeroGrid">
                    ${allHeroes.map(hero => `
                        <div class="hero-select-item" onclick="addHeroToLanePool('${lane}', '${hero.name}')">
                            <div class="hero-select-avatar">${hero.name.charAt(0)}</div>
                            <div class="hero-select-name">${hero.name}</div>
                            <div class="hero-select-type">${hero.type}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeAddHeroModal()">取消</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// 关闭添加英雄模态框
function closeAddHeroModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

// 过滤添加英雄列表
function filterAddHeroes() {
    const searchInput = document.getElementById('addHeroSearchInput');
    const searchTerm = searchInput.value.toLowerCase();
    const heroItems = document.querySelectorAll('#addHeroGrid .hero-select-item');
    
    heroItems.forEach(item => {
        const heroName = item.querySelector('.hero-select-name').textContent.toLowerCase();
        if (heroName.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// 添加英雄到分路英雄池
async function addHeroToLanePool(lane, heroName) {
    try {
        showLoading();
        
        const response = await fetch(`${host}/api/admin/lane-heroes/${lane}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ heroName })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || '添加英雄失败');
        }
        
        // 重新加载英雄池数据
        const laneHeroesResponse = await fetch(`${host}/api/admin/lane-heroes`);
        if (laneHeroesResponse.ok) {
            laneHeroPools = await laneHeroesResponse.json();
            updateLaneHeroPoolsDisplay();
        }
        
        closeAddHeroModal();
        showSuccess('英雄添加成功');
        
        hideLoading();
    } catch (err) {
        showError('添加英雄失败: ' + err.message);
        hideLoading();
    }
}

// 从分路英雄池移除英雄
async function removeHeroFromLanePool(lane, heroName) {
    if (!confirm(`确定要从${getLaneDisplayName(lane)}英雄池中移除${heroName}吗？`)) {
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`${host}/api/admin/lane-heroes/${lane}/${encodeURIComponent(heroName)}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || '移除英雄失败');
        }
        
        // 重新加载英雄池数据
        const laneHeroesResponse = await fetch(`${host}/api/admin/lane-heroes`);
        if (laneHeroesResponse.ok) {
            laneHeroPools = await laneHeroesResponse.json();
            updateLaneHeroPoolsDisplay();
        }
        
        showSuccess('英雄移除成功');
        
        hideLoading();
    } catch (err) {
        showError('移除英雄失败: ' + err.message);
        hideLoading();
    }
}

// 显示加载状态
function showLoading() {
    loading.style.display = 'flex';
}

// 隐藏加载状态
function hideLoading() {
    loading.style.display = 'none';
}

// 显示错误信息
function showError(message) {
    errorMessage.textContent = message;
    error.style.display = 'block';
    
    setTimeout(() => {
        error.style.display = 'none';
    }, 5000);
}

// 显示成功信息
function showSuccess(message) {
    // 创建成功提示
    const success = document.createElement('div');
    success.className = 'error';
    success.style.background = 'rgba(78, 205, 196, 0.9)';
    success.innerHTML = `<p>${message}</p>`;
    
    document.body.appendChild(success);
    
    setTimeout(() => {
        success.remove();
    }, 3000);
} 