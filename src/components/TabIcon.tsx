/**
 * TabIcon — renders a clean SVG-style icon for the bottom tab bar.
 *
 * Uses Unicode symbols that render crisply on Android and iOS without
 * requiring a heavy icon font dependency. Swap any entry for an
 * @expo/vector-icons glyph at any time — the interface is identical.
 */
import { Text, View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const ICONS: Record<string, { active: string; inactive: string }> = {
  home:         { active: '⊞',  inactive: '⊡'  },
  calendar:     { active: '▦',  inactive: '▧'  },
  leaf:         { active: '✦',  inactive: '✧'  },
  wrench:       { active: '⚙',  inactive: '⚙'  },
  gear:         { active: '⚙',  inactive: '⚙'  },
  people:       { active: '◈',  inactive: '◇'  },
  attendance:   { active: '▦',  inactive: '▧'  },
  building:     { active: '⊟',  inactive: '⊠'  },
  inbox:        { active: '◉',  inactive: '○'  },
  circle:       { active: '●',  inactive: '○'  },
};

// Prettier Unicode replacements — these are readable on all Android/iOS
// versions without a font file. The active state gets a filled variant.
const ICONS_CLEAN: Record<string, { active: string; inactive: string }> = {
  home:        { active: '🏠', inactive: '🏠' },
  calendar:    { active: '📅', inactive: '📅' },
  leaf:        { active: '📋', inactive: '📋' },
  wrench:      { active: '🔧', inactive: '🔧' },
  gear:        { active: '⚙️', inactive: '⚙️' },
  people:      { active: '👥', inactive: '👥' },
  attendance:  { active: '🗓️', inactive: '🗓️' },
  building:    { active: '🏢', inactive: '🏢' },
  inbox:       { active: '📬', inactive: '📬' },
  circle:      { active: '●',  inactive: '○'  },
};

type Props = {
  name: string;
  focused: boolean;
  color: string;
  size?: number;
};

export default function TabIcon({ name, focused, color, size = 22 }: Props) {
  const entry = ICONS_CLEAN[name] ?? ICONS_CLEAN.circle;
  const glyph = focused ? entry.active : entry.inactive;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.icon, { fontSize: size, color, opacity: focused ? 1 : 0.7 }]}>
        {glyph}
      </Text>
      {focused && <View style={[styles.dot, { backgroundColor: color }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  icon: {
    textAlign: 'center',
    lineHeight: 26,
  },
  dot: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
