export interface Literature {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  id: string;
  organizationId: string;
  literatureId: string;
  quantity: number;
  reservedQuantity: number;
  lastUpdated: string;
  organization?: {
    id: string;
    name: string;
    type: string;
  };
}

export interface LiteratureWithInventory extends Literature {
  inventory: Inventory[];
  totalQuantity: number;
  availableQuantity: number;
}

export interface CreateLiteratureRequest {
  title: string;
  description: string;
  category: string;
  price: number;
}

export interface UpdateLiteratureRequest {
  title?: string;
  description?: string;
  category?: string;
  price?: number;
  isActive?: boolean;
}

export interface LiteratureFilters {
  search?: string;
  category?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface LiteratureResponse {
  literature: LiteratureWithInventory[];
  total: number;
  page: number;
  limit: number;
  categories: string[];
}