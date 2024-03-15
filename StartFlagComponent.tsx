import React from 'react';
import {
  useImage,
  ImageShader,
  Shader,
  Vertices,
  Rect,
  SharedValueType,
} from '@shopify/react-native-skia';
import {PixelRatio} from 'react-native';
import {useDerivedValue} from 'react-native-reanimated';
import {
  GameState,
  START_SIDE,
  start_vertices,
  indices,
  startshader,
} from './GameState';

const pd = PixelRatio.get();
const shader_scale = [{scale: pd}];
export type StartFlagProps = {
  game_state: SharedValueType<GameState>;
};

export function StartFlagComponent(props: StartFlagProps) {
  const start = useImage(require('./images/start_64x64.png'));
  const transform = useDerivedValue(() => {
    let {x, y} = props.game_state.value.start_state;
    return [{translateY: y * pd}, {translateX: x * pd}] as [
      {translateY: number},
      {translateX: number},
    ];
  });
  const uniforms = useDerivedValue(() => {
    const {x_offset} = props.game_state.value.start_state;
    return {x_offset};
  });

  if (!start) {
    return null;
  }

  return (
    <>
      <Rect
        transform={transform}
        x={0}
        y={0}
        width={START_SIDE * pd}
        height={START_SIDE * pd}>
        <Shader
          transform={shader_scale}
          source={startshader!}
          uniforms={uniforms}>
          <ImageShader image={start} />
        </Shader>
        <Vertices
          textures={start_vertices}
          vertices={start_vertices}
          indices={indices}
        />
      </Rect>
    </>
  );
}
