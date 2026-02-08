import { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { KAKAO_JAVASCRIPT_KEY } from '@env';
import { COPY } from '@/app/copy/copy.ko';

interface KakaoMapViewProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: {
    id: string;
    position: { lat: number; lng: number };
    title: string;
  }[];
  onMarkerPress?: (markerId: string) => void;
  onRegionChange?: (region: { lat: number; lng: number; zoom: number }) => void;
}

export default function KakaoMapView({
  center,
  zoom = 3, // Kakao Maps level: 1-14 (낮을수록 확대, 3=동네 레벨)
  markers = [],
  onMarkerPress,
  onRegionChange,
}: KakaoMapViewProps) {
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.map) {
          var newCenter = new kakao.maps.LatLng(${center.lat}, ${center.lng});
          window.map.setCenter(newCenter);
        }
        true;
      `);
    }
  }, [center]);

  useEffect(() => {
    if (webViewRef.current && markers.length > 0) {
      const markersData = JSON.stringify(markers);
      webViewRef.current.injectJavaScript(`
        if (window.updateMarkers) {
          window.updateMarkers(${markersData});
        }
        true;
      `);
    }
  }, [markers]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerClick' && onMarkerPress) {
        onMarkerPress(data.markerId);
      } else if (data.type === 'regionChange' && onRegionChange) {
        onRegionChange({
          lat: data.center.lat,
          lng: data.center.lng,
          zoom: data.zoom,
        });
      }
    } catch (error) {
      console.error('Error parsing message from WebView:', error);
    }
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Kakao Map</title>
  <script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JAVASCRIPT_KEY}"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var mapContainer = document.getElementById('map');
    var mapOption = {
      center: new kakao.maps.LatLng(${center.lat}, ${center.lng}),
      level: ${zoom}
    };
    var map = new kakao.maps.Map(mapContainer, mapOption);
    window.map = map;
    var markers = [];

    window.updateMarkers = function(newMarkers) {
      markers.forEach(function(marker) {
        marker.setMap(null);
      });
      markers = [];
      newMarkers.forEach(function(markerData) {
        var markerPosition = new kakao.maps.LatLng(markerData.position.lat, markerData.position.lng);
        var marker = new kakao.maps.Marker({
          position: markerPosition,
          title: markerData.title
        });
        marker.setMap(map);
        markers.push(marker);
        kakao.maps.event.addListener(marker, 'click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'markerClick',
            markerId: markerData.id
          }));
        });
      });
    };

    var initialMarkers = ${JSON.stringify(markers)};
    if (initialMarkers.length > 0) {
      window.updateMarkers(initialMarkers);
    }

    kakao.maps.event.addListener(map, 'dragend', function() {
      var center = map.getCenter();
      var level = map.getLevel();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'regionChange',
        center: { lat: center.getLat(), lng: center.getLng() },
        zoom: level
      }));
    });

    kakao.maps.event.addListener(map, 'zoom_changed', function() {
      var center = map.getCenter();
      var level = map.getLevel();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'regionChange',
        center: { lat: center.getLat(), lng: center.getLng() },
        zoom: level
      }));
    });
  </script>
</body>
</html>
  `;

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLabel={COPY.A11Y_MAP}
      accessibilityRole="none"
      accessibilityHint="Swipe to pan, pinch to zoom. Tap markers for place details."
    >
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={false}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        androidLayerType="hardware"
        mixedContentMode="always"
        originWhitelist={['*']}
        allowsInlineMediaPlayback={true}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
        }}
        accessible={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
