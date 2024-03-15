import React from 'react';
import {
  useImage,
  Rect,
  ImageShader,
  SharedValueType,
  SkImage,
} from '@shopify/react-native-skia';
import {useDerivedValue} from 'react-native-reanimated';
import {GameState} from './GameState';
import {PixelRatio} from 'react-native';

export const GRASS_SIDE = 44;

export type TerrainProps = {
  game_state: SharedValueType<GameState>;
};
type TerrainPartProps = {
  width: number;
  pd: number;
  fill: SkImage;
  grass: SkImage;
  x: SharedValueType<number>;
  y: SharedValueType<number>;
  y_fill: SharedValueType<number>;
};

function TerrainPart(props: TerrainPartProps) {
  const {x, y, fill, y_fill, grass, width, pd} = props;
  const scaled_grass = GRASS_SIDE * pd;
  return (
    <>
      <Rect x={x} y={y_fill} width={width * pd} height={60 * pd}>
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

      <Rect x={x} y={y} width={width * pd} height={scaled_grass}>
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

const pd = PixelRatio.get();

export function Terrain(props: TerrainProps) {
  const {width} = props.game_state.value.game_decl;
  const grassTerrain = useImage(require('./images/grass.png'));
  const terrainFill = useImage(require('./images/terrainfill.png'));

  const leftX = useDerivedValue(
    () => props.game_state.value.terrains[0].x * pd,
  );
  const y = useDerivedValue(() => props.game_state.value.terrains[0].y * pd);
  const y_fill = useDerivedValue(() => y.value + GRASS_SIDE * pd);

  const centerX = useDerivedValue(
    () => props.game_state.value.terrains[1].x * pd,
  );
  const rightX = useDerivedValue(
    () => props.game_state.value.terrains[2].x * pd,
  );

  if (!grassTerrain || !terrainFill) {
    return null;
  }
  return (
    <>
      <TerrainPart
        width={width}
        pd={pd}
        x={leftX}
        y={y}
        y_fill={y_fill}
        grass={grassTerrain}
        fill={terrainFill}
      />
      <TerrainPart
        width={width}
        pd={pd}
        x={centerX}
        y={y}
        y_fill={y_fill}
        grass={grassTerrain}
        fill={terrainFill}
      />
      <TerrainPart
        width={width}
        pd={pd}
        x={rightX}
        y={y}
        y_fill={y_fill}
        grass={grassTerrain}
        fill={terrainFill}
      />
    </>
  );
}
