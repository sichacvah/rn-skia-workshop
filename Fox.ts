import {Skia, vec} from '@shopify/react-native-skia';
import {FrameInfo} from 'react-native-reanimated';

export const side = 32;

export const sourceshader = Skia.RuntimeEffect.Make(`
uniform shader image;
uniform float x_offset;
uniform float y_offset;

vec4 main(vec2 TexCoord) {
  return image.eval(
    vec2(TexCoord.x, TexCoord.y) + 
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
export type JumpPrepare = 3;
export type JumpAfter = 4;

export type JumpState =
  | JumpNone
  | JumpRising
  | JumpFalling
  | JumpPrepare
  | JumpAfter;

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
  return next;
}

export function set_y_state(state: FoxState, y: YState) {
  'worklet';
  state.ystate = y;
  state.xstate = 0;
  state.x_offset = 0;
  state.y_offset = y * side;
}

export function update_x_offset(
  state: FoxState,
  time_since_first_frame: number,
) {
  'worklet';
  const frames_count = x_frames[state.ystate];
  const delta = time_since_first_frame - state.time_from_prev_frame;
  const jump_speed =
    state.jump_state === 3 || state.jump_state === 4 ? 750 : 600;
  const seconds_count = state.ystate === y_jump ? jump_speed : 1000;
  if (delta < seconds_count / frames_count) {
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
  v: number,
  info: FrameInfo,
) {
  'worklet';
  const jump_height = side * 1.75;
  const delta = info.timeSinceFirstFrame - prev_ts;
  if (state.jump_state > 0) {
    if (state.jump_state === 3) {
      update_x_offset(state, info.timeSinceFirstFrame);
      if (state.xstate > 2) {
        state.jump_state = 1;
      }
    } else if (state.jump_state === 4) {
      update_x_offset(state, info.timeSinceFirstFrame);
      if (state.xstate === x_frames[state.ystate] || state.xstate === 0) {
        state.jump_state = 0;
        set_y_state(state, y_walk);
      }
    } else if (state.jump_state === 1) {
      state.y -= delta * v * 1.2;
      state.y = Math.max(state.y, state.initial_y - jump_height);
      if (state.y === state.initial_y - jump_height) {
        if (info.timeSinceFirstFrame - state.time_from_prev_frame > 30) {
          state.jump_state = 2;
        }
      } else if (state.y < state.initial_y - jump_height / 3) {
        state.xstate = 3;
        state.x_offset = state.xstate * side;
        state.time_from_prev_frame = info.timeSinceFirstFrame;
      } else {
        state.xstate = 4;
        state.x_offset = state.xstate * side;
        state.time_from_prev_frame = info.timeSinceFirstFrame;
      }
    } else if (state.jump_state === 2) {
      state.y = state.y + delta * v * 1.2;
      state.y = Math.min(state.y, state.initial_y);
      if (state.y >= state.initial_y && state.xstate === 5) {
        state.jump_state = 4;
      } else if (state.y >= state.initial_y - jump_height) {
        state.xstate = 5;
        state.x_offset = state.xstate * side;
        state.time_from_prev_frame = info.timeSinceFirstFrame;
      }
    }
  } else {
    update_x_offset(state, info.timeSinceFirstFrame);
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
