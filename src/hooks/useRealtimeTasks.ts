import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

import logger from '@/utils/logger';

enum EventTypes {
  TASK_CREATED = 'task:created',
  TASK_UPDATED = 'task:updated',
  TASK_DELETED = 'task:deleted',
  TASK_ASSIGNED = 'task:assigned',
  COMMENT_ADDED = 'comment:added',
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  dueDate?: string;
  assigneeId?: string;
  comments?: Array<{ id: string; content: string; userId: string; createdAt: string }>;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Custom React hook for subscribing to real-time task updates.
 * Connects to a WebSocket server using Socket.IO to receive task-related events.
 * 
 * @returns An object containing the list of tasks and a method to manually refresh the tasks.
 */
export const useRealtimeTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Initialize Socket.IO client
    const newSocket = io(process.env.REACT_APP_WEBSOCKET_URL || '', {
      auth: {
        token: localStorage.getItem('token'), // Assuming JWT token is stored in localStorage
      },
    });

    setSocket(newSocket);

    newSocket.on('connect_error', (err) => {
      logger.error('Connection Error:', err.message);
    });

    // Handle task-related events
    newSocket.on(EventTypes.TASK_CREATED, (task: Task) => {
      setTasks((prevTasks) => [...prevTasks, task]);
    });

    newSocket.on(EventTypes.TASK_UPDATED, (updatedTask: Task) => {
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
      );
    });

    newSocket.on(EventTypes.TASK_DELETED, (deletedTaskId: string) => {
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== deletedTaskId));
    });

    newSocket.on(EventTypes.TASK_ASSIGNED, (updatedTask: Task) => {
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
      );
    });

    newSocket.on(EventTypes.COMMENT_ADDED, (updatedTask: Task) => {
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
      );
    });

    return () => {
      newSocket.close();
    };
  }, []);

  /**
   * Manually refreshes the list of tasks.
   * This can be used to ensure the UI is up-to-date with the latest server state.
   */
  const refreshTasks = () => {
    if (socket) {
      socket.emit('GET_TASKS', {}, (response: { tasks: Task[] }) => {
        setTasks(response.tasks);
      });
    }
  };

  return { tasks, refreshTasks };
};