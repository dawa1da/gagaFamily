// 全局变量
let currentLane = null;
let selectedHeroes = [];

// DOM 元素
const randomLaneBtn = document.getElementById('randomLaneBtn');
const selectedLaneDisplay = document.getElementById('selectedLaneDisplay');
const currentLaneName = document.getElementById('currentLaneName');
const changeLaneBtn = document.getElementById('changeLaneBtn');
const laneGrid = document.getElementById('laneGrid');
const laneCards = document.querySelectorAll('.lane-card');
const heroDisplay = document.getElementById('heroDisplay');
const heroGrid = document.getElementById('heroGrid');
const selectedLaneTitle = document.getElementById('selectedLaneTitle');
const backBtn = document.getElementById('backBtn');
const resetBtn = document.getElementById('resetBtn');
const selectedHeroesGrid = document.getElementById('selectedHeroesGrid');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');

const host = 'http://localhost:3000';

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 初始化应用
async function initializeApp() {
    showLoading();
    
    try {
        // 等待服务器启动并加载英雄数据
        await waitForServer();
        
        // 加载已选择的英雄
        await loadSelectedHeroes();
        
        // 绑定事件监听器
        bindEventListeners();
        
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

// 绑定事件监听器
function bindEventListeners() {
    // 随机分路选择
    randomLaneBtn.addEventListener('click', randomSelectLane);
    
    // 重新选择分路
    changeLaneBtn.addEventListener('click', showLaneSelection);
    
    // 手动分路选择
    laneCards.forEach(card => {
        card.addEventListener('click', () => selectLane(card.dataset.lane));
    });
    
    // 返回按钮
    backBtn.addEventListener('click', goBackToLaneSelection);
    
    // 重置按钮
    resetBtn.addEventListener('click', resetAllSelections);
}

// 随机选择分路
async function randomSelectLane() {
    try {
        showLoading();
        
        const response = await fetch(`${host}/api/random-lane`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '随机选择分路失败');
        }
        
        const randomLane = data.lane;
        
        currentLane = randomLane;
        currentLaneName.textContent = randomLane;
        
        // 显示已选择分路
        randomLaneBtn.style.display = 'none';
        selectedLaneDisplay.style.display = 'block';
        
        // 直接随机生成该分路的3个英雄供选择
        const heroResponse = await fetch(`${host}/api/random/${randomLane}`);
        const heroData = await heroResponse.json();
        
        if (!heroResponse.ok) {
            throw new Error(heroData.error || '随机生成英雄失败');
        }
        
        // 显示英雄选择界面
        showHeroSelection(heroData.heroes, heroData.remainingCount);
        
        // 隐藏手动选择分路
        laneGrid.style.display = 'none';
        
        hideLoading();
    } catch (err) {
        showError('随机选择分路失败: ' + err.message);
        hideLoading();
    }
}

// 显示分路选择
function showLaneSelection() {
    randomLaneBtn.style.display = 'inline-block';
    selectedLaneDisplay.style.display = 'none';
    laneGrid.style.display = 'block';
    heroDisplay.style.display = 'none';
    currentLane = null;
}

// 选择分路
async function selectLane(lane) {
    try {
        showLoading();
        
        // 更新UI状态
        laneCards.forEach(card => card.classList.remove('selected'));
        const selectedCard = document.querySelector(`[data-lane="${lane}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
        
        currentLane = lane;
        
        // 直接随机生成3个英雄供选择
        const response = await fetch(`${host}/api/random/${lane}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '随机生成英雄失败');
        }
        
        // 显示英雄选择界面
        showHeroSelection(data.heroes, data.remainingCount);
        
        // 隐藏手动选择分路
        laneGrid.style.display = 'none';
        
        hideLoading();
    } catch (err) {
        showError('选择分路失败: ' + err.message);
        hideLoading();
    }
}

// 显示英雄选择界面
function showHeroSelection(heroes, remainingCount) {
    // 清空英雄网格
    heroGrid.innerHTML = '';
    
    // 显示可选择的英雄
    heroes.forEach(hero => {
        const heroCard = createSelectableHeroCard(hero);
        heroGrid.appendChild(heroCard);
    });
    
    // 更新标题
    selectedLaneTitle.textContent = `${currentLane} - 请选择一个英雄 (剩余${remainingCount}个可用英雄)`;
    
    // 显示英雄展示区域，隐藏分路选择
    document.querySelector('.lane-selection').style.display = 'none';
    heroDisplay.style.display = 'block';
}

// 创建可选择英雄卡片
function createSelectableHeroCard(hero) {
    const card = document.createElement('div');
    card.className = 'hero-card selectable';
    card.dataset.heroId = hero.id;
    card.innerHTML = `
        <div class="hero-avatar">${hero.name.charAt(0)}</div>
        <div class="hero-name">${hero.name}</div>
        <div class="hero-title">${hero.title}</div>
        <div class="hero-type">${hero.type}</div>
        <div class="select-overlay">
            <button class="select-btn">选择此英雄</button>
        </div>
    `;
    
    // 添加点击事件
    card.addEventListener('click', () => selectHero(hero.id, hero));
    
    return card;
}

// 选择英雄
async function selectHero(heroId, hero) {
    try {
        showLoading();
        
        const response = await fetch(`${host}/api/select-hero/${heroId}`, {
            method: 'POST'
        });
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '选择英雄失败');
        }
        
        // 显示选择成功的英雄
        showSelectedHero([hero]);
        
        // 更新已选择英雄列表
        await loadSelectedHeroes();
        
        showSuccess(`已选择英雄: ${hero.name}`);
        
        hideLoading();
    } catch (err) {
        showError('选择英雄失败: ' + err.message);
        hideLoading();
    }
}

// 显示选中的英雄
function showSelectedHero(heroes) {
    // 清空英雄网格
    heroGrid.innerHTML = '';
    
    // 显示选中的英雄
    heroes.forEach(hero => {
        const heroCard = createSelectedHeroCard(hero);
        heroGrid.appendChild(heroCard);
    });
    
    // 更新标题
    selectedLaneTitle.textContent = `${currentLane} - 已选择英雄`;
    
    // 禁用随机选择按钮
}

// 创建已选择英雄卡片
function createSelectedHeroCard(hero) {
    const card = document.createElement('div');
    card.className = 'hero-card selected';
    card.innerHTML = `
        <div class="hero-avatar">${hero.name.charAt(0)}</div>
        <div class="hero-name">${hero.name}</div>
        <div class="hero-title">${hero.title}</div>
        <div class="hero-type">${hero.type}</div>
    `;
    return card;
}

// 返回分路选择
function goBackToLaneSelection() {
    // 清除选中状态
    laneCards.forEach(card => card.classList.remove('selected'));
    
    // 显示分路选择，隐藏英雄展示
    document.querySelector('.lane-selection').style.display = 'block';
    heroDisplay.style.display = 'none';
    
    currentLane = null;
    selectedHeroes = [];
}

// 加载已选择的英雄
async function loadSelectedHeroes() {
    try {
        const response = await fetch(`${host}/api/selected`);
        const data = await response.json();
        
        if (response.ok) {
            selectedHeroes = data.selectedHeroes;
            updateSelectedHeroesDisplay();
        }
    } catch (err) {
        console.error('加载已选择英雄失败:', err);
    }
}

// 更新已选择英雄显示
function updateSelectedHeroesDisplay() {
    selectedHeroesGrid.innerHTML = '';
    
    if (selectedHeroes.length === 0) {
        selectedHeroesGrid.innerHTML = `
            <div class="empty-state">
                <p>还没有选择任何英雄</p>
            </div>
        `;
    } else {
        // 添加统计信息
        const statsDiv = document.createElement('div');
        statsDiv.className = 'stats-info';
        statsDiv.innerHTML = `
            <div class="stats-item">
                <span class="stats-label">已选择英雄:</span>
                <span class="stats-value">${selectedHeroes.length}</span>
            </div>
            <div class="stats-item">
                <span class="stats-label">剩余可用:</span>
                <span class="stats-value">${getTotalAvailableCount()}</span>
            </div>
        `;
        selectedHeroesGrid.appendChild(statsDiv);
        
        // 显示已选择的英雄
        selectedHeroes.forEach(hero => {
            const heroCard = createSelectedHeroCardSmall(hero);
            selectedHeroesGrid.appendChild(heroCard);
        });
    }
}

// 获取总可用英雄数量
function getTotalAvailableCount() {
    // 这里可以根据需要计算总可用数量
    // 暂时返回一个估算值
    return Math.max(0, 100 - selectedHeroes.length); // 假设总共有100个英雄
}

// 创建小型已选择英雄卡片
function createSelectedHeroCardSmall(hero) {
    const card = document.createElement('div');
    card.className = 'selected-hero-card';
    card.innerHTML = `
        <div class="selected-hero-avatar">${hero.name.charAt(0)}</div>
        <div class="selected-hero-name">${hero.name}</div>
        <div class="selected-hero-type">${hero.type}</div>
    `;
    return card;
}

// 重置所有选择
async function resetAllSelections() {
    if (!confirm('确定要重置所有已选择的英雄吗？')) {
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`${host}/api/reset`, { method: 'POST' });
        const data = await response.json();
        
        if (response.ok) {
            selectedHeroes = [];
            updateSelectedHeroesDisplay();
            
            // 重置UI状态
            randomLaneBtn.style.display = 'inline-block';
            selectedLaneDisplay.style.display = 'none';
            laneGrid.style.display = 'none';
            heroDisplay.style.display = 'none';
            document.querySelector('.lane-selection').style.display = 'block';
            
            currentLane = null;
            
            showSuccess('已重置所有选择');
        } else {
            throw new Error(data.error || '重置失败');
        }
        
        hideLoading();
    } catch (err) {
        showError('重置失败: ' + err.message);
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

// 添加键盘快捷键
document.addEventListener('keydown', function(event) {
    // ESC键返回
    if (event.key === 'Escape' && currentLane) {
        goBackToLaneSelection();
    }
    
    // 空格键随机选择分路
    if (event.key === ' ' && !currentLane) {
        event.preventDefault();
        randomSelectLane();
    }
}); 