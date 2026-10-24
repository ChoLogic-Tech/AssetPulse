import { Head, Link } from '@inertiajs/react';
import React from 'react';

export default function Welcome() {
    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh', 
            fontFamily: 'sans-serif',
            backgroundColor: '#111827',
            color: '#f9fafb'
        }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>AssetPulse Workspace</h1>
            <p style={{ color: '#9ca3af', fontSize: '1.25rem' }}>
                Your Laravel + React + Inertia frontend stack is now fully connected!
            </p>
        </div>
    );
}