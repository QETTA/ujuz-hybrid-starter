/**
 * Mock for @rnmapbox/maps
 * Used in Expo Go where native module is not available
 */

const noop = () => {};
const noopPromise = () => Promise.resolve();
const _noopComponent = () => null; // eslint-disable-line @typescript-eslint/no-unused-vars

// Mock Mapbox components
const MockComponent = () => null;
MockComponent.displayName = 'MockMapboxComponent';

const MapView = MockComponent;
MapView.displayName = 'MapView';

const Camera = MockComponent;
Camera.displayName = 'Camera';

const UserLocation = MockComponent;
UserLocation.displayName = 'UserLocation';

const ShapeSource = MockComponent;
ShapeSource.displayName = 'ShapeSource';

const SymbolLayer = MockComponent;
SymbolLayer.displayName = 'SymbolLayer';

const CircleLayer = MockComponent;
CircleLayer.displayName = 'CircleLayer';

const LineLayer = MockComponent;
LineLayer.displayName = 'LineLayer';

const FillLayer = MockComponent;
FillLayer.displayName = 'FillLayer';

const HeatmapLayer = MockComponent;
HeatmapLayer.displayName = 'HeatmapLayer';

const Images = MockComponent;
Images.displayName = 'Images';

const Callout = MockComponent;
Callout.displayName = 'Callout';

const MarkerView = MockComponent;
MarkerView.displayName = 'MarkerView';

const PointAnnotation = MockComponent;
PointAnnotation.displayName = 'PointAnnotation';

// Mock the default export
const MapboxGL = {
  setAccessToken: noop,
  setTelemetryEnabled: noop,
  setConnected: noop,
  requestAndroidLocationPermissions: noopPromise,
  getAccessToken: () => null,

  // Components
  MapView,
  Camera,
  UserLocation,
  ShapeSource,
  SymbolLayer,
  CircleLayer,
  LineLayer,
  FillLayer,
  HeatmapLayer,
  Images,
  Callout,
  MarkerView,
  PointAnnotation,

  // StyleURL constants
  StyleURL: {
    Street: '',
    Light: '',
    Dark: '',
    Satellite: '',
    SatelliteStreet: '',
    Outdoors: '',
  },
};

export default MapboxGL;
export {
  MapView,
  Camera,
  UserLocation,
  ShapeSource,
  SymbolLayer,
  CircleLayer,
  LineLayer,
  FillLayer,
  HeatmapLayer,
  Images,
  Callout,
  MarkerView,
  PointAnnotation,
};
