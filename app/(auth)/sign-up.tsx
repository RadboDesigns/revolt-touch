import { useSignUp } from "@clerk/clerk-expo";
import { Link, router } from "expo-router";
import { useState, useRef } from "react";
import { Alert, Image, ScrollView, Text, View, TextInput, Keyboard } from "react-native";
import { ReactNativeModal } from "react-native-modal";
import { KeyboardAvoidingView, Platform } from "react-native";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import { icons, images } from "@/constants";
import { BACKEND_URL, API_CONFIG } from '@/config/DjangoConfig';


const SignUp = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [backendRegistrationComplete, setBackendRegistrationComplete] = useState(false);
  const otpInputRef = useRef(null);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone_number: "",
  });
  
  const [verification, setVerification] = useState({
    state: "default",
    error: "",
    code: "",
    isSubmitting: false,
    attempts: 0
  });

  const onSignUpPress = async () => {
    if (!isLoaded) {
      Alert.alert("Error", "Authentication system not ready");
      return;
    }
  
    try {
      // First create Clerk user
      const clerkResponse = await signUp.create({
        emailAddress: form.email,
        password: form.password,
      });

      console.log("Clerk signup response:", clerkResponse);
      
      if (!clerkResponse) {
        throw new Error("Failed to create Clerk account");
      }

      // Then register in backend
      const response = await fetch(`${BACKEND_URL}${API_CONFIG.ENDPOINTS.REGISTER}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          password: form.password,
          phone_number: form.phone_number,
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Failed to register in backend");
      }

      console.log("Backend registration complete");
      setBackendRegistrationComplete(true);

      // Prepare verification
      const verificationResponse = await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      console.log("Verification preparation response:", verificationResponse);
  
      setVerification({
        ...verification,
        state: "pending",
        isSubmitting: false,
        error: "",
        attempts: 0
      });
  
      Alert.alert(
        "Verification Required", 
        "Please check your email for a verification code and enter it in the next screen."
      );
    } catch (err: any) {
      console.error("Signup error:", err);
      Alert.alert(
        "Registration Error", 
        err.message || "An error occurred during sign-up. Please try again."
      );
      
      // Reset states on error
      setBackendRegistrationComplete(false);
      setVerification({
        ...verification,
        state: "default",
        error: "",
        isSubmitting: false,
        attempts: 0
      });
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded || verification.isSubmitting) return;
    
    if (verification.code.length !== 6) {
      setVerification({
        ...verification,
        error: "Please enter a valid 6-digit code"
      });
      return;
    }

    try {
      setVerification(prev => ({
        ...prev,
        isSubmitting: true,
        error: "",
        attempts: prev.attempts + 1
      }));

      console.log("Attempting verification with code:", verification.code);
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      });
      
      console.log("Verification response:", completeSignUp);

      if (completeSignUp.status === "complete" && backendRegistrationComplete) {
        await setActive({ session: completeSignUp.createdSessionId });
        setVerification({
          ...verification,
          state: "success",
          isSubmitting: false
        });
        setShowSuccessModal(true);
      } else {
        throw new Error("Verification incomplete");
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      
      // Handle max attempts
      if (verification.attempts >= 3) {
        Alert.alert(
          "Too Many Attempts",
          "Please try signing up again with a new verification code.",
          [
            {
              text: "OK",
              onPress: () => {
                setVerification({
                  state: "default",
                  error: "",
                  code: "",
                  isSubmitting: false,
                  attempts: 0
                });
                setBackendRegistrationComplete(false);
              }
            }
          ]
        );
        return;
      }

      setVerification(prev => ({
        ...prev,
        error: err.errors?.[0]?.longMessage || "Verification failed. Please try again.",
        state: "pending",
        isSubmitting: false
      }));
    }
  };

  const onModalHide = () => {
    // Only dismiss keyboard when actually closing the modal
    if (verification.state !== "pending") {
      Keyboard.dismiss();
    }
  };

  const VerificationModalContent = () => (
    <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : undefined}
    style={{ flex: 1, justifyContent: "center" }}
  >
    <View className="bg-white-300 px-7 py-9 rounded-2xl min-h-[300px]">
      <Text className="font-pregular text-secondary-200 text-2xl mb-2">
        Verification
      </Text>
      <Text className="font-pregular mb-5">
        We've sent a verification code to {form.email}
      </Text>
      <View>
        <Text className="text-sm text-gray-600 mb-2">Code</Text>
        <TextInput
          ref={otpInputRef}
          className="h-12 bg-white border border-gray-300 rounded-lg px-4"
          value={verification.code}
          onChangeText={(code: string) => {
            const numericCode = code.replace(/[^0-9]/g, '');
            setVerification(prev => ({ ...prev, code: numericCode, error: "" }));
          }}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="Enter 6-digit code"
          editable={!verification.isSubmitting}
          autoFocus={true}
          returnKeyType="done"
          blurOnSubmit={false}
        />
      </View>
      {verification.error && (
        <Text className="text-red-500 text-sm mt-1">
          {verification.error}
        </Text>
      )}
      <CustomButton
        title={verification.isSubmitting ? "Verifying..." : "Verify Email"}
        onPress={() => {
          Keyboard.dismiss();
          onPressVerify();
        }}
        disabled={verification.isSubmitting || verification.code.length !== 6}
        className={`mt-5 ${verification.isSubmitting ? 'opacity-70' : ''} bg-success-500`}
      />
      <Text className="text-sm text-gray-500 text-center mt-3">
        Attempts remaining: {3 - verification.attempts}
      </Text>
    </View>
  </KeyboardAvoidingView>
    
  );

  const SuccessModalContent = () => (
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
          router.push('/(root)/(tabs)/home');
        }}
        className="mt-5"
      />
    </View>
  );

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
            icon={icons.email}
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
          onModalHide={onModalHide}
          avoidKeyboard={true}
          onBackdropPress={() => {
            Keyboard.dismiss();
            setVerification({ ...verification, state: "default" });
          }}
        >
          <VerificationModalContent />
        </ReactNativeModal>

        <ReactNativeModal 
          isVisible={showSuccessModal}
          backdropColor="black"
          backdropOpacity={0.7}
        >
          <SuccessModalContent />
        </ReactNativeModal>
      </View>
    </ScrollView>
  );
};

export default SignUp;