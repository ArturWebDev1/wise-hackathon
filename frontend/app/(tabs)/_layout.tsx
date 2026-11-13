import { Home, CircleHelp } from 'lucide-react-native';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useWise } from '@/lib/wise-store';
import { wise as c } from '@/lib/wise-theme';

export default function TabLayout() {
  const role = useWise((s) => s.role);
  return (
    <>
      {/* eslint-disable-next-line react/style-prop-object -- Expo StatusBar style is an appearance enum, not a View style. */}
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: c.white },
          tabBarActiveTintColor: c.forest,
          tabBarInactiveTintColor: c.muted,
          tabBarLabelStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginTop: 4 },
          tabBarItemStyle: { paddingTop: 9, paddingBottom: 5 },
          tabBarStyle: {
            backgroundColor: c.white,
            borderTopColor: c.card,
            height: 84,
            display: role ? 'flex' : 'none',
            elevation: 0,
            shadowOpacity: 0,
          },
        }}
        screenListeners={({ navigation, route }) => ({
          tabPress: () => {
            if (navigation.getState().routes[navigation.getState().index]?.key !== route.key)
              void Haptics.selectionAsync();
          },
        })}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Home
                size={25}
                color={color}
                strokeWidth={1.8}
                fill={focused ? c.pale : 'transparent'}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="help"
          options={{
            title: 'Help',
            tabBarIcon: ({ color }) => <CircleHelp size={25} color={color} strokeWidth={1.8} />,
          }}
        />
      </Tabs>
    </>
  );
}
