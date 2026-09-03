import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DriverProfile, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminCreateDriverInput } from './dto/admin-create-driver.input';
import { UpdateDriverProfileInput } from './dto/update-driver-profile.input';

const driverInclude = { user: true } as const;

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureProfile(userId: string): Promise<DriverProfile> {
    const existing = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      return existing;
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== UserRole.DRIVER) {
      throw new BadRequestException(
        'Only a user with the DRIVER role can have a driver profile',
      );
    }

    return this.prisma.driverProfile.create({
      data: { userId },
    });
  }

  findAll(): Promise<DriverProfile[]> {
    return this.prisma.driverProfile.findMany({
      include: driverInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  findAvailable(): Promise<DriverProfile[]> {
    return this.prisma.driverProfile.findMany({
      where: { isAvailable: true },
      include: driverInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<DriverProfile> {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { id },
      include: driverInclude,
    });

    if (!profile) {
      throw new NotFoundException(`Driver profile ${id} not found`);
    }

    return profile;
  }

  async myProfile(userId: string): Promise<DriverProfile> {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
      include: driverInclude,
    });

    if (!profile) {
      throw new NotFoundException('Driver profile not found for this user');
    }

    return profile;
  }

  async updateProfile(
    userId: string,
    data: UpdateDriverProfileInput,
  ): Promise<DriverProfile> {
    const profile = await this.ensureProfile(userId);

    return this.prisma.driverProfile.update({
      where: { id: profile.id },
      data,
      include: driverInclude,
    });
  }

  async setAvailability(
    currentUser: CurrentUser,
    isAvailable: boolean,
  ): Promise<DriverProfile> {
    const profile = await this.ensureProfile(currentUser.id);

    return this.prisma.driverProfile.update({
      where: { id: profile.id },
      data: { isAvailable },
      include: driverInclude,
    });
  }

  async createProfileForUser(
    userId: string,
    vehicleType?: string,
    vehiclePlate?: string,
  ): Promise<DriverProfile> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    if (user.role !== UserRole.DRIVER) {
      throw new BadRequestException(
        'Only a user with the DRIVER role can have a driver profile',
      );
    }

    const existing = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new BadRequestException('This user already has a driver profile');
    }

    return this.prisma.driverProfile.create({
      data: { userId, vehicleType, vehiclePlate },
      include: driverInclude,
    });
  }

  async adminCreateDriver(input: AdminCreateDriverInput): Promise<DriverProfile> {
    const normalizedPhone = input.phone.trim().replace(/\s+/g, '');
    const existing = await this.prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });
    if (existing) {
      throw new BadRequestException('Un compte existe déjà avec ce numéro.');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          phone: normalizedPhone,
          password: hashedPassword,
          role: UserRole.DRIVER,
          phoneVerified: true,
        },
      });

      return tx.driverProfile.create({
        data: {
          userId: user.id,
          vehicleType: input.vehicleType ?? 'MOTO',
          vehiclePlate: input.vehiclePlate,
          isAvailable: input.isAvailable ?? false,
        },
        include: driverInclude,
      });
    });
  }

  async adminSetAvailability(
    driverId: string,
    isAvailable: boolean,
  ): Promise<DriverProfile> {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { id: driverId },
    });
    if (!profile) {
      throw new NotFoundException(`Driver profile ${driverId} not found`);
    }

    return this.prisma.driverProfile.update({
      where: { id: driverId },
      data: { isAvailable },
      include: driverInclude,
    });
  }
}
