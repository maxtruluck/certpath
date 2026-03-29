import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, radii } from '@/lib/theme';

const MAX_WRONG_ATTEMPTS = 2;

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: { id: string; text: string }[];
  correct_option_ids: string[];
  explanation: string;
  option_explanations?: Record<string, string>;
  acceptable_answers?: string[];
  correct_order?: string[];
  matching_items?: { lefts: string[]; rights: string[] };
}

interface AnswerResult {
  is_correct: boolean;
  correct_option_ids: string[];
  explanation: string;
  option_explanation?: string | null;
  acceptable_answers?: string[];
  correct_order?: string[];
  matching_pairs?: { left: string; right: string }[];
}

interface AnswerStepProps {
  question: Question;
  onComplete: (isCorrect: boolean) => void;
  readOnly?: boolean;
  previousResult?: AnswerResult | null;
}

export function AnswerStep({ question, onComplete, readOnly, previousResult }: AnswerStepProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(previousResult || null);
  const [submitting, setSubmitting] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [fillBlankAnswer, setFillBlankAnswer] = useState('');
  const [orderItems, setOrderItems] = useState<{ id: string; text: string }[]>(() => {
    if (question.question_type === 'ordering') {
      const shuffled = [...question.options];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
    return [];
  });
  const [matchSelections, setMatchSelections] = useState<Record<string, string>>(() => {
    if (question.question_type === 'matching' && question.matching_items) {
      const sel: Record<string, string> = {};
      for (const left of question.matching_items.lefts) sel[left] = '';
      return sel;
    }
    return {};
  });
  const [activeMatchLeft, setActiveMatchLeft] = useState<string | null>(null);

  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  const supportedTypes = ['multiple_choice', 'multiple_select', 'true_false', 'fill_blank', 'ordering', 'matching'];
  const needsOptions = ['multiple_choice', 'multiple_select', 'true_false'];
  const isUnsupported = !supportedTypes.includes(question.question_type)
    || (needsOptions.includes(question.question_type) && (!question.options || question.options.length === 0));

  const canSubmit = (() => {
    if (readOnly || answerResult) return false;
    if (question.question_type === 'fill_blank') return fillBlankAnswer.trim().length > 0;
    if (question.question_type === 'ordering') return orderItems.length > 0;
    if (question.question_type === 'matching') return Object.values(matchSelections).every(v => v !== '');
    return selectedIds.length > 0;
  })();

  const handleSubmitAnswer = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      let isCorrect = false;

      if (question.question_type === 'fill_blank') {
        const acceptable = question.acceptable_answers || question.correct_option_ids || [];
        isCorrect = acceptable.some((a: string) => a.toLowerCase().trim() === fillBlankAnswer.toLowerCase().trim());
      } else if (question.question_type === 'ordering') {
        const correctOrder = question.correct_order || question.correct_option_ids || [];
        const userOrder = orderItems.map(i => i.id);
        isCorrect = correctOrder.length === userOrder.length && correctOrder.every((id: string, idx: number) => id === userOrder[idx]);
      } else if (question.question_type === 'matching') {
        const items = question.matching_items;
        if (items) {
          // Build expected pairs from correct_option_ids or matching_items
          isCorrect = items.lefts.every((left, idx) => {
            const expectedRight = items.rights[idx];
            return (matchSelections[left] || '').toLowerCase() === expectedRight.toLowerCase();
          });
        }
      } else {
        const correctIds = question.correct_option_ids || [];
        isCorrect = correctIds.length === selectedIds.length && correctIds.every((id: string) => selectedIds.includes(id));
      }

      const result: AnswerResult = {
        is_correct: isCorrect,
        correct_option_ids: question.correct_option_ids || [],
        explanation: question.explanation || '',
        option_explanation: isCorrect ? undefined : question.option_explanations?.[selectedIds[0]] || undefined,
        acceptable_answers: question.acceptable_answers,
        correct_order: question.correct_order,
      };

      setAnswerResult(result);
      if (!isCorrect) {
        setWrongAttempts(prev => prev + 1);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      console.error('Answer grading error:', err);
    }
    setSubmitting(false);
  }, [canSubmit, question, selectedIds, fillBlankAnswer, orderItems, matchSelections]);

  function handleContinueOrRetry() {
    if (!answerResult) return;

    if (answerResult.is_correct || wrongAttempts >= MAX_WRONG_ATTEMPTS) {
      onComplete(answerResult.is_correct);
    } else {
      setSelectedIds([]);
      setAnswerResult(null);
      setFillBlankAnswer('');
      if (question.question_type === 'ordering') {
        const shuffled = [...question.options];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setOrderItems(shuffled);
      }
      if (question.question_type === 'matching' && question.matching_items) {
        const sel: Record<string, string> = {};
        for (const left of question.matching_items.lefts) sel[left] = '';
        setMatchSelections(sel);
        setActiveMatchLeft(null);
      }
    }
  }

  function toggleOption(optionId: string) {
    if (answerResult || readOnly) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (question.question_type === 'multiple_select') {
      setSelectedIds(prev => prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]);
    } else {
      setSelectedIds([optionId]);
    }
  }

  const retriesExhausted = wrongAttempts >= MAX_WRONG_ATTEMPTS;
  const shouldReveal = readOnly || answerResult?.is_correct || retriesExhausted;
  const effectiveResult = readOnly ? (previousResult || answerResult) : answerResult;

  // Auto-fire onComplete when answer is finalized
  const completedRef = useRef(false);
  useEffect(() => {
    if (readOnly) return;
    if (shouldReveal && answerResult && !completedRef.current) {
      completedRef.current = true;
      const earnedCredit = answerResult.is_correct && wrongAttempts === 0;
      onComplete(earnedCredit);
    }
  }, [shouldReveal, answerResult, onComplete, readOnly, wrongAttempts]);

  function getOptionStyle(optionId: string): { borderColor: string; bgColor: string } {
    if (readOnly && effectiveResult) {
      if (effectiveResult.correct_option_ids?.includes(optionId)) return { borderColor: '#4ade80', bgColor: '#f0fdf4' };
      return { borderColor: colors.border, bgColor: colors.bg };
    }
    if (!answerResult) {
      if (selectedIds.includes(optionId)) return { borderColor: colors.text, bgColor: colors.surfaceLight };
      return { borderColor: colors.border, bgColor: colors.bg };
    }
    if (shouldReveal) {
      if (answerResult.correct_option_ids?.includes(optionId)) return { borderColor: '#4ade80', bgColor: '#f0fdf4' };
      if (selectedIds.includes(optionId) && !answerResult.correct_option_ids?.includes(optionId)) return { borderColor: '#f87171', bgColor: '#fef2f2' };
    } else {
      if (selectedIds.includes(optionId)) return { borderColor: '#f87171', bgColor: '#fef2f2' };
    }
    return { borderColor: colors.border, bgColor: colors.bg };
  }

  function moveOrderItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= orderItems.length) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const items = [...orderItems];
    [items[index], items[target]] = [items[target], items[index]];
    setOrderItems(items);
  }

  return (
    <View style={styles.container}>
      {/* Question text */}
      <Text style={styles.questionText}>{question.question_text}</Text>
      {question.question_type === 'multiple_select' && <Text style={styles.hint}>Select all that apply</Text>}
      {question.question_type === 'fill_blank' && <Text style={styles.hint}>Type your answer</Text>}
      {question.question_type === 'ordering' && <Text style={styles.hint}>Arrange items in the correct order</Text>}
      {question.question_type === 'matching' && <Text style={styles.hint}>Match each item on the left with the correct item on the right</Text>}

      {/* Unsupported question type */}
      {isUnsupported && (
        <View style={styles.unsupportedBox}>
          <Text style={styles.unsupportedText}>This question type is not yet supported.</Text>
          {!readOnly && (
            <Pressable style={styles.skipButton} onPress={() => onComplete(false)}>
              <Text style={styles.skipButtonText}>Skip and continue</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Fill Blank */}
      {question.question_type === 'fill_blank' && !effectiveResult && (
        <TextInput
          style={styles.textInput}
          value={fillBlankAnswer}
          onChangeText={setFillBlankAnswer}
          placeholder="Type your answer..."
          placeholderTextColor={colors.textMuted}
          editable={!readOnly}
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={() => canSubmit && handleSubmitAnswer()}
        />
      )}
      {question.question_type === 'fill_blank' && effectiveResult && (
        <View>
          {readOnly ? (
            <View style={[styles.fillResult, { borderColor: '#4ade80', backgroundColor: '#f0fdf4' }]}>
              <Text style={[styles.fillResultText, { color: '#15803d' }]}>
                {effectiveResult.acceptable_answers?.[0] || '(answer)'}
              </Text>
            </View>
          ) : (
            <>
              <View style={[styles.fillResult, effectiveResult.is_correct ? { borderColor: '#4ade80', backgroundColor: '#f0fdf4' } : { borderColor: '#f87171', backgroundColor: '#fef2f2' }]}>
                <Text style={[styles.fillResultText, effectiveResult.is_correct ? { color: '#15803d' } : { color: '#dc2626' }]}>
                  {fillBlankAnswer || '(empty)'}
                </Text>
              </View>
              {!effectiveResult.is_correct && shouldReveal && effectiveResult.acceptable_answers && (
                <Text style={styles.correctAnswerHint}>Correct answer: {effectiveResult.acceptable_answers[0]}</Text>
              )}
            </>
          )}
        </View>
      )}

      {/* Ordering */}
      {question.question_type === 'ordering' && !effectiveResult && (
        <View style={styles.orderList}>
          {orderItems.map((item, idx) => (
            <View key={item.id} style={styles.orderRow}>
              <View style={styles.orderItem}>
                <Text style={styles.orderNumber}>{idx + 1}.</Text>
                <Text style={styles.orderText}>{item.text}</Text>
              </View>
              <View style={styles.orderButtons}>
                <Pressable onPress={() => moveOrderItem(idx, -1)} disabled={idx === 0} style={({ pressed }) => [styles.orderBtn, pressed && { opacity: 0.5 }]}>
                  <Ionicons name="chevron-up" size={16} color={idx === 0 ? colors.textMuted : colors.textSecondary} />
                </Pressable>
                <Pressable onPress={() => moveOrderItem(idx, 1)} disabled={idx === orderItems.length - 1} style={({ pressed }) => [styles.orderBtn, pressed && { opacity: 0.5 }]}>
                  <Ionicons name="chevron-down" size={16} color={idx === orderItems.length - 1 ? colors.textMuted : colors.textSecondary} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
      {question.question_type === 'ordering' && effectiveResult && (
        <View style={styles.orderList}>
          {readOnly ? (
            (effectiveResult.correct_order || []).map((id: string, idx: number) => {
              const item = question.options.find(o => o.id === id);
              return (
                <View key={id} style={[styles.orderItem, { borderColor: '#4ade80', backgroundColor: '#f0fdf4', borderWidth: 2 }]}>
                  <Text style={styles.orderNumber}>{idx + 1}.</Text>
                  <Text style={styles.orderText}>{item?.text || id}</Text>
                </View>
              );
            })
          ) : (
            orderItems.map((item, idx) => {
              const isCorrectPosition = effectiveResult.correct_order && effectiveResult.correct_order[idx] === item.id;
              return (
                <View key={item.id} style={[styles.orderItem, {
                  borderWidth: 2,
                  borderColor: shouldReveal ? (isCorrectPosition ? '#4ade80' : '#f87171') : '#fca5a5',
                  backgroundColor: shouldReveal ? (isCorrectPosition ? '#f0fdf4' : '#fef2f2') : '#fef2f2',
                }]}>
                  <Text style={styles.orderNumber}>{idx + 1}.</Text>
                  <Text style={styles.orderText}>{item.text}</Text>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* Matching */}
      {question.question_type === 'matching' && question.matching_items && !effectiveResult && (
        <View style={styles.matchContainer}>
          {question.matching_items.lefts.map((left) => (
            <View key={left} style={styles.matchRow}>
              <Text style={styles.matchLeft} numberOfLines={2}>{left}</Text>
              <Pressable
                style={[styles.matchDropdown, activeMatchLeft === left && styles.matchDropdownActive]}
                onPress={() => setActiveMatchLeft(activeMatchLeft === left ? null : left)}
              >
                <Text style={matchSelections[left] ? styles.matchSelectedText : styles.matchPlaceholderText}>
                  {matchSelections[left] || 'Select...'}
                </Text>
                <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
              </Pressable>
            </View>
          ))}
          {activeMatchLeft && question.matching_items && (
            <View style={styles.matchOptions}>
              {question.matching_items.rights.map((right, idx) => (
                <Pressable
                  key={`${right}-${idx}`}
                  style={styles.matchOption}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMatchSelections(prev => ({ ...prev, [activeMatchLeft]: right }));
                    setActiveMatchLeft(null);
                  }}
                >
                  <Text style={styles.matchOptionText}>{right}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}
      {question.question_type === 'matching' && effectiveResult && (
        <View style={styles.matchContainer}>
          {readOnly && effectiveResult.matching_pairs ? (
            effectiveResult.matching_pairs.map((pair) => (
              <View key={pair.left} style={[styles.matchResultRow, { borderColor: '#4ade80', backgroundColor: '#f0fdf4' }]}>
                <Text style={styles.matchResultLeft}>{pair.left}</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />
                <Text style={styles.matchResultRight}>{pair.right}</Text>
              </View>
            ))
          ) : question.matching_items ? (
            question.matching_items.lefts.map((left) => {
              const userRight = matchSelections[left] || '';
              const correctRight = question.matching_items?.rights[question.matching_items.lefts.indexOf(left)];
              const isCorrectPair = userRight.toLowerCase() === correctRight?.toLowerCase();
              return (
                <View key={left} style={[styles.matchResultRow, {
                  borderColor: shouldReveal ? (isCorrectPair ? '#4ade80' : '#f87171') : '#fca5a5',
                  backgroundColor: shouldReveal ? (isCorrectPair ? '#f0fdf4' : '#fef2f2') : '#fef2f2',
                }]}>
                  <Text style={styles.matchResultLeft}>{left}</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />
                  <Text style={[styles.matchResultRight, !isCorrectPair && { textDecorationLine: 'line-through', color: '#dc2626' }]}>
                    {userRight || '(none)'}
                  </Text>
                  {shouldReveal && !isCorrectPair && (
                    <Text style={styles.matchCorrectHint}>{correctRight}</Text>
                  )}
                </View>
              );
            })
          ) : null}
        </View>
      )}

      {/* MC / MS / TF options */}
      {['multiple_choice', 'multiple_select', 'true_false'].includes(question.question_type) && (
        <View style={styles.optionsList}>
          {question.options.map((option, idx) => {
            const optStyle = getOptionStyle(option.id);
            const isDisabled = !!effectiveResult || !!readOnly;
            return (
              <Pressable
                key={option.id}
                style={[styles.optionButton, { borderColor: optStyle.borderColor, backgroundColor: optStyle.bgColor }]}
                onPress={() => toggleOption(option.id)}
                disabled={isDisabled}
              >
                <Text style={styles.optionLabel}>{optionLabels[idx]}.</Text>
                <Text style={[styles.optionText, effectiveResult && getOptionStyle(option.id).borderColor === colors.border && { color: colors.textMuted }]}>
                  {option.text}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Check button */}
      {!effectiveResult && !readOnly && !isUnsupported && (
        <Pressable
          style={[styles.checkButton, !canSubmit && styles.checkButtonDisabled]}
          onPress={handleSubmitAnswer}
          disabled={!canSubmit || submitting}
        >
          <Text style={[styles.checkButtonText, !canSubmit && styles.checkButtonTextDisabled]}>
            {submitting ? 'Checking...' : 'CHECK ANSWER'}
          </Text>
        </Pressable>
      )}

      {/* Feedback panel */}
      {effectiveResult && (
        <View style={[styles.feedbackPanel, effectiveResult.is_correct ? styles.feedbackCorrect : styles.feedbackIncorrect]}>
          <Text style={[styles.feedbackTitle, effectiveResult.is_correct ? { color: '#15803d' } : { color: '#dc2626' }]}>
            {readOnly
              ? (effectiveResult.is_correct ? 'You got this right' : 'Review the correct answer above')
              : (effectiveResult.is_correct ? 'Correct!' : shouldReveal ? 'Answer Revealed' : 'Not quite')}
          </Text>

          {!readOnly && !effectiveResult.is_correct && shouldReveal && effectiveResult.option_explanation && (
            <View style={styles.optionExplanation}>
              <Text style={styles.optionExplanationLabel}>Why your answer is wrong:</Text>
              <Text style={styles.optionExplanationText}>{effectiveResult.option_explanation}</Text>
            </View>
          )}

          {shouldReveal && effectiveResult.explanation ? (
            <Text style={styles.explanationText}>{effectiveResult.explanation}</Text>
          ) : null}

          {!readOnly && !effectiveResult.is_correct && !shouldReveal && (
            <Text style={styles.retryHint}>Give it another try.</Text>
          )}

          {!readOnly && !effectiveResult.is_correct && !shouldReveal && (
            <Pressable style={styles.retryButton} onPress={handleContinueOrRetry}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: spacing['3xl'],
  },
  questionText: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    marginTop: -spacing.sm,
  },

  // Unsupported
  unsupportedBox: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radii.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  unsupportedText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  skipButton: {
    backgroundColor: colors.text,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.bg,
  },

  // Fill blank
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  fillResult: {
    borderWidth: 2,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  fillResultText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  correctAnswerHint: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Ordering
  orderList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  orderItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  orderNumber: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
    width: 20,
  },
  orderText: {
    fontSize: fontSize.sm,
    color: colors.text,
    flex: 1,
  },
  orderButtons: {
    gap: 2,
  },
  orderBtn: {
    padding: 4,
  },

  // Matching
  matchContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  matchLeft: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.text,
    width: '35%',
  },
  matchDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bg,
  },
  matchDropdownActive: {
    borderColor: colors.primary,
  },
  matchSelectedText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  matchPlaceholderText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  matchOptions: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  matchOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  matchOptionText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  matchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 2,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  matchResultLeft: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  matchResultRight: {
    fontSize: fontSize.sm,
    color: colors.text,
    flex: 1,
  },
  matchCorrectHint: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: '#15803d',
  },

  // MC / MS / TF options
  optionsList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderRadius: radii.md,
  },
  optionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  optionText: {
    fontSize: fontSize.sm,
    color: colors.text,
    flex: 1,
  },

  // Check button
  checkButton: {
    backgroundColor: colors.text,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  checkButtonDisabled: {
    backgroundColor: colors.surfaceLight,
  },
  checkButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.bg,
    letterSpacing: 0.5,
  },
  checkButtonTextDisabled: {
    color: colors.textMuted,
  },

  // Feedback
  feedbackPanel: {
    borderRadius: radii.lg,
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
  },
  feedbackCorrect: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  feedbackIncorrect: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  feedbackTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  explanationText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  retryHint: {
    fontSize: fontSize.sm,
    color: '#dc2626',
  },
  retryButton: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  optionExplanation: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: radii.sm,
    padding: spacing.md,
  },
  optionExplanationLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: '#dc2626',
    marginBottom: spacing.xs,
  },
  optionExplanationText: {
    fontSize: fontSize.sm,
    color: '#7f1d1d',
  },
});
