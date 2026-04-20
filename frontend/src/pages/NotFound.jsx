import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            height: '80vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <AlertCircle size={64} color="hsl(var(--primary))" style={{ marginBottom: '1.5rem' }} />
            <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1rem' }}>404</h1>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: 'hsl(var(--muted-foreground))' }}>
                Oops! The page you're looking for doesn't exist.
            </h2>
            <button 
                className="btn btn-primary"
                onClick={() => navigate('/')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
                <Home size={20} /> Back to Home
            </button>
        </div>
    );
};

export default NotFound;
