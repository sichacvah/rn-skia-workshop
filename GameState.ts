import {SharedValue} from 'react-native-reanimated';
import {FoxState, YState, init_fox_state} from './Fox';
import {FrameInfo, useSharedValue} from 'react-native-reanimated';

export type GameDecl = {
  width: number;
  height: number;
  terrain_size: number;
  fox_velocity: number;
  fox_state: YState;
};

export type GameState = {
  fox_state: FoxState;
  terrains: TerrainBlock[];
  prev_timestamp: number;
  game_decl: GameDecl;
};

export type TerrainBlock = {
  x: number;
  y: number;
};

export function init_terrains(
  game_decl: GameDecl,
): [TerrainBlock, TerrainBlock, TerrainBlock] {
  const y = game_decl.height - game_decl.terrain_size;
  const width = game_decl.width;
  return [
    {x: -width, y},
    {x: 0, y},
    {x: width, y},
  ];
}

export function update_terrains(state: GameState, info: FrameInfo) {
  'worklet';
  const delta = info.timeSinceFirstFrame - state.prev_timestamp;
  state.prev_timestamp = info.timeSinceFirstFrame;
  const [left, center, right] = state.terrains;
  const offset = delta * state.game_decl.fox_velocity;
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
  return {
    game_decl,
    fox_state: init_fox_state(game_decl.fox_state),
    terrains: init_terrains(game_decl),
    prev_timestamp: 0,
  };
}

export function useGameState(game_decl: GameDecl): SharedValue<GameState> {
  return useSharedValue(init_game_state(game_decl));
}
