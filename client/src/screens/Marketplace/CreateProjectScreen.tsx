import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { projectService } from '../../services/projectService';

export interface CreateProjectScreenProps {
  navigation?: any;
}

export const CreateProjectScreen: React.FC<CreateProjectScreenProps> = ({ navigation }) => {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState('');
  const [semester, setSemester] = useState('');
  const [maxMembers, setMaxMembers] = useState('4');

  const [newSkill, setNewSkill] = useState('');
  const [skillLevel, setSkillLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('INTERMEDIATE');
  const [skills, setSkills] = useState<{ skillName: string; minimumExperience: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' }[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!title.trim()) {
      errs.title = 'Project title is required';
    } else if (title.trim().length < 3) {
      errs.title = 'Title must be at least 3 characters long';
    }

    if (!description.trim()) {
      errs.description = 'Project description is required';
    } else if (description.trim().length < 10) {
      errs.description = 'Description must be at least 10 characters long';
    }

    if (!domain.trim()) {
      errs.domain = 'Domain is required (e.g. AI / ML, Web Development)';
    }

    if (!semester.trim()) {
      errs.semester = 'Semester is required (e.g. Fall 2026)';
    }

    const membersNum = parseInt(maxMembers, 10);
    if (isNaN(membersNum) || membersNum < 2 || membersNum > 20) {
      errs.maxMembers = 'Max members must be between 2 and 20';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    const trimmed = newSkill.trim();
    if (skills.some((s) => s.skillName.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert('Skill already added', 'This skill is already in the requirements list.');
      return;
    }
    setSkills([...skills, { skillName: trimmed, minimumExperience: skillLevel }]);
    setNewSkill('');
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setServerError(null);
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await projectService.createProject({
        title: title.trim(),
        description: description.trim(),
        domain: domain.trim(),
        semester: semester.trim(),
        maxMembers: parseInt(maxMembers, 10),
        requiredSkills: skills,
      });

      Alert.alert('Success', 'Project created successfully!', [
        {
          text: 'Open Workspace',
          onPress: () => {
            navigation?.replace('Workspace', {
              projectId: created.id,
              projectTitle: created.title,
            });
          },
        },
      ]);
    } catch (err: any) {
      setServerError(err?.message || 'Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl * 2 }}
    >
      <Text style={[typography.headlineMedium, { color: colors.onBackground, marginBottom: spacing.md }]}>
        Create Project Listing
      </Text>

      {serverError && (
        <Card style={{ backgroundColor: colors.errorContainer, marginBottom: spacing.md }}>
          <Text style={[typography.bodyMedium, { color: colors.onErrorContainer }]}>{serverError}</Text>
        </Card>
      )}

      {/* Basic Info Card */}
      <Card style={{ marginBottom: spacing.md }}>
        <Text style={[typography.titleMedium, { color: colors.onSurface, marginBottom: spacing.sm }]}>
          Basic Information
        </Text>

        <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginBottom: spacing.xs }]}>
          Project Title *
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceVariant,
              color: colors.onSurface,
              borderColor: errors.title ? colors.error : colors.outlineVariant,
              borderRadius: borderRadius.md,
              padding: spacing.sm,
              marginBottom: errors.title ? spacing.xs : spacing.sm,
            },
          ]}
          placeholder="e.g. Distributed Task Orchestrator"
          placeholderTextColor={colors.onSurfaceVariant}
          value={title}
          onChangeText={(val) => {
            setTitle(val);
            if (errors.title) setErrors({ ...errors, title: '' });
          }}
        />
        {errors.title ? (
          <Text style={[styles.errorText, { color: colors.error, marginBottom: spacing.sm }]}>{errors.title}</Text>
        ) : null}

        <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginBottom: spacing.xs }]}>
          Description *
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            {
              backgroundColor: colors.surfaceVariant,
              color: colors.onSurface,
              borderColor: errors.description ? colors.error : colors.outlineVariant,
              borderRadius: borderRadius.md,
              padding: spacing.sm,
              marginBottom: errors.description ? spacing.xs : spacing.sm,
            },
          ]}
          placeholder="Describe project objectives, architecture, expectations..."
          placeholderTextColor={colors.onSurfaceVariant}
          value={description}
          onChangeText={(val) => {
            setDescription(val);
            if (errors.description) setErrors({ ...errors, description: '' });
          }}
          multiline
          numberOfLines={4}
        />
        {errors.description ? (
          <Text style={[styles.errorText, { color: colors.error, marginBottom: spacing.sm }]}>
            {errors.description}
          </Text>
        ) : null}

        <View style={styles.rowInputs}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginBottom: spacing.xs }]}>
              Domain *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceVariant,
                  color: colors.onSurface,
                  borderColor: errors.domain ? colors.error : colors.outlineVariant,
                  borderRadius: borderRadius.md,
                  padding: spacing.sm,
                  marginBottom: errors.domain ? spacing.xs : spacing.sm,
                },
              ]}
              placeholder="e.g. Mobile, AI/ML"
              placeholderTextColor={colors.onSurfaceVariant}
              value={domain}
              onChangeText={(val) => {
                setDomain(val);
                if (errors.domain) setErrors({ ...errors, domain: '' });
              }}
            />
            {errors.domain ? (
              <Text style={[styles.errorText, { color: colors.error, marginBottom: spacing.sm }]}>
                {errors.domain}
              </Text>
            ) : null}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginBottom: spacing.xs }]}>
              Semester *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceVariant,
                  color: colors.onSurface,
                  borderColor: errors.semester ? colors.error : colors.outlineVariant,
                  borderRadius: borderRadius.md,
                  padding: spacing.sm,
                  marginBottom: errors.semester ? spacing.xs : spacing.sm,
                },
              ]}
              placeholder="e.g. Fall 2026"
              placeholderTextColor={colors.onSurfaceVariant}
              value={semester}
              onChangeText={(val) => {
                setSemester(val);
                if (errors.semester) setErrors({ ...errors, semester: '' });
              }}
            />
            {errors.semester ? (
              <Text style={[styles.errorText, { color: colors.error, marginBottom: spacing.sm }]}>
                {errors.semester}
              </Text>
            ) : null}
          </View>
        </View>

        <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginBottom: spacing.xs, marginTop: spacing.xs }]}>
          Max Members (2–20)
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceVariant,
              color: colors.onSurface,
              borderColor: errors.maxMembers ? colors.error : colors.outlineVariant,
              borderRadius: borderRadius.md,
              padding: spacing.sm,
              marginBottom: errors.maxMembers ? spacing.xs : spacing.sm,
            },
          ]}
          placeholder="4"
          placeholderTextColor={colors.onSurfaceVariant}
          value={maxMembers}
          keyboardType="numeric"
          onChangeText={(val) => {
            setMaxMembers(val);
            if (errors.maxMembers) setErrors({ ...errors, maxMembers: '' });
          }}
        />
        {errors.maxMembers ? (
          <Text style={[styles.errorText, { color: colors.error, marginBottom: spacing.sm }]}>
            {errors.maxMembers}
          </Text>
        ) : null}
      </Card>

      {/* Required Skills Card */}
      <Card style={{ marginBottom: spacing.lg }}>
        <Text style={[typography.titleMedium, { color: colors.onSurface, marginBottom: spacing.xs }]}>
          Required Skills
        </Text>
        <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginBottom: spacing.sm }]}>
          Add the technical skills you are seeking in teammates.
        </Text>

        <View style={styles.skillInputRow}>
          <TextInput
            style={[
              styles.input,
              {
                flex: 1,
                backgroundColor: colors.surfaceVariant,
                color: colors.onSurface,
                borderColor: colors.outlineVariant,
                borderRadius: borderRadius.md,
                padding: spacing.sm,
                marginRight: spacing.sm,
              },
            ]}
            placeholder="e.g. React Native, NestJS"
            placeholderTextColor={colors.onSurfaceVariant}
            value={newSkill}
            onChangeText={setNewSkill}
          />
          <Button title="Add" variant="secondary" onPress={handleAddSkill} />
        </View>

        <View style={[styles.levelSelector, { marginTop: spacing.sm }]}>
          <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginRight: spacing.sm }]}>
            Experience Level:
          </Text>
          {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map((lvl) => (
            <Chip
              key={lvl}
              label={lvl}
              selected={skillLevel === lvl}
              onPress={() => setSkillLevel(lvl)}
              style={{ marginRight: spacing.xs }}
            />
          ))}
        </View>

        {skills.length > 0 && (
          <View style={[styles.skillChipsContainer, { marginTop: spacing.md }]}>
            {skills.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleRemoveSkill(idx)}
                style={[
                  styles.skillChipItem,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.outlineVariant,
                    borderRadius: borderRadius.pill,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    marginRight: spacing.xs,
                    marginBottom: spacing.xs,
                  },
                ]}
              >
                <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>
                  {item.skillName} ({item.minimumExperience[0]}) ✕
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Card>

      <Button
        title={isSubmitting ? 'Submitting...' : 'Create Project'}
        variant="primary"
        loading={isSubmitting}
        disabled={isSubmitting}
        onPress={handleSubmit}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  errorText: {
    fontSize: 12,
  },
  skillInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  skillChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillChipItem: {
    borderWidth: 1,
  },
});
