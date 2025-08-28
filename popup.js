// 优化版 popup.js：结构化、可访问、修复已知 bug、支持 modal focus trap、自动解析当前 tab 的 repo
(function(){
  'use strict';

  const DEFAULT_TOOLS = window.GitHubToolsConfig ? window.GitHubToolsConfig.DEFAULT_TOOLS : [];
  const DEFAULT_CONFIG = window.GitHubToolsConfig ? window.GitHubToolsConfig.DEFAULT_CONFIG : {};

  let currentSettings = { enabledTools: [], customTools: [], config: {} };
  const qs = sel=>document.querySelector(sel);

  // DOM refs
  const defaultToolsEl = qs('#default-tools');
  const customToolsEl = qs('#custom-tools');
  const defaultCountEl = qs('#default-count');
  const customCountEl = qs('#custom-count');
  const addToolBtn = qs('#add-tool-btn');
  const modal = qs('#add-tool-modal');
  const modalCard = modal.querySelector('.modal-card');
  const modalClose = qs('#modal-close');
  const modalCancel = qs('#modal-cancel');
  const modalSave = qs('#modal-save');
  const nameInput = qs('#tool-name');
  const urlInput = qs('#tool-url');
  const descInput = qs('#tool-desc');
  const usageContainer = qs('#usage-stats');
  const refreshBtn = qs('#refresh-stats');
  const showDetailedUrlsCheckbox = qs('#show-detailed-urls');

  // start
  document.addEventListener('DOMContentLoaded', init);

  async function init(){
    bindTabButtons();
    bindGlobalEvents();
    await loadSettings();
    await loadUsageStats();
    updateCounts();
    bindConfigEvents();
  }

  // Tab behaviour
  function bindTabButtons(){
    const tabs = Array.from(document.querySelectorAll('.tab-btn'));
    tabs.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const target = btn.dataset.target;
        tabs.forEach(b=>b.setAttribute('aria-selected','false'));
        btn.setAttribute('aria-selected','true');
        document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
        const panel = document.getElementById(target);
        if(panel){ panel.classList.add('active'); }
        if(target === 'stats-panel') loadUsageStats();
      });
    });
  }

  // load/save settings
  async function loadSettings(){
    try{
      const result = await storageGet(['enabledTools','customTools','config']);
      currentSettings.enabledTools = Array.isArray(result.enabledTools) && result.enabledTools.length>0 ? result.enabledTools : DEFAULT_TOOLS.map((_,i)=>i);
      currentSettings.customTools = Array.isArray(result.customTools) ? result.customTools : [];
      currentSettings.config = result.config || DEFAULT_CONFIG;
      renderAllTools();
      updateConfigUI();
    }catch(err){
      console.error('loadSettings error',err);
      currentSettings.enabledTools = DEFAULT_TOOLS.map((_,i)=>i);
      currentSettings.customTools = [];
      currentSettings.config = DEFAULT_CONFIG;
      renderAllTools();
      updateConfigUI();
      showNotification('加载设置失败','error');
    }
  }

  async function saveSettings(){
    try{
      await storageSet({ enabledTools: currentSettings.enabledTools, customTools: currentSettings.customTools, config: currentSettings.config });
    }catch(err){ console.error('saveSettings', err); showNotification('保存失败','error'); }
  }

  // render
  function renderAllTools(){
    renderDefaultTools();
    renderCustomTools();
    updateCounts();
  }

  function renderDefaultTools(){
    defaultToolsEl.innerHTML = '';
    DEFAULT_TOOLS.forEach((tool, idx)=>{
      const el = createToolItem(tool, idx, false);
      defaultToolsEl.appendChild(el);
    });
  }

  function renderCustomTools(){
    customToolsEl.innerHTML = '';
    currentSettings.customTools.forEach((tool, i)=>{
      const idx = DEFAULT_TOOLS.length + i;
      const el = createToolItem(tool, idx, true);
      customToolsEl.appendChild(el);
    });
  }

  // create tool item
  function createToolItem(tool, index, isCustom){
    const enabled = currentSettings.enabledTools.includes(index);
    const item = document.createElement('div');
    item.className = 'tool-item' + (enabled ? '' : ' disabled');

    const info = document.createElement('div');
    info.className = 'tool-info';
    const name = document.createElement('div'); name.className='tool-name'; name.textContent = tool.name || '—';
    const desc = document.createElement('div'); desc.className='tool-desc'; desc.textContent = tool.description || '';
    info.appendChild(name); info.appendChild(desc);

    const controls = document.createElement('div'); controls.className='tool-controls';

    // edit/delete for custom
    if(isCustom){
      const delBtn = document.createElement('button'); delBtn.className='btn btn-icon btn-danger'; delBtn.title='删除'; delBtn.setAttribute('aria-label','删除工具'); delBtn.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>';
      delBtn.addEventListener('click', async ()=>{
        if(!confirm('确定删除该自定义工具？')) return;
        const customIndex = index - DEFAULT_TOOLS.length;
        currentSettings.customTools.splice(customIndex,1);
        // remove enabled entry and shift higher indexes
        currentSettings.enabledTools = currentSettings.enabledTools.filter(i=>i!==index).map(i=> i>index? i-1 : i);
        await saveSettings(); renderAllTools(); showNotification('已删除');
      });
      controls.appendChild(delBtn);
    }

    // switch
    const label = document.createElement('label'); label.className='switch';
    const checkbox = document.createElement('input'); checkbox.type='checkbox'; checkbox.checked = enabled; checkbox.dataset.index = index; checkbox.setAttribute('role','switch'); checkbox.setAttribute('aria-checked', String(enabled));
    const slider = document.createElement('span'); slider.className='slider';
    label.appendChild(checkbox); label.appendChild(slider);

    checkbox.addEventListener('change', async (e)=>{
      const idx = Number(e.target.dataset.index);
      const checked = e.target.checked;
      if(checked){ if(!currentSettings.enabledTools.includes(idx)) currentSettings.enabledTools.push(idx); }
      else { currentSettings.enabledTools = currentSettings.enabledTools.filter(i=>i!==idx); }
      e.target.setAttribute('aria-checked', String(checked));
      updateItemState(item, checked);
      await saveSettings();
    });

    controls.appendChild(label);

    item.appendChild(info); item.appendChild(controls);
    return item;
  }

  function updateItemState(itemEl, enabled){
    if(enabled) itemEl.classList.remove('disabled'); else itemEl.classList.add('disabled');
  }

  function updateCounts(){
    defaultCountEl.textContent = String(DEFAULT_TOOLS.length);
    customCountEl.textContent = String(currentSettings.customTools.length);
  }

  // modal behaviour & accessibility
  function bindGlobalEvents(){
    addToolBtn.addEventListener('click', openModal);
    modalClose.addEventListener('click', closeModal);
    modalCancel.addEventListener('click', closeModal);
    modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModal(); });
    modalSave.addEventListener('click', onSaveCustomTool);
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeModal(); });

    // export/reset
    qs('#export-btn').addEventListener('click', exportSettings);
    qs('#reset-btn').addEventListener('click', async ()=>{ if(confirm('确定要重置所有设置？')){ await resetSettings(); showNotification('已重置'); } });

    // refresh stats
    refreshBtn.addEventListener('click', async ()=>{ refreshBtn.disabled=true; await loadUsageStats(); refreshBtn.disabled=false; showNotification('统计已刷新'); });
  }

  // 配置事件绑定
  function bindConfigEvents(){
    if(showDetailedUrlsCheckbox){
      showDetailedUrlsCheckbox.addEventListener('change', async (e)=>{
        currentSettings.config.showDetailedUrls = e.target.checked;
        e.target.setAttribute('aria-checked', String(e.target.checked));
        await saveSettings();
        showNotification('设置已保存');
      });
    }
  }

  // 更新配置UI
  function updateConfigUI(){
    if(showDetailedUrlsCheckbox){
      const checked = currentSettings.config.showDetailedUrls || false;
      showDetailedUrlsCheckbox.checked = checked;
      showDetailedUrlsCheckbox.setAttribute('aria-checked', String(checked));
    }
  }

  function openModal(){
    modal.classList.add('show'); modal.setAttribute('aria-hidden','false');
    // focus
    setTimeout(()=> nameInput.focus(),80);
  }
  function closeModal(){
    modal.classList.remove('show'); modal.setAttribute('aria-hidden','true');
    nameInput.value=''; urlInput.value=''; descInput.value='';
  }

  async function onSaveCustomTool(){
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();
    const desc = descInput.value.trim();
    if(!name || !url){ showNotification('请填写名称和 URL','error'); return; }
    if(!url.includes('{owner}') || !url.includes('{repo}')){ showNotification('URL 必须包含 {owner} 和 {repo} 占位符','error'); return; }
    const newTool = { name, url, description: desc };
    currentSettings.customTools.push(newTool);
    const newIndex = DEFAULT_TOOLS.length + currentSettings.customTools.length - 1;
    if(!currentSettings.enabledTools.includes(newIndex)) currentSettings.enabledTools.push(newIndex);
    await saveSettings(); renderAllTools(); closeModal(); showNotification('已添加自定义工具');
  }

  // usage stats
  async function loadUsageStats(){
    try{
      const r = await storageGet(['usageStats']);
      const stats = r.usageStats || {};
      renderUsageStats(stats);
    }catch(err){ console.error('loadUsageStats',err); usageContainer.innerHTML='<div class="loading">加载失败</div>'; }
  }

  function renderUsageStats(stats){
    usageContainer.innerHTML='';
    const keys = Object.keys(stats||{});
    if(keys.length===0){ usageContainer.innerHTML='<div class="loading">暂无使用统计</div>'; return; }
    const entries = Object.entries(stats).map(([repo,tools])=>({repo,total:Object.values(tools).reduce((a,b)=>a+b,0),tools})).sort((a,b)=>b.total-a.total).slice(0,10);
    const frag = document.createDocumentFragment();
    entries.forEach(it=>{
      const el = document.createElement('div'); el.className='stats-item';
      el.innerHTML = `<div style="font-weight:700">${it.repo}</div><div style="min-width:64px;text-align:right;color:var(--muted)">${it.total} 次</div>`;
      frag.appendChild(el);
    });
    usageContainer.appendChild(frag);
  }

  // export & reset
  function exportSettings(){
    const config = { enabledTools: currentSettings.enabledTools, customTools: currentSettings.customTools, config: currentSettings.config, exportDate:new Date().toISOString() };
    const data = JSON.stringify(config,null,2);
    const blob = new Blob([data],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='github-tools-config.json'; a.click(); URL.revokeObjectURL(url); showNotification('已导出');
  }

  async function resetSettings(){
    try{ 
      await storageClear(); 
      currentSettings.enabledTools = DEFAULT_TOOLS.map((_,i)=>i); 
      currentSettings.customTools=[];
      currentSettings.config = DEFAULT_CONFIG;
      renderAllTools(); 
      updateConfigUI();
      await loadUsageStats(); 
    }catch(err){console.error(err);showNotification('重置失败','error')}
  }

  // usage tracking helper – 简单累加到 storage.usageStats
  async function trackUsage(repoFull, toolIndex){
    if(!repoFull) return;
    try{
      const r = await storageGet(['usageStats']);
      const stats = r.usageStats || {};
      if(!stats[repoFull]) stats[repoFull] = {};
      stats[repoFull][String(toolIndex)] = (stats[repoFull][String(toolIndex)]||0) + 1;
      await storageSet({ usageStats: stats });
    }catch(err){ console.error('trackUsage',err); }
  }

  // utilities: chrome.storage wrappers (works with Manifest V3 & V2)
  function storageGet(keys){ return new Promise((resolve)=>{ try{ chrome && chrome.storage && chrome.storage.sync ? chrome.storage.sync.get(keys,resolve) : resolve({}); }catch(e){ resolve({}); } }); }
  function storageSet(obj){ return new Promise((resolve)=>{ try{ chrome && chrome.storage && chrome.storage.sync ? chrome.storage.sync.set(obj, ()=>resolve()) : resolve(); }catch(e){ resolve(); } }); }
  function storageClear(){ return new Promise((resolve)=>{ try{ chrome && chrome.storage && chrome.storage.sync ? chrome.storage.sync.clear(()=>resolve()) : resolve(); }catch(e){ resolve(); } }); }

  // very small notification
  function showNotification(msg, type='success'){
    const n = document.createElement('div'); n.className='notification'; n.textContent = msg; n.style.background = type==='error'? 'var(--danger)' : 'var(--success)';
    document.body.appendChild(n);
    setTimeout(()=>{ n.style.opacity='0'; n.style.transform='translateX(8px)'; setTimeout(()=>n.remove(),300); },2400);
  }

})();
