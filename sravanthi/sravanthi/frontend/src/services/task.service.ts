import { Observable } from 'rxjs';
import { Task, TaskUpdate } from '../models/task.model';
import { config } from '../config';

export class TaskService {
    private eventSource: EventSource;
    public taskUpdates$: Observable<TaskUpdate>;
    private readonly API_URL = config.API_URL;

    constructor() {
        this.taskUpdates$ = new Observable(observer => {
            const connect = () => {
                this.eventSource = new EventSource(`${this.API_URL}/tasks/stream`);
                
                this.eventSource.onerror = () => {
                    this.eventSource.close();
                    setTimeout(connect, 5000);
                };
                
                this.eventSource.addEventListener('task_created', (event) => {
                    const task = JSON.parse(event.data);
                    observer.next({ type: 'created', task });
                });

                this.eventSource.addEventListener('task_updated', (event) => {
                    const task = JSON.parse(event.data);
                    observer.next({ type: 'updated', task });
                });

                this.eventSource.addEventListener('task_deleted', (event) => {
                    const data = JSON.parse(event.data);
                    observer.next({ type: 'deleted', taskId: data.id });
                });
            };
            
            connect();
            return () => this.eventSource.close();
        });
    }

    async getTasks(): Promise<Task[]> {
        const response = await fetch(`${this.API_URL}/tasks`);
        return response.json();
    }

    async createTask(title: string, due_date?: string, assignee_email?: string): Promise<Task> {
        const response = await fetch(`${this.API_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, due_date, assignee_email })
        });
        return response.json();
    }

    async updateTask(taskId: number, updates: Partial<Task>): Promise<Task> {
        const response = await fetch(`${this.API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        return response.json();
    }

    async deleteTask(taskId: number): Promise<void> {
        const response = await fetch(`${this.API_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to delete task: ${response.statusText}`);
        }
    }
} 