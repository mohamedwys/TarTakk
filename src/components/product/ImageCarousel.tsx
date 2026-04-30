import React from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useEnv } from '@/src/env';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  images: string[];
  aspectRatio?: number;
};

export function ImageCarousel({ images, aspectRatio = 4 / 3 }: Props) {
  const { config } = useEnv();
  const [activeIndex, setActiveIndex] = React.useState(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (index !== activeIndex) setActiveIndex(index);
  };

  const containerHeight = SCREEN_WIDTH / aspectRatio;
  const safeImages = images.length > 0 ? images : [''];

  return (
    <View style={{ width: SCREEN_WIDTH, height: containerHeight, backgroundColor: config.theme.surfaceMuted }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {safeImages.map((uri, idx) => (
          <Image
            key={`${idx}-${uri}`}
            source={uri ? { uri } : undefined}
            style={{ width: SCREEN_WIDTH, height: containerHeight }}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      {safeImages.length > 1 && (
        <View style={styles.dotsContainer} pointerEvents="none">
          {safeImages.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                {
                  backgroundColor: idx === activeIndex ? config.theme.primary : 'rgba(255,255,255,0.6)',
                  width: idx === activeIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dotsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
