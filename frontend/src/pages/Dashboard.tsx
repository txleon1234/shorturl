import { FC, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getUrls, createUrl, deleteUrl } from '../api';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as utils from '../utils';

interface URL {
  id: number;
  original_url: string;
  short_code: string;
  created_at: string;
  click_count: number;
}

const Dashboard: FC = () => {
  const { user } = useAuth();
  const [newUrl, setNewUrl] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  
  // Get base URL for short links
  const baseUrl = window.location.origin;

  // Fetch URLs
  const { data: urls = [], isLoading, isError } = useQuery<URL[]>(
    'urls',
    getUrls
  );

  // Create URL mutation
  const createUrlMutation = useMutation(createUrl, {
    onSuccess: () => {
      queryClient.invalidateQueries('urls');
      setNewUrl('');
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to create short URL');
    },
  });

  // Delete URL mutation
  const deleteUrlMutation = useMutation(deleteUrl, {
    onSuccess: () => {
      queryClient.invalidateQueries('urls');
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to delete URL');
    },
  });

  const handleCreateUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) {
      setError('Please enter a URL');
      return;
    }
    setError('');
    createUrlMutation.mutate(newUrl);
  };

  const handleDeleteUrl = (shortCode: string) => {
    if (window.confirm('Are you sure you want to delete this URL?')) {
      deleteUrlMutation.mutate(shortCode);
    }
  };

  // Copy to clipboard function
  const copyToClipboard = (text: string) => {
    utils.copyToClipboard(text);
    alert('Copied to clipboard!');
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-48">Loading...</div>;
  }

  if (isError) {
    return <div className="text-red-500 text-center">Error loading URLs</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Welcome, {user?.username}</h1>
        <p className="text-gray-600 dark:text-gray-300">Create and manage your short URLs</p>
      </div>

      <div className="bg-white dark:bg-gray-700 shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Create new short URL</h2>
        <form onSubmit={handleCreateUrl} className="flex flex-col md:flex-row gap-4">
          <input
            type="url"
            placeholder="Enter your long URL"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="flex-grow px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
          <button
            type="submit"
            disabled={createUrlMutation.isLoading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {createUrlMutation.isLoading ? 'Creating...' : 'Create Short URL'}
          </button>
        </form>
        {error && (
          <div className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-700 shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Your URLs</h2>
        {urls.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">You haven't created any URLs yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Original URL
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Short URL
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Clicks
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Created At
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
          <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
                {urls.map((url) => (
                  <tr key={url.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 truncate max-w-xs">
                      <a 
                        href={url.original_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-indigo-600"
                      >
                        {url.original_url}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      <div className="flex items-center space-x-2">
                        <a 
                          href={`${baseUrl}/r/${url.short_code}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-indigo-600 dark:hover:text-indigo-400"
                        >
                        {`${baseUrl}/r/${url.short_code}`}
                        </a>
                        <button
                          onClick={() => copyToClipboard(`${baseUrl}/r/${url.short_code}`)}
                          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {url.click_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {new Date(url.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <Link
                          to={`/stats/${url.short_code}`}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Stats
                        </Link>
                        <button
                          onClick={() => handleDeleteUrl(url.short_code)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
