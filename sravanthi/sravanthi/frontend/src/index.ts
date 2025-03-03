import { TaskService } from './services/task.service';
import { TaskList } from './components/TaskList';
import './styles/tasks.css';
import './styles/modal.css';

// Add global handlers for the UI
(window as any).handleTaskComplete = (taskId: number, completed: boolean) => {
    taskService.updateTask(taskId, { completed })
        .catch(error => console.error('Failed to complete task:', error));
};

// Update delete handler
(window as any).handleTaskDelete = (taskId: number) => {
    taskList.confirmAndDeleteTask(taskId);
};

// Add global handler for task updates
(window as any).handleTaskUpdate = (taskId: number) => {
    const task = taskList.getTask(taskId);
    if (!task) return;

    const title = prompt('Update task title:', task.title);
    const email = prompt('Update assignee email:', task.assignee_email || '');
    const completed = confirm('Mark task as completed?');

    if (title !== null || email !== null) {
        const updates: Partial<Task> = {
            ...(title && { title }),
            ...(email && { assignee_email: email }),
            completed
        };
        
        taskService.updateTask(taskId, updates)
            .catch(error => console.error('Failed to update task:', error));
    }
};

// Add global handler for task edit
(window as any).handleTaskEdit = (taskId: number) => {
    const task = taskList.getTask(taskId);
    if (task) {
        taskList.showUpdateModal(task);
    }
};

const taskService = new TaskService();
const appElement = document.getElementById('app')!;
const taskList = new TaskList(appElement, taskService);

// Load initial tasks
taskService.getTasks().then(tasks => {
    taskList.updateTasks(tasks);
});

// Listen for new task additions
appElement.addEventListener('add-task', ((e: CustomEvent) => {
    taskService.createTask(e.detail.title, e.detail.due_date)
        .then(() => taskService.getTasks())
        .then(tasks => taskList.updateTasks(tasks));
}) as EventListener);

// Subscribe to real-time updates
taskService.taskUpdates$.subscribe(update => {
    console.log('Received update:', update);
    switch (update.type) {
        case 'updated':
            if (update.task) {
                taskService.getTasks().then(tasks => taskList.updateTasks(tasks));
            }
            break;
        case 'deleted':
            if (update.taskId) {
                // Remove the task from the list
                const tasks = taskList.tasks.filter(t => t.id !== update.taskId);
                taskList.updateTasks(tasks);
            }
            break;
        case 'created':
            taskService.getTasks().then(tasks => taskList.updateTasks(tasks));
            break;
    }
});

// Example usage
async function init() {
    try {
        // Get all tasks
        const tasks = await taskService.getTasks();
        console.log('All tasks:', tasks);

        // Create a new task
        const newTask = await taskService.createTask('Test Task');
        console.log('Created task:', newTask);

        // Update the task
        const updatedTask = await taskService.updateTask(newTask.id, { completed: true });
        console.log('Updated task:', updatedTask);

        // Delete the task
        await taskService.deleteTask(newTask.id);
        console.log('Task deleted');
    } catch (error) {
        console.error('Error:', error);
    }
}

init();

(window as any).handleConfirmDelete = (taskId: number) => {
    taskList.deleteTask(taskId)
        .then(() => {
            const modal = document.querySelector('.modal');
            if (modal) {
                (modal as any).querySelector('.modal-close').click();
            }
        })
        .catch(error => console.error('Failed to delete task:', error));
}; 