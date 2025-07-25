// 用户管理页面状态变量
let originalYamlContent = '';
let currentEditMode = false;
let currentViewMode = 'form'; // 'yaml' 或 'form'
let configData = {};
let heroLaneMap = null;

// 加载用户配置
function loadUserConfig() {
  // 先加载hero.yaml获取英雄分路信息
  fetch(API_BASE_URL + '/gagaFamily/conf/heroYaml')
    .then(res => res.text())
    .then(heroYaml => {
      heroLaneMap = parseHeroYamlToLaneMap(heroYaml);
      // 然后加载用户配置
      return fetch(API_BASE_URL + '/gagaFamily/conf/userYaml');
    })
    .then(response => {
      if (!response.ok) throw new Error('网络响应失败，状态码：' + response.status);
      return response.text();
    })
    .then(data => {
      showUserModal(data);
    })
    .catch(error => {
      alert('请求失败：' + error.message);
    });
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

function showUserModal(yamlContent) {
  originalYamlContent = yamlContent;

  try {
    // 简单的YAML解析（仅支持基本结构）
    configData = parseSimpleYaml(yamlContent);
  } catch (error) {
    console.error('YAML解析错误:', error);
    configData = {};
  }

  document.getElementById('yamlContent').textContent = yamlContent;
  document.getElementById('yamlEditor').value = yamlContent;

  document.getElementById('userModal').style.display = 'block';
  setEditMode(false);
  setViewMode('form');

  // 阻止页面滚动
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('userModal').style.display = 'none';
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
}

function generateFormView() {
  const container = document.getElementById('formContent');
  container.innerHTML = '';

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

function generateFormEdit() {
  const container = document.getElementById('configForm');
  container.innerHTML = '';

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

  // 直接添加新用户项到DOM
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

    // 直接移除用户元素
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
  // 直接添加新项到DOM
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

  // 直接移除项目元素
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
  // 简单的YAML解析器，支持用户结构
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
      if (line.startsWith('"') && (line.endsWith('"') || line.endsWith('"') || line.endsWith('",'))) {
        const item = line.replace(/^"|"$|"$|",$/g, '');
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
      if (currentKey === 'users') {
        // 标准users结构
        result[currentKey] = [];
        currentArray = result[currentKey];
        currentSubArray = null;
        currentSubKey = null;
      } else if (currentObject && (currentKey === 'banList' || currentKey === 'weightList')) {
        // 用户的banList或weightList
        currentObject[currentKey] = [];
        currentSubArray = currentObject[currentKey];
        currentSubKey = currentKey;
      }
    } else if (line.startsWith('- name:') || line.startsWith('-name:')) {
      // 新的数组项（标准users结构）
      currentObject = {};
      if (currentArray) {
        currentArray.push(currentObject);
      }
      const name = line.replace(/^-\s*name:\s*/, '').replace(/"/g, '');
      currentObject.name = name;
      currentSubArray = null;
      currentSubKey = null;
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

  return result;
}

function saveFormChanges() {
  // 从表单收集数据
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
      
      // 收集banList
      const banHeroInputs = document.querySelectorAll(`select[data-list-type='banHero'][data-user-index='${userIndex}']`);
      banHeroInputs.forEach(sel => {
        const hero = sel.value.trim();
        if (hero) user.banList.push(hero);
      });
      
      // 收集weightList
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

      users.push(user);
    }
  });

  configData.users = users;

  // 转换为YAML格式
  const newYamlContent = generateYamlFromConfig(configData);

  // 更新YAML编辑器内容
  document.getElementById('yamlContent').textContent = newYamlContent;
  document.getElementById('yamlEditor').value = newYamlContent;
  originalYamlContent = newYamlContent;

  // 调用保存API
  const editApiUrl = API_BASE_URL + '/gagaFamily/conf/userEdit';

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
      showToast('保存成功：' + data);
    })
    .catch(error => {
      showToast('保存失败：' + error.message);
    })
    .finally(() => {
      // 恢复按钮状态
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    });
}

function generateYamlFromConfig(config) {
  if (config.users) {
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
    showToast('内容不能为空');
    return;
  }

  document.getElementById('yamlContent').textContent = newContent;
  originalYamlContent = newContent;

  const editApiUrl = API_BASE_URL + '/gagaFamily/conf/userEdit';

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
      showToast('保存成功：' + data);
    })
    .catch(error => {
      showToast('保存失败：' + error.message);
    })
    .finally(() => {
      // 恢复按钮状态
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    });
}

// 点击弹窗外部区域关闭弹窗
window.onclick = function (event) {
  const modal = document.getElementById('userModal');
  if (event.target === modal) {
    closeModal();
  }
}

// 键盘快捷键支持
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    closeModal();
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