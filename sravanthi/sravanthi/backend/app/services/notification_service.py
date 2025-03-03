from threading import Thread
from queue import Queue
import time
import logging
import smtplib
from email.mime.text import MIMEText
from typing import Dict, Any
from tenacity import retry, stop_after_attempt, wait_exponential
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('notifications.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        """Initialize notification service with a background worker thread"""
        self.notification_queue = Queue()
        self.max_retries = 3
        self.smtp_config = {
            'host': os.getenv('SMTP_HOST', 'smtp.gmail.com'),
            'port': int(os.getenv('SMTP_PORT', 587)),
            'username': os.getenv('SMTP_USERNAME', ''),
            'password': os.getenv('SMTP_PASSWORD', ''),
        }
        
        # Daemon thread ensures it shuts down with main process
        self.worker_thread = Thread(target=self._process_notifications, daemon=True)
        self.worker_thread.start()
        logger.info("NotificationService initialized")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        reraise=True
    )
    def _send_email_notification(self, task_id: int, task_data: Dict[str, Any]) -> None:
        """
        Send email notification with retry mechanism
        
        Args:
            task_id: The ID of the task
            task_data: Dictionary containing task details
        
        Raises:
            SMTPException: If email sending fails after retries
        """
        try:
            # Create email message
            msg = MIMEText(
                f"Task Update:\n\n"
                f"Task ID: {task_id}\n"
                f"Title: {task_data.get('title')}\n"
                f"Status: {'Completed' if task_data.get('completed') else 'Pending'}\n"
                f"Due Date: {task_data.get('due_date')}\n"
                f"Assignee: {task_data.get('assignee_email', 'Not assigned')}"
            )
            msg['Subject'] = f'Task Update - {task_data.get("title")}'
            msg['From'] = self.smtp_config['username']
            msg['To'] = task_data.get('assignee_email', 'default@example.com')

            # Connect to SMTP server and send email
            with smtplib.SMTP(self.smtp_config['host'], self.smtp_config['port']) as server:
                server.starttls()
                server.login(self.smtp_config['username'], self.smtp_config['password'])
                server.send_message(msg)
                
            logger.info(f"Email notification sent successfully for task {task_id}")
            
        except smtplib.SMTPException as e:
            logger.error(f"Failed to send email notification for task {task_id}: {str(e)}")
            raise

    def _send_push_notification(self, task_id: int, task_data: Dict[str, Any]) -> None:
        """
        Send push notification (example implementation)
        
        Args:
            task_id: The ID of the task
            task_data: Dictionary containing task details
        """
        try:
            # Implement push notification logic here (e.g., using Firebase Cloud Messaging)
            logger.info(f"Push notification sent for task {task_id}")
        except Exception as e:
            logger.error(f"Failed to send push notification for task {task_id}: {str(e)}")
            raise

    def _process_notifications(self) -> None:
        """
        Background worker that processes notifications from the queue.
        Implements retry mechanism and proper logging.
        """
        while True:
            try:
                task_id, task_data = self.notification_queue.get()
                logger.info(f"Processing notification for task {task_id}")

                # Send email notification with built-in retry mechanism
                try:
                    self._send_email_notification(task_id, task_data)
                except Exception as e:
                    logger.error(f"Email notification failed after retries for task {task_id}: {str(e)}")

                # Send push notification
                try:
                    self._send_push_notification(task_id, task_data)
                except Exception as e:
                    logger.error(f"Push notification failed for task {task_id}: {str(e)}")

            except Exception as e:
                logger.error(f"Unexpected error processing notification: {str(e)}")
            finally:
                self.notification_queue.task_done()

    def send_notification(self, task_id: int, task_data: Dict[str, Any]) -> None:
        """
        Queue a notification for processing
        
        Args:
            task_id: The ID of the task
            task_data: Dictionary containing task details
        """
        logger.info(f"Queueing notification for task {task_id}")
        self.notification_queue.put((task_id, task_data)) 