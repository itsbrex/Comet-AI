"use client";

import React, { useState, useEffect } from 'react';
import { Zap, Play, Pause, Trash2, Clock, FileText, Globe, MessageSquare, Briefcase, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Task {
  id: string;
  name: string;
  description: string;
  type: string;
  schedule: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  status?: 'idle' | 'running' | 'completed' | 'failed';
  result?: string;
}

const AutomationSettings = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      if (window.electronAPI?.getScheduledTasks) {
        const result = await window.electronAPI.getScheduledTasks();
        setTasks(Array.isArray(result) ? result : []);
      } else {
        console.log('[Automation] getScheduledTasks not available');
        setTasks([]);
      }
    } catch (error) {
      console.error('[Automation] Failed to load tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId: string) => {
    try {
      if (window.electronAPI?.toggleScheduledTask) {
        await window.electronAPI.toggleScheduledTask(taskId);
        await loadTasks();
      }
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const runTask = async (taskId: string) => {
    try {
      if (window.electronAPI?.runScheduledTask) {
        await window.electronAPI.runScheduledTask(taskId);
        await loadTasks();
      }
    } catch (error) {
      console.error('Failed to run task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      if (window.electronAPI?.deleteScheduledTask) {
        await window.electronAPI.deleteScheduledTask(taskId);
        await loadTasks();
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'pdf-generate':
        return <FileText size={16} />;
      case 'web-scrape':
        return <Globe size={16} />;
      case 'ai-prompt':
        return <MessageSquare size={16} />;
      case 'workflow':
        return <Briefcase size={16} />;
      default:
        return <Zap size={16} />;
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={14} className="text-green-400" />;
      case 'failed':
        return <XCircle size={14} className="text-red-400" />;
      case 'running':
        return <AlertCircle size={14} className="text-amber-400 animate-pulse" />;
      default:
        return <Clock size={14} className="text-white/30" />;
    }
  };

  const formatSchedule = (cron: string) => {
    const parts = cron.split(' ');
    if (parts.length !== 5) return cron;

    const [min, hour, dom, mon, dow] = parts;

    if (dom === '*' && mon === '*' && dow === '*') {
      if (min === '0' && hour === '*') return 'Every hour';
      return `At ${hour}:${min.padStart(2, '0')} daily`;
    }
    if (dow === '1-5' && dom === '*') {
      return `Weekdays at ${hour}:${min.padStart(2, '0')}`;
    }
    if (dom !== '*' && mon !== '*') {
      return `${mon}/${dom} at ${hour}:${min.padStart(2, '0')}`;
    }

    return cron;
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return task.enabled;
    if (filter === 'paused') return !task.enabled;
    return true;
  });

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Automation Tasks</h3>
            <p className="text-xs text-white/30 mt-1">Manage scheduled automation tasks</p>
          </div>
          <button 
            onClick={() => {
              // Emit event to open scheduling modal
              window.dispatchEvent(new CustomEvent('open-scheduling-modal'));
            }}
            className="px-3 py-1.5 bg-deep-space-accent-neon text-deep-space-bg text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            + Create Task
          </button>
        </div>

        <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'all' ? 'bg-deep-space-accent-neon text-deep-space-bg' : 'text-white/40 hover:text-white'}`}
          >
            All ({tasks.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'active' ? 'bg-deep-space-accent-neon text-deep-space-bg' : 'text-white/40 hover:text-white'}`}
          >
            Active ({tasks.filter(t => t.enabled).length})
          </button>
          <button
            onClick={() => setFilter('paused')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'paused' ? 'bg-deep-space-accent-neon text-deep-space-bg' : 'text-white/40 hover:text-white'}`}
          >
            Paused ({tasks.filter(t => !t.enabled).length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-deep-space-accent-neon border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-white/40">
          <Zap size={48} className="mb-4 opacity-30" />
          <p>No automation tasks yet</p>
          <p className="text-xs text-white/20 mt-2">Ask the AI to schedule something like "generate a daily report at 8am"</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`p-5 rounded-2xl border transition-all ${task.enabled ? 'bg-white/[0.03] border-white/10' : 'bg-black/20 border-white/5 opacity-60'}`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${task.enabled ? 'bg-deep-space-accent-neon/10 text-deep-space-accent-neon' : 'bg-white/5 text-white/30'}`}>
                  {getTaskIcon(task.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-bold text-white truncate">{task.name}</h4>
                    {getStatusIcon(task.status)}
                  </div>
                  <p className="text-xs text-white/40 truncate mb-2">{task.description}</p>
                  <div className="flex items-center gap-4 text-xs text-white/30">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatSchedule(task.schedule)}
                    </span>
                    {task.lastRun && (
                      <span>Last: {new Date(task.lastRun).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => runTask(task.id)}
                    className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-deep-space-accent-neon hover:bg-white/10 transition-all"
                    title="Run Now"
                  >
                    <Play size={16} />
                  </button>
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`p-2 rounded-lg transition-all ${task.enabled ? 'bg-white/5 text-white/60 hover:text-amber-400 hover:bg-amber-400/10' : 'bg-deep-space-accent-neon/10 text-deep-space-accent-neon hover:bg-deep-space-accent-neon/20'}`}
                    title={task.enabled ? 'Pause' : 'Enable'}
                  >
                    {task.enabled ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-red-400 hover:bg-red-400/10 transition-all"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AutomationSettings;