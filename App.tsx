import React, {useMemo} from 'react';
import {Canvas} from '@shopify/react-native-skia';
import {
  StyleSheet,
  Dimensions,
  View,
  PixelRatio,
  TouchableWithoutFeedback,
} from 'react-native';
import {FoxComponent} from './FoxComponent.tsx';
import {side, y_sleep} from './Fox';
import {useFrameCallback} from 'react-native-reanimated';
import {PressHandler, game_update, useGameState} from './GameState';
import {Terrain, GRASS_SIDE} from './Terrain';
import {EnemyComponent} from './EnemyComponent';
import {LivesCount} from './LivesCount.tsx';
import {StartFlagComponent} from './StartFlagComponent.tsx';
import {StartTapLabel} from './StartTapLabel.tsx';
import {GameOverLabel} from './GameOver.tsx';
import {CountLabel} from './CountLabel.tsx';
import {Background} from './Background.tsx';

const pd = PixelRatio.get();
const {height, width} = Dimensions.get('window');

const App = () => {
  const terrain_size = GRASS_SIDE;
  const game_state = useGameState({
    width: width / pd,
    height: height / pd,
    terrain_size: terrain_size,
    fox_velocity: 0.2 / pd,
    fox_state: y_sleep,
    fox_x: side,
    fox_y: height / pd - terrain_size - side,
    initial_lives: 3,
  });

  useFrameCallback(info => {
    // @ts-ignore
    game_state.modify(gs => {
      'worklet';
      return game_update(gs, info);
    });
  }, true);
  const pressHandler = useMemo(
    () => new PressHandler(game_state),
    [game_state],
  );

  return (
    <TouchableWithoutFeedback onPress={pressHandler.onPress}>
      <View style={styles.container}>
        <Canvas style={[StyleSheet.absoluteFill, styles.canvas]}>
          <Background width={width} height={height} />
          <EnemyComponent game_state={game_state} />
          <StartFlagComponent game_state={game_state} />
          <FoxComponent game_state={game_state} />
          <Terrain game_state={game_state} />
          <LivesCount game_state={game_state} />
        </Canvas>
        <CountLabel gs={game_state} />
        <StartTapLabel gs={game_state} />
        <GameOverLabel gs={game_state} />
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
