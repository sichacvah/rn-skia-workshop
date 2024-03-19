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
import {get_verticies, indicies} from './utils.ts';
import {useDerivedValue} from 'react-native-reanimated';
import {shader} from './Shader';
import {GameState, SPIKES_HEIGHT, SPIKES_WIDTH} from './GameState';
const vertices = get_verticies(32);

const pd = PixelRatio.get();
const shader_scale = [{scale: pd}];
export type EnemyProps = {
  game_state: SharedValueType<GameState>;
};

export function EnemyComponent(props: EnemyProps) {
  const spikes = useImage(require('./images/spikes.png'));
  const transform = useDerivedValue(() => {
    let {x, y} = props.game_state.value.enemy;
    return [{translateY: y * pd}, {translateX: x * pd}] as [
      {translateY: number},
      {translateX: number},
    ];
  });
  const uniforms = useDerivedValue(() => {
    const {x_offset} = props.game_state.value.enemy;
    return {x_offset, y_offset: 0};
  });

  if (!spikes) {
    return null;
  }

  return (
    <Rect
      transform={transform}
      x={0}
      y={0}
      width={SPIKES_WIDTH * pd}
      height={SPIKES_HEIGHT * pd}>
      <Shader transform={shader_scale} source={shader!} uniforms={uniforms}>
        <ImageShader image={spikes} />
      </Shader>
      <Vertices textures={vertices} vertices={vertices} indices={indicies} />
    </Rect>
  );
}
