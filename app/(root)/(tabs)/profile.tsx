import { useUser } from "@clerk/clerk-expo";
import { Image, ScrollView, Text, View, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import InputField from "@/components/InputField";
import { BACKEND_URL, API_CONFIG } from '@/config/DjangoConfig';


const Profile = () => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
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

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://192.168.1.2:8000/api/profile/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: profileData.email,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to update profile'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prevData => ({
      ...prevData,
      [field]: value,
    }));
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
                onChangeText={(value) => handleInputChange('first_name', value)}
                editable={isEditing}
                containerStyle={`${!isEditing ? 'opacity-50' : ''}`}
                inputStyle="text-black"
              />
              <InputField
                label="Last Name"
                value={profileData.last_name}
                onChangeText={(value) => handleInputChange('last_name', value)}
                editable={isEditing}
                containerStyle={`${!isEditing ? 'opacity-50' : ''}`}
                inputStyle="text-black"
              />
              <InputField
                label="Phone Number"
                value={profileData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                editable={isEditing}
                keyboardType="phone-pad"
                containerStyle={`${!isEditing ? 'opacity-50' : ''}`}
                inputStyle="text-black"
              />
              <InputField
                label="Email"
                value={profileData.email}
                editable={false}
                containerStyle="opacity-50"
                inputStyle="text-black"
              />
              
              {isEditing ? (
                <View className="flex-row justify-between mt-4">
                  <TouchableOpacity 
                    onPress={() => setIsEditing(false)}
                    className="bg-transparent border border-white-100/20 px-6 py-2 rounded-lg"
                  >
                    <Text className="text-white-100">Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={handleUpdateProfile}
                    className="bg-transparent border border-white-100/20 px-6 py-2 rounded-lg"
                  >
                    <Text className="text-white-100">Save</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  onPress={() => setIsEditing(true)}
                  className="bg-transparent border border-white-100/20 px-6 py-2 rounded-lg mt-4"
                >
                  <Text className="text-white-100 text-center">Edit Profile</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;