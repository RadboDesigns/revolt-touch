import { useSignUp } from "@clerk/clerk-expo";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";
import { ReactNativeModal } from "react-native-modal";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import { icons, images } from "@/constants";
import { fetchAPI } from "@/lib/fetch";

const SignUp = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone_number: "", // Added phone number to form state
  });
  
  const [verification, setVerification] = useState({
    state: "default",
    error: "",
    code: "",
  });

  const onSignUpPress = async () => {
    if (!isLoaded) return;
  
    try {
      // Create user with Clerk
      await signUp.create({
        emailAddress: form.email,
        password: form.password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
  
      // Send data to the Django backend
      const response = await fetch("http://192.168.1.4:8000/api/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          password: form.password,
          phone_number: form.phone_number, // Added phone number to backend request
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Failed to register client");
      }
  
      setVerification({
        ...verification,
        state: "pending",
      });
  
      Alert.alert("Success", "Registration initiated. Verify your email!");
    } catch (err: any) {
      console.log(err.message);
      Alert.alert("Error", err.message || "An error occurred during sign-up.");
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      });
      if (completeSignUp.status === "complete") {
        await fetchAPI("/(api)/user", {
          method: "POST",
          body: JSON.stringify({
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email,
            phone_number: form.phone_number, // Added phone number to API request
            clerkId: completeSignUp.createdUserId,
          }),
        });
        await setActive({ session: completeSignUp.createdSessionId });
        setVerification({
          ...verification,
          state: "success",
        });
      } else {
        setVerification({
          ...verification,
          error: "Verification failed. Please try again.",
          state: "failed",
        });
      }
    } catch (err: any) {
      setVerification({
        ...verification,
        error: err.errors[0].longMessage,
        state: "failed",
      });
    }
  };

  return (
    <ScrollView className="flex-1 bg-black">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[200px]">
          <Text className='text-4xl text-white-100 font-pregular text-center mt-10'>Welcome to</Text>
          <Text className='text-4xl text-secondary-200 font-psemibold text-center'>Radbo Designs</Text>
          <Text className='text-2xl text-white-100 mt-20 text-center'>Sign Up</Text>
        </View>
        <View className="p-5">
          <InputField
            label="First Name / Username"
            placeholder="Enter name"
            icon={icons.person}
            value={form.first_name}
            onChangeText={(value: string) => setForm({ ...form, first_name: value })}
          />
          <InputField
            label="Last Name"
            placeholder="Enter name"
            icon={icons.person}
            value={form.last_name}
            onChangeText={(value: string) => setForm({ ...form, last_name: value })}
          />
          <InputField
            label="Email"
            placeholder="Enter email"
            icon={icons.email}
            textContentType="emailAddress"
            value={form.email}
            onChangeText={(value: string) => setForm({ ...form, email: value })}
          />
          <InputField
            label="Phone Number"
            placeholder="Enter phone number"
            icon={icons.email} // Assuming you have a phone icon in your icons
            textContentType="telephoneNumber"
            keyboardType="phone-pad"
            value={form.phone_number}
            onChangeText={(value: string) => setForm({ ...form, phone_number: value })}
          />
          <InputField
            label="Create Password"
            placeholder="Enter password"
            icon={icons.lock}
            secureTextEntry={true}
            textContentType="password"
            
            value={form.password}
            onChangeText={(value: string) => setForm({ ...form, password: value })}
          />
          <CustomButton
            title="Sign Up"
            onPress={onSignUpPress}
            className="mt-6 bg-secondary-200"
          />
          <Link
            href="/sign-in"
            className="text-lg text-center text-general-200 mt-10"
          >
            Already have an account?{" "}
            <Text className="text-secondary-200">Log In</Text>
          </Link>
        </View>

        <ReactNativeModal
          isVisible={verification.state === "pending"}
          backdropColor="black"
          backdropOpacity={0.7}
          onBackdropPress={() => setVerification({ ...verification, state: "default" })}
          onModalHide={() => {
            if (verification.state === "success") {
              setShowSuccessModal(true);
            }
          }}
          children={
          <View className="bg-white-300 px-7 py-9 rounded-2xl min-h-[300px]">
            <Text className="font-pregular text-secondary-200 text-2xl mb-2">
              Verification
            </Text>
            <Text className="font-pregular mb-5">
              We've sent a verification code to {form.email}.
            </Text>
            <InputField
              label={"Code"}
              icon={icons.lock}
              placeholder={"12345"}
              value={verification.code}
              keyboardType="numeric"
              onChangeText={(code: string) =>
                setVerification({ ...verification, code })
              }
            />
            {verification.error && (
              <Text className="text-red-500 text-sm mt-1">
                {verification.error}
              </Text>
            )}
            <CustomButton
              title="Verify Email"
              onPress={onPressVerify}
              className="mt-5 bg-success-500"
            />
          </View>}
        />

        <ReactNativeModal 
          isVisible={showSuccessModal}
          children={
          <View className="bg-white-300 px-7 py-9 rounded-2xl min-h-[300px]">
            <Image
              source={images.check}
              className="w-[110px] h-[110px] mx-auto my-5"
            />
            <Text className="text-3xl font-pregular text-center">
              Verified
            </Text>
            <Text className="text-base text-gray-400 font-pregular text-center mt-2">
              You have successfully verified your account.
            </Text>
            <CustomButton
              title="Browse Home"
              onPress={() => {
                setShowSuccessModal(false);
                router.push(`/(root)/(tabs)/home`);
              }}
              className="mt-5"
            />
          </View>}
        />
      </View>
    </ScrollView>
  );
};

export default SignUp;