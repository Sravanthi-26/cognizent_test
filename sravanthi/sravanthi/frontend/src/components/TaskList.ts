import { Modal } from './Modal';
import { Task, TaskCreateData, TaskUpdateData } from '../models/task.model';

export class TaskList {
    private container: HTMLElement;
    private taskListElement: HTMLElement;
    private tasks: Task[] = [];
    private taskService: TaskService;
    private modal: Modal;

    constructor(container: HTMLElement, taskService: TaskService) {
        this.container = container;
        this.taskService = taskService;
        this.modal = new Modal();
        this.init();
    }

    private init() {
        // Add New Task button
        const addButton = document.createElement('button');
        addButton.textContent = 'Add New Task';
        addButton.className = 'btn-primary';
        addButton.onclick = () => {
            this.modal.show('Create New Task', this.createTaskForm());
        };
        this.container.appendChild(addButton);

        // Create task list container
        this.taskListElement = document.createElement('div');
        this.taskListElement.className = 'task-list';
        this.container.appendChild(this.taskListElement);
    }

    getTask(taskId: number): Task | undefined {
        return this.tasks.find(t => t.id === taskId);
    }

    private createTaskForm(): HTMLFormElement {
        const form = document.createElement('form');
        form.innerHTML = `
            <div class="form-row-inline">
                <div class="form-field">
                    <label for="taskTitle">Title</label>
                    <input type="text" id="taskTitle" required>
                </div>
                <div class="form-field">
                    <label for="taskEmail">Assignee Email</label>
                    <input type="email" id="taskEmail">
                </div>
                <div class="form-field">
                    <label for="taskDueDate">Due Date</label>
                    <input type="date" id="taskDueDate">
                </div>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn-secondary" onclick="this.closest('.modal').querySelector('.modal-close').click()">Cancel</button>
                <button type="submit" class="btn-primary">Save Task</button>
            </div>
        `;

        form.onsubmit = (e) => {
            e.preventDefault();
            this.handleAddTask(form);
            this.modal.close();
        };

        return form;
    }

    private createUpdateForm(task: Task): HTMLFormElement {
        const form = document.createElement('form');
        form.innerHTML = `
            <div class="form-row-inline">
                <div class="form-field">
                    <label for="updateTitle">Title</label>
                    <input type="text" id="updateTitle" value="${task.title}" required>
                </div>
                <div class="form-field">
                    <label for="updateEmail">Assignee Email</label>
                    <input type="email" id="updateEmail" value="${task.assignee_email || ''}">
                </div>
                <div class="form-field">
                    <label for="updateDueDate">Due Date</label>
                    <input type="date" id="updateDueDate" value="${task.due_date || ''}">
                </div>
            </div>
            <div class="form-row">
                <label class="checkbox-label">
                    <input type="checkbox" id="updateCompleted" ${task.completed ? 'checked' : ''}>
                    Mark as completed
                </label>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn-secondary" onclick="this.closest('.modal').querySelector('.modal-close').click()">Cancel</button>
                <button type="submit" class="btn-primary">Update Task</button>
            </div>
        `;

        form.onsubmit = (e) => {
            e.preventDefault();
            this.handleUpdateTask(task.id, form);
            this.modal.close();
        };

        return form;
    }

    private handleAddTask(form: HTMLFormElement) {
        const titleInput = form.querySelector('#taskTitle') as HTMLInputElement;
        const emailInput = form.querySelector('#taskEmail') as HTMLInputElement;
        const dueDateInput = form.querySelector('#taskDueDate') as HTMLInputElement;
        
        if (titleInput.value) {
            this.taskService.createTask(
                titleInput.value,
                dueDateInput.value || undefined,
                emailInput.value || undefined
            ).catch(error => {
                console.error('Failed to create task:', error);
            });
        }
    }

    private handleUpdateTask(taskId: number, form: HTMLFormElement) {
        const titleInput = form.querySelector('#updateTitle') as HTMLInputElement;
        const emailInput = form.querySelector('#updateEmail') as HTMLInputElement;
        const dueDateInput = form.querySelector('#updateDueDate') as HTMLInputElement;
        const completedInput = form.querySelector('#updateCompleted') as HTMLInputElement;

        const updates: TaskUpdateData = {
            title: titleInput.value,
            assignee_email: emailInput.value || undefined,
            due_date: dueDateInput.value || undefined,
            completed: completedInput.checked
        };

        this.taskService.updateTask(taskId, updates)
            .catch(error => console.error('Failed to update task:', error));
    }

    updateTasks(tasks: Task[]) {
        this.tasks = tasks;
        this.render();
    }

    private render() {
        this.taskListElement.innerHTML = this.tasks
            .map(task => `
                <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                    <div class="task-checkbox">
                        <input type="checkbox" 
                               ${task.completed ? 'checked' : ''} 
                               onchange="handleTaskComplete(${task.id}, this.checked)">
                    </div>
                    <div class="task-content">
                        <span class="task-title">${task.title}</span>
                        <span class="task-email">${task.assignee_email || 'No assignee'}</span>
                        <span class="due-date">${task.due_date || 'No due date'}</span>
                    </div>
                    <div class="task-actions">
                        <button class="btn-edit" onclick="handleTaskEdit(${task.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-delete" onclick="handleTaskDelete(${task.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `)
            .join('');
    }

    async updateTask(taskId: number, updates: Partial<Task>) {
        try {
            await this.taskService.updateTask(taskId, updates);
            // UI will be updated via SSE notification
        } catch (error) {
            console.error('Failed to update task:', error);
        }
    }

    private addUpdateTaskHandler() {
        (window as any).handleTaskUpdate = (taskId: number) => {
            const task = this.tasks.find(t => t.id === taskId);
            if (!task) return;

            const completed = confirm('Mark task as completed?');
            const email = prompt('Update assignee email:', task.assignee_email || '');
            
            const updates: Partial<Task> = {
                completed,
                assignee_email: email || undefined
            };

            this.taskService.updateTask(taskId, updates)
                .catch(error => console.error('Failed to update task:', error));
        };
    }

    showUpdateModal(task: Task) {
        this.modal.show('Edit Task', this.createUpdateForm(task));
    }

    async deleteTask(taskId: number) {
        try {
            await this.taskService.deleteTask(taskId);
            // Remove task from local array
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.render();
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
    }

    async confirmAndDeleteTask(taskId: number) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const confirmContent = document.createElement('div');
        confirmContent.innerHTML = `
            <p>Are you sure you want to delete the task "${task.title}"?</p>
            <div class="modal-actions">
                <button class="btn-secondary" onclick="this.closest('.modal').querySelector('.modal-close').click()">Cancel</button>
                <button class="btn-danger" onclick="handleConfirmDelete(${taskId})">Delete</button>
            </div>
        `;

        this.modal.show('Confirm Delete', confirmContent);
    }
} 
} 