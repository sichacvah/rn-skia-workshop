import {SharedValue} from 'react-native-reanimated';
import {
  FoxState,
  YState,
  init_fox_state,
  set_y_state,
  side,
  update_fox_state,
  y_die,
  y_hit,
  y_jump,
  y_sleep,
  y_walk,
} from './Fox';
import {FrameInfo, useSharedValue} from 'react-native-reanimated';
import {get_verticies} from './utils';

// can reuse enemyshader
export type StartState = {
  x: number;
  y: number;
  frame: number;
  time_from_pref_update: number;
  x_offset: number;
};

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
export const start_vertices = get_verticies(START_SIDE);

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

// Position for each point of rect
export const enemy_vertices = get_verticies(SPIKES_WIDTH, SPIKES_HEIGHT);

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
      gs.count += 1;
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
  count: number;
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
    count: 0,
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
  game_state.count = 0;
}

export function useGameState(game_decl: GameDecl): SharedValue<GameState> {
  return useSharedValue(init_game_state(game_decl));
}

export function is_overlaping1D(
  xmin1: number,
  xmax1: number,
  xmin2: number,
  xmax2: number,
): boolean {
  'worklet';
  return xmax1 >= xmin2 && xmax2 >= xmin1;
}

export function is_overlaping2D(
  ex1: number,
  ey1: number,
  ex2: number,
  ey2: number,
  fx1: number,
  fy1: number,
  fx2: number,
  fy2: number,
): boolean {
  'worklet';
  return (
    is_overlaping1D(ex1, ex2, fx1, fx2) && is_overlaping1D(ey1, ey2, fy1, fy2)
  );
}

export function handle_collisions(gs: GameState) {
  'worklet';
  const ex0 = gs.enemy.x + gs.enemy.width / 4;
  const ey0 = gs.enemy.y;
  const fx0 = gs.fox_state.x + 4;
  const fy0 = gs.fox_state.y;
  const ex1 = gs.enemy.x + gs.enemy.width / 2;
  const ey1 = gs.enemy.y + gs.enemy.height / 2;
  const fx1 = gs.fox_state.x + side - 8;
  const fy1 = gs.fox_state.y + side;
  if (
    !gs.enemy.is_hitted &&
    is_overlaping2D(ex0, ey0, ex1, ey1, fx0, fy0, fx1, fy1)
  ) {
    gs.enemy.is_hitted = true;
    if (gs.fox_state.jump_state > 0) {
      gs.fox_state.jump_state = 5;
    } else {
      set_y_state(gs.fox_state, y_hit);
    }
    gs.lives -= 1;
    if (gs.lives === 0) {
      gs.fox_state.jump_state = 0;
      set_y_state(gs.fox_state, y_die);
    }
  }
}

export class PressHandler {
  gs: SharedValue<GameState>;
  constructor(gs: SharedValue<GameState>) {
    this.gs = gs;
  }

  onPress = () => {
    this.gs.modify(gs => {
      'worklet';
      if (gs.fox_state.ystate === y_die) {
        reset_state(gs);
      } else if (gs.fox_state.ystate === y_sleep) {
        set_y_state(gs.fox_state, y_walk);
      } else if (!gs.fox_state.jump_state || gs.fox_state.jump_state === 4) {
        gs.fox_state.jump_state = 3;
        set_y_state(gs.fox_state, y_jump);
      }
      return gs;
    });
  };
}

export function game_update(gs: GameState, info: FrameInfo): GameState {
  'worklet';
  let velocity =
    gs.fox_state.ystate === y_jump
      ? gs.game_decl.fox_velocity * 1.25
      : gs.game_decl.fox_velocity;

  if (gs.fox_state.ystate === y_sleep || gs.fox_state.ystate === y_die) {
    velocity = 0;
  }

  update_flag(gs, info, velocity);
  update_fox_state(gs.fox_state, gs.prev_timestamp, velocity, info);
  update_enemy(gs, info, velocity);
  update_terrains(gs, velocity, info);
  handle_collisions(gs);
  return gs;
}
