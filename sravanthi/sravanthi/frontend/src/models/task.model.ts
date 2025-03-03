export interface Task {
    id: number;
    title: string;
    completed: boolean;
    due_date?: string;
    assignee_email?: string;
}

export interface TaskUpdate {
    type: 'created' | 'updated' | 'deleted';
    task?: Task;
    taskId?: number;
}

export interface TaskCreateData {
    title: string;
    due_date?: string;
    assignee_email?: string;
}

export interface TaskUpdateData {
    title?: string;
    completed?: boolean;
    due_date?: string;
    assignee_email?: string;
} 