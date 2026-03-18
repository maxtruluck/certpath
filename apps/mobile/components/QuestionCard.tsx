import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, radii, spacing, fontSize } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import type { QuestionCard as QuestionCardType } from '@/lib/store';

interface QuestionCardProps {
  card: QuestionCardType;
  onSubmit: (payload: Record<string, unknown>) => void;
  submitting: boolean;
}

export default function QuestionCard({ card, onSubmit, submitting }: QuestionCardProps) {
  const q = card.question;

  switch (q.question_type) {
    case 'multiple_choice':
      return <MultipleChoice question={q} onSubmit={onSubmit} submitting={submitting} />;
    case 'true_false':
      return <TrueFalse question={q} onSubmit={onSubmit} submitting={submitting} />;
    case 'multiple_select':
      return <MultipleSelect question={q} onSubmit={onSubmit} submitting={submitting} />;
    case 'fill_blank':
      return <FillBlank question={q} onSubmit={onSubmit} submitting={submitting} />;
    case 'ordering':
      return <Ordering question={q} onSubmit={onSubmit} submitting={submitting} />;
    case 'matching':
      return <Matching question={q} onSubmit={onSubmit} submitting={submitting} />;
    default:
      return (
        <View style={styles.container}>
          <Text style={styles.errorText}>Unsupported question type: {q.question_type}</Text>
        </View>
      );
  }
}

// ── Shared question header ──────────────────────────────────────────────

function QuestionHeader({ question }: { question: QuestionCardType['question'] }) {
  return (
    <View style={styles.header}>
      <View style={styles.metaRow}>
        {question.module_title ? (
          <Text style={styles.moduleName}>{question.module_title}</Text>
        ) : null}
        <View style={[styles.diffBadge, diffBadgeColor(question.difficulty_label)]}>
          <Text style={styles.diffText}>{question.difficulty_label}</Text>
        </View>
      </View>
      <Text style={styles.questionText}>{question.question_text}</Text>
    </View>
  );
}

function diffBadgeColor(label: string) {
  switch (label) {
    case 'easy':
      return { backgroundColor: 'rgba(34,197,94,0.12)' };
    case 'medium':
      return { backgroundColor: 'rgba(245,158,11,0.12)' };
    case 'challenging':
      return { backgroundColor: 'rgba(239,68,68,0.12)' };
    default:
      return {};
  }
}

// ── Multiple Choice ─────────────────────────────────────────────────────

function MultipleChoice({
  question,
  onSubmit,
  submitting,
}: {
  question: QuestionCardType['question'];
  onSubmit: (p: Record<string, unknown>) => void;
  submitting: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <QuestionHeader question={question} />
      <View style={styles.options}>
        {(question.options || []).map((opt) => (
          <Pressable
            key={opt.id}
            style={[styles.option, selected === opt.id && styles.optionSelected]}
            onPress={() => {
              setSelected(opt.id);
              Haptics.selectionAsync();
            }}
          >
            <View style={[styles.radio, selected === opt.id && styles.radioSelected]} />
            <Text style={[styles.optionText, selected === opt.id && styles.optionTextSelected]}>
              {opt.text}
            </Text>
          </Pressable>
        ))}
      </View>
      <Button
        title="Check Answer"
        onPress={() => onSubmit({ selected_option_ids: [selected] })}
        disabled={!selected}
        loading={submitting}
      />
    </ScrollView>
  );
}

// ── True / False ────────────────────────────────────────────────────────

function TrueFalse({
  question,
  onSubmit,
  submitting,
}: {
  question: QuestionCardType['question'];
  onSubmit: (p: Record<string, unknown>) => void;
  submitting: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const trueOpt = (question.options || []).find((o) => o.text.toLowerCase() === 'true');
  const falseOpt = (question.options || []).find((o) => o.text.toLowerCase() === 'false');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <QuestionHeader question={question} />
      <View style={styles.tfRow}>
        {[trueOpt, falseOpt].filter(Boolean).map((opt) => (
          <Pressable
            key={opt!.id}
            style={[styles.tfButton, selected === opt!.id && styles.tfSelected]}
            onPress={() => {
              setSelected(opt!.id);
              Haptics.selectionAsync();
            }}
          >
            <Text style={[styles.tfText, selected === opt!.id && styles.tfTextSelected]}>
              {opt!.text}
            </Text>
          </Pressable>
        ))}
      </View>
      <Button
        title="Check Answer"
        onPress={() => onSubmit({ selected_option_ids: [selected] })}
        disabled={!selected}
        loading={submitting}
      />
    </ScrollView>
  );
}

// ── Multiple Select ─────────────────────────────────────────────────────

function MultipleSelect({
  question,
  onSubmit,
  submitting,
}: {
  question: QuestionCardType['question'];
  onSubmit: (p: Record<string, unknown>) => void;
  submitting: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    Haptics.selectionAsync();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <QuestionHeader question={question} />
      <Text style={styles.hint}>Select all that apply</Text>
      <View style={styles.options}>
        {(question.options || []).map((opt) => (
          <Pressable
            key={opt.id}
            style={[styles.option, selected.has(opt.id) && styles.optionSelected]}
            onPress={() => toggle(opt.id)}
          >
            <View style={[styles.checkbox, selected.has(opt.id) && styles.checkboxSelected]}>
              {selected.has(opt.id) && (
                <Ionicons name="checkmark" size={14} color="#fff" />
              )}
            </View>
            <Text style={[styles.optionText, selected.has(opt.id) && styles.optionTextSelected]}>
              {opt.text}
            </Text>
          </Pressable>
        ))}
      </View>
      <Button
        title="Check Answer"
        onPress={() => onSubmit({ selected_option_ids: Array.from(selected) })}
        disabled={selected.size === 0}
        loading={submitting}
      />
    </ScrollView>
  );
}

// ── Fill in the Blank ───────────────────────────────────────────────────

function FillBlank({
  question,
  onSubmit,
  submitting,
}: {
  question: QuestionCardType['question'];
  onSubmit: (p: Record<string, unknown>) => void;
  submitting: boolean;
}) {
  const [text, setText] = useState('');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <QuestionHeader question={question} />
        <TextInput
          style={styles.textInput}
          value={text}
          onChangeText={setText}
          placeholder="Type your answer..."
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={() => {
            if (text.trim()) onSubmit({ answer_text: text.trim() });
          }}
        />
        <Button
          title="Check Answer"
          onPress={() => onSubmit({ answer_text: text.trim() })}
          disabled={!text.trim()}
          loading={submitting}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Ordering (drag to reorder) ──────────────────────────────────────────

function Ordering({
  question,
  onSubmit,
  submitting,
}: {
  question: QuestionCardType['question'];
  onSubmit: (p: Record<string, unknown>) => void;
  submitting: boolean;
}) {
  const [items, setItems] = useState(() =>
    (question.options || []).map((o) => ({ ...o })),
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const ITEM_HEIGHT = 52;

  const moveItem = useCallback((from: number, to: number) => {
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <QuestionHeader question={question} />
      <Text style={styles.hint}>Drag to reorder</Text>
      <View style={styles.orderList}>
        {items.map((item, index) => (
          <OrderItem
            key={item.id}
            item={item}
            index={index}
            itemHeight={ITEM_HEIGHT}
            totalItems={items.length}
            isDragging={dragIndex === index}
            onDragStart={() => setDragIndex(index)}
            onDragEnd={() => setDragIndex(null)}
            onMove={moveItem}
          />
        ))}
      </View>
      <Button
        title="Check Answer"
        onPress={() => onSubmit({ user_order: items.map((i) => i.id) })}
        loading={submitting}
      />
    </ScrollView>
  );
}

function OrderItem({
  item,
  index,
  itemHeight,
  totalItems,
  isDragging,
  onDragStart,
  onDragEnd,
  onMove,
}: {
  item: { id: string; text: string };
  index: number;
  itemHeight: number;
  totalItems: number;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMove: (from: number, to: number) => void;
}) {
  const translateY = useSharedValue(0);
  const isActive = useSharedValue(false);

  const gesture = Gesture.Pan()
    .activateAfterLongPress(200)
    .onStart(() => {
      isActive.value = true;
      runOnJS(onDragStart)();
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    })
    .onUpdate((e) => {
      translateY.value = e.translationY;
      const newIndex = Math.max(
        0,
        Math.min(totalItems - 1, Math.round((index * itemHeight + e.translationY) / itemHeight)),
      );
      if (newIndex !== index) {
        runOnJS(onMove)(index, newIndex);
      }
    })
    .onEnd(() => {
      translateY.value = withTiming(0);
      isActive.value = false;
      runOnJS(onDragEnd)();
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    zIndex: isActive.value ? 100 : 0,
    opacity: isActive.value ? 0.9 : 1,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.orderItem, { height: itemHeight }, animStyle]}>
        <Ionicons name="reorder-three" size={20} color={colors.textMuted} />
        <Text style={styles.orderText} numberOfLines={2}>
          {item.text}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}

// ── Matching (tap to pair) ──────────────────────────────────────────────

function Matching({
  question,
  onSubmit,
  submitting,
}: {
  question: QuestionCardType['question'];
  onSubmit: (p: Record<string, unknown>) => void;
  submitting: boolean;
}) {
  const lefts = question.matching_items?.lefts || [];
  const rights = question.matching_items?.rights || [];

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [pairs, setPairs] = useState<{ left: string; right: string }[]>([]);

  const pairedLefts = new Set(pairs.map((p) => p.left));
  const pairedRights = new Set(pairs.map((p) => p.right));

  const tapLeft = (item: string) => {
    if (pairedLefts.has(item)) {
      // Unpair
      setPairs((prev) => prev.filter((p) => p.left !== item));
      setSelectedLeft(null);
      return;
    }
    setSelectedLeft(item);
    Haptics.selectionAsync();
  };

  const tapRight = (item: string) => {
    if (!selectedLeft) return;
    if (pairedRights.has(item)) {
      // Unpair existing
      setPairs((prev) => prev.filter((p) => p.right !== item));
    }
    setPairs((prev) => [...prev.filter((p) => p.left !== selectedLeft), { left: selectedLeft, right: item }]);
    setSelectedLeft(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getPairIndex = (left: string) => pairs.findIndex((p) => p.left === left);
  const getRightPairIndex = (right: string) => pairs.findIndex((p) => p.right === right);

  const pairColors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#F97316'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <QuestionHeader question={question} />
      <Text style={styles.hint}>Tap a left item, then tap its match on the right</Text>
      <View style={styles.matchContainer}>
        <View style={styles.matchColumn}>
          {lefts.map((item) => {
            const pi = getPairIndex(item);
            const isPaired = pi >= 0;
            const isSelected = selectedLeft === item;
            return (
              <Pressable
                key={item}
                style={[
                  styles.matchItem,
                  isSelected && styles.matchItemActive,
                  isPaired && { borderColor: pairColors[pi % pairColors.length], borderWidth: 2 },
                ]}
                onPress={() => tapLeft(item)}
              >
                <Text
                  style={[
                    styles.matchText,
                    isPaired && { color: pairColors[pi % pairColors.length] },
                  ]}
                  numberOfLines={3}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.matchColumn}>
          {rights.map((item) => {
            const pi = getRightPairIndex(item);
            const isPaired = pi >= 0;
            return (
              <Pressable
                key={item}
                style={[
                  styles.matchItem,
                  isPaired && { borderColor: pairColors[pi % pairColors.length], borderWidth: 2 },
                ]}
                onPress={() => tapRight(item)}
              >
                <Text
                  style={[
                    styles.matchText,
                    isPaired && { color: pairColors[pi % pairColors.length] },
                  ]}
                  numberOfLines={3}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Button
        title="Check Answer"
        onPress={() => onSubmit({ user_pairs: pairs })}
        disabled={pairs.length < lefts.length}
        loading={submitting}
      />
    </ScrollView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    padding: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  header: {
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  moduleName: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  diffBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  diffText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  questionText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 28,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: fontSize.base,
    color: colors.danger,
    padding: spacing.xl,
  },

  // MC options
  options: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  optionText: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text,
    lineHeight: 22,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
  },
  radioSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },

  // Checkbox
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },

  // True/false
  tfRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  tfButton: {
    flex: 1,
    paddingVertical: spacing.xl,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  tfSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  tfText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  tfTextSelected: {
    color: colors.primary,
  },

  // Text input
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.lg,
    fontSize: fontSize.base,
    color: colors.text,
    marginBottom: spacing.xl,
    minHeight: 48,
  },

  // Ordering
  orderList: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  orderText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
  },

  // Matching
  matchContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  matchColumn: {
    flex: 1,
    gap: spacing.sm,
  },
  matchItem: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 52,
    justifyContent: 'center',
  },
  matchItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  matchText: {
    fontSize: fontSize.sm,
    color: colors.text,
    textAlign: 'center',
  },
});
