import { useSetAtom } from "jotai";
import { useEffect } from "react";
import React from "react";

import { createClient } from "./src/services/client";
import { isTauri } from "./src/services/commands";
import { clientState } from "./src/state";


/*
 * Retrieve the authentication token
 */
async function getToken() {
  if (isTauri) {
    return "symphony_token";
  } else {
    // Or query the URL to get the token
    return new URL(location.toString()).searchParams.get("token");
  }
}

/**
 * Handles the connection client
 */
function ClientRoot() {
  const setClient = useSetAtom(clientState);

  useEffect(() => {
    // Retrieve the token and then create a new client
    getToken().then(async (token) => {
      if (token !== null) {
        const client = await createClient(token);

        // Wait until it's connected
        client.whenConnected().then(() => {
          setClient(client);
        });
      }
    });
  }, []);

  return null;
}

function App() {
  return (
    <div>
      <ClientRoot />
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Hello World!</h1>
        <p>The Symphony app is running with a minimal UI.</p>
      </div>
    </div>
  );
}

export default App;
