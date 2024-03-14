import React, {useEffect} from 'react';
import {
  Canvas,
  useImage,
  Rect,
  ImageShader,
} from '@shopify/react-native-skia';
import {StyleSheet, Dimensions, View, PixelRatio} from 'react-native';
import {FoxComponent} from './FoxComponent.tsx';
import {side, useFoxState, update_x_offset} from './Fox';
import {
  ReduceMotion,
  useEvent,
  useFrameCallback,
  useSharedValue,
  withClamp,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const pd = PixelRatio.get();
const {height, width} = Dimensions.get('window');
const GRASS_SIDE = 44;
const scaled_grass = GRASS_SIDE * pd;
const grass_count = Math.floor(width / scaled_grass);
const grass_width = grass_count * scaled_grass;

const App = () => {
  const fox_state = useFoxState(2);

  useFrameCallback(info => {
    update_x_offset(fox_state, info.timeSinceFirstFrame);
  }, true);
  const grassTerrain = useImage(require('./images/grass.png'));
  const background = useImage(require('./images/Brown.png'));
  const terrainFill = useImage(require('./images/terrainfill.png'));
  const grassX = useSharedValue(0);
  useEffect(() => {
    grassX.value = withRepeat(
      withTiming(-grass_width, {
        duration: 800,
        easing: Easing.linear,
        reduceMotion: ReduceMotion.Never,
      }),
      -1,
      false,
      undefined,
      ReduceMotion.Never,
    );
  }, [grassX]);

  return (
    <View style={styles.container}>
      <Canvas style={[StyleSheet.absoluteFill, styles.canvas]}>
        {background ? (
          <Rect x={0} y={0} width={width} height={height}>
            <ImageShader
              image={background}
              x={0}
              y={0}
              width={width}
              height={height}
              tx={'repeat'}
              ty={'repeat'}
            />
          </Rect>
        ) : null}
        <FoxComponent
          fox={fox_state}
          x={side * 2}
          y={height - scaled_grass * 2 - (side * pd) / 2 - 8 * pd}
        />
        {grassTerrain ? (
          <>
            <Rect
              x={grassX}
              y={height - scaled_grass}
              width={width * 2}
              height={60 * pd}>
              <ImageShader
                image={terrainFill}
                x={grassX}
                y={height - scaled_grass}
                width={width * 2}
                height={30 * pd}
                fit="fitHeight"
                ty="repeat"
                tx="repeat"
                fm="nearest"
              />
            </Rect>

            <Rect
              x={grassX}
              y={height - scaled_grass * 2}
              width={width * 2}
              height={scaled_grass}>
              <ImageShader
                image={grassTerrain}
                x={grassX}
                y={height - scaled_grass * 2}
                width={width * 2}
                height={scaled_grass}
                fit={'fitHeight'}
                tx="repeat"
                fm="nearest"
              />
            </Rect>
          </>
        ) : null}
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvas: {
    backgroundColor: 'orange',
  },
});

export default App;
