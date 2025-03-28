import { FC, useState } from 'react';
import { updateSiteSettings } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useMutation, useQuery } from 'react-query';
import { getSiteSettings } from '../api';

const Settings: FC = () => {
  const { isAdmin } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { 
    data: settings, 
    isLoading, 
    refetch 
  } = useQuery('siteSettings', getSiteSettings);

  const updateSettingsMutation = useMutation(updateSiteSettings, {
    onSuccess: () => {
      setSuccess('Settings updated successfully');
      setError('');
      refetch();
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to update settings');
      setSuccess('');
    }
  });

  const handleToggleRegistration = () => {
    setSuccess('');
    setError('');
    updateSettingsMutation.mutate({
      registration_enabled: !settings?.registration_enabled
    });
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
          <p className="mt-2">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="mt-2">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Site Settings</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        <div className="bg-white dark:bg-gray-700 shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">User Registration</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 dark:text-gray-300">Allow new users to register</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {settings?.registration_enabled 
                  ? 'New users can currently create accounts' 
                  : 'New user registration is currently disabled'}
              </p>
            </div>
            <div>
              <button
                onClick={handleToggleRegistration}
                disabled={updateSettingsMutation.isLoading}
                className={`relative inline-flex items-center h-6 rounded-full w-11 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${
                  settings?.registration_enabled ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`${
                    settings?.registration_enabled ? 'translate-x-6' : 'translate-x-1'
                  } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
