import { useState, useEffect, useCallback } from 'react';
import {
  Literature,
  LiteratureWithInventory,
  CreateLiteratureRequest,
  UpdateLiteratureRequest,
  LiteratureFilters,
  LiteratureResponse,
} from '@/types';
import { literatureService } from '@/services';

export const useLiterature = (
  initialPage = 1,
  initialLimit = 20,
  initialFilters?: LiteratureFilters
) => {
  const [literature, setLiterature] = useState<LiteratureWithInventory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [filters, setFilters] = useState<LiteratureFilters | undefined>(initialFilters);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLiterature = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await literatureService.getLiterature(page, limit, filters);
      setLiterature(response.literature);
      setTotal(response.total);
      setCategories(response.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки каталога');
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  const createLiterature = async (data: CreateLiteratureRequest): Promise<Literature> => {
    try {
      setError(null);
      const newLiterature = await literatureService.createLiterature(data);
      await fetchLiterature(); // Обновляем список
      return newLiterature;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка создания литературы';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateLiterature = async (
    id: string,
    data: UpdateLiteratureRequest
  ): Promise<Literature> => {
    try {
      setError(null);
      const updatedLiterature = await literatureService.updateLiterature(id, data);
      await fetchLiterature(); // Обновляем список
      return updatedLiterature;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления литературы';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteLiterature = async (id: string): Promise<void> => {
    try {
      setError(null);
      await literatureService.deleteLiterature(id);
      await fetchLiterature(); // Обновляем список
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка удаления литературы';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateFilters = (newFilters: LiteratureFilters) => {
    setFilters(newFilters);
    setPage(1); // Сбрасываем на первую страницу при изменении фильтров
  };

  const updatePage = (newPage: number) => {
    setPage(newPage);
  };

  const updateLimit = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Сбрасываем на первую страницу при изменении лимита
  };

  useEffect(() => {
    fetchLiterature();
  }, [fetchLiterature]);

  return {
    literature,
    total,
    page,
    limit,
    filters,
    categories,
    loading,
    error,
    createLiterature,
    updateLiterature,
    deleteLiterature,
    updateFilters,
    updatePage,
    updateLimit,
    refetch: fetchLiterature,
  };
};

export const useLiteratureItem = (id: string) => {
  const [literature, setLiterature] = useState<LiteratureWithInventory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLiterature = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await literatureService.getLiteratureById(id);
      setLiterature(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки литературы');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLiterature();
  }, [fetchLiterature]);

  return {
    literature,
    loading,
    error,
    refetch: fetchLiterature,
  };
};