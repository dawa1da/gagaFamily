const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(
    cors({
        origin: '*',
    })
);
app.use(express.json());
app.use(express.static('public'));

// 数据存储
let players = [];
let teams = [];
let laneAssignments = {};
let selectedHeroes = new Set();
let heroConfig = {};

// 加载英雄配置
function loadHeroConfig() {
    try {
        const configPath = path.join(__dirname, 'config', 'heroes.json');
        const configData = fs.readFileSync(configPath, 'utf8');
        heroConfig = JSON.parse(configData);
        console.log('英雄配置加载成功');
    } catch (error) {
        console.error('加载英雄配置失败:', error);
        // 使用默认配置
        heroConfig = {
            top: ['亚瑟', '吕布', '关羽', '张飞', '典韦', '程咬金', '钟馗', '李信', '花木兰', '铠'],
            jungle: ['李白', '韩信', '赵云', '兰陵王', '娜可露露', '阿轲', '百里玄策', '云中君', '镜', '澜'],
            mid: ['妲己', '安琪拉', '王昭君', '貂蝉', '小乔', '甄姬', '杨玉环', '上官婉儿', '西施', '嫦娥'],
            bot: ['后羿', '鲁班七号', '孙尚香', '虞姬', '黄忠', '马可波罗', '公孙离', '伽罗', '蒙犽', '艾琳'],
            support: ['蔡文姬', '大乔', '小乔', '孙膑', '庄周', '张飞', '牛魔', '鬼谷子', '太乙真人', '鲁班大师']
        };
    }
}

// 初始化时加载配置
loadHeroConfig();

// 玩家类
class Player {
    constructor(name, gender) {
        this.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        this.name = name;
        this.gender = gender;
        this.bannedHeroes = [];
    }
}

// 路由

// 获取所有玩家
app.get('/api/players', (req, res) => {
    res.json(players);
});

// 添加玩家
app.post('/api/players', (req, res) => {
    const { name, gender } = req.body;
    
    if (!name || !gender) {
        return res.status(400).json({ message: '姓名和性别不能为空' });
    }
    
    if (players.length >= 10) {
        return res.status(400).json({ message: '最多只能添加10名玩家' });
    }
    
    if (players.some(p => p.name === name)) {
        return res.status(400).json({ message: '玩家姓名已存在' });
    }
    
    const player = new Player(name, gender);
    players.push(player);
    
    res.status(201).json(player);
});

// 删除玩家
app.delete('/api/players/:id', (req, res) => {
    const { id } = req.params;
    const index = players.findIndex(p => p.id === id);
    
    if (index === -1) {
        return res.status(404).json({ message: '玩家不存在' });
    }
    
    players.splice(index, 1);
    res.json({ message: '玩家删除成功' });
});

// 分配团队
app.post('/api/teams/assign', (req, res) => {
    if (players.length !== 10) {
        return res.status(400).json({ message: '需要10名玩家才能分配团队' });
    }
    
    const females = players.filter(p => p.gender === 'female');
    const males = players.filter(p => p.gender === 'male');
    
    // 确保女生人数均等
    const team1Females = females.slice(0, Math.ceil(females.length / 2));
    const team2Females = females.slice(Math.ceil(females.length / 2));
    
    // 男生随机分配
    const shuffledMales = males.sort(() => Math.random() - 0.5);
    const team1Males = shuffledMales.slice(0, Math.ceil(shuffledMales.length / 2));
    const team2Males = shuffledMales.slice(Math.ceil(shuffledMales.length / 2));
    
    teams = [
        { name: '蓝队', players: [...team1Females, ...team1Males] },
        { name: '红队', players: [...team2Females, ...team2Males] }
    ];
    
    res.json(teams);
});

// 获取分路列表
app.get('/api/lanes', (req, res) => {
    const lanes = [
        { id: 'top', name: '上路' },
        { id: 'jungle', name: '打野' },
        { id: 'mid', name: '中路' },
        { id: 'bot', name: '下路' },
        { id: 'support', name: '辅助' }
    ];
    res.json({ lanes });
});

// 分配分路
app.post('/api/lanes/assign', (req, res) => {
    if (players.length !== 10) {
        return res.status(400).json({ message: '需要10名玩家才能分配分路' });
    }
    
    const lanes = ['top', 'jungle', 'mid', 'bot', 'support'];
    const shuffledLanes = lanes.sort(() => Math.random() - 0.5);
    
    laneAssignments = {};
    players.forEach((player, index) => {
        laneAssignments[player.id] = shuffledLanes[index];
    });
    
    res.json(laneAssignments);
});

// 选择英雄
app.post('/api/heroes/select', (req, res) => {
    const { playerId, heroName } = req.body;
    
    if (!playerId || !heroName) {
        return res.status(400).json({ message: '玩家ID和英雄名称不能为空' });
    }
    
    if (selectedHeroes.has(heroName)) {
        return res.status(400).json({ message: '该英雄已被选择' });
    }
    
    const player = players.find(p => p.id === playerId);
    if (!player) {
        return res.status(404).json({ message: '玩家不存在' });
    }
    
    const lane = laneAssignments[playerId];
    if (!lane) {
        return res.status(400).json({ message: '玩家未分配分路' });
    }
    
    const laneHeroes = heroConfig[lane] || [];
    if (!laneHeroes.includes(heroName)) {
        return res.status(400).json({ message: '该英雄不属于此分路' });
    }
    
    selectedHeroes.add(heroName);
    res.json({ message: '英雄选择成功', hero: heroName });
});

// 重置所有数据
app.post('/api/reset', (req, res) => {
    players = [];
    teams = [];
    laneAssignments = {};
    selectedHeroes.clear();
    res.json({ message: '重置成功' });
});

// 管理端API

// 获取英雄配置
app.get('/api/admin/hero-config', (req, res) => {
    res.json(heroConfig);
});

// 保存英雄配置
app.post('/api/admin/hero-config', (req, res) => {
    const newConfig = req.body;
    
    try {
        const configPath = path.join(__dirname, 'config', 'heroes.json');
        fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf8');
        heroConfig = newConfig;
        res.json({ message: '配置保存成功' });
    } catch (error) {
        console.error('保存配置失败:', error);
        res.status(500).json({ message: '保存配置失败' });
    }
});

// 生成默认配置
app.post('/api/admin/generate-config', (req, res) => {
    // 重新加载配置文件
    loadHeroConfig();
    res.json({ message: '默认配置生成成功', config: heroConfig });
});

// 获取系统状态
app.get('/api/admin/status', (req, res) => {
    const status = {
        server: 'online',
        heroData: Object.keys(heroConfig).length > 0 ? 'loaded' : 'empty',
        config: Object.keys(heroConfig).length > 0 ? 'configured' : 'not_configured',
        players: players.length,
        teams: teams.length,
        laneAssignments: Object.keys(laneAssignments).length,
        selectedHeroes: selectedHeroes.size
    };
    
    res.json(status);
});

// 获取系统状态（客户端用）
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'online',
        timestamp: new Date().toISOString()
    });
});

// 获取配置（管理端用）
app.get('/api/admin/config', (req, res) => {
    res.json({ 
        laneConfig: heroConfig
    });
});

// 保存配置（管理端用）
app.post('/api/admin/save-config', (req, res) => {
    const { laneConfig } = req.body;
    
    try {
        const configPath = path.join(__dirname, 'config', 'heroes.json');
        fs.writeFileSync(configPath, JSON.stringify(laneConfig, null, 2), 'utf8');
        heroConfig = laneConfig;
        res.json({ 
            message: '配置保存成功',
            laneConfig: heroConfig
        });
    } catch (error) {
        console.error('保存配置失败:', error);
        res.status(500).json({ message: '保存配置失败' });
    }
});

// 加载配置（管理端用）
app.get('/api/admin/load-config', (req, res) => {
    try {
        // 重新加载配置文件
        loadHeroConfig();
        res.json({ 
            message: '配置加载成功',
            laneConfig: heroConfig
        });
    } catch (error) {
        console.error('加载配置失败:', error);
        res.status(500).json({ message: '加载配置失败' });
    }
});

// 管理端玩家管理

// 管理端添加玩家
app.post('/api/admin/players', (req, res) => {
    const { name, gender, bannedHeroes = [] } = req.body;
    
    if (!name || !gender) {
        return res.status(400).json({ message: '姓名和性别不能为空' });
    }
    
    if (players.length >= 10) {
        return res.status(400).json({ message: '最多只能添加10名玩家' });
    }
    
    if (players.some(p => p.name === name)) {
        return res.status(400).json({ message: '玩家姓名已存在' });
    }
    
    const player = new Player(name, gender);
    player.bannedHeroes = bannedHeroes;
    players.push(player);
    
    res.status(201).json(player);
});

// 管理端删除玩家
app.delete('/api/admin/players/:id', (req, res) => {
    const { id } = req.params;
    const index = players.findIndex(p => p.id === id);
    
    if (index === -1) {
        return res.status(404).json({ message: '玩家不存在' });
    }
    
    players.splice(index, 1);
    res.json({ message: '玩家删除成功' });
});

// 管理端编辑玩家
app.put('/api/admin/players/:id', (req, res) => {
    const { id } = req.params;
    const { name, gender, bannedHeroes } = req.body;
    
    const player = players.find(p => p.id === id);
    if (!player) {
        return res.status(404).json({ message: '玩家不存在' });
    }
    
    if (name) player.name = name;
    if (gender) player.gender = gender;
    if (bannedHeroes) player.bannedHeroes = bannedHeroes;
    
    res.json(player);
});

// 获取所有英雄数据（用于管理端选择）
app.get('/api/admin/all-heroes', (req, res) => {
    const allHeroes = [];
    Object.entries(heroConfig).forEach(([lane, heroes]) => {
        heroes.forEach(hero => {
            allHeroes.push({
                name: hero,
                lane: lane,
                laneName: getLaneDisplayName(lane)
            });
        });
    });
    
    res.json(allHeroes);
});

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

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('英雄配置已加载');
}); 