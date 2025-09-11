import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Pagination,
  Alert,
  CircularProgress,
  Fab,
  useTheme,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useLiterature } from '@/hooks/useLiterature';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, LiteratureFilters } from '@/types';
import { AnimatedContainer } from '@/components/ui';
import { LiteratureItem } from './LiteratureItem';
import { LiteratureFilters as FiltersComponent } from './LiteratureFilters';
import { LiteratureForm } from './LiteratureForm';

interface LiteratureCatalogProps {
  onItemSelect?: (literatureId: string) => void;
  selectable?: boolean;
}

export const LiteratureCatalog: React.FC<LiteratureCatalogProps> = ({
  onItemSelect,
  selectable = false,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    literature,
    total,
    page,
    limit,
    filters,
    categories,
    loading,
    error,
    updateFilters,
    updatePage,
    refetch,
  } = useLiterature();

  const canManageLiterature = user?.role === UserRole.ADMIN || user?.role === UserRole.REGION;

  const handleFiltersChange = (newFilters: LiteratureFilters) => {
    updateFilters(newFilters);
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, newPage: number) => {
    updatePage(newPage);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingId(null);
    refetch();
  };

  const totalPages = Math.ceil(total / limit);

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <AnimatedContainer animation="slideDown" delay={100}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight={600} color="text.primary">
            Каталог литературы
          </Typography>
          {canManageLiterature && (
            <Fab
              color="primary"
              onClick={handleAddNew}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                },
              }}
            >
              <Add />
            </Fab>
          )}
        </Box>
      </AnimatedContainer>

      <AnimatedContainer animation="slideUp" delay={200}>
        <FiltersComponent
          filters={filters || {}}
          categories={categories}
          onFiltersChange={handleFiltersChange}
        />
      </AnimatedContainer>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <AnimatedContainer animation="slideUp" delay={300}>
            <Grid container spacing={3}>
              {literature.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                  <AnimatedContainer animation="slideUp" delay={400 + index * 50}>
                    <LiteratureItem
                      literature={item}
                      onEdit={canManageLiterature ? handleEdit : undefined}
                      onSelect={selectable ? onItemSelect : undefined}
                      selectable={selectable}
                    />
                  </AnimatedContainer>
                </Grid>
              ))}
            </Grid>
          </AnimatedContainer>

          {literature.length === 0 && (
            <AnimatedContainer animation="slideUp" delay={400}>
              <Box textAlign="center" py={8}>
                <Typography variant="h6" color="text.secondary" mb={2}>
                  Литература не найдена
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Попробуйте изменить параметры поиска
                </Typography>
              </Box>
            </AnimatedContainer>
          )}

          {totalPages > 1 && (
            <AnimatedContainer animation="slideUp" delay={500}>
              <Box display="flex" justifyContent="center" mt={4}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                />
              </Box>
            </AnimatedContainer>
          )}
        </>
      )}

      {/* Форма добавления/редактирования */}
      {showForm && (
        <LiteratureForm
          open={showForm}
          literatureId={editingId}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </Box>
  );
};