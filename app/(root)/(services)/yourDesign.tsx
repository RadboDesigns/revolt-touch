import { Image, View, Text, Pressable, Alert } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from 'expo-router';
import { icons } from '@/constants';
import { useState, useEffect } from 'react';
import CustomButton from '@/components/CustomButton';

const BASE_URL = 'http://192.168.1.2:8000';

const YourDesign = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const params = useLocalSearchParams();


  const fetchPreviewImage = async (orderId: string) => {
    console.log('Starting fetchPreviewImage with orderId:', orderId);

    setIsLoading(true);
    try {
      const apiUrl = `${BASE_URL}/api/order/preview_image/`;
      const requestBody = { order_id: orderId };
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch preview image');
      }
      
      if (data.preview_image) {
        // Construct full URL for the image
        const fullImageUrl = data.preview_image.startsWith('http') 
          ? data.preview_image 
          : `${BASE_URL}${data.preview_image}`;
        console.log('Full image URL:', fullImageUrl);
        setPreviewImage(fullImageUrl);
      } else {
        console.log('No preview image in response data');
        Alert.alert('Error', 'No preview image found');
      }
    } catch (error) {
      console.error('Error in fetchPreviewImage:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to fetch preview image');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('useEffect triggered with params:', params); // Debug log
    if (params.order_id) {
      const orderId = Array.isArray(params.order_id) ? params.order_id[0] : params.order_id;
      console.log('Parsed orderId:', orderId); // Debug log
      fetchPreviewImage(orderId);
    } else {
      console.log('No order_id in params'); // Debug log
    }
  }, [params.order_id]);

  useEffect(() => {
    console.log('Component mounted with params:', params);
  }, []);

  return (
    <View className="flex-1 bg-black">
      <View className="flex-row items-center justify-center mt-5">
        <Pressable className="absolute left-5" onPress={() => router.back()}>
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
          {isLoading ? (
            <View className="flex-1 justify-center items-center">
              <Text className="text-white">Loading...</Text>
            </View>
          ) : previewImage ? (
            <>
              <View className="flex-1 justify-center items-center mb-6">
                <Image
                  source={{ uri: previewImage }}
                  style={{ width: '100%', height: '75%' }}
                  resizeMode="contain"
                />
              </View>

              <View className="flex-row justify-center space-x-4 mb-8">
                <CustomButton
                  title="Download"
                  // onPress={handleDownload}
                  className="flex-1 bg-secondary-200"
                />
                <CustomButton
                  title="Update"
                  onPress={() => router.push({
                    pathname: '/update',
                    params: { previewImage },
                  })}
                  className="flex-1 bg-secondary-200"
                />
              </View>
            </>
          ) : (
            <View className="flex-1 justify-center items-center">
              <Text className="text-white">No image available</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

export default YourDesign;