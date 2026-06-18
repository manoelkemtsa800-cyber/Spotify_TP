/**
 * @format
 */
import {AppRegistry, LogBox} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Ignore les warnings non critiques
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Sending `onAnimatedValueUpdate` with no listeners registered',
  'Overwriting fontFamily style attribute',
]);

AppRegistry.registerComponent(appName, () => App);