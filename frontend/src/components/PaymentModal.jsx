import { useState } from 'react';
import Modal from './Modal';
import { api } from '../services/api';
import { RefreshCw, CheckCircle, CreditCard, Zap, Banknote, ShieldCheck } from 'lucide-react';

const PaymentModal = ({ amount, appointmentId, onClose, onSuccess }) => {
    const [step, setStep] = useState('summary'); // summary, processing, success
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('online'); // online, cash

    const [errors, setErrors] = useState({});
    const [cardData, setCardData] = useState({
        number: '',
        expiry: '',
        cvv: '',
        name: ''
    });

    const validateForm = () => {
        if (paymentMethod === 'cash') return true;
        const newErrors = {};

        // Card Number: 16 digits
        const cleanNumber = cardData.number.replace(/\s/g, '');
        if (!/^\d{16}$/.test(cleanNumber)) {
            newErrors.number = 'Valid 16-digit card number required';
        }

        // Expiry: MM/YY
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardData.expiry)) {
            newErrors.expiry = 'Use MM/YY format';
        }

        // CVV: 3 digits
        if (!/^\d{3}$/.test(cardData.cvv)) {
            newErrors.cvv = '3-digit CVV required';
        }

        // Name
        if (!cardData.name.trim()) {
            newErrors.name = 'Cardholder name required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePayment = async () => {
        if (!validateForm()) return;
        setLoading(true);
        try {
            let paymentPayload = {
                amount: amount,
                appointment_id: appointmentId,
                payment_method: paymentMethod
            };

            if (paymentMethod === 'online') {
                const orderRes = await api.post('/payment/create-order/', { amount });
                setStep('processing');
                await new Promise(resolve => setTimeout(resolve, 2000));

                paymentPayload = {
                    ...paymentPayload,
                    razorpay_order_id: orderRes.id,
                    razorpay_payment_id: `pay_mock_${Date.now()}`,
                    razorpay_signature: 'mock_signature'
                };
            } else {
                setStep('processing');
                await new Promise(resolve => setTimeout(resolve, 1500));
            }

            await api.post('/payment/verify/', paymentPayload);
            setStep('success');
        } catch (error) {
            console.error("Payment failure", error);
            alert("Payment transmission failed. Please re-initiate.");
            setStep('summary');
            setLoading(false);
        }
    };

    if (step === 'processing') {
        return (
            <Modal isOpen={true} onClose={() => { }} showClose={false} preventClickOutside={true} maxWidth="420px">
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 2.5rem' }}>
                        <div style={{ position: 'absolute', inset: 0, border: '4px solid hsl(var(--primary) / 0.1)', borderRadius: '50%' }}></div>
                        <RefreshCw size={80} className="animate-spin" style={{ color: 'hsl(var(--primary))' }} />
                    </div>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '1rem' }}>
                        {paymentMethod === 'online' ? 'Encrypting Transaction' : 'Registering Protocol'}
                    </h3>
                    <p style={{ color: 'hsl(var(--muted-foreground))', fontWeight: '500' }}>
                        {paymentMethod === 'online' ?
                            'Securing your temporal reservation. Do not interrupt terminal connection.' :
                            'Synchronizing your offline payment choice with the clinical registry.'}
                    </p>
                </div>
            </Modal>
        );
    }

    if (step === 'success') {
        return (
            <Modal isOpen={true} onClose={onSuccess} showClose={false} preventClickOutside={true} maxWidth="420px">
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <div style={{ width: '100px', height: '100px', background: 'hsl(142, 70%, 45% / 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem', color: 'hsl(142, 70%, 45%)' }}>
                        <CheckCircle size={56} />
                    </div>
                    <h3 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '1rem' }}>
                        {paymentMethod === 'online' ? 'Transaction Complete' : 'Registry Updated'}
                    </h3>
                    <p style={{ color: 'hsl(var(--muted-foreground))', fontWeight: '500', marginBottom: '2.5rem' }}>
                        {paymentMethod === 'online' ?
                            'Your clinical reservation has been successfully verified and sharded.' :
                            'Your choice of Cash Payment has been registered. Please fulfill the payment at the clinical reception.'}
                    </p>
                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '1.25rem', fontWeight: '800', fontSize: '1.1rem', borderRadius: '1.5rem' }}
                        onClick={onSuccess}
                    >
                        Acknowledge & Sync
                    </button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Payment Checkout"
            subtitle="Secure Financial Integration"
            maxWidth="500px"
        >
            <div style={{ padding: '0' }}>
                <div style={{
                    background: 'hsl(var(--muted) / 0.5)',
                    padding: '1.5rem',
                    borderRadius: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem',
                    border: '1px solid hsl(var(--border))'
                }}>
                    <span style={{ fontWeight: '700', color: 'hsl(var(--muted-foreground))' }}>Transactional Volume</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'hsl(var(--primary))' }}>₹{amount}</span>
                </div>

                {/* Protocol Toggle */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginBottom: '2.5rem',
                    background: 'hsl(var(--muted) / 0.3)',
                    padding: '0.4rem',
                    borderRadius: '1.25rem'
                }}>
                    <button
                        onClick={() => setPaymentMethod('online')}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                            padding: '1rem', borderRadius: '1rem', border: 'none', cursor: 'pointer',
                            background: paymentMethod === 'online' ? 'white' : 'transparent',
                            color: paymentMethod === 'online' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                            fontWeight: '800', fontSize: '0.9rem',
                            boxShadow: paymentMethod === 'online' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        <CreditCard size={18} /> Online Pay
                    </button>
                    <button
                        onClick={() => setPaymentMethod('cash')}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                            padding: '1rem', borderRadius: '1rem', border: 'none', cursor: 'pointer',
                            background: paymentMethod === 'cash' ? 'white' : 'transparent',
                            color: paymentMethod === 'cash' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                            fontWeight: '800', fontSize: '0.9rem',
                            boxShadow: paymentMethod === 'cash' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Banknote size={18} /> Cash Pay
                    </button>
                </div>

                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {paymentMethod === 'online' ? (
                        <div className="animate-fade-in" style={{ display: 'grid', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: '800' }}>Master Secure Card</label>
                                <div style={{ position: 'relative' }}>
                                    <CreditCard size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--primary))' }} />
                                    <input
                                        type="text"
                                        className="input"
                                        style={{ paddingLeft: '3.5rem', height: '56px', borderRadius: '1.25rem', borderColor: errors.number ? 'hsl(var(--destructive))' : 'inherit' }}
                                        placeholder="XXXX XXXX XXXX XXXX"
                                        value={cardData.number}
                                        maxLength="19"
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                                            setCardData({ ...cardData, number: val });
                                            if (errors.number) setErrors({ ...errors, number: null });
                                        }}
                                    />
                                </div>
                                {errors.number && <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: '600' }}>{errors.number}</p>}
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: '800' }}>Cardholder Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    style={{ height: '56px', borderRadius: '1.25rem', borderColor: errors.name ? 'hsl(var(--destructive))' : 'inherit' }}
                                    placeholder="NAME AS PER SECURE NODE"
                                    value={cardData.name}
                                    onChange={e => {
                                        setCardData({ ...cardData, name: e.target.value.toUpperCase() });
                                        if (errors.name) setErrors({ ...errors, name: null });
                                    }}
                                />
                                {errors.name && <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: '600' }}>{errors.name}</p>}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem' }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: '800' }}>Temporal Expiry</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="MM / YY"
                                        maxLength="5"
                                        style={{ height: '56px', borderRadius: '1.25rem', borderColor: errors.expiry ? 'hsl(var(--destructive))' : 'inherit' }}
                                        value={cardData.expiry}
                                        onChange={e => {
                                            let val = e.target.value.replace(/\D/g, '');
                                            if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2, 4);
                                            setCardData({ ...cardData, expiry: val });
                                            if (errors.expiry) setErrors({ ...errors, expiry: null });
                                        }}
                                    />
                                    {errors.expiry && <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: '600' }}>{errors.expiry}</p>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontWeight: '800' }}>CVV Token</label>
                                    <input
                                        type="password"
                                        className="input"
                                        placeholder="•••"
                                        maxLength="3"
                                        style={{ height: '56px', borderRadius: '1.25rem', borderColor: errors.cvv ? 'hsl(var(--destructive))' : 'inherit' }}
                                        value={cardData.cvv}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setCardData({ ...cardData, cvv: val });
                                            if (errors.cvv) setErrors({ ...errors, cvv: null });
                                        }}
                                    />
                                    {errors.cvv && <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: '600' }}>{errors.cvv}</p>}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-scale-in" style={{
                            padding: '2.5rem 1.5rem',
                            background: 'hsl(var(--primary) / 0.03)',
                            borderRadius: '1.5rem',
                            border: '1px dashed hsl(var(--primary) / 0.2)',
                            textAlign: 'center'
                        }}>
                            <div style={{ width: '60px', height: '60px', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <ShieldCheck size={32} />
                            </div>
                            <h4 style={{ fontWeight: '900', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Offline Settlement Protocol</h4>
                            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                Selecting this option will register your appointment with a <strong>'Pay at Reception'</strong> flag. You will need to fulfill the amount of ₹{amount} physically at the clinical center.
                            </p>
                        </div>
                    )}

                    <button
                        className="btn btn-primary"
                        style={{
                            marginTop: '1rem',
                            width: '100%',
                            padding: '1.25rem',
                            fontSize: '1.1rem',
                            fontWeight: '900',
                            gap: '0.75rem',
                            borderRadius: '1.5rem',
                            background: paymentMethod === 'cash' ? 'hsl(var(--primary))' : 'hsl(var(--primary))'
                        }}
                        onClick={handlePayment}
                        disabled={loading}
                    >
                        {loading ? <RefreshCw className="animate-spin" size={20} /> : <Zap size={20} />}
                        {loading ? 'Authorizing...' : (paymentMethod === 'online' ? `Authorize ₹${amount}` : `Initialize Cash Protocol`)}
                    </button>

                    <div style={{
                        textAlign: 'center',
                        marginTop: '1.5rem',
                        paddingTop: '1.5rem',
                        borderTop: '1px solid hsl(var(--border))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Protocol Status:</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: '900', color: 'hsl(var(--primary))' }}>SECURE VERIFIED</span>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default PaymentModal;
