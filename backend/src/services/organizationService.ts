import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateOrganizationData {
  name: string;
  type: string;
  parentId?: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
}

export interface UpdateOrganizationData {
  name?: string;
  type?: string;
  parentId?: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export class OrganizationService {
  async getAllOrganizations() {
    return await prisma.organization.findMany({
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        _count: {
          select: {
            users: true,
            children: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getOrganizationById(id: string) {
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            users: true,
            children: true,
            inventory: true,
          },
        },
      },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    return organization;
  }

  async createOrganization(organizationData: CreateOrganizationData) {
    // Валидируем тип организации
    const validTypes = ['GROUP', 'LOCAL_SUBCOMMITTEE', 'LOCALITY', 'REGION'];
    if (!validTypes.includes(organizationData.type)) {
      throw new Error('Invalid organization type');
    }

    // Если указан родитель, проверяем его существование и валидность иерархии
    if (organizationData.parentId) {
      const parent = await prisma.organization.findUnique({
        where: { id: organizationData.parentId },
      });

      if (!parent) {
        throw new Error('Parent organization not found');
      }

      // Проверяем корректность иерархии
      const isValidHierarchy = this.validateOrganizationHierarchy(
        organizationData.type,
        parent.type
      );

      if (!isValidHierarchy) {
        throw new Error('Invalid organization hierarchy');
      }
    }

    return await prisma.organization.create({
      data: {
        name: organizationData.name,
        type: organizationData.type as any,
        address: organizationData.address,
        contactPerson: organizationData.contactPerson,
        phone: organizationData.phone,
        email: organizationData.email,
        ...(organizationData.parentId && { parent: { connect: { id: organizationData.parentId } } }),
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });
  }

  async updateOrganization(id: string, organizationData: UpdateOrganizationData) {
    // Проверяем, что организация существует
    const existingOrganization = await prisma.organization.findUnique({
      where: { id },
    });

    if (!existingOrganization) {
      throw new Error('Organization not found');
    }

    // Валидируем тип организации, если он обновляется
    if (organizationData.type) {
      const validTypes = ['GROUP', 'LOCAL_SUBCOMMITTEE', 'LOCALITY', 'REGION'];
      if (!validTypes.includes(organizationData.type)) {
        throw new Error('Invalid organization type');
      }
    }

    // Если обновляется родитель, проверяем валидность иерархии
    if (organizationData.parentId !== undefined) {
      if (organizationData.parentId) {
        const parent = await prisma.organization.findUnique({
          where: { id: organizationData.parentId },
        });

        if (!parent) {
          throw new Error('Parent organization not found');
        }

        // Проверяем, что организация не становится родителем самой себе
        if (organizationData.parentId === id) {
          throw new Error('Organization cannot be parent of itself');
        }

        // Проверяем корректность иерархии
        const orgType = organizationData.type || existingOrganization.type;
        const isValidHierarchy = this.validateOrganizationHierarchy(orgType, parent.type);

        if (!isValidHierarchy) {
          throw new Error('Invalid organization hierarchy');
        }
      }
    }

    return await prisma.organization.update({
      where: { id },
      data: {
        ...(organizationData.name && { name: organizationData.name }),
        ...(organizationData.type && { type: organizationData.type as any }),
        ...(organizationData.address && { address: organizationData.address }),
        ...(organizationData.contactPerson && { contactPerson: organizationData.contactPerson }),
        ...(organizationData.phone && { phone: organizationData.phone }),
        ...(organizationData.email && { email: organizationData.email }),
        ...(organizationData.parentId && { parent: { connect: { id: organizationData.parentId } } }),
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });
  }

  async deleteOrganization(id: string) {
    // Проверяем, что организация существует
    const existingOrganization = await prisma.organization.findUnique({
      where: { id },
      include: {
        users: true,
        children: true,
      },
    });

    if (!existingOrganization) {
      throw new Error('Organization not found');
    }

    // Проверяем, что у организации нет активных пользователей
    const activeUsers = existingOrganization.users.filter(user => user.isActive);
    if (activeUsers.length > 0) {
      throw new Error('Cannot delete organization with active users');
    }

    // Проверяем, что у организации нет дочерних организаций
    if (existingOrganization.children.length > 0) {
      throw new Error('Cannot delete organization with child organizations');
    }

    // Вместо физического удаления, деактивируем организацию
    await prisma.organization.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Organization deactivated successfully' };
  }

  async getOrganizationHierarchy(id: string) {
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        parent: {
          include: {
            parent: {
              include: {
                parent: true,
              },
            },
          },
        },
        children: {
          include: {
            children: {
              include: {
                children: true,
              },
            },
          },
        },
      },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    return organization;
  }

  async getOrganizationsByType(type: string) {
    const validTypes = ['GROUP', 'LOCAL_SUBCOMMITTEE', 'LOCALITY', 'REGION'];
    if (!validTypes.includes(type)) {
      throw new Error('Invalid organization type');
    }

    return await prisma.organization.findMany({
      where: {
        type: type as any,
        isActive: true,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        _count: {
          select: {
            users: true,
            children: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getChildOrganizations(parentId: string) {
    return await prisma.organization.findMany({
      where: {
        parentId,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            users: true,
            children: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  private validateOrganizationHierarchy(childType: string, parentType: string): boolean {
    // Правила иерархии:
    // REGION может быть родителем для LOCALITY
    // LOCALITY может быть родителем для GROUP и LOCAL_SUBCOMMITTEE
    // GROUP и LOCAL_SUBCOMMITTEE не могут иметь детей

    const hierarchyRules: Record<string, string[]> = {
      REGION: ['LOCALITY'],
      LOCALITY: ['GROUP', 'LOCAL_SUBCOMMITTEE'],
      GROUP: [],
      LOCAL_SUBCOMMITTEE: [],
    };

    return hierarchyRules[parentType]?.includes(childType) || false;
  }
}