import { db } from '@/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface LocationItem {
  id: string;
  latitude: number;
  longitude: number;
  numberOfTrees: number;
  note: string;
  status: string;
  submittedBy: string;
  timestamp: any;
  u_id: string;
}

export default function ExMapScreen() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const webviewRef = useRef<WebView>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
  setLoading(true);
  try {
    // Step 1: Fetch users and create email → name map
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const userMap: Record<string, string> = {};
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.email && data.name) {
        userMap[data.email.trim().toLowerCase()] = data.name;
      }
    });

    // Step 2: Fetch locations
    const querySnapshot = await getDocs(collection(db, 'locations'));
    const fetchedLocations: LocationItem[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const submittedEmail = (data.submittedByEmail || '').trim().toLowerCase();
      const submitterName = userMap[submittedEmail] || submittedEmail;
      //console.log(submitterName);
      fetchedLocations.push({
        id: doc.id,
        latitude: data.latitude,
        longitude: data.longitude,
        numberOfTrees: data.numberOfTrees,
        status: data.status,
        note: data.note,
        submittedBy: submitterName, // Replace email with the name
        timestamp: data.timestamp,
        u_id: data.u_id,
      });
    });
    //console.log(fetchedLocations);
    setLocations(fetchedLocations);

    // Step 3: Inject new markers to the map
    if (webviewRef.current) {
      const jsCode = `
        (function() {
          if (typeof map !== 'undefined') {
            map.eachLayer(function (layer) {
              if (layer instanceof L.Marker) map.removeLayer(layer);
            });

            const locations = ${JSON.stringify(fetchedLocations)};
            locations.forEach(loc => {
              const icon = loc.status === 'done' ? greenIcon : redIcon;
              const marker = L.marker([loc.latitude, loc.longitude], { icon }).addTo(map);
              marker.bindPopup(\`
                <strong>Task id:</strong> \${loc.u_id}<br/>
                <strong>Trees:</strong> \${loc.numberOfTrees}<br/>
                <strong>Status:</strong> \${loc.status}<br/>
                <strong>Note:</strong> \${loc.note || 'N/A'}<br/>
                <strong>By:</strong> \${loc.submittedBy}<br/>
                <a href="https://www.google.com/maps?q=\${loc.latitude},\${loc.longitude}" target="_blank">
                  Open in Google Maps
                </a>
              \`);
            });
          }
        })();
      `;
      webviewRef.current.injectJavaScript(jsCode);
    }

  } catch (error) {
    console.error('Error fetching locations: ', error);
  } finally {
    setLoading(false);
  }
};


  const leafletHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Map</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css" />
    <style> html, body, #map { height: 100%; margin: 0; padding: 0; } </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.3/dist/leaflet.js"></script>
    <script>
      const map = L.map('map').setView([22.5726, 88.3639], 8);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      const redIcon = new L.Icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      const greenIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      const locations = ${JSON.stringify(locations)};
      locations.forEach(loc => {
        const icon = loc.status === 'done' ? greenIcon : redIcon;
        const marker = L.marker([loc.latitude, loc.longitude], { icon }).addTo(map);
        marker.bindPopup(\`
          <strong>Task id:</strong> \${loc.u_id}<br/>
          <strong>Trees:</strong> \${loc.numberOfTrees}<br/>
          <strong>Status:</strong> \${loc.status}<br/>
          <strong>Note:</strong> \${loc.note || 'N/A'}<br/>
          <strong>By:</strong> \${loc.submittedBy}<br/>
          <a href="https://www.google.com/maps?q=\${loc.latitude},\${loc.longitude}" target="_blank">
            Open in Google Maps
          </a>
        \`);
      });
    </script>
  </body>
  </html>
`;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html: leafletHtml }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState
      />
      <View style={styles.refreshButton}>
        <Button title="Refresh" onPress={fetchLocations} color="#004520"/>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webview: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  refreshButton: {
    padding: 5,
    backgroundColor: '#eaeaea',
  },
});
