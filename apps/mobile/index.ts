// Must be first import — patches console.warn before App's module tree evaluates
import './suppressWarnings';
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
