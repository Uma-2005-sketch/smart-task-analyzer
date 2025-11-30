// Global variables
let tasks = [];
let currentTaskId = 1;
let graphData = null;

// DOM Elements
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const jsonInput = document.getElementById('jsonInput');
const strategySelect = document.getElementById('strategy');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('taskDueDate').min = today;
    
    // Load sample tasks
    loadSampleTasks();
    
    // Initialize first tab
    showTab('analyzer');
});

// Tab Navigation
function showTab(tabName) {
    // Hide all tabs
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Activate corresponding button
    event.currentTarget.classList.add('active');
    
    // Load tab-specific data
    if (tabName === 'eisenhower') {
        loadEisenhowerMatrix();
    } else if (tabName === 'dependencies') {
        generateDependencyGraph();
    } else if (tabName === 'insights') {
        generateInsights();
    }
}

// Load sample tasks for demonstration
function loadSampleTasks() {
    const sampleTasks = [
        {
            id: '1',
            title: 'Complete project proposal',
            due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
            estimated_hours: 4,
            importance: 9,
            dependencies: []
        },
        {
            id: '2',
            title: 'Fix critical bug in login system',
            due_date: new Date().toISOString().split('T')[0], // Today
            estimated_hours: 2,
            importance: 10,
            dependencies: ['1']
        },
        {
            id: '3',
            title: 'Write API documentation',
            due_date: new Date(Date.now() + 604800000).toISOString().split('T')[0], // Next week
            estimated_hours: 3,
            importance: 6,
            dependencies: []
        },
        {
            id: '4',
            title: 'Setup development environment',
            due_date: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Day after tomorrow
            estimated_hours: 1,
            importance: 7,
            dependencies: []
        },
        {
            id: '5',
            title: 'Team weekly meeting',
            due_date: new Date().toISOString().split('T')[0], // Today
            estimated_hours: 1,
            importance: 4,
            dependencies: []
        },
        {
            id: '6',
            title: 'Learn new framework',
            due_date: new Date(Date.now() + 2592000000).toISOString().split('T')[0], // Next month
            estimated_hours: 10,
            importance: 8,
            dependencies: []
        }
    ];
    
    tasks = sampleTasks;
    updateTaskList();
}

// Add a new task from the form
function addTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const dueDate = document.getElementById('taskDueDate').value;
    const hours = parseFloat(document.getElementById('taskHours').value);
    const importance = parseInt(document.getElementById('taskImportance').value);
    const dependencies = document.getElementById('taskDependencies').value
        .split(',')
        .map(dep => dep.trim())
        .filter(dep => dep !== '');

    // Validation
    if (!title || !dueDate || !hours || !importance) {
        showError('Please fill in all required fields');
        return;
    }

    if (importance < 1 || importance > 10) {
        showError('Importance must be between 1 and 10');
        return;
    }

    if (hours <= 0) {
        showError('Estimated hours must be positive');
        return;
    }

    // Create new task
    const newTask = {
        id: (currentTaskId++).toString(),
        title: title,
        due_date: dueDate,
        estimated_hours: hours,
        importance: importance,
        dependencies: dependencies
    };

    tasks.push(newTask);
    updateTaskList();
    clearForm();
    hideError();
}

// Clear the task form
function clearForm() {
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDueDate').value = '';
    document.getElementById('taskHours').value = '';
    document.getElementById('taskImportance').value = '';
    document.getElementById('taskDependencies').value = '';
}

// Load tasks from JSON input
function loadJSONTasks() {
    const jsonText = jsonInput.value.trim();
    
    if (!jsonText) {
        showError('Please enter JSON data');
        return;
    }

    try {
        const parsedTasks = JSON.parse(jsonText);
        
        if (!Array.isArray(parsedTasks)) {
            showError('JSON must be an array of tasks');
            return;
        }

        // Validate each task
        for (const task of parsedTasks) {
            if (!task.title || !task.due_date || !task.estimated_hours || !task.importance) {
                showError('Each task must have title, due_date, estimated_hours, and importance');
                return;
            }
        }

        tasks = parsedTasks.map((task, index) => ({
            id: (task.id || (currentTaskId + index)).toString(),
            title: task.title,
            due_date: task.due_date,
            estimated_hours: task.estimated_hours,
            importance: task.importance,
            dependencies: task.dependencies || []
        }));

        currentTaskId = tasks.length + 1;
        updateTaskList();
        hideError();
        
        // Show success message
        showTemporaryMessage(`Loaded ${tasks.length} tasks successfully!`, 'success');

    } catch (error) {
        showError('Invalid JSON format: ' + error.message);
    }
}

// Update the task list display
function updateTaskList() {
    taskList.innerHTML = '';
    taskCount.textContent = tasks.length;

    if (tasks.length === 0) {
        taskList.innerHTML = '<div class="task-item">No tasks added yet</div>';
        return;
    }

    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.innerHTML = `
            <div class="task-info">
                <div class="task-title">${task.title}</div>
                <div class="task-details">
                    Due: ${task.due_date} | Hours: ${task.estimated_hours} | 
                    Importance: ${task.importance}/10 | 
                    Dependencies: ${task.dependencies.length ? task.dependencies.join(', ') : 'None'}
                </div>
            </div>
            <button class="remove-task" onclick="removeTask('${task.id}')">Remove</button>
        `;
        taskList.appendChild(taskElement);
    });
}

// Remove a task
function removeTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    updateTaskList();
}

// Clear all tasks
function clearTasks() {
    if (tasks.length === 0) return;
    
    if (confirm('Are you sure you want to clear all tasks?')) {
        tasks = [];
        currentTaskId = 1;
        updateTaskList();
        hideResults();
        hideSuggestions();
    }
}

// Analyze tasks using the backend API
async function analyzeTasks() {
    if (tasks.length === 0) {
        showError('Please add some tasks first');
        return;
    }

    showLoading();
    hideError();
    hideResults();
    hideSuggestions();

    try {
        const strategy = strategySelect.value;
        
        const response = await fetch('/api/tasks/analyze/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tasks)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Analysis failed');
        }

        displayResults(data.tasks, data.strategy_used);
        
    } catch (error) {
        showError('Analysis failed: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Get task suggestions
async function getSuggestions() {
    showLoading();
    hideError();
    hideResults();
    hideSuggestions();

    try {
        const response = await fetch('/api/tasks/suggest/');
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to get suggestions');
        }

        displaySuggestions(data.suggestions);
        
    } catch (error) {
        showError('Failed to get suggestions: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Display analysis results
function displayResults(scoredTasks, strategy) {
    const resultList = document.getElementById('resultList');
    resultList.innerHTML = '';

    scoredTasks.forEach((task, index) => {
        const priorityClass = getPriorityClass(task.priority_score);
        const scoreClass = getScoreClass(task.priority_score);
        
        const taskElement = document.createElement('div');
        taskElement.className = `priority-task ${priorityClass}`;
        taskElement.innerHTML = `
            <div class="task-header">
                <h4>${index + 1}. ${task.title}</h4>
                <div class="task-score ${scoreClass}">${task.priority_score.toFixed(3)}</div>
            </div>
            <div class="task-explanation">${task.explanation}</div>
            <div class="task-meta">
                <div class="meta-item">📅 Due: ${task.due_date}</div>
                <div class="meta-item">⏱️ ${task.estimated_hours}h</div>
                <div class="meta-item">⭐ ${task.importance}/10</div>
                <div class="meta-item">🔗 ${task.dependencies.length} deps</div>
            </div>
        `;
        resultList.appendChild(taskElement);
    });

    document.getElementById('results').classList.remove('hidden');
}

// Display task suggestions
function displaySuggestions(suggestions) {
    const suggestionList = document.getElementById('suggestionList');
    suggestionList.innerHTML = '';

    suggestions.forEach(suggestion => {
        const suggestionElement = document.createElement('div');
        suggestionElement.className = 'suggestion-item';
        suggestionElement.innerHTML = `
            <div class="suggestion-rank">#${suggestion.rank}</div>
            <h4>${suggestion.task}</h4>
            <div class="suggestion-reason">${suggestion.reason}</div>
            <div class="task-meta">
                <div class="meta-item">📅 ${suggestion.due_date}</div>
                <div class="meta-item">⏱️ ${suggestion.estimated_hours}h</div>
                <div class="meta-item">⭐ ${suggestion.importance}/10</div>
                <div class="meta-item">🎯 Score: ${suggestion.priority_score}</div>
            </div>
        `;
        suggestionList.appendChild(suggestionElement);
    });

    document.getElementById('suggestions').classList.remove('hidden');
}

// BONUS: Eisenhower Matrix
async function loadEisenhowerMatrix() {
    if (tasks.length === 0) {
        // Use sample data if no tasks
        await generateSampleEisenhower();
        return;
    }

    showLoading();
    
    try {
        const response = await fetch('/api/tasks/eisenhower/');
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to generate matrix');
        }

        displayEisenhowerMatrix(data.matrix);
        
    } catch (error) {
        // Fallback to client-side calculation
        generateClientSideEisenhower();
    } finally {
        hideLoading();
    }
}

function generateClientSideEisenhower() {
    const today = new Date();
    const urgentThreshold = 3; // days
    const importanceThreshold = 7;
    
    const matrix = {
        "do_first": [],      // Urgent & Important
        "schedule": [],      // Important & Not Urgent  
        "delegate": [],      // Urgent & Not Important
        "eliminate": []      // Not Urgent & Not Important
    };
    
    tasks.forEach(task => {
        const dueDate = new Date(task.due_date);
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        const isUrgent = daysUntilDue <= urgentThreshold;
        const isImportant = task.importance >= importanceThreshold;
        
        if (isUrgent && isImportant) {
            matrix.do_first.push(task);
        } else if (!isUrgent && isImportant) {
            matrix.schedule.push(task);
        } else if (isUrgent && !isImportant) {
            matrix.delegate.push(task);
        } else {
            matrix.eliminate.push(task);
        }
    });
    
    displayEisenhowerMatrix(matrix);
}

async function generateSampleEisenhower() {
    // Generate sample matrix data
    const sampleMatrix = {
        "do_first": [
            { title: "Fix critical production bug", importance: 10, due_date: new Date().toISOString().split('T')[0] },
            { title: "Submit quarterly report", importance: 9, due_date: new Date().toISOString().split('T')[0] }
        ],
        "schedule": [
            { title: "Plan next sprint", importance: 8, due_date: new Date(Date.now() + 604800000).toISOString().split('T')[0] },
            { title: "Research new technologies", importance: 7, due_date: new Date(Date.now() + 1209600000).toISOString().split('T')[0] }
        ],
        "delegate": [
            { title: "Team meeting preparation", importance: 5, due_date: new Date().toISOString().split('T')[0] },
            { title: "Email responses", importance: 4, due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0] }
        ],
        "eliminate": [
            { title: "Organize desk", importance: 3, due_date: new Date(Date.now() + 2592000000).toISOString().split('T')[0] },
            { title: "Read industry news", importance: 2, due_date: new Date(Date.now() + 172800000).toISOString().split('T')[0] }
        ]
    };
    
    displayEisenhowerMatrix(sampleMatrix);
}

function displayEisenhowerMatrix(matrix) {
    const quadrants = ['do_first', 'schedule', 'delegate', 'eliminate'];
    const quadrantNames = {
        'do_first': 'quadrant-do-first',
        'schedule': 'quadrant-schedule', 
        'delegate': 'quadrant-delegate',
        'eliminate': 'quadrant-eliminate'
    };
    
    quadrants.forEach(quadrant => {
        const container = document.getElementById(quadrantNames[quadrant]);
        container.innerHTML = '';
        
        if (matrix[quadrant].length === 0) {
            container.innerHTML = '<div class="matrix-task">No tasks</div>';
            return;
        }
        
        matrix[quadrant].forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'matrix-task';
            taskElement.innerHTML = `
                <strong>${task.title}</strong><br>
                <small>Importance: ${task.importance}/10 | Due: ${task.due_date}</small>
            `;
            container.appendChild(taskElement);
        });
    });
}

// BONUS: Dependency Graph Visualization
async function generateDependencyGraph() {
    if (tasks.length === 0) {
        showError('Please add tasks to generate dependency graph');
        return;
    }

    showLoading();
    
    try {
        const response = await fetch('/api/tasks/dependency-graph/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tasks)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to generate graph');
        }

        graphData = data.graph;
        displayDependencyGraph(data.graph);
        
        // Show graph info
        document.getElementById('graph-info').classList.remove('hidden');
        document.getElementById('graph-stats').innerHTML = `
            Nodes: ${data.graph.nodes.length} | Links: ${data.graph.links.length}
        `;
        
        if (data.has_circular_deps) {
            document.getElementById('circular-warning').classList.remove('hidden');
        } else {
            document.getElementById('circular-warning').classList.add('hidden');
        }
        
    } catch (error) {
        showError('Graph generation failed: ' + error.message);
        // Fallback to client-side graph generation
        generateClientSideDependencyGraph();
    } finally {
        hideLoading();
    }
}

function generateClientSideDependencyGraph() {
    const nodes = [];
    const links = [];
    
    tasks.forEach(task => {
        nodes.push({
            id: task.id,
            name: task.title,
            importance: task.importance
        });
        
        task.dependencies.forEach(depId => {
            links.push({
                source: depId,
                target: task.id
            });
        });
    });
    
    graphData = { nodes, links };
    displayDependencyGraph(graphData);
}

function displayDependencyGraph(graphData) {
    const container = document.getElementById('dependency-graph');
    container.innerHTML = '';
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    const svg = d3.select('#dependency-graph')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
    // Create simulation
    const simulation = d3.forceSimulation(graphData.nodes)
        .force('link', d3.forceLink(graphData.links).id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2));
    
    // Create links
    const link = svg.append('g')
        .selectAll('line')
        .data(graphData.links)
        .enter().append('line')
        .attr('class', 'link')
        .attr('stroke-width', 2);
    
    // Create nodes
    const node = svg.append('g')
        .selectAll('g')
        .data(graphData.nodes)
        .enter().append('g')
        .attr('class', 'node')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));
    
    node.append('circle')
        .attr('r', d => 20 + (d.importance || 5))
        .attr('fill', d => getPriorityColor(d.importance));
    
    node.append('text')
        .text(d => d.name)
        .attr('text-anchor', 'middle')
        .attr('dy', 4)
        .attr('font-size', '10px')
        .attr('fill', '#333');
    
    // Update positions
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        node
            .attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

function getPriorityColor(importance) {
    if (importance >= 9) return '#dc3545';
    if (importance >= 7) return '#ffc107';
    return '#28a745';
}

function clearGraph() {
    document.getElementById('dependency-graph').innerHTML = '';
    document.getElementById('graph-info').classList.add('hidden');
}

// BONUS: AI Insights
function generateInsights() {
    if (tasks.length === 0) {
        // Show sample insights
        displaySampleInsights();
        return;
    }

    const insights = analyzeTaskData();
    displayInsights(insights);
}

function analyzeTaskData() {
    const totalHours = tasks.reduce((sum, task) => sum + task.estimated_hours, 0);
    const avgImportance = tasks.reduce((sum, task) => sum + task.importance, 0) / tasks.length;
    
    const today = new Date();
    const urgentTasks = tasks.filter(task => {
        const dueDate = new Date(task.due_date);
        return (dueDate - today) / (1000 * 60 * 60 * 24) <= 3;
    }).length;
    
    const highImportanceTasks = tasks.filter(task => task.importance >= 8).length;
    
    return {
        totalHours,
        avgImportance: avgImportance.toFixed(1),
        urgentTasks,
        highImportanceTasks,
        totalTasks: tasks.length,
        estimatedCompletion: (totalHours / 8).toFixed(1) // assuming 8-hour days
    };
}

function displayInsights(insights) {
    // Workload Analysis
    document.getElementById('workload-metrics').innerHTML = `
        <div class="insight-metric">
            <span>Total Workload:</span>
            <span class="metric-value">${insights.totalHours} hours</span>
        </div>
        <div class="insight-metric">
            <span>Estimated Days:</span>
            <span class="metric-value">${insights.estimatedCompletion} days</span>
        </div>
        <div class="insight-metric">
            <span>Average Importance:</span>
            <span class="metric-value">${insights.avgImportance}/10</span>
        </div>
    `;
    
    // Time Optimization
    document.getElementById('time-optimization').innerHTML = `
        <p>🎯 <strong>Focus on high-impact tasks first</strong></p>
        <p>⏰ <strong>Batch similar tasks</strong> to reduce context switching</p>
        <p>📅 <strong>Schedule deep work</strong> for important tasks</p>
        <p>⚡ <strong>Use time blocking</strong> for better focus</p>
    `;
    
    // Focus Recommendations
    const focusAdvice = insights.urgentTasks > 3 ? 
        "🚨 Too many urgent tasks! Consider delegating or reprioritizing." :
        "✅ Good balance of urgent vs important tasks.";
    
    document.getElementById('focus-recommendations').innerHTML = `
        <p>${focusAdvice}</p>
        <p>🎯 Focus on ${insights.highImportanceTasks} high-importance tasks</p>
        <p>📊 ${insights.urgentTasks} tasks need immediate attention</p>
    `;
    
    // Productivity Trends
    document.getElementById('productivity-trends').innerHTML = `
        <div class="insight-metric">
            <span>Task Completion Rate:</span>
            <span class="metric-value">${Math.min(100, (insights.totalTasks / 10) * 100)}%</span>
        </div>
        <div class="insight-metric">
            <span>Workload Intensity:</span>
            <span class="metric-value">${insights.totalHours > 40 ? 'High' : 'Moderate'}</span>
        </div>
        <div class="insight-metric">
            <span>Priority Distribution:</span>
            <span class="metric-value">Balanced</span>
        </div>
    `;
}

function displaySampleInsights() {
    document.getElementById('workload-metrics').innerHTML = `
        <p>Add tasks to see detailed workload analysis and get personalized productivity insights.</p>
    `;
    
    document.getElementById('time-optimization').innerHTML = `
        <p>⏰ <strong>Time blocking</strong> can increase productivity by 25%</p>
        <p>🎯 <strong>Pomodoro technique</strong> helps maintain focus</p>
        <p>📅 <strong>Plan your week</strong> every Monday morning</p>
    `;
    
    document.getElementById('focus-recommendations').innerHTML = `
        <p>🤖 AI will analyze your tasks and provide personalized focus recommendations based on:</p>
        <ul>
            <li>Task urgency and importance</li>
            <li>Your work patterns</li>
            <li>Optimal productivity times</li>
        </ul>
    `;
    
    document.getElementById('productivity-trends').innerHTML = `
        <p>📈 Add tasks to unlock advanced analytics including:</p>
        <ul>
            <li>Productivity trends over time</li>
            <li>Task completion patterns</li>
            <li>Optimal work schedule recommendations</li>
        </ul>
    `;
}

// Helper functions for UI management
function getPriorityClass(score) {
    if (score >= 0.7) return 'priority-high';
    if (score >= 0.4) return 'priority-medium';
    return 'priority-low';
}

function getScoreClass(score) {
    if (score >= 0.7) return 'score-high';
    if (score >= 0.4) return 'score-medium';
    return 'score-low';
}

function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

function showError(message) {
    const errorElement = document.getElementById('error');
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
}

function hideError() {
    document.getElementById('error').classList.add('hidden');
}

function hideResults() {
    document.getElementById('results').classList.add('hidden');
}

function hideSuggestions() {
    document.getElementById('suggestions').classList.add('hidden');
}

function showTemporaryMessage(message, type) {
    const messageElement = document.createElement('div');
    messageElement.className = `temporary-message ${type}`;
    messageElement.textContent = message;
    messageElement.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(messageElement);
    
    setTimeout(() => {
        messageElement.remove();
    }, 3000);
}

// Add CSS for temporary messages
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// Add keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Ctrl+Enter to analyze tasks
    if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        analyzeTasks();
    }
    
    // Escape to clear form
    if (event.key === 'Escape') {
        clearForm();
    }
});

// Make the task form submit with Enter key
document.getElementById('taskTitle').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        addTask();
    }
});