import { Image, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from 'expo-router';
import { icons } from '@/constants';
import CustomButton from '@/components/CustomButton';

const YourDesign = () => {
  const params = useLocalSearchParams();
  const previewImage = Array.isArray(params.previewImage) 
    ? params.previewImage[0] 
    : params.previewImage;
  
  console.log("Preview Image URL:", previewImage); // Debugging

  if (!previewImage) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <Text className="text-white">No image available</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center justify-center mt-5">
        <Pressable
          className="absolute left-5"
          onPress={() => router.back()}
        >
          <Image
            source={icons.backArrow}
            style={{
              width: 24,
              height: 24,
              tintColor: 'white',
            }}
          />
        </Pressable>
        <Text className="text-white-100 font-pregular text-2xl">Your Design</Text>
      </View>

      <SafeAreaView className="flex-1">
        <View className="flex-1 p-4">
          {/* Preview Image */}
          <View className="flex-1 justify-center items-center mb-6">
            <Image
              source={{ uri: previewImage }}
              style={{ width: '100%', height: '75%' }} // Dimensions
              resizeMode="contain"
              onError={(error) => console.log('Image loading error:', error.nativeEvent.error)}
            />
          </View>

          {/* Buttons Container */}
          <View className="flex-row justify-center space-x-4 mb-8">
            <CustomButton
              title="Download"
              onPress={() => console.log('Download pressed')}
              className="flex-1 bg-secondary-200"
            />
            <CustomButton
              title="Update"
              onPress={() => router.push({
                pathname: '/update',
                params: { previewImage }
              })}
              className="flex-1 bg-secondary-200"
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default YourDesign;
