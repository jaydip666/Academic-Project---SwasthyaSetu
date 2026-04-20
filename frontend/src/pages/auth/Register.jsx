import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { UserPlus, User, Mail, Lock, Phone, MapPin, Stethoscope, AlertCircle, Eye, EyeOff, ShieldCheck, ChevronDown } from 'lucide-react';

const Register = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState('patient');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone_no: '',
        gender: 'M',
        age: '',
        address: '',
        specialization: '',
        license_no: '',
        experience: '',
        education: '',
        medical_system: 'Allopathic',
        license_file: null,
        security_question: '',
        security_answer: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone_no') {
            const numericValue = value.replace(/\D/g, '').slice(0, 10);
            setFormData({ ...formData, [name]: numericValue });
        } else if (name === 'experience' || name === 'age') {
            const numericValue = value.replace(/\D/g, '');
            setFormData({ ...formData, [name]: numericValue });
        } else if (name === 'first_name' || name === 'last_name') {
            const alphaValue = value.replace(/[^a-zA-Z\s]/g, '');
            setFormData({ ...formData, [name]: alphaValue });
        } else {
            setFormData({ ...formData, [name]: value });
        }
        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors({ ...fieldErrors, [name]: '' });
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, license_file: file });
            if (fieldErrors.license_file) {
                setFieldErrors({ ...fieldErrors, license_file: '' });
            }
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.first_name.trim()) {
            errors.first_name = 'First name is required';
        } else if (!/^[a-zA-Z\s]+$/.test(formData.first_name)) {
            errors.first_name = 'First name must contain only letters';
        }

        if (!formData.last_name.trim()) {
            errors.last_name = 'Last name is required';
        } else if (!/^[a-zA-Z\s]+$/.test(formData.last_name)) {
            errors.last_name = 'Last name must contain only letters';
        }
        if (!formData.username.trim()) errors.username = 'Username is required';
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Invalid email format';
        }
        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }
        if (!formData.phone_no) {
            errors.phone_no = 'Phone number is required';
        } else if (formData.phone_no.length !== 10) {
            errors.phone_no = '10-digit phone number is required';
        }

        if (!formData.age) errors.age = 'Age is required';
        if (role === 'patient' && !formData.address.trim()) {
            errors.address = 'Address is required';
        }

        if (role === 'doctor') {
            if (!formData.specialization.trim()) errors.specialization = 'Specialization is required';
            if (!formData.license_no.trim()) errors.license_no = 'License Number is required';
            if (!formData.experience) errors.experience = 'Years of Experience is required';
            if (!formData.education.trim()) errors.education = 'Highest Qualification is required';
            if (!formData.license_file) errors.license_file = 'License Certificate is required';
        }

        if (role === 'patient') {
            if (!formData.security_question) errors.security_question = 'Security question is required';
            if (!formData.security_answer.trim()) errors.security_answer = 'Security answer is required';
        }


        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        setError('');

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== '') {
                // For patient, remove doctor fields
                if (role === 'patient' && (key === 'specialization' || key === 'license_no' || key === 'experience' || key === 'education' || key === 'license_file' || key === 'medical_system')) return;

                data.append(key, formData[key]);
            }
        });
        data.append('role', role);
        if (role === 'patient' && !formData.dob) data.append('dob', '2000-01-01');

        try {
            await api.post('/auth/register/', data);
            navigate('/login');
        } catch (err) {
            console.error('Registration Error:', err);
            if (err.data && err.data.error) {
                setError(err.data.error);
            } else {
                setError(err.message || 'Registration failed. Please check your network connection or try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">


            <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '640px', padding: '3.5rem' }}>

                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{
                        background: 'hsl(var(--primary) / 0.1)',
                        width: '64px',
                        height: '64px',
                        borderRadius: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        color: 'hsl(var(--primary))'
                    }}>
                        <UserPlus size={32} />
                    </div>
                    <h2 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Register</h2>
                    <p style={{ color: 'hsl(var(--muted-foreground))' }}>Create your <span style={{ color: 'hsl(var(--primary))', fontWeight: '700' }}>professional healthcare</span> profile</p>
                </div>

                <div style={{
                    display: 'flex',
                    background: 'hsl(var(--muted))',
                    padding: '0.4rem',
                    borderRadius: 'var(--radius)',
                    marginBottom: '2.5rem',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    {['patient', 'doctor'].map((r) => (
                        <button
                            key={r}
                            type="button"
                            onClick={() => setRole(r)}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-sm)',
                                border: 'none',
                                background: role === r ? 'white' : 'transparent',
                                color: role === r ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                                fontWeight: '700',
                                boxShadow: role === r ? 'var(--shadow)' : 'none',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                fontSize: '0.8rem',
                                transition: 'var(--transition)'
                            }}
                        >
                            {r}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="alert alert-error" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--destructive))', background: 'hsl(var(--destructive) / 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                        <div className="input-group">
                            <label className="label">First Name</label>
                            <input type="text" name="first_name" className="input" placeholder="Enter the First Name" value={formData.first_name} onChange={handleChange} style={{ borderColor: fieldErrors.first_name ? 'hsl(var(--destructive))' : 'inherit' }} />
                            {fieldErrors.first_name && <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: '600' }}>{fieldErrors.first_name}</p>}
                        </div>
                        <div className="input-group">
                            <label className="label">Last Name</label>
                            <input type="text" name="last_name" className="input" placeholder="Enter the Last Name" value={formData.last_name} onChange={handleChange} style={{ borderColor: fieldErrors.last_name ? 'hsl(var(--destructive))' : 'inherit' }} />
                            {fieldErrors.last_name && <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: '600' }}>{fieldErrors.last_name}</p>}
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="label">Username</label>
                        <div style={{ position: 'relative' }}>
                            <input type="text" name="username" className="input" placeholder="Enter the username" value={formData.username} onChange={handleChange} style={{ paddingLeft: '3rem', borderColor: fieldErrors.username ? 'hsl(var(--destructive))' : 'inherit' }} />
                            <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                        </div>
                        {fieldErrors.username && <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: '600' }}>{fieldErrors.username}</p>}
                    </div>

                    <div className="input-group">
                        <label className="label">Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <input type="email" name="email" className="input" placeholder="Enter the email address" value={formData.email} onChange={handleChange} style={{ paddingLeft: '3rem', borderColor: fieldErrors.email ? 'hsl(var(--destructive))' : 'inherit' }} />
                            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                        </div>
                        {fieldErrors.email && <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: '600' }}>{fieldErrors.email}</p>}
                    </div>

                    <div className="input-group">
                        <label className="label">Secure Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                hide-password="true"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                className="input"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                style={{ paddingLeft: '3rem', paddingRight: '3rem', borderColor: fieldErrors.password ? 'hsl(var(--destructive))' : 'inherit' }}
                            />
                            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'hsl(var(--muted-foreground))'
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {fieldErrors.password && <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: '600' }}>{fieldErrors.password}</p>}
                    </div>

                    <div className="input-group">
                        <label className="label">Contact Number</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="tel"
                                name="phone_no"
                                className="input"
                                placeholder="Contact Number"
                                value={formData.phone_no}
                                onChange={handleChange}
                                style={{ paddingLeft: '3rem', borderColor: fieldErrors.phone_no ? 'hsl(var(--destructive))' : 'inherit' }}
                                maxLength={10}
                            />
                            <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                            <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: '700' }}>
                                {formData.phone_no.length}/10
                            </span>
                        </div>
                        {fieldErrors.phone_no && <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: '600' }}>{fieldErrors.phone_no}</p>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                        <div className="input-group">
                            <label className="label">Age</label>
                            <input type="number" name="age" className="input" placeholder="Enter your age" value={formData.age} onChange={handleChange} style={{ borderColor: fieldErrors.age ? 'hsl(var(--destructive))' : 'inherit' }} />
                            {fieldErrors.age && <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: '600' }}>{fieldErrors.age}</p>}
                        </div>
                        <div className="input-group">
                            <label className="label">Gender Identity</label>
                            <select name="gender" className="input" value={formData.gender} onChange={handleChange}>
                                <option value="M">Male</option>
                                <option value="F">Female</option>
                                <option value="O">Other</option>
                            </select>
                        </div>
                    </div>
                    <div className="input-group">
                        <label className="label">{role === 'patient' ? 'Residential Address' : 'Clinic/Office Address'}</label>
                        <div style={{ position: 'relative' }}>
                            <input type="text" name="address" className="input" placeholder={role === 'patient' ? 'Enter your residential address' : 'Enter your clinic or office address'} value={formData.address} onChange={handleChange} style={{ paddingLeft: '3rem', borderColor: fieldErrors.address ? 'hsl(var(--destructive))' : 'inherit' }} />
                            <MapPin size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                        </div>
                        {fieldErrors.address && <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: '600' }}>{fieldErrors.address}</p>}
                    </div>

                    {role === 'patient' && (
                        <>
                            <div className="input-group">
                                <label className="label">Security Question (for Password Recovery)</label>
                                <div style={{ position: 'relative' }}>
                                    <select 
                                        name="security_question" 
                                        className="input" 
                                        value={formData.security_question} 
                                        onChange={handleChange}
                                        style={{ paddingLeft: '3rem', appearance: 'none' }}
                                    >
                                        <option value="">Select a security question</option>
                                        <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                                        <option value="What was the name of your first pet?">What was the name of your first pet?</option>
                                        <option value="What is the name of the city where you were born?">What is the name of the city where you were born?</option>
                                        <option value="What was the name of your first school?">What was the name of your first school?</option>
                                        <option value="What is your favorite movie?">What is your favorite movie?</option>
                                    </select>
                                    <ShieldCheck size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                                    <ChevronDown size={14} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))', pointerEvents: 'none' }} />
                                </div>
                                {fieldErrors.security_question && <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: '600' }}>{fieldErrors.security_question}</p>}
                            </div>
                            <div className="input-group">
                                <label className="label">Security Answer</label>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type="text" 
                                        name="security_answer" 
                                        className="input" 
                                        placeholder="Enter your answer" 
                                        value={formData.security_answer} 
                                        onChange={handleChange} 
                                        style={{ paddingLeft: '3rem', borderColor: fieldErrors.security_answer ? 'hsl(var(--destructive))' : 'inherit' }} 
                                    />
                                    <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                                </div>
                                {fieldErrors.security_answer && <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: '600' }}>{fieldErrors.security_answer}</p>}
                            </div>
                        </>
                    )}

                    {role === 'doctor' && (
                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                            <div className="input-group">
                                <label className="label">Medical Specialization</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="text" name="specialization" className="input" placeholder="e.g. Senior Cardiologist" value={formData.specialization} onChange={handleChange} style={{ paddingLeft: '3rem', borderColor: fieldErrors.specialization ? 'hsl(var(--destructive))' : 'inherit' }} />
                                    <Stethoscope size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                                </div>
                                {fieldErrors.specialization && <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: '600' }}>{fieldErrors.specialization}</p>}
                            </div>

                            <div className="input-group">
                                <label className="label">Medical System / Specialization Category</label>
                                <div style={{ position: 'relative' }}>
                                    <select 
                                        name="medical_system" 
                                        className="input" 
                                        value={formData.medical_system} 
                                        onChange={handleChange}
                                        style={{ paddingLeft: '3rem', cursor: 'pointer', appearance: 'none' }}
                                    >
                                        <option value="Allopathic">Allopathic</option>
                                        <option value="Homeopathic">Homeopathic</option>
                                        <option value="Ayurvedic">Ayurvedic</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <ShieldCheck size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                                    <ChevronDown size={14} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                                <div className="input-group">
                                    <label className="label">Medical License Number</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type="text" name="license_no" className="input" placeholder="Enter License Number" value={formData.license_no} onChange={handleChange} style={{ paddingLeft: '3rem', borderColor: fieldErrors.license_no ? 'hsl(var(--destructive))' : 'inherit' }} />
                                        <ShieldCheck size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                                    </div>
                                    {fieldErrors.license_no && <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: '600' }}>{fieldErrors.license_no}</p>}
                                </div>
                                <div className="input-group">
                                    <label className="label">Years of Experience</label>
                                    <input type="number" name="experience" className="input" placeholder="Years" value={formData.experience} onChange={handleChange} style={{ borderColor: fieldErrors.experience ? 'hsl(var(--destructive))' : 'inherit' }} />
                                    {fieldErrors.experience && <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: '600' }}>{fieldErrors.experience}</p>}
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="label">Highest Medical Qualification</label>
                                <input type="text" name="education" className="input" placeholder="e.g. MBBS, MD - Cardiology" value={formData.education} onChange={handleChange} style={{ borderColor: fieldErrors.education ? 'hsl(var(--destructive))' : 'inherit' }} />
                                {fieldErrors.education && <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: '600' }}>{fieldErrors.education}</p>}
                            </div>

                            <div className="input-group">
                                <label className="label">Upload License Certificate (PDF/Image)</label>
                                <div style={{
                                    border: fieldErrors.license_file ? '2px dashed hsl(var(--destructive))' : '2px dashed hsl(var(--border))',
                                    borderRadius: '1rem',
                                    padding: '1.5rem',
                                    textAlign: 'center',
                                    background: 'hsl(var(--muted) / 0.3)',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    transition: 'var(--transition)'
                                }}>
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                                        accept=".pdf,image/*"
                                    />
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                        <UserPlus size={24} style={{ color: 'hsl(var(--primary))' }} />
                                        <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                                            {formData.license_file ? formData.license_file.name : 'Click or Drag to Upload Certificate'}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>Supported formats: PDF, JPG, PNG (Max 5MB)</span>
                                    </div>
                                </div>
                                {fieldErrors.license_file && <p style={{ color: 'hsl(var(--destructive))', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: '600' }}>{fieldErrors.license_file}</p>}
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Processing Registration...' : 'Finalize Registration'}
                    </button>

                </form>

                <div style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))' }}>
                    Already a member? <Link to="/login" style={{ color: 'hsl(var(--primary))', fontWeight: '700', textDecoration: 'none' }}>Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
