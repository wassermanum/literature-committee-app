import axios from 'axios';
import {
  Literature,
  LiteratureWithInventory,
  CreateLiteratureRequest,
  UpdateLiteratureRequest,
  LiteratureFilters,
  LiteratureResponse,
  Inventory,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

class LiteratureService {
  private baseURL = `${API_BASE_URL}/api/literature`;

  async getLiterature(
    page = 1,
    limit = 20,
    filters?: LiteratureFilters
  ): Promise<LiteratureResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await axios.get(`${this.baseURL}?${params}`);
    return response.data;
  }

  async getLiteratureById(id: string): Promise<LiteratureWithInventory> {
    const response = await axios.get(`${this.baseURL}/${id}`);
    return response.data;
  }

  async createLiterature(data: CreateLiteratureRequest): Promise<Literature> {
    const response = await axios.post(this.baseURL, data);
    return response.data;
  }

  async updateLiterature(
    id: string,
    data: UpdateLiteratureRequest
  ): Promise<Literature> {
    const response = await axios.put(`${this.baseURL}/${id}`, data);
    return response.data;
  }

  async deleteLiterature(id: string): Promise<void> {
    await axios.delete(`${this.baseURL}/${id}`);
  }

  async getLiteratureInventory(id: string): Promise<Inventory[]> {
    const response = await axios.get(`${this.baseURL}/${id}/inventory`);
    return response.data;
  }

  async getCategories(): Promise<string[]> {
    const response = await axios.get(`${this.baseURL}/categories`);
    return response.data;
  }
}

export const literatureService = new LiteratureService();