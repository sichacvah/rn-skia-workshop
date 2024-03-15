import React from 'react';
import {
  useImage,
  ImageShader,
  Shader,
  Vertices,
  Rect,
  SharedValueType,
  Group,
} from '@shopify/react-native-skia';
import {PixelRatio} from 'react-native';
import {vertices, indices} from './Fox';
import {useDerivedValue} from 'react-native-reanimated';
import {GameState, SPIKES_HEIGHT, SPIKES_WIDTH, enemyshader} from './GameState';
import {get_debug_boxes} from './config';

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
    return {x_offset};
  });

  if (!spikes) {
    return null;
  }

  return (
    <>
      {get_debug_boxes() ? (
        <Rect
          transform={transform}
          x={0}
          y={0}
          style={'stroke'}
          color="black"
          width={SPIKES_WIDTH * pd}
          height={SPIKES_HEIGHT * pd}
        />
      ) : null}
      <Rect
        transform={transform}
        x={0}
        y={0}
        width={SPIKES_WIDTH * pd}
        height={SPIKES_HEIGHT * pd}>
        <Shader
          transform={shader_scale}
          source={enemyshader!}
          uniforms={uniforms}>
          <ImageShader image={spikes} />
        </Shader>
        <Vertices textures={vertices} vertices={vertices} indices={indices} />
      </Rect>
    </>
  );
}
