
import { router } from "expo-router";
import { Alert, Image, Text, View } from "react-native";

import CustomButton from "@/components/CustomButton";
import { icons } from "@/constants";
import { googleOAuth } from "@/lib/auth";

const OAuth = () => {
  const handleGoogleSignIn = async() => {};

  return (
    <View>
      <View className="flex flex-row justify-center items-center mt-4 gap-x-3">
        <View className="flex-1 h-[1px] bg-primary" />
        <Text className="text-lg">Or</Text>
        <View className="flex-1 h-[1px] bg-primary" />
      </View>

      <CustomButton 
          className="mt-5 w-full shadow-none"
          title="Log In with Google"
          IconLeft={() => (
            <Image 
              source={icons.google}
              resizeMode="contain"
              className="w-5 h-5 mx-2"
            />
          )}
          bgVariant="outline"
          textVariant="primary"
          onPress={handleGoogleSignIn}
      />

    </View>
  );
};

export default OAuth;