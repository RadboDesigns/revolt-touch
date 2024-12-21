
import { Stack } from "expo-router";

const Layout = () => {
  return (
    <Stack>
      <Stack.Screen name="update" options={{ headerShown: false }} />
      <Stack.Screen name="yourDesign" options={{ headerShown: false }} />
    </Stack>
  );
};

export default Layout;