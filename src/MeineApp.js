import React, { useState, useEffect, useRef } from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  onSnapshot,
  setDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  Popup,
  CircleMarker,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon from "./plaudern.png";

import markerShadow from "leaflet/dist/images/marker-shadow.png";

import "react-leaflet-markercluster/dist/styles.min.css";
import MarkerClusterGroup from "react-leaflet-cluster";

const firebaseConfig = {
  apiKey: "AIzaSyAeAL5SpSDXBhrFMFVQPkMyIC-NrJPyj1Q",
  authDomain: "finderio20.firebaseapp.com",
  projectId: "finderio20",
  storageBucket: "finderio20.appspot.com",
  messagingSenderId: "630541843326",
  appId: "1:630541843326:web:edbedcab3ecbc17cfd112f",
  measurementId: "G-JZC0X6KBNY",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    return user.uid;
  } catch (error) {
    console.error("Fehler bei der Benutzerregistrierung:", error);
    return null;
  }
};

const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    return user.uid;
  } catch (error) {
    console.error("Fehler bei der Benutzeranmeldung:", error);

    return null;
  }
};

const deleteUserLocation = async (userId) => {
  const db = getFirestore();
  const userLocationRef = doc(db, "userLocations", userId);
  await deleteDoc(userLocationRef);
};

const defaultIcon = new L.Icon({
  iconUrl: markerIcon,

  shadowUrl: markerShadow,
  iconSize: [35, 30],
  iconAnchor: [15, 31],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
//_______________________________MYLOCATIONMARKER____________________________

const MyLocationMarker = ({ userId, userLocations, currentLocationRef }) => {
  const map = useMap();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [topic] = useState("");
  const [identifier] = useState("");

  useEffect(() => {
    const db = getFirestore();

    if (userId) {
      const userLocationRef = doc(db, "userLocations", userId);
      map.locate({ setView: true }).on("locationfound", (e) => {
        setCurrentLocation(e.latlng);
        currentLocationRef.current = e.latlng;

        setDoc(userLocationRef, {
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          topic: topic,
          identifier: identifier,
        });
      });
    }
  }, [map, userId, topic, identifier, currentLocationRef]);

  if (!userId || userLocations.find((location) => location.userId === userId)) {
    return null; // Nicht rendern, wenn der Standort bereits in der Liste ist
  }

  return currentLocation === null ? null : (
    <CircleMarker
      center={currentLocation}
      fillColor="#c2516d"
      color="#c2516d"
      radius={30}
    />
  );
};

//_____________________________________-MEINE APP____________________________________
const MeineApp = () => {
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const currentLocationRef = useRef(null);
  const [topic, setTopic] = useState("");
  const [identifier, setIdentifier] = useState("");

  const [userLocations, setUserLocations] = useState([]);
  const [userId, setUserId] = useState(localStorage.getItem("userId") || null);

  const [switchRegister, setSwitchRegister] = useState(false);

  const handleRegister = async () => {
    // const email = "test@example.com"; // Beispiel-E-Mail
    // const password = "123456"; // Beispiel-Passwort
    const email = emailRef.current.value;
    const password = passwordRef.current.value;

    const uid = await registerUser(email, password);
    localStorage.setItem("userId", uid);
    setUserId(uid);
  };

  const handleLogin = async () => {
    // const email = "test@example.com"; // Beispiel-E-Mail
    // const password = "123456"; // Beispiel-Passwort
    const email = emailRef.current.value;
    const password = passwordRef.current.value;
    const uid = await loginUser(email, password);
    localStorage.setItem("userId", uid);
    setUserId(uid);
  };

  const handleLogout = async () => {
    localStorage.removeItem("userId");
    await deleteUserLocation(userId);
    setUserId(null);
  };

  useEffect(() => {
    // Abonniere Firestore-Änderungen für die Benutzerstandorte
    const unsubscribe = onSnapshot(
      collection(db, "userLocations"),
      (snapshot) => {
        const locations = [];
        snapshot.forEach((doc) => {
          const location = doc.data();
          locations.push(location);
        });
        setUserLocations(locations);
      }
    );

    // Clean-up-Funktion: Unsubscribe von Firestore-Änderungen
    return () => {
      unsubscribe();
    };
  }, []);

  const onlyWithText = userLocations.filter(
    (location) => location.topic !== ""
  );
  // const radius = 0.04;
  const radius = 0.09;

  const onlyNear = onlyWithText.filter(
    (location) =>
      location.lat < currentLocationRef.current.lat + radius &&
      location.lat > currentLocationRef.current.lat - radius &&
      location.lng < currentLocationRef.current.lng + radius &&
      location.lng > currentLocationRef.current.lng - radius
  );

  ////////////////////////////Eingabefelder////////////////////////////////////////////////////////

  const handleTopicChange = (e) => {
    setTopic(e.target.value);
  };

  const handleIdentifierChange = (e) => {
    setIdentifier(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userLocationRef = doc(db, "userLocations", userId);
    const currentLocation = currentLocationRef.current;

    try {
      await setDoc(userLocationRef, {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        topic,
        identifier,
      });
      console.log("Daten erfolgreich gespeichert");
    } catch (error) {
      console.error("Fehler beim Speichern der Daten:", error);
    }

    // setTopic("");
    // setIdentifier("");
  };

  ////////////////////////////////////////////////////////////////////////////////////

  const switchLogReg = () => {
    setSwitchRegister(!switchRegister);
  };
  return (
    <div className="">
      {userId ? (
        <div className="homepage">
          <MapContainer center={[52, 10]} zoom={6} style={{ height: "500px" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            <MyLocationMarker
              userId={userId}
              userLocations={userLocations}
              currentLocationRef={currentLocationRef}
            />

            <MarkerClusterGroup>
              {onlyWithText.map((location, index) => (
                <Marker
                  key={index}
                  position={[location.lat, location.lng]}
                  icon={defaultIcon}
                >
                  <Popup>
                    <div className="popup-content">
                      <p className="popuptextcolor">{location.topic} </p>

                      <p className="popuptextcolor">{location.identifier}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          </MapContainer>
          <h2 style={{ textAlign: "center" }}>In deiner Nähe</h2>
          <div className="inderNähe">
            {onlyNear.map((text, index) => (
              <div classname="" key={index}>
                <div className="card">
                  <p>{text.topic} </p>
                  <p>{text.identifier} </p>
                </div>
              </div>
            ))}
          </div>

          <div className="Fragen ">
            <form onSubmit={handleSubmit}>
              <div className="deinpopup">
                <h3>Was interessiert dich gerade?</h3>
                <input
                  className="inputs"
                  type="text"
                  maxLength={30}
                  placeholder=" max.30 Zeichen"
                  value={topic}
                  onChange={handleTopicChange}
                />
              </div>
              <div className="deinpopup">
                <h3>Wie kann man dich erkennen?</h3>
                <input
                  className="inputs"
                  type="text"
                  maxLength={30}
                  placeholder=" max.30 Zeichen"
                  value={identifier}
                  onChange={handleIdentifierChange}
                />
              </div>

              <button className="buttonFertig" type="submit">
                Share
              </button>
            </form>
          </div>

          <div className="willkommenstext">
            <div className="cover"></div>

            <div>
              {/* <div className="cover" /> */}
              Buon giorno!,
              <br /> <br /> mit dieser App kannst du einfach und entspannt Leute
              kennenlernen und gute Unterhaltungen führen.
              <br />
              <br /> Beispiel:
              <div style={{ border: "1px solid grey", padding: "15px" }}>
                <em>
                  Du teilst eine coole MusikBand über die du quatschen würdest
                  und wirst schon bald angesprochen:
                  <q>
                    Hi, ich hab in der App gesehen, du interessierst dich für
                    meine Lieblingsband *LoL...
                  </q>
                </em>
                <br />
                <br />
              </div>
              In drei Schritten zu nicen Gesprächen: <br />
              <br />
              1. Standort aktivieren -UmKreis- <br />
              2. Refresh <br />
              3. Eintrag & share <br />
              <br />
              4. optional: <br />
              Dein Standort /Gps deaktivieren, wenn du es nicht nutzt. Wir
              empfehlen die App an öffentliche Orten wie Parks, Caffees usw. zu
              nutzen.
              <br />
              <br />
              <div style={{ border: "1px solid grey", padding: "15px" }}>
                <em>
                  Tipp: Gehe im Browser in die Einstellungen auf "zum
                  Homebildschirm hinzufügen " So installierst du die App auf
                  deinen Home-Bildschirm.
                </em>
              </div>
            </div>
          </div>

          <div
            className="Ende"
            style={{
              textAlign: "center",
              marginTop: "80px",
              marginBottom: "20px",
            }}
          >
            <h4>
              Teile den QR-Code gerne mit Freunden, damit die Community wächst!
            </h4>
            <div className="bild2"></div>
            <button className="buttonLogout" onClick={handleLogout} style={{}}>
              Logout
            </button>
          </div>
        </div>
      ) : (
        <div className="background">
          <div className="cover">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                width: "200px",
                height: "500px",
                padding: "30px",
                paddingTop: "250px",

                textAlign: "center",
                justifyContent: "center",
              }}
            >
              {switchRegister ? (
                <>
                  <input type="email" ref={emailRef} placeholder="E-Mail" />
                  <input
                    type="password"
                    ref={passwordRef}
                    placeholder="Passwort"
                  />
                  <button className="buttonAnmelden" onClick={handleLogin}>
                    Anmelden
                  </button>
                </>
              ) : (
                <>
                  <div style={{ color: "white" }}>
                    <h2>Herzlich Willkommen zur Registrierung!</h2>
                    <p>Eine E-Mail Adresse </p>
                    <input type="email" ref={emailRef} placeholder="E-Mail" />
                    <p>Ein Passwort </p>
                    <input
                      type="password"
                      ref={passwordRef}
                      placeholder="Passwort"
                    />
                  </div>

                  <button className="buttonRegister" onClick={handleRegister}>
                    Abschicken
                  </button>
                </>
              )}
              <button className="noButtom" onClick={switchLogReg}>
                Du hast schon einen Account?
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeineApp;
