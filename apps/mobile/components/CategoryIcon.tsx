import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CategoryIconProps {
  name: string;
  icon: string;
  bgColor: string;
  iconColor: string;
  onPress: () => void;
}

export default function CategoryIcon({
  name,
  icon,
  bgColor,
  iconColor,
  onPress,
}: CategoryIconProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
        <Ionicons name={icon as any} size={22} color={iconColor} />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {name.replace(/_/g, ' ')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 62,
  },
  pressed: {
    opacity: 0.7,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 9,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
});
