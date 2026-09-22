import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { StateWrapper, ScreenState } from '../../components/StateWrapper';
import { taskService, Task, TaskStatus, TaskPriority } from '../../services/taskService';

export interface KanbanScreenProps {
  route?: {
    params?: {
      projectId: string;
      projectTitle?: string;
    };
  };
  navigation?: any;
}

const COLUMNS: { id: TaskStatus; label: string; badgeVariant: 'primary' | 'secondary' | 'tertiary' | 'error' }[] = [
  { id: 'TODO', label: 'To Do', badgeVariant: 'secondary' },
  { id: 'IN_PROGRESS', label: 'In Progress', badgeVariant: 'primary' },
  { id: 'TESTING', label: 'Testing', badgeVariant: 'tertiary' },
  { id: 'DONE', label: 'Done', badgeVariant: 'secondary' },
];

export const KanbanScreen: React.FC<KanbanScreenProps> = ({ route }) => {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const projectId = route?.params?.projectId || '';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [refreshing, setRefreshing] = useState(false);

  // Selected column on mobile view or active tab
  const [activeColumn, setActiveColumn] = useState<TaskStatus>('TODO');

  // Task Modal (View / Edit / Create)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<TaskStatus>('TODO');
  const [formPriority, setFormPriority] = useState<TaskPriority>('MEDIUM');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchTasks = useCallback(() => {
    if (!projectId) return;

    taskService
      .getTasks(projectId)
      .then((data) => {
        setTasks(data || []);
        setScreenState(data && data.length > 0 ? 'populated' : 'empty');
        setErrorMessage(undefined);
      })
      .catch((err: any) => {
        setErrorMessage(err?.message || 'Failed to load project tasks');
        setScreenState('error');
      });
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await taskService.getTasks(projectId);
      setTasks(data || []);
      setScreenState(data && data.length > 0 ? 'populated' : 'empty');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to refresh tasks');
    } finally {
      setRefreshing(false);
    }
  };

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {
        // ignore
      }
    }
  };

  /**
   * Status change with optimistic UI update and rollback on failure
   */
  const handleMoveTask = async (taskId: string, targetStatus: TaskStatus) => {
    triggerHaptic();

    // Snapshot current tasks for rollback
    const previousTasks = [...tasks];
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;

    const currentTask = tasks[taskIndex];
    if (currentTask.status === targetStatus) return;

    // Optimistically update
    const updatedTask = { ...currentTask, status: targetStatus };
    const optimisticTasks = [...tasks];
    optimisticTasks[taskIndex] = updatedTask;
    setTasks(optimisticTasks);

    try {
      await taskService.updateTask(projectId, taskId, { status: targetStatus });
    } catch (err: any) {
      // Rollback on failure
      setTasks(previousTasks);
      Alert.alert('Status Update Failed', err?.message || 'Task status could not be updated. Rolling back.');
    }
  };

  const openCreateModal = () => {
    setIsCreating(true);
    setIsEditing(false);
    setSelectedTask(null);
    setFormTitle('');
    setFormDescription('');
    setFormStatus(activeColumn);
    setFormPriority('MEDIUM');
    setIsModalVisible(true);
  };

  const openDetailModal = (task: Task) => {
    setSelectedTask(task);
    setIsCreating(false);
    setIsEditing(false);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormStatus(task.status);
    setFormPriority(task.priority);
    setIsModalVisible(true);
  };

  const handleSaveTask = async () => {
    if (!formTitle.trim()) {
      Alert.alert('Validation Error', 'Task title is required');
      return;
    }

    setFormSubmitting(true);
    try {
      if (isCreating) {
        const created = await taskService.createTask(projectId, {
          title: formTitle.trim(),
          description: formDescription.trim(),
          status: formStatus,
          priority: formPriority,
        });
        setTasks([created, ...tasks]);
        setScreenState('populated');
        setIsModalVisible(false);
      } else if (selectedTask) {
        const updated = await taskService.updateTask(projectId, selectedTask.id, {
          title: formTitle.trim(),
          description: formDescription.trim(),
          status: formStatus,
          priority: formPriority,
        });
        setTasks(tasks.map((t) => (t.id === updated.id ? updated : t)));
        setIsModalVisible(false);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save task');
    } finally {
      setFormSubmitting(false);
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'HIGH':
        return 'error';
      case 'LOW':
        return 'secondary';
      case 'MEDIUM':
      default:
        return 'primary';
    }
  };

  const renderTaskCard = (task: Task) => {
    const isTodo = task.status === 'TODO';
    const isInProgress = task.status === 'IN_PROGRESS';
    const isTesting = task.status === 'TESTING';
    const isDone = task.status === 'DONE';

    return (
      <Card
        key={task.id}
        style={[styles.taskCard, { marginBottom: spacing.sm }]}
        onPress={() => openDetailModal(task)}
      >
        <View style={styles.taskCardHeader}>
          <Text style={[typography.titleMedium, { color: colors.onSurface, flex: 1, marginRight: spacing.xs }]} numberOfLines={2}>
            {task.title}
          </Text>
          <Badge label={task.priority} variant={getPriorityColor(task.priority)} />
        </View>

        {task.description ? (
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: spacing.xs }]} numberOfLines={2}>
            {task.description}
          </Text>
        ) : null}

        {task.assignee && (
          <Text style={[typography.labelMedium, { color: colors.primary, marginTop: spacing.xs }]}>
            Assigned: {task.assignee.profile?.fullName || task.assignee.email}
          </Text>
        )}

        {/* Quick Transition Buttons */}
        <View style={[styles.taskCardActions, { marginTop: spacing.sm }]}>
          {isTodo && (
            <Button
              title="Start →"
              variant="primary"
              onPress={() => handleMoveTask(task.id, 'IN_PROGRESS')}
              style={{ minHeight: 32, paddingVertical: 4 }}
            />
          )}
          {isInProgress && (
            <>
              <Button
                title="← To Do"
                variant="outline"
                onPress={() => handleMoveTask(task.id, 'TODO')}
                style={{ minHeight: 32, paddingVertical: 4, marginRight: spacing.xs }}
              />
              <Button
                title="Test →"
                variant="secondary"
                onPress={() => handleMoveTask(task.id, 'TESTING')}
                style={{ minHeight: 32, paddingVertical: 4 }}
              />
            </>
          )}
          {isTesting && (
            <>
              <Button
                title="← Bounce"
                variant="outline"
                onPress={() => handleMoveTask(task.id, 'IN_PROGRESS')}
                style={{ minHeight: 32, paddingVertical: 4, marginRight: spacing.xs }}
              />
              <Button
                title="Complete ✓"
                variant="primary"
                onPress={() => handleMoveTask(task.id, 'DONE')}
                style={{ minHeight: 32, paddingVertical: 4 }}
              />
            </>
          )}
          {isDone && (
            <Button
              title="Reopen ↺"
              variant="outline"
              onPress={() => handleMoveTask(task.id, 'IN_PROGRESS')}
              style={{ minHeight: 32, paddingVertical: 4 }}
            />
          )}
        </View>
      </Card>
    );
  };

  const tasksInActiveColumn = tasks.filter((t) => t.status === activeColumn);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header bar */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, padding: spacing.md }]}>
        <View style={styles.topBarRow}>
          <Text style={[typography.headlineMedium, { color: colors.onSurface }]}>Kanban Board</Text>
          <Button title="+ Add Task" variant="primary" onPress={openCreateModal} />
        </View>

        {/* Column Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm }}>
          {COLUMNS.map((col) => {
            const count = tasks.filter((t) => t.status === col.id).length;
            const isSelected = activeColumn === col.id;
            return (
              <Chip
                key={col.id}
                label={`${col.label} (${count})`}
                selected={isSelected}
                onPress={() => setActiveColumn(col.id)}
                style={{ marginRight: spacing.sm }}
              />
            );
          })}
        </ScrollView>
      </View>

      {/* Main Board Body */}
      <StateWrapper
        state={screenState}
        errorMessage={errorMessage}
        onRetry={fetchTasks}
        emptyTitle="No Tasks on Board"
        emptySubtitle="Get started by creating your first task."
        emptyActionLabel="Add First Task"
        onEmptyAction={openCreateModal}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.md }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          <View style={[styles.columnHeader, { marginBottom: spacing.sm }]}>
            <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
              {COLUMNS.find((c) => c.id === activeColumn)?.label} ({tasksInActiveColumn.length})
            </Text>
          </View>

          {tasksInActiveColumn.length === 0 ? (
            <Card style={{ padding: spacing.lg, alignItems: 'center' }}>
              <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>
                No tasks in this column.
              </Text>
            </Card>
          ) : (
            tasksInActiveColumn.map(renderTaskCard)
          )}
        </ScrollView>
      </StateWrapper>

      {/* Task Detail / Edit / Create Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                borderRadius: borderRadius.bento,
                borderColor: colors.outlineVariant,
                padding: spacing.lg,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
                {isCreating ? 'Create Task' : isEditing ? 'Edit Task' : 'Task Details'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 18, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400, marginVertical: spacing.md }}>
              <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginBottom: spacing.xs }]}>
                Title *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceVariant,
                    color: colors.onSurface,
                    borderColor: colors.outlineVariant,
                    borderRadius: borderRadius.md,
                    padding: spacing.sm,
                    marginBottom: spacing.sm,
                  },
                ]}
                placeholder="Task title"
                placeholderTextColor={colors.onSurfaceVariant}
                value={formTitle}
                onChangeText={setFormTitle}
                editable={isCreating || isEditing}
              />

              <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginBottom: spacing.xs }]}>
                Description
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    minHeight: 70,
                    textAlignVertical: 'top',
                    backgroundColor: colors.surfaceVariant,
                    color: colors.onSurface,
                    borderColor: colors.outlineVariant,
                    borderRadius: borderRadius.md,
                    padding: spacing.sm,
                    marginBottom: spacing.sm,
                  },
                ]}
                placeholder="Description / acceptance criteria..."
                placeholderTextColor={colors.onSurfaceVariant}
                value={formDescription}
                onChangeText={setFormDescription}
                multiline
                numberOfLines={3}
                editable={isCreating || isEditing}
              />

              <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginBottom: spacing.xs }]}>
                Status
              </Text>
              <View style={[styles.chipsRow, { marginBottom: spacing.sm }]}>
                {COLUMNS.map((col) => (
                  <Chip
                    key={col.id}
                    label={col.label}
                    selected={formStatus === col.id}
                    onPress={() => (isCreating || isEditing) && setFormStatus(col.id)}
                    style={{ marginRight: spacing.xs, marginBottom: spacing.xs }}
                  />
                ))}
              </View>

              <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginBottom: spacing.xs }]}>
                Priority
              </Text>
              <View style={[styles.chipsRow, { marginBottom: spacing.md }]}>
                {(['LOW', 'MEDIUM', 'HIGH'] as TaskPriority[]).map((p) => (
                  <Chip
                    key={p}
                    label={p}
                    selected={formPriority === p}
                    onPress={() => (isCreating || isEditing) && setFormPriority(p)}
                    style={{ marginRight: spacing.xs }}
                  />
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              {!isCreating && !isEditing ? (
                <Button
                  title="Edit Task"
                  variant="primary"
                  onPress={() => setIsEditing(true)}
                />
              ) : (
                <Button
                  title={formSubmitting ? 'Saving...' : 'Save Task'}
                  variant="primary"
                  loading={formSubmitting}
                  disabled={formSubmitting}
                  onPress={handleSaveTask}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  topBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskCard: {},
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    fontSize: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  modalActions: {
    marginTop: 8,
  },
});
