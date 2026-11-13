import { View, Pressable } from 'react-native';
import { Tabs, router } from 'expo-router';
import { Home, CreditCard, Users, ArrowLeftRight, ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Copy } from '@/components/wise';
import { wise as c } from '@/lib/wise-theme';
import { useWise } from '@/lib/wise-store';

function BackToLite() {
  return (
    <Pressable
      onPress={() => router.dismissTo('/')}
      accessibilityRole="button"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: c.green,
        paddingHorizontal: 20,
        paddingVertical: 14,
      }}
    >
      <ArrowLeft size={20} color={c.forest} strokeWidth={2} />
      <Copy bold size={16} color={c.forest}>
        Back to Wise Lite
      </Copy>
    </Pressable>
  );
}

export default function FullLayout() {
  const helper = useWise((s) => s.role) === 'nikita';
  return (
    <View style={{ flex: 1, backgroundColor: c.white }}>
      {helper ? null : <BackToLite />}
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: c.white },
          tabBarActiveTintColor: c.forest,
          tabBarInactiveTintColor: c.muted,
          tabBarLabelStyle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginTop: 4 },
          tabBarStyle: {
            height: 80,
            backgroundColor: c.white,
            borderTopColor: c.card,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarItemStyle: { paddingTop: 8, paddingBottom: 6 },
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
            tabBarIcon: ({ color }) => <Home size={23} color={color} strokeWidth={1.8} />,
          }}
        />
        <Tabs.Screen
          name="cards"
          options={{
            title: 'Cards',
            tabBarIcon: ({ color }) => <CreditCard size={23} color={color} strokeWidth={1.8} />,
          }}
        />
        <Tabs.Screen
          name="recipients"
          options={{
            title: 'Recipients',
            tabBarIcon: ({ color }) => <Users size={23} color={color} strokeWidth={1.8} />,
          }}
        />
        <Tabs.Screen
          name="payments"
          options={{
            title: 'Payments',
            tabBarIcon: ({ color }) => <ArrowLeftRight size={23} color={color} strokeWidth={1.8} />,
          }}
        />
        <Tabs.Screen name="family" options={{ href: null }} />
        <Tabs.Screen name="requests" options={{ href: null }} />
        <Tabs.Screen name="history" options={{ href: null }} />
      </Tabs>
    </View>
  );
}
