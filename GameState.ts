import {SharedValue} from 'react-native-reanimated';
import {FoxState, YState, init_fox_state, side} from './Fox';
import {FrameInfo, useSharedValue} from 'react-native-reanimated';
import {Skia, vec} from '@shopify/react-native-skia';
import {FoxComponent} from './FoxComponent';

// can reuse enemyshader
export type StartState = {
  x: number;
  y: number;
  frame: number;
  time_from_pref_update: number;
  x_offset: number;
};

export const startshader = Skia.RuntimeEffect.Make(`
uniform shader image;
uniform float x_offset;

vec4 main(vec2 TexCoord) {
  return image.eval(
    vec2(TexCoord.x, TexCoord.y) + 
      vec2(x_offset, 0)
  ).rgba;
}
`);

export function init_start_state(x: number, y: number): StartState {
  'worklet';
  return {
    x,
    y,
    frame: 0,
    time_from_pref_update: 0,
    x_offset: 0,
  };
}
export const MAX_START_FRAMES = 16;
export const START_SIDE = 64;

export const start_vertices = [
  vec(0, 0),
  vec(START_SIDE, 0),
  vec(START_SIDE, START_SIDE),
  vec(0, START_SIDE),
];

export type EnemyState = {
  x: number;
  y: number;
  frame: number;
  out: boolean;
  width: number;
  height: number;
  x_offset: number;
  time_from_pref_update: number;
  is_hitted: boolean;
};

export const SPIKES_WIDTH = 22;
export const SPIKES_HEIGHT = 18;
export const SPIKES_FRAMES = 10;

export const enemyshader = Skia.RuntimeEffect.Make(`
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
  vec(SPIKES_WIDTH, 0),
  vec(SPIKES_WIDTH, SPIKES_HEIGHT),
  vec(0, SPIKES_HEIGHT),
];

export const indices = [0, 1, 2, 0, 2, 3];
if (!enemyshader) {
  throw new Error("Couldn't compile the shader");
}

export function init_enemy_state(x: number, y: number): EnemyState {
  'worklet';
  return {
    x,
    y,
    frame: 0,
    out: false,
    width: SPIKES_WIDTH,
    height: SPIKES_HEIGHT,
    x_offset: 0,
    time_from_pref_update: 0,
    is_hitted: false,
  };
}

export function update_flag(gs: GameState, info: FrameInfo, v: number) {
  'worklet';

  const delta = info.timeSinceFirstFrame - gs.start_state.time_from_pref_update;
  gs.start_state.x -= (info.timeSinceFirstFrame - gs.prev_timestamp) * v;
  if (delta < 750 / MAX_START_FRAMES) {
    return;
  }
  gs.start_state.frame += 1;
  gs.start_state.x_offset = gs.start_state.frame * START_SIDE;
  if (gs.start_state.frame > MAX_START_FRAMES) {
    gs.start_state.x_offset = 0;
    gs.start_state.frame = 0;
  }
  gs.start_state.time_from_pref_update = info.timeSinceFirstFrame;
}

export function update_enemy(gs: GameState, info: FrameInfo, v: number) {
  'worklet';

  const delta = info.timeSinceFirstFrame - gs.enemy.time_from_pref_update;
  gs.enemy.x -= (info.timeSinceFirstFrame - gs.prev_timestamp) * v;
  if (delta < 1000 / SPIKES_FRAMES) {
    return;
  }
  gs.enemy.frame += 1;
  gs.enemy.x_offset = gs.enemy.frame * SPIKES_WIDTH;
  if (gs.enemy.frame > SPIKES_FRAMES) {
    gs.enemy.x_offset = 0;
    gs.enemy.frame = 0;
  }
  gs.enemy.time_from_pref_update = info.timeSinceFirstFrame;
  if (gs.enemy.x + gs.enemy.width < -gs.game_decl.width / 2) {
    if (gs.enemy.is_hitted) {
      gs.enemy.x = gs.game_decl.width + gs.enemy.width;
    } else {
      gs.enemy.x = gs.game_decl.width + gs.enemy.width / 2;
    }
    gs.enemy.is_hitted = false;
  }
}

export type GameDecl = {
  width: number;
  height: number;
  terrain_size: number;
  fox_velocity: number;
  fox_state: YState;
  fox_y: number;
  fox_x: number;
  initial_lives: number;
};

export type GameState = {
  fox_state: FoxState;
  terrains: TerrainBlock[];
  prev_timestamp: number;
  game_decl: GameDecl;
  enemy: EnemyState;
  lives: number;
  start_state: StartState;
};

export type TerrainBlock = {
  x: number;
  y: number;
};

export function init_terrains(
  game_decl: GameDecl,
): [TerrainBlock, TerrainBlock, TerrainBlock] {
  'worklet';
  const y = game_decl.height - game_decl.terrain_size;
  const width = game_decl.width;
  return [
    {x: -width, y},
    {x: 0, y},
    {x: width, y},
  ];
}

export function update_terrains(state: GameState, v: number, info: FrameInfo) {
  'worklet';
  const delta = info.timeSinceFirstFrame - state.prev_timestamp;
  state.prev_timestamp = info.timeSinceFirstFrame;
  const [left, center, right] = state.terrains;
  const offset = delta * v;
  left.x -= offset;
  center.x -= offset;
  right.x -= offset;
  if (left.x < -1.5 * state.game_decl.width) {
    // Swap terrain parts when we pass 0.5 width
    left.x = right.x + state.game_decl.width;
    state.terrains[0] = center;
    state.terrains[1] = right;
    state.terrains[2] = left;
  }
}

export function init_game_state(game_decl: GameDecl): GameState {
  'worklet';
  return {
    game_decl,
    fox_state: init_fox_state(
      game_decl.fox_x,
      game_decl.fox_y,
      game_decl.fox_state,
    ),
    terrains: init_terrains(game_decl),
    prev_timestamp: 0,
    enemy: init_enemy_state(
      game_decl.width * 2,
      game_decl.fox_y + (side - SPIKES_HEIGHT),
    ),
    lives: game_decl.initial_lives,
    start_state: init_start_state(1.5 * side, game_decl.fox_y - side),
  };
}

export function reset_state(game_state: GameState) {
  'worklet';
  const next = init_game_state(game_state.game_decl);
  game_state.fox_state = next.fox_state;
  game_state.terrains = next.terrains;
  game_state.prev_timestamp = next.prev_timestamp;
  game_state.enemy = next.enemy;
  game_state.lives = next.lives;
  game_state.start_state = next.start_state;
}

export function useGameState(game_decl: GameDecl): SharedValue<GameState> {
  return useSharedValue(init_game_state(game_decl));
}
