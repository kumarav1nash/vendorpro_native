// authService.ts
import { auth, RecaptchaVerifier } from './firebaseConfig';
import { signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

export const setupRecaptcha = () => {
  if (typeof window !== 'undefined' && !window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
      size: 'invisible',
      callback: () => console.log('Recaptcha resolved'),
    }, auth);
  }
};

export const sendOTP = async (phone: string): Promise<ConfirmationResult> => {
  setupRecaptcha();
  const appVerifier = window.recaptchaVerifier;
  return signInWithPhoneNumber(auth, phone, appVerifier);
};
