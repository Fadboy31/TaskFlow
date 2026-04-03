// ===================================
// TaskFlow - Complete JavaScript
// ===================================

// Global Variables & State
let tasks = [];
let editingTaskId = null;
let currentFilter = {
    status: 'all',
    priority: 'all',
    search: ''
};

// DOM Elements
const elements = {
    // Buttons
    addTaskBtn: document.getElementById('add-task-btn'),
    themeToggle: document.getElementById('theme-toggle'),
    closeModal: document.getElementById('close-modal'),
    cancelBtn: document.getElementById('cancel-btn'),
    
    // Modal
    taskModal: document.getElementById('task-modal'),
    modalTitle: document.getElementById('modal-title'),
    submitBtnText: document.getElementById('submit-btn-text'),
    
    // Form
    taskForm: document.getElementById('task-form'),
    taskTitle: document.getElementById('task-title'),
    taskDescription: document.getElementById('task-description'),
    taskPriority: document.getElementById('task-priority'),
    taskDueDate: document.getElementById('task-due-date'),
    
    // Filters & Search
    searchInput: document.getElementById('search-input'),
    filterStatus: document.getElementById('filter-status'),
    filterPriority: document.getElementById('filter-priority'),
    
    // Containers
    tasksContainer: document.getElementById('tasks-container'),
    emptyState: document.getElementById('empty-state'),
    
    // Stats
    totalTasks: document.getElementById('total-tasks'),
    activeTasks: document.getElementById('active-tasks'),
    completedTasks: document.getElementById('completed-tasks')
};

// ===================================
// Initialize App
// ===================================
function init() {
    loadTasksFromStorage();
    loadThemePreference();
    attachEventListeners();
    renderTasks();
    updateStats();
}

// ===================================
// Event Listeners
// ===================================
function attachEventListeners() {
    // Modal Controls
    elements.addTaskBtn.addEventListener('click', openAddTaskModal);
    elements.closeModal.addEventListener('click', closeModal);
    elements.cancelBtn.addEventListener('click', closeModal);
    elements.taskModal.querySelector('.modal-overlay').addEventListener('click', closeModal);
    
    // Form Submission
    elements.taskForm.addEventListener('submit', handleFormSubmit);
    
    // Theme Toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Search & Filters
    elements.searchInput.addEventListener('input', handleSearch);
    elements.filterStatus.addEventListener('change', handleStatusFilter);
    elements.filterPriority.addEventListener('change', handlePriorityFilter);
    
    // Keyboard Shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// ===================================
// Task Management Functions
// ===================================

// Create Task Object
function createTask(title, description, priority, dueDate) {
    return {
        id: generateId(),
        title: title.trim(),
        description: description.trim(),
        priority: priority,
        dueDate: dueDate || null,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

// Generate Unique ID
function generateId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Add New Task
function addTask(taskData) {
    const newTask = createTask(
        taskData.title,
        taskData.description,
        taskData.priority,
        taskData.dueDate
    );
    
    tasks.unshift(newTask); // Add to beginning
    saveTasksToStorage();
    renderTasks();
    updateStats();
    
    showNotification('Task added successfully! ✅');
}

// Update Existing Task
function updateTask(id, taskData) {
    const taskIndex = tasks.findIndex(task => task.id === id);
    
    if (taskIndex !== -1) {
        tasks[taskIndex] = {
            ...tasks[taskIndex],
            title: taskData.title.trim(),
            description: taskData.description.trim(),
            priority: taskData.priority,
            dueDate: taskData.dueDate || null,
            updatedAt: new Date().toISOString()
        };
        
        saveTasksToStorage();
        renderTasks();
        updateStats();
        
        showNotification('Task updated successfully! ✅');
    }
}

// Delete Task
function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasksToStorage();
        renderTasks();
        updateStats();
        
        showNotification('Task deleted! 🗑️');
    }
}

// Toggle Task Completion
function toggleTaskCompletion(id) {
    const task = tasks.find(task => task.id === id);
    
    if (task) {
        task.completed = !task.completed;
        task.updatedAt = new Date().toISOString();
        saveTasksToStorage();
        renderTasks();
        updateStats();
    }
}

// ===================================
// Filtering & Search Functions
// ===================================

// Get Filtered Tasks
function getFilteredTasks() {
    let filteredTasks = [...tasks];
    
    // Filter by status
    if (currentFilter.status === 'active') {
        filteredTasks = filteredTasks.filter(task => !task.completed);
    } else if (currentFilter.status === 'completed') {
        filteredTasks = filteredTasks.filter(task => task.completed);
    }
    
    // Filter by priority
    if (currentFilter.priority !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.priority === currentFilter.priority);
    }
    
    // Filter by search query
    if (currentFilter.search) {
        const searchLower = currentFilter.search.toLowerCase();
        filteredTasks = filteredTasks.filter(task => 
            task.title.toLowerCase().includes(searchLower) ||
            task.description.toLowerCase().includes(searchLower)
        );
    }
    
    return filteredTasks;
}

// Handle Search Input
function handleSearch(e) {
    currentFilter.search = e.target.value;
    renderTasks();
}

// Handle Status Filter
function handleStatusFilter(e) {
    currentFilter.status = e.target.value;
    renderTasks();
}

// Handle Priority Filter
function handlePriorityFilter(e) {
    currentFilter.priority = e.target.value;
    renderTasks();
}

// ===================================
// Rendering Functions
// ===================================

// Render All Tasks
function renderTasks() {
    const filteredTasks = getFilteredTasks();
    
    // Clear container
    elements.tasksContainer.innerHTML = '';
    
    // Show empty state if no tasks
    if (filteredTasks.length === 0) {
        if (tasks.length === 0) {
            elements.emptyState.innerHTML = `
                <div class="empty-icon">📝</div>
                <h2>No tasks yet!</h2>
                <p>Create your first task to get started</p>
            `;
        } else {
            elements.emptyState.innerHTML = `
                <div class="empty-icon">🔍</div>
                <h2>No tasks found</h2>
                <p>Try adjusting your filters or search</p>
            `;
        }
        elements.tasksContainer.appendChild(elements.emptyState);
        return;
    }
    
    // Render each task
    filteredTasks.forEach(task => {
        const taskCard = createTaskCard(task);
        elements.tasksContainer.appendChild(taskCard);
    });
}

// Create Task Card Element
function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = `task-card ${task.completed ? 'completed' : ''}`;
    card.dataset.taskId = task.id;
    
    // Format due date
    const dueDateFormatted = task.dueDate 
        ? new Date(task.dueDate).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          })
        : null;
    
    card.innerHTML = `
        <div class="task-header">
            <input 
                type="checkbox" 
                class="task-checkbox" 
                ${task.completed ? 'checked' : ''}
                onchange="toggleTaskCompletion('${task.id}')"
            >
            <div class="task-content">
                <h3 class="task-title">${escapeHtml(task.title)}</h3>
                ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
                <div class="task-meta">
                    <span class="task-badge priority-${task.priority}">
                        ${task.priority}
                    </span>
                    ${task.dueDate ? `
                        <span class="task-due-date">
                            📅 ${dueDateFormatted}
                        </span>
                    ` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="icon-btn" onclick="openEditTaskModal('${task.id}')" title="Edit task">
                    ✏️
                </button>
                <button class="icon-btn delete" onclick="deleteTask('${task.id}')" title="Delete task">
                    🗑️
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Update Statistics
function updateStats() {
    const total = tasks.length;
    const active = tasks.filter(task => !task.completed).length;
    const completed = tasks.filter(task => task.completed).length;
    
    animateNumber(elements.totalTasks, total);
    animateNumber(elements.activeTasks, active);
    animateNumber(elements.completedTasks, completed);
}

// Animate Number Change
function animateNumber(element, targetNumber) {
    const currentNumber = parseInt(element.textContent) || 0;
    const difference = targetNumber - currentNumber;
    const duration = 300;
    const steps = 20;
    const stepValue = difference / steps;
    const stepDuration = duration / steps;
    
    let currentStep = 0;
    
    const interval = setInterval(() => {
        currentStep++;
        const newValue = Math.round(currentNumber + (stepValue * currentStep));
        element.textContent = newValue;
        
        if (currentStep >= steps) {
            clearInterval(interval);
            element.textContent = targetNumber;
        }
    }, stepDuration);
}

// ===================================
// Modal Functions
// ===================================

// Open Add Task Modal
function openAddTaskModal() {
    editingTaskId = null;
    elements.modalTitle.textContent = 'Add New Task';
    elements.submitBtnText.textContent = 'Add Task';
    elements.taskForm.reset();
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    elements.taskDueDate.min = today;
    
    openModal();
}

// Open Edit Task Modal
function openEditTaskModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) return;
    
    editingTaskId = taskId;
    elements.modalTitle.textContent = 'Edit Task';
    elements.submitBtnText.textContent = 'Update Task';
    
    // Populate form
    elements.taskTitle.value = task.title;
    elements.taskDescription.value = task.description;
    elements.taskPriority.value = task.priority;
    elements.taskDueDate.value = task.dueDate || '';
    
    openModal();
}

// Open Modal
function openModal() {
    elements.taskModal.classList.add('active');
    elements.taskModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    elements.taskTitle.focus();
}

// Close Modal
function closeModal() {
    elements.taskModal.classList.remove('active');
    elements.taskModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    elements.taskForm.reset();
    editingTaskId = null;
}

// ===================================
// Form Handling
// ===================================

// Handle Form Submit
function handleFormSubmit(e) {
    e.preventDefault();
    
    // Get form data
    const formData = {
        title: elements.taskTitle.value,
        description: elements.taskDescription.value,
        priority: elements.taskPriority.value,
        dueDate: elements.taskDueDate.value
    };
    
    // Validate form
    if (!validateForm(formData)) {
        return;
    }
    
    // Add or update task
    if (editingTaskId) {
        updateTask(editingTaskId, formData);
    } else {
        addTask(formData);
    }
    
    closeModal();
}

// Validate Form
function validateForm(data) {
    let isValid = true;
    
    // Reset error messages
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    
    // Validate title
    if (!data.title.trim()) {
        document.getElementById('title-error').textContent = 'Title is required';
        isValid = false;
    } else if (data.title.trim().length < 3) {
        document.getElementById('title-error').textContent = 'Title must be at least 3 characters';
        isValid = false;
    }
    
    // Validate priority
    if (!data.priority) {
        document.getElementById('priority-error').textContent = 'Please select a priority';
        isValid = false;
    }
    
    return isValid;
}

// ===================================
// LocalStorage Functions
// ===================================

// Save Tasks to LocalStorage
function saveTasksToStorage() {
    try {
        localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
    } catch (error) {
        console.error('Error saving tasks to localStorage:', error);
        showNotification('Failed to save tasks! ❌', 'error');
    }
}

// Load Tasks from LocalStorage
function loadTasksFromStorage() {
    try {
        const storedTasks = localStorage.getItem('taskflow_tasks');
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
        }
    } catch (error) {
        console.error('Error loading tasks from localStorage:', error);
        tasks = [];
    }
}

// ===================================
// Theme Functions
// ===================================

// Toggle Theme
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    // Update icon
    elements.themeToggle.querySelector('.theme-icon').textContent = isDarkMode ? '☀️' : '🌙';
    
    // Save preference
    localStorage.setItem('taskflow_theme', isDarkMode ? 'dark' : 'light');
}

// Load Theme Preference
function loadThemePreference() {
    const savedTheme = localStorage.getItem('taskflow_theme');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        elements.themeToggle.querySelector('.theme-icon').textContent = '☀️';
    }
}

// ===================================
// Keyboard Shortcuts
// ===================================
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + K: Open Add Task Modal
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openAddTaskModal();
    }
    
    // Escape: Close Modal
    if (e.key === 'Escape' && elements.taskModal.classList.contains('active')) {
        closeModal();
    }
    
    // Ctrl/Cmd + /: Focus Search
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        elements.searchInput.focus();
    }
}

// ===================================
// Utility Functions
// ===================================

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show Notification (Simple Toast)
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        font-weight: 600;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add notification animations to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);

// ===================================
// Initialize App on Page Load
// ===================================
document.addEventListener('DOMContentLoaded', init);

// Log welcome message
console.log('%c⚡ TaskFlow Initialized! ', 'background: #6366f1; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold;');
console.log('%cKeyboard Shortcuts:', 'font-weight: bold; margin-top: 8px;');
console.log('• Ctrl/Cmd + K: Add new task');
console.log('• Ctrl/Cmd + /: Focus search');
console.log('• Escape: Close modal');
