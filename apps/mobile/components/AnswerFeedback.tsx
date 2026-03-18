import { View, Text, StyleSheet, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { colors, radii, spacing, fontSize } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import MarkdownContent from './MarkdownContent';
import Button from './Button';
import type { AnswerResult } from '@/lib/store';

interface AnswerFeedbackProps {
  result: AnswerResult;
  onContinue: () => void;
}

export default function AnswerFeedback({ result, onContinue }: AnswerFeedbackProps) {
  useEffect(() => {
    if (result.is_correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [result.is_correct]);

  const isCorrect = result.is_correct;

  return (
    <View style={[styles.container, isCorrect ? styles.correctBg : styles.incorrectBg]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons
            name={isCorrect ? 'checkmark-circle' : 'close-circle'}
            size={28}
            color={isCorrect ? colors.success : colors.danger}
          />
          <Text style={[styles.headerText, isCorrect ? styles.correctText : styles.incorrectText]}>
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </Text>
        </View>

        {result.explanation ? (
          <View style={styles.explanationBox}>
            <MarkdownContent content={result.explanation} />
          </View>
        ) : null}

        {result.option_explanation ? (
          <View style={styles.explanationBox}>
            <Text style={styles.explanationLabel}>Why your answer was wrong:</Text>
            <Text style={styles.explanationText}>{result.option_explanation}</Text>
          </View>
        ) : null}

        {result.acceptable_answers && result.acceptable_answers.length > 0 ? (
          <View style={styles.explanationBox}>
            <Text style={styles.explanationLabel}>Accepted answers:</Text>
            <Text style={styles.explanationText}>{result.acceptable_answers.join(', ')}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={onContinue}
          variant={isCorrect ? 'primary' : 'secondary'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '60%',
  },
  correctBg: {
    backgroundColor: '#f0fdf4',
  },
  incorrectBg: {
    backgroundColor: '#fef2f2',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headerText: {
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  correctText: {
    color: colors.success,
  },
  incorrectText: {
    color: colors.danger,
  },
  explanationBox: {
    marginBottom: spacing.md,
  },
  explanationLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  explanationText: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 22,
  },
  footer: {
    padding: spacing.xl,
    paddingTop: spacing.sm,
  },
});
