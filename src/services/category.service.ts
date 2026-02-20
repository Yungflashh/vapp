import api, { handleApiError } from './api.config';

// ============================================================
// CATEGORY INTERFACES
// ============================================================

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  parent?: string | null;
  level: number;
  order: number;
  productCount: number;
  isActive: boolean;
  subcategories?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoriesResponse {
  success: boolean;
  message?: string;
  data: {
    categories: Category[];
  };
}

export interface SingleCategoryResponse {
  success: boolean;
  message?: string;
  data: {
    category: Category;
    subcategories: Category[];
  };
}

// ============================================================
// CATEGORY API FUNCTIONS
// ============================================================

/**
 * Get all categories (flat list)
 */
export const getCategories = async (parent?: string | null): Promise<CategoriesResponse> => {
  try {
    console.log('📂 Fetching categories...');
    
    let url = '/categories';
    if (parent !== undefined) {
      url += `?parent=${parent === null ? 'null' : parent}`;
    }
    
    const response = await api.get<CategoriesResponse>(url);
    
    console.log('✅ Categories fetched:', response.data.data.categories.length);
    
    return response.data;
  } catch (error) {
    console.error('❌ Get categories error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get category tree (hierarchical with subcategories)
 */
export const getCategoryTree = async (): Promise<CategoriesResponse> => {
  try {
    console.log('🌳 Fetching category tree...');
    
    const response = await api.get<CategoriesResponse>('/categories/tree');
    
    console.log('✅ Category tree fetched:', response.data.data.categories.length);
    
    return response.data;
  } catch (error) {
    console.error('❌ Get category tree error:', error);
    handleApiError(error);
    throw error;
  }
};

/**
 * Get single category by slug
 */
export const getCategoryBySlug = async (slug: string): Promise<SingleCategoryResponse> => {
  try {
    console.log('📂 Fetching category:', slug);
    
    const response = await api.get<SingleCategoryResponse>(`/categories/${slug}`);
    
    console.log('✅ Category fetched:', response.data.data.category.name);
    
    return response.data;
  } catch (error) {
    console.error('❌ Get category error:', error);
    handleApiError(error);
    throw error;
  }
};
