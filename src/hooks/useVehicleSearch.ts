import { useState, useEffect, useMemo, useCallback } from 'react';
import { VehicleModelsService, VehicleModelData } from '@/services/supabase/VehicleModelsService';

interface UseVehicleSearchResult {
  brands: string[];
  models: VehicleModelData[];
  filteredModels: VehicleModelData[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedBrand: string | null;
  setSelectedBrand: (brand: string | null) => void;
  selectedYear: number | null;
  setSelectedYear: (year: number | null) => void;
  clearFilters: () => void;
  recentSearches: string[];
  addRecentSearch: (search: string) => void;
  clearRecentSearches: () => void;
}

const RECENT_SEARCHES_KEY = 'vehicle-recent-searches';
const MAX_RECENT_SEARCHES = 5;

export function useVehicleSearch(): UseVehicleSearchResult {
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<VehicleModelData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Ignore errors
    }
  }, []);

  // Load brands and models in single optimized query
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Single query to fetch all models
        const allModels = await VehicleModelsService.getAllModels();
        setModels(allModels);
        
        // Extract unique brands from models
        const uniqueBrands = [...new Set(allModels.map(m => m.brand))].sort();
        setBrands(uniqueBrands);
      } catch (err) {
        console.error('Error loading vehicle data:', err);
        setError('Erro ao carregar veículos');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);

  // Filter models based on search and filters
  const filteredModels = useMemo(() => {
    let result = [...models];
    
    // Filter by brand
    if (selectedBrand) {
      result = result.filter(m => 
        m.brand.toLowerCase() === selectedBrand.toLowerCase()
      );
    }
    
    // Filter by year
    if (selectedYear) {
      result = result.filter(m => {
        const years = VehicleModelsService.parseYearsRange(m.years_available);
        return years.includes(selectedYear);
      });
    }
    
    // Filter by search query (fuzzy)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(m => {
        const brandMatch = m.brand.toLowerCase().includes(query);
        const modelMatch = m.model_name.toLowerCase().includes(query);
        const yearMatch = m.years_available.includes(query);
        const codeMatch = m.model_code?.toLowerCase().includes(query);
        return brandMatch || modelMatch || yearMatch || codeMatch;
      });
    }
    
    // Sort: premium brands first, then alphabetically
    result.sort((a, b) => {
      const premiumBrands = ['bmw', 'mercedes-benz', 'audi', 'volvo', 'land rover', 'porsche'];
      const aIsPremium = premiumBrands.includes(a.brand.toLowerCase());
      const bIsPremium = premiumBrands.includes(b.brand.toLowerCase());
      
      if (aIsPremium && !bIsPremium) return -1;
      if (!aIsPremium && bIsPremium) return 1;
      
      // Then by brand
      const brandCompare = a.brand.localeCompare(b.brand);
      if (brandCompare !== 0) return brandCompare;
      
      // Then by model
      return a.model_name.localeCompare(b.model_name);
    });
    
    return result;
  }, [models, selectedBrand, selectedYear, searchQuery]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedBrand(null);
    setSelectedYear(null);
  }, []);

  const addRecentSearch = useCallback((search: string) => {
    if (!search.trim()) return;
    
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== search);
      const updated = [search, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // Ignore errors
      }
      
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Ignore errors
    }
  }, []);

  return {
    brands,
    models,
    filteredModels,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedBrand,
    setSelectedBrand,
    selectedYear,
    setSelectedYear,
    clearFilters,
    recentSearches,
    addRecentSearch,
    clearRecentSearches
  };
}
