import React, {useCallback} from 'react';
import {
  Canvas,
  useImage,
  Rect,
  ImageShader,
  SharedValueType,
  SkImage,
} from '@shopify/react-native-skia';
import {
  StyleSheet,
  Dimensions,
  View,
  PixelRatio,
  TouchableWithoutFeedback,
} from 'react-native';
import {FoxComponent} from './FoxComponent.tsx';
import {set_y_state, side, update_fox_state, update_x_offset, y_jump, y_walk} from './Fox';
import {useFrameCallback} from 'react-native-reanimated';
import {update_terrains, useGameState} from './GameState';
import {Terrain, GRASS_SIDE} from './Terrain';

const pd = PixelRatio.get();
const {height, width} = Dimensions.get('window');

const App = () => {
  const terrain_size = GRASS_SIDE * pd * 2;
  const game_state = useGameState({
    width,
    height,
    terrain_size: terrain_size,
    fox_velocity: 0.2,
    fox_state: y_walk,
    fox_x: side * 2,
    fox_y: height - terrain_size - (side * pd) / 2 - 8 * pd,
    pd,
  });

  useFrameCallback(info => {
    game_state.modify(gs => {
      'worklet';
      update_fox_state(
        gs.fox_state,
        gs.prev_timestamp,
        gs.game_decl.pd,
        gs.game_decl.fox_velocity / 1.75,
        info,
      );
      update_terrains(gs, info);
      return gs;
    });
  }, true);
  const background = useImage(require('./images/Brown.png'));
  const pressHandler = useCallback(() => {
    game_state.modify(gs => {
      'worklet';
      if (!gs.fox_state.jump_state) {
        gs.fox_state.jump_state = 1;
        set_y_state(gs.fox_state, y_jump);
      }
      return gs;
    });
  }, [game_state]);

  return (
    <TouchableWithoutFeedback onPress={pressHandler}>
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
          <FoxComponent game_state={game_state} />
          <Terrain game_state={game_state} />
        </Canvas>
      </View>
    </TouchableWithoutFeedback>
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
