// 应用配置
const appConfig = [
    {
        id: 'start',
        title: 'Luncher',
        icon: '../icon/RedOS.svg',
        customClass: 'start',
        isStartMenu: true
    },
    {
        id: 'desktop',
        title: '桌面/任务（密码写了40几行动不了，不做了）',
        icon: 'fas fa-desktop',
        src: 'https://example.com'
    },
    {
        id: 'settings',
        title: '设置',
        icon: 'fas fa-cog',
        src: 'settings/index.html'
    },
    {
        id: 'browser',
        title: '浏览器',
        src: '../../Program Files/HJ Browser/index.html',
        customClass: 'browser',
        icon: 'fa fa-edge'
    }, 
    {
        id: 'file-manager',
        title: '文件管理器',
        icon: 'fas fa-folder',
        src: '../../Program Files/file-manager/index.html'
    },
    {
        id: 'calculator',
        title: '计算器',
        icon: 'fas fa-calculator',
        src: '../../Program Files/calculator/index.html'
    }
];

// 窗口管理
const WindowManager = {
    windows: {},
    zIndex: 1001,
    
    create: function(src, title) {
        const windowId = 'window_' + Date.now();
        const draggableWindow = document.createElement('div');
        draggableWindow.id = windowId;
        draggableWindow.className = 'draggable-window window-open-animation';
        draggableWindow.style.zIndex = this.zIndex++;
        
        // 设置初始位置和大小
        draggableWindow.style.left = '100px';
        draggableWindow.style.top = '100px';
        draggableWindow.style.width = '1024px';
        draggableWindow.style.height = '576px';
        draggableWindow.style.display = 'block';
        draggableWindow.style.position = 'absolute';
        
        const windowHeader = document.createElement('div');
        windowHeader.className = 'window-header';
        
        const windowIcon = document.createElement('img');
        windowIcon.className = 'window-icon';
        windowIcon.src = '../icon/default-icon.png';
        
        const windowTitle = document.createElement('span');
        windowTitle.className = 'window-title';
        windowTitle.textContent = title || '新窗口';
        windowHeader.appendChild(windowIcon);
        windowHeader.appendChild(windowTitle);
        
        const closeButton = document.createElement('button');
        closeButton.className = 'close-button';
        closeButton.textContent = 'X';
        closeButton.onclick = () => this.close(windowId);
        windowHeader.appendChild(closeButton);
        
        const iframe = document.createElement('iframe');
        iframe.src = src;
        iframe.onload = () => {
            try {
                const docTitle = iframe.contentDocument?.title || title || '无标题';
                windowTitle.textContent = docTitle;
                
                const link = iframe.contentDocument?.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
                if (link?.href) {
                    windowIcon.src = link.href;
                }
            } catch (e) {
                console.error("加载标题或图标出错:", e);
                windowTitle.textContent = title || "加载出错";
            }
        };
        
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        
        draggableWindow.appendChild(windowHeader);
        draggableWindow.appendChild(iframe);
        draggableWindow.appendChild(resizeHandle);
        document.body.appendChild(draggableWindow);
        
        this.windows[windowId] = {
            element: draggableWindow,
            isDragging: false,
            isResizing: false
        };
        
        this.setupDrag(windowId, windowHeader);
        this.setupResize(windowId, resizeHandle);
        
        draggableWindow.addEventListener('mousedown', () => {
            this.bringToFront(windowId);
        });
        
        // 移除动画类
        setTimeout(() => {
            draggableWindow.classList.remove('window-open-animation');
        }, 200);
        
        return windowId;
    },
    
    close: function(windowId) {
        if (this.windows[windowId]) {
            this.windows[windowId].element.remove();
            delete this.windows[windowId];
        }
    },
    
    bringToFront: function(windowId) {
        if (this.windows[windowId]) {
            this.windows[windowId].element.style.zIndex = this.zIndex++;
        }
    },
    
    setupDrag: function(windowId, headerElement) {
        const windowObj = this.windows[windowId];
        if (!windowObj) return;
        
        let offsetX, offsetY;
        
        headerElement.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            windowObj.isDragging = true;
            offsetX = e.clientX - windowObj.element.getBoundingClientRect().left;
            offsetY = e.clientY - windowObj.element.getBoundingClientRect().top;
            this.bringToFront(windowId);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (windowObj.isDragging) {
                windowObj.element.style.left = `${e.clientX - offsetX}px`;
                windowObj.element.style.top = `${e.clientY - offsetY}px`;
            }
        });
        
        document.addEventListener('mouseup', () => {
            windowObj.isDragging = false;
        });
    },
    
    setupResize: function(windowId, resizeHandle) {
        const windowObj = this.windows[windowId];
        if (!windowObj) return;
        
        let startX, startY, startWidth, startHeight;
        
        resizeHandle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            windowObj.isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = windowObj.element.offsetWidth;
            startHeight = windowObj.element.offsetHeight;
            this.bringToFront(windowId);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (windowObj.isResizing) {
                const newWidth = Math.max(300, startWidth + (e.clientX - startX));
                const newHeight = Math.max(200, startHeight + (e.clientY - startY));
                windowObj.element.style.width = `${newWidth}px`;
                windowObj.element.style.height = `${newHeight}px`;
            }
        });
        
        document.addEventListener('mouseup', () => {
            windowObj.isResizing = false;
        });
    }
};

function createWindow(src, title) {
    return WindowManager.create(src, title);
}

// 任务栏功能
function createTaskbarButtons() {
    const taskbar = document.getElementById('taskbar');
    
    appConfig.forEach(app => {
        const button = document.createElement('button');
        button.className = 'taskbar-btn';
        if (app.customClass) button.classList.add(app.customClass);
        
        // 设置图标
        if (app.icon && app.icon.startsWith('fas')) {
            const icon = document.createElement('i');
            icon.className = app.icon;
            button.appendChild(icon);
        } else if (app.icon || app.bgImage) {
            button.style.backgroundImage = `url(${app.bgImage || app.icon})`;
        }
        
        button.title = app.title;
        if (app.src) button.dataset.src = app.src;
        button.dataset.appId = app.id;
        
        if (app.isStartMenu) {
            button.addEventListener('click', toggleStartMenu);
        } else {
            button.addEventListener('click', () => createWindow(app.src, app.title));
        }
        
        taskbar.appendChild(button);
    });
}

// 开始菜单功能
async function getInstalledApps() {
    try {
       
        const apps = [];
        
        // 合并系统应用
        return [
            ...appConfig
                .filter(app => !app.isStartMenu && app.src)
                .map(app => ({
                    name: app.title,
                    path: app.src,
                    icon: app.icon
                })),
            ...apps.map(app => ({
                name: app.name,
                path: app.path,
                icon: app.icon || 'fas fa-file-alt'
            }))
        ];
    } catch (error) {
        console.error('获取应用列表失败:', error);
        // 返回默认应用作为回退
        return appConfig
            .filter(app => !app.isStartMenu && app.src)
            .map(app => ({
                name: app.title,
                path: app.src,
                icon: app.icon
            }));
    }
}

async function populateAppList() {
    const appList = document.getElementById('appList');
    appList.innerHTML = '<div class="loading">加载应用中...</div>';
    
    try {
        const apps = await getInstalledApps();
        apps.sort((a, b) => a.name.localeCompare(b.name));
        
        const groupedApps = {};
        apps.forEach(app => {
            const firstLetter = app.name.charAt(0).toUpperCase();
            if (!groupedApps[firstLetter]) {
                groupedApps[firstLetter] = [];
            }
            groupedApps[firstLetter].push(app);
        });
        
        appList.innerHTML = '';
        
        for (const letter in groupedApps) {
            const group = document.createElement('div');
            group.className = 'app-group';
            
            const title = document.createElement('div');
            title.className = 'app-group-title';
            title.textContent = letter;
            group.appendChild(title);
            
            const grid = document.createElement('div');
            grid.className = 'app-grid';
            
            groupedApps[letter].forEach(app => {
                const appItem = document.createElement('div');
                appItem.className = 'app-item';
                appItem.onclick = () => {
                    createWindow(app.path, app.name);
                    document.getElementById('startMenu').style.display = 'none';
                };
                
                const icon = document.createElement('div');
                icon.className = 'app-icon';
                if (app.icon && app.icon.startsWith('fas')) {
                    const iconEl = document.createElement('i');
                    iconEl.className = app.icon;
                    icon.appendChild(iconEl);
                } else {
                    icon.style.backgroundImage = `url(${app.icon || '../icon/default-icon.png'})`;
                }
                
                const name = document.createElement('div');
                name.className = 'app-name';
                name.textContent = app.name;
                
                appItem.appendChild(icon);
                appItem.appendChild(name);
                grid.appendChild(appItem);
            });
            
            group.appendChild(grid);
            appList.appendChild(group);
        }
    } catch (error) {
        appList.innerHTML = '<div class="error">加载应用失败</div>';
        console.error('填充应用列表出错:', error);
    }
}

function toggleStartMenu() {
    const startMenu = document.getElementById('startMenu');
    if (startMenu.style.display === 'block') {
        startMenu.style.animation = 'none';
        setTimeout(() => {
            startMenu.style.display = 'none';
        }, 10);
    } else {
        startMenu.style.display = 'block';
        startMenu.style.animation = 'menuSlideUp 0.3s ease-out forwards';
        populateAppList();
    }
}

// 全局事件监听
document.addEventListener('click', (e) => {
    const startMenu = document.getElementById('startMenu');
    const startButton = document.querySelector('.taskbar-btn[data-app-id="start"]');
    
    if (startMenu.style.display === 'block' && 
        !startMenu.contains(e.target) && 
        e.target !== startButton && 
        !startButton.contains(e.target)) {
        toggleStartMenu();
    }
});
// -----------

// 主题颜色管理
const ThemeManager = {
    init: function() {
        
        const savedColor = localStorage.getItem('themeColor') || '#ff0000';
        this.applyTheme(savedColor);
        
        // 监听来自设置页面的主题更改消息
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'themeChange') {
                this.applyTheme(event.data.color);
            }
        });
    },
    
    applyTheme: function(color) {
        const rgb = this.hexToRgb(color);
        const rgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`;
        
        // 更新CSS变量
        document.documentElement.style.setProperty('--theme-color', color);
        document.documentElement.style.setProperty('--theme-rgba', rgba);
        
        document.querySelectorAll('.window-header').forEach(header => {
            header.style.backgroundColor = rgba;
        });
        
        document.querySelectorAll('.start-menu-header').forEach(header => {
            header.style.background = `linear-gradient(to right, ${color}, ${rgba})`;
        });
        
        // 保存到本地存储
        localStorage.setItem('themeColor', color);
    },
    
    hexToRgb: function(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : {r: 255, g: 0, b: 0};
    }
};

// 在window.onload中初始化主题
ThemeManager.init();

// 页面初始化
window.onload = function() {
    createTaskbarButtons();
};