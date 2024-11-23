
import { Stack } from "expo-router";

const Layout = () => {
  return (
    <Stack>
      <Stack.Screen name="dairy" options={{ headerShown: false }} />
      <Stack.Screen name="flyer" options={{ headerShown: false }} />
      <Stack.Screen name="invitation" options={{ headerShown: false }} />
      <Stack.Screen name="logo" options={{ headerShown: false }} />
      <Stack.Screen name="packages" options={{ headerShown: false }} />
      <Stack.Screen name="social-media" options={{ headerShown: false }} />
    </Stack>
  );
};

export default Layout;