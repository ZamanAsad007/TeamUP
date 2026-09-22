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
import { AppHeader } from '../../components/AppHeader';
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

export const KanbanScreen: React.FC<KanbanScreenProps> = ({ route, navigation }) => {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const projectId = route?.params?.projectId || '';
  const projectTitle = route?.params?.projectTitle || 'Tasks';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [refreshing, setRefreshing] = useState(false);

  // Selected column on mobile view
  const [activeColumn, setActiveColumn] = useState<TaskStatus>('TODO');

  // Task Modal (View / Edit / Create)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
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

    const previousTasks = [...tasks];
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;

    const currentTask = tasks[taskIndex];
    if (currentTask.status === targetStatus) return;

    const updatedTask = { ...currentTask, status: targetStatus };
    const optimisticTasks = [...tasks];
    optimisticTasks[taskIndex] = updatedTask;
    setTasks(optimisticTasks);

    try {
      await taskService.updateTask(projectId, taskId, { status: targetStatus });
    } catch (err: any) {
      setTasks(previousTasks);
      Alert.alert('Status Update Failed', err?.message || 'Task status could not be updated. Rolling back.');
    }
  };

  const openCreateModal = () => {
    setIsCreating(true);
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

  const getPriorityVariant = (priority: TaskPriority) => {
    switch (priority) {
      case 'HIGH':
        return 'error';
      case 'LOW':
        return 'secondary';
      case 'MEDIUM':
      default:
        return 'warning';
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
          <Text style={[typography.h3, { color: colors.text, flex: 1, marginRight: spacing.xs }]} numberOfLines={2}>
            {task.title}
          </Text>
          <Badge label={task.priority} variant={getPriorityVariant(task.priority)} />
        </View>

        {task.description ? (
          <Text style={[typography.bodySmall, { color: colors.textMuted, marginTop: 4 }]} numberOfLines={2}>
            {task.description}
          </Text>
        ) : null}

        {task.assignee && (
          <View style={[styles.assigneeRow, { marginTop: spacing.sm }]}>
            <View style={[styles.assigneeAvatar, { backgroundColor: colors.primarySoft }]}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                {(task.assignee.profile?.fullName || task.assignee.email || 'A').charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={[typography.bodySmall, { color: colors.textMuted, marginLeft: 6 }]}>
              {task.assignee.profile?.fullName || task.assignee.email}
            </Text>
          </View>
        )}

        {/* Quick Transition Buttons */}
        <View style={[styles.taskCardActions, { marginTop: spacing.sm }]}>
          {isTodo && (
            <Button
              title="Start →"
              variant="primary"
              onPress={() => handleMoveTask(task.id, 'IN_PROGRESS')}
              size="sm"
            />
          )}
          {isInProgress && (
            <>
              <Button
                title="← To Do"
                variant="outline"
                onPress={() => handleMoveTask(task.id, 'TODO')}
                size="sm"
                style={{ marginRight: spacing.xs }}
              />
              <Button
                title="Test →"
                variant="secondary"
                onPress={() => handleMoveTask(task.id, 'TESTING')}
                size="sm"
              />
            </>
          )}
          {isTesting && (
            <>
              <Button
                title="← Bounce"
                variant="outline"
                onPress={() => handleMoveTask(task.id, 'IN_PROGRESS')}
                size="sm"
                style={{ marginRight: spacing.xs }}
              />
              <Button
                title="Complete ✓"
                variant="primary"
                onPress={() => handleMoveTask(task.id, 'DONE')}
                size="sm"
              />
            </>
          )}
          {isDone && (
            <Button
              title="Reopen ↺"
              variant="outline"
              onPress={() => handleMoveTask(task.id, 'IN_PROGRESS')}
              size="sm"
            />
          )}
        </View>
      </Card>
    );
  };

  const tasksInActiveColumn = tasks.filter((t) => t.status === activeColumn);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Tasks"
        subtitle={projectTitle}
        showBack={true}
        onBack={() => navigation?.goBack?.()}
        actions={[
          {
            icon: <Text style={{ fontSize: 20 }}>+</Text>,
            onPress: openCreateModal,
            accessibilityLabel: 'Add Task',
          },
        ]}
      />

      {/* Column Horizontal Swipeable Tabs */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingHorizontal: spacing.screenPadding, paddingTop: 10 }]}>
        <View style={styles.topBarRow}>
          <Text style={[typography.h3, { color: colors.text }]}>Kanban Board</Text>
          <Button title="+ Add Task" variant="primary" onPress={openCreateModal} size="sm" />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 10 }}
        >
          {COLUMNS.map((col) => {
            const count = tasks.filter((t) => t.status === col.id).length;
            const isSelected = activeColumn === col.id;
            return (
              <Chip
                key={col.id}
                label={`${col.label} (${count})`}
                selected={isSelected}
                onPress={() => setActiveColumn(col.id)}
                style={{ marginRight: spacing.xs }}
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
          contentContainerStyle={{ padding: spacing.screenPadding, paddingBottom: 80 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          <View style={[styles.columnHeader, { marginBottom: spacing.sm }]}>
            <Text style={[typography.h3, { color: colors.text }]}>
              {COLUMNS.find((c) => c.id === activeColumn)?.label} ({tasksInActiveColumn.length})
            </Text>
          </View>

          {tasksInActiveColumn.length === 0 ? (
            <Card style={{ padding: spacing.lg, alignItems: 'center' }}>
              <Text style={[typography.body, { color: colors.textMuted }]}>
                No tasks in this column.
              </Text>
              <Button
                title="+ Add Task"
                variant="outline"
                onPress={openCreateModal}
                style={{ marginTop: spacing.md }}
                size="sm"
              />
            </Card>
          ) : (
            tasksInActiveColumn.map(renderTaskCard)
          )}
        </ScrollView>
      </StateWrapper>

      {/* Floating Add Task Button */}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Create Task"
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          },
        ]}
        onPress={openCreateModal}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Task Modal (Bottom Sheet Style) */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                borderTopLeftRadius: borderRadius.bottomSheet,
                borderTopRightRadius: borderRadius.bottomSheet,
                padding: spacing.lg,
              },
            ]}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.modalHeaderRow}>
              <Text style={[typography.h2, { color: colors.text }]}>
                {isCreating ? 'Create Task' : 'Task Details'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Text style={{ fontSize: 20, color: colors.textMuted }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[typography.label, { color: colors.textMuted, marginTop: spacing.md, marginBottom: 4 }]}>
                Task Title *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceMuted,
                    color: colors.text,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                    padding: spacing.sm + 2,
                  },
                ]}
                placeholder="Task title"
                placeholderTextColor={colors.textMuted}
                value={formTitle}
                onChangeText={setFormTitle}
              />

              <Text style={[typography.label, { color: colors.textMuted, marginTop: spacing.md, marginBottom: 4 }]}>
                Description
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.surfaceMuted,
                    color: colors.text,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                    padding: spacing.sm + 2,
                  },
                ]}
                placeholder="Describe acceptance criteria or technical notes..."
                placeholderTextColor={colors.textMuted}
                value={formDescription}
                onChangeText={setFormDescription}
                multiline
                numberOfLines={3}
              />

              <Text style={[typography.label, { color: colors.textMuted, marginTop: spacing.md, marginBottom: 6 }]}>
                Column Stage
              </Text>
              <View style={styles.chipRow}>
                {COLUMNS.map((col) => (
                  <Chip
                    key={col.id}
                    label={col.label}
                    selected={formStatus === col.id}
                    onPress={() => setFormStatus(col.id)}
                    style={{ marginRight: 6 }}
                  />
                ))}
              </View>

              <Text style={[typography.label, { color: colors.textMuted, marginTop: spacing.md, marginBottom: 6 }]}>
                Priority
              </Text>
              <View style={styles.chipRow}>
                {(['LOW', 'MEDIUM', 'HIGH'] as TaskPriority[]).map((p) => (
                  <Chip
                    key={p}
                    label={p}
                    selected={formPriority === p}
                    onPress={() => setFormPriority(p)}
                    style={{ marginRight: 6 }}
                  />
                ))}
              </View>

              <View style={[styles.modalActionsRow, { marginTop: spacing.xl }]}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setIsModalVisible(false)}
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
                <Button
                  title="Save Task"
                  variant="primary"
                  loading={formSubmitting}
                  disabled={formSubmitting}
                  onPress={handleSaveTask}
                  style={{ flex: 1.2 }}
                />
              </View>
            </ScrollView>
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
  },
  topBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskCard: {
    padding: 14,
  },
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assigneeAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '400',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  modalActionsRow: {
    flexDirection: 'row',
    paddingBottom: 24,
  },
});
