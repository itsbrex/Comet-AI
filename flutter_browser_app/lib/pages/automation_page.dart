import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../sync_service.dart';

class AutomationPage extends StatefulWidget {
  const AutomationPage({Key? key}) : super(key: key);

  @override
  State<AutomationPage> createState() => _AutomationPageState();
}

class _AutomationPageState extends State<AutomationPage> {
  List<Map<String, dynamic>> _tasks = [];
  bool _isLoading = true;
  bool _isConnected = false;
  StreamSubscription? _taskSubscription;
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    _isConnected = SyncService().isConnectedToDesktop;
    _loadTasks();
    _listenToTaskUpdates();
  }

  void _listenToTaskUpdates() {
    _taskSubscription = SyncService().onDesktopToMobile.listen((msg) {
      if (msg['type'] == 'task-sync-response') {
        setState(() {
          _tasks = List<Map<String, dynamic>>.from(msg['tasks'] ?? []);
          _isLoading = false;
        });
      } else if (msg['type'] == 'task-created') {
        setState(() {
          _tasks.add(msg['task']);
        });
      } else if (msg['type'] == 'task-updated') {
        setState(() {
          final index = _tasks.indexWhere((t) => t['id'] == msg['task']['id']);
          if (index != -1) {
            _tasks[index] = msg['task'];
          }
        });
      } else if (msg['type'] == 'task-deleted') {
        setState(() {
          _tasks.removeWhere((t) => t['id'] == msg['taskId']);
        });
      } else if (msg['type'] == 'task-started') {
        _showSnackBar('Task started: ${msg['taskName']}');
      } else if (msg['type'] == 'task-completed') {
        _showSnackBar('Task completed: ${msg['taskName']}');
        _loadTasks();
      }
    });
  }

  Future<void> _loadTasks() async {
    if (!_isConnected) {
      setState(() {
        _isLoading = false;
      });
      return;
    }

    try {
      await SyncService().executeDesktopControl('sync-tasks');
    } catch (e) {
      print('[Automation] Failed to load tasks: $e');
    }
  }

  Future<void> _refreshTasks() async {
    setState(() {
      _isLoading = true;
    });
    await _loadTasks();
  }

  Future<void> _toggleTask(String taskId) async {
    try {
      await SyncService()
          .executeDesktopControl('toggle-task', args: {'taskId': taskId});
    } catch (e) {
      _showSnackBar('Failed to toggle task');
    }
  }

  Future<void> _runTaskNow(String taskId, String taskName) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E1E1E),
        title:
            const Text('Run Task Now?', style: TextStyle(color: Colors.white)),
        content: Text(
          'Do you want to run "$taskName" immediately?',
          style: const TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child:
                const Text('Cancel', style: TextStyle(color: Colors.white54)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00E5FF)),
            child: const Text('Run Now', style: TextStyle(color: Colors.black)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await SyncService()
            .executeDesktopControl('run-task', args: {'taskId': taskId});
        _showSnackBar('Task started');
      } catch (e) {
        _showSnackBar('Failed to run task');
      }
    }
  }

  Future<void> _deleteTask(String taskId, String taskName) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E1E1E),
        title:
            const Text('Delete Task?', style: TextStyle(color: Colors.white)),
        content: Text(
          'Are you sure you want to delete "$taskName"? This cannot be undone.',
          style: const TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child:
                const Text('Cancel', style: TextStyle(color: Colors.white54)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await SyncService()
            .executeDesktopControl('delete-task', args: {'taskId': taskId});
        _showSnackBar('Task deleted');
        _loadTasks();
      } catch (e) {
        _showSnackBar('Failed to delete task');
      }
    }
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  List<Map<String, dynamic>> get _filteredTasks {
    switch (_filter) {
      case 'active':
        return _tasks.where((t) => t['enabled'] == true).toList();
      case 'paused':
        return _tasks.where((t) => t['enabled'] == false).toList();
      default:
        return _tasks;
    }
  }

  String _formatNextRun(dynamic nextRun) {
    if (nextRun == null) return 'Not scheduled';
    try {
      final date = DateTime.parse(nextRun.toString());
      final now = DateTime.now();
      final diff = date.difference(now);

      if (diff.isNegative) return 'Due now';
      if (diff.inDays > 0) return 'In ${diff.inDays} days';
      if (diff.inHours > 0) return 'In ${diff.inHours} hours';
      if (diff.inMinutes > 0) return 'In ${diff.inMinutes} minutes';
      return 'Soon';
    } catch (e) {
      return 'Unknown';
    }
  }

  String _formatSchedule(dynamic trigger) {
    if (trigger == null) return 'Unknown';
    try {
      final t = trigger as Map<String, dynamic>;
      final type = t['type'] ?? '';

      if (type == 'cron') {
        return _parseCron(t['schedule'] ?? '');
      } else if (type == 'once') {
        final dt = t['datetime'];
        if (dt != null) {
          return 'Once: ${DateTime.parse(dt).toLocal()}';
        }
      } else if (type == 'interval') {
        final ms = t['intervalMs'] ?? 0;
        if (ms >= 3600000) {
          return 'Every ${(ms / 3600000).round()} hours';
        } else if (ms >= 60000) {
          return 'Every ${(ms / 60000).round()} minutes';
        }
      }
      return type;
    } catch (e) {
      return 'Unknown';
    }
  }

  String _parseCron(String cron) {
    final parts = cron.split(' ');
    if (parts.length != 5) return cron;

    final minute = parts[0];
    final hour = parts[1];
    final dayOfMonth = parts[2];
    final month = parts[3];
    final dayOfWeek = parts[4];

    if (dayOfMonth == '*' && month == '*' && dayOfWeek == '*') {
      return 'Daily at ${hour.padLeft(2, '0')}:${minute.padLeft(2, '0')}';
    }
    if (dayOfWeek == '1-5') {
      return 'Weekdays at ${hour.padLeft(2, '0')}:${minute.padLeft(2, '0')}';
    }

    final days = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    final dayIndex = int.tryParse(dayOfWeek);
    if (dayIndex != null && dayIndex >= 1 && dayIndex <= 7) {
      return 'Every ${days[dayIndex]} at ${hour.padLeft(2, '0')}:${minute.padLeft(2, '0')}';
    }

    return cron;
  }

  IconData _getTaskIcon(String taskType) {
    switch (taskType) {
      case 'pdf-generate':
        return Icons.picture_as_pdf;
      case 'web-scrape':
        return Icons.web;
      case 'ai-prompt':
        return Icons.smart_toy;
      case 'workflow':
        return Icons.account_tree;
      case 'daily-brief':
        return Icons.summarize;
      case 'shell':
        return Icons.terminal;
      default:
        return Icons.schedule;
    }
  }

  Color _getStatusColor(dynamic lastStatus) {
    switch (lastStatus) {
      case 'success':
        return Colors.green;
      case 'failed':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  void dispose() {
    _taskSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isConnected) {
      return Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          title:
              const Text('Automation', style: TextStyle(color: Colors.white)),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.cloud_off, size: 80, color: Colors.white24),
              const SizedBox(height: 20),
              const Text('Not Connected',
                  style: TextStyle(color: Colors.white70, fontSize: 18)),
              const SizedBox(height: 10),
              const Text(
                'Connect to desktop to manage automation',
                style: TextStyle(color: Colors.white38),
              ),
              const SizedBox(height: 30),
              ElevatedButton.icon(
                onPressed: () =>
                    Navigator.pushNamed(context, '/connect-desktop'),
                icon: const Icon(Icons.link),
                label: const Text('Connect Desktop'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF00E5FF),
                  foregroundColor: Colors.black,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Automation', style: TextStyle(color: Colors.white)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white70),
            onPressed: _refreshTasks,
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(50),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                _buildFilterChip('All', 'all'),
                const SizedBox(width: 8),
                _buildFilterChip('Active', 'active'),
                const SizedBox(width: 8),
                _buildFilterChip('Paused', 'paused'),
              ],
            ),
          ),
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF00E5FF)))
          : _filteredTasks.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.schedule,
                          size: 60, color: Colors.white12),
                      const SizedBox(height: 15),
                      Text(
                        _filter == 'all'
                            ? 'No scheduled tasks'
                            : 'No ${_filter} tasks',
                        style: const TextStyle(
                            color: Colors.white38, fontSize: 16),
                      ),
                      const SizedBox(height: 10),
                      const Text(
                        'Ask AI to schedule automated tasks',
                        style: TextStyle(color: Colors.white24),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _refreshTasks,
                  color: const Color(0xFF00E5FF),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _filteredTasks.length,
                    itemBuilder: (context, index) {
                      final task = _filteredTasks[index];
                      return _buildTaskCard(task);
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Create tasks from AI chat on desktop')),
          );
        },
        backgroundColor: const Color(0xFF00E5FF),
        icon: const Icon(Icons.add, color: Colors.black),
        label: const Text('New Task', style: TextStyle(color: Colors.black)),
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _filter == value;
    return GestureDetector(
      onTap: () => setState(() => _filter = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF00E5FF).withOpacity(0.2)
              : Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF00E5FF)
                : Colors.white.withOpacity(0.1),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? const Color(0xFF00E5FF) : Colors.white54,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  Widget _buildTaskCard(Map<String, dynamic> task) {
    final isEnabled = task['enabled'] == true;
    final lastStatus = task['lastStatus'];
    final nextRun = task['nextRun'];
    final taskType = task['taskType'] ?? 'unknown';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isEnabled
              ? const Color(0xFF00E5FF).withOpacity(0.3)
              : Colors.white.withOpacity(0.1),
        ),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: const Color(0xFF00E5FF).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    _getTaskIcon(taskType),
                    color: const Color(0xFF00E5FF),
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        task['name'] ?? 'Unnamed Task',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            Icons.schedule,
                            size: 12,
                            color: Colors.white.withOpacity(0.5),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _formatSchedule(task['trigger']),
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.5),
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: isEnabled
                            ? Colors.green.withOpacity(0.2)
                            : Colors.orange.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        isEnabled ? 'Active' : 'Paused',
                        style: TextStyle(
                          color: isEnabled ? Colors.green : Colors.orange,
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                    if (lastStatus != null) ...[
                      const SizedBox(height: 4),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _getStatusColor(lastStatus),
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            lastStatus == 'success' ? 'Success' : 'Failed',
                            style: TextStyle(
                              color: _getStatusColor(lastStatus),
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          if (nextRun != null && isEnabled)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.02),
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(16),
                  bottomRight: Radius.circular(16),
                ),
              ),
              child: Row(
                children: [
                  const Icon(Icons.access_time,
                      size: 14, color: Colors.white38),
                  const SizedBox(width: 6),
                  Text(
                    'Next run: ${_formatNextRun(nextRun)}',
                    style: const TextStyle(color: Colors.white38, fontSize: 12),
                  ),
                  const Spacer(),
                  if (task['runCount'] != null)
                    Text(
                      '${task['runCount']} runs',
                      style:
                          const TextStyle(color: Colors.white24, fontSize: 11),
                    ),
                ],
              ),
            ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.02),
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(16),
                bottomRight: Radius.circular(16),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton.icon(
                  onPressed: () =>
                      _runTaskNow(task['id'], task['name'] ?? 'Task'),
                  icon: const Icon(Icons.play_arrow, size: 18),
                  label: const Text('Run Now', style: TextStyle(fontSize: 12)),
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFF00E5FF),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                  ),
                ),
                TextButton.icon(
                  onPressed: () => _toggleTask(task['id']),
                  icon: Icon(
                    isEnabled ? Icons.pause : Icons.play_arrow,
                    size: 18,
                  ),
                  label: Text(
                    isEnabled ? 'Pause' : 'Resume',
                    style: const TextStyle(fontSize: 12),
                  ),
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.white54,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                  ),
                ),
                TextButton.icon(
                  onPressed: () =>
                      _deleteTask(task['id'], task['name'] ?? 'Task'),
                  icon: const Icon(Icons.delete_outline, size: 18),
                  label: const Text('Delete', style: TextStyle(fontSize: 12)),
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.red.withOpacity(0.7),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
