import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "@/constants";

const Chat = () => {
  return (
    <SafeAreaView className="flex-1 bg-black p-5">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Text className="text-2xl text-slate-100 font-pregular">Completed Orders</Text>
        <View className="flex-1 h-fit flex justify-center items-center">
          <Image
            source={images.message}
            alt="message"
            className="w-full h-40"
            resizeMode="contain"
          />
          <Text className="text-3xl text-slate-100  font-pregular mt-3">
            No Messages Yet
          </Text>
          <Text className="text-base text-slate-100  mt-2 text-center px-7">
            Start a conversation with your friends and family
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Chat;