// 应用状态变量
let originalYamlContent = '';
let currentEditMode = false;
let currentViewMode = 'form'; // 'yaml' 或 'form'
let currentConfigType = '';
let configData = {};

// 新增：全局英雄分路-英雄池缓存
let heroLaneMap = null;

// 修改urlRequest，只处理hero配置
function urlRequest(url, isYaml = false, configType = '') {
  const apiUrl = API_BASE_URL + url;
  fetch(apiUrl)
    .then(response => {
      if (!response.ok) throw new Error('网络响应失败，状态码：' + response.status);
      return response.text();
    })
    .then(data => {
      if (isYaml) {
        showYamlModal(data, configType);
      } else {
        alert(data);
      }
    })
    .catch(error => alert('请求失败：' + error.message));
}
// 解析hero.yaml为分路-英雄池map
function parseHeroYamlToLaneMap(yamlText) {
  const lines = yamlText.split('\n');
  const map = {};
  let currentLane = null;
  lines.forEach(line => {
    if (/^[^\s].*:$/.test(line)) {
      currentLane = line.replace(':', '').trim();
      map[currentLane] = [];
    } else if (/^\s*-\s*/.test(line) && currentLane) {
      const hero = line.replace(/^\s*-\s*/, '').trim();
      if (hero) map[currentLane].push(hero);
    }
  });
  return map;
}

function showYamlModal(yamlContent, configType) {
  originalYamlContent = yamlContent;
  currentConfigType = configType;

  try {
    // 简单的YAML解析（仅支持基本结构）
    configData = parseSimpleYaml(yamlContent);
  } catch (error) {
    console.error('YAML解析错误:', error);
    configData = {};
  }

  document.getElementById('yamlContent').textContent = yamlContent;
  document.getElementById('yamlEditor').value = yamlContent;

  // 更新模态框标题
  const title = 'HERO配置';
  document.getElementById('modalTitle').textContent = title;

  document.getElementById('yamlModal').style.display = 'block';
  setEditMode(false);
  setViewMode('form');

  // 阻止页面滚动
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('yamlModal').style.display = 'none';
  // 恢复页面滚动
  document.body.style.overflow = 'auto';
}

function setViewMode(mode) {
  currentViewMode = mode;

  // 隐藏所有容器
  document.getElementById('yamlViewContainer').style.display = 'none';
  document.getElementById('yamlEditContainer').style.display = 'none';
  document.getElementById('formViewContainer').style.display = 'none';
  document.getElementById('formEditContainer').style.display = 'none';

  // 更新按钮状态
  document.getElementById('toggleFormBtn').className = mode === 'form' ? 'toggle-edit-btn' : 'toggle-view-btn';
  document.getElementById('toggleYamlBtn').className = mode === 'yaml' ? 'toggle-edit-btn' : 'toggle-view-btn';

  if (currentEditMode) {
    // 编辑模式
    if (mode === 'form') {
      generateFormEdit();
      document.getElementById('formEditContainer').style.display = 'block';
    } else {
      document.getElementById('yamlEditContainer').style.display = 'block';
    }
    document.getElementById('modeIndicator').textContent = '编辑模式';
  } else {
    // 查看模式
    if (mode === 'form') {
      generateFormView();
      document.getElementById('formViewContainer').style.display = 'block';
    } else {
      document.getElementById('yamlViewContainer').style.display = 'block';
    }
    document.getElementById('modeIndicator').textContent = '查看模式';
  }
}

function toggleEditMode() {
  setEditMode(!currentEditMode);
}

function setEditMode(editMode) {
  currentEditMode = editMode;
  document.getElementById('toggleEditBtn').textContent = editMode ? '查看' : '编辑';
  setViewMode(currentViewMode);

  // 只在编辑模式下插入footer
  let footer = document.getElementById('editModalFooter');
  if (editMode) {
    if (!footer) {
      footer = document.createElement('div');
      footer.id = 'editModalFooter';
      footer.className = 'edit-modal-footer';
      footer.innerHTML = `
                    <button class="cancel-btn" onclick="cancelEdit()">取消</button>
                    <button class="save-btn" onclick="${currentViewMode === 'form' ? 'saveFormChanges()' : 'saveChanges()'}">保存</button>
                `;
      document.querySelector('.modal-content').appendChild(footer);
    } else {
      footer.style.display = '';
    }
  } else {
    if (footer) footer.style.display = 'none';
  }
}

function generateFormView() {
  const container = document.getElementById('formContent');
  container.innerHTML = '';

  if (currentConfigType === 'hero') {
    generateHeroFormView(container);
  } else {
    container.innerHTML = '<p>未知配置类型</p>';
  }
}

function generateFormEdit() {
  const container = document.getElementById('configForm');
  container.innerHTML = '';

  if (currentConfigType === 'hero') {
    generateHeroFormEdit(container);
  } else {
    container.innerHTML = '<p>未知配置类型</p>';
  }
}

function generateHeroFormView(container) {
  if (!configData.heroes || !Array.isArray(configData.heroes)) {
    container.innerHTML = '<p>没有找到英雄数据</p>';
    return;
  }

  // 按位置分类英雄
  const positionGroups = {};
  configData.heroes.forEach(hero => {
    const position = hero.type || '未分类';
    if (!positionGroups[position]) {
      positionGroups[position] = [];
    }
    positionGroups[position].push(hero.name);
  });

  // 创建选项卡容器
  const tabContainer = document.createElement('div');
  tabContainer.className = 'tab-container';
  container.appendChild(tabContainer);

  // 创建选项卡标题栏
  const tabHeader = document.createElement('div');
  tabHeader.className = 'tab-header';
  tabContainer.appendChild(tabHeader);

  // 创建选项卡内容区域
  const positions = Object.keys(positionGroups);
  positions.forEach((position, index) => {
    // 创建选项卡按钮
    const tabButton = document.createElement('div');
    tabButton.className = `tab-button ${index === 0 ? 'active' : ''}`;
    tabButton.textContent = position;
    tabButton.onclick = function () {
      // 移除所有活动状态
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

      // 设置当前选项卡为活动状态
      this.classList.add('active');
      document.getElementById(`tab-content-${position}`).classList.add('active');
    };
    tabHeader.appendChild(tabButton);

    // 创建选项卡内容
    const tabContent = document.createElement('div');
    tabContent.className = `tab-content ${index === 0 ? 'active' : ''}`;
    tabContent.id = `tab-content-${position}`;
    tabContainer.appendChild(tabContent);

    // 创建英雄网格
    const heroGrid = document.createElement('div');
    heroGrid.className = 'hero-grid';
    tabContent.appendChild(heroGrid);

    // 添加英雄
    positionGroups[position].forEach(heroName => {
      const heroDiv = document.createElement('div');
      heroDiv.className = 'hero-item-simple';
      heroDiv.textContent = heroName;
      heroGrid.appendChild(heroDiv);
    });
  });

  // 如果没有分类，显示提示信息
  if (positions.length === 0) {
    container.innerHTML = '<p>没有找到英雄数据</p>';
  }
}

function generateHeroFormEdit(container) {
  if (!configData.heroes) {
    configData.heroes = [];
  }

  // 按位置分类英雄
  const positionGroups = {};
  configData.heroes.forEach(hero => {
    const position = hero.type || '未分类';
    if (!positionGroups[position]) {
      positionGroups[position] = [];
    }
    positionGroups[position].push(hero.name);
  });

  // 创建选项卡容器
  const tabContainer = document.createElement('div');
  tabContainer.className = 'tab-container';
  container.appendChild(tabContainer);

  // 创建选项卡标题栏
  const tabHeader = document.createElement('div');
  tabHeader.className = 'tab-header';
  tabContainer.appendChild(tabHeader);

  // 确保标准位置都有对应的分组
  standardPositions.forEach(position => {
    if (!positionGroups[position]) {
      positionGroups[position] = [];
    }
  });

  // 创建选项卡内容区域
  const positions = [];
  // 先添加标准位置
  standardPositions.forEach(pos => {
    if (positionGroups[pos] && positionGroups[pos].length > 0) {
      positions.push(pos);
    }
  });
  // 如果有非标准位置且有英雄，也添加进来
  Object.keys(positionGroups).forEach(pos => {
    if (!standardPositions.includes(pos) && positionGroups[pos].length > 0 && !positions.includes(pos)) {
      positions.push(pos);
    }
  });
  positions.forEach((position, index) => {
    // 创建选项卡按钮
    const tabButton = document.createElement('div');
    tabButton.className = `tab-button ${index === 0 ? 'active' : ''}`;
    tabButton.textContent = position;
    tabButton.onclick = function () {
      // 移除所有活动状态
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

      // 设置当前选项卡为活动状态
      this.classList.add('active');
      document.getElementById(`tab-edit-content-${position}`).classList.add('active');
    };
    tabHeader.appendChild(tabButton);

    // 创建选项卡内容
    const tabContent = document.createElement('div');
    tabContent.className = `tab-content ${index === 0 ? 'active' : ''}`;
    tabContent.id = `tab-edit-content-${position}`;
    tabContainer.appendChild(tabContent);

    // 添加标题和添加按钮
    const headerDiv = document.createElement('div');
    headerDiv.className = 'form-section-header';
    headerDiv.innerHTML = `
                <span>${position}英雄</span>
                <button type="button" class="add-item-btn" onclick="addHeroToPosition('${position}')">添加英雄</button>
            `;
    tabContent.appendChild(headerDiv);

    // 创建英雄列表区域
    const heroListDiv = document.createElement('div');
    heroListDiv.className = 'form-section-content';
    heroListDiv.id = `heroEditList-${position}`;
    tabContent.appendChild(heroListDiv);

    // 添加该位置的所有英雄
    const positionHeroes = configData.heroes.filter(hero => hero.type === position);
    positionHeroes.forEach(hero => {
      const heroDiv = document.createElement('div');
      heroDiv.className = 'hero-item-simple';

      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.value = hero.name;
      nameInput.placeholder = '输入英雄名称';
      nameInput.dataset.position = position;
      nameInput.dataset.originalName = hero.name;
      nameInput.className = 'hero-name-input';
      nameInput.name = `heroName-${position}-${hero.name}`;
      nameInput.addEventListener('change', function () {
        updateHeroName(hero.name, this.value, position);
        this.dataset.originalName = this.value;
      });

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'remove-item-btn';
      removeBtn.title = '删除';
      removeBtn.innerHTML = '<span class="remove-icon">🗑️</span>';
      removeBtn.addEventListener('click', function () {
        removeHeroFromPosition(hero.name, position);
        heroDiv.remove();
      });

      heroDiv.appendChild(nameInput);
      heroDiv.appendChild(removeBtn);
      heroListDiv.appendChild(heroDiv);
    });
  });
}

function removeHeroItem(index) {
  configData.heroes.splice(index, 1);
  // 不再重新生成整个表单，而是让调用者处理DOM更新
  // generateFormEdit(); // 重新生成表单
}

function addHeroToPosition(position) {
  if (!configData.heroes) {
    configData.heroes = [];
  }

  // 创建新英雄对象
  const newHero = {
    name: '',
    type: position,
    skill: '',
    description: ''
  };

  // 添加到配置数据
  configData.heroes.push(newHero);

  // 获取该位置的英雄列表容器
  const heroListDiv = document.getElementById(`heroEditList-${position}`);

  // 创建新英雄元素
  const heroDiv = document.createElement('div');
  heroDiv.className = 'hero-item-simple';

  // 创建名称输入框
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.value = '';
  nameInput.placeholder = '输入英雄名称';
  nameInput.dataset.position = position;
  nameInput.dataset.originalName = '';
  nameInput.className = 'hero-name-input';
  nameInput.addEventListener('change', function () {
    updateHeroName(this.dataset.originalName, this.value, position);
    this.dataset.originalName = this.value;
  });

  // 创建删除按钮
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-item-btn';
  removeBtn.title = '删除';
  removeBtn.innerHTML = '<span class="remove-icon">🗑️</span>';
  removeBtn.addEventListener('click', function () {
    removeHeroFromPosition(nameInput.value, position);
    heroDiv.remove();
  });

  // 组装并添加到容器
  heroDiv.appendChild(nameInput);
  heroDiv.appendChild(removeBtn);
  heroListDiv.appendChild(heroDiv);

  // 聚焦到新创建的输入框
  nameInput.focus();
}

function removeHeroFromPosition(heroName, position) {
  if (!heroName) return;

  // 查找并移除英雄
  const index = configData.heroes.findIndex(hero =>
    hero.name === heroName && hero.type === position);

  if (index !== -1) {
    configData.heroes.splice(index, 1);
  }
}

function updateHeroName(oldName, newName, position) {
  if (!newName) return;

  // 查找并更新英雄名称
  const hero = configData.heroes.find(hero =>
    hero.name === oldName && hero.type === position);

  if (hero) {
    hero.name = newName;
  }
}



function parseSimpleYaml(yamlText) {
  // 简单的YAML解析器，支持位置分组结构和用户结构
  const lines = yamlText.split('\n');
  const result = {};
  let currentArray = null;
  let currentObject = null;
  let currentKey = null;

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;



    if (line.endsWith(':')) {
      // 数组或对象开始
      currentKey = line.slice(0, -1).trim();
      if (currentKey === 'heroes') {
        // 标准heroes结构
        result[currentKey] = [];
        currentArray = result[currentKey];
      } else {
        // 位置分组结构（对抗路、打野等）
        result[currentKey] = [];
        currentArray = result[currentKey];
      }
    } else if (line.startsWith('- name:') || line.startsWith('-name:')) {
      // 新的数组项（标准heroes或users结构）
      currentObject = {};
      if (currentArray) {
        currentArray.push(currentObject);
      }
      const name = line.replace(/^-\s*name:\s*/, '').replace(/"/g, '');
      currentObject.name = name;
    } else if (line.startsWith('- ')) {
      // 列表项
      const itemValue = line.replace(/^-\s*/, '').trim().replace(/"/g, '');
      if (currentArray) {
        // 简单的列表项（位置分组结构）
        if (itemValue) {
          currentArray.push(itemValue);
        }
      }
    } else if (line.includes(':') && currentObject) {
      // 对象属性
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      const keyName = key.trim();

      if (keyName !== 'name') {
        let processedValue = value.replace(/"/g, '');
        currentObject[keyName] = processedValue;
      }
    }
  }

  // 如果解析出的是位置分组结构，转换为heroes数组格式
  if (!result.heroes && Object.keys(result).length > 0) {
    result.heroes = [];
    for (const [position, heroList] of Object.entries(result)) {
      if (Array.isArray(heroList)) {
        heroList.forEach(heroName => {
          if (typeof heroName === 'string' && heroName.trim()) {
            result.heroes.push({
              name: heroName,
              type: position,
              skill: '',
              description: ''
            });
          }
        });
      }
    }
  }

  return result;
}

function saveFormChanges() {
  // 从表单收集数据
  // 收集英雄表单数据
  const heroInputs = document.querySelectorAll('.hero-name-input');
  const heroes = [];

  heroInputs.forEach(input => {
    const name = input.value.trim();
    const position = input.dataset.position;
    if (name && position) {
      heroes.push({ name, type: position });
    }
  });
  configData.heroes = heroes;

  // 转换为YAML格式
  const newYamlContent = generateYamlFromConfig(configData);

  // 更新YAML编辑器内容
  document.getElementById('yamlContent').textContent = newYamlContent;
  document.getElementById('yamlEditor').value = newYamlContent;
  originalYamlContent = newYamlContent;

  // 调用保存API
  const editApiUrl = API_BASE_URL + '/gagaFamily/conf/heroEdit';

  // 显示保存中状态
  const saveBtn = document.querySelector('.save-btn');
  const originalText = saveBtn.textContent;
  saveBtn.textContent = '保存中...';
  saveBtn.disabled = true;

  fetch(editApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain'
    },
    body: newYamlContent
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('保存失败，状态码：' + response.status);
      }
      return response.text();
    })
    .then(data => {
      setEditMode(false);
      alert('保存成功：' + data);
    })
    .catch(error => {
      alert('保存失败：' + error.message);
    })
    .finally(() => {
      // 恢复按钮状态
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    });
}

function generateYamlFromConfig(config) {
  if (config.heroes) {
    // 按位置分组英雄
    const positionGroups = {};
    config.heroes.forEach(hero => {
      if (!hero.name.trim()) return; // 跳过空名称的英雄

      const position = hero.type || '未分类';
      if (!positionGroups[position]) {
        positionGroups[position] = [];
      }
      positionGroups[position].push(hero.name);
    });

    // 生成位置分组的YAML格式
    let yaml = '';
    for (const [position, heroList] of Object.entries(positionGroups)) {
      if (heroList.length > 0) {
        yaml += `${position}:\n`;
        heroList.forEach(heroName => {
          yaml += `  - ${heroName}\n`;
        });
      }
    }
    return yaml;
  }
  return originalYamlContent; // 回退到原始内容
}

function cancelEdit() {
  // 取消编辑，恢复原始内容
  document.getElementById('yamlEditor').value = originalYamlContent;
  try {
    configData = parseSimpleYaml(originalYamlContent);
  } catch (error) {
    console.error('YAML解析错误:', error);
  }
  setEditMode(false);
}

function saveChanges() {
  // YAML编辑模式的保存
  const newContent = document.getElementById('yamlEditor').value;

  // 简单验证
  if (!newContent.trim()) {
    alert('内容不能为空');
    return;
  }

  document.getElementById('yamlContent').textContent = newContent;
  originalYamlContent = newContent;

  // 选择对应的编辑API端点
  const editApiUrl = API_BASE_URL + '/gagaFamily/conf/heroEdit';

  // 显示保存中状态
  const saveBtn = document.querySelector('#yamlEditContainer .save-btn');
  const originalText = saveBtn.textContent;
  saveBtn.textContent = '保存中...';
  saveBtn.disabled = true;

  fetch(editApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain'
    },
    body: newContent
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('保存失败，状态码：' + response.status);
      }
      return response.text();
    })
    .then(data => {
      // 更新解析的数据
      try {
        configData = parseSimpleYaml(newContent);
      } catch (error) {
        console.error('YAML解析错误:', error);
      }
      setEditMode(false);
      alert('保存成功：' + data);
    })
    .catch(error => {
      alert('保存失败：' + error.message);
    })
    .finally(() => {
      // 恢复按钮状态
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    });
}

// 点击弹窗外部区域关闭弹窗
window.onclick = function (event) {
  const modal = document.getElementById('yamlModal');
  if (event.target === modal) {
    closeModal();
  }
  const groupResultModal = document.getElementById('groupResultModal');
  if (event.target === groupResultModal) {
    closeGroupResultModal();
  }

}

// 键盘快捷键支持
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    closeModal();
    closeGroupResultModal();
  }
});

// Toast提示函数
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}
// 在保存、删除等操作成功/失败时调用 showToast('操作成功')



// 分组结果弹窗
function showGroupResultModal(text) {
  // 解析分组文本
  const groupBlocks = text.split(/-+/).filter(block => block.trim().length > 0);
  let html = '<div class="group-result-container">';
  let groupIndex = 1;
  let remarkHtml = '';
  groupBlocks.forEach((block, idx) => {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length === 0) return;
    // 第三组作为备注，暂存
    if (groupIndex === 3) {
      remarkHtml += `<div class='group-remark'>`;
      lines.forEach(line => {
        remarkHtml += `<div class='remark-line'>${line}</div>`;
      });
      remarkHtml += `</div>`;
    } else {
      html += `<div class="group-table-card">`;
      html += `<div class="group-table-title">第${groupIndex}组</div>`;
      html += '<table class="group-table"><tbody>';
      lines.forEach(line => {
        // 例: [对抗路]玩家为[张三]随机英雄为[吕布]
        const m = line.match(/\[(.+?)\]玩家为\[(.+?)\]随机英雄为\[(.+?)\]/);
        if (m) {
          html += `<tr><td class='group-td-pos'>${m[1]}</td><td class='group-td-name'>${m[2]}</td><td class='group-td-hero'>${m[3]}</td></tr>`;
        } else {
          html += `<tr><td colspan='3' class='group-td-other'>${line}</td></tr>`;
        }
      });
      html += '</tbody></table>';
      html += '</div>';
    }
    groupIndex++;
  });
  html += '</div>';
  // 备注放最下方
  html += `<div class='group-remark-outer'>${remarkHtml}</div>`;
  // 弹窗
  let modal = document.getElementById('groupResultModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'groupResultModal';
    modal.className = 'modal';
    modal.innerHTML = `<div class="modal-content"><div class="modal-header"><h2>分组结果</h2><span class="close" onclick="closeGroupResultModal()">&times;</span></div><div class="modal-body" id="groupResultBody"></div></div>`;
    document.body.appendChild(modal);
  }
  document.getElementById('groupResultBody').innerHTML = html;
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}
function closeGroupResultModal() {
  const modal = document.getElementById('groupResultModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = 'auto';
}
// 拦截分组按钮alert
const oldAlert = window.alert;
window.alert = function (msg) {
  if (typeof msg === 'string' && msg.includes('玩家为')) {
    showGroupResultModal(msg);
  } else {
    oldAlert(msg);
  }
};