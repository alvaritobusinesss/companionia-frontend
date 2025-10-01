import { useState, useEffect } from 'react';
import { AuthModal } from '@/components/AuthModal';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Ensure modal is open when visiting the route
    setOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <AuthModal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          // If user closes modal without auth, go back to home
          navigate('/');
        }}
        onSuccess={(email?: string) => {
          // After successful login, go to home
          navigate('/');
        }}
      />
    </div>
  );
};

export default Auth;
