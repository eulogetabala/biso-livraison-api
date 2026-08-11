import { Injectable, NotFoundException } from '@nestjs/common';
import { DriverLocation } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateDriverLocationInput } from './dto/update-driver-location.input';

@Injectable()
export class GeoService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertLocation(
    driverId: string,
    input: UpdateDriverLocationInput,
  ): Promise<DriverLocation> {
    return this.prisma.driverLocation.upsert({
      where: { driverId },
      update: {
        latitude: input.latitude,
        longitude: input.longitude,
        deliveryId: input.deliveryId ?? null,
      },
      create: {
        driverId,
        latitude: input.latitude,
        longitude: input.longitude,
        deliveryId: input.deliveryId,
      },
    });
  }

  async getLocation(driverId: string): Promise<DriverLocation> {
    const location = await this.prisma.driverLocation.findUnique({
      where: { driverId },
    });

    if (!location) {
      throw new NotFoundException(
        `No location recorded for driver ${driverId}`,
      );
    }

    return location;
  }

  getAllLocations(): Promise<DriverLocation[]> {
    return this.prisma.driverLocation.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }
}
