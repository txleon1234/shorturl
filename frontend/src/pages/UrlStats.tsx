import { FC } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { getUrlStats } from '../api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';
import ReactCountryFlag from 'react-country-flag';
import { useTheme } from '../contexts/ThemeContext';

interface UrlStats {
  url_id: number;
  short_code: string;
  original_url: string;
  total_clicks: number;
  referrers: Record<string, number>;
  browsers: Record<string, number>;
  operating_systems: Record<string, number>;
  locations: Record<string, number>;
  clicks_over_time: Record<string, number>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF', '#FF5733', '#4BC0C0', 
                '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B', '#6A7FDB', '#9CCC65', '#BA68C8'];

const UrlStats: FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  const { data: stats, isLoading, isError } = useQuery<UrlStats>(
    ['urlStats', shortCode],
    () => getUrlStats(shortCode as string),
    {
      enabled: !!shortCode,
      refetchInterval: 30000, // Refresh data every 30 seconds
    }
  );

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading stats...</div>;
  }

  if (isError || !stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> Failed to load URL statistics.</span>
        </div>
        <div className="mt-4">
          <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-900">
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const timeChartData = Object.entries(stats.clicks_over_time).map(([date, count]) => ({
    date,
    clicks: count,
  }));

  const referrerChartData = Object.entries(stats.referrers).map(([referrer, count]) => ({
    name: referrer,
    value: count,
  }));

  const browserChartData = Object.entries(stats.browsers)
    .sort((a, b) => b[1] - a[1]) // Sort by count in descending order
    .map(([agent, count]) => ({
      name: agent,
      value: count,
    }));
  
  const osChartData = Object.entries(stats.operating_systems)
    .sort((a, b) => b[1] - a[1]) // Sort by count in descending order
    .map(([os, count]) => ({
      name: os,
      value: count,
    }));
  
  const locationChartData = Object.entries(stats.locations)
    .sort((a, b) => b[1] - a[1]) // Sort by count in descending order
    .map(([location, count]) => ({
      name: location,
      value: count,
    }));

  // Custom renderer for pie chart labels to handle long names
  const renderCustomizedLabel = ({ 
    cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, fill 
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    // Shorten browser name if too long
    const displayName = name.length > 15 ? `${name.substring(0, 15)}...` : name;
    
    // Determine text color based on the background brightness
    // For light mode, use dark text color (black)
    const textColor = isDarkMode ? 'white' : 'black';
    
    return (
      <text 
        x={x} 
        y={y} 
        fill={textColor} 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${displayName} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-900">
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-700 shadow-md rounded-lg p-6 mb-8">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">URL Statistics</h1>
        <div className="mb-4">
          <p className="text-gray-700 dark:text-gray-300">
            <span className="font-semibold">Short URL:</span>{' '}
            <a 
              href={`${window.location.origin}/r/${stats.short_code}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
            {`${window.location.origin}/r/${stats.short_code}`}
            </a>
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <span className="font-semibold">Original URL:</span>{' '}
            <a 
              href={stats.original_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              {stats.original_url}
            </a>
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <span className="font-semibold">Total Clicks:</span> {stats.total_clicks}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-gray-700 shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Clicks Over Time</h2>
          {timeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={timeChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="clicks" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-12">No click data available yet</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-700 shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Top Referrers</h2>
          {referrerChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={referrerChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Clicks" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-12">No referrer data available yet</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-700 shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Browsers</h2>
        {browserChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={browserChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={renderCustomizedLabel}
              >
                {browserChartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} clicks`, 'Count']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-12">No browser data available yet</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <div className="bg-white dark:bg-gray-700 shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Operating Systems</h2>
          {osChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={osChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={renderCustomizedLabel}
                >
                  {osChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} clicks`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-12">No operating system data available yet</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-700 shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Visitor Locations</h2>
          {locationChartData.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={locationChartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Clicks" fill="#A259FF" />
                </BarChart>
              </ResponsiveContainer>
              
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                  <thead className="bg-gray-100 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-800 dark:text-gray-200">Country</th>
                      <th className="px-4 py-2 text-left text-gray-800 dark:text-gray-200">Clicks</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-800 dark:text-gray-200">
                    {locationChartData.map((location, index) => {
                      // Extract country code (assuming it's a 2-letter ISO code)
                      const countryCode = location.name.length === 2 ? 
                        location.name.toUpperCase() : 
                        location.name.split(',').pop()?.trim().toUpperCase();
                      
                      return (
                        <tr key={index} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-2 flex items-center gap-2">
                            {countryCode && countryCode.length === 2 && (
                              <ReactCountryFlag
                                countryCode={countryCode}
                                svg
                                style={{
                                  width: '1.5em',
                                  height: '1.5em',
                                }}
                                title={location.name}
                              />
                            )}
                            {location.name}
                          </td>
                          <td className="px-4 py-2">{location.value}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-12">No location data available yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UrlStats;
