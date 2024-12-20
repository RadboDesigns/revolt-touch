import { useUser } from "@clerk/clerk-expo";
import { Image, ScrollView, Text, View, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import InputField from "@/components/InputField";

const Profile = () => {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
      const response = await fetch('http://192.168.1.2:8000/api/profile/', {
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

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView className="px-5" contentContainerStyle={{ paddingBottom: 120 }}>
        <Text className="text-2xl font-pregular text-white-100 my-5">My profile</Text>

        <View className="flex items-center justify-center my-5">
          <Image
            source={{ uri: user?.imageUrl }}
            style={{ width: 110, height: 110, borderRadius: 55 }}
            className="rounded-full border-[3px] border-white-100 shadow-sm"
          />
        </View>

        <View className="flex flex-col bg-primary-100 rounded-lg px-5 py-3">
          {isLoading ? (
            <Text className="text-white-100">Loading...</Text>
          ) : (
            <>
              <InputField
                label="First Name"
                value={profileData.first_name}
                editable={isEditing}
              />
              <InputField
                label="Last Name"
                value={profileData.last_name}
                editable={isEditing}
              />
              <InputField
                label="Phone Number"
                value={profileData.phone}
                editable={isEditing}
              />
              <InputField
                label="Email"
                value={profileData.email}
                editable={false}
              />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;