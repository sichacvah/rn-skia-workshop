import {Skia, vec} from '@shopify/react-native-skia';
import {FrameInfo} from 'react-native-reanimated';

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

export type JumpNone = 0;
export type JumpRising = 1;
export type JumpFalling = 2;

export type JumpState = JumpNone | JumpRising | JumpFalling;

export type FoxState = {
  ystate: YState;
  xstate: number;
  time_from_prev_frame: number;
  x_offset: number;
  y_offset: number;
  is_running: boolean;
  x: number;
  y: number;
  initial_y: number;
  jump_state: JumpState;
};

export function get_next_x(state: FoxState): number {
  'worklet';
  const x = x_frames[state.ystate];
  let next = state.xstate + 1;
  next = next >= x ? 0 : next;
  if (state.ystate === y_jump && next < 3) {
    next = 3;
  }
  return next;
}

export function set_y_state(state: FoxState, y: YState) {
  'worklet';
  state.ystate = y;
  state.xstate = 0;
  state.x_offset = 0;
  if (y === y_jump) {
    state.x_offset = 3;
  }
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

export function update_fox_state(
  state: FoxState,
  prev_ts: number,
  pd: number,
  v: number,
  info: FrameInfo,
) {
  'worklet';
  update_x_offset(state, info.timeSinceFirstFrame);
  const delta = info.timeSinceFirstFrame - prev_ts;
  if (state.jump_state > 0) {
    if (state.jump_state === 1) {
      state.y -= delta * v;
      if (state.y <= state.initial_y - (side / 2) * pd) {
        state.jump_state = 2;
      }
    } else if (state.jump_state === 2) {
      state.y += delta * v;
      if (state.y >= state.initial_y) {
        state.jump_state = 0;
        set_y_state(state, y_walk);
      }
    }
  }
}

export function init_fox_state(
  x: number,
  y: number,
  ystate: YState = y_ready,
): FoxState {
  return {
    ystate,
    xstate: 0,
    time_from_prev_frame: 0,
    x_offset: 0,
    y_offset: ystate * side,
    is_running: false,
    x,
    y,
    initial_y: y,
    jump_state: 0,
  };
}
