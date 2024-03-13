import React from 'react';
import {Canvas, Circle, Group} from '@shopify/react-native-skia';
import {View} from 'react-native';

const App = () => {
  const width = 256;
  const height = 256;
  const r = width * 0.33;
  return (
    <View style={{flex: 1}}>
      <Canvas style={{width, height}}>
        <Group blendMode="multiply">
          <Circle cx={r} cy={r} r={r} color="cyan" />
          <Circle cx={width - r} cy={r} r={r} color="magenta" />
          <Circle cx={width / 2} cy={width - r} r={r} color="yellow" />
        </Group>
      </Canvas>
    </View>
  );
};

export default App;
