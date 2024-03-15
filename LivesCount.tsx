import React, {useMemo} from 'react';

import {
  ImageShader,
  Rect,
  Shader,
  SharedValueType,
  SkImage,
  Skia,
  Vertices,
  useImage,
  vec,
} from '@shopify/react-native-skia';
import type {GameState} from './GameState';
import {PixelRatio} from 'react-native';
import {useDerivedValue} from 'react-native-reanimated';

const lives_side = 32;

export const livesshader = Skia.RuntimeEffect.Make(`
uniform shader image;
uniform float x_offset;

vec4 main(vec2 TexCoord) {
  return image.eval(
    vec2(TexCoord.x, TexCoord.y) + 
      vec2(x_offset, 0)
  ).rgba;
}
`);

// Position for each point of rect
export const enemy_vertices = [
  vec(0, 0),
  vec(lives_side, lives_side),
  vec(lives_side, lives_side),
  vec(0, lives_side),
];

export const indices = [0, 1, 2, 0, 2, 3];
if (!livesshader) {
  throw new Error("Couldn't compile the shader");
}

export type LivesCountProps = {
  game_state: SharedValueType<GameState>;
};

const pd = PixelRatio.get();
const shader_scale = [{scale: 1}];

type HeartComponentProps = {
  game_state: SharedValueType<GameState>;
  count: number;
  img: SkImage;
};

function HeartComponent({game_state, count, img}: HeartComponentProps) {
  const u = useDerivedValue(() => {
    const {lives} = game_state.value;
    return {x_offset: lives > count ? 0 : 64};
  });
  const t = useMemo(
    () => [{translateX: 8 + count * lives_side}, {translateY: 8 * pd}],
    [count],
  );

  return (
    <Rect transform={t} x={0} y={0} width={lives_side} height={lives_side}>
      <Shader transform={shader_scale} source={livesshader!} uniforms={u}>
        <ImageShader image={img} />
      </Shader>
      <Vertices
        textures={enemy_vertices}
        vertices={enemy_vertices}
        indices={indices}
      />
    </Rect>
  );
}

export function LivesCount({game_state}: LivesCountProps) {
  const hearts = useImage(require('./images/hearts.png'));
  const items = useMemo(() => {
    return new Array(game_state.value.game_decl.initial_lives).fill(0);
  }, []);
  if (!hearts) {
    return null;
  }

  return (
    <>
      {items.map((_, i) => (
        <HeartComponent
          key={i.toString()}
          img={hearts}
          count={i}
          game_state={game_state}
        />
      ))}
    </>
  );
}
