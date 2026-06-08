import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from './config';

const formatAuthError = (error) => {
  if (error?.code === 'auth/operation-not-allowed') {
    return new Error(
      'Email/password sign-in is disabled for this Firebase project. Enable "Email/Password" in Firebase Console > Authentication > Sign-in method.'
    );
  }
  if (error?.code === 'auth/email-already-in-use') {
    return new Error('The email address is already registered. Please login or use a different email.');
  }
  if (error?.code === 'auth/invalid-email') {
    return new Error('The email address is not valid. Please enter a valid email.');
  }
  if (error?.code === 'auth/weak-password') {
    return new Error('The password is too weak. Please use at least 6 characters.');
  }
  return new Error(error?.message || 'An authentication error occurred.');
};

export const registerUser = async (email, password, displayName) => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    return cred.user;
  } catch (error) {
    throw formatAuthError(error);
  }
};

export const loginUser = async (email, password) => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (error) {
    throw formatAuthError(error);
  }
};

export const logoutUser = () => signOut(auth);

export const resetPassword = (email) => sendPasswordResetEmail(auth, email);

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);
