import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import userService from '../services/userService';
import authService from '../services/authService';
import { fetchCurrentUser } from '../store/slices/userSlice';
import { resolveMediaUrl } from '../utils/format';

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

const Settings = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const fileInputRef = useRef(null);
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Profile picture state
    const [profilePicture, setProfilePicture] = useState('');
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [avatarProgress, setAvatarProgress] = useState(0);

    // Profile form state
    const [profileData, setProfileData] = useState({
        name: '',
        bio: '',
        city: '',
        country: '',
        mobileNumber: ''
    });

    // Password change state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Email change state
    const [emailData, setEmailData] = useState({
        newEmail: '',
        verificationCode: ''
    });
    const [emailChangeStep, setEmailChangeStep] = useState('initiate'); // 'initiate' or 'verify'

    // Role switch state
    const [selectedRole, setSelectedRole] = useState('buyer');

    // Load user profile on mount
    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await userService.getProfile();
            // API returns { profile: { ... } }, extract the profile object
            const data = response.profile || response;

            console.log('Profile data loaded:', data);

            setProfileData({
                name: data.name || '',
                bio: data.bio || '',
                city: data.city || '',
                country: data.country || '',
                mobileNumber: data.mobileNumber || ''
            });
            setProfilePicture(data.profilePicture || '');
            setSelectedRole(data.role || 'buyer');
        } catch (error) {
            console.error('Failed to load profile:', error);
            showMessage('error', 'Failed to load profile data');
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    // Handle profile picture selection + upload
    const handleAvatarSelect = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // allow re-selecting the same file later
        if (!file) return;

        if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
            showMessage('error', 'Please choose a JPG, PNG, or GIF image.');
            return;
        }
        if (file.size > MAX_AVATAR_SIZE) {
            showMessage('error', 'Image must be smaller than 5MB.');
            return;
        }

        setAvatarUploading(true);
        setAvatarProgress(0);
        try {
            const result = await userService.uploadProfilePicture(file, setAvatarProgress);
            const url = result?.file?.url || result?.url;
            if (url) {
                setProfilePicture(url);
                showMessage('success', 'Profile picture updated!');
                dispatch(fetchCurrentUser());
            } else {
                showMessage('error', 'Upload succeeded but no image URL was returned.');
            }
        } catch (error) {
            showMessage('error', error.response?.data?.error || error.response?.data?.message || 'Failed to upload profile picture');
        } finally {
            setAvatarUploading(false);
        }
    };

    // Handle profile update
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Only send fields that buyers are allowed to update
            // Buyers can update: name, city, country, mobileNumber, address, postalCode
            // Buyers CANNOT update: bio, skills, categories, etc. (seller-specific fields)
            const allowedData = {
                name: profileData.name,
                city: profileData.city,
                country: profileData.country,
                mobileNumber: profileData.mobileNumber
            };

            await userService.updateProfile(allowedData);
            showMessage('success', 'Profile updated successfully!');
            dispatch(fetchCurrentUser());
        } catch (error) {
            showMessage('error', error.response?.data?.error || error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    // Handle password change
    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showMessage('error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await userService.changePassword(passwordData.currentPassword, passwordData.newPassword);
            showMessage('success', 'Password changed successfully!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            showMessage('error', error.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    // Handle email change initiation
    const handleInitiateEmailChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authService.initiateContactChange(emailData.newEmail);
            setEmailChangeStep('verify');
            showMessage('success', 'Verification code sent to your new email!');
        } catch (error) {
            showMessage('error', error.response?.data?.message || 'Failed to initiate email change');
        } finally {
            setLoading(false);
        }
    };

    // Handle email change verification
    const handleVerifyEmailChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authService.verifyContactChange(emailData.verificationCode);
            showMessage('success', 'Email changed successfully!');
            setEmailChangeStep('initiate');
            setEmailData({ newEmail: '', verificationCode: '' });
        } catch (error) {
            showMessage('error', error.response?.data?.message || 'Failed to verify email change');
        } finally {
            setLoading(false);
        }
    };

    // Handle role switch
    const handleRoleSwitch = async () => {
        setLoading(true);
        try {
            await authService.switchRole(selectedRole);
            showMessage('success', `Role switched to ${selectedRole} successfully! Reloading...`);
            // Switch-role issues a new JWT with the updated role; reload so the
            // whole app (header, redux user state) re-derives from the new token.
            setTimeout(() => window.location.reload(), 800);
        } catch (error) {
            showMessage('error', error.response?.data?.error || error.response?.data?.message || 'Failed to switch role');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">

            <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-600 mt-2 text-sm sm:text-base">Manage your account settings and preferences</p>
                </div>

                {/* Message Alert */}
                {message.text && (
                    <div className={`mb-6 p-4 rounded-lg text-sm sm:text-base ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                        'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                        {message.text}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    {/* Tabs */}
                    <div className="border-b">
                        <div className="flex gap-1 p-2 overflow-x-auto sm:flex-wrap">
                            {['profile', 'password', 'email', 'role'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === tab
                                        ? 'bg-blue-800 text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 sm:p-6">
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>

                                {/* Profile Picture */}
                                <div className="flex items-center gap-4 sm:gap-6 mb-6">
                                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                                        <div className="w-full h-full rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                                            {profilePicture ? (
                                                <img
                                                    src={resolveMediaUrl(profilePicture)}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <svg className="w-10 h-10 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" />
                                                </svg>
                                            )}
                                        </div>
                                        {avatarUploading && (
                                            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                                                <span className="text-white text-xs font-semibold">{avatarProgress}%</span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/gif"
                                            onChange={handleAvatarSelect}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={avatarUploading}
                                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {avatarUploading ? 'Uploading...' : profilePicture ? 'Change Photo' : 'Upload Photo'}
                                        </button>
                                        <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max 5MB.</p>
                                    </div>
                                </div>

                                <form onSubmit={handleProfileUpdate} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={profileData.name}
                                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="John Doe"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                City
                                            </label>
                                            <input
                                                type="text"
                                                value={profileData.city}
                                                onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Lagos"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Country
                                            </label>
                                            <input
                                                type="text"
                                                value={profileData.country}
                                                onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Nigeria"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={profileData.mobileNumber}
                                            onChange={(e) => setProfileData({ ...profileData, mobileNumber: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="+234 801 234 5678"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Format: +[country code][number], e.g. +2348012345678</p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Updating...' : 'Update Profile'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Password Tab */}
                        {activeTab === 'password' && (
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Change Password</h2>
                                <form onSubmit={handlePasswordChange} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Current Password
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Changing...' : 'Change Password'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Email Tab */}
                        {activeTab === 'email' && (
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Change Email Address</h2>

                                {emailChangeStep === 'initiate' ? (
                                    <form onSubmit={handleInitiateEmailChange} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                New Email Address
                                            </label>
                                            <input
                                                type="email"
                                                value={emailData.newEmail}
                                                onChange={(e) => setEmailData({ ...emailData, newEmail: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="newemail@example.com"
                                                required
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? 'Sending...' : 'Send Verification Code'}
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleVerifyEmailChange} className="space-y-4">
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                            <p className="text-sm text-blue-800">
                                                We've sent a verification code to <strong>{emailData.newEmail}</strong>
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Verification Code
                                            </label>
                                            <input
                                                type="text"
                                                value={emailData.verificationCode}
                                                onChange={(e) => setEmailData({ ...emailData, verificationCode: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="123456"
                                                required
                                            />
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setEmailChangeStep('initiate')}
                                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="flex-1 bg-blue-800 hover:bg-blue-900 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loading ? 'Verifying...' : 'Verify Email'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* Role Tab */}
                        {activeTab === 'role' && (
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Switch Role</h2>
                                <div className="space-y-4">
                                    <p className="text-gray-600">
                                        Select the role you want to switch to. This will change your account permissions and available features.
                                    </p>

                                    <div className="space-y-3">
                                        {['buyer', 'seller'].map(role => (
                                            <label
                                                key={role}
                                                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${selectedRole === role
                                                    ? 'border-blue-600 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="role"
                                                    value={role}
                                                    checked={selectedRole === role}
                                                    onChange={(e) => setSelectedRole(e.target.value)}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <div className="ml-3">
                                                    <p className="font-semibold text-gray-900 capitalize">{role}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {role === 'buyer' ? 'Purchase services and hire freelancers' : 'Offer services and earn money'}
                                                    </p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleRoleSwitch}
                                        disabled={loading}
                                        className="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Switching...' : 'Switch Role'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Settings;
