import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';
import { StateWrapper } from './StateWrapper';
import {
  calendarService,
  CalendarEvent,
  CreateCalendarEventDto,
} from '../services/calendarService';

export interface CalendarViewProps {
  projectId?: string;
  onSelectEvent?: (event: CalendarEvent) => void;
  onSelectDate?: (date: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  projectId = 'project-1',
  onSelectEvent: _onSelectEvent,
  onSelectDate: _onSelectDate,
}) => {
  const { colors, typography, spacing, isDark } = useTheme();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // New Event Modal State
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [eventType, setEventType] = useState<'DEADLINE' | 'MEETING' | 'MILESTONE'>('DEADLINE');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await calendarService.getCalendarEvents(projectId);
      setEvents(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load calendar events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    calendarService
      .getCalendarEvents(projectId)
      .then((data) => {
        if (isMounted) {
          setEvents(data || []);
          setIsLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError(err?.message || 'Failed to load calendar events');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // Construct marked dates object for react-native-calendars
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    events.forEach((evt) => {
      if (!evt.startDate) return;
      const dateKey = evt.startDate.split('T')[0];
      if (!marks[dateKey]) {
        marks[dateKey] = {
          marked: true,
          dots: [],
        };
      }

      const dotColor =
        evt.eventType === 'DEADLINE'
          ? colors.error
          : evt.eventType === 'MEETING'
          ? colors.primary
          : colors.secondary;

      marks[dateKey].dots.push({
        key: evt.id,
        color: dotColor,
        selectedDotColor: colors.onPrimary,
      });
    });

    // Selected date highlight
    marks[selectedDate] = {
      ...(marks[selectedDate] || {}),
      selected: true,
      selectedColor: colors.primary,
    };

    return marks;
  }, [events, selectedDate, colors]);

  const handleDayPress = (day: DateData) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // safe fallback
      }
    }
    setSelectedDate(day.dateString);
  };

  const handleCreateEvent = async () => {
    if (!newTitle.trim()) {
      setFormError('Please enter an event title.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // safe fallback
      }
    }

    const startDateIso = `${selectedDate}T12:00:00Z`;
    const dto: CreateCalendarEventDto = {
      projectId,
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      eventType,
      startDate: startDateIso,
    };

    try {
      const created = await calendarService.createCalendarEvent(dto);
      setEvents((prev) => [...prev, created]);
      setIsModalVisible(false);
      setNewTitle('');
      setNewDescription('');
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter events for currently selected date
  const dayEvents = useMemo(() => {
    return events.filter((evt) => {
      if (!evt.startDate) return false;
      return evt.startDate.split('T')[0] === selectedDate;
    });
  }, [events, selectedDate]);

  const getEventBadgeVariant = (type: string) => {
    if (type === 'DEADLINE') return 'error';
    if (type === 'MEETING') return 'primary';
    return 'secondary';
  };

  const getEventIcon = (type: string) => {
    if (type === 'DEADLINE') return '🚨';
    if (type === 'MEETING') return '📅';
    return '🚩';
  };

  if (isLoading) {
    return <StateWrapper state="loading" />;
  }

  if (error) {
    return <StateWrapper state="error" errorMessage={error} onRetry={loadEvents} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Calendar Card */}
      <Card style={styles.calendarCard}>
        <Calendar
          key={isDark ? 'dark-cal' : 'light-cal'}
          current={selectedDate}
          onDayPress={handleDayPress}
          markingType="multi-dot"
          markedDates={markedDates}
          theme={{
            calendarBackground: colors.surface,
            textSectionTitleColor: colors.onSurfaceVariant,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: colors.onPrimary,
            todayTextColor: colors.primary,
            dayTextColor: colors.onSurface,
            textDisabledColor: colors.outlineVariant,
            monthTextColor: colors.onSurface,
            indicatorColor: colors.primary,
            arrowColor: colors.primary,
          }}
        />
      </Card>

      {/* Agenda Header for Selected Date */}
      <View style={styles.agendaHeader}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.agendaTitle,
              { color: colors.onSurface, fontSize: typography.titleMedium.fontSize },
            ]}
          >
            Agenda for {selectedDate}
          </Text>
          <Text style={{ color: colors.onSurfaceVariant, fontSize: 13 }}>
            {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'} scheduled
          </Text>
        </View>

        <Button
          title="+ Add Deadline"
          onPress={() => setIsModalVisible(true)}
          style={{ paddingHorizontal: spacing.sm }}
        />
      </View>

      {/* Day Events Agenda List */}
      {dayEvents.length === 0 ? (
        <StateWrapper
          state="empty"
          emptyTitle="No Events on this Date"
          emptySubtitle={`Nothing scheduled for ${selectedDate}. Tap + Add Deadline to schedule a new task deadline or meeting.`}
          emptyActionLabel="+ Add Deadline"
          onEmptyAction={() => setIsModalVisible(true)}
        />
      ) : (
        <FlatList
          data={dayEvents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          renderItem={({ item }) => (
            <Card style={styles.eventCard}>
              <View style={styles.eventCardHeader}>
                <Text style={{ fontSize: 20, marginRight: 8 }}>{getEventIcon(item.eventType)}</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.eventTitle,
                      { color: colors.onSurface, fontSize: typography.titleMedium.fontSize },
                    ]}
                  >
                    {item.title}
                  </Text>
                  {item.description ? (
                    <Text
                      style={[
                        styles.eventDesc,
                        { color: colors.onSurfaceVariant, marginTop: 2 },
                      ]}
                    >
                      {item.description}
                    </Text>
                  ) : null}
                </View>
                <Badge label={item.eventType} variant={getEventBadgeVariant(item.eventType)} />
              </View>
            </Card>
          )}
        />
      )}

      {/* Add Event Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: colors.onSurface, fontSize: typography.titleMedium.fontSize },
                ]}
              >
                Add Calendar Event ({selectedDate})
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingVertical: spacing.sm }}>
              {formError ? (
                <View style={[styles.errorBanner, { backgroundColor: colors.errorContainer }]}>
                  <Text style={{ color: colors.error }}>{formError}</Text>
                </View>
              ) : null}

              <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Event Type</Text>
              <View style={styles.typeSelectorRow}>
                {(['DEADLINE', 'MEETING', 'MILESTONE'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setEventType(type)}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor:
                          eventType === type ? colors.primary : colors.surfaceVariant,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: eventType === type ? colors.onPrimary : colors.onSurface,
                        fontWeight: '600',
                        fontSize: 12,
                      }}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.onSurface, marginTop: spacing.sm }]}>
                Title
              </Text>
              <TextInput
                testID="input-event-title"
                style={[
                  styles.input,
                  {
                    color: colors.onSurface,
                    borderColor: colors.outlineVariant,
                    backgroundColor: colors.background,
                  },
                ]}
                placeholder="e.g. Phase 9 Delivery Deadline"
                placeholderTextColor={colors.onSurfaceVariant}
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>Description (Optional)</Text>
              <TextInput
                testID="input-event-desc"
                style={[
                  styles.input,
                  {
                    color: colors.onSurface,
                    borderColor: colors.outlineVariant,
                    backgroundColor: colors.background,
                  },
                ]}
                placeholder="Details, submission requirements..."
                placeholderTextColor={colors.onSurfaceVariant}
                value={newDescription}
                onChangeText={setNewDescription}
              />

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setIsModalVisible(false)}
                  style={{ flex: 1 }}
                />
                <View style={{ width: spacing.sm }} />
                <Button
                  testID="submit-event-btn"
                  title={isSubmitting ? 'Adding...' : 'Save Event'}
                  onPress={handleCreateEvent}
                  disabled={isSubmitting}
                  style={{ flex: 1 }}
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
  calendarCard: {
    padding: 8,
    marginBottom: 16,
  },
  agendaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  agendaTitle: {
    fontWeight: '700',
  },
  eventCard: {
    marginBottom: 12,
    padding: 14,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTitle: {
    fontWeight: '700',
  },
  eventDesc: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontWeight: '700',
  },
  errorBanner: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 16,
  },
});
