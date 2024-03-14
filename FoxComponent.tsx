import React, {useMemo} from 'react';
import {
  useImage,
  ImageShader,
  Shader,
  Vertices,
  Rect,
  SharedValueType,
} from '@shopify/react-native-skia';
import {PixelRatio} from 'react-native';
import {sourceshader, vertices, indices} from './Fox';
import {useDerivedValue} from 'react-native-reanimated';
import {GameState} from './GameState';

const pd = PixelRatio.get();
const shader_scale = [{scale: pd}];
export type FoxProps = {
  x: number | SharedValueType<number>;
  y: number | SharedValueType<number>;
  game_state: SharedValueType<GameState>;
};

export function FoxComponent(props: FoxProps) {
  const fox = useImage(require('./images/fox_sprite_sheet.png'));
  const transform = useMemo(() => {
    return [{translateY: props.y}, {translateX: props.x}] as [
      {translateY: number},
      {translateX: number},
    ];
  }, [props]);
  const uniforms = useDerivedValue(() => {
    const {x_offset, y_offset} = props.game_state.value.fox_state;
    return {x_offset, y_offset};
  });

  if (!fox) {
    return null;
  }

  return (
    <Rect transform={transform} x={0} y={0} width={32 * pd} height={32 * pd}>
      <Shader
        transform={shader_scale}
        source={sourceshader!}
        uniforms={uniforms}>
        <ImageShader image={fox} />
      </Shader>
      <Vertices textures={vertices} vertices={vertices} indices={indices} />
    </Rect>
  );
}
