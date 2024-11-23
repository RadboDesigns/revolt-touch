import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { BottomSheet } from "react-native-btr";
import { images } from "@/constants";

interface ImageData {
  id: string;
  image: string; // Remote URL
  description: string;
}

const { height, width } = Dimensions.get("window");

const HEADER_MAX_HEIGHT = 200;
const HEADER_MIN_HEIGHT = 80;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const SocialMedia = () => {
  const [data, setData] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true); // Track if more data exists
  const scrollY = useRef(new Animated.Value(0)).current;
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const fetchData = async (page: number) => {
    if (isLoadingMore || !hasMore) return;

    const pageSize = 10; // Number of items per page
    if (page === 1) setIsLoading(true); // Show loader for the first load
    setIsLoadingMore(page > 1); // Show loader for pagination

    try {
      const response = await fetch(`http://192.168.1.2:8000/api/revo/flyer/?page=${page}&limit=${pageSize}`);
      const result = await response.json();

      // If no more data, stop further loading
      if (result.length < pageSize) setHasMore(false);

      const formattedData = result.map((item: any) => ({
        id: item.id.toString(),
        image: item.image,
        description: item.title,
      }));

      setData((prev) => [...prev, ...formattedData]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMoreData = () => {
    if (hasMore && !isLoadingMore) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const openBottomSheet = (item: ImageData) => {
    setSelectedImage(item);
    setIsBottomSheetVisible(true);
  };

  const closeBottomSheet = () => {
    setIsBottomSheetVisible(false);
    setSelectedImage(null);
  };

  const renderItem = ({ item }: { item: ImageData }) => (
    <TouchableOpacity onPress={() => openBottomSheet(item)} style={styles.item}>
      <Image
        source={{ uri: item.image }}
        style={[styles.image, { height: 150 }]}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  };

  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      {/* Header Image Always Visible */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <Animated.Image
          source={images.getStarted} // Replace with your header image URL
          style={[styles.headerImage, { opacity: headerOpacity }]}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Spinner Below Header While Loading */}
      {isLoading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {/* FlatList When Data is Ready */}
      {!isLoading && (
        <Animated.FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          ListFooterComponent={renderFooter}
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.5} // Load more when 50% of the content is scrolled
        />
      )}

      {/* Bottom Sheet */}
      <BottomSheet
        visible={isBottomSheetVisible}
        onBackButtonPress={closeBottomSheet}
        onBackdropPress={closeBottomSheet}
      >
        <View style={[styles.bottomSheet, { height: height * 0.8 }]}>
          {selectedImage && (
            <>
              <Image
                source={{ uri: selectedImage.image }}
                style={styles.bottomSheetImage}
              />
              <Text style={styles.description}>
                {selectedImage.description}
              </Text>
            </>
          )}
        </View>
      </BottomSheet>
    </View>
  );
};

export default SocialMedia;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loader: {
    marginTop: HEADER_MAX_HEIGHT + 20,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#000",
    overflow: "hidden",
    zIndex: 1,
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  listContent: {
    paddingTop: HEADER_MAX_HEIGHT + 10,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 10,
  },
  item: {
    flex: 1,
    margin: 5,
    borderRadius: 10,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    borderRadius: 10,
  },
  footerLoader: {
    paddingVertical: 20,
  },
  bottomSheet: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: "center",
  },
  bottomSheetImage: {
    width: "90%",
    height: "60%",
    marginBottom: 20,
    borderRadius: 10,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    color: "#333",
  },
});
