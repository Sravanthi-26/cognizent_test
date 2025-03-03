from flask import Blueprint, jsonify, request, Response
from app.services.notification_service import NotificationService
import json
import datetime
import threading
from queue import Queue

api = Blueprint('api', __name__)
notification_service = NotificationService()

# Store SSE clients
sse_clients = set()
sse_lock = threading.Lock()

tasks = []
next_task_id = 1

def notify_sse_clients(event_type, data):
    """
    Add better error handling and client management
    """
    with sse_lock:
        dead_clients = set()
        for client in sse_clients:
            try:
                client.put({
                    'event': event_type,
                    'data': json.dumps(data)
                })
            except:
                # TODO: Add proper error logging
                dead_clients.add(client)
        sse_clients.difference_update(dead_clients)

@api.route('/api/tasks/stream')
def stream_tasks():
    """
    SSE endpoint that streams task updates to connected clients.
    Supports events: task_created, task_updated, task_deleted
    """
    def generate():
        client_queue = Queue()
        with sse_lock:
            sse_clients.add(client_queue)
        try:
            while True:
                event = client_queue.get()
                yield f"event: {event['event']}\ndata: {event['data']}\n\n"
        except GeneratorExit:
            with sse_lock:
                sse_clients.remove(client_queue)
    
    return Response(generate(), mimetype='text/event-stream')

@api.route('/api/tasks', methods=['GET'])
def get_tasks():
    return jsonify(tasks)

@api.route('/api/tasks', methods=['POST'])
def create_task():
    data = request.get_json()
    task = {
        'id': len(tasks) + 1,
        'title': data['title'],
        'completed': False,
        'assignee_email': data.get('assignee_email'),
        'due_date': data.get('due_date') or datetime.date.today().strftime("%Y-%m-%d")
    }
    tasks.append(task)
    # Send notification for new task
    notification_service.send_notification(task['id'], task)
    notify_sse_clients('task_created', task)
    return jsonify(task), 201

@api.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    data = request.get_json()
    for task in tasks:
        if task['id'] == task_id:
            # Validate completed field is boolean
            if 'completed' in data:
                data['completed'] = bool(data['completed'])
            
            task.update(data)
            # Send async notification
            notification_service.send_notification(task_id, task)
            # Notify SSE clients about the update
            notify_sse_clients('task_updated', task)
            return jsonify(task), 200
    return jsonify({'error': 'Task not found'}), 404

@api.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    for i, task in enumerate(tasks):
        if task['id'] == task_id:
            deleted_task = tasks.pop(i)
            notify_sse_clients('task_deleted', {'id': task_id})
            return jsonify({'message': 'Task deleted', 'task': deleted_task}), 200
    return jsonify({'error': 'Task not found'}), 404

"""
Main API routes for task management with real-time update capabilities.
Integrates SSE for pushing updates to clients and async notification handling.

Endpoints:
- GET /api/tasks: Retrieve all tasks
- POST /api/tasks: Create new task
- PUT /api/tasks/<id>: Update task
- DELETE /api/tasks/<id>: Delete task
- GET /api/tasks/stream: SSE endpoint for real-time updates
""" 