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
import {sourceshader, vertices, indices, FoxState} from './Fox';

const pd = PixelRatio.get();
const shader_scale = [{scale: pd}];
export type FoxProps = {
  x: number | SharedValueType<number>;
  y: number | SharedValueType<number>;
  fox: FoxState;
};

export function FoxComponent(props: FoxProps) {
  const fox = useImage(require('./images/fox_sprite_sheet.png'));
  const transform = useMemo(() => {
    return [{translateY: props.y}, {translateX: props.x}] as [
      {translateY: number},
      {translateX: number},
    ];
  }, [props]);

  if (!fox) {
    return null;
  }

  return (
    <Rect transform={transform} x={0} y={0} width={32 * pd} height={32 * pd}>
      <Shader
        transform={shader_scale}
        source={sourceshader!}
        uniforms={props.fox.shared_value}>
        <ImageShader image={fox} />
      </Shader>
      <Vertices textures={vertices} vertices={vertices} indices={indices} />
    </Rect>
  );
}
