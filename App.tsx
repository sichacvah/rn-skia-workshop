import React, {useCallback} from 'react';
import {Canvas, useImage, Rect, ImageShader} from '@shopify/react-native-skia';
import {
  StyleSheet,
  Dimensions,
  View,
  PixelRatio,
  TouchableWithoutFeedback,
} from 'react-native';
import {FoxComponent} from './FoxComponent.tsx';
import {set_y_state, side, update_fox_state, y_jump, y_walk} from './Fox';
import {useFrameCallback} from 'react-native-reanimated';
import {update_enemy, update_terrains, useGameState} from './GameState';
import {Terrain, GRASS_SIDE} from './Terrain';
import {EnemyComponent} from './EnemyComponent';
import {LivesCount} from './LivesCount.tsx';

const pd = PixelRatio.get();
const {height, width} = Dimensions.get('window');

export function is_overlaping1D(
  xmin1: number,
  xmax1: number,
  xmin2: number,
  xmax2: number,
): boolean {
  'worklet';
  return xmax1 >= xmin2 && xmax2 >= xmin1;
}

export function is_overlaping2D(
  ex1: number,
  ey1: number,
  ex2: number,
  ey2: number,
  fx1: number,
  fy1: number,
  fx2: number,
  fy2: number,
): boolean {
  'worklet';
  return (
    is_overlaping1D(ex1, ex2, fx1, fx2) && is_overlaping1D(ey1, ey2, fy1, fy2)
  );
}

const App = () => {
  const terrain_size = GRASS_SIDE * 2;
  const game_state = useGameState({
    width: width / pd,
    height: height / pd,
    terrain_size: terrain_size,
    fox_velocity: 0.2 / pd,
    fox_state: y_walk,
    fox_x: side,
    fox_y: height / pd - terrain_size - side,
    initial_lives: 3,
  });

  useFrameCallback(info => {
    game_state.modify(gs => {
      'worklet';

      const velocity =
        gs.fox_state.ystate === y_jump
          ? gs.game_decl.fox_velocity * 1.5
          : gs.game_decl.fox_velocity;
      update_fox_state(gs.fox_state, gs.prev_timestamp, velocity, info);
      update_enemy(gs, info, velocity);
      update_terrains(gs, velocity, info);
      const ex0 = gs.enemy.x;
      const ey0 = gs.enemy.y;
      const fx0 = gs.fox_state.x + 4;
      const fy0 = gs.fox_state.y;
      const ex1 = gs.enemy.x + gs.enemy.width;
      const ey1 = gs.enemy.y + gs.enemy.height;
      const fx1 = gs.fox_state.x + side - 8;
      const fy1 = gs.fox_state.y + side;
      if (
        !gs.enemy.is_hitted &&
        is_overlaping2D(ex0, ey0, ex1, ey1, fx0, fy0, fx1, fy1)
      ) {
        gs.enemy.is_hitted = true;
        gs.lives -= 1;
      }
      return gs;
    });
  }, true);
  const background = useImage(require('./images/Brown.png'));
  const pressHandler = useCallback(() => {
    game_state.modify(gs => {
      'worklet';
      if (!gs.fox_state.jump_state || gs.fox_state.jump_state === 4) {
        gs.fox_state.jump_state = 3;
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
          <EnemyComponent game_state={game_state} />
          <FoxComponent game_state={game_state} />
          <Terrain game_state={game_state} />
          <LivesCount game_state={game_state} />
        </Canvas>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lives: {
    position: 'absolute',
    top: 24,
    left: 0,
  },
  canvas: {
    backgroundColor: 'orange',
  },
});

export default App;
