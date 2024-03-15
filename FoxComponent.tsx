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
import {sourceshader, vertices, indices, side} from './Fox';
import {useDerivedValue} from 'react-native-reanimated';
import {GameState} from './GameState';
import {get_debug_boxes} from './config';

const pd = PixelRatio.get();
const shader_scale = [{scale: pd}];
export type FoxProps = {
  game_state: SharedValueType<GameState>;
};

export function FoxComponent(props: FoxProps) {
  const fox = useImage(require('./images/fox_sprite_sheet.png'));
  const transform = useDerivedValue(() => {
    const {x, y} = props.game_state.value.fox_state;
    return [{translateY: y * pd}, {translateX: x * pd}] as [
      {translateY: number},
      {translateX: number},
    ];
  });
  const uniforms = useDerivedValue(() => {
    const {x_offset, y_offset} = props.game_state.value.fox_state;
    return {x_offset, y_offset};
  });

  if (!fox) {
    return null;
  }

  return (
    <>
      {get_debug_boxes() ? (
        <Rect
          transform={transform}
          x={4 * pd}
          y={0}
          width={(side - 8) * pd}
          height={side * pd}
          style={'stroke'}
          color="black"
        />
      ) : null}
      <Rect
        transform={transform}
        x={0}
        y={0}
        width={side * pd}
        height={side * pd}>
        <Shader
          transform={shader_scale}
          source={sourceshader!}
          uniforms={uniforms}>
          <ImageShader image={fox} />
        </Shader>
        <Vertices textures={vertices} vertices={vertices} indices={indices} />
      </Rect>
    </>
  );
}
