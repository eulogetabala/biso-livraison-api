import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Parcel, ParcelStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateParcelInput } from './dto/create-parcel.input';
import { PaginationArgs } from '../../common/dto/pagination.args';
import { paginate, PaginatedResult } from '../../common/utils/pagination.util';

const parcelInclude = { sender: true } as const;

const ALLOWED_TRANSITIONS: Record<ParcelStatus, ParcelStatus[]> = {
  [ParcelStatus.PENDING]: [ParcelStatus.PICKED_UP, ParcelStatus.CANCELLED],
  [ParcelStatus.PICKED_UP]: [ParcelStatus.IN_TRANSIT],
  [ParcelStatus.IN_TRANSIT]: [ParcelStatus.DELIVERED],
  [ParcelStatus.DELIVERED]: [],
  [ParcelStatus.CANCELLED]: [],
};

@Injectable()
export class ParcelsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateParcelInput, senderId: string): Promise<Parcel> {
    return this.prisma.parcel.create({
      data: {
        ...data,
        weight: data.weight ?? 0,
        senderId,
      },
      include: parcelInclude,
    });
  }

  findAll(pagination: PaginationArgs): Promise<PaginatedResult<Parcel>> {
    return paginate(
      (args) =>
        this.prisma.parcel.findMany({
          include: parcelInclude,
          orderBy: { createdAt: 'desc' },
          skip: args.skip,
          take: args.take,
        }),
      () => this.prisma.parcel.count(),
      pagination,
    );
  }

  myParcels(
    senderId: string,
    pagination: PaginationArgs,
  ): Promise<PaginatedResult<Parcel>> {
    const where = { senderId };

    return paginate(
      (args) =>
        this.prisma.parcel.findMany({
          where,
          include: parcelInclude,
          orderBy: { createdAt: 'desc' },
          skip: args.skip,
          take: args.take,
        }),
      () => this.prisma.parcel.count({ where }),
      pagination,
    );
  }

  async findOne(id: string, currentUser: CurrentUser): Promise<Parcel> {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id },
      include: parcelInclude,
    });

    if (!parcel) {
      throw new NotFoundException(`Parcel ${id} not found`);
    }

    const canView =
      parcel.senderId === currentUser.id ||
      currentUser.role === UserRole.ADMIN ||
      currentUser.role === UserRole.PARTNER ||
      currentUser.role === UserRole.DRIVER;

    if (!canView) {
      throw new ForbiddenException('You cannot view this parcel');
    }

    return parcel;
  }

  async updateStatus(
    id: string,
    status: ParcelStatus,
    currentUser: CurrentUser,
  ): Promise<Parcel> {
    const parcel = await this.prisma.parcel.findUnique({ where: { id } });

    if (!parcel) {
      throw new NotFoundException(`Parcel ${id} not found`);
    }

    if (
      parcel.senderId !== currentUser.id &&
      currentUser.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('You cannot update this parcel');
    }

    const allowed = ALLOWED_TRANSITIONS[parcel.status];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition parcel from ${parcel.status} to ${status}`,
      );
    }

    return this.prisma.parcel.update({
      where: { id },
      data: {
        status,
        deliveredAt: status === ParcelStatus.DELIVERED ? new Date() : undefined,
      },
      include: parcelInclude,
    });
  }

  remove(id: string, currentUser: CurrentUser): Promise<Parcel> {
    return this.prisma.parcel.findUnique({ where: { id } }).then((parcel) => {
      if (!parcel) {
        throw new NotFoundException(`Parcel ${id} not found`);
      }
      if (
        parcel.senderId !== currentUser.id &&
        currentUser.role !== UserRole.ADMIN
      ) {
        throw new ForbiddenException('You cannot delete this parcel');
      }
      return this.prisma.parcel.delete({ where: { id } });
    });
  }
}
