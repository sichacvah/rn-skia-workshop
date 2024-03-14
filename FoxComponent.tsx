import React, {useEffect, useMemo} from 'react';
import {
  useImage,
  ImageShader,
  Shader,
  Vertices,
  Rect,
  SharedValueType,
} from '@shopify/react-native-skia';
import {PixelRatio} from 'react-native';
import {
  sourceshader,
  vertices,
  indices,
  useFoxState,
  update_x_offset,
  x_frames,
  y_idle,
} from './Fox';
import {useFrameCallback} from 'react-native-reanimated';

const pd = PixelRatio.get();
const shader_scale = [{scale: pd}];
export type FoxProps = {
  x: number | SharedValueType<number>;
  y: number | SharedValueType<number>;
};

export function FoxComponent(props: FoxProps) {
  const fox = useImage(require('./images/fox_sprite_sheet.png'));
  const transform = useMemo(() => {
    return [{translateY: props.y}, {translateX: props.x}] as [
      {translateY: number},
      {translateX: number},
    ];
  }, [props]);
  const fox_state = useFoxState(1);

  useFrameCallback(info => {
    const frames_count = x_frames[fox_state.ystate];
    const delta = info.timeSinceFirstFrame - fox_state.time_from_prev_frame;
    if (delta >= 1000 / frames_count) {
      update_x_offset(fox_state);
      fox_state.time_from_prev_frame = info.timeSinceFirstFrame;
    }
  }, true);

  if (!fox) {
    return null;
  }

  return (
    <Rect transform={transform} x={0} y={0} width={32 * pd} height={32 * pd}>
      <Shader
        transform={shader_scale}
        source={sourceshader!}
        uniforms={fox_state.shared_value}>
        <ImageShader image={fox} />
      </Shader>
      <Vertices textures={vertices} vertices={vertices} indices={indices} />
    </Rect>
  );
}
