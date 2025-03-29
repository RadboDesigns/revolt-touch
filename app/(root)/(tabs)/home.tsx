import { icons } from '@/constants';
import { SafeAreaView, Text, View, Image, FlatList, TouchableOpacity, Alert, Modal } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useUser } from "@clerk/clerk-expo";
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { ImageSourcePropType } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL, API_CONFIG } from '@/config/DjangoConfig';


// Type definitions
interface Banner {
  id: number;
  image: ImageSourcePropType;
}

interface Service {
  id: number;
  text: string;
  icon: ImageSourcePropType;
  bgImage: ImageSourcePropType;
  route: string;
}

interface Design {
  id: number;
  name: string;
  icon: ImageSourcePropType;
  route: string;
}

// Data
const banners: Banner[] = [
  { id: 1, image: require('@/assets/images/banner1.png') },
  { id: 2, image: require('@/assets/images/banner1.png') },
  { id: 3, image: require('@/assets/images/banner1.png') },
  { id: 4, image: require('@/assets/images/banner1.png') },
  { id: 5, image: require('@/assets/images/banner1.png') },
];

const services: Service[] = [
  { id: 1, text: 'LOGO DESIGN', icon: icons.logo, bgImage: require('@/assets/images/logo_design.png'), route: "(services)/servicess" },
  { id: 2, text: 'GRAPHIC DESIGN', icon: icons.graphic, bgImage: require('@/assets/images/graphic_design.png'), route: "(services)/servicess" },
  { id: 3, text: 'WEBSITE & APP', icon: icons.wedsite, bgImage: require('@/assets/images/website.png'), route: "(services)/servicess" },
  { id: 4, text: 'SOCIAL NETWORK', icon: icons.social, bgImage: require('@/assets/images/social_networking.png'), route: "(services)/servicess" },
  { id: 5, text: 'PACKAGING', icon: icons.packaging, bgImage: require('@/assets/images/packging.png'), route: "(services)/servicess" },
  { id: 6, text: 'INVITATION', icon: icons.invitation, bgImage: require('@/assets/images/Invitation.png'), route: "(services)/servicess" },
];

const designs: Design[] = [
  { id: 1, name: 'Social Media', icon: icons.social, route: "(designs)/social-media" },
  { id: 2, name: 'Logo ', icon: icons.logo, route: "(designs)/logo" },
  { id: 3, name: 'Packageing', icon: icons.packag, route: "(designs)/packages" },
  { id: 4, name: 'Flyers', icon: icons.flyer, route: "(designs)/flyer" },
  { id: 5, name: 'Dairy ', icon: icons.diary, route: "(designs)/dairy" },
  { id: 6, name: 'Invitation ', icon: icons.invitation, route: "(designs)/invitation" },
];


interface SectionTitleProps {
  title: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ title }) => (
  <View className="px-5">
    <Text className="text-left text-white-200 font-pregular text-xl">{title}</Text>
    <View className="h-[1px] bg-secondary-200 w-20 mt-2" />
  </View>
);

export default function Page() {
  const { user, signOut } = useUser();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileData, setProfileData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: user?.primaryEmailAddress?.emailAddress || "",
    phone: "",
  });

  const fetchUserDetails = async () => {
    if (!profileData.email) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}${API_CONFIG.ENDPOINTS.PROFILE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: profileData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user details');
      }

      setProfileData(prevData => ({
        ...prevData,
        ...data,
      }));
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to fetch user details'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const handleLogout = async () => {
    try {
      // Clear AsyncStorage data
      await AsyncStorage.clear();
      
      // Sign out from Clerk
      await signOut();
      
      // Navigate to sign-in screen
      router.replace('/(auth)/sign-in');
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to log out. Please try again.'
      );
    }
  };
  
  const HeaderSection: React.FC = () => (
    <View className="flex flex-row justify-between items-center px-5 mt-10">
      <View>
        <Text className="text-left text-3xl font-pregular text-white-100">
          Hi, <Text className="text-secondary-200">{profileData.username || 'User'}</Text>
        </Text>
        <Text className="text-left text-sm font-pregular text-white-200">
          Ready to elevate your brand? Let's get started!
        </Text>
      </View>
      <TouchableOpacity onPress={() => setShowProfileMenu(!showProfileMenu)}>
        <Image
          source={user?.imageUrl ? { uri: user.imageUrl } : icons.person}
          className="h-12 w-12 border-2 border-primary-100 rounded-full"
        />
      </TouchableOpacity>
    </View>
  );
  
  // Profile Menu Dropdown
  const ProfileMenu = () => (
    <Modal
      visible={showProfileMenu}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowProfileMenu(false)}
    >
      <TouchableOpacity 
        style={{ flex: 1 }}
        activeOpacity={1} 
        onPress={() => setShowProfileMenu(false)}
      >
        <View className="absolute top-24 right-5 bg-primary-100 rounded-lg p-2 shadow-lg z-50">
          <TouchableOpacity 
            className="flex-row items-center px-4 py-3 border-b border-white-300"
            onPress={() => {
              setShowProfileMenu(false);
              router.push('/profile');
            }}
          >
            <Image source={icons.person} className="w-5 h-5 mr-2" />
            <Text className="text-white-100">Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-row items-center px-4 py-3"
            onPress={() => {
              setShowProfileMenu(false);
              handleLogout();
            }}
          >
            <Image source={icons.logout || icons.person} className="w-5 h-5 mr-2" />
            <Text className="text-white-100">Logout</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const handleServicePress = (route: string) => {
    router.push(route as any);
  };

  const renderServiceItem = ({ item }: { item: Service }) => (
    <TouchableOpacity
      onPress={() => handleServicePress(item.route)}
      className="flex-1 m-2 border-[1px] border-white-300 rounded-lg overflow-hidden h-32 bg-primary-200"
    >
      <BlurView intensity={50} style={{ flex: 1 }} tint="dark">
        <Image
          source={item.bgImage}
          className="absolute top-0 left-0 w-full h-full object-cover"
          blurRadius={2}
        />
        <View className="flex-row justify-between items-center px-4 h-full overflow-visible">
          <Text className="text-white-200 font-psemibold text-sm text-left">
            {item.text}
          </Text>
          <Image source={item.icon} className="w-8 h-8" resizeMode="contain" />
        </View>
      </BlurView>
    </TouchableOpacity>
  );

  const renderDesignItem = ({ item }: { item: Design }) => (
    <TouchableOpacity
      onPress={() => router.push(item.route as any)}
      className="flex-1 items-center justify-center p-2"
    >
      <View className="bg-primary-300 rounded-full p-5 overflow-visible">
        <Image source={item.icon} className="w-8 h-8" />
      </View>
      <Text className="text-white-200 font-pregular mt-2 text-sm">{item.name}</Text>
    </TouchableOpacity>
  );

  const renderRecentWorkBanner = ({ item, index }: { item: Banner; index: number }) => (
    <Image
      source={item.image}
      className={`h-[172px] ${
        index === 2 ? "w-[52px]" : "w-[173px]"
      } object-cover rounded-md`}
      style={{
        marginRight: index !== banners.length - 1 ? 8 : 0, // Add spacing between banners except the last one
      }}
    />
  );
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
      <FlatList
        ListHeaderComponent={
          <>
            <HeaderSection />
            {/* Banner Scroller */}
            <View className="mt-10 bg-black">
              <FlatList
                data={banners}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }: { item: Banner }) => (
                  <Image
                    source={item.image}
                    className="w-screen h-70 object-cover"
                  />
                )}
                keyExtractor={(item) => item.id.toString()}
              />
            </View>
        
            {/* Services Section Title */}
            <View className="mt-10">
              <SectionTitle title="Our Services" />
            </View>
          </>
        }
        data={services}
        numColumns={2}
        renderItem={renderServiceItem}
        keyExtractor={(item) => item.id.toString()}
        ListFooterComponent={
          <>
            {/* Designs Section */}
            <View className="mt-10">
              <SectionTitle title="Check Our Designs" />
              <View className="mt-4 mx-5 bg-primary-100 p-4 rounded-lg">
                <FlatList
                  data={designs}
                  numColumns={3}
                  scrollEnabled={false}
                  renderItem={renderDesignItem}
                  keyExtractor={(item) => item.id.toString()}
                />
              </View>
            </View>
  
            {/* Recent Works Section */}
            <View className="mt-10">
              <SectionTitle title="Our Recent Works" />
              <FlatList
                data={banners}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item, index }) => (
                  <View
                    style={{
                      width: 173, // Full image width
                      height: 172,
                      marginLeft: index === 0 ? 10 : 20, // Add gap between items
                    }}
                  >
                    <Image
                      source={item.image}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 8,
                        resizeMode: 'cover',
                      }}
                    />
                  </View>
                )}
                contentContainerStyle={{
                  paddingHorizontal: 10, // Padding for the entire list
                }}
                snapToAlignment="start" // Ensure images snap into place
                decelerationRate="fast"
                snapToInterval={173 + 20} // Adjust for image width + gap
              />
            </View>

            {/* Note Section */}
            <View className="mt-10 mx-5 border-[1px] border-white-300 rounded-lg p-4">
              <Text className="text-center text-secondary-200 text-lg underline font-pregular">
                Note
              </Text>
              <Text className="mt-2 text-center text-white-100 font-pregular">
                All Services will commence only After payment is received
              </Text>
            </View>
  
            <View className="h-40" />
          </>
        }
      />
      
      {/* Profile Menu Modal */}
      <ProfileMenu />
    </SafeAreaView>
  );
}