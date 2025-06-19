"use client";

import { ArrowRight, Building2, DollarSign, Search, Shield, TrendingUp, Users } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

interface SearchResult {
  id: string;
  serviceName: string;
  description: string;
  cashPrice: number;
  negotiatedRates: {
    payerName: string;
    rate: number;
  }[];
  hospital: string;
  location: string;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setHasSearched(true);
    
    // Simulate API call with mock data
    setTimeout(() => {
      const mockResults: SearchResult[] = [
        {
          id: "1",
          serviceName: "MRI Brain without Contrast",
          description: "Magnetic resonance imaging of the brain without contrast material",
          cashPrice: 850,
          negotiatedRates: [
            { payerName: "Blue Cross Blue Shield", rate: 650 },
            { payerName: "Aetna", rate: 720 },
            { payerName: "Cigna", rate: 680 },
            { payerName: "UnitedHealth", rate: 700 }
          ],
          hospital: "Memorial Hospital",
          location: "New York, NY"
        },
        {
          id: "2",
          serviceName: "CT Scan Chest",
          description: "Computed tomography scan of the chest",
          cashPrice: 1200,
          negotiatedRates: [
            { payerName: "Blue Cross Blue Shield", rate: 950 },
            { payerName: "Aetna", rate: 1100 },
            { payerName: "Cigna", rate: 980 },
            { payerName: "UnitedHealth", rate: 1050 }
          ],
          hospital: "City Medical Center",
          location: "Los Angeles, CA"
        },
        {
          id: "3",
          serviceName: "Echocardiogram",
          description: "Ultrasound examination of the heart",
          cashPrice: 650,
          negotiatedRates: [
            { payerName: "Blue Cross Blue Shield", rate: 480 },
            { payerName: "Aetna", rate: 520 },
            { payerName: "Cigna", rate: 490 },
            { payerName: "UnitedHealth", rate: 510 }
          ],
          hospital: "Regional Heart Institute",
          location: "Chicago, IL"
        }
      ];
      
      setSearchResults(mockResults);
      setIsSearching(false);
    }, 1500);
  }, [searchQuery]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);

  const statsData = useMemo(() => [
    { value: "$2.5M+", label: "Total Savings", color: "text-blue-600" },
    { value: "50K+", label: "Procedures", color: "text-red-600" },
    { value: "1.2K+", label: "Hospitals", color: "text-blue-600" },
    { value: "95%", label: "Accuracy", color: "text-red-600" }
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50">
      {/* Simplified Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/90 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
                HealthSaver
              </span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">About</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">How It Works</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-20">
          {/* Simplified Main Heading */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-black mb-4 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                HEALTHCARE
              </span>
              <br />
              <span className="bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
                PRICE
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
                TRANSPARENCY
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto mb-12 font-light leading-relaxed">
            Discover real healthcare costs and 
            <span className="font-bold text-blue-600"> save money </span>
            on medical procedures. 
            <br />
            Compare prices across hospitals and insurance providers in 
            <span className="font-bold text-red-600"> seconds</span>.
          </p>
          
          {/* Search Section */}
          <div className="max-w-3xl mx-auto mb-16">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                  <input
                    type="text"
                    placeholder="Search for medical procedures, services, or hospitals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-16 pr-6 py-6 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-lg font-medium shadow-sm"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-12 py-6 bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 text-lg shadow-lg hover:shadow-xl"
                >
                  {isSearching ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-6 h-6" />
                      Search Now
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {statsData.map((stat, index) => (
              <div key={index} className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-shadow">
                <div className={`text-3xl font-black ${stat.color} mb-2`}>{stat.value}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Results Section */}
        {hasSearched && (
          <div className="mt-20">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-4xl font-black text-gray-900">
                Search Results
                {searchResults.length > 0 && (
                  <span className="text-gray-500 font-normal ml-3 text-2xl">
                    ({searchResults.length} procedures found)
                  </span>
                )}
              </h2>
              {searchResults.length > 0 && (
                <div className="text-gray-500 text-lg font-medium">
                  Prices updated as of {new Date().toLocaleDateString()}
                </div>
              )}
            </div>

            {isSearching ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <p className="text-xl text-gray-600 font-medium">Searching for healthcare prices...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-20">
                <Building2 className="w-24 h-24 text-gray-400 mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-gray-900 mb-4">No results found</h3>
                <p className="text-xl text-gray-600">Try searching for a different procedure or service</p>
              </div>
            ) : (
              <div className="space-y-8">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="bg-white/90 backdrop-blur-md border border-gray-200/50 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-8">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-6">
                          <div>
                            <h3 className="text-3xl font-bold text-gray-900 mb-3">
                              {result.serviceName}
                            </h3>
                            <p className="text-lg text-gray-600 mb-4 leading-relaxed">{result.description}</p>
                            <div className="flex items-center gap-6 text-gray-500">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-5 h-5" />
                                <span className="font-medium">{result.hospital}</span>
                              </div>
                              <div className="font-medium">{result.location}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="xl:w-96">
                        <div className="bg-gradient-to-br from-blue-50 to-red-50 rounded-2xl p-6 border border-blue-200/50">
                          <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <DollarSign className="w-7 h-7 text-green-600" />
                            Pricing Information
                          </h4>
                          
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-lg text-gray-700 font-medium">Cash Price:</span>
                              <span className="text-3xl font-black text-green-600">
                                ${result.cashPrice.toLocaleString()}
                              </span>
                            </div>
                            
                            <div className="border-t-2 border-gray-200 pt-4">
                              <div className="text-lg text-gray-700 font-bold mb-3">Negotiated Rates:</div>
                              {result.negotiatedRates.map((rate, index) => (
                                <div key={index} className="flex justify-between items-center mb-3">
                                  <span className="text-gray-600 font-medium">{rate.payerName}:</span>
                                  <span className="text-lg font-bold text-blue-600">
                                    ${rate.rate.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                            
                            <div className="border-t-2 border-gray-200 pt-4">
                              <div className="text-sm text-gray-500 font-medium">
                                Potential savings: <span className="text-green-600 font-bold">${(result.cashPrice - Math.min(...result.negotiatedRates.map(r => r.rate))).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Enhanced Features Section */}
        {!hasSearched && (
          <div className="mt-32">
            <h2 className="text-5xl font-black text-gray-900 text-center mb-16">
              Why Choose <span className="bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">HealthSaver</span>?
            </h2>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center p-8 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 transform hover:scale-105 transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <TrendingUp className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Save Money</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Compare prices across multiple providers and insurance plans to find the best rates.
                </p>
              </div>
              <div className="text-center p-8 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 transform hover:scale-105 transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Transparent Pricing</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Access real pricing data from hospitals and healthcare providers nationwide.
                </p>
              </div>
              <div className="text-center p-8 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 transform hover:scale-105 transition-all duration-300">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Easy to Use</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Simple search interface to quickly find and compare healthcare costs.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Enhanced Footer */}
      <footer className="relative z-10 bg-white/80 backdrop-blur-md border-t border-gray-200/50 mt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p className="text-gray-600 text-lg font-medium">
              &copy; 2024 HealthSaver. Empowering healthcare price transparency.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

