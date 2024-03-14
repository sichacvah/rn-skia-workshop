import React, { useEffect } from 'react';
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
import {side, update_x_offset, y_walk} from './Fox';
import {useFrameCallback, useDerivedValue} from 'react-native-reanimated';
import {GameState, update_terrains, useGameState} from './GameState.ts';

const pd = PixelRatio.get();
const {height, width} = Dimensions.get('window');
const GRASS_SIDE = 44;
const scaled_grass = GRASS_SIDE * pd;

type TerrainProps = {
  game_state: SharedValueType<GameState>;
};
type TerrainPartProps = {
  fill: SkImage;
  grass: SkImage;
  x: SharedValueType<number>;
  y: SharedValueType<number>;
  y_fill: SharedValueType<number>;
};

function TerrainPart(props: TerrainPartProps) {
  useEffect(() => {
    console.log('PART_RERENDER')
  });
  const {x, y, fill, y_fill, grass} = props;
  return (
    <>
      <Rect x={x} y={y_fill} width={width} height={60 * pd}>
        <ImageShader
          image={fill}
          x={x}
          y={y_fill}
          width={width}
          height={30 * pd}
          fit="fitHeight"
          ty="repeat"
          tx="repeat"
          fm="nearest"
        />
      </Rect>

      <Rect x={x} y={y} width={width} height={scaled_grass}>
        <ImageShader
          image={grass}
          x={x}
          y={y}
          width={width}
          height={scaled_grass}
          fit={'fitHeight'}
          tx="repeat"
          fm="nearest"
        />
      </Rect>
    </>
  );
}

function Terrain(props: TerrainProps) {
  const grassTerrain = useImage(require('./images/grass.png'));
  const terrainFill = useImage(require('./images/terrainfill.png'));

  const leftX = useDerivedValue(() => props.game_state.value.terrains[0].x);
  const y = useDerivedValue(() => props.game_state.value.terrains[0].y);
  const y_fill = useDerivedValue(() => y.value + scaled_grass);

  const centerX = useDerivedValue(() => props.game_state.value.terrains[1].x);
  const rightX = useDerivedValue(() => props.game_state.value.terrains[2].x);

  if (!grassTerrain || !terrainFill) {
    return null;
  }
  return (
    <>
      <TerrainPart
        x={leftX}
        y={y}
        y_fill={y_fill}
        grass={grassTerrain}
        fill={terrainFill}
      />
      <TerrainPart
        x={centerX}
        y={y}
        y_fill={y_fill}
        grass={grassTerrain}
        fill={terrainFill}
      />
      <TerrainPart
        x={rightX}
        y={y}
        y_fill={y_fill}
        grass={grassTerrain}
        fill={terrainFill}
      />
    </>
  );
}

const App = () => {
  const game_state = useGameState({
    width,
    height,
    terrain_size: scaled_grass * 2,
    fox_velocity: 0.1,
    fox_state: y_walk,
  });

  useFrameCallback(info => {
    game_state.modify(gs => {
      'worklet';
      update_x_offset(gs.fox_state, info.timeSinceFirstFrame);
      update_terrains(gs, info);
      return gs;
    });
  }, true);
  const background = useImage(require('./images/Brown.png'));

  return (
    <TouchableWithoutFeedback onPress={() => console.log(1111)}>
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
            game_state={game_state}
            x={side * 2}
            y={height - scaled_grass * 2 - (side * pd) / 2 - 8 * pd}
          />
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
