import {Skia, vec} from '@shopify/react-native-skia';

export const side = 32;

export const sourceshader = Skia.RuntimeEffect.Make(`
uniform shader image;
uniform float x_offset;
uniform float y_offset;

vec4 main(vec2 TexCoord) {
  return image.eval(
    vec2(TexCoord.x, TexCoord.y + 8.0) + 
      vec2(x_offset, y_offset)
  ).rgba;
}
`);

// Position for each point of rect
export const vertices = [
  vec(0, 0),
  vec(side, 0),
  vec(side, side),
  vec(0, side),
];
// reusing verticies
// we going clockwise 0, 1, 2 triangle first
// then 0, 2, 3 triangle
// (0, 0)------------(side, 0)
// |                         |
// |                         |
// (0, side)------(side, side)
export const indices = [0, 1, 2, 0, 2, 3];

if (!sourceshader) {
  throw new Error("Couldn't compile the shader");
}

// y offsets in image determines which fox state we will show
export const y_ready = 0 as const;
export const y_idle = 1 as const;
export const y_walk = 2 as const;
export const y_jump = 3 as const;
export const y_hit = 4 as const;
export const y_sleep = 5 as const;
export const y_die = 6 as const;
export type YState = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// max x frames for y offset
export const x_frames = [5, 14, 8, 11, 5, 6, 7] as const;

export type FoxState = {
  ystate: YState;
  xstate: number;
  time_from_prev_frame: number;
  x_offset: number;
  y_offset: number;
  is_running: boolean;
};

export function get_next_x(state: FoxState): number {
  'worklet';
  const x = x_frames[state.ystate];
  const next = state.xstate + 1;
  return next >= x ? 0 : next;
}

export function set_y_state(state: FoxState, y: YState) {
  'worklet';
  state.ystate = y;
  state.xstate = 0;
  state.y_offset = y * side;
}

export function update_x_offset(
  state: FoxState,
  time_since_first_frame: number,
) {
  'worklet';
  const frames_count = x_frames[state.ystate];
  const delta = time_since_first_frame - state.time_from_prev_frame;
  if (delta < 1000 / frames_count) {
    return;
  }
  const x = get_next_x(state);
  state.xstate = x;
  state.x_offset = x * side;
  state.time_from_prev_frame = time_since_first_frame;
}

export function init_fox_state(ystate: YState = y_ready): FoxState {
  return {
    ystate,
    xstate: 0,
    time_from_prev_frame: 0,
    x_offset: 0,
    y_offset: ystate * side,
    is_running: false,
  };
}
