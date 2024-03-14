import React from 'react';
import {Canvas} from '@shopify/react-native-skia';
import {StyleSheet, Dimensions, View, PixelRatio} from 'react-native';
import {FoxComponent} from './FoxComponent.tsx';
import {side} from './Fox';

const App = () => {
  return (
    <View style={styles.container}>
      <Canvas style={[StyleSheet.absoluteFill, styles.canvas]}>
        <FoxComponent
          x={side * 2}
          y={height / 2 - (side * PixelRatio.get()) / 2}
        />
      </Canvas>
    </View>
  );
};

const {height} = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvas: {
    backgroundColor: 'transparent',
  },
});

export default App;
