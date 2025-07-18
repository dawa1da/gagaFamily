import express, { json } from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { join } from 'path';

const app = express();
const PORT = 3000;

// 中间件
app.use(cors({
  origin: '*',
}));
app.use(json());
app.use(express.static('public'));

// 英雄类型映射
const heroTypeMap = {
  1: '战士',
  2: '法师', 
  3: '坦克',
  4: '刺客',
  5: '射手',
  6: '辅助'
};

// 分路映射
const laneMap = {
  '战士': ['上路', '打野'],
  '法师': ['中路'],
  '坦克': ['上路', '辅助'],
  '刺客': ['打野', '中路'],
  '射手': ['下路'],
  '辅助': ['辅助']
};

// 全局变量存储英雄数据和已选择的英雄
let heroData = {};
let selectedHeroes = new Set();

// 获取英雄数据
async function fetchHeroData() {
  try {
    console.log('正在获取英雄数据...');
    const response = await fetch('https://pvp.qq.com/web201605/js/herolist.json');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const heroes = await response.json();
    
    // 按类型分组英雄
    heroes.forEach(hero => {
      const type = heroTypeMap[hero.hero_type] || '未知';
      if (!heroData[type]) {
        heroData[type] = [];
      }
      heroData[type].push({
        id: hero.ename,
        name: hero.cname,
        title: hero.title,
        type: type,
        originalType: hero.hero_type
      });
    });
    
    console.log('英雄数据加载完成');
    return heroData;
  } catch (error) {
    console.error('获取英雄数据失败:', error.message);
    return heroData;
  }
}

// 获取分路列表
app.get('/api/lanes', (req, res) => {
  const lanes = ['上路', '中路', '下路', '打野', '辅助'];
  res.json({ lanes });
});

// 随机选择分路
app.get('/api/random-lane', (req, res) => {
  const lanes = ['上路', '中路', '下路', '打野', '辅助'];
  const randomLane = lanes[Math.floor(Math.random() * lanes.length)];
  res.json({ lane: randomLane });
});

// 根据分路获取英雄
app.get('/api/heroes/:lane', (req, res) => {
  const { lane } = req.params;
  
  // 找出适合该分路的英雄类型
  const suitableTypes = Object.keys(laneMap).filter(type => 
    laneMap[type].includes(lane)
  );
  
  // 收集所有适合的英雄
  let availableHeroes = [];
  suitableTypes.forEach(type => {
    if (heroData[type]) {
      availableHeroes = availableHeroes.concat(heroData[type]);
    }
  });
  
  // 过滤掉已选择的英雄
  availableHeroes = availableHeroes.filter(hero => 
    !selectedHeroes.has(hero.id)
  );
  
  res.json({ 
    lane, 
    heroes: availableHeroes,
    count: availableHeroes.length 
  });
});

// 随机选择英雄
app.get('/api/random/:lane', (req, res) => {
  const { lane } = req.params;
  
  // 找出适合该分路的英雄类型
  const suitableTypes = Object.keys(laneMap).filter(type => 
    laneMap[type].includes(lane)
  );
  
  // 收集所有适合的英雄
  let availableHeroes = [];
  suitableTypes.forEach(type => {
    if (heroData[type]) {
      availableHeroes = availableHeroes.concat(heroData[type]);
    }
  });
  
  // 过滤掉已选择的英雄
  availableHeroes = availableHeroes.filter(hero => 
    !selectedHeroes.has(hero.id)
  );
  
  if (availableHeroes.length === 0) {
    return res.status(400).json({ 
      error: '该分路没有可用的英雄了' 
    });
  }
  
  // 随机选择3个英雄
  const selectedCount = Math.min(3, availableHeroes.length);
  const randomHeroes = [];
  
  for (let i = 0; i < selectedCount; i++) {
    const randomIndex = Math.floor(Math.random() * availableHeroes.length);
    const hero = availableHeroes.splice(randomIndex, 1)[0];
    randomHeroes.push(hero);
    // 立即将选中的英雄标记为已选择，防止其他玩家选择
    selectedHeroes.add(hero.id);
  }
  
  res.json({ 
    lane, 
    heroes: randomHeroes,
    selectedCount,
    remainingCount: availableHeroes.length
  });
});

// 选择特定英雄
app.post('/api/select-hero/:heroId', (req, res) => {
  const { heroId } = req.params;
  
  // 检查英雄是否已被选择
  if (selectedHeroes.has(heroId)) {
    return res.status(400).json({ 
      error: '该英雄已被其他玩家选择' 
    });
  }
  
  // 在所有类型中查找英雄
  let hero = null;
  for (const type in heroData) {
    hero = heroData[type].find(h => h.id === heroId);
    if (hero) break;
  }
  
  if (!hero) {
    return res.status(404).json({ 
      error: '英雄不存在' 
    });
  }
  
  // 标记英雄为已选择
  selectedHeroes.add(heroId);
  
  res.json({ 
    message: '英雄选择成功',
    hero 
  });
});

// 重置已选择的英雄
app.post('/api/reset', (req, res) => {
  selectedHeroes.clear();
  res.json({ message: '已重置所有选择' });
});

// 获取已选择的英雄
app.get('/api/selected', (req, res) => {
  const selectedHeroList = Array.from(selectedHeroes).map(id => {
    // 在所有类型中查找英雄
    for (const type in heroData) {
      const hero = heroData[type].find(h => h.id === id);
      if (hero) return hero;
    }
    return null;
  }).filter(hero => hero !== null);
  
  res.json({ selectedHeroes: selectedHeroList });
});

// 获取指定分路的可用英雄数量
app.get('/api/available-count/:lane', (req, res) => {
  const { lane } = req.params;
  
  // 找出适合该分路的英雄类型
  const suitableTypes = Object.keys(laneMap).filter(type => 
    laneMap[type].includes(lane)
  );
  
  // 收集所有适合的英雄
  let availableHeroes = [];
  suitableTypes.forEach(type => {
    if (heroData[type]) {
      availableHeroes = availableHeroes.concat(heroData[type]);
    }
  });
  
  // 过滤掉已选择的英雄
  availableHeroes = availableHeroes.filter(hero => 
    !selectedHeroes.has(hero.id)
  );
  
  res.json({ 
    lane, 
    availableCount: availableHeroes.length,
    totalCount: availableHeroes.length + selectedHeroes.size
  });
});

// 主页路由
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// 启动服务器
async function startServer() {
  try {
    await fetchHeroData();
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
  }
}

startServer(); 