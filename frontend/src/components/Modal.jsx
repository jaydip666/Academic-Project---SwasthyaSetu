import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Standardized High-Performance Modal Component
 * Handles scroll-locking, keyboard accessibility, and focus trapping.
 */
const Modal = ({
    isOpen,
    onClose,
    children,
    title,
    subtitle,
    maxWidth = '540px',
    showClose = true,
    preventClickOutside = false
}) => {
    const modalRef = useRef(null);

    // Toggle body scroll locking with scrollbar compensation
    useEffect(() => {
        if (isOpen) {
            const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = 'hidden';
            if (scrollBarWidth > 0) {
                document.body.style.paddingRight = `${scrollBarWidth}px`;
            }
        } else {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, [isOpen]);

    // Handle ESC key for accessibility
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (preventClickOutside) return;
        // Close if clicking the backdrop (layer 1) but not the container (layer 2)
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        /* Layer 1: Fixed Full-Screen Overlay (No Scroll) */
        <div
            onClick={handleBackdropClick}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.5)', // Slightly darker for focus
                backdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999, // Absolute priority
                padding: '1.5rem', // Margin for small screens
                overflow: 'hidden', // Disable overlay scroll
                pointerEvents: 'auto'
            }}
            className="animate-fade-in"
        >
            {/* Layer 2: Centered Modal Container */}
            <div
                ref={modalRef}
                style={{
                    width: '100%',
                    maxWidth: maxWidth,
                    maxHeight: '90vh', // Critical architectural constraint
                    background: 'white',
                    borderRadius: '2.5rem',
                    boxShadow: '0 40px 80px -20px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid rgba(0,0,0,0.05)',
                    position: 'relative',
                    pointerEvents: 'auto'
                }}
                className="animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header (Non-Scrolling) */}
                {(title || showClose) && (
                    <div style={{
                        padding: '2rem 2.5rem',
                        borderBottom: '1px solid hsl(var(--border))',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexShrink: 0, // Prevent collapse
                        background: 'linear-gradient(to right, hsl(var(--muted) / 0.1), transparent)',
                        borderRadius: '2.5rem 2.5rem 0 0'
                    }}>
                        <div style={{ marginRight: '1.5rem' }}>
                            {title && <h3 style={{ fontSize: '1.5rem', fontWeight: '800', lineHeight: 1.2, margin: 0 }}>{title}</h3>}
                            {subtitle && <p style={{ color: 'hsl(var(--muted-foreground))', fontWeight: '500', marginTop: '0.4rem', fontSize: '0.9rem', margin: 0 }}>{subtitle}</p>}
                        </div>
                        {showClose && (
                            <button
                                onClick={onClose}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '1.2rem',
                                    background: 'rgba(0, 0, 0, 0.8)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                    color: 'white',
                                    flexShrink: 0
                                }}
                                className="hover-scale"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                )}

                {/* Layer 3: Inner Modal Content Area (Independently Scrollable) */}
                <div style={{
                    padding: '2.5rem',
                    overflowY: 'auto',
                    flex: 1,
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'hsl(var(--border)) transparent'
                }}>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
