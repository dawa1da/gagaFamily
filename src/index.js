// 应用状态变量
let originalYamlContent = '';
let currentEditMode = false;
let currentViewMode = 'form'; // 'yaml' 或 'form'
let currentConfigType = '';
let configData = {};

// 新增：全局英雄分路-英雄池缓存
let heroLaneMap = null;

// 修改urlRequest，弹出user配置编辑时，预加载hero.yaml
function urlRequest(url, isYaml = false, configType = '') {
  const apiUrl = API_BASE_URL + url;
  // 如果是user配置，先加载hero.yaml
  if (configType === 'user') {
    fetch(API_BASE_URL + '/gagaFamily/conf/heroYaml')
      .then(res => res.text())
      .then(heroYaml => {
        heroLaneMap = parseHeroYamlToLaneMap(heroYaml);
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
      });
  } else {
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
  const title = configType === 'hero' ? 'HERO配置' :
    configType === 'user' ? 'USER配置' : '配置内容';
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
  } else if (currentConfigType === 'user') {
    generateUserFormView(container);
  } else {
    container.innerHTML = '<p>未知配置类型</p>';
  }
}

function generateFormEdit() {
  const container = document.getElementById('configForm');
  container.innerHTML = '';

  if (currentConfigType === 'hero') {
    generateHeroFormEdit(container);
  } else if (currentConfigType === 'user') {
    generateUserFormEdit(container);
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

function generateUserFormView(container) {
  // 用户配置的表单视图生成逻辑
  if (!configData.users || !Array.isArray(configData.users)) {
    container.innerHTML = '<p>没有找到用户数据</p>';
    return;
  }

  let html = '<div class="form-section">';
  html += '<div class="form-section-header">';
  html += '<span>用户配置</span>';
  html += '<span>共 ' + configData.users.length + ' 个用户</span>';
  html += '</div>';
  html += '<div class="form-section-content">';

  configData.users.forEach((user, index) => {
    html += '<div class="hero-item">';
    html += '<div class="hero-item-header">';
    html += '<div class="hero-item-title">用户: ' + (user.name || '未命名') + '</div>';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<label>用户名:</label>';
    html += '<span>' + (user.name || '未设置') + '</span>';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<label>禁用英雄:</label>';
    html += '<span>' + (user.banList && user.banList.length > 0 ? user.banList.join(', ') : '无') + '</span>';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<label>权重英雄:</label>';
    html += '<span>' + (user.weightList && user.weightList.length > 0 ? user.weightList.join(', ') : '无') + '</span>';
    html += '</div>';

    html += '<div class="form-group">';
    html += '<label>玩家状态:</label>';
    html += '<span>' + (user.disable ? '已禁用' : '启用') + '</span>';
    html += '</div>';

    html += '</div>';
  });

  html += '</div>';
  html += '</div>';

  container.innerHTML = html;
}

function generateUserFormEdit(container) {
  // 用户配置的表单编辑逻辑
  if (!configData.users || !Array.isArray(configData.users)) {
    configData.users = [];
  }

  let html = '<div class="form-section">';
  html += '<div class="form-section-header">';
  html += '<span>用户配置编辑</span>';
  html += '<button type="button" class="add-item-btn" onclick="addNewUser()">添加用户</button>';
  html += '</div>';
  html += '<div class="form-section-content" id="usersContainer">';

  configData.users.forEach((user, index) => {
    html += generateUserEditItem(user, index);
  });

  html += '</div>';
  html += '</div>';

  container.innerHTML = html;
}

function generateUserEditItem(user, index) {
  let html = '<div class="hero-item" data-user-index="' + index + '">';
  html += '<div class="hero-item-header">';
  html += '<div class="hero-item-title">用户 ' + (index + 1) + '</div>';
  html += '<button type="button" class="remove-item-btn" onclick="removeUser(' + index + ')" title="删除"><span class="remove-icon">🗑️</span></button>';
  html += '</div>';
  // 用户名输入
  html += '<div class="form-group">';
  html += '<label>用户名:</label>';
  html += '<input type="text" class="user-name-input" data-user-index="' + index + '" value="' + (user.name || '') + '" placeholder="输入用户名">';
  html += '</div>';
  // 禁用状态
  html += '<div class="form-group">';
  html += '<label>玩家状态:</label>';
  html += '<input type="checkbox" class="user-disable-input" data-user-index="' + index + '" ' + (user.disable ? 'checked' : '') + '>';
  html += '<span style="margin-left: 8px;">禁用该用户</span>';
  html += '</div>';
  // 禁用英雄列表
  html += '<div class="form-group">';
  html += '<label>禁用英雄:</label>';
  html += '<div class="list-container">';
  html += '<div class="list-items" id="banList-' + index + '">';
  if (user.banList && user.banList.length > 0) {
    user.banList.forEach((hero, heroIndex) => {
      let lane = '';
      let heroName = hero;
      // 尝试自动推断分路
      if (heroLaneMap) {
        for (const l in heroLaneMap) {
          if (heroLaneMap[l].includes(hero)) { lane = l; break; }
        }
      }
      html += '<div class="list-item edit-compact">';
      html += '<select data-list-type="banLane" data-user-index="' + index + '" data-item-index="' + heroIndex + '" onchange="updateBanHeroSelect(this)">' + renderLaneOptions(lane) + '</select>';
      html += '<select data-list-type="banHero" data-user-index="' + index + '" data-item-index="' + heroIndex + '">' + renderHeroOptions(lane, heroName) + '</select>';
      html += '<button type="button" class="remove-item-btn" onclick="removeListItem(\'banList\', ' + index + ', ' + heroIndex + ')" title="删除"><span class="remove-icon">🗑️</span></button>';
      html += '</div>';
    });
  }
  html += '</div>';
  html += '<button type="button" class="add-item-btn" onclick="addListItem(\'banList\', ' + index + ')">添加禁用英雄</button>';
  html += '</div>';
  html += '</div>';
  // 权重英雄列表
  html += '<div class="form-group">';
  html += '<label>权重英雄:</label>';
  html += '<div class="list-container">';
  html += '<div class="list-items" id="weightList-' + index + '">';
  if (user.weightList && user.weightList.length > 0) {
    user.weightList.forEach((hero, heroIndex) => {
      let lane = '';
      let heroName = hero;
      let heroWeight = '';
      if (hero.includes('*')) {
        const arr = hero.split('*');
        heroName = arr[0];
        heroWeight = arr[1];
      }
      if (heroLaneMap) {
        for (const l in heroLaneMap) {
          if (heroLaneMap[l].includes(heroName)) { lane = l; break; }
        }
      }
      html += '<div class="list-item edit-compact">';
      html += '<select data-list-type="weightLane" data-user-index="' + index + '" data-item-index="' + heroIndex + '" onchange="updateWeightHeroSelect(this)">' + renderLaneOptions(lane) + '</select>';
      html += '<select data-list-type="weightHero" data-user-index="' + index + '" data-item-index="' + heroIndex + '">' + renderHeroOptions(lane, heroName) + '</select>';
      html += '<span style="margin:0 4px;">*</span>';
      html += '<input type="number" min="1" max="1000" value="' + (heroWeight || '') + '" data-list-type="weightNum" data-user-index="' + index + '" data-item-index="' + heroIndex + '" placeholder="1~1000" style="width:60px;">';
      html += '<button type="button" class="remove-item-btn" onclick="removeListItem(\'weightList\', ' + index + ', ' + heroIndex + ')" title="删除"><span class="remove-icon">🗑️</span></button>';
      html += '</div>';
    });
  }
  html += '</div>';
  html += '<button type="button" class="add-item-btn" onclick="addListItem(\'weightList\', ' + index + ')">添加权重英雄</button>';
  html += '</div>';
  html += '</div>';
  html += '</div>';
  return html;
}
// 渲染分路下拉
function renderLaneOptions(selected) {
  if (!heroLaneMap) return '<option value="">请选择分路</option>';
  let html = '<option value="">请选择分路</option>';
  for (const lane in heroLaneMap) {
    html += `<option value="${lane}"${lane === selected ? ' selected' : ''}>${lane}</option>`;
  }
  return html;
}
// 渲染英雄下拉
function renderHeroOptions(lane, selected) {
  if (!heroLaneMap || !lane || !heroLaneMap[lane]) return '<option value="">请选择英雄</option>';
  let html = '<option value="">请选择英雄</option>';
  heroLaneMap[lane].forEach(hero => {
    html += `<option value="${hero}"${hero === selected ? ' selected' : ''}>${hero}</option>`;
  });
  return html;
}
// 联动：分路变动时刷新英雄下拉
function updateBanHeroSelect(sel) {
  const lane = sel.value;
  const userIndex = sel.getAttribute('data-user-index');
  const itemIndex = sel.getAttribute('data-item-index');
  const heroSel = document.querySelector(`select[data-list-type='banHero'][data-user-index='${userIndex}'][data-item-index='${itemIndex}']`);
  heroSel.innerHTML = renderHeroOptions(lane, '');
}
function updateWeightHeroSelect(sel) {
  const lane = sel.value;
  const userIndex = sel.getAttribute('data-user-index');
  const itemIndex = sel.getAttribute('data-item-index');
  const heroSel = document.querySelector(`select[data-list-type='weightHero'][data-user-index='${userIndex}'][data-item-index='${itemIndex}']`);
  heroSel.innerHTML = renderHeroOptions(lane, '');
}

function addNewUser() {
  if (!configData.users) {
    configData.users = [];
  }

  const newUser = {
    name: "",
    banList: [],
    weightList: [],
    disable: false
  };

  configData.users.push(newUser);

  // 不再重新生成整个表单，而是直接添加新用户项到DOM
  const usersContainer = document.getElementById('usersContainer');
  const userIndex = configData.users.length - 1;
  const userHtml = generateUserEditItem(newUser, userIndex);

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = userHtml;
  const userElement = tempDiv.firstChild;
  usersContainer.appendChild(userElement);

  // 聚焦到新用户的名称输入框
  const nameInput = userElement.querySelector('.user-name-input');
  if (nameInput) {
    nameInput.focus();
  }
}

function removeUser(userIndex) {
  if (confirm('确定要删除这个用户吗？')) {
    configData.users.splice(userIndex, 1);

    // 不再重新生成整个表单，而是直接移除用户元素
    const userElement = document.querySelector(`[data-user-index="${userIndex}"]`);
    if (userElement) {
      userElement.remove();
    }

    // 更新剩余用户元素的索引
    const remainingUsers = document.querySelectorAll('[data-user-index]');
    remainingUsers.forEach((element, index) => {
      const currentIndex = parseInt(element.getAttribute('data-user-index'));
      if (currentIndex > userIndex) {
        element.setAttribute('data-user-index', currentIndex - 1);
        // 更新所有相关的索引引用
        const inputs = element.querySelectorAll('[data-user-index]');
        inputs.forEach(input => {
          input.setAttribute('data-user-index', currentIndex - 1);
        });
        // 更新按钮的onclick属性
        const removeBtn = element.querySelector('.remove-item-btn');
        if (removeBtn) {
          removeBtn.setAttribute('onclick', `removeUser(${currentIndex - 1})`);
        }
      }
    });
  }
}

function addListItem(listType, userIndex) {
  if (!configData.users[userIndex][listType]) {
    configData.users[userIndex][listType] = [];
  }
  configData.users[userIndex][listType].push('');
  // 不再重新生成整个表单，而是直接添加新项到DOM
  const listContainer = document.getElementById(`${listType}-${userIndex}`);
  if (listContainer) {
    const itemIndex = configData.users[userIndex][listType].length - 1;
    let itemDiv = document.createElement('div');
    itemDiv.className = 'list-item edit-compact';
    if (listType === 'banList') {
      // 新增禁用英雄：分路下拉+英雄下拉
      itemDiv.innerHTML = `
                    <select data-list-type="banLane" data-user-index="${userIndex}" data-item-index="${itemIndex}" onchange="updateBanHeroSelect(this)">${renderLaneOptions('')}</select>
                    <select data-list-type="banHero" data-user-index="${userIndex}" data-item-index="${itemIndex}">${renderHeroOptions('', '')}</select>
                    <button type="button" class="remove-item-btn" onclick="removeListItem('banList', ${userIndex}, ${itemIndex})" title="删除"><span class="remove-icon">🗑️</span></button>
                `;
    } else if (listType === 'weightList') {
      // 新增权重英雄：分路下拉+英雄下拉+数字输入
      itemDiv.innerHTML = `
                    <select data-list-type="weightLane" data-user-index="${userIndex}" data-item-index="${itemIndex}" onchange="updateWeightHeroSelect(this)">${renderLaneOptions('')}</select>
                    <select data-list-type="weightHero" data-user-index="${userIndex}" data-item-index="${itemIndex}">${renderHeroOptions('', '')}</select>
                    <span style="margin:0 4px;">*</span>
                    <input type="number" min="1" max="1000" value="" data-list-type="weightNum" data-user-index="${userIndex}" data-item-index="${itemIndex}" placeholder="1~1000" style="width:60px;">
                    <button type="button" class="remove-item-btn" onclick="removeListItem('weightList', ${userIndex}, ${itemIndex})" title="删除"><span class="remove-icon">🗑️</span></button>
                `;
    }
    listContainer.appendChild(itemDiv);
    // 聚焦到新创建的分路下拉
    const sel = itemDiv.querySelector('select');
    if (sel) sel.focus();
  }
}

function removeListItem(listType, userIndex, itemIndex) {
  configData.users[userIndex][listType].splice(itemIndex, 1);

  // 不再重新生成整个表单，而是直接移除项目元素
  const listContainer = document.getElementById(`${listType}-${userIndex}`);
  if (listContainer) {
    const items = listContainer.querySelectorAll('.list-item');
    if (items[itemIndex]) {
      items[itemIndex].remove();
    }

    // 更新剩余项目的索引
    const remainingItems = listContainer.querySelectorAll('.list-item');
    remainingItems.forEach((item, index) => {
      const input = item.querySelector('input');
      const button = item.querySelector('button');
      if (input) {
        input.setAttribute('data-item-index', index);
      }
      if (button) {
        button.setAttribute('onclick', `removeListItem('${listType}', ${userIndex}, ${index})`);
      }
    });
  }
}

function parseSimpleYaml(yamlText) {
  // 简单的YAML解析器，支持位置分组结构和用户结构
  const lines = yamlText.split('\n');
  const result = {};
  let currentArray = null;
  let currentObject = null;
  let currentKey = null;
  let currentSubArray = null;
  let currentSubKey = null;
  let inMultiLineArray = false;
  let multiLineArrayKey = null;

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;

    // 处理多行数组结束
    if (inMultiLineArray && line === ']') {
      inMultiLineArray = false;
      multiLineArrayKey = null;
      continue;
    }

    // 处理多行数组中的项目
    if (inMultiLineArray) {
      // 处理带引号的项目，可能有尾随逗号
      if (line.startsWith('"') && (line.endsWith('"') || line.endsWith('",') || line.endsWith('",'))) {
        const item = line.replace(/^"|"$|",$|",$/g, '');
        if (currentObject && multiLineArrayKey && currentObject[multiLineArrayKey] && item.trim()) {
          currentObject[multiLineArrayKey].push(item);
        }
        continue;
      }
      // 处理不带引号的项目，可能有尾随逗号
      else if (!line.includes('[') && !line.includes(']') && line.trim() && !line.endsWith(':')) {
        const item = line.replace(/,$/, '').trim();
        if (currentObject && multiLineArrayKey && currentObject[multiLineArrayKey] && item) {
          currentObject[multiLineArrayKey].push(item);
        }
        continue;
      }
    }

    if (line.endsWith(':')) {
      // 数组或对象开始
      currentKey = line.slice(0, -1).trim();
      if (currentKey === 'heroes' || currentKey === 'users') {
        // 标准heroes或users结构
        result[currentKey] = [];
        currentArray = result[currentKey];
        currentSubArray = null;
        currentSubKey = null;
      } else if (currentObject && (currentKey === 'banList' || currentKey === 'weightList')) {
        // 用户的banList或weightList
        currentObject[currentKey] = [];
        currentSubArray = currentObject[currentKey];
        currentSubKey = currentKey;
      } else {
        // 位置分组结构（对抗路、打野等）
        result[currentKey] = [];
        currentArray = result[currentKey];
        currentSubArray = null;
        currentSubKey = null;
      }
    } else if (line.startsWith('- name:') || line.startsWith('-name:')) {
      // 新的数组项（标准heroes或users结构）
      currentObject = {};
      if (currentArray) {
        currentArray.push(currentObject);
      }
      const name = line.replace(/^-\s*name:\s*/, '').replace(/"/g, '');
      currentObject.name = name;
      currentSubArray = null;
      currentSubKey = null;
    } else if (line.startsWith('- ')) {
      // 列表项
      const itemValue = line.replace(/^-\s*/, '').trim().replace(/"/g, '');
      if (currentSubArray) {
        // 子数组项（banList或weightList）
        if (itemValue) {
          currentSubArray.push(itemValue);
        }
      } else if (currentArray) {
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

      if (keyName === 'banList' || keyName === 'weightList') {
        // 处理内联数组格式，如 banList: [ ] 或 banList: ["item1", "item2"]
        currentObject[keyName] = [];
        if (value.includes('[') && value.includes(']')) {
          // 单行内联数组格式
          const arrayContent = value.substring(value.indexOf('[') + 1, value.lastIndexOf(']')).trim();
          if (arrayContent) {
            // 分割数组项并清理引号
            const items = arrayContent.split(',').map(item =>
              item.trim().replace(/^["']|["']$/g, '')
            ).filter(item => item.length > 0);
            currentObject[keyName] = items;
          }
        } else if (value.trim() === '[') {
          // 多行数组开始
          inMultiLineArray = true;
          multiLineArrayKey = keyName;
        }
      } else if (keyName !== 'name') {
        let processedValue = value.replace(/"/g, '');
        // 处理布尔值
        if (keyName === 'disable') {
          processedValue = processedValue === 'true';
        }
        currentObject[keyName] = processedValue;
      }
    }
  }

  // 如果解析出的是位置分组结构，转换为heroes数组格式
  if (!result.heroes && !result.users && Object.keys(result).length > 0) {
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
  if (currentConfigType === 'user') {
    // 收集用户表单数据
    const userInputs = document.querySelectorAll('.user-name-input');
    const users = [];

    userInputs.forEach(input => {
      const userIndex = parseInt(input.dataset.userIndex);
      const name = input.value.trim();

      if (name) {
        // 获取禁用状态
        const disableInput = document.querySelector(`.user-disable-input[data-user-index='${userIndex}']`);
        const disable = disableInput ? disableInput.checked : false;

        const user = { name: name, banList: [], weightList: [], disable: disable };
        // 只保存该用户的banList
        const banHeroInputs = document.querySelectorAll(`select[data-list-type='banHero'][data-user-index='${userIndex}']`);
        banHeroInputs.forEach(sel => {
          const hero = sel.value.trim();
          if (hero) user.banList.push(hero);
        });
        // 只保存该用户的weightList
        const weightHeroInputs = document.querySelectorAll(`select[data-list-type='weightHero'][data-user-index='${userIndex}']`);
        const weightNumInputs = document.querySelectorAll(`input[data-list-type='weightNum'][data-user-index='${userIndex}']`);
        for (let i = 0; i < weightHeroInputs.length; i++) {
          const hero = weightHeroInputs[i].value.trim();
          let num = weightNumInputs[i].value.trim();
          if (hero && num) {
            let n = parseInt(num, 10);
            if (isNaN(n) || n < 1) n = 1;
            if (n > 1000) n = 1000;
            user.weightList.push(`${hero}*${n}`);
          }
        }

        // 收集banList
        const banInputs = document.querySelectorAll(`input[data-list-type="banList"][data-user-index="${userIndex}"]`);
        banInputs.forEach(banInput => {
          const banHero = banInput.value.trim();
          if (banHero) {
            user.banList.push(banHero);
          }
        });

        // 收集weightList
        const weightInputs = document.querySelectorAll(`input[data-list-type="weightList"][data-user-index="${userIndex}"]`);
        weightInputs.forEach(weightInput => {
          const weightHero = weightInput.value.trim();
          if (weightHero) {
            user.weightList.push(weightHero);
          }
        });

        users.push(user);
      }

    });

    configData.users = users;
  } else {
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
  }

  // 转换为YAML格式
  const newYamlContent = generateYamlFromConfig(configData);

  // 更新YAML编辑器内容
  document.getElementById('yamlContent').textContent = newYamlContent;
  document.getElementById('yamlEditor').value = newYamlContent;
  originalYamlContent = newYamlContent;

  // 调用保存API
  let editApiUrl = '';
  if (currentConfigType === 'hero') {
    editApiUrl = API_BASE_URL + '/gagaFamily/conf/heroEdit';
  } else if (currentConfigType === 'user') {
    editApiUrl = API_BASE_URL + '/gagaFamily/conf/userEdit';
  } else {
    alert('无法确定配置类型');
    return;
  }

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
  if (currentConfigType === 'hero' && config.heroes) {
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
  } else if (currentConfigType === 'user' && config.users) {
    // 生成用户配置的YAML格式
    let yaml = 'users:\n';
    config.users.forEach(user => {
      if (!user.name.trim()) return; // 跳过空名称的用户

      yaml += `  - name: "${user.name}"\n`;

      // 生成banList
      yaml += '    banList: ';
      if (user.banList && user.banList.length > 0) {
        yaml += '[\n';
        user.banList.forEach((hero, index) => {
          if (hero.trim()) {
            yaml += `      "${hero}"`;
            if (index < user.banList.length - 1) {
              yaml += ',';
            }
            yaml += '\n';
          }
        });
        yaml += '    ]\n';
      } else {
        yaml += '[ ]\n';
      }

      // 生成weightList
      yaml += '    weightList: ';
      if (user.weightList && user.weightList.length > 0) {
        yaml += '[\n';
        user.weightList.forEach((hero, index) => {
          if (hero.trim()) {
            yaml += `      "${hero}"`;
            if (index < user.weightList.length - 1) {
              yaml += ',';
            }
            yaml += '\n';
          }
        });
        yaml += '    ]\n';
      } else {
        yaml += '[ ]\n';
      }

      // 生成disable字段
      if (user.disable !== undefined) {
        yaml += `    disable: ${user.disable}\n`;
      }
    });
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

  // 根据配置类型选择对应的编辑API端点
  let editApiUrl = '';
  if (currentConfigType === 'hero') {
    editApiUrl = API_BASE_URL + '/gagaFamily/conf/heroEdit';
  } else if (currentConfigType === 'user') {
    editApiUrl = API_BASE_URL + '/gagaFamily/conf/userEdit';
  } else {
    alert('无法确定配置类型');
    return;
  }

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
  // 关闭奖励结算弹窗
  if (event.target.classList.contains('modal') && event.target.style.zIndex === '9999') {
    closeRewardModal();
  }
}

// 键盘快捷键支持
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    closeModal();
    closeGroupResultModal();
    closeRewardModal();
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

// 奖励结算函数
function showRewardResult() {
  // 随机抽取title和desc
  const randomTitle = rewardTitles[Math.floor(Math.random() * rewardTitles.length)];
  const randomDesc = rewardDescs[Math.floor(Math.random() * rewardDescs.length)];
  const randomIcon = icons[Math.floor(Math.random() * icons.length)];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomBg = bgGradients[Math.floor(Math.random() * bgGradients.length)];
  // 创建奖励结算弹窗
  const rewardModal = document.createElement('div');
  rewardModal.className = 'modal';
  rewardModal.style.display = 'block';
  rewardModal.style.zIndex = '9999';
  rewardModal.innerHTML = `
            <div class="modal-content" style="
                max-width: 450px;
                background: ${randomBg};
                border: 3px solid ${randomColor};
                border-radius: 20px;
                box-shadow: 0 15px 35px rgba(0,0,0,0.3);
                animation: rewardModalSlideIn 0.5s ease-out;
            ">
                <div class="modal-header" style="
                    background: transparent;
                    border-bottom: 2px solid ${randomColor};
                    padding: 20px 30px 15px;
                ">
                    <h2 style="
                        color: ${randomColor};
                        font-size: 1.8rem;
                        font-weight: 700;
                        margin: 0;
                        text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
                    ">🎁 奖励结算</h2>
                    <span class="close" onclick="closeRewardModal()" style="
                        color: ${randomColor};
                        font-size: 2rem;
                        font-weight: bold;
                    ">&times;</span>
                </div>
                <div class="modal-body" style="padding: 30px; text-align: center;">
                    <div class="reward-icon" style="
                        font-size: 5rem;
                        margin-bottom: 20px;
                        animation: rewardIconBounce 0.8s ease-in-out;
                    ">${randomIcon}</div>
                    <h3 style="
                        color: ${randomColor};
                        font-size: 1.6rem;
                        margin: 15px 0;
                        font-weight: 700;
                        text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
                    ">${randomTitle}</h3>
                    <div class="reward-amount" style="
                        background: rgba(255,255,255,0.9);
                        padding: 15px 25px;
                        border-radius: 20px;
                        margin: 20px 0;
                        display: inline-block;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                    ">
                        <span style="
                            color: #dc3545;
                            font-size: 1.4rem;
                            font-weight: 700;
                        ">💰 ${randomDesc}</span>
                    </div>
                    <div class="reward-congrats" style="
                        margin-top: 25px;
                        padding: 15px;
                        background: rgba(255,255,255,0.4);
                        border-radius: 15px;
                        font-size: 1.1rem;
                        color: #495057;
                        font-weight: 600;
                    ">🎉 恭喜获得奖励！</div>
                </div>
            </div>
            <style>
                @keyframes rewardModalSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-50px) scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                @keyframes rewardIconBounce {
                    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-15px); }
                    60% { transform: translateY(-7px); }
                }
            </style>
        `;
  document.body.appendChild(rewardModal);
  document.body.style.overflow = 'hidden';
  // 显示Toast提示
  showToast('🎊 奖励结算完成！');
}

function closeRewardModal() {
  const rewardModal = document.querySelector('.modal[style*="z-index: 9999"]');
  if (rewardModal) {
    rewardModal.remove();
    document.body.style.overflow = 'auto';
  }
}

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