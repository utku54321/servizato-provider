import { registerRootComponent } from 'expo';
import App from './src/App';
import { Boot } from './src/shell';

function Root() {
  return <Boot App={App} />;
}

registerRootComponent(Root);
