
import { Stack } from "expo-router";

const Layout = () => {
  return (
    <Stack>
      <Stack.Screen name="servicess" options={{ headerShown: false }} />
      <Stack.Screen name="booking" options={{ headerShown: false }} />
    </Stack>
  );
};

export default Layout;