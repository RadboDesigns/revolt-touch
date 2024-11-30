import { useUser } from "@clerk/clerk-expo";
import { Image, ScrollView, Text, View, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";

import InputField from "@/components/InputField";

const Profile = () => {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    username: user?.username || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.primaryEmailAddress?.emailAddress || "",
  });

  const handleInputChange = (key, value) => {
    setProfileData({ ...profileData, [key]: value });
  };

  const saveProfileUpdates = async () => {
    try {
      const response = await fetch("http://192.168.1.2:8000/api/update_profile/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Profile updated successfully.");
        setIsEditing(false);
      } else {
        Alert.alert("Error", data.error || "Failed to update profile.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "An unexpected error occurred.");
    }
  };

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
        <InputField
            label="User Name"
            value={profileData.username}
            onChangeText={(value) => handleInputChange("username", value)}
            editable={isEditing}
          />
          <InputField
            label="First Name"
            value={profileData.firstName}
            onChangeText={(value) => handleInputChange("firstName", value)}
            editable={isEditing}
          />
          <InputField
            label="Last Name"
            value={profileData.lastName}
            onChangeText={(value) => handleInputChange("lastName", value)}
            editable={isEditing}
          />
          <InputField
            label="Email"
            value={profileData.email}
            onChangeText={(value) => handleInputChange("email", value)}
            editable={isEditing}
          />
        </View>

        <TouchableOpacity onPress={isEditing ? saveProfileUpdates : () => setIsEditing(true)}>
          <Text className="text-lg text-center text-secondary-200 mt-5">
            {isEditing ? "Save" : "Edit"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
