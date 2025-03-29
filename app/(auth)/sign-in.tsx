import { ScrollView, Text, View, Alert } from "react-native";
import React, { useCallback, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { icons } from "@/constants";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import { useSignIn } from "@clerk/clerk-expo";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL, API_CONFIG } from '@/config/DjangoConfig';

const SignIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const onSignInPress = useCallback(async () => {
    if (!isLoaded) return;
  
    try {
      // Step 1: Authenticate with Clerk
      const signInAttempt = await signIn.create({
        identifier: form.email,
        password: form.password,
      });
  
      if (signInAttempt.status === "complete") {
        // Step 2: Set the active session with Clerk
        await setActive({ session: signInAttempt.createdSessionId });
  
        // Step 3: Fetch user details from the backend
        const response = await fetch(`${BACKEND_URL}${API_CONFIG.ENDPOINTS.LOGIN}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: form.email, // Send the email to the backend
          }),
        });
  
        const data = await response.json();
  
        // Step 4: Check if the backend response is successful
        if (response.ok) {
          // Step 5: Store user details in AsyncStorage
          await AsyncStorage.setItem("user", JSON.stringify(data));
  
          // Step 6: Redirect to the home screen only after successful backend call
          router.replace("/(root)/(tabs)/home");
        } else {
          // Handle backend errors
          Alert.alert("Error", data.detail || "Sign-in failed.");
        }
      } else {
        // Handle incomplete sign-in attempts
        Alert.alert("Error", "Log in failed. Please try again.");
      }
    } catch (err: any) {
      // Handle any unexpected errors
      console.error(err);
      Alert.alert("Error", err.errors?.[0]?.longMessage || "Something went wrong.");
    }
  }, [isLoaded, form]);
  

  
  
  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1 bg-black">
        <View className="flex-1 justify-center items-center px-6">
          <View className="relative w-full h-[200px] mb-6">
            <Text className="text-4xl text-white-100 font-pregular text-center mt-10">
              Welcome to
            </Text>
            <Text className="text-4xl text-secondary-200 font-psemibold text-center">
              Radbo Designs
            </Text>
            <Text className="text-2xl text-white-100 mt-20 text-center">Sign In</Text>
          </View>

          <InputField
            label="Email"
            placeholder="Enter your email"
            icon={icons.email}
            textContentType="emailAddress"
            value={form.email}
            onChangeText={(value: string) => setForm({ ...form, email: value })}
          />
          <InputField
            label="Password"
            placeholder="Enter password"
            icon={icons.lock}
            secureTextEntry={true}
            textContentType="password"
            value={form.password}
            onChangeText={(value: string) => setForm({ ...form, password: value })}
          />
          <CustomButton title="Sign In" onPress={onSignInPress} className="mt-6 bg-secondary-200" />

          <Link href="/(auth)/sign-up" className="text-lg text-center text-general-200 mt-10">
            <Text>Don't have an account? </Text>
            <Text className="text-secondary-200">Sign Up</Text>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignIn;
