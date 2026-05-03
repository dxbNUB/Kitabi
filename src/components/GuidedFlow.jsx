import { useEffect, useRef } from 'react';
import { useSession } from '../store/session';

export default function GuidedFlow({ onGenerateReady }) {
  const { phase, setPhase } = useSession();
  const calledRef = useRef(false);

  useEffect(() => {
    if (phase === 'chat' && !calledRef.current) {
      calledRef.current = true;
      onGenerateReady?.();
    }
  }, [phase, onGenerateReady]);

  return null;
}
