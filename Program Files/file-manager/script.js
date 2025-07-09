class FileManager {
    constructor() {
        this.currentPath = '';
        this.history = [];
        this.historyIndex = -1;
        this.clipboard = null;
        this.clipboardAction = null; // 'copy' or 'cut'
        
        this.initElements();
        this.initEvents();
        this.navigateTo('');
    }
    
    initElements() {
        this.elements = {
            backBtn: document.getElementById('backBtn'),
            forwardBtn: document.getElementById('forwardBtn'),
            upBtn: document.getElementById('upBtn'),
            refreshBtn: document.getElementById('refreshBtn'),
            newFolderBtn: document.getElementById('newFolderBtn'),
            uploadBtn: document.getElementById('uploadBtn'),
            fileUpload: document.getElementById('fileUpload'),
            currentPath: document.getElementById('currentPath'),
            fileListContent: document.getElementById('fileListContent'),
            statusInfo: document.getElementById('statusInfo'),
            contextMenu: document.getElementById('contextMenu'),
            dialogOverlay: document.getElementById('dialogOverlay'),
            dialogTitle: document.getElementById('dialogTitle'),
            dialogMessage: document.getElementById('dialogMessage'),
            dialogInput: document.getElementById('dialogInput'),
            dialogCancel: document.getElementById('dialogCancel'),
            dialogConfirm: document.getElementById('dialogConfirm'),
            openFile: document.getElementById('openFile'),
            renameFile: document.getElementById('renameFile'),
            copyFile: document.getElementById('copyFile'),
            pasteFile: document.getElementById('pasteFile'),
            deleteFile: document.getElementById('deleteFile'),
            downloadFile: document.getElementById('downloadFile'),
            propertiesFile: document.getElementById('propertiesFile'),
            quickAccessItems: document.querySelectorAll('.quick-access li')
        };
    }
    
    initEvents() {
        // 工具栏按钮事件
        this.elements.backBtn.addEventListener('click', () => this.goBack());
        this.elements.forwardBtn.addEventListener('click', () => this.goForward());
        this.elements.upBtn.addEventListener('click', () => this.goUp());
        this.elements.refreshBtn.addEventListener('click', () => this.refresh());
        this.elements.newFolderBtn.addEventListener('click', () => this.createNewFolder());
        this.elements.uploadBtn.addEventListener('click', () => this.elements.fileUpload.click());
        document.querySelector('.close-dialog').addEventListener('click', () => this.hideDialog());//关闭事件
        this.elements.cutFile.addEventListener('click', () => this.cutSelectedFile());

        this.elements.dialogOverlay.addEventListener('click', (e) => {
            if (e.target === this.elements.dialogOverlay) {
                this.hideDialog();
            }
        });
        
        // 文件上传事件
        this.elements.fileUpload.addEventListener('change', (e) => this.uploadFiles(e.target.files));
        
        // 快速访问事件
        this.elements.quickAccessItems.forEach(item => {
            item.addEventListener('click', () => {
                const path = item.getAttribute('data-path');
                this.navigateTo(path);
            });
        });
        
        // 文件列表事件
        this.elements.fileListContent.addEventListener('click', (e) => {
            const fileItem = e.target.closest('.file-item');
            if (fileItem) {
                if (e.target.closest('.file-name')) {
                    const fileName = fileItem.getAttribute('data-name');
                    const isDirectory = fileItem.getAttribute('data-type') === 'directory';
                    
                    if (isDirectory) {
                        this.navigateTo(this.getFullPath(fileName));
                    } else {
                        this.openFile(this.getFullPath(fileName));
                    }
                }
            }
        });
        window.addEventListener('message', (event) => {
            if (event.data?.type === 'themeChange') {
                this.applyTheme(event.data.color);
            }
        });
        
        
        // 上下文菜单事件
        document.addEventListener('contextmenu', (e) => {
            const fileItem = e.target.closest('.file-item');
            if (fileItem) {
                e.preventDefault();
                this.showContextMenu(e.clientX, e.clientY, fileItem);
            }
        });
        
        document.addEventListener('click', () => {
            this.hideContextMenu();
        });
        
        // 上下文菜单项事件
        this.elements.openFile.addEventListener('click', () => this.openSelectedFile());
        this.elements.renameFile.addEventListener('click', () => this.renameSelectedFile());
        this.elements.copyFile.addEventListener('click', () => this.copySelectedFile());
        this.elements.pasteFile.addEventListener('click', () => this.pasteFile());
        this.elements.deleteFile.addEventListener('click', () => this.deleteSelectedFile());
        this.elements.downloadFile.addEventListener('click', () => this.downloadSelectedFile());
        this.elements.propertiesFile.addEventListener('click', () => this.showFileProperties());
        
        // 对话框事件
        this.elements.dialogCancel.addEventListener('click', () => this.hideDialog());
        this.elements.dialogConfirm.addEventListener('click', () => this.confirmDialog());
        this.elements.dialogInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.confirmDialog();
            }
        });
    }
    
    // 导航功能
    navigateTo(path) {
        this.addToHistory(this.currentPath);
        this.currentPath = path;
        this.elements.currentPath.textContent = path || '/';
        this.listFiles(path);
    }
    
    goBack() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.currentPath = this.history[this.historyIndex];
            this.elements.currentPath.textContent = this.currentPath || '/';
            this.listFiles(this.currentPath);
        }
    }
    
    goForward() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.currentPath = this.history[this.historyIndex];
            this.elements.currentPath.textContent = this.currentPath || '/';
            this.listFiles(this.currentPath);
        }
    }
    
    goUp() {
        if (this.currentPath) {
            const pathParts = this.currentPath.split('/');
            pathParts.pop();
            const newPath = pathParts.join('/');
            this.navigateTo(newPath);
        }
    }
    
    refresh() {
        this.listFiles(this.currentPath);
    }
    
    // 历史记录
    addToHistory(path) {
        if (path === this.currentPath) return;
        
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        this.history.push(path);
        this.historyIndex = this.history.length - 1;
        this.updateNavButtons();
    }
    
    updateNavButtons() {
        this.elements.backBtn.disabled = this.historyIndex <= 0;
        this.elements.forwardBtn.disabled = this.historyIndex >= this.history.length - 1;
    }
    
    // 文件操作
    listFiles(path) {
        const mockFiles = this.getMockFiles(path);
        
        this.elements.fileListContent.innerHTML = '';
        
        if (path) {
            // 添加".."目录
            const parentItem = this.createFileItem({
                name: '..',
                type: 'directory',
                size: '',
                modified: ''
            });
            this.elements.fileListContent.appendChild(parentItem);
        }
        
        mockFiles.forEach(file => {
            const fileItem = this.createFileItem(file);
            this.elements.fileListContent.appendChild(fileItem);
        });
        
        this.elements.statusInfo.textContent = `${mockFiles.length}个项目`;
    }
    
    createFileItem(file) {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.setAttribute('data-name', file.name);
        item.setAttribute('data-type', file.type);
        
        const icon = document.createElement('div');
        icon.className = 'file-icon';
        
        const iconElement = document.createElement('i');
        if (file.type === 'directory') {
            iconElement.className = 'fas fa-folder';
            iconElement.style.color = '#4a90e2';
        } else {
            const extension = file.name.split('.').pop().toLowerCase();
            iconElement.className = this.getFileIconClass(extension);
        }
        
        icon.appendChild(iconElement);
        
        const name = document.createElement('div');
        name.className = 'file-name';
        name.textContent = file.name;
        
        const size = document.createElement('div');
        size.className = 'file-size';
        size.textContent = file.size || '';
        
        const modified = document.createElement('div');
        modified.className = 'file-modified';
        modified.textContent = file.modified || '';
        
        const type = document.createElement('div');
        type.className = 'file-type';
        type.textContent = file.type === 'directory' ? '文件夹' : this.getFileType(file.name);
        
        item.appendChild(icon);
        item.appendChild(name);
        item.appendChild(size);
        item.appendChild(modified);
        item.appendChild(type);
        
        return item;
    }
    
    getFileIconClass(extension) {
        const iconMap = {
            'txt': 'fas fa-file-alt',
            'pdf': 'fas fa-file-pdf',
            'doc': 'fas fa-file-word',
            'docx': 'fas fa-file-word',
            'xls': 'fas fa-file-excel',
            'xlsx': 'fas fa-file-excel',
            'ppt': 'fas fa-file-powerpoint',
            'pptx': 'fas fa-file-powerpoint',
            'jpg': 'fas fa-file-image',
            'jpeg': 'fas fa-file-image',
            'png': 'fas fa-file-image',
            'gif': 'fas fa-file-image',
            'mp3': 'fas fa-file-audio',
            'wav': 'fas fa-file-audio',
            'mp4': 'fas fa-file-video',
            'avi': 'fas fa-file-video',
            'zip': 'fas fa-file-archive',
            'rar': 'fas fa-file-archive',
            'exe': 'fas fa-file-code',
            'html': 'fas fa-file-code',
            'js': 'fas fa-file-code',
            'css': 'fas fa-file-code'
        };
        
        return iconMap[extension] || 'fas fa-file';
    }
    
    getFileType(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        const typeMap = {
            'txt': '文本文档',
            'pdf': 'PDF文档',
            'doc': 'Word文档',
            'docx': 'Word文档',
            'xls': 'Excel文档',
            'xlsx': 'Excel文档',
            'ppt': 'PowerPoint文档',
            'pptx': 'PowerPoint文档',
            'jpg': 'JPEG图像',
            'jpeg': 'JPEG图像',
            'png': 'PNG图像',
            'gif': 'GIF图像',
            'mp3': '音频文件',
            'wav': '音频文件',
            'mp4': '视频文件',
            'avi': '视频文件',
            'zip': '压缩文件',
            'rar': '压缩文件',
            'exe': '可执行文件',
            'html': 'HTML文件',
            'js': 'JavaScript文件',
            'css': 'CSS 样式表文件',
            'h': 'C/C++头文件',
            'cpp': 'C/C++源文件',
            'py': 'Python源文件',
            'java': 'Java源文件',
            'class': 'Java字节码文件'
        };
        
        return typeMap[extension] || '文件';
    }
    
    getFullPath(filename) {
        if (filename === '..') {
            const pathParts = this.currentPath.split('/');
            pathParts.pop();
            return pathParts.join('/');
        }
        return this.currentPath ? `${this.currentPath}/${filename}` : filename;
    }
    
    // 模拟文件数据
    getMockFiles(path) {
        if (path === '') {
            return [
                { name: 'Desktop', type: 'directory', size: '', modified: '2023-05-15' },
                { name: 'Documents', type: 'directory', size: '', modified: '2023-05-10' },
                { name: 'Downloads', type: 'directory', size: '', modified: '2023-05-12' },
                { name: 'Pictures', type: 'directory', size: '', modified: '2023-05-08' },
                { name: 'readme.txt', type: 'file', size: '1.2 KB', modified: '2023-05-01' }
            ];
        } else if (path === 'Documents') {
            return [
                { name: 'Work', type: 'directory', size: '', modified: '2023-05-09' },
                { name: 'Personal', type: 'directory', size: '', modified: '2023-05-07' },
                { name: 'resume.pdf', type: 'file', size: '245 KB', modified: '2023-04-30' },
                { name: 'notes.txt', type: 'file', size: '4 KB', modified: '2023-05-05' }
            ];
        } else if (path === 'Pictures') {
            return [
                { name: 'Vacation', type: 'directory', size: '', modified: '2023-04-20' },
                { name: 'profile.jpg', type: 'file', size: '1.5 MB', modified: '2023-03-15' },
                { name: 'background.png', type: 'file', size: '2.3 MB', modified: '2023-02-10' }
            ];
        } else if (path === 'Downloads') {
            return [
                { name: 'setup.exe', type: 'file', size: '15.6 MB', modified: '2023-05-11' },
                { name: 'document.pdf', type: 'file', size: '3.2 MB', modified: '2023-05-10' },
                { name: 'archive.zip', type: 'file', size: '45.8 MB', modified: '2023-05-09' }
            ];
        }
        
        return [];
    }
    
    // 文件操作功能
    createNewFolder() {
        this.showDialog('新建文件夹', '请输入文件夹名称:', true, (name) => {
            if (name) {
                // 在实际应用中，这里应该调用API创建文件夹
                console.log(`创建文件夹: ${name}`);
                this.refresh();
            }
        });
    }
    
    uploadFiles(files) {
        if (files.length > 0) {
            // 在实际应用中，这里应该调用API上传文件
            console.log(`上传 ${files.length} 个文件`);
            Array.from(files).forEach(file => {
                console.log(`上传文件: ${file.name}`);
            });
            this.refresh();
        }
    }
    
    openSelectedFile() {
        const selectedFile = this.getSelectedFile();
        if (selectedFile) {
            const isDirectory = selectedFile.getAttribute('data-type') === 'directory';
            const fileName = selectedFile.getAttribute('data-name');
            
            if (isDirectory) {
                this.navigateTo(this.getFullPath(fileName));
            } else {
                this.openFile(this.getFullPath(fileName));
            }
        }
    }
    
    openFile(filePath) {
        // 在实际应用中，这里应该根据文件类型打开文件
        console.log(`打开文件: ${filePath}`);
        alert(`尝试打开文件: ${filePath}`);
    }
    
    renameSelectedFile() {
        const selectedFile = this.getSelectedFile();
        if (selectedFile) {
            const oldName = selectedFile.getAttribute('data-name');
            this.showDialog('重命名', '请输入新名称:', true, (newName) => {
                if (newName && newName !== oldName) {
                    // 在实际应用中，这里应该调用API重命名文件
                    console.log(`重命名 ${oldName} 为 ${newName}`);
                    this.refresh();
                }
            }, oldName);
        }
    }
    
    copySelectedFile() {
        const selectedFile = this.getSelectedFile();
        if (selectedFile) {
            const fileName = selectedFile.getAttribute('data-name');
            const fileType = selectedFile.getAttribute('data-type');
            this.clipboard = {
                path: this.getFullPath(fileName),
                name: fileName,
                type: fileType
            };
            this.clipboardAction = 'copy';
            console.log(`已复制: ${fileName}`);
        }
    }
    
    cutSelectedFile() {
        const selectedFile = this.getSelectedFile();
        if (selectedFile) {
            const fileName = selectedFile.getAttribute('data-name');
            const fileType = selectedFile.getAttribute('data-type');
            this.clipboard = {
                path: this.getFullPath(fileName),
                name: fileName,
                type: fileType
            };
            this.clipboardAction = 'cut';
            console.log(`已剪切: ${fileName}`);
        }
    }
    
    pasteFile() {
        if (this.clipboard) {
            const sourcePath = this.clipboard.path;
            const targetPath = this.getFullPath(this.clipboard.name);
            
            if (sourcePath !== targetPath) {
                // 在实际应用中，这里应该调用API粘贴文件
                if (this.clipboardAction === 'copy') {
                    console.log(`复制 ${sourcePath} 到 ${targetPath}`);
                } else {
                    console.log(`移动 ${sourcePath} 到 ${targetPath}`);
                    this.clipboard = null;
                    this.clipboardAction = null;
                }
                this.refresh();
            }
        }
    }
    
    deleteSelectedFile() {
        const selectedFile = this.getSelectedFile();
        if (selectedFile) {
            const fileName = selectedFile.getAttribute('data-name');
            this.showDialog('删除确认', `确定要删除 "${fileName}" 吗?`, false, (confirmed) => {
                if (confirmed) {
                    // 在实际应用中，这里应该调用API删除文件
                    console.log(`删除文件: ${fileName}`);
                    this.refresh();
                }
            });
        }
    }
    
    downloadSelectedFile() {
        const selectedFile = this.getSelectedFile();
        if (selectedFile && selectedFile.getAttribute('data-type') === 'file') {
            const fileName = selectedFile.getAttribute('data-name');
            // 在实际应用中，这里应该调用API下载文件
            console.log(`下载文件: ${fileName}`);
            alert(`开始下载: ${fileName}`);
        }
    }
    
    showFileProperties() {
        const selectedFile = this.getSelectedFile();
        if (selectedFile) {
            const fileName = selectedFile.getAttribute('data-name');
            const fileType = selectedFile.getAttribute('data-type');
            const fileSize = selectedFile.querySelector('.file-size').textContent;
            const fileModified = selectedFile.querySelector('.file-modified').textContent;
            
            const properties = `
                <p><strong>名称:</strong> ${fileName}</p>
                <p><strong>类型:</strong> ${fileType === 'directory' ? '文件夹' : '文件'}</p>
                <p><strong>大小:</strong> ${fileSize || '-'}</p>
                <p><strong>修改日期:</strong> ${fileModified || '-'}</p>
                <p><strong>位置:</strong> ${this.currentPath || '/'}</p>
            `;
            
            this.showDialog('属性', properties, false);
            this.elements.propertiesFile.addEventListener('click', () => this.showFileProperties());
        }
    }
    
    getSelectedFile() {
        const selected = document.querySelector('.file-item.selected');
        if (!selected && this.contextMenuFile) {
            return this.contextMenuFile;
        }
        return selected;
    }
    
    // 上下文菜单功能
    showContextMenu(x, y, fileItem) {
        this.hideContextMenu();
        this.contextMenuFile = fileItem;
        
        // 高亮选中的文件
        document.querySelectorAll('.file-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        fileItem.classList.add('selected');
        
        // 根据文件类型设置菜单项状态
        const isDirectory = fileItem.getAttribute('data-type') === 'directory';
        this.elements.openFile.style.display = 'block';
        this.elements.downloadFile.style.display = isDirectory ? 'none' : 'block';
        
        // 根据剪贴板状态设置粘贴项状态
        this.elements.pasteFile.style.display = this.clipboard ? 'block' : 'none';
        
        // 显示菜单
        this.elements.contextMenu.style.display = 'block';
        this.elements.contextMenu.style.left = `${x}px`;
        this.elements.contextMenu.style.top = `${y}px`;
    }
    
    hideContextMenu() {
        this.elements.contextMenu.style.display = 'none';
        this.contextMenuFile = null;
    }
    
    // 对话框功能
    showDialog(title, message, showInput, callback, defaultValue = '') {
        this.dialogCallback = callback;
        this.elements.dialogTitle.textContent = title;
        this.elements.dialogMessage.innerHTML = message;
        this.elements.dialogInput.style.display = showInput ? 'block' : 'none';
        
        if (showInput) {
            this.elements.dialogInput.value = defaultValue;
            this.elements.dialogInput.focus();
        }
        
        this.elements.dialogOverlay.style.display = 'flex';
    }
    
    hideDialog() {
        this.elements.dialogOverlay.style.display = 'none';
        this.dialogCallback = null;
    }
    
    confirmDialog() {
        if (this.dialogCallback) {
            const value = this.elements.dialogInput.style.display === 'none' ? 
                true : this.elements.dialogInput.value.trim();
            if (value) { // 只有有值或确认操作时才回调
                this.dialogCallback(value);
            }
        }
        this.hideDialog();
    }

    applyTheme(color) {
            const rgb = this.hexToRgb(color);
            const rgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`;
            
            // 更新CSS变量
            document.documentElement.style.setProperty('--theme-color', color);
            document.documentElement.style.setProperty('--theme-rgba', rgba);
            
            // 直接更新元素
            this.elements.toolbar.style.backgroundColor = rgba;
        }
        
        hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : {r: 255, g: 0, b: 0};
        }
}

// 初始化文件管理器
document.addEventListener('DOMContentLoaded', () => {
    const fileManager = new FileManager();
    
    // 应用初始主题
    const savedColor = localStorage.getItem('themeColor') || '#ff0000';
    fileManager.applyTheme(savedColor);
    
    window.fileManager = fileManager;
});

// 祈祷可以跑得动