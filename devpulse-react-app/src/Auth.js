import React, { useState, useEffect } from 'react'; // <-- ADDED useEffect import
import { auth } from './firebase/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GithubAuthProvider, signInWithPopup, EmailAuthProvider, linkWithCredential, fetchSignInMethodsForEmail } from 'firebase/auth'; // Removed getIdTokenResult since it's used via user.getIdTokenResult

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // ------------------------------------------------------------------
  // CORE FIX: Listener to print token AFTER successful sign-in/redirect
  // ------------------------------------------------------------------
  useEffect(() => {
    // This listener fires whenever the user's authentication state changes (e.g., after login or refresh)
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        // User is signed in. Fetch the token and print it clearly.
        user.getIdToken(/* forceRefresh */ true)
          .then(token => {
            console.log("-----------------------------------------");
            console.log("DEV PULSE VS CODE ID TOKEN (COPY BELOW):");
            console.log(token);
            console.log("-----------------------------------------");
            // You can optionally remove the alert here if it's annoying:
            // alert(`Firebase ID Token fetched and logged to console.`); 
          })
          .catch(error => {
            console.error("Error fetching ID Token in listener:", error);
          });
      } else {
        console.log("User is signed out.");
      }
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs only once on mount
  // ------------------------------------------------------------------

  const handleSignUp = async () => {
    try {
      setError('');
      await createUserWithEmailAndPassword(auth, email, password);
      alert('Signed up successfully! Token is in the console.');
      // REMOVED: Token printing logic is now in useEffect
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignIn = async () => {
    try {
      setError('');
      await signInWithEmailAndPassword(auth, email, password);
      alert('Signed in successfully! Token is in the console.');
      // REMOVED: Token printing logic is now in useEffect
    } catch (err) {
      if (err.code === 'auth/account-exists-with-different-credential') {
        const pendingCred = EmailAuthProvider.credential(email, password);
        const methods = await fetchSignInMethodsForEmail(auth, email);

        if (methods.includes(GithubAuthProvider.PROVIDER_ID) && auth.currentUser) {
          try {
            await linkWithCredential(auth.currentUser, pendingCred);
            alert('Account linked and signed in successfully! Token is in the console.');
            // REMOVED: Token printing logic is now in useEffect
          } catch (linkError) {
            setError(`Failed to link account: ${linkError.message}`);
          }
        } else {
          setError('Account exists with different credential. Please sign in with GitHub first, then link your email and password in your profile settings if you wish.');
        }
      } else {
        setError(err.message);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      setError('');
      await signOut(auth);
      alert('Signed out successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGitHubSignIn = async () => {
    try {
      setError('');
      const provider = new GithubAuthProvider();
      // The signInWithPopup often causes a refresh or unmount, which is why the listener is better
      await signInWithPopup(auth, provider); 
      alert('Signed in with GitHub successfully! Token is in the console.');
      // REMOVED: Token printing logic is now in useEffect
    } catch (err) {
      setError(err.message);
    }
  };
  
  // ... (JSX styling code remains the same) ...

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Authentication</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={inputStyle}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={inputStyle}
      />
      <div>
        <button onClick={handleSignUp} style={primaryButtonStyle}>Sign Up</button>
        <button onClick={handleSignIn} style={primaryButtonStyle}>Sign In</button>
        <button onClick={handleGitHubSignIn} style={{ ...primaryButtonStyle, backgroundColor: '#1f2937', marginLeft: '10px' }}>Sign In with GitHub</button>
        {/* <button onClick={handleSignOut} style={secondaryButtonStyle}>Sign Out</button> */}
      </div>
      {error && <p style={errorStyle}>{error}</p>}
    </div>
  );
};

export default Auth;