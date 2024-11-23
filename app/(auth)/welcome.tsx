import { Text, TouchableOpacity, View, Image } from 'react-native';
import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Swiper from 'react-native-swiper';
import { onboarding } from '@/constants';
import CustomButton from '@/components/CustomButton';

const Home = () => {
  const swiperRef = useRef<Swiper>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isLastSlide = activeIndex === onboarding.length - 1;

  return (
    <SafeAreaView className="flex-1">
      {/* Skip button positioned at top-right */}
      <TouchableOpacity
        onPress={() => router.replace('/(auth)/sign-in')}
        className="absolute top-5 right-5 z-10 p-3"
      >
        <Text className="text-black text-md">Skip</Text>
      </TouchableOpacity>

      <Swiper
        ref={swiperRef}
        loop={false}
        dot={<View className="w-[32px] h-[4px] mx-1 bg-[#E2E8F0] rounded-full" />}
        activeDot={<View className="w-[32px] h-[4px] mx-1 bg-[#0286FF] rounded-full" />}
        onIndexChanged={(index) => setActiveIndex(index)}
      >
        {onboarding.map((item) => (
          <View key={item.id} className="flex-1 items-center justify-center p-5">
            <Image source={item.image}
                   className='w-full h-[300px]'
                   resizeMode='contain'></Image>
            <View className="flex flex-row items-center justify-center w-full mt-10">
              <Text className="text-black text-3xl font-bold mx-10 text-center">
                {item.title}
              </Text>
            </View>
            <Text className="text-md font-JakartaSemiBold text-center text-[#858585] mx-10 mt-3">
              {item.description}
            </Text>
          </View>
        ))}
      </Swiper>

      <View className="flex items-center justify-center mt-5 pb-10">
        <CustomButton
          title={isLastSlide ? "Get Started" : "Next"}
          onPress={() => isLastSlide ? router.replace("/(auth)/sign-up") : swiperRef.current?.scrollBy(1)}
          className="w-11/12"  // Adjusted width for centered alignment
        />
      </View>
    </SafeAreaView>
  );
};

export default Home;
