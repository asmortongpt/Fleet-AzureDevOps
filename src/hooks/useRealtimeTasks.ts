import { useEffect, useState } from 'react';
import io from 'socket.io-client';

import { EventTypes } from '../types/EventTypes';
import { Task } from '../types/Task';

import logger from '@/utils/logger';
/**
 * Custom React hook for subscribing to real-time task updates.
 * Connects to a WebSocket server using Socket.IO to receive task-related events.
 * 
 * @returns An object containing the list of tasks and a method to manually refresh the tasks.
 */
export const useRealtimeTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [socket, setSocket] = useState<SocketIOClient.Socket | null>(null);

  useEffect(() => {
    // Initialize Socket.IO client
    const newSocket = io(process.env.REACT_APP_WEBSOCKET_URL!, {
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