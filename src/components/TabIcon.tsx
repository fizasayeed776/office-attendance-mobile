/**
 * TabIcon — renders an Ionicon for the bottom tab bar.
 * Uses @expo/vector-icons (Ionicons) — works in Expo Go and standalone builds
 * without any native linking step.
 */
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Map from our internal icon name to Ionicons glyph names.
// Outlined variants for inactive, filled for active — standard iOS/Android pattern.
const ICON_MAP: Record<string, { active: string; inactive: string }> = {
  home:        { active: 'home',            inactive: 'home-outline'            },
  calendar:    { active: 'calendar',        inactive: 'calendar-outline'        },
  leaf:        { active: 'document-text',   inactive: 'document-text-outline'   },
  wrench:      { active: 'construct',       inactive: 'construct-outline'       },
  gear:        { active: 'settings',        inactive: 'settings-outline'        },
  people:      { active: 'people',          inactive: 'people-outline'          },
  attendance:  { active: 'calendar-clear',  inactive: 'calendar-clear-outline'  },
  building:    { active: 'business',        inactive: 'business-outline'        },
  inbox:       { active: 'mail',            inactive: 'mail-outline'            },
  circle:      { active: 'ellipse',         inactive: 'ellipse-outline'         },
};

type Props = {
  name: string;
  focused: boolean;
  color: string;
  size?: number;
};

export default function TabIcon({ name, focused, color, size = 22 }: Props) {
  const entry  = ICON_MAP[name] ?? ICON_MAP.circle;
  const glyph  = focused ? entry.active : entry.inactive;

  return (
    <View style={styles.wrap}>
      <Ionicons
        name={glyph as any}
        size={size}
        color={color}
        style={{ opacity: focused ? 1 : 0.65 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 26,
  },
});
