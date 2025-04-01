import { FC, useState, useEffect } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { getUrlStats, createShareLink } from '../api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';
import ReactCountryFlag from 'react-country-flag';
import lookup from 'country-code-lookup';
import { useTheme } from '../contexts/ThemeContext';
import {  // @ts-ignore
  ComposableMap, Geographies, Geography, ZoomableGroup, Marker
} from 'react-simple-maps';
// Add type declarations for react-simple-maps
declare module 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
// Add type declarations for d3-scale
declare module 'd3-scale';
// @ts-ignore
import Papa from 'papaparse';
import * as utils from '../utils';

interface UrlStats {
  url_id: number;
  short_code: string;
  original_url: string;
  total_clicks: number;
  referrers: Record<string, number>;
  browsers: Record<string, number>;
  operating_systems: Record<string, number>;
  locations: Record<string, number>; // Format: "City, Country" or just "Country"
  clicks_over_time: Record<string, number>;
}

// Helper function to extract city and country from location string
function parseLocation(location: string): { city: string | null; country: string | null } {
  const parts = location.split(',').map(part => part.trim());
  
  if (parts.length >= 2) {
    // If we have at least city,country format
    return {
      city: parts[0],
      country: parts[parts.length - 1]
    };
  } else if (parts.length === 1) {
    // If we only have one part (likely country)
    return {
      city: null,
      country: parts[0]
    };
  }
  
  return { city: null, country: null };
}

function getLocationCountryName(location: string) {
  return parseLocation(location).country;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF', '#FF5733', '#4BC0C0', 
                '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B', '#6A7FDB', '#9CCC65', '#BA68C8'];

// World map GeoJSON URL - using a more detailed topojson file
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
const citiesGeoUrl = "https://ktt-assets.yetone.vip/worldcities.csv";

type City = {
  name: string;
  lat: number;
  lng: number;
  country: string;
}

async function fetchCitiesData(): Promise<City[]> {
  const content = await fetch(citiesGeoUrl).then(res => res.text());
  
  const res = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
  });
  
  const data = res.data.map((row: any) => {
    return {
      name: row.city,
      lat: parseFloat(row.lat),
      lng: parseFloat(row.lng),
      country: row.country,
    }
  });
  
  return data;
}

const UrlStats: FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [searchParams] = useSearchParams();
  const shareToken = searchParams.get('share_token');
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  // Define useState hooks before conditional returns
  const [currentReferrerPage, setCurrentReferrerPage] = useState(1);
  const [currentLocationPage, setCurrentLocationPage] = useState(1);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  
  const { data: stats, isLoading, isError } = useQuery<UrlStats>(
    ['urlStats', shortCode, shareToken],
    () => getUrlStats(shortCode as string, shareToken || undefined),
    {
      enabled: !!shortCode,
      refetchInterval: shareToken ? false : 30000, // Only refresh when not using share token
    }
  );

  const { data: citiesData } = useQuery<City[]>(
    ['citiesData'],
    () => fetchCitiesData(),
    {
      enabled: !!shortCode,
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
  
  // Constants for pagination
  const referrersPerPage = 5;

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
    
  // Constants for pagination
  const locationsPerPage = 5;

  // Custom renderer for pie chart labels to handle long names
  const renderCustomizedLabel = ({ 
    cx, cy, midAngle, innerRadius, outerRadius, percent, name 
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
      >
        {`${displayName} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {!shareToken && (
        <div className="mb-6">
          <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-900">
            &larr; Back to Dashboard
          </Link>
        </div>
      )}

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
          
          {!shareToken && (
            <div className="mt-4">
              <button 
                onClick={() => setShareModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:border-indigo-900 focus:shadow-outline-indigo transition ease-in-out duration-150"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share Statistics
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Share Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Share Statistics</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Create a shareable link to let others view these statistics without requiring login.
            </p>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={async () => {
                  try {
                    const { share_token } = await createShareLink(shortCode as string);
                    const shareUrl = `${window.location.origin}/stats/${shortCode}?share_token=${share_token}`;
                    
                    utils.copyToClipboard(shareUrl);
                    setCopySuccess('Link copied to clipboard!');
                    setTimeout(() => setCopySuccess(''), 3000);
                  } catch (error) {
                    console.error('Error creating share link:', error);
                    setCopySuccess('Error creating share link');
                    // 显示错误详情以便调试
                    if (error.response) {
                      console.error('Error response:', error.response.data);
                      setCopySuccess(`Error: ${error.response.status} - ${error.response.data.detail || 'Unknown error'}`);
                    } else if (error.request) {
                      console.error('Error request:', error.request);
                      setCopySuccess('Error: No response received from server');
                    } else {
                      console.error('Error message:', error.message);
                      setCopySuccess(`Error: ${error.message}`);
                    }
                  }
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                Generate Shareable Link
              </button>
              
              {copySuccess && (
                <div className="text-green-500 text-center">{copySuccess}</div>
              )}
              
              <button 
                onClick={() => setShareModalOpen(false)} 
                className="mt-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
            <div>
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

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                  <thead className="bg-gray-100 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-800 dark:text-gray-200">Referrer</th>
                      <th className="px-4 py-2 text-left text-gray-800 dark:text-gray-200">Clicks</th>
                      <th className="px-4 py-2 text-left text-gray-800 dark:text-gray-200">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-800 dark:text-gray-200">
                    {referrerChartData
                      .slice(
                        (currentReferrerPage - 1) * referrersPerPage, 
                        currentReferrerPage * referrersPerPage
                      )
                      .map((referrer, index) => {
                        const percentage = ((referrer.value / stats.total_clicks) * 100).toFixed(1);
                        return (
                          <tr key={index} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-2">{referrer.name === '' ? '(Direct)' : referrer.name}</td>
                            <td className="px-4 py-2">{referrer.value}</td>
                            <td className="px-4 py-2">{percentage}%</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                
                {/* Pagination controls */}
                {referrerChartData.length > referrersPerPage && (
                  <div className="flex justify-between items-center mt-4 px-4">
                    <button 
                      onClick={() => setCurrentReferrerPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentReferrerPage === 1}
                      className={`px-3 py-1 rounded ${
                        currentReferrerPage === 1 
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                      }`}
                    >
                      Previous
                    </button>
                    
                    <div className="text-gray-800 dark:text-gray-200">
                      Page {currentReferrerPage} of {Math.ceil(referrerChartData.length / referrersPerPage)}
                    </div>
                    
                    <button 
                      onClick={() => setCurrentReferrerPage(prev => 
                        Math.min(prev + 1, Math.ceil(referrerChartData.length / referrersPerPage))
                      )}
                      disabled={currentReferrerPage === Math.ceil(referrerChartData.length / referrersPerPage)}
                      className={`px-3 py-1 rounded ${
                        currentReferrerPage === Math.ceil(referrerChartData.length / referrersPerPage) 
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-12">No referrer data available yet</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
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
      </div>

      <div className="bg-white dark:bg-gray-700 shadow-md rounded-lg p-6 mt-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Visitor Locations</h2>
        {locationChartData.length > 0 ? (
          <div>
            {/* World Map */}
            <div className="mb-10 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">Global Distribution</h3>
              <div className="h-[400px]">
                <ComposableMap
                  projectionConfig={{
                    scale: 140,
                    center: [0, 0],
                    rotation: [0, 0, 0],
                  }}
                  width={800}
                  height={400}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <ZoomableGroup>
                    <Geographies geography={geoUrl}>
                      {({ geographies }) => 
                        geographies.map((geo) => {
                          // Try to match the geo name or code with our data
                          const countryName = geo.properties.name;
                          
                          // Find all locations that match this country
                          const matchingLocations = locationChartData.filter(
                            location => {
                              const countryName_ = getLocationCountryName(location.name);
                              return countryName_ && countryName_.toUpperCase() === countryName.toUpperCase();
                            }
                          );
                          
                          // Sum the total clicks for this country
                          const totalClicks = matchingLocations.reduce((sum, loc) => sum + loc.value, 0);
                          
                          // Calculate color intensity based on click count
                          const maxValue = Math.max(...locationChartData.map(d => d.value));
                          const colorScale = scaleLinear()
                            .domain([0, maxValue])
                            .range([isDarkMode ? "#1F2937" : "#CFD8DC", "#4338CA"]);
                            
                          const fillColor = totalClicks > 0
                            ? colorScale(totalClicks) 
                            : isDarkMode ? "#2D3748" : "#F5F5F5";
                            
                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill={fillColor}
                              stroke="#D6D6DA"
                              style={{
                                hover: {
                                  fill: "#A5D6A7",
                                  stroke: "#FFF",
                                  strokeWidth: 0.75,
                                  outline: "none",
                                },
                              }}
                            />
                          );
                        })
                      }
                    </Geographies>
                    {/* Add markers for city locations with visitor data */}
                    {locationChartData.map((location, index) => {
                      // Parse the location to get city and country
                      const { city, country } = parseLocation(location.name);
                      let coordinates: [number, number] | null | undefined = null;

                      if (city && country) {
                        const cityData = citiesData?.find(c => c.country === country && c.name === city);
                        coordinates = cityData ? [cityData.lng, cityData.lat] : null;
                      }
                      
                      // Only render markers if we have coordinates
                      if (coordinates) {
                        // Scale the marker size based on click count
                        const maxValue = Math.max(...locationChartData.map(d => d.value));
                        const size = 4 + (location.value / maxValue) * 6; // Size between 4 and 10

                        return (
                          <Marker key={`marker-${index}`} coordinates={coordinates}>
                            {/* 使用SVG marker代替简单的圆圈 */}
                            <g>
                              {/* 底部阴影效果 */}
                              <circle
                                cx={0}
                                cy={0}
                                r={size}
                                fill="rgba(0, 0, 0, 0.3)"
                                opacity={0.6}
                                transform={`translate(1, 1)`}
                              />
                              {/* 主要标记 */}
                              <circle
                                cx={0}
                                cy={0}
                                r={size}
                                fill="#FF5533"
                                stroke="#FFFFFF"
                                strokeWidth={1.5}
                                opacity={0.9}
                              />
                              {/* 添加内圈 */}
                              <circle
                                cx={0}
                                cy={0}
                                r={size * 0.6}
                                fill="#FFFFFF"
                                opacity={0.3}
                              />
                              {/* 添加点击数量 */}
                              <text
                                textAnchor="middle"
                                dominantBaseline="central"
                                style={{
                                  fontFamily: "system-ui",
                                  fontSize: size > 8 ? "8px" : "6px",
                                  fill: "#FFFFFF",
                                  fontWeight: "bold"
                                }}
                              >
                                {location.value}
                              </text>
                            </g>
                            
                            {/* 城市名标签 - 添加背景提高可读性 */}
                            {city && (
                              <>
                                {/* 标签背景 */}
                                <rect
                                  x={-35}
                                  y={-size - 16}
                                  width={70}
                                  height={14}
                                  rx={2}
                                  fill={isDarkMode ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.7)"}
                                  stroke={isDarkMode ? "#555555" : "#DDDDDD"}
                                  strokeWidth={0.5}
                                />
                                {/* 标签文字 */}
                                <text
                                  textAnchor="middle"
                                  y={-size - 8} // Position above the circle
                                  style={{
                                    fontFamily: "system-ui",
                                    fontSize: "8px",
                                    fill: isDarkMode ? "#FFFFFF" : "#333333",
                                    fontWeight: "bold"
                                  }}
                                >
                                  {city}
                                </text>
                              </>
                            )}
                          </Marker>
                        );
                      }
                      return null;
                    })}
                  </ZoomableGroup>
                </ComposableMap>
              </div>
              <div className="flex justify-center items-center mt-4">
                <div className="w-full max-w-md flex items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Low</span>
                  <div className="mx-2 h-2 flex-1 bg-gradient-to-r from-[#CFD8DC] to-[#4338CA] dark:from-[#1F2937] rounded"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">High</span>
                </div>
              </div>
            </div>

            {/* Bar Chart */}
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
                <Bar dataKey="value" name="Clicks">
                  {locationChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
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
                  {locationChartData
                    .slice(
                      (currentLocationPage - 1) * locationsPerPage, 
                      currentLocationPage * locationsPerPage
                    )
                    .map((location, index) => {
                      // Parse location to get city and country
                      const { city, country } = parseLocation(location.name);
                      
                      // Get country code
                      let countryCode: string | undefined;
                      let countryName = country;
                      
                      if (country) {
                        if (country.length === 2) {
                          // If it's a 2-letter ISO code
                          countryCode = country;
                          countryName = lookup.byIso(country)?.country || country;
                        } else {
                          // Try to look up by country name
                          try {
                            countryCode = lookup.byCountry(country)?.iso2;
                          } catch (e) {
                            // Country not found
                          }
                        }
                      }
                      
                      // Format display text
                      const displayLocation = city ? `${city}, ${countryName}` : location.name;
                      
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
                                title={countryName || ""}
                              />
                            )}
                            {displayLocation}
                          </td>
                          <td className="px-4 py-2">{location.value}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              
              {/* Pagination controls */}
              {locationChartData.length > locationsPerPage && (
                <div className="flex justify-between items-center mt-4 px-4">
                  <button 
                    onClick={() => setCurrentLocationPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentLocationPage === 1}
                    className={`px-3 py-1 rounded ${
                      currentLocationPage === 1 
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                    }`}
                  >
                    Previous
                  </button>
                  
                  <div className="text-gray-800 dark:text-gray-200">
                    Page {currentLocationPage} of {Math.ceil(locationChartData.length / locationsPerPage)}
                  </div>
                  
                  <button 
                    onClick={() => setCurrentLocationPage(prev => 
                      Math.min(prev + 1, Math.ceil(locationChartData.length / locationsPerPage))
                    )}
                    disabled={currentLocationPage === Math.ceil(locationChartData.length / locationsPerPage)}
                    className={`px-3 py-1 rounded ${
                      currentLocationPage === Math.ceil(locationChartData.length / locationsPerPage) 
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-12">No location data available yet</p>
        )}
      </div>
    </div>
  );
};

export default UrlStats;
