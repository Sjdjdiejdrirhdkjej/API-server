"use client";

import { useEffect, useState } from 'react';

type ApiKey = {
  id: string;
  keyPrefix: string;
  label: string;
  createdAt: string;
};

type UserData = {
  privateMetadata: {
    geminiUsage?: {
      requestCount: number;
      updatedAt: string;
    };
    apiKeys?: ApiKey[];
  };
};

export function DashboardClient() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user-data');
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const createApiKey = async () => {
    setNewApiKey(null);
    const response = await fetch('/api/api-keys/create', { method: 'POST' });
    if (response.ok) {
      const data = await response.json();
      setNewApiKey(data.apiKey);
      fetchUserData(); // Refresh user data to show the new key
    }
  };

  const deleteApiKey = async (keyId: string) => {
    await fetch('/api/api-keys/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyId }),
    });
    fetchUserData(); // Refresh user data
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const usage = userData?.privateMetadata.geminiUsage;
  const apiKeys = userData?.privateMetadata.apiKeys || [];

  return (
    <div className="py-5">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="mt-4">
        <h2 className="text-xl font-semibold">API Usage</h2>
        {usage ? (
          <div>
            <p>Requests made: {usage.requestCount}</p>
            <p>Last request: {new Date(usage.updatedAt).toLocaleString()}</p>
          </div>
        ) : (
          <p>No API usage yet.</p>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold">API Keys</h2>
        <button
          className="mt-2 rounded bg-blue-500 px-4 py-2 text-white"
          onClick={createApiKey}
          type="button"
        >
          Create new API key
        </button>

        {newApiKey && (
          <div className="mt-4 rounded bg-green-100 p-4">
            <p className="font-semibold">
              Your new API key has been created. Please copy it and store it
              somewhere safe. You will not be able to see it again.
            </p>
            <pre className="mt-2 overflow-x-auto bg-gray-200 p-2">
              {newApiKey}
            </pre>
          </div>
        )}

        <div className="mt-4 space-y-2">
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between rounded border p-2"
            >
              <div>
                <p className="font-mono">{key.label}</p>
                <p className="text-sm text-gray-500">
                  {key.keyPrefix}
                  ...
                </p>
              </div>
              <div className="flex items-center">
                <p className="mr-4 text-sm text-gray-500">
                  Created on {new Date(key.createdAt).toLocaleDateString()}
                </p>
                <button
                  className="rounded bg-red-500 px-2 py-1 text-sm text-white"
                  onClick={() => deleteApiKey(key.id)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
